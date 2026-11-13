import { Link } from 'react-router-dom'
import { useProductRoute } from '../lib/useProductRoute'

export function PrivacyPage() {
  const productRoute = useProductRoute()
  return <article className="route-placeholder">
    <p className="eyebrow">MẠCH MỞ · QUYỀN RIÊNG TƯ</p>
    <h1>Quyền riêng tư</h1>
    <h2>Dữ liệu lưu trên thiết bị</h2>
    <p>Workspace, bản nháp, project, bài vừa mở trong lộ trình và checklist tự xác nhận được lưu trong bộ nhớ trình duyệt trên thiết bị bạn đang dùng. Dữ liệu học này không được đồng bộ tài khoản và checklist không xác minh bạn đã chạy mạch thật. Xóa dữ liệu trang web của trình duyệt có thể xóa các mục này; hãy xuất project để giữ bản sao project.</p>
    <h2>Thống kê sử dụng</h2>
    <p>Nếu dịch vụ thống kê được cấu hình, Mạch Mở gửi lượt xem trang, mở bài, chọn linh kiện, sao chép code và bắt đầu chạy mô phỏng cùng mã phiên ngẫu nhiên trong tab. Mã code, tên, email và nội dung project không được gửi trong các sự kiện này. Khi chưa cấu hình dịch vụ, các sự kiện không được gửi.</p>
    <p>Bạn có thể đóng tab để kết thúc phiên. Chính sách này mô tả hành vi của phiên bản hiện tại; việc lưu trữ hoặc thời hạn giữ dữ liệu phía dịch vụ cần được xác nhận theo cấu hình triển khai.</p>
    <Link to={productRoute('/')}>Về trang chính</Link>
  </article>
}
