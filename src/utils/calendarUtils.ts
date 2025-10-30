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
 * CRITICAL FIX: The calendar date needs to be converted to UTC midnight first,
 * then both timestamps are converted to the event's timezone for comparison.
 * 
 * Example:
 * - Calendar shows Nov 7 (local date object)
 * - Create UTC midnight: Nov 7, 00:00:00 UTC
 * - Event: Nov 7, 10:00 AM UTC in America/Los_Angeles
 * - Compare both in LA timezone
 * 
 * @param eventTime - The event's UTC start time (milliseconds)
 * @param calendarDate - The calendar cell date being checked (local Date object)
 * @param eventTimezone - The event's saved timezone (optional)
 * @returns true if the event falls on this calendar day in its timezone
 */
export const isSameDay = (
  eventTime: number | string | Date,
  calendarDate: Date,
  eventTimezone: string = 'America/Chicago'
): boolean => {
  // CRITICAL: Create UTC midnight for the calendar date
  // NOT browser-local midnight
  const calendarDateMidnightUTC = new Date(
    Date.UTC(
      calendarDate.getUTCFullYear(),
      calendarDate.getUTCMonth(),
      calendarDate.getUTCDate(),
      0, 0, 0, 0
    )
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
    calendarDateUTC: `${calendarDate.getUTCFullYear()}-${String(calendarDate.getUTCMonth() + 1).padStart(2, '0')}-${String(calendarDate.getUTCDate()).padStart(2, '0')}`,
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
