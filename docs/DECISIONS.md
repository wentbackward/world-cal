# Decisions

Decisions the dev loop made where the spec was silent. Newest last.
One line each: `YYYY-MM-DD — decision — why — alternatives considered`.

- 2026-04-28 — fast check `npx tsc --noEmit` — fastest tree-health signal (~1s) that fails on type errors; `npm test` is slower and lives in the gate. Alternative: `npm run build` (~2s) — included as a gate check instead.
- 2026-04-28 — heavy slots 2, memory cap none — vite build is ~2s and nothing is a long-running job today; keep the default. Alternative: capped memory — no shared-host pressure today.
- 2026-04-28 — no ports (empty port_env) — browser-only app, gate needs no servers. Alternative: dev-server ports — not needed for tests/build.
- 2026-04-28 — gate includes `tsc`, `npm test -- --run`, `npm run build`, and `eslint src __tests__` — matches the CI test stage (tests + build) and guards lint regressions. Alternative: tests-only gate — too thin; build catches Rollup/TS split-brain.
- 2026-04-28 — `.pi/` + `scripts/` committed — self-contained checkout, matches the plugin's dogfood layout. Alternative: gitignore `.pi/` — rejected; the files must be present for pi's extension loading and they are versioned project content, not local state.
- 2026-11-21 — Escape cancels the in-progress drag without committing or clearing the committed selection (the app-level Escape handler still clears the committed selection, as before) — the spec pins only the drag cancellation; keeping the app-level selection-clearing single-sourced in App. Alternative: the hook calls onSelection(null) on Escape — rejected as duplicate selection handling.
- 2026-11-21 — pointercancel commits the drag (same as pointerup), including in-grid cancels, not aborts — the spec requires a release (pointerup/pointercancel) outside the grid to complete the selection; keeping the whole drag-release path consistent. Alternative: in-grid cancel aborts — rejected as inconsistent with the spec sentence.
- 2026-11-21 — setPointerCapture is guarded (try/catch) — jsdom and older browsers lack it; window-level listeners are the primary outside-grid path. Alternative: hard-require capture — rejected (breaks jsdom and fall-backs).
- 2026-11-21 — no `touch-action: none` on the grid — styles/layouts/copy unchanged is a scope boundary (#1); touch drag relies on capture + window listeners, operator verifies touch in manual sign-off. Alternative: add the CSS now — rejected as out-of-scope style change.
