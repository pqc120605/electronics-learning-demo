import { sessionDigest } from '../community/session-http.mjs'
import { createOAuth, newSession, sessionCookie, sessionToken } from './oauth.mjs'
import { foldCommunityText } from './community-store.mjs'

const categories = new Set(['co-ban', 'nhung', 'iot', 'du-an', 'hoi-dap-loi'])
const reasons = new Set(['spam', 'offensive', 'unsafe', 'off-topic', 'other'])
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const tagPattern = /^[\p{L}\p{N}+#.\-]{1,24}$/u
const week = 7 * 24 * 60 * 60 * 1000
const writes = new Set(['create-post', 'add-comment', 'edit-post', 'edit-comment', 'delete-post', 'delete-comment', 'report'])

const fixedRoutes = new Map([
  ['DELETE /api/account', 'delete-account'],
  ['GET /api/community/posts', 'list-posts'],
  ['POST /api/community/posts', 'create-post'],
  ['GET /api/community/tags', 'list-tags'],
  ['POST /api/community/reports', 'report'],
  ['GET /api/community/moderation/reports', 'queue'],
])
const itemRoutes = [
  [/^\/api\/auth\/(login|callback)\/(google|github)$/, { GET: 'oauth' }],
  [/^\/api\/community\/posts\/([^/]+)$/, { GET: 'get-post', PATCH: 'edit-post', DELETE: 'delete-post' }],
  [/^\/api\/community\/posts\/([^/]+)\/comments$/, { GET: 'list-comments', POST: 'add-comment' }],
  [/^\/api\/community\/comments\/([^/]+)$/, { PATCH: 'edit-comment', DELETE: 'delete-comment' }],
  [/^\/api\/community\/moderation\/reports\/([^/]+)$/, { PATCH: 'moderate' }],
]
const bodyActions = new Set(['create-post', 'edit-post', 'add-comment', 'edit-comment', 'report', 'moderate'])

export function s2Route(method, path) {
  let id = fixedRoutes.get(method + ' ' + path)
  let args = []
  if (!id) {
    for (const [pattern, actions] of itemRoutes) {
      const matched = actions[method] && pattern.exec(path)
      if (!matched) continue
      id = actions[method]
      args = matched.slice(1)
      break
    }
  }
  return id && { id, args, method, acceptsBody: bodyActions.has(id), csrf: method !== 'GET' }
}

function lengthBetween(value, min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max && !value.includes('\0')
}

function asPost(input, needsId) {
  if (!input || typeof input !== 'object') return null
  const title = typeof input.title === 'string' && input.title.trim()
  const body = typeof input.body === 'string' && input.body.trim()
  const { id, category, tags } = input
  if (!lengthBetween(title, 8, 120) || !lengthBetween(body, 20, 10000) || !categories.has(category)
    || !Array.isArray(tags) || tags.length > 5 || !tags.every(tag => typeof tag === 'string' && tagPattern.test(tag))
    || (needsId && (typeof id !== 'string' || !uuid.test(id)))) return null
  return { title, body, category, tags: [...new Set(tags)], ...(needsId && { id }) }
}

function readListParams(params) {
  const category = params.get('category')
  const tag = params.get('tag')
  const query = params.get('search') ?? ''
  const limit = params.has('limit') ? Number(params.get('limit')) : 24
  if ((category && !categories.has(category)) || (tag && !tagPattern.test(tag)) || query.length > 160 || query.includes('\0')
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) return null
  let cursor
  const encoded = params.get('cursor')
  if (encoded !== null) {
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(encoded)) return null
    try {
      const pair = JSON.parse(Buffer.from(encoded, 'base64url'))
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' ||
        !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?[+-]\d{2}(?::\d{2})?$/.test(pair[0]) ||
        !Number.isFinite(Date.parse(pair[0])) || typeof pair[1] !== 'string' || !uuid.test(pair[1])) return null
      cursor = { time: pair[0], id: pair[1] }
    } catch {
      return null
    }
  }
  return { category: category || null, tag: tag || null, terms: foldCommunityText(query).split(/\s+/).filter(Boolean), limit, cursor }
}

