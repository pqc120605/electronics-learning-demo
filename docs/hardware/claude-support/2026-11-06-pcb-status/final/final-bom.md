# MoBot V2 r7 · BOM chốt (07/11/2026)

Đây là BOM cấp giá trị cho hai carrier. Giá trị lấy từ datasheet hãng (xem [datasheet-checks.md](datasheet-checks.md)) và từ `calc_r7.py` (exit 0, output ở cuối [final-values.md](final-values.md)). Lý do chọn từng khối nằm ở [thiet-ke-va-y-do.md](thiet-ke-va-y-do.md).

**Trạng thái** của mỗi dòng:
- **Chốt**: giá trị đã tính và đối chiếu datasheet. Không phụ thuộc phép đo.
- **Chốt-ĐK**: giá trị đã chọn nhưng còn phép đo bench (BT-…) hoặc dữ liệu NCC phải xác nhận.
- **Đề xuất**: đổi linh kiện hoặc kiến trúc so với r7/Codex, cần box08 duyệt trước khi dùng.
- **Giữ r6**: ngoài 18 mục, giữ như `kicad-input-spec.md`.

Chưa có lease KiCad và r7 chưa được duyệt hash. BOM này không thay hai bước đó. Cột MPN ghi `[box03]` khi chưa chọn mã hãng cụ thể. Điện trở ghi "0,1 %" phải là loại thin-film ±0,1 %, TCR ≤ 25 ppm/°C. Các điện trở khác ±1 %, 0603.

---

## 1. Tay cầm (1S)

### 1.1 Sạc USB-C (H3 đã chốt, H-7, H-8)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| J1 | GCT USB4105-GF-A [box03 suffix] | USB-C 2.0 | theo GCT | VBUS→VBUS_C, CC1, CC2, GND | Giữ r6 |
| R1, R2 | [box03] | 5,1 kΩ ±1 % | 0603 | CC1–GND, CC2–GND (Rd) | Giữ r6 |
| U1 | MCP73833-FCI/MF | 4,2 V, timer 6 h | DFN-10 3×3 | VDD←VBUS_C, VBAT→VPACK | Chốt (founder) |
| R3 | [box03] | 2,49 kΩ ±1 % | 0603 | PROG–GND → IREG 0,358–0,446 A | Chốt (founder) |
| C1 | [box03] | 4,7 µF 10 V X7R | 0805 | VBUS_C–GND | Chốt-ĐK (BT-H3 inrush) |
| C2 | [box03] | 4,7 µF 10 V X7R | 0805 | VPACK–GND (CBAT ≥ 4,7 µF khi > 250 mA) | Chốt |
| D1–D3, R4–R6 | LED [box03] | 680 Ω ±1 % | LED 0603, R 0603 | VBUS_C→R→LED→STAT1/STAT2/PG | Chốt (≤ 5,1 mA/LED, ISINK ≤ 25 mA) |
| NTC (J3) | Semitec 103AT-2 | 10 kΩ @25 °C | trên pack | THERM–GND trực tiếp, **không pull-up THERM**. Cắt 0,2–4,6 °C và 40,7–48,4 °C (bảng Semitec) | Chốt-ĐK (dải sạc B15) |

Dòng USB-C cực xấu: 0,465 A + 0,5 mA của R_far detector = 0,466 A ≤ 0,5 A.

### 1.2 UVLO pack 3,20 V (H-3)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U2 | TPS3808G01DBVR | VIT 0,405 V ±2 % | SOT-23-6 | VDD←VPACK, SENSE←UV_DIV, RESET→LOAD_EN, CT hở, MR hở | Chốt |
| R7 | [box03] 0,1 % | 72,3 kΩ | 0603 | VPACK–UV_DIV (R_top) | Chốt |
| R8 | [box03] 0,1 % | 9,20 kΩ | 0603 | UV_DIV–GND (R_bot) | Chốt |
| R9 | [box03] 0,1 % | 866 kΩ | 0603 | VPACK–drain Q1 (Rx) | Chốt |
| Q1 | DMN2075U-7 (Diodes) | N-MOS 20 V, VGS(th) 0,4–1,0 V | SOT-23 | D←R9, S→UV_DIV, G←LOAD_EN | Đề xuất (mới so với Codex) |

