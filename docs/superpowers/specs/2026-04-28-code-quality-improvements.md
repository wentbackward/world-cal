# World-Cal — Code Quality Improvements — Specification

**Date:** 2026-04-28
**Status:** Proposed
**Scope:** Internal code quality and robustness. No new user-facing features.

## Overview

A follow-up review of the current codebase flagged a small number of real defects (drag-selection robustness, accessibility, fragile timezone math), a layer of dead code, and polish items. This spec covers those improvements only. Everything in the approved design spec (2026-04-26) remains in force.

## Non-goals

- No new features (e.g., multi-day grids, theme switching UI).
- No UI redesign. Styles, layouts, and copy stay as-is.
- No changes to the URL encoding or export format.
- No CI/CD pipeline changes beyond the version-gate in §5 (the trigger behavior is changed; nothing else about the pipeline moves).

## Requirements

### 1. Core interaction: pointer-event drag selection

**Problem.** `useDragSelection` only listens for mouse events on the grid element. Dragging outside the grid leaves the overlay in a stale state, and touch users cannot drag at all. Cells are also focusable but not keyboard-activatable.

**Spec.**

- Convert `useDragSelection` to Pointer Events (`onPointerDown` / `onPointerMove` / `onPointerUp` / `onPointerCancel`), so mouse, touch, and pen all work.
- While dragging, listen for `pointerup`/`pointercancel` on `window` (and capture the pointer on the grid via `setPointerCapture`) so a release outside the grid still completes the selection and always clears the overlay.
- Cells become keyboard-activatable: `Enter` / `Space` on a focused cell selects that hour (same behavior as click).
- Hover/keyboard-focus must not change selection state on non-dragging events.

### 2. Timezone math: one implementation

**Problem.** `getTzOffset` parses `toLocaleString` output with `new Date(...)`; the file already contains the robust `getTzOffsetMs` (Intl `formatToParts`) and uses it for `createDateAtTime`. `getOffsetLabel`, `sortTimezonesByOffset`, and `getLocalHour` still go through the fragile path, and `getLocalHour` can return hour `24` at midnight (the grid works around this with `% 24`).

**Spec.**

- Remove `getTzOffset` and route everything that needs an offset (`getOffsetLabel`, `sortTimezonesByOffset` if kept, `createDateAtTime`) through a single `getOffsetMs` built on `Intl.DateTimeFormat().formatToParts`.
  `getLocalHour` is the deliberate exception — it prints a local hour, not a millisecond offset — and keeps its own `hourCycle: "h24"` + `24 → 0` normalization path rather than deriving from `getOffsetMs`.
  The acceptance criteria require only `getOffsetLabel` and `createDateAtTime` to route through `getOffsetMs` (recorded in `docs/DECISIONS.md`, the getLocalHour entry; see issue #2).
- Fix `getLocalHour` to return 0–23 (normalize `24` → `0`).
- Keep `getTzOffset`/`sortTimezonesByOffset` removed unless a caller is added; tests must cover the replacement.

### 3. Dead code removal

Delete, in one pass:

- `src/index.css` (never imported — `main.tsx` imports `styles/*.css` directly)
- `LoadingSpinner` component (unused)
- `TIMEZONE_COLORS` from `src/components/constants.ts`
- `src/styles/grid.css` (empty placeholder — or delete the import if the file is empty)
- `useTheme.tsx` / `ThemeProvider` / `Theme` context (dead — nothing ever sets a theme)
- `getLocalHour`, `sortTimezonesByOffset` (unused by components — remove along with `getTzOffset` per §2)
- Duplicate `:root` color definitions in `App.css` (keep the single source in `styles/variables.css`)
- Duplicate `getLocalTimezone` (keep one in `utils/timezone.ts`)

**Rule:** after the cleanup, `grep -r <symbol> src/ __tests__/` must return references only where the symbol is actually used.

### 4. Consolidation & polish

- `Header.tsx`: move imports to the top; derive the primary/secondary labels with the shared `getShortTzLabel`.
- `.github/workflows/deploy.yml`: add `npm run lint` to the test stage, and add a `"lint": "eslint ."` script to `package.json`.
- `iCal export`: fold content lines at 75 octets; keep `escapeICal` behavior.
- `README.md`: refresh the Deployment section (Docker image, GHCR, CI/CD pipeline, Caddy reverse proxy) and the `base` note (it now serves from any path).
- `buildUrlQuery`: precompute a reverse lookup map (tz → short code) instead of scanning `CITY_CODE_MAP` per tz.
- `getAllTimeZones()`: memoize the picker list per render (`useMemo`).
- Decide explicitly on `setViewDate` clearing the selection and document the decision (keep behavior; add a comment). No behavior change.


### 5. Gate the CI pipeline on version roll-forward — not candidates

**Problem.** The `Deploy World-Cal` workflow triggers on every push to `main`, so a candidate or
accidental push ships the full pipeline (unit tests → Docker build → GHCR publish → VPS deploy).
Only a version that rolls forward — a release — should reach production.

**Versioning nomenclature.** The devloop tooling defines no versioning scheme, so this spec adopts
stock [semver](https://semver.org):

- Stable release: `v<major>.<minor>.<patch>` — e.g. `v0.2.0` (no suffix, no build metadata).
- Candidate / pre-release: `v<major>.<minor>.<patch>-<pre>` — e.g. `v0.2.0-rc1`, `v0.2.0-beta.2`.

**Spec.**

- The full pipeline (unit tests → Docker build + GHCR publish → SSH deploy to the VPS) triggers only
  on a tag push matching `^v[0-9]+\.[0-9]+\.[0-9]+$` — a stable roll-forward. The tag must match the
  `package.json` `version` field (check in the workflow; refuse to proceed on mismatch).
- A candidate tag push (suffix after the `-`, e.g. `v0.2.0-rc1`, `v0.2.0-beta.2`) must NOT trigger
  the full pipeline. It runs the lightweight unit-test gate only — no build, no publish, no deploy.
- Pushes to `main` and PRs (neither version tags) run the lightweight unit-test gate only. No
  build, no publish, no deploy.
- `workflow_dispatch` remains available as an operator escape hatch for the full pipeline,
  documented as such (manual, explicit — never the default path).
- `tsc`/unit-test/lint remain the light gate in all cases; the build + publish + deploy chain is
  gated strictly on the stable-version tag.

**Verification.**

- Pushing `v0.2.0-rc1` runs the test gate and nothing else.
- Pushing `v0.2.0` (or `workflow_dispatch`) runs the full pipeline.
- A stable-version tag whose `package.json` disagrees with the tag is refused (no publish/deploy).

## Verification

- `npm test -- --run` passes (extend coverage for the pointer/keyboard selection and the unified offset math).
- `npm run lint` is clean.
- Manual: drag across cells, drag outside the grid, cancel mid-drag (`Escape`/pointer-cancel), click a cell, keyboard-select a cell with Enter/Space, on both desktop and narrow (vertical) layout, mouse and touch.
- `npm run build` succeeds.