export function createS2({ origin, env, authStore, community, now = Date.now, fetchImpl }) {
  const oauth = createOAuth({ origin, env, store: authStore, now, fetchImpl })
  const writeCounts = new Map()
  let windowStart = now()
  function writeAllowed(id) {
    if (now() - windowStart >= 60_000) {
      writeCounts.clear()
      windowStart = now()
    }
    const count = writeCounts.get(id) ?? 0
    if (count >= 10 || (!count && writeCounts.size >= 10000)) return false
    writeCounts.set(id, count + 1)
    return true
  }
  const userFrom = digest => digest ? authStore.read(digest) : null
  const isOuterOrigin = req => req.headers.host === new URL(origin).host
  const sameOrigin = req => isOuterOrigin(req) && req.headers.origin === origin && req.headers['x-machmo-csrf'] === '1'
  return {
    async handle(route, req, res, send, params, getBody) {
      if (!isOuterOrigin(req)) return send(res, 404)
      if (route.csrf && !sameOrigin(req)) return send(res, 403)
      const { id, args = [] } = route
      if (id === 'oauth') {
        const [action, provider] = args
        const result = action === 'login' ? await oauth.begin(provider, params.get('next'))
          : await oauth.finish(provider, params, req.headers.cookie)
        res.setHeader('Location', result.location)
        if (result.cookies.length) res.setHeader('Set-Cookie', result.cookies)
        return send(res, 303)
      }
      const token = sessionToken(req.headers.cookie)
      const digest = token && sessionDigest(token)
      if (id === 'logout') {
        if (digest) await authStore.revoke(digest)
        res.setHeader('Set-Cookie', sessionCookie('', 0))
        return send(res, 204)
      }
      if (req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403)
      const viewer = await userFrom(digest)
      if (id === 'session') {
        if (viewer && viewer.expiresAt.getTime() - now() < week) {
          const session = newSession(now())
          if (await authStore.rotate(viewer.id, digest, session)) res.setHeader('Set-Cookie', sessionCookie(session.token))
        }
        const user = viewer && { id: viewer.id, displayName: viewer.displayName, avatarUrl: viewer.avatarUrl, provider: viewer.provider, role: viewer.role }
        return send(res, 200, { user })
      }
      if ((route.csrf || id === 'queue') && !viewer) return send(res, 401)
      if ((id === 'queue' || id === 'moderate') && viewer.role !== 'admin') return send(res, 403)
      if (args.length && !uuid.test(args[0])) return send(res, 404)
      if (writes.has(id) && !writeAllowed(viewer.id)) {
        res.setHeader('Retry-After', '60')
        return send(res, 429)
      }
      const body = route.acceptsBody ? await getBody() : null
      const target = args[0]
      switch (id) {
        case 'delete-account':
          await authStore.deleteAccount(viewer.id)
          res.setHeader('Set-Cookie', sessionCookie('', 0))
          return send(res, 204)
        case 'list-posts': {
          const query = readListParams(params)
          return query ? send(res, 200, await community.list(query, viewer)) : send(res, 400)
        }
        case 'list-tags': return send(res, 200, await community.tags())
        case 'get-post': {
          const item = await community.get(target, viewer)
          return item ? send(res, 200, item) : send(res, 404)
        }
        case 'list-comments': return send(res, 200, await community.listComments(target, viewer))
        case 'create-post': {
          const input = asPost(body, true)
          if (!input) return send(res, 400)
          const item = await community.create(input, viewer)
          return item ? send(res, 201, item) : send(res, 409)
        }
        case 'edit-post': {
          const input = asPost(body, false)
          return send(res, input ? await community.change('post', target, input, viewer) : 400)
        }
        case 'edit-comment':
        case 'add-comment': {
          const value = typeof body?.body === 'string' && body.body.trim()
          if (!lengthBetween(value, 2, 4000)) return send(res, 400)
          if (id === 'edit-comment') return send(res, await community.change('comment', target, value, viewer))
          const item = await community.addComment(target, value, viewer)
          return item ? send(res, 201, item) : send(res, 404)
        }
        case 'delete-post': return send(res, await community.change('post', target, null, viewer))
        case 'delete-comment': return send(res, await community.change('comment', target, null, viewer))
        case 'report': {
          if (!body || !['post', 'comment'].includes(body.targetType) || typeof body.targetId !== 'string' || !uuid.test(body.targetId)
            || !reasons.has(body.reason) || !lengthBetween(body.note, 0, 500)) return send(res, 400)
          const { targetType, targetId, reason, note } = body
          const report = await community.report({ targetType, targetId, reason, note: note.trim() }, viewer)
          return report ? send(res, 201, report) : send(res, 404)
        }
        case 'queue': return send(res, 200, await community.queue())
        case 'moderate':
          if (!['hide', 'dismiss'].includes(body?.action)) return send(res, 400)
          return send(res, await community.moderate(target, body.action) ? 204 : 404)
        default: return send(res, 404)
      }
    },
  }
}