Kết quả: hệ số 8,2531 (+0,04 %), V_fall 3,262–3,424 V (biên 62 mV tới 3,20 V), V_rise 3,501–3,785 V, tD 12–28 ms. Chia áp tốn 51,5 µA. Cần đo sụt áp xung B15 (BT-H2).

### 1.3 Detector VBUS fail-safe (H-4)

Có hai bộ giống nhau: một cho Micro-USB (U3), một cho USB-C (U4).

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U3, U4 | TLV6710DDCR [box03 xác nhận mã đặt hàng] | VIT+(INB) 397–403 mV | SOT-23-6 | VDD←VPACK, INB←S qua R_s, OUTB→LOAD_EN, INA→GND, OUTA NC | Đề xuất |
| R20, R21 | [box03] | 220 kΩ ±1 % | 0603 | VPACK–S (R_bias) | Đề xuất |
| R22 | [box03] | 10 kΩ ±1 % | 0603 | **Đặt trên interposer**, VBUS_PROG–GND (R_far, Micro) | Đề xuất |
| R23 | [box03] | 10 kΩ ±1 % | 0603 | Sát J1, VBUS_C–GND (R_far, USB-C) | Đề xuất |
| R24, R25 | [box03] | 10 kΩ ±1 % | 0603 | S–INB (R_s bảo vệ) | Đề xuất |

Kết quả: dây nguyên, VBUS vắng → S 0,136–0,186 V (cho phép, biên 201 mV). Đứt dây sense hoặc GND → S = VPACK (chặn). VBUS ≥ 0,403 V → chặn. Cần đo trễ và thứ tự cắm/rút (BT-H4).

