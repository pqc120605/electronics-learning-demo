import { randomUUID } from 'node:crypto'
import { inTransaction } from './oauth-store.mjs'

export const CHUNK_BYTES = 1024 * 1024
export const MAX_FILES = 5
const fileBytes = 10 * CHUNK_BYTES
const postBytes = 25 * CHUNK_BYTES
const accountBytes = 100 * CHUNK_BYTES
const files = 'machmo_community.post_attachments'
const chunks = 'machmo_community.post_attachment_chunks'
const posts = 'machmo_community.community_posts'
const extensions = /\.(png|jpe?g|webp|gif|pdf|txt|md|csv|json|ino|c|h|cpp|hpp|py|hex|log)$/i
const raster = /\.(png|jpe?g|webp|gif)$/i

export function attachmentInput(value) {
  const { name, size } = value ?? {}
  if (typeof name !== 'string' || name.length > 120 || name !== name.trim() || /^[. ]/.test(name)
      || /[<>:"/\\|?*\x00-\x1f\x7f]/.test(name) || name.isWellFormed() === false
      || !extensions.test(name) || !Number.isSafeInteger(size) || size < 1 || size > fileBytes) return null
  return { name, size, kind: raster.test(name) ? 'image' : 'file' }
}

function rasterSignature(name, data) {
  if (/\.png$/i.test(name)) return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (/\.jpe?g$/i.test(name)) return data[0] === 255 && data[1] === 216 && data[2] === 255
  if (/\.gif$/i.test(name)) return ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6))
  return data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
}

export function lockUploads(db, accountId) {
  return db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', ['community-uploads:' + accountId])
}

export async function publishedAttachments(db, postId) {
  const { rows } = await db.query('SELECT f.id,f.name,f.size,f.kind FROM ' + files + ' f JOIN ' + posts +
    ' p ON p.id=f.post_id WHERE p.id=$1 AND NOT p.hidden ORDER BY f.slot', [postId])
  return rows.map(row => ({ ...row, path: '/api/community/posts/' + postId + '/attachments/' + row.id }))
}

export async function readyUploads(db, accountId, postId, count) {
  const { rows } = await db.query('WITH pending AS (SELECT id,slot,size FROM ' + files +
    ' WHERE account_id=$1 AND draft_id=$2 AND post_id IS NULL FOR UPDATE)' +
    ' SELECT f.slot,f.size,coalesce(sum(octet_length(c.data)),0)::int AS uploaded FROM pending f LEFT JOIN ' +
    chunks + ' c ON c.attachment_id=f.id GROUP BY f.slot,f.size ORDER BY f.slot', [accountId, postId])
  return rows.length === count && rows.every((row, index) => row.slot === index && row.size === row.uploaded)
}

export function publishUploads(db, accountId, postId) {
  return db.query('UPDATE ' + files + ' SET post_id=$2 WHERE account_id=$1 AND draft_id=$2 AND post_id IS NULL', [accountId, postId])
}

export function createCommunityAttachmentStore(pool) {
  return {
    async init(draftId, slot, attachment, viewer) {
      return inTransaction(pool, async db => {
        await lockUploads(db, viewer.id)
        const args = [viewer.id, draftId, slot]
        const existing = (await db.query('SELECT name,size,kind FROM ' + files + ' WHERE account_id=$1 AND draft_id=$2 AND slot=$3', args)).rows[0]
        if (existing) return existing.name === attachment.name && existing.size === attachment.size && existing.kind === attachment.kind ? 204 : 409
        if ((await db.query('SELECT 1 FROM ' + posts + ' WHERE id=$1', [draftId])).rowCount) return 409
        const { rows: [used] } = await db.query('SELECT coalesce(sum(size),0)::int AS account,' +
          ' coalesce(sum(size) FILTER (WHERE draft_id=$2),0)::int AS draft FROM ' + files + ' WHERE account_id=$1', args.slice(0, 2))
        if (used.account + attachment.size > accountBytes || used.draft + attachment.size > postBytes) return 413
        await db.query('INSERT INTO ' + files + ' (id,account_id,draft_id,slot,name,size,kind) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [randomUUID(), ...args, attachment.name, attachment.size, attachment.kind])
        return 204
      })
    },
    async write(draftId, slot, part, data, viewer) {
      return inTransaction(pool, async db => {
        await lockUploads(db, viewer.id)
        const { rows: [file] } = await db.query('SELECT id,name,size,kind,post_id FROM ' + files +
          ' WHERE account_id=$1 AND draft_id=$2 AND slot=$3 FOR SHARE', [viewer.id, draftId, slot])
        if (!file) return 404
        const expected = Math.min(CHUNK_BYTES, file.size - part * CHUNK_BYTES)
        if (data.length !== expected || (part === 0 && file.kind === 'image' && !rasterSignature(file.name, data))) return 400
        const args = [file.id, part, data]
        const { rows: [previous] } = await db.query('SELECT data=$3 AS same FROM ' + chunks + ' WHERE attachment_id=$1 AND part=$2', args)
        if (previous) return previous.same ? 204 : 409
        if (file.post_id) return 409
        await db.query('INSERT INTO ' + chunks + ' (attachment_id,part,data) VALUES ($1,$2,$3)', args)
        return 204
      })
    },
    async read(postId, id, part) {
      const { rows: [item] } = await pool.query('SELECT f.name,c.data FROM ' + files + ' f JOIN ' + posts +
        ' p ON p.id=f.post_id JOIN ' + chunks + ' c ON c.attachment_id=f.id WHERE p.id=$1 AND f.id=$2 AND c.part=$3 AND NOT p.hidden',
      [postId, id, part])
      return item
    },
    expire() {
      return pool.query('DELETE FROM ' + files + " WHERE post_id IS NULL AND created_at<now()-interval '24 hours'")
    },
  }
}
