import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { inTransaction } from './oauth-store.mjs'
import { sessionToken } from './oauth.mjs'
import { sessionDigest } from '../community/session-http.mjs'

const saved = 'machmo_community.saved_projects'
const shares = 'machmo_community.project_shares'
const likes = 'machmo_community.project_likes'
const columns = 'id,name,source_id AS "sourceId",created_at AS "createdAt",byte_count AS "byteCount",bundle->>\'format\' AS format'
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
export const shareCodePattern = /^[A-Za-z0-9_-]{16}$/
const collection = {
  'GET /api/projects': 'list', 'POST /api/projects': 'save', 'GET /api/projects/gallery': 'gallery',
  'GET /api/projects/shares': 'my-shares', 'POST /api/projects/shares': 'share',
}
const record = value => value && typeof value === 'object' && !Array.isArray(value)

export function projectRoute(method, path) {
  const route = collection[method + ' ' + path]
  if (route) return { id: 'project-' + route, method, csrf: method !== 'GET', acceptsBody: method === 'POST' }
  const match = /^\/api\/projects\/(shares\/)?([^/]+)(\/like)?$/.exec(path)
  if (!match) return null
  const [, shared, key, like] = match
  if (shared ? !shareCodePattern.test(key) : !uuid.test(key)) return null
  const action = like ? shared && ({ POST: 'like', DELETE: 'unlike' })[method]
    : ({ GET: shared ? 'read-share' : 'read', DELETE: shared ? 'unshare' : 'remove' })[method]
  if (!action) return null
  return { id: 'project-' + action, key, method, csrf: method !== 'GET' }
}

function projectInput(value) {
  const name = typeof value?.name === 'string' ? value.name.trim() : ''
  const src = value?.sourceId
  const bundle = value?.bundle
  if (!name || name.length > 80 || /[\u0000-\u001f]/.test(name) || typeof src !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(src)
    || bundle?.version !== 1 || !record(bundle.workspace)) return null
  const workspace = bundle.workspace
  if (bundle.format === 'mach-mo-project') {
    if (!Array.isArray(workspace.placed) || !workspace.placed.some(item => item?.type === 'board') || workspace.placed.length > 100
      || !Array.isArray(workspace.wires) || workspace.wires.length > 500
      || ![bundle.lessonDrafts, bundle.branchSession, bundle.branchDrafts].every(record)) return null
  } else if (bundle.format === 'mach-mo-freestyle') {
    const doc = workspace.doc
    if (workspace.version !== 1 || !/^[a-z0-9-]{1,60}$/.test(workspace.boardId ?? '') || typeof workspace.code !== 'string'
      || doc?.schema !== 2 || doc.lessonId !== 'freestyle' || !Array.isArray(doc.parts) || doc.parts.length > 100
      || !doc.parts.some(item => item?.type === 'board') || !Array.isArray(doc.wires) || doc.wires.length > 500
      || !Array.isArray(doc.breadboards) || doc.breadboards.length > 20) return null
  } else {
    return null
  }
  const body = JSON.stringify(bundle)
  const bytes = Buffer.byteLength(body)
  if (bytes > 56 * 1024) return null
  return { name, src, body, bytes, digest: createHash('sha256').update(name + '\0' + body).digest('hex') }
}

const galleryFields = 's.code,p.name,s.listed,s.created_at AS "createdAt",s.views::float8 AS views,' +
  '(SELECT count(*)::int FROM ' + likes + ' l WHERE l.share_code=s.code) AS likes'

