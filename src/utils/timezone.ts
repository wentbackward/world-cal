/**
 * Get the UTC offset in hours for a timezone at a given date.
 */
export function getTzOffset(tz: string, date: Date): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: tz });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Sort timezone list by UTC offset at a given date.
 */
export function sortTimezonesByOffset(tzs: string[], date: Date): string[] {
  return [...tzs].sort((a, b) => getTzOffset(a, date) - getTzOffset(b, date));
}

/**
 * Format time in a given timezone.
 */
export function formatTime(date: Date, tz: string, locale: string = 'en-US'): string {
  return date.toLocaleTimeString(locale, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date in a given timezone.
 */
export function formatDate(date: Date, tz: string, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the local hour in a given timezone for a Date.
 */
export function getLocalHour(date: Date, tz: string): number {
  return parseInt(date.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }), 10);
}

/**
 * Detect the user's browser timezone.
 */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Create a Date at a specific time in a given timezone.
 */
export function createDateAtTime(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  // Create a date string in the target timezone and parse it
  const ms = String(month + 1).padStart(2, '0');
  const ds = String(day).padStart(2, '0');
  const hs = String(hour).padStart(2, '0');
  const mins = String(minute).padStart(2, '0');

  // Get the UTC timestamp for this local time in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Use a binary search approach to find the correct UTC time
  // This is more reliable than string parsing
  let low = new Date(Date.UTC(year, month, day - 1, 0, 0, 0));
  let high = new Date(Date.UTC(year, month, day, 23, 59, 59));

  while (low <= high) {
    const mid = new Date((low.getTime() + high.getTime()) / 2);
    const formatted = formatter.format(mid);
    const expected = `${year}/${parseInt(ms)}/${parseInt(ds)} ${hs}:${mins}:00`;

    if (formatted === expected) {
      return mid;
    } else if (formatted < expected) {
      low = new Date(mid.getTime() + 1000);
    } else {
      high = new Date(mid.getTime() - 1000);
    }
  }

  return low;
}
