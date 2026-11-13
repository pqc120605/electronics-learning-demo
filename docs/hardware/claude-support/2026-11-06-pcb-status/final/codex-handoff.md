# Bàn giao Codex · đối chiếu r7 (06/11/2026)

## Trả lời review 06/11 (07/11/2026)

Box02/box08 trả changes_requested ([handoff](../../../mobot-handset-claude-review-handoff-2026-11-06.md)). Delta, bảng quyền cấp nguồn và bảng lỗi đơn nằm ở [delta-handset-2026-11-07.md](delta-handset-2026-11-07.md). Box08 tái review đúng snapshot mới, hash ở cuối file delta. Phép đo bổ sung: [bench-additions.md](bench-additions.md). Ghi chú người dùng: [huong-dan-nguoi-dung-nguon.md](huong-dan-nguoi-dung-nguon.md).

## Bắt đầu PCB (07/11/2026)

Gói đầu vào cho KiCad:
- [kicad-input-spec-r7.md](kicad-input-spec-r7.md): netlist hai carrier, pin map GPIO, quy tắc layout, checklist ERC/DRC.
- [final-bom.md](final-bom.md): giá trị, MPN, trạng thái từng dòng.
- [thiet-ke-va-y-do.md](thiet-ke-va-y-do.md): lý do thiết kế.

Quyết định founder ngày 07/11/2026:
- xISEN: để footprint Schottky DNP trên mẫu đầu, thử BT-ISEN.
- Connector pack: tay cầm JST PH 2,0 mm, robot JST XH 2,54 mm (kiểm cực tính với pack thật).
- MOSFET tín hiệu dùng SOT-23: DMN2075U-7 (N), DMG2305UX-7 (P).
- UVLO robot falling 6,40–6,60 V (06/11).

Trình tự đề nghị cho HQ:
1. **Đã xong 07/11/2026:** user duyệt đúng hash r7 `9ef75eb9…61d5d` ([biên bản](r7-approval-record.md)). HQ cần ghi nhận vào record cấu hình và `tasks.json`.
2. HQ cấp lease `MM-HW-MOBOT-REMOTE-KICAD-001` (tay cầm trước).
3. Box08 review các dòng "Đề xuất" trong `final-bom.md`, song song với box03 vẽ schematic tay cầm theo `kicad-input-spec-r7.md`. Box08 yêu cầu sửa gì thì sửa trước layout.
4. Box03 chọn MPN còn `[box03]` (điện trở, tụ, LED, cuộn cảm 10 µH, tụ polymer 220 µF, PTC, connector) và đối chiếu land pattern.
5. Đặt mẫu, chạy BT-H2/H3/H4, rồi làm robot (`MM-HW-MOBOT-ROBOT-KICAD-001`) với BT-R1a/R4/ISEN.

Bench và dữ liệu NCC không chặn schematic hay layout mẫu đầu.

**Sửa sau review 07/11** (chi tiết ở `thiet-ke-va-y-do.md` §8–§9):
- Tay cầm: SEL không tụ, eFuse pass U9, ILIM 5,11 kΩ, latch Q6/Q7 với nút SW4.
- Robot: L2 nối PMID–SW, AND3 MOTOR_EN, R34 = 68k, LDO quay lại TPS7A2033.
- Chốt nốt 07/11 (`thiet-ke-va-y-do.md` §10): latch robot, U16 TPS259474L thay LM66100, pass VBUS robot U17/Q8, trễ CE R63/C31, PS/SYNC chọn bằng 0 Ω.
- Chỉ còn dữ liệu NCC (NTC B15/B04, PCM LK37478) và các phép đo trên mẫu đầu. Không mục nào chặn schematic hay layout.

Đầu vào: [final-values.md](final-values.md), [datasheet-checks.md](datasheet-checks.md), [calc_r7.py](calc_r7.py), [kicad-spec-patch.md](kicad-spec-patch.md). Đây là gói advisory. Nó không thay verdict của box08 và không thay phê duyệt hash r7.

## Box02 · xác minh

1. Chạy `python calc_r7.py` và đối chiếu từng hàm với datasheet trong `datasheet-checks.md`.
2. Tra 3 nguồn chưa tải được: bảng R‑T Semitec 103AT-2, Littelfuse SMAJ, IPC-2221. MAX98357A đã tra từ bản user cung cấp.
3. H-3: giải lại mạng TPS3808G01 với điện trở 0,1 %, Thevenin ≤ 10 kΩ và hysteresis chỉ tác dụng khi RESET thấp. Mục tiêu: V_fall giữ 8,25 ±0,2 %, V_rise ≥ 3,50 V.
4. H-4: thiết kế detector có giám sát đứt sense và veto độc lập, theo ma trận chuyển nguồn.
5. R-1: thiết kế mạng CE giữ OUT1 TUSB320 ≤ VDD + 0,3 V và giữ CE cao khi TUSB320 chưa có nguồn.
6. R-3/R-2/R-5: một sơ đồ EN thống nhất cho TPS54302, UVLO robot và MOTOR_EN, có tín hiệu LOGIC_EN dạng số 3,3 V.
7. H-6: tìm điện dung lấy mẫu ADC1 (Espressif TRM hoặc hỏi Espressif).

