/**
 * Behavioural tests for the ReleaseFooter (release info in the footer).
 *
 * The footer must show the version as tagged, the release date when the build
 * carries one, and a link back to the repository — and, on a build that knows
 * no tag (dev builds), it must omit the date rather than guess one.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// getReleaseInfo comes from vite.config.ts's build-time `define`; mock the
// module so the tests pin the footer's contract, not the current tag.
let releaseInfo: { version: string; date: string | null } = { version: '0.2.1', date: '2026-11-22' };
vi.mock('../../src/utils/release', () => ({
  getReleaseInfo: () => releaseInfo,
}));

import ReleaseFooter from '../../src/components/ReleaseFooter';

describe('ReleaseFooter', () => {
  beforeEach(() => {
    releaseInfo = { version: '0.2.1', date: '2026-11-22' };
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the version with the v-tag prefix', () => {
    const { container } = render(<ReleaseFooter />);
    expect(container.textContent).toContain('v0.2.1');
  });

  it('shows the release date when the build knows one', () => {
    const { container } = render(<ReleaseFooter />);
    expect(container.textContent).toContain('released 2026-11-22');
  });

  it('omits the release date when the build knows none', () => {
    releaseInfo = { version: '0.2.1', date: null };
    const { container } = render(<ReleaseFooter />);
    expect(container.textContent).toContain('v0.2.1');
    expect(container.textContent).not.toContain('released');
    expect(container.querySelector('a')).toBeTruthy();
  });

  it('links to the repository, opening in a new tab with noreferrer', () => {
    const { container } = render(<ReleaseFooter />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://github.com/wentbackward/world-cal');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noreferrer');
  });
});
