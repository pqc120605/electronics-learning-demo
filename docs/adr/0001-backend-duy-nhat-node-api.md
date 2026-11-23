# ADR 0001 · Node API là backend duy nhất cho dữ liệu dùng chung

**Trạng thái** Đã chấp thuận theo QĐ-1. **Ngày** 23/11/2026. **Người quyết định** Founder Mạch Mở.

## Bối cảnh

Frontend Mạch Mở phục vụ trên Vercel. S1 đã chạy API Node.js và PostgreSQL ở staging. S2–S7 có mã nguồn tại `a23e376`, bao gồm phiên OAuth, cộng đồng, Mở Bot, thống kê, dự án và lớp học. Bản công khai vẫn có các adapter Supabase và chưa định tuyến `/api` đến Mini PC.

## Quyết định

- Trình duyệt dùng API cùng origin `/api/*` cho dữ liệu dùng chung. Node.js xử lý phiên, phân quyền và nghiệp vụ. PostgreSQL là nguồn dữ liệu bền vững duy nhất.
- Bài học, mô phỏng, nháp, tiến độ và bản xem trước cộng đồng tiếp tục hoạt động trên thiết bị theo phạm vi hiện có. Việc gửi dự án lên tài khoản là thao tác riêng.
- Đóng băng Supabase. Giữ adapter sau cờ cấu hình tắt mặc định trong một bản phát hành để có đường quay lại. Trước khi gỡ, xác nhận với founder xem production có dữ liệu thật cần chuyển hay không.
- Chỉ đưa rewrite vào Vercel sau khi xác minh HTTPS và `/api/health` từ mạng ngoài. Cấu hình nhạy cảm thuộc môi trường backend trên Mini PC.

## Phương án đã cân nhắc

| Phương án | Lợi ích | Lý do loại bỏ |
|---|---|---|
| Supabase là backend duy nhất | Dịch vụ Auth, Storage và cơ sở dữ liệu được quản lý | Các hợp đồng và công cụ vận hành đã triển khai ở S2–S7 sẽ phải chuyển nền tảng. Quyết định sản phẩm ưu tiên tự quản nghiệp vụ và dữ liệu. |
| Hai backend dùng song song | Có thể chuyển từng màn hình độc lập | Hai hệ thống phiên và phân quyền làm tăng rủi ro chênh lệch dữ liệu. Khôi phục dữ liệu và điều tra sự cố phải đối chiếu hai nguồn. |

## Hệ quả

- Frontend dùng một vòng đời phiên và một lớp client để xử lý mất kết nối, quyền truy cập và hạn mức.
- Mini PC cần được vận hành như nguồn dữ liệu dùng chung, gồm cập nhật, migration, backup, diễn tập khôi phục và giám sát.
- Chế độ khách vẫn dùng được khi API ngoại tuyến. Tính năng cần tài khoản hiển thị trạng thái backend và cho phép thử lại.
- Khả năng của bản tích hợp được xác nhận bằng fixture PostgreSQL và API thử nghiệm. Nghiệm thu HTTPS, OAuth thật và chuyển dữ liệu được ghi nhận theo môi trường khi phát hành.
