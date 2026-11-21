import { useState, useCallback, useEffect, useRef } from 'react';

interface CellPosition {
  row: number;
  col: number;
}

interface SelectionState {
  isDragging: boolean;
  startCell: CellPosition | null;
  endCell: CellPosition | null;
}

const CLEARED: SelectionState = { isDragging: false, startCell: null, endCell: null };

/** A selected block of grid cells (inclusive row/column bounds). */
export interface CellRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface DragHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function useDragSelection(
  onSelection: (cells: CellRange | null) => void,
  gridSize: { cols: number; rows: number }
) {
  const { cols, rows } = gridSize;
  const [state, setState] = useState<SelectionState>(CLEARED);
  // Mirrored synchronously so window-level handlers (registered while dragging)
  // always see the latest drag state even before the render commits.
  const stateRef = useRef<SelectionState>(state);
  // The pointer that started the current drag; every event from any other pointer
  // is ignored so a second finger tap mid-drag cannot steal the drag.
  const activePointerIdRef = useRef<number | null>(null);

  const setDragState = useCallback((next: SelectionState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const getCell = useCallback(
    (e: { currentTarget: HTMLElement; clientX: number; clientY: number }): CellPosition => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        col: Math.floor(x / (rect.width / cols)),
        row: Math.floor(y / (rect.height / rows)),
      };
    },
    [cols, rows]
  );

  const clampCell = useCallback(
    (cell: CellPosition): CellPosition => ({
      col: clamp(cell.col, 0, cols - 1),
      row: clamp(cell.row, 0, rows - 1),
    }),
    [cols, rows]
  );

  const isValidCell = useCallback(
    (cell: CellPosition) => cell.col >= 0 && cell.col < cols && cell.row >= 0 && cell.row < rows,
    [cols, rows]
  );

  /** Commit the in-progress drag to a selection; idempotent. */
  const commit = useCallback(() => {
    const d = stateRef.current;
    if (!d.isDragging || !d.startCell || !d.endCell) return;
    activePointerIdRef.current = null;
    const { startCell, endCell } = d;
    setDragState(CLEARED);
    onSelection({
      startRow: Math.min(startCell.row, endCell.row),
      endRow: Math.max(startCell.row, endCell.row),
      startCol: Math.min(startCell.col, endCell.col),
      endCol: Math.max(startCell.col, endCell.col),
    });
  }, [onSelection, setDragState]);

  /** Cancel the in-progress drag: overlay cleared, no selection committed. */
  const cancel = useCallback(() => {
    if (!stateRef.current.isDragging) return;
    activePointerIdRef.current = null;
    setDragState(CLEARED);
  }, [setDragState]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Primary button only for non-touch pointers (mouse, pen, other);
      // touch pointers always start a drag.
      if (e.pointerType !== 'touch' && e.button !== 0) return;

      // A drag is already in progress: ignore any other pointer (including
      // one flagged isPrimary) so it cannot steal or reset the drag.
      if (activePointerIdRef.current !== null) return;

      const cell = getCell(e);
      if (!isValidCell(cell)) return;

      activePointerIdRef.current = e.pointerId;
      setDragState({ isDragging: true, startCell: cell, endCell: cell });

      // Capture the pointer so the grid keeps receiving events while the
      // pointer is outside it. Older browsers / jsdom may not implement it.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture is best-effort; window-level listeners below still apply.
      }
    },
    [getCell, isValidCell, setDragState]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) return;
      const d = stateRef.current;
      if (!d.isDragging || !d.startCell || !d.endCell) return;
      setDragState({ ...d, endCell: clampCell(getCell(e)) });
    },
    [clampCell, getCell, setDragState]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) return;
      commit();
    },
    [commit]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) return;
      commit();
    },
    [commit]
  );

  // Release/Escape handling for the whole window while dragging, so a release
  // outside the grid still completes the selection and always clears the overlay.
  useEffect(() => {
    if (!state.isDragging) return;

    // One release handler covers both pointerup and pointercancel: any outside-grid
    // release from the initiating pointer commits the drag and clears the overlay.
    const handleWindowRelease = (e: PointerEvent) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) return;
      commit();
    };
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Leave an already-handled Escape and an Escape aimed at an input/textarea
      // (the user is typing, not dragging) alone.
      if (e.defaultPrevented) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      cancel();
    };

    window.addEventListener('pointerup', handleWindowRelease);
    window.addEventListener('pointercancel', handleWindowRelease);
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('pointerup', handleWindowRelease);
      window.removeEventListener('pointercancel', handleWindowRelease);
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [state.isDragging, commit, cancel]);

  const overlayStyle: React.CSSProperties =
    state.isDragging && state.startCell && state.endCell
      ? {
          position: 'absolute',
          left: `${Math.min(state.startCell.col, state.endCell.col) * (100 / cols)}%`,
          top: `${Math.min(state.startCell.row, state.endCell.row) * (100 / rows)}%`,
          width: `${(Math.abs(state.endCell.col - state.startCell.col) + 1) * (100 / cols)}%`,
          height: `${(Math.abs(state.endCell.row - state.startCell.row) + 1) * (100 / rows)}%`,
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
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };

  return {
    handlers,
    overlayStyle,
    isDragging: state.isDragging,
  };
}
