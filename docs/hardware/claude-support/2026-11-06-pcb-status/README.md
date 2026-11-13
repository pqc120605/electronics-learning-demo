# MoBot V2 r7 · PCB đã tính đến đâu (Claude, 06/11/2026)

Audit chỉ-đọc trên hồ sơ trong `docs/hardware/` tới 05/11 23:48. Không sửa file nào ngoài thư mục này. Không có file KiCad, không có số đo bench.

## Trạng thái gate

| Mục | Trạng thái | Nguồn |
|---|---|---|
| Cấu hình r7 (H3, R1, R5) | Founder đã quyết; bytes r7 SHA-256 `9ef75eb9…61d5d` **chờ user duyệt hash**, record vẫn `proposed` | `mobot-v2-config-2026-11-05-r7.md`, `mobot-v2-r7-box08-review-packet.md` |
| MM-HW-MOBOT-IF-001 | `in_review` | `docs/agents/tasks.json` |
| MM-HW-MOBOT-REMOTE-KICAD-001 | `scoped`, box08 `changes_requested`, chưa cấp lease | `mobot-v2-r7-handset-qa-disposition.md` |
| MM-HW-MOBOT-ROBOT-KICAD-001 | `scoped`, đứng sau tay cầm | `mobot-v2-r7-handset-closure-brief.md` |
| MM-HW-001, MM-BOM-001 | `waiting` | `tasks.json` |
| `kicad-input-spec.md` | 60 dòng còn `[TBD]`/`[THIẾU]` | `grep -c TBD` |
| Bench | Chưa chạy, mọi kết quả `UNKNOWN` | `bench-test-plan.md` |

## A. Đã tính và chốt (hoặc đạt phép tính tĩnh)

| ID | Kết quả | Giới hạn còn lại |
|---|---|---|
| H3 | MCP73833-FCI/MF, RPROG 2,49 kΩ ±1% → 0,402 A danh nghĩa, dải 0,358–0,446 A; timer 5,4–6,6 h; ~1,93 Ah CC trước taper; TJ ~83 °C ở 40 °C (bo 4 lớp chuẩn) | Profile sạc + NTC của B15, phân biệt timeout/termination, LDO test mode khi vắng pack |
| R1 | 0,62 Ω ±1% → trip tĩnh 0,256 / 0,323 / 0,391 A | L motor ≥ 0,39 mH chờ BT-R1a; đỉnh quá độ khi đảo chiều |
| R5 | Chỉ sạc khi TUSB320LAI báo 1,5 A/3 A; RILIM 1,24 kΩ → ~0,895 A danh nghĩa | CE mặc định tắt, OUT1 high-Z, ICHGSET (xem B) |
| H4 (UVLO tay cầm) | TPS3808G01, hệ số 8,25 → falling 3,266–3,417 V, biên 65,8 mV tới 3,20 V | Trễ phát hiện→ngắt + sụt áp xung B15; ngưỡng re-arm |
| H4 (khối) | Ma trận 4 trạng thái USB `00/10/01/11` + chuyển tiếp; TPS259474A ứng viên; ADC1 cho joystick | Xem C |
| Ngân sách | Tay cầm 0,977 A, robot 1,762 A (η = 80% giả định); biên B04 0,238 A | Dòng xung, nhiệt, số NCC |
| R4 (mô hình) | 2,03 mJ cho 2 cuộn 10 mH ở 0,45 A; 220 µF giữ VM ≤ 7,5 V | Chỉ năng lượng cuộn dây, chưa cơ năng/xung lặp |
| Trace | IPC-2221: 1,2 A ngoài/trong 0,386/1,005 mm; 2,5 A 1,063/2,765 mm | Chưa có stackup, độ dày đồng |
| ADC | Cận settling 9,01 τ (12 bit, ½ LSB) | Thời gian tuyệt đối TBD |

## B. Đã tính nhưng sai hoặc bị bác

