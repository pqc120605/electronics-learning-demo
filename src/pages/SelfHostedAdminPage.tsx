import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminReport, getDashboardSiteReport, getDashboardSites, type AnalyticsSummary, type DashboardSite, type DashboardSnapshot } from '../lib/admin'
import { useAuth } from '../lib/auth'
import { OAUTH_PROVIDERS } from '../lib/authUser'
import { startSelfHostedOAuth } from '../lib/selfHostedAuth'
import { siteFeedbackEnabled } from '../lib/backendMode'
import { feedbackKinds, type FeedbackKind } from '../lib/feedbackDraft'
import './SelfHostedAdminPage.css'

type Range = 7 | 30 | 90
type Metric = { label: string; count: number }
type FeedbackItem = {
  id: string; kind: FeedbackKind; title: string; details: string; page: string; createdAt: string
  rating: number | null; steps: string; expected: string; actual: string
}
type Dashboard = {
  summary: AnalyticsSummary & { byLesson: Metric[]; byBoard: Metric[]; byDevice: Metric[]; bySource: Metric[]; funnel: { opened: number; ran: number; completed: number } }
  ai: {
    models: Array<{ model: string; provider: string; requests: number; insufficient: number; errors: number; cacheHits: number; p50Ms: number; p95Ms: number; inputTokens: number; outputTokens: number; estimatedUsd: number | null; helpful: number; unhelpful: number }>
    used: number; limit: number | null; nearLimit: boolean
  }
  community: { posts: number; comments: number; pendingReports: number; totalAccounts: number; newAccounts: Array<{ provider: string; count: number }> }
  system: { api: string; database: string; ai: string; ramFreeBytes: number; ramTotalBytes: number; diskFreeBytes: number | null; latestBackup: string | null; commit: string }
  feedback: { total: number; rated: number; average: number | null; items: FeedbackItem[] }
}
const sections: Array<keyof Dashboard> = ['summary', 'ai', 'community', 'system', ...(siteFeedbackEnabled ? ['feedback' as const] : [])]
const reportLabels: Record<keyof Dashboard, string> = {
  summary: 'Hoạt động', ai: 'Mở Bot', community: 'Cộng đồng', system: 'Hệ thống', feedback: 'Góp ý',
}
const num = new Intl.NumberFormat('vi-VN')
const score = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' })
const webStatus: Record<DashboardSnapshot['status'], string> = {
  healthy: 'Hoạt động', degraded: 'Có gián đoạn', down: 'Ngừng hoạt động', unknown: 'Chưa rõ trạng thái',
}
const count = (value: number | null | undefined) => value == null ? '—' : num.format(value)
const gib = (bytes: number | null) => bytes === null ? 'Chưa đo' : num.format(Math.round(bytes / 2 ** 27) / 8) + ' GiB'
const readiness = (value: string) => value === 'ready' ? 'Sẵn sàng' : value === 'unavailable' ? 'Chưa sẵn sàng' : value

function MetricList({ title, rows }: { title: string; rows: Metric[] }) {
  return <section><h2>{title}</h2>
    {rows.length ? <dl>{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{num.format(row.count)}</dd></div>)}</dl>
      : <p>Chưa có dữ liệu.</p>}
  </section>
}