### 1.4 Đường 5 V và cấp DevKit (H-1, H-2)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| — | Nút LOAD_EN | wired-AND open-drain | — | Kéo xuống: U2 RESET, U3/U4 OUTB, SW1 (OFF). Mức cao 3,13–4,11 V | Đề xuất |
| Q6 | DMG2305UX-7 | P-MOS latch | SOT-23 | S←VPACK, G←LATCH_G, D→R10 | Đề xuất (latch, 07/11) |
| R10 | [box03] | 47 kΩ ±1 % | 0603 | Q6 drain–LOAD_EN (delta 07/11) | Đề xuất |
| R_pd | [box03] | 220 kΩ ±1 % | 0603 | LOAD_EN–GND | Đề xuất |
| R57 | [box03] | 100 kΩ ±1 % | 0603 | VPACK–LATCH_G, không tụ (xóa quyền bật ≤ 0,4 ms sau veto) | Đề xuất |
| Q7 | DMN2075U-7 | N-MOS | SOT-23 | D←LATCH_G, S→GND, G←LOAD_EN qua 1M/1M | Đề xuất |
| R58, R59 | [box03] | 1 MΩ / 2 MΩ ±1 % | 0603 | LOAD_EN–LEN_FB–GND | Đề xuất |
| SW4 | Nút nhấn 6×6 [box03] | — | — | VPACK–SW_A: lệnh bật mới, kích theo sườn | Đề xuất |
| R60, C_t, R_tg, Q_trig | 1 MΩ; 22 nF X7R; 100 kΩ; DMN2075U-7 | — | 0603 / SOT-23 | SW_A–GND; SW_A–TRIG_G; TRIG_G–GND; Q_trig kéo LATCH_G | Đề xuất (07/11) |
| U12 | TLV6710DDCR | PG-timeout U6 | SOT-23-6 | INB←PGT_X, OUTB→LOAD_EN | Đề xuất (07/11) |
| R_x, C_x, Q_pg, R_pg, R_pt1, R_pt2 | 1 MΩ; 150 nF; DMN2075U-7; 1 MΩ; 100 kΩ; 39,2 kΩ | — | 0603 / SOT-23 | mạng PG-timeout và PGTH U6 | Đề xuất |
| U10, U11 | TLV6710DDCR | veto V5_BST (VDD VBUS_PROG); veto VBUS_PASS (VDD VPACK) | SOT-23-6 | OUTB→EN_PASS; OUTB→LOAD_EN | Đề xuất (07/11) |
| R_v1, R_v2, R_dis, R_pp | 100 kΩ; 68,1 kΩ; 2,2 kΩ 0,1 W; 10 kΩ | — | 0603 | chia V5_BST; xả V5_BST; kéo VBUS_PASS | Đề xuất |
| U13 | TS3USB221DRCR | switch USB data | VSON-10 | OE←Q_D (VBUS_PASS/2), VCC←V3V3_DEV | Đề xuất (07/11) |
| R_oe, Q_D, R_d1, R_d2, C_d | 100 kΩ; DMN2075U-7; 100 kΩ ×2; 0,1 µF | — | 0603 / SOT-23 | mạng OE U13 | Đề xuất |
| R_jv | 100 kΩ | — | 0603 | JOY_VCC_C–GND | Chốt |
| SW1 | [box03, `bom` B22] | công tắc tín hiệu | — | LOAD_EN–GND khi OFF (OFF cứng) | Giữ r6 |
| U5 | TPS61023DRLR | boost 5 V | SOT-563 (DRL) | VIN←VPACK, EN←LOAD_EN, VOUT→V5_BST | Chốt |
| L1 | Coilcraft XEL4030-102ME hoặc tương đương [box03] | 1,0 µH, Isat ≥ 4,5 A, DCR ≤ 20 mΩ | 4×4 mm | SW_BST–VPACK | Chốt-ĐK (BT-H2) |
| R15 / R16 | [box03] | 732 kΩ / 100 kΩ ±1 % | 0603 | V5_BST–FB–GND → 4,742–5,165 V | Chốt-ĐK (BT-H2 đo V5 tại DevKit) |
| C3 | [box03] | 10 µF 10 V X7R | 0805 | VPACK–GND | Chốt |
| C4a, C4b | [box03] | 22 µF 10 V X7R | 0805 | V5_BST–GND | Chốt |
| U6 | **TPS259474LRPWR** | eFuse latch-off | WQFN 2×2 (RPW) | IN←V5_BST, OUT→V5_DEV | Đề xuất (A→L) |
| R11 | [box03] | 10 kΩ ±1 % | 0603 | LOAD_EN–EN/UVLO (nối tiếp; bỏ divider 267k/187k) | Chốt (EN 3,13–4,11 V > 1,223 V, ≤ 5 V khuyến nghị) |
| R13 | [box03] | **5,11 kΩ** ±1 % | 0603 | ILM–GND → ILIM 0,545–0,758 A; dòng pin ≤ 1,48 A @3,20 V | Chốt-ĐK (BT-H2; sửa 07/11 từ 4,22 kΩ) |
| C5 | [box03] | 1,0 nF 16 V X7R | 0603 | ITIMER–GND → 0,46–1,60 ms | Chốt |
| C6 | [box03] | 2,2 nF 16 V X7R | 0603 | dVdT–GND → 0,91 V/ms | Chốt |
| — | — | — | — | OVLO→GND; PGTH→GND; PG NC | Chốt (OVLO), box02 xác nhận PGTH |

### 1.5 I/O joystick và nút (H-5, H-6)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U7, U8 | TMUX1511PWR | 4×SPST, RON ≤ 4,5 Ω | TSSOP-14 | VDD←V3V3_DEV. 6 kênh: JOY_X, JOY_Y, JOY_SW, BTN1, BTN2, JOY_VCC (V3V3_DEV→JOY_VCC). 2 SEL dư → GND | Chốt-ĐK (BT-H4) |
| R26 | [box03] | 10 kΩ ±1 % | 0603 | LOAD_EN–SEL_NET, không tụ (ngắt I/O tức thì; sửa 07/11) | Chốt |
| R27–R29 | [box03] | 10 kΩ ±1 % | 0603 | Pull-up nút phía DevKit, về V3V3_DEV | Chốt |
| C8, C9 | [box03] | 100 nF 16 V X7R | 0603 | JOY_X, JOY_Y phía GPIO–GND | Chốt-ĐK (firmware chờ ≥ 5 ms sau khi mở mux) |

