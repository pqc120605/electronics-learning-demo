# MoBot V2 r7 · Đầu vào KiCad mức netlist (07/11/2026)

File này thay [`../../2026-11-05-mobot-r6/kicad-input-spec.md`](../../2026-11-05-mobot-r6/kicad-input-spec.md) cho r7. File gốc không bị sửa. Giá trị, MPN và trạng thái lấy từ [final-bom.md](final-bom.md). Lý do thiết kế nằm ở [thiet-ke-va-y-do.md](thiet-ke-va-y-do.md). Phép tính ở `calc_r7.py`.

**Thứ tự: tay cầm trước, robot sau.**

## 0. Cổng trước khi vẽ

Codex chỉ mở KiCad khi đủ 3 điều kiện:

1. User duyệt đúng hash r7 (`9ef75eb9…61d5d`), và HQ ghi nhận.
2. HQ cấp lease cho `MM-HW-MOBOT-REMOTE-KICAD-001`.
3. Box08 review các dòng **Đề xuất** trong `final-bom.md`. Có thể review song song với bước vẽ schematic. Mọi thay đổi box08 yêu cầu phải vào trước layout.

Các phép đo bench (BT-…) và dữ liệu NCC **không chặn schematic hay layout mẫu đầu**. Chúng được đo trên chính mẫu này. Footprint đã chừa chỗ cho các phương án thay thế.

## 1. Quy ước

- Điện trở 0603 ±1 % trừ khi ghi khác. "0,1 %" là thin-film ±0,1 %, TCR ≤ 25 ppm/°C.
- Tụ gốm X7R trừ khi ghi khác. Box03 kiểm derating DC bias.
- Footprint KiCad 10: `Resistor_SMD:R_0603_1608Metric`, `Capacitor_SMD:C_0603_1608Metric` / `C_0805_2012Metric`, `Package_TO_SOT_SMD:SOT-23` / `SOT-23-5` / `SOT-23-6`. Footprint IC đặc biệt: box03 đối chiếu land pattern TI (RPW, RNM, RGE, DRL, RWB, PW).
- Tên net nguồn viết hoa. `V3V3_DEV` là chân 3V3 của DevKit.
- DevKit: BrijModi ESP32 DevKit V1 30 chân, hai socket 1×15 bước 2,54 mm, cách 25,5016 mm, lệch 0,1016 mm (`mobot-v2-r5-kicad-preflight.md:7`).

---

## 2. Tay cầm

### 2.1 Netlist

