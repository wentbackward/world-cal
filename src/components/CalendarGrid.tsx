import { useAppState } from '../hooks/useAppState';
import { useDragSelection } from '../hooks/useDragSelection';
import TimezoneHeader from './TimezoneHeader';
import DayHeader from './DayHeader';
import TimeAxis from './TimeAxis';
import GridCell from './GridCell';

const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;

export default function CalendarGrid() {
  const { state, setSelection, swapTz } = useAppState();
  const allTimezones = [state.primaryTz, ...state.secondaryTz];

  const { handlers, overlayStyle, isDragging } = useDragSelection(
    setSelection,
    { cols: allTimezones.length, rows: TOTAL_SLOTS },
    state.viewDate
  );

  const days = [-1, 0, 1].map((offset) => {
    const date = new Date(state.viewDate);
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);
    return { date, isToday: offset === 0 };
  });

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="calendar-container">
      {/* Timezone headers */}
      <div className="timezone-row">
        <div className="timezone-spacer" />
        {days.map(({ date }) => (
          <div key={date.toISOString()} className="day-group">
            {allTimezones.map((tz) => (
              <TimezoneHeader
                key={`${tz}-${date.toISOString()}`}
                tz={tz}
                isPrimary={tz === state.primaryTz}
                onSwap={swapTz}
                date={date}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="day-row">
        <div className="day-spacer" />
        {days.map(({ date, isToday }) => (
          <div key={date.toISOString()} className="day-wrapper">
            <DayHeader date={date} isToday={isToday} />
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="grid-body" {...handlers}>
        <TimeAxis startHour={START_HOUR} totalSlots={TOTAL_SLOTS} />
        
        <div className="cells-container">
          {hours.map((hour) => (
            <div key={hour} className="hour-row">
              {days.map(({ date }) => (
                <div key={`${hour}-${date.toISOString()}`} className="cell-group">
                  {allTimezones.map((tz) => {
                    const cellDate = new Date(date);
                    cellDate.setHours(hour, 0, 0, 0);
                    const isSelected = state.selection
                      ? cellDate >= state.selection.start && cellDate < state.selection.end
                      : false;
                    
                    return (
                      <GridCell
                        key={`${tz}-${hour}-${date.toISOString()}`}
                        date={cellDate}
                        tz={tz}
                        hour={hour}
                        isSelected={isSelected}
                        onClick={() => {
                          const start = new Date(cellDate);
                          const end = new Date(cellDate);
                          end.setHours(hour + 1, 0, 0, 0);
                          setSelection({ start, end });
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
          
          {/* Selection overlay */}
          {isDragging && (
            <div
              className="selection-overlay"
              style={overlayStyle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
