import type { ExportLinks, TimeRange } from '../types';


/**
 * Generate export links for a given time selection.
 */
export function generateExportLinks(selection: TimeRange, primaryTz: string, title: string = 'Meeting'): ExportLinks {
  const startFormatted = formatDateForExport(selection.start);
  const endFormatted = formatDateForExport(selection.end);

  return {
    ical: generateICalLink(selection, primaryTz, title),
    google: generateGoogleLink(startFormatted, endFormatted, title),
    gmail: generateGmailLink(startFormatted, endFormatted, title),
    office: generateOfficeLink(startFormatted, endFormatted, title),
  };
}

/**
 * Generate iCal (.ics) file content as a data URL.
 */
function generateICalLink(selection: TimeRange, tz: string, title: string): string {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//World-Cal//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForICal(selection.start)}`,
    `DTEND:${formatDateForICal(selection.end)}`,
    `SUMMARY:${escapeICal(title)}`,
    'DESCRIPTION:Created with World-Cal',
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
function generateGoogleLink(start: string, end: string, title: string): string {
  const encodedTitle = encodeURIComponent(title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${start}/${end}&sprop=&sprop=name:`;
}

/**
 * Generate Gmail link with event details.
 */
function generateGmailLink(start: string, end: string, title: string): string {
  const encodedSubject = encodeURIComponent(title);
  const body = `Scheduled time: ${start} to ${end}`;
  const encodedBody = encodeURIComponent(body);
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Generate Microsoft Outlook link.
 */
function generateOfficeLink(start: string, end: string, title: string): string {
  const encodedSubject = encodeURIComponent(title);
  return `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodedSubject}&startdt=${start}&enddt=${end}`;
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
 * Escape special characters in iCal strings.
 */
function escapeICal(str: string): string {
  return str.replace(/[\\\,;]/g, '\\$&');
}
