# MoBot V2 r7 · Chốt giá trị linh kiện và cận thiết kế (DeepSeek, 06/11/2026)

Phạm vi: 18 mục H-1…H-8 và R-1…R-10 trong [deepseek-prompt.md](deepseek-prompt.md). Đây là kết quả tư vấn tính tĩnh theo datasheet và dung sai linh kiện; không thay thế đo bench, dữ liệu B15/B04 hay verdict của Box08. Không có kết luận chứng nhận an toàn nào.

Quy ước: điện trở E96 ±1% trừ khi ghi khác; tụ ghi rõ điện áp định mức và điện môi; `[CẦN TRA]` là thông số chưa có trong datasheet đã đối chiếu.

---

### H-1 TPS61023

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| R_FBT | Điện trở hồi tiếp trên | 732 kΩ ±1% | 0603 |
| R_FBB | Điện trở hồi tiếp dưới | 100 kΩ ±1% | 0603 |
| L1 | Cuộn cảm boost | 1,0 µH, Isat ≥4,5 A, DCR ≤20 mΩ | 4×4 mm |
| C_IN1 | Tụ vào | 10 µF 10 V X7R | 0805 |
| C_IN2 | Tụ vào HF | 100 nF 50 V X7R | 0603 |
| C_OUT1–2 | Tụ ra | 2×22 µF 10 V X7R | 0805 |
| C_OUT3 | Tụ ra HF | 100 nF 50 V X7R | 0603 |

Công thức: VOUT = VREF × (1 + R_FBT/R_FBB); ΔIL = VIN × (1 − VIN/VOUT)/(L × fSW).

Đầu vào: VREF = 580/595/610 mV (TPS61023 SLVSF14B §6.5); VIN = 3,0–4,2 V; IOUT = 0,5 A; fSW = 1 MHz; L = 1,0 µH; ILIM valley min 2,7 A tại 3,6 V (§6.5).

Kết quả min/nom/max: VOUT = 4,742/4,950/5,165 V; IIN tại 3,0 V = 1,04 A; ΔIL = 1,20 A pp; đỉnh L = 1,64 A < 2,7 A.

Kết luận: PASS — 5 V nằm trong dải USB 4,75–5,25 V và đỉnh cuộn cảm còn 39% biên so với giới hạn valley.

Dự phòng: R_FBT 715 kΩ/R_FBB 97,6 kΩ → 4,95 V nếu cặp 732/100 khan hàng.

Box08 cần kiểm:
- Biên valley thực tại pack 3,0 V và nhiệt độ 40 °C.
- Dòng khởi động vào tải 5 V/eFuse và điện dung hiệu dụng sau derating.

---

### H-2 TPS259474A/L

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_EFUSE | TPS259474LRPWR (chọn L, latch-off) | 2,7–23 V, 2 FET đối lưng | QFN 2×2 |
| R_EN1 | Chia EN trên | 267 kΩ ±1% | 0603 |
| R_EN2 | Chia EN dưới | 187 kΩ ±1% | 0603 |
| R_ILIM | Đặt dòng giới hạn | 4,22 kΩ ±1% | 0603 |
| C_ITIMER | Blanking | 1,0 nF 16 V X7R | 0603 |

Công thức: V_EN = 3,3 × R_EN2/(R_EN1 + R_EN2); ILIM = 3334/R_ILIM (TPS25947 SLVSFC9C Eq. 5); t_ITIMER = ΔV_ITIMER × C_ITIMER/I_ITIMER (Eq. 6).

Đầu vào: VEN_H = 1,223 V, VEN_L = 0,45 V (§6.5); logic 3,135–3,3 V; ngân sách 5 V = 0,50 A; ΔV_ITIMER = 1,286–1,741 V, I_ITIMER = 1,2–2,5 µA (§6.5); auto-retry bản A = 110 ms typ [CẦN TRA: min/max thời gian auto-retry bản A và dung sai theo nhiệt, TPS25947 SLVSFC9C].

Kết quả min/nom/max: V_EN = 1,29/1,36/1,36 V khi logic 3,135–3,3 V; mức logic thấp 0,4 V → chân EN 0,165 V < 0,45 V; ILIM = 0,711/0,790/0,869 A; t_blank = 0,51–1,45 ms.

Kết luận: PASS — chọn L để fault không tự retry; nếu giữ A, thời gian khóa ngoài phải > 330 ms (3×110 ms retry typ) và chỉ nhả sau khi fault đã hết.

Dự phòng: TPS259474ARPWR + khóa ngoài 330 ms; không khuyến nghị vì vẫn có cửa sổ retry.

