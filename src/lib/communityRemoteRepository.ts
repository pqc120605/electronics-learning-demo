import type { SupabaseClient } from '@supabase/supabase-js'
import { filterPosts, normalizeTag, validateComment, validatePostInput, type CommunityPost, type CommunityComment, type CommunityRepository } from './community'
import { prepareAttachment, validateAttachments, type CommunityAttachment } from './communityAttachments'
const BUCKET = 'community-attachments'
type Row = Record<string, unknown>
function fail(error: { message: string } | null): void { if (error) throw new Error(`Cộng đồng online: ${error.message}`) }
function postFromRow(row: Row): CommunityPost {
  return { id: String(row.id), title: String(row.title), body: String(row.body), category: row.category as CommunityPost['category'], tags: row.tags as string[], author: { id: String(row.author_id), name: String(row.author_name), avatarUrl: null }, createdAt: String(row.created_at), commentCount: Number(row.comment_count ?? 0), origin: 'remote', attachments: (row.attachments ?? []) as CommunityAttachment[] }
}
function commentFromRow(row: Row): CommunityComment {
  return { id: String(row.id), postId: String(row.post_id), body: String(row.body), author: { id: String(row.author_id), name: String(row.author_name), avatarUrl: null }, createdAt: String(row.created_at), origin: 'remote' }
}
/** All write identity is verified by Auth and enforced again by RLS/RPC. Never falls back to local. */
export function createRemoteRepository(client: SupabaseClient): CommunityRepository {
  async function requireUser() {
    const { data, error } = await client.auth.getUser()
    fail(error)
    if (!data.user) throw new Error('Cần đăng nhập để ghi vào cộng đồng online.')
    return data.user
  }
  const repo: CommunityRepository = {
    mode: 'remote',
    async listPosts(query) {
      const { data, error } = await client.from('community_posts').select('*').eq('status', 'published').order('created_at', { ascending: false })
      fail(error)
      return filterPosts((data ?? []).map(postFromRow), query)
    },
    async getPost(id) {
      const { data, error } = await client.from('community_posts').select('*').eq('status', 'published').eq('id', id).maybeSingle()
      fail(error)
      return data ? postFromRow(data) : null
    },
    async listComments(postId) {
      const { data, error } = await client.from('community_comments').select('*').eq('post_id', postId).order('created_at')
      fail(error)
      return (data ?? []).map(commentFromRow)
    },
    async createPost(input) {
      const user = await requireUser()
      const files = input.files ?? []
      const problem = validateAttachments(files)
      if (problem) throw new Error(problem)
      const tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))]
      const validation = validatePostInput({ ...input, tags })
      if (!validation.ok) throw new Error(Object.values(validation.errors)[0])
      const id = input.requestId ?? crypto.randomUUID()
      const attachments = await Promise.all(files.map((file, i) => prepareAttachment(file, String(i))))
      const manifest = await Promise.all(attachments.map(async (attachment, i) => ({ ...attachment, path: `${user.id}/${id}/${i}`, sha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await files[i].arrayBuffer()))).map(b => b.toString(16).padStart(2, '0')).join('') })))
      const { data: draft, error: beginError } = await client.rpc('community_begin_post', { p_id: id, p_title: input.title.trim(), p_body: input.body.trim(), p_category: input.category, p_tags: tags, p_manifest: manifest })
      fail(beginError)
      if (!draft || !Array.isArray(draft.uploaded)) throw new Error('Máy chủ thiếu giao thức community; chưa đăng bài.')
      if (draft.status !== 'published') {
        for (let i = 0; i < files.length; i++) {
          if (draft.uploaded.includes(manifest[i].path)) continue
          // storage-js uses Blob.type for multipart uploads, not the contentType option.
          const body = new Blob([files[i]], { type: 'application/octet-stream' })
          const { error } = await client.storage.from(BUCKET).upload(manifest[i].path, body, { contentType: 'application/octet-stream', upsert: false })
          if (error) throw new Error(`Tải tệp thất bại. Bản chờ riêng tư ${id} được giữ để thử lại: ${error.message}`)
        }
        const { error } = await client.rpc('community_publish_post', { p_id: id })
        if (error) throw new Error(`Chưa xác nhận đăng bài ${id}; giữ nguyên biểu mẫu để thử lại: ${error.message}`)
      }
      const published = await repo.getPost(id)
      if (!published) throw new Error(`Không đọc được bài ${id} sau khi đăng. Giữ biểu mẫu và thử lại cùng mã yêu cầu.`)
      return published
    },
    async addComment(postId, body) {
      await requireUser()
      const problem = validateComment(body)
      if (problem) throw new Error(problem)
      const { data, error } = await client.rpc('community_add_comment', { p_post_id: postId, p_body: body.trim() })
      fail(error)
      if (!data) throw new Error('Máy chủ không trả lại bình luận.')
      return commentFromRow(data)
    },
    async report(input) {
      await requireUser()
      const { data, error } = await client.rpc('community_report', { p_target_type: input.targetType, p_target_id: input.targetId, p_reason: input.reason, p_note: input.note.trim() })
      fail(error)
      if (!data) throw new Error('Chưa xác nhận nhận báo cáo.')
      return { ...input, id: String(data.id), createdAt: String(data.created_at) }
    },
    async listTags() {
      const counts = new Map<string, number>()
      for (const post of await repo.listPosts()) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
      return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
    },
    async getAttachment(attachment) {
      if (!attachment.path) throw new Error('Thiếu đường dẫn tệp trên máy chủ.')
      const { data, error } = await client.storage.from(BUCKET).createSignedUrl(attachment.path, 60)
      fail(error)
      if (!data?.signedUrl) throw new Error('Không tạo được liên kết tải riêng tư.')
      const response = await fetch(data.signedUrl)
      if (!response.ok) throw new Error('Tệp không còn khả dụng hoặc liên kết đã hết hạn.')
      const blob = await response.blob()
      if (blob.size !== attachment.size || blob.size > 10485760) throw new Error('Dung lượng tệp không khớp dữ liệu đã đăng.')
      return blob
    },
  }
  return repo
}
