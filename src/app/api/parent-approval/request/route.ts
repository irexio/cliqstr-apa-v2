import { NextResponse, NextRequest } from 'next/server';
import { sendUnifiedParentApprovalEmail } from '@/lib/auth/sendUnifiedParentApprovalEmail';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const parentApprovalRequestSchema = z.object({
  childFirstName: z.string().min(1, 'Child first name is required'),
  childLastName: z.string().min(1, 'Child last name is required'),
  childBirthdate: z.string().min(1, 'Child birthdate is required'),
  parentEmail: z.string().email('Valid parent email is required'),
});

/**
 * POST /api/parent-approval/request
 * 
 * Handles parent approval requests for child signups
 * Creates a parent approval record and sends unified parent email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parentApprovalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid request data' 
      }, { status: 400 });
    }

    const { childFirstName, childLastName, childBirthdate, parentEmail } = parsed.data;

    console.log(`[PARENT-APPROVAL] Processing approval request for child: ${childFirstName} ${childLastName}`);

    // Check if parent email already exists to determine parent state
    const existingUser = await convexHttp.query(api.users.getUserByEmail, {
      email: parentEmail.toLowerCase().trim(),
    });

    let parentState: 'new' | 'existing_parent' | 'existing_adult' = 'new';
    let existingParentId: string | undefined = undefined;

    if (existingUser) {
      const account = await convexHttp.query(api.accounts.getAccountByUserId, {
        userId: existingUser._id as any,
      });

      if (account?.role === 'Parent') {
        parentState = 'existing_parent';
        existingParentId = existingUser._id;
      } else if (account?.role === 'Adult') {
        parentState = 'existing_adult';
        existingParentId = existingUser._id;
      }
    }

    // Generate secure approval token using Node.js crypto
    const approvalToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days

    // Create a parent approval record in Convex
    const approval = await convexHttp.mutation(api.parentApprovals.createParentApproval, {
      childFirstName,
      childLastName,
      childBirthdate,
      parentEmail,
      context: 'direct_signup',
      parentState,
      existingParentId: existingParentId as any,
      approvalToken,
      expiresAt,
    });
    
    console.log(`[PARENT-APPROVAL] Created parent approval: ${approval.id} with token: ${approval.approvalToken} for parent state: ${parentState}`);

    // Send unified parent approval email
    const result = await sendUnifiedParentApprovalEmail({
      to: parentEmail,
      childName: childFirstName,
      context: 'direct_signup',
      approvalToken: approval.approvalToken,
    });

    if (!result.success) {
      console.error(`[PARENT-APPROVAL] Failed to send email to ${parentEmail}:`, result.error);
      return NextResponse.json({ 
        error: 'Failed to send parent approval email' 
      }, { status: 500 });
    }

    console.log(`[PARENT-APPROVAL] Successfully sent approval email to ${parentEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Parent approval request sent successfully',
      approvalId: approval.id,
      approvalToken: approval.approvalToken,
      parentState,
    });

  } catch (error) {
    console.error('[PARENT-APPROVAL] Error processing approval request:', error);
    return NextResponse.json({ 
      error: 'Failed to process parent approval request' 
    }, { status: 500 });
  }
}
