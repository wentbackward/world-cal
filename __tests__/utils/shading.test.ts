import { describe, it, expect } from 'vitest';
import { getShading } from '../../src/utils/shading';

describe('getShading', () => {
  const coreHours = { start: 8, end: 18 };
  const extHours = { start: 6, end: 22 };

  it('returns "core" for hours within core range', () => {
    expect(getShading(8, coreHours, extHours)).toBe('core');
    expect(getShading(12, coreHours, extHours)).toBe('core');
    expect(getShading(17, coreHours, extHours)).toBe('core');
  });

  it('returns "extended" for hours within extended but not core range', () => {
    expect(getShading(6, coreHours, extHours)).toBe('extended');
    expect(getShading(7, coreHours, extHours)).toBe('extended');
    expect(getShading(18, coreHours, extHours)).toBe('extended');
    expect(getShading(21, coreHours, extHours)).toBe('extended');
  });

  it('returns "outside" for hours outside extended range', () => {
    expect(getShading(0, coreHours, extHours)).toBe('outside');
    expect(getShading(5, coreHours, extHours)).toBe('outside');
    expect(getShading(22, coreHours, extHours)).toBe('outside');
    expect(getShading(23, coreHours, extHours)).toBe('outside');
  });

  it('handles custom hour ranges', () => {
    const customCore = { start: 9, end: 17 };
    const customExt = { start: 7, end: 20 };
    
    expect(getShading(9, customCore, customExt)).toBe('core');
    expect(getShading(7, customCore, customExt)).toBe('extended');
    expect(getShading(5, customCore, customExt)).toBe('outside');
  });
});
