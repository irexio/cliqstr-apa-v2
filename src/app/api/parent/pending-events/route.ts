import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[PARENT_PENDING_EVENTS] Fetching pending events for parent ${session.userId}`);

    // Fetch pending events via Convex
    const events = await convexHttp.query(api.events.getPendingEventApprovals, {
      parentUserId: session.userId as any,
    });

    return NextResponse.json({
      success: true,
      pendingEvents: events,
      count: events.length,
    });
  } catch (error) {
    console.error('[PARENT_PENDING_EVENTS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending events' },
      { status: 500 }
    );
  }
}
