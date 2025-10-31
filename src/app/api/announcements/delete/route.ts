import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json(
        { error: 'announcementId is required' },
        { status: 400 }
      );
    }

    console.log('[ANNOUNCEMENTS] Deleting announcement:', announcementId);

    // Call Convex mutation - it will handle permission validation
    await convexHttp.mutation(api.announcements.deleteAnnouncement, {
      id: announcementId as any,
      createdByUserId: session.userId as any,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ANNOUNCEMENTS] Error deleting announcement:', error);

    // Check if it's a permission error
    if (error?.message?.includes('Only') || error?.message?.includes('creator')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this announcement' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
