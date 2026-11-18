# Mạch Mở — xử lý 16 lỗi từ đợt kiểm thử người dùng

Đợt sửa ngày 17/11/2026 xử lý các lỗi đã tái hiện trong audit, gồm 2 lỗi P1, 10 lỗi P2 và 4 lỗi P3. Hai lỗi P1 làm người học mở nhầm linh kiện và thấy mạch thiếu dây trong khi phần kiểm tra báo đạt. [Audit gốc](../../../reviews/2026-11-16-web-user-audit/report.md).

| ID | Kết quả sau sửa | Bằng chứng |
| --- | --- | --- |
| F01 | Thẻ tụ gốm chỉ mở thực hành khi có đúng linh kiện trong registry. Tụ hóa vẫn mở đúng mẫu phân cực. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/issue-capacitor-freestyle.png) · [Tụ gốm](screenshots/F01-ceramic.png) · [Tụ hóa](screenshots/F01-electrolytic.png) |
| F02 | Breadboard bài nút nhấn hiển thị đủ 6 dây. G6 đối chiếu đường đi 2D và 3D, vẫn cảnh báo dây có nhiều hơn 3 góc theo R8. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/issue-button-route-diagnostic.png) · [Đủ dây](screenshots/F02-F11-six-wires-final.png) · [G6](screenshots/F02-g6-final.png) |
| F03 | Kéo chậm 40 bước từ `bb1:3a` sang `bb1:4a` tạo đúng một jumper. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/fresh-drag-20.png) · [Sau](screenshots/F03-slow-drag-final.png) |
| F04 | Trình xem Arduino hướng dẫn chọn chân bằng danh sách. Chọn trực tiếp trên 3D cần vị trí pad đã xác minh. | [Sau](screenshots/F04-mega-picking.png) |
| F05 | Arduino Mega hiện các chân PWM D2–D13 và D44–D46, cùng chức năng UART D14–D19 theo tài liệu hãng. | [D3/PWM](screenshots/F05-D3.png) · [D18/TX1](screenshots/F05-D18.png) · [Pinout Arduino](https://docs.arduino.cc/resources/pinouts/A000067-full-pinout.pdf) |
| F06 | Bảng pad/net ESP32-S3 hiển thị đúng nguồn Espressif PADS V1.1 của board đang mở. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/s3-pad-source.png) · [Sau](screenshots/F06-S3-source.png) |
| F07 | Nucleo và Blue Pill ghi rõ trình xem có mô hình dựng lại để học, kèm giới hạn về mẫu và revision. | [Blue Pill](screenshots/F07-blue-pill-final.png) · [Nucleo](screenshots/F09-stm32-nucleo.png) |
| F08 | Chọn Uno để tham khảo giữ bài LED ESP32, năm tab và board thực thi ESP32. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/issue-lesson-board-after-stable.png) · [Sau](screenshots/F08-reference-board-final-stable.png) |
| F09 | Link thực hành của Nano, Mega, Nucleo và mười loại linh kiện dùng đúng ID mà bàn tự do nhận. Link cũ theo ID của bàn vẫn mở được. | [Nano](screenshots/F09-arduino-nano-classic.png) · [Mega](screenshots/F09-arduino-mega-2560-r3.png) · [Nucleo](screenshots/F09-stm32-nucleo.png) |
| F10 | Mobile có chế độ làm việc để cuộn và phóng to mạch, cùng nút vừa khung cho cái nhìn toàn cảnh. Ở 375 px, điểm bấm trong bàn tự do đạt khoảng 24,64 CSS px. Lỗ đang có chân vẫn chọn được bằng bàn phím hoặc lưới chi tiết. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/mobile-canvas-after-hide-panel.png) · [Làm việc](screenshots/F10-mobile-working-final.png) · [Toàn cảnh](screenshots/F10-mobile-overview-final.png) · [Bản đồ điểm bấm](evidence/browser-toolbar-keyboard-final.json) |
| F11 | Thông tin nguồn trace theo khả năng hiện tại. Mục kiểm tra có thể thu gọn và tự mở khi có lỗi. | [Bài nút nhấn](screenshots/F02-F11-six-wires-final.png) |
| F12 | Câu hỏi về chạy firmware ESP32 trong SPICE nhận đúng giải thích về phạm vi của SPICE. Câu hỏi phụ thuộc chân và định mức vẫn yêu cầu đúng biến thể board. | [Trước](../../../reviews/2026-11-16-web-user-audit/screenshots/guide-question-03.png) · [Sau](screenshots/F12-answer-final.png) |
| F13 | Hash nguồn mô hình Arduino lấy từ asset lock. Unit test so trực tiếp với byte GLB và các node có mesh. | [Kiểm tra provenance](../../../../tests/audit-catalog-fixes.test.mjs) |
| F14 | Tab trình duyệt dùng tên bài khám phá robot thay cho tên trang lỗi. | [Bài robot](screenshots/F14-title-final.png) |
| F15 | Nhập 0 trạm hiển thị lỗi và giữ số trạm hợp lệ đã lưu. Khi nhập số nguyên từ 1 đến 100, người dùng có thể cập nhật và xuất danh sách. | [Sau](screenshots/F15-validation-final.png) |
| F16 | Mẫu motor có nguồn tải lý tưởng riêng, GND chung và diode song song ngược chiều. Bản nháp thiếu bảo vệ được cảnh báo và giữ nguyên nội dung. | [Mẫu mới](screenshots/F16-motor-protection-final.png) · [Bản nháp cũ](screenshots/F16-legacy-motor-preserved-final.png) |

