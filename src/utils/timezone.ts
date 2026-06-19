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
 * Format a timezone's UTC offset for display, e.g. "UTC+1", "UTC-4", "UTC+9:30".
 * Handles half-hour and quarter-hour zones (Adelaide, Mumbai, Kathmandu, ...).
 */
export function getOffsetLabel(tz: string, date: Date = new Date()): string {
  const hours = getTzOffset(tz, date);
  const sign = hours < 0 ? '-' : '+';
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return m ? `UTC${sign}${h}:${String(m).padStart(2, '0')}` : `UTC${sign}${h}`;
}

/**
 * Friendly short label for a timezone, e.g. "Asia/Hong_Kong" -> "Hong Kong".
 */
export function getShortTzLabel(tz: string): string {
  const parts = tz.split('/');
  const last = parts[parts.length - 1] ?? tz;
  return parts.length > 1 ? last.replace(/_/g, ' ') : tz;
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
 * Get a timezone's offset from UTC, in milliseconds (tz - UTC), at a given instant.
 * Uses formatToParts so it does not depend on Date being able to parse a locale string.
 */
function getTzOffsetMs(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // Intl can emit hour "24" for midnight; normalize to 0.
  const hour = map.hour === '24' ? '00' : map.hour!;

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second)
  );
  return asUtc - date.getTime();
}

/**
 * Create a Date for a specific wall-clock time in a given timezone.
 * Returns the UTC instant at which that timezone's local clock reads the given values.
 */
export function createDateAtTime(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  // First guess: treat the wall-clock time as if it were UTC, then correct by the offset.
  const guess = Date.UTC(year, month, day, hour, minute, 0);
  const offset = getTzOffsetMs(tz, new Date(guess));
  let ts = guess - offset;

  // Re-check the offset at the corrected instant. Around DST transitions the offset
  // can differ; a second pass converges to the correct wall-clock time.
  const offset2 = getTzOffsetMs(tz, new Date(ts));
  if (offset2 !== offset) {
    ts = guess - offset2;
  }

  return new Date(ts);
}
