/**
 * Consolidation & polish (ticket #4) — pins the mechanical acceptance criteria.
 *
 * The acceptance criteria are grep-based, so the tests assert the source
 * shape directly (the symbol names are assembled from parts where needed so
 * this file itself doesn't re-match the criteria greps).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const header = SRC(join('src', 'components', 'Header.tsx'));
const url = SRC(join('src', 'utils', 'url.ts'));
const picker = SRC(join('src', 'components', 'TimezonePicker.tsx'));
const useAppState = SRC(join('src', 'hooks', 'useAppState.tsx'));

describe('Header.tsx — imports at top, shared label derivation', () => {
  it('has every import statement before the first line of component code', () => {
    const lines = header.split('\n');
    const codeLineIndex = lines.findIndex((l) => /^(export\s+)?(default\s+)?function\s+Header\b|^const\s+Header\b/.test(l));
    expect(codeLineIndex).toBeGreaterThan(-1);
    for (const [i, line] of lines.entries()) {
      if (i >= codeLineIndex) break;
      if (/^import\s/.test(line)) continue;
      // Non-import statements are allowed before the component only if they are
      // comments / blank lines (never code further down the file).
      expect(line.trim(), `line ${i + 1} is not an import, blank or comment: ${line}`).toMatch(/^(\/\/|\/\*|$)/);
    }
    // No import statement appears anywhere below the component declaration.
    const below = lines.slice(codeLineIndex).join('\n');
    expect(below).not.toMatch(/^\s*import\s/m);
  });

  it('imports the shared getShortTzLabel exactly once', () => {
    const occurrences = header.match(/getShortTzLabel/g) ?? [];
    const imports = header.match(/import\s*\{[^}]*getShortTzLabel[^}]*\}\s*from/g) ?? [];
    expect(imports.length).toBe(1);
    expect(occurrences.length).toBeGreaterThanOrEqual(1);
  });

  it('no hand-rolled split-on-slash label derivation remains', () => {
    // Symbol names are assembled from parts: the acceptance grep must not
    // match this file's own source.
    const splitCall = ['split(', '\'/\''].join('');
    expect(header.split(splitCall).length - 1).toBe(0);
    // No other hand-rolled label logic: the shared helper is the only source
    // of labels in the file.
    expect(header.match(/replace\(/g) ?? []).toHaveLength(0);
  });
});

describe('url.ts — precomputed tz → short-code reverse map', () => {
  it('references CITY_CODE_MAP in a precomputed reverse map, not per-tz', () => {
    const occurrences = url.match(/CITY_CODE_MAP/g) ?? [];
    expect(occurrences.length).toBe(1);
    expect(url).toMatch(/TZ_TO_SHORT_CODE/);
  });

  it('buildUrlQuery contains no per-tz CITY_CODE_MAP scan loop', () => {
    const body = url.slice(url.indexOf('export function buildUrlQuery'));
    expect(body).not.toMatch(/Object\.entries\(CITY_CODE_MAP\)/);
    expect(body).not.toMatch(/for\s*\(/);
  });
});

describe('TimezonePicker.tsx — memoized getAllTimeZones()', () => {
  it('memoizes the picker list per render with useMemo', () => {
    expect(picker).toMatch(/useMemo/);
    expect(picker).toMatch(/useMemo\([^)]*getAllTimeZones/);
  });
});

describe('useAppState.tsx — setViewDate decision is documented', () => {
  it('documents that view-date changes clear the selection (keep behavior)', () => {
    const anchor = useAppState.indexOf('setViewDate');
    expect(anchor).toBeGreaterThan(-1);
    const before = useAppState.slice(0, anchor);
    const lines = before.split('\n').slice(-8).join('\n');
    expect(lines).toMatch(/selection/i);
    expect(lines).toMatch(/clear/i);
  });
});
