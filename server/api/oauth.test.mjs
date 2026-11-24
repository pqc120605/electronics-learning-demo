import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { createOAuth, safeOAuthNext } from './oauth.mjs'

const origin = 'https://preview.example.test'
const env = { SESSION_SECRET: 'a'.repeat(40), GITHUB_CLIENT_ID: 'gh-id', GITHUB_CLIENT_SECRET: 'gh-secret' }

test('OAuth next stays on the app and rejects ambiguous redirect paths', () => {
  assert.equal(safeOAuthNext('/app/community/new?cat=iot'), '/app/community/new?cat=iot')
  for (const input of ['//outside.test', '/\\outside.test', '/%2f%2foutside.test', '/x/..//outside.test', '/login', '/api/session', '/x\ny']) {
    assert.equal(safeOAuthNext(input), '/community', input)
  }
})

test('Google OAuth verifies the ID token signature, audience and nonce and excludes email', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = { ...publicKey.export({ format: 'jwk' }), kid: 'demo', alg: 'RS256', use: 'sig' }
  const now = 1_780_000_000_000
  let attempt, accepted, nonce, audience, signingKey
  let email = 'private@example.test'
  let verified = false
  const flow = createOAuth({
    origin, now: () => now, env: { SESSION_SECRET: 'g'.repeat(40), GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: 'test-secret' },
    store: {
      async saveAttempt(value) { attempt = value },
      async consumeAttempt() { return attempt },
      async startSession(identity) { accepted = identity },
    },
    fetchImpl: async (url, init) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        assert.equal(init.body.get('code_verifier'), attempt.verifier)
        const json64 = object => Buffer.from(JSON.stringify(object)).toString('base64url')
        const data = json64({ alg: 'RS256', kid: 'demo' }) + '.' + json64({
          iss: 'https://accounts.google.com', aud: audience, sub: 'stable-google-id', nonce,
          iat: now / 1000, exp: now / 1000 + 3600, name: 'Google Tester',
          email, email_verified: verified, picture: 'https://lh3.googleusercontent.com/avatar',
        })
        const sig = sign('RSA-SHA256', Buffer.from(data), signingKey).toString('base64url')
        return Response.json({ id_token: data + '.' + sig })
      }
      assert.equal(url, 'https://www.googleapis.com/oauth2/v3/certs')
      return Response.json({ keys: [key] })
    },
  })
  const begin = async (next = '/community/new') => {
    const result = await flow.begin('google', next)
    const search = new URL(result.location).searchParams
    nonce = search.get('nonce')
    audience = 'google-id'
    signingKey = privateKey
    return () => flow.finish('google', new URLSearchParams({ state: search.get('state'), code: 'fixture' }), result.cookies[0].split(';')[0])
  }
  let finish = await begin()
  nonce = 'different'
  assert.match((await finish()).location, /oauth_error=/)
  finish = await begin()
  audience = 'different'
  assert.match((await finish()).location, /oauth_error=/)
  finish = await begin()
  signingKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  assert.match((await finish()).location, /oauth_error=/)
  assert.equal(accepted, undefined)
  finish = await begin()
  assert.equal((await finish()).location, '/community/new')
  assert.deepEqual(accepted, { provider: 'google', providerUserId: 'stable-google-id', displayName: 'Google Tester', avatarUrl: 'https://lh3.googleusercontent.com/avatar' })
  verified = true
  finish = await begin('/admin')
  assert.equal((await finish()).location, '/admin')
  assert.equal(accepted.dashboardEmail, undefined)
  email = 'Owner@gmail.com'
  finish = await begin('/admin')
  assert.equal((await finish()).location, '/admin')
  assert.equal(accepted.dashboardEmail, 'owner@gmail.com')
  verified = false
  finish = await begin('/admin')
  await finish()
  assert.equal(accepted.dashboardEmail, undefined)
})

