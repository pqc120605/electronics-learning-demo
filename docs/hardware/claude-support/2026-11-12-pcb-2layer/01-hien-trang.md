# MoBot — Hiện trạng phần cứng trước thiết kế PCB 2 lớp

- Ngày: 12/11/2026. Người viết: Claude (chỉ ghi trong `docs/hardware/claude-support/2026-11-12-pcb-2layer/`).
- Phạm vi: hai bo — **tay cầm (handset)** và **robot**. Ràng buộc founder cho lượt này: mỗi PCB 2 lớp, ≤ 100 × 100 mm, không phụ thuộc số đo từ bo mẫu.
- Nguồn đã đọc đầy đủ: `HARDWARE-HANDOFF-2026-11-11.md`, `HARDWARE-HANDOFF-2026-11-10.md`, `supersession.md`, `mobot-v2-founder-decision-q1-q8.md`, `-d15-d16.md`, `-c11-r12.md`, `-q2-off.md`, `mobot-v2-evt0-b1-intake-2026-11-11.md`, `mobot-v2-handset-r13-design.md`, `mobot-v2-handset-r14-closure.md`, `claude-support/2026-11-11-evt0-reset/{proposal,codex-b1-instructions}.md`, `claude-support/2026-11-06-pcb-status/final/{final-bom,kicad-input-spec-r7}.md`, `mobot-v2-config-2026-11-05-r6.md`, `mobot-v2-bom-review-2026-11-05-r1.csv`, `mobot-v2-robot-pack-d16-shortlist.md`, `mobot-robot-vm-pre-kicad-closure.md`, `mobot-v2-hardware-pause-2026-11-07.md`, `evidence/esp32-devkit-v1-type-c-sample.md`, `docs/mission-control/hardware-config-mobot-v2-typec-r8-robot.json`.
- Nguồn chỉ đọc trích đoạn (grep): `claude-support/2026-11-05-mobot-r6/robot.md`. **Chưa đọc**: các hồ sơ P0-02…P0-15 chi tiết (đã bị F1–F5 chuyển thành lịch sử cho tay cầm theo `supersession.md`), `final-values.md`, `calc_r7.py`, `docs/agents/runs/**`, file r13/r14 `.json`.
- `firmware/` chỉ có `atmega328p-d13-blink.asm`. Không có firmware MoBot.

## 1. File schematic/PCB của MoBot

**Chưa có.** Lệnh tìm `*.kicad_sch`, `*.kicad_pcb`, `*.kicad_pro` trong dự án chỉ trả về file dưới `assets/boards/**` và `.tmp/**` (bo tham chiếu Arduino, ESP32 DevKit, Pico, XIAO, Blue Pill). Không có thư mục `hardware/mobot-v2/`. Handoff 11/11 xác nhận: "No schematic, PCB, firmware… was authorized".

## 2. Bảng trạng thái theo khối

Ký hiệu: **CHỐT** = có quyết định founder; **MỞ** = có hướng, chưa chốt linh kiện/giá trị; **CHƯA** = chưa làm; **MT** = mâu thuẫn giữa các tài liệu.

### 2.1 Tay cầm

