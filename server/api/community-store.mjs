import { randomUUID } from 'node:crypto'
import { inTransaction } from './oauth-store.mjs'
import { lockUploads, publishedAttachments, publishUploads, readyUploads } from './community-attachments.mjs'

const posts = 'machmo_community.community_posts'
const comments = 'machmo_community.community_comments'
const accounts = 'machmo_community.accounts'
const reports = 'machmo_community.community_reports'
const shares = 'machmo_community.project_shares'
export const foldCommunityText = value => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase()

function author(row) {
  return { name: row.display_name, avatarUrl: row.avatar_url }
}

function post(row, viewer) {
  return {
    id: row.id, title: row.title, body: row.body, category: row.category, tags: row.tags,
    author: author(row), createdAt: row.created_at, commentCount: Number(row.comment_count), origin: 'remote',
    ...(viewer && { canEdit: viewer.id === row.account_id }),
  }
}

function comment(row, viewer) {
  return {
    id: row.id, postId: row.post_id, body: row.body, createdAt: row.created_at, author: author(row), origin: 'remote',
    ...(viewer && { canEdit: viewer.id === row.account_id }),
  }
}

const postProjection = 'p.*, p.created_at::text AS cursor_time, a.display_name, a.avatar_url, ' +
  '(SELECT count(*) FROM ' + comments + ' c WHERE c.post_id=p.id AND NOT c.hidden) AS comment_count'
async function readPost(db, id) {
  return (await db.query(
    'SELECT ' + postProjection + ' FROM ' + posts + ' p JOIN ' + accounts + ' a ON a.id=p.account_id WHERE p.id=$1 AND NOT p.hidden', [id],
  )).rows[0]
}

function searchText({ title, body, tags }) {
  return foldCommunityText([title, body, ...tags].join(' '))
}

