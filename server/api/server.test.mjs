import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request } from 'node:http'
import test from 'node:test'
import { createApiServer, MAX_BODY_BYTES } from './server.mjs'
import { EDGE_CLIENT_HEADER, makeEdgeClientProof, readEdgeClientProof } from './edge-client-proof.mjs'

const publicOrigin = 'https://mach-mo.example'
const stagingOrigin = 'https://staging.mach-mo.example'

async function start(t, options = {}) {
  const logs = []
  const server = createApiServer({
    origins: [publicOrigin, stagingOrigin],
    commit: 'cf800c0',
    checkDatabase: async () => true,
    guideEnv: { GUIDE_AI_PROVIDER: 'mock' },
    analyticsStore: { record: async () => true },
    sessionStore: { read: async () => undefined, revoke: async () => undefined },
    log: entry => logs.push(entry),
    ...options,
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = 'http://127.0.0.1:' + server.address().port
  return { base, logs }
}

test('health returns a stable contract and fails readiness if the database probe fails', async t => {
  let available = true
  const { base } = await start(t, { checkDatabase: async () => available })
  const ready = await fetch(base + '/api/health')
  assert.equal(ready.status, 200)
  assert.deepEqual(await ready.json(), { version: 1, commit: 'cf800c0', db: 'ready', ai: 'mock' })
  assert.equal(ready.headers.get('cache-control'), 'no-store')
  assert.equal(ready.headers.get('x-content-type-options'), 'nosniff')
  available = false
  const unavailable = await fetch(base + '/api/health')
  assert.equal(unavailable.status, 503)
  assert.equal((await unavailable.json()).db, 'unavailable')
})

test('edge proofs bind an anonymous IP identity to a method, path and short lifetime', () => {
  const key = '24'.repeat(32)
  const now = 1_800_000_000_000
  const path = '/api/health'
  const proof = makeEdgeClientProof(key, '192.0.2.7', 'GET', path, now)
  assert.equal(makeEdgeClientProof(key, '::ffff:192.0.2.7', 'GET', path, now), proof)
  assert.equal(makeEdgeClientProof(key, '192.0.2.7, 192.0.2.8', 'GET', path, now), null)
  assert.equal(makeEdgeClientProof(key, '::1%lo0', 'GET', path, now), null)
  assert.ok(readEdgeClientProof(key, proof, 'GET', path, now))
  assert.equal(readEdgeClientProof(key, proof, 'GET', path, now + 61000), null)
  assert.equal(readEdgeClientProof(key, proof, 'POST', path, now), null)
  assert.equal(readEdgeClientProof(key, proof, 'GET', '/api/session', now), null)
  assert.equal(readEdgeClientProof('21'.repeat(32), proof, 'GET', path, now), null)
})

test('signed proxy mode separates verified clients and ignores unsigned forwarding claims', async t => {
  const edgeProxyKey = '42'.repeat(32)
  const { base } = await start(t, { edgeProxyKey, requestsPerMinute: 1, trustedProxyIps: ['127.0.0.1'] })
  const path = '/api/health'
  const signed = address => fetch(base + path, { headers: { [EDGE_CLIENT_HEADER]: makeEdgeClientProof(edgeProxyKey, address, 'GET', path) } })
  const first = await signed('192.0.2.11')
  assert.equal(first.status, 200)
  assert.equal(first.headers.get('x-machmo-ip-source'), 'verified-edge')
  assert.equal((await signed('192.0.2.11')).status, 429)
  assert.equal((await signed('192.0.2.12')).status, 200)
  const unsigned = address => fetch(base + path, { headers: { 'x-forwarded-for': address, [EDGE_CLIENT_HEADER]: 'unverified' } })
  const fromPeer = await unsigned('192.0.2.21')
  assert.equal(fromPeer.status, 200)
  assert.equal(fromPeer.headers.get('x-machmo-ip-source'), 'peer')
  assert.equal((await unsigned('192.0.2.22')).status, 429)
})

test('CORS permits only configured origins and the analytics dashboard stays private', async t => {
  const { base } = await start(t)
  const preflight = await fetch(base + '/api/guide-ai/chat', {
    method: 'OPTIONS', headers: { origin: stagingOrigin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
  })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), stagingOrigin)
  const otherOrigin = await fetch(base + '/api/health', { headers: { origin: 'https://other.example' } })
  assert.equal(otherOrigin.status, 403)
  assert.equal(otherOrigin.headers.get('access-control-allow-origin'), null)
  assert.equal((await fetch(base + '/api/analytics/admin/summary')).status, 404)
  assert.equal((await fetch(base + '/api/session/redeem', { method: 'POST', headers: { origin: publicOrigin } })).status, 404)
})

test('feedback accepts only an explicit same-origin submission and keeps reports private', async t => {
  const stored = []
  const { base } = await start(t, { feedback: {
    origin: publicOrigin,
    async save(input) { stored.push(input) },
  } })
  const report = {
    id: '89c6dd67-d568-4329-860d-b8fb91b51b45', kind: 'bug', title: 'Lỗi mạch LED',
    details: 'LED không sáng khi chạy mô phỏng.', page: '/build', steps: '', expected: '', actual: '', rating: 4,
  }
  const send = (body, origin = publicOrigin, csrf = '1') => fetch(base + '/api/feedback', {
    method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-machmo-csrf': csrf },
    body: JSON.stringify(body),
  })
  assert.equal((await send(report, stagingOrigin)).status, 403)
  assert.equal((await send(report, publicOrigin, '')).status, 403)
  assert.equal((await send({ ...report, rating: 6 })).status, 400)
  assert.equal((await send({ ...report, page: '/build?token=123' })).status, 400)
  assert.equal((await send({ ...report, email: 'oops@example.test' })).status, 400)
  assert.equal((await send(report)).status, 204)
  assert.deepEqual(stored, [report])
  assert.equal((await fetch(base + '/api/feedback')).status, 405)
  assert.equal((await fetch(base + '/api/admin/feedback')).status, 404)
})

test('public session and analytics keep their expected response shapes', async t => {
  const events = []
  const { base } = await start(t, { analyticsStore: { record: async event => { events.push(event); return true } } })
  const session = await fetch(base + '/api/session', { headers: { origin: stagingOrigin } })
  assert.deepEqual(await session.json(), { user: null })
  const logout = await fetch(base + '/api/session/logout', { method: 'POST', headers: { origin: stagingOrigin } })
  assert.equal(logout.status, 204)
  assert.match(logout.headers.get('set-cookie'), /__Host-machmo-session=.*HttpOnly; Secure/)
  const event = await fetch(base + '/api/analytics/events', {
    method: 'POST', headers: { origin: publicOrigin, 'content-type': 'application/json' },
    body: JSON.stringify({ event_name: 'page_view', session_id: '89c6dd67-d568-4329-860d-b8fb91b51b45', path: '/' }),
  })
  assert.equal(event.status, 204)
  assert.equal(events.length, 1)
  assert.equal(events[0].path, '/')
})

test('analytics burst does not exhaust the session and readiness quota', async t => {
  const { base } = await start(t, { requestsPerMinute: 2 })
  const event = () => fetch(base + '/api/analytics/events', {
    method: 'POST', headers: { origin: publicOrigin, 'content-type': 'application/json' },
    body: JSON.stringify({ event_name: 'page_view', session_id: '89c6dd67-d568-4329-860d-b8fb91b51b45', path: '/' }),
  })
  assert.equal((await event()).status, 204)
  assert.equal((await event()).status, 204)
  assert.equal((await event()).status, 429)
  assert.equal((await fetch(base + '/api/session', { headers: { origin: publicOrigin } })).status, 200)
  assert.equal((await fetch(base + '/api/health')).status, 200)
})

test('website ingestion only accepts the configured methods without a browser origin', async t => {
  const writes = []
  const { base } = await start(t, { dashboardSites: {
    async ingest(site, type, request, readBody) {
      assert.equal(request.headers.authorization, 'Bearer fixture')
      writes.push([site, type, await readBody()])
      return 204
    },
  } })
  const send = (suffix, method, origin) => fetch(base + '/api/site-metrics/web-a/' + suffix, {
    method, headers: { authorization: 'Bearer fixture', 'content-type': 'application/json', ...(origin && { origin }) },
    ...(method !== 'GET' && { body: '{}' }),
  })
  assert.equal((await send('daily', 'PUT', publicOrigin)).status, 403)
  assert.equal((await send('daily', 'POST')).status, 405)
  assert.equal((await send('feedback', 'GET')).status, 405)
  assert.equal((await send('daily', 'PUT')).status, 204)
  assert.equal((await send('feedback', 'POST')).status, 204)
  assert.deepEqual(writes, [['web-a', 'daily', {}], ['web-a', 'feedback', {}]])
})

test('guide chat rejects oversized content-length and chunked requests before parsing', async t => {
  const { base } = await start(t)
  const url = base + '/api/guide-ai/chat'
  const headers = { origin: stagingOrigin, 'content-type': 'application/json' }
  const declared = await fetch(url, { method: 'POST', headers, body: 'a'.repeat(MAX_BODY_BYTES + 1) })
  assert.equal(declared.status, 413)
  const chunkedStatus = await new Promise((resolve, reject) => {
    const outgoing = request(url, { method: 'POST', headers }, incoming => {
      incoming.resume()
      incoming.once('end', () => resolve(incoming.statusCode))
    })
    outgoing.once('error', reject)
    outgoing.write('a'.repeat(MAX_BODY_BYTES / 2))
    outgoing.end('b'.repeat(MAX_BODY_BYTES / 2 + 1))
  })
  assert.equal(chunkedStatus, 413)
})

test('limiter ignores forwarded identity on an untrusted socket and logs only route metadata', async t => {
  const { base, logs } = await start(t, { requestsPerMinute: 1 })
  const originHeaders = { origin: stagingOrigin, cookie: 'fixture-cookie=sample-cookie' }
  const first = await fetch(base + '/api/session?unused=sample-query', {
    headers: { ...originHeaders, 'x-forwarded-for': '192.0.2.1' },
  })
  assert.equal(first.status, 200)
  const second = await fetch(base + '/api/session', {
    headers: { ...originHeaders, 'x-forwarded-for': '192.0.2.2' },
  })
  assert.equal(second.status, 429)
  assert.equal(second.headers.get('retry-after'), '60')
  assert.deepEqual(logs.map(({ route, status }) => [route, status]), [['session', 200], ['session', 429]])
  assert.doesNotMatch(JSON.stringify(logs), /sample-cookie|sample-query|192\.0\.2\.|127\.0\.0\.1/)
})
