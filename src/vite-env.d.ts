/// <reference types="vite/client" />

// Build-time globals injected by vite.config.ts `define` — the release info
// shown in the footer (see src/utils/release.ts).
declare const __APP_VERSION__: string;
declare const __RELEASE_DATE__: string | null;
