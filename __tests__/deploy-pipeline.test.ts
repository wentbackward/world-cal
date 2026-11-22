import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  version: string;
  scripts?: Record<string, string>;
};

/** Extract the block for one top-level job under `jobs:` (2-space indent). */
function jobBlock(name: string): string {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`  ${name}:`));
  if (start === -1) {
    throw new Error(`job '${name}' not found in .github/workflows/deploy.yml`);
  }
  const rest = lines.slice(start);
  const end = rest.findIndex(
    (line, i) => i > 0 && (/^ {2}[A-Za-z0-9_-]+:/.test(line) || /^[A-Za-z_]/.test(line)),
  );
  return end === -1 ? rest.join('\n') : rest.slice(0, end).join('\n');
}

/**
 * Extract the build job's `if:` value, unfolding a multi-line block scalar
 * the way YAML folds it (lines joined with a single space). Throws loudly on
 * a missing job/`if:` or an unsupported scalar — a broken workflow must fail
 * at the right place, not as a mismatched assertion on an empty block.
 */
function buildJobIf(block: string): string {
  const lines = block.split('\n');
  const idx = lines.findIndex((line) => /^\s*if:/.test(line));
  if (idx === -1) throw new Error(`build job has no 'if:' line`);
  const line = lines[idx] ?? '';
  const indent = /^\s*/.exec(line)?.[0].length ?? 0;
  const rest = line.slice(line.indexOf('if:') + 3).trim();
  if (/^>-?$/.test(rest)) {
    const parts: string[] = [];
    for (let i = idx + 1; i < lines.length; i++) {
      const candidate = lines[i] ?? '';
      if (candidate.trim() === '') break; // blank line ends the scalar (defensive)
      const match = /^(\s*)(.*)$/.exec(candidate);
      if (!match || (match[1]?.length ?? 0) <= indent) break;
      parts.push((match[2] ?? '').trim());
    }
    if (parts.length === 0) throw new Error(`build job's 'if: >-' has no value lines`);
    return parts.join(' ');
  }
  if (/^[>|]/.test(rest)) {
    throw new Error(`build job's 'if:' uses an unsupported block scalar '${rest}'`);
  }
  if (rest === '') throw new Error(`build job's 'if:' has no value`);
  return rest;
}

/** Extract the `run: |` bash body of the version-check job (10-space indent). */
function versionCheckBash(): string {
  const jobStart = workflow.indexOf('  version-check:');
  if (jobStart === -1) {
    throw new Error(`job 'version-check' not found in .github/workflows/deploy.yml`);
  }
  const rest = workflow.slice(jobStart);
  const lines = rest.split('\n');
  const runLine = lines.findIndex((line) => /^\s*run: \|$/.test(line));
  const body: string[] = [];
  for (const line of lines.slice(runLine + 1)) {
    if (line.trim() === '') {
      body.push('');
      continue;
    }
    const match = line.match(/^ {10}(.*)$/);
    if (!match || match[1] === undefined) break;
    body.push(match[1]);
  }
  const script = body.join('\n').replace(/\n+$/, '');
  if (!script) throw new Error('could not extract version-check bash script');
  return script;
}

