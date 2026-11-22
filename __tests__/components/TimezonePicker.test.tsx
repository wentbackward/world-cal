/**
 * Behavioural tests for TimezonePicker memoization (ticket #4).
 *
 * The list from getAllTimeZones() is a static snapshot; the picker must not
 * recompute it on every render — only the filtered view is recomputed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, cleanup } from '@testing-library/react';
import { AppStateProvider } from '../../src/hooks/useAppState';
import TimezonePicker from '../../src/components/TimezonePicker';
import { getAllTimeZones } from '../../src/lib/city-codes';

vi.mock('../../src/lib/city-codes', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/lib/city-codes')>();
  return { ...mod, getAllTimeZones: vi.fn(mod.getAllTimeZones) };
});

describe('TimezonePicker — memoized getAllTimeZones()', () => {
  const spy = vi.mocked(getAllTimeZones);

  beforeEach(() => {
    spy.mockClear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('computes the full timezone list once per mount, not once per render', () => {
    const { container } = render(<AppStateProvider><TimezonePicker /></AppStateProvider>);
    expect(spy).toHaveBeenCalledTimes(1);

    // Open the dropdown and type in the search box: both update local state
    // and re-render the picker, but the static list must not be recomputed.
    fireEvent.click(container.querySelector('button[aria-label="Add timezone"]')!);
    const input = container.querySelector('.picker-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'tokyo' } });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
