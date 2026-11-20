import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BeginnerResumeCard, useBeginnerResume } from '../components/learning/BeginnerResumeCard'
import { Link } from 'react-router-dom'
import { RecentProjectResume } from '../components/learning/RecentProjectResume'
import { beginnerResumeUrl } from '../lib/beginnerRepair'

const FreestyleBench = lazy(() => import('../components/freestyle/FreestyleBench').then(module => ({ default: module.FreestyleBench })))

/** 2026-11-15: ba luồng chính, mỗi luồng tối đa ba bước. */
const startFlows = [
  { kicker: 'Người mới', title: 'Học bài đầu tiên', to: '/learn/basics', action: 'Thử mạch kín', steps: ['Dự đoán LED sáng hay tắt', 'Nối đường về nguồn', 'Quan sát và giải thích'] },
  { kicker: 'Tự làm', title: 'Lắp mạch tự do', to: '/build/freestyle', action: 'Mở bàn lắp mạch', steps: ['Chọn board', 'Thêm linh kiện, nối dây', 'Viết code và bấm Chạy'] },
  { kicker: 'Tra cứu', title: 'Tìm linh kiện, board', to: '/components', action: 'Mở thư viện', steps: ['Tìm theo tên hoặc chức năng', 'Xem chân và lưu ý an toàn', 'Bấm “Lắp thử trên bàn tự do”'] },
] as const

