import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rsvpSchema = z.object({
  status: z.enum(['in', 'maybe', 'raincheck']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const eventId = params.id;

    console.log(`[EVENTS_RSVP] User ${session.userId} RSVP ${status} for event ${eventId}`);

    // Update RSVP via Convex
    const event = await convexHttp.mutation(api.events.updateRsvp, {
      eventId: eventId as any,
      userId: session.userId as any,
      status,
    });

    console.log(`[EVENTS_RSVP] RSVP updated successfully`);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('[EVENTS_RSVP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}
