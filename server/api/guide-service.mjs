import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { checkGuideStatus, handleChat, handleStatus } from '../guide-ai/handler.mjs'
import { validateInput } from '../guide-ai/schema.mjs'
import { sessionDigest } from '../community/session-http.mjs'
import { sessionToken } from './oauth.mjs'

const DAY = 86_400_000
const cacheLimit = 256
const token = /^[a-zA-Z0-9_-]{43}$/
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/
const normalizeQuestion = value => value.trim().normalize('NFC').replace(/\s+/g, ' ').toLowerCase()
const tokens = value => Number.isInteger(value) && value >= 0 && value <= 2_147_483_647 ? value : null

export function createGuideService({ env, store, secret, dailyLimit, now = Date.now, call = handleChat }) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw new TypeError('An AI identifier key is required')
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000) throw new TypeError('Configure an explicit daily AI request limit')
  const config = handleStatus(env).body
  const local = config.provider === 'ollama'
  const limit = local ? 1 : 2
  const cache = new Map()
  const digest = (purpose, fields) => createHmac('sha256', secret).update(JSON.stringify([purpose, ...fields])).digest('base64url')
  let active = 0
  let waiting

  function acquire(signal) {
    if (signal?.aborted) return false
    if (active < limit) {
      active++
      return true
    }
    if (!local || waiting) return false
    return new Promise(resolve => {
      const abort = () => { waiting = undefined; resolve(false) }
      waiting = () => { signal?.removeEventListener('abort', abort); resolve(true) }
      signal?.addEventListener('abort', abort, { once: true })
    })
  }

  function release() {
    if (waiting) {
      const next = waiting
      waiting = undefined
      next()
    } else {
      active--
    }
  }

  function getCached(key) {
    const item = cache.get(key)
    if (item?.until > now()) return item.body
    if (item) cache.delete(key)
    return null
  }

  return {
    status(actor) {
      return actor ? local ? checkGuideStatus(env) : config : { state: 'signed-out', model: 'lookup' }
    },
    async ask(actor, body, signal) {
      if (!actor) return { status: 401, body: { error: 'signed-out' } }
      const input = validateInput(body)
      if (!input) return { status: 400, body: { error: 'request' } }
      if (config.state !== 'ready') return { status: 503, body: { error: 'unavailable' } }
      const deadline = local ? AbortSignal.timeout(60_000) : undefined
      const requestSignal = deadline && signal ? AbortSignal.any([deadline, signal]) : deadline ?? signal
      if (!await acquire(requestSignal)) return { status: 503, body: { error: 'unavailable' } }
      const key = digest('answer', [actor.id, config.provider, config.model,
        normalizeQuestion(input.question), input.evidence, input.history])
      try {
        if (requestSignal?.aborted) return { status: 503, body: { error: 'unavailable' } }
        if (!await store.reserve(actor.id, dailyLimit, 20)) return { status: 429, body: { error: 'quota-exceeded' } }
        const started = performance.now()
        const cached = getCached(key)
        let usage
        let result
        let failureReason = null
        try {
          result = cached ? { status: 200, body: cached } : await call(input, env, {
            signal: requestSignal, retry: false, safetyIdentifier: digest('openai', [actor.id]), log: data => { usage = data },
          })
          if (usage?.status === 'timeout') failureReason = 'timeout'
          else if (result.status !== 200 || (usage && (typeof usage.status !== 'number' || usage.status >= 400))) failureReason = 'upstream'
        } catch {
          failureReason = 'internal'
        }
        const id = randomUUID()
        await store.record({
          id, provider: config.provider, model: config.model, status: failureReason ? 'error' : result.body.status,
          elapsedMs: Math.round(performance.now() - started),
          inputTokens: tokens(usage?.inputTokens), outputTokens: tokens(usage?.outputTokens),
          cacheHit: Boolean(cached), failureReason,
        })
        if (failureReason) return { status: 503, body: { error: 'unavailable' } }
        if (!cached && result.body.status === 'answered') {
          if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value)
          cache.set(key, { body: result.body, until: now() + DAY })
        }
        if (result.body.status !== 'answered') return result
        return { ...result, body: { ...result.body, feedback: { id, token: digest('vote', [actor.id, id]) } } }
      } finally {
        release()
      }
    },
    async vote(actor, body) {
      if (!actor) return 401
      if (typeof body?.id !== 'string' || !uuid.test(body.id) || typeof body.token !== 'string' || !token.test(body.token)
        || typeof body.helpful !== 'boolean') return 400
      const expected = digest('vote', [actor.id, body.id])
      if (!timingSafeEqual(Buffer.from(body.token), Buffer.from(expected))) return 403
      return await store.vote(body.id, body.helpful) ? 204 : 404
    },
  }
}

export function createGuideHttp({ service, origin, authStore }) {
  const host = new URL(origin).host
  return async (action, request, readBody, signal) => {
    if (request.headers.host !== host) return { status: 404 }
    if (action !== 'guide-status' && (request.headers.origin !== origin || request.headers['x-machmo-csrf'] !== '1')) return { status: 403 }
    const session = sessionToken(request.headers.cookie)
    const actor = session ? await authStore.read(sessionDigest(session)) : null
    if (action === 'guide-status') return { status: 200, body: await service.status(actor) }
    if (!actor) return { status: 401, body: { error: 'signed-out' } }
    const body = await readBody()
    if (action === 'guide-feedback') return { status: await service.vote(actor, body) }
    return service.ask(actor, body, signal)
  }
}
