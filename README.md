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

`npm run build` outputs static files to `dist/`. The app is served from the
`/world-cal/` subpath (configured via `base` in `vite.config.ts`); upload the
contents of `dist/` to that folder on the host.

## Tech stack

React + TypeScript + Vite, styled with plain CSS. Timezone math uses the built-in
`Intl` API — no date libraries. The full timezone list is generated from the system
IANA database via `scripts/gen-timezones.mjs`.
