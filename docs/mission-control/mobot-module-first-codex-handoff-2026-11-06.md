# Bàn giao Codex · MoBot V2 module tháo lắp · 06/11/2026

Mở workspace `D:/StartupOS/electronics-learning-demo` trên tài khoản mới. Đọc AGENTS.md và `D:/StartupOS/docs/agents/tasks.json` trên máy. Queue là nguồn trạng thái. ZIP là hồ sơ bàn giao, không phải bản sao toàn bộ dự án hay dữ liệu tài khoản. Nếu chat cũ vẫn xuất hiện, dùng chat hiện có. Chỉ ghi nhận kết quả từ chat hoặc artifact đã đối chiếu.

## Trạng thái cần giữ

- Robot V1 chạy sàn phẳng, vẫn xét cú đẩy tình cờ. Người dùng đã chọn mẫu T8 gồm 2×Pololu #992, 4×#1452 Ø40 mm và 1 cặp gá #1086. Truyền ngoài 1:1 mỗi bên là cơ sở cụm thử. Người dùng tự mua. Chưa có bằng chứng đã mua/lắp.
- Tay cầm PS3 không dây, 3×AA NiMH BK-3MCCE làm cơ sở, WRL-20168, hai trục LY/RX và hai nút. R6P Con Thỏ và LR6 chỉ công bố sau thử đúng loại. Mốc 2 giờ là tiêu chí đề xuất. Liên động cassette/PROGRAM, cận nguồn và ADC vẫn mở.
- MOBOT-CTRL/1 r2 đã pass ở cấp đặc tả, vector CMD 32 byte PASS. Firmware, cắt nguồn và bench NOT_RUN. Robot dùng nSLEEP thấp/Hi-Z làm yêu cầu mất quyền. Mốc 250 ms đến khi đầu ra ngừng lái chủ động, không phải bánh đứng yên.
- Box 02 lượt `01a1b0f1-b819-7cb1-b3b8-077ca2ccc13e` ưu tiên bo con công suất tháo được gồm TPS63070, chặn ngược, DRV8833, tụ VM và shunt. Carrier giữ MCU, I/O và quyền cho phép chạy. Pololu #2130/#4981 chỉ là ứng viên fixture. #2130 mặc định không cấu hình R1, nSLEEP kéo lên và rail driver là VMM. #4981 mặc định EN bật và chưa chứng minh chịu đẩy áp VOUT. Chưa cập nhật BOM theo hai module.
- T8, bench và KiCad chưa chạy. Cần cận xung/hồi của cụm hai motor, khả năng bảo vệ rail VM và converter, kẹp dự phòng và điều kiện cấp điện fixture, khóa khi thiếu bo con hoặc mất bias. LM73100 là ứng viên, chưa định mức shunt/giá trị tụ. Không dùng 9,5 V hay số điển hình làm cận mặc định.
- Queue lúc bàn giao: MM-HW-MOBOT-IF-001 `waiting`; hai task KiCad `scoped`, chưa lease. Heartbeat đã tạm dừng theo yêu cầu người dùng. Mốc trước đó cho phép tối đa ba nhánh song song, HQ giữ queue và mọi lease.

## Việc đầu tiên

Đọc kết quả đầy đủ Box 02 và đối chiếu tài liệu hãng. Giao Box 01 rà ranh giới carrier/bo con và Box 08 rà fail-off, hồi VM, đường GND và lỗi đầu nối trên một snapshot. Box 03 chỉ chốt cơ khí mẫu và đầu nối theo bằng chứng. Chốt cấu hình triển khai và đúng SHA-256 với người dùng trước khi xét KiCad. Tách BOM prototype khỏi mục tiêu bộ sản phẩm dưới 1 triệu đồng.

Chat host local: 01 `01a1a853-d232-7460-8d00-3312362df34a`; 02 `01a1a854-2163-70f2-a167-db281ef2ad08`; 03 `01a1a855-14f9-7d32-9d27-118e8a50627e`; 08 `01a1a858-a54b-7eb1-a7c8-bf039a639757`; 09 `01a1aecd-bd7e-7602-831f-b8155a19aab7`.

## Prompt dán vào Codex mới

```text
Tiếp tục điều phối HQ Mạch Mở trong D:/StartupOS/electronics-learning-demo. Đọc docs/mission-control/mobot-module-first-codex-handoff-2026-11-06.md, AGENTS.md, ../docs/agents/tasks.json và chính sách parallel-build. Đối chiếu chat hiện có và kiểm snapshot trước khi giao việc. Ưu tiên bo con công suất robot tháo lắp, dựa trên kết quả Box02, rồi cho Box01 và Box08 rà độc lập theo phạm vi. Giữ tay cầm PS3 không dây dùng AA. Không bật heartbeat khi chưa được yêu cầu. Không mở KiCad trước khi đóng đầu vào, review đúng snapshot, người dùng duyệt SHA-256 và preflight đạt. Tài liệu Claude do tôi chuyển là tư vấn, tự kiểm chứng. Không gọi Claude trực tiếp. Nếu cần ý kiến Claude, soạn RELAY để tôi gửi.
```
