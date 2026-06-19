import { useState, useRef, useEffect, memo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { getAllTimeZones } from '../lib/city-codes';
import { getOffsetLabel } from '../utils/timezone';

const TimezonePicker = memo(() => {
  const { state, addSecondaryTz } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allTimeZones = getAllTimeZones();
  const usedTimeZones = new Set([state.primaryTz, ...state.secondaryTz]);

  const filtered = allTimeZones.filter((tz) => {
    if (usedTimeZones.has(tz.tz)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tz.label.toLowerCase().includes(q) ||
      tz.country.toLowerCase().includes(q) ||
      tz.tz.toLowerCase().includes(q) ||
      (tz.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false)
    );
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.timezone-picker')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="timezone-picker">
      <button
        className="btn btn--icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Add timezone"
        aria-label="Add timezone"
      >
        +
      </button>

      {isOpen && (
        <div className="picker-dropdown">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by city or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="picker-input"
          />

          <div className="picker-list">
            {filtered.length === 0 ? (
              <div className="picker-empty">No matching timezones</div>
            ) : (
              filtered.map((tz) => (
                <button
                  key={tz.tz}
                  className="picker-item"
                  onClick={() => {
                    addSecondaryTz(tz.tz);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="picker-text">
                    <span className="picker-label">{tz.label}</span>
                    {tz.country && <span className="picker-country">{tz.country}</span>}
                  </span>
                  <span className="picker-code">{getOffsetLabel(tz.tz)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

TimezonePicker.displayName = 'TimezonePicker';

export default TimezonePicker;
