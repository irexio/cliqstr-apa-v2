/**
 * Calendar utilities for timezone-aware date comparisons
 */

/**
 * Convert a timestamp to a local date key string using America/Chicago timezone
 * This ensures consistent date comparison across timezones
 */
export const toLocalDateKey = (timestamp: number | string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
  });
};

/**
 * Check if an event's timestamp falls on the same day as a calendar cell date
 * Uses timezone-aware comparison to handle cross-timezone scenarios
 */
export const isSameDay = (eventTime: number | string, calendarDate: Date): boolean => {
  return toLocalDateKey(eventTime) === toLocalDateKey(calendarDate);
};

/**
 * Get all events that occur on a specific calendar day
 */
export const getEventsForDay = (
  events: Array<{ startAt: number; [key: string]: any }>,
  dayDate: Date
): Array<any> => {
  return events.filter((event) => isSameDay(event.startAt, dayDate));
};
