# Tổng hợp review và kế hoạch cập nhật Mạch Mở · 24/11/2026

Đối chiếu báo cáo hệ thống của Claude, báo cáo 28 lỗi khi dùng web và audit production của Codex. Mốc code `d83667a`. Bằng chứng Codex gồm 33 đường dẫn, 13 thao tác thực tế và một lượt hồi quy local có ca Arduino Mega đạt khi chạy riêng.

| Hạng mục | Kết luận sau khi đối chiếu | Xử lý và bằng chứng cần có |
| --- | --- | --- |
| Hệ thống P0-1 | `origin/main` lưu tại máy đã chứa `d83667a`, có API rewrite. Nhánh `main` local còn ở `7c27fbb`. | Bổ sung kiểm tra thứ tự rewrite và CI để chống tái phát. Xác minh production branch tại Vercel khi có quyền xem cấu hình. |
| Hệ thống P1-1 và UX #14 | Hai review live đều thấy dự án, lớp học và AI trả 404. AI còn chạy cấu hình mock. | Đưa Caddyfile vào repo. Kiểm luồng dự án và lớp học, giữ kiểm tra quyền ở Node. Chỉ mở chat AI khi có provider thực đã kiểm. |
| Hệ thống P1-2, P1-3 | Backup hiện được cấu hình local. Chưa đo 429 và chưa xác minh nguồn danh tính client đáng tin qua proxy. | Chốt kho backup ngoài máy và thử phục hồi. Kiểm cấu hình trên Mini PC trước khi thay limiter. |
| Hệ thống P1-4, P2-2, UX #25 | CI web chưa có. Thiếu trang 404 tĩnh tiếng Việt, title dashboard sai và thiếu phòng nhúng trang. | CI chạy web và Node API. Dùng trang 404 đã chuẩn bị ở `e1438d2`. Thử tiêu đề và headers trên Preview. |
| Hệ thống P2-1, P2-3–6 | Kiểm duyệt đang chặn ở edge. Supabase cũ đã có quyết định bỏ sau khi bản Node API ổn định. Tên unit staging đang phục vụ production. | Giữ phân quyền và quy trình gỡ legacy có hồi quy riêng. Khảo sát unit, log và backup trên Mini PC. |
| UX #1–2, #20 | Đã dựng snapshot để kiểm cấu hình mẫu. Nút nhấn và DHT22 đều dùng GPIO34 như review. Mẫu bàn phím 4×4 cũng dùng GPIO34 với INPUT_PULLUP. Mẫu biến trở dùng GPIO34 theo vai trò ADC. | Chuẩn bị bản đề xuất, cần duyệt đúng revision trước khi đổi chân. |
| UX #3–4, #8–9 | Pico mặc định MicroPython cần dịch vụ local. Nhãn board Arduino ghi biên dịch ngay cả khi chưa có công cụ. | Mặc định bản mẫu Pico chạy Arduino C++ rút gọn. Giữ bản nháp Python và giải thích điều kiện, giữ biên dịch thật khi có công cụ. |
| UX #5, #22–23 | Hai hoạt động cuối dùng chung một board nên chấm lại hoạt động trước với ngữ cảnh khác. Còn vấn đề nội dung và nhãn chân. | Nhớ board theo hoạt động, đọc lại phiên cũ. Kiểm riêng nội dung và nhãn kỹ thuật. |
| UX #6–7, #19, #21 | Sai số thực/kiểu số, tín hiệu khởi động và mốc serial cần fixture runtime. | Tái hiện theo runtime từng board rồi sửa riêng, tránh đổi semantics toàn bộ parser dựa trên một kết quả. |
| UX #10–12, #16, #24 | Có phản ánh về khôi phục nháp, thao tác bị che, trạng thái bước và ảnh logo. | Giữ bản gốc có thể xuất, kiểm riêng bố cục 375 và 1024 px. |
| UX #13–15, #27 | Tìm không dấu chưa hỗ trợ, copy có chữ nội bộ, trạng thái rỗng thiếu ngữ cảnh. | Sửa tìm board/linh kiện và thông báo thường gặp. |
| UX #17–18, #28 | Máy tính và SPICE cần kiểm phạm vi, cách giải thích model và định dạng. | Kiểm công thức/fixture và hành vi ở 1024 px. |
| UX #26 và audit Codex | Kết quả tải góp ý local và tính năng gửi online khác nhau theo cấu hình. Còn thiếu xác minh inbox bằng tài khoản thật, đính kèm cộng đồng, lưu tiến độ bài robot và ingest từ web thứ hai. | Kiểm với API local và tài khoản được cấp quyền, sau đó nghiệm thu thật với dữ liệu thử đã thống nhất. |

## Đợt triển khai đầu tiên

- Online dự án và lớp học (D2). Tạo mẫu Caddy với tuyến đã giới hạn, kiểm matcher và probe trước khi áp dụng. Giữ cách phục hồi Caddyfile cũ.
- CI và phát hành. Ghim kiểm tra cấu hình Vercel cùng một test chống thiếu tuyến. Bảo toàn cổng phát hành ngspice.
- LRN-06 (D2). Board theo hoạt động độc lập, phiên cũ vẫn đọc được và bằng chứng chấm theo board đúng.
- WRK và CAT-06 (D2). Sửa lựa chọn runtime Pico, nhãn trạng thái, tìm kiếm không dấu, các thông báo trang rỗng và tiêu đề.
- Chạy test đích, typecheck, Node API và build public. Ghi kết quả thực tế cuối báo cáo.

## Thay đổi đã đưa vào bản sửa

