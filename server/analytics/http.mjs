import { createServer } from 'node:http'
import allowedPaths from './paths.json' with { type: 'json' }
import dimensions from './dimensions.json' with { type: 'json' }

const writePath = '/api/analytics/events'
const summaryPath = '/api/analytics/admin/summary'
const maxBodyBytes = 1024
const events = new Set(['page_view', 'lesson_open', 'component_select', 'code_copy', 'builder_run'])
const parts = new Set(['esp32', 'breadboard', 'led', 'resistor', 'jumper'])
const fields = new Set(['event_name', 'session_id', 'path', 'component_id'])
const extendedFields = new Set([...fields, 'device', 'referrer_host', 'lesson_id', 'board_id'])
const devices = new Set(['mobile', 'tablet', 'desktop'])
const lessonIds = new Set(dimensions.lessons)
const boardIds = new Set(dimensions.boards)
const paths = new Set(allowedPaths)

export function eventRecord(body, extended = false) {
  const allowed = extended ? extendedFields : fields
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) return null
  const { event_name, session_id, path, component_id = null } = body
  if ((!events.has(event_name) && !(extended && event_name === 'lesson_complete')) || !paths.has(path)
    || typeof session_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session_id)) return null
  if (event_name === 'component_select' ? !parts.has(component_id) : component_id !== null) return null
  const base = { event_name, session_id, path, component_id }
  if (!extended) return base
  const { device = null, referrer_host = null, lesson_id = null, board_id = null } = body
  if ((device !== null && !devices.has(device)) || (lesson_id !== null && !lessonIds.has(lesson_id))
    || (board_id !== null && !boardIds.has(board_id)) || (event_name === 'lesson_complete' && lesson_id === null)) return null
  if (referrer_host !== null && (typeof referrer_host !== 'string' || referrer_host.length > 253
    || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(referrer_host))) return null
  return { ...base, device, referrer_host, lesson_id, board_id }
}

function finish(response, status, body) {
  response.setHeader('Cache-Control', 'no-store')
  response.statusCode = status
  if (body === undefined) return response.end()
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', chunk => {
      size += chunk.length
      if (size > maxBodyBytes) { reject(413); return }
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (size > maxBodyBytes) return
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch { reject(400) }
    })
    request.on('error', () => reject(400))
  })
}

function midnight(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return NaN
  const utc = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(utc) || new Date(utc).toISOString().slice(0, 10) !== value) return NaN
  return utc - 7 * 60 * 60 * 1000
}

export function createAnalyticsHandler({
  mode, store, origins = [], adminAuthority = '127.0.0.1:8081', requestsPerMinute = 600, extended = false,
  onFailure = () => console.error(`Analytics ${mode} operation failed`),
}) {
  if (mode !== 'public' && mode !== 'private') throw new TypeError('Unknown analytics listener mode')
  const allowedOrigins = new Set(origins)
  let windowStarted = 0
  let accepted = 0
  const day = 24 * 60 * 60 * 1000

  return async (request, response) => {
    try {
      if (mode === 'private') {
        if (request.headers.host !== adminAuthority || request.method !== 'GET' || request.headers['sec-fetch-site'] === 'cross-site' || (request.headers.origin && request.headers.origin !== `http://${adminAuthority}`)) return finish(response, 404)
        const target = new URL(request.url ?? '/', 'http://127.0.0.1')
        if (target.pathname !== summaryPath) return finish(response, 404)
        const start = midnight(target.searchParams.get('start'))
        const end = midnight(target.searchParams.get('end')) + day
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 93 * day) return finish(response, 400)
        return finish(response, 200, await store.summarize(new Date(start).toISOString(), new Date(end).toISOString()))
      }

      if (request.url !== writePath) return finish(response, 404)
      if (request.method !== 'POST') return finish(response, 405)
      if (!allowedOrigins.has(request.headers.origin) || request.headers['sec-fetch-site'] === 'cross-site') return finish(response, 403)
      if (request.headers['content-type']?.split(';', 1)[0].trim() !== 'application/json') return finish(response, 415)
      if (Number(request.headers['content-length']) > maxBodyBytes) return finish(response, 413)
      const now = Date.now()
      if (now - windowStarted >= 60_000) { windowStarted = now; accepted = 0 }
      if (accepted >= requestsPerMinute) return finish(response, 429)
      accepted++
      const event = eventRecord(await readBody(request), extended)
      if (!event) return finish(response, 400)
      return finish(response, await store.record(event) ? 204 : 429)
    } catch (error) {
      if (error === 400 || error === 413) {
        if (error === 413) response.setHeader('Connection', 'close')
        return finish(response, error)
      }
      onFailure()
      return finish(response, 503)
    }
  }
}

export function createAnalyticsServer(options) {
  return createServer({ requestTimeout: 10_000, headersTimeout: 5_000, keepAliveTimeout: 4_000, maxHeaderSize: 8192 }, createAnalyticsHandler(options))
}
