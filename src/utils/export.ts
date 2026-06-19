import type { ExportLinks, TimeRange } from '../types';


const DEFAULT_DESCRIPTION = 'Created with World-Cal';

/**
 * Generate export links for a given time selection.
 */
export function generateExportLinks(
  selection: TimeRange,
  primaryTz: string,
  title: string = 'Meeting',
  description: string = DEFAULT_DESCRIPTION
): ExportLinks {
  const startFormatted = formatDateForExport(selection.start);
  const endFormatted = formatDateForExport(selection.end);
  const details = description || DEFAULT_DESCRIPTION;

  return {
    ical: generateICalLink(selection, primaryTz, title, details),
    google: generateGoogleLink(startFormatted, endFormatted, title, details),
    gmail: generateGmailLink(title, details),
    // Outlook's deeplink expects ISO 8601 datetimes, not the compact iCal format.
    office: generateOfficeLink(formatDateISO(selection.start), formatDateISO(selection.end), title, details),
  };
}

/**
 * Generate iCal (.ics) file content as a data URL.
 */
function generateICalLink(selection: TimeRange, tz: string, title: string, description: string): string {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//World-Cal//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForICal(selection.start)}`,
    `DTEND:${formatDateForICal(selection.end)}`,
    `SUMMARY:${escapeICal(title)}`,
    `DESCRIPTION:${escapeICal(description)}`,
    `TZID:${tz}`,
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf8;base64,${btoa(unescape(encodeURIComponent(icsContent)))}`;
}

/**
 * Generate Google Calendar link.
 */
function generateGoogleLink(start: string, end: string, title: string, description: string): string {
  const encodedTitle = encodeURIComponent(title);
  const encodedDetails = encodeURIComponent(description);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${start}/${end}&details=${encodedDetails}`;
}

/**
 * Generate Gmail compose link with the meeting details in the body.
 */
function generateGmailLink(title: string, description: string): string {
  const encodedSubject = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(description);
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Generate Microsoft Outlook link.
 */
function generateOfficeLink(startIso: string, endIso: string, title: string, description: string): string {
  const encodedSubject = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(description);
  return `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodedSubject}&body=${encodedBody}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}`;
}

/**
 * Format date for export links (YYYYMMDDTHHMMSSZ).
 */
function formatDateForExport(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ).
 */
function formatDateForICal(date: Date): string {
  return formatDateForExport(date);
}

/**
 * Format date as ISO 8601 with a trailing Z and no milliseconds (2024-06-15T14:00:00Z).
 */
function formatDateISO(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Escape special characters in iCal strings.
 */
function escapeICal(str: string): string {
  return str.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
}
