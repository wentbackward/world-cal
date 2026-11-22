/**
 * Polish backlog (ticket #16) — the review findings from #4.
 *
 * Each finding is a mechanical, comment-level polish item, so the tests pin the
 * comment's presence and shape directly. Behavior is pinned by the iCal folding /
 * escapeICal tests in __tests__/utils/export.test.ts; source-shape tests pin shape only.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = (p: string) => {
  try {
    return readFileSync(join(process.cwd(), p), 'utf8');
  } catch {
    throw new Error(`polish-backlog.test.ts: missing file '${p}' — the #16 polish findings pin this file (see ticket #16)`);
  }
};

const exportTest = SRC(join('__tests__', 'utils', 'export.test.ts'));
const exportSource = SRC(join('src', 'utils', 'export.ts'));
const polishTest = SRC(join('__tests__', 'polish.test.ts'));

// The line-range pin must catch the phrasing class a stale range takes ("line 137",
// "lines ~137-141", "line numbers: ~137-141", "export.ts:137-139") — the phrasing class,
// not the exact words. `\b` keeps "newlines" from matching; `[ \t]+` keeps the gap on
// one line; the path form is `\w+\.(?:ts|tsx):\d`.
const LINE_RANGE_PATTERN = /\blines?(?:[ \t]+\w+)?[ \t]*:?[ \t]*~?[ \t]*\d|\w+\.(?:ts|tsx):\d/i;

// Slice the `//` comment block that contains the anchor line, from the line start
// through every consecutive `//` line — a stale range on a re-wrapped continuation
// line must not silently pass.
const sliceMirrorComment = (source: string, anchorIndex: number): string => {
  const lineStart = source.lastIndexOf('\n', anchorIndex) + 1;
  const block: string[] = [];
  for (const line of source.slice(lineStart).split('\n')) {
    if (/^\s*\/\//.test(line)) block.push(line);
    else break;
  }
  return block.join('\n');
};

describe('polish backlog #16 — review findings re #4', () => {
  it('anchors the escapeICal mirror comment to the symbol name, not a stale line range', () => {
    // The mirror lives in __tests__/utils/export.test.ts alongside the tests that use it;
    // it must name the symbol it mirrors, not a line range that drifts as the file moves.
    const anchorIndex = exportTest.indexOf('Mirror of the private escapeICal');
    expect(anchorIndex, 'expected the escapeICal mirror comment anchored to the symbol name').toBeGreaterThan(-1);
    // Scope the line-range check to the mirror-comment block itself — a legitimate
    // line range in another comment of this file must not flip this test. The block
    // must still contain the anchor, so a non-comment line can never vacate the check.
    const mirrorComment = sliceMirrorComment(exportTest, anchorIndex);
    expect(mirrorComment, 'mirror block slice must contain the anchor line').toContain('Mirror of the private escapeICal');
    // The slice stops at the first non-comment line — the escapeICalForTest mirror below
    // the block must not be swallowed into the check.
    expect(mirrorComment, 'mirror block slice must stop at the first non-comment line').not.toContain('escapeICalForTest');
    expect(mirrorComment, 'mirror comment must not cite a line range').not.toMatch(LINE_RANGE_PATTERN);
  });

  it('states the continuation-budget invariant on the folding budget mutation', () => {
    const lines = exportSource.split('\n');
    // Anchor on the `budget = 74` line that also carries the invariant comment —
    // a similar future line without the comment is not the mutation.
    const mutationIndex = lines.findIndex((l) => /budget\s*=\s*74/.test(l) && /continuation-budget invariant/i.test(l));
    expect(mutationIndex, 'expected a `budget = 74` mutation in foldICalLine carrying the continuation-budget invariant comment').toBeGreaterThan(-1);
    expect(
      lines[mutationIndex],
      'the folding mutation must carry a comment stating the continuation-budget invariant (continuations hold ≤74 octets, + leading space = ≤75)'
    ).toMatch(/\/\/.*continuation-budget invariant.*75/i);
    // Arithmetic pin: the line is " " + ≤74 octets (1 + 74 = 75). The CRLF is the
    // separator and counts nothing toward the line.
    expect(
      lines[mutationIndex],
      'the comment must state the leading-space octet and the arithmetic (1 + 74 = 75), not the CRLF separator, in the line'
    ).toMatch(/leading space[\s\S]*1\s*\+\s*74\s*=\s*75/i);
  });

  it('notes that the polish tests encode source-shape, not behavior', () => {
    expect(polishTest).toMatch(/source-shape/i);
  });

  it('matches the line-range phrasing class (word, range and path forms)', () => {
    // The stale ranges live in this phrasing class; all of these must match.
    for (const phrasing of [
      'line 137',
      'lines ~137-141',
      'line numbers: ~137-141',
      'line numbers:137',
      'line range 137',
      'export.ts:137-139',
      'it lives at export.ts:137-139',
      'export.tsx:137',
    ]) {
      expect(phrasing, `expected "${phrasing}" to match the line-range pattern`).toMatch(LINE_RANGE_PATTERN);
    }
    // Digit-free phrasings must not fire.
    for (const phrasing of ['the lines above', 'lines below', 'line numbers are described in the doc', 'the export.ts file', 'export.ts']) {
      expect(phrasing, `expected "${phrasing}" to NOT match the line-range pattern`).not.toMatch(LINE_RANGE_PATTERN);
    }
  });
});

