import { useCallback, useEffect, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useDragSelection } from '../hooks/useDragSelection';
import type { CellRange } from '../hooks/useDragSelection';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { createDateAtTime, formatTime, getShortTzLabel, getOffsetLabel } from '../utils/timezone';
import { getShading } from '../utils/shading';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** "YYYY-MM-DD" for an instant as seen in a timezone — used to detect day rollover. */
function localDateKey(instant: Date, tz: string): string {
  return instant.toLocaleDateString('en-CA', { timeZone: tz });
}

export default function CalendarGrid() {
  const { state, setSelection, swapTz, setViewDate, removeSecondaryTz } = useAppState();
  const { primaryTz, viewDate } = state;
  const allTimezones = [primaryTz, ...state.secondaryTz];

  // On narrow screens, pivot so that time runs top-to-bottom (timezones become columns).
  const vertical = useMediaQuery('(max-width: 1024px)');

  // The instant a given hour represents: that wall-clock hour on viewDate in the PRIMARY
  // timezone. Every timezone renders this same instant in its own local time.
  const instantAt = useCallback(
    (hour: number) =>
      createDateAtTime(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), hour, 0, primaryTz),
    [primaryTz, viewDate]
  );

  const handleSelect = useCallback(
    (cells: CellRange | null) => {
      if (!cells) {
        setSelection(null);
        return;
      }
      // Selection is a time range. The time axis is columns when horizontal, rows when vertical.
      const startHour = vertical ? cells.startRow : cells.startCol;
      const endHour = vertical ? cells.endRow : cells.endCol;
      setSelection({ start: instantAt(startHour), end: instantAt(endHour + 1) });
    },
    [instantAt, setSelection, vertical]
  );

  const { handlers, overlayStyle, isDragging } = useDragSelection(handleSelect, {
    cols: vertical ? allTimezones.length : HOURS.length,
    rows: vertical ? HOURS.length : allTimezones.length,
  });

  // Arrow keys move the date left/right (unless typing in an input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') setViewDate(addDays(viewDate, -1));
      else if (e.key === 'ArrowRight') setViewDate(addDays(viewDate, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewDate, setViewDate]);

  const dateLabel = viewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const instants = useMemo(() => HOURS.map((h) => instantAt(h)), [instantAt]);
  const primaryDayKey = localDateKey(viewDate, primaryTz);

  const isToday = useMemo(() => {
    const now = new Date();
    return (
      now.getFullYear() === viewDate.getFullYear() &&
      now.getMonth() === viewDate.getMonth() &&
      now.getDate() === viewDate.getDate()
    );
  }, [viewDate]);

  // One data cell: that timezone's local time at the given hour's instant.
  const renderCell = (tz: string, hour: number) => {
    const instant = instants[hour]!;
    const localHour =
      Number(instant.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false })) % 24;
    const shading = getShading(localHour, state.coreHours, state.extHours);
    const isSelected = state.selection
      ? instant >= state.selection.start && instant < state.selection.end
      : false;
    const weekday = instant.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
    const rolled = localDateKey(instant, tz) !== primaryDayKey;

    return (
      <div
        key={`${tz}-${hour}`}
        className={`tz-cell tz-cell--${shading} ${isSelected ? 'tz-cell--selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${getShortTzLabel(tz)} ${weekday} ${formatTime(instant, tz)}`}
        onClick={() => setSelection({ start: instant, end: instantAt(hour + 1) })}
      >
        <span className="cell-time">{formatTime(instant, tz)}</span>
        <span className={`cell-day ${rolled ? 'cell-day--rolled' : ''}`}>{weekday}</span>
      </div>
    );
  };

  // Timezone label block (offset, swap-to-primary, delete) shared by both orientations.
  const renderTzHeader = (tz: string) => {
    const isPrimary = tz === primaryTz;
    return (
      <>
        <div className="tz-head-name">{getShortTzLabel(tz)}</div>
        <div className="tz-head-offset">{getOffsetLabel(tz, viewDate)}</div>
        {!isPrimary && (
          <div className="tz-head-actions">
            <button
              className="icon-btn"
              onClick={() => swapTz(tz)}
              title="Make primary timezone"
              aria-label={`Make ${getShortTzLabel(tz)} the primary timezone`}
            >
              ⇅
            </button>
            <button
              className="icon-btn icon-btn--danger"
              onClick={() => removeSecondaryTz(tz)}
              title="Remove timezone"
              aria-label={`Remove ${getShortTzLabel(tz)}`}
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  };

  const toolbar = (
    <div className="grid-toolbar">
      <div className="date-nav">
        <button className="btn btn--nav" onClick={() => setViewDate(addDays(viewDate, -1))} title="Previous day (←)">
          ‹
        </button>
        <input
          type="date"
          className="date-input"
          value={toDateInputValue(viewDate)}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (y && m && d) setViewDate(new Date(y, m - 1, d));
          }}
        />
        <button className="btn btn--nav" onClick={() => setViewDate(addDays(viewDate, 1))} title="Next day (→)">
          ›
        </button>
      </div>
      <div className="date-display">
        {dateLabel}
        {isToday && <span className="today-pill">TODAY</span>}
      </div>
      {!isToday && (
        <button className="btn btn--today" onClick={() => setViewDate(new Date())}>
          Jump to today
        </button>
      )}
    </div>
  );

  // Vertical (narrow): time top-to-bottom on the left, timezones across the top.
  if (vertical) {
    const tzCols = { gridTemplateColumns: `repeat(${allTimezones.length}, minmax(0, 1fr))` };
    return (
      <div className="calendar-container calendar-container--vertical">
        {toolbar}

        <div className="v-head-row">
          <div className="v-corner">Time</div>
          <div className="v-tz-headers" style={tzCols}>
            {allTimezones.map((tz) => (
              <div key={tz} className={`tz-col-header ${tz === primaryTz ? 'tz-col-header--primary' : ''}`}>
                {renderTzHeader(tz)}
              </div>
            ))}
          </div>
        </div>

        <div className="v-body">
          <div className="v-hour-axis">
            {HOURS.map((hour) => (
              <div key={hour} className="v-hour-label">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div className="v-cells" style={tzCols} {...handlers}>
            {HOURS.map((hour) => allTimezones.map((tz) => renderCell(tz, hour)))}
            {isDragging && <div className="selection-overlay" style={overlayStyle} />}
          </div>
        </div>
      </div>
    );
  }

  // Horizontal (wide): timezones as rows, hours across the top.
  return (
    <div className="calendar-container">
      {toolbar}

      <div className="tz-axis-row">
        <div className="tz-corner">{getShortTzLabel(primaryTz)} time</div>
        <div className="hour-axis">
          {HOURS.map((hour) => (
            <div key={hour} className="hour-label">
              {String(hour).padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      <div className="tz-body">
        <div className="tz-row-headers">
          {allTimezones.map((tz) => (
            <div key={tz} className={`tz-row-header ${tz === primaryTz ? 'tz-row-header--primary' : ''}`}>
              {renderTzHeader(tz)}
            </div>
          ))}
        </div>

        <div className="tz-cells" {...handlers}>
          {allTimezones.map((tz) => (
            <div key={tz} className="tz-cell-row">
              {HOURS.map((hour) => renderCell(tz, hour))}
            </div>
          ))}
          {isDragging && <div className="selection-overlay" style={overlayStyle} />}
        </div>
      </div>
    </div>
  );
}
