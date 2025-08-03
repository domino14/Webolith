/**
 * Utilities for handling Pacific Time (PT) operations
 * Automatically handles PST/PDT transitions
 */

/**
 * Get current Pacific Time as a Date object
 * Note: This returns the current time, but formatting functions handle timezone conversion
 */
export function getCurrentPacificTime(): Date {
  return new Date();
}

/**
 * Format Pacific Time as a readable string
 */
export function formatPacificTime(date?: Date): string {
  const targetDate = date || new Date();
  
  // Use Intl.DateTimeFormat for more explicit timezone handling
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return formatter.format(targetDate);
}

/**
 * Get Pacific Time date string in YYYY-MM-DD format
 */
export function getPacificDateString(date?: Date): string {
  const targetDate = date || new Date();
  return targetDate.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // en-CA gives YYYY-MM-DD format
}

/**
 * Calculate time remaining until next Pacific midnight
 */
export function getTimeUntilNextMidnight(): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const now = new Date();
  
  // Get the current time in Pacific timezone as a string
  const pacificTimeStr = now.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse to get hour and minute
  const [, timePart] = pacificTimeStr.split(', ');
  const [currentHour, currentMinute] = timePart.split(':').map(Number);
  
  // Calculate minutes until midnight
  const minutesInDay = 24 * 60;
  const currentMinutes = currentHour * 60 + currentMinute;
  const minutesUntilMidnight = minutesInDay - currentMinutes;
  
  const hours = Math.floor(minutesUntilMidnight / 60);
  const minutes = minutesUntilMidnight % 60;
  
  return { hours, minutes, totalMinutes: minutesUntilMidnight };
}

/**
 * Get the maximum selectable Pacific Time date (today)
 */
export function getMaxPacificDate(): Date {
  const now = new Date();
  const year = parseInt(now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric' }));
  const month = parseInt(now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric' }));
  const day = parseInt(now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: 'numeric' }));
  return new Date(year, month - 1, day, 12, 0, 0); // noon to avoid DST issues
}

/**
 * Format countdown time as "Xh Ym" or "Ym" if less than an hour
 */
export function formatCountdown(hours: number, minutes: number): string {
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}