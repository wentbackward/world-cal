import { memo } from 'react';

interface DayHeaderProps {
  date: Date;
  isToday: boolean;
}

const DayHeader = memo(({ date, isToday }: DayHeaderProps) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  return (
    <div className={`day-header ${isToday ? 'day-header--today' : ''}`}>
      <div className="day-weekday">{weekday}</div>
      <div className="day-date">
        {month} {day}
      </div>
      {isToday && <div className="day-badge">TODAY</div>}
    </div>
  );
});

DayHeader.displayName = 'DayHeader';

export default DayHeader;
