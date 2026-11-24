import assert from 'node:assert/strict'
import test from 'node:test'
import { createAdminHttp, vietnamRange } from './admin.mjs'
import { eventRecord } from '../analytics/http.mjs'

test('admin API checks host, account and role before touching aggregate data', async () => {
  const origin = 'https://preview.example.test'
  const now = Date.parse('2026-11-21T18:00:00Z')
  const request = { headers: { host: 'preview.example.test' } }
  let role = 'user'
  let dashboardAccess = false
  let loads = 0
  const admin = createAdminHttp({
    origin, now: () => now, authStore: { async read() { return { role, dashboardAccess } } },
    reports: { async summary(start, end) { loads++; return { start, end } } },
  })
  assert.equal((await admin('summary', request, new URLSearchParams())).status, 401)
  request.headers.cookie = '__Host-mm_session=' + 'x'.repeat(43)
  assert.equal((await admin('summary', request, new URLSearchParams())).status, 403)
  role = 'admin'
  assert.equal((await admin('summary', request, new URLSearchParams())).status, 403)
  role = 'user'
  dashboardAccess = true
  assert.equal((await admin('summary', { headers: { ...request.headers, origin: 'https://other.test' } }, new URLSearchParams())).status, 403)
  assert.equal((await admin('summary', request, new URLSearchParams('days=365'))).status, 400)
  assert.equal(loads, 0)
  const result = await admin('summary', request, new URLSearchParams('days=7'))
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { start: '2026-11-15T17:00:00.000Z', end: '2026-11-22T17:00:00.000Z' })
  assert.equal(vietnamRange('30', now)[1], result.body.end)
})

test('analytics stores only allowlisted dimensions and rejects IP, browser identity and raw referrer', () => {
  const input = { session_id: '89c6dd67-d568-4329-860d-b8fb91b51b45', event_name: 'lesson_complete', path: '/build',
    lesson_id: 'blink', board_id: 'esp32-devkit', device: 'mobile', referrer_host: 'example.test' }
  assert.deepEqual(eventRecord(input, true), { ...input, component_id: null })
  for (const patch of [{ ip: '192.0.2.10' }, { user_agent: 'browser fixture' }, { referrer_host: '192.0.2.10' },
    { referrer_host: 'example.test/path?q=private' }, { lesson_id: 'custom' }, { board_id: 'unregistered' }, { device: 'desktop-raw' }]) {
    assert.equal(eventRecord({ ...input, ...patch }, true), null)
  }
  assert.equal(eventRecord(input), null)
})

test('site reports enforce the same admin role and validate the requested website', async () => {
  const origin = 'https://preview.example.test'
  const headers = { host: 'preview.example.test', cookie: '__Host-mm_session=' + 'x'.repeat(43) }
  let dashboardAccess = false
  let loaded = 0
  const handler = createAdminHttp({
    origin, reports: {}, authStore: { async read() { return { role: 'user', dashboardAccess } } }, dashboardSites: {
      async list() { loaded++; return [{ id: 'mach-mo' }] },
      async report(id) { loaded++; return id === 'web-a' ? { site: { id } } : null },
    },
  })
  const params = new URLSearchParams()
  assert.equal((await handler('sites', { headers }, params)).status, 403)
  assert.equal((await handler('sites', { headers }, params, 'web-a')).status, 403)
  assert.equal(loaded, 0)
  dashboardAccess = true
  assert.deepEqual((await handler('sites', { headers }, params)).body, [{ id: 'mach-mo' }])
  assert.deepEqual((await handler('sites', { headers }, params, 'web-a')).body, { site: { id: 'web-a' } })
  assert.equal((await handler('sites', { headers }, params, 'missing')).status, 404)
})