test('GitHub dashboard verification accepts only the verified primary email', async () => {
  let attempt, accepted
  let primaryVerified = false
  const flow = createOAuth({
    origin, env,
    store: {
      async saveAttempt(value) { attempt = value },
      async consumeAttempt() { return attempt },
      async startSession(identity) { accepted = identity },
    },
    fetchImpl: async url => {
      if (url === 'https://github.com/login/oauth/access_token') return Response.json({ access_token: 'fixture' })
      if (url === 'https://api.github.com/user') return Response.json({ id: 123, login: 'tester', email: 'ignored@example.test' })
      assert.equal(url, 'https://api.github.com/user/emails?per_page=100')
      return Response.json([
        { email: 'secondary@example.test', primary: false, verified: true },
        { email: 'primary@example.test', primary: true, verified: primaryVerified },
      ])
    },
  })
  async function login() {
    const entry = await flow.begin('github', '/admin')
    const params = new URLSearchParams({ code: 'fixture', state: new URL(entry.location).searchParams.get('state') })
    assert.equal((await flow.finish('github', params, entry.cookies[0].split(';')[0])).location, '/admin')
  }
  await login()
  assert.equal(accepted.dashboardEmail, undefined)
  primaryVerified = true
  await login()
  assert.equal(accepted.dashboardEmail, 'primary@example.test')
})

test('GitHub OAuth binds state to browser and provider, expires and consumes it once, and uses PKCE', async () => {
  const attempts = new Map()
  const exchanges = []
  let now = 1_780_000_000_000
  const flow = createOAuth({ origin, env, store: {
    async saveAttempt(attempt) { attempts.set(attempt.key, attempt) },
    async consumeAttempt(key) { const entry = attempts.get(key); attempts.delete(key); return entry },
    async startSession(identity) { exchanges.push(identity) },
  }, now: () => now, fetchImpl: async (url, init) => {
    if (url === 'https://github.com/login/oauth/access_token') {
      exchanges.push(init.body)
      return Response.json({ access_token: 'test-access-token' })
    }
    assert.equal(url, 'https://api.github.com/user')
    return Response.json({ id: 123, login: 'tester', name: 'Mạch Mở', email: 'private@example.test' })
  } })
  const entry = await flow.begin('github', '/app/community/new')
  const auth = new URL(entry.location)
  const state = auth.searchParams.get('state')
  const callback = new URLSearchParams({ code: 'code', state })
  const cookie = entry.cookies[0].split(';')[0]
  assert.equal(auth.searchParams.get('code_challenge_method'), 'S256')
  assert.match(entry.cookies[0], /HttpOnly; Secure; SameSite=Lax/)
  assert.equal((await flow.finish('github', callback, undefined)).location.includes('oauth_error'), true)
  assert.equal((await flow.finish('google', callback, cookie)).location.includes('oauth_error'), true)
  assert.equal((await flow.finish('github', new URLSearchParams({ code: 'code', state: `${state}x` }), cookie)).location.includes('oauth_error'), true)
  const success = await flow.finish('github', callback, cookie)
  assert.equal(success.location, '/app/community/new')
  assert.match(success.cookies[1], /^__Host-mm_session=.*Max-Age=2592000; Path=\/; HttpOnly; Secure; SameSite=Lax$/)
  const verifier = exchanges[0].get('code_verifier')
  assert.equal(auth.searchParams.get('code_challenge'), createHash('sha256').update(verifier).digest('base64url'))
  assert.deepEqual(exchanges[1], { provider: 'github', providerUserId: '123', displayName: 'Mạch Mở', avatarUrl: null })
  assert.equal((await flow.finish('github', callback, cookie)).location.includes('oauth_error'), true)
  const expired = await flow.begin('github', '/community')
  now += 600_001
  const expiredParams = new URLSearchParams({ code: 'code', state: new URL(expired.location).searchParams.get('state') })
  assert.equal((await flow.finish('github', expiredParams, expired.cookies[0].split(';')[0])).location.includes('oauth_error'), true)
  assert.equal(exchanges.length, 2)
})
