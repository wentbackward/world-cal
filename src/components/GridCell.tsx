import { memo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { getShading } from '../utils/shading';
import { getLocalHour } from '../utils/timezone';

interface GridCellProps {
  date: Date;
  tz: string;
  hour: number;
  isSelected: boolean;
  onClick: () => void;
}

const GridCell = memo(({ date, tz, hour, isSelected, onClick }: GridCellProps) => {
  const { state } = useAppState();
  const localHour = getLocalHour(date, tz);
  const shading = getShading(localHour, state.coreHours, state.extHours);

  return (
    <div
      className={`grid-cell grid-cell--${shading} ${isSelected ? 'grid-cell--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${tz} ${hour}:00-${hour}:30`}
    />
  );
});

GridCell.displayName = 'GridCell';

export default GridCell;
