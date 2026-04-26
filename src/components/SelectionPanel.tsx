import { useAppState } from '../hooks/useAppState';
import { generateExportLinks } from '../utils/export';
import { formatTime } from '../utils/timezone';

export default function SelectionPanel() {
  const { state, setSelection } = useAppState();
  const selection = state.selection;

  if (!selection) return null;

  const allTimezones = [state.primaryTz, ...state.secondaryTz];
  const links = generateExportLinks(selection, state.primaryTz, 'Team Meeting');

  const timeLabels = allTimezones.map((tz) => {
    const startTime = formatTime(selection.start, tz);
    const endTime = formatTime(selection.end, tz);
    const parts = tz.split('/');
    const label = parts.length > 1 ? (parts[parts.length - 1] ?? tz).replace(/_/g, ' ') : tz;
    return `${label}: ${startTime} — ${endTime}`;
  }).join(' · ');

  return (
    <div className="selection-panel">
      <div className="selection-info">
        <div className="selection-times">{timeLabels}</div>
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
