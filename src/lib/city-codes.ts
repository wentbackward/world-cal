import type { TimeZoneEntry } from '../types';
import { ALL_TIMEZONES } from './all-timezones';

// Map of short city codes to IANA timezone identifiers
export const CITY_CODE_MAP: Record<string, TimeZoneEntry> = {
  LON: { tz: 'Europe/London', label: 'London', shortCode: 'LON', country: 'United Kingdom' },
  L: { tz: 'Europe/London', label: 'London', shortCode: 'LON', country: 'United Kingdom' },
  HKG: { tz: 'Asia/Hong_Kong', label: 'Hong Kong', shortCode: 'HKG', country: 'Hong Kong' },
  HK: { tz: 'Asia/Hong_Kong', label: 'Hong Kong', shortCode: 'HKG', country: 'Hong Kong' },
  NYC: { tz: 'America/New_York', label: 'New York', shortCode: 'NYC', country: 'United States' },
  N: { tz: 'America/New_York', label: 'New York', shortCode: 'NYC', country: 'United States' },
  TOK: { tz: 'Asia/Tokyo', label: 'Tokyo', shortCode: 'TOK', country: 'Japan' },
  TYO: { tz: 'Asia/Tokyo', label: 'Tokyo', shortCode: 'TOK', country: 'Japan' },
  SYD: { tz: 'Australia/Sydney', label: 'Sydney', shortCode: 'SYD', country: 'Australia' },
  MEL: { tz: 'Australia/Melbourne', label: 'Melbourne', shortCode: 'MEL', country: 'Australia' },
  BNE: { tz: 'Australia/Brisbane', label: 'Brisbane', shortCode: 'BNE', country: 'Australia' },
  ADL: { tz: 'Australia/Adelaide', label: 'Adelaide', shortCode: 'ADL', country: 'Australia' },
  PER: { tz: 'Australia/Perth', label: 'Perth', shortCode: 'PER', country: 'Australia' },
  DRW: { tz: 'Australia/Darwin', label: 'Darwin', shortCode: 'DRW', country: 'Australia' },
  HBA: { tz: 'Australia/Hobart', label: 'Hobart', shortCode: 'HBA', country: 'Australia' },
  CBR: { tz: 'Australia/Sydney', label: 'Canberra', shortCode: 'CBR', country: 'Australia' },
  SFO: { tz: 'America/Los_Angeles', label: 'San Francisco', shortCode: 'SFO', country: 'United States' },
  LA: { tz: 'America/Los_Angeles', label: 'Los Angeles', shortCode: 'LA', country: 'United States' },
  DXB: { tz: 'Asia/Dubai', label: 'Dubai', shortCode: 'DXB', country: 'United Arab Emirates' },
  SIN: { tz: 'Asia/Singapore', label: 'Singapore', shortCode: 'SIN', country: 'Singapore' },
  SG: { tz: 'Asia/Singapore', label: 'Singapore', shortCode: 'SIN', country: 'Singapore' },
  BKK: { tz: 'Asia/Bangkok', label: 'Bangkok', shortCode: 'BKK', country: 'Thailand' },
  BOM: { tz: 'Asia/Kolkata', label: 'Mumbai', shortCode: 'BOM', country: 'India' },
  MUM: { tz: 'Asia/Kolkata', label: 'Mumbai', shortCode: 'BOM', country: 'India' },
  PAR: { tz: 'Europe/Paris', label: 'Paris', shortCode: 'PAR', country: 'France' },
  BER: { tz: 'Europe/Berlin', label: 'Berlin', shortCode: 'BER', country: 'Germany' },
  MAD: { tz: 'Europe/Madrid', label: 'Madrid', shortCode: 'MAD', country: 'Spain' },
  IST: { tz: 'Europe/Istanbul', label: 'Istanbul', shortCode: 'IST', country: 'Turkey' },
  JNB: { tz: 'Africa/Johannesburg', label: 'Johannesburg', shortCode: 'JNB', country: 'South Africa' },
  CAI: { tz: 'Africa/Cairo', label: 'Cairo', shortCode: 'CAI', country: 'Egypt' },
  SCL: { tz: 'America/Santiago', label: 'Santiago', shortCode: 'SCL', country: 'Chile' },
  BOG: { tz: 'America/Bogota', label: 'Bogota', shortCode: 'BOG', country: 'Colombia' },
  MEX: { tz: 'America/Mexico_City', label: 'Mexico City', shortCode: 'MEX', country: 'Mexico' },
  GRU: { tz: 'America/Sao_Paulo', label: 'Sao Paulo', shortCode: 'GRU', country: 'Brazil' },
  YVR: { tz: 'America/Vancouver', label: 'Vancouver', shortCode: 'YVR', country: 'Canada' },
  YYZ: { tz: 'America/Toronto', label: 'Toronto', shortCode: 'YYZ', country: 'Canada' },
  CHI: { tz: 'America/Chicago', label: 'Chicago', shortCode: 'CHI', country: 'United States' },
  DEN: { tz: 'America/Denver', label: 'Denver', shortCode: 'DEN', country: 'United States' },
  PHX: { tz: 'America/Phoenix', label: 'Phoenix', shortCode: 'PHX', country: 'United States' },
  SEA: { tz: 'America/Los_Angeles', label: 'Seattle', shortCode: 'SEA', country: 'United States' },
  MIA: { tz: 'America/New_York', label: 'Miami', shortCode: 'MIA', country: 'United States' },
  ATL: { tz: 'America/New_York', label: 'Atlanta', shortCode: 'ATL', country: 'United States' },
  DFW: { tz: 'America/Chicago', label: 'Dallas', shortCode: 'DFW', country: 'United States' },
  IAH: { tz: 'America/Chicago', label: 'Houston', shortCode: 'IAH', country: 'United States' },
  MSP: { tz: 'America/Chicago', label: 'Minneapolis', shortCode: 'MSP', country: 'United States' },
  DET: { tz: 'America/New_York', label: 'Detroit', shortCode: 'DET', country: 'United States' },
  CLT: { tz: 'America/New_York', label: 'Charlotte', shortCode: 'CLT', country: 'United States' },
  PDX: { tz: 'America/Los_Angeles', label: 'Portland', shortCode: 'PDX', country: 'United States' },
  HNL: { tz: 'Pacific/Honolulu', label: 'Honolulu', shortCode: 'HNL', country: 'United States' },
  AKL: { tz: 'Pacific/Auckland', label: 'Auckland', shortCode: 'AKL', country: 'New Zealand' },
  WLG: { tz: 'Pacific/Auckland', label: 'Wellington', shortCode: 'WLG', country: 'New Zealand' },
  NBO: { tz: 'Africa/Nairobi', label: 'Nairobi', shortCode: 'NBO', country: 'Kenya' },
  ADD: { tz: 'Africa/Addis_Ababa', label: 'Addis Ababa', shortCode: 'ADD', country: 'Ethiopia' },
  HAV: { tz: 'America/Havana', label: 'Havana', shortCode: 'HAV', country: 'Cuba' },
  LAP: { tz: 'America/La_Paz', label: 'La Paz', shortCode: 'LAP', country: 'Bolivia' },
  ICN: { tz: 'Asia/Seoul', label: 'Seoul', shortCode: 'ICN', country: 'South Korea' },
  PVG: { tz: 'Asia/Shanghai', label: 'Shanghai', shortCode: 'PVG', country: 'China' },
  PEK: { tz: 'Asia/Shanghai', label: 'Beijing', shortCode: 'PEK', country: 'China' },
  CGK: { tz: 'Asia/Jakarta', label: 'Jakarta', shortCode: 'CGK', country: 'Indonesia' },
  MNL: { tz: 'Asia/Manila', label: 'Manila', shortCode: 'MNL', country: 'Philippines' },
  KUL: { tz: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', shortCode: 'KUL', country: 'Malaysia' },
  KHI: { tz: 'Asia/Karachi', label: 'Karachi', shortCode: 'KHI', country: 'Pakistan' },
  DAC: { tz: 'Asia/Dhaka', label: 'Dhaka', shortCode: 'DAC', country: 'Bangladesh' },
  KTM: { tz: 'Asia/Kathmandu', label: 'Kathmandu', shortCode: 'KTM', country: 'Nepal' },
  THR: { tz: 'Asia/Tehran', label: 'Tehran', shortCode: 'THR', country: 'Iran' },
  RUH: { tz: 'Asia/Riyadh', label: 'Riyadh', shortCode: 'RUH', country: 'Saudi Arabia' },
  TLV: { tz: 'Asia/Jerusalem', label: 'Tel Aviv', shortCode: 'TLV', country: 'Israel' },
  MOW: { tz: 'Europe/Moscow', label: 'Moscow', shortCode: 'MOW', country: 'Russia' },
  AMS: { tz: 'Europe/Amsterdam', label: 'Amsterdam', shortCode: 'AMS', country: 'Netherlands' },
  ROM: { tz: 'Europe/Rome', label: 'Rome', shortCode: 'ROM', country: 'Italy' },
  ZRH: { tz: 'Europe/Zurich', label: 'Zurich', shortCode: 'ZRH', country: 'Switzerland' },
  STO: { tz: 'Europe/Stockholm', label: 'Stockholm', shortCode: 'STO', country: 'Sweden' },
  CPH: { tz: 'Europe/Copenhagen', label: 'Copenhagen', shortCode: 'CPH', country: 'Denmark' },
  OSL: { tz: 'Europe/Oslo', label: 'Oslo', shortCode: 'OSL', country: 'Norway' },
  HEL: { tz: 'Europe/Helsinki', label: 'Helsinki', shortCode: 'HEL', country: 'Finland' },
  WAW: { tz: 'Europe/Warsaw', label: 'Warsaw', shortCode: 'WAW', country: 'Poland' },
  ATH: { tz: 'Europe/Athens', label: 'Athens', shortCode: 'ATH', country: 'Greece' },
  LIS: { tz: 'Europe/Lisbon', label: 'Lisbon', shortCode: 'LIS', country: 'Portugal' },
  DUB: { tz: 'Europe/Dublin', label: 'Dublin', shortCode: 'DUB', country: 'Ireland' },
  BRU: { tz: 'Europe/Brussels', label: 'Brussels', shortCode: 'BRU', country: 'Belgium' },
  VIE: { tz: 'Europe/Vienna', label: 'Vienna', shortCode: 'VIE', country: 'Austria' },
  LOS: { tz: 'Africa/Lagos', label: 'Lagos', shortCode: 'LOS', country: 'Nigeria' },
  ACC: { tz: 'Africa/Accra', label: 'Accra', shortCode: 'ACC', country: 'Ghana' },
  CAS: { tz: 'Africa/Casablanca', label: 'Casablanca', shortCode: 'CAS', country: 'Morocco' },
  BUE: { tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', shortCode: 'BUE', country: 'Argentina' },
  LIM: { tz: 'America/Lima', label: 'Lima', shortCode: 'LIM', country: 'Peru' },
  ANC: { tz: 'America/Anchorage', label: 'Anchorage', shortCode: 'ANC', country: 'United States' },
  SAN: { tz: 'America/Los_Angeles', label: 'San Diego', shortCode: 'SAN', country: 'United States' },
  LAS: { tz: 'America/Los_Angeles', label: 'Las Vegas', shortCode: 'LAS', country: 'United States' },
  SJC: { tz: 'America/Los_Angeles', label: 'San Jose', shortCode: 'SJC', country: 'United States' },
  BOS: { tz: 'America/New_York', label: 'Boston', shortCode: 'BOS', country: 'United States' },
  WAS: { tz: 'America/New_York', label: 'Washington DC', shortCode: 'WAS', country: 'United States' },
  PHL: { tz: 'America/New_York', label: 'Philadelphia', shortCode: 'PHL', country: 'United States' },
  AUS: { tz: 'America/Chicago', label: 'Austin', shortCode: 'AUS', country: 'United States' },
  SLC: { tz: 'America/Denver', label: 'Salt Lake City', shortCode: 'SLC', country: 'United States' },
  DEL: { tz: 'Asia/Kolkata', label: 'Delhi', shortCode: 'DEL', country: 'India' },
  BLR: { tz: 'Asia/Kolkata', label: 'Bangalore', shortCode: 'BLR', country: 'India' },
  GVA: { tz: 'Europe/Zurich', label: 'Geneva', shortCode: 'GVA', country: 'Switzerland' },
  MUC: { tz: 'Europe/Berlin', label: 'Munich', shortCode: 'MUC', country: 'Germany' },
  BCN: { tz: 'Europe/Madrid', label: 'Barcelona', shortCode: 'BCN', country: 'Spain' },
  MIL: { tz: 'Europe/Rome', label: 'Milan', shortCode: 'MIL', country: 'Italy' },
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
    const region = parts.length > 1 ? parts[0]!.replace(/_/g, ' ') : '';
    return { tz: code, label, shortCode: upper, country: region };
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

// tz -> curated city names (San Francisco, Boston, Mumbai, ...) for zones the IANA
// name doesn't surface, so they're findable in the picker.
const CITY_ALIASES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const entry of Object.values(CITY_CODE_MAP)) {
    const list = (map[entry.tz] ??= []);
    if (!list.includes(entry.label)) list.push(entry.label);
  }
  return map;
})();

/**
 * Get all available timezone entries for the picker — the full IANA list (sorted by
 * country then city), enriched with curated city names as searchable aliases.
 */
export function getAllTimeZones(): TimeZoneEntry[] {
  return ALL_TIMEZONES.map((entry) => {
    const extra = (CITY_ALIASES[entry.tz] ?? []).filter((city) => city !== entry.label);
    if (extra.length === 0) return entry;
    return { ...entry, aliases: [...(entry.aliases ?? []), ...extra] };
  });
}
