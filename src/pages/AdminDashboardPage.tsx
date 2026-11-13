import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AdminAccess, AnalyticsSummary } from '../lib/admin'
import { getAnalyticsSummary, signOutAdmin } from '../lib/admin'

function formatLocalDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted
}

function startOfVietnamDay(value: string): string {
  return new Date(`${value}T00:00:00+07:00`).toISOString()
}

function eventNameLabel(eventName: string): string {
  const labels: Record<string, string> = {
    page_view: 'Xem trang',
    lesson_open: 'Mở bài học',
    component_select: 'Chọn linh kiện',
    code_copy: 'Sao chép code',
  }
  return labels[eventName] ?? 'Sự kiện khác'
}

export function AdminDashboardPage({ access }: { access: AdminAccess }) {
  const now = new Date()
  const [startDate, setStartDate] = useState(formatLocalDate(shiftDate(now, -6)))
  const [endDate, setEndDate] = useState(formatLocalDate(now))
  const [draftStartDate, setDraftStartDate] = useState(formatLocalDate(shiftDate(now, -6)))
  const [draftEndDate, setDraftEndDate] = useState(formatLocalDate(now))
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoutBusy, setLogoutBusy] = useState(false)
  const navigate = useNavigate()

  const loadSummary = useCallback(async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError('Ngày bắt đầu cần nằm trước hoặc bằng ngày kết thúc.')
      setSummary(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const endExclusive = formatLocalDate(shiftDate(new Date(`${endDate}T00:00:00+07:00`), 1))
      setSummary(await getAnalyticsSummary(startOfVietnamDay(startDate), startOfVietnamDay(endExclusive)))
    } catch {
      setError('Chưa tải được thống kê. Kiểm tra migration, quyền admin và kết nối Supabase rồi thử lại.')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [endDate, startDate])

  useEffect(() => { void loadSummary() }, [loadSummary])

  const totalPageViews = useMemo(() => summary?.byEvent.find((item) => item.eventName === 'page_view')?.events ?? 0, [summary])
  const lessonOpens = useMemo(() => summary?.byEvent.find((item) => item.eventName === 'lesson_open')?.events ?? 0, [summary])
  const componentSelections = useMemo(() => summary?.byEvent.find((item) => item.eventName === 'component_select')?.events ?? 0, [summary])
  const codeCopies = useMemo(() => summary?.byEvent.find((item) => item.eventName === 'code_copy')?.events ?? 0, [summary])
  const maxSessions = Math.max(1, ...(summary?.daily.map((item) => item.sessions) ?? [1]))

  async function logout() {
    setLogoutBusy(true)
    try {
      await signOutAdmin()
      navigate('/admin/login', { replace: true })
    } finally {
      setLogoutBusy(false)
    }
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-topbar"><Link to="/" className="admin-brand"><span>M</span><strong>Mạch Mở</strong><small>QUẢN TRỊ</small></Link><div className="admin-user"><span>{access.user.email}</span><button type="button" onClick={logout} disabled={logoutBusy}>{logoutBusy ? 'Đang thoát…' : 'Đăng xuất'}</button></div></header>
      <div className="admin-dashboard-content">
        <div className="admin-dashboard-heading"><div><p className="eyebrow">TỔNG QUAN SỬ DỤNG</p><h1>Người học đang khám phá gì?</h1><p>Thống kê các phiên truy cập và thao tác trên nội dung miễn phí.</p></div><button className="refresh-button" type="button" onClick={() => void loadSummary()} disabled={loading}>↻ Làm mới</button></div>

        <section className="date-filter" aria-label="Lọc khoảng ngày"><label>Từ ngày<input type="date" value={draftStartDate} max={draftEndDate} onChange={(event) => setDraftStartDate(event.target.value)} /></label><span aria-hidden="true">→</span><label>Đến ngày<input type="date" value={draftEndDate} min={draftStartDate} max={formatLocalDate(now)} onChange={(event) => setDraftEndDate(event.target.value)} /></label><button type="button" onClick={() => { setStartDate(draftStartDate); setEndDate(draftEndDate) }} disabled={loading || draftStartDate > draftEndDate}>Áp dụng</button><small>Giờ Việt Nam · tối đa 93 ngày</small></section>

        {error && <div className="admin-query-error" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => void loadSummary()}>Thử lại</button></div>}
        <section className="metric-grid" aria-label="Chỉ số chính">
          <article className="metric-card metric-primary"><span>PHIÊN TRUY CẬP ƯỚC TÍNH</span><strong>{loading ? '—' : (summary?.sessionCount ?? 0).toLocaleString('vi-VN')}</strong><small>Đếm phiên trong một tab, không phải số người đã xác minh</small><i aria-hidden="true">⌁</i></article>
          <article className="metric-card"><span>LƯỢT XEM TRANG</span><strong>{loading ? '—' : totalPageViews.toLocaleString('vi-VN')}</strong><small>Trang công khai được mở</small></article>
          <article className="metric-card"><span>MỞ BÀI HỌC</span><strong>{loading ? '—' : lessonOpens.toLocaleString('vi-VN')}</strong><small>Bài ESP32 LED được mở</small></article>
          <article className="metric-card"><span>CHỌN LINH KIỆN</span><strong>{loading ? '—' : componentSelections.toLocaleString('vi-VN')}</strong><small>Sơ đồ và danh sách linh kiện</small></article>
          <article className="metric-card"><span>SAO CHÉP CODE</span><strong>{loading ? '—' : codeCopies.toLocaleString('vi-VN')}</strong><small>Sao chép thành công từ bài học</small></article>
        </section>

        <div className="analytics-grid">
          <section className="analytics-panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">THEO NGÀY</p><h2>Phiên và sự kiện</h2></div><span>Phiên · sự kiện</span></div>
            {loading ? <div className="panel-empty">Đang tải số liệu…</div> : !summary?.daily.length ? <div className="panel-empty">Chưa có lượt truy cập trong khoảng ngày này.</div> : <div className="daily-chart" role="img" aria-label="Biểu đồ phiên truy cập theo ngày">{summary.daily.map((day) => <div className="chart-day" key={day.day} title={`${day.day}: ${day.sessions} phiên, ${day.events} sự kiện`}><div className="chart-bars"><i style={{ height: `${Math.max(4, day.sessions / maxSessions * 100)}%` }} /><b style={{ height: `${Math.max(4, day.events / Math.max(1, ...summary.daily.map((entry) => entry.events)) * 100)}%` }} /></div><span>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${day.day}T00:00:00+07:00`))}</span></div>)}</div>}
            <div className="chart-legend"><span><i /> Phiên truy cập</span><span><i /> Sự kiện</span></div>
          </section>
          <section className="analytics-panel event-panel"><div className="panel-heading"><div><p className="eyebrow">HÀNH VI</p><h2>Người học đã làm gì?</h2></div></div>
            {loading ? <div className="panel-empty">Đang tải số liệu…</div> : !summary?.byEvent.length ? <div className="panel-empty">Chưa có sự kiện để hiển thị.</div> : <div className="event-list">{summary.byEvent.map((item) => <div className="event-row" key={item.eventName}><span>{eventNameLabel(item.eventName)}</span><strong>{item.events.toLocaleString('vi-VN')}</strong><i style={{ width: `${Math.max(5, item.events / Math.max(1, summary.eventCount) * 100)}%` }} /></div>)}</div>}
          </section>
        </div>

        <section className="analytics-panel route-panel"><div className="panel-heading"><div><p className="eyebrow">NỘI DUNG ĐƯỢC MỞ</p><h2>Lượt tương tác theo trang</h2></div><span>{summary?.byPath.length ?? 0} đường dẫn</span></div>
          {loading ? <div className="panel-empty">Đang tải số liệu…</div> : !summary?.byPath.length ? <div className="panel-empty">Chưa có dữ liệu. Khi Supabase đã cấu hình, các lượt học tiếp theo sẽ xuất hiện ở đây.</div> : <div className="route-list">{summary.byPath.map((item) => <div className="route-row" key={item.path}><span>{item.path}</span><i style={{ width: `${Math.max(4, item.events / Math.max(1, ...summary.byPath.map((entry) => entry.events)) * 100)}%` }} /><strong>{item.events.toLocaleString('vi-VN')}</strong></div>)}</div>}
        </section>
        <p className="analytics-footnote">Số liệu là ước tính theo phiên trong tab. Hệ thống không xác minh danh tính người truy cập; không dùng các chỉ số này để kết luận số người duy nhất.</p>
      </div>
    </main>
  )
}
