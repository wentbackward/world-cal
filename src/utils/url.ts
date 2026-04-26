import type { HourRange } from '../types';
import { CITY_CODE_MAP, getTimeZone } from '../lib/city-codes';

const DEFAULT_CORE: HourRange = { start: 8, end: 18 };
const DEFAULT_EXT: HourRange = { start: 6, end: 22 };

interface UrlParams {
  primaryTz?: string;
  secondaryTz: string[];
  coreHours?: HourRange;
  extHours?: HourRange;
}

/**
 * Parse URL query parameters into timezone configuration.
 */
export function parseUrlParams(search: string = window.location.search): Partial<UrlParams> {
  const params: Partial<UrlParams> = {};
  const urlParams = new URLSearchParams(search);

  // Timezone codes (comma-separated)
  const tzParam = urlParams.get('tz') || urlParams.get('');
  if (tzParam) {
    const codes = tzParam.split(',').map((c) => c.trim()).filter(Boolean);
    if (codes.length > 0) {
      const entries = codes.map((code) => getTimeZone(code)).filter((e): e is NonNullable<typeof e> => !!e);
      if (entries.length > 0) {
        params.primaryTz = entries[0]?.tz;
        params.secondaryTz = entries.slice(1).map((e) => e.tz);
      }
    }
  }

  // Core hours
  const coreParam = urlParams.get('core');
  if (coreParam) {
    const parts = coreParam.split(',').map(Number);
    if (parts.length === 2 && Number.isFinite(parts[0]!) && Number.isFinite(parts[1]!)) {
      params.coreHours = { start: parts[0]!, end: parts[1]! };
    }
  }

  // Extended hours
  const extParam = urlParams.get('ext');
  if (extParam) {
    const parts = extParam.split(',').map(Number);
    if (parts.length === 2 && Number.isFinite(parts[0]!) && Number.isFinite(parts[1]!)) {
      params.extHours = { start: parts[0]!, end: parts[1]! };
    }
  }

  return params;
}

/**
 * Build URL query string from timezone configuration.
 */
export function buildUrlQuery(params: {
  primaryTz: string;
  secondaryTz: string[];
  coreHours?: HourRange;
  extHours?: HourRange;
}): string {
  const segments: string[] = [];

  // Timezone codes
  const allTz = [params.primaryTz, ...params.secondaryTz];
  const codes = allTz
    .map((tz) => {
      // Reverse lookup: find short code
      for (const [, entry] of Object.entries(CITY_CODE_MAP)) {
        if (entry.tz === tz) return entry.shortCode;
      }
      return tz;
    })
    .join(',');
  segments.push(codes);

  // Core hours (only if non-default)
  if (params.coreHours && (!areEqualRanges(params.coreHours, DEFAULT_CORE))) {
    segments.push(`core=${params.coreHours.start},${params.coreHours.end}`);
  }

  // Extended hours (only if non-default)
  if (params.extHours && (!areEqualRanges(params.extHours, DEFAULT_EXT))) {
    segments.push(`ext=${params.extHours.start},${params.extHours.end}`);
  }

  return '?' + segments.join('&');
}

/**
 * Update the URL without reloading the page.
 */
export function syncUrl(query: string): void {
  const baseUrl = window.location.origin + window.location.pathname;
  const newUrl = baseUrl + query;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Get the default timezone configuration.
 */
export function getDefaultConfig(): {
  primaryTz: string;
  secondaryTz: string[];
  coreHours: HourRange;
  extHours: HourRange;
} {
  return {
    primaryTz: getLocalTimezone(),
    secondaryTz: ['Europe/London', 'Asia/Hong_Kong'],
    coreHours: { ...DEFAULT_CORE },
    extHours: { ...DEFAULT_EXT },
  };
}

/**
 * Detect the user's browser timezone.
 */
function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function areEqualRanges(a: HourRange, b: HourRange): boolean {
  return a.start === b.start && a.end === b.end;
}
