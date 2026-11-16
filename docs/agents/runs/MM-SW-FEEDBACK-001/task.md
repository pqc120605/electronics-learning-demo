# Góp ý, báo lỗi và người phát triển

Ngày 16/11/2026 · MM-SW-FEEDBACK-001 · EXP-01/EXP-05, phạm vi trải nghiệm hỗ trợ cục bộ.

Founder chọn form + tải file trước, kết nối kênh gửi sau. Thông tin công khai được xác nhận tại HQ: Chiến Phan; chienpq12.work@gmail.com; https://www.facebook.com/phan.chien.789760/?locale=vi_VN; https://phanquocchien.vercel.app/. Không đưa repo GitHub vào trang người phát triển.

## Thiết kế đã chọn

- Trang `/feedback` và `/app/feedback`, mở từ Trợ giúp hoặc chân trang. Giữ năm nhóm điều hướng chính hiện có.
- Desktop: form bên trái, bản xem trước và thông tin người phát triển bên phải. Mobile: chuyển Viết góp ý / Xem bản góp ý, giữ nguyên nội dung khi chuyển.
- Chọn báo lỗi, góp ý tính năng hoặc bài học; tiêu đề và mô tả bắt buộc; các bước tái hiện, mong đợi, thực tế tùy chọn cho báo lỗi.
- Xem lại, sao chép, tải Markdown. Hiển thị rõ “Chưa gửi”; không có endpoint gửi, không giả thành công, không yêu cầu tài khoản.
- Dùng token màu/chữ hiện hành, monogram CP nhận diện người phát triển; không thêm ảnh hoặc danh tính suy đoán.

## Dữ liệu

Nháp dùng sessionStorage riêng `machmo-feedback-draft-v1`, chỉ bền trong tab theo khả năng trình duyệt; nội dung chưa lưu được vẫn có thể tải từ RAM. Bản không đọc được được giữ nguyên, cho tải bytes gốc, không ghi đè. Không đụng nháp mạch hay schema dự án. Không tự đính kèm tên, email người dùng, code, mạch, query, fragment hoặc dữ liệu thiết bị. Đường dẫn ngữ cảnh chỉ lấy pathname nội bộ. Thông tin liên hệ của founder nằm ở trang; không chèn vào file góp ý của khách.

## Nghiệm thu

Đúng thông tin công khai và không repo; form có giới hạn đầu vào, lỗi liên kết truy cập được; preview văn bản an toàn; tải đúng nội dung/filename; clipboard bị từ chối có hướng dẫn thật; storage hỏng/đầy không làm mất bản gốc; hai route, Trợ giúp/chân trang; bàn phím, 375/1440px, dark/light; kiểm Node, typecheck, build local, browser và review nguồn độc lập theo hash.

Phạm vi ghi nguồn: 10 path trong lease chính thức. Không backend, dependency, gửi thông điệp, publish, hardware hoặc Claude. Lead tích hợp và đóng queue; QA chỉ đọc snapshot.