Box08 cần kiểm:
- Đường reset latch L sau fault và sau brownout.
- ILIM 0,79 A so với tải đỉnh DevKit và ngân sách 5 V.

---

### H-3 TPS3808G01

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_UVLO | TPS3808G01 | VIT = 0,405 V ±2% | SOT-23-6 |
| R_UV1 | Chia SENSE trên | 715 kΩ ±1% | 0603 |
| R_UV2a | Chia SENSE dưới | 97,6 kΩ ±1% | 0603 |
| R_UV2b | Trim nối tiếp | 1,00 kΩ ±1% | 0603 |
| R_H | Hồi tiếp RESET→SENSE | 1,10 MΩ ±1% | 0603 |
| C_CT | Tụ trễ nhả | 3,9 nF 16 V X7R | 0603 |

Công thức: V_fall = 0,405 × (1 + R_UV1/(R_UV2a + R_UV2b)); V_rise ≈ V_fall + 0,405 × R_UV1/R_H; t_CT = C_CT(nF)/175 (TPS3808 SBVS050N §7.3.2, Eq. 1).

Đầu vào: VIT = 0,405 V; R tổng dưới = 98,6 kΩ; hệ số = 8,251; V_fall cho trước 3,266–3,417 V; trễ SENSE→RESET 20 µs typ [CẦN TRA: giá trị max của trễ lan truyền SENSE→RESET, TPS3808 SBVS050N §6.5].

Kết quả min/nom/max: V_fall = 3,266/3,342/3,417 V; V_rise = 3,515/3,605/3,700 V; t_CT = 22,3 ms (chỉ trễ nhả); ngắt eFuse < 0,1 ms, rail 5 V xuống < 3 V < 0,7 ms nếu không ngắt.

Kết luận: CẦN ĐO — ngưỡng tĩnh và re-arm đạt, nhưng biên 66 mV tới 3,20 V phụ thuộc nội trở/xung B15 và trễ ngắt thực.

Dự phòng: R_H 1,0 MΩ → V_rise 3,58 V nếu rò làm trượt ngưỡng; C_CT 4,7 nF → 26,9 ms.

Box08 cần kiểm:
- V_rise thấp nhất ≥3,50 V trên 0–40 °C và sau khi RESET nhả.
- Tổng trễ phát hiện→tải OFF so với 66 mV biên.

---

### H-4 Detector raw VBUS

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_D1, U_D2 | TLV6703 (một IC/kênh) | VIT = 0,4 V ±1%, OUTA open-drain | SOT-23-6 |
| R_D1 | Chia VBUS trên | 100 kΩ ±1% | 0603 |
| R_D2 | Chia VBUS dưới | 9,53 kΩ ±1% | 0603 |
| R_H4 | Hysteresis | 10 MΩ ±1% | 0603 |
| R_PU | Pull-up OUTA | 100 kΩ ±1% | 0603 |
| R_L1 | Level-shift trên | 100 kΩ ±1% | 0603 |
| R_L2 | Level-shift dưới | 240 kΩ ±1% | 0603 |
| R_LPD | Giữ mức thấp | 10 MΩ ±1% | 0603 |

Công thức: V_detect = 0,4 × (R_D1 + R_D2)/R_D2; mức ra cao = VBUS × R_L2/(R_PU + R_L1 + R_L2) khi OUTA high-Z.

Đầu vào: VBUS 4,4–5,5 V; VIT 0,396–0,404 V (TLV6700/TLV6703 SNVSAV2B §6.5); R ±1%; OUTA kéo thấp khi INA+ dưới ngưỡng.

Kết quả min/nom/max: V_detect = 4,50/4,56/4,62 V; V_deassert = 4,44/4,50/4,56 V; mức ra cao = 2,46 V tại VBUS 4,56 V, 2,70 V tại 5,0 V; mức thấp ≤0,14 V.

Kết luận: PASS — detect/deassert nằm trong 4,4–5,5 V; đứt dây sense kéo INA+ về 0 → OUTA thấp → ngõ ra thấp (fail-off); mất VBUS hoặc mất 3V3_USB cũng cho mức thấp.

Dự phòng: TLV6700 dùng OUTA cho kênh thứ hai nếu cần cùng package; không đổi ngưỡng.

Box08 cần kiểm:
- Cả Micro-USB (sau pass, trước D1) và USB-C, gồm thứ tự cắm/rút.
- Trạng thái ngõ ra khi 3V3_USB ramp và khi dây sense hở.

---

