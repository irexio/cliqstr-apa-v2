import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateChildSettingsSchema = z.object({
  childId: z.string(),
  settings: z.object({
    canCreatePublicCliqs: z.boolean(),
    canJoinPublicCliqs: z.boolean(),
    canCreateCliqs: z.boolean(),
    canSendInvites: z.boolean(),
    canInviteChildren: z.boolean(),
    canInviteAdults: z.boolean(),
    isSilentlyMonitored: z.boolean(),
    canAccessGames: z.boolean(),
    canPostImages: z.boolean(),
    canShareYouTube: z.boolean(),
    inviteRequiresApproval: z.boolean(),
  }),
});

/**
 * POST /api/parent/settings/update
 * 
 * Updates child settings/permissions from Parents HQ
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
    const parsed = updateChildSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.errors[0]?.message || 'Invalid settings data' 
      }, { status: 400 });
    }

    const { childId, settings } = parsed.data;

    console.log(`[PARENT-SETTINGS-UPDATE] Updating settings for child ${childId} by parent ${user.email}`);

    // Verify the parent has permission to manage this child
    const parentLink = await convexHttp.query(api.parentLinks.getParentLinkByParentAndChild, {
      parentId: session.userId as any,
      childId: childId as any,
    });

    if (!parentLink) {
      return NextResponse.json({ 
        error: 'You are not authorized to manage this child' 
      }, { status: 403 });
    }

    // Get the child's profile to find the childSettings record
    const childProfile = await convexHttp.query(api.profiles.getProfileByUserId, {
      userId: childId as any,
    });

    if (!childProfile) {
      return NextResponse.json({ 
        error: 'Child profile not found' 
      }, { status: 404 });
    }

    // Update the child settings
    await convexHttp.mutation(api.users.updateChildSettings, {
      profileId: childProfile._id,
      parentId: session.userId as any, // Pass parent ID for audit logging
      canCreatePublicCliqs: settings.canCreatePublicCliqs,
      canJoinPublicCliqs: settings.canJoinPublicCliqs,
      canCreateCliqs: settings.canCreateCliqs,
      canSendInvites: settings.canSendInvites,
      canInviteChildren: settings.canInviteChildren,
      canInviteAdults: settings.canInviteAdults,
      isSilentlyMonitored: settings.isSilentlyMonitored,
      canAccessGames: settings.canAccessGames,
      canPostImages: settings.canPostImages,
      canShareYouTube: settings.canShareYouTube,
      inviteRequiresApproval: settings.inviteRequiresApproval,
    });

    console.log(`[PARENT-SETTINGS-UPDATE] Successfully updated settings for child ${childId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Child settings updated successfully' 
    });

  } catch (error: any) {
    console.error('[PARENT-SETTINGS-UPDATE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update child settings' 
    }, { status: 500 });
  }
}
