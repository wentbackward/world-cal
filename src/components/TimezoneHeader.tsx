import { useAppState } from '../hooks/useAppState';

interface TimezoneHeaderProps {
  tz: string;
  isPrimary: boolean;
  onSwap: (tz: string) => void;
  date: Date;
}

const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#79c0ff', '#7ee787', '#ffa657'];

export default function TimezoneHeader({ tz, isPrimary, onSwap, date }: TimezoneHeaderProps) {
  const { state } = useAppState();
  const idx = state.secondaryTz.indexOf(tz);
  const accentColor = idx >= 0 ? COLORS[idx % COLORS.length] : '#58a6ff';

  // Calculate UTC offset
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const offsetHours = -(tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  const offsetSign = offsetHours >= 0 ? '+' : '';
  const offsetLabel = `UTC${offsetSign}${Math.round(offsetHours)}`;

  // Get friendly name
  const parts = tz.split('/');
  const label = parts.length > 1 ? (parts[parts.length - 1] ?? tz).replace(/_/g, ' ') : tz;

  return (
    <div
      className={`timezone-header ${isPrimary ? 'timezone-header--primary' : ''}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="timezone-label">{label}</div>
      <div className="timezone-offset">{offsetLabel}</div>
      {!isPrimary && (
        <button
          className="swap-btn"
          onClick={() => onSwap(tz)}
          title="Make primary timezone"
          aria-label={`Swap ${label} to primary`}
        >
          ⇅
        </button>
      )}
    </div>
  );
}
