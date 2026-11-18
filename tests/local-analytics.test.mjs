import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import { createAnalyticsServer } from '../server/analytics/http.mjs'

const origin = 'https://machmo.tail3b04e8.ts.net'
const sample = { event_name: 'page_view', session_id: '9ac374b0-f977-4a2b-acfe-743d2b3e2312', path: '/app/tools/spice' }

async function open(t, mode, options = {}) {
  const events = []
  const queries = []
  const server = createAnalyticsServer({
    mode, origins: [origin], adminAuthority: '127.0.0.1:8081',
    store: {
      async record(event) { events.push(event); return true },
      async summarize(...bounds) { queries.push(bounds); return { sessionCount: 1 } },
    },
    ...options,
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  return { url: `http://127.0.0.1:${server.address().port}`, events, queries }
}

function post(url, event, eventOrigin = origin) {
  return fetch(`${url}/api/analytics/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: eventOrigin },
    body: JSON.stringify(event),
  })
}

test('public listener records a whitelisted event and never serves an admin summary', async t => {
  const { url, events } = await open(t, 'public')
  assert.equal((await post(url, sample)).status, 204)
  assert.deepEqual(events, [{ ...sample, component_id: null }])
  assert.equal((await fetch(`${url}/api/analytics/admin/summary?start=2026-11-01&end=2026-11-02`)).status, 404)
})

test('rejects non-allowlisted routes, raw fields, invalid component, cross-origin and oversized requests', async t => {
  const { url, events } = await open(t, 'public')
  for (const event of [
    { ...sample, path: '/app/community/some-private-slug' },
    { ...sample, path: '/app/tools/spice?code=sample' },
    { ...sample, email: 'sample@example.invalid' },
    { ...sample, event_name: 'component_select', component_id: 'private-name' },
  ]) assert.equal((await post(url, event)).status, 400)
  assert.equal((await post(url, sample, 'https://outside.example')).status, 403)
  assert.equal((await post(url, { ...sample, unknown: 'x'.repeat(1024) })).status, 413)
  assert.deepEqual(events, [])
})

test('limits requests globally even when the client changes session ID', async t => {
  const { url, events } = await open(t, 'public', { requestsPerMinute: 1 })
  assert.equal((await post(url, sample)).status, 204)
  assert.equal((await post(url, { ...sample, session_id: '0ac374b0-f977-4a2b-acfe-743d2b3e2312' })).status, 429)
  assert.equal(events.length, 1)
})

test('private summary rejects invalid dates and untrusted host, and uses Vietnam-exclusive bounds', async t => {
  const http = await import('node:http')
  const { url, queries } = await open(t, 'private')
  const get = (path, host = '127.0.0.1:8081') => new Promise((resolve, reject) => {
    http.get(url + path, { headers: { Host: host } }, response => {
      response.resume()
      response.on('end', () => resolve(response.statusCode))
    }).on('error', reject)
  })
  const path = '/api/analytics/admin/summary'
  assert.equal(await get(`${path}?start=2026-11-17&end=2026-11-17`, 'external.example'), 404)
  assert.equal(await get(`${path}?start=2026-02-30&end=2026-03-01`), 400)
  assert.equal(await get(`${path}?start=2026-11-17&end=2026-11-17`), 200)
  assert.deepEqual(queries, [['2026-11-16T17:00:00.000Z', '2026-11-17T17:00:00.000Z']])
  assert.equal(await get('/api/analytics/events'), 404)
})
