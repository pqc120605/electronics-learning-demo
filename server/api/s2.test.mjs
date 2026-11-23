import test from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import { sessionDigest } from '../community/session-http.mjs'
import { createApiServer } from './server.mjs'
import { createS2 } from './s2.mjs'

const origin = 'https://preview.example.test'
const id = '89c6dd67-d568-4329-860d-b8fb91b51b45'
const token = 'x'.repeat(43)
const cookie = '__Host-mm_session=' + token
const viewer = { id, displayName: 'Tester', avatarUrl: null, provider: 'github', expiresAt: new Date(Date.now() + 4 * 86400_000), role: 'user', email: 'private@example.test' }

async function start(t, overrides = {}) {
  const calls = []
  const store = {
    async read(digest) { return digest.equals(sessionDigest(token)) ? viewer : null },
    async rotate(_id, _digest, next) { calls.push(['rotate', next.digest]); return true },
    async revoke(digest) { calls.push(['revoke', digest]); },
    async deleteAccount(account) { calls.push(['delete-account', account]); },
  }
  const community = {
    async list(query) { calls.push(['list', query]); return { items: [{ author: { name: 'Tester', avatarUrl: null } }], nextCursor: null } },
    async change(kind, target, patch, user) { calls.push(['change', kind, target, patch, user.id]); return 403 },
  }
  const server = createApiServer({
    origins: [origin], commit: 'cf800c0', checkDatabase: async () => true,
    sessionStore: {}, analyticsStore: {}, log() {},
    s2: createS2({ origin, env: {}, authStore: { ...store, ...overrides }, community }),
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  t.after(() => new Promise(resolve => server.close(resolve)))
  const call = (path, options = {}) => new Promise((resolve, reject) => {
    const body = options.body && JSON.stringify(options.body)
    const headers = { Host: new URL(origin).host, ...(body && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }), ...options.headers }
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path, method: options.method, headers }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString() }))
    })
    req.on('error', reject)
    req.end(body)
  })
  return { call, calls }
}

test('S2 guests read without identity, search server-side and cannot write', async t => {
  const { call, calls } = await start(t)
  const list = await call('/api/community/posts?search=%C4%91i%E1%BB%87n+tr%E1%BB%9F&limit=5')
  assert.equal(list.status, 200)
  assert.deepEqual(JSON.parse(list.text).items, [{ author: { name: 'Tester', avatarUrl: null } }])
  assert.deepEqual(calls[0][1].terms, ['dien', 'tro'])
  const post = { id, title: 'Mạch thử LED', body: 'Mình đang thử một mạch điện đơn giản.', category: 'co-ban', tags: [] }
  assert.equal((await call('/api/community/posts', { method: 'POST', headers: { Origin: origin, 'X-Machmo-CSRF': '1' }, body: post })).status, 401)
  assert.equal((await call('/api/community/posts?cursor=invalid')).status, 400)
  assert.equal((await call('/api/community/moderation/reports')).status, 401)
})

test('S2 scopes writes to matching origin, CSRF, ownership and admin role', async t => {
  const { call, calls } = await start(t)
  const path = '/api/community/posts/' + id
  const edit = { method: 'PATCH', body: { title: 'Mạch điện LED', body: 'Mình đang thử một mạch điện đơn giản.', category: 'co-ban', tags: [] } }
  assert.equal((await call(path, { ...edit, headers: { Cookie: cookie, Origin: 'https://other.example' } })).status, 403)
  assert.equal((await call(path, { ...edit, headers: { Cookie: cookie, Origin: origin } })).status, 403)
  const headers = { Cookie: cookie, Origin: origin, 'X-Machmo-CSRF': '1' }
  assert.equal((await call(path, { ...edit, headers })).status, 403)
  assert.equal(calls.filter(row => row[0] === 'change').length, 1)
  assert.equal((await call('/api/community/moderation/reports', { headers })).status, 403)
  assert.equal((await call('/api/community/posts', { headers: { Host: 'different.example' } })).status, 404)
})

test('S2 rotates a valid session, returns a guest for expired state, and logs out or removes account', async t => {
  const { call, calls } = await start(t)
  const headers = { Cookie: cookie, Origin: origin, 'X-Machmo-CSRF': '1' }
  const session = await call('/api/session', { headers })
  assert.deepEqual(JSON.parse(session.text), { user: { id, displayName: 'Tester', avatarUrl: null, provider: 'github', role: 'user' } })
  assert.match(session.headers['set-cookie'][0], /Max-Age=2592000; Path=\/; HttpOnly; Secure; SameSite=Lax/)
  assert.deepEqual(JSON.parse((await call('/api/session', { headers: { Cookie: '__Host-mm_session=' + 'z'.repeat(43) } })).text), { user: null })
  const logout = await call('/api/session/logout', { headers, method: 'POST' })
  assert.equal(logout.status, 204)
  assert.match(logout.headers['set-cookie'][0], /Max-Age=0/)
  assert.equal((await call('/api/account', { headers, method: 'DELETE' })).status, 204)
  assert.deepEqual(calls.map(row => row[0]), ['rotate', 'revoke', 'delete-account'])
})