### H-5 Logic EN 2× TMUX1511

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_NOR | 74LVC1G27 (3-input NOR) | 1,65–3,6 V | SOT-23-6 |
| U_AND | 74LVC1G11 (3-input AND) | 1,65–3,6 V | SOT-23-6 |
| U_MUX1–2 | TMUX1511 | 4 kênh SPST, 1,5–5,5 V | SOT-23-10 |
| R_BTN1–3 | Pull-up nút | 10 kΩ ±1% | 0603 |
| R_PD_EN | Giữ EN thấp | 100 kΩ ±1% | 0603 |

Công thức: EN_SW = PACK_OK · EN_CMD · NOR(VBUS_MICRO_OK, VBUS_C_OK, USB_RAIL_PG).

Đầu vào: TMUX1511 IDD ≤70 µA/IC, SEL có pull-down nội 6 MΩ, VDD 3,3 V (TMUX1511 SCDS390B §6.5, §7.3.7); nút 3,3 V qua 10 kΩ.

Kết quả min/nom/max: dòng rò trạng thái 00 = 2×70 µA + 5×0,55 µA + 5 nA ≈ 143 µA; khi có USB thêm 2×60 µA detector ≈ 263 µA; nút nhấn 0,33 mA/nút.

Kết luận: PASS — EN chỉ cao khi cả ba điều kiện đúng; mất 3V3_DEV hoặc EN high-Z đều kéo SEL xuống thấp nhờ pull-down nội và R_PD_EN.

Dự phòng: 74LVC1G11 + 74LVC1G02 nếu không có 1G27; giữ nguyên giá trị.

Box08 cần kiểm:
- SEL thấp trong toàn bộ thời gian 3V3_DEV ramp và khi MCU reset.
- Lỗi hở ngõ ra detector: USB_RAIL_PG cao mà cả hai detector thấp phải khóa EN_SW.

---

### H-6 Thời gian chờ ADC1

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| R_SER | Điện trở nối ADC (tùy chọn) | 0 Ω (hoặc 100 Ω) | 0603 |
| C_ADC | Tụ lọc ADC (tùy chọn) | 100 pF 50 V C0G | 0603 |

Công thức: R_settle = R_wiper/4 + R_ON; t = ln(2^13) × R_settle × C_eff = 9,01 × R_settle × C_eff.

Đầu vào: R_wiper = 10 kΩ; R_ON = 4,5 Ω max (TMUX1511 SCDS390B §6.5); C_eff = 10 pF giả định [CẦN TRA: điện dung lấy mẫu ADC1 của ESP32, ESP32 datasheet].

Kết quả min/nom/max: R_settle = 2,505 kΩ; τ = 25,1 ns; t = 226 ns; chờ 5 µs cho 22× biên; nếu C_eff = 100 pF thì t = 2,26 µs, vẫn < 5 µs.

Kết luận: CẦN ĐO — 5 µs đủ cho C_eff ≤100 pF; phải đo điện dung đầu vào ADC1 và điện trở nguồn thực của joystick.

Dự phòng: thêm 100 pF C0G tại ADC và giữ chờ 10 µs nếu dây joystick dài.

Box08 cần kiểm:
- R nguồn thực của biến trở joystick ở hai cực.
- C_eff của ADC1 và ảnh hưởng của tụ lọc nếu có.

---

### H-7 MCP73833

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_CHG | MCP73833-FCI/MF | 4,2 V, 1 A max | DFN-10 |
| C_IN | Tụ vào | 4,7 µF 10 V X7R | 0805 |
| C_BAT | Tụ BAT | 4,7 µF 10 V X7R | 0805 |
| R_LED1–3 | Điện trở LED STAT1/STAT2/PG | 680 Ω ±1% | 0603 |
| R_PG | Pull-up PG | 100 kΩ ±1% | 0603 |
| R_STAT | Pull-up STAT | 100 kΩ ±1% | 0603 |
| NTC | 103AT-2 | 10 kΩ ±1%, B = 3435 | 0603 |

Công thức: I_LED = (VIN − VF − VOL)/R_LED; V_THERM = 50 µA × R_NTC.

Đầu vào: ISINK ≤25 mA, VOL ≤0,4 V tại 4 mA (MCP73833 DS20002005C Electrical Characteristics); ITTHERM = 47–53 µA; VT1 = 1,20–1,26 V; VT2 = 0,235–0,265 V; NTC 103AT-2 R25 = 10 kΩ, B = 3435 [CẦN TRA: dung sai B và R25 của 103AT-2 trong 0–45 °C, datasheet NTC].

