/**
 * Behavioural tests for Header label derivation (ticket #4).
 *
 * The header must show the short label derived from the shared getShortTzLabel
 * — e.g. "America/New_York" -> "New York", with underscores and prefixes gone —
 * for the primary and every secondary timezone.
 *
 * The local timezone is pinned (mocked getLocalTimezone) so the suite is
 * deterministic on any machine: the default secondary list (Europe/London,
 * Asia/Hong_Kong) is filtered against the local tz, and an ambient local tz
 * of London or Hong Kong would silently drop that label from the render.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { AppStateProvider } from '../../src/hooks/useAppState';
import Header from '../../src/components/Header';
import { getLocalTimezone, getShortTzLabel } from '../../src/utils/timezone';

vi.mock('../../src/utils/timezone', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/utils/timezone')>();
  return { ...mod, getLocalTimezone: vi.fn(() => 'America/Chicago') };
});

// Pinned local tz — never the default secondary list's Europe/London or Asia/Hong_Kong.
const PINNED_LOCAL_TZ = 'America/Chicago';

describe('Header — primary/secondary label derivation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?tz=NYC,HKG');
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('renders the primary label with underscores and prefixes stripped', () => {
    const { container } = render(<AppStateProvider><Header /></AppStateProvider>);
    const primary = container.querySelector('.primary-tz');
    expect(primary?.textContent).toContain('New York');
    expect(primary?.textContent).not.toContain('America/');
    expect(primary?.textContent).not.toContain('New_York');
  });

  it('renders every secondary label with the same shared derivation', () => {
    const { container } = render(<AppStateProvider><Header /></AppStateProvider>);
    const secondary = container.querySelector('.secondary-tz');
    expect(secondary?.textContent).toContain('Hong Kong');
    expect(secondary?.textContent).not.toContain('Hong_Kong');
  });

  it('falls back to the default timezone labels when the URL carries none', () => {
    window.history.replaceState({}, '', '/');
    const { container } = render(<AppStateProvider><Header /></AppStateProvider>);
    expect(getLocalTimezone()).toBe(PINNED_LOCAL_TZ);
    const primary = container.querySelector('.primary-tz');
    expect(primary?.textContent).toContain(getShortTzLabel(PINNED_LOCAL_TZ));
    expect(primary?.textContent).not.toContain('America/');
    const secondary = container.querySelector('.secondary-tz');
    expect(secondary?.textContent).toContain('London');
    expect(secondary?.textContent).toContain('Hong Kong');
  });
});
