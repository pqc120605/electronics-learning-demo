# Web · Bàn giao tiếp theo

Hai lượt lập phương án ở box 01 và 06 dừng do giới hạn sử dụng. HQ đã kiểm tra các điểm tích hợp dưới đây. Đây là đầu vào cho lượt tiếp theo; chỉ HQ cấp lease sau khi kiểm tra snapshot và khả năng chạy của box nhận việc.

## Catalog điện trở · CAT-03/04/05

MM-CAT-R-001 đã qua QA và 32 kiểm thử độc lập. `src/pages/ComponentsPage.tsx` đang mở chi tiết theo query `component` và hiển thị mô hình cấp họ. Ưu tiên lát UI nhỏ trong trang đó, tái dùng dữ liệu biến thể từ registry và `resolveResistorVariant`. Giữ deep link `component=resistor`, hiển thị 220 Ω và 10 kΩ, nguồn từng biến thể và trạng thái chưa rõ của thông số vật lý. Giữ thông tin geometry tham chiếu tách khỏi khả năng mô phỏng. Dùng điều khiển HTML có nhãn, dùng được bằng bàn phím và màn hẹp. Giữ nguyên hành vi deep link, bộ lọc và các họ khác. Trước lease, chốt đường dẫn CSS hoặc tệp kiểm thử nếu thật sự cần. Nghiệm thu theo link trực tiếp, bàn phím, hiển thị cả hai biến thể và kiểm hồi quy catalog. Ghi trạng thái thực tế của phép thử browser.

## Capture firmware Uno R3 · MM-RUN-001/P08

Điểm nối hiện tại là `src/pages/FirmwareHexToolPage.tsx`, `src/lib/firmwareWorkflow.ts` và `tests/firmware-workflow.test.mjs`. CSV hiện có source, target, signal, simulated_ms, cycles, level và trace_truncated. Lát tiếp theo gắn bản ghi với digest tệp HEX đã chạy, target được xác nhận, AVR8js và timebase mô phỏng. Chốt định nghĩa byte/hash và vòng đời artifact trước khi cấp lease, giữ cột CSV hiện có. Xóa hoặc khóa kết quả cũ khi đổi artifact/target, và không cho lượt bị hủy xuất như một lượt hoàn tất. Dùng fixture Uno R3 D13 đã đối chiếu bằng Node. Kiểm riêng browser và giới hạn provider; phạm vi chỉ dành cho đường chạy AVR có sẵn.

Khi quota hồi phục, giao từng lát cho box 05 sau khi hoàn tất preflight. Nếu cần quyết định UX hoặc contract cụ thể, tiếp tục lượt chỉ đọc tương ứng ở box 06 hoặc 01. Kiểm tra trạng thái live trước khi giao để tránh chạy trùng.
