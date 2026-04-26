import { useState, useCallback, useRef } from 'react';
import type { TimeRange } from '../types';

interface SelectionState {
  isDragging: boolean;
  startCell: { row: number; col: number } | null;
  endCell: { row: number; col: number } | null;
}

interface DragHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export function useDragSelection(
  onSelection: (selection: TimeRange | null) => void,
  gridSize: { cols: number; rows: number },
  baseDate: Date
) {
  const [state, setState] = useState<SelectionState>({
    isDragging: false,
    startCell: null,
    endCell: null,
  });
  const _gridRef = useRef<HTMLDivElement>(null);
  void _gridRef;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const colWidth = rect.width / gridSize.cols;
      const rowHeight = rect.height / gridSize.rows;

      const col = Math.floor(x / colWidth);
      const row = Math.floor(y / rowHeight);

      if (col >= 0 && col < gridSize.cols && row >= 0 && row < gridSize.rows) {
        setState({ isDragging: true, startCell: { row, col }, endCell: { row, col } });
      }
    },
    [gridSize]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!state.isDragging) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const colWidth = rect.width / gridSize.cols;
      const rowHeight = rect.height / gridSize.rows;

      const col = Math.max(0, Math.min(gridSize.cols - 1, Math.floor(x / colWidth)));
      const row = Math.max(0, Math.min(gridSize.rows - 1, Math.floor(y / rowHeight)));

      setState((prev) => ({ ...prev, endCell: { row, col } }));
    },
    [state.isDragging, gridSize]
  );

  const handleMouseUp = useCallback(() => {
    if (!state.isDragging || !state.startCell || !state.endCell) {
      setState({ isDragging: false, startCell: null, endCell: null });
      onSelection(null);
      return;
    }

    const startRow = Math.min(state.startCell.row, state.endCell.row);
    const endRow = Math.max(state.startCell.row, state.endCell.row);

    // Convert row indices to time (each row = 30 minutes)
    const startMinutes = startRow * 30;
    const endMinutes = (endRow + 1) * 30;

    // Create dates for the selection
    const startDate = new Date(baseDate);
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    onSelection({ start: startDate, end: endDate });
    setState({ isDragging: false, startCell: null, endCell: null });
  }, [state, onSelection, baseDate]);

  const overlayStyle: React.CSSProperties = state.isDragging && state.startCell && state.endCell
    ? {
        position: 'absolute',
        left: `${Math.min(state.startCell.col, state.endCell!.col) * (100 / gridSize.cols)}%`,
        top: `${Math.min(state.startCell.row, state.endCell!.row) * (100 / gridSize.rows)}%`,
        width: `${(Math.abs(state.endCell.col - state.startCell.col) + 1) * (100 / gridSize.cols)}%`,
        height: `${(Math.abs(state.endCell.row - state.startCell.row) + 1) * (100 / gridSize.rows)}%`,
        backgroundColor: 'var(--color-selection)',
        border: '2px solid var(--color-selection-border)',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 10,
      }
    : {
        display: 'none',
      };

  const handlers: DragHandlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  };

  return {
    handlers,
    overlayStyle,
    isDragging: state.isDragging,
  };
}
