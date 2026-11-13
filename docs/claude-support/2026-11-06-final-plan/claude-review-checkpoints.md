# Checkpoint Claude review

Tất cả báo cáo Codex phải ghi tại `docs/agents/runs/<task_id>/review-request.md` (mục tiêu, file đã đổi, lệnh + kết quả, câu hỏi cụ thể, scope ≤10 đường dẫn) và thêm khối RELAY CODEX → CLAUDE (REVIEW_REQUEST) vào nhật ký phiên. Task DỪNG tới khi founder dán REVIEW_RESULT và Codex đã ghi DISPOSITION.

| Checkpoint | Slice | Trigger | File báo cáo Codex phải ghi |
|---|---|---|---|
| CP-01 | P0-S02 | trước chốt hardware-config | `runs/<MM-HW-MOBOT-IF-001>/review-request.md` |
| CP-02 | P0-S03 | task firmware P1 + slice cuối P0 | `runs/MM-ESP32-001/review-request.md` |
| CP-03 | P1-S01 | KiCad schematic tay cầm (trước đề nghị mở lease robot) | `runs/MM-HW-MOBOT-REMOTE-KICAD-001/review-request.md` |
| CP-04 | P1-S02 | nguồn/pin/an toàn robot | `runs/MM-HW-MOBOT-ROBOT-KICAD-001/review-request.md` |
| CP-05 | P1-S03 | mọi task P1 firmware | `runs/MM-ESP32-001/review-request.md` (bản firmware) |
| CP-06 | P1-X01 | đổi schema dữ liệu lưu | `runs/<task_id>/review-request.md` |
| CP-07 | P1-X02 | kiến trúc ảnh hưởng ≥2 module (K-RUN) | `runs/<task_id>/review-request.md` |
| CP-08 | P1-X04 | ngay trước `build:public` | `runs/<task_id>/review-request.md` |
| CP-09 | P1-R01 | slice cuối của phase P1 | `runs/<task_id>/review-request.md` |
| CP-10 | P2-S02 | kiến trúc ≥2 module (chân mở rộng/mic) | `runs/<task_id>/review-request.md` |
| CP-11 | P2-S05 | khóa BOM | `runs/MM-BOM-001/review-request.md` |
| CP-12 | P2-S03, P2-S04 | trước gửi PCB đi sản xuất | `runs/<task_id>/review-request.md` |
| CP-13 | P3-S01 | slice cuối nhóm cơ khí | `runs/<task_id>/review-request.md` |
| CP-14 | P4-S01 | kênh điều khiển robot qua web | `runs/<task_id>/review-request.md` |
| CP-15 | P4-S02 | micro/giọng nói | `runs/<task_id>/review-request.md` |
| CP-16 | mọi slice chạm đăng nhập, tài khoản, dữ liệu trẻ em | bảo mật/dữ liệu trẻ em | `runs/<task_id>/review-request.md` |
| CP-17 | P5-S01 | an toàn nguồn/pin sau bench | `runs/<task_id>/review-request.md` |
| CP-18 | P6-S01 | ngay trước `build:public` | `runs/<task_id>/review-request.md` |
| CP-19 | P7-S01, P8-S01, P8-S02 | slice cuối phase / kiến trúc ≥2 module | `runs/<task_id>/review-request.md` |
| CP-20 | slice cuối mỗi phase P2–P8 chưa có dòng riêng | cuối phase | `runs/<task_id>/review-request.md` |
