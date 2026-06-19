import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { generateExportLinks } from '../utils/export';
import { formatTime, formatDate, getShortTzLabel } from '../utils/timezone';
import { copyToClipboard } from '../utils/clipboard';

export default function SelectionPanel() {
  const { state, setSelection } = useAppState();
  const selection = state.selection;
  const [subject, setSubject] = useState('Meeting');
  const [copied, setCopied] = useState(false);

  if (!selection) return null;

  const allTimezones = [state.primaryTz, ...state.secondaryTz];

  // Per-zone formatted parts, used for the display, the copy text, and the export description.
  const rows = allTimezones.map((tz) => {
    const startDate = formatDate(selection.start, tz);
    const endDate = formatDate(selection.end, tz);
    const startTime = formatTime(selection.start, tz);
    const endTime = formatTime(selection.end, tz);
    // Show the end date explicitly only when the range crosses midnight in this zone.
    const range = startDate === endDate ? `${startTime} – ${endTime}` : `${startTime} – ${endTime} (${endDate})`;
    return { tz, startDate, range };
  });

  const timesText = rows.map((r) => `${getShortTzLabel(r.tz)}: ${r.startDate}, ${r.range}`).join('\n');

  // Calendar description: the times in every zone, plus a link back to this exact view.
  const description = `${timesText}\n\nCreated with World-Cal — ${window.location.href}`;

  const links = generateExportLinks(selection, state.primaryTz, subject.trim() || 'Meeting', description);

  const handleCopy = async () => {
    await copyToClipboard(timesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="selection-panel">
      <div className="selection-info">
        <div className="selection-header">
          <div className="selection-heading">Selected time</div>
          <button className="btn btn--copy" onClick={handleCopy} title="Copy times to clipboard">
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </div>

        <label className="subject-field">
          <span className="subject-label">Subject</span>
          <input
            type="text"
            className="subject-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Meeting subject"
          />
        </label>

        <ul className="selection-times">
          {rows.map((r) => (
            <li
              key={r.tz}
              className={r.tz === state.primaryTz ? 'selection-row selection-row--primary' : 'selection-row'}
            >
              <span className="selection-zone">{getShortTzLabel(r.tz)}</span>
              <span className="selection-date">{r.startDate}</span>
              <span className="selection-range">{r.range}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="selection-actions">
        <a href={links.ical} className="btn btn--primary" download="event.ics">
          📅 Download iCal
        </a>
        <a href={links.google} className="btn btn--google" target="_blank" rel="noopener noreferrer">
          🔍 Google Calendar
        </a>
        <a href={links.gmail} className="btn btn--gmail" target="_blank" rel="noopener noreferrer">
          ✉️ Gmail
        </a>
        <a href={links.office} className="btn btn--office" target="_blank" rel="noopener noreferrer">
          💼 Outlook
        </a>
        <button className="btn btn--clear" onClick={() => setSelection(null)}>
          ✕ Clear
        </button>
      </div>
    </div>
  );
}
