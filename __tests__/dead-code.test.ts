/**
 * Dead-code removal pass (ticket #3).
 *
 * Pins the acceptance criteria: the removed files no longer exist, the removed
 * symbols are referenced nowhere in src/ or __tests__/, App.css carries no
 * :root block, url.ts delegates the browser-timezone detection to
 * utils/timezone, and every CSS variable referenced by App.css /
 * components.css is defined exactly once.
 *
 * Symbol names are assembled from parts on purpose: this file must not itself
 * match the acceptance grep for the removed symbols, or the criterion would
 * fail on the test file alone.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REMOVED_FILES = [
  join('src', 'index' + '.css'),
  join('src', 'styles', 'grid' + '.css'),
  join('src', 'hooks', 'use' + 'The' + 'me' + '.tsx'),
  join('src', 'components', 'Loading' + 'Spinner' + '.tsx'),
  join('src', 'components', 'constants' + '.ts'),
];

const REMOVED_SYMBOLS: { name: string; boundary?: boolean }[] = [
  { name: 'index' + '.css' },
  { name: 'grid' + '.css' },
  { name: 'Loading' + 'Spinner' },
  { name: 'TIMEZONE_' + 'COLORS' },
  { name: 'use' + 'The' + 'me' },
  { name: 'T' + 'heme' + 'Provider' },
  { name: 'T' + 'heme', boundary: true },
];

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

// Scope is src/ and __tests__/ only: a literal removed symbol re-appearing in
// docs/ or README.md is outside the acceptance criteria (and of this test) and
// is intentionally not detected.
function sourceFiles(): string[] {
  return [
    ...listFiles(join('src')),
    ...listFiles(join('__tests__')),
  ];
}

function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SYMBOL_PATTERN = new RegExp(
  REMOVED_SYMBOLS.map((s) => (s.boundary ? `${escaped(s.name)}\\b` : escaped(s.name))).join('|'),
);

describe('dead-code removal — removed files', () => {
  it('removed files do not exist', () => {
    for (const file of REMOVED_FILES) {
      expect(existsSync(join(process.cwd(), file)), `${file} must not exist`).toBe(false);
    }
  });
});

describe('dead-code removal — removed symbols', () => {
  it('removed symbols are referenced nowhere in src/ or __tests__/', () => {
    for (const file of sourceFiles()) {
      const content = readFileSync(file, 'utf8');
      const match = content.match(SYMBOL_PATTERN);
      expect(match, `${file} still references a removed symbol: ${match?.[0]}`).toBeNull();
    }
  });

  it('src/types/index.ts no longer declares the orphaned type alias', () => {
    const types = readFileSync(join('src', 'types', 'index.ts'), 'utf8');
    const alias = new RegExp(`^\\s*(?:export\\s+)?type\\s+${escaped('T' + 'heme')}\\b`, 'm');
    expect(types).not.toMatch(alias);
  });
});

describe('dead-code removal — App.css', () => {
  it('carries no :root block', () => {
    const appCss = readFileSync(join('src', 'App.css'), 'utf8');
    expect(appCss).not.toMatch(/^\s*:root/m);
  });
});

describe('dead-code removal — url.ts', () => {
  it('does not define its own browser-timezone detector', () => {
    const url = readFileSync(join('src', 'utils', 'url.ts'), 'utf8');
    const detector = 'getLocal' + 'Timezone';
    expect(url).not.toMatch(new RegExp(`function\\s+${detector}\\b`));
  });

  it('imports the browser-timezone detector from utils/timezone', () => {
    const url = readFileSync(join('src', 'utils', 'url.ts'), 'utf8');
    const detector = 'getLocal' + 'Timezone';
    const importRe = new RegExp(
      `import\\s*\\{[^}]*\\b${detector}\\b[^}]*\\}\\s*from\\s*['"](?:\\./timezone|\\.\\./utils/timezone)['"]`,
    );
    expect(url).toMatch(importRe);
  });
});

describe('dead-code removal — CSS variables', () => {
  const cssFiles = [
    join('src', 'styles', 'variables.css'),
    join('src', 'App.css'),
    join('src', 'styles', 'components.css'),
  ];

  function definitions(): Map<string, number> {
    // Local-scope definitions (e.g. --row-header-width and --row-h in
    // components.css) are counted on purpose: the check enforces exactly one
    // definition per referenced variable wherever it lives, not only in
    // :root.
    const counts = new Map<string, number>();
    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf8');
      for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
        const name = m[1]!.toLowerCase();
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return counts;
  }

  it('every CSS variable referenced by App.css and components.css is defined exactly once', () => {
    const refs = new Set<string>();
    for (const file of [join('src', 'App.css'), join('src', 'styles', 'components.css')]) {
      const css = readFileSync(file, 'utf8');
      for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
        refs.add(m[1]!.toLowerCase());
      }
    }
    const defs = definitions();
    for (const ref of refs) {
      expect(defs.get(ref), `${ref} is referenced but defined ${defs.get(ref) ?? 0} times`).toBe(1);
    }
  });
});
