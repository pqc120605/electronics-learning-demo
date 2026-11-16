import { useId, useState, type FormEvent } from 'react'
import { REPORT_REASONS, type ReportReason } from '../../lib/community'
import { getCommunityRepository } from '../../lib/communityStore'

/** Báo cáo vi phạm. Bản xem trước chỉ lưu báo cáo trên thiết bị; nói rõ điều đó với người dùng. */
export function ReportButton({ targetType, targetId, targetLabel }: { targetType: 'post' | 'comment'; targetId: string; targetLabel: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await getCommunityRepository().report({ targetType, targetId, reason, note })
      setStatus('sent')
      setOpen(false)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') return <p className="community-report-done" role="status">{getCommunityRepository().mode === 'remote' ? 'Máy chủ đã ghi nhận báo cáo. Chưa có cam kết thời gian kiểm duyệt.' : 'Đã ghi nhận báo cáo trên thiết bị này. Chưa gửi tới người kiểm duyệt.'}</p>

  return (
    <div className="community-report">
      <button type="button" className="community-link-button" aria-expanded={open} aria-controls={`${id}-form`} onClick={() => setOpen(value => !value)}>Báo cáo</button>
      {open && (
        <form id={`${id}-form`} className="community-report-form" onSubmit={submit} aria-label={`Báo cáo ${targetLabel}`}>
          <fieldset>
            <legend>Lý do báo cáo {targetLabel}</legend>
            {REPORT_REASONS.map(item => (
              <label key={item.id}><input type="radio" name={`${id}-reason`} value={item.id} checked={reason === item.id} onChange={() => setReason(item.id)} />{item.label}</label>
            ))}
          </fieldset>
          <label htmlFor={`${id}-note`}>Ghi chú (không bắt buộc)</label>
          <textarea id={`${id}-note`} rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="community-form-actions">
            <button type="submit" className="button-primary">Gửi báo cáo</button>
            <button type="button" className="community-link-button" onClick={() => setOpen(false)}>Huỷ</button>
          </div>
          {status === 'error' && <p className="community-field-error" role="alert">Không gửi được báo cáo. Với nguồn online, hãy kiểm tra đăng nhập và kết nối rồi thử lại.</p>}
        </form>
      )}
    </div>
  )
}
