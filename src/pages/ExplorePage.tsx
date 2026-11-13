import { Link } from 'react-router-dom'
import { FirstBoardStudio } from '../components/LearningPath'

function HeroCircuit() {
  return (
    <div className="hero-circuit" aria-label="Minh họa bo mạch ESP32 nối với đèn LED">
      <div className="circuit-caption"><span className="live-dot" /> MẠCH ĐẦU TIÊN CỦA BẠN</div>
      <svg className="hero-board-art" viewBox="0 0 560 400" role="img" aria-labelledby="hero-art-title">
        <title id="hero-art-title">ESP32 nối điện trở và LED trên breadboard</title>
        <defs>
          <pattern id="board-holes" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="2.25" fill="#c8d6cb" />
          </pattern>
          <filter id="board-shadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="17" stdDeviation="14" floodColor="#1b4635" floodOpacity="0.18" />
          </filter>
        </defs>
        <path d="M112 177h97v38h111v-68h85" fill="none" stroke="#e48243" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M112 263h74v30h172v-50h47" fill="none" stroke="#588975" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="112" cy="177" r="8" fill="#f3a56f" />
        <circle cx="112" cy="263" r="8" fill="#78a58c" />
        <circle cx="405" cy="147" r="8" fill="#e48243" />
        <circle cx="405" cy="243" r="8" fill="#588975" />
        <g filter="url(#board-shadow)" transform="rotate(-4 275 209)">
          <rect x="61" y="75" width="165" height="274" rx="15" fill="#245542" />
          <rect x="73" y="88" width="141" height="248" rx="10" fill="#2d674f" stroke="#78a58c" strokeOpacity=".4" />
          <rect x="113" y="164" width="62" height="94" rx="5" fill="#1b332d" />
          <path d="M91 108h103M91 316h103" stroke="#d7b564" strokeWidth="4" strokeLinecap="round" />
          <path d="M77 124h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14" stroke="#d7b564" strokeWidth="5" strokeLinecap="round" />
          <path d="M224 124h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14m14 22h-14" stroke="#d7b564" strokeWidth="5" strokeLinecap="round" />
          <circle cx="144" cy="137" r="7" fill="#e5a05f" />
          <text x="144" y="286" textAnchor="middle" fill="#dbe8dc" fontSize="12" fontFamily="monospace">ESP32</text>
          <text x="144" y="304" textAnchor="middle" fill="#a9c2b0" fontSize="9" fontFamily="monospace">DEVKIT V1</text>
        </g>
        <g transform="rotate(4 372 200)">
          <rect x="307" y="82" width="183" height="251" rx="20" fill="#f7f8f1" stroke="#d7e0d5" strokeWidth="2" />
          <path d="M324 120h148M324 295h148" stroke="#d18a5b" strokeWidth="4" strokeLinecap="round" />
          <path d="M324 138h148v139H324z" fill="url(#board-holes)" />
          <path d="M369 178v34m28-34v34" stroke="#a9b2a7" strokeWidth="4" strokeLinecap="round" />
          <path d="M369 178c-3-20 5-33 28-33s31 13 28 33" fill="#e67651" stroke="#b74832" strokeWidth="3" />
          <path d="M388 177v39" stroke="#a9b2a7" strokeWidth="3" />
          <path d="m333 213 29-10 7 19-29 10z" fill="#d8bc72" stroke="#9e8348" strokeWidth="2" />
          <path d="m340 214 3 10m7-12 3 10m7-13 3 10" stroke="#8a653f" strokeWidth="2" />
        </g>
      </svg>
      <div className="circuit-label label-gpio"><span /> GPIO 23</div>
      <div className="circuit-label label-led"><span /> LED + ĐIỆN TRỞ</div>
      <div className="hero-sticker"><span>01</span><small>dự án<br />nhập môn</small></div>
    </div>
  )
}

export function ExplorePage() {
  return <>
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> ĐIỆN TỬ · LẬP TRÌNH NHÚNG · IOT</p>
        <h1>Từ linh kiện nhỏ<br />đến thế giới <span>thông minh.</span></h1>
        <p className="hero-description">Điện tử giúp thiết bị cảm nhận và phản hồi với thế giới. Mạch Mở giúp bạn khám phá cách chúng hoạt động qua board, cảm biến, code và những mạch thử trực quan.</p>
        <div className="hero-actions"><Link className="button-primary" to="/learn/esp32-led">Khám phá bài học đầu tiên <span aria-hidden="true">↗</span></Link><a className="text-link" href="#tinh-nang">Xem Mạch Mở có gì <span aria-hidden="true">↓</span></a></div>
        <div className="hero-note"><span className="note-icon">✳</span><span>Miễn phí để khám phá<br /><strong>Không cần tài khoản hay kinh nghiệm</strong></span></div>
      </div>
    </section>
    <FirstBoardStudio illustration={<HeroCircuit />} />
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
      <div className="home-section-heading"><p className="eyebrow">KHÁM PHÁ MẠCH MỞ</p><h2 id="home-features-title">Học bằng cách nhìn, thử và làm</h2><p>Các công cụ liên kết với nhau để bạn đi từ làm quen linh kiện đến thử một mạch hoàn chỉnh.</p></div>
      <div className="home-links" aria-label="Các tính năng của Mạch Mở">
        <Link to="/learn/esp32-led"><span>BÀI HỌC TỪNG BƯỚC</span><strong>Bắt đầu với một mạch LED</strong><small>Nhận biết linh kiện, nối mạch, đọc code và theo dõi luồng hoạt động.</small><span className="home-link-action">Mở bài học nhập môn ↗</span></Link>
        <Link to="/boards"><span>THƯ VIỆN · BOARD</span><strong>Khám phá các board</strong><small>So sánh vi điều khiển, mức logic và trạng thái mô hình tham chiếu.</small><span className="home-link-action">Mở thư viện board ↗</span></Link>
        <Link to="/components"><span>THƯ VIỆN · LINH KIỆN</span><strong>Tìm hiểu từng linh kiện</strong><small>Xem chức năng, chân kết nối thường gặp và lưu ý an toàn.</small><span className="home-link-action">Mở thư viện linh kiện ↗</span></Link>
        <Link to="/build"><span>PHÒNG THỬ</span><strong>Lắp mạch và quan sát</strong><small>Thử workspace theo bốn bước; một số luồng là mô phỏng giáo dục.</small><span className="home-link-action">Vào phòng thử ↗</span></Link>
      </div>
      <div className="home-path-links"><span>LỘ TRÌNH HỌC</span><p>Muốn xem các chủ đề và dự án theo hướng học tập?</p><Link to="/topics">Duyệt chủ đề ↗</Link><Link to="/projects">Xem dự án ↗</Link></div>
    </section>
    <section className="start-strip" aria-label="Bắt đầu khám phá"><div className="strip-label"><span className="strip-star">✳</span><span>SẴN SÀNG THỬ CHƯA?</span></div><p>Bắt đầu từ bài LED — không cần kinh nghiệm trước.</p><Link to="/learn/esp32-led" aria-label="Bắt đầu học bài LED với ESP32">Bắt đầu học <span aria-hidden="true">↗</span></Link></section>
  </>
}