| RefDes | Linh kiện | Chân → net |
|---|---|---|
| J1 | USB4105-GF-A | VBUS→VBUS_C; CC1→CC1; CC2→CC2; GND, SHIELD→GND |
| R1, R2 | 5,1 kΩ | CC1–GND; CC2–GND |
| R23 | 10 kΩ | VBUS_C–GND, đặt sát J1 (R_far USB-C) |
| C1 | 4,7 µF 10 V 0805 | VBUS_C–GND, sát U1 |
| U1 | MCP73833-FCI/MF | VDD→VBUS_C; VBAT→VPACK; PROG→R3; THERM→NTC_H; STAT1→LED1_K; STAT2→LED2_K; PG→LED3_K; VSS, EP→GND |
| R3 | 2,49 kΩ | PROG–GND |
| C2 | 4,7 µF 10 V 0805 | VPACK–GND, sát VBAT |
| R4–R6, D1–D3 | 680 Ω + LED | VBUS_C→R→LED anode; LED cathode→LEDx_K |
| J3 | NTC 103AT-2, 2 dây | 1→NTC_H; 2→GND. Không pull-up NTC_H |
| J2 | JST PH 2,0 mm 2 chân | 1→VPACK_RAW; 2→GND. In cực tính trên silkscreen |
| F1 | PTC | VPACK_RAW–VPACK |
| U2 | TPS3808G01DBVR | VDD→VPACK; SENSE→UV_DIV; RESET→LOAD_EN; CT hở; MR hở; GND |
| R7 | 72,3 kΩ 0,1 % | VPACK–UV_DIV |
| R8 | 9,20 kΩ 0,1 % | UV_DIV–GND |
| R9 | 866 kΩ 0,1 % | VPACK–UV_SW |
| Q1 | DMN2075U-7 | D→UV_SW; S→UV_DIV; G→LOAD_EN |
| Q6 | DMG2305UX-7 | S→VPACK; G→LATCH_G; D→LEN_PU (latch, sửa 07/11) |
| R10 | 47 kΩ | LEN_PU–LOAD_EN (pull-up duy nhất của LOAD_EN, chỉ có nguồn khi Q6 dẫn; delta 07/11) |
| R_pd | 220 kΩ | LOAD_EN–GND (Q6 tắt → LOAD_EN ≤ 205 mV) |
| R57 | 100 kΩ | VPACK–LATCH_G. Không có tụ trên LATCH_G |
| Q7 | DMN2075U-7 | D→LATCH_G; S→GND; G→LEN_FB |
| R58, R59 | 1 MΩ; 2 MΩ | LOAD_EN–LEN_FB; LEN_FB–GND |
| SW4 | nút nhấn ON (momentary) | VPACK–SW_A khi nhấn |
| R60 | 1 MΩ | SW_A–GND |
| C_t | 22 nF | SW_A–TRIG_G (kích theo sườn: 2,35–5,89 ms mỗi lần nhấn) |
| R_tg | 100 kΩ | TRIG_G–GND |
| Q_trig | DMN2075U-7 | D→LATCH_G; S→GND; G→TRIG_G |
| U12 | TLV6710DDCR (PG-timeout) | VDD→VPACK; INB→PGT_X; OUTB→LOAD_EN; INA→GND; GND |
| R_x, C_x | 1 MΩ; 150 nF | LOAD_EN–PGT_X; PGT_X–GND (16,8–27,6 ms) |
| Q_pg | DMN2075U-7 | D→PGT_X; S→GND; G→PG_NODE |
| R_pg | 1 MΩ | LOAD_EN–PG_NODE (PG U6 open-drain) |
| SW1 | công tắc tín hiệu | LOAD_EN–GND khi OFF (OFF cứng) |
| U3 | TLV6710DDCR (Micro) | VDD→VPACK; INB→S_PROG_F; OUTB→LOAD_EN; INA→GND; OUTA NC; GND |
| R20 | 220 kΩ | VPACK–S_PROG |
| R24 | 10 kΩ | S_PROG–S_PROG_F |
| U4 | TLV6710DDCR (USB-C) | VDD→VPACK; INB→S_C_F; OUTB→LOAD_EN; INA→GND; OUTA NC; GND |
| R21 | 220 kΩ | VPACK–VBUS_C. Sense USB-C lấy thẳng tại VBUS_C, vì R23 là R_far |
| R25 | 10 kΩ | VBUS_C–S_C_F |
| U5 | TPS61023DRLR | VIN→VPACK; EN→LOAD_EN; SW→SW_BST; VOUT→V5_BST; FB→FB_BST; GND |
| L1 | 1,0 µH | VPACK–SW_BST |
| R15, R16 | 732 kΩ / 100 kΩ | V5_BST–FB_BST; FB_BST–GND |
| C3 | 10 µF 10 V 0805 | VPACK–GND, sát VIN |
| C4a, C4b | 22 µF 10 V 0805 | V5_BST–GND, sát VOUT |
| U6 | TPS259474LRPWR | IN→V5_BST; OUT→V5_DEV; EN/UVLO→EN_EF; OVLO→GND; ILM→R13; ITIMER→C5; DVDT→C6; PGTH→R_pt1/R_pt2 (100 kΩ từ V5_DEV / 39,2 kΩ xuống GND, PG ở 4,14–4,41 V); PG→PG_NODE; PG NC; GND |
| R11 | 10 kΩ | LOAD_EN–EN_EF |
| R13 | 5,11 kΩ | ILM–GND (ILIM 0,545–0,758 A, sửa 07/11) |
| C5 | 1,0 nF | ITIMER–GND |
| C6 | 2,2 nF | DVDT–GND |
| R26 | 10 kΩ | LOAD_EN–SEL_NET. **Không có tụ** trên SEL_NET (sửa 07/11): mux phải ngắt cùng lúc với LOAD_EN |
| U7 | TMUX1511PWR | VDD→V3V3_DEV; SEL1–SEL4→SEL_NET; S1/D1 JOY_X_C/JOY_X; S2/D2 JOY_Y_C/JOY_Y; S3/D3 JOY_SW_C/JOY_SW; S4/D4 JOY_VCC/V3V3_DEV; GND |
| U8 | TMUX1511PWR | VDD→V3V3_DEV; SEL1, SEL2→SEL_NET; SEL3, SEL4→GND; S1/D1 BTN1_C/BTN1; S2/D2 BTN2_C/BTN2; S3, S4, D3, D4 NC; GND |
| C26, C27 | 0,1 µF | VDD U7, U8–GND |
| R27–R29 | 10 kΩ | JOY_SW, BTN1, BTN2 (phía DevKit) – V3V3_DEV |
| C8, C9 | 100 nF | JOY_X–GND; JOY_Y–GND (phía DevKit) |
| J8 | Joystick 5 chân | VCC→JOY_VCC; GND; VRx→JOY_X_C; VRy→JOY_Y_C; SW→JOY_SW_C |
| SW2, SW3 | nút 6×6 | BTN1_C–GND; BTN2_C–GND |
| J4 | Micro-USB B (người dùng cắm) | VBUS→VBUS_PROG; D−→USB_DM; D+→USB_DP; ID NC; GND |
| R22 | 10 kΩ | VBUS_PROG–GND, **đặt tại J4/interposer**, đầu xa của dây sense |
| — | Dây sense | VBUS_PROG (sau R22) → S_PROG, đi riêng với dây nguồn |
| J5 | Cáp ngắn tới Micro-USB DevKit | VBUS_PASS, USB_DM, USB_DP, GND. Jumper VBUS trên interposer eLabGuy Rev. 1.1 **để hở**; VBUS phía DevKit chỉ đến từ VBUS_PASS |
| U9 | TPS259474LRPWR (pass VBUS) | IN→VBUS_PROG; OUT→VBUS_PASS; EN/UVLO→EN_PASS; OVLO→GND; ILM→R54; ITIMER→C28; DVDT hở; PGTH→GND; PG NC; GND |
| R55, R56 | 100 kΩ; 45,3 kΩ | VBUS_PROG–EN_PASS; EN_PASS–GND (bật khi VBUS ≥ 3,74–3,98 V) |
| C29 | 100 nF | EN_PASS–GND (trễ bật 3,9–6,9 ms) |
| Q5 | DMN2075U-7 | D→EN_PASS; S→GND; G→LOAD_EN (carrier ON thì pass OFF) |
| R54 | 6,65 kΩ | ILM U9–GND (0,421–0,581 A, điểm bảng 6.5; delta 07/11) |
| C28 | 10 nF | ITIMER U9–GND (4,6–16 ms) |
| U10 | TLV6710DDCR (veto đo thực) | VDD→VBUS_PROG; INB→V5B_SNS; OUTB→EN_PASS; INA→GND; GND |
| R_v1, R_v2 | 100 kΩ; 68,1 kΩ | V5_BST–V5B_SNS–GND (chặn khi V5_BST > 0,97–1,01 V) |
| R_dis | 2,2 kΩ 0,1 W | V5_BST–GND (xả rail cũ 130–184 ms) |
| U11 | TLV6710DDCR (veto sau pass) | VDD→VPACK; INB→10 kΩ→VBUS_PASS; OUTB→LOAD_EN; INA→GND; GND |
| R_pp | 10 kΩ | VBUS_PASS–GND |
| U13 | TS3USB221DRCR | VCC→V3V3_DEV; S→GND; OE→OE_D; D+/D−↔J4 USB_DP/USB_DM; 1D+/1D−↔J5; 2D+/2D− NC |
| R_oe | 100 kΩ | V3V3_DEV–OE_D |
| Q_D, R_d1, R_d2 | DMN2075U-7; 100 kΩ; 100 kΩ | D→OE_D; S→GND; G←VBUS_PASS/2 |
| C_d | 0,1 µF | VCC U13–GND |
| C30 | 1 µF 10 V | VBUS_PROG–GND sát U9 IN |
| J6, J7 | Socket 1×15 | VIN→V5_DEV; GND; 3V3→V3V3_DEV; GPIO theo 2.2 |

