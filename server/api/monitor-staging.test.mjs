import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const script = fileURLToPath(new URL('./monitor-staging.mjs', import.meta.url))
const commit = '34'.repeat(20)

test('the loopback monitor checks the active release and emits only health fields', async t => {
  const server = createServer((request, response) => {
    assert.equal(request.url, '/api/health')
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ version: 1, commit, db: 'ready', ai: 'mock', internal: 'ignore' }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const env = { ...process.env, MACHMO_API_PORT: String(server.address().port), MACHMO_API_COMMIT: commit, GUIDE_AI_DAILY_REQUEST_CAP: '0' }
  const result = await run(process.execPath, [script], { env, timeout: 7000 })
  assert.deepEqual(JSON.parse(result.stdout), { event: 'staging_health_ok', commit, db: 'ready', ai: 'mock' })
  await assert.rejects(run(process.execPath, [script], { env: { ...env, MACHMO_API_COMMIT: '12'.repeat(20) }, timeout: 7000 }),
    error => error.code === 1 && JSON.parse(error.stdout).event === 'staging_health_failed')
})