export function createCommunityStore(pool) {
  return {
    async list({ terms, category, tag, cursor, limit }, viewer) {
      const { rows } = await pool.query(
        'SELECT ' + postProjection + ' FROM ' + posts + ' p JOIN ' + accounts + ' a ON a.id=p.account_id ' +
        'WHERE NOT p.hidden AND ($1::text IS NULL OR p.category=$1) AND ($2::text IS NULL OR $2=ANY(p.tags)) ' +
        'AND NOT EXISTS (SELECT FROM unnest($3::text[]) AS term WHERE strpos(p.search_text,term)=0) ' +
        'AND ($4::timestamptz IS NULL OR (p.created_at,p.id)<($4::timestamptz,$5::uuid)) ' +
        'ORDER BY p.created_at DESC,p.id DESC LIMIT $6', [category, tag, terms, cursor?.time ?? null, cursor?.id ?? null, limit + 1])
      const items = rows.slice(0, limit)
      const last = items.at(-1)
      const nextCursor = rows.length > limit ? Buffer.from(JSON.stringify([last.cursor_time, last.id])).toString('base64url') : null
      return { items: items.map(row => post(row, viewer)), nextCursor }
    },
    async tags() {
      const { rows } = await pool.query('SELECT tag, count(*)::int AS count FROM ' + posts +
        ' CROSS JOIN LATERAL unnest(tags) AS tag WHERE NOT hidden GROUP BY tag ORDER BY count DESC,tag LIMIT 100')
      return rows
    },
    async get(id, viewer) {
      const row = await readPost(pool, id)
      return row ? { ...post(row, viewer), attachments: await publishedAttachments(pool, id) } : null
    },
    async listComments(id, viewer) {
      const { rows } = await pool.query(
        'SELECT c.*, a.display_name, a.avatar_url FROM ' + comments + ' c JOIN ' + posts + ' p ON p.id=c.post_id ' +
        'JOIN ' + accounts + ' a ON a.id=c.account_id WHERE c.post_id=$1 AND NOT c.hidden AND NOT p.hidden ORDER BY c.created_at,c.id LIMIT 200',
        [id])
      return rows.map(row => comment(row, viewer))
    },
    async create(input, viewer) {
      return inTransaction(pool, async db => {
        const count = input.attachmentCount ?? 0
        if (count) await lockUploads(db, viewer.id)
        let row = await readPost(db, input.id)
        if (!row) {
          if (count && !await readyUploads(db, viewer.id, input.id, count)) return null
          const inserted = await db.query('INSERT INTO ' + posts +
            ' (id,account_id,title,body,category,tags,search_text) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING',
          [input.id, viewer.id, input.title, input.body, input.category, input.tags, searchText(input)])
          if (count && inserted.rowCount) await publishUploads(db, viewer.id, input.id)
          row = await readPost(db, input.id)
        }
        if (!row || row.account_id !== viewer.id || row.title !== input.title || row.body !== input.body ||
          row.category !== input.category || JSON.stringify(row.tags) !== JSON.stringify(input.tags)) return null
        const attachments = await publishedAttachments(db, input.id)
        return attachments.length === count ? { ...post(row, viewer), attachments } : null
      })
    },
    async addComment(postId, body, viewer) {
      const { rows } = await pool.query('INSERT INTO ' + comments + ' (id,post_id,account_id,body) ' +
        'SELECT $1,id,$3,$4 FROM ' + posts + ' WHERE id=$2 AND NOT hidden RETURNING *', [randomUUID(), postId, viewer.id, body])
      return rows[0] ? comment({ ...rows[0], display_name: viewer.displayName, avatar_url: viewer.avatarUrl }, viewer) : null
    },
    async change(kind, id, value, viewer) {
      const table = kind === 'post' ? posts : comments
      return inTransaction(pool, async db => {
        const { rows } = await db.query('SELECT account_id FROM ' + table + ' WHERE id=$1 AND NOT hidden FOR UPDATE', [id])
        if (!rows.length) return 404
        if (rows[0].account_id !== viewer.id) return 403
        if (value === null) await db.query('DELETE FROM ' + table + ' WHERE id=$1', [id])
        else if (kind === 'post') await db.query('UPDATE ' + posts + ' SET title=$2,body=$3,category=$4,tags=$5,search_text=$6 WHERE id=$1',
          [id, value.title, value.body, value.category, value.tags, searchText(value)])
        else await db.query('UPDATE ' + comments + ' SET body=$2 WHERE id=$1', [id, value])
        return 204
      })
    },
    async report(input, viewer) {
      const targets = { post: [posts, 'post_id', 'id'], comment: [comments, 'comment_id', 'id'], project: [shares, 'share_code', 'code'] }
      const [table, column, key] = targets[input.targetType]
      return inTransaction(pool, async db => {
        const { rows } = await db.query('SELECT ' + key + ' FROM ' + table + ' WHERE ' + key + '=$1 AND NOT hidden FOR SHARE', [input.targetId])
        if (!rows.length) return null
        await db.query('INSERT INTO ' + reports + ' (id,account_id,' + column + ',reason,note) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
          [randomUUID(), viewer.id, input.targetId, input.reason, input.note])
        const saved = (await db.query('SELECT id,reason,note,created_at FROM ' + reports + ' WHERE account_id=$1 AND ' + column + '=$2',
          [viewer.id, input.targetId])).rows[0]
        return { ...input, id: saved.id, reason: saved.reason, note: saved.note, createdAt: saved.created_at }
      })
    },
    async queue() {
      const { rows } = await pool.query('SELECT r.id, coalesce(r.post_id,c.post_id) AS "postId", r.comment_id AS "commentId", r.share_code AS "shareCode", r.reason, r.note, r.created_at AS "createdAt" ' +
        'FROM ' + reports + ' r LEFT JOIN ' + comments + ' c ON c.id=r.comment_id WHERE r.resolved_at IS NULL ORDER BY r.created_at,r.id LIMIT 100')
      return rows
    },
    async moderate(id, action) {
      return inTransaction(pool, async db => {
        const { rows } = await db.query('UPDATE ' + reports + ' SET resolved_at=now() WHERE id=$1 AND resolved_at IS NULL RETURNING post_id,comment_id,share_code', [id])
        const report = rows[0]
        if (!report) return false
        if (action === 'hide') {
          const table = report.share_code ? shares : report.post_id ? posts : comments
          const key = report.share_code ? 'code' : 'id'
          await db.query('UPDATE ' + table + ' SET hidden=true WHERE ' + key + '=$1', [report.post_id ?? report.comment_id ?? report.share_code])
        }
        return true
      })
    },
  }
}
