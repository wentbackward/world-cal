# World-Cal — Design Specification

**Date:** 2026-04-26
**Status:** Approved

## Overview

World-Cal is a browser-only tool for visually finding overlapping time slots across multiple timezones. The user sees a 3-day calendar grid (yesterday, today, tomorrow) with timezone columns. They drag to select a time range, then get export links for iCal, Google Calendar, Gmail, and Office.com.

## Architecture

Three-layer architecture:

1. **State layer** — Centralized state via React context. URL is the single source of truth for configuration.
2. **Grid layer** — Calendar grid rendered as CSS Grid. Each cell is a React component with timezone-aware shading.
3. **Interaction layer** — Mouse events handle drag-selection, timezone swapping, and timezone picker.

On mount, the app reads URL params and initializes state. On any state change, the URL updates via `history.replaceState` (no page reload). Every view is bookmarkable and shareable.

## Data Model

```
AppState {
  primaryTz: string          // e.g., "Europe/London"
  secondaryTz: string[]      // e.g., ["Asia/Hong_Kong", "America/New_York"]
  coreHours: { start: number, end: number }  // default {8, 18}
  extHours: { start: number, end: number }   // default {6, 22} — encompasses core hours
  selection: {
    start: Date              // start of selected range (in primary TZ)
    end: Date                // end of selected range (in primary TZ)
  } | null
  viewDate: Date             // the "today" date in the view
}
```

Timezone list is always sorted by UTC offset. Primary timezone gets a special `isPrimary` flag. Work hours are stored as numbers (0–23) and applied per-timezone using that timezone's offset.

### URL Encoding

Compact city-code format:

| Param | Example | Meaning |
|-------|---------|---------|
| Timezones | `?L,HK,NYC` | Primary: London, Secondary: Hong Kong, New York |
| Work hours | `?core=9,17` | Core hours 9am–5pm |
| Extended hours | `?ext=6,22` | Extended range 6am–10pm (yellow = extended but not core; white = outside extended) |

City codes map to known timezones:
- `LON` → `Europe/London`, `L` → `Europe/London`
- `HKG` → `Asia/Hong_Kong`, `HK` → `Asia/Hong_Kong`
- `NYC` → `America/New_York`, `N` → `America/New_York`
- Full ISO codes accepted as fallback (e.g., `Asia/Tokyo`)

## Components

```
App
├── Header
│   ├── PrimaryTzSelector       // Shows current primary, swap icon on each secondary
│   ├── SecondaryTzList         // List of secondary timezones with swap buttons
│   └── ShareButton             // Copies current URL to clipboard
├── CalendarGrid
│   ├── DayHeaders              // Yesterday / Today / Tomorrow labels
│   ├── TimezoneHeaders         // UTC offset labels, swap icon
│   ├── TimeAxis                // Left-side hour labels (08:00, 08:30, etc.)
│   ├── GridCells               // Individual half-hour cells with shading
│   └── SelectionOverlay        // Drag rectangle positioned absolutely over grid
├── SelectionPanel              // Appears below grid when selection exists
│   ├── TimeLabels              // "London: 2:00 PM — 3:00 PM | HK: 10:00 PM — 11:00 PM"
│   ├── ExportButtons           // iCal / Google / Gmail / Office
│   └── ClearButton             // Deselect
└── TimezonePicker              // Modal/dropdown for adding new timezones
```

Each component is small and focused. No component does more than one thing.

## Data Flow

1. **Initialization** → URL params parsed → `AppState` created → timezone list sorted by UTC offset → grid renders
2. **User interaction** → Mouse events on `GridCells` → `SelectionOverlay` updates position → on mouse up, `selection` state is set
3. **Selection created** → `SelectionPanel` appears → times converted to each timezone using `Intl.DateTimeFormat` → export links generated
4. **Configuration change** (swap TZ, add TZ, change hours) → `AppState` updates → URL syncs via `history.replaceState` → grid re-renders with new shading

Time conversion uses `Intl.DateTimeFormat` with the target timezone's `hour` and `minute` properties. No external date library — built-in `Intl` API handles DST correctly.

### Export Generation

- **iCal** → Generate `.ics` file content as a `data:` URL
- **Google Calendar** → Construct `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...`
- **Gmail** → Construct `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=&su=...&dates=...`
- **Office.com** → Construct `https://outlook.office.com/calendar/0/deeplink/compose?path=...&subject=...&startdt=...&enddt=...`

## Interaction Design

### Drag Selection

- Snap automatically to 30-minute boundaries
- Dragging across any number of half-hour blocks
- Selection overlay is an absolutely-positioned div over the grid
- Visual feedback: highlighted rectangle spanning all timezone columns

### Timezone Swap

- Small "⇅" icon next to each timezone header
- Clicking swaps that timezone with the primary
- Primary timezone is visually separated (distinct border/header styling)

### Shading

Per-timezone shading, applied as a single extended range that encompasses core hours:
- **Core hours** (default 8am–6pm local time): Green background
- **Extended hours** (default 6am–10pm, minus core): Yellow background — the implied extended zones (6–8am and 6–10pm)
- **Outside hours**: No shading (white/transparent)

### Timezone Picker

- Dropdown/modal for adding new timezones
- Searchable list of IANA timezone names
- Default suggestions: London, Hong Kong (if no secondary timezones set)
- Auto-detect user's browser timezone as primary if no primary is set

## Technology Stack

- **React** with **Vite** — component-based architecture, modern DX
- **TypeScript** — type safety for timezone conversions and URL parsing
- **CSS Grid** — calendar layout
- **`Intl.DateTimeFormat`** — timezone-aware time conversion, DST handling
- **`history.replaceState`** — URL sync without page reload

## File Structure

```
src/
├── App.tsx                    // Root component, state provider
├── components/
│   ├── Header.tsx             // Timezone controls, share button
│   ├── CalendarGrid.tsx       // Grid container
│   ├── DayHeaders.tsx         // Day labels
│   ├── TimezoneHeaders.tsx    // Timezone labels with swap icons
│   ├── TimeAxis.tsx           // Left-side hour labels
│   ├── GridCells.tsx          // Individual cells with shading
│   ├── SelectionOverlay.tsx   // Drag rectangle
│   ├── SelectionPanel.tsx     // Export bar
│   ├── TimezonePicker.tsx     // Add timezone modal
│   └── ShareButton.tsx        // Copy URL to clipboard
├── hooks/
│   ├── useAppState.ts         // State management
│   ├── useUrlSync.ts          // URL ↔ state sync
│   └── useDragSelection.ts    // Mouse event handling
├── utils/
│   ├── timezone.ts            // Timezone utilities, city code mapping
│   ├── shading.ts             // Core/extended/outside hours logic
│   ├── export.ts              // iCal, Google, Gmail, Office link generation
│   └── url.ts                 // URL parsing and encoding
└── types/
    └── index.ts               // TypeScript type definitions
```

## Error Handling

- **Unknown timezone code** → Fall back to UTC, show error toast
- **Invalid URL params** → Ignore invalid params, use defaults
- **Browser without `Intl` support** → Show error message (negligible in practice)
- **Selection spans midnight** → Warn user, allow confirmation

## Testing Strategy

- **Unit tests** — URL parsing, timezone conversion, shading logic, export link generation
- **Component tests** — Grid rendering, drag selection behavior, timezone swap
- **Integration tests** — Full flow: select time → see labels → export
