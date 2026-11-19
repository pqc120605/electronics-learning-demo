import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createSessionServer, sessionDigest } from './session-http.mjs'
import { createSessionStore } from './session-store.mjs'

const origin = 'https://tester.machmo.example:8443'
const freshToken = () => randomBytes(32).toString('base64url')

test('self-hosted sessions scope credentials to one account and reject repeated or foreign requests', {
  skip: !process.env.MACHMO_TEST_COMMUNITY_DB || !process.env.MACHMO_TEST_COMMUNITY_OWNER_DB,
}, async t => {
  const { default: pg } = await import('pg')
  const owner = new pg.Pool({ connectionString: process.env.MACHMO_TEST_COMMUNITY_OWNER_DB, max: 2 })
  const pool = new pg.Pool({ connectionString: process.env.MACHMO_TEST_COMMUNITY_DB, max: 4 })
  const server = createSessionServer({ origin, store: createSessionStore(pool) })
  t.after(async () => {
    await new Promise(resolve => server.close(resolve))
    await Promise.all([pool.end(), owner.end()])
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = 'http://127.0.0.1:' + server.address().port

  async function issue(displayName, expiresAt) {
    const id = randomUUID(), invite = freshToken()
    await owner.query('INSERT INTO machmo_community.accounts(id, display_name) VALUES ($1, $2)', [id, displayName])
    await owner.query('INSERT INTO machmo_community.invites(digest, account_id, expires_at) VALUES ($1, $2, $3)', [sessionDigest(invite), id, expiresAt])
    return { id, invite, displayName }
  }
  const future = new Date(Date.now() + 60_000)
  const a = await issue('Tester A', future)
  const b = await issue('Tester B', future)
  const expired = await issue('Tester expired', new Date(Date.now() - 10_000))

  function call(path, { method = 'GET', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
      const request = httpRequest(base + path, {
        method, headers: { Host: new URL(origin).host, ...headers },
      }, response => {
        const chunks = []
        response.on('error', reject)
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => resolve({
          status: response.statusCode,
          ok: response.statusCode === 200,
          headers: { get: name => Array.isArray(response.headers[name]) ? response.headers[name][0] : response.headers[name] },
          json: () => JSON.parse(Buffer.concat(chunks).toString('utf8')),
        }))
      })
      request.on('error', reject)
      request.end(body)
    })
  }
  const get = cookie => call('/api/session', { headers: cookie ? { Cookie: cookie } : {} })
  const submit = (path, body, headers = {}) => call('/api/session/' + path, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  assert.deepEqual(await (await get()).json(), { user: null })
  assert.equal((await submit('redeem', { invite: a.invite }, { Origin: 'https://other.example' })).status, 403)
  assert.equal((await submit('redeem', { invite: expired.invite })).status, 401)
  const race = await Promise.all([submit('redeem', { invite: a.invite }), submit('redeem', { invite: a.invite })])
  assert.deepEqual(race.map(r => r.status).sort(), [200, 401])
  const aResponse = race.find(r => r.ok)
  const bResponse = await submit('redeem', { invite: b.invite })
  assert.equal(bResponse.status, 200)
  assert.equal(aResponse.headers.get('cache-control'), 'no-store')
  const aCookie = aResponse.headers.get('set-cookie')
  assert.match(aCookie, /^__Host-machmo-session=/)
  assert.match(aCookie, /HttpOnly; Secure; SameSite=Strict/)
  const tokens = [aCookie, bResponse.headers.get('set-cookie')].map(cookie => cookie.split(';')[0])
  assert.notEqual(tokens[0], tokens[1])
  assert.doesNotMatch(JSON.stringify(await aResponse.json()), new RegExp(a.invite))
  assert.equal((await (await get(tokens[0])).json()).user.id, a.id)
  assert.equal((await (await get(tokens[1])).json()).user.id, b.id)

  assert.equal((await submit('logout', {}, { Cookie: tokens[0] })).status, 204)
  assert.deepEqual(await (await get(tokens[0])).json(), { user: null })
  assert.equal((await (await get(tokens[1])).json()).user.id, b.id)
  await owner.query('UPDATE machmo_community.accounts SET revoked_at = now() WHERE id = $1', [b.id])
  assert.deepEqual(await (await get(tokens[1])).json(), { user: null })
  await assert.rejects(pool.query('DELETE FROM machmo_community.accounts'), { code: '42501' })
  await assert.rejects(pool.query('UPDATE machmo_community.accounts SET revoked_at = NULL'), { code: '42501' })
})
