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

/** Escape a name for safe interpolation into a RegExp. */
function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 * Validate the brace-balance of the first `tz-cell--${…}` suffix in a template expression —
 * a bare identifier (`${shading}`), a call (`${getShading(h)}`), a method call
 * (`${shading.trim()}`), a nested-brace expression (`${cond ? {a: 'b'} : 'c'}`) or a
 * brace inside a string literal (`${cond ? '}' : 'x'}`) all validate. Braces inside
 * single/double-quoted string literals are not counted (backslash escapes honored). A
 * template this parser cannot balance must never be silently skipped (→ a misleading
 * "tz-cell--core must be rendered" failure) nor silently expanded (→ the closed set
 * claiming a rendering that never happened); it throws a named, actionable error.
 * Validate-only: this returns nothing — the pin expands the closed set because the call
 * site (src/components/CalendarGrid.tsx) guarantees the suffix is a ShadingClass value;
 * the parser does not (and does not claim to) assert that. Only the first
 * `tz-cell--${` in a template is validated; one occurrence exists in the codebase today.
 * Known gap: the anchor is the literal string wherever it appears, even inside a string
 * literal of the template itself (e.g. `${cond ? 'tz-cell--${zz}' : ''} tz-cell--${shading}`) —
 * the scan would start at the `{` inside that literal, validate the wrong thing and expand
 * the closed set. Documented, not handled.
 */
function parseTzCellSuffix(text: string): void {
  const braceAt = text.indexOf('{', text.indexOf('tz-cell--${'));
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let j = braceAt; j < text.length; j++) {
    const c = text[j]!;
    if (quote !== null) {
      if (c === '\\') {
        j++; // escape — the next character is literal
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c as "'" | '"';
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return;
    }
  }
  throw new Error(
    'dead-css.test.ts: cannot parse the dynamic suffix in a tz-cell--${…} template — extend the pin to accept this shape deliberately',
  );
}

/**
 * Class tokens actually used by the app or its tests — the complete definition
 * of "rendered": the app never styles anything outside className, so every
 * class that matters is reachable through the three className patterns used in
 * this codebase, plus the querySelector selectors tests use to find them:
 *  1. className="a b …" (plain static string);
 *  2. className={` … ${…} … `} (template literal — static chunks, the quoted
 *     strings inside the template (e.g. the ternary `'tz-cell--selected'`), and
 *     the closed set of dynamic-suffix classes (`tz-cell--${…}` expanded against
 *     the real values — see below);
 *  3. className={… ? 'a' : 'b'} (JSX expression with a ternary class list — no
 *     backticks inside, so the quoted-string regex stays inside one expression);
 * plus single/double-quoted `.class-name` strings in tests (querySelector /
 * querySelectorAll).
 *
 * The one dynamic-suffix family in this codebase (`tz-cell--${shading}`) is
 * pinned to the closed set of values parsed from the ShadingClass union in
 * src/types/index.ts — never to a bare `X--` prefix (a bare prefix would treat
 * any `X--*` class as rendered) and never to a sibling family: a future
 * `prefix--${…}` template (e.g. `btn--${…}`) must not inherit the tz-cell closed
 * set, so the expansion is pinned to the `tz-cell` family and nothing else.
 * Bare `tz-cell--` tokens (the static chunk of `tz-cell--${…}`) are dropped in
 * add(), so an unrendered `tz-cell--*` rule can never match the set.
 */
