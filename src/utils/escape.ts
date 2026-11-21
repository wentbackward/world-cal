/**
 * True when an Escape keydown should be left alone: already default-prevented by
 * an earlier listener (some other handler owns it) or aimed at an input /
 * textarea (the user is typing, not dragging or clearing a selection).
 * Shared by the hook's drag-cancel handler and the app-level selection-clear
 * handler so the two stay in lockstep by construction.
 */
export function shouldIgnoreEscape(e: KeyboardEvent): boolean {
  if (e.defaultPrevented) return true;
  const tag = (e.target as HTMLElement | null)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}
