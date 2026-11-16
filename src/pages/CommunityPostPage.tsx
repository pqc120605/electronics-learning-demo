import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { LoginRequired, PreviewBanner, useWriteAccess } from '../components/community/CommunityChrome'
import { MarkdownEditor } from '../components/community/MarkdownEditor'
import { MarkdownView } from '../components/community/MarkdownView'
import { CommunityAttachments } from '../components/community/CommunityAttachments'
import { ReportButton } from '../components/community/ReportButton'
import { UserAvatar } from '../components/UserAvatar'
import { POST_LIMITS, categoryLabel, formatPostDate, validateComment, type CommunityComment, type CommunityPost } from '../lib/community'
import { communityBase, getCommunityRepository } from '../lib/communityStore'
import './Community.css'

export function CommunityPostPage() {
  const { postId = '' } = useParams()
  const { pathname } = useLocation()
  const base = communityBase(pathname)
  const access = useWriteAccess()
  const [post, setPost] = useState<CommunityPost | null | undefined>(undefined)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const repo = getCommunityRepository()
    setPost(undefined)
    setComments([])
    setError('')
    Promise.all([repo.getPost(postId), repo.listComments(postId)]).then(([found, list]) => {
      if (!active) return
      setPost(found)
      setComments(list)
      if (found) document.title = `${found.title} — Cộng đồng Mạch Mở`
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Không tải được bài.'); setPost(null) } })
    return () => { active = false }
  }, [postId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!access?.canWrite) return
    const problem = validateComment(draft)
    if (problem) { setError(problem); return }
    try {
      const comment = await getCommunityRepository().addComment(postId, draft, access.author)
      setComments(list => [...list, comment])
      setDraft('')
      setError('')
      setNotice(getCommunityRepository().mode === 'remote' ? 'Đã gửi bình luận online.' : 'Đã lưu bình luận trên thiết bị này.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được bình luận.')
    }
  }

  if (post === undefined) return <div className="community-page"><h1>Đang tải bài viết…</h1></div>
  if (post === null) {
    return (
      <div className="community-page">
        <h1>Không tìm thấy bài viết</h1>
        {error && <p role="alert">{error}</p>}
        <p>Bài có thể là bản nháp trên thiết bị khác hoặc đường dẫn đã sai.</p>
        <Link to={base}>← Về danh sách cộng đồng</Link>
      </div>
    )
  }

  return (
    <div className="community-page community-detail">
      <nav className="community-breadcrumb" aria-label="Vị trí"><Link to={base}>Cộng đồng</Link><span aria-hidden="true">/</span><Link to={`${base}?cat=${post.category}`}>{categoryLabel(post.category)}</Link></nav>
      <PreviewBanner />
      <article className="community-article" aria-labelledby="post-title">
        <header>
          <p className="community-post-meta"><span className="community-chip">{categoryLabel(post.category)}</span>{post.origin === 'local' && <span className="community-chip community-chip-local">Nháp trên thiết bị</span>}</p>
          <h1 id="post-title">{post.title}</h1>
          <p className="community-post-foot">
            <span className="community-author"><UserAvatar name={post.author.name} url={post.author.avatarUrl} size={24} />{post.author.name}</span>
            <span>{formatPostDate(post.createdAt)}</span>
          </p>
        </header>
        <MarkdownView source={post.body} className="community-article-body" />
        <CommunityAttachments attachments={post.attachments ?? []} postId={post.id} />
        {post.tags.length > 0 && (
          <ul className="community-tags" aria-label="Thẻ">
            {post.tags.map(tag => <li key={tag}><Link className="community-tag" to={`${base}?tag=${encodeURIComponent(tag)}`}>#{tag}</Link></li>)}
          </ul>
        )}
        <ReportButton targetType="post" targetId={post.id} targetLabel="bài viết này" />
      </article>

      <section className="community-comments" aria-labelledby="comments-title">
        <h2 id="comments-title">{comments.length} bình luận</h2>
        <ol className="community-comment-list">
          {comments.map(comment => (
            <li key={comment.id} className="community-comment">
              <p className="community-post-foot">
                <span className="community-author"><UserAvatar name={comment.author.name} url={comment.author.avatarUrl} size={22} />{comment.author.name}</span>
                <span>{formatPostDate(comment.createdAt)}</span>
                {comment.origin === 'local' && <span className="community-chip community-chip-local">Trên thiết bị</span>}
              </p>
              <MarkdownView source={comment.body} />
              <ReportButton targetType="comment" targetId={comment.id} targetLabel={`bình luận của ${comment.author.name}`} />
            </li>
          ))}
        </ol>

        {access === null ? <p role="status">Đang kiểm tra đăng nhập…</p> : access.canWrite ? (
          <form className="community-comment-form" onSubmit={submit} noValidate>
            <MarkdownEditor label="Viết bình luận" value={draft} onChange={(value) => { setDraft(value); setNotice('') }} rows={4} maxLength={POST_LIMITS.commentMax} error={error} hint={access.note} />
            <div className="community-form-actions"><button type="submit" className="button-primary">Gửi bình luận</button></div>
            {notice && <p className="community-report-done" role="status">{notice}</p>}
          </form>
        ) : <LoginRequired access={access} />}
      </section>
    </div>
  )
}
