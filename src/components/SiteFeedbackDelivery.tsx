import { useRef, useState } from 'react'
import { apiRequest } from '../lib/api'
import { selfHostedCsrf } from '../lib/selfHostedAuth'
import type { FeedbackDraft } from '../lib/feedbackDraft'

export function SiteFeedbackDelivery({ draft, valid }: { draft: FeedbackDraft; valid: boolean }) {
  const [rating, setRating] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ snapshot: string; status: 'sent' | 'error'; message: string }>()
  const pending = useRef<{ snapshot: string; id: string } | null>(null)
  const inProgress = useRef(false)
  const { kind, title, details, page, steps, expected, actual } = draft
  const data = { kind, title, details, page, steps, expected, actual, rating }
  const snapshot = JSON.stringify(data)
  const visibleResult = result?.snapshot === snapshot ? result : undefined

  async function send() {
    if (!valid || inProgress.current || visibleResult?.status === 'sent') return
    inProgress.current = true
    setBusy(true)
    setResult(undefined)
    try {
      if (pending.current?.snapshot !== snapshot) pending.current = { snapshot, id: crypto.randomUUID() }
      await apiRequest('/api/feedback', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json', ...selfHostedCsrf },
        body: JSON.stringify({ ...data, id: pending.current.id }),
      })
      setResult({ snapshot, status: 'sent', message: 'Đã gửi góp ý cho quản trị viên Mạch Mở.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không kết nối được với máy chủ.'
      setResult({ snapshot, status: 'error', message: 'Chưa gửi được. ' + message + ' Bản nháp vẫn còn để bạn thử lại hoặc tải file.' })
    } finally {
      inProgress.current = false
      setBusy(false)
    }
  }

  return <div className="feedback-delivery">
    <label htmlFor="feedback-rating">Đánh giá trải nghiệm (không bắt buộc)</label>
    <select id="feedback-rating" value={rating ?? ''} disabled={busy} onChange={event => setRating(
      event.target.value ? Number(event.target.value) : null,
    )}>
      <option value="">Chọn số sao</option>
      {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} sao</option>)}
    </select>
    <p>Quản trị viên nhận nội dung bạn chọn gửi. Vui lòng bỏ thông tin riêng tư khỏi góp ý trước khi gửi.</p>
    <button type="button" className="feedback-primary" disabled={!valid || busy || visibleResult?.status === 'sent'} onClick={send}>
      {busy ? 'Đang gửi…' : 'Gửi góp ý'}
    </button>
    {visibleResult && <p role={visibleResult.status === 'error' ? 'alert' : 'status'}>{visibleResult.message}</p>}
  </div>
}
