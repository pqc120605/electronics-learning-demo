# P1 · Local core web + firmware nền (Luna cho web; Sol cho phần cứng/firmware và các slice CẦN SOL)

**Mục tiêu và lý do thứ tự.** Web chưa tin được (e2e 25/28, lỗi lưu nháp bị nuốt, test/typecheck không ổn định có lúc), và repo chưa có firmware ESP32 nào. Local-first là ràng buộc cứng, nên nền xanh và codec lưu project đi trước mọi tính năng Starter. Tay cầm đi trước robot vì robot phụ thuộc schematic tay cầm (tasks.json: ROBOT-KICAD phụ thuộc REMOTE-KICAD).

**Entry.** P0 Exit 1–6 đạt (kiểm bằng `validate.mjs` và biên bản). SW slice (Luna) không phụ thuộc P0, có thể bắt đầu sớm.

**Exit (nhị phân).**
1. `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local` đều exit 0; e2e 28/28 (hoặc NOT_RUN có lý do môi trường).
2. Lỗi lưu nháp có cảnh báo `role="status"`; nối chân dùng được bằng bàn phím ở SchematicView và Assembly3DView; service worker có tên cache theo phiên bản; `tsconfig.app.json` bật `strict` mà typecheck vẫn exit 0.
3. Schematic tay cầm tồn tại trong path lease, ERC không lỗi chặn (kiểm: `kicad-cli` exit 0 hoặc danh sách lỗi có chủ), Box 08 review.
4. Tài liệu kiến trúc nguồn robot Type-C có bảng đại lượng T8 và Box 08 review (chưa lease robot).
5. Khung firmware ESP32 build exit 0 bằng toolchain founder đã duyệt; trạng thái an toàn khi reset: `MCU_MOT_EN` thấp (kiểm bằng review mã + mô phỏng, không flash).
6. Các slice CẦN SOL (codec project, K-RUN, spike ESP32 runtime, cổng ngspice) có thiết kế được Claude review; chưa bắt buộc code.

**Deliverables.** 5 patch Luna nhỏ; schematic tay cầm; tài liệu robot Type-C; khung firmware; 4 thiết kế CẦN SOL (prompt viết ở phiên sau).

**Phụ thuộc HW↔SW.** K-RUN (kênh quan sát, điều khiển robot qua web) phụ thuộc quyết định D4 và hợp đồng MCU; firmware nền phụ thuộc cấu hình phần cứng được duyệt. SW fix (Luna) độc lập.

**Quyết định founder cần chốt trước.** D4 (kênh điều khiển), D12 (QR: thư viện hay tự viết), D6 (L3=D3), duyệt toolchain firmware (D13), duyệt hash cấu hình (P0).

**Rủi ro và dự phòng.** (1) Chưa có toolchain firmware trên máy (không thấy `avr-gcc`/`arduino-cli`/`pio` trên PATH): dừng và hỏi founder, không tự cài. (2) E2E cần trình duyệt có thể bị chặn bởi môi trường: ghi NOT_RUN, không báo đạt. (3) `CircuitBuilderPage.tsx` rất lớn (135 KB): giới hạn sửa trong vài dòng, không refactor.

**Công sức [ước lượng, độ tin cậy thấp–trung bình].** Luna: 5 slice ≈ 5–8 phiên; Sol: 6–12 phiên (schematic, tài liệu robot, khung firmware, 4 thiết kế CẦN SOL); 4–6 lượt Claude review.
