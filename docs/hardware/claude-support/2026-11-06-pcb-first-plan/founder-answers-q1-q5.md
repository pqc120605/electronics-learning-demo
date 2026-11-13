# Câu trả lời founder Q1–Q5 · 2026-11-06

Nguồn: tin nhắn của founder trong phiên Leader Claude, nguyên văn "Đồng ý Q1–Q5", trả lời cho khuyến nghị trong `docs/claude-support/logs/2026-11-06-1801.md` và `docs/hardware/claude-support/2026-11-06-pcb-gate/founder-questions.md`.

Đây là ghi chép của Claude về lời founder trong chat, **chưa phải biên bản duyệt chính thức**. Codex cần ghi lại vào `*founder-decision*.md` hoặc `tasks.json` theo quy trình.

| Câu | Đã chọn | Nội dung |
|---|---|---|
| Q1 | A | Mẫu 30 chân USB-C họ CH340 đã chụp dùng cho cả hai carrier. WRL-20168 và Beetrona 02030089 chỉ là tham chiếu. |
| Q2 | A | Kiến trúc nguồn tay cầm v1: carrier không cấp VIN, cáp RUN OUT, cổng USB-C của DevKit là đường cấp nguồn duy nhất. |
| Q3 | A | Pack tay cầm Jauch 250832 Rev. 1.2. |
| Q4 | B | Tách `verification_items` (đo sau PCB) khỏi `blocking_unknowns`; founder chấp nhận rủi ro bằng văn bản; Box 08 review từng mục trước layout. |
| Q5 | B | 4 lớp cho cả hai board ở mẫu đầu. |

## Bổ sung 06/11 (Q8): giữ board 30 chân

Founder không đo được mẫu, nhờ dùng model trên mạng rồi sẽ mua hàng giống. Tìm web không có sơ đồ/bản vẽ cơ khí chính thức cho clone 30 chân USB-C. Tôi đưa hai lựa chọn: A đổi sang ESP32-DevKitC V4 chính hãng (38 chân), B giữ 30 chân. Founder trả lời nguyên văn "Giữ 30 chân". Hệ quả: mọi kích thước/điện nội bộ của board là ước lượng cho tới khi có số đo; xem WP 1.1, 1.2, 1.2b trong `codex-pcb-execution-plan.md`.

## Điều kiện còn treo (đừng coi là đã đóng)

- **Q2-A cần EF xác nhận** mẫu có Rd 5,1 kΩ trên cả hai CC (đo CC→GND). Nếu không có thì kiến trúc v1 phải xem lại.
- **Q3-A cần datasheet hãng Jauch** đúng lô và đầu nối, rồi khóa họ connector (hiện JST PH, XH, GH cùng tồn tại).
- **Q4-B cần văn bản chấp nhận rủi ro** do founder ký/duyệt; lời nói trong chat chưa đủ cho validator (`validate.mjs:42,151`).
- **Q1-A mâu thuẫn BOM B01** (4 mã: 02030089, EP000723, HH004223, WRL-20168): BOM cần chốt lại theo mẫu đã chụp.
- **Q5-B**: các tính toán nhiệt ở r7 (MCP73833 TJ 83 °C) giả định 4 lớp nên khớp; spec robot `kicad-input-spec-r7.md:259` giả định 2 lớp, cần sửa.
- **Q6 và Q7 chưa trả lời.** Q6-B (robot làm giấy song song) và Q7-A (giữ B04, xin hồ sơ NCC) vẫn là khuyến nghị, chưa là quyết định.

## Tác động lên kế hoạch

Gate chuyển từ "chờ founder" sang "chờ Codex làm": cấu hình JSON mới cho mẫu Type-C, cập nhật `tasks.json`, BOM variant theo Q1. Gate vật lý (macro U2, VID:PID, Rd trên CC, VBUS→VIN/3V3, kích thước) vẫn chặn net map và footprint.
