# Kế hoạch ưu tiên PCB · MoBot V2 (06/11/2026)

Vai: Leader Claude, chỉ đọc. Đây là đề xuất; Codex quyết định áp dụng. Không mở lại quyết định founder: UVLO robot falling 6,40–6,60 V (TLV6700 FAIL); R7 H3/R1/R5; board là mẫu 30 chân USB-C họ CH340.

Nguồn: `docs/hardware/claude-support/2026-11-06-pcb-gate/gate-matrix.md` (32 mục/board, 4 CHỐT = 12,5 %), `founder-questions.md` (Q1–Q7), và `docs/claude-support/2026-11-06-review-hardware/findings.md` (H1–H6). Tôi chưa mở lại datasheet IC; số liệu IC là số các file trên trích.

## 1. Kết luận

Chưa thể mở lease KiCad. Không phải thiếu thiết kế, mà thiếu **quy trình + 3 dữ kiện vật lý + 5 quyết định founder**. Con đường ngắn nhất: tách việc thành làn chạy song song, tay cầm đi trước, robot làm giấy song song (Q6-B).

## 2. Việc còn thiếu, theo thứ tự chặn

| # | Thiếu | Chặn | Ai | Bằng chứng |
|---|---|---|---|---|
| 1 | Founder trả lời Q1–Q5 | cả hai lease | founder | `founder-questions.md` |
| 2 | Dữ kiện mẫu: macro U2, VID:PID, Rd trên CC, VBUS→VIN/3V3, kích thước | net map, footprint, outline | founder + EF | `gate-matrix.md:52-57`, `measurement-checklist.md` mục 1-13 |
| 3 | Cấu hình mới cho mẫu Type-C, dạng JSON `mission-control/hardware-config-*.json`, `blocking_unknowns` rỗng | validator, approval | Codex lead | `gate-matrix.md:47-50`, `validate.mjs:142-151` |
| 4 | Box 08 review đúng bytes cấu hình + delta 07/11 | approval, lease | qa_safety_reviewer | `gate-matrix.md:51`, `readiness:5` |
| 5 | `tasks.json` lệch tài liệu; 6 mục readiness của `MM-HW-MOBOT-IF-001` | dispatch | Codex lead | `gate-matrix.md:41, 60` |
| 6 | Lease: task `in_progress`, builder mode, write_lease path, snapshot hash | mở KiCad | Codex lead | `gate-matrix.md:38-40` |
| 7 | Pin map + net map, stackup, DRC/netclass, outline | schematic/layout | EF, HK | `gate-matrix.md:66-71` |

## 3. Hướng giải quyết cho Codex

### 3.1 Gỡ quy trình (làm ngay, không cần founder)

1. **Phân xử tài liệu chồng nhau.** Tạo một file "supersession" ngắn: doc nào thay doc nào (AV1 12:57 → CS 14:43 → GR 14:57 → AA 15:19 so với `tasks.json` 12:24). Cập nhật `tasks.json` theo đó. Kiểm tra: `node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` hết lỗi "authorization" và "builder mode".
2. **Ghi nhận hoặc bác biên bản r7.** `r7-approval-record.md` (user duyệt hash `9ef75eb9…`) mâu thuẫn `tasks.json` (`proposed`, `approved_by: null`). Chọn một, ghi lý do. Dù chọn gì, r7 không đủ cho mẫu Type-C.
3. **Cấu hình mới dạng JSON.** Tạo `mission-control/hardware-config-<mẫu-typec>.json`. Áp dụng Q4-B: tách `verification_items` (đo sau khi có PCB) khỏi `blocking_unknowns`; mỗi verification item có tiêu chí PASS/FAIL và Box 08 duyệt từng mục trước layout. Kiểm tra: validator chấp nhận file; `blocking_unknowns` rỗng.
4. **Box 08 review đúng bytes** (hash trong `delta-handset-2026-11-07.md` §7), rồi user duyệt đúng hash của cấu hình mới.

### 3.2 Làm giấy trước lease (không cần KiCad)

