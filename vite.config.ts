import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import pkg from './package.json'

// Release info injected at build time — the footer shows the version as
// tagged, the release date of the most recent tag, and a link back to the
// repo. The version is package.json's single source of truth; the date is
// the most recent git tag's commit date (what the app is released as). In CI
// the workflow passes RELEASE_DATE as a build arg (the Docker build context
// is a git URL and the builder has no git); locally the date is read from
// git. Untagged or git-less builds yield null — the footer omits the date
// rather than guessing one.
function releaseDate(): string | null {
  // Validate strictly — a malformed value must never reach the footer.
  const injected = process.env.RELEASE_DATE?.trim()
  if (injected && /^\d{4}-\d{2}-\d{2}$/.test(injected)) return injected
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (!tag) return null
    const date = execSync(`git log -1 --format=%cs ${tag}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return date || null
  } catch {
    return null
  }
}

export default defineConfig({
  // Relative base so the same build works at any path — the
  // deployment target is a root domain (world.paulgresham.com).
  // Asset links are written as ./assets/… — the browser resolves them
  // under the current page directory. Trailing-slash on the URL is
  // required.
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __RELEASE_DATE__: JSON.stringify(releaseDate()),
  },
})