| Khối | Trạng thái | Nội dung hiện hành | Bằng chứng |
|---|---|---|---|
| Nguồn/pin | CHỐT hướng, MỞ linh kiện | 3 pin AA tháo rời (alkaline hoặc NiMH), sạc ngoài. Nguồn vào bo ESP32 chỉ qua cổng USB-C của bo; phát hiện CC trước khi cấp VBUS | `mobot-v2-founder-decision-q1-q8.md` mục F1, F2 |
| Bảo vệ | MỞ | PTC sau cực dương, chống ngược cực, công tắc nối tiếp pack, cắt áp thấp mức pack cửa sổ 3,15–3,30 V, chặn dòng ngược ngõ ra. Chưa chọn MPN. Bốn cổng schematic OPEN | `HARDWARE-HANDOFF-2026-11-11.md`; `mobot-v2-handset-r14-closure.md` |
| MCU | CHỐT | ESP32 DevKit 30 chân USB-C họ CH340 (B01), cắm socket. SKU, kích thước, điện nội bộ UNKNOWN | F5, Q8; `evidence/esp32-devkit-v1-type-c-sample.md` |
| Driver động cơ | không áp dụng | — | — |
| Cảm biến | không áp dụng | — | — |
| RF/điều khiển | CHỐT | Không dây bằng radio của ESP32. Giao thức chưa chọn | F5 |
| Nút/joystick | MỞ | 4 trục ADC1 + 8 nút, toàn thụ động, cấp từ chân 3V3 của B01, tải ≤ 20 mA. **Chưa gán chân** | `mobot-v2-handset-r14-closure.md` mục C1/C10/C11 |
| Connector | MỞ | Hai socket 1×15; ba khoảng hàng dự phòng 22,86/25,40/27,94 mm. VIN, EN không nối. Cáp USB-C sang B01 | `codex-b1-instructions.md` M1–M7, N1–N6 |
| Cơ khí | CHƯA | Không có CAD vỏ, không có kích thước bo, lỗ vít | `mobot-v2-bom-review-2026-11-05-r1.csv` dòng B27, B28 |

### 2.2 Robot

