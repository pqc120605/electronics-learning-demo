# MoBot V2 r6 · Đề xuất cập nhật queue cho Codex HQ

05/11/2026. Claude **không sửa** `docs/agents/tasks.json`. Nội dung dưới đây để Codex HQ đối chiếu rồi tự ghi theo schema v2 (`docs/agents/README.md` §12) và chạy `node docs/agents/validate.mjs`.

Gói bằng chứng: thư mục này (`docs/hardware/claude-support/2026-11-05-mobot-r6/`). Gói do Claude viết theo phép riêng của user cho phiên này; đây là đầu vào kỹ thuật, **không phải** review độc lập của box08 và không phải bằng chứng bench.

**Cập nhật 05/11/2026:** founder trả lời "Theo đề xuất Claude" cho H3, R1, R5 ([founder-decisions.md](founder-decisions.md)). Trong các bảng dưới, chỗ ghi "chờ founder quyết H3/R1/R5" đổi thành "chờ HQ lập r7 (H3 0,40 A + MCP73833-FCI/MF; R1 RISEN 0,62 Ω; R5 chỉ sạc nguồn 1,5 A/3 A) và user duyệt đúng hash r7". `hardware_config_id` của hai task KiCad là r7 sau khi duyệt.

## 1. Task hiện có

### MM-HW-001

| Trường | Hiện tại (`tasks.json:1631`) | Đề xuất |
|---|---|---|
| state | waiting | **waiting** (giữ) |
| waiting.reason | "MOBOT-HWCFG-001 v1 remains proposed; …" | "MOBOT-V2-CONFIG-r6 đã được user duyệt (hash 54657f15…7d104), box08 trả changes_requested. Gói Claude 05/11 gắn nhãn 10 điểm vướng: 2 GỠ TRÊN GIẤY (H4, R6), 2 CẦN DỮ LIỆU NCC (H1, R3), 3 CẦN ĐO THẬT (H2, R2, R4), 3 CẦN FOUNDER QUYẾT (H3, R1, R5). Chờ founder quyết H3/R1/R5, hồ sơ NCC cho B15/B04, và box08 tái review." |
| waiting.owner | user | **user** (founder quyết H3/R1/R5 và lấy hồ sơ NCC) |
| waiting.resume_condition | "User approves exact completed configuration revision/hash; …" | "Founder trả lời H3, R1, R5; nếu thay đổi mục tiêu r6 thì HQ lập r7 kèm hash và user duyệt; box08 tái review MM-HW-MOBOT-IF-001." |
| waiting.resume_state | scoped | scoped |
| refs | — | Thêm thư mục gói này |

### MM-BOM-001

| Trường | Hiện tại (`tasks.json:636`) | Đề xuất |
|---|---|---|
| state | waiting | **waiting** (giữ) |
| waiting.reason | "MOBOT-HWCFG-001 v1 remains proposed; …" | "Cấu hình r6 đã duyệt. BOM refdes chưa chốt được vì: hồ sơ NCC B15 (H1) và B04 (R3) chưa có; RISEN và RPROG phụ thuộc founder (R1, H3); BOM bổ sung từ gói Claude: LM66100DCKR ×2, TLV6700DDCR ×2, SN74LVC8T245PWR ×1, SN74LVC2T45DCUR ×2, TCA9517ADGKR ×1, SMAJ8.0A ×1, MCP73833-FCI/MF thay /UN (đề xuất)." |
| waiting.owner | user | **user** (hồ sơ NCC); box03 sau khi có |
| waiting.resume_condition | như trên | "Có hồ sơ NCC B15/B04 hoặc founder chọn pack thay thế; founder chốt H3/R1/R5." |
| waiting.resume_state | ready | ready |

## 2. Task mới

### MM-HW-MOBOT-IF-001 · Đóng hợp đồng giao diện và 10 điểm vướng

