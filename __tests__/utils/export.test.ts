import { describe, it, expect } from 'vitest';
import { generateExportLinks } from '../../src/utils/export';

describe('generateExportLinks', () => {
  const selection = {
    start: new Date('2024-06-15T14:00:00Z'),
    end: new Date('2024-06-15T15:00:00Z'),
  };
  const primaryTz = 'Europe/London';

  it('generates iCal link', () => {
    const links = generateExportLinks(selection, primaryTz);
    expect(links.ical).toContain('data:text/calendar');
    expect(links.ical).toContain('base64,');
  });

  it('generates Google Calendar link', () => {
    const links = generateExportLinks(selection, primaryTz);
    expect(links.google).toContain('calendar.google.com');
    expect(links.google).toContain('action=TEMPLATE');
    expect(links.google).toContain('Meeting');
  });

  it('generates Gmail link', () => {
    const links = generateExportLinks(selection, primaryTz);
    expect(links.gmail).toContain('mail.google.com');
    expect(links.gmail).toContain('Meeting');
  });

  it('generates Office.com link', () => {
    const links = generateExportLinks(selection, primaryTz);
    expect(links.office).toContain('outlook.office.com');
    expect(links.office).toContain('Meeting');
  });

  it('uses custom title', () => {
    const links = generateExportLinks(selection, primaryTz, 'Client Call');
    expect(links.google).toContain('Client%20Call');
    expect(links.gmail).toContain('Client%20Call');
    expect(links.office).toContain('Client%20Call');
  });

  it('injects the description into google, gmail, and outlook', () => {
    const links = generateExportLinks(selection, primaryTz, 'Sync', 'Created with World-Cal');
    expect(links.google).toContain('details=Created%20with%20World-Cal');
    expect(links.gmail).toContain('body=Created%20with%20World-Cal');
    expect(links.office).toContain('body=Created%20with%20World-Cal');
  });
});

/** Decode the iCal content embedded in the data: URL returned by generateExportLinks. */
function decodeICal(dataUrl: string): string {
  const b64 = dataUrl.split('base64,')[1];
  if (!b64) throw new Error('not an iCal data URL');
  return decodeURIComponent(escape(atob(b64)));
}

/** Unfold a folded iCal stream: a CRLF followed by one leading space is a fold. */
function unfoldICal(content: string): string {
  return content.replace(/\r\n /g, '');
}

function octets(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

describe('iCal content line folding', () => {
  const selection = {
    start: new Date('2024-06-15T14:00:00Z'),
    end: new Date('2024-06-15T15:00:00Z'),
  };

  it('folds a long SUMMARY so every line is at most 75 octets', () => {
    const longTitle = 'Quarterly planning sync — '.repeat(8); // > 75 octets
    const links = generateExportLinks(selection, 'Europe/London', longTitle);
    const content = decodeICal(links.ical);
    const lines = content.split('\r\n');
    const summaryLines = lines.filter((l) => !l.startsWith(' ') && l.startsWith('SUMMARY:'));
    expect(summaryLines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(octets(line), `line exceeds 75 octets: ${JSON.stringify(line)}`).toBeLessThanOrEqual(75);
    }
    // Unfolding restores the full, escaped title.
    const unfolded = unfoldICal(content);
    expect(unfolded).toContain(`SUMMARY:${escapeICalForTest(longTitle)}`);
  });

  it('folds a long DESCRIPTION so every line is at most 75 octets', () => {
    const longDescription = 'Renewals, with room for a breather and some long words — '.repeat(6);
    const links = generateExportLinks(selection, 'Europe/London', 'Meeting', longDescription);
    const content = decodeICal(links.ical);
    for (const line of content.split('\r\n')) {
      expect(octets(line), `line exceeds 75 octets: ${JSON.stringify(line)}`).toBeLessThanOrEqual(75);
    }
    const unfolded = unfoldICal(content);
    expect(unfolded).toContain(`DESCRIPTION:${escapeICalForTest(longDescription)}`);
  });

  it('uses CRLF line endings and folds at code-point boundaries (multi-byte UTF-8)', () => {
    // 61 non-ASCII characters ('é', U+00E9 — 2 bytes each in UTF-8): 122 octets.
    // Folding must not split a multi-byte sequence across lines.
    const longTitle = 'é'.repeat(61); // 122 octets
    const links = generateExportLinks(selection, 'Europe/London', longTitle);
    const content = decodeICal(links.ical);
    expect(content).toContain('\r\n');
    // Every line end is a CRLF: no bare LF remains.
    expect(content.replace(/\r\n/g, '')).not.toContain('\n');
    const lines = content.split('\r\n');
    for (const line of lines) {
      expect(octets(line)).toBeLessThanOrEqual(75);
    }
    const unfolded = unfoldICal(content);
    expect(unfolded).toContain(`SUMMARY:${escapeICalForTest(longTitle)}`);
  });

  it('keeps escapeICal behavior: commas, semicolons, backslashes and newlines are escaped', () => {
    const tricky = 'a,b;c\\d\ne';
    const links = generateExportLinks(selection, 'Europe/London', tricky);
    const content = decodeICal(links.ical);
    expect(unfoldICal(content)).toContain('SUMMARY:a\\,b\\;c\\\\d\\ne');
  });
});

// Mirror of the private escapeICal in src/utils/export.ts (lines ~137-141): commas, semicolons, backslashes escaped, newlines to \n. Only this mirror must track it.
function escapeICalForTest(str: string): string {
  return str.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
}
