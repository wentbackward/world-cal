/**
 * Behavioural tests for pointer-event drag selection (ticket #1).
 *
 * These exercise the real CalendarGrid inside AppStateProvider and capture the
 * committed selection through a probe. jsdom does not implement
 * getBoundingClientRect / matchMedia / setPointerCapture, so each is stubbed
 * per test. Default layout: horizontal, primary Europe/London, secondary
 * Asia/Hong_Kong, no selection.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';
import { AppStateProvider, useAppState } from '../../src/hooks/useAppState';
import CalendarGrid from '../../src/components/CalendarGrid';
import { createDateAtTime } from '../../src/utils/timezone';
import type { TimeRange } from '../../src/types';

const PRIMARY_TZ = 'Europe/London';
const GRID_COLS = 24;
const GRID_ROWS = 2;
const GRID_WIDTH = 240;
const GRID_HEIGHT = 20;
const COL_WIDTH = GRID_WIDTH / GRID_COLS; // 10px
const ROW_HEIGHT = GRID_HEIGHT / GRID_ROWS; // 10px

// Vertical layout: 2 timezone columns x 24 hour rows, 10px per cell.
const V_WIDTH = 20;
const V_HEIGHT = 240;

let latestSelection: TimeRange | null = null;

// Freeze the clock at mid-day so expected selections built from `new Date()`
// below match the instants the grid derives — no run straddling midnight flakes.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
});

function SelectionProbe() {
  const { state } = useAppState();
  useEffect(() => {
    latestSelection = state.selection;
  }, [state.selection]);
  return null;
}

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function stubGridRect(el: Element) {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: GRID_WIDTH,
      bottom: GRID_HEIGHT,
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

function selectionForHourWindow(hour: number, tz = PRIMARY_TZ): TimeRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return {
    start: createDateAtTime(y, m, d, hour, 0, tz),
    end: createDateAtTime(y, m, d, hour + 1, 0, tz),
  };
}

function selectionForRange(startHour: number, endHour: number, tz = PRIMARY_TZ): TimeRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return {
    start: createDateAtTime(y, m, d, startHour, 0, tz),
    end: createDateAtTime(y, m, d, endHour + 1, 0, tz),
  };
}

function renderGrid({ matches = false }: { matches?: boolean } = {}) {
  stubMatchMedia(matches);
  window.history.replaceState({}, '', '?tz=LON,HKG');
  const utils = render(
    <AppStateProvider>
      <SelectionProbe />
      <CalendarGrid />
    </AppStateProvider>
  );
  const grid = utils.container.querySelector('.tz-cells');
  if (!grid) throw new Error('expected the horizontal .tz-cells grid element');
  stubGridRect(grid);
  return utils;
}

function stubVerticalRect(el: Element) {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: V_WIDTH,
      bottom: V_HEIGHT,
      width: V_WIDTH,
      height: V_HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

function renderVerticalGrid() {
  stubMatchMedia(true);
  window.history.replaceState({}, '', '?tz=LON,HKG');
  const utils = render(
    <AppStateProvider>
      <SelectionProbe />
      <CalendarGrid />
    </AppStateProvider>
  );
  const grid = utils.container.querySelector('.v-cells');
  if (!grid) throw new Error('expected the vertical .v-cells grid element');
  stubVerticalRect(grid);
  return utils;
}

function renderApp({ matches = false }: { matches?: boolean } = {}) {
  stubMatchMedia(matches);
  window.history.replaceState({}, '', '?tz=LON,HKG');
  const utils = render(<App />);
  const grid = utils.container.querySelector('.tz-cells');
  if (!grid) throw new Error('expected the horizontal .tz-cells grid element');
  stubGridRect(grid);
  return utils;
}

function getCells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.tz-cell'));
}

function getOverlay(container: HTMLElement) {
  return container.querySelector('.selection-overlay');
}

function expectSelection(actual: TimeRange | null, expected: TimeRange) {
  expect(actual).not.toBeNull();
  expect(actual?.start.getTime()).toBe(expected.start.getTime());
  expect(actual?.end.getTime()).toBe(expected.end.getTime());
}

afterEach(() => {
  vi.useRealTimers();
  latestSelection = null;
  delete (window as unknown as Record<string, unknown>).matchMedia;
  window.history.replaceState({}, '', '/');
});

describe('pointer-event drag selection', () => {
  it('captures the pointer on the grid element when a drag starts', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;
    const calls: number[] = [];
    Element.prototype.setPointerCapture = function (this: Element, pointerId: number) {
      calls.push(pointerId);
    };
    try {
      fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 77, button: 0 });
      expect(calls).toEqual([77]);
    } finally {
      delete (Element.prototype as unknown as Record<string, unknown>).setPointerCapture;
    }
  });

  it('starts a drag for a touch pointer on the primary button', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0, pointerType: 'touch' });
    expect(getOverlay(container)).not.toBeNull();
  });

  it('starts a drag for a pen pointer on the primary button', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0, pointerType: 'pen' });
    expect(getOverlay(container)).not.toBeNull();
  });

  it('does not start a drag when a mouse side button is pressed', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 2, pointerType: 'mouse' });
    expect(getOverlay(container)).toBeNull();

    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1, button: 0, pointerType: 'mouse' });
    expect(latestSelection).toBeNull();
  });

  it('does not start a drag when a pen side button is pressed', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 2, pointerType: 'pen' });
    expect(getOverlay(container)).toBeNull();

    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1, pointerType: 'pen' });
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1, button: 0, pointerType: 'pen' });
    expect(latestSelection).toBeNull();
  });

  it('drags across cells and reports the selected hour window', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 1.5, pointerId: 1, button: 0 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 13));

    const selected = container.querySelectorAll('.tz-cell--selected');
    expect(selected.length).toBe(13 * 2); // 13 hours per timezone row, 2 rows
  });

  it('completes the selection and clears the overlay on pointerup outside the grid', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    fireEvent.pointerUp(document.body, { clientX: 400, clientY: 300, pointerId: 1, button: 0 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 13));
  });

  it('completes the selection and clears the overlay on pointercancel outside the grid', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    fireEvent.pointerCancel(document.body, { clientX: 400, clientY: 300, pointerId: 1 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 13));
  });

  it('commits the drag on an in-grid pointercancel (same as pointerup)', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    fireEvent.pointerCancel(grid, { clientX: COL_WIDTH * 13.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 13));
  });

  it('ignores a second pointer down mid-drag; only the initiating pointer commits', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    // Finger A starts a drag at hour 1 and drags to hour 3.
    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });

    // Finger B taps at hour 10 mid-drag — must not steal or reset the drag.
    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 10.5, clientY: ROW_HEIGHT * 0.5, pointerId: 2, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 10.5, clientY: ROW_HEIGHT * 0.5, pointerId: 2 });
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 10.5, clientY: ROW_HEIGHT * 0.5, pointerId: 2, button: 0 });

    // Finger A's drag is untouched: overlay still shows the hour 1–3 region.
    expect(getOverlay(container)).not.toBeNull();
    expect(latestSelection).toBeNull();

    // Finger A's release commits the hour 1–3 selection, not finger B's hour-10 tap.
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 3));
  });

  it('ignores window release events whose pointerId is not the active drag pointer', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });

    // Non-initiating pointer releases on the window — must neither commit nor clear the overlay.
    fireEvent.pointerUp(document.body, { clientX: 400, clientY: 300, pointerId: 2, button: 0 });
    fireEvent.pointerCancel(document.body, { clientX: 400, clientY: 300, pointerId: 2 });

    expect(getOverlay(container)).not.toBeNull();
    expect(latestSelection).toBeNull();

    // The initiating pointer's release still completes the selection.
    fireEvent.pointerUp(document.body, { clientX: 400, clientY: 300, pointerId: 1, button: 0 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(1, 3));
  });

  it('cancels the in-progress drag on Escape; the app-level handler clears the committed selection', () => {
    // Render the real app so the app-level Escape handler (window keydown) is mounted.
    const { container } = renderApp();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    // Commit a selection first (click the hour-5 cell).
    fireEvent.click(getCells(container)[5]!);
    expect(container.querySelector('.selection-panel')).not.toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2);

    // Start a new drag (hour 1 → hour 3).
    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    // Overlay cleared and the drag discarded (no new commit): no selection-panel,
    // no selected cells — the app-level handler cleared the committed selection, unchanged.
    expect(getOverlay(container)).toBeNull();
    expect(container.querySelector('.selection-panel')).toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(0);

    // The abandoned drag must not commit on its later release.
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(container.querySelector('.selection-panel')).toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(0);
  });

  it('cancels the in-progress drag and clears the overlay on Escape without committing', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(getOverlay(container)).toBeNull();
    expect(latestSelection).toBeNull();
  });

  it('does not cancel the drag on Escape targeted at the date input', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;
    const dateInput = container.querySelector('.date-input') as HTMLInputElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 3.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.keyDown(dateInput, { key: 'Escape' });

    expect(getOverlay(container)).not.toBeNull();
    expect(latestSelection).toBeNull();
  });

  it('does not cancel the drag on Escape targeted at a textarea', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;
    const textarea = document.createElement('textarea');
    container.appendChild(textarea);

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(getOverlay(container)).not.toBeNull();
    expect(latestSelection).toBeNull();
  });

  it('does not cancel the drag on an Escape already defaultPrevented by an earlier listener', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

    // Capture-phase window listener runs before the hook's bubble listener and
    // marks the event as already handled.
    const guard = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', guard, true);
    try {
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(getOverlay(container)).not.toBeNull();
      expect(latestSelection).toBeNull();
    } finally {
      window.removeEventListener('keydown', guard, true);
    }

    // An unhandled Escape still cancels the drag afterwards.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(getOverlay(container)).toBeNull();
    expect(latestSelection).toBeNull();
  });

  it('selects the hour window of a focused cell on Enter', () => {
    const { container } = renderGrid();
    const cell = getCells(container)[8]!;

    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });

    expectSelection(latestSelection, selectionForHourWindow(8));
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2);
  });

  it('activates the same selection as a click on Space and Enter on the same cell', () => {
    const { container } = renderGrid();
    const cell = getCells(container)[5]!;
    const expected = selectionForHourWindow(5);

    fireEvent.click(cell);
    const clickSelection = latestSelection;
    expectSelection(clickSelection, expected);

    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });
    expectSelection(latestSelection, expected);
    expect(latestSelection?.start.getTime()).toBe(clickSelection?.start.getTime());
    expect(latestSelection?.end.getTime()).toBe(clickSelection?.end.getTime());

    fireEvent.keyDown(cell, { key: ' ' });
    expectSelection(latestSelection, expected);
    expect(latestSelection?.start.getTime()).toBe(clickSelection?.start.getTime());
    expect(latestSelection?.end.getTime()).toBe(clickSelection?.end.getTime());
  });

  it('does not change the selection on hover or focus of a non-dragging cell', () => {
    const { container } = renderGrid();
    const cells = getCells(container);

    fireEvent.click(cells[5]!);
    const clickSelection = latestSelection;
    expect(clickSelection).not.toBeNull();
    expectSelection(clickSelection, selectionForHourWindow(5));

    const cell = cells[8]!;
    fireEvent.mouseEnter(cell);
    fireEvent.mouseOver(cell);
    fireEvent.pointerEnter(cell);
    act(() => cell.focus());

    expectSelection(latestSelection, clickSelection as TimeRange);
  });

  it('does not commit the cell activation after a cancelled drag (no-capture path)', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 5.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(getOverlay(container)).toBeNull();
    expect(latestSelection).toBeNull();

    // The browser-native click the browser fires on the cell after pointerup.
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 5.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.click(getCells(container)[5]!);

    expect(latestSelection).toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(0);
  });

  it('commits the keyboard activation of a cell right after a cancelled drag (click path stays suppressed)', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 5.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(getOverlay(container)).toBeNull();
    expect(latestSelection).toBeNull();

    // An explicit keyboard activation is unconditional — no intervening pointerdown,
    // so it must not be surprised by the post-cancel suppression flag.
    const cell = getCells(container)[5]!;
    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });
    expectSelection(latestSelection, selectionForHourWindow(5));

    fireEvent.keyDown(cell, { key: ' ' });
    expectSelection(latestSelection, selectionForHourWindow(5));

    // The browser-native click the browser fires on the cancelled gesture's cell is
    // still suppressed — it must not replace the keyboard-committed selection.
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 5.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.click(getCells(container)[8]!);
    expectSelection(latestSelection, selectionForHourWindow(5));
  });

  it('does not clear the committed selection on Escape aimed at the date input', () => {
    const { container } = renderApp();

    fireEvent.click(getCells(container)[5]!);
    expect(container.querySelector('.selection-panel')).not.toBeNull();

    const dateInput = container.querySelector('.date-input') as HTMLInputElement;
    act(() => dateInput.focus());
    fireEvent.keyDown(dateInput, { key: 'Escape' });

    expect(container.querySelector('.selection-panel')).not.toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2);
  });

  it('maps rows to hours in the vertical (narrow) layout', () => {
    const { container } = renderVerticalGrid();
    const grid = container.querySelector('.v-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: 5, clientY: 25, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

    fireEvent.pointerMove(grid, { clientX: 15, clientY: 125, pointerId: 1 });
    fireEvent.pointerUp(grid, { clientX: 15, clientY: 125, pointerId: 1, button: 0 });

    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(2, 12));
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(11 * 2); // hours 2..12 x 2 timezone columns
  });

  it('ignores cell activation while a drag is in progress; the drag still commits on release', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    // Start a drag at hour 5 and move it to hour 8.
    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 5.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(grid, { clientX: COL_WIDTH * 8.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1 });
    expect(getOverlay(container)).not.toBeNull();

    // Enter on a focused cell mid-drag must not set a selection — the drag owns release.
    const cell = getCells(container)[8]!;
    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(latestSelection).toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(0);

    // The drag's release commits the drag's own range, not the cell's hour window.
    fireEvent.pointerUp(grid, { clientX: COL_WIDTH * 8.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).toBeNull();
    expectSelection(latestSelection, selectionForRange(5, 8));
  });

  it('selects the hour window of a focused cell on Enter in the vertical (narrow) layout', () => {
    const { container } = renderVerticalGrid();
    // Vertical layout: hour-major, tz-minor — index = hour * 2 + tzIndex.
    const cell = getCells(container)[8 * 2]!;

    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });

    expectSelection(latestSelection, selectionForHourWindow(8));
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2); // hour 8 x 2 timezone columns
  });

  it('does not commit the cell activation after a cancelled drag in the vertical (narrow) layout (no-capture path)', () => {
    const { container } = renderVerticalGrid();
    const grid = container.querySelector('.v-cells') as HTMLElement;

    // Vertical layout: hour-major, tz-minor — cell index = hour * 2 + tzIndex.
    fireEvent.pointerDown(grid, { clientX: 5, clientY: 55, pointerId: 1, button: 0 });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(getOverlay(container)).toBeNull();
    expect(latestSelection).toBeNull();

    // The browser-native click the browser fires on the cell after pointerup.
    fireEvent.pointerUp(grid, { clientX: 5, clientY: 55, pointerId: 1, button: 0 });
    fireEvent.click(getCells(container)[5 * 2]!);

    expect(latestSelection).toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(0);
  });

  it('does not clear the committed selection on a defaultPrevented Escape (app-level handler)', () => {
    const { container } = renderApp();

    fireEvent.click(getCells(container)[5]!);
    expect(container.querySelector('.selection-panel')).not.toBeNull();

    // Capture-phase window listener marks the Escape as handled before the app sees it.
    const guard = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', guard, true);
    try {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    } finally {
      window.removeEventListener('keydown', guard, true);
    }

    expect(container.querySelector('.selection-panel')).not.toBeNull();
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2);
  });

  it('selects the 23 -> 24 hour window (next day 00:00) for the last hour cell', () => {
    const { container } = renderGrid();
    const cell = getCells(container)[23]!;

    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });

    expectSelection(latestSelection, selectionForHourWindow(23));
  });

  it('selects the 23 -> 24 hour window (next day 00:00) through the click path for the last hour cell', () => {
    const { container } = renderGrid();
    const cell = getCells(container)[23]!;

    fireEvent.click(cell);

    expectSelection(latestSelection, selectionForHourWindow(23));
    expect(container.querySelectorAll('.tz-cell--selected').length).toBe(2);
  });
});
