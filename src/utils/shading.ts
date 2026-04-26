import type { HourRange, ShadingClass } from '../types';

/**
 * Determine the shading class for a given hour in a timezone's local time.
 *
 * Logic:
 * - Core hours: time is within core range
 * - Extended hours: time is within extended range but NOT within core range
 * - Outside hours: time is outside the extended range
 */
export function getShading(hour: number, coreHours: HourRange, extHours: HourRange): ShadingClass {
  if (hour >= coreHours.start && hour < coreHours.end) {
    return 'core';
  }
  if (hour >= extHours.start && hour < extHours.end) {
    return 'extended';
  }
  return 'outside';
}
