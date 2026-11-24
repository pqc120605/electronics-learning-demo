# ADR 0002 · Dashboard cho nhiều website

**Ngày** 24/11/2026

**Phạm vi** Mở rộng khu quản trị của Mạch Mở với Node API và PostgreSQL theo [ADR 0001](0001-backend-duy-nhat-node-api.md).

## Quyết định

Chủ dự án đăng nhập một lần ở `/admin` để xem danh sách website và mở báo cáo riêng từng web. Mạch Mở tiếp tục đọc số liệu gốc, gồm tài khoản, hoạt động xem trang, cộng đồng, AI, góp ý và Mini PC. Các web khác đứng độc lập về tài khoản và dữ liệu nghiệp vụ. Backend của chúng gửi bản tổng hợp theo ngày và góp ý người dùng đã chọn gửi. Không có tổng người dùng duy nhất xuyên các website.

| Phương án | Hệ quả |
| --- | --- |
| Backend từng web đẩy dữ liệu theo cùng hợp đồng | Dùng được với nhiều công nghệ. Hệ thống trung tâm không cần tài khoản DB của web khác. Từng web cần thêm tác vụ gửi. |
| Dashboard gọi trực tiếp API từng web | Lấy được dữ liệu tức thời nhưng phụ thuộc API của từng web mỗi lần mở dashboard. |
| Các web dùng chung cơ sở dữ liệu tài khoản | Số liệu đi trực tiếp nhưng làm các web phụ thuộc cùng schema và quyết định định danh. |

## Dữ liệu và quyền

- Đăng ký web bằng mã cố định, tên, HTTPS origin và SHA-256 của khóa gửi. Một khóa chỉ dùng cho một mã web. URL chỉ dùng để hiển thị.
- Các bản tổng hợp gồm ngày theo giờ Việt Nam, phiên bản bản ghi, trạng thái do web báo và các số đếm sẵn có. Máy chủ nhận ghi thời điểm nhận. Dữ liệu chưa gửi hoặc bỏ trống hiện là chưa có. Dashboard đánh dấu sau 26 giờ không có bản tổng hợp mới. Đây là thông tin đồng bộ, không phải phép đo uptime độc lập.
- Góp ý được lưu theo mã web. Website gửi nội dung đã được người dùng chủ động chia sẻ, kèm điểm sao nếu có. Hợp đồng không có trường tên, email, IP hoặc ID tài khoản. Người gửi cần bỏ thông tin riêng tư khỏi văn bản trước khi gửi.
- Quản trị viên hiện có xem toàn bộ danh sách web. Khóa gửi chỉ ghi cho một web và không cấp quyền đọc dashboard. Quyền theo từng nhóm quản trị sẽ cần thiết khi có nhiều chủ sở hữu.
- PostgreSQL giữ bản tổng hợp của web kết nối tối đa 13 tháng theo tháng Việt Nam, góp ý tối đa 180 ngày. Mạch Mở giữ nguyên quy tắc lưu hiện có. Khi gỡ một web khỏi danh sách cấu hình, báo cáo của web đó ngừng hiển thị.

## Các bước triển khai và kiểm chứng

1. Thêm migration 009 và các tuyến nhận bản tổng hợp, nhận góp ý. Kiểm một khóa không dùng được cho web thứ hai và bản gửi cũ không thay bản mới.
2. Thêm tuyến danh sách và báo cáo theo website sau kiểm quyền quản trị. Kiểm hai bộ dữ liệu cùng ngày có kết quả độc lập.
3. Thêm chọn website trong `/admin`, hiển thị trạng thái đồng bộ, số liệu và góp ý của website đang chọn. Kiểm chuyển website trên desktop và mobile.
4. Triển khai backend và các tuyến Caddy trước. Khi triển khai frontend hướng dẫn tích hợp web mới theo [hợp đồng kết nối](../deployment/dashboard-nhieu-website.md).
