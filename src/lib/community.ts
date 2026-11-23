/**
 * Tầng dữ liệu cộng đồng. UI chỉ nói chuyện với `CommunityRepository`.
 * Bản xem trước giữ dữ liệu cục bộ; adapter online nằm trong communityRemoteRepository.
 * Cấu hình/schema do founder thiết lập theo docs/software/community-online.
 */

import { prepareAttachment, validateAttachments, type CommunityAttachment } from './communityAttachments'
import { communityAttachmentStore, type CommunityAttachmentStore } from './communityAttachmentStore'

export type CommunityCategoryId = 'co-ban' | 'nhung' | 'iot' | 'du-an' | 'hoi-dap-loi'

export const COMMUNITY_CATEGORIES: ReadonlyArray<{ id: CommunityCategoryId; label: string; summary: string }> = [
  { id: 'co-ban', label: 'Điện tử cơ bản', summary: 'Định luật Ohm, linh kiện thụ động, nguồn, đo đạc.' },
  { id: 'nhung', label: 'Vi điều khiển & nhúng', summary: 'Arduino, ESP32, Pico, STM32, ngắt, timer, giao tiếp.' },
  { id: 'iot', label: 'IoT', summary: 'Wi-Fi, BLE, MQTT, cảm biến từ xa, tiết kiệm pin.' },
  { id: 'du-an', label: 'Dự án', summary: 'Khoe dự án, xin góp ý thiết kế mạch và PCB.' },
  { id: 'hoi-dap-loi', label: 'Hỏi đáp lỗi', summary: 'Mạch không chạy, code lỗi biên dịch, board không nhận.' },
]

export type CommunityAuthor = { id?: string; name: string; avatarUrl: string | null }

export type CommunityPost = {
  id: string
  title: string
  body: string
  category: CommunityCategoryId
  tags: string[]
  author: CommunityAuthor
  createdAt: string
  commentCount: number
  /** 'sample' = mẫu; 'local' = trên thiết bị; 'remote' = đã công bố trên máy chủ. */
  origin: 'sample' | 'local' | 'remote'
  attachments?: CommunityAttachment[]
  canEdit?: boolean
}

export type CommunityComment = {
  id: string
  postId: string
  body: string
  author: CommunityAuthor
  createdAt: string
  origin: 'sample' | 'local' | 'remote'
  canEdit?: boolean
}

export type ReportReason = 'spam' | 'offensive' | 'unsafe' | 'off-topic' | 'other'

export const REPORT_REASONS: ReadonlyArray<{ id: ReportReason; label: string }> = [
  { id: 'spam', label: 'Spam hoặc quảng cáo' },
  { id: 'offensive', label: 'Xúc phạm, quấy rối' },
  { id: 'unsafe', label: 'Hướng dẫn nguy hiểm (điện lưới, pin Li-ion…)' },
  { id: 'off-topic', label: 'Lạc chủ đề' },
  { id: 'other', label: 'Lý do khác' },
]

export type CommunityReport = {
  id: string
  targetType: 'post' | 'comment' | 'project'
  targetId: string
  reason: ReportReason
  note: string
  createdAt: string
}

export type PostQuery = { search?: string; category?: CommunityCategoryId | null; tag?: string | null }

export type NewPostInput = { title: string; body: string; category: CommunityCategoryId; tags: string[]; files?: File[]; requestId?: string }
export type CommunityPageResult = { items: CommunityPost[]; nextCursor: string | null }
export type CommunityModerationReport = { id: string; postId: string | null; commentId: string | null; shareCode?: string | null; reason: ReportReason; note: string; createdAt: string }

export type CommunityRepository = {
  /** 'preview' = chưa đồng bộ máy chủ. */
  readonly mode: 'preview' | 'remote'
  listPosts(query?: PostQuery): Promise<CommunityPost[]>
  listPostsPage?(query: PostQuery, cursor?: string): Promise<CommunityPageResult>
  getPost(id: string): Promise<CommunityPost | null>
  listComments(postId: string): Promise<CommunityComment[]>
  createPost(input: NewPostInput, author: CommunityAuthor): Promise<CommunityPost>
  addComment(postId: string, body: string, author: CommunityAuthor): Promise<CommunityComment>
  report(input: Omit<CommunityReport, 'id' | 'createdAt'>): Promise<CommunityReport>
  listTags(): Promise<Array<{ tag: string; count: number }>>
  getAttachment?(attachment: CommunityAttachment): Promise<Blob | null>
  supportsAttachments?: false
  updatePost?(id: string, input: Omit<NewPostInput, 'files' | 'requestId'>): Promise<void>
  updateComment?(id: string, body: string): Promise<void>
  remove?(kind: 'post' | 'comment', id: string): Promise<void>
  moderationQueue?(): Promise<CommunityModerationReport[]>
  moderate?(id: string, action: 'hide' | 'dismiss'): Promise<void>
}

