/**
 * Polish backlog (ticket #16) — the review findings from #4.
 *
 * Each finding is a mechanical, comment-level polish item, so the tests pin the
 * comment's presence and shape directly. Behavior is pinned by the existing iCal
 * folding / escapeICal tests in __tests__/utils/export.test.ts and the source-shape
 * tests in __tests__/polish.test.ts.
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

describe('polish backlog #16 — review findings re #4', () => {
  it('anchors the escapeICal mirror comment to the symbol name, not a stale line range', () => {
    // The mirror lives in __tests__/utils/export.ts alongside the tests that use it;
    // it must name the symbol it mirrors, not a line range that drifts as the file moves.
    expect(exportTest).toMatch(/Mirror of the private escapeICal\b/);
    expect(exportTest, 'mirror comment must not cite a line range').not.toMatch(/lines?\s*~?\d/i);
  });

  it('states the continuation-budget invariant on the folding budget mutation', () => {
    const lines = exportSource.split('\n');
    const mutationIndex = lines.findIndex((l) => /budget\s*=\s*74/.test(l));
    expect(mutationIndex, 'expected a `budget = 74` mutation in foldICalLine').toBeGreaterThan(-1);
    expect(
      lines[mutationIndex],
      'the folding mutation must carry a comment stating the continuation-budget invariant (continuations hold ≤74 octets, + leading space = ≤75)'
    ).toMatch(/\/\/.*continuation-budget invariant.*75/i);
  });

  it('notes that the polish tests encode source-shape, not behavior', () => {
    expect(polishTest).toMatch(/source-shape/i);
  });
});
