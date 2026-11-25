import { createHmac, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { isIP } from 'node:net'
import { createAnalyticsHandler } from '../analytics/http.mjs'
import { createSessionHandler } from '../community/session-http.mjs'
import { checkGuideStatus, handleChat, handleStatus } from '../guide-ai/handler.mjs'
import { s2Route } from './s2.mjs'
import { adminPath } from './admin.mjs'
import { projectRoute } from './projects.mjs'
import { classroomRoute } from './classrooms.mjs'
import { siteFeedbackInput } from './site-feedback.mjs'
import { dashboardIngestPath } from './dashboard-sites.mjs'
import { CHUNK_BYTES } from './community-attachments.mjs'
import { EDGE_CLIENT_HEADER, readEdgeClientProof, validEdgeKey } from './edge-client-proof.mjs'

export const MAX_BODY_BYTES = 64 * 1024
const MINUTE_MS = 60_000
const MAX_CLIENTS_PER_WINDOW = 10_000

const routes = new Map([
  ['/api/health', { id: 'health', method: 'GET' }],
  ['/api/session', { id: 'session', method: 'GET' }],
  ['/api/session/logout', { id: 'logout', method: 'POST' }],
  ['/api/analytics/events', { id: 'analytics', method: 'POST', acceptsBody: true }],
  ['/api/guide-ai/status', { id: 'guide-status', method: 'GET' }],
  ['/api/guide-ai/chat', { id: 'guide-chat', method: 'POST', acceptsBody: true }],
])
const guideFeedback = { id: 'guide-feedback', method: 'POST', acceptsBody: true, csrf: true }
const adminReport = { id: 'admin-report', method: 'GET' }
const submitFeedback = { id: 'submit-feedback', method: 'POST', acceptsBody: true, csrf: true }
const receiveDaily = { id: 'dashboard-daily', method: 'PUT', acceptsBody: true }
const receiveFeedback = { id: 'dashboard-feedback', method: 'POST', acceptsBody: true }

function json(response, status, payload) {
  response.statusCode = status
  if (payload !== undefined) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
  } else {
    response.end()
  }
}

function closeRequest(response, status) {
  response.setHeader('Connection', 'close')
  json(response, status)
}

async function requireJson(request) {
  if (contentType(request) !== 'application/json') throw 415
  const bytes = await readBytes(request, MAX_BODY_BYTES)
  try { return JSON.parse(bytes.toString('utf8')) }
  catch { throw 400 }
}

function contentType(request) {
  return request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase()
}

function requireBinary(request) {
  if (contentType(request) !== 'application/octet-stream') throw 415
  return readBytes(request, CHUNK_BYTES)
}

function readBytes(request, maximum) {
  return new Promise((resolve, reject) => {
    let total = 0
    const chunks = []
    request.on('data', chunk => {
      total += chunk.length
      if (total > maximum) {
        if (chunks.length) chunks.length = 0
        reject(413)
        return
      }
      chunks.push(chunk)
    })
    request.once('error', () => reject(400))
    request.once('aborted', () => reject(400))
    request.once('end', () => {
      if (total <= maximum) resolve(Buffer.concat(chunks))
    })
  })
}

function createLimiter(requestsPerMinute) {
  let windowStarted = Date.now()
  let key = randomBytes(32)
  const clients = new Map()
  return client => {
    const now = Date.now()
    if (now - windowStarted >= MINUTE_MS) {
      windowStarted = now
      key = randomBytes(32)
      clients.clear()
    }
    const id = createHmac('sha256', key).update(client).digest('base64url')
    const count = clients.get(id)
    if (count === undefined && clients.size >= MAX_CLIENTS_PER_WINDOW) return false
    if ((count ?? 0) >= requestsPerMinute) return false
    clients.set(id, (count ?? 0) + 1)
    return true
  }
}

