# Decision — MOBOT-V2-R7-H3-R1-R5

- Related task/capability: MM-HW-MOBOT-IF-001, MM-HW-MOBOT-REMOTE-KICAD-001, MM-HW-MOBOT-ROBOT-KICAD-001, KIT-05, KIT-06.
- Decision owner: Founder.
- State: decided.
- Date / source of authorization: 05/11/2026, chỉ thị trực tiếp ở HQ xác nhận [founder-decisions.md](claude-support/2026-11-05-mobot-r6/founder-decisions.md).

## Question and evidence

Chọn điểm đặt dòng sạc tay cầm, giới hạn motor và điều kiện nguồn sạc robot.

| Option | Value / cost / risk | Evidence / unknown |
|---|---|---|
| H3 B · 0,40 A, FCI/MF, 2,49 kΩ | CC danh nghĩa ngắn hơn, nhiệt cần kiểm | B15, timer, CV, NTC và nhiệt carrier còn mở |
| R1 A · 0,62 Ω ±1% | Trip tĩnh 0,256–0,391 A, mô-men có thể giảm | L motor, đỉnh quá độ và ngắt kẹt chưa đo |
| R5 A · 1,5 A/3 A, 1,24 kΩ | Giữ mục tiêu sạc 0,50 A khi nguồn đủ, bỏ sạc từ nguồn Default | Nhận diện nguồn, CE/OTG và dòng tổng còn mở |

## Outcome

- Decision / reason: Founder chọn H3 B, R1 A và R5 A với hệ quả nêu trong gói.
- Applies to / does not authorize: Soạn r7 với ba thay đổi. Phê duyệt bytes r7, lease, mua hàng và bench là các bước riêng.
- Affected contracts/tasks: H3 trên tay cầm, R1 và R5 trên robot. Tay cầm đi trước robot.
- Reviewer / required evidence: Box08 tái review độc lập. Hồ sơ NCC, bench và các mục [TBD]/[THIẾU] giữ nguyên.
- Revisit trigger: Dữ liệu pack, BT-R1a hoặc review cho thấy không đạt, hoặc cần thay đổi ngoài ba quyết định.
- Supersedes: Ba mục tương ứng của r6 khi đúng bytes r7 được duyệt.
