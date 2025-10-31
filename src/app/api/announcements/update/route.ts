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
    const { announcementId, title, message, pinned } = body;

    // Validation
    if (!announcementId) {
      return NextResponse.json(
        { error: 'announcementId is required' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (typeof pinned !== 'boolean') {
      return NextResponse.json(
        { error: 'pinned must be a boolean' },
        { status: 400 }
      );
    }

    console.log('[ANNOUNCEMENTS] Updating announcement:', {
      announcementId,
      title,
      pinned,
    });

    // Call Convex mutation - it will handle permission validation
    const updatedId = await convexHttp.mutation(api.announcements.updateAnnouncement, {
      id: announcementId as any,
      title: title.trim(),
      message: message.trim(),
      createdByUserId: session.userId as any,
      pinned: !!pinned,
    });

    return NextResponse.json({
      success: true,
      announcementId: updatedId,
    });
  } catch (error: any) {
    console.error('[ANNOUNCEMENTS] Error updating announcement:', error);

    // Check if it's a permission error
    if (error?.message?.includes('Only') || error?.message?.includes('creator')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this announcement' },
        { status: 403 }
      );
    }

    if (error?.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}