## Box08 · review các ĐỀ XUẤT THAY ĐỔI và BÁC

| ID | Việc |
|---|---|
| H-2 | Duyệt đổi TPS259474A → TPS259474LRPWR (latch-off), vì tRST không có cận min. Ghi nhận ILIM 0,660–0,918 A. Kiểm xử lý chân OVLO. |
| H-3 | DeepSeek dùng ±1 % cho V_fall min 3,200 V. R_H làm V_fall tụt khi RESET có pull-up. Chấp nhận hướng sửa của box02. |
| H-4 | Detector một tầng fail-ON khi đứt sense. Giữ `changes_requested`. |
| R-1 | Mạng TS 5,11k/26,7k dừng ở ~60 °C, không phải 45 °C. CE kéo lên REGN vượt abs max OUT1. Xét đánh đổi T3 nếu chọn mạng dừng ở 45 °C (founder). |
| R-3 | Dải VOUT 4,852–5,286 V. Duyệt FB 100k/13,3k hay 750k/100k. |
| R-5 | LOGIC_EN analog 1,22–1,77 V không lái được cổng LVC. nSLEEP VIH là 2,5 V. |
| R-6 | ISEN 1,25–2,07 V khi ngắn mạch trước OCP. Quyết định hỏi TI hay thêm bảo vệ. |
| R-7 | Kẹp chủ động TLV6700 + DMP3098L + 22 Ω là đề xuất. Điện trở 3,06 W không vừa 2512. |
| R-8 | Đổi TPS7A2033 → TPS7A2036PDBVR vì TUSB320 cần VDD ≥ 3,5 V khi nguồn 3 A. |
| R-2 | FAIL với TLV6700 dưới cửa sổ founder 6,40–6,60 V. Duyệt IC thay thế (ĐỀ XUẤT THAY ĐỔI). |
| R-9 | DIR của 8T245 nối VCCA (A→B). OE pull-up lên VCCA. Kiểm pull-up nội EN của TCA9517A. MAX98357A: bỏ pull-down 100k ngoài trên SD_MODE, dùng pull-down nội. GAIN_SLOT = GND (12 dB). |

## Box03 · MPN

- L1 TPS61023: 1,0 µH, Isat ≥ 4,5 A, DCR ≤ 20 mΩ (họ trong SLVSF14B Bảng 8-2).
- R15/R16: 732k/100k ±1 % 0603. C3/C4: 10 µF và 2 × 22 µF 10 V X7R 0805.
- C7 robot: ≥ 220 µF hiệu dụng 16 V low-ESR, ghi ESR.
- Nếu box08 duyệt: TPS259474LRPWR, TPS7A2036PDBVR, 2× TMUX1511 (package), điện trở 0,1 % cho chia áp UVLO.
- 103AT-2: lấy bảng R‑T và dung sai từ Semitec.

## Founder · CẦN FOUNDER

1. **R-2: đã chốt 06/11/2026.** Founder giữ falling 6,40–6,60 V tại pack. TLV6700 không đạt cửa sổ này (VIT− 0,387–0,400 V rộng hơn ±1,55 %). Box08 cần duyệt IC có ngưỡng falling ≤ ±0,73 % (điện trở 0,1 %, tỉ số 16,475). Box02 tìm và tra datasheet ứng viên.
2. **R-4:** chọn TPS63070 forced PWM (năng lượng phanh về pack, rủi ro khi BMS mở) hoặc PFM (năng lượng dồn vào tụ VM).
3. **R-1 (kèm theo):** nếu cửa sổ sạc phải dừng ở 45 °C, thì pack chỉ nạp tới 8,0 V khi trên khoảng 32 °C. Cách khác là giữ dừng ở 60 °C theo JEITA của IC.

## Bench · CHỐT CÓ ĐIỀU KIỆN

| ID | Phép đo |
|---|---|
| H-1 | BT-H2: V5 tại DevKit sau eFuse khi Wi‑Fi TX, pack 3,0–3,2 V; VOUT min tính được 4,742 V |
| H-5 | BT-H4: SEL TMUX khi 3V3_DEV ramp và MCU reset; rò I/O ≤ 10 µA tổng |
| H-8 | BT-H3: dòng VBUS tổng ≤ 0,5 A khi sạc và LED sáng; inrush khi cắm USB-C |
| R-7 | BT-R1a: L motor #992; BT-R4: đỉnh VM ≤ 9,0 V khi đảo chiều, xung lặp, pack đầy/BMS mở |

Kết quả bench hiện là `UNKNOWN`.
