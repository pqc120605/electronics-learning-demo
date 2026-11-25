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

async function start(t, overrides = {}, attachments) {
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
    s2: createS2({ origin, env: {}, authStore: { ...store, ...overrides }, community, attachments }),
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  t.after(() => new Promise(resolve => server.close(resolve)))
  const call = (path, options = {}) => new Promise((resolve, reject) => {
    const body = options.binary ?? (options.body && JSON.stringify(options.body))
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

test('community attachment routes authorize uploads and serve only inert binary chunks', async t => {
  const data = Buffer.from('test file')
  const calls = []
  const { call } = await start(t, {}, {
    async init(...args) { calls.push(args); return 204 },
    async write(...args) { calls.push(args); return 204 },
    async read() { return { name: 'Mạch mẫu.txt', data } },
  })
  const uploads = '/api/community/uploads/' + id + '/0'
  const headers = { Origin: origin, 'X-Machmo-CSRF': '1', Cookie: cookie }
  const body = { name: 'Mạch mẫu.txt', size: data.length }
  assert.equal((await call(uploads, { method: 'PUT', headers: { ...headers, Cookie: '' }, body })).status, 401)
  assert.equal((await call(uploads, { method: 'PUT', headers: { Origin: origin, Cookie: cookie }, body })).status, 403)
  assert.equal((await call(uploads, { method: 'PUT', headers, body: { ...body, name: 'doc.svg' } })).status, 400)
  assert.equal((await call(uploads, { method: 'PUT', headers, body })).status, 204)
  assert.equal((await call(uploads + '/0', { method: 'PUT', headers, body })).status, 415)
  const binary = { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/octet-stream' } }
  assert.equal((await call(uploads + '/0', { ...binary, binary: Buffer.alloc(1024 * 1024 + 1) })).status, 413)
  assert.equal((await call(uploads + '/0', { ...binary, binary: data })).status, 204)
  assert.deepEqual(calls[1].slice(0, 4), [id, 0, 0, data])
  const download = await call('/api/community/posts/' + id + '/attachments/' + id + '/0')
  assert.equal(download.status, 200)
  assert.equal(download.text, data.toString())
  assert.equal(download.headers['content-type'], 'application/octet-stream')
  assert.match(download.headers['content-disposition'], /^attachment;/)
  assert.equal(download.headers['x-content-type-options'], 'nosniff')
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
