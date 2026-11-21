import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AnalyticsSummary } from '../lib/admin'
import { useAuth } from '../lib/auth'
import './SelfHostedAdminPage.css'

type Range = 7 | 30 | 90
type Metric = { label: string; count: number }
type Dashboard = {
  summary: AnalyticsSummary & { byLesson: Metric[]; byBoard: Metric[]; byDevice: Metric[]; bySource: Metric[]; funnel: { opened: number; ran: number; completed: number } }
  ai: {
    models: Array<{ model: string; provider: string; requests: number; insufficient: number; errors: number; cacheHits: number; p50Ms: number; p95Ms: number; inputTokens: number; outputTokens: number; estimatedUsd: number | null }>
    used: number; limit: number | null; nearLimit: boolean
  }
  community: { posts: number; comments: number; pendingReports: number; newAccounts: Array<{ provider: string; count: number }> }
  system: { api: string; database: string; ai: string; ramFreeBytes: number; ramTotalBytes: number; diskFreeBytes: number | null; latestBackup: string | null; commit: string }
}
const sections = ['summary', 'ai', 'community', 'system'] as const
const num = new Intl.NumberFormat('vi-VN')
const gib = (bytes: number | null) => bytes === null ? 'Chưa đo' : num.format(Math.round(bytes / 2 ** 27) / 8) + ' GiB'
const readiness = (value: string) => value === 'ready' ? 'Sẵn sàng' : value === 'unavailable' ? 'Chưa sẵn sàng' : value

function MetricList({ title, rows }: { title: string; rows: Metric[] }) {
  return <section><h2>{title}</h2>
    {rows.length ? <dl>{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{num.format(row.count)}</dd></div>)}</dl>
      : <p>Chưa có dữ liệu.</p>}
  </section>
}

function DailyChart({ data }: { data: AnalyticsSummary['daily'] }) {
  const peak = Math.max(1, ...data.map(item => item.events))
  const points = data.map((item, i) => (12 + i * 576 / Math.max(1, data.length - 1)) + ',' + (112 - item.events * 100 / peak)).join(' ')
  return <section className="s4-chart"><h2>Sự kiện theo ngày</h2>
    {data.length ? <>
      <svg viewBox="0 0 600 124" role="img" aria-label={'Biểu đồ số sự kiện theo ngày. Cao nhất ' + peak}>
        <path d="M12 112H588 M12 62H588 M12 12H588" className="s4-gridline" />
        <polyline points={points} className="s4-series" />
        {data.length === 1 && <circle cx="12" cy={112 - data[0].events * 100 / peak} r="4" className="s4-dot" />}
      </svg>
      <details><summary>Xem bảng số liệu theo ngày</summary>
        <table><thead><tr><th scope="col">Ngày</th><th scope="col">Phiên</th><th scope="col">Sự kiện</th></tr></thead>
          <tbody>{data.map(item => <tr key={item.day}><th scope="row">{item.day}</th><td>{item.sessions}</td><td>{item.events}</td></tr>)}</tbody>
        </table>
      </details>
    </> : <p>Chưa có dữ liệu trong khoảng này.</p>}
  </section>
}

