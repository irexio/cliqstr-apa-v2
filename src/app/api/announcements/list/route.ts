import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';
import { DateTime } from 'luxon';

export const dynamic = 'force-dynamic';

interface Announcement {
  id: string;
  type: 'event' | 'announcement' | 'birthday';
  title: string;
  description: string;
  timestamp: number;
  clickTarget?: string; // URL to navigate to on click
  isGlobal?: boolean; // true if global announcement
}

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cliqId = searchParams.get('cliqId');

    if (!cliqId) {
      return NextResponse.json({ error: 'cliqId is required' }, { status: 400 });
    }

    const announcements: Announcement[] = [];

    // 1. Fetch Active Announcements (global + cliq-specific)
    try {
      const announcementData = await convexHttp.query(api.announcements.listActiveAnnouncements, {
        cliqId: cliqId as any,
      });

      for (const ann of announcementData) {
        announcements.push({
          id: ann._id.toString(),
          type: 'announcement',
          title: ann.title,
          description: ann.message,
          timestamp: ann.createdAt,
          isGlobal: ann.visibility === 'global',
        });
      }
    } catch (err) {
      console.error('[ANNOUNCEMENTS] Error fetching announcements:', err);
    }

    // 2. Fetch Upcoming Events
    try {
      const now = Date.now();
      const upcoming = now + 30 * 24 * 60 * 60 * 1000; // Next 30 days

      const events = await convexHttp.query(api.events.listByCliq, {
        cliqId: cliqId as any,
        from: now,
        to: upcoming,
        userId: session.userId as any,
      });

      for (const event of events) {
        const eventDisplay = DateTime.fromMillis(event.startAt)
          .setZone(event.timezone || 'America/Los_Angeles')
          .toFormat('MMM d, yyyy');
        announcements.push({
          id: event._id.toString(),
          type: 'event',
          title: `${event.title} • ${eventDisplay}`,
          description: 'Tap to RSVP in Calendar',
          timestamp: event.startAt,
          clickTarget: `/calendar?cliqId=${cliqId}&eventId=${event._id}`,
        });
      }
    } catch (err) {
      console.error('[ANNOUNCEMENTS] Error fetching events:', err);
    }

    // 3. Fetch Member Birthdays (today only, from profiles)
    // TODO: Implement birthday fetching from myProfiles birthdayMonthDay
    // For now, this is placeholder
    try {
      // Birthday logic would go here
      // Fetch all members of the cliq
      // Check if their birthday (month-day) matches today
      // Add to announcements
    } catch (err) {
      console.error('[ANNOUNCEMENTS] Error fetching birthdays:', err);
    }

    // Sort: Global announcements first, then by timestamp (newest first)
    announcements.sort((a, b) => {
      // Global announcements come first
      if (a.isGlobal && !b.isGlobal) return -1;
      if (!a.isGlobal && b.isGlobal) return 1;
      // Then sort by timestamp (newest first)
      return b.timestamp - a.timestamp;
    });

    console.log('[ANNOUNCEMENTS] Returning', announcements.length, 'announcements');
    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('[ANNOUNCEMENTS] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}