SEL VIH 1,2 V, VIL 0,45 V (SCDS390B §5.5).

### 1.6 Interposer, header

| RefDes | Linh kiện / MPN | Giá trị | Trạng thái |
|---|---|---|---|
| J4, J5 | Interposer eLabGuy USB-uBM-uBF-V1A Rev. 1.1 (Codex đã xác minh jumper VBUS) | Jumper VBUS để hở; VBUS_PROG về carrier, VBUS_PASS từ U9 về DevKit; R22 tại phía cổng | Chốt-ĐK |
| U9 | TPS259474LRPWR | eFuse pass VBUS | WQFN 2×2 | IN←VBUS_PROG, OUT→VBUS_PASS, EN←EN_PASS, OVLO→GND | Đề xuất (07/11) |
| R55 / R56, C29 | [box03] | 100 kΩ / 45,3 kΩ, 100 nF | 0603 | VBUS_PROG–EN_PASS–GND; bật ở 3,74–3,98 V, trễ 3,9–6,9 ms | Đề xuất |
| Q5 | DMN2075U-7 | N-MOS | SOT-23 | D←EN_PASS, S→GND, G←LOAD_EN | Đề xuất |
| R54, C28, C30 | [box03] | 6,65 kΩ; 10 nF; 1 µF 10 V | 0603 | ILM, ITIMER U9; VBUS_PROG–GND (delta 07/11) | Đề xuất |
| J6, J7 | Socket 1×15, 2,54 mm | — | Giữ r6 |
| J2 | JST PH 2,0 mm 2 chân, B2B-PH-K-S hoặc tương đương | founder 07/11; kiểm cực tính với pack thật | Chốt-ĐK |
| F1 | PTC [box03] | dòng giữ ≥ 1,5 A (dòng pin ≤ 1,48 A ở ILIM max), dòng cắt < OC của PCM (chưa biết) | Chốt-ĐK (H1) |

---

## 2. Robot (2S)

### 2.1 USB-C, nhận diện nguồn (R-8)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| J1 | GCT USB4105-GF-A | USB-C | — | VBUS→VBUS_C | Giữ r6 |
| U1 | TUSB320LAIRWBR | GPIO mode | X2QFN-12 | VDD←V3V3_USB, ADDR NC, PORT→GND (UFP), OUT1→Q3 gate | Giữ r6 |
| U2 | TPS7A2033PDBVR | 3,3 V ±1,5 %, 300 mA | SOT-23-5 | IN←VBUS_C (không qua diode), OUT→V3V3_USB, EN←IN | Chốt-ĐK (07/11: rút lại đổi 3,6 V; kiểm ramp BT-R5) |
| C10, C11 | [box03] | 1 µF 10 V X7R | 0603 | IN, OUT–GND | Chốt |
| R30 | [box03] | 100 kΩ ±1 % | 0603 | OUT1–V3V3_USB | Chốt |
| R53 | [box03] | 910 kΩ ±1 % | 0603 | VBUS_C–VBUS_DET (yêu cầu 900 kΩ, SLLSEQ8D; abs max VBUS_DET 4 V) | Chốt |
| — | — | — | — | TUSB320 EN_N→GND, PORT→GND (UFP), ADDR NC | Chốt |