export const POST_LIMITS = { titleMin: 8, titleMax: 120, bodyMin: 20, bodyMax: 10000, tagsMax: 5, tagMax: 24, commentMin: 2, commentMax: 4000, reportNoteMax: 500 } as const

export function isCategoryId(value: unknown): value is CommunityCategoryId {
  return COMMUNITY_CATEGORIES.some(category => category.id === value)
}

export function categoryLabel(id: CommunityCategoryId): string {
  return COMMUNITY_CATEGORIES.find(category => category.id === id)?.label ?? id
}

/** Chuẩn hoá thẻ: chữ thường, bỏ dấu cách thừa, chỉ giữ chữ/số/-/+/#/. */
export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').replace(/[^\p{L}\p{N}+#.-]/gu, '').slice(0, POST_LIMITS.tagMax)
}

export function parseTags(raw: string): string[] {
  const tags: string[] = []
  for (const part of raw.split(/[,\n]/)) {
    const tag = normalizeTag(part)
    if (tag && !tags.includes(tag)) tags.push(tag)
  }
  return tags
}

export type PostValidation = { ok: boolean; errors: Partial<Record<'title' | 'body' | 'category' | 'tags', string>> }

export function validatePostInput(input: { title: string; body: string; category: string; tags: string[] }): PostValidation {
  const errors: PostValidation['errors'] = {}
  const title = input.title.trim()
  const body = input.body.trim()
  if (title.length < POST_LIMITS.titleMin) errors.title = `Tiêu đề cần ít nhất ${POST_LIMITS.titleMin} ký tự.`
  else if (title.length > POST_LIMITS.titleMax) errors.title = `Tiêu đề tối đa ${POST_LIMITS.titleMax} ký tự.`
  if (body.length < POST_LIMITS.bodyMin) errors.body = `Nội dung cần ít nhất ${POST_LIMITS.bodyMin} ký tự để người khác hiểu vấn đề.`
  else if (body.length > POST_LIMITS.bodyMax) errors.body = `Nội dung tối đa ${POST_LIMITS.bodyMax} ký tự.`
  if (!isCategoryId(input.category)) errors.category = 'Chọn một nhóm chủ đề.'
  if (input.tags.length > POST_LIMITS.tagsMax) errors.tags = `Tối đa ${POST_LIMITS.tagsMax} thẻ.`
  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateComment(body: string): string | null {
  const text = body.trim()
  if (text.length < POST_LIMITS.commentMin) return 'Bình luận quá ngắn.'
  if (text.length > POST_LIMITS.commentMax) return `Bình luận tối đa ${POST_LIMITS.commentMax} ký tự.`
  return null
}

/** Bỏ dấu tiếng Việt để tìm "dien tro" ra "điện trở". */
export function foldText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

export function filterPosts(posts: readonly CommunityPost[], query: PostQuery = {}): CommunityPost[] {
  const terms = foldText(query.search ?? '').split(/\s+/).filter(Boolean)
  return posts
    .filter(post => !query.category || post.category === query.category)
    .filter(post => !query.tag || post.tags.includes(query.tag))
    .filter(post => {
      if (!terms.length) return true
      const haystack = foldText(`${post.title} ${post.body} ${post.tags.join(' ')}`)
      return terms.every(term => haystack.includes(term))
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type CommunitySeed = { posts: CommunityPost[]; comments: CommunityComment[] }

type StoredState = { version: 1; posts: CommunityPost[]; comments: CommunityComment[]; reports: CommunityReport[] }

export const COMMUNITY_STORAGE_KEY = 'mach-mo-community-preview-v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function emptyState(): StoredState { return { version: 1, posts: [], comments: [], reports: [] } }

function readState(storage: StorageLike | null): StoredState {
  if (!storage) return emptyState()
  try {
    const raw = storage.getItem(COMMUNITY_STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StoredState>
    if (parsed?.version !== 1) return emptyState()
    return {
      version: 1,
      posts: Array.isArray(parsed.posts) ? parsed.posts.filter(isStoredPost) : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments.filter(isStoredComment) : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    }
  } catch {
    return emptyState()
  }
}

function isStoredPost(value: unknown): value is CommunityPost {
  const post = value as CommunityPost
  return Boolean(post && typeof post.id === 'string' && typeof post.title === 'string' && typeof post.body === 'string' && isCategoryId(post.category) && Array.isArray(post.tags) && post.author && typeof post.author.name === 'string')
}

function isStoredComment(value: unknown): value is CommunityComment {
  const comment = value as CommunityComment
  return Boolean(comment && typeof comment.id === 'string' && typeof comment.postId === 'string' && typeof comment.body === 'string' && comment.author && typeof comment.author.name === 'string')
}

function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

/** Bản xem trước: dữ liệu mẫu chỉ đọc + bài/bình luận/báo cáo lưu trên thiết bị. */
export function createPreviewRepository(seed: CommunitySeed, storage: StorageLike | null, now: () => Date = () => new Date(), attachmentStore: CommunityAttachmentStore = communityAttachmentStore): CommunityRepository {
  const write = (state: StoredState) => {
    if (!storage) throw new Error('Trình duyệt không cho lưu bài nháp trên thiết bị.')
    storage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(state))
  }
  const allComments = () => [...seed.comments, ...readState(storage).comments]
  const withCounts = (posts: CommunityPost[]) => {
    const comments = allComments()
    return posts.map(post => ({ ...post, commentCount: comments.filter(comment => comment.postId === post.id).length }))
  }
  const allPosts = () => withCounts([...readState(storage).posts, ...seed.posts])

  return {
    mode: 'preview',
    async listPosts(query) { return filterPosts(allPosts(), query) },
    async getPost(id) { return allPosts().find(post => post.id === id) ?? null },
    async listComments(postId) {
      return allComments().filter(comment => comment.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },
    async createPost(input, author) {
      const files = input.files ?? []
      const attachmentError = validateAttachments(files)
      if (attachmentError) throw new Error(attachmentError)
      const tags = input.tags.map(normalizeTag).filter(Boolean)
      const validation = validatePostInput({ ...input, tags })
      if (!validation.ok) throw new Error(Object.values(validation.errors)[0])
      const post: CommunityPost = { id: newId('local'), title: input.title.trim(), body: input.body.trim(), category: input.category, tags, author, createdAt: now().toISOString(), commentCount: 0, origin: 'local' }
      const attachments = await Promise.all(files.map(file => prepareAttachment(file)))
      const written: string[] = []
      try {
        for (let i = 0; i < attachments.length; i++) {
          await attachmentStore.put(attachments[i].id, files[i])
          written.push(attachments[i].id)
        }
        if (attachments.length) post.attachments = attachments
        const state = readState(storage)
        write({ ...state, posts: [post, ...state.posts] })
      } catch (cause) {
        await Promise.allSettled(written.map(id => attachmentStore.remove(id)))
        throw cause
      }
      return post
    },
    async addComment(postId, body, author) {
      const error = validateComment(body)
      if (error) throw new Error(error)
      if (!allPosts().some(post => post.id === postId)) throw new Error('Không tìm thấy bài viết.')
      const comment: CommunityComment = { id: newId('c'), postId, body: body.trim(), author, createdAt: now().toISOString(), origin: 'local' }
      const state = readState(storage)
      write({ ...state, comments: [...state.comments, comment] })
      return comment
    },
    async report(input) {
      const report: CommunityReport = { ...input, note: input.note.trim().slice(0, POST_LIMITS.reportNoteMax), id: newId('r'), createdAt: now().toISOString() }
      const state = readState(storage)
      write({ ...state, reports: [...state.reports, report] })
      return report
    },
    async listTags() {
      const counts = new Map<string, number>()
      for (const post of allPosts()) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
      return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    },
    getAttachment(attachment) { return attachmentStore.get(attachment.id) },
  }
}

export const GUEST_AUTHOR: CommunityAuthor = { id: 'guest', name: 'Khách (thiết bị này)', avatarUrl: null }

export function formatPostDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}
