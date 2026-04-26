import { useAppState } from '../hooks/useAppState';

export default function Header() {
  const { state } = useAppState();

  const primaryParts = state.primaryTz.split('/');
  const primaryLabel = primaryParts.length > 1
    ? (primaryParts[primaryParts.length - 1] ?? state.primaryTz).replace(/_/g, ' ')
    : state.primaryTz;

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>World-Cal</h1>
        <p className="tagline">Find the perfect time across timezones</p>
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
                {state.secondaryTz.map((tz) => {
                  const parts = tz.split('/');
                  return parts.length > 1 ? (parts[parts.length - 1] ?? tz).replace(/_/g, ' ') : tz;
                }).join(', ')}
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

import TimezonePicker from './TimezonePicker';
import ShareButton from './ShareButton';