### 2.2 Sạc BQ25886 (R5 đã chốt, R-1)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U3 | BQ25886RGET | 2S boost charger | VQFN-24 | VSET hở (8,4 V), OTG→GND | Giữ r6 |
| R1 | [box03] | 1,24 kΩ ±1 % | 0603 | ILIM–GND | Chốt (founder) |
| R2 | [box03] | **1,91 kΩ ±1 %** | 0603 | ICHGSET–GND → 0,422–0,582 A | Chốt |
| RT1 | [box03] | 9,53 kΩ ±1 % | 0603 | REGN–TS | Chốt-ĐK (dải sạc B04) |
| RT2 | [box03] | 511 kΩ ±1 % | 0603 | TS–GND (bảng Semitec, 07/11) | Chốt-ĐK (dải sạc B04) |
| NTC | 103AT-2 | 10 kΩ | trên pack | TS–GND | Chốt-ĐK |
| L2 | IHLP2525CZER1R0M01 hoặc tương đương [box03] | 1,0 µH | 2525 | **PMID–SW** (SLUSD88A Figure 20; sửa 07/11) | Chốt-ĐK |
| C12 | [box03] | 1 µF 16 V X7R | 0603 | VBUS–GND | Chốt |
| C13 | [box03] | 10 µF 16 V X7R | 0805 | PMID–GND (tổng VBUS+PMID ≥ 10 µF sau derating) | Chốt |
| C14a, C14b | [box03] | 22 µF 16 V X7R | 0805 | SYS–PGND (≥ 2×22 µF sau derating, có thể cần thêm tụ) | Chốt-ĐK (derating ở 8,4 V) |
| C15 | [box03] | 10 µF 16 V X7R (×2 nếu derating thiếu) | 0805 | BAT–GND (≥ 10 µF sau derating) | Chốt-ĐK |
| C16 | [box03] | 47 nF 16 V | 0603 | BTST–SW | Chốt |
| C17 | [box03] | 4,7 µF 10 V | 0603 | REGN–GND | Chốt |
| R31 | [box03] | 100 kΩ ±1 % | 0603 | REGN–CE (mặc định tắt sạc) | Chốt |
| Q2 | DMN2075U-7 (Diodes) | N-MOS 20 V | SOT-23 | D←CE, S→GND, G←Q3 drain | Đề xuất |
| R32 | [box03] | 100 kΩ ±1 % | 0603 | Q2 gate–GND | Đề xuất |
| R63, C31 | [box03] | 10 kΩ; 1 µF 10 V X7R | 0603 | Q3 drain–Q2 gate; Q2 gate–GND (trễ 3,6–3,8 ms) | Chốt-ĐK (BT-R5) |
| Q3 | DMG2305UX-7 (Diodes) | P-MOS −20 V, VGS(th) −0,5…−0,9 V | SOT-23 | S←V3V3_USB, G←OUT1, D→Q2 gate | Đề xuất |

Cửa sổ TS (bảng R‑T Semitec, NTC ±1 %): dừng lạnh −1,3…0,9 °C, ICHG 20 % dưới 4,7…6,9 °C, VREG 8,0 V trên 30,5…32,8 °C, dừng nóng 43,0…45,5 °C.

### 2.3 UVLO pack 2S (R-2, founder 6,40–6,60 V)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U4 | **TLV6710DDCR** [box03 mã đặt hàng] | VIT−(INA) 397–403 mV | SOT-23-6 | VDD←VPACK2, INA←UV2_DIV, OUTA→EN_NODE, INB→GND, OUTB NC | Đề xuất (thay TLV6700) |
| R3 | [box03] 0,1 % | 180 kΩ | 0603 | VPACK2–UV2_DIV | Chốt |
| R4 | [box03] 0,1 % | 11,1 kΩ | 0603 | UV2_DIV–GND | Chốt |
| R5x | [box03] 0,1 % | 2,84 MΩ | 0603 | VPACK2–drain Q4 | Chốt |
| Q4 | DMN2075U-7 (Diodes) | N-MOS 20 V | SOT-23 | D←R5x, S→UV2_DIV, G←EN_NODE | Đề xuất |

Kết quả: V_fall 6,418–6,582 V (trong cửa sổ founder), V_rise 6,851–7,146 V, dòng 44 µA.

