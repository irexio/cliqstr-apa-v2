import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createActivitySchema = z.object({
  cliqId: z.string(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  startAt: z.number().min(Date.now() - 60000, 'Event time must be in the future'),
  endAt: z.number(),
  timezone: z.string(),
  location: z.string().max(500).optional(),
  recurrenceRule: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { cliqId, title, description, startAt, endAt, timezone, location, recurrenceRule } = parsed.data;

    console.log(`[ACTIVITIES_CREATE] User ${session.userId} creating activity in cliq ${cliqId}`);

    // Create activity via Convex
    const result = await convexHttp.mutation(api.activities.createActivity, {
      cliqId: cliqId as any,
      title,
      description,
      startAt,
      endAt,
      timezone,
      location,
      createdByUserId: session.userId as any,
      recurrenceRule,
    });

    console.log(`[ACTIVITIES_CREATE] Activity created:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ACTIVITIES_CREATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
