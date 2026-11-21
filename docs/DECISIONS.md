# Decisions

Decisions the dev loop made where the spec was silent. Newest last.
One line each: `YYYY-MM-DD — decision — why — alternatives considered`.

- 2026-04-28 — fast check `npx tsc --noEmit` — fastest tree-health signal (~1s) that fails on type errors; `npm test` is slower and lives in the gate. Alternative: `npm run build` (~2s) — included as a gate check instead.
- 2026-04-28 — heavy slots 2, memory cap none — vite build is ~2s and nothing is a long-running job today; keep the default. Alternative: capped memory — no shared-host pressure today.
- 2026-04-28 — no ports (empty port_env) — browser-only app, gate needs no servers. Alternative: dev-server ports — not needed for tests/build.
- 2026-04-28 — gate includes `tsc`, `npm test -- --run`, `npm run build`, and `eslint src __tests__` — matches the CI test stage (tests + build) and guards lint regressions. Alternative: tests-only gate — too thin; build catches Rollup/TS split-brain.
- 2026-04-28 — `.pi/` + `scripts/` committed — self-contained checkout, matches the plugin's dogfood layout. Alternative: gitignore `.pi/` — rejected; the files must be present for pi's extension loading and they are versioned project content, not local state.
