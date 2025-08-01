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
 * Get Pacific Time for a specific date
 * Note: This returns the provided date, but formatting functions handle timezone conversion
 */
export function getPacificTime(date: Date): Date {
  return date;
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
 * Get the next Pacific Time midnight
 */
export function getNextPacificMidnight(): Date {
  const now = getCurrentPacificTime();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Convert back to local time for the timezone
  const utcTime = tomorrow.getTime() + (tomorrow.getTimezoneOffset() * 60000);
  const pacificOffset = getPacificTimezoneOffset();
  return new Date(utcTime + (pacificOffset * 60000));
}

/**
 * Get Pacific timezone offset in minutes (accounting for DST)
 */
function getPacificTimezoneOffset(): number {
  const now = new Date();
  // Create a date in Pacific Time
  const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const localTime = new Date(now.toLocaleString());
  
  // Calculate offset in minutes
  return (localTime.getTime() - pacificTime.getTime()) / (1000 * 60);
}

/**
 * Calculate time remaining until next Pacific midnight
 */
export function getTimeUntilNextMidnight(): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const now = getCurrentPacificTime();
  const nextMidnight = getNextPacificMidnight();
  const diffMs = nextMidnight.getTime() - now.getTime();
  
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
}

/**
 * Check if a Pacific Time date is today
 */
export function isPacificToday(date: Date): boolean {
  const now = new Date();
  const todayPT = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const datePT = date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return todayPT === datePT;
}

/**
 * Check if a Pacific Time date is in the future
 */
export function isPacificFuture(date: Date): boolean {
  const now = new Date();
  const todayPT = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const datePT = date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return datePT > todayPT;
}

/**
 * Check if a date string (YYYY-MM-DD) represents today in Pacific Time
 */
export function isPacificTodayString(dateString: string): boolean {
  const now = new Date();
  const todayPT = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return todayPT === dateString;
}

/**
 * Check if a date string (YYYY-MM-DD) represents a future date in Pacific Time
 */
export function isPacificFutureString(dateString: string): boolean {
  const now = new Date();
  const todayPT = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return dateString > todayPT;
}

/**
 * Get the maximum selectable Pacific Time date (today)
 */
export function getMaxPacificDate(): Date {
  const now = new Date();
  // Get today's date in Pacific Time
  const pacificDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const [year, month, day] = pacificDateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
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