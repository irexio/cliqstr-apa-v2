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

    console.log(`[EVENTS_DELETE] User ${session.userId} deleting event ${eventId}`);

    // Delete event via Convex
    const result = await convexHttp.mutation(api.events.deleteEvent, {
      eventId: eventId as any,
      userId: session.userId as any,
    });

    console.log(`[EVENTS_DELETE] Event deleted: ${eventId}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[EVENTS_DELETE] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    );
  }
}
