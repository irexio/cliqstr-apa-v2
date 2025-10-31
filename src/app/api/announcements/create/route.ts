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
    const { title, message, visibility, cliqId, pinned } = body;

    // Validation
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!visibility || !['global', 'cliq'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility' },
        { status: 400 }
      );
    }

    if (visibility === 'cliq' && !cliqId) {
      return NextResponse.json(
        { error: 'cliqId is required for cliq announcements' },
        { status: 400 }
      );
    }

    console.log('[ANNOUNCEMENTS] Creating announcement:', {
      title,
      visibility,
      cliqId,
      pinned,
    });

    // Call Convex mutation - it will handle permission validation
    const announcementId = await convexHttp.mutation(api.announcements.createAnnouncement, {
      title: title.trim(),
      message: message.trim(),
      visibility,
      cliqId: cliqId ? (cliqId as any) : undefined,
      createdByUserId: session.userId as any,
      pinned: !!pinned,
    });

    return NextResponse.json({
      success: true,
      announcementId,
    });
  } catch (error: any) {
    console.error('[ANNOUNCEMENTS] Error creating announcement:', error);

    // Check if it's a permission error
    if (error?.message?.includes('superadmin') || error?.message?.includes('Only')) {
      return NextResponse.json(
        { error: 'You do not have permission to create this announcement' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
