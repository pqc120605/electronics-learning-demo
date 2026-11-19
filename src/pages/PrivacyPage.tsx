import { Link } from 'react-router-dom'
import { useProductRoute } from '../lib/useProductRoute'
import { localAnalyticsEnabled } from '../lib/analytics'

export function PrivacyPage() {
  const productRoute = useProductRoute()
  return <article className="route-placeholder">
    <p className="eyebrow">MẠCH MỞ · QUYỀN RIÊNG TƯ</p>
    <h1>Quyền riêng tư</h1>
    <h2>Dữ liệu lưu trên thiết bị</h2>
    <p>Workspace, bản nháp, project, bài vừa mở trong lộ trình và checklist tự xác nhận được lưu trong bộ nhớ trình duyệt trên thiết bị bạn đang dùng. Dữ liệu học này không được đồng bộ tài khoản và checklist không xác minh bạn đã chạy mạch thật. Xóa dữ liệu trang web của trình duyệt có thể xóa các mục này; hãy xuất project để giữ bản sao project.</p>
    <h2>Hỏi Mở</h2>
    <p>Tra cứu dùng nội dung sẵn trong ứng dụng. Khi chọn gửi ở mục Hỏi AI, câu hỏi, tối đa hai lượt hỏi đáp gần nhất và trích đoạn tra cứu được chuyển tới Ollama trên cùng máy. Bạn có thể cho phép dùng thông tin bài, board hoặc linh kiện đang chọn để tìm trích đoạn liên quan. Mạch Mở không lưu hội thoại vào tài khoản hay gửi tệp, code trong editor hoặc toàn bộ bản nháp. Hội thoại của mục AI được xóa khi thoát mục này hoặc đổi ngữ cảnh.</p>
    <h2>Thống kê sử dụng</h2>
    <p>Nếu dịch vụ thống kê được cấu hình, Mạch Mở gửi lượt xem trang, mở bài, chọn linh kiện, sao chép code và bắt đầu chạy mô phỏng cùng mã phiên ngẫu nhiên trong tab. Mã code, tên, email và nội dung project không được gửi trong các sự kiện này. Khi chưa cấu hình dịch vụ, các sự kiện không được gửi.</p>
    <p>Bạn có thể đóng tab để kết thúc phiên. {localAnalyticsEnabled ? 'Bản demo lưu sự kiện thô trên máy chủ Mạch Mở tối đa 30 ngày. Thống kê sử dụng mã phiên, đường dẫn trang đã chuẩn hóa và thời gian sự kiện.' : 'Thời hạn giữ dữ liệu phụ thuộc dịch vụ thống kê đang được cấu hình.'}</p>
    <Link to={productRoute('/')}>Về trang chính</Link>
  </article>
}
