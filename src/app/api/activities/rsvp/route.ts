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

    const { activityId, status } = await req.json();

    if (!activityId || !status) {
      return NextResponse.json({ error: 'activityId and status are required' }, { status: 400 });
    }

    if (!['going', 'maybe', 'raincheck'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    console.log(`[ACTIVITIES_RSVP] User ${session.userId} RSVPing ${status} to activity ${activityId}`);

    const result = await convexHttp.mutation(api.events.setRsvp, {
      eventId: activityId as any,
      userId: session.userId as any,
      status: status as 'going' | 'maybe' | 'raincheck',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ACTIVITIES_RSVP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to set RSVP' },
      { status: 500 }
    );
  }
}