/** Run the extracted script with a fake tag + temp GITHUB_OUTPUT. */
function runVersionGate(tag: string): { code: number; output: string } {
  const dir = mkdtempSync(join(tmpdir(), 'version-gate-'));
  try {
    const script = join(dir, 'gate.sh');
    const out = join(dir, 'github_output');
    writeFileSync(script, versionCheckBash() + '\n', 'utf8');
    let code = 0;
    try {
      execFileSync('bash', [script], {
        cwd: process.cwd(), // repo root — script reads ./package.json
        env: { ...process.env, GITHUB_REF_NAME: tag, GITHUB_OUTPUT: out },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      });
    } catch (error) {
      code = (error as { status?: number }).status ?? 1;
    }
    return { code, output: existsSync(out) ? readFileSync(out, 'utf8') : '' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const onBlock = workflow.slice(0, workflow.indexOf('jobs:'));
const testJob = jobBlock('test');
const versionCheckJob = jobBlock('version-check');
const buildJob = jobBlock('build');
const deployJob = jobBlock('deploy');

describe('deploy workflow — job parsing', () => {
  it('fails loudly when a job name does not match', () => {
    expect(() => jobBlock('does-not-exist-job')).toThrow(/does-not-exist-job/);
  });
});

describe('buildJobIf — fake-block self-test', () => {
  it('throws loudly on a missing if:, an unsupported scalar, and an empty value', () => {
    // A broken workflow must fail at the right place, not as a mismatched assertion
    // on an empty block — pin every throw branch of the helper on fake blocks.
    expect(() => buildJobIf('  build:\n    name: Build\n')).toThrow(/no 'if:' line/);
    expect(() => buildJobIf('  build:\n    if: |\n      needs: x\n')).toThrow(/unsupported block scalar/);
    expect(() => buildJobIf('  build:\n    if: >+\n      needs: x\n')).toThrow(/unsupported block scalar/);
    expect(() => buildJobIf('  build:\n    if:\n')).toThrow(/has no value/);
    expect(() => buildJobIf('  build:\n    if: >-\n')).toThrow(/has no value lines/);
  });
});

describe('deploy workflow — triggers', () => {
  it('triggers the lightweight gate on main pushes, tag pushes, PRs and manual dispatch', () => {
    expect(onBlock).toContain('branches: [main]');
    // The on: glob must match any tag name (incl. slash-carrying candidates);
    // the version gate's regex is the actual stable/candidate discriminator.
    expect(onBlock).toContain("tags: ['**']");
    expect(onBlock).toContain('pull_request:');
    expect(onBlock).toContain('workflow_dispatch:');
  });

  it('runs only the unit-test gate for main/PR/candidate-tag paths (no build, publish or deploy steps)', () => {
    expect(testJob).not.toMatch(/^\s*if:/m); // gate must run on every trigger
    expect(testJob).toContain('npm run lint');
    expect(testJob).toContain('npm test -- --run');
    expect(testJob).not.toContain('npm run build');
    expect(testJob).not.toMatch(/docker|login-action|build-push-action|ssh-action/);
  });

  it('pins the build job if: to the exact stable-tag + workflow_dispatch condition', () => {
    // The folded block scalar is the whole point of the rewrite (easier to
    // review); the value itself must stay byte-identical to the guard that
    // keeps a candidate/mismatched tag from reaching the live deploy.
    expect(buildJob).toMatch(/if:\s*>-/);
    expect(buildJobIf(buildJob)).toBe(
      "needs.test.result == 'success' && (github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && needs.version-check.outputs.ok == 'true'))",
    );
  });

  it('runs deploy straight from the build job with no unguarded trigger', () => {
    expect(deployJob).toContain('needs: build');
    expect(deployJob).not.toMatch(/^\s*if:/m);
  });
});

describe('deploy workflow — version gate', () => {
  it('runs the version check before build in the needs graph', () => {
    expect(buildJob).toMatch(/needs:\s*\[test, version-check\]/);
  });

  it('runs on every trigger and no-ops non-tag refs via the semver pattern', () => {
    // The job must run on every trigger: the build job's needs-chain
    // would inherit "skipped" for workflow_dispatch otherwise, leaving
    // the operator escape hatch unable to run. The tag-only gate lives
    // in the script (the semver pattern reports ok=false for any ref
    // that does not match) and in the build job's `if` (tag pushes run
    // only with ok=true; workflow_dispatch runs regardless).
    expect(versionCheckJob).not.toMatch(/^\s*if:/m); // must not be skipped
    expect(versionCheckJob).toContain('ok=false'); // any non-matching ref
    expect(buildJobIf(buildJob)).toContain("startsWith(github.ref, 'refs/tags/')"); // the dispatch/tag split lives in the build job's if:
  });

  it('pins Node 20 via setup-node (the gate does not rely on the runner pre-installed node)', () => {
    expect(versionCheckJob).toContain('actions/setup-node@v4');
    expect(versionCheckJob).toContain('node-version: 20');
  });

  it('configures no npm cache (the job installs no dependencies, so the cache would never hit)', () => {
    expect(versionCheckJob).not.toMatch(/cache:\s*npm/);
  });

  it('rejects mismatched tags with a non-zero exit', () => {
    expect(versionCheckJob).toContain('exit 1');
  });

  it('does not fail candidate tags — reports ok=false so no build/publish/deploy jobs run', () => {
    expect(versionCheckJob).toContain('ok=false');
    expect(versionCheckJob).toContain('ok=true');
    expect(buildJob).toContain("needs.version-check.outputs.ok == 'true'");
  });

  it('refuses tags that disagree with package.json version', () => {
    expect(versionCheckJob).toContain(
      "^v[0-9]+\\.[0-9]+\\.[0-9]+$",
    );
    expect(versionCheckJob).toMatch(/package\.json/);
    expect(versionCheckJob).toMatch(/PKG_VERSION/);
  });

  it('accepts stable tags and rejects candidates/malformed tags', () => {
    const semver = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
    expect(semver.test('v1.2.3')).toBe(true);
    expect(semver.test('v0.1.0')).toBe(true);
    expect(semver.test('v1.2')).toBe(false);
    expect(semver.test('1.2.3')).toBe(false);
    expect(semver.test('v1.2.3.4')).toBe(false);
    expect(semver.test('v0.1.0-rc.1')).toBe(false);
    expect(semver.test('v1.2.3-rc')).toBe(false);
    expect(semver.test('v1.2.3+build')).toBe(false);
  });
});

describe('deploy workflow — version gate (script-level)', () => {
  const stableTag = `v${packageJson.version}`;

  // A well-formed semver tag that disagrees with package.json's version —
  // derived, never hard-coded, so it stays valid as the version moves.
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);
  if (!match) throw new Error(`package.json version '${packageJson.version}' is not semver`);
  const mismatchTag = `v${match[1]}.${match[2]}.${Number(match[3]) + 1}`;

  it('exits 0 and reports ok=true for a stable tag matching package.json', () => {
    const { code, output } = runVersionGate(stableTag);
    expect(code).toBe(0);
    expect(output).toContain('ok=true');
  });

  it('exits non-zero and reports no ok=true for a stable tag that disagrees with package.json', () => {
    const { code, output } = runVersionGate(mismatchTag);
    expect(code).not.toBe(0);
    expect(output).not.toContain('ok=true');
  });

  it('exits 0 and reports ok=false for a candidate tag', () => {
    const { code, output } = runVersionGate(`v${packageJson.version}-rc.1`);
    expect(code).toBe(0);
    expect(output).toContain('ok=false');
    expect(output).not.toContain('ok=true');
  });

  it('exits 0 and reports ok=false for a malformed tag', () => {
    const { code, output } = runVersionGate('not-a-tag');
    expect(code).toBe(0);
    expect(output).toContain('ok=false');
    expect(output).not.toContain('ok=true');
  });
});

describe('deploy workflow — documentation', () => {
  it('documents workflow_dispatch as the operator escape hatch in a workflow comment', () => {
    expect(onBlock).toMatch(/#[^\n]*escape hatch/i);
    expect(onBlock).toContain('workflow_dispatch');
  });
});

describe('package.json — lint gate', () => {
  it('exposes eslint for the whole project', () => {
    expect(packageJson.scripts?.lint).toBe('eslint .');
  });

  it('carries a stable semver version (no v prefix)', () => {
    expect(packageJson.version).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });
});

describe('README Deployment section', () => {
  const deployment = readme.slice(
    readme.indexOf('## Deployment'),
    readme.indexOf('## Tech stack'),
  );

  it('describes the Docker image and GHCR publishing', () => {
    expect(deployment).toMatch(/Docker/i);
    expect(deployment).toMatch(/GHCR|ghcr\.io/i);
  });

  it('describes the CI/CD pipeline including the version gate', () => {
    expect(deployment).toMatch(/version/i);
    expect(deployment).toMatch(/gate/i);
  });

  it('documents workflow_dispatch as the operator escape hatch', () => {
    expect(deployment).toContain('workflow_dispatch');
    expect(deployment).toMatch(/escape hatch/i);
  });

  it('describes the Caddy reverse proxy', () => {
    expect(deployment).toMatch(/Caddy/i);
  });

  it('corrects the base note — assets are relative; the app serves from any path', () => {
    expect(deployment).toMatch(/relative/i);
    expect(deployment).toMatch(/any path/i);
  });
});
