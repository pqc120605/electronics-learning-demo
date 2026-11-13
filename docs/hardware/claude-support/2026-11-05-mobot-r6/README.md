# MoBot V2 r6 · Gói bàn giao trước KiCad (Claude, 05/11/2026)

Mục tiêu: đưa hai PCB mẫu MoBot r6 tới trạng thái sẵn sàng vẽ KiCad, **tay cầm trước, robot sau**. Claude chỉ ghi trong thư mục này theo phép riêng của user cho phiên này. Không sửa `tasks.json`, `AGENTS.md`, `CLAUDE.md` hay file KiCad. Gói này là đầu vào kỹ thuật; nó không thay review độc lập của box08 và không phải bằng chứng bench.

Cấu hình gốc: `MOBOT-V2-CONFIG-r6`, SHA-256 `54657f1518a435701b8b3dde21e40c9dd7ca624aff64cfcb0487d7512fe7d104`, `approved_by: user`, `pending_technical_review` (`docs/agents/tasks.json:2243-2257`).

## Nhãn

Nhãn nói điều kiện để **gỡ điểm vướng trước khi vẽ KiCad**. Mọi mục vẫn cần bench trên mẫu sau khi có PCB.

| Nhãn | Nghĩa |
|---|---|
| GỠ TRÊN GIẤY | Đủ tính toán và datasheet để vẽ schematic |
| CẦN DỮ LIỆU NCC | Cần tài liệu từ nhà cung cấp pack/module |
| CẦN ĐO THẬT | Chỉ chốt được bằng bench test |
| CẦN FOUNDER QUYẾT | Có đánh đổi giá/an toàn/tính năng, hoặc phải đổi mục tiêu r6 |

## 10 điểm vướng

