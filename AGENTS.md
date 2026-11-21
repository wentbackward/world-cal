# AGENTS.md — world-cal

Browser-only timezone meeting-time planner (React 19 + Vite + TypeScript). No backend.

## Dev loop

Work through the open tickets with the `devloop` skill (orchestrator: plan → ticket →
dispatch → review → gate → merge). Config lives in `.devloop.json`; the fast check is
`npx tsc --noEmit` (full suite + build + lint run in the gate).
