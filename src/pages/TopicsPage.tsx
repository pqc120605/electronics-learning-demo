import { Link } from 'react-router-dom'
import { LearningPath } from '../components/LearningPath'
import { getLearningResume, learningPathOrder } from '../data/learningPath'
import { useLearningProgress } from '../lib/useLearningProgress'
import { useProductRoute } from '../lib/useProductRoute'

const topics = [
  {
    number: '01', category: 'NỀN TẢNG', title: 'Điện tử cơ bản',
    description: 'Điện áp, dòng điện, cực tính, điện trở hạn dòng và cách đọc các khối trên board.',
    outcome: 'Nhận biết nguồn, GND, LED và điện trở trước khi lắp mạch.',
    links: [{ label: 'Tra linh kiện cơ bản', to: '/components' }, { label: 'Thử bàn lắp mạch', to: '/build' }],
  },
  {
    number: '02', category: 'LẬP TRÌNH NHÚNG', title: 'GPIO và chương trình đầu tiên',
    description: 'Cấu hình chân, bật/tắt đầu ra và theo dõi trình tự setup() → loop() → thiết bị.',
    outcome: 'Thấy rõ code tác động lên chân và LED như thế nào.',
    links: [{ label: 'Học bài LED với ESP32', to: '/learn/esp32-led' }, { label: 'Mở bàn lắp mạch', to: '/build' }],
  },
  {
    number: '03', category: 'CẢM BIẾN VÀ IOT', title: 'Đầu vào và tín hiệu',
    description: 'Phân biệt tín hiệu số và analog; tìm hiểu nút nhấn, biến trở, LDR và cảm biến phổ biến.',
    outcome: 'Biết cần kiểm tra pinout, điện áp và kiểu tín hiệu của từng module.',
    links: [{ label: 'Duyệt thư viện cảm biến', to: '/components' }, { label: 'Chọn board phù hợp', to: '/boards' }],
  },
  {
    number: '04', category: 'PHẦN CỨNG', title: 'Board, MCU và chân kết nối',
    description: 'So sánh ESP32, Arduino, Raspberry Pi Pico và STM32 theo mức logic, I/O và kết nối.',
    outcome: 'Chọn đúng board tham chiếu và không suy luận pinout giữa các phiên bản.',
    links: [{ label: 'So sánh board', to: '/boards' }, { label: 'Xem linh kiện trên board', to: '/learn/esp32-led' }],
  },
]

export function TopicsPage() {
  const productRoute = useProductRoute()
  const progress = useLearningProgress()
  const resume = getLearningResume(progress.lastLessonId, progress.selfReportedCompletedLessonIds)
  return <div className="catalog-page">
    <section className="catalog-page-heading">
      <p className="eyebrow">LỘ TRÌNH · CHỦ ĐỀ</p>
      <h1>Chủ đề học</h1>
      <p>Đi từ linh kiện và tín hiệu cơ bản đến code nhúng, cảm biến và chọn board. Đây là bản đồ học tập liên kết tới các công cụ và bài đang có, chưa phải khóa học đầy đủ.</p>
      <div className="catalog-actions">{resume.state !== 'all-complete' && <Link className="button-primary" to={productRoute(resume.route)}>{resume.label} ↗</Link>}<Link to={productRoute('/projects')}>Xem dự án thực hành →</Link></div>
    </section>
    <section className="content-section topic-page-section" aria-labelledby="topic-path-title">
      <h2 id="topic-path-title" className="topic-path-title">Lộ trình bài thực hành</h2>
      <LearningPath lastLessonId={progress.lastLessonId} startedLessonIds={progress.startedLessonIds} completedLessonIds={progress.selfReportedCompletedLessonIds} headingLevel="h3" />
      <p className="topic-scope-note">{`Đã bắt đầu ${progress.startedLessonIds.length}/${learningPathOrder.length} bài; tự đánh dấu hoàn thành ${progress.selfReportedCompletedLessonIds.length}/${learningPathOrder.length} bài. Tiến độ chỉ lưu trên trình duyệt này và không xác minh đã chạy phần cứng.`}</p>
      <h2 className="topic-path-title">Chủ đề kiến thức</h2>
      <div className="topic-grid">{topics.map(topic => <article className="topic-tile" key={topic.number}>
        <span className="topic-number">{topic.number}</span><p className="card-kicker">{topic.category}</p><h2>{topic.title}</h2>
        <p>{topic.description}</p><div className="topic-outcome"><strong>Bạn sẽ hiểu</strong><span>{topic.outcome}</span></div>
        <div className="topic-links">{topic.links.map(link => <Link key={link.to} to={productRoute(link.to)}>{link.label} ↗</Link>)}</div>
      </article>)}</div>
      <p className="topic-scope-note">Một số chủ đề hiện là bản đồ học tập dẫn tới thư viện và workspace; chưa phải khóa học hoàn chỉnh. Các trang có bài học chạy được sẽ được ghi rõ trạng thái.</p>
    </section>
  </div>
}
