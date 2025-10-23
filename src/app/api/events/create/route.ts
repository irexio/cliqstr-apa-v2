import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createEventSchema = z.object({
  cliqId: z.string(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000),
  eventTime: z.number().min(Date.now() - 60000, 'Event time must be in the future'), // Allow 1 min buffer
  where: z.string().max(500),
  eventType: z.enum(['offline', 'online']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { cliqId, title, description, eventTime, where, eventType } = parsed.data;

    console.log(`[EVENTS_CREATE] User ${session.userId} creating event in cliq ${cliqId}`);

    // Create event via Convex
    const eventId = await convexHttp.mutation(api.events.createEvent, {
      cliqId: cliqId as any,
      title,
      description,
      eventTime,
      where,
      eventType,
      userId: session.userId as any,
    });

    console.log(`[EVENTS_CREATE] Event created: ${eventId}`);

    return NextResponse.json({
      success: true,
      eventId,
    });
  } catch (error) {
    console.error('[EVENTS_CREATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
