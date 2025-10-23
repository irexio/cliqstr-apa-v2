import { NextRequest, NextResponse } from 'next/server';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cliqId = searchParams.get('cliqId');
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true';
    const includePast = searchParams.get('includePast') === 'true';

    if (!cliqId) {
      return NextResponse.json(
        { error: 'cliqId is required' },
        { status: 400 }
      );
    }

    console.log(`[EVENTS_LIST] Fetching events for cliq ${cliqId}, unapproved=${includeUnapproved}, past=${includePast}`);

    // Fetch events via Convex
    const events = await convexHttp.query(api.events.listEventsByCliq, {
      cliqId: cliqId as any,
      includeUnapproved,
      includePast,
    });

    // Also fetch birthdays
    const birthdays = await convexHttp.query(api.events.getBirthdayEvents, {
      cliqId: cliqId as any,
    });

    // Merge and sort
    const allEvents = [...events, ...birthdays].sort((a, b) => a.eventTime - b.eventTime);

    return NextResponse.json({
      success: true,
      events: allEvents,
      count: allEvents.length,
      birthdayCount: birthdays.length,
    });
  } catch (error) {
    console.error('[EVENTS_LIST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
