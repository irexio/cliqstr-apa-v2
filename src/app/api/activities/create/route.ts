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
  startAt: z.number(), // Allow any time, validation happens in Convex
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
    console.log('[ACTIVITIES_CREATE] Request body:', body);
    
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      console.error('[ACTIVITIES_CREATE] Validation errors:', parsed.error.errors);
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { cliqId, title, description, startAt, endAt, timezone, location, recurrenceRule } = parsed.data;

    console.log(`[ACTIVITIES_CREATE] User ${session.userId} creating activity in cliq ${cliqId}`);
    console.log(`[ACTIVITIES_CREATE] Activity: title="${title}", startAt=${startAt}, endAt=${endAt}, location="${location}"`);

    // Validate cliqId is a proper Convex ID (should be non-empty string)
    if (!cliqId || typeof cliqId !== 'string' || cliqId.length === 0) {
      console.error('[ACTIVITIES_CREATE] Invalid cliqId:', cliqId);
      return NextResponse.json({ error: 'Invalid cliq ID' }, { status: 400 });
    }

    // Create activity via Convex
    const result = await convexHttp.mutation(api.activities.createActivity, {
      cliqId: cliqId as any, // cliqId comes as string from API, Convex will validate it's proper ID format
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
  } catch (error: any) {
    console.error('[ACTIVITIES_CREATE] Error:', {
      message: error?.message,
      stack: error?.stack,
      details: error?.data || error,
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to create activity' },
      { status: 500 }
    );
  }
}
