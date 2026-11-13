# MoBot V2 r6 · Đầu vào KiCad mức netlist

05/11/2026. Dùng cho box03 khi có lease. Đây là đặc tả đầu vào, chưa phải schematic. Footprint là tên thư viện KiCad 10 đề xuất; box03 đối chiếu land pattern với datasheet trước khi khóa. Mọi chỗ chưa chốt ghi `[TBD: ID]`, ID là điểm vướng trong `handset.md` / `robot.md`.

Thứ tự: **tay cầm trước, robot sau.**

## Quy ước chung

- Header DevKit: hai socket 1×15, bước 2,54 mm, khoảng cách và độ lệch theo PCB BrijModi (`docs/hardware/mobot-v2-r5-kicad-preflight.md:7`). Pin map GPIO: [TBD: H4/R6, box02 lập bảng chân].
- Tên net nguồn viết hoa. `V3V3_DEV` là chân 3V3 của DevKit (miền DevKit).
- Điện trở 1 % trừ khi ghi khác.

---

## 1. Tay cầm (handset carrier)

### 1.1 Bảng linh kiện và net

| RefDes | Mã linh kiện | Giá trị | Footprint đề xuất | Net nối (chân → net) |
|---|---|---|---|---|
| J1 | GCT USB4105-GF-A [TBD: H3, suffix theo `bom` B20] | USB-C 2.0 receptacle | Theo bản vẽ GCT USB4105 | VBUS → VBUS_C; CC1 → CC1; CC2 → CC2; GND → GND; SHIELD → GND [TBD: H3, nối trực tiếp hay qua RC] |
| R1, R2 | [TBD: H3, MPN] | 5,1 kΩ | Resistor_SMD:R_0603_1608Metric | CC1–GND; CC2–GND (Rd sink, dead-battery) |
| C1 | [TBD: H3] | [TBD: H3, theo DS20002005C §6.1.1.3] | Capacitor_SMD:C_0805_2012Metric | VBUS_C–GND |
| U1 | MCP73833-FCI/MF | Charger 1S 4,2 V | DFN-10-1EP 3×3 mm P0,5 [TBD: H3, EP theo DS20002005C] | VDD → VBUS_C; VBAT → VPACK; PROG → R3; THERM → NTC_H; STAT1 → LED_CHG; STAT2 → LED_DONE; PG → LED_PG; VSS/EP → GND |
| R3 | [TBD: H3] | **2,49 kΩ** (0,40 A, founder chốt 05/11; hiệu lực khi r7 được duyệt) | R_0603_1608Metric | PROG–GND |
| C2 | [TBD: H3] | [TBD: H3, CBAT theo datasheet] | C_0805_2012Metric | VPACK–GND |
| D1–D3, R4–R6 | [TBD: H3] | LED + điện trở hạn dòng (ISINK max 25 mA) | LED_0603, R_0603 | VBUS_C → R → LED → STATx/PG |
| J2 | [TBD: H1, theo connector pack B15, có khóa] | 2 chân | Theo pack | 1 → VPACK_RAW; 2 → GND |
| F1 | [TBD: H1] | Cầu chì/PTC | [TBD: H1] | VPACK_RAW–VPACK |
| J3 | [TBD: H3, theo B23] | NTC 2 dây | [TBD] | 1 → NTC_H; 2 → GND |
| U2 | TLV6700DDCR | UVLO 1S | Package_TO_SOT_SMD:SOT-23-6 | VDD → VPACK; INB → UV_DIV; OUTB → LOAD_EN; INA → [TBD: H2, box02 xử lý kênh không dùng]; OUTA → NC; GND → GND |
| R7 | | 680 kΩ | R_0603 | VPACK–UV_DIV |
| R8 | | 97,6 kΩ | R_0603 | UV_DIV–GND |
| R9 | [TBD: H2] | Hồi tiếp hysteresis | R_0603 | LOAD_EN–UV_DIV [TBD: H2] |
| R10 | [TBD: H4] | Pull-up LOAD_EN | R_0603 | VPACK–LOAD_EN |
| Q1 (Q_PROG) | [TBD: H4, loại 2N7002] | N-MOSFET | SOT-23 | D → LOAD_EN; G → PROG_DET; S → GND |
| R11, R12 | [TBD: H4] | Chia áp gate | R_0603 | VBUS_PROG–PROG_DET; PROG_DET–GND |
| Q2 (Q_CHG) | [TBD: H4] | N-MOSFET | SOT-23 | D → LOAD_EN; G → CHG_DET; S → GND |
| R13, R14 | [TBD: H4] | Chia áp gate | R_0603 | VBUS_C–CHG_DET; CHG_DET–GND |
| SW1 | [TBD: H4, `bom` B22] | Công tắc nguồn, mức tín hiệu | [TBD] | LOAD_EN–GND khi OFF (công tắc không mang dòng tải) |
| U3 | TPS61023DRLR | Boost 5 V | Package_TO_SOT_SMD:SOT-563 [box03 đối chiếu DRL] | VIN → VPACK; EN → LOAD_EN; SW → SW_BST; VOUT → V5_BST; FB → FB_BST; GND → GND |
| L1 | [TBD: H2, theo SLVUBP5 §3] | [TBD: H2] (dải L hiệu dụng 0,37–2,9 µH) | [TBD] | SW_BST–VPACK |
| R15, R16 | [TBD: H2] | Chia áp FB cho 5,0 V [TBD: H2, VREF theo SLVSF14B §6.5] | R_0603 | V5_BST–FB_BST; FB_BST–GND |
| C3, C4 | [TBD: H2] | Cin, Cout theo EVM | C_0805 | VPACK–GND; V5_BST–GND |
| U4 | LM66100DCKR | Ideal diode | Package_TO_SOT_SMD:SOT-363_SC-70-6 | VIN → V5_BST; VOUT → V5_DEV; CE → CE_PROG; GND → GND |
| R17, R18 | [TBD: H4] | Chia áp CE | R_0603 | VBUS_PROG–CE_PROG; CE_PROG–GND |
| J4 | [TBD: H4] | Micro-USB B receptacle (người dùng cắm) | [TBD: H4] | VBUS → VBUS_PROG; D− → USB_DM; D+ → USB_DP; ID → NC; GND → GND |
| J5 | [TBD: H4] | Dây ngắn tới cổng Micro-USB DevKit | [TBD: H4] | VBUS_PROG, USB_DM, USB_DP, GND |
| J6, J7 | [TBD: B21] | Socket 1×15 | Connector_PinSocket_2.54mm:PinSocket_1x15_P2.54mm_Vertical | 5V/VIN → V5_DEV; GND → GND; 3V3 → V3V3_DEV; JOY_X, JOY_Y, JOY_SW, BTN1, BTN2 → [TBD: H4, pin map; JOY_X/JOY_Y phải là ADC1] |
| J8 | [TBD: B18] | Joystick 5 chân | [TBD] | VCC → V3V3_DEV; GND; VRx → JOY_X; VRy → JOY_Y; SW → JOY_SW |
| SW2, SW3 | [TBD: B19] | Nút 6×6 mm | [TBD] | BTN1/BTN2–GND; pull-up về V3V3_DEV (trong ESP32 hoặc R ngoài [TBD]) |