function collectTokens(text: string): { tokens: Set<string> } {
  const tokens = new Set<string>();
  const add = (raw: string) => {
    for (const tok of raw.split(/\s+/)) {
      const t = tok.replace(/^\.+/, '');
      // A bare `tz-cell--` token (the static chunk of `tz-cell--${…}`) is dropped:
      // only the closed-set expansions are rendered.
      if (/^[a-z][a-z0-9-]*$/.test(t) && !t.endsWith('--')) tokens.add(t);
    }
  };
  const addInner = (raw: string) => {
    for (const m of raw.matchAll(/'([^']*)'|"([^"]*)"/g)) add(m[1] ?? m[2]!);
  };
  for (const m of text.matchAll(/className="([^"]+)"/g)) add(m[1]!);
  for (const m of text.matchAll(/className=\{`([^`]*)`\}/g)) {
    add(m[1]!.replace(/\$\{[^}]*\}/g, ' '));
    addInner(m[1]!);
    // Closed set, pinned to the tz-cell family: expand `tz-cell--${…}` against the
    // real values (parsed from the ShadingClass union). Any other `prefix--${…}`
    // family is left alone — a future button family must not inherit these values.
    // A bare `tz-cell--` token is dropped in add() above.
    // A suffix the parser cannot balance is rejected with a named error (fail closed)
    // instead of a misleading "must be rendered" failure downstream.
    if (m[1]!.includes('tz-cell--${')) {
      parseTzCellSuffix(m[1]!);
      for (const v of SHADING_CLASS_VALUES) tokens.add(`tz-cell--${v}`);
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
      expect(css, `components.css still defines .${dead}`).not.toMatch(new RegExp(`\\.${escaped(dead)}\\b`));
    }
  });

  // Strict pin by design: dead names are forbidden even in comments/prose — stricter than the acceptance warrants; future doc comments must use part-assembly like the header does.
  it('does not name any dead class anywhere in src/ or __tests__/', () => {
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const dead of DEAD_CLASSES) {
        // Class-like boundary on both sides: a real class reference (selector,
        // className, querySelector) never looks like `--spacing-time-axis-width`.
        expect(text, `${file} still references .${dead}`).not.toMatch(
          new RegExp(`(^|[^-a-z0-9])${escaped(dead)}([^-a-z0-9]|$)`, 'i'),
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

  it('does not expand a non-tz-cell dynamic-suffix family against the ShadingClass values', () => {
    // Synthetic input: a future prefix--${…} template (e.g. btn--) must not inherit
    // the tz-cell family's closed set. `shading` here is only raw template text —
    // no real file contains it.
    const { tokens } = collectTokens('className={`btn--${shading}`}');
    for (const v of SHADING_CLASS_VALUES) {
      expect(
        tokens.has(`btn--${v}`),
        `btn--${v} must not be treated as rendered`,
      ).toBe(false);
    }
  });

  it('expands any brace-balanced tz-cell-- suffix expression against the closed ShadingClass set', () => {
    // Synthetic inputs: a future `tz-cell--${getShading(h)}`, `tz-cell--${shading.trim()}`,
    // a nested-brace expression or a brace inside a string literal must still expand the
    // closed set — not fall back to "must be rendered", which would report the wrong
    // problem. No real file contains any of these expressions. Part-assembled (like the
    // unbalanced test and the DEAD_CLASS_PARTS header) so this file's own dead-name scan
    // and referencedRefs() self-scan cannot see the raw templates and satisfy the pin
    // with the file's own text instead of the app's.
    for (const template of [
      ['className={`', 'tz-cell--', '${getShading(localHour)}', '`}'].join(''),
      ['className={`', 'tz-cell--', '${shading.trim()}', '`}'].join(''),
      ['className={`', 'tz-cell--', "${cond ? {a: 'b'} : 'c'}", '`}'].join(''),
      ['className={`', 'tz-cell--', "${cond ? '}' : 'x'}", '`}'].join(''),
    ]) {
      const { tokens } = collectTokens(template);
      for (const v of SHADING_CLASS_VALUES) {
        expect(tokens.has(`tz-cell--${v}`), `tz-cell--${v} must be treated as rendered`).toBe(true);
      }
    }
  });

  it('throws a named error for a tz-cell-- suffix the pin cannot balance — no silent skip or silent expansion', () => {
    // Part-assembled (like the expands test) so this file's own referencedRefs()
    // self-scan cannot see the raw template and satisfy the closed-set pin with this
    // file's own text instead of the app's.
    const unbalanced = [
      'className={`',
      'tz-cell--',
      '${',
      'getShading(localHour',
      '`',
      '}',
    ].join('');
    expect(() => collectTokens(unbalanced)).toThrow(/cannot parse the dynamic suffix in a tz-cell--/);
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
    expect(
      isReferenced('tz-cell--', tokens),
      'a bare tz-cell-- token must not be treated as rendered',
    ).toBe(false);
  });
});
