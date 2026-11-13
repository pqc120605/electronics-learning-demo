import { Link } from 'react-router-dom'
import { curriculumLessons } from '../data/curriculumSchema'
import { PRODUCT_ROUTES as R, toAppRoute } from '../data/productRoutes'
import { CapabilityLegend } from '../components/CapabilityBadge'
import { FirstBoardStudio, LearningPath } from '../components/LearningPath'
import { LearningActivity } from '../components/LearningActivity'
import { esp32LedLesson } from '../data/lessons'
import { getKnownChecklistItems } from '../lib/learningProgress'
import { useLearningProgress } from '../lib/useLearningProgress'
import { getLearningResume } from '../data/learningPath'
import './AppHomePage.css'

const workspaceLinks = [
  {
    number: '01',
    icon: '↗',
    label: 'BÀI HỌC TỪNG BƯỚC',
    title: 'Bắt đầu với mạch LED',
    description: 'Nhận biết board, nối LED và điện trở, rồi đọc luồng lệnh GPIO.',
    to: R.appLesson,
    action: 'Mở bài học',
  },
  {
    number: '02',
    icon: '⌘',
    label: 'BOARD & LINH KIỆN',
    title: 'Tra cứu thư viện',
    description: 'Khám phá board, chân kết nối và linh kiện có trong thư viện hiện tại.',
    to: R.appBoards,
    action: 'Mở thư viện board',
  },
  {
    number: '03',
    icon: '⌁',
    label: 'THỰC HÀNH',
    title: 'Lắp thử một mạch',
    description: 'Chọn bài mẫu, nối linh kiện và quan sát luồng hoạt động minh họa.',
    to: R.appLab,
    action: 'Vào phòng thử',
  },
  {
    number: '04',
    icon: '∑',
    label: 'CÔNG CỤ HỖ TRỢ',
    title: 'Tính toán điện tử',
    description: 'Ước lượng điện trở LED, bộ chia áp ADC, pull-up I²C và hằng số RC.',
    to: R.appCalculators,
    action: 'Mở bộ tính',
  },
  {
    number: '05',
    icon: '↗',
    label: 'BÀI HỌC MÔ PHỎNG',
    title: 'Bài học robot mô phỏng',
    description: 'Thử các lệnh chuyển động trong một tình huống ảo, không cần robot thật.',
    to: '/app/robot-simulation',
    action: 'Mở bài học robot',
  },
]

const exploreLinks = [
  { title: 'Linh kiện', description: 'Tìm hiểu công dụng và cách nhận biết.', to: R.appComponents, icon: 'Ω' },
  { title: 'Chủ đề học', description: 'Xem các nhóm kiến thức đang có.', to: R.appLearn, icon: '◎' },
  { title: 'Dự án thực hành', description: 'Chọn một mạch mẫu để khám phá.', to: R.appProjects, icon: '⌘' },
  { title: 'Lớp học & kit', description: 'Tính dụng cụ theo số trạm và xuất kế hoạch thực hành.', to: R.appClassroomKit, icon: '▤' },
]

