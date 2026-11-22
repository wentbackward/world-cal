import { describe, it, expect, vi, afterEach } from 'vitest';
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

  it('ignores sub-second fractions of the instant (floor to the truncated second)', () => {
    // formatToParts truncates to whole seconds; the .500 fraction must not leak into the offset.
    // New York is EDT (-4) in June.
    expect(getOffsetMs('America/New_York', new Date('2024-06-15T12:00:00.500Z'))).toBe(-4 * 60 * 60 * 1000);
    expect(getOffsetMs('America/New_York', new Date('2024-06-15T12:00:00.999Z'))).toBe(-4 * 60 * 60 * 1000);
  });

  it('returns the offset at local midnight (hour 24 normalized to 0)', () => {
    // 2024-06-15T04:00:00Z is exactly 00:00 EDT in New York — DST in effect.
    expect(getOffsetMs('America/New_York', new Date('2024-06-15T04:00:00Z'))).toBe(-4 * 60 * 60 * 1000);
    // 2024-01-15T05:00:00Z is exactly 00:00 EST in New York — winter, the other offset.
    expect(getOffsetMs('America/New_York', new Date('2024-01-15T05:00:00Z'))).toBe(-5 * 60 * 60 * 1000);
  });
});

describe('getOffsetMs — hourCycle h24', () => {
  // Structural reset: the Intl stub is un-stubbed in afterEach, not via
  // try/finally, so a failing assertion cannot leak the stub into later tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The real ICU emits hour "24" at local midnight under h24.
  function midnightParts(year = '2024', month = '06', day = '15') {
    return [
      { type: 'year', value: year },
      { type: 'month', value: month },
      { type: 'day', value: day },
      { type: 'hour', value: '24' },
      { type: 'minute', value: '00' },
      { type: 'second', value: '00' },
    ];
  }

  // `seen` is only used by the options-pinning test (it captures the options the
  // implementation requested, rather than asserting on behavior); it is absent
  // from the behavior-assertion stubbed tests, which assert on the offset alone.
  function stubIntlWithParts(parts: Array<{ type: string; value: string }>, seen?: Array<Record<string, unknown>>) {
    vi.stubGlobal('Intl', {
      ...Intl,
      DateTimeFormat: class {
        constructor(_local: unknown, options: Record<string, unknown>) {
          seen?.push(options);
        }
        formatToParts() {
          return parts;
        }
      },
    });
  }

  it('requests hourCycle "h24" with no hour12 override', () => {
    const seen: Array<Record<string, unknown>> = [];
    stubIntlWithParts(midnightParts(), seen);
    getOffsetMs('America/New_York', new Date('2024-06-15T04:00:00Z'));
    const options = seen[0];
    expect(options).toBeDefined();
    expect(options?.hourCycle).toBe('h24');
    expect(options?.hour12).toBeUndefined();
  });

  it('normalizes hour 24 to 00 when the ICU is on h24 (load-bearing at midnight)', () => {
    stubIntlWithParts(midnightParts());
    // 00:00 in New York (EDT, -4) 2024-06-15 is 04:00Z — the same instant as the
    // behavioral midnight test; the "24" emission must normalize, not leak as 24:00.
    expect(getOffsetMs('America/New_York', new Date('2024-06-15T04:00:00Z'))).toBe(-4 * 60 * 60 * 1000);
  });

  it('normalizes hour 24 to 00 at winter (EST) midnight too', () => {
    stubIntlWithParts(midnightParts('2024', '01', '15'));
    // 00:00 in New York (EST, -5) 2024-01-15 is 05:00Z — the same winter instant as
    // the behavioral EST midnight test; the "24" emission must normalize, not leak.
    expect(getOffsetMs('America/New_York', new Date('2024-01-15T05:00:00Z'))).toBe(-5 * 60 * 60 * 1000);
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

  it('returns 0 at local midnight in a DST-observing zone (hour 24 with EDT)', () => {
    // 2024-06-15T04:00:00Z is exactly 00:00 EDT (UTC-4) in New York — DST in effect.
    expect(getLocalHour(new Date('2024-06-15T04:00:00Z'), 'America/New_York')).toBe(0);
  });
});

describe('hour part guard', () => {
  // Structural reset: the Intl stub is un-stubbed in afterEach, not via
  // try/finally, so a failing assertion cannot leak the stub into later tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when formatToParts omits the hour part', () => {
    vi.stubGlobal('Intl', {
      ...Intl,
      DateTimeFormat: class {
        formatToParts() {
          return [
            { type: 'year', value: '2024' },
            { type: 'month', value: '06' },
            { type: 'day', value: '15' },
            { type: 'minute', value: '00' },
            { type: 'second', value: '00' },
          ];
        }
      },
    });
    expect(() => getLocalHour(new Date('2024-06-15T04:00:00Z'), 'America/New_York')).toThrow(/hour/);
    expect(() => getOffsetMs('America/New_York', new Date('2024-06-15T12:00:00Z'))).toThrow(/hour/);
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
