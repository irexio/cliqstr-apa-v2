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
  console.log("[INVITE_CREATE] ROUTE VERSION v6 - SECURITY FIX: No email-based name extraction");
  const requestId = crypto.randomUUID();
  console.log(`[INVITE_CREATE] Starting invite creation - Request ID: ${requestId}`);
  console.log(`[INVITE_CREATE] DEPLOYMENT TEST - ${new Date().toISOString()}`);
  
  try {
    // Test basic functionality first
    console.log(`[INVITE_CREATE] Basic test - function is executing`);
    // Auth: inviter must be authenticated
    console.log(`[INVITE_CREATE] Checking authentication...`);
    const user = await getCurrentUser();
    if (!user?.id) {
      console.log(`[INVITE_CREATE] Authentication failed - no user ID`);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.log(`[INVITE_CREATE] User authenticated: ${user.id} (${user.email})`);

    // Check user account using Convex
    console.log(`[INVITE_CREATE] Getting account for user: ${user.id}`);
    const account = await convexHttp.query(api.accounts.getAccountByUserId, {
      userId: user.id as any,
    });
    console.log(`[INVITE_CREATE] Account found:`, account ? `Role: ${account.role}` : 'Not found');

    // Allow adults, parents, and children (with permission) to send invites
    if (!account || (account.role !== 'Adult' && account.role !== 'Parent' && account.role !== 'Child')) {
      console.log(`[INVITE_CREATE] Access denied - account: ${account ? account.role : 'none'}`);
      return NextResponse.json({ error: 'Valid account required' }, { status: 403 });
    }

             console.log(`[INVITE_CREATE] Parsing request body...`);
             const body = await request.json();
             console.log(`[INVITE_CREATE] Request body:`, JSON.stringify(body, null, 2));
             console.log(`[INVITE_CREATE] Request body type:`, typeof body);
             console.log(`[INVITE_CREATE] Request body keys:`, Object.keys(body));
    
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

    console.log(`[INVITE_CREATE] Destructured values:`, {
      email,
      inviteeEmail,
      inviteType,
      cliqId,
      inviteNote,
      friendFirstName,
      friendLastName,
      childBirthdate,
      parentEmail
    });

    // Handle both old and new payload formats
    // For child invites, use parentEmail; for adult invites, use inviteeEmail or email
    const targetEmail = inviteType === 'child' ? parentEmail : (inviteeEmail || email);
    console.log(`[INVITE_CREATE] Target email resolved to:`, targetEmail);
    
    if (!targetEmail || typeof targetEmail !== 'string') {
      console.log(`[INVITE_CREATE] Email validation failed - targetEmail: ${targetEmail}`);
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (!inviteType || typeof inviteType !== 'string') {
      console.log(`[INVITE_CREATE] Invite type validation failed - inviteType: ${inviteType}`);
      return NextResponse.json({ error: 'Invite type is required' }, { status: 400 });
    }
    
    if (!cliqId || typeof cliqId !== 'string') {
      console.log(`[INVITE_CREATE] Cliq ID validation failed - cliqId: ${cliqId}`);
      return NextResponse.json({ error: 'Cliq ID is required' }, { status: 400 });
    }

    // Step 1: Normalize email
    console.log(`[INVITE_CREATE] Normalizing email: ${targetEmail}`);
    const emailNorm = targetEmail.trim().toLowerCase();
    console.log(`[INVITE_CREATE] Normalized email: ${emailNorm}`);

    // Step 1.5: Validate child invite requirements and check permissions
    if (inviteType === 'child') {
      // For child invites, validate required fields
      if (!friendFirstName || !friendLastName || !childBirthdate) {
        return NextResponse.json({ 
          error: 'Child invites require child first name, last name, and birthdate' 
        }, { status: 400 });
      }
      
      // 🔐 CRITICAL COMPLIANCE: Check if child has permission to invite other children
      if (account.role === 'Child') {
        // Get child's profile and settings
        const profile = await convexHttp.query(api.profiles.getProfileByUserId, {
          userId: user.id as any,
        });
        
        if (!profile) {
          return NextResponse.json({ 
            error: 'Child account incomplete, parent approval required' 
          }, { status: 403 });
        }
        
        const childSettings = await convexHttp.query(api.users.getChildSettings, {
          profileId: profile._id as any,
        });
        
        if (!childSettings?.canInviteChildren) {
          return NextResponse.json({ 
            error: 'You do not have permission to invite other children. Please ask your parent to enable this feature.' 
          }, { status: 403 });
        }
        
        // Check if child has valid parent consent
        const consentCheck = await convexHttp.query(api.parentConsents.hasValidParentConsent, {
          childId: user.id as any,
        });
        
        if (!consentCheck.hasConsent) {
          return NextResponse.json({ 
            error: 'Child account incomplete, parent approval required' 
          }, { status: 403 });
        }
      }
      
      // Validate that the target email is not a direct child email
      // This prevents children from inviting other children directly
      const existingUser = await convexHttp.query(api.users.getUserByEmail, {
        email: emailNorm,
      });
      
      if (existingUser) {
        const account = await convexHttp.query(api.accounts.getAccountByUserId, {
          userId: existingUser._id as any
        });
        
        if (account?.role === 'Child') {
          return NextResponse.json({ 
            error: 'Child invites must use parent email addresses, not child email addresses directly' 
          }, { status: 400 });
        }
      }
    } else if (inviteType === 'adult') {
      // 🔐 CRITICAL COMPLIANCE: Check if child has permission to invite adults
      if (account.role === 'Child') {
        // Get child's profile and settings
        const profile = await convexHttp.query(api.profiles.getProfileByUserId, {
          userId: user.id as any,
        });
        
        if (!profile) {
          return NextResponse.json({ 
            error: 'Child account incomplete, parent approval required' 
          }, { status: 403 });
        }
        
        const childSettings = await convexHttp.query(api.users.getChildSettings, {
          profileId: profile._id as any,
        });
        
        if (!childSettings?.canInviteAdults) {
          return NextResponse.json({ 
            error: 'You do not have permission to invite adults. Please ask your parent to enable this feature.' 
          }, { status: 403 });
        }
        
        // Check if child has valid parent consent
        const consentCheck = await convexHttp.query(api.parentConsents.hasValidParentConsent, {
          childId: user.id as any,
        });
        
        if (!consentCheck.hasConsent) {
          return NextResponse.json({ 
            error: 'Child account incomplete, parent approval required' 
          }, { status: 403 });
        }
      }
    }

    // Step 2: Look up existing user using Convex
    console.log(`[INVITE_CREATE] Looking up existing user with email: ${emailNorm}`);
    const existingUser = await convexHttp.query(api.users.getUserByEmail, {
      email: emailNorm,
    });
    console.log(`[INVITE_CREATE] Existing user found:`, existingUser ? 'Yes' : 'No');

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
             const inviteToken = crypto.randomUUID();
             const joinCode = generateJoinCode();
             
             console.log(`[INVITE_CREATE] About to create invite with:`, {
               inviteType,
               targetEmail,
               emailNorm,
               targetState,
               targetUserId,
               cliqId,
               friendFirstName,
               friendLastName,
               childBirthdate,
               inviteNote
             });
             
             if (inviteType === 'child') {
      // For child invites, create a parent approval record
      approvalToken = crypto.randomUUID();
      const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
      
      console.log(`[INVITE_CREATE] Creating parent approval for child invite...`);
      try {
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
          parentState: targetState === 'existing_user_non_parent' ? 'existing_adult' : targetState,
          existingParentId: targetState === 'existing_parent' ? targetUserId as any : undefined,
          approvalToken: approvalToken,
          expiresAt: expiresAt,
        });
        console.log(`[INVITE_CREATE] ✅ Parent approval created successfully`);
      } catch (error) {
        console.error(`[INVITE_CREATE] ❌ Failed to create parent approval:`, error);
        throw error; // Re-throw to stop the process
      }
      
      // Also create a regular invite record for tracking
      const childInviteParams = {
        token: inviteToken,
        joinCode: joinCode,
        code: joinCode, // Use joinCode as the code
        inviteeEmail: targetEmail,
        targetEmailNormalized: emailNorm,
        targetUserId: targetUserId ? targetUserId as any : undefined,
        targetState,
        status: 'pending' as const,
        used: false,
        inviterId: user.id as any,
        cliqId: cliqId ? cliqId as any : undefined,
        isApproved: false,
        friendFirstName: friendFirstName || undefined,
        friendLastName: friendLastName || undefined,
        childBirthdate: childBirthdate || undefined,
        inviteNote: inviteNote || undefined,
        inviteType: inviteType,
        parentAccountExists: targetState === 'existing_parent',
      };
      
      console.log(`[INVITE_CREATE] Child invite Convex params:`, childInviteParams);
      inviteId = await convexHttp.mutation(api.invites.createInvite, childInviteParams);
    } else {
      // For adult invites, create regular invite
      const adultInviteParams = {
        token: inviteToken,
        joinCode: joinCode,
        code: joinCode, // Use joinCode as the code
        inviteeEmail: targetEmail,
        targetEmailNormalized: emailNorm,
        targetUserId: targetUserId ? targetUserId as any : undefined,
        targetState,
        status: 'pending' as const,
        used: false,
        inviterId: user.id as any,
        cliqId: cliqId ? cliqId as any : undefined,
        isApproved: false,
        friendFirstName: friendFirstName || undefined,
        friendLastName: friendLastName || undefined,
        childBirthdate: childBirthdate || undefined,
        inviteNote: inviteNote || undefined,
        inviteType: 'adult', // Ensure adult invites are marked as 'adult'
        parentAccountExists: targetState === 'existing_parent',
      };
      
      console.log(`[INVITE_CREATE] Adult invite Convex params:`, adultInviteParams);
      inviteId = await convexHttp.mutation(api.invites.createInvite, adultInviteParams);
    }

    // Step 5: Send appropriate email based on invite type
    try {
      if (inviteType === 'child') {
        // Get cliq name for the email
        const cliq = cliqId ? await convexHttp.query(api.cliqs.getCliqBasic, { cliqId: cliqId as any }) : null;
        const cliqName = cliq?.name || 'a Cliq';
        
        // Get inviter name for the email
        const inviterAccount = await convexHttp.query(api.accounts.getAccountByUserId, { userId: user.id as any });
        const inviterName = inviterAccount ? `${inviterAccount.firstName || ''} ${inviterAccount.lastName || ''}`.trim() : 'Someone';
        
        // Use direct Parents HQ link for child invites (bypassing smart router)
        // For child invites, use the joinCode to preserve the invite context
        const inviteLink = `${BASE_URL}/parents/hq?inviteCode=${encodeURIComponent(joinCode)}`;
        
        await sendChildInviteEmail({
          to: targetEmail,
          cliqName: cliqName,
          inviterName: inviterName,
          inviteLink: inviteLink, // Points to invite flow
          friendFirstName: friendFirstName || '',
          friendLastName: friendLastName || '',
          inviteNote: inviteNote,
          inviteCode: joinCode,
          parentAccountExists: targetState === 'existing_parent'
        });
        
        console.log(`[INVITE_CREATE] Child invite email sent to ${targetEmail} for ${friendFirstName} ${friendLastName}`);
      } else {
        // Adult invite - use regular invite email
        let cliqName = 'a Cliq';
        let inviterName = 'Someone';
        
        try {
          // Get cliq name with error handling
          if (cliqId) {
            const cliq = await convexHttp.query(api.cliqs.getCliqBasic, { cliqId: cliqId as any });
            cliqName = cliq?.name || 'a Cliq';
          }
        } catch (cliqError) {
          console.error('[INVITE_CREATE] Error getting cliq name:', cliqError);
          // Continue with default cliq name
        }
        
        try {
          // Get inviter profile with error handling
          console.log(`[INVITE_CREATE] Getting inviter profile for user: ${user.id}`);
          const inviterProfile = await convexHttp.query(api.profiles.getProfileByUserId, { userId: user.id as any });
          console.log(`[INVITE_CREATE] Inviter profile result:`, inviterProfile ? 'Found' : 'Not found');
          
          if (inviterProfile?.account?.firstName && inviterProfile?.account?.lastName) {
            inviterName = `${inviterProfile.account.firstName} ${inviterProfile.account.lastName}`.trim();
            console.log(`[INVITE_CREATE] Using full name: ${inviterName}`);
          } else if (inviterProfile?.username) {
            inviterName = inviterProfile.username;
            console.log(`[INVITE_CREATE] Using username: ${inviterName}`);
          } else {
            console.log(`[INVITE_CREATE] Using default name: ${inviterName}`);
          }
        } catch (profileError) {
          console.error('[INVITE_CREATE] Error getting inviter profile:', profileError);
          console.log(`[INVITE_CREATE] Continuing with default inviter name: ${inviterName}`);
          // Continue with default inviter name
        }
        
        const inviteLink = `${BASE_URL}/invite/accept?code=${joinCode}`;
        
        await sendInviteEmail({
          to: targetEmail,
          cliqName: cliqName,
          inviterName: inviterName,
          inviteLink: inviteLink,
          inviteCode: joinCode
        });
        
        console.log(`[INVITE_CREATE] Adult invite email sent to ${targetEmail} for ${cliqName} by ${inviterName}`);
      }
    } catch (emailError) {
      console.error('[INVITE_CREATE] Failed to send email:', emailError);
      // Don't fail the entire request if email fails - invite was still created
      // Log the specific error for debugging
      if (emailError instanceof Error) {
        console.error('[INVITE_CREATE] Email error details:', emailError.message);
        console.error('[INVITE_CREATE] Email error stack:', emailError.stack);
      }
      
      // For now, we'll continue even if email fails due to Resend issues
      // The invite was still created successfully in the database
      console.log('[INVITE_CREATE] Continuing despite email failure - invite created successfully');
    }
    
    // Step 6: Response (safe for authenticated inviter UI)
    console.log(`[INVITE_CREATE] Invite created successfully - ID: ${inviteId}, State: ${targetState}`);
    return NextResponse.json({
      ok: true,
      inviteId,
      targetState,
      requestId: requestId
    });

  } catch (error: any) {
    console.error("[INVITE_CREATE] Error:", error);

    let errorMessage = "Internal server error";
    let errorDetails: any = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