Mỗi mục có mã, cách xử lý và đường dẫn kiểm thử. [Disposition](disposition.json) · [Review độc lập](review.md) · [SHA-256 của 26 tệp](review-snapshot-5.json).

## Kiểm chứng

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0 |
| `npm.cmd test` | Exit 0, **696/696**, 0 skip |
| `npm.cmd run build:local` | Exit 0 |
| `npm.cmd run test:e2e` | Exit 0, **200/200**, 0 skip, 15,8 phút |

Kết quả từng lệnh và snapshot tương ứng nằm trong [verification.json](verification.json). Trình duyệt dùng bản production local và Chromium. Hai hành trình sửa dây đã qua ở 1440×900 và 375×812. Ảnh thủ công lấy trong phiên thử riêng. Bộ E2E chuẩn cũng tạo lại ảnh tại các đường dẫn bằng chứng đã có sẵn trong các ca cũ. [Kích thước và SHA-256 của 28 ảnh đợt này](evidence/screenshot-integrity.json).

Lượt E2E đầu phát hiện hai hồi quy do bản sửa điểm bấm và thanh zoom. Lỗ đang có chân được giữ trong luồng bàn phím, còn thanh zoom nằm phía trên khung cuộn để chân VCC nhận được cú bấm. E2E sau đó tái hiện một jumper nằm phía trên vùng nhìn thấy của pane. Sau khi cuộn, 80/99 điểm mẫu trúng dây và bấm, chỉnh, xóa dây thành công. Ca E2E thêm bước cuộn và giữ nguyên kiểm tra chọn đúng dây và số dây sau xóa. Ca ultrasonic 3D qua khi chạy riêng sau khi một lượt hết thời gian ở bước đóng browser context. [Bằng chứng cuộn và chọn dây](evidence/browser-wire-viewport.json).

## Phạm vi còn cần xác minh

Board Arduino và STM32 vẫn cần dữ liệu vị trí chân được đối chiếu với đúng revision để mở rộng chọn trên model và hiển thị dây theo pad. Breadboard 400 lỗ và nguồn tải motor là mô hình dạy học. Mobile đã kiểm bằng viewport giả lập. Các mục về Supabase online, mô phỏng firmware ngoại vi, chuyển CircuitDocV2 sang SPICE và phép đo board thật nằm trong danh sách giới hạn của audit gốc. [Giới hạn G01–G07](../../../reviews/2026-11-16-web-user-audit/report.md#5-phần-chưa-hoạt-động-đầy-đủ-và-giới-hạn-model).

Hai task audit đã ở trạng thái `done` với cổng software đạt và lease đã trả. Mười tệp SPICE do lượt riêng cập nhật được ghi trong `externalDrift`. Lệnh kiểm queue toàn dự án exit 1 do lỗi dữ liệu từ hai task riêng `MM-SPICE-SELFBUILD-20261117` và `MM-ARCH-DEPLOY-20261117`. [Log queue](../../../../.tmp/agent-checks/MM-SW-AUDIT-FIX-20261117/queue-final.log).
