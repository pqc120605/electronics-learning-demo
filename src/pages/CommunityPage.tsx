import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { CommunityRules, PreviewBanner } from '../components/community/CommunityChrome'
import { UserAvatar } from '../components/UserAvatar'
import { CommunityModeration } from '../components/community/CommunityModeration'
import { useAuth } from '../lib/auth'
import { COMMUNITY_CATEGORIES, categoryLabel, formatPostDate, isCategoryId, normalizeTag, type CommunityPost } from '../lib/community'
import { communityBase, getCommunityRepository } from '../lib/communityStore'
import { markdownExcerpt } from '../lib/simpleMarkdown'
import './Community.css'

export function CommunityPage() {
  const { pathname } = useLocation()
  const base = communityBase(pathname)
  const auth = useAuth()
  const [params, setParams] = useSearchParams()
  const searchId = useId()
  const rawCategory = params.get('cat')
  const category = isCategoryId(rawCategory) ? rawCategory : null
  const tag = params.get('tag') ? normalizeTag(params.get('tag') ?? '') : null
  const search = params.get('q') ?? ''
  const cursor = params.get('after') ?? undefined
  const [draft, setDraft] = useState(search)
  const [posts, setPosts] = useState<CommunityPost[] | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([])

  useEffect(() => { setDraft(search) }, [search])

  useEffect(() => {
    let active = true
    const repo = getCommunityRepository()
    setPosts(null)
    setNextCursor(null)
    setError('')
    const query = { search, category, tag }
    const page = repo.listPostsPage ? repo.listPostsPage(query, cursor)
      : repo.listPosts(query).then(items => ({ items, nextCursor: null }))
    Promise.all([page, repo.listTags()]).then(([result, tagList]) => {
      if (!active) return
      setPosts(result.items)
      setNextCursor(result.nextCursor)
      setTags(tagList.slice(0, 12))
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Không tải được cộng đồng.'); setPosts([]) } })
    return () => { active = false }
  }, [search, category, tag, cursor])

  const update = (changes: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(params)
    if (!Object.hasOwn(changes, 'after')) nextParams.delete('after')
    for (const [key, value] of Object.entries(changes)) {
      if (value) nextParams.set(key, value)
      else nextParams.delete(key)
    }
    setParams(nextParams, { replace: true })
  }

  const hasFilter = Boolean(search || category || tag)

  return (
    <div className="community-page">
      <header className="community-head">
        <div>
          <p className="eyebrow">MẠCH MỞ · CỘNG ĐỒNG</p>
          <h1>Cộng đồng điện tử, nhúng &amp; IoT</h1>
          <p className="community-lead">Hỏi lỗi mạch, chia sẻ code ESP32/Arduino, khoe dự án và giúp người mới.</p>
        </div>
        <Link className="button-primary community-new-button" to={`${base}/new${category ? `?cat=${category}` : ''}`}>+ Viết bài mới</Link>
      </header>
      <PreviewBanner />
      {error && <p role="alert" className="community-field-error">{error} Chưa chuyển sang bài cục bộ. Bạn có thể chọn “Xem bài trên thiết bị”.</p>}

      <div className="community-layout">
        <aside className="community-aside" aria-label="Lọc theo nhóm và quy tắc">
          <nav aria-labelledby="community-groups-title" className="community-groups">
            <h2 id="community-groups-title">Nhóm chủ đề</h2>
            <ul>
              <li><button type="button" aria-pressed={!category} onClick={() => update({ cat: null })}>Tất cả nhóm</button></li>
              {COMMUNITY_CATEGORIES.map(item => (
                <li key={item.id}><button type="button" aria-pressed={category === item.id} title={item.summary} onClick={() => update({ cat: item.id })}>{item.label}</button></li>
              ))}
            </ul>
          </nav>
          <CommunityRules compact />
          {auth.status === 'signed-in' && auth.user.role === 'admin' && <CommunityModeration base={base} />}
        </aside>

        <section className="community-main" aria-labelledby="community-list-title">
          <h2 id="community-list-title" className="sr-only">Danh sách bài thảo luận</h2>
          <form className="community-search" role="search" onSubmit={(event) => { event.preventDefault(); update({ q: draft.trim() || null }) }}>
            <label htmlFor={searchId}>Tìm bài</label>
            <input id={searchId} type="search" value={draft} maxLength={160} placeholder="vd: esp32 mqtt, điện trở led" onChange={(event) => setDraft(event.target.value)} />
            <button type="submit">Tìm</button>
          </form>
          {tags.length > 0 && (
            <div className="community-tags" role="group" aria-label="Lọc theo thẻ">
              {tags.map(item => (
                <button key={item.tag} type="button" className="community-tag" aria-pressed={tag === item.tag} onClick={() => update({ tag: tag === item.tag ? null : item.tag })}>#{item.tag} <span aria-hidden="true">{item.count}</span></button>
              ))}
            </div>
          )}
          <p className="community-result-count" role="status">
            {posts === null ? 'Đang tải bài…' : `${posts.length} bài${category ? ` trong “${categoryLabel(category)}”` : ''}${tag ? ` có thẻ #${tag}` : ''}${search ? ` khớp “${search}”` : ''}`}
            {hasFilter && <button type="button" className="community-clear" onClick={() => { setDraft(''); update({ q: null, cat: null, tag: null }) }}>Bỏ lọc</button>}
          </p>
          {posts && posts.length === 0 && <p className="community-empty">Chưa có bài phù hợp. Thử từ khoá khác hoặc <Link to={`${base}/new`}>viết câu hỏi đầu tiên</Link>.</p>}
          <ul className="community-post-list">
            {posts?.map(post => (
              <li key={post.id}>
                <article className="community-post-card" aria-labelledby={`post-${post.id}`}>
                  <p className="community-post-meta"><span className="community-chip">{categoryLabel(post.category)}</span>{post.origin === 'local' && <span className="community-chip community-chip-local">Nháp trên thiết bị</span>}</p>
                  <h3 id={`post-${post.id}`}><Link to={`${base}/${encodeURIComponent(post.id)}`}>{post.title}</Link></h3>
                  <p className="community-excerpt">{markdownExcerpt(post.body)}</p>
                  <p className="community-post-foot">
                    <span className="community-author"><UserAvatar name={post.author.name} url={post.author.avatarUrl} size={22} />{post.author.name}</span>
                    <span>{formatPostDate(post.createdAt)}</span>
                    <span>{post.commentCount} bình luận</span>
                    {post.tags.length > 0 && <span className="community-post-tags">{post.tags.map(item => `#${item}`).join(' ')}</span>}
                  </p>
                </article>
              </li>
            ))}
          </ul>
          {(cursor || nextCursor) && <nav className="community-form-actions" aria-label="Trang kết quả">
            {cursor && <button type="button" onClick={() => update({ after: null })}>Về trang đầu</button>}
            {nextCursor && <button type="button" onClick={() => update({ after: nextCursor })}>Trang kế tiếp</button>}
          </nav>}
        </section>
      </div>
    </div>
  )
}
