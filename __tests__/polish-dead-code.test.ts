/**
 * Polish backlog — dead-code (ticket #14) — the review findings from #4.
 *
 * Each finding is a mechanical, docs-level polish item, so the tests pin the
 * source shape directly: the spec's §2 routing bullet no longer routes
 * getLocalHour through getOffsetMs (the recorded deviation in DECISIONS.md and
 * issue #2), variables.css carries only variables referenced in src/ (the three
 * flagged dead definitions are gone), and the getLocalHour decision is a short
 * summary line plus a wrapped paragraph. Behavior is pinned by the behavior
 * tests in __tests__/utils/timezone.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = join('docs', 'superpowers', 'specs', '2026-04-28-code-quality-improvements.md');
const DECISIONS = join('docs', 'DECISIONS.md');
const VARIABLES_CSS = join('src', 'styles', 'variables.css');

function SRC(p: string): string {
  try {
    return readFileSync(join(process.cwd(), p), 'utf8');
  } catch {
    throw new Error(`polish-dead-code.test.ts: missing file '${p}' — the #14 polish findings pin this file (see ticket #14)`);
  }
}

function srcFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...srcFiles(p));
    else out.push(p);
  }
  return out;
}

describe('polish dead-code — spec §2 routing bullet narrowed to match the recorded decision', () => {
  const spec = SRC(SPEC);
  const specLines = spec.split('\n');
  const start = specLines.findIndex((l) => l.trim().startsWith('- Remove `getTzOffset`'));
  expect(start, 'expected a spec bullet starting with "- Remove `getTzOffset`"').toBeGreaterThan(-1);
  const block: string[] = [];
  for (let i = start; i < specLines.length; i++) {
    const line = specLines[i];
    if (i > start && (line === undefined || !/^\s{1,}\S/.test(line))) break;
    if (line !== undefined) block.push(line);
  }
  const bullet = block.join('\n');

  it('still routes getOffsetLabel and createDateAtTime through getOffsetMs', () => {
    expect(bullet.length, 'expected a §2 routing bullet starting with "- Remove `getTzOffset`"').toBeGreaterThan(0);
    expect(bullet).toContain('getOffsetMs');
    expect(bullet).toMatch(/getOffsetLabel/);
    expect(bullet).toMatch(/createDateAtTime/);
  });

  it('does not route getLocalHour through getOffsetMs (the recorded deliberate deviation)', () => {
    const routingClause = bullet.slice(0, bullet.indexOf('getOffsetMs'));
    expect(routingClause).not.toContain('getLocalHour');
  });

  it('records the deliberate exception instead of silently dropping it', () => {
    const after = bullet.slice(bullet.indexOf('getOffsetMs'));
    expect(after).toContain('getLocalHour');
    expect(after).toMatch(/deliberate exception/i);
  });
});

describe('polish dead-code — variables.css carries only live variables', () => {
  const variablesCss = SRC(VARIABLES_CSS);

  it('carries no definitions of the three flagged dead variables', () => {
    expect(variablesCss).not.toContain('--color-grid-border');
    expect(variablesCss).not.toContain('--color-grid-header-bg');
    expect(variablesCss).not.toContain('--spacing-tz-header-width');
  });

  it('defines only variables referenced in src/ (nothing else is dead)', () => {
    const defs = [...variablesCss.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]!.toLowerCase());
    const others = srcFiles(join('src'))
      .filter((f) => !f.endsWith(join('src', 'styles', 'variables.css')))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
      .toLowerCase();
    for (const def of defs) {
      const usage = new RegExp(`var\\(\\s*${def}(?:\\s*,[^)]*)?\\s*\\)`, 'i');
      expect(usage.test(others), `${def} is defined in variables.css but referenced nowhere in src/`).toBe(true);
    }
  });
});

describe('polish dead-code — the getLocalHour decision is a short line plus a wrapped paragraph', () => {
  const decisions = SRC(DECISIONS);
  const lines = decisions.split('\n');
  const entryIndex = lines.findIndex((l) => /^- 2026-11-21 — `getLocalHour`/.test(l));
  const entry = lines[entryIndex];

  // 250 chars keeps the summary line a single bullet (the original was ~1,400); 160 chars per detail
  // line keeps the rationale paragraph wrapped like the other DECISIONS.md entries.
  it('is a short summary line (not the ~1,400-char single line)', () => {
    expect(entry?.length, 'expected the 2026-11-21 getLocalHour decision entry').toBeGreaterThan(0);
    expect(entry!.length).toBeLessThanOrEqual(250);
  });

  it('wraps the full rationale into an indented paragraph beneath the summary line', () => {
    const block: string[] = [];
    for (let i = entryIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined && /^\s{2}\S/.test(line)) block.push(line.trim());
      else break;
    }
    const details = block.join(' ');
    expect(block.length, 'expected an indented detail paragraph under the summary line').toBeGreaterThanOrEqual(2);
    expect(details).toMatch(/h24/);
    expect(details).toMatch(/24 → 0/);
    expect(details).toMatch(/getOffsetMs/);
    expect(details).toMatch(/deviation/i);
    for (const line of block) {
      expect(line.length, 'detail paragraph lines must be wrapped (< 160 chars)').toBeLessThanOrEqual(160);
    }
  });
});
