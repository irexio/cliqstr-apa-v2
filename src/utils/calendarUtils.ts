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
 * @param eventTime - The event's UTC start time
 * @param calendarDate - The calendar cell date being checked
 * @param eventTimezone - The event's saved timezone (optional)
 * @returns true if the event falls on this calendar day in its timezone
 */
export const isSameDay = (
  eventTime: number | string | Date,
  calendarDate: Date,
  eventTimezone: string = 'America/Chicago'
): boolean => {
  const eventKey = toLocalDateKey(eventTime, eventTimezone);
  const calendarKey = toLocalDateKey(calendarDate, eventTimezone);
  
  console.log('[isSameDay] Comparing:', {
    eventKey,
    calendarKey,
    match: eventKey === calendarKey,
    eventTimezone,
  });
  
  return eventKey === calendarKey;
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