| Mục | Thay đổi |
| --- | --- |
| Proxy | Một mẫu cấu hình Caddy trong `server/api/production-edge.mjs`. Tuyến dự án, thư viện chia sẻ, lớp học đi qua Node API. Khách vẫn chịu kiểm tra phiên và quyền. Giữ tuyến kiểm duyệt cộng đồng ở ngoài matcher. Nếu chưa bật AI, status cho biết tra cứu đang là lựa chọn khả dụng. |
| Phát hành | CI cho pull request và `main`, chạy test web, test API, typecheck, build public và xác thực hai chế độ Caddy. Build chặn thiếu, trùng hoặc đặt sai thứ tự rewrite `/api`. Có trang 404 tiếng Việt và header chống nhúng trang. |
| Học | Giữ lựa chọn board riêng cho hai hoạt động có board và đọc được phiên học cũ. Bài robot lưu dấu hoàn thành trong trình duyệt. |
| Runtime | Pico dùng Arduino C++ rút gọn cho mẫu mới. Bản nháp MicroPython giữ nguyên code. Dịch vụ cục bộ có sẵn thì nhãn và lựa chọn runtime phản ánh đúng khả năng. Mức đầu vào của mạch được gửi trước bước mô phỏng đầu. |
| Serial | Số thực dùng tham số thứ hai làm độ chính xác, số nguyên vẫn hỗ trợ BIN/OCT/HEX. Mô hình của Uno, Nano và Mega thu hẹp biến `int` về 16 bit khi lưu. Tràn số nguyên có dấu vẫn là hành vi không xác định trong C++ thực. [Mã nguồn Arduino AVR Print](https://github.com/arduino/ArduinoCore-avr/blob/master/cores/arduino/Print.cpp) |
| Trải nghiệm | Tìm linh kiện theo công dụng, bỏ phân biệt dấu tiếng Việt và dấu gạch ở tên model. Giải thích điều kiện để chạy mạch, sửa tiêu đề dashboard và trang chia sẻ, giảm chữ nội bộ, sửa thông báo cộng đồng khi chưa có bài. |
| Nháp | Nếu hai bản trước giống hệt nội dung và chỉ khác thời gian cập nhật, dùng lại bản lưu cũ. Bản khác nhau vẫn được giữ và có thể tải. |

## Nghiệm thu triển khai

1. Publish ứng viên lên GitHub và kiểm CI với đúng commit. Tại Vercel Preview, kiểm trang lỗi, tiêu đề dashboard và headers. `git ls-remote origin refs/heads/main` và [release production](https://mach-mo.vercel.app/release.json) đã cùng trả `d83667ac9bcc4ada2528bca1fdb9b1259402f426` trong lượt này.
2. Trên Mini PC, chạy `bash server/api/deploy-dashboard-edge.sh <SHA đã kiểm>` từ checkout đúng mã. Script xác thực Caddy, sao lưu database và cấu hình đang chạy, kiểm health, bảo vệ dashboard và lối vào dự án/lớp học. Lỗi kiểm sau khi thay edge sẽ phục hồi Caddyfile trước đó.
3. Từ ngoài Mini PC, kiểm `/api/health` và `/api/projects/gallery` trả 200, khách vào `/api/projects`, `/api/classes` và `/api/admin/sites` trả 401. Kiểm với tài khoản thật việc đăng nhập, lưu dự án, chia sẻ, tham gia lớp, nộp bài, gửi góp ý và đọc inbox.
4. Khi chọn và cấu hình một provider thực, kiểm health báo `openai` hoặc `ollama`, rồi mới chạy script với `--enable-ai`. Đo thời gian trả lời qua Vercel. Provider mock chỉ phục vụ kiểm thử.
5. Backup ngoài máy, cấu hình nhận IP tin cậy cho limiter, đính kèm cộng đồng và gỡ Supabase cần đợt kiểm riêng. Với mẫu ESP32, GPIO34–39 chỉ là input và không có pull-up/pull-down điều khiển nội. Chưa đổi pin của mạch mẫu trong đợt này. [Tài liệu GPIO Espressif](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html)

## Bằng chứng kiểm tra


- `npm.cmd test` đạt 827/827. Các ca mới kiểm rewrite Vercel, cấu hình edge, tiến độ board theo hoạt động, số thực Serial, bề rộng `int` của AVR, mẫu Pico và lưu lại bản nháp.
- `node --test server/api/*.test.mjs` đạt 31, bỏ qua 1 ca cần PostgreSQL fixture và biến `MACHMO_S2_TEST_PG_PORT`.
- `npm.cmd run typecheck`, `npm.cmd run build:public` và `bash -n` cho hai script triển khai đều đạt. Build còn hai cảnh báo sẵn có liên quan đến `rp2040js` và import `builderLessons`.
- Chrome đạt 4/4 ca mới. Chuỗi kiểm gồm chạy mẫu Pico, đầu vào nút nhấn/ADC, tìm không dấu và lưu bài robot sau tải lại cùng tiêu đề dashboard.
- Caddy 2.10.2 chính thức đã đối chiếu SHA-512. Cả hai cấu hình qua `caddy validate`, rồi kiểm chuyển tiếp đường dẫn và query qua Caddy thật với API giả trên loopback. [Bản phát hành Caddy](https://github.com/caddyserver/caddy/releases/tag/v2.10.2)
- Production vẫn ở `d83667a`. Lượt kiểm cuối ghi nhận health 200 với `db: ready`, `ai: mock`, dashboard chặn khách 401, còn dự án, lớp học và AI status trả 404. Lượt này chưa đưa thay đổi lên GitHub, Mini PC hoặc Vercel, và chưa kiểm các thao tác ghi bằng tài khoản thật.
