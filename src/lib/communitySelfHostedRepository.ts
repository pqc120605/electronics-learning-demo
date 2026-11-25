import type { CommunityComment, CommunityModerationReport, CommunityPageResult, CommunityPost, CommunityReport, CommunityRepository, PostQuery } from './community'
import { selfHostedCsrf } from './selfHostedAuth'
import { apiRequest, readApiJson } from './api'
import { ATTACHMENT_LIMITS, prepareAttachment, validateAttachments, type CommunityAttachment } from './communityAttachments'

const base = '/api/community'
const posts = base + '/posts'
const reports = base + '/moderation/reports'
const attachmentChunkBytes = 1024 * 1024
const attachmentPath = /^\/api\/community\/posts\/[a-f0-9-]{36}\/attachments\/[a-f0-9-]{36}$/
const item = (collection: string, id: string) => collection + '/' + encodeURIComponent(id)

async function request<T>(path: string, method = 'GET', body?: unknown, allowMissing = false): Promise<T> {
  const response = await apiRequest(path, {
    method, signal: AbortSignal.timeout(8000),
    headers: { ...(method !== 'GET' && selfHostedCsrf), ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  }, allowMissing ? [404, 409, 413] : [409, 413])
  if (response.status === 404 && allowMissing) return null as T
  if (response.status === 409) throw new Error('Mã lượt đăng đã được dùng. Hãy kiểm lại nội dung trước khi thử lại.')
  if (response.status === 413) throw new Error('Đã vượt dung lượng cho phép của bài hoặc kho tệp online của tài khoản.')
  if (response.status === 204) return undefined as T
  return readApiJson<T>(response)
}

async function uploadAttachments(id: string, files: File[]): Promise<void> {
  const error = validateAttachments(files)
  if (error) throw new Error(error)
  const entries = []
  for (const file of files) entries.push(await prepareAttachment(file))
  for (const [slot, file] of files.entries()) {
    const { name, size } = entries[slot]
    const path = item(base + '/uploads', id) + '/' + slot
    await request(path, 'PUT', { name, size })
    for (let offset = 0, part = 0; offset < size; offset += attachmentChunkBytes, part++) {
      await apiRequest(path + '/' + part, {
        method: 'PUT', headers: { ...selfHostedCsrf, 'Content-Type': 'application/octet-stream' },
        signal: AbortSignal.timeout(30_000), body: file.slice(offset, offset + attachmentChunkBytes),
      })
    }
  }
}

async function getAttachment({ path, size }: CommunityAttachment): Promise<Blob | null> {
  if (!path || !attachmentPath.test(path) || !Number.isInteger(size) || size < 1 || size > ATTACHMENT_LIMITS.fileBytes) return null
  const chunks: Blob[] = []
  for (let offset = 0, part = 0; offset < size; offset += attachmentChunkBytes, part++) {
    const response = await apiRequest(path + '/' + part, { signal: AbortSignal.timeout(30_000) }, [404])
    if (response.status === 404 || response.headers.get('content-type') !== 'application/octet-stream') return null
    const blob = await response.blob()
    if (blob.size !== Math.min(attachmentChunkBytes, size - offset)) return null
    chunks.push(blob)
  }
  return new Blob(chunks, { type: 'application/octet-stream' })
}

function listPostsPage(query: PostQuery, cursor?: string): Promise<CommunityPageResult> {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  if (query.tag) params.set('tag', query.tag)
  if (cursor) params.set('cursor', cursor)
  return request<CommunityPageResult>(posts + '?' + params)
}

export function createSelfHostedCommunityRepository(): CommunityRepository {
  return {
    mode: 'remote',
    getAttachment,
    listPostsPage,
    async listPosts(query = {}) { return (await listPostsPage(query)).items },
    getPost(id) { return request<CommunityPost | null>(item(posts, id), 'GET', undefined, true) },
    listComments(id) { return request<CommunityComment[]>(item(posts, id) + '/comments') },
    async createPost({ files = [], requestId, title, body, category, tags }) {
      const id = requestId ?? crypto.randomUUID()
      if (files.length) await uploadAttachments(id, files)
      return request<CommunityPost>(posts, 'POST', { id, title, body, category, tags, ...(files.length && { attachmentCount: files.length }) })
    },
    updatePost(id, input) { return request<void>(item(posts, id), 'PATCH', input) },
    addComment(id, body) { return request<CommunityComment>(item(posts, id) + '/comments', 'POST', { body }) },
    updateComment(id, body) { return request<void>(item(base + '/comments', id), 'PATCH', { body }) },
    remove(kind, id) { return request<void>(item(kind === 'post' ? posts : base + '/comments', id), 'DELETE') },
    report(input) { return request<CommunityReport>(base + '/reports', 'POST', input) },
    listTags() { return request<Array<{ tag: string; count: number }>>(base + '/tags') },
    moderationQueue() { return request<CommunityModerationReport[]>(reports) },
    moderate(id, action) { return request<void>(item(reports, id), 'PATCH', { action }) },
  }
}
