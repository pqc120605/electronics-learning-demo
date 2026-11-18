import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  testDir: '../../e2e', timeout: 45_000, workers: 1, reporter: 'list', outputDir: '../../.tmp/analytics-e2e-results',
  use: { browserName: 'chromium', serviceWorkers: 'block' },
  webServer: {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), command: 'node server/analytics/browser-fixture.mjs',
    url: 'http://127.0.0.1:5288', timeout: 12_000, reuseExistingServer: false,
  },
})
