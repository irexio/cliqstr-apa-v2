import { NextResponse, NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createChildSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  childEmail: z.string().email('Valid child email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthdate: z.number(),
  permissions: z.object({
    canPost: z.boolean(),
    canComment: z.boolean(),
    canReact: z.boolean(),
    canViewProfiles: z.boolean(),
    canReceiveInvites: z.boolean(),
    canCreatePublicCliqs: z.boolean(),
    canInviteChildren: z.boolean(),
    canInviteAdults: z.boolean(),
    canCreateCliqs: z.boolean(),
    canUploadVideos: z.boolean(),
  }),
  redAlertAccepted: z.boolean(),
  silentMonitoring: z.boolean(),
  secondParentEmail: z.string().email().optional(),
  inviteCode: z.string().optional(),
  approvalToken: z.string().optional(),
}).refine(
  (data) => data.inviteCode || data.approvalToken,
  {
    message: "Either inviteCode or approvalToken must be provided",
    path: ["inviteCode", "approvalToken"],
  }
);

/**
 * GET /api/parent/children
 * 
 * Returns all children managed by the authenticated parent
 */
export async function GET(req: NextRequest) {
  try {
    // Get the encrypted session using iron-session
    const session = await getIronSession<SessionData>(
      req,
      NextResponse.next(),
      sessionOptions
    );

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to verify they're a parent
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user || (user.role !== 'Parent' && user.role !== 'Admin')) {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    // Get all children managed by this parent
    const children = await convexHttp.query(api.parentLinks.getChildrenByParent, {
      parentId: session.userId as any,
    });

    console.log(`[PARENT-CHILDREN] Retrieved ${children.length} children for parent ${user.email}`);

    return NextResponse.json(children);

  } catch (error) {
    console.error('[PARENT-CHILDREN] Error retrieving children:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve children' 
    }, { status: 500 });
  }
}

/**
 * POST /api/parent/children
 * 
 * Creates a new child account with parent approval
 */
export async function POST(req: NextRequest) {
  try {
    // Get the encrypted session using iron-session
    const session = await getIronSession<SessionData>(
      req,
      NextResponse.next(),
      sessionOptions
    );

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to verify they're a parent
    const user = await convexHttp.query(api.users.getCurrentUser, {
      userId: session.userId as any,
    });

    if (!user || (user.role !== 'Parent' && user.role !== 'Admin')) {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[PARENT-CHILDREN] Request body:', JSON.stringify(body, null, 2));
    
    const parsed = createChildSchema.safeParse(body);

    if (!parsed.success) {
      console.log('[PARENT-CHILDREN] Validation errors:', JSON.stringify(parsed.error.errors, null, 2));
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid child data',
        details: parsed.error.errors,
        receivedData: body
      }, { status: 400 });
    }

    const { username, password, childEmail, firstName, lastName, birthdate, permissions, redAlertAccepted, silentMonitoring, secondParentEmail, inviteCode, approvalToken } = parsed.data;

    console.log(`[PARENT-CHILDREN] Creating child account: ${username} for parent ${user.email}`);

    // Handle approval token flow (direct child signup)
    if (approvalToken) {
      // Get the approval record
      const approval = await convexHttp.query(api.parentApprovals.getParentApprovalByToken, {
        approvalToken,
      });

      if (!approval || approval.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Invalid or expired approval token' 
        }, { status: 400 });
      }

      // Mark the approval as completed
      await convexHttp.mutation(api.parentApprovals.approveParentApproval, {
        approvalToken,
      });

      console.log(`[PARENT-CHILDREN] Marked approval as completed for token: ${approvalToken}`);
    }

    // Create child user account with real email
    const childUserId = await convexHttp.mutation(api.users.createUserWithAccount, {
      email: childEmail, // Use real child email for magic links
      password: password,
      birthdate: birthdate,
      role: 'Child',
      isApproved: true, // Parent is approving
      plan: 'test', // Default to test plan
      isVerified: true, // Parent approval counts as verification
    });

    console.log(`[PARENT-CHILDREN] Created child user with ID: ${childUserId}`);

    // Create child profile
    await convexHttp.mutation(api.profiles.createProfile, {
      userId: childUserId,
      username: username,
      showYear: false, // Children: always false (enforced by policy)
      showMonthDay: true, // Default: show birthday to cliq members
    });

    // Create child settings with parent permissions
    const profile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: childUserId,
    });

    if (profile) {
      await convexHttp.mutation(api.users.createChildSettings, {
        profileId: profile._id,
        canSendInvites: permissions.canReceiveInvites,
        inviteRequiresApproval: true,
        canCreatePublicCliqs: permissions.canCreatePublicCliqs,
        canPostImages: permissions.canUploadVideos,
        canJoinPublicCliqs: false, // Default to false for safety
        canInviteChildren: permissions.canInviteChildren,
        canInviteAdults: permissions.canInviteAdults,
        isSilentlyMonitored: silentMonitoring,
        aiModerationLevel: 'strict', // Default to strict for children
        canAccessGames: true, // Default to allowing games
        canShareYouTube: false, // Default to false for safety
        visibilityLevel: 'private', // Default to private
      });
    }

    // If this was from an invite, mark the invite as used
    if (inviteCode) {
      // TODO: Update invite status when invite system is fully implemented
      console.log(`[PARENT-CHILDREN] Child created from invite code: ${inviteCode}`);
    }

    console.log(`[PARENT-CHILDREN] Successfully created child account: ${username}`);

    return NextResponse.json({
      success: true,
      child: {
        id: childUserId,
        username: username,
        name: `${firstName} ${lastName}`,
      },
    });

  } catch (error: any) {
    console.error('[PARENT-CHILDREN] Error creating child:', error);
    console.error('[PARENT-CHILDREN] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ 
      error: 'Failed to create child account',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
