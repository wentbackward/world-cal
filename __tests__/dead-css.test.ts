/**
 * Dead CSS classes in components.css (ticket #13).
 *
 * Pins the ticket's acceptance criterion: no dead class remains in
 * components.css, no dead class is referenced from any src/ or __tests__/
 * file, and every class selector left in components.css is actually rendered
 * (by a component, or by a test).
 *
 * The dead class names are assembled from parts on purpose: this file must
 * not itself contain a literal dead name, or the "nowhere referenced" scan
 * would match the test file alone (same approach as __tests__/dead-code.test.ts).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_CSS = join('src', 'styles', 'components.css');

const DEAD_CLASS_PARTS: string[][] = [
  ['timezone', '-row'],
  ['timezone', '-spacer'],
  ['timezone', '-header'],
  ['timezone', '-header', '--primary'],
  ['timezone', '-label'],
  ['timezone', '-offset'],
  ['swap', '-btn'],
  ['day', '-group'],
  ['day', '-row'],
  ['day', '-spacer'],
  ['day', '-wrapper'],
  ['day', '-header'],
  ['day', '-header', '--today'],
  ['day', '-weekday'],
  ['day', '-date'],
  ['day', '-badge'],
  ['grid', '-body'],
  ['time', '-axis'],
  ['time', '-slot'],
  ['cells', '-container'],
  ['hour', '-row'],
  ['cell', '-group'],
  ['grid', '-cell'],
  ['grid', '-cell', '--core'],
  ['grid', '-cell', '--extended'],
  ['grid', '-cell', '--outside'],
  ['grid', '-cell', '--selected'],
  ['btn', '--add'],
  ['btn', '--share'],
];

const DEAD_CLASSES = DEAD_CLASS_PARTS.map((parts) => parts.join(''));

const TYPES_TS = join('src', 'types', 'index.ts');

/**
 * The closed set of values for the `prefix--${…}` dynamic-suffix families in this
 * codebase — parsed from the ShadingClass union in src/types/index.ts so the pin
 * cannot drift from the real values. Throws if the union cannot be parsed: the
 * pin is closed, not permissive.
 */
function shadingClassValues(): string[] {
  let src: string;
  try {
    src = readFileSync(join(process.cwd(), TYPES_TS), 'utf8');
  } catch {
    throw new Error(`dead-css.test.ts: missing file '${TYPES_TS}' — the #13 pins live in this file`);
  }
  const m = src.match(/ShadingClass\s*=\s*([^;]+);/);
  if (!m) {
    throw new Error('dead-css.test.ts: could not find the ShadingClass union in src/types/index.ts');
  }
  const values = [...m[1]!.matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] ?? x[2]!);
  if (values.length === 0) {
    throw new Error('dead-css.test.ts: ShadingClass union parsed to zero values');
  }
  return values;
}

const SHADING_CLASS_VALUES = shadingClassValues();

function readComponentsCss(): string {
  try {
    return readFileSync(join(process.cwd(), COMPONENTS_CSS), 'utf8');
  } catch {
    throw new Error(`dead-css.test.ts: missing file '${COMPONENTS_CSS}' — the #13 pins live in this file`);
  }
}

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(join('src'));
  walk(join('__tests__'));
  return out;
}

/**
 * Class tokens actually used by the app or its tests — the complete definition
 * of "rendered": the app never styles anything outside className, so every
 * class that matters is reachable through the three className patterns used in
 * this codebase, plus the querySelector selectors tests use to find them:
 *  1. className="a b …" (plain static string);
 *  2. className={` … ${…} … `} (template literal — static chunks, the quoted
 *     strings inside the template (e.g. the ternary `'tz-cell--selected'`), and
 *     the closed set of dynamic-suffix classes (`prefix--${…}` expanded against
 *     the real values — see below);
 *  3. className={… ? 'a' : 'b'} (JSX expression with a ternary class list — no
 *     backticks inside, so the quoted-string regex stays inside one expression);
 * plus single/double-quoted `.class-name` strings in tests (querySelector /
 * querySelectorAll).
 *
 * The dynamic-suffix families in this codebase (e.g. `tz-cell--${shading}`) are
 * pinned to the closed set of values, never to a bare `X--` prefix: a bare
 * prefix would treat any `X--*` class as rendered. The suffix values are parsed
 * at runtime from the ShadingClass union in src/types/index.ts so the pin cannot
 * drift.
 */