export function createProjectStore(pool) {
  return {
    async list(account) {
      const { rows } = await pool.query('SELECT ' + columns + ' FROM ' + saved + ' WHERE account_id=$1 ORDER BY created_at DESC,id LIMIT 50', [account])
      return rows
    },
    async save(input, account) {
      return inTransaction(pool, async db => {
        await db.query('SELECT id FROM machmo_community.accounts WHERE id=$1 FOR UPDATE', [account])
        const existing = await db.query('SELECT ' + columns + ' FROM ' + saved + ' WHERE account_id=$1 AND source_id=$2 AND digest=$3',
          [account, input.src, input.digest])
        if (existing.rows[0]) return { item: existing.rows[0], repeated: true }
        const { rows } = await db.query('SELECT count(*)::int AS count,coalesce(sum(byte_count),0)::int AS size, ' +
          'count(*) FILTER (WHERE source_id=$2)::int AS versions FROM ' + saved + ' WHERE account_id=$1', [account, input.src])
        if (rows[0].count >= 50 || rows[0].size + input.bytes > 2 * 1024 * 1024) return null
        const inserted = await db.query('INSERT INTO ' + saved + ' (id,account_id,source_id,name,digest,bundle,byte_count) ' +
          'VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ' + columns,
        [randomUUID(), account, input.src, input.name, input.digest, input.body, input.bytes])
        return { item: inserted.rows[0], conflict: rows[0].versions > 0 }
      })
    },
    async read(id, account) {
      return (await pool.query('SELECT ' + columns + ',bundle FROM ' + saved + ' WHERE id=$1 AND account_id=$2', [id, account])).rows[0]
    },
    async remove(id, account) {
      return (await pool.query('DELETE FROM ' + saved + ' WHERE id=$1 AND account_id=$2', [id, account])).rowCount === 1
    },
    async share(id, listed, account) {
      return inTransaction(pool, async db => {
        const owner = await db.query('SELECT id FROM ' + saved + ' WHERE id=$1 AND account_id=$2', [id, account])
        if (!owner.rowCount) return null
        await db.query('INSERT INTO ' + shares + ' (code,project_id,listed) VALUES ($1,$2,$3) ON CONFLICT (project_id,listed) DO NOTHING',
          [randomBytes(12).toString('base64url'), id, listed])
        return (await db.query('SELECT code,listed,hidden FROM ' + shares + ' WHERE project_id=$1 AND listed=$2', [id, listed])).rows[0]
      })
    },
    async myShares(account) {
      const { rows } = await pool.query('SELECT ' + galleryFields + ',s.hidden FROM ' + shares + ' s JOIN ' + saved + ' p ON p.id=s.project_id ' +
        'WHERE p.account_id=$1 ORDER BY s.created_at DESC,s.code LIMIT 100', [account])
      return rows
    },
    async gallery() {
      const { rows } = await pool.query('SELECT ' + galleryFields + ' FROM ' + shares + ' s JOIN ' + saved + ' p ON p.id=s.project_id ' +
        'WHERE s.listed AND NOT s.hidden ORDER BY s.created_at DESC,s.code LIMIT 50')
      return rows
    },
    async readShare(code) {
      const { rows } = await pool.query('WITH view AS (UPDATE ' + shares + ' SET views=views+1 WHERE code=$1 AND NOT hidden RETURNING *) ' +
        'SELECT ' + galleryFields + ',p.bundle FROM view s JOIN ' + saved + ' p ON p.id=s.project_id', [code])
      return rows[0]
    },
    async unshare(code, account) {
      return (await pool.query('DELETE FROM ' + shares + ' s USING ' + saved + ' p WHERE s.code=$1 AND p.id=s.project_id AND p.account_id=$2',
        [code, account])).rowCount === 1
    },
    async like(code, account, liked) {
      if (liked) {
        await pool.query('INSERT INTO ' + likes + ' (share_code, account_id) SELECT code,$2 FROM ' + shares +
          ' WHERE code=$1 AND listed AND NOT hidden ON CONFLICT DO NOTHING', [code, account])
      } else {
        await pool.query('DELETE FROM ' + likes + ' WHERE share_code=$1 AND account_id=$2', [code, account])
      }
      const { rows } = await pool.query('SELECT count(*)::int AS count FROM ' + likes + ' WHERE share_code=$1', [code])
      return rows[0].count
    },
  }
}

export function createProjectHttp({ store, origin, authStore }) {
  const host = new URL(origin).host
  return async (route, request, readBody) => {
    if (request.headers.host !== host) return { status: 404 }
    if (route.csrf && (request.headers.origin !== origin || request.headers['x-machmo-csrf'] !== '1')) return { status: 403 }
    const action = route.id.slice('project-'.length)
    if (action === 'gallery') return { status: 200, body: await store.gallery() }
    const key = route.key
    if (action === 'read-share') {
      const body = await store.readShare(key)
      return body ? { status: 200, body } : { status: 404 }
    }
    const token = sessionToken(request.headers.cookie)
    const account = token ? await authStore.read(sessionDigest(token)) : null
    if (!account) return { status: 401 }
    switch (action) {
      case 'list': return { status: 200, body: await store.list(account.id) }
      case 'save': {
        const input = projectInput(await readBody())
        if (!input) return { status: 400 }
        const result = await store.save(input, account.id)
        return result ? { status: result.repeated ? 200 : 201, body: result } : { status: 409 }
      }
      case 'read': {
        const body = await store.read(key, account.id)
        return body ? { status: 200, body } : { status: 404 }
      }
      case 'remove': return { status: await store.remove(key, account.id) ? 204 : 404 }
      case 'my-shares': return { status: 200, body: await store.myShares(account.id) }
      case 'share': {
        const body = await readBody()
        if (typeof body?.id !== 'string' || !uuid.test(body.id) || typeof body.listed !== 'boolean') return { status: 400 }
        const result = await store.share(body.id, body.listed, account.id)
        return result ? { status: result.hidden ? 409 : 201, body: result.hidden ? undefined : result } : { status: 404 }
      }
      case 'unshare': return { status: await store.unshare(key, account.id) ? 204 : 404 }
      case 'like':
      case 'unlike': return { status: 200, body: { likes: await store.like(key, account.id, action === 'like') } }
      default: return { status: 404 }
    }
  }
}
