import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateActivitySchema = z.object({
  activityId: z.string(),
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().max(1000).optional(),
  startAt: z.number().optional(),
  endAt: z.number().optional(),
  timezone: z.string().optional(),
  location: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('[ACTIVITIES_UPDATE] Starting request...');
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      console.error('[ACTIVITIES_UPDATE] No session userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ACTIVITIES_UPDATE] Session OK, userId:', session.userId, `(+${Date.now() - startTime}ms)`);
    
    const body = await req.json();
    console.log('[ACTIVITIES_UPDATE] Request body received', `(+${Date.now() - startTime}ms)`);
    
    const parsed = updateActivitySchema.safeParse(body);

    if (!parsed.success) {
      console.error('[ACTIVITIES_UPDATE] Validation failed:', JSON.stringify(parsed.error.errors, null, 2));
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { activityId, title, description, startAt, endAt, timezone, location } = parsed.data;

    console.log(`[ACTIVITIES_UPDATE] Validation passed, calling Convex`, `(+${Date.now() - startTime}ms)`);

    // Update event via Convex
    console.log('[ACTIVITIES_UPDATE] Calling Convex mutation...', `(+${Date.now() - startTime}ms)`);
    const result = await convexHttp.mutation(api.events.updateEvent, {
      eventId: activityId as any,
      userId: session.userId as any,
      title,
      description,
      startAt,
      endAt,
      timezone,
      location,
    });

    console.log(`[ACTIVITIES_UPDATE] Event updated successfully`, `(Total: ${Date.now() - startTime}ms)`, JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ACTIVITIES_UPDATE] Error:', {
      message: error?.message,
      stack: error?.stack,
      details: error?.data || error,
      totalTime: `${Date.now() - startTime}ms`,
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}