function Reports() {
  const [days, setDays] = useState<Range>(7)
  const [current, setCurrent] = useState<{ days: Range; data?: Dashboard; error?: string }>()
  useEffect(() => {
    const controller = new AbortController()
    void Promise.all(sections.map(async section => {
      const response = await fetch('/api/admin/' + section + '?days=' + days, {
        credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
      })
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('report')
      return [section, await response.json()] as const
    })).then(entries => {
      if (!controller.signal.aborted) setCurrent({ days, data: Object.fromEntries(entries) as Dashboard })
    }).catch(() => {
      if (!controller.signal.aborted) setCurrent({ days, error: 'Không tải được báo cáo. Hãy kiểm tra phiên đăng nhập và kết nối.' })
    })
    return () => controller.abort()
  }, [days])
  const data = current?.days === days ? current.data : undefined
  const error = current?.days === days ? current.error : undefined
  return <>
    <div className="s4-period" role="group" aria-label="Khoảng thời gian">
      {([7, 30, 90] as const).map(period => <button key={period} type="button" aria-pressed={days === period} onClick={() => setDays(period)}>{period} ngày</button>)}
    </div>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Đang tải báo cáo…</p>}
    {data && <div className="s4-panels">
      <MetricList title="Tổng quan" rows={[{ label: 'Phiên trình duyệt', count: data.summary.sessionCount }, { label: 'Sự kiện', count: data.summary.eventCount }]} />
      <MetricList title="Phễu học theo phiên" rows={[{ label: 'Mở bài', count: data.summary.funnel.opened }, { label: 'Sau đó chạy mô phỏng', count: data.summary.funnel.ran }, { label: 'Sau đó tự đánh dấu hoàn thành', count: data.summary.funnel.completed }]} />
      <DailyChart data={data.summary.daily} />
      <MetricList title="Trang được mở nhiều" rows={data.summary.byPath.map(row => ({ label: row.path, count: row.events }))} />
      <MetricList title="Bài học" rows={data.summary.byLesson} />
      <MetricList title="Board" rows={data.summary.byBoard} />
      <MetricList title="Thiết bị" rows={data.summary.byDevice} />
      <MetricList title="Nguồn truy cập" rows={data.summary.bySource} />
      <MetricList title="Cộng đồng và tài khoản mới" rows={[
        { label: 'Bài viết', count: data.community.posts }, { label: 'Bình luận', count: data.community.comments },
        { label: 'Báo cáo đang chờ', count: data.community.pendingReports },
        ...data.community.newAccounts.map(item => ({ label: item.provider, count: item.count })),
      ]} />
      <section><h2>Mở Bot AI</h2>
        <p>{data.ai.limit === null ? 'Chưa đặt hạn mức.' : num.format(data.ai.used) + '/' + num.format(data.ai.limit) + ' lượt hôm nay'}</p>
        {data.ai.nearLimit && <p role="status">Đã dùng ít nhất 80% hạn mức hôm nay.</p>}
        {data.ai.models.map(model => <div key={model.provider + ':' + model.model}>
          <h3>{model.model}</h3>
          <p>{num.format(model.requests)} yêu cầu · {num.format(model.insufficient * 100 / Math.max(model.requests, 1))}% thiếu nguồn · {model.errors} lỗi</p>
          <p>p50 {model.p50Ms} ms · p95 {model.p95Ms} ms · {num.format(model.inputTokens + model.outputTokens)} token</p>
          <p>Chi phí ước tính {model.estimatedUsd === null ? 'chưa có đơn giá' : num.format(model.estimatedUsd) + ' USD'}</p>
        </div>)}
      </section>
      <section><h2>Mini PC</h2><dl>
        <div><dt>Commit</dt><dd><code>{data.system.commit.slice(0, 12)}</code></dd></div>
        <div><dt>API</dt><dd>{readiness(data.system.api)}</dd></div>
        <div><dt>Database</dt><dd>{readiness(data.system.database)}</dd></div>
        <div><dt>AI</dt><dd>{readiness(data.system.ai)}</dd></div>
        <div><dt>RAM còn trống</dt><dd>{gib(data.system.ramFreeBytes)} / {gib(data.system.ramTotalBytes)}</dd></div>
        <div><dt>Đĩa còn trống</dt><dd>{gib(data.system.diskFreeBytes)}</dd></div>
        <div><dt>Sao lưu gần nhất (UTC)</dt><dd>{data.system.latestBackup ?? 'Chưa có dữ liệu'}</dd></div>
      </dl></section>
    </div>}
  </>
}

export function SelfHostedAdminPage() {
  const auth = useAuth()
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])
  return <article className="s4-admin" aria-labelledby="s4-title">
    <h1 id="s4-title">Quản trị Mạch Mở</h1>
    {auth.status === 'loading' ? <p role="status">Đang kiểm tra quyền…</p>
      : auth.status === 'signed-in' ? auth.user.role === 'admin' ? <Reports /> : <p role="alert">Tài khoản này chưa có quyền quản trị.</p>
      : <p><Link to="/login?next=%2Fadmin">Đăng nhập để kiểm tra quyền quản trị</Link></p>}
  </article>
}