### 2.4 Nút EN_NODE và detector VBUS robot

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| R33 / R34 | [box03] | 100 kΩ / 68 kΩ ±1 % | 0603 | Q6R drain–EN_NODE–GND → 2,56–3,44 V | Đề xuất (07/11) |
| Q6R, Q7R | DMG2305UX-7; DMN2075U-7 | latch EN_NODE | SOT-23 | Q6R S←VPACK2, D→R33; Q7R G←EN_NODE, D→R61R→LATCH2_G | Đề xuất (07/11) |
| R57R, R61R, R60R | [box03] | 100 kΩ ×3 | 0603 | VPACK2–LATCH2_G; Q7R–LATCH2_G; SW4R–LATCH2_G | Đề xuất |
| SW4R | Nút nhấn ON [box03] | — | — | Lệnh bật mới robot, kích theo sườn | Đề xuất |
| R60R, R60R2, C_t2, R_tg2, Q_trig2, R61R2 | 10 kΩ ×2; 22 nF; 100 kΩ; DMN2075U-7; 100 kΩ | — | 0603 / SOT-23 | mạch kích theo sườn robot | Đề xuất (07/11) |
| C_p, R_p, D_p, Q_por | 1 µF 16 V; 22 kΩ; BZT52C5V6; DMN2075U-7 | — | 0603 / SOD-123 / SOT-23 | giữ EN_NODE thấp ≥ 32 ms khi cắm pack | Đề xuất (07/11) |
| D1 | BZT52C5V6 | VZ 5,2–6,0 V | SOD-123 | EN_NODE–GND (kẹp khi R34 hở) | Chốt |
| — | Kéo xuống EN_NODE | open-drain | — | U4 OUTA, U5/U6 OUTB, SW1 | Đề xuất |
| U5, U6 | TLV6710DDCR | INB detector | SOT-23-6 | VDD←VPACK2, INB←S qua 10 kΩ, OUTB→EN_NODE, INA→GND | Đề xuất |
| R35, R36 | [box03] | 470 kΩ ±1 % | 0603 | VPACK2–S (R_bias) | Đề xuất |
| R37, R38 | [box03] | 100 kΩ ±1 % | 0603 | S–GND (R_sd, giữ S < 7 V khi đứt dây) | Đề xuất |
| R39, R40 | [box03] | 10 kΩ ±1 % | 0603 | R_far: interposer VBUS_PROG–GND; sát J1 VBUS_C–GND | Đề xuất |
| R51, R52 | [box03] | 10 kΩ ±1 % | 0603 | S–INB | Đề xuất |

Kết quả: dây nguyên, VBUS vắng → S 0,116–0,163 V. Đứt dây → S 1,08–1,50 V (chặn, dưới 7 V abs max).

### 2.5 Buck 5 V logic (R-3)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U7 | TPS54302DDCR | buck 3 A, 400 kHz | SOT-23-6 | VIN←VPACK2, EN←EN_NODE, FB←chia áp | Giữ r6 |
| R41 / R42 | [box03] | 100 kΩ / 13,3 kΩ ±1 % | 0603 | V5_R–FB–GND → 4,863–5,298 V | Chốt |
| L3 | [box03] | 10 µH, Isat ≥ 2 A | 5×5 mm | SW–V5_R (đỉnh 1,25 A ở 0,9 A, fSW 290 kHz) | Chốt |
| C18 | [box03] | 10 µF 25 V X7R | 0805 | VIN–GND | Chốt |
| C19a, C19b | [box03] | 22 µF 10 V X7R | 0805 | V5_R–GND | Chốt |
| C20 | [box03] | 0,1 µF 16 V | 0603 | BOOT–SW | Chốt |