export function AppHomePage() {
  const progress = useLearningProgress()
  const resume = getLearningResume(progress.lastLessonId, progress.selfReportedCompletedLessonIds)
  const resumeLesson = curriculumLessons.find((lesson) => lesson.id === resume.lessonId)
  const resumeNote = {
    new: 'Mở bài LED để làm quen với board, linh kiện và code qua một ví dụ cụ thể.',
    'in-progress': `Lần gần nhất bạn mở: ${resumeLesson?.title}. Tiến độ này chỉ lưu trên thiết bị.`,
    next: `Bài tiếp theo: ${resumeLesson?.title}. Tiến độ này chỉ lưu trên thiết bị.`,
    'all-complete': `Bạn đã tự đánh dấu hoàn thành cả ${curriculumLessons.length} bài. Đây không phải đánh giá năng lực.`,
  }[resume.state]
  const ledChecklistCount = getKnownChecklistItems(progress.checklists?.blink, esp32LedLesson.verificationChecklist).length

  return (
    <div className="app-home-page">
      <section className="app-home-hero" aria-labelledby="app-home-title">
        <div className="app-home-hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> KHÔNG GIAN HỌC MẠCH MỞ</p>
          <h1 id="app-home-title">Học điện tử bằng cách <span>lắp, đọc và thử.</span></h1>
          <p className="app-home-intro">Đi từ bài học nhập môn đến thư viện board và bàn lắp mạch. Bạn có thể bắt đầu ngay trên web, không cần tạo tài khoản.</p>
          <div className="app-home-actions">
            <Link className="button-primary" to={toAppRoute(resume.route)}>{resume.label} <span aria-hidden="true">↗</span></Link>
            <Link className="app-home-secondary" to={R.appLab}>Mở bàn lắp mạch</Link>
          </div>
          <p className="app-home-resume">{resumeNote}</p>
          <p className="app-home-guest"><span aria-hidden="true">✓</span> Dùng thử với tư cách khách · Không cần đăng nhập</p>
        </div>
      </section>

      <FirstBoardStudio />

      <section className="app-home-section app-home-path" aria-labelledby="app-home-path-title">
        <div className="app-home-section-heading">
          <div>
            <p className="eyebrow">LỘ TRÌNH · {curriculumLessons.length} BÀI</p>
            <h2 id="app-home-path-title">Đi theo lộ trình, hoặc mở bài bạn quan tâm</h2>
          </div>
        </div>
        <LearningPath lastLessonId={progress.lastLessonId} startedLessonIds={progress.startedLessonIds} completedLessonIds={progress.selfReportedCompletedLessonIds} headingLevel="h3" />
        <p className="app-home-path-note">{`Bạn đã bắt đầu ${progress.startedLessonIds.length}/${curriculumLessons.length} bài; tự đánh dấu hoàn thành ${progress.selfReportedCompletedLessonIds.length}/${curriculumLessons.length} bài. `}{ledChecklistCount > 0 ? `Checklist bài LED đã tự xác nhận ${ledChecklistCount}/${esp32LedLesson.verificationChecklist.length} mục. ` : ''}Tiến độ chỉ lưu trên trình duyệt này, không chấm điểm và không xác minh đã chạy phần cứng.</p>
        <LearningActivity attempts={progress.simulationAttempts} routeFor={toAppRoute} />
      </section>

      <CapabilityLegend ids={['behavior-simulation', 'concept-illustration', 'electrical-simulation', 'firmware-execution']} title="Web hiện mô phỏng đến mức nào?" />

      <section className="app-home-section" aria-labelledby="app-home-start-title">
        <div className="app-home-section-heading">
          <div>
            <p className="eyebrow">LỐI VÀO NHANH</p>
            <h2 id="app-home-start-title">Bạn muốn làm gì hôm nay?</h2>
          </div>
          <span className="app-home-section-note">Công cụ hiện có trong bản web</span>
        </div>
        <div className="app-home-workspace-grid">
          {workspaceLinks.map((item) => (
            <Link className="app-home-workspace-card" to={item.to} key={item.to}>
              <span className="app-home-card-number">{item.number}</span>
              <span className="app-home-card-icon" aria-hidden="true">{item.icon}</span>
              <span className="app-home-card-label">{item.label}</span>
              <strong>{item.title}</strong>
              <span className="app-home-card-description">{item.description}</span>
              <span className="app-home-card-action">{item.action} <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="app-home-section app-home-explore" aria-labelledby="app-home-explore-title">
        <div className="app-home-section-heading">
          <div>
            <p className="eyebrow">KHÁM PHÁ THÊM</p>
            <h2 id="app-home-explore-title">Mở rộng từ điều bạn tò mò</h2>
          </div>
          <Link className="app-home-text-link" to={`${R.publicHome}?surface=web`}>Giới thiệu Mạch Mở <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="app-home-explore-list">
          {exploreLinks.map((item) => (
            <Link className="app-home-explore-link" to={item.to} key={item.to}>
              <span className="app-home-explore-icon" aria-hidden="true">{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="app-home-explore-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="app-home-capability-note" aria-label="Giới hạn mô phỏng hiện tại">
        <span aria-hidden="true">i</span>
        <p><strong>Về mô phỏng:</strong> bài học dùng parser giáo dục giới hạn hoặc kịch bản khái niệm. Bạn có thể chuyển phần mạch analog được hỗ trợ từ bàn lắp sang SPICE; GPIO và firmware không được chuyển. Chế độ HEX riêng chạy Uno R3/Nano classic ATmega328P và quan sát D13/UART0; các MCU khác chưa chạy firmware.</p>
        <Link to={`${R.publicHome}?surface=web`}>Tìm hiểu về Mạch Mở</Link>
      </section>
    </div>
  )
}
