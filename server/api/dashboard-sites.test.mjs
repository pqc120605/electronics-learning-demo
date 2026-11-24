import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createDashboardSites, dashboardIngestPath } from './dashboard-sites.mjs'

const firstKey = 'a'.repeat(43)
const secondKey = 'b'.repeat(43)
const digest = key => createHash('sha256').update(key).digest('hex')
const setup = [
  { id: 'web-a', name: 'Web A', origin: 'https://a.example', keyDigest: digest(firstKey) },
  { id: 'web-b', name: 'Web B', origin: 'https://b.example', keyDigest: digest(secondKey) },
]
const snapshot = { day: '2026-11-24', revision: 1, status: 'healthy', accounts: 20, sessions: 5, pageViews: 12, newAccounts: 2 }
const input = { id: '89c6dd67-d568-4329-860d-b8fb91b51b45', kind: 'idea', title: 'Cần tìm kiếm', details: 'Thêm tìm kiếm theo chủ đề.', steps: '', expected: '', actual: '', page: '/', rating: 4 }

test('each sender writes only its own site and the admin registry exposes no key material', async () => {
  const writes = []
  let reads = 0
  const registry = createDashboardSites(JSON.stringify(setup), {
    async saveSnapshot(...args) { writes.push(args) },
    async saveFeedback(...args) { writes.push(args) },
    async latest() { return [] },
  }, () => Date.parse('2026-11-24T03:30:00Z'))
  const write = (site, kind, key, body, otherHeaders = {}) => registry.ingest(site, kind, {
    headers: { authorization: 'Bearer ' + key, ...otherHeaders },
  }, async () => { reads++; return body })
  assert.ok(dashboardIngestPath.test('/api/site-metrics/web-a/daily'))
  assert.equal(await write('web-b', 'daily', firstKey, snapshot), 403)
  assert.equal(await write('web-a', 'daily', firstKey, snapshot, { origin: 'https://a.example' }), 403)
  assert.equal(await write('missing', 'daily', firstKey, snapshot), 404)
  assert.equal(reads, 0)
  for (const patch of [{ day: '2026-11-31' }, { day: '2026-11-25' }, { accounts: -1 }, { status: 'fine' }, { email: 'private@example.test' }]) {
    assert.equal(await write('web-a', 'daily', firstKey, { ...snapshot, ...patch }), 400)
  }
  assert.equal(await write('web-a', 'daily', firstKey, snapshot), 204)
  assert.equal(await write('web-b', 'feedback', secondKey, input), 204)
  assert.deepEqual(writes, [['web-a', snapshot], ['web-b', input]])
  assert.deepEqual((await registry.list()).map(site => site.id), ['mach-mo', 'web-a', 'web-b'])
  assert.equal(JSON.stringify(await registry.list()).includes('keyDigest'), false)
  assert.equal(JSON.stringify(await registry.list()).includes(digest(firstKey)), false)
  assert.throws(() => createDashboardSites(JSON.stringify([setup[0], { ...setup[1], keyDigest: digest(firstKey) }]), {}))
  assert.throws(() => createDashboardSites(JSON.stringify([{ ...setup[0], id: 'mach-mo' }]), {}))
})