| ID | Nhãn | Kết luận một dòng | Chi tiết |
|---|---|---|---|
| H1 | CẦN DỮ LIỆU NCC | B15 chỉ có số nhà bán (Li-ion 4,2 V, 2 Ah, 1C); thiếu mã cell, protector, nội trở, ngưỡng, NTC. Có danh sách 7 mục cần hỏi NCC. | [handset.md](handset.md#h1--hồ-sơ-pack-b15--cần-dữ-liệu-ncc) |
| H2 | CẦN ĐO THẬT | Boost TPS61023 đủ (≥ 1,30 A ra ở 3,0 V); giới hạn là R_DC pack, chưa có. UVLO TLV6700 3,12–3,25 V. | [handset.md](handset.md#h2--tải-xung-tay-cầm--cần-đo-thật) |
| H3 | CẦN FOUNDER QUYẾT | 0,25 A với timer 6 h chỉ chắc nạp 1,21 Ah. Đề xuất 0,40 A + MCP73833-FCI/MF (DFN): 1,95 Ah, TJ 83 °C, USB 0,445 A. | [handset.md](handset.md#h3--chu-kỳ-sạc-1s--cần-founder-quyết) |
| H4 | GỠ TRÊN GIẤY | Interposer Micro-USB trên carrier, I/O cùng miền 3V3 DevKit, LM66100 + wired-AND enable độc lập firmware. | [handset.md](handset.md#h4--cách-ly-nguồn-và-io--gỡ-trên-giấy) |
| R1 | CẦN FOUNDER QUYẾT | VTRIP DRV8833 160–240 mV nên không đạt "0,40 A nom + 0,45 A max" với bất kỳ R nào (nom max khả thi 0,371 A). Đề xuất 0,62 Ω E24: 0,256–0,391 A. | [robot.md](robot.md#r1--giới-hạn-dòng-drv8833--cần-founder-quyết) |
| R2 | CẦN ĐO THẬT | DRV8833 không phát hiện kẹt ở 0,36 A. Đề xuất ADC đọc ISEN + chốt lỗi; ngưỡng và thời gian chờ đo. | [robot.md](robot.md#r2--ngắt-khi-motor-kẹt--cần-đo-thật) |
| R3 | CẦN DỮ LIỆU NCC | Biên pack B04 0,238 A theo số nhà bán; TPS63070 có thể tới TJ 125 °C nếu toàn tổn hao trong IC. Cần R_DC, BMS của B04. | [robot.md](robot.md#r3--tải-pack-2s-và-nhiệt--cần-dữ-liệu-ncc) |
| R4 | CẦN ĐO THẬT | Tụ 220 µF giữ VM ≤ 7,5 V với L ≤ 10 mH (≤ 2,03 mJ); TVS SMAJ8.0A lớp hai; L motor chưa biết. | [robot.md](robot.md#r4--năng-lượng-trả-về-khi-phanhđảo-chiều--cần-đo-thật) |
| R5 | CẦN FOUNDER QUYẾT | BQ25886 không giữ được < 500 mA (đặt 0,5 A vẫn tới 553 mA). Đề xuất chỉ sạc khi nguồn báo 1,5 A/3 A; mất khả năng sạc từ cục sạc cổng A. | [robot.md](robot.md#r5--sạc-42-w-vượt-25-w-của-usb-5-v500-ma--cần-founder-quyết) |
| R6 | GỠ TRÊN GIẤY | Hai enable phần cứng, SN74LVC8T245 + 2× SN74LVC2T45 + TCA9517A cách ly I/O, tải không nối SYS. | [robot.md](robot.md#r6--cách-ly-usb-và-io--gỡ-trên-giấy) |

Tổng: GỠ TRÊN GIẤY 2 · CẦN DỮ LIỆU NCC 2 · CẦN ĐO THẬT 3 · CẦN FOUNDER QUYẾT 3.

**Cập nhật 05/11/2026:** founder đã trả lời "Theo đề xuất Claude" cho H3, R1, R5 ([founder-decisions.md](founder-decisions.md)): H3 = 0,40 A với MCP73833-FCI/MF; R1 = 0,62 Ω; R5 = chỉ sạc từ nguồn 1,5 A/3 A. Ba mục chuyển sang **đã quyết, chờ r7**: H3 và R1 đổi mục tiêu r6, nên HQ phải lập r7 và lấy user duyệt đúng hash trước khi cấp lease.

## File trong gói

| File | Nội dung |
|---|---|
| [handset.md](handset.md) | H1–H4, an toàn Li-ion tay cầm |
| [robot.md](robot.md) | R1–R6, an toàn robot |
| [kicad-input-spec.md](kicad-input-spec.md) | Bảng RefDes/mã/giá trị/footprint/net cho hai board; net nguồn và bề rộng IPC-2221 |
| [bench-test-plan.md](bench-test-plan.md) | Phép đo cho mọi mục CẦN ĐO THẬT và kiểm xác nhận H3, H4, R1, R5, R6 |
| [codex-handoff.md](codex-handoff.md) | Đề xuất trạng thái queue cho Codex HQ |
| [founder-decisions.md](founder-decisions.md) | Quyết định founder cho H3, R1, R5 và việc lập r7 |

## Việc theo người

**Codex HQ**
1. Đọc `codex-handoff.md`; cập nhật waiting reason MM-HW-001, MM-BOM-001; thêm ba task MM-HW-MOBOT-*; chạy validator.
2. Ghi decision record từ `founder-decisions.md`. Lập r7 (H3 0,40 A + FCI/MF, R1 0,62 Ω, R5 chính sách sạc), tính hash, lấy user duyệt đúng hash r7.
3. Giao box08 tái review H4, R6 và tiêu chí bench.

**Box 02 · Electronics & Firmware**
1. Lập bảng chân GPIO cho hai board (hướng, rail, VIH/VIL), chân ADC1 cho joystick và ISEN.
2. Đóng các `[TBD]` kỹ thuật: hysteresis UVLO, chia áp CE/gate, FB và L của TPS61023/TPS54302/TPS63070, logic MOTOR_EN, LDO cho TUSB320LAI, công thức KICHGSET.
3. Xác minh câu hỏi ISEN abs max 0,5 V khi ngắn mạch (R1) và PFM của TPS63070 không hút dòng ngược (R4).
4. Đối chiếu số TVS SMAJ8.0A với PDF Littelfuse.

**Box 03 · Hardware & Kit**
1. Chọn MPN cho điện trở sense, tụ bulk, ổ Micro-USB và cáp interposer, connector pack có khóa, cầu chì/PTC.
2. Chuyển yêu cầu dữ liệu NCC (H1 mục 1–7, áp dụng cả B04) cho founder.
3. Khi có lease: vẽ tay cầm theo `kicad-input-spec.md` §1, rồi robot §2.

**Box 08 · QA & Safety**
1. Tái review gói này, ưu tiên H4 và R6 (hai mục gắn GỠ TRÊN GIẤY).
2. Duyệt các ngưỡng `[TBD]` trong `bench-test-plan.md` (dòng rò, xung enable, đỉnh VM, nhiệt).
3. Xác nhận đổi package MCP73833 UN → MF có cần revision hay không.

**Founder**
1. ~~H3, R1, R5~~: đã quyết 05/11 theo đề xuất Claude ([founder-decisions.md](founder-decisions.md)).
2. Duyệt đúng hash r7 khi HQ trình.
3. Lấy hồ sơ NCC cho B15 và B04, hoặc chọn pack có hồ sơ.
4. Chỉ định bench operator (người) và chuẩn bị thiết bị trong `bench-test-plan.md`.
5. Nếu có motor #992: cho đo L ngay (BT-R1a), không cần PCB.

## Mâu thuẫn trong repo đã phát hiện

| Mục | Nguồn A | Nguồn B | Dùng |
|---|---|---|---|
| Cổng DevKit B01 | `mobot-v2-bom-review-2026-11-05-r2-handoff.md:9`: HH004223, USB-C | `mobot-v2-config-2026-11-05-r5.md:7`, r6: BrijModi, **Micro-USB** | r6 (Micro-USB) |
| Motor B02 | `mobot-v2-bom-review-2026-11-05-r1.csv` B02: GA12-N20 6 V 100 rpm | `mobot-v2-config-2026-11-05-r6.md:3,9`: Pololu #992 | r6 (#992) |
| Xả liên tục B15 | Bảng nhà bán: 1C | Tiêu đề danh mục: 3C (`mobot-v2-r6-handset-b15-evidence.md:10`) | 1C (bảo thủ) |

## Nguồn thiếu

Không có. Mọi file trong danh sách nguồn đều tồn tại tại 05/11/2026. File `.xlsx` không mở; bản `.inspect.ndjson` không cần cho các phép tính trong gói.

## Kiểm chứng và giới hạn

- Datasheet tải từ trang hãng ngày 05/11/2026 và trích bằng `pdftotext`: DRV8833 SLVSAR1E, MCP73833/4 DS20002005C, BQ25886 SLUSD88A, TPS61023 SLVSF14B, TPS63070 SLVSC58B, TPS54302 SLVSDG6C, TUSB320LAI SLLSEQ8D, ESP32 Series v5.3, ESP32-WROOM-32 v3.8, LM66100 SLVSEZ8A, TLV6700 SNVSAV2B, SN74LVC8T245 SCES584D, SN74LVC2T45 SCES516N, TCA9517A SCPS245E. Pololu #992 đọc từ trang specs.
- TVS SMAJ8.0A: số liệu từ trang phân phối (Farnell, DigiKey); chưa đọc PDF Littelfuse.
- Phép tính chạy bằng Python trong scratchpad; công thức và đầu vào ghi tại từng mục.
- Không chạy ERC/DRC, không có PCB, không có số đo. Không khẳng định đạt chứng nhận an toàn nào.
- Khả năng mua ở Việt Nam: chưa kiểm chứng cho các IC đề xuất.
- Skill đã dùng: my-skills:systematic-debugging (R1), my-skills:verification-before-completion, stop-slop. Không thiếu skill nào.