Kết quả min/nom/max: I_LED = 3,68 mA (3 LED = 11,0 mA); NTC 0 °C = 28,7 kΩ → 1,44 V > 1,26 V (ngắt lạnh); 45 °C = 4,85 kΩ → 0,242 V, ngắt nóng thực tế ~46 °C; NTC hở → 5 V (ngắt), NTC ngắn → 0 V (ngắt).

Kết luận: CẦN ĐO — CIN/CBAT/LED/THERM đạt; phát hiện pack vắng cần công tắc cơ học trong ngăn pack nối GPIO, không suy ra từ STAT.

Dự phòng: R_LED 1,0 kΩ → 2,5 mA/LED nếu cần giảm dòng USB; NTC hở/ngắn đã an toàn, không cần mạch thêm.

Box08 cần kiểm:
- NTC hở/ngắn và pack vắng trên mẫu cơ khí.
- Dòng LED + bias trong ngân sách 500 mA.

---

### H-8 Dòng USB-C tổng tay cầm

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| C_IN | Tụ vào sạc | 4,7 µF 10 V X7R | 0805 |
| R_LED1–3 | LED | 680 Ω ×3 | 0603 |
| — | Bias detector + TMUX + LDO | 0,87 mA | — |

Công thức: I_USB = I_CHG(max) + I_LED + I_BIAS + I_INRUSH.

Đầu vào: I_CHG max 0,446 A (RPROG 2,49 kΩ ±1%, IC ±10%); LED 11,0 mA; bias 0,87 mA (MCP Iq 0,5 mA + TMUX 0,14 mA + detector 0,12 mA + LDO 6,5 µA + TUSB 0,1 mA); USB 5 V/500 mA [CẦN TRA: giới hạn inrush/điện dung tải của cổng USB 2.0, USB-IF].

Kết quả min/nom/max: I_USB = 0,446 + 0,011 + 0,00087 = 0,458 A; biên 42 mA (8,4%); inrush 4,7 µF = 23,5 µC, ~24 µs nếu giới hạn 1 A.

Kết luận: PASS — tổng steady-state dưới 500 mA; inrush 4,7 µF nằm trong mức thường được chấp nhận cho cổng USB 2.0.

Dự phòng: R_LED 1,5 kΩ → 1,7 mA/LED, tổng 0,450 A nếu nguồn USB yếu.

Box08 cần kiểm:
- Đo dòng tổng trên nguồn 500 mA thực, gồm LED sáng và detector.
- Inrush khi cắm USB-C và khi pack cạn.

---

### R-1 BQ25886

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_CHG | BQ25886 | 2S boost charger, 1,5 MHz | QFN |
| R_ICHG | RICHGSET | 1,91 kΩ ±1% | 0603 |
| R_TS1 | Chia TS trên từ REGN | 5,11 kΩ ±1% | 0603 |
| R_TS2 | Chia TS dưới | 26,7 kΩ ±1% | 0603 |
| L1 | Cuộn cảm boost | 1,0 µH, Isat ≥4 A | 4×4 mm |
| C_BUS | Tụ VBUS | 10 µF 16 V X7R | 0805 |
| C_PMID | Tụ PMID | 10 µF 16 V X7R | 0805 |
| C_SYS | Tụ SYS | 2×22 µF 16 V X7R | 0805 |
| C_BAT | Tụ BAT | 10 µF 16 V X7R | 0805 |
| R_CE | Pull-up /CE | 100 kΩ ±1% | 0603 |
| NTC | 103AT-2 | 10 kΩ, B = 3435 | 0603 |

Công thức: ICHG = R_ICHGSET/3810 (BQ25886 SLUSD88A §6.5); TS chia từ REGN, NTC xuống GND.

Đầu vào: K_ICHGSET = 3810 Ω/A; mục tiêu 0,50 A; NTC 10 kΩ; REGN 5 V; ngưỡng TS 73,25%/44,75% REGN (§6.5).

Kết quả min/nom/max: ICHG = 0,426/0,501/0,576 A (±1% R, ±15% IC tại 0,5 A); cửa sổ TS ≈ 0,3–44,7 °C; CE mặc định tắt nhờ 100 kΩ lên REGN, chỉ bật khi TUSB320 OUT1 kéo thấp.

Kết luận: PASS — đặt đúng 0,50 A; tại VBAT 8,4 V dòng bị giới hạn input bởi RILIM 1,24 kΩ (0,895 A) còn ~0,45 A, nằm trong pha CV nên không làm mất mục tiêu.

Dự phòng: R_ICHG 1,87 kΩ → 0,491 A nếu 1,91 kΩ khan; giữ nguyên RILIM 1,24 kΩ.

