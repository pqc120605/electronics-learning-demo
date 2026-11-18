# Findings & Decisions

## Requirements
- User yêu cầu đóng vai tester/người dùng thật, đi hết các tính năng/model, chụp ảnh và phân loại lỗi/chưa hoạt động/bất tiện.
- Không sửa mã trong lượt audit. Không lấy việc render thành công để xác nhận phần cứng thật.

## Research Findings
- 5320 đang phục vụ production bundle index-B5Lz7MFp.js; phải ghi rõ build được kiểm và so với source.
- Trang chủ có bàn trống, 8 lựa chọn board nhanh, 4 preset, 4 view, onboarding 7 bước và menu trợ giúp.
- Chưa có browser pageerror thu được; đã lắp listener pageerror/requestfailed/HTTP400+ cho lượt kiểm.
- Source inventory đang tách riêng: catalog 28 board so với targets mô phỏng; cần runtime kiểm khả năng/giới hạn.
- Đã mở 28/28 hồ sơ board, 16/16 viewer tải được, 12 lookup không có canvas; chưa có pageerror/HTTP4xx. Có 59/59 component cards, 45/45 viewer 3D tải được.
- CONFIRMED: catalog capacitor là tụ gốm nhưng Lắp thử thêm capacitor1 tụ hóa 100µF có phân cực (issue-capacitor-*).
- CONFIRMED: đổi explorer ESP32 lesson sang Uno đổi URL sang /app/learn/blink, không giữ explorer năm tab (issue-lesson-board-*).
- CONFIRMED GAP: Blue Pill/Nucleo freestyle 2D bỏ w1/w2 và 3D báo thiếu 2 đầu dây; có diagnostic rõ, schematic và trace logic vẫn chạy. Không gọi là đã hỗ trợ hoàn chỉnh lắp dây theo hình.
- 8 lựa chọn freestyle đã kiểm view; ESP/STM32 có trace interpreter, Pico có dữ liệu; Uno đã chờ biên dịch và thấy arduino-cli + avr8js chạy, Serial và LED sáng. Macro đầu chuyển trang quá sớm ở Nano/Mega làm compile bị abort: chưa kết luận hai engine đó đạt/chưa đạt.
- Chọn radio hai STM32 bằng auto pointer locator bị timeout stability; đường bàn phím focus+Space hoạt động. Không quy timeout automation thành lỗi người dùng khi chưa tái hiện chuột thật.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
- docs/reviews/2026-11-16-web-user-audit/screenshots/001-home-desktop.png
- docs/reviews/2026-11-16-web-user-audit/snapshot-before.json (462 file source/model/e2e)


## Kết luận bàn giao
Nguồn chuẩn về finding là ../../findings.json và ../../report.md. Các giới hạn chưa thử ở ../../coverage.md; không coi checksum/render là xác nhận hình học/điện học. F01 đã sửa câu chữ: tag100nF không phải trị số chốt. F08 có ảnh ổn định, không dùng frame chuyển route trống làm lỗi. Unit đỏ được giữ nguyên, không skip.
