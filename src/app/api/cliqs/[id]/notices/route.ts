import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

const createNoticeSchema = z.object({
  content: z.string().min(1, 'Announcement cannot be empty').max(500, 'Announcement too long'),
  expiresAt: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliqId } = await params;
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notices for this cliq
    const notices = await convexHttp.query(api.cliqNotices.getByCliqId, {
      cliqId: cliqId as any,
    });

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('[CLIQ_NOTICES_GET]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cliqId } = await params;
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createNoticeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { content, expiresAt } = parsed.data;

    // Verify user is cliq owner
    const cliq = await convexHttp.query(api.cliqs.getCliq, {
      cliqId: cliqId as any,
      userId: session.userId as any,
    });

    if (!cliq || cliq.ownerId !== session.userId) {
      return NextResponse.json(
        { error: 'Only cliq owner can post announcements' },
        { status: 403 }
      );
    }

    // Create notice
    const noticeId = await convexHttp.mutation(api.cliqNotices.createNotice, {
      cliqId: cliqId as any,
      type: 'admin',
      content,
      expiresAt,
    });

    console.log(`[CLIQ_NOTICE] Notice ${noticeId} created by owner ${session.userId} in cliq ${cliqId}`);

    return NextResponse.json({ success: true, noticeId });
  } catch (error: any) {
    console.error('[CLIQ_NOTICE_ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