USB_DM/USB_DP: cặp vi sai 90 Ω, đi ngắn, không qua via nếu được [TBD: H4, box03 theo stackup].

### 1.2 Net nguồn tay cầm

Bề rộng tối thiểu theo IPC-2221, lớp ngoài: `I = 0,048 × ΔT^0,44 × A^0,725` (A tính bằng mil², ΔT tính bằng °C). Giả định: **đồng 1 oz (35 µm, 1,378 mil), ΔT = 10 °C**. Lớp trong dùng k = 0,024. Dòng thiết kế = dòng max × hệ số ghi trong cột cơ sở.

| Net | Dòng thiết kế | Cơ sở | Rộng tối thiểu lớp ngoài | Lớp trong | Đề xuất vẽ |
|---|---|---|---|---|---|
| VPACK_RAW, VPACK | 1,2 A | 0,977 A (`r6:12`) × 1,2; cầu chì [TBD: H1] | 0,39 mm | 1,01 mm | ≥ 0,6 mm, đổ đồng |
| V5_BST, V5_DEV | 0,6 A | 0,50 A (`r6:12`) × 1,2 | 0,15 mm | 0,39 mm | ≥ 0,4 mm |
| VBUS_C | 0,5 A | IREG max 0,442 A + ISS 3 mA | 0,12 mm | 0,30 mm | ≥ 0,4 mm |
| VBUS_PROG | 0,6 A | DevKit 0,5 A từ USB | 0,15 mm | 0,39 mm | ≥ 0,4 mm |
| SW_BST | 2,7 A đỉnh | ILIM valley min, chỉ vùng vòng boost | — | — | Vòng ngắn nhất theo layout EVM SLVUBP5 |
| GND | — | — | — | — | Mặt đồng liền |

---

## 2. Robot (robot carrier)

### 2.1 Bảng linh kiện và net

