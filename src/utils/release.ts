/**
 * Build-time release info, injected by the vite.config.ts `define` —
 * the version as tagged (single source of truth: package.json) and the
 * date of the most recent git tag. Untagged or git-less builds yield a null
 * date — the footer omits the date rather than guessing one.
 */

export interface ReleaseInfo {
  version: string;
  date: string | null;
}

export function getReleaseInfo(): ReleaseInfo {
  return { version: __APP_VERSION__, date: __RELEASE_DATE__ };
}
