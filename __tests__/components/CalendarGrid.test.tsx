/**
 * Behavioural tests for pointer-event drag selection (ticket #1).
 *
 * These exercise the real CalendarGrid inside AppStateProvider and capture the
 * committed selection through a probe. jsdom does not implement
 * getBoundingClientRect / matchMedia / setPointerCapture, so each is stubbed
 * per test. Default layout: horizontal, primary Europe/London, secondary
 * Asia/Hong_Kong, no selection.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
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

let latestSelection: TimeRange | null = null;

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
  latestSelection = null;
  delete (window as Record<string, unknown>).matchMedia;
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
      delete (Element.prototype as Record<string, unknown>).setPointerCapture;
    }
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

  it('cancels the in-progress drag and clears the overlay on Escape without committing', () => {
    const { container } = renderGrid();
    const grid = container.querySelector('.tz-cells') as HTMLElement;

    fireEvent.pointerDown(grid, { clientX: COL_WIDTH * 1.5, clientY: ROW_HEIGHT * 0.5, pointerId: 1, button: 0 });
    expect(getOverlay(container)).not.toBeNull();

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

  it('activates the same selection as a click on Space and Enter', () => {
    const { container } = renderGrid();
    const cells = getCells(container);

    fireEvent.click(cells[5]!);
    const clickSelection = latestSelection;
    expect(clickSelection).not.toBeNull();
    expectSelection(clickSelection, selectionForHourWindow(5));

    const cell = cells[8]!;
    act(() => cell.focus());
    fireEvent.keyDown(cell, { key: 'Enter' });
    expectSelection(latestSelection, selectionForHourWindow(8));
    expect(latestSelection?.start.getTime()).not.toBe(clickSelection?.start.getTime());

    fireEvent.keyDown(cell, { key: ' ' });
    expectSelection(latestSelection, selectionForHourWindow(8));
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
});
