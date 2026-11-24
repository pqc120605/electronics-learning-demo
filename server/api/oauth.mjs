import { createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from 'node:crypto'
import { sessionDigest } from '../community/session-http.mjs'
import { normalizeDashboardEmail } from './dashboard-access.mjs'

const cookieFlags = 'Path=/; HttpOnly; Secure; SameSite=Lax'
const sessionName = '__Host-mm_session'
const tokenPattern = /^[A-Za-z0-9_-]{43}$/
const attemptSeconds = 600
export const sessionSeconds = 30 * 24 * 60 * 60
const providers = {
  google: {
    env: 'GOOGLE', authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token', scope: 'openid email profile',
  },
  github: {
    env: 'GITHUB', authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token', scope: 'read:user user:email',
  },
}

const randomToken = () => randomBytes(32).toString('base64url')
const cookie = (name, value, seconds) => name + '=' + value + '; Max-Age=' + seconds + '; ' + cookieFlags
export const sessionCookie = (value, seconds = sessionSeconds) => cookie(sessionName, value, seconds)

function readCookie(raw, name) {
  const items = (raw ?? '').split(';').map(value => value.trim())
    .filter(value => value.startsWith(name + '=')).map(value => value.slice(name.length + 1))
  return items.length === 1 && tokenPattern.test(items[0]) ? items[0] : null
}

export function sessionToken(cookies) {
  return readCookie(cookies, sessionName)
}

export function newSession(now = Date.now()) {
  const token = randomToken()
  return { token, digest: sessionDigest(token), expiresAt: new Date(now + sessionSeconds * 1000) }
}

export function safeOAuthNext(raw) {
  if (typeof raw !== 'string' || raw.length > 1024 || !raw.startsWith('/') || raw.startsWith('//')
    || /[\\\u0000-\u0020\u007f]/.test(raw)) return '/community'
  const path = raw.split(/[?#]/, 1)[0]
  if (/%(?:2f|5c|2e|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(path)) return '/community'
  const url = new URL(raw, 'https://internal.invalid')
  if (url.origin !== 'https://internal.invalid' || url.pathname.startsWith('//')
    || /^\/(?:app\/)?(?:login|api|auth)(?:\/|$)/i.test(url.pathname)) return '/community'
  return url.pathname + url.search + url.hash
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('OAuth provider request failed')
  return response.json()
}

async function googleClaims(raw, nonce, audience, fetchImpl, now) {
  const parts = typeof raw === 'string' && raw.length <= 16384 ? raw.split('.') : []
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error('Invalid Google identity token')
  const [header, payload, signature] = parts
  const { alg, kid } = JSON.parse(Buffer.from(header, 'base64url'))
  if (alg !== 'RS256' || typeof kid !== 'string') throw new Error('Invalid Google identity token')
  const claims = JSON.parse(Buffer.from(payload, 'base64url'))
  const timestamp = Math.floor(now / 1000)
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss) || claims.aud !== audience
    || (claims.azp !== undefined && claims.azp !== audience) || claims.nonce !== nonce
    || !Number.isSafeInteger(claims.exp) || claims.exp <= timestamp
    || !Number.isSafeInteger(claims.iat) || claims.iat > timestamp + 60 || claims.iat < timestamp - 660
    || typeof claims.sub !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(claims.sub)) throw new Error('Invalid Google claims')
  const { keys } = await requestJson(fetchImpl, 'https://www.googleapis.com/oauth2/v3/certs')
  const jwk = keys?.find(key => key.kid === kid && key.kty === 'RSA' && key.alg === 'RS256' && key.use === 'sig')
  if (!jwk || !verify('RSA-SHA256', Buffer.from(header + '.' + payload), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(signature, 'base64url'))) {
    throw new Error('Invalid Google signature')
  }
  return claims
}

function profile(provider, providerUserId, rawName, rawAvatar) {
  const name = typeof rawName === 'string' ? rawName.replace(/[\u0000-\u001f\u007f]/g, '').trim() : ''
  let avatarUrl = null
  if (typeof rawAvatar === 'string' && rawAvatar.length <= 512) {
    const url = URL.parse(rawAvatar)
    const expectedHost = provider === 'google' ? /^(?:lh[0-9]+\.)?googleusercontent\.com$/ : /^avatars\.githubusercontent\.com$/
    if (url?.protocol === 'https:' && !url.port && !url.username && !url.password && expectedHost.test(url.hostname)) avatarUrl = url.href
  }
  return { provider, providerUserId, displayName: [...name].slice(0, 60).join('') || 'Thành viên', avatarUrl }
}

export function createOAuth({ origin, env, store, now = Date.now, fetchImpl = fetch }) {
  const secret = env.SESSION_SECRET
  const configs = new Map()
  for (const [name, provider] of Object.entries(providers)) {
    const clientId = env[provider.env + '_CLIENT_ID']
    const clientSecret = env[provider.env + '_CLIENT_SECRET']
    if (clientId && clientSecret && typeof secret === 'string' && Buffer.byteLength(secret) >= 32) {
      configs.set(name, { ...provider, clientId, clientSecret, redirectUri: origin + '/api/auth/callback/' + name })
    }
  }
  const sign = (provider, token, bound) => createHmac('sha256', secret)
    .update([origin, provider, token, bound].join('\n')).digest()
  const cookieName = provider => '__Host-mm_oauth_' + provider
  const fail = (reason, next = '/community', cookies = []) => ({
    location: '/login?' + new URLSearchParams({ next, oauth_error: reason }), cookies,
  })

  return {
    async begin(provider, rawNext) {
      const next = safeOAuthNext(rawNext)
      const config = configs.get(provider)
      if (!config) return fail('unavailable', next)
      const token = randomToken()
      const bound = randomToken()
      const state = token + '.' + sign(provider, token, bound).toString('base64url')
      const verifier = randomToken()
      const nonce = provider === 'google' ? randomToken() : null
      await store.saveAttempt({ key: token, provider, next, verifier, nonce, expiresAt: new Date(now() + attemptSeconds * 1000) })
      const url = new URL(config.authorize)
      url.search = new URLSearchParams({
        client_id: config.clientId, redirect_uri: config.redirectUri, scope: config.scope,
        response_type: 'code', state, code_challenge_method: 'S256',
        code_challenge: sessionDigest(verifier).toString('base64url'), ...(nonce && { nonce }),
      }).toString()
      return { location: url.href, cookies: [cookie(cookieName(provider), bound, attemptSeconds)] }
    },

    async finish(provider, params, cookies) {
      const config = configs.get(provider)
      if (!config) return fail('unavailable')
      const state = params.get('state')
      const bound = readCookie(cookies, cookieName(provider))
      const clear = [cookie(cookieName(provider), '', 0)]
      const [token, signature, extra] = state?.split('.') ?? []
      if (!bound || params.getAll('state').length !== 1 || !tokenPattern.test(token) || !tokenPattern.test(signature) || extra !== undefined
        || !timingSafeEqual(sign(provider, token, bound), Buffer.from(signature, 'base64url'))) return fail('retry')
      const attempt = await store.consumeAttempt(token, provider)
      if (!attempt || attempt.expiresAt.getTime() <= now()) return fail('retry', '/community', clear)
      const next = safeOAuthNext(attempt.next)
      const code = params.get('code')
      if (params.has('error') || params.getAll('code').length !== 1 || !code || code.length > 2048) return fail('retry', next, clear)
      try {
        const grant = await requestJson(fetchImpl, config.token, {
          method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code', code, redirect_uri: config.redirectUri,
            client_id: config.clientId, client_secret: config.clientSecret, code_verifier: attempt.verifier,
          }),
        })
        let identity
        const dashboardSignIn = next.split(/[?#]/, 1)[0] === '/admin'
        if (provider === 'google') {
          const claims = await googleClaims(grant.id_token, attempt.nonce, config.clientId, fetchImpl, now())
          identity = profile(provider, claims.sub, claims.name, claims.picture)
          if (dashboardSignIn && claims.email_verified === true) {
            const email = normalizeDashboardEmail(claims.email)
            const domain = email?.split('@')[1]
            if (domain && (domain === 'gmail.com' || claims.hd === domain)) identity.dashboardEmail = email
          }
        } else {
          if (typeof grant.access_token !== 'string' || !/^[A-Za-z0-9_.~-]{1,2048}$/.test(grant.access_token)) return fail('retry', next, clear)
          const headers = { Authorization: 'Bearer ' + grant.access_token, Accept: 'application/vnd.github+json', 'User-Agent': 'Mach-Mo' }
          const user = await requestJson(fetchImpl, 'https://api.github.com/user', { headers })
          if (!Number.isSafeInteger(user.id) || user.id <= 0) return fail('retry', next, clear)
          identity = profile(provider, String(user.id), user.name || user.login, user.avatar_url)
          if (dashboardSignIn) {
            const emails = await requestJson(fetchImpl, 'https://api.github.com/user/emails?per_page=100', { headers }).catch(() => null)
            const primary = Array.isArray(emails) && emails.find(item => item?.primary === true && item.verified === true)
            const email = normalizeDashboardEmail(primary?.email)
            if (email) identity.dashboardEmail = email
          }
        }
        const session = newSession(now())
        const previous = sessionToken(cookies)
        await store.startSession(identity, session, previous && sessionDigest(previous))
        return { location: next, cookies: [...clear, sessionCookie(session.token)] }
      } catch {
        return fail('retry', next, clear)
      }
    },
  }
}