Box08 cần kiểm:
- CE high-Z khi TUSB320 chưa báo 1,5 A/3 A và qua reset.
- Cửa sổ TS 0–45 °C với dung sai NTC và dòng input thực.

---

### R-2 UVLO robot

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_UV2 | TLV6700 | VIT = 0,4 V ±1%, OUTA | SOT-23-6 |
| R_UV1a | Chia trên | 1,47 MΩ ±0,1% | 0603 |
| R_UV1b | Nối tiếp | 18,7 kΩ ±0,1% | 0603 |
| R_UV2 | Chia dưới | 97,6 kΩ ±0,1% | 0603 |
| R_H2 | Hysteresis | 2,0 MΩ ±1% | 0603 |
| R_ENPU | Pull-up EN | 100 kΩ ±1% | 0603 |
| R_ENPD | Pull-down EN | 47 kΩ ±1% | 0603 |

Công thức: V_fall = 0,4 × (R_UV1 + R_UV2)/R_UV2; V_rise ≈ V_fall + 0,4 × R_UV1/R_H2.

Đầu vào: VIT 0,396–0,404 V (TLV6700 SNVSAV2B §6.5); R_top = 1,4887 MΩ; R_bot = 97,6 kΩ; mục tiêu 6,40–6,60 V.

Kết quả min/nom/max: V_fall = 6,42/6,50/6,59 V; V_rise = 6,72/6,80/6,88 V; hysteresis 0,30 V; OUTA kéo EN thấp khi pack dưới ngưỡng, R_ENPD giữ EN thấp khi mất bias/POR.

Kết luận: PASS — dùng OUTA đúng cực tính (thấp khi UV), không còn lỗi OUTB đảo; fail-off nhờ R_ENPD và OUTA thấp dưới UVLO.

Dự phòng: TLV6710 (0,75%) nếu không có cặp 0,1%; giữ nguyên ngưỡng.

Box08 cần kiểm:
- Cực tính OUTA và trạng thái EN khi TLV6700 dưới POR.
- Hysteresis 0,30 V trên ramp 6,0–8,4 V.

---

### R-3 TPS54302

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_BUCK | TPS54302 | 4,5–28 V, 3 A, 400 kHz | SOT-23-6 |
| R_FBT | Hồi tiếp trên | 750 kΩ ±1% | 0603 |
| R_FBB | Hồi tiếp dưới | 100 kΩ ±1% | 0603 |
| L1 | Cuộn cảm | 10 µH, Isat ≥3 A | 5×5 mm |
| C_IN | Tụ vào | 10 µF 25 V X7R | 0805 |
| C_OUT1–2 | Tụ ra | 2×22 µF 16 V X7R | 0805 |
| R_EN1 | Chia EN trên | 383 kΩ ±1% | 0603 |
| R_EN2 | Chia EN dưới | 100 kΩ ±1% | 0603 |
| D_Z | Kẹp EN | BZT52C5V6 | SOD-123 |

Công thức: VOUT = 0,596 × (1 + R_FBT/R_FBB); V_EN = VPACK × R_EN2/(R_EN1 + R_EN2).

Đầu vào: VFB = 0,596 V (TPS54302 SLVSDG6C §6.5); VPACK 6,0–8,4 V; EN khuyến nghị ≤5,5 V, tuyệt đối 7 V; dòng rò BZT52C5V6 tại 1,74 V [CẦN TRA: dòng rò ngược BZT52C5V6 ở 1,7 V, datasheet Diodes].

Kết quả min/nom/max: VOUT = 4,96/5,07/5,17 V; V_EN = 1,24/1,49/1,74 V; Zener kẹp 5,6 V nếu R_EN2 hở.

Kết luận: PASS — EN không bao giờ vượt 5,5 V trong dải pack; Zener bảo vệ khi mất nhánh dưới.

Dự phòng: R_FBT 732 kΩ → 4,95 V nếu cần giảm áp; không đổi L/C.

Box08 cần kiểm:
- V_EN tại 8,4 V và khi R_EN2 hở.
- Dòng Zener rò ở 1,74 V.

---

### R-4 TPS63070

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_BB | TPS63070 | 2 A buck-boost | QFN |
| R_FBT | Hồi tiếp trên | 649 kΩ ±1% | 0603 |
| R_FBB | Hồi tiếp dưới | 100 kΩ ±1% | 0603 |
| L1 | Cuộn cảm | 1,5 µH, Isat ≥3,5 A | 4×4 mm |
| C_IN | Tụ vào | 10 µF 16 V X7R | 0805 |
| C_OUT1–2 | Tụ ra | 2×22 µF 16 V X7R | 0805 |
| R_PS | Chọn chế độ | 0 Ω xuống GND (forced PWM) | 0603 |

