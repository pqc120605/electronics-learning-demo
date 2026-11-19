# Mini-project đèn cảnh báo · 19/11/2026

[Đối chiếu kế hoạch và phiếu thử với người mới](../../../software/local-learning/2026-11-18-roadmap-local-finish.md)

- Mở từ trang Nền tảng hoặc `/app/learn/mini-project`. Chọn Uno R3, Nano classic hoặc Mega 2560. Đặt ngưỡng, nhấn nút, thử dây GND hở và xem D2 → điều kiện với A0 → D9 → LED. Sơ đồ lấy cùng net của mạch, có ký hiệu biến trở ba chân và tô tín hiệu HIGH.
- Hồ sơ gồm ID, board, mạch, code mẫu, nguồn mô hình, dự đoán, kết quả và ghi chú. Một hồ sơ đang làm được lưu trên trình duyệt. Tải bản sao tạo ID mới. Nhập file cần xác nhận và tái kiểm mạch, code, ánh xạ chân, kết quả. Bản lưu không hỗ trợ được giữ để tải về. Xung đột cập nhật để dữ liệu của tab khác nguyên vẹn.
- Nguồn kết quả là mô hình logic giáo dục. Sơ đồ và code đối chiếu một cấu hình của bài. Số liệu đánh giá với người mới còn chờ lượt thực tế.

## Nghiệm thu

- [Mười file với SHA-256](snapshot-reviewed.json), [review độc lập PASS](review.md).
- `npm.cmd run typecheck` exit 0. [Lệnh build và log unit/E2E](verification.json).
- `npm.cmd test` exit 0, 771 đạt, 0 lỗi/skip. Sau khi bổ sung ký hiệu, 17 ca unit tập trung về mini-project, schematic và Serial đạt.
- Lượt Chromium cuối qua lệnh chuẩn `npm.cmd run test:e2e -- e2e/local-capstone.spec.mjs e2e/freestyle-serial-plot.spec.mjs e2e/freestyle-waveform-measure.spec.mjs e2e/offline.spec.mjs` exit 0, 8/8. Hai ca mini-project kiểm bàn phím, khớp net, đọc tín hiệu, copy, reload, import, xung đột và lưu nháp độc lập ở 375/1440 px.
- Ảnh bản kiểm Chromium [375 px](mini-project-375.png) và [1440 px](mini-project-1440.png).
