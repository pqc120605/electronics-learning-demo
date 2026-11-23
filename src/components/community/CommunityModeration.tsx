import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REPORT_REASONS, type CommunityModerationReport } from '../../lib/community'
import { getCommunityRepository } from '../../lib/communityStore'

export function CommunityModeration({ base }: { base: string }) {
  const repo = getCommunityRepository()
  const [reports, setReports] = useState<CommunityModerationReport[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!repo.moderationQueue || !repo.moderate) return null

  async function refresh() {
    setBusy(true)
    setError('')
    try { setReports(await repo.moderationQueue!()) }
    catch { setError('Không tải được hàng chờ kiểm duyệt.') }
    finally { setBusy(false) }
  }

  async function review(id: string, action: 'hide' | 'dismiss') {
    setBusy(true)
    setError('')
    try {
      await repo.moderate?.(id, action)
      setReports(current => current?.filter(report => report.id !== id) ?? null)
    } catch {
      setError('Không xử lý được báo cáo. Vui lòng tải lại hàng chờ.')
    } finally {
      setBusy(false)
    }
  }

  return <details className="community-groups">
    <summary>Hàng chờ kiểm duyệt</summary>
    <button type="button" onClick={refresh} disabled={busy}>{busy ? 'Đang xử lý…' : 'Tải báo cáo'}</button>
    {reports?.length === 0 && <p role="status">Không có báo cáo đang chờ.</p>}
    <ul>{reports?.map(report => <li key={report.id}>
      <p>{REPORT_REASONS.find(reason => reason.id === report.reason)?.label} · {report.shareCode ? 'Project' : report.commentId ? 'Bình luận' : 'Bài viết'}</p>
      {report.postId && <Link to={base + '/' + encodeURIComponent(report.postId)}>Mở bài</Link>}
      {report.shareCode && <Link to={'/s/' + encodeURIComponent(report.shareCode)}>Mở project</Link>}
      {report.note && <p>{report.note}</p>}
      <div className="community-form-actions">
        <button type="button" disabled={busy} onClick={() => review(report.id, 'hide')}>Ẩn nội dung</button>
        <button type="button" disabled={busy} onClick={() => review(report.id, 'dismiss')}>Bỏ qua báo cáo</button>
      </div>
    </li>)}</ul>
    {error && <p role="alert">{error}</p>}
  </details>
}
