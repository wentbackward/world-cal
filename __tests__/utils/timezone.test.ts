import { describe, it, expect } from 'vitest';
import { getTzOffset, sortTimezonesByOffset, formatTime, getLocalTimezone } from '../../src/utils/timezone';

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
