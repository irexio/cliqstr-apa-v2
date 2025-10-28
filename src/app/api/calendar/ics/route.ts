import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session-config';
import { convexHttp } from '@/lib/convex-server';
import { api } from 'convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * Generate ICS calendar file
 * Accepts userId (personal) or cliqId (cliq calendar)
 * Respects location visibility rules
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(req, NextResponse.next(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const cliqId = searchParams.get('cliqId');

    if (!userId && !cliqId) {
      return NextResponse.json(
        { error: 'Either userId or cliqId is required' },
        { status: 400 }
      );
    }

    let activities = [];

    if (userId) {
      // Personal calendar across all cliqs
      activities = await convexHttp.query(api.events.listUpcomingForUser, {
        userId: userId as any,
        days: 90,
      });
    } else if (cliqId) {
      // Cliq calendar
      activities = await convexHttp.query(api.events.listByCliq, {
        cliqId: cliqId as any,
        userId: session.userId as any,
      });
    }

    // Generate ICS content
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cliqstr//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const activity of activities) {
      // Apply location visibility rules
      let location = activity.location || '';
      if (activity.locationVisibility === 'parents') {
        location = '[Location visible to parents]';
      } else if (activity.locationVisibility === 'hidden') {
        location = '';
      }

      const startDate = new Date(activity.startAt);
      const endDate = new Date(activity.endAt);

      // Format timestamps for ICS (YYYYMMDDTHHMMSSZ)
      const formatIcsDate = (d: Date) => {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };

      // Count RSVPs
      const rsvpCounts = {
        going: Object.values(activity.rsvps).filter((s: any) => s === 'going').length,
        maybe: Object.values(activity.rsvps).filter((s: any) => s === 'maybe').length,
        raincheck: Object.values(activity.rsvps).filter((s: any) => s === 'raincheck').length,
      };

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${activity._id}@cliqstr.com`);
      icsLines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
      icsLines.push(`DTSTART:${formatIcsDate(startDate)}`);
      icsLines.push(`DTEND:${formatIcsDate(endDate)}`);
      icsLines.push(`SUMMARY:${activity.title}`);

      if (location) {
        icsLines.push(`LOCATION:${location}`);
      }

      // Add RSVP summary to description
      const description = `${activity.description || ''}\n\nRSVP: ${rsvpCounts.going} going, ${rsvpCounts.maybe} maybe, ${rsvpCounts.raincheck} raincheck`;
      icsLines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);

      if (activity.requiresParentApproval) {
        icsLines.push('STATUS:TENTATIVE');
      } else {
        icsLines.push('STATUS:CONFIRMED');
      }

      icsLines.push('END:VEVENT');
    }

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
      },
    });
  } catch (error) {
    console.error('[CALENDAR_ICS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ICS' },
      { status: 500 }
    );
  }
}
