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

    const { activityId } = await req.json();

    if (!activityId) {
      return NextResponse.json({ error: 'activityId is required' }, { status: 400 });
    }

    console.log(`[ACTIVITIES_DELETE] User ${session.userId} deleting activity ${activityId}`);

    const result = await convexHttp.mutation(api.events.deleteEvent, {
      eventId: activityId as any,
      userId: session.userId as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ACTIVITIES_DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