export function createApiServer({
  origins, commit, checkDatabase, sessionStore, analyticsStore, guideEnv = {}, s2, guide, admin, projects, classrooms, feedback, dashboardSites,
  trustedProxyIps = [], edgeProxyKey, requestsPerMinute = 120, log = entry => console.log(JSON.stringify(entry)),
}) {
  if (!Array.isArray(origins) || !origins.length || origins.some(value => {
    const url = new URL(value)
    return url.protocol !== 'https:' || url.origin !== value
  })) throw new TypeError('Configure exact HTTPS origins')
  if (!/^[a-f0-9]{7,40}$/.test(commit)) throw new TypeError('A release commit is required')
  if (!Number.isSafeInteger(requestsPerMinute) || requestsPerMinute < 1 || trustedProxyIps.some(ip => !isIP(ip))) {
    throw new TypeError('Invalid request limit or proxy address')
  }
  if (edgeProxyKey && !validEdgeKey(edgeProxyKey)) throw new TypeError('Invalid edge proxy key')
  const allowedOrigins = new Set(origins)
  const sessions = new Map([...allowedOrigins].map(origin => [origin, createSessionHandler({ origin, store: sessionStore, validateHost: false })]))
  const sessionHosts = new Map([...allowedOrigins].map(origin => [new URL(origin).host, origin]))
  const analytics = createAnalyticsHandler({
    mode: 'public', origins, store: analyticsStore, extended: Boolean(admin),
    onFailure: () => log({ event: 'analytics_failed' }),
  })
  const trustedProxies = new Set(trustedProxyIps)
  const limit = createLimiter(requestsPerMinute)
  const limitAnalytics = createLimiter(requestsPerMinute)
  const limitAttachments = createLimiter(requestsPerMinute)
  const limitFeedback = createLimiter(30)

  return createServer({ requestTimeout: 10_000, headersTimeout: 5_000, keepAliveTimeout: 4_000, maxHeaderSize: 8192 }, async (request, response) => {
    const started = Date.now()
    const path = request.url?.split('?', 1)[0]
    const method = request.method
    const routeMethod = method === 'OPTIONS' ? request.headers['access-control-request-method'] : method
    const s2Action = s2 && s2Route(routeMethod, path)
    const project = projects && projectRoute(routeMethod, path)
    const classroom = classrooms && classroomRoute(routeMethod, path)
    const report = admin && adminPath.exec(path)
    const ingestion = dashboardSites && dashboardIngestPath.exec(path)
    const feedbackAction = feedback && path === '/api/feedback'
    const route = s2Action || project || classroom || (report ? adminReport : ingestion ? (ingestion[2] === 'daily' ? receiveDaily : receiveFeedback) : feedbackAction ? submitFeedback
      : guide && path === '/api/guide-ai/feedback' ? guideFeedback : routes.get(path))
    const s2Session = s2 && (route?.id === 'session' || route?.id === 'logout')
    const guideAction = guide && route?.id.startsWith('guide-')
    const csrf = route?.csrf || (s2Session && route.id === 'logout') || (guideAction && route.method === 'POST')
    response.once('finish', () => log({ route: route?.id ?? 'unknown', status: response.statusCode, ms: Date.now() - started }))
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Vary', 'Origin')

    if (!route) return json(response, 404)
    const origin = request.headers.origin
    if (ingestion && (origin !== undefined || method === 'OPTIONS')) return json(response, 403)
    if (origin !== undefined && !allowedOrigins.has(origin)) return json(response, 403)
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Access-Control-Allow-Credentials', 'true')
    }

    const routeLimit = route.id === 'analytics' ? limitAnalytics : route.attachmentTraffic ? limitAttachments : limit
    const peer = request.socket.remoteAddress ?? ''
    const forwarded = request.headers['x-forwarded-for']
    const edgeClient = edgeProxyKey && readEdgeClientProof(edgeProxyKey, request.headers[EDGE_CLIENT_HEADER], method, path)
    // Signed mode never uses a forwarding claim from an unsigned request.
    const legacyClient = !edgeProxyKey && trustedProxies.has(peer) && typeof forwarded === 'string' && isIP(forwarded) ? forwarded : peer
    const client = edgeClient ? 'edge:' + edgeClient : legacyClient
    if (edgeProxyKey && route.id === 'health') response.setHeader('X-Machmo-IP-Source', edgeClient ? 'verified-edge' : 'peer')
    if (!routeLimit(client)) {
      response.setHeader('Retry-After', '60')
      return json(response, 429)
    }
    if (method === 'OPTIONS') {
      const requested = request.headers['access-control-request-method']
      const requestedHeaders = request.headers['access-control-request-headers']?.split(',').map(header => header.trim().toLowerCase()) ?? []
      const allowedHeaders = csrf ? ['content-type', 'x-machmo-csrf'] : ['content-type']
      if (!origin || requested !== route.method || requestedHeaders.some(header => !allowedHeaders.includes(header))) return json(response, 403)
      response.setHeader('Access-Control-Allow-Methods', route.method)
      response.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '))
      return json(response, 204)
    }
    if (method !== route.method) {
      response.setHeader('Allow', route.method + ', OPTIONS')
      return json(response, 405)
    }
    const length = Number(request.headers['content-length'] ?? 0)
    if (length > (route.binary ? CHUNK_BYTES : MAX_BODY_BYTES)) return closeRequest(response, 413)
    if (!route.acceptsBody && (length > 0 || request.headers['transfer-encoding'])) return closeRequest(response, 400)
    if (!ingestion && (method === 'POST' || csrf) && !origin) return json(response, 403)

    try {
      if (ingestion) {
        return json(response, await dashboardSites.ingest(ingestion[1], ingestion[2], request, () => requireJson(request)))
      }
      if (feedbackAction) {
        if (origin !== feedback.origin || request.headers['x-machmo-csrf'] !== '1'
          || request.headers['sec-fetch-site'] === 'cross-site') return json(response, 403)
        if (!limitFeedback(client)) {
          response.setHeader('Retry-After', '60')
          return json(response, 429)
        }
        const input = siteFeedbackInput(await requireJson(request))
        if (!input) return json(response, 400)
        await feedback.save(input)
        return json(response, 204)
      }
      if (classroom) {
        const result = await classrooms(classroom, request, () => requireJson(request))
        return json(response, result.status, result.body)
      }
      if (project) {
        const result = await projects(project, request, () => requireJson(request))
        return json(response, result.status, result.body)
      }
      if (report) {
        const result = await admin(report[1], request, new URLSearchParams(request.url.split('?').slice(1).join('?')), report[2])
        return json(response, result.status, result.body)
      }
      if (guideAction) {
        const disconnect = new AbortController()
        response.once('close', () => disconnect.abort())
        const result = await guide(route.id, request, () => requireJson(request), disconnect.signal)
        if (result.status === 503) response.setHeader('Retry-After', '5')
        return json(response, result.status, result.body)
      }
      if (s2 && route.id.startsWith('guide-')) {
        return route.id === 'guide-status' ? json(response, 200, { state: 'unavailable', model: 'lookup' }) : json(response, 503)
      }
      if (s2Action || s2Session) {
        const params = new URLSearchParams(request.url.split('?').slice(1).join('?'))
        return await s2.handle({ ...route, csrf }, request, response, json, params, () =>
          route.binary ? requireBinary(request) : requireJson(request))
      }
      if (route.id === 'health') {
        const ready = await Promise.resolve().then(checkDatabase).catch(() => false)
        const ai = await checkGuideStatus(guideEnv)
        return json(response, ready ? 200 : 503, { version: 1, commit, db: ready ? 'ready' : 'unavailable', ai: ai.state === 'ready' ? ai.provider : 'unavailable' })
      }
      if (route.id === 'session' || route.id === 'logout') {
        const sessionOrigin = origin ?? sessionHosts.get(request.headers.host)
        const handleSession = sessions.get(sessionOrigin)
        if (!handleSession) return json(response, 404)
        request.url = path
        return await handleSession(request, response)
      }
      if (route.id === 'analytics') {
        request.url = path
        return await analytics(request, response)
      }
      if (route.id === 'guide-status') {
        return json(response, 200, handleStatus(guideEnv).body)
      }
      const body = await requireJson(request)
      if (handleStatus(guideEnv).body.state !== 'ready') return json(response, 503, { error: 'unavailable' })
      const result = await handleChat(body, guideEnv)
      return json(response, result.status, result.body)
    } catch (error) {
      if (error === 413 || error === 400) return closeRequest(response, error)
      if (error === 415) return json(response, 415)
      return json(response, 503)
    }
  })
}
