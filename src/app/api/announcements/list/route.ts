import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

interface Announcement {
  id: string;
  type: 'birthday' | 'event' | 'notice';
  title: string;
  description: string;
  timestamp: number;
  clickTarget?: string; // URL to navigate to on click
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

    // 1. Fetch Cliq Notices (admin messages)
    try {
      const notices = await convexHttp.query(api.cliqNotices.getNoticesByCliq, {
        cliqId: cliqId as any,
      });

      for (const notice of notices) {
        announcements.push({
          id: notice._id.toString(),
          type: 'notice',
          title: notice.content,
          description: '',
          timestamp: notice.createdAt,
        });
      }
    } catch (err) {
      console.error('[ANNOUNCEMENTS] Error fetching notices:', err);
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
        const eventDate = new Date(event.startAt);
        announcements.push({
          id: event._id.toString(),
          type: 'event',
          title: `${event.title} • ${eventDate.toLocaleDateString()}`,
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

    // Sort by timestamp (most recent first)
    announcements.sort((a, b) => b.timestamp - a.timestamp);

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
