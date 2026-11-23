import { useState, type FormEvent } from 'react'
import { POST_LIMITS, validateComment, validatePostInput, type CommunityComment, type CommunityPost } from '../../lib/community'
import { getCommunityRepository } from '../../lib/communityStore'
import { MarkdownEditor } from './MarkdownEditor'

export function CommunityOwnerActions({ item, onChange }: {
  item: CommunityPost | CommunityComment
  onChange: (removed: boolean) => void
}) {
  const repository = getCommunityRepository()
  const post = 'title' in item ? item : null
  const canUpdate = post ? repository.updatePost : repository.updateComment
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  if (!item.canEdit || !canUpdate || !repository.remove) return null
  const kind = post ? 'post' : 'comment'
  const name = post ? 'bài viết' : 'bình luận'

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = post && { title, body, category: post.category, tags: post.tags }
    const problem = input ? Object.values(validatePostInput(input).errors)[0] : validateComment(body)
    if (problem) { setError(problem); return }
    setPending(true)
    setError('')
    try {
      if (input) await repository.updatePost?.(item.id, input)
      else await repository.updateComment?.(item.id, body)
      setEditing(false)
      onChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được thay đổi.')
    } finally {
      setPending(false)
    }
  }
  return <div className="community-form-actions">
    {editing ? <form className="community-form" onSubmit={save}>
      {post && <label>Tiêu đề<input value={title} onChange={event => setTitle(event.target.value)} maxLength={POST_LIMITS.titleMax} /></label>}
      <MarkdownEditor label={'Sửa nội dung ' + name} value={body} onChange={setBody} rows={5} maxLength={post ? POST_LIMITS.bodyMax : POST_LIMITS.commentMax} />
      <button type="submit" disabled={pending}>Lưu thay đổi</button>
      <button type="button" disabled={pending} onClick={() => { setEditing(false); setError('') }}>Hủy</button>
    </form> : <>
      <button type="button" disabled={pending} onClick={() => { setTitle(post?.title ?? ''); setBody(item.body); setError(''); setEditing(true) }}>Sửa {name}</button>
      <button type="button" disabled={pending} onClick={async () => {
        if (!window.confirm('Xóa ' + name + ' này?')) return
        setPending(true)
        setError('')
        try { await repository.remove?.(kind, item.id); onChange(true) }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Không xóa được nội dung.') }
        finally { setPending(false) }
      }}>Xóa {name}</button>
    </>}
    {error && <p role="alert">{error}</p>}
  </div>
}
