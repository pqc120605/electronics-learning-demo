import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useProductRoute } from '../lib/useProductRoute'
import { selfHostedAnalyticsEnabled } from '../lib/analytics'
import { useAuth } from '../lib/auth'
import { deleteSelfHostedAccount, selfHostedOAuthEnabled } from '../lib/selfHostedAuth'
import { siteFeedbackEnabled } from '../lib/backendMode'

function AccountPrivacy() {
  const auth = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <>
    <h2>Tài khoản và cộng đồng online</h2>
    <p>Mạch Mở lưu định danh từ Google hoặc GitHub, tên hiển thị, ảnh đại diện và phiên đăng nhập. Tên và ảnh đại diện đi kèm bài viết. Bạn có thể xóa tài khoản, phiên và nội dung cộng đồng của tài khoản tại đây. Bản sao lưu máy chủ có thể còn giữ dữ liệu đến khi đến lượt thay.</p>
    <p>Project lưu lên tài khoản và lớp online được giữ trên máy chủ khi bạn chọn lưu hoặc nộp bài. Giáo viên của lớp thấy tên hiển thị và tiến độ nộp bài trong lớp. Project chỉ xuất hiện trong thư viện chung khi bạn chọn đăng công khai. Những bản sao đã tải về thiết bị khác vẫn do người giữ thiết bị quản lý.</p>
    {auth.status === 'signed-in' && <button type="button" disabled={busy} onClick={async () => {
      if (!window.confirm('Xóa tài khoản cùng bài viết, bình luận và phiên đăng nhập trên máy chủ?')) return
      setBusy(true)
      setMessage('')
      try { await deleteSelfHostedAccount(); setMessage('Đã xóa tài khoản và nội dung trên máy chủ.') }
      catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Không xóa được tài khoản.') }
      finally { setBusy(false) }
    }}>Xóa tài khoản</button>}
    {message && <p role="status">{message}</p>}
  </>
}

export function PrivacyPage() {
  const productRoute = useProductRoute()
  return <article className="route-placeholder">
    <p className="eyebrow">MẠCH MỞ · QUYỀN RIÊNG TƯ</p>
    <h1>Quyền riêng tư</h1>
    <h2>Dữ liệu lưu trên thiết bị</h2>
    <p>Workspace, bản nháp, project, bài vừa mở trong lộ trình và checklist tự xác nhận được lưu trong bộ nhớ trình duyệt trên thiết bị bạn đang dùng. Dữ liệu học này không được đồng bộ tài khoản và checklist không xác minh bạn đã chạy mạch thật. Xóa dữ liệu trang web của trình duyệt có thể xóa các mục này; hãy xuất project để giữ bản sao project.</p>
    <p>Sau lần mở có mạng, trình duyệt có thể dùng lại các phần đã tải như khung ứng dụng, mô hình 3D và bộ giải SPICE khi ngoại tuyến. Tính năng tài khoản, cộng đồng online và nhà cung cấp AI từ xa cần kết nối mạng.</p>
    {selfHostedOAuthEnabled && <AccountPrivacy />}
    {selfHostedAnalyticsEnabled && <p>Khi bạn xác minh quyền xem dashboard, Mạch Mở dùng email đã xác minh từ Google hoặc email chính đã xác minh từ GitHub để đối chiếu danh sách được cấp quyền. Phiên quản trị chỉ lưu mã xác minh trong tối đa 8 giờ. Ứng dụng không lưu email gốc trong cơ sở dữ liệu tài khoản.</p>}
    {siteFeedbackEnabled && <>
      <h2>Góp ý cho Mạch Mở</h2>
      <p>Khi bạn chọn gửi, máy chủ lưu nội dung đã điền, đánh giá tự chọn, thời điểm và mã gửi ngẫu nhiên để tránh ghi trùng. Góp ý không gắn với tài khoản và chỉ quản trị viên xem được. Nội dung được xóa định kỳ sau 180 ngày. Bản sao lưu có thể giữ dữ liệu tới kỳ thay bản sao.</p>
    </>}
    <h2>Hỏi Mở</h2>
    <p>Tra cứu dùng nội dung sẵn trong ứng dụng. Khi chọn gửi ở mục Hỏi AI, dịch vụ đang cấu hình xử lý câu hỏi, tối đa hai lượt hỏi đáp gần nhất và trích đoạn tra cứu. Nếu dùng OpenAI, các dữ liệu đó được chuyển tới OpenAI để tạo câu trả lời. Tùy chọn ngữ cảnh chỉ thêm thông tin board, loại linh kiện và chân đang chọn. Mạch Mở không đính kèm tên tài khoản, email, tệp, code trong editor hoặc toàn bộ bản nháp. Hội thoại hiện tại được xóa khi thoát mục này hoặc đổi ngữ cảnh. Đánh giá hữu ích được lưu trên thiết bị.</p>
    <h2>Thống kê sử dụng</h2>
    <p>Nếu dịch vụ thống kê được cấu hình, Mạch Mở gửi lượt xem trang, mở bài, chọn linh kiện, sao chép code và bắt đầu chạy mô phỏng cùng mã phiên ngẫu nhiên trong tab. Mã code, tên, email và nội dung project không được gửi trong các sự kiện này. Khi chưa cấu hình dịch vụ, các sự kiện không được gửi.</p>
    <p>Bạn có thể đóng tab để kết thúc phiên.</p>
    {selfHostedAnalyticsEnabled && <p>Thống kê tự quản dùng mã phiên ngẫu nhiên trong tab, nhóm kích thước màn hình, tên miền giới thiệu và mã bài/board đã biết. Máy chủ giữ sự kiện tối đa 90 ngày và số liệu gộp theo ngày tối đa 13 tháng. Thao tác đánh dấu hoàn thành là tự khai báo.</p>}
    {selfHostedOAuthEnabled && <p>Khi Hỏi AI yêu cầu tài khoản, backend lưu bộ đếm theo tài khoản và theo ngày. Nhật ký kỹ thuật giữ trạng thái, model, thời gian, token và đánh giá tối đa 90 ngày. Nội dung hội thoại không ghi trong nhật ký. Khi dùng OpenAI, định danh giả danh được tạo từ mã nội bộ để hỗ trợ kiểm soát lạm dụng.</p>}
    <Link to={productRoute('/')}>Về trang chính</Link>
  </article>
}
