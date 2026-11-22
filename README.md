# World-Cal

A browser-only tool for finding meeting times that work across multiple timezones.
Drag to select a time slot, see the local time and day in every zone, and export
straight to Google Calendar, Outlook, Gmail, or iCal.

## Live tool

**👉 https://paulgresham.com/world-cal/**

## Features

- **Timezone grid** — pick a date and see every selected zone's local time side by side;
  on narrow screens it pivots so time runs top-to-bottom.
- **Drag-to-select** a meeting window; the whole band highlights across all zones.
- **Full IANA timezone list** — search by city or country (every country covered).
- **DST-aware** — all times and UTC offsets are computed per date via the browser's
  `Intl` API, including half-hour zones (e.g. Adelaide, Mumbai, Kathmandu).
- **Exports** to Google Calendar, Outlook, Gmail, and iCal, with an editable subject
  and a description that includes the per-zone times plus a link back to the same view.
- **Shareable URLs** — the timezones and selected window are encoded in the URL, so a
  shared link reopens the exact same grid and selection.
- **Copy** the selected times to the clipboard as clean, formatted text.

No backend, no database — everything runs in the browser.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run the unit tests (Vitest)
npm run build    # produce a static build in dist/
```

## Deployment

The app builds to a static `dist/` directory and runs as a small container.

- **Docker image** — the `Dockerfile` is a multi-stage build: Node 20
  produces the static bundle, then a minimal Caddy image copies `dist/`
  and serves it on port 80.
- **GHCR** — the `Deploy World-Cal` workflow builds the image and publishes
  it to GHCR with `latest` and the commit-SHA tags. The image name matches
  the repo name — `world-cal` — so the published image is
  `ghcr.io/<owner>/world-cal`. The package is kept **public** so the VPS
  pull is anonymous — the build uses the automatic `GITHUB_TOKEN` (no custom
  token secret), and the deploy step uploads no credentials over SSH.
  Anonymous pulls hit the GHCR rate limit if the deploy re-pulls the same
  image more than a few times per hour; the escape hatch is a one-time
  `docker login` with a read-only token stored on the VPS.
- **CI/CD pipeline** — `.github/workflows/deploy.yml` is the release
  pipeline:
  - *Main push, pull request, or candidate tag* (does not match
    `^v[0-9]+\.[0-9]+\.[0-9]+$`) → lightweight unit-test gate only (lint +
    unit tests). No Docker build, publish, or deploy.
  - *Stable tag push matching `^v[0-9]+\.[0-9]+\.[0-9]+$`* → full pipeline:
    unit tests → version gate → Docker build + publish to GHCR → SSH deploy
    to the VPS. The **version gate** compares the tag against the
    `package.json` `version` and refuses the run (non-zero exit) on any
    disagreement, so a tag can never publish or deploy a build whose
    version does not match.
  - *`workflow_dispatch`* → the **operator escape hatch** — the full
    pipeline runs as a deploy of the current HEAD with no tag (e.g. redeploy
    of an already-built artifact). The version gate is skipped because
    there is no tag to check.
- **Caddy reverse proxy** — the app container serves on port 80 behind a
  Caddy reverse proxy; the example route lives in
  `infra/Caddyfile.example`.
- **Assets** — `vite.config.ts` sets `base: './'`, so the build writes
  relative asset URLs (`./assets/…`) and the app serves from any path —
  a `/world-cal/` subpath or a root domain. Relative asset resolution
  still expects a trailing slash on the URL.

## Tech stack

React + TypeScript + Vite, styled with plain CSS. Timezone math uses the built-in
`Intl` API — no date libraries. The full timezone list is generated from the system
IANA database via `scripts/gen-timezones.mjs`.
