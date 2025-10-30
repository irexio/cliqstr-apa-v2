import { DateTime } from 'luxon';

/**
 * Calendar utilities for timezone-aware date comparisons
 */

/**
 * Convert a timestamp to a local date key string in a specific timezone
 * This ensures consistent date comparison across timezones
 * 
 * @param timestamp - The UTC timestamp (number, string, or Date)
 * @param timezone - The timezone to convert to (default: 'America/Chicago')
 * @returns Date string in format 'MM/DD/YYYY' in the specified timezone
 */
export const toLocalDateKey = (
  timestamp: number | string | Date,
  timezone: string = 'America/Chicago'
): string => {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return new Date(time).toLocaleDateString('en-US', {
    timeZone: timezone,
  });
};

/**
 * Check if an event's timestamp falls on the same day as a calendar cell date
 * Uses timezone-aware comparison with the event's saved timezone
 * 
 * CRITICAL: We need to compare both dates in the SAME timezone context.
 * The calendar date is rendered based on the browser's local display,
 * so we compare the event timestamp converted to event timezone with
 * a UTC midnight of the calendar date converted to event timezone.
 * 
 * @param eventTime - The event's UTC start time
 * @param calendarDate - The calendar cell date being checked (in browser's local context)
 * @param eventTimezone - The event's saved timezone (optional)
 * @returns true if the event falls on this calendar day in its timezone
 */
export const isSameDay = (
  eventTime: number | string | Date,
  calendarDate: Date,
  eventTimezone: string = 'America/Chicago'
): boolean => {
  // Get the calendar date as if it were midnight UTC
  // This represents the "day" the calendar is showing
  const calendarDateMidnightUTC = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    calendarDate.getDate(),
    0, 0, 0, 0
  ).getTime();

  // Convert event timestamp to the event's timezone
  const eventKey = toLocalDateKey(eventTime, eventTimezone);
  
  // Convert calendar midnight UTC to the event's timezone
  const calendarKey = toLocalDateKey(calendarDateMidnightUTC, eventTimezone);
  
  const match = eventKey === calendarKey;
  
  console.log('[isSameDay] Comparing:', {
    eventTime: new Date(eventTime as number).toISOString(),
    eventKey,
    calendarDate: calendarDate.toDateString(),
    calendarDateMidnightUTC: new Date(calendarDateMidnightUTC).toISOString(),
    calendarKey,
    match,
    eventTimezone,
  });
  
  return match;
};

/**
 * Get all events that occur on a specific calendar day
 * Uses the event's saved timezone for comparison
 */
export const getEventsForDay = (
  events: Array<{ startAt: number; timezone?: string; [key: string]: any }>,
  dayDate: Date
): Array<any> => {
  return events.filter((event) => {
    const eventTz = event.timezone || 'America/Chicago';
    return isSameDay(event.startAt, dayDate, eventTz);
  });
};
