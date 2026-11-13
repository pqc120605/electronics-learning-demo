# Câu hỏi cho founder (tối đa 5) — NHÁP qua Leader Claude

Các quyết định thuộc scope/chi phí/license; reviewer không tự chốt. Mỗi câu có phương án và khuyến nghị.

## Q1 — Lối ra cho ngspice WASM trước khi public (WA-12)
`check:public-release` đang chặn vì thiếu source commit, recipe/toolchain, inventory thành phần và review gắn hash.
- **A.** Đóng 5 điều kiện bằng bằng chứng (rebuild có ghi lại, hoặc xác nhận nguồn). Giữ SPICE ở bản public. Chậm, cần công sức EF/pháp lý.
- **B.** Bản public tạm loại SPICE; `dev`/`build:local` giữ nguyên. Nhanh, mất tính năng nổi bật ở bản public.
- **C.** Thay engine (nghiên cứu P09 CircuitJS hoặc khác). Tốn công, cần đánh giá license riêng.
- **Khuyến nghị: B ngay, song song A.** Không chặn việc học cục bộ và không tuyên bố binary được cấp phép khi chưa có bằng chứng.

## Q2 — ESP32 chạy thế nào (WA-10)
ESP32 là board học chính nhưng không có runtime; AVR chạy được qua avr8js.
- **A.** Giữ scenario/subset cho ESP32, AVR cho firmware thật. Rẻ, nhưng "firmware ESP32" chỉ là mô hình giáo dục.
- **B.** Thêm handoff `.ino`/Arduino IDE (đã có xuất `.ino`) và nạp thật ngoài ứng dụng. Giữ local-first, không native.
- **C.** Nghiên cứu QEMU/Renode cục bộ (P24/P25). Chưa chắc hỗ trợ đúng board/peripheral; cần spike.
- **Khuyến nghị: A + B ngay, C chỉ là spike nghiên cứu** có tiêu chí pin phiên bản/target/license trước khi cam kết.

## Q3 — AI hỗ trợ (OPS-06/07)
Hiện D0. Trợ lý đám mây cần mạng và có thể cần khóa API; hiệu quả giáo dục chưa kiểm chứng.
- **A.** Chỉ hướng dẫn theo luật cục bộ (mở rộng `builderGuidance`), không AI sinh nội dung.
- **B.** AI tùy chọn dùng khóa của người dùng, tắt mặc định, sau lớp K-CLOUD.
- **C.** Hoãn hẳn.
- **Khuyến nghị: A trong G-B, B chỉ sau G-C và khi có quyết định về dữ liệu người học.** Không để bản local phụ thuộc AI.

## Q4 — Tài khoản và lớp học
Supabase hiện chỉ có analytics/admin; lớp học là gói tệp cục bộ (share pack, CSV).
- **A.** Giữ lớp học offline bằng tệp qua hết G-B (gói giáo viên, nộp bài bằng xuất tệp).
- **B.** Bắt đầu schema lớp/nhiệm vụ trên Supabase.
- **Khuyến nghị: A.** Bắt buộc local-first; tài khoản là tùy chọn bật sau, không chặn lớp học dùng được.

## Q5 — Thư viện bên thứ ba cho đo/biểu đồ và trình soạn code
Các slice 05 (cursor/đo) và firmware đa file có thể muốn thư viện chart/FFT/editor.
- **A.** Không thêm dependency; tự viết SVG và hàm đo.
- **B.** Cho phép thư viện đã duyệt license (đề xuất từng cái kèm license/kích thước).
- **Khuyến nghị: A cho G-A.** Chỉ hỏi lại ở G-B nếu FFT/Bode thật sự cần.