function DailyChart({ data, total }: { data: AnalyticsSummary['daily']; total: number }) {
  const peak = Math.max(1, ...data.map(item => item.events))
  const first = data.length ? Date.parse(data[0].day) : 0
  const last = data.length ? Date.parse(data[data.length - 1].day) : 0
  const byDate = new Map(data.map(item => [Date.parse(item.day), item.events]))
  const points: string[] = []
  for (let date = first; data.length && date <= last; date += 86_400_000) {
    points.push((12 + (date - first) * 576 / Math.max(1, last - first)) + ',' + (112 - (byDate.get(date) ?? 0) * 100 / peak))
  }
  return <section className="s4-chart" id="hoat-dong"><h2>Sự kiện theo ngày</h2>
    {data.length ? <>
      <p>{num.format(total)} sự kiện trong khoảng đang xem</p>
      <svg viewBox="0 0 600 124" role="img" aria-label={'Biểu đồ số sự kiện theo ngày. Cao nhất ' + peak}>
        <path d="M12 112H588 M12 62H588 M12 12H588" className="s4-gridline" />
        <polyline points={points.join(' ')} className="s4-series" />
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

function FeedbackInbox({ data }: { data: Dashboard['feedback'] }) {
  const [kind, setKind] = useState<FeedbackKind | 'all'>('all')
  const items = data.items.filter(item => kind === 'all' || item.kind === kind)
  return <section className="s4-inbox" id="phan-hoi">
    <div className="s4-inbox-head">
      <div>
        <h2>Góp ý và đánh giá</h2>
        <p>{num.format(data.total)} góp ý · {num.format(data.rated)} có đánh giá
          {data.average !== null && ' · Trung bình ' + score.format(data.average) + '/5 sao'}</p>
      </div>
      <label>Loại góp ý
        <select value={kind} onChange={event => setKind(event.target.value as FeedbackKind | 'all')}>
          <option value="all">Tất cả</option>
          {feedbackKinds.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </label>
    </div>
    {data.total > data.items.length && <p>Đang hiển thị {data.items.length} góp ý gần nhất trong khoảng này.</p>}
    {items.length ? <ul className="s4-feedback-list">{items.map(item => <li key={item.id}>
      <details>
        <summary><strong>{item.title}</strong><span>
          {feedbackKinds.find(entry => entry.id === item.kind)?.label} · <time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time>
          {item.rating && ' · ' + item.rating + '/5 sao'}
        </span></summary>
        <p>{item.details}</p>
        {item.page && <p>Trang liên quan <code>{item.page}</code></p>}
        {item.steps && <><h3>Các bước gặp lỗi</h3><p>{item.steps}</p></>}
        {item.expected && <><h3>Mong đợi</h3><p>{item.expected}</p></>}
        {item.actual && <><h3>Thực tế</h3><p>{item.actual}</p></>}
      </details>
    </li>)}</ul> : <p>{data.total ? 'Chưa có góp ý loại này trong danh sách gần nhất.' : 'Chưa có góp ý trong khoảng này.'}</p>}
  </section>
}

function Reports() {
  const [days, setDays] = useState<Range>(7)
  const [refresh, setRefresh] = useState(0)
  const [current, setCurrent] = useState<{
    days: Range; refresh: number; data: Partial<Dashboard>; failed: Array<keyof Dashboard>; at: number
  }>()
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])
    void Promise.allSettled(sections.map(async section => [section, await getAdminReport(section, days, signal)] as const)).then(results => {
      if (controller.signal.aborted) return
      const entries = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
      setCurrent({ days, refresh, data: Object.fromEntries(entries) as Partial<Dashboard>,
        failed: sections.filter((_, index) => results[index].status === 'rejected'), at: Date.now() })
    })
    return () => controller.abort()
  }, [days, refresh])
  const data = current?.days === days ? current.data : undefined
  const loading = current?.days !== days || current.refresh !== refresh
  const failed = current?.days === days ? current.failed : []
  const accounts = data?.community
  const newAccounts = accounts?.newAccounts.reduce((sum, item) => sum + item.count, 0)
  const highlights = [
    { label: 'Tài khoản hiện có', value: accounts?.totalAccounts, hint: 'Tài khoản đăng ký còn tồn tại' },
    { label: 'Tài khoản mới', value: newAccounts, hint: 'Đăng ký trong khoảng đang xem' },
    { label: 'Phiên trình duyệt', value: data?.summary?.sessionCount, hint: 'Một người có thể có nhiều phiên' },
    ...(siteFeedbackEnabled ? [{ label: 'Góp ý đã nhận', value: data?.feedback?.total, hint: 'Góp ý gửi trong khoảng đang xem' }] : []),
  ]
  return <>
    <div className="s4-toolbar">
      <div className="s4-period" role="group" aria-label="Khoảng thời gian">
        {([7, 30, 90] as const).map(period => <button key={period} type="button" aria-pressed={days === period} onClick={() => setDays(period)}>{period} ngày</button>)}
      </div>
      <div className="s4-sync">
        <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Làm mới</button>
        <p role="status">{loading ? 'Đang tải báo cáo…' : data && Object.keys(data).length ? 'Cập nhật ' + dateTime.format(current?.at) : 'Chưa tải được dữ liệu'}</p>
      </div>
    </div>
    {failed.length > 0 && !loading && <p className="s4-error" role="alert">Không tải được {failed.map(key => reportLabels[key]).join(', ')}. Bạn có thể thử làm mới.</p>}
    {(data?.summary || data?.feedback || data?.system) && <nav className="s4-jump" aria-label="Báo cáo quản trị">
      {data.summary && <a href="#hoat-dong">Hoạt động</a>}
      {data.feedback && <a href="#phan-hoi">Góp ý và đánh giá</a>}
      {data.system && <a href="#he-thong">Tình trạng hệ thống</a>}
    </nav>}
    <dl className="s4-highlights">{highlights.map(item => <div key={item.label}>
      <dt>{item.label}</dt><dd>{item.value == null ? '—' : num.format(item.value)}</dd><dd>{item.hint}</dd>
    </div>)}</dl>
    {data && <div className="s4-panels">
      {data.summary && <>
      <DailyChart data={data.summary.daily} total={data.summary.eventCount} />
      <MetricList title="Phễu học theo phiên" rows={[{ label: 'Mở bài', count: data.summary.funnel.opened }, { label: 'Sau đó chạy mô phỏng', count: data.summary.funnel.ran }, { label: 'Sau đó tự đánh dấu hoàn thành', count: data.summary.funnel.completed }]} />
      <MetricList title="Sự kiện theo trang" rows={data.summary.byPath.map(row => ({ label: row.path, count: row.events }))} />
      <MetricList title="Bài học" rows={data.summary.byLesson} />
      <MetricList title="Board" rows={data.summary.byBoard} />
      <MetricList title="Thiết bị" rows={data.summary.byDevice} />
      <MetricList title="Nguồn truy cập" rows={data.summary.bySource} />
      </>}
      {data.feedback && <FeedbackInbox data={data.feedback} />}
      {data.community && <MetricList title="Cộng đồng và tài khoản mới" rows={[
        { label: 'Bài viết', count: data.community.posts }, { label: 'Bình luận', count: data.community.comments },
        { label: 'Báo cáo đang chờ', count: data.community.pendingReports },
        ...data.community.newAccounts.map(item => ({ label: item.provider === 'github' ? 'GitHub' : 'Google', count: item.count })),
      ]} />}
      {data.ai && <section><h2>Mở Bot AI</h2>
        <p>{data.ai.limit === null ? 'Chưa đặt hạn mức.' : num.format(data.ai.used) + '/' + num.format(data.ai.limit) + ' lượt hôm nay'}</p>
        {data.ai.nearLimit && <p role="status">Đã dùng ít nhất 80% hạn mức hôm nay.</p>}
        {!data.ai.models.length && <p>Chưa có yêu cầu AI trong khoảng này.</p>}
        {data.ai.models.map(model => <div key={model.provider + ':' + model.model}>
          <h3>{model.model}</h3>
          <p>{num.format(model.requests)} yêu cầu · {num.format(model.insufficient * 100 / Math.max(model.requests, 1))}% thiếu nguồn · {model.errors} lỗi</p>
          <p>p50 {model.p50Ms} ms · p95 {model.p95Ms} ms · {num.format(model.inputTokens + model.outputTokens)} token</p>
          <p>Đánh giá câu trả lời · {num.format(model.helpful)} hữu ích · {num.format(model.unhelpful)} chưa hữu ích</p>
          <p>Chi phí ước tính {model.estimatedUsd === null ? 'chưa có đơn giá' : num.format(model.estimatedUsd) + ' USD'}</p>
        </div>)}
      </section>}
      {data.system && <section id="he-thong"><h2>Mini PC</h2><dl>
        <div><dt>Commit</dt><dd><code>{data.system.commit.slice(0, 12)}</code></dd></div>
        <div><dt>API</dt><dd>{readiness(data.system.api)}</dd></div>
        <div><dt>Database</dt><dd>{readiness(data.system.database)}</dd></div>
        <div><dt>AI</dt><dd>{readiness(data.system.ai)}</dd></div>
        <div><dt>RAM còn trống</dt><dd>{gib(data.system.ramFreeBytes)} / {gib(data.system.ramTotalBytes)}</dd></div>
        <div><dt>Đĩa còn trống</dt><dd>{gib(data.system.diskFreeBytes)}</dd></div>
        <div><dt>Sao lưu gần nhất (UTC)</dt><dd>{data.system.latestBackup ?? 'Chưa có dữ liệu'}</dd></div>
      </dl></section>}
    </div>}
  </>
}

