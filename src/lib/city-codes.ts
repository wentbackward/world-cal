import type { TimeZoneEntry } from '../types';

// Map of short city codes to IANA timezone identifiers
export const CITY_CODE_MAP: Record<string, TimeZoneEntry> = {
  LON: { tz: 'Europe/London', label: 'London', shortCode: 'LON' },
  L: { tz: 'Europe/London', label: 'London', shortCode: 'LON' },
  HKG: { tz: 'Asia/Hong_Kong', label: 'Hong Kong', shortCode: 'HKG' },
  HK: { tz: 'Asia/Hong_Kong', label: 'Hong Kong', shortCode: 'HKG' },
  NYC: { tz: 'America/New_York', label: 'New York', shortCode: 'NYC' },
  N: { tz: 'America/New_York', label: 'New York', shortCode: 'NYC' },
  TOK: { tz: 'Asia/Tokyo', label: 'Tokyo', shortCode: 'TOK' },
  TYO: { tz: 'Asia/Tokyo', label: 'Tokyo', shortCode: 'TOK' },
  SYD: { tz: 'Australia/Sydney', label: 'Sydney', shortCode: 'SYD' },
  SFO: { tz: 'America/Los_Angeles', label: 'San Francisco', shortCode: 'SFO' },
  LA: { tz: 'America/Los_Angeles', label: 'Los Angeles', shortCode: 'LA' },
  DXB: { tz: 'Asia/Dubai', label: 'Dubai', shortCode: 'DXB' },
  SIN: { tz: 'Asia/Singapore', label: 'Singapore', shortCode: 'SIN' },
  SG: { tz: 'Asia/Singapore', label: 'Singapore', shortCode: 'SIN' },
  BKK: { tz: 'Asia/Bangkok', label: 'Bangkok', shortCode: 'BKK' },
  BOM: { tz: 'Asia/Kolkata', label: 'Mumbai', shortCode: 'BOM' },
  MUM: { tz: 'Asia/Kolkata', label: 'Mumbai', shortCode: 'BOM' },
  PAR: { tz: 'Europe/Paris', label: 'Paris', shortCode: 'PAR' },
  BER: { tz: 'Europe/Berlin', label: 'Berlin', shortCode: 'BER' },
  MAD: { tz: 'Europe/Madrid', label: 'Madrid', shortCode: 'MAD' },
  IST: { tz: 'Europe/Istanbul', label: 'Istanbul', shortCode: 'IST' },
  JNB: { tz: 'Africa/Johannesburg', label: 'Johannesburg', shortCode: 'JNB' },
  CAI: { tz: 'Africa/Cairo', label: 'Cairo', shortCode: 'CAI' },
  SCL: { tz: 'America/Santiago', label: 'Santiago', shortCode: 'SCL' },
  BOG: { tz: 'America/Bogota', label: 'Bogota', shortCode: 'BOG' },
  MEX: { tz: 'America/Mexico_City', label: 'Mexico City', shortCode: 'MEX' },
  GRU: { tz: 'America/Sao_Paulo', label: 'Sao Paulo', shortCode: 'GRU' },
  YVR: { tz: 'America/Vancouver', label: 'Vancouver', shortCode: 'YVR' },
  YYZ: { tz: 'America/Toronto', label: 'Toronto', shortCode: 'YYZ' },
  CHI: { tz: 'America/Chicago', label: 'Chicago', shortCode: 'CHI' },
  DEN: { tz: 'America/Denver', label: 'Denver', shortCode: 'DEN' },
  PHX: { tz: 'America/Phoenix', label: 'Phoenix', shortCode: 'PHX' },
  SEA: { tz: 'America/Los_Angeles', label: 'Seattle', shortCode: 'SEA' },
  MIA: { tz: 'America/New_York', label: 'Miami', shortCode: 'MIA' },
  ATL: { tz: 'America/New_York', label: 'Atlanta', shortCode: 'ATL' },
  DFW: { tz: 'America/Chicago', label: 'Dallas', shortCode: 'DFW' },
  IAH: { tz: 'America/Chicago', label: 'Houston', shortCode: 'IAH' },
  MSP: { tz: 'America/Chicago', label: 'Minneapolis', shortCode: 'MSP' },
  DET: { tz: 'America/New_York', label: 'Detroit', shortCode: 'DET' },
  CLT: { tz: 'America/New_York', label: 'Charlotte', shortCode: 'CLT' },
  PDX: { tz: 'America/Los_Angeles', label: 'Portland', shortCode: 'PDX' },
  HNL: { tz: 'Pacific/Honolulu', label: 'Honolulu', shortCode: 'HNL' },
  AKL: { tz: 'Pacific/Auckland', label: 'Auckland', shortCode: 'AKL' },
  WLG: { tz: 'Pacific/Auckland', label: 'Wellington', shortCode: 'WLG' },
  NBO: { tz: 'Africa/Nairobi', label: 'Nairobi', shortCode: 'NBO' },
  ADD: { tz: 'Africa/Addis_Ababa', label: 'Addis Ababa', shortCode: 'ADD' },
  HAV: { tz: 'America/Havana', label: 'Havana', shortCode: 'HAV' },
  LAP: { tz: 'America/Los_Angeles', label: 'La Paz', shortCode: 'LAP' },
};

/**
 * Get timezone entry by short code or IANA identifier.
 */
export function getTimeZone(code: string): TimeZoneEntry | undefined {
  const upper = code.toUpperCase();
  const entry = CITY_CODE_MAP[upper];
  if (entry) return entry;

  // Try as IANA timezone
  if (isValidTimeZone(code)) {
    const parts = code.split('/');
    const lastPart = parts[parts.length - 1]!;
    const label = parts.length > 1 ? lastPart.replace(/_/g, ' ') : code;
    return { tz: code, label, shortCode: upper };
  }

  return undefined;
}

/**
 * Validate if a string is a valid IANA timezone identifier.
 */
function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all available timezone entries for the picker.
 */
export function getAllTimeZones(): TimeZoneEntry[] {
  const seen = new Set<string>();
  return Object.values(CITY_CODE_MAP)
    .filter((entry) => !seen.has(entry.tz) && seen.add(entry.tz))
    .sort((a, b) => a.label.localeCompare(b.label));
}