Công thức: VOUT = 0,8 × (1 + R_FBT/R_FBB); PS/SYNC thấp = forced PWM.

Đầu vào: VFB = 0,8 V (TPS63070 SLVSC58B §6.5); VIN 6,0–8,4 V; VOUT 6,0 V; IOUT 0,9 A; L danh định 1,5 µH.

Kết quả min/nom/max: VOUT = 5,87/5,99/6,11 V; forced PWM giữ synchronous rectifier hoạt động và cho dòng âm theo giới hạn negative current limit [CẦN TRA: giá trị negative current limit của TPS63070, SLVSC58B].

Kết luận: CẦN ĐO — forced PWM là lựa chọn đúng cho phanh/đảo chiều, nhưng năng lượng trả về thực phụ thuộc L motor và profile phanh.

Dự phòng: đưa PS/SYNC ra GPIO để chuyển power-save khi idle; chỉ dùng nếu đo cho thấy không tăng đỉnh VM.

Box08 cần kiểm:
- Đường dòng ngược về VIN/pack khi phanh và đỉnh VM.
- Tác động của forced PWM lên nhiệt/Iq ở chế độ chờ.

---

### R-5 Logic MOTOR_EN

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_AND | 74LVC1G08 | 1,65–3,6 V | SOT-23-5 |
| R_PD1 | Pull-down MCU_MOT_EN | 100 kΩ ±1% | 0603 |
| R_PD2 | Pull-down LOGIC_EN | 100 kΩ ±1% | 0603 |
| R_NS | Pull-down nSLEEP | 100 kΩ ±1% | 0603 |

Công thức: MOTOR_EN = LOGIC_EN AND MCU_MOT_EN; nSLEEP = MOTOR_EN.

Đầu vào: DRV8833 nSLEEP VIH = 2,0 V, có pull-down nội 500 kΩ (DRV8833 SLVSAR1E §6.5); logic 3,3 V.

Kết quả min/nom/max: mức cao 3,3 V; mức thấp 0 V; khi MCU reset/high-Z → 0 V; khi mất 3V3 → 0 V.

Kết luận: PASS — motor chỉ chạy khi cả LOGIC_EN và MCU_MOT_EN cùng cao; reset/high-Z đều về OFF.

Dự phòng: 74LVC1G11 thêm PACK_OK làm điều kiện thứ ba nếu cần khóa cứng hơn.

Box08 cần kiểm:
- nSLEEP trong khoảng 3V3 ramp và MCU reset.
- Trạng thái khi LOGIC_EN high-Z.

---

### R-6 RC lọc ISEN

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| R_ISEN1–2 | Lọc ISEN | 1,0 kΩ ±1% | 0603 |
| C_ISEN1–2 | Lọc ISEN | 10 nF 16 V X7R | 0603 |
| D_CLAMP | Kẹp ADC | BAT54S (2 diode) | SOT-23 |

Công thức: V_ISEN = I_MOTOR × 0,62 Ω; f_C = 1/(2πRC); V_ISEN(abs max) = ±0,5 V.

Đầu vào: trip max 0,391 A; dòng short giới hạn 0,200 V/0,62 Ω = 0,323 A; R_ISEN 0,62 Ω; DRV8833 xISEN abs max ±0,5 V (SLVSAR1E §6.1).

Kết quả min/nom/max: V_trip = 0,242 V; V_short = 0,200 V; xung blanking 3,75 µs thêm ≈0,05 V → max 0,29 V < 0,5 V; τ = 10 µs, f_C = 15,9 kHz.

Kết luận: PASS — ISEN không vượt abs max kể cả short; RC đủ nhanh cho vòng dòng và đủ chậm để lọc nhiễu chopping.

Dự phòng: R 470 Ω/C 4,7 nF → τ = 2,2 µs nếu cần đáp ứng nhanh hơn.

Box08 cần kiểm:
- Đỉnh ISEN thực khi short đầu ra và khi đảo chiều.
- Vị trí clamp/layout so với DRV8833.

---

### R-7 Kẹp VM

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| C_BULK | Bulk VM | 220 µF 16 V polymer, ESR ≤30 mΩ | 8×8 mm |
| Q_BRAKE | P-MOS brake | DMP3098L | SOT-23 |
| R_BRAKE | Điện trở hãm | 22 Ω 5 W | 2512 |
| U_CLAMP | Comparator kẹp | TLV6700 (OUTB) | SOT-23-6 |
| R_G | Gate | 1,0 kΩ | 0603 |
| R_GS | Pull-up gate | 100 kΩ | 0603 |