function ConnectedSiteReport({ site }: { site: DashboardSite }) {
  const [days, setDays] = useState<Range>(7)
  const [refresh, setRefresh] = useState(0)
  const [current, setCurrent] = useState<{
    days: Range; refresh: number; data?: Awaited<ReturnType<typeof getDashboardSiteReport<Dashboard['feedback']>>>; error?: string
  }>()
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])
    void getDashboardSiteReport<Dashboard['feedback']>(site.id, days, signal).then(data => {
      if (!controller.signal.aborted) setCurrent({ days, refresh, data })
    }).catch(error => {
      if (!controller.signal.aborted) setCurrent({ days, refresh, error: error instanceof Error ? error.message : 'Không tải được báo cáo.' })
    })
    return () => controller.abort()
  }, [site.id, days, refresh])
  const loading = current?.days !== days || current.refresh !== refresh
  const data = !loading && current.data
  return <>
    <div className="s4-toolbar">
      <div className="s4-period" role="group" aria-label="Khoảng thời gian">
        {([7, 30, 90] as const).map(period => <button key={period} type="button" aria-pressed={days === period} onClick={() => setDays(period)}>{period} ngày</button>)}
      </div>
      <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Làm mới báo cáo</button>
    </div>
    {loading && <p role="status">Đang tải báo cáo…</p>}
    {!loading && current.error && <p className="s4-error" role="alert">{current.error}</p>}
    {data && <div className="s4-panels">
      <section className="s4-chart">
        <h2>Hoạt động theo ngày</h2>
        {data.daily.length > 0 ? <div className="s4-table-scroll" tabIndex={0} role="region" aria-label="Số liệu từng ngày">
          <table>
            <thead><tr><th scope="col">Ngày</th><th scope="col">Trạng thái</th><th scope="col">Tài khoản</th><th scope="col">Tài khoản mới</th><th scope="col">Phiên</th><th scope="col">Lượt xem</th></tr></thead>
            <tbody>{data.daily.map(row => <tr key={row.day}>
              <th scope="row">{row.day}</th><td>{webStatus[row.status]}</td>
              <td>{count(row.accounts)}</td><td>{count(row.newAccounts)}</td><td>{count(row.sessions)}</td><td>{count(row.pageViews)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>Website chưa gửi số liệu trong khoảng này.</p>}
      </section>
      <FeedbackInbox data={data.feedback} />
    </div>}
  </>
}

function WebsiteReports() {
  const [sites, setSites] = useState<DashboardSite[]>([])
  const [selected, setSelected] = useState('mach-mo')
  const [directoryError, setDirectoryError] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])
    void getDashboardSites(signal).then(list => {
      if (controller.signal.aborted) return
      setSites(list)
      setSelected(id => list.some(site => site.id === id) ? id : 'mach-mo')
      setDirectoryError(false)
    }).catch(() => {
      if (!controller.signal.aborted) setDirectoryError(true)
    })
    return () => controller.abort()
  }, [refresh])
  const site = sites.find(entry => entry.id === selected && !entry.native)
  return <>
    <section className="s4-sites" aria-labelledby="dashboard-sites-title">
      <div className="s4-sites-head">
        <h2 id="dashboard-sites-title">Website</h2>
        <button type="button" onClick={() => setRefresh(value => value + 1)}>Cập nhật danh sách</button>
      </div>
      {directoryError && <p role="alert">Chưa tải được danh sách website.</p>}
      <ul className="s4-site-list">
        <li><button type="button" aria-pressed={selected === 'mach-mo'} onClick={() => setSelected('mach-mo')}>
          <strong>Mạch Mở</strong><span>Đọc dữ liệu trực tiếp</span>
        </button></li>
        {sites.filter(entry => !entry.native).map(entry => <li key={entry.id}>
          <button type="button" aria-pressed={selected === entry.id} onClick={() => setSelected(entry.id)}>
            <strong>{entry.name}</strong><span>{entry.origin}</span>
            <span>{!entry.latest ? 'Chưa nhận dữ liệu' : Date.now() - Date.parse(entry.latest.receivedAt) > 26 * 3_600_000
              ? 'Dữ liệu chưa cập nhật' : webStatus[entry.latest.status]}</span>
            {entry.latest && <time dateTime={entry.latest.receivedAt}>{dateTime.format(new Date(entry.latest.receivedAt))}</time>}
          </button>
        </li>)}
      </ul>
    </section>
    <div aria-label={site?.name ?? 'Mạch Mở'}>
      {site ? <ConnectedSiteReport key={site.id} site={site} /> : <Reports />}
    </div>
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
    <header className="s4-heading"><h1 id="s4-title">Quản trị website</h1>
      <p>Tình trạng hệ thống, hoạt động và phản hồi theo từng website.</p>
    </header>
    {auth.status === 'loading' ? <p role="status">Đang kiểm tra quyền…</p>
      : auth.status === 'error' ? <p role="alert">{auth.message}</p>
      : auth.status === 'signed-in' ? auth.user.dashboardAccess === true ? <WebsiteReports /> : <section>
        <p role="alert">Tài khoản này chưa có quyền xem dashboard.</p>
        <p>Nếu email của bạn đã được cấp quyền, hãy đăng nhập lại tại đây để xác minh.</p>
        <div className="s4-period">{OAUTH_PROVIDERS.map(provider => <button key={provider.id} type="button"
          onClick={() => startSelfHostedOAuth(provider.id, '/admin')}>Xác minh bằng {provider.label}</button>)}</div>
      </section>
      : <p><Link to="/login?next=%2Fadmin">Đăng nhập để kiểm tra quyền quản trị</Link></p>}
  </article>
}