USB_DM/USB_DP: cặp vi sai 90 Ω, ngắn, không qua via nếu được. Đi qua U13 TS3USB221; giữ đối xứng hai nhánh.

### 2.2 Pin map GPIO tay cầm

| Tín hiệu | GPIO (nhãn header) | Lý do |
|---|---|---|
| JOY_X | GPIO34 (D34) | ADC1_CH6, chỉ vào |
| JOY_Y | GPIO35 (D35) | ADC1_CH7, chỉ vào |
| JOY_SW | GPIO32 (D32) | không phải chân strap |
| BTN1 | GPIO33 (D33) | không phải chân strap |
| BTN2 | GPIO25 (D25) | không phải chân strap |

Không dùng GPIO0, 2, 5, 12, 15 (strap) và GPIO1/3 (UART nạp). Pull-up nút đặt bên ngoài (R27–R29), không dựa vào pull-up nội.

### 2.3 Net nguồn và layout

| Net | Dòng | Vẽ tối thiểu |
|---|---|---|
| VPACK_RAW, VPACK | 1,2 A | 0,6 mm, đổ đồng |
| V5_BST, V5_DEV, VBUS_C, VBUS_PROG | 0,6 A | 0,4 mm |
| SW_BST | 2,7 A đỉnh | Vòng ngắn nhất theo layout EVM TPS61023 |
| UV_DIV, UV_SW, S_PROG_F, S_C_F | tín hiệu | Ngắn, xa SW_BST, có GND bảo vệ |
| GND | — | Mặt đồng liền lớp dưới |