1. **Bảng lỗi đơn cho tay cầm** (H2): với BT-H4a/b/c (`bench-additions.md:7-42`), liệt kê lỗi dính U6/U9, đứt sense, rail dư, SW4; kết quả mong đợi ở từng lỗi. Tiêu chí PASS: không có đường nào nối hai nguồn 5 V hoặc đẩy ngược vào CP2102/ESP32.
2. **Hợp đồng firmware/MCU `MM-ESP32-001`** (H1), chưa cần mã: module chính xác; trạng thái an toàn khi reset/brown-out (motor tắt mặc định, `MCU_MOT_EN` kéo xuống bằng điện trở); thứ tự bật ngoại vi; danh sách chân cấm. Về pin map, cần đối chiếu datasheet ESP32 (đã có 2 PDF trong repo): chân strapping (GPIO0, 2, 5, 12, 15), GPIO34–39 chỉ vào và không có pull-up nội (đã đúng hướng với JOY_X/Y trên 34/35), GPIO25 thuộc ADC2 (cần kiểm tài liệu ESP-IDF nếu dùng analog cùng Wi-Fi). Đây là điểm Codex cần tự kiểm chứng, tôi chưa mở ESP-IDF.
3. **Bản nháp DRC/netclass**: chọn fab (founder), điền track/clearance/via, độ rộng đường dòng lớn (IPC-2221 hiện [CHƯA XÁC MINH], `datasheet-checks.md:113`). Kiểm tra: một bảng có nguồn cho từng giá trị.
4. **Nhiệt và stackup**: với Q5-B (4 lớp), tính lại MCP73833 (1,05 W, TJ 83 °C ở 40 °C theo r7) và TPS63070 trên đúng stackup; ghi giả định đồng, diện tích tản nhiệt. Nếu chọn 2 lớp thì r7 phải tính lại.
5. **`datasheets/SOURCES.md`** (M7): URL hãng, ngày tải, sha256 cho từng PDF; đánh dấu 3 nguồn còn [CHƯA XÁC MINH] (Littelfuse SMAJ, IPC-2221, CP2102 đầy đủ). Chỉ tải từ trang hãng.
6. **Sửa pitch JST XH** (L1): `kicad-input-spec-r7.md:167, :228` ghi 2,54 mm; `gate-matrix.md:79` ghi 2,50 mm. Mở datasheet JST và chốt trước khi tạo footprint.
7. **Robot (Q6-B)**: viết kiến trúc nguồn robot cho Type-C trên giấy (hiện chỉ có Micro-USB + interposer, R6). Chỉ lease khi schematic tay cầm qua Box 08.

### 3.3 Cần founder (ưu tiên theo mức chặn)

| Câu | Khuyến nghị | Ghi chú |
|---|---|---|
| Q1 mẫu cho carrier | A: mẫu đã chụp cho cả hai | đóng 4 mã B01 mâu thuẫn |
| Q2 kiến trúc nguồn tay cầm | A: kiến trúc v1 | cần đo Rd 5,1 kΩ trên cả hai CC |
| Q3 pack | A: Jauch 250832 | cần datasheet hãng đúng lô và đầu nối |
| Q4 blocking_unknowns | B: tách verification_items | founder chấp nhận rủi ro bằng văn bản |
| Q5 số lớp | B: 4 lớp cả hai | mẫu đầu, số lượng ít |

Nếu founder chỉ có thời gian cho một việc vật lý: **chụp macro U2 + đọc VID:PID + thông mạch CC→GND và VBUS→VIN/3V3** (`measurement-checklist.md` mục 11-13). Việc này mở khóa net map, Q1, Q2, topology USB-C cùng lúc.

## 4. Thứ tự đề xuất

1. Ngay: 3.1 (1–2) và 3.2 (1–2, 5–6); không phụ thuộc ai.
2. Khi founder trả lời Q1–Q5 và có dữ kiện mẫu: net map → cấu hình JSON mới → Box 08 → user duyệt hash.
3. Lease tay cầm: task `in_progress`, builder mode, write_lease `hardware/mobot-v2/handset-carrier/**`, snapshot hash. Kiểm tra: `validate.mjs --dispatch-task` thoát 0.
4. Schematic tay cầm → ERC (kicad-cli 10.0.7 hiện chỉ kiểm `version`, chưa chạy ERC/DRC) → Box 08 → mới mở lease robot.

## 5. Rủi ro an toàn điện, giữ trong mọi bước

- Motor tắt mặc định khi reset/brown-out/MCU chưa chạy.
- Không để hai nguồn 5 V song song dưới lỗi đơn (H2).
- Không dùng số bench làm bằng chứng cho đến khi đã đo: mọi kết quả hiện là UNKNOWN (`bench-additions.md:5`).
- Dòng USB attach/boot/flash chưa chốt (H3); không khẳng định tải hợp lệ trước khi đo.

## 6. Chưa kiểm chứng / chưa chạy

- Không chạy `validate.mjs`, `calc_r7.py`, `kicad-cli`; trạng thái lease lấy từ `gate-matrix.md` và `tasks.json` do reviewer đọc.
- Không mở lại datasheet IC ngoài ESP32; phép tính UVLO ≈ 6,50 V (TLV6710) là tính tay từ số `datasheet-checks.md`.
- Mục ADC2/Wi-Fi của GPIO25 chưa đối chiếu ESP-IDF.