export function ExplorePage() {
  const foundation = useBeginnerResume()
  const bench = useRef<HTMLElement>(null)
  const [benchReady, setBenchReady] = useState(() => window.location.hash === '#ban-lap-mach')
  useEffect(() => {
    if (benchReady || !bench.current) return
    if (!('IntersectionObserver' in window)) { setBenchReady(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.intersectionRatio >= 0.4)) setBenchReady(true)
    }, { threshold: 0.4 })
    observer.observe(bench.current)
    return () => observer.disconnect()
  }, [benchReady])
  return <>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> ĐIỆN TỬ · LẬP TRÌNH NHÚNG · IOT</p>
        <h1>Từ linh kiện nhỏ<br />đến thế giới <span>thông minh.</span></h1>
        <p className="hero-description">Lắp mạch, viết code và bấm Chạy ngay trên trình duyệt. Mạch Mở giúp bạn hiểu board, cảm biến và code qua những mạch thử trực quan.</p>
        <div className="hero-actions"><Link className="button-primary" to={beginnerResumeUrl('/learn/basics', foundation.session?.repairs)}>{foundation.session?.repairs?.active ? 'Tiếp tục sửa mạch' : foundation.session ? 'Tiếp tục thử nghiệm' : 'Thử mạch đầu tiên'} <span aria-hidden="true">↗</span></Link><a className="text-link" href="#ban-lap-mach" onClick={() => setBenchReady(true)}>Mở bàn lắp mạch <span aria-hidden="true">↓</span></a></div>
        <RecentProjectResume />
        <div className="hero-note"><span className="note-icon">✳</span><span>Miễn phí để khám phá<br /><strong>Không cần tài khoản hay kinh nghiệm</strong></span></div>
      </div>
    </section>
    <BeginnerResumeCard />
    <section id="ban-lap-mach" ref={bench} className="home-freestyle" aria-label="Bàn lắp mạch tự do" tabIndex={-1}>
      {benchReady ? <Suspense fallback={<div className="home-freestyle-placeholder"><p role="status">Đang mở bàn lắp mạch…</p></div>}>
        <FreestyleBench />
      </Suspense> : <div className="home-freestyle-placeholder"><button type="button" className="button-secondary" onClick={() => setBenchReady(true)}>Mở bàn tự do tại đây</button></div>}
    </section>
    <section className="home-start" id="bat-dau" aria-labelledby="home-start-title">
      <div className="home-section-heading"><p className="eyebrow">BA CÁCH BẮT ĐẦU</p><h2 id="home-start-title">Chọn một đường, mỗi đường ba bước</h2><p>Không chắc bắt đầu từ đâu? Chọn “Học bài đầu tiên”.</p></div>
      <ul className="home-start-grid">
        {startFlows.map(flow => <li key={flow.to}><Link className="home-flow-card" to={flow.to}>
          <span className="home-flow-kicker">{flow.kicker}</span>
          <strong>{flow.title}</strong>
          <ol>{flow.steps.map(step => <li key={step}>{step}</li>)}</ol>
          <span className="home-flow-action">{flow.action} <span aria-hidden="true">↗</span></span>
        </Link></li>)}
      </ul>
    </section>
    <section className="home-world" aria-labelledby="home-world-title">
      <div className="home-section-heading"><p className="eyebrow">THẾ GIỚI ĐIỆN TỬ</p><h2 id="home-world-title">Một thiết bị thông minh hoạt động ra sao?</h2><p>Từ tín hiệu đầu vào đến hành động đầu ra, mỗi phần đảm nhiệm một vai trò.</p></div>
      <div className="home-signal-flow" aria-label="Cảm biến gửi tín hiệu đến vi điều khiển, rồi vi điều khiển điều khiển thiết bị đầu ra">
        <article><span className="home-flow-number">01 · NHẬN BIẾT</span><div className="home-flow-icon" aria-hidden="true">⌁</div><h3>Cảm biến</h3><p>Nút nhấn, ánh sáng hay khoảng cách tạo tín hiệu từ môi trường.</p></article>
        <span className="home-flow-arrow" aria-hidden="true">→</span>
        <article><span className="home-flow-number">02 · XỬ LÝ</span><div className="home-flow-icon" aria-hidden="true">µC</div><h3>Vi điều khiển</h3><p>Board đọc tín hiệu và chạy chương trình để quyết định điều gì sẽ xảy ra.</p></article>
        <span className="home-flow-arrow" aria-hidden="true">→</span>
        <article><span className="home-flow-number">03 · PHẢN HỒI</span><div className="home-flow-icon" aria-hidden="true">↗</div><h3>Thiết bị</h3><p>LED, còi hay động cơ phản hồi theo lệnh của chương trình.</p></article>
      </div>
      <p className="home-world-note">Khi các board kết nối mạng và trao đổi dữ liệu, đó là một trong những nền tảng của IoT.</p>
    </section>
    <section className="home-features" id="tinh-nang" aria-labelledby="home-features-title">
      <div className="home-section-heading"><p className="eyebrow">KHÁM PHÁ MẠCH MỞ</p><h2 id="home-features-title">Năm khu vực của Mạch Mở</h2><p>Cùng thứ tự với menu trên cùng.</p></div>
      <div className="home-links" aria-label="Các khu vực của Mạch Mở">
        <Link to="/topics"><span>HỌC</span><strong>Chủ đề và dự án</strong><small>Lộ trình theo chủ đề, bài hướng dẫn từng bước và dự án thực hành.</small><span className="home-link-action">Duyệt chủ đề ↗</span></Link>
        <Link to="/build"><span>LẮP MẠCH</span><strong>Phòng lắp mạch theo bài</strong><small>Mạch dựng sẵn theo bài mẫu, có sơ đồ, 3D và trace tín hiệu.</small><span className="home-link-action">Vào phòng lắp mạch ↗</span></Link>
        <Link to="/boards"><span>THƯ VIỆN</span><strong>Board và linh kiện</strong><small>So sánh vi điều khiển, xem chân, mức logic và lưu ý an toàn.</small><span className="home-link-action">Mở thư viện board ↗</span></Link>
        <Link to="/tools/sketch"><span>CÔNG CỤ</span><strong>Chạy code, SPICE, bộ tính</strong><small>Chạy sketch Arduino, mô phỏng mạch analog, tính điện trở LED.</small><span className="home-link-action">Mở công cụ ↗</span></Link>
      </div>
      <div className="home-path-links"><span>CỘNG ĐỒNG</span><p>Có câu hỏi về mạch hay code?</p><Link to="/community">Hỏi cộng đồng ↗</Link><Link to="/projects">Xem dự án ↗</Link></div>
    </section>
  </>
}
