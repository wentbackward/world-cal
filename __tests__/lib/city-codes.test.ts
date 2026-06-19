import { describe, it, expect } from 'vitest';
import { getAllTimeZones, getTimeZone } from '../../src/lib/city-codes';

describe('getAllTimeZones', () => {
  const all = getAllTimeZones();

  it('returns a comprehensive list', () => {
    expect(all.length).toBeGreaterThan(300);
  });

  it('includes previously-missing countries like Vietnam', () => {
    const vn = all.find((e) => e.tz === 'Asia/Ho_Chi_Minh');
    expect(vn).toBeDefined();
    expect(vn?.country).toBe('Vietnam');
  });

  it('has a country for every entry', () => {
    expect(all.every((e) => e.country.length > 0)).toBe(true);
  });

  it('is sorted by country then city', () => {
    for (let i = 1; i < all.length; i++) {
      const prev = all[i - 1]!;
      const cur = all[i]!;
      const order = prev.country.localeCompare(cur.country) || prev.label.localeCompare(cur.label);
      expect(order).toBeLessThanOrEqual(0);
    }
  });
});

describe('getTimeZone', () => {
  it('resolves a full IANA name not in the short-code map', () => {
    expect(getTimeZone('Asia/Ho_Chi_Minh')?.tz).toBe('Asia/Ho_Chi_Minh');
  });
});
