/**
 * Behavioural tests for setViewDate (ticket #4).
 *
 * The documented contract: changing the view date clears the appointment
 * selection. Kept deliberately — a selection anchored to one day is not
 * meaningful when the grid re-anchors to another day.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../../src/hooks/useAppState';

type AppCtx = ReturnType<typeof useAppState>;

let captured: AppCtx | null = null;

function Probe() {
  const ctx = useAppState();
  useEffect(() => {
    captured = ctx;
  }, [ctx]);
  return null;
}

describe('useAppState — setViewDate clears the selection (documented keep)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    captured = null;
    window.history.replaceState({}, '', '/');
  });

  it('clears the selection and moves the view date when the view date changes', () => {
    render(<AppStateProvider><Probe /></AppStateProvider>);
    expect(captured).not.toBeNull();

    const start = new Date(2026, 0, 15, 9, 0, 0);
    const end = new Date(2026, 0, 15, 10, 0, 0);
    act(() => captured!.setSelection({ start, end }));
    expect(captured!.state.selection).not.toBeNull();

    const newDate = new Date(2026, 1, 3);
    act(() => captured!.setViewDate(newDate));

    expect(captured!.state.selection).toBeNull();
    expect(captured!.state.viewDate).toEqual(newDate);
  });

  it('keeps the selection across a view-date-free state update (e.g. adding a timezone)', () => {
    render(<AppStateProvider><Probe /></AppStateProvider>);
    const start = new Date(2026, 0, 15, 9, 0, 0);
    const end = new Date(2026, 0, 15, 10, 0, 0);
    act(() => captured!.setSelection({ start, end }));
    expect(captured!.state.selection).not.toBeNull();

    // Adding a secondary timezone is not a view-date change: the selection
    // must survive it (only setViewDate clears it).
    act(() => captured!.addSecondaryTz('Asia/Tokyo'));
    expect(captured!.state.selection).not.toBeNull();
    expect(captured!.state.secondaryTz).toContain('Asia/Tokyo');
  });
});
