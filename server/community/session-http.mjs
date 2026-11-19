import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'

const cookieName = '__Host-machmo-session'
const tokenFormat = /^[A-Za-z0-9_-]{43}$/
const sessionSeconds = 8 * 60 * 60
const bodyLimit = 1024
const cookieFlags = 'Path=/; HttpOnly; Secure; SameSite=Strict'
export const sessionDigest = value => createHash('sha256').update(value).digest()

function cookieToken(cookies) {
  const tokens = (cookies ?? '').split(';').map(item => item.trim())
    .filter(item => item.startsWith(cookieName + '='))
    .map(item => item.slice(cookieName.length + 1))
  return tokens.length === 1 && tokenFormat.test(tokens[0]) ? tokens[0] : null
}

function jsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', chunk => {
      size += chunk.length
      if (size > bodyLimit) reject(413)
      else chunks.push(chunk)
    })
    request.on('end', () => {
      if (size > bodyLimit) return
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch { reject(400) }
    })
    request.on('error', () => reject(400))
  })
}

function reply(response, status, body) {
  response.statusCode = status
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (body === undefined) return response.end()
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  return response.end(JSON.stringify(body))
}

export function createSessionServer({ origin, store, attemptsPerMinute = 60 }) {
  const expectedOrigin = new URL(origin)
  if (expectedOrigin.protocol !== 'https:' || expectedOrigin.origin !== origin) throw new TypeError('An explicit HTTPS origin is required')
  let attempts = 0
  let windowStarted = 0
  return createServer({ requestTimeout: 8000, headersTimeout: 5000, keepAliveTimeout: 4000, maxHeaderSize: 8192 }, async (request, response) => {
    try {
      if (request.headers.host !== expectedOrigin.host || request.headers['sec-fetch-site'] === 'cross-site') return reply(response, 404)
      const token = cookieToken(request.headers.cookie)
      if (request.url === '/api/session' && request.method === 'GET') {
        const account = token && await store.read(sessionDigest(token))
        return reply(response, 200, { user: account || null })
      }

      const redeem = request.url === '/api/session/redeem'
      const logout = request.url === '/api/session/logout'
      if (!redeem && !logout) return reply(response, 404)
      if (request.method !== 'POST') return reply(response, 405)
      if (request.headers.origin !== origin) return reply(response, 403)
      if (logout) {
        if (token) await store.revoke(sessionDigest(token))
        response.setHeader('Set-Cookie', cookieName + '=; Max-Age=0; ' + cookieFlags)
        return reply(response, 204)
      }

      if (request.headers['content-type']?.split(';', 1)[0].trim() !== 'application/json') return reply(response, 415)
      if (Number(request.headers['content-length']) > bodyLimit) {
        response.setHeader('Connection', 'close')
        return reply(response, 413)
      }
      const now = Date.now()
      if (now - windowStarted >= 60_000) {
        windowStarted = now
        attempts = 0
      }
      if (attempts >= attemptsPerMinute) {
        response.setHeader('Retry-After', '60')
        return reply(response, 429)
      }
      attempts++
      const input = await jsonBody(request)
      if (!input || typeof input !== 'object' || Object.keys(input).length !== 1
        || typeof input.invite !== 'string' || !tokenFormat.test(input.invite)) return reply(response, 400)
      if (token && await store.read(sessionDigest(token))) return reply(response, 409)
      const session = randomBytes(32).toString('base64url')
      const account = await store.redeem(sessionDigest(input.invite), sessionDigest(session), new Date(now + sessionSeconds * 1000))
      if (!account) return reply(response, 401)
      response.setHeader('Set-Cookie', cookieName + '=' + session + '; Max-Age=' + sessionSeconds + '; ' + cookieFlags)
      return reply(response, 200, { user: account })
    } catch (error) {
      if (error === 413) response.setHeader('Connection', 'close')
      return reply(response, error === 400 || error === 413 ? error : 503)
    }
  })
}