Công thức: E = 2 × ½ × L × I²; ΔV = √(V0² + 2E/C).

Đầu vào: L = 10 mH, I = 0,45 A, 2 kênh; C = 220 µF; V0 = 6,0 V; ngưỡng kẹp 8,2 V; SOA của DMP3098L [CẦN TRA: SOA/xung cho 22 Ω tại 8,2 V, datasheet DMP3098L].

Kết quả min/nom/max: E = 2,025 mJ; ΔV = 7,37 V với 220 µF; 7,94 V với 150 µF; 8,75 V với 100 µF; kẹp active 8,2 V ±0,2, hysteresis 0,3 V.

Kết luận: CẦN ĐO — bulk 220 µF đã giữ đỉnh <9,0 V cho xung đơn 2,03 mJ; active clamp là lớp thứ hai cho xung lặp/cơ năng. TVS SMAJ8.0A có clamp 13,6 V nên không dùng một mình.

Dự phòng: 330 µF 16 V nếu C_eff đo được <150 µF; giữ nguyên kẹp 8,2 V.

Box08 cần kiểm:
- Đỉnh VM với L = 10 mH, 0,45 A, hai kênh và phanh lặp.
- Ngưỡng kẹp 8,2 V không cắt nhầm khi VM 6,0 V.

---

### R-8 LDO 3,3 V cho TUSB320LAI

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_LDO | TPS7A2033PDBVR | 3,3 V, 200 mA, IQ 6,5 µA | SOT-23-5 |
| C_IN | Tụ vào | 1 µF 10 V X7R | 0603 |
| C_OUT | Tụ ra | 1 µF 10 V X7R | 0603 |
| D_IN | Chống ngược | PMEG2010 | SOD-323 |

Công thức: V_IN(min) − V_F ≥ 3,3 V + V_DO.

Đầu vào: VBUS 4,4–5,5 V; V_F ≈0,3 V; V_DO = 130 mV tại 200 mA (TPS7A20 SBVS338H §6.5); tải 0,33 mA; dòng ngược cho phép khi VOUT > VIN [CẦN TRA: giới hạn dòng ngược TPS7A20, SBVS338H].

Kết quả min/nom/max: V_IN_LDO = 4,1 V tại VBUS 4,4 V; yêu cầu 3,43 V; biên 0,67 V; IQ 6,5 µA.

Kết luận: PASS — dropout và IQ đạt; diode ngăn dòng ngược từ 3,3 V về VBUS khi rút cáp.

Dự phòng: TLV75533 (500 mA) nếu sau này TUSB320 + peripheral vượt 200 mA.

Box08 cần kiểm:
- Dòng ngược qua LDO khi VBUS mất.
- Ramp VBUS 4,4–5,5 V và trạng thái 3V3_USB.

---

### R-9 Mức chân logic khi ramp

| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
|---|---|---|---|
| U_XCVR | SN74LVC8T245 | 8-bit dual-supply | TSSOP-24 |
| R_OE | Pull-up OE | 100 kΩ lên VCCB | 0603 |
| R_DIR | Pull-down DIR | 100 kΩ xuống GND | 0603 |
| U_I2C | TCA9517A | I²C buffer | VSSOP-8 |
| R_EN | Pull-down EN | 100 kΩ xuống GND | 0603 |
| U_AMP | MAX98357A | I²S amp | QFN |
| R_SD | Pull-down SD_MODE | 100 kΩ xuống GND | 0603 |
| R_GAIN | Chọn gain | 0 Ω xuống GND | 0603 |

Công thức: OE thấp = enabled; DIR thấp = A→B; EN cao = enabled; SD_MODE thấp = shutdown.

Đầu vào: VCC 3,3 V; SN74LVC8T245 có I_off khi mất nguồn; TCA9517A EN active-high; MAX98357A SD active-high.

Kết quả min/nom/max: khi reset/ramp: OE = VCCB (disabled), DIR = 0 (A→B), TCA EN = 0 (disabled), SD_MODE = 0 (shutdown), GAIN = 0 V; sau boot MCU kéo OE/EN/SD theo firmware.

Kết luận: PASS — tất cả chân điều khiển có mức xác định, không float; bus và amp ở trạng thái an toàn khi rail ramp.

Dự phòng: 74LVC2T45 cho DIR/OE nếu không dùng 8T245; giữ nguyên pull.