function collectTokens(text: string): { tokens: Set<string> } {
  const tokens = new Set<string>();
  const add = (raw: string) => {
    for (const tok of raw.split(/\s+/)) {
      const t = tok.replace(/^\.+/, '');
      if (/^[a-z][a-z0-9-]*$/.test(t)) tokens.add(t);
    }
  };
  const addInner = (raw: string) => {
    for (const m of raw.matchAll(/'([^']*)'|"([^"]*)"/g)) add(m[1] ?? m[2]!);
  };
  for (const m of text.matchAll(/className="([^"]+)"/g)) add(m[1]!);
  for (const m of text.matchAll(/className=\{`([^`]*)`\}/g)) {
    add(m[1]!.replace(/\$\{[^}]*\}/g, ' '));
    addInner(m[1]!);
    // Closed set: expand each `prefix--${…}` dynamic suffix against the real values
    // (parsed from the ShadingClass union) — never a bare `prefix--` token.
    for (const mm of m[1]!.matchAll(/([a-z][a-z0-9-]*)--\$\{[A-Za-z_$][\w$]*\}/g)) {
      for (const v of SHADING_CLASS_VALUES) tokens.add(`${mm[1]}--${v}`);
    }
  }
  for (const m of text.matchAll(/className=\{([^`][^}]*)\}/g)) addInner(m[1]!);
  for (const m of text.matchAll(/['"](\.[a-z][a-z0-9-]*)['"]/g)) add(m[1]!);
  return { tokens };
}

function referencedRefs(): { tokens: Set<string> } {
  const tokens = new Set<string>();
  for (const file of sourceFiles()) {
    const { tokens: ts } = collectTokens(readFileSync(file, 'utf8'));
    for (const t of ts) tokens.add(t);
  }
  return { tokens };
}

function isReferenced(klass: string, tokens: Set<string>): boolean {
  return tokens.has(klass);
}

describe('dead CSS classes — components.css carries no dead rules', () => {
  const css = readComponentsCss();

  it('removes every dead class the ticket names, plus the same-file dead ones found in the pass', () => {
    for (const dead of DEAD_CLASSES) {
      expect(css, `components.css still defines .${dead}`).not.toMatch(new RegExp(`\\.${dead}\\b`));
    }
  });

  it('does not name any dead class anywhere in src/ or __tests__/', () => {
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const dead of DEAD_CLASSES) {
        // Class-like boundary on both sides: a real class reference (selector,
        // className, querySelector) never looks like `--spacing-time-axis-width`.
        expect(text, `${file} still references .${dead}`).not.toMatch(
          new RegExp(`(^|[^-a-z0-9])${dead}([^-a-z0-9]|$)`, 'i'),
        );
      }
    }
  });

  it('leaves only classes that are actually rendered', () => {
    const classes = new Set<string>();
    for (const m of css.matchAll(/\.([a-z][a-z0-9-]*)/gi)) classes.add(m[1]!.toLowerCase());
    const { tokens } = referencedRefs();
    for (const klass of classes) {
      expect(
        isReferenced(klass, tokens),
        `components.css defines .${klass} but nothing renders it`,
      ).toBe(true);
    }
  });

  it('pins the dynamic tz-cell-- suffix to the closed ShadingClass set — a hypothetical suffix is unrendered', () => {
    const { tokens } = referencedRefs();
    for (const v of SHADING_CLASS_VALUES) {
      expect(isReferenced(`tz-cell--${v}`, tokens), `tz-cell--${v} must be rendered`).toBe(true);
    }
    expect(
      isReferenced('tz-cell--hypothetical', tokens),
      'a hypothetical tz-cell--<unknown> class must not be treated as rendered',
    ).toBe(false);
  });
});