| ID | Vấn đề | Hệ quả |
|---|---|---|
| R5 | ICHGSET 7,68 kΩ trong input spec cho ~2 A theo ICHG = R/3810 Ω/A, không phải 0,50 A | Phải tính lại; ứng viên danh nghĩa ~1,91 kΩ, cần xác nhận miền áp dụng công thức |
| H4/R6 | TLV6700: OUTB sink khi INB **trên** ngưỡng, high-Z khi dưới → logic UVLO kéo EN bị đảo cực | Tay cầm đã chuyển sang TPS3808; robot (UV2_DIV 1,5 MΩ/97,6 kΩ) còn dùng logic cũ |
| H4 | LM66100 đơn không chặn được đường qua diode thân; CE không có ngưỡng logic cố định | Thay bằng TPS259474A đối lưng |
| H4 | TMUX1574 chỉ 4 kênh, cần 5 đường I/O | Đề xuất 2× TMUX1511 |
| R4 | SMAJ8.0A clamp 13,6 V > 10,8 V vận hành DRV8833 | TVS một mình không đóng R4 |
| R6 | Không kéo EN TPS54302 thẳng lên pack 8,4 V (khuyến nghị 5,5 V, tuyệt đối 7 V) | Cần chia áp/kẹp EN |
| H3 | Ghi 0,27C/0,44C là sai đơn vị; với 2 Ah là 0,137C/0,221C | Sửa nhãn |

## C. Chưa tính, có thể chốt bằng tính toán + datasheet

Tay cầm:
1. TPS61023: chia áp FB cho 5,0 V, L (0,37–2,9 µH hiệu dụng), Cin/Cout; biên EN LOW ≤ 0,35 V.
2. TPS259474A: chia áp EN/UVLO (OFF < 0,45 V, ON > 1,223 V), ILIM, chọn A (auto-retry) hay L (latch-off) theo cận thời gian retry.
3. TPS3808G01: mạng re-arm/hysteresis (mục tiêu ≥ 3,50 V), tụ CT, cận trễ tổng phát hiện→tải OFF.
4. Detector raw VBUS (Q_PROG/Q_CHG): chia áp gate, ngưỡng detect/deassert, bias, fail-safe khi đứt sense.
5. 2× TMUX1511: logic EN (chỉ HIGH ở `00`, giữ LOW khi mất bias), pull-up nút, ngân sách rò.
6. Thời gian chờ ADC tuyệt đối từ R_wiper, RON, C_eff.
7. MCP73833: CIN, CBAT, LED + điện trở, pull-up PG về input charger, xử lý NTC hở/ngắn.
8. Dòng USB tổng (charger + bias + LED + inrush) ≤ 500 mA.

Robot:
9. BQ25886: ICHGSET cho 0,50 A, mạng TS cho NTC 103AT-2, logic CE từ CHG_OK_N, L/C theo SLUUC11.
10. Thay UVLO robot (TLV6700 hoặc IC khác) với cực tính đúng + hysteresis.
11. TPS54302: FB cho 5 V, L, C, chia áp/kẹp EN.
12. TPS63070: FB cho 6 V, L, C, chọn PS/SYNC (forced PWM hay power save) theo R4.
13. MOTOR_EN = LOGIC_EN AND MCU_MOT_EN, OFF khi reset/high-Z; nSLEEP pull-down.
14. RC lọc ISEN → ADC1, kiểm ISEN abs max khi ngắn mạch.
15. R4: phương án kẹp VM (brake clamp/active clamp/TVS khác) để đỉnh ≤ 9,0 V [TBD].
16. LDO 3,3 V cho TUSB320LAI từ VBUS.
17. SN74LVC8T245 DIR/OE, TCA9517A EN, mức OLED, MAX98357A SD_MODE/GAIN.
18. Bề rộng trace theo stackup đề xuất (2 lớp 1 oz hoặc 4 lớp).

## D. Không chốt được bằng tính toán

| Mục | Cần gì | Ai |
|---|---|---|
| H1 / R3 | Hồ sơ cell/PCM, nội trở, xung, NTC của B15 (LK37478) và B04 | Founder / NCC |
| Interposer | Bản vẽ eLabGuy Rev. 1.0 / datasheet Rev. 1.1, đường VBUS | Box03 |
| R1 / R4 | L và R motor #992 (BT-R1a) | Bench operator |
| H2 / R2 / R4 | Sụt áp xung, ngưỡng kẹt, đỉnh VM thật | Bench sau khi có mẫu |
| r7 | User duyệt đúng hash; HQ cấp lease | User, HQ |

Nhóm C là phạm vi giao DeepSeek: xem [deepseek-prompt.md](deepseek-prompt.md). Kết quả DeepSeek là đầu vào advisory. Box02 cần đối chiếu datasheet và box08 cần review trước khi bất kỳ giá trị nào vào `kicad-input-spec.md`.