### 2.6 Buck-boost 6 V motor (R-4, R-7)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U8 | TPS63070RNMR | buck-boost 2 A | VQFN-15 | EN←MOTOR_EN, **PS/SYNC→VIN qua R66 0 Ω** (R67 0 Ω xuống GND để DNP, đổi sang forced PWM không cần sửa PCB), VOUT→VM_6V | Chốt-ĐK (BT-R4 quyết R66/R67) |
| R43 / R44 | [box03] | 649 kΩ / 100 kΩ ±1 % | 0603 | VM_6V–FB–GND → 5,77–6,35 V | Chốt |
| L4 | Coilcraft XFL4020-152ME hoặc tương đương | 1,5 µH | 4×4 mm | L1–L2 | Chốt |
| C21a, C21b | GRM21BC71E106ME11L hoặc tương đương | 10 µF 25 V X7S | 0805 | VIN–GND | Chốt |
| C22a–c | GRM21BC81C226ME44L hoặc tương đương | 22 µF 16 V X6S | 0805 | VM_6V–GND | Chốt |
| C23 | [box03] polymer | ≥ 220 µF hiệu dụng 16 V low-ESR | 8×8 mm | VM_6V–GND (tổng VOUT 286 µF ≤ 470 µF) | Chốt-ĐK (BT-R1a, BT-R4) |
| D2 | Littelfuse SMAJ8.0A | TVS | SMA | VM_6V–GND, lớp thứ hai | Giữ r6 |

### 2.7 Driver motor (R1 đã chốt, R-5, R-6)

| RefDes | Linh kiện / MPN | Giá trị | Package | Nối | Trạng thái |
|---|---|---|---|---|---|
| U9 | SN74LVC1G11DBVR | AND 3 ngõ | SOT-23-6 | VCC←V3V3_DEV, A←EN_NODE, B←V5R_OK, C←MCU_MOT_EN, Y→MOTOR_EN | Đề xuất (07/11: veto trực tiếp) |
| R45 / R46 | [box03] | 100 kΩ / 200 kΩ ±1 % | 0603 | V5_R–V5R_OK–GND → 3,21–3,56 V | Chốt |
| R47, R48 | [box03] | 100 kΩ ±1 % | 0603 | MCU_MOT_EN–GND; MOTOR_EN–GND | Chốt |
| U10 | DRV8833PWPR | 2 kênh | HTSSOP-16 | nSLEEP←MOTOR_EN, VCP 0,01 µF, VINT 2,2 µF | Giữ r6 |
| R5, R6 | [box03] | 0,62 Ω ±1 %, 0,25 W | 1206 | AISEN/BISEN–GND (Kelvin) | Chốt (founder) |
| R49, R50 | [box03] | 10 kΩ ±1 % | 0603 | xISEN→ISx_ADC | Chốt |
| C24, C25 | [box03] | 100 nF 16 V X7R | 0603 | ISx_ADC–GND (fc 159 Hz) | Chốt |
| D3, D4 | Schottky [box03] | **DNP** | SOD-323 | xISEN–GND (footprint dự phòng) | Chốt (founder 07/11: DNP trên mẫu đầu, thử BT-ISEN) |
| J2 | JST XH 2,54 mm 2 chân, B2B-XH-A hoặc tương đương | 3 A | THT | VPACK2_RAW; GND | Chốt-ĐK (founder 07/11; kiểm cực tính pack B04) |
| F1 | PTC [box03] | dòng giữ ≥ 2,5 A | — | VPACK2_RAW–VPACK2 | Chốt-ĐK (R3) |

### 2.8 I/O và audio (R-9)

