import type { CommunityComment, CommunityModerationReport, CommunityPageResult, CommunityPost, CommunityReport, CommunityRepository, PostQuery } from './community'
import { selfHostedCsrf } from './selfHostedAuth'

const base = '/api/community'
const posts = base + '/posts'
const reports = base + '/moderation/reports'
const item = (collection: string, id: string) => collection + '/' + encodeURIComponent(id)

async function request<T>(path: string, method = 'GET', body?: unknown, allowMissing = false): Promise<T> {
  const response = await fetch(path, {
    method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { ...(method !== 'GET' && selfHostedCsrf), ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  if (response.status === 404 && allowMissing) return null as T
  if (response.status === 401) throw new Error('Hãy đăng nhập để thực hiện thao tác này.')
  if (response.status === 403) throw new Error('Bạn không có quyền thực hiện thao tác này.')
  if (response.status === 429) throw new Error('Bạn thao tác quá nhanh. Hãy thử lại sau một phút.')
  if (response.status === 409) throw new Error('Mã lượt đăng đã được dùng. Hãy kiểm lại nội dung trước khi thử lại.')
  if (response.status === 204) return undefined as T
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Cộng đồng online chưa xử lý được yêu cầu.')
  return await response.json() as T
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
    supportsAttachments: false,
    listPostsPage,
    async listPosts(query = {}) { return (await listPostsPage(query)).items },
    getPost(id) { return request<CommunityPost | null>(item(posts, id), 'GET', undefined, true) },
    listComments(id) { return request<CommunityComment[]>(item(posts, id) + '/comments') },
    createPost({ files, requestId, title, body, category, tags }) {
      if (files?.length) throw new Error('Máy chủ này chưa nhận tệp đính kèm.')
      return request<CommunityPost>(posts, 'POST', { id: requestId ?? crypto.randomUUID(), title, body, category, tags })
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
