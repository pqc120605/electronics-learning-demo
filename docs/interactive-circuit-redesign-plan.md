# Kế hoạch triển khai: Mạch 3D tương tác và giao diện Mạch Mở

**Cơ sở:** `interactive-circuit-redesign-spec.md` đã được founder xác nhận.  
**Phạm vi mã nguồn:** Chỉ `electronics-learning-demo`; không sửa ứng dụng ReTrack chính.

## Giai đoạn 1 — Rà soát hiện trạng

1. Xác định các vùng CSS dùng chung, trạng thái bước bài học, thông tin linh kiện, và cấu trúc SVG hiện tại.
2. Giữ lại hành vi route, analytics, admin/login và nội dung kỹ thuật đang dùng được.
3. Kiểm tra dependency 3D phù hợp với React/Vite hiện có và xác định phương án cài đặt trong môi trường hiện tại.

**Kết quả:** bản đồ file cần sửa/thêm. Do không có thư viện 3D sẵn và không thể kiểm tra cài package qua môi trường hiện tại, dùng HTML/CSS 3D tương tác làm renderer cho demo; có thể thay renderer sau mà không đổi dữ liệu bài học.

## Giai đoạn 2 — Dựng mô hình mạch 3D

1. Tạo renderer CSS 3D tương tác cho board ESP32, breadboard, điện trở, LED và jumper.
2. Tạo dữ liệu linh kiện dùng chung gồm tên, vai trò, chân liên quan, nội dung giải thích và điểm neo chọn trên mô hình.
3. Đồng bộ chọn mesh, chọn từ danh sách, inspector và trạng thái bước học.
4. Thêm nút xoay phương vị, đổi góc nhìn, zoom/reset, highlight dây/linh kiện theo bước và nhãn GPIO/GND.
5. Giữ mô hình dạng DOM chọn được và nội dung accessible; không tuyên bố có giả lập điện.

**Kết quả:** bài học có thể khám phá mạch bằng model và điều khiển DOM tương đương.

## Giai đoạn 3 — Tổ chức lại trải nghiệm bài học

1. Chuyển trang bài học thành bố cục model + inspector + danh sách bước.
2. Biên tập nội dung thành các bước: nhận diện linh kiện, GPIO, LED/điện trở, GND, luồng hoạt động.
3. Làm rõ giới hạn “minh họa 3D”, trạng thái chọn và cảnh báo ngắt USB trước khi đổi dây.
4. Bảo đảm điều khiển dùng được bằng bàn phím và touch, có focus-visible và hỗ trợ reduced motion.

**Kết quả:** người mới có thể đi từ quan sát đến hiểu đường hoạt động của mạch.

## Giai đoạn 4 — Áp dụng hệ thống thị giác mới

1. Cập nhật design tokens sang nền navy, bề mặt xanh than, chữ sáng và cyan tiết chế.
2. Đồng bộ header/footer, trang khám phá, bài học, trạng thái admin/login và component dùng chung.
3. Thay các hình trang trí 2D trên trang khám phá bằng minh họa phù hợp với hướng kỹ thuật mới; giữ nguyên nội dung/đường dẫn đang hoạt động.
4. Tinh chỉnh desktop, tablet và mobile; tránh che điểm tương tác trên canvas.

**Kết quả:** toàn demo nhất quán với screenshot tham chiếu, trưởng thành và dễ quét nội dung.

## Giai đoạn 5 — Kiểm tra hoàn thiện

1. Chạy build production hiện có để tìm lỗi TypeScript/bundling.
2. Mở demo ở desktop và kích thước mobile; rà luồng home → lesson → quay lại.
3. Thử chọn mỗi linh kiện, đổi bước, camera controls, keyboard focus và trường hợp fallback nếu có thể mô phỏng.
4. Rà soát riêng các route admin/login và hiển thị console/lỗi runtime.
5. Ghi lại hạn chế còn lại, đặc biệt việc chưa có mô phỏng điện và độ chính xác CAD.

**Tiêu chí hoàn tất:** đạt các tiêu chí nghiệm thu trong đặc tả, build thành công, các route hiện có còn dùng được và tương tác chính hoạt động.

## Rủi ro/điểm cần xử lý trong lúc làm

- Ruling: dùng HTML/CSS 3D thay thư viện WebGL — trong `node_modules` của demo chưa có thư viện 3D và không thể mở preview localhost từ sandbox để xem renderer WebGL; CSS 3D vẫn cung cấp mô hình chọn được và điều khiển góc nhìn, không cần package mới — chi phí nếu sai: model không đạt độ chi tiết/độ thật kỳ vọng và cần thay renderer trước khi mở rộng sản phẩm.
- Mô hình cần rõ về bố cục hơn là bóng bẩy; độ chính xác kết nối và giải thích được ưu tiên hơn hiệu ứng.
- Nếu canvas 3D gây giảm khả năng đọc trên mobile, chuyển sang canvas cao hơn và inspector phía dưới thay vì cố giữ bố cục hai cột.

# SUPERSEDED

The implementation direction in this plan has been superseded by the approved real PCB viewer plan: [`docs/superpowers/plans/2026-10-29-esp32-real-pcb-viewer.md`](../../docs/superpowers/plans/2026-10-29-esp32-real-pcb-viewer.md). Keep this file for historical context only; do not use its CSS-built board model as the current product direction.

