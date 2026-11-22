import { useAppState } from '../hooks/useAppState';
import { getShortTzLabel } from '../utils/timezone';
import TimezonePicker from './TimezonePicker';
import ShareButton from './ShareButton';

export default function Header() {
  const { state } = useAppState();

  // Both primary and secondary labels come from the same shared derivation —
  // e.g. "America/New_York" -> "New York".
  const primaryLabel = getShortTzLabel(state.primaryTz);
  const secondaryLabels = state.secondaryTz.map(getShortTzLabel).join(', ');

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="app-title">
          <span className="app-title-brand">World-Cal</span>
          <span className="app-title-desc">Meeting Time Planner Across Time Zones</span>
        </h1>
        <p className="tagline">
          Find a meeting time that works in every time zone — drag to pick a slot, see the local time and day for each
          city, then export to Google Calendar, Outlook, Gmail, or iCal.
        </p>
      </div>

      <div className="header-controls">
        <div className="timezone-display">
          <span className="primary-tz" title="Primary timezone">
            🌍 {primaryLabel}
          </span>
          {state.secondaryTz.length > 0 && (
            <>
              <span className="separator">·</span>
              <span className="secondary-tz" title="Secondary timezones">
                {secondaryLabels}
              </span>
            </>
          )}
        </div>

        <div className="header-actions">
          <TimezonePicker />
          <ShareButton />
        </div>
      </div>
    </header>
  );
}
