import { describe, it, expect } from 'vitest';
import { parseUrlParams, buildUrlQuery, getDefaultConfig } from '../../src/utils/url';

describe('parseUrlParams', () => {
  it('parses timezone codes correctly', () => {
    const params = parseUrlParams('?tz=LON,HKG,NYC');
    expect(params.primaryTz).toBe('Europe/London');
    expect(params.secondaryTz).toEqual(['Asia/Hong_Kong', 'America/New_York']);
  });

  it('parses core hours correctly', () => {
    const params = parseUrlParams('?core=9,17');
    expect(params.coreHours).toEqual({ start: 9, end: 17 });
  });

  it('parses extended hours correctly', () => {
    const params = parseUrlParams('?ext=7,21');
    expect(params.extHours).toEqual({ start: 7, end: 21 });
  });

  it('handles empty URL', () => {
    const params = parseUrlParams('');
    expect(params.primaryTz).toBeUndefined();
    expect(params.secondaryTz).toBeUndefined();
  });

  it('ignores invalid timezone codes', () => {
    const params = parseUrlParams('?tz=INVALID');
    expect(params.primaryTz).toBeUndefined();
  });
});

describe('buildUrlQuery', () => {
  it('builds query with timezone codes', () => {
    const query = buildUrlQuery({
      primaryTz: 'Europe/London',
      secondaryTz: ['Asia/Hong_Kong', 'America/New_York'],
    });
    expect(query).toContain('LON');
    expect(query).toContain('HKG');
    expect(query).toContain('NYC');
  });

  it('omits default core/extended hours', () => {
    const query = buildUrlQuery({
      primaryTz: 'Europe/London',
      secondaryTz: [],
      coreHours: { start: 8, end: 18 },
      extHours: { start: 6, end: 22 },
    });
    expect(query).not.toContain('core=');
    expect(query).not.toContain('ext=');
  });

  it('includes non-default core/extended hours', () => {
    const query = buildUrlQuery({
      primaryTz: 'Europe/London',
      secondaryTz: [],
      coreHours: { start: 9, end: 17 },
      extHours: { start: 7, end: 21 },
    });
    expect(query).toContain('core=9,17');
    expect(query).toContain('ext=7,21');
  });
});

describe('getDefaultConfig', () => {
  it('returns default configuration', () => {
    const config = getDefaultConfig();
    expect(config.primaryTz).toBeDefined();
    expect(Array.isArray(config.secondaryTz)).toBe(true);
    expect(config.coreHours).toEqual({ start: 8, end: 18 });
    expect(config.extHours).toEqual({ start: 6, end: 22 });
  });

  it('detects browser timezone', () => {
    const config = getDefaultConfig();
    expect(typeof config.primaryTz).toBe('string');
    expect(config.primaryTz.length).toBeGreaterThan(0);
  });
});
