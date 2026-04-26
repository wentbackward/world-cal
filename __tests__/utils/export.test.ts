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
});