| RefDes | Linh kiện / MPN | Giá trị | Nối | Trạng thái |
|---|---|---|---|---|
| U11 | SN74LVC8T245PWR | — | **DIR→VCCA (A→B)**; OE←GPIO + 100 kΩ lên **VCCA** | Chốt |
| U12, U13 | SN74LVC2T45DCUR | — | B→A theo r6 [box02 tra SCES516N] | Giữ r6 |
| U14 | TCA9517ADGKR | — | EN dùng pull-up nội lên VCCB, không thêm pull-down | Chốt |
| U15 | MAX98357AETE+T | 12 dB, kênh trái | SD_MODE←V5_R qua 10 kΩ (4,37–4,85 V); GAIN_SLOT→GND; không thêm pull-down | Chốt |
| U16 | TPS259474LRPWR | eFuse V5_R→V5_DEV (thay LM66100) | EN←EN_NODE qua 10 kΩ; RILM 5,11 kΩ; ITIMER 1 nF; dVdT 2,2 nF; OVLO→GND | Đề xuất (07/11) |
| U17 | TPS259474LRPWR | pass VBUS Micro-USB robot | EN2_PASS (100k/45,3k + 100 nF), Q8 gate←EN_NODE; RILM 6,65 kΩ; ITIMER 10 nF; OVLO→GND | Đề xuất (07/11) |
| Q8 | DMN2075U-7 | khóa pass khi carrier ON | D←EN2_PASS, G←EN_NODE | Đề xuất |
| U18, U19, U20 | TLV6710DDCR | veto V5_R (VDD VBUS); veto VBUS_PASS; PG-timeout U16 | SOT-23-6 | Đề xuất (07/11) |
| R_dis2, R_pp2, R_x2, C_x2, Q_pg2, R_pg2, PGTH U16 | 2,2 kΩ 0,1 W; 10 kΩ; 1 MΩ; 150 nF; DMN2075U-7; 1 MΩ; 100 kΩ/39,2 kΩ | mạng veto và PG-timeout robot | — | Đề xuất |
| U21 + R/Q | TS3USB221DRCR; 100 kΩ; DMN2075U-7; 100 kΩ ×2 | switch USB data robot | VSON-10 | Đề xuất (07/11) |
| R66, R67 | 0 Ω | PS/SYNC TPS63070 | R66 lắp (VIN), R67 DNP (GND) | Chốt-ĐK (BT-R4) |

---

## 3. Bề rộng trace (R-10)

Giả định 2 lớp, 1 oz, ΔT 10 °C. Hằng số IPC-2221 chưa tra từ bản gốc, nên mọi bề rộng vẽ đều lấy ≥ 1,5 lần mức tính. Trạng thái: Chốt-ĐK (box03 stackup).

| Net | Dòng | Tối thiểu ngoài (tính) | Vẽ |
|---|---|---|---|
| VPACK_RAW, VPACK | 1,2 A | 0,386 mm | ≥ 0,6 mm, đổ đồng |
| V5_BST, V5_DEV, VBUS_C, VBUS_PROG (tay cầm) | 0,6 A | 0,15 mm | ≥ 0,4 mm |
| VPACK2_RAW, VPACK2 | 2,5 A | 1,063 mm | ≥ 1,6 mm hoặc đổ đồng |
| VM_6V | 1,0 A | 0,300 mm | ≥ 0,8 mm |
| V5_R | 0,9 A | 0,26 mm | ≥ 0,6 mm |
| MOTx±, xISEN | 0,5 A | 0,12 mm | ≥ 0,4 mm, Kelvin sense |

## 4. Tóm tắt trạng thái

- Chốt: giá trị đã tính, đối chiếu datasheet và không phụ thuộc phép đo.
- Chốt-ĐK: còn BT-H2, BT-H3, BT-H4, BT-R1a, BT-R4, cùng dữ liệu NTC Semitec, B15 và B04.
- Đề xuất cần box08: TPS259474L, TLV6710 (UVLO robot và 4 detector), DMN2075U-7/DMG2305UX-7, kiến trúc detector, latch LOAD_EN (Q6/Q7/SW4), AND3 MOTOR_EN, R_bias/R_far, nút LOAD_EN/EN_NODE, Schottky DNP ở ISEN.
- Rủi ro founder đã chấp nhận (07/11/2026): chân xISEN của DRV8833 vượt abs max 0,5 V khi ngắn mạch ngõ ra–ngõ ra (1,25–2,07 V), do R1 0,62 Ω đã chốt. Mẫu đầu để footprint Schottky DNP. Thử ngắn mạch có kiểm soát (BT-ISEN, phép đo mới) và hỏi TI trước khi sản xuất loạt.
- Pin map GPIO và netlist đầy đủ: [kicad-input-spec-r7.md](kicad-input-spec-r7.md).
