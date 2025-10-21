import { NextResponse, NextRequest } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import crypto from 'crypto';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';

export const dynamic = 'force-dynamic';

const parentApprovalSignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  birthdate: z.string().min(1, 'Birthdate is required'),
  approvalToken: z.string().min(1, 'Approval token is required'),
});

/**
 * POST /api/parent-approval/signup
 * 
 * Handles parent account creation during the approval flow
 * This creates the parent account and links it to the pending child signup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parentApprovalSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { firstName, lastName, email, password, birthdate, approvalToken } = parsed.data;

    console.log(`[PARENT-APPROVAL-SIGNUP] Processing parent signup for: ${email}`);

    // Get the parent approval record
    const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
      approvalToken,
    });

    if (!approval) {
      return NextResponse.json({ 
        error: 'Invalid or expired approval token' 
      }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This approval has already been processed' 
      }, { status: 400 });
    }

    // Verify the email matches the approval
    if (approval.parentEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return NextResponse.json({ 
        error: 'Email does not match the approval request' 
      }, { status: 400 });
    }

    // Check if parent already exists
    const existingUser = await convexHttp.query(api.users.getUserByEmail, {
      email: email.toLowerCase().trim(),
    });

    let parentUser: any;

    if (existingUser) {
      // User already exists - check if they're an Adult and upgrade to Parent
      const existingAccount = await convexHttp.query(api.accounts.getAccountByUserId, {
        userId: existingUser._id,
      });

      if (existingAccount?.role === 'Adult') {
        console.log(`[PARENT-APPROVAL-SIGNUP] Existing Adult found, upgrading to Parent: ${email}`);
        
        // Upgrade the existing Adult to Parent role
        parentUser = existingUser._id;
        
        await convexHttp.mutation(api.accounts.updateAccount, {
          userId: parentUser,
          updates: {
            role: 'Parent',
          },
        });

        console.log(`[PARENT-APPROVAL-SIGNUP] Successfully upgraded Adult to Parent: ${email}`);
      } else if (existingAccount?.role === 'Parent') {
        // Already a parent - just use their ID
        console.log(`[PARENT-APPROVAL-SIGNUP] Existing Parent found: ${email}`);
        parentUser = existingUser._id;
      } else {
        // Some other role - reject
        return NextResponse.json({ 
          error: 'An account with this email already exists with an incompatible role' 
        }, { status: 400 });
      }
    } else {
      // New user - create parent account
      console.log(`[PARENT-APPROVAL-SIGNUP] Creating new Parent account: ${email}`);
      
      // Hash the password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create the parent user
      parentUser = await convexHttp.mutation(api.users.createUserWithAccount, {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        birthdate: new Date(birthdate).getTime(),
        role: 'Parent',
        isApproved: true,
        plan: undefined, // No plan set yet - will be selected during plan selection
        isVerified: true, // Skip email verification for parent approval flow
        firstName: firstName,
        lastName: lastName,
      });

      console.log(`[PARENT-APPROVAL-SIGNUP] Successfully created new parent account`);
    }

    // Set setup stage to 'started' - parent has account but no plan yet
    await convexHttp.mutation(api.accounts.updateAccount, {
      userId: parentUser,
      updates: {
        setupStage: 'started',
      },
    });

    console.log(`[PARENT-APPROVAL-SIGNUP] Set setup stage to 'started'`);

    // Mark the approval as approved so the router can advance to plan selection
    await convexHttp.mutation(api.parentApprovals.updateParentApprovalStatus, {
      approvalToken,
      status: 'approved',
    });

    console.log(`[PARENT-APPROVAL-SIGNUP] Updated approval ${approval._id} status to 'approved' after parent signup`);

    // Create a session for the parent
    const now = Date.now();
    const timeoutMins = Number(process.env.SESSION_TIMEOUT_MINUTES || 180);
    
    // Create response first
    const response = NextResponse.json({
      success: true,
      message: 'Parent account created successfully',
      user: {
        id: parentUser,
        email: email,
        role: 'Parent',
        plan: undefined,
      },
      child: {
        firstName: approval.childFirstName,
        lastName: approval.childLastName,
        name: `${approval.childFirstName} ${approval.childLastName}`,
        birthdate: approval.childBirthdate,
      },
    });

    // Create session with the response object
    const session = await getIronSession<SessionData>(req, response, sessionOptions);
    
    session.userId = parentUser;
    session.createdAt = now; // legacy
    session.issuedAt = now;
    session.lastActivityAt = now;
    session.lastAuthAt = now;
    session.expiresAt = now + timeoutMins * 60 * 1000;
    session.idleCutoffMinutes = Number(process.env.SESSION_IDLE_CUTOFF_MINUTES || 60);
    session.refreshIntervalMinutes = Number(process.env.SESSION_REFRESH_INTERVAL_MINUTES || 20);
    
    // Save session and attach cookies to response
    await session.save();

    return response;

  } catch (error) {
    console.error('[PARENT-APPROVAL-SIGNUP] Error processing parent signup:', error);
    return NextResponse.json({ 
      error: 'Failed to process parent signup' 
    }, { status: 500 });
  }
}
