/**
 * 🔄 OPTIMIZED CONVEX ROUTE: POST /api/invites/create
 * 
 * This is the rewritten version using Convex patterns:
 * - Creates invites using optimized Convex mutations
 * - More efficient than the original Prisma version
 * - Enables real-time updates for invite management
 * 
 * @deprecated The original route.ts is deprecated in favor of this Convex version
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { generateJoinCode } from '@/lib/auth/generateJoinCode';
import { sendChildInviteEmail } from '@/lib/auth/sendChildInviteEmail';
import { sendInviteEmail } from '@/lib/auth/sendInviteEmail';
import { BASE_URL } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Auth: inviter must be authenticated
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user account using Convex
    const account = await convexHttp.query(api.accounts.getAccountByUserId, {
      userId: user.id as any,
    });

    // Allow both adults and parents to send invites
    if (!account || (account.role !== 'Adult' && account.role !== 'Parent')) {
      return NextResponse.json({ error: 'Adult or Parent role required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      inviteeEmail, 
      inviteType, 
      cliqId, 
      inviteNote,
      friendFirstName,
      friendLastName,
      childBirthdate,
      parentEmail
    } = body;

    // Handle both old and new payload formats
    const targetEmail = inviteeEmail || email;
    
    if (!targetEmail || typeof targetEmail !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Step 1: Normalize email
    const emailNorm = targetEmail.trim().toLowerCase();

    // Step 2: Look up existing user using Convex
    const existingUser = await convexHttp.query(api.users.getUserByEmail, {
      email: emailNorm,
    });

    // Step 3: Determine targetState
    let targetState: 'new' | 'existing_parent' | 'existing_user_non_parent' | 'invalid_child';
    let targetUserId: string | null = null;

    if (!existingUser) {
      targetState = 'new';
    } else {
      // Get the user's account information
      const account = await convexHttp.query(api.accounts.getAccountByUserId, {
        userId: existingUser._id as any
      });
      
      if (account?.suspended) {
        return NextResponse.json({ 
          error: 'This account cannot receive invites' 
        }, { status: 400 });
      } else if (account?.role === 'Child') {
        return NextResponse.json({ 
          error: 'This email belongs to a child account and cannot be invited as a parent' 
        }, { status: 400 });
      } else if (account?.role === 'Parent') {
        targetState = 'existing_parent';
        targetUserId = existingUser._id;
      } else if (account?.role === 'Adult') {
        targetState = 'existing_user_non_parent';
        targetUserId = existingUser._id;
      } else {
        // Handle any other role or missing role
        targetState = 'existing_user_non_parent';
        targetUserId = existingUser._id;
      }
    }

    // Step 4: Create invite or parent approval based on type
    let inviteId;
    let approvalToken;
    
    if (inviteType === 'child') {
      // For child invites, create a parent approval record
      approvalToken = crypto.randomUUID();
      const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
      
      await convexHttp.mutation(api.parentApprovals.createParentApproval, {
        childFirstName: friendFirstName || '',
        childLastName: friendLastName || '',
        childBirthdate: childBirthdate || '',
        parentEmail: targetEmail,
        context: 'child_invite',
        inviteId: undefined, // Will be set after invite creation
        cliqId: cliqId ? cliqId as any : undefined,
        inviterName: undefined, // Will be set when sending email
        cliqName: undefined, // Will be set when sending email
        parentState: targetState,
        existingParentId: targetState === 'existing_parent' ? targetUserId as any : undefined,
        approvalToken: approvalToken,
        expiresAt: expiresAt,
      });
      
      // Also create a regular invite record for tracking
      const inviteToken = crypto.randomUUID();
      const joinCode = generateJoinCode();
      
      inviteId = await convexHttp.mutation(api.invites.createInvite, {
        token: inviteToken,
        joinCode: joinCode,
        targetEmailNormalized: emailNorm,
        targetUserId: targetUserId as any,
        targetState,
        status: 'pending',
        used: false,
        inviterId: user.id as any,
        inviteeEmail: targetEmail,
        cliqId: cliqId ? cliqId as any : undefined,
        isApproved: false,
        friendFirstName: friendFirstName,
        friendLastName: friendLastName,
        childBirthdate: childBirthdate,
        inviteNote: inviteNote,
        inviteType: inviteType,
        parentAccountExists: targetState === 'existing_parent',
      });
    } else {
      // For adult invites, create regular invite
      const inviteToken = crypto.randomUUID();
      const joinCode = generateJoinCode();
      
      inviteId = await convexHttp.mutation(api.invites.createInvite, {
        token: inviteToken,
        joinCode: joinCode,
        targetEmailNormalized: emailNorm,
        targetUserId: targetUserId as any,
        targetState,
        status: 'pending',
        used: false,
        inviterId: user.id as any,
        inviteeEmail: targetEmail,
        cliqId: cliqId ? cliqId as any : undefined,
        isApproved: false,
        friendFirstName: friendFirstName,
        friendLastName: friendLastName,
        childBirthdate: childBirthdate,
        inviteNote: inviteNote,
        inviteType: inviteType,
        parentAccountExists: targetState === 'existing_parent',
      });
    }

    // Step 5: Send appropriate email based on invite type
    try {
      if (inviteType === 'child') {
        // Get cliq name for the email
        const cliq = cliqId ? await convexHttp.query(api.cliqs.getCliqBasic, { cliqId: cliqId as any }) : null;
        const cliqName = cliq?.name || 'a Cliq';
        
        // Get inviter name for the email
        const inviterProfile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: user.id as any });
        const inviterName = inviterProfile ? `${inviterProfile.firstName} ${inviterProfile.lastName}`.trim() : user.email?.split('@')[0] || 'Someone';
        
        // Use parent approval URL instead of old invite flow
        const approvalLink = `${BASE_URL}/parent-approval?token=${encodeURIComponent(approvalToken!)}`;
        
        await sendChildInviteEmail({
          to: targetEmail,
          cliqName: cliqName,
          inviterName: inviterName,
          inviteLink: approvalLink, // Now points to parent approval flow
          friendFirstName: friendFirstName || '',
          friendLastName: friendLastName || '',
          inviteNote: inviteNote,
          inviteCode: joinCode,
          parentAccountExists: targetState === 'existing_parent'
        });
        
        console.log(`[INVITE_CREATE] Child invite email sent to ${targetEmail} for ${friendFirstName} ${friendLastName}`);
      } else {
        // Adult invite - use regular invite email
        const cliq = cliqId ? await convexHttp.query(api.cliqs.getCliqBasic, { cliqId: cliqId as any }) : null;
        const cliqName = cliq?.name || 'a Cliq';
        
        const inviterProfile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: user.id as any });
        const inviterName = inviterProfile ? `${inviterProfile.firstName} ${inviterProfile.lastName}`.trim() : user.email?.split('@')[0] || 'Someone';
        
        const inviteLink = `${BASE_URL}/invite/accept?code=${inviteToken}`;
        
        await sendInviteEmail({
          to: targetEmail,
          cliqName: cliqName,
          inviterName: inviterName,
          inviteLink: inviteLink,
          inviteCode: joinCode
        });
        
        console.log(`[INVITE_CREATE] Adult invite email sent to ${targetEmail}`);
      }
    } catch (emailError) {
      console.error('[INVITE_CREATE] Failed to send email:', emailError);
      // Don't fail the entire request if email fails - invite was still created
    }
    
    // Step 6: Response (safe for authenticated inviter UI)
    return NextResponse.json({
      ok: true,
      inviteId,
      targetState
    });

  } catch (error) {
    console.error('[INVITE_CREATE] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
