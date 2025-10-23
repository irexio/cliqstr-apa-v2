import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const body = await req.json();
    const action = body.action || 'approve'; // 'approve' or 'reject'

    console.log(`[PARENT_EVENTS] Parent ${session.userId} ${action}ing event ${eventId}`);

    let result;
    if (action === 'approve') {
      result = await convexHttp.mutation(api.events.approveEvent, {
        eventId: eventId as any,
        parentUserId: session.userId as any,
      });
    } else if (action === 'reject') {
      result = await convexHttp.mutation(api.events.rejectEvent, {
        eventId: eventId as any,
        parentUserId: session.userId as any,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    console.log(`[PARENT_EVENTS] Event ${action}ed: ${eventId}`);

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error('[PARENT_EVENTS] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process event' },
      { status: 500 }
    );
  }
}
