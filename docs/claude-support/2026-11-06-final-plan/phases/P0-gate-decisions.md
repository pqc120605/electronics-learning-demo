# P0 · Gỡ gate và chốt quyết định (Sol là chính; Luna chưa có slice)

**Mục tiêu và lý do thứ tự.** Cả hai task KiCad chưa đủ điều kiện lease (gate 4/32), mâu thuẫn tài liệu còn nhiều (`hw-v2-to-starter-gap.md`), và hai quyết định ảnh hưởng toàn bộ phạm vi (V2 có là lõi Starter không; độ tuổi/thị trường quyết định chứng nhận) chưa chốt. Mọi phase sau phụ thuộc phase này.

**Entry (nhị phân).** (1) Baseline đã ghi (`baseline.md`). (2) Founder đã trả lời D1–D4 trong `founder-decisions.md` trước khi bắt đầu slice P0-S02 (kiểm: biên bản có ghi lựa chọn).

**Exit (nhị phân, kèm cách kiểm).**
1. `tasks.json` khớp tài liệu hiện hành: `node docs/agents/validate.mjs` exit 0 và `docs/hardware/supersession.md` liệt kê mọi doc hardware là "hiện hành" hoặc "bị thay".
2. Q1–Q5, Q8 và D1–D4 có biên bản chính thức `*founder-decision*.md` (kiểm: file tồn tại, nêu nguyên văn lựa chọn của founder).
3. Cấu hình mới: file `mission-control/hardware-config-*.json` với `blocking_unknowns` rỗng, status `approved`, `approved_by=user`, `approved_sha256` khớp (kiểm: `validate.mjs`).
4. Box 08 verdict PASS đúng bytes cấu hình (file trong `docs/agents/runs/<task_id>/`).
5. `node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` thoát 0 (lease do lead cấp, không phải slice).
6. Hợp đồng MCU `MM-ESP32-001` có trạng thái an toàn khi reset/brown-out và Box 08 đã review.

**Deliverables.** `docs/hardware/supersession.md`; biên bản quyết định; cấu hình JSON mới; tài liệu hợp đồng MCU; 3 review-request (CP-01 đến CP-03).

**Phụ thuộc HW↔SW.** Kênh điều khiển web (D4) ảnh hưởng P1 SW (K-RUN) và P1 firmware. SW không bị chặn trực tiếp ở P0.

**Quyết định founder cần chốt trước.** D1 (V2 là lõi Starter?), D2 (độ tuổi/thị trường), D3 (phạm vi giọng nói V1), D4 (kênh điều khiển web), D10 (văn bản chấp nhận rủi ro Q4-B), D5/D6/D12 (gate ngspice, định nghĩa L3, thư viện QR) có thể song song.

**Rủi ro và dự phòng.** Founder không đo được mẫu (Q8) nên net map và outline chỉ ở mức ước lượng: dự phòng là thiết kế chịu bất định (header cái dung sai lớn, đường nguồn không phụ thuộc Rd/VIN của clone). Mẫu clone khác lô: mua 2–3 board cùng một listing. Q4-B cần văn bản ký.

**Công sức [ước lượng, độ tin cậy trung bình].** 6–10 phiên Sol, 3 lượt Claude review; 0 phiên Luna. Không đưa lịch ngày.
