# Phiên đăng nhập tự quản

Môi trường thử tài khoản chạy cùng origin HTTPS. Tài khoản thử dùng tên hiển thị và mã mời dùng một lần. Cơ sở dữ liệu chỉ giữ hash của mã mời và phiên. Phiên có thời hạn tám giờ, dùng cookie HttpOnly và có thể thu hồi tại máy chủ. Nội dung học và bản nháp tiếp tục dùng được ở chế độ khách.

## Chạy riêng trên Mini PC

1. Tạo cơ sở dữ liệu riêng và role đăng nhập `machmo_community_app`. Chủ cơ sở dữ liệu áp dụng các tệp SQL trong `migrations/` theo thứ tự. Tách role cấp lời mời khỏi role chạy ứng dụng. Giới hạn truy cập PostgreSQL qua Unix socket riêng.
2. Cài gói Node theo `package-lock.json` trong thư mục này khi chuẩn bị dịch vụ. Đặt `PGHOST` là đường dẫn socket cùng `PGDATABASE`, `PGUSER`, `MACHMO_COMMUNITY_ORIGIN` là origin HTTPS và tùy chọn `MACHMO_COMMUNITY_PORT` mặc định 8191. Chạy `node main.mjs` dưới user dịch vụ. Tiêu chuẩn khởi động là kết nối được DB và đúng schema.
3. Proxy chính xác ba route `/api/session`, `/api/session/redeem` và `/api/session/logout` tới loopback. Chuyển Host gốc và tắt cache. Giữ API nội bộ ngoài scope route này. Dùng `VITE_MACHMO_SELF_HOSTED_AUTH=true` cho bản staging và để trống cả hai biến Supabase. Bản khách dùng mặc định của web.
4. Tạo lời mời từ kênh vận hành riêng với token ngẫu nhiên 32 byte dạng base64url. Ghi digest SHA-256, account ID, ngày hết hạn vào bảng `invites`. Chuyển mã cho tester qua kênh riêng được duyệt. Rà hạn lưu phiên và định kỳ xóa phiên/mã đã hết hạn bằng tác vụ vận hành.

## Kiểm thử

Đặt `MACHMO_TEST_COMMUNITY_DB` và `MACHMO_TEST_COMMUNITY_OWNER_DB` vào DB cô lập có migration rồi chạy `node --test session.test.mjs`. Bộ kiểm dùng hai tài khoản, kiểm mã đã dùng, mã hết hạn, origin, quyền của role dịch vụ và thu hồi phiên. Quy trình mở pilot còn cần API lưu và phân quyền bài nháp, kiểm duyệt và kiểm hai thiết bị trước khi cho cộng đồng đăng online.