| RefDes | Mã linh kiện | Giá trị | Footprint đề xuất | Net nối |
|---|---|---|---|---|
| J1 | GCT USB4105-GF-A [TBD: R5] | USB-C | Theo GCT | VBUS → VBUS_C; CC1; CC2; GND |
| U1 | TUSB320LAIRWBR | CC controller, GPIO mode | X2QFN-12 [TBD: R5, footprint TI] | VDD → V3V3_USB; CC1; CC2; ADDR → NC (GPIO mode); PORT → [TBD: R5, UFP]; OUT1 → CHG_OK_N; OUT2 → [TBD: R5]; ID → NC; GND |
| U2 | [TBD: R5, LDO 3,3 V từ VBUS] | LDO | [TBD] | IN → VBUS_C; OUT → V3V3_USB |
| U3 | BQ25886RGET | Charger 2S boost | VQFN-24 [TBD: R5, footprint TI RGE] | VBUS → VBUS_C; BAT → VPACK2; SYS → SYS_CHG (chỉ tụ 2 × 22 µF); ILIM → R1; ICHGSET → R2; VSET → hở (8,4 V); TS → NTC_R; CE → CE_CHG; SW → SW_CHG; GND/PGND |
| R1 | | **1,24 kΩ** | R_0603 | ILIM–GND (IIN 839–980 mA) |
| R2 | | 7,68 kΩ [TBD: R5, box02 xác nhận công thức KICHGSET] | R_0603 | ICHGSET–GND |
| L1, C | [TBD: R5, theo SLUUC11 §4.3 BOM] | | | |
| CE_CHG logic | [TBD: R5] | Bật sạc chỉ khi CHG_OK_N thấp (nguồn 1,5 A/3 A) và NTC trong dải | | CHG_OK_N → CE_CHG [box02 chốt cực tính CE theo SLUSD88A] |
| J2 | [TBD: R3, connector pack B04, có khóa] | 2S | | VPACK2_RAW; GND |
| F1 | [TBD: R3] | Cầu chì/PTC | | VPACK2_RAW–VPACK2 |
| J3 | [TBD: R5, NTC 103AT-2 theo khuyến nghị SLUSD88A] | NTC | | NTC_R; GND (qua mạng chia áp TS theo datasheet) |
| U4 | TLV6700DDCR | UVLO 6,5 V | SOT-23-6 | VDD → VPACK2; INB → UV2_DIV; OUTB → LOGIC_EN |
| R3, R4 | | 1,5 MΩ / 97,6 kΩ (6,548 V) [TBD: R6, tinh chỉnh + hysteresis] | R_0603 | VPACK2–UV2_DIV–GND |
| Q1, Q2 + chia áp | [TBD: R6] | Q_PROG, Q_CHG như tay cầm | SOT-23 | D → LOGIC_EN; G từ VBUS_PROG / VBUS_C |
| SW1 | [TBD: R6, `bom` B22] | Công tắc mức tín hiệu | | LOGIC_EN–GND khi OFF |
| U5 | TPS54302DDCR | Buck 5 V logic/audio | SOT-23-6 | VIN → VPACK2; EN → LOGIC_EN [TBD: R6, mức EN]; SW; BOOT; FB → V5_R qua chia áp [TBD] |
| U6 | TPS63070RNMR | Buck-boost 6 V motor | VQFN-15 [TBD: R4, footprint TI RNM] | VIN → VPACK2; EN → MOTOR_EN; PS/SYNC → cao (PFM) [TBD: R4]; VOUT → VM_6V; FB [TBD]; PG → [TBD] |
| MOTOR_EN logic | [TBD: R6] | MOTOR_EN = LOGIC_EN và MCU_MOT_EN; OFF khi reset/high-Z | | |
| U7 | DRV8833PWPR | Driver 2 kênh | HTSSOP-16 có EP [TBD: R1, footprint TI PWP] | VM → VM_6V; AIN1/AIN2/BIN1/BIN2 ← U9 cổng B; nSLEEP → MOTOR_EN (kéo xuống); AISEN → R5; BISEN → R6; AOUT1/2 → J4; BOUT1/2 → J5; nFAULT → U10; VCP: 0,01 µF tới VM; VINT: 2,2 µF tới GND; EP → GND |
| R5, R6 | [TBD: R1, MPN] | **0,62 Ω ±1 %, 0,25 W** (founder chốt 05/11; hiệu lực khi r7 được duyệt; xem lại nếu BT-R1a đo L < 0,39 mH) | R_1206_3216Metric | AISEN–GND; BISEN–GND (Kelvin về GND driver) |
| R7, C5 / R8, C6 | [TBD: R2] | RC lọc ISEN cho ADC | R_0603, C_0603 | AISEN → ISA_ADC; BISEN → ISB_ADC (ADC1) |
| C7 | [TBD: R4] | **220 µF 16 V low-ESR** | [TBD] | VM_6V–GND |
| C8 | | 10 µF + 1 µF gốm | C_0805 | VM_6V–GND, sát chân VM |
| D1 | Littelfuse SMAJ8.0A | TVS 8 V | Diode_SMD:D_SMA | VM_6V–GND |
| J4, J5 | [TBD: R1] | Motor 2 chân, có khóa | | MOTA±; MOTB± |
| U8 | MAX98357AETE+T | I²S amp | TQFN-16 [TBD: R6] | VDD → V5_R; BCLK/LRCLK/DIN ← U9 cổng B; SD_MODE [TBD]; GAIN [TBD]; OUTP/OUTN → J6 |
| U9 | SN74LVC8T245PWR | Dịch mức 8 kênh A→B | Package_SO:TSSOP-24_4.4x7.8mm_P0.65mm | VCCA → V3V3_DEV; VCCB → V5_R; DIR → hướng A→B [TBD: R6]; OE → bật [TBD: R6]; A1–A8 ← GPIO; B1–B8 → AIN1, AIN2, BIN1, BIN2, I2S_BCLK, I2S_LRCLK, I2S_DIN, US_TRIG |
| U10, U11 | SN74LVC2T45DCUR | Dịch mức 2 kênh B→A (×2) | Package_SO:VSSOP-8_2.3x2mm_P0.5mm | VCCA → V3V3_DEV; VCCB → V5_R; B → US_ECHO, IR1, IR2, DRV_nFAULT; A → GPIO |
| U12 | TCA9517ADGKR | Buffer I²C | Package_SO:VSSOP-8_3x3mm_P0.65mm | VCCA → V3V3_DEV; VCCB → V5_R [TBD: R6, mức OLED]; SDAA/SCLA ← GPIO; SDAB/SCLB → J7; EN [TBD] |
| U13 | LM66100DCKR | Ideal diode DevKit | SOT-363_SC-70-6 | VIN → V5_R; VOUT → V5_DEV; CE → CE_PROG |
| J8, J9 (Micro-USB interposer) | [TBD: R6] | Như J4/J5 tay cầm | | VBUS_PROG, USB_DM, USB_DP, GND |
| J10, J11 | [TBD: B21] | Socket 1×15 | PinSocket_1x15_P2.54mm_Vertical | V5_DEV, GND, V3V3_DEV, GPIO [TBD: R6, pin map] |
| J6, J7, J12, J13, J14 | [TBD: R6] | Loa, OLED, HC-SR04, IR1, IR2 | | Theo bảng chân box02 |

