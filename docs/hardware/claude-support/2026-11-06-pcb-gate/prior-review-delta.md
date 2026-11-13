# Đối chiếu review cũ của Claude (r6, 05/11) với trạng thái Codex (06/11)

Chỉ đọc. Nguồn finding cũ: `claude-support/2026-11-05-mobot-r6/README.md:20-31` (10 điểm vướng) và `:80-84` (3 mâu thuẫn). Trạng thái Codex lấy từ `tasks.json` (TJ), `mobot-v2-r7-box08-review-packet.md` (PK), r7 config, decision và doc ngày 06/11. Nhãn: **ĐÃ ĐÓNG**, **CÒN MỞ**, **BỊ BỎ QUA KHÔNG LÝ DO**, **THAY BẰNG HƯỚNG KHÁC (có lý do)**.

## 10 điểm vướng r6

| ID | Finding r6 | Trạng thái | Bằng chứng |
|---|---|---|---|
| H1 | B15 thiếu hồ sơ cell/PCM/NTC; xin NCC 7 mục (HS:44-54) | **CÒN MỞ**, đã đổi hướng: Jauch 250832 là cơ sở mới, 3×AA là hướng khác | TJ:626-634; QD:15; CS:7; AA:10. Lý do đổi có (hồ sơ không có), nhưng mỗi doc nêu một hướng khác nhau |
| H2 | Tải xung Wi-Fi, UVLO 3,20 V, cần đo | **CÒN MỞ** (đo). Codex xác nhận 240 mA chỉ là typical, 0,5 A là yêu cầu nguồn | PK:16; RD:28 |
| H3 | 0,40 A với MCP73833-FCI/MF; sửa nhãn C-rate | **ĐÃ ĐÓNG** ở mức quyết định (r7). Sửa C-rate được Codex nêu lại. Phần timer, NTC, pack vắng vẫn mở | R7:7; FD:5-6; PK:17,22; QD:13 |
| H4 | Interposer Micro-USB, LM66100, enable wired-AND | **THAY BẰNG HƯỚNG KHÁC (có lý do)**: mẫu Type-C, carrier không cấp VIN, cáp RUN OUT. Yêu cầu nền (cách ly phần cứng, không cấp ngược) vẫn **mở** | AV1:7-9; CP:13,24-39; TJ:2345-2355 |
| R1 | VTRIP 160–240 mV, đề xuất 0,62 Ω | **ĐÃ ĐÓNG** (r7). Sub-finding ISEN abs max 0,5 V khi ngắn mạch: **CÒN MỞ** | R7:8; FDEC:8; PK:18 |
| R2 | Phát hiện kẹt phải đo | **CÒN MỞ** | PK:18,35 |
| R3 | Biên pack B04 0,238 A, nhiệt TPS63070 | **CÒN MỞ** (chờ hồ sơ NCC) | TJ:626-634; RD:22 |
| R4 | Tụ 220 µF và TVS; L motor chưa biết | **CÒN MỞ**. Codex tự nêu clamp SMAJ8.0A 13,6 V cao hơn 10,8 V | PK:19; BT:99-104 |
| R5 | BQ25886 không giữ <500 mA; chỉ sạc khi 1,5 A/3 A | **ĐÃ ĐÓNG** ở mức chính sách (r7). Giá trị ICHGSET: **CÒN MỞ** trong doc Codex | R7:9; PK:20 (7,68 kΩ giữ `[TBD]`; Claude đã đề xuất 1,91 kΩ ở KS7:159, nằm ngoài input của Codex) |
| R6 | Dịch mức 3 họ IC, hai enable phần cứng, tải không nối SYS | **CÒN MỞ**, và nền (Micro-USB, interposer) không còn khớp mẫu Type-C | PK:9; R6:20-26; TJ:2582-2596 |

## 3 mâu thuẫn r6 ghi nhận

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Cổng DevKit: USB-C (BOM r2) hay Micro-USB (BrijModi) | **ĐÃ ĐÓNG** ở mức hướng: user chọn mẫu Type-C CH340. Nhưng danh tính SKU lại mở thành 4 mã | TJ:2423; DB:10-12; EV:30; AV1:7 |
| Motor B02: GA12-N20 hay Pololu #992 | **BỊ BỎ QUA KHÔNG LÝ DO** trong các doc đã đọc: r7 kế thừa r6 (#992) và không có doc 06/11 nhắc lại [chưa kiểm chứng toàn repo] | R6:3,9; R7:3 |
| Xả B15 1C hay 3C | **THAY BẰNG HƯỚNG KHÁC**: B15 chưa còn là pack chắc chắn | CS:7 |

## Việc r6 giao cho HQ (`codex-handoff.md`, README r6:50-53)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Thêm ba task MM-HW-MOBOT-* | **ĐÃ ĐÓNG** | TJ:2296, 2434, 2539 |
| Cập nhật waiting reason MM-HW-001, MM-BOM-001 | **ĐÃ ĐÓNG** (nhưng còn dựa r7, xem reconciliation) | TJ:570, 1571 |
| Ghi decision H3/R1/R5, lập r7, tính hash | **ĐÃ ĐÓNG** | FD:5-6; TJ:2622 |
| Lấy user duyệt đúng hash r7 | **CÒN MỞ** theo queue (`approved_by: null`). Biên bản của Claude chưa được HQ hấp thụ | TJ:2623-2624 |
| Box08 tái review H4/R6 | **CÒN MỞ**: packet đã soạn, chưa có verdict ghi vào queue | PK:3,49; TJ:2381-2395 |
| Box08 xác nhận đổi package UN→MF có cần revision | **ĐÃ ĐÓNG** theo cách r7 nêu MF và hash riêng | R7:7 |

## Finding bổ sung của Claude ngày 06/11 (thư mục pcb-status)

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| TLV6700 bị đảo cực UVLO | **ĐÃ ĐÓNG**: Codex phát hiện độc lập, và founder loại TLV6700 | PK:7; FV:133 |
| LM66100 đơn không chặn được diode thân | **ĐÃ ĐÓNG** theo cách khác: kiến trúc v1 bỏ đường carrier→VIN | PK:8; AV1:8 |
| TMUX1574 chỉ 4 kênh, cần 5–6 đường | **CÒN MỞ**: không có doc mới của Codex sau khi đổi kiến trúc | QD:12; TM:23 |
| EN TPS54302 không kéo thẳng lên 8,4 V | **ĐÃ ĐÓNG** ở mức nêu vấn đề (Codex tự ghi) | PK:43 |
| Delta TPS259474L pass, latch, TS3USB221 | **THAY BẰNG HƯỚNG KHÁC (có lý do)**: kiến trúc v1 không dùng đường VBUS interposer. Doc Codex không ghi "bỏ delta này vì" nên lý do chỉ suy ra từ CP:13 | AV1:8; CP:13 |
| JST XH 2,50 mm (không phải 2,54) và ICHGSET 1,91 kΩ | **CÒN MỞ**: lỗi nằm trong tài liệu của Claude, Codex chưa có tương ứng | resolutions.md §2, §3 (prev-v1) |

## Ghi chú

- Claude không có quyền sửa doc Codex. Hai lỗi của chính Claude (XH 2,54 mm và ICHGSET 7,68 kΩ ở `kicad-input-spec.md`) cần HQ biết trước khi dùng spec nào làm đầu vào.
- Policy `claude_communication_allowed: false` (TJ:7-20) nghĩa là Codex không chủ động đọc kết quả của Claude. Mọi "đã đóng" ở đây là Codex tự đạt được, không phải do nhận từ Claude.
