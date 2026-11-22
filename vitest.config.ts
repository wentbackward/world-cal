import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseConfig from './vite.config'

// Inherit the shared build config (base, define) — only the test harness
// differs. Overriding the define would drift the footer constants from the
// build, so this file composes the shared config instead of restating it.
export default defineConfig(mergeConfig(baseConfig, {
  test: {
    globals: true,
    environment: 'jsdom',
  },
}))