| Trường | Đề xuất |
|---|---|
| state | **in_review** nếu HQ coi gói Claude là deliverable advisory; nếu không, **scoped** |
| owner | hardware_kit_designer (box03), advisory, không lease ghi |
| reviewer | qa_safety_reviewer (box08) |
| capability | [HQ điền theo register] |
| goal | Gắn mỗi finding `changes_requested` của box08 (`mobot-v2-r6-readiness-review.md:13-17`) với phương án, nguồn đúng revision và tiêu chí đóng; chốt hợp đồng 4 trạng thái USB cho cả hai carrier. |
| input | r6 + hash; `mobot-v2-r6-interface-review-packet.md`; `mobot-v2-r6-handset-b15-evidence.md`; `mobot-v2-r6-handset-pack-decision.md`; gói Claude (`handset.md`, `robot.md`); datasheet hãng nêu trong gói (truy cập 05/11/2026). |
| done criteria | (1) Box08 trả `pass` hoặc `pass` có điều kiện cho H4 và R6. (2) H3, R1, R5 có quyết định founder ghi trong decision record. (3) H1, R3 có hồ sơ NCC hoặc quyết định đổi pack. (4) H2, R2, R4 có tiêu chí bench trong `bench-test-plan.md` được box08 duyệt. (5) Nếu đổi mục tiêu r6, có r7 + hash + user duyệt. |
| gates | software: not_applicable · public: not_applicable · hardware: **not_applicable cho task này** (thiết kế); bench là task riêng |
| dependencies | không |

### MM-HW-MOBOT-REMOTE-KICAD-001 · Tay cầm KiCad (làm trước)

| Trường | Đề xuất |
|---|---|
| state | **scoped**, chờ IF-001 done |
| owner | hardware_kit_designer (box03), builder lease |
| reviewer | qa_safety_reviewer (box08); electronics_firmware_engineer (box02) review pin map |
| lease đề xuất | `hardware/mobot-v2/handset-carrier/**`, `docs/hardware/mobot-v2/handset-carrier/**` (`mobot-v2-r6-readiness-review.md:38`) |
| hardware_config_id | MOBOT-V2-CONFIG-r6 (hoặc r7 nếu founder đổi H3) |
| goal | Schematic và layout carrier tay cầm theo `kicad-input-spec.md` §1, BOM theo refdes, ERC/DRC. |
| input | IF-001 done; `kicad-input-spec.md` §1 với mọi `[TBD: H1–H4]` đã đóng; PCB BrijModi hash `D5A70C26…F345F`; KiCad 10.0.7. |
| done criteria | (1) ERC 0 lỗi, DRC 0 lỗi, hoặc mỗi waiver có giải trình được box08 chấp nhận. (2) BOM refdes khớp schematic và PCB, có MPN hoặc trạng thái chưa chốt. (3) Bề rộng net nguồn ≥ bảng §1.2. (4) Bảng 4 trạng thái USB được review trên schematic. (5) Handoff ghi hash snapshot, tool version. |
| gates | software: not_applicable · public: not_applicable · hardware: **unknown** (không đổi thành pass khi chưa có bench BT-H2, BT-H3, BT-H4) |
| dependencies | MM-HW-MOBOT-IF-001 |

### MM-HW-MOBOT-ROBOT-KICAD-001 · Robot KiCad (làm sau)

| Trường | Đề xuất |
|---|---|
| state | **scoped**, chờ IF-001 done và REMOTE-KICAD-001 đã qua review schematic |
| owner | hardware_kit_designer (box03), builder lease |
| reviewer | qa_safety_reviewer (box08); box02 review pin map, bảng I/O cách ly, R1/R4 |
| lease đề xuất | `hardware/mobot-v2/robot-carrier/**`, `docs/hardware/mobot-v2/robot-carrier/**` |
| hardware_config_id | MOBOT-V2-CONFIG-r6 (hoặc r7 nếu founder đổi R1/R5) |
| goal | Schematic và layout carrier robot theo `kicad-input-spec.md` §2, BOM refdes, ERC/DRC. |
| input | IF-001 done; `kicad-input-spec.md` §2 với mọi `[TBD: R1–R6]` đã đóng; kết quả BT-R1a (L motor) để chốt RISEN; bảng chân box02. |
| done criteria | Như REMOTE-KICAD-001, cộng: (6) RISEN theo quyết định R1 và L đo được; (7) tụ bulk VM, TVS, PS/SYNC theo R4; (8) tải carrier không nối SYS của BQ25886. |
| gates | software: not_applicable · public: not_applicable · hardware: **unknown** (chờ BT-R1b, BT-R2…BT-R6) |
| dependencies | MM-HW-MOBOT-IF-001; tuần tự sau REMOTE-KICAD-001 theo thứ tự founder |

## 3. Ghi chú cho HQ

- Thứ tự: IF-001 → REMOTE-KICAD-001 → ROBOT-KICAD-001 (`mobot-v2-r6-readiness-review.md:43` yêu cầu xếp hai carrier tuần tự khi lease phần mềm khác còn hoạt động).
- BT-R1a (đo L motor) không cần PCB; nếu founder có motor, chạy sớm sẽ chốt R1 nhanh hơn.
- Bench là việc của con người. Queue cần owner là người cho các bước bench; hiện không role agent nào có quyền thao tác thiết bị.
