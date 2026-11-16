import { useEffect, useId, useState } from 'react'
import { decodeRaster, downloadBlob, prepareAttachment, validateAttachments, type CommunityAttachment } from '../../lib/communityAttachments'
import { getCommunityRepository } from '../../lib/communityStore'

function AttachmentItem({ attachment, load, remove }: { attachment: CommunityAttachment; load: () => Promise<Blob | null>; remove?: () => void }) {
  const [url, setUrl] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    setBlob(null); setUrl(''); setError('')
    load().then(async value => {
      if (!value) throw new Error('Thiếu tệp trên thiết bị này (có thể kho tệp đã bị xoá).')
      if (value.size !== attachment.size) throw new Error('Dung lượng tệp không khớp.')
      const image = attachment.kind === 'image' && await decodeRaster(value)
      if (!active) return
      setBlob(value)
      if (image) { objectUrl = URL.createObjectURL(value); setUrl(objectUrl) }
      else if (attachment.kind === 'image') setError('Không giải mã được ảnh. Chỉ cho tải tệp, không hiển thị nội dung.')
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không đọc được tệp.') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
    // Identity is the storage key; callers remount after file edits or post navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, attachment.path])
  return <li className="community-attachment">
    {url && <img src={url} alt={`Xem trước ${attachment.name}`} />}
    <span>{attachment.name} · {(attachment.size / 1024).toFixed(1)} KiB</span>
    <button type="button" disabled={!blob} onClick={() => { if (blob) downloadBlob(blob, attachment.name) }}>Tải {attachment.name}</button>
    {remove && <button type="button" onClick={remove} aria-label={`Gỡ ${attachment.name}`}>Gỡ tệp</button>}
    {error && <span role="alert">{error}</span>}
  </li>
}
export function CommunityAttachments({ attachments, postId }: { attachments: CommunityAttachment[]; postId: string }) {
  return <ul className="community-attachments" aria-label="Tệp đính kèm">{attachments.map(item => <AttachmentItem key={`${postId}/${item.id}`} attachment={item} load={() => getCommunityRepository().getAttachment?.(item) ?? Promise.resolve(null)} />)}</ul>
}
export function CommunityAttachmentPicker({ files, onChange, disabled }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean }) {
  const id = useId()
  const [items, setItems] = useState<CommunityAttachment[]>([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    let active = true
    setChecking(true)
    Promise.all(files.map(file => prepareAttachment(file))).then(next => { if (active) { setItems(next); setError('') } }).catch(cause => { if (active) { setItems([]); setError(cause instanceof Error ? cause.message : 'Không đọc được tệp.') } }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [files])
  return <div className="community-field">
    <label htmlFor={id}>Ảnh / tệp đính kèm</label>
    <p id={`${id}-hint`}>Tối đa 5 tệp, 10 MiB/tệp, 25 MiB/bài. PNG/JPEG/WebP/GIF, PDF, văn bản, JSON và mã nguồn. Tệp chỉ ở bộ nhớ trước khi đăng; không thực thi mã hoặc hiển thị PDF/HTML.</p>
    <input id={id} type="file" multiple disabled={disabled || checking} aria-describedby={`${id}-hint`} onChange={event => {
      const next = [...files, ...Array.from(event.target.files ?? [])]
      event.target.value = ''
      const problem = validateAttachments(next)
      if (problem) { setError(problem); return }
      onChange(next)
    }} />
    {checking && <p role="status">Đang kiểm tra tệp…</p>}
    {error && <p role="alert" className="community-field-error">{error}</p>}
    <ul className="community-attachments">{items.map((item, i) => <AttachmentItem key={item.id} attachment={item} load={() => Promise.resolve(files[i])} remove={disabled ? undefined : () => onChange(files.filter((_, index) => index !== i))} />)}</ul>
    {files.length > 0 && !items.length && !checking && <button type="button" disabled={disabled} onClick={() => onChange([])}>Gỡ các tệp không hợp lệ</button>}
  </div>
}