Đặt R7/R8/R9/Q1 sát U2. Đặt C1, C2 sát U1. Phần đế EP của U1 nối GND bằng via nhiệt. Datasheet cho TJ 83 °C ở 40 °C với bo 4 lớp chuẩn; bo 2 lớp sẽ nóng hơn, nên đổ đồng rộng.

---

## 3. Robot

### 3.1 Netlist

| RefDes | Linh kiện | Chân → net |
|---|---|---|
| J1 | USB4105-GF-A | VBUS→VBUS_C; CC1; CC2; GND |
| R40 | 10 kΩ | VBUS_C–GND sát J1 (R_far) |
| U2 | TPS7A2033PDBVR | IN→VBUS_C; EN→VBUS_C; OUT→V3V3_USB; GND |
| C10, C11 | 1 µF | VBUS_C–GND; V3V3_USB–GND |
| U1 | TUSB320LAIRWBR | VDD→V3V3_USB; CC1, CC2; ADDR NC; PORT→GND; EN_N→GND; VBUS_DET→R53; OUT1→CHG_OK_N; OUT2 NC; INT_N/OUT3 NC; ID NC; GND |
| R53 | 910 kΩ | VBUS_C–VBUS_DET (SLLSEQ8D: "pulled up to VBUS through a 900-k resistor") |
| R30 | 100 kΩ | CHG_OK_N–V3V3_USB |
| Q3 | DMG2305UX-7 | S→V3V3_USB; G→CHG_OK_N; D→CE_DRV |
| R32 | 100 kΩ | Q2G–GND |
| R63 | 10 kΩ | CE_DRV–Q2G |
| C31 | 1 µF 10 V | Q2G–GND (trễ bật sạc 3,6–3,8 ms, xung OUT1 < 1,3 ms không bật) |
| Q2 | DMN2075U-7 | D→CE_CHG; S→GND; G→Q2G |
| R31 | 100 kΩ | REGN–CE_CHG |
| U3 | BQ25886RGET | VBUS→VBUS_C; PMID; SW→SW_CHG; BTST; SYS→SYS_CHG; BAT→VPACK2; ILIM→R1; ICHGSET→R2; VSET hở; TS→TS_NET; CE→CE_CHG; OTG→GND; REGN; STAT→LED_CHG (tùy chọn); GND/PGND |
| R1, R2 | 1,24 kΩ; 1,91 kΩ | ILIM–GND; ICHGSET–GND |
| RT1, RT2 | 9,53 kΩ; 511 kΩ | REGN–TS_NET; TS_NET–GND |
| J3 | NTC 103AT-2 | TS_NET; GND |
| L2 | 1,0 µH | **PMID–SW_CHG** (sửa 07/11 theo SLUSD88A Figure 20: BQ25886 boost từ PMID lên SYS) |
| C12, C13 | 1 µF; 10 µF | VBUS–GND; PMID–GND |
| C14a, C14b | 22 µF 16 V | SYS_CHG–PGND. SYS **chỉ có tụ**, không nối tải |
| C15 | ≥ 10 µF hiệu dụng | VPACK2–GND sát BAT |
| C16, C17 | 47 nF; 4,7 µF | BTST–SW_CHG; REGN–GND |
| J2 | JST XH 2,54 mm 2 chân | 1→VPACK2_RAW; 2→GND |
| F1 | PTC | VPACK2_RAW–VPACK2 |
| U4 | TLV6710DDCR (UVLO) | VDD→VPACK2; INA→UV2_DIV; OUTA→EN_NODE; INB→GND; OUTB NC; GND |
| R3, R4 | 180 kΩ; 11,1 kΩ 0,1 % | VPACK2–UV2_DIV; UV2_DIV–GND |
| R5x | 2,84 MΩ 0,1 % | VPACK2–UV2_SW |
| Q4 | DMN2075U-7 | D→UV2_SW; S→UV2_DIV; G→EN_NODE |
| Q6R | DMG2305UX-7 | S→VPACK2; G→LATCH2_G; D→EN2_PU (latch robot) |
| R57R | 100 kΩ | VPACK2–LATCH2_G (không tụ) |
| Q7R, R61R | DMN2075U-7; 100 kΩ | D→R61R→LATCH2_G; S→GND; G→EN_NODE |
| SW4R | nút ON | VPACK2–SW2_TOP khi nhấn |
| R60R, R60R2 | 10 kΩ; 10 kΩ | SW2_TOP–SW2_A; SW2_A–GND (bước A = VPACK2/2 ≤ 4,2 V) |
| C_t2, R_tg2 | 22 nF; 100 kΩ | SW2_A–TRIG2_G; TRIG2_G–GND (xung 2,30–5,89 ms) |
| Q_trig2 | DMN2075U-7 | D→R61R2 100 kΩ→LATCH2_G; S→GND; G→TRIG2_G (VGS Q6R = −VPACK2/2) |
| C_p, R_p, D_p | 1 µF 16 V; 22 kΩ; BZT52C5V6 | VPACK2–POR_G; POR_G–GND; kẹp POR_G (giữ OFF ≥ 32 ms khi cắm pack) |
| Q_por | DMN2075U-7 | D→EN_NODE; S→GND; G→POR_G |
| R33, R34 | 100 kΩ; 68 kΩ | EN2_PU–EN_NODE; EN_NODE–GND (2,56–3,44 V khi cho phép) |
| D1 | BZT52C5V6 | EN_NODE (K)–GND (A) |
| SW1 | công tắc tín hiệu | EN_NODE–GND khi OFF |
| U5 | TLV6710DDCR (Micro) | VDD→VPACK2; INB→S2_PROG_F; OUTB→EN_NODE; INA→GND; GND |
| R35, R37, R51 | 470 kΩ; 100 kΩ; 10 kΩ | VPACK2–S2_PROG; S2_PROG–GND; S2_PROG–S2_PROG_F |
| U6 | TLV6710DDCR (USB-C) | VDD→VPACK2; INB→S2_C_F; OUTB→EN_NODE; INA→GND; GND |
| R36, R38, R52 | 470 kΩ; 100 kΩ; 10 kΩ | VPACK2–VBUS_C; VBUS_C–GND; VBUS_C–S2_C_F |
| R39 | 10 kΩ | VBUS_PROG–GND tại interposer robot |
| U7 | TPS54302DDCR | VIN→VPACK2; EN→EN_NODE; SW→SW_5V; BOOT→C20; FB→FB_5V; GND |
| R41, R42 | 100 kΩ; 13,3 kΩ | V5_R–FB_5V; FB_5V–GND |
| L3 | 10 µH | SW_5V–V5_R |
| C18, C19a/b, C20 | 10 µF 25 V; 2×22 µF; 0,1 µF | VIN; V5_R; BOOT–SW_5V |
| R45, R46 | 100 kΩ; 200 kΩ | V5_R–V5R_OK; V5R_OK–GND |
| U9 | SN74LVC1G11DBVR | VCC→V3V3_DEV; A→EN_NODE; B→V5R_OK; C→MCU_MOT_EN; Y→MOTOR_EN; GND (AND3, veto trực tiếp từ EN_NODE) |
| R47, R48 | 100 kΩ | MCU_MOT_EN–GND; MOTOR_EN–GND |
| U8 | TPS63070RNMR | VIN→VPACK2; EN→MOTOR_EN; PS/SYNC→R66 0 Ω→VPACK2 (lắp) / R67 0 Ω→GND (DNP); VSEL→GND; FB2 theo SLVSC58B (box03); L1, L2→L4; VOUT→VM_6V; FB→FB_6V; PG NC; VAUX→100 nF; GND/PGND |
| R43, R44 | 649 kΩ; 100 kΩ | VM_6V–FB_6V; FB_6V–GND |
| L4 | 1,5 µH | L1–L2 |
| C21a/b | 10 µF 25 V | VPACK2–GND sát VIN |
| C22a–c | 22 µF 16 V | VM_6V–GND sát VOUT |
| C23 | ≥ 220 µF hiệu dụng 16 V polymer | VM_6V–GND, sát chân VM của U10 |
| C8 | 10 µF + 1 µF | VM_6V–GND sát chân VM U10 |
| D2 | SMAJ8.0A | VM_6V–GND |
| U10 | DRV8833PWPR | VM→VM_6V; nSLEEP→MOTOR_EN; AIN1/AIN2/BIN1/BIN2←B-side U11; AOUT1/2→J4; BOUT1/2→J5; AISEN→ISEN_A; BISEN→ISEN_B; nFAULT→DRV_nFAULT; VCP 0,01 µF tới VM; VINT 2,2 µF; EP→GND |
| R5, R6 | 0,62 Ω 0,25 W 1206 | ISEN_A–GND; ISEN_B–GND (Kelvin về GND driver) |
| D3, D4 | Schottky DNP | ISEN_A–GND; ISEN_B–GND |
| R49, C24 / R50, C25 | 10 kΩ, 100 nF | ISEN_A→ISA_ADC–GND; ISEN_B→ISB_ADC–GND |
| U11 | SN74LVC8T245PWR | VCCA→V3V3_DEV; VCCB→V5_R; DIR→VCCA; OE→OE_N (100 kΩ lên VCCA + GPIO); A1–A8 ← GPIO; B1→AIN1, B2→AIN2, B3→BIN1, B4→BIN2, B5→I2S_BCLK, B6→I2S_LRCLK, B7→I2S_DIN, B8→US_TRIG |
| U12, U13 | SN74LVC2T45DCUR | VCCA→V3V3_DEV; VCCB→V5_R; DIR→GND (B→A, SCES516N Table 7-1); B← US_ECHO, IR1 / IR2, DRV_nFAULT; A→GPIO |
| U14 | TCA9517ADGKR | VCCA→V3V3_DEV; VCCB→V5_R; EN hở (pull-up nội); SDAA/SCLA↔GPIO; SDAB/SCLB→J7 |
| — | Pull-up I²C | 4,7 kΩ mỗi phía: A về V3V3_DEV, B về V5_R |
| U15 | MAX98357AETE+T | VDD→V5_R; SD_MODE→10 kΩ→V5_R; GAIN_SLOT→GND; BCLK/LRCLK/DIN←B-side U11; OUTP/OUTN→J6 |
| U16 | TPS259474LRPWR (thay LM66100) | IN→V5_R; OUT→V5_DEV; EN/UVLO→R64 10 kΩ→EN_NODE; OVLO→GND; ILM→R65 5,11 kΩ; ITIMER→1,0 nF; DVDT→2,2 nF; PGTH→100 kΩ/39,2 kΩ từ V5_DEV; PG→PG2_NODE |
| U17 | TPS259474LRPWR (pass VBUS robot) | IN→VBUS_PROG; OUT→VBUS_PASS; EN/UVLO→EN2_PASS; OVLO→GND; ILM→6,65 kΩ; ITIMER→10 nF; DVDT hở; PGTH→GND |
| R68, R69, C32 | 100 kΩ; 45,3 kΩ; 100 nF | VBUS_PROG–EN2_PASS–GND; C32 EN2_PASS–GND |
| Q8 | DMN2075U-7 | D→EN2_PASS; S→GND; G→EN_NODE |
| C33 | 1 µF 10 V | VBUS_PROG–GND sát U17 |
| U18 | TLV6710DDCR (veto V5_R) | VDD→VBUS_PROG; INB→V5R_SNS (100k/68,1k từ V5_R, chặn khi > 0,97–1,01 V); OUTB→EN2_PASS; INA→GND |
| R_dis2 | 2,2 kΩ 0,1 W | V5_R–GND (xả 132–224 ms) |
| U19 | TLV6710DDCR (veto sau pass) | VDD→VPACK2; INB→10 kΩ→VBUS_PASS; OUTB→EN_NODE; INA→GND |
| R_pp2 | 10 kΩ | VBUS_PASS–GND |
| U20 | TLV6710DDCR (PG-timeout U16) | VDD→VPACK2; INB→PGT2_X; OUTB→EN_NODE; INA→GND |
| R_x2, C_x2, Q_pg2, R_pg2 | 1 MΩ; 150 nF; DMN2075U-7; 1 MΩ | EN_NODE–PGT2_X; PGT2_X–GND; Q_pg2 D→PGT2_X, G→PG2_NODE; EN_NODE–PG2_NODE (16,7–28,0 ms) |
| U21 | TS3USB221DRCR | VCC→V3V3_DEV; S→GND; OE→OE2_D (100 kΩ lên VCC, Q_D2 kéo xuống khi VBUS_PASS/2); D+/D−↔J8; 1D+/1D−↔J9 |
| J8, J9 | Interposer eLabGuy Rev. 1.1, jumper VBUS hở | J8: VBUS_PROG (R39 tại đây), USB_DM, USB_DP, GND; J9 tới DevKit: VBUS_PASS, USB_DM, USB_DP, GND |
| J10, J11 | Socket 1×15 | VIN→V5_DEV; 3V3→V3V3_DEV; GPIO theo 3.2 |
| J4, J5 | JST XH 2 chân | MOTA±; MOTB± |
| J6, J7, J12–J14 | Loa, OLED, HC-SR04, IR1, IR2 | theo bảng chân 3.2 |

