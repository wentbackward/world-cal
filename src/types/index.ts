export interface HourRange {
  start: number;
  end: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AppState {
  primaryTz: string;
  secondaryTz: string[];
  coreHours: HourRange;
  extHours: HourRange;
  selection: TimeRange | null;
  viewDate: Date;
}

export type ShadingClass = 'core' | 'extended' | 'outside';

export interface TimeZoneEntry {
  tz: string;
  label: string;
  country: string;
  shortCode?: string;
  /** Additional names this zone can be found under (e.g. other countries it covers). */
  aliases?: string[];
}

export interface ExportLinks {
  ical: string;
  google: string;
  gmail: string;
  office: string;
}

export type Theme = Record<string, string>;
