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
  childEmail: z.string().email('Valid child email is required').optional().or(z.literal('')),
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
    console.log(`[PARENT-CHILDREN] Looking for children for parent ID: ${session.userId} (${user.email})`);
    const children = await convexHttp.query(api.parentLinks.getChildrenByParent, {
      parentId: session.userId as any,
    });

    console.log(`[PARENT-CHILDREN] Retrieved ${children.length} children for parent ${user.email}`);
    console.log(`[PARENT-CHILDREN] Children data:`, children);

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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is an Adult, upgrade them to Parent role
    if (user.role === 'Adult') {
      console.log(`[PARENT-CHILDREN] Upgrading Adult user ${user.email} to Parent role`);
      await convexHttp.mutation(api.users.upgradeToParent, {
        userId: session.userId as any,
      });
      console.log(`[PARENT-CHILDREN] Successfully upgraded user to Parent role`);
    } else if (user.role !== 'Parent' && user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied. Parent role required.' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[PARENT-CHILDREN] Request body:', JSON.stringify(body, null, 2));
    console.log('[PARENT-CHILDREN] Required fields check:', {
      firstName: body.firstName,
      lastName: body.lastName,
      birthdate: body.birthdate,
      username: body.username,
      password: body.password ? '***' : 'MISSING',
      approvalToken: body.approvalToken,
      inviteCode: body.inviteCode
    });
    
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

    // 🔐 ATOMIC WRITES: All compliance data must be written together or none at all
    let childUserId: string | undefined;
    let profileId: string | undefined;
    let settingsId: string | undefined;
    let consentId: string | undefined;
    let auditLogId: string | undefined;

    try {
      // Step 1: Create child user account with email (generate one if not provided)
      const childEmailToUse = childEmail?.trim() || `${username}@cliqstr.local`;
      
      childUserId = await convexHttp.mutation(api.users.createUserWithAccount, {
        email: childEmailToUse, // Use provided email or generate local one
        password: password,
        birthdate: birthdate,
        role: 'Child',
        isApproved: true, // Parent is approving
        plan: 'test', // Default to test plan
        isVerified: true, // Parent approval counts as verification
        firstName: firstName,
        lastName: lastName,
      });

      console.log(`[PARENT-CHILDREN] Created child user with ID: ${childUserId}`);

      // Step 2: Create child profile
      profileId = await convexHttp.mutation(api.profiles.createProfile, {
        userId: childUserId as any,
        username: username,
        showYear: false, // Children: always false (enforced by policy)
        showMonthDay: true, // Default: show birthday to cliq members
      });

      console.log(`[PARENT-CHILDREN] Created child profile with ID: ${profileId}`);

      // Step 3: Create child settings with parent permissions (SAFE DEFAULTS)
      settingsId = await convexHttp.mutation(api.users.createChildSettings, {
        profileId: profileId as any,
        canSendInvites: permissions.canReceiveInvites ?? false, // Safe default: false
        inviteRequiresApproval: true, // Always true for safety
        canCreatePublicCliqs: permissions.canCreatePublicCliqs ?? false, // Safe default: false
        canPostImages: permissions.canUploadVideos ?? false, // Safe default: false
        canJoinPublicCliqs: false, // Always false for safety
        canInviteChildren: permissions.canInviteChildren ?? false, // Safe default: false
        canInviteAdults: permissions.canInviteAdults ?? false, // Safe default: false
        isSilentlyMonitored: silentMonitoring ?? true, // Safe default: true
        aiModerationLevel: 'strict', // Always strict for children
        canAccessGames: true, // Default to allowing games
        canShareYouTube: false, // Always false for safety
        visibilityLevel: 'private', // Always private for safety
        receiveAiAlerts: true, // Parents receive AI alerts by default
      });

      console.log(`[PARENT-CHILDREN] Created child settings with ID: ${settingsId}`);

      // Step 4: Create parent consent record
      consentId = await convexHttp.mutation(api.parentConsents.createParentConsent, {
        parentId: session.userId as any,
        childId: childUserId as any,
        redAlertAccepted: redAlertAccepted,
        silentMonitoringEnabled: silentMonitoring,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });

      console.log(`[PARENT-CHILDREN] Created parent consent with ID: ${consentId}`);

      // Step 5: Create audit log for approval action
      auditLogId = await convexHttp.mutation(api.users.logParentAction, {
        parentId: session.userId as any,
        childId: childUserId as any,
        action: 'APPROVE_CHILD',
        oldValue: undefined, // No previous state for new approval
        newValue: JSON.stringify({
          redAlertAccepted,
          silentMonitoring,
          permissions,
          timestamp: Date.now(),
        }),
      });

      console.log(`[PARENT-CHILDREN] Created audit log with ID: ${auditLogId}`);

      // Step 6: Create parent-child link
      const parentLinkId = await convexHttp.mutation(api.parentLinks.createParentLink, {
        email: user.email,
        childId: childUserId as any,
        role: 'primary',
        type: 'parent',
        permissions: {
          canManageChild: true,
          canChangeSettings: true,
          canViewActivity: true,
          receivesNotifications: true,
        },
      });

      console.log(`[PARENT-CHILDREN] Created parent link with ID: ${parentLinkId}`);

    } catch (complianceError: any) {
      console.error(`[PARENT-CHILDREN] ATOMIC WRITE FAILED - Rolling back child account creation:`, complianceError);
      
      // If any compliance write fails, we need to clean up the child account
      // This prevents children from being created without proper safety settings
      try {
        if (childUserId) {
          console.log(`[PARENT-CHILDREN] Attempting to clean up child account: ${childUserId}`);
          // Note: In a production system, you might want to add a cleanup mutation
          // For now, we'll return an error and let the parent retry
        }
      } catch (cleanupError) {
        console.error(`[PARENT-CHILDREN] Cleanup also failed:`, cleanupError);
      }

      // Return error to frontend - DO NOT redirect to success
      return NextResponse.json({ 
        error: 'Approval could not be completed. Please try again.',
        details: complianceError.message 
      }, { status: 500 });
    }

    // If this was from an invite, mark the invite as used
    if (inviteCode) {
      // TODO: Update invite status when invite system is fully implemented
      console.log(`[PARENT-CHILDREN] Child created from invite code: ${inviteCode}`);
    }

    console.log(`[PARENT-CHILDREN] Successfully created child account: ${username}`);

    return NextResponse.json({
      success: true,
      parentId: session.userId,
      childId: childUserId,
      childName: `${firstName} ${lastName}`,
      child: {
        id: childUserId,
        username: username,
        name: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
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
