import { describe, it, expect } from 'vitest';
import { getTzOffset, sortTimezonesByOffset, formatTime, getLocalTimezone, createDateAtTime, getOffsetLabel } from '../../src/utils/timezone';

describe('getTzOffset', () => {
  it('returns correct UTC offset for known timezones', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    
    // London is BST (+1) in June
    const londonOffset = getTzOffset('Europe/London', date);
    expect(londonOffset).toBeCloseTo(1, 0);
    
    // Hong Kong is always +8
    const hkOffset = getTzOffset('Asia/Hong_Kong', date);
    expect(hkOffset).toBeCloseTo(8, 0);
    
    // New York is EDT (-4) in June
    const nyOffset = getTzOffset('America/New_York', date);
    expect(nyOffset).toBeCloseTo(-4, 0);
  });
});

describe('sortTimezonesByOffset', () => {
  it('sorts timezones by UTC offset', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const timezones = ['Asia/Hong_Kong', 'Europe/London', 'America/New_York'];
    const sorted = sortTimezonesByOffset(timezones, date);
    
    expect(sorted[0]).toBe('America/New_York');
    expect(sorted[1]).toBe('Europe/London');
    expect(sorted[2]).toBe('Asia/Hong_Kong');
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
