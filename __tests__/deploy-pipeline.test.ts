import { readFileSync } from 'node:fs';
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
  if (start === -1) return '';
  const rest = lines.slice(start);
  const end = rest.findIndex(
    (line, i) => i > 0 && (/^ {2}[A-Za-z0-9_-]+:/.test(line) || /^[A-Za-z_]/.test(line)),
  );
  return end === -1 || end === 0 ? rest.join('\n') : rest.slice(0, end).join('\n');
}

const onBlock = workflow.slice(0, workflow.indexOf('jobs:'));
const testJob = jobBlock('test');
const versionCheckJob = jobBlock('version-check');
const buildJob = jobBlock('build');
const deployJob = jobBlock('deploy');

describe('deploy workflow — triggers', () => {
  it('triggers the lightweight gate on main pushes, tag pushes, PRs and manual dispatch', () => {
    expect(onBlock).toContain('branches: [main]');
    expect(onBlock).toMatch(/tags:/);
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

  it('keeps the full pipeline behind stable tags + workflow_dispatch only', () => {
    expect(buildJob).toMatch(/if:/);
    expect(buildJob).toContain("github.event_name == 'workflow_dispatch'");
    expect(buildJob).toContain(
      "startsWith(github.ref, 'refs/tags/')",
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

  it('gates only tag pushes', () => {
    expect(versionCheckJob).toContain("startsWith(github.ref, 'refs/tags/')");
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
