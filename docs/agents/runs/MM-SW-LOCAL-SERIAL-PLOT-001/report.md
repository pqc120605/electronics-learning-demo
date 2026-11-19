# Serial Plotter local · 19/11/2026

- Mở đồ thị cạnh Serial Monitor trong tab Quan sát ở `/build/freestyle`. Mẫu từ dòng Serial hoàn chỉnh như `42` hoặc `sensor:42`. Giữ log gốc, hiển thị tối đa 256 mẫu và bốn chuỗi. Xem bảng hoặc tải CSV. Trục X là thứ tự mẫu; mẫu thiếu giữ trống.
- Ghi nguồn runtime hiện hành. Dừng giữ mẫu; chạy lại hoặc sửa board, code, mạch sẽ xóa đồ thị cũ. Popup dạng sóng vẫn xuất hiện theo luồng mặc định. Khi đồ thị Serial đang hiện, dạng sóng đã thu có thể mở từ dock.
- [Sáu file với SHA-256](snapshot-reviewed.json), [review độc lập PASS](review.md).

## Nghiệm thu

- `npm.cmd run typecheck` exit 0. [Lệnh build và log unit/E2E](verification.json).
- `npm.cmd test` exit 0, 771 đạt, 0 lỗi/skip. Lượt unit tập trung cuối 17/17, gồm parser, render và schematic.
- Lượt Chromium cuối qua lệnh chuẩn `npm.cmd run test:e2e -- e2e/local-capstone.spec.mjs e2e/freestyle-serial-plot.spec.mjs e2e/freestyle-waveform-measure.spec.mjs e2e/offline.spec.mjs` exit 0, 8/8. Hai ca Serial kiểm dữ liệu, CSV, bàn phím, Axe, reset và mở đồ thị khi chuyển từ Code sang Quan sát ở 375/1440 px. Lượt hồi quy trước đó đạt ca Uno biên dịch bằng arduino-cli rồi chạy trên avr8js và ca Pico chạy MicroPython trên rp2040js.
- Ảnh bản kiểm Chromium [375 px](serial-plot-375.png) và [1440 px](serial-plot-1440.png).
