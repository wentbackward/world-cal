import { describe, it, expect } from 'vitest';
import {
  getOffsetMs,
  formatTime,
  getLocalTimezone,
  createDateAtTime,
  getOffsetLabel,
  getLocalHour,
} from '../../src/utils/timezone';

describe('getOffsetMs', () => {
  it('returns the offset in milliseconds for DST-observing zones, summer vs winter', () => {
    const summer = new Date('2024-06-15T12:00:00Z');
    const winter = new Date('2024-01-15T12:00:00Z');

    // New York: EDT (-4) in June, EST (-5) in January
    expect(getOffsetMs('America/New_York', summer)).toBe(-4 * 60 * 60 * 1000);
    expect(getOffsetMs('America/New_York', winter)).toBe(-5 * 60 * 60 * 1000);

    // London: BST (+1) in June, GMT (0) in January
    expect(getOffsetMs('Europe/London', summer)).toBe(1 * 60 * 60 * 1000);
    expect(getOffsetMs('Europe/London', winter)).toBe(0);
  });

  it('returns the offset in milliseconds for fixed-offset zones', () => {
    const date = new Date('2024-06-15T12:00:00Z');

    // Hong Kong is always +8
    expect(getOffsetMs('Asia/Hong_Kong', date)).toBe(8 * 60 * 60 * 1000);
  });

  it('returns the offset in milliseconds for half-hour zones', () => {
    const date = new Date('2024-06-15T12:00:00Z');

    // Kolkata is +5:30 year-round
    expect(getOffsetMs('Asia/Kolkata', date)).toBe(5.5 * 60 * 60 * 1000);

    // Adelaide is ACST (+9:30) in June
    expect(getOffsetMs('Australia/Adelaide', date)).toBe(9.5 * 60 * 60 * 1000);
  });

  it('returns the offset in milliseconds for quarter-hour zones', () => {
    // Kathmandu is +5:45 year-round
    expect(getOffsetMs('Asia/Kathmandu', new Date('2024-06-15T12:00:00Z'))).toBe(5.75 * 60 * 60 * 1000);
  });
});

describe('getLocalHour', () => {
  it('returns the local hour for a known instant', () => {
    // 12:00 UTC in June → 13:00 BST in London
    expect(getLocalHour(new Date('2024-06-15T12:00:00Z'), 'Europe/London')).toBe(13);
  });

  it('returns 0 at local midnight (hour 24 normalized to 0)', () => {
    // 2024-06-14T14:00:00Z is 00:00 in Sydney (AEST, UTC+10)
    expect(getLocalHour(new Date('2024-06-14T14:00:00Z'), 'Australia/Sydney')).toBe(0);
  });
});

describe('formatTime', () => {
  it('formats time correctly in different timezones', () => {
    const date = new Date('2024-06-15T12:00:00Z');

    const londonTime = formatTime(date, 'Europe/London');
    expect(londonTime).toContain('1'); // 1:00 PM

    const hkTime = formatTime(date, 'Asia/Hong_Kong');
    expect(hkTime).toContain('8'); // 8:00 PM

    const nyTime = formatTime(date, 'America/New_York');
    expect(nyTime).toContain('8'); // 8:00 AM
  });
});

describe('getLocalTimezone', () => {
  it('returns a valid timezone string', () => {
    const tz = getLocalTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe('getOffsetLabel', () => {
  const date = new Date('2024-06-15T12:00:00Z');

  it('formats whole-hour offsets', () => {
    expect(getOffsetLabel('Asia/Hong_Kong', date)).toBe('UTC+8');
    expect(getOffsetLabel('America/New_York', date)).toBe('UTC-4'); // EDT in June
  });

  it('formats half-hour offsets', () => {
    expect(getOffsetLabel('Asia/Kolkata', date)).toBe('UTC+5:30');
    expect(getOffsetLabel('Australia/Adelaide', date)).toBe('UTC+9:30'); // ACST in June
  });

  it('formats quarter-hour offsets', () => {
    expect(getOffsetLabel('Asia/Kathmandu', date)).toBe('UTC+5:45');
  });
});

describe('createDateAtTime', () => {
  it('builds the correct UTC instant for a wall-clock time in a DST zone', () => {
    // 9:00 in London during BST (+1) is 08:00 UTC.
    const d = createDateAtTime(2024, 5, 15, 9, 0, 'Europe/London');
    expect(d.toISOString()).toBe('2024-06-15T08:00:00.000Z');
  });

  it('builds the correct UTC instant for a fixed-offset zone', () => {
    // 9:00 in Hong Kong (+8) is 01:00 UTC.
    const d = createDateAtTime(2024, 5, 15, 9, 0, 'Asia/Hong_Kong');
    expect(d.toISOString()).toBe('2024-06-15T01:00:00.000Z');
  });

  it('reads back the same wall-clock hour in the target timezone', () => {
    const d = createDateAtTime(2024, 0, 15, 14, 0, 'America/New_York');
    const hour = Number(d.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
    expect(hour).toBe(14);
  });
});
