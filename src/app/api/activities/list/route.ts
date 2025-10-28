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
      console.log('[ACTIVITIES_LIST] No session userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cliqId = searchParams.get('cliqId');
    const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : undefined;

    console.log('[ACTIVITIES_LIST] Request params:', { cliqId, from, to, userId: session.userId });

    if (!cliqId) {
      console.log('[ACTIVITIES_LIST] Missing cliqId');
      return NextResponse.json({ error: 'cliqId is required' }, { status: 400 });
    }

    // Validate cliqId format
    if (typeof cliqId !== 'string' || cliqId.length === 0) {
      console.error('[ACTIVITIES_LIST] Invalid cliqId format:', cliqId);
      return NextResponse.json({ error: 'Invalid cliq ID format' }, { status: 400 });
    }

    const [activities, birthdayEvents] = await Promise.all([
      convexHttp.query(api.events.listByCliq, {
        cliqId: cliqId as any,
        from,
        to,
        userId: session?.userId as any,
      }),
      convexHttp.query(api.events.getBirthdayEvents, {
        cliqId: cliqId as any,
      }),
    ]);

    console.log('[ACTIVITIES_LIST] Retrieved activities:', { count: activities?.length, activities });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[ACTIVITIES_LIST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list activities' },
      { status: 500 }
    );
  }
}
