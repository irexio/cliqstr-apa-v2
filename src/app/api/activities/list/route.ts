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

    const { searchParams } = new URL(req.url);
    const cliqId = searchParams.get('cliqId');
    const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : undefined;

    if (!cliqId) {
      return NextResponse.json({ error: 'cliqId is required' }, { status: 400 });
    }

    const activities = await convexHttp.query(api.activities.listByCliq, {
      cliqId: cliqId as any,
      from,
      to,
      userId: session.userId as any,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[ACTIVITIES_LIST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list activities' },
      { status: 500 }
    );
  }
}