### 3.2 Pin map GPIO robot

| Tín hiệu | GPIO (nhãn) | Hướng / qua | Lý do |
|---|---|---|---|
| AIN1, AIN2, BIN1, BIN2 | GPIO16 (RX2), GPIO17 (TX2), GPIO18, GPIO19 | ra, U11 A1–A4 | PWM LEDC, không strap |
| I2S_BCLK, I2S_LRCLK, I2S_DIN | GPIO26, GPIO25, GPIO27 | ra, U11 A5–A7 | |
| US_TRIG | GPIO23 | ra, U11 A8 | |
| OE_N (8T245) | GPIO4 | ra, kéo lên 100 kΩ | OFF khi boot |
| MCU_MOT_EN | GPIO13 | ra, kéo xuống 100 kΩ | OFF khi boot/reset |
| US_ECHO | GPIO34 | vào, U12 | chỉ vào |
| IR1, IR2 | GPIO35, GPIO32 | vào, U12/U13 | |
| DRV_nFAULT | GPIO33 | vào, U13 | |
| I2C SDA, SCL | GPIO21, GPIO22 | U14 | mặc định Arduino |
| ISA_ADC, ISB_ADC | GPIO36 (VP), GPIO39 (VN) | analog vào | ADC1, dùng được khi Wi‑Fi bật |