Box08 cần kiểm:
- Thứ tự ramp VCCA/VCCB và I_off của 8T245.
- Mức GAIN thực tế của MAX98357A [CẦN TRA: bảng chọn gain, datasheet MAX98357A].

---

### R-10 Bề rộng trace IPC-2221

| Net | Dòng | Đồng ngoài 1 oz | Đồng trong 1 oz | Chọn |
|---|---|---|---|---|
| VPACK | 1,2 A | 0,386 mm | 1,005 mm | 0,50 mm ngoài / 1,2 mm trong |
| VPACK2 | 2,5 A | 1,063 mm | 2,765 mm | 1,2 mm ngoài / 3,0 mm trong |
| VM | 1,0 A | 0,301 mm | 0,780 mm | 0,40 mm ngoài / 1,0 mm trong |
| V5 | 1,0 A | 0,301 mm | 0,780 mm | 0,40 mm ngoài / 1,0 mm trong |

Công thức: A = (I/(k × ΔT^0,44))^(1/0,725); k = 0,048 lớp ngoài, 0,024 lớp trong; W = A/(1,378 mil) với 1 oz = 1,378 mil; ΔT = 10 °C.

Đầu vào: I theo bảng; 2 lớp 1 oz; nhiệt 0–40 °C; IPC-2221 [CẦN TRA: hệ số k lớp trong và độ dày đồng thực của stackup, IPC-2221].

Kết quả min/nom/max: chiều rộng tối thiểu tính được như bảng; giá trị chọn lớn hơn 20–30% để bù sai số ăn mòn và via.

Kết luận: PASS — bề rộng chọn đạt ΔT ≤10 °C theo công thức sàng lọc; nếu dùng 4 lớp, VPACK2 và VM nên đi lớp trong với 3,0 mm/1,0 mm.

Dự phòng: 4 lớp 1 oz cho VPACK2/VM nếu diện tích 2 lớp không đủ.

Box08 cần kiểm:
- Stackup, độ dày đồng thực và số via.
- Nhiệt trace dưới tải xung motor.

---

## Bảng tổng 18 mục

| ID | Giá trị chốt | Kết luận | [CẦN TRA] |
|---|---|---|---|
| H-1 | 732 kΩ/100 kΩ; 1,0 µH; 10 µF + 2×22 µF; 4,95 V | PASS | 0 |
| H-2 | 267 kΩ/187 kΩ; 4,22 kΩ; 1,0 nF; TPS259474L | PASS | 1 |
| H-3 | 715 kΩ/(97,6 kΩ+1,0 kΩ); 1,10 MΩ; 3,9 nF | CẦN ĐO | 1 |
| H-4 | 100 kΩ/9,53 kΩ; 4,56 V; level-shift 100 kΩ/240 kΩ | PASS | 0 |
| H-5 | 2× TMUX1511; 10 kΩ nút; EN = AND 3 điều kiện | PASS | 0 |
| H-6 | R_settle 2,505 kΩ; 226 ns; chờ 5 µs | CẦN ĐO | 1 |
| H-7 | 4,7 µF/4,7 µF; 680 Ω; NTC trực tiếp THERM | CẦN ĐO | 1 |
| H-8 | 0,458 A max; biên 42 mA | PASS | 1 |
| R-1 | 1,91 kΩ; 5,11 kΩ/26,7 kΩ; 1,0 µH | PASS | 0 |
| R-2 | 1,47 MΩ+18,7 kΩ/97,6 kΩ; 2,0 MΩ; 6,50 V | PASS | 0 |
| R-3 | 750 kΩ/100 kΩ; 10 µH; 383 kΩ/100 kΩ | PASS | 1 |
| R-4 | 649 kΩ/100 kΩ; 1,5 µH; PS/SYNC = GND | CẦN ĐO | 1 |
| R-5 | 74LVC1G08; 100 kΩ pull-down | PASS | 0 |
| R-6 | 1,0 kΩ/10 nF; max 0,29 V | PASS | 0 |
| R-7 | 220 µF; 22 Ω; kẹp 8,2 V | CẦN ĐO | 1 |
| R-8 | TPS7A2033; 3,3 V; 0,33 mA | PASS | 1 |
| R-9 | OE/DIR/EN/SD pull; GAIN = GND | PASS | 1 |
| R-10 | 0,50/1,2/0,40 mm ngoài; 1,2/3,0/1,0 mm trong | PASS | 1 |

Tổng số mục có `[CẦN TRA]`: 11 (H-2, H-3, H-6, H-7, H-8, R-3, R-4, R-7, R-8, R-9, R-10). Các mục `CẦN ĐO`: H-3, H-6, H-7, R-4, R-7.
