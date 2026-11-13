import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('SPICE worker reports engine loading, initialization, and solve stages to the live region', async () => {
  const [worker, page] = await Promise.all([
    readFile('src/simulation/spice.worker.ts', 'utf8'),
    readFile('src/pages/SpiceWorkbenchPage.tsx', 'utf8'),
  ])

  assert.match(worker, /stage: 'loading'/)
  assert.match(worker, /stage: 'initializing'/)
  assert.match(worker, /stage: 'solving'/)
  assert.match(page, /event\.data\.type === 'progress'/)
  assert.match(page, /setRunProgress\(event\.data\.message\)/)
  assert.ok(page.includes(`role="status" aria-live="polite">{runState === 'running' ? runProgress`))
})
