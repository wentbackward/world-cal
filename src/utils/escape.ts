/**
 * True when an Escape keydown should be left alone: already default-prevented by
 * an earlier listener (some other handler owns it) or aimed at an input /
 * textarea (the user is typing, not dragging or clearing a selection).
 * Shared by the hook's drag-cancel handler and the app-level selection-clear
 * handler so the two stay in lockstep by construction.
 *
 * Anything else — e.g. a focused button — is intentionally not excluded: an
 * Escape aimed at one still carries the default (the hook cancels an
 * in-progress drag; the app clears a committed selection). The hook only acts
 * while a drag is in progress, so on a button-aimed Escape outside a drag the
 * hook is inert — but the app-level handler still clears a committed selection
 * in that case; the helper excludes typing gestures, not every focused
 * element.
 */
export function shouldIgnoreEscape(e: KeyboardEvent): boolean {
  if (e.defaultPrevented) return true;
  const tag = (e.target as HTMLElement | null)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}
