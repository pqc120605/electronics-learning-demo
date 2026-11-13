# Decision log · quyết định founder cho founder-questions.md (06/11b)

Bối cảnh: `prompt-2026-11-06b-resolve-blockers.md` còn nguyên các ô `[Q1]`…`[Q7]`. Không có câu trả lời nào của founder để trích. Tôi không trả lời thay founder, nên mọi Qn dưới đây là **CHƯA TRẢ LỜI** và các bước phụ thuộc bị bỏ qua.

## Quyết định đã chốt từ trước (không mở lại)

| ID | Quyết định | Nguồn | Gate bị ảnh hưởng |
|---|---|---|---|
| D0-1 | UVLO robot falling 6,40–6,60 V, TLV6700 loại | prompt 06/11b; `claude-support/2026-11-06-pcb-status/final/final-values.md:132-133` | Robot UVLO (CHỐT) |
| D0-2 | Board là mẫu 30 chân USB-C đã chụp, họ CH340; CH340C chỉ là ứng viên | prompt 06/11b; `tasks.json:2423`; EV:5 | Mẫu board, suffix, kích thước |
| D0-3 | H3 0,40 A, R1 0,62 Ω, R5 chỉ sạc khi 1,5/3 A | r7:7-9; FD:5-6 | Sạc, motor |

## Qn

| Qn | Chủ đề | Câu trả lời founder (nguyên văn) | Phương án khuyến nghị trong founder-questions.md | Trạng thái | Gate bị ảnh hưởng | Doc cũ bị thay (nếu chọn) |
|---|---|---|---|---|---|---|
| Q1 | Mẫu đã chụp thay WRL-20168 cho tay cầm? | *(trống)* | A: mẫu đã chụp cho cả hai | **CHƯA TRẢ LỜI** | Mẫu board, BOM variant, pin map, footprint | WRL-20168 (CS, WR, GR) nếu A |
| Q2 | Kiến trúc nguồn tay cầm | *(trống)* | A: kiến trúc v1 (cáp RUN OUT) | **CHƯA TRẢ LỜI** | Power tree, USB topology, IF-001 | CP phần Q_ISO→VIN, LM66100 + interposer r6/r7 nếu A |
| Q3 | Pack và nguồn tay cầm | *(trống)* | A: Jauch 250832 | **CHƯA TRẢ LỜI** | Pack, connector, H3 | LK37478, 3×AA nếu A |
| Q4 | `blocking_unknowns` phải rỗng | *(trống)* | B: tách `verification_items` | **CHƯA TRẢ LỜI** | Cấu hình JSON, lease | r7 dạng `.md` nếu B |
| Q5 | Số lớp PCB | *(trống)* | B: 4 lớp cả hai | **CHƯA TRẢ LỜI** | Stackup, DRC, nhiệt | Giả định 2 lớp KS7:259 nếu B |
| Q6 | Robot chờ tay cầm? | *(trống)* | B: kiến trúc robot song song, lease sau | **CHƯA TRẢ LỜI** | Lease ROBOT | Không |
| Q7 | Pack B04 và cửa sổ NTC | *(trống)* | A: giữ B04, cắt sạc 0–45 °C | **CHƯA TRẢ LỜI** | Pack B04, TS robot | Không |

## Hệ quả

- Q1, Q2, Q4 đều trống nên theo stop condition của prompt chỉ làm bước 2 (nhánh có thể), 3 và 4. Bước 5 (hardware-config nháp) và phần phụ thuộc của bước 6 không làm; lý do ở `codex-handoff-2026-11-06b.md`.
- Founder điền các ô sẽ cho phép chạy lại các bước còn lại.