| Khối | Trạng thái | Nội dung hiện hành | Bằng chứng |
|---|---|---|---|
| Nguồn/pin | MỞ (Q7) | Pack 2S Li-ion. B04 MTM 7V2AH-4A-2S1P, Ultralife UBBL20-C1, RS PRO 176-9352 đều chưa chốt | `mobot-v2-founder-decision-d15-d16.md` D16(c); `mobot-v2-robot-pack-d16-shortlist.md` |
| Sạc | MỞ | r7: BQ25886 + TUSB320 trên bo (blocker ROBOT-R5). Đề xuất 11/11 "sạc rời" (E5) chưa được founder ký | `final-bom.md` §2.1–2.2; `claude-support/2026-11-11-evt0-reset/proposal.md` §5, §7 |
| Bảo vệ | CHỐT ngưỡng, MỞ mạch | UVLO falling **6,40–6,60 V** tại pack. TLV6700 FAIL; TLV6710 + 180 kΩ/11,1 kΩ/2,84 MΩ cho 6,418–6,582 V (tính trên giấy) | `final-bom.md` §2.3; `proposal.md` §5 "Giữ nguyên" |
| MCU | CHỐT | Cùng bo ESP32 DevKit 30 chân USB-C CH340 | Q1, Q8 |
| Driver động cơ | MỞ | DRV8833PWPR, R sense 0,62 Ω, 2 motor N20 6 V (Pololu #992 / GA12-N20). r7 cấp VM 6 V qua TPS63070. Blocker ROBOT-R1, R2, R4 | `final-bom.md` §2.6–2.7; `hardware-config-mobot-v2-typec-r8-robot.json` |
| Cảm biến | MỞ | HC-SR04, 2× TCRT5000, OLED SSD1306 I²C, loa 8 Ω qua MAX98357A. SKU chưa chốt | `mobot-v2-bom-review-2026-11-05-r1.csv` B09–B13 |
| RF/điều khiển | CHỐT | Web Serial qua USB (P1), Wi-Fi + WebSocket (V1) | D4 |
| Connector | MỞ | JST XH cho pack và motor (r7). Giao diện carrier còn blocker CARRIER-INTERFACES | `final-bom.md` §2.7; r8-robot |
| Cơ khí | CHƯA | Không có CAD khung, bánh 43 mm "target". Không có lỗ vít | CSV B28–B30 |

## 3. Quyết định LOCKED

| # | Quyết định | Nguồn |
|---|---|---|
| L1 | Bo MCU cho cả hai carrier: ESP32 DevKit 30 chân USB-C họ CH340. Founder không đo được mẫu; mọi kích thước/điện nội bộ là ước lượng | Q1, Q8, F5 |
| L2 | Tay cầm: nguồn qua cổng USB-C duy nhất của B01, phát hiện CC trước khi cấp VBUS, header thụ động | F1 |
| L3 | Tay cầm: 3 AA tháo rời, sạc ngoài; cắt áp thấp mức pack, tự phục hồi là hướng phân tích; phải xét cell yếu đảo áp và bật lại lặp | F2 |
| L4 | Tay cầm: giữ tiêu chí C1–C12 (VIN/EN không nối, 3V3 ≤ 20 mA, cửa sổ detector 3,15–3,30 V, không dùng chân strap/UART0, trục chỉ ADC1…) | F3 |
| L5 | Điều khiển không dây; robot là hồ sơ riêng; cả bộ < 1.000.000 đ; cổng chứng nhận đồ dùng trẻ em trước khi bán | F5 |
| L6 | Robot: UVLO falling 6,40–6,60 V tại pack; TLV6700 FAIL | founder 06/11 (ghi trong `proposal.md` §5, `final-bom.md` §2.3) |
| L7 | D1 robot là lõi Starter; D2 thị trường Việt Nam; D3 chỉ phát lời chào/hướng dẫn qua loa, không mic; D4 Web Serial rồi Wi-Fi | Q1–Q8 record |
| L8 | D10: các phép đo (USB attach, UVLO động, VM, nhiệt, ADC, clone) là `verification_items`, đo trên mẫu, không chặn schematic/layout | D10 |
| L9 | Quyền riêng bằng văn bản trước khi: gửi PCB sản xuất, cấp điện Li-ion, chạy motor, flash, mua hàng | Q1–Q8 record "Việc tiếp tục bị chặn" |
| L10 | Q5: PCB **4 lớp** cho cả hai carrier | Q1–Q8 record — **xem mâu thuẫn M1** |

Đã thành lịch sử cho tay cầm (bị F1 thay): Q2 kiến trúc nguồn v1, Q3 pack Jauch 250832, cách ly I/O CHARGE/PROGRAM, G-B16, M-A/cassette, nhánh W, envelope 100 N/200 N, H3 và trần 4,200 V.

## 4. Blocker

| Mã | Bo | Nội dung | Nguồn |
|---|---|---|---|
| B-1 | Tay cầm | Bốn cổng schematic OPEN: `D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`, `D17-H3-CV-PROTECTION`, `MCU-RESET-VETO-RESOURCES` | Handoff 11/11 |
| B-2 | Tay cầm | Chưa chọn MPN nào: boost, đóng cắt VBUS, detector, PTC, chống ngược cực, công tắc | r14 closure |
| B-3 | Tay cầm | Chưa gán chân GPIO | r14 closure |
| B-4 | Tay cầm | r14 `proposed`, chưa duyệt hash; B1 `waiting`, không có lease | Handoff 11/11 |
| B-5 | Robot | ROBOT-R1 dòng đỉnh motor; R2 phát hiện kẹt; R3/Q7 pack; R4 năng lượng hồi VM; R5 sạc/CE; R6 nguồn B01 RUN/PROGRAM và cách ly | r8-robot `blocking_unknowns` |
| B-6 | Cả hai | CARRIER-INTERFACES, B01-SUPPLY (truy xuất đúng PCBA), STACKUP-DRC | r8-robot |
| B-7 | Cả hai | Bo ESP32 mẫu không đo được: khoảng hàng chân, có/không diode VBUS→VIN, có/không Rd 5,1 kΩ trên CC | Q8; evidence |
| B-8 | Cả hai | Không có cơ khí: kích thước bo, lỗ vít, vỏ | CSV B27–B30 |
| B-9 | Công cụ | `kicad-cli` **không có trên máy**: `which kicad-cli` → không tìm thấy; `C:\Program Files\KiCad` tồn tại nhưng rỗng; không có `kicad-cli.exe` ở các đường dẫn cài đặt thường gặp | Lệnh chạy 12/11 |

## 5. Mâu thuẫn giữa tài liệu

| # | Mâu thuẫn | Xử lý trong lượt này |
|---|---|---|
| M1 | Q5 (07/11) chọn **4 lớp**; `supersession.md` P0-01 cũng ghi "hai PCB 4 lớp". Ràng buộc founder 12/11 là **2 lớp**. `kicad-input-spec-r7.md` §3.3 lại "giả định 2 lớp, 1 oz" | Lấy 2 lớp theo chỉ thị mới nhất của founder. Ghi vào "Cần founder quyết" để thay Q5 chính thức |
| M2 | Handoff 10/11 nói cấu hình hiện hành là r12 (Li-ion Jauch, BQ25170, cassette). Handoff 11/11 nói không tiếp tục từ r12, hiện hành là r14 (3 AA) | Lấy 11/11 |
| M3 | `codex-b1-instructions.md` §2.3 dùng Rp 56 kΩ từ CC lên VBUS, VBUS luôn bật. `mobot-v2-evt0-b1-intake` sửa: phải phát hiện Rd rồi mới bật VBUS; F1 chốt theo bản sửa | Lấy F1 (phát hiện CC trước) |
| M4 | Bảng chân: `codex-b1-instructions.md` §2.2 có gán chân cụ thể và header I²C; r14 nói "chưa gán chân" và "không triển khai cổng I²C phụ kiện" | r14 mới hơn: coi là chưa gán; tài liệu thiết kế đề xuất bảng mới |
| M5 | Bo MCU: r6/r7 dùng BrijModi CP2102 Micro-USB (khoảng hàng 25,5016 mm, interposer eLabGuy). Q8 đổi sang USB-C CH340 chưa đo | Lấy Q8. Netlist r7 phần interposer Micro-USB, detector VBUS_PROG, TS3USB221 không còn áp dụng |
| M6 | Motor: r6 ghi Pololu #992; CSV B02 ghi GA12-N20 6 V 100 rpm (hàng VN). Dòng kẹt chỉ có số ngoại suy 0,36 A của Pololu | Thiết kế theo giới hạn dòng của driver, không theo dòng kẹt motor |
| M7 | Robot sạc: r7 "BQ25886 đã chốt (R5)"; đề xuất 11/11 E5 "sạc rời" chưa ký; không có file founder-decision nào khóa BQ25886 | Không LOCKED. Đưa vào "Cần founder quyết" |
| M8 | TVS trên VM: r7 dùng SMAJ8.0A (VRWM 8,0 V) trên rail 6 V. Nếu VM nối thẳng pack 8,4 V thì VRWM < điện áp làm việc | Xử lý ở Giai đoạn 2 |
| M9 | Ngưỡng UVLO tay cầm: r13 dùng TPS3808G01 (3,153–3,295 V), r14 dùng TPS3760 (3,182–3,266 V), intake loại S-1009 | Chưa chốt; chọn lại ở Giai đoạn 2 |

## 6. Báo cáo Giai đoạn 1

- Đã làm: quét hồ sơ theo thứ tự mới nhất trước; lập bảng khối, LOCKED, blocker, mâu thuẫn.
- File ghi: `docs/hardware/claude-support/2026-11-12-pcb-2layer/01-hien-trang.md`.
- Lệnh đã chạy: liệt kê `docs/hardware/**` (179 file, ≈ 1,22 MB markdown); tìm `*.kicad_*` (chỉ có bo tham chiếu); `which kicad-cli` (không có); glob `kicad-cli.exe` (rỗng).
- Chưa kiểm chứng: nội dung chi tiết P0-02…P0-15, `final-values.md`, `docs/agents/runs/**`, trạng thái queue `tasks.json` (không chạy validator trong lượt này). Không dùng subagent.