### 2.2 Net nguồn robot

Cùng công thức và giả định (1 oz, ΔT 10 °C).

| Net | Dòng thiết kế | Cơ sở | Rộng tối thiểu lớp ngoài | Lớp trong | Đề xuất vẽ |
|---|---|---|---|---|---|
| VPACK2_RAW, VPACK2 | 2,5 A | Trần 1,85 A (`r6:11`) × 1,35; pack 4 A tức thời theo nhà bán | 1,06 mm | 2,77 mm | ≥ 1,5 mm hoặc đổ đồng |
| VM_6V | 1,0 A | 0,90 A (`r6:9`) × 1,1 | 0,30 mm | 0,78 mm | ≥ 0,8 mm |
| V5_R | 0,9 A | 0,70 A (`r6:10`) × 1,3 | 0,26 mm | 0,68 mm | ≥ 0,6 mm |
| VBUS_C | 1,0 A | IINDPM max 0,98 A | 0,30 mm | 0,78 mm | ≥ 0,6 mm |
| MOTA±, MOTB±, AISEN, BISEN | 0,5 A | ITRIP max 0,391 A + overshoot | 0,12 mm | 0,30 mm | ≥ 0,4 mm |
| V5_DEV, VBUS_PROG | 0,6 A | DevKit 0,5 A | 0,15 mm | 0,39 mm | ≥ 0,4 mm |
| SW_CHG, SW nodes | Đỉnh theo IC | | — | — | Theo layout EVM của từng IC |

Giả định cần box03 xác nhận: số lớp, độ dày đồng thật của nhà sản xuất PCB, ΔT cho phép trong vỏ PETG.

## 3. Mục TBD gom theo ID

| ID | Số mục TBD trong file này |
|---|---|
| H1 | Connector pack, cầu chì |
| H2 | L1, FB, Cin/Cout, hysteresis UVLO, kênh INA |
| H3 | Suffix USB-C, C1, C2, LED, NTC (RPROG đã chốt 2,49 kΩ, chờ r7) |
| H4 | MOSFET, chia áp gate và CE, pull-up, Micro-USB interposer, pin map |
| R1 | MPN điện trở sense, connector motor, footprint PWP (giá trị đã chốt 0,62 Ω, chờ r7) |
| R2 | RC lọc ISEN |
| R3 | Connector pack 2S, cầu chì |
| R4 | Tụ bulk, PS/SYNC, footprint TPS63070 |
| R5 | LDO, footprint TUSB320/BQ25886, ICHGSET, logic CE |
| R6 | Logic enable, mức EN TPS54302, DIR/OE buffer, pin map, connector ngoại vi |
