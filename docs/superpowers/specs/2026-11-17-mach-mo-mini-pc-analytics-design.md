# Mạch Mở — thống kê demo trên mini PC

**Trạng thái:** đề xuất để duyệt. Chưa sửa ứng dụng, cài backend hay triển khai.

Mục tiêu đợt đầu là xem được số lượt mở trang, phiên theo tab và hoạt động học trên bản demo. Dữ liệu mới lưu trên mini PC. Phạm vi nghiệm thu là một bản thử nghiệm của **OPS-05**, từ theo dõi năm loại sự kiện trong mã nguồn đến kiểm chứng ghi, đọc và khôi phục trên server. Chưa tuyên bố đạt toàn bộ OPS-05 D3, vì chưa đo kết quả hoặc tiến trình học.

## Kiến trúc đề xuất

```text
Trình duyệt → Tailscale Funnel → Caddy → web Mạch Mở hiện tại
                                     → API ghi sự kiện → PostgreSQL
Laptop quản trị → SSH → dashboard và API đọc tổng hợp trên localhost
```

- Caddy chỉ chuyển một endpoint công khai cùng tên miền, `POST /api/analytics/events`, đến dịch vụ ghi sự kiện. PostgreSQL, dịch vụ đọc thống kê và thông tin kết nối database chỉ dùng nội bộ. Dashboard quản trị được mở qua đường SSH riêng, sau khi xác minh đường chuyển tiếp khả dụng trên máy.
- Giữ logic trình bày của `AdminDashboardPage` và kiểu số liệu tổng hợp hiện tại. Thay bộ lấy dữ liệu cho bản cài nội bộ. Giữ đường dẫn học tập và luồng khách cục bộ của ứng dụng. Luồng quản trị Supabase hiện có có thể tiếp tục dùng ở bản cấu hình Supabase.
- Giữ PostgreSQL theo hướng hạ tầng đã trao đổi trước, để sau này dùng cho metadata dự án. Dùng API nhỏ cho phạm vi thống kê, không cần cả bộ Supabase Auth, Storage và Realtime ở lượt này. Nếu cần sớm chạy đăng nhập Google và cộng đồng trực tuyến, tự host một bản Supabase đã chọn thành phần là một hướng riêng, cần kiểm tra dữ liệu, cấu hình Auth và tải máy.

## Dữ liệu và quyền truy cập

- Giữ năm sự kiện `page_view`, `lesson_open`, `component_select`, `code_copy`, `builder_run`. Chỉ nhận trường trong hợp đồng. Dùng đường dẫn chuẩn hoặc ID từ danh mục route, mã phiên ngẫu nhiên trong tab, ID linh kiện nằm trong danh sách cho phép, và thời gian do server ghi. Không lưu IP, query string, nguồn code, nội dung mạch, tên hay email người học vào bảng sự kiện. Thông báo người dùng về phạm vi thu thập ở bản demo.
- API giới hạn kích thước mỗi yêu cầu và tốc độ ghi trên toàn dịch vụ cũng như trên mỗi phiên. Sự kiện sai trả lỗi mà không ghi. Khi API lỗi, người học vẫn dùng web và bản nháp như trước. Các số liệu là lượt sự kiện và phiên ước tính, không dùng để xác định người duy nhất hoặc kết luận ai đã hoàn thành bài.
- Dùng schema và tài khoản DB riêng với quyền tối thiểu cho ứng dụng. Dữ liệu thô giữ 30 ngày theo cấu hình thử nghiệm rồi tự xóa. Dashboard hiển thị dữ liệu từ ngày cấu hình được bật. Chưa nhập dữ liệu Supabase hiện có nếu chưa kiểm tra có dữ liệu nào cần chuyển.

## Nghiệm thu và vận hành

1. Kiểm tra một lượt mở trang, mở bài và chạy mạch trên demo HTTPS, rồi đối chiếu từng sự kiện trong dashboard riêng. Xác nhận các URL đọc báo cáo và cổng PostgreSQL không truy cập được qua Funnel.
2. Thử yêu cầu sai loại, vượt kích thước và quá tốc độ. Xác nhận dashboard lọc ngày theo giờ Việt Nam và web vẫn dùng được khi dịch vụ ghi dừng.
3. Giữ cổng kiểm tra bản phát hành ngspice. Trước khi đưa thay đổi lên link demo, sao lưu cấu hình Caddy và giữ bản web trước trên máy. Nếu có lỗi, tắt route ghi sự kiện rồi chuyển về bản web trước. Sao lưu database và chạy thử khôi phục với bản sao dữ liệu. Bản sao trên cùng SSD chỉ hỗ trợ phục hồi logic, không bảo vệ khi hỏng ổ.
4. Cần quyền quản trị Arch để cài hoặc cấu hình PostgreSQL nếu máy chưa có. Khóa SSH tạm của lượt triển khai web đã thu hồi, nên quyền truy cập máy sẽ được thiết lập lại ở bước triển khai. Xác nhận gói, dung lượng và đo tải thật trước khi cam kết mức truy cập đồng thời.

## Đợt sau

- **Đăng nhập và cộng đồng.** Xác minh quyền tài khoản, schema dùng chung, quyền ghi/đọc và vận hành trên ít nhất hai tài khoản. Luồng preview cục bộ hiện có cần phân biệt rõ với cộng đồng trực tuyến. Theo dõi công việc hiện hữu `MM-SW-COMMUNITY-LIVE-001` trước khi đổi backend của nhánh này.
- **Lưu, chia sẻ và đồng bộ dự án.** Thiết kế riêng cho nhóm PRJ-06/07. Chỉ gửi lên server khi người dùng chọn lưu hoặc chia sẻ. Giữ nguyên danh tính dự án, `partId`/`pinId`, revision, bản nháp và khả năng khôi phục. Thêm kho file riêng khi có loại file và quyền truy cập đã chốt.
- **Dịch vụ Arduino.** Endpoint công cụ cục bộ của môi trường phát triển không thuộc đợt này. Biên dịch trên server cần phạm vi riêng cho isolation, giới hạn tài nguyên và chính sách xử lý mã người học.
