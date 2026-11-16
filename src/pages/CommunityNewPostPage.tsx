import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CommunityRules, LoginRequired, PreviewBanner, useWriteAccess } from '../components/community/CommunityChrome'
import { MarkdownEditor } from '../components/community/MarkdownEditor'
import { CommunityAttachmentPicker } from '../components/community/CommunityAttachments'
import { clearCommunityDraft, readCommunityDraft, writeCommunityDraft } from '../lib/communityDrafts'
import { COMMUNITY_CATEGORIES, POST_LIMITS, isCategoryId, parseTags, validatePostInput, type CommunityCategoryId, type PostValidation } from '../lib/community'
import { communityBase, getCommunityRepository } from '../lib/communityStore'
import './Community.css'

const BODY_TEMPLATE = 'Mô tả vấn đề: \n\nBoard / linh kiện: \n\nĐã thử: \n'

export function CommunityNewPostPage() {
  const { pathname } = useLocation()
  const base = communityBase(pathname)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const access = useWriteAccess()
  const ids = { title: useId(), category: useId(), tags: useId() }
  const initialCategory = params.get('cat')
  const [savedDraft] = useState(readCommunityDraft)
  const [title, setTitle] = useState(savedDraft?.title ?? '')
  const [category, setCategory] = useState<CommunityCategoryId | ''>(savedDraft?.category ?? (isCategoryId(initialCategory) ? initialCategory : ''))
  const [tagText, setTagText] = useState(savedDraft?.tagText ?? '')
  const [body, setBody] = useState(savedDraft?.body ?? BODY_TEMPLATE)
  const [files, setFiles] = useState<File[]>([])
  const [draftNotice, setDraftNotice] = useState('')
  const requestId = useRef<string | undefined>(undefined)
  useEffect(() => {
    requestId.current = undefined
    setDraftNotice(writeCommunityDraft({ title, body, category, tagText }) ?? '')
  }, [title, body, category, tagText, files])
  const [errors, setErrors] = useState<PostValidation['errors']>({})
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!access?.canWrite) return
    const tags = parseTags(tagText)
    const validation = validatePostInput({ title, body, category, tags })
    if (body.trim() === BODY_TEMPLATE.trim()) {
      validation.ok = false
      validation.errors.body = 'Hãy điền mô tả vấn đề vào mẫu trước khi đăng.'
    }
    setErrors(validation.errors)
    if (!validation.ok || !category) {
      const firstField = (['title', 'category', 'tags'] as const).find(field => validation.errors[field])
      if (firstField) document.getElementById(ids[firstField])?.focus()
      return
    }
    setBusy(true)
    try {
      requestId.current ??= crypto.randomUUID()
      const post = await getCommunityRepository().createPost({ title, body, category, tags, files, requestId: requestId.current }, access.author)
      clearCommunityDraft()
      navigate(`${base}/${encodeURIComponent(post.id)}`)
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Không lưu được bài viết.')
      setBusy(false)
    }
  }

  return (
    <div className="community-page community-compose">
      <nav className="community-breadcrumb" aria-label="Vị trí"><Link to={base}>Cộng đồng</Link><span aria-hidden="true">/</span><span>Bài mới</span></nav>
      <h1>Viết bài mới</h1>
      <PreviewBanner />
      <div className="community-compose-layout">
        {access === null ? <p role="status">Đang kiểm tra đăng nhập…</p> : !access.canWrite ? <LoginRequired access={access} /> : (
          <form className="community-form" onSubmit={submit} noValidate>
            <fieldset disabled={busy} className="community-compose-fields">
            <p className="community-form-note">{access.note}</p>
            <p className="community-form-note">Nháp chữ tự lưu trên thiết bị. Tệp đang chọn chỉ ở bộ nhớ; cần chọn lại khi tải lại trang.</p>
            {draftNotice && <p role="alert">{draftNotice}</p>}
            <div className="community-field">
              <label htmlFor={ids.title}>Tiêu đề</label>
              <input id={ids.title} value={title} maxLength={POST_LIMITS.titleMax} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${ids.title}-error` : undefined} placeholder="vd: ESP32 không nhận cảm biến DHT22" onChange={(event) => setTitle(event.target.value)} />
              {errors.title && <p className="community-field-error" id={`${ids.title}-error`}>{errors.title}</p>}
            </div>
            <div className="community-field-row">
              <div className="community-field">
                <label htmlFor={ids.category}>Nhóm chủ đề</label>
                <select id={ids.category} value={category} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? `${ids.category}-error` : undefined} onChange={(event) => setCategory(isCategoryId(event.target.value) ? event.target.value : '')}>
                  <option value="">Chọn nhóm…</option>
                  {COMMUNITY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {errors.category && <p className="community-field-error" id={`${ids.category}-error`}>{errors.category}</p>}
              </div>
              <div className="community-field">
                <label htmlFor={ids.tags}>Thẻ (cách nhau bằng dấu phẩy, tối đa {POST_LIMITS.tagsMax})</label>
                <input id={ids.tags} value={tagText} aria-invalid={Boolean(errors.tags)} aria-describedby={errors.tags ? `${ids.tags}-error` : undefined} placeholder="esp32, i2c, cảm-biến" onChange={(event) => setTagText(event.target.value)} />
                {errors.tags && <p className="community-field-error" id={`${ids.tags}-error`}>{errors.tags}</p>}
              </div>
            </div>
            <MarkdownEditor label="Nội dung" value={body} onChange={setBody} rows={10} maxLength={POST_LIMITS.bodyMax} error={errors.body} hint="Hỗ trợ **đậm**, *nghiêng*, `code`, khối ``` code ```, danh sách - và liên kết https." />
            <CommunityAttachmentPicker files={files} onChange={setFiles} disabled={busy} />
            <div className="community-form-actions">
              <button type="submit" className="button-primary" disabled={busy}>{busy ? 'Đang lưu…' : getCommunityRepository().mode === 'remote' ? 'Đăng bài online' : 'Đăng bài (lưu trên thiết bị)'}</button>
              <Link to={base}>Huỷ</Link>
            </div>
            {submitError && <p className="community-field-error" role="alert">{submitError}</p>}
            </fieldset>
          </form>
        )}
        <CommunityRules />
      </div>
    </div>
  )
}