Không dùng GPIO0, 2, 5, 12, 14, 15 (strap hoặc PWM khi boot) và GPIO1/3.

### 3.3 Net nguồn và layout

| Net | Dòng | Vẽ tối thiểu |
|---|---|---|
| VPACK2_RAW, VPACK2 | 2,5 A | 1,6 mm hoặc đổ đồng |
| VM_6V | 1,0 A | 0,8 mm |
| V5_R | 0,9 A | 0,6 mm |
| VBUS_C | 1,0 A | 0,6 mm |
| MOTx±, ISEN_x | 0,5 A | 0,4 mm, Kelvin cho R5/R6 |
| SW_CHG, SW_5V, L1/L2 TPS63070 | đỉnh | Vòng ngắn nhất theo EVM từng IC |

C23 và C8 đặt sát chân VM của DRV8833. Chia áp UV2 và các nút S2_* đi xa các nút switching. Bo giả định 2 lớp, 1 oz. Nếu box03 chọn 4 lớp, tính lại bề rộng.

---

## 4. Kiểm trong ERC/DRC

1. LOAD_EN và EN_NODE: chỉ có một pull-up mỗi nút. Mọi phần tử kéo xuống phải là open-drain.
2. Không có pull-up nào trên NTC_H (MCP73833 THERM).
3. SYS_CHG của BQ25886 chỉ nối tụ.
4. OVLO của TPS259474L nối GND, không để hở.
5. Tổng tụ VM_6V ≤ 470 µF (hiện 286 µF).
6. 2 SEL dư (U8 SEL3, SEL4) nối GND, các kênh S/D dư để NC. JOY_VCC_C có 100 kΩ xuống GND.
7. Footprint D3/D4 có mặt trên PCB, ghi DNP trong BOM.
8. VBUS_DET của TUSB320 chỉ nối qua R53, không nối thẳng VBUS (abs max 4 V).
9. Không có đường VBUS nào từ J4 tới J5 ngoài U9. Jumper VBUS interposer hở.
10. SEL_NET không có tụ; nối LOAD_EN qua R26 10 kΩ.
11. LOAD_EN chỉ có một pull-up là R10 qua Q6 (latch). Không đặt tụ trên LATCH_G.
12. L2 của BQ25886 nối PMID–SW, không nối SW–SYS.
13. MOTOR_EN là AND3 (EN_NODE, V5R_OK, MCU_MOT_EN).

## 5. Đo trên mẫu đầu (không chặn layout)

BT-H2, BT-H3, BT-H4, BT-R1a, BT-R4 theo `bench-test-plan.md`. Thêm **BT-ISEN**: thử ngắn mạch AOUT1–AOUT2 có giới hạn dòng nguồn, đo xISEN bằng probe ≥ 200 MHz, rồi quyết định lắp D3/D4 hay không. Dữ liệu NCC (B15, B04, bảng R‑T Semitec) chỉ cập nhật giá trị, không đổi footprint.
