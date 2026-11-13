# Đối chiếu thông số datasheet · MoBot V2 r7 (06/11/2026)

PDF tải từ trang hãng ngày 06/11/2026 và lưu ở scratchpad của session. Văn bản được trích bằng `pdftotext` (poppler, MinGW). "Khớp" nghĩa là giá trị DeepSeek dùng trùng với datasheet. Chênh lệch nhỏ hơn mức làm tròn được tính là khớp.

## Nguồn đã tải

| IC | Mã tài liệu / revision | Nguồn |
|---|---|---|
| TPS61023 | SLVSF14B (REVISED AUGUST 2020) | ti.com |
| TPS25947 / TPS259474 | SLVSFC9C (REVISED MAY 2026) | ti.com |
| TPS3808 | SBVS050N (REVISED AUGUST 2026) | ti.com |
| TLV6700 | SNVSAV2B (REVISED NOVEMBER 2019) | ti.com |
| TLV6703 | **SBOS865B** (REVISED NOVEMBER 2019) | ti.com |
| TMUX1511 | SCDS390B (REVISED MARCH 2025) | ti.com |
| BQ25886 | SLUSD88A (REVISED JUNE 2019) | ti.com |
| TPS54302 | SLVSDG6C (REVISED MARCH 2026) | ti.com |
| TPS63070 | SLVSC58B (REVISED MARCH 2019) | ti.com |
| DRV8833 | SLVSAR1E (REVISED JULY 2015) | ti.com |
| TPS7A20 | SBVS338H (REVISED JULY 2024) | ti.com |
| SN74LVC8T245 | SCES584D (REVISED MAY 2026) | ti.com |
| TCA9517A | SCPS245E (REVISED OCTOBER 2025) | ti.com |
| TUSB320LAI | SLLSEQ8D (REVISED MAY 2017) | ti.com |
| SN74LVC1G27 / 1G11 / 1G08 | SCES488E / SCES487I / SCES217 | ti.com |
| MCP73833 | DS20002005C | microchip.com |
| ESP32 | Series Datasheet v5.3 | espressif.com |
| BZT52C5V6 | DS18004 Rev. 38-2 | diodes.com |
| DMP3098L | DS31447 Rev. 8-2 | diodes.com |
| MAX98357A | 19-6779 Rev 16 (2/26). User cung cấp file `D:\max98357a-max98357b.pdf` ngày 06/11; tải tự động từ analog.com đã thất bại 3 lần | analog.com (bản của user) |
| **Semitec 103AT-2** | [CHƯA XÁC MINH] 2 URL semitec-global trả HTML, URL Mouser trả file rỗng | — |
| **Littelfuse SMAJ** | [CHƯA XÁC MINH] 2 URL trả HTML. Số 13,6 V lấy từ mục "Đã chốt" | — |
| **IPC-2221** | [CHƯA XÁC MINH] tiêu chuẩn có phí, không tải | — |

## Bảng đối chiếu

| IC | Thông số | DeepSeek dùng | Datasheet | Rev / mục | Khớp? |
|---|---|---|---|---|---|
| TPS61023 | VREF (PWM) | 580/595/610 mV | 580/595/610 mV | SLVSF14B §6.5 | Có |
| TPS61023 | ILIM_SW valley | min 2,7 A @3,6 V | 2,7 min / 3,7 typ A @VIN 3,6 V, VOUT 5 V | §6.5 | Có |
| TPS61023 | fSW | 1 MHz | 1,0 MHz typ, không có min/max | §6.5 | Có (chỉ typ) |
| TPS61023 | L hiệu dụng | 1,0 µH | 0,37/1,0/2,9 µH. Datasheet khuyên tính với −30 % | §6.3, §8.2.2.2 | Có, DeepSeek bỏ −30 % |
| TPS61023 | Chia áp FB mẫu | 732k/100k | 732k/100k (Figure 8-1). R2 < 300 kΩ | §8.2 | Có |
| TPS61023 | Công thức ripple | D = 1 − VIN/VOUT | D theo Eq 2, có hiệu suất η | §8.2.2.2 Eq 2, 6 | **Không**: DeepSeek bỏ η, ΔIL thấp hơn ~23 % |
| TPS259474 | VEN_H | 1,223 V | VUVLO(R) 1,183/1,20/1,223 V | SLVSFC9C §6.5 | Có (giá trị max) |
| TPS259474 | VEN_L | 0,45 V | VSD(F) 0,45 min / 0,74 max (dòng tắt thấp nhất). VUVLO(F) 1,076–1,116 V | §6.5 | Có. Còn thiếu VUVLO(F) |
| TPS259474 | ILIM | 3334/R ±10 % | Eq 5 RILM = 3334/ILIM. Bảng: 6,65k → 0,425/0,500/0,575 A; 3,32k → 0,850/1,007/1,150 A (khoảng ±15 %) | §6.5, §7.3 Eq 5 | **Không**: dung sai khoảng ±15 %, không phải ±10 % |
| TPS259474 | ΔV_ITIMER, I_ITIMER | 1,286–1,741 V; 1,2–2,5 µA | 1,286/1,51/1,741 V; 1,2/1,8/2,5 µA | §6.5 | Có |
| TPS259474 | tRST auto-retry | 110 ms typ [CẦN TRA min/max] | 110 ms typ, không có min/max | §6.6 | Có. Datasheet không có cận |
| TPS259474 | Biến thể | A và L | TPS259474ARPW auto-retry, TPS259474LRPW latch-off, cả hai là circuit breaker | §4 Device Comparison | Có |
| TPS3808G01 | VIT | 0,405 V ±2 % | 0,405 V, −2 %/±1 %/+2 % | SBVS050N §6.5 | Có |
| TPS3808G01 | VHYS nội | không dùng | 1,5 % typ, 3 % max | §6.5 | DeepSeek bỏ qua |
| TPS3808G01 | ISENSE | không dùng | ±25 nA @VSENSE = VIT | §6.5 | **DeepSeek bỏ qua** (±18 mV quy về pack với 715k/98,6k) |
| TPS3808G01 | Công thức tD | C(nF)/175 | tD(s) = CT(nF)/175 + 0,5 ms. Mẫu 180 nF: 0,62/1,03/1,44 s | §7.3.2 Eq 1, §6.6 | **Không**: thiếu +0,5 ms và dung sai ±40 % |
| TPS3808G01 | Trễ SENSE→RESET | 20 µs typ [CẦN TRA max] | 20 µs typ, không có max | §6.6 | Có. Datasheet không có cận |
| TPS3808G01 | VPOR | — | 0,8 V max | §6.5 | — |
| TLV6703 | Mã datasheet | SNVSAV2B | **SBOS865B**. SNVSAV2B là TLV6700 | trang 1 | **Không** |
| TLV6703 | Chân ra | OUTA, INA+ | Một kênh: SENSE, OUT. Không có OUTA | §6 Pin Functions | **Không** |
| TLV6703 | VIT+ | 0,396–0,404 V | 396/400/404 mV | SBOS865B §7.5 | Có |
| TLV6703 | VIT− | (dùng VIT+) | 387/394,5/400 mV, hysteresis 5,5 typ / 12 max mV | §7.5 | **Không** dùng cho deassert |
| TLV6703 | Logic | OUT thấp khi SENSE dưới ngưỡng | SENSE < VIT− → OUT sink; > VIT+ → high-Z | Table 2 | Có |
| TLV6700 | VIT cho falling | 0,396–0,404 V | Falling dùng VIT− 0,387–0,400 V. VIT+ 0,396–0,404 V | SNVSAV2B §6.5 | **Không**: R-2 dùng ngưỡng rising cho falling |
| TLV6700 | Logic OUTA/OUTB | OUTA thấp khi INA+ dưới ngưỡng | OUTA thấp khi INA+ < VIT−. OUTB thấp khi INB− > VIT+ | §5 Pin Functions | Có |
| TMUX1511 | IDD | ≤70 µA | 37 typ / 70 max µA | SCDS390B §5.5 | Có |
| TMUX1511 | SEL pull-down | 6 MΩ | 6 MΩ nội, mỗi SELx | §4 | Có |
| TMUX1511 | RON | 4,5 Ω max | 2 typ / 4,5 max Ω | §5.5 | Có |
| TMUX1511 | IPOFF | không dùng | ±2 µA max @VDD = 0, VS ≤ 3,6 V | §5.5 | DeepSeek bỏ qua |
| ESP32 | C lấy mẫu ADC1 | 10 pF giả định [CẦN TRA] | Không công bố. Bảng 4-3 đo với tụ ngoài 100 nF | v5.3 Table 4-3 | [CHƯA XÁC MINH] |
| MCP73833 | ISINK STAT/PG | ≤25 mA | 15 typ / 25 max mA | DS20002005C bảng DC | Có |
| MCP73833 | VOL STAT | ≤0,4 V @4 mA | 0,4 typ / **1 V max** @4 mA | bảng DC | **Không** |
| MCP73833 | ITHERM | 47–53 µA | 47/50/53 µA | bảng DC | Có |
| MCP73833 | VT1 / VT2 | 1,20–1,26 / 0,235–0,265 V | 1,20/1,23/1,26; 0,235/0,25/0,265 V | bảng DC | Có |
| MCP73833 | ISS khi sạc | 0,5 mA | 2 typ / **3 mA max** | bảng DC | **Không** |
| MCP73833 | CBAT | 4,7 µF | ≥1 µF (<250 mA), ≥4,7 µF (>250 mA) | §5.1.4.1, §6.1.1.3 | Có |
| MCP73833 | System test (LDO) mode | không đề cập | THERM > VDD − 100 mV khi không có pin. ITHERM tắt ở standby, có dòng kéo xuống 3–20 µA | §5.1.4.1 | Thiếu |
| MCP73833 | IREG | 1000/RPROG ±10 % | Eq 5-1. 90–110 mA @10k, 900–1100 mA @1k | bảng DC | Có |
| 103AT-2 | R(0 °C) | 28,7 kΩ (từ B3435) | 27,28 kΩ (theo BQ25886 SLUSD88A §8.3.7.4) | SLUSD88A | **Không** (+5,2 %) |
| 103AT-2 | R(45 °C), dung sai B, R25 | 4,85 kΩ; [CẦN TRA] | Không tra được bảng Semitec | — | [CHƯA XÁC MINH] |
| BQ25886 | KICHGSET | ICHG = R/3810 | ICHG = RICHGSET/KICHGSET, 3810 Ω/A. Dải 114 Ω (30 mA) – 8 kΩ (2,2 A) | SLUSD88A §6.5, Pin Functions | Có |
| BQ25886 | ICHG_ACC @500 mA | ±15 % | ±15 % (VBAT 6,2/7,6 V, TJ 0–85 °C) | §6.5 | Có |
| BQ25886 | Ngưỡng TS | 73,25 %/44,75 % là cửa sổ sạc | VT1 73,25 % (0 °C, **dừng**), VT2 68,25 % (10 °C, ICHG 20 %), VT3 44,75 % (45 °C, **VREG 8,0 V, vẫn sạc**), VT5 34,375 % (60 °C, **dừng**) | §6.5, §8.3.7.4 | **Không**: VT3 không phải ngưỡng dừng |
| BQ25886 | CE | pull-up 100k lên REGN | Active-low, pull-down nội 900 kΩ. VIH 1,3 V, VIL 0,4 V. Abs max 6 V | Pin Functions, §6.5 | Có |
| BQ25886 | REGN | 5 V | 4,7/4,8/5,15 V @VBUS 5 V | §6.5 | Gần đúng |
| TUSB320LAI | OUT1 khi 1,5 A/3 A | thấp | Table 3: OUT1 = L cho Medium và High | SLLSEQ8D §7.4 Table 3 | Có |
| TUSB320LAI | Abs max OUT1 | không đề cập | −0,3 đến **VDD + 0,3 V** | §6.1 | **Thiếu** (pull-up lên REGN vượt) |
| TUSB320LAI | VDD khi DFP báo 3 A | không đề cập | **VDD ≥ 3,5 V** | §7.2 | **Thiếu** (LDO 3,3 V không đạt) |
| TPS54302 | VFB | 0,596 V | 0,581/0,596/0,611 V | SLVSDG6C §6.5 | Danh nghĩa khớp. **Dải VOUT của DeepSeek sai** |
| TPS54302 | EN rising/falling | không dùng | 1,23 typ / 1,28 max; 1,1 / 1,16 V. Ip 0,7 µA, Ih 1,55 µA | §6.5, §6.3.4 | Thiếu |
| TPS54302 | EN abs max / khuyến nghị | 7 V / 5,5 V | 7 V abs; 5,5 V khuyến nghị | §6.1, §6.3 | Có |
| TPS54302 | fSW | 400 kHz | 290/400/510 kHz | §6.5 | Có (typ) |
| BZT52C5V6 | VZ, IR | [CẦN TRA IR] | VZ 5,2/5,6/6,0 V @5 mA. IR ≤ 1,0 µA @VR 2 V | DS18004 bảng điện | Đã tra |
| TPS63070 | VFB | 0,8 V | 800 mV. ±1 % PWM, −1/+3 % PFM. IFB 100 nA | SLVSC58B §6.5 | Có (dung sai DeepSeek hơi hẹp) |
| TPS63070 | Negative current limit | [CẦN TRA] | Dòng âm trung bình vào IN 1100 / 1800 mA (VIN 5 V, VOUT 6,5 V, TJ 0–125 °C) | §6.5 | Đã tra |
| TPS63070 | PS/SYNC | thấp = forced PWM | Thấp = forced PWM; cao = power save | §8.4.5 | Có |
| DRV8833 | nSLEEP VIH | 2,0 V | **2,5 V** (2,0 V là các chân khác). VIL 0,5 V. Pull-down 500 kΩ | SLVSAR1E §6.5 | **Không** |
| DRV8833 | xISEN abs max | ±0,5 V | −0,3 đến 0,5 V | §6.1 | Một phần (đáy −0,3 V) |
| DRV8833 | VTRIP, tBLANK | — | 160/200/240 mV; 3,75 µs | §6.5 | — |
| DRV8833 | IOCP, tDEG | không dùng | 2 min / 3,3 max A; 4 µs | §6.5 | **Bỏ qua** khi kết luận ISEN an toàn |
| TPS7A20 | Dòng định mức | 200 mA | 300 mA | SBVS338H | **Không** |
| TPS7A20 | VDO | 130 mV @200 mA | 140 mV max (DQN), 145 mV max (DBV) @300 mA, VOUT 2,5–5,5 V | §5.5 | **Không** (không có dòng 130 mV) |
| TPS7A20 | IQ | 6,5 µA | 6,5 typ, 10 µA max (−40–85 °C) | §5.5 | Có |
| TPS7A20 | Độ chính xác VOUT (DBV, ≥2,8 V) | — | ±1,5 % với VIN ≥ VOUT + 0,3 V | §5.5 | — |
| TPS7A20 | Dòng ngược | [CẦN TRA] | Giới hạn ≤ 5 % dòng định mức trong thời gian ngắn | §6.3.7 | Đã tra |
| TPS7A20 | Biến thể 3,6 V | — | TPS7A2036PDBVR có trong Package Option Addendum | Addendum | — |
| SN74LVC8T245 | DIR | thấp = A→B | **DIR H = A→B**, DIR L = B→A, OE H = cách ly | SCES584D Table 7-1 | **Không** |
| SN74LVC8T245 | Miền DIR/OE | OE pull-up lên VCCB | DIR và OE cấp từ **VCCA**. Giữ OE cao tới khi cả hai VCC lên | Features, §9 | **Không** |
| TCA9517A | EN | active-high, pull-down 100k | Active-high, **pull-up nội lên VCCB** (giá trị không công bố) | SCPS245E §7.3.2 | Một phần |
| 74LVC1G08 | VIH / VIL @VCC 3–3,6 V | — | 2,0 V / 0,8 V | SCES217 §6.3 | — |
| DMP3098L | VDS, ID, VGS(th) | [CẦN TRA SOA] | −30 V, −3,8 A, VGS(th) −1,0 đến −2,1 V. SOA chỉ có hình (Fig. 9) | DS31447 Rev 8 | SOA dạng hình, chưa số hóa |
| MAX98357A | SD_MODE shutdown | thấp = shutdown | Trip B0 0,08/0,16/0,355 V; pull-down nội RPD 92/100/108 kΩ | 19-6779 Rev 16, EC + "SD_MODE and Shutdown Operation" | Có. Pull-down ngoài 100k thừa và làm sai RSMALL/RLARGE |
| MAX98357A | GAIN_SLOT | GAIN = GND | GND → 11,4/12/12,6 dB; hở → 9 dB; VDD → 6 dB; 100k xuống GND → 15 dB; 100k lên VDD → 3 dB | 19-6779 Rev 16, EC | Có |
| MAX98357A | Chọn kênh | — | RSMALL = 94,0·VDDIO − 100 kΩ; RLARGE = 222,2·VDDIO − 100 kΩ; VDD ≥ VDDIO hoặc ~2 kΩ nối tiếp | Table 5–6 | — |
| TLV6700 | Khả thi R-2 với 6,40–6,60 V (founder 06/11) | PASS | VIT− max/min 1,0336 > cửa sổ 1,0312 | SNVSAV2B §6.5 | **FAIL** |
| SMAJ8.0A | VC | 13,6 V | — | — | [CHƯA XÁC MINH] lần này, dùng giá trị "Đã chốt" |
| IPC-2221 | k, b, c | 0,048/0,024, 0,44, 0,725 | — | — | [CHƯA XÁC MINH] |

## Câu có dạng chỉ dẫn trong deepseek-answer.md

Tôi đã rà toàn bộ file. Không có câu nào yêu cầu người đọc hay AI thực hiện hành động ngoài phạm vi. Các dòng "Box08 cần kiểm" là đề xuất cho review, nên được ghi nhận như dữ liệu.

## Bổ sung 07/11/2026 (thiết kế chốt)

| IC | Thông số | Datasheet | Rev / mục | Dùng cho |
|---|---|---|---|---|
| TLV6710 | VIT−(INA) / VIT+(INA) | 397/400/403 mV; 400/405,5/413 mV | SNVSAV4B §7.5 | UVLO robot R-2 |
| TLV6710 | VIT+(INB) / VIT−(INB) | 397/400/403 mV; 387/394,5/400 mV. OUTB thấp khi INB > VIT+ | SNVSAV4B §7.5, Pin Functions | Detector H-4 |
| TLV6710 | IIN; abs max INA/INB; VDD | ±25 nA @6,5 V; −0,3 đến 7 V; 1,8–36 V | SNVSAV4B §7.1, §7.5 | Detector robot (R_sd giữ < 7 V) |
| TPS3808 | tD khi CT hở | 12/20/28 ms | SBVS050N §6.6 | H-3 |
| CSD13381F4 | VDS, VGS max, VGS(th), RDS(on) @1,8 V, IDSS | 12 V; 8 V; 0,65/0,85/1,10 V; 310/400 mΩ; 100 nA | SLPS448F | Hysteresis H-3, R-2; Q2 CE |
| CSD23381F4 | VDS, VGS max, RDS(on) @−2,5 V | −12 V; −8 V; 250 mΩ typ | SLPS450G | Q3 CE |
| TPS25947 | OVLO | "Do not leave floating"; dùng được làm active-low enable | SLVSFC9C Table 5-1 | H-2 (nối GND) |
| TPS25947 | EN/UVLO abs max / khuyến nghị | 6,5 V / 5 V | SLVSFC9C §6.1, §6.3 | LOAD_EN trực tiếp |
| TPS25947 | dVdT | CdVdt (pF) = 2000 / SR (V/ms); hở = nhanh nhất | SLVSFC9C Eq 4 | 2,2 nF |
| TPS61023 | EN abs max | 7 V | SLVSF14B §6.1 | LOAD_EN |
| TMUX1511 | SEL VIH / VIL | 1,2 V / 0,45 V | SCDS390B §5.5 | SEL từ LOAD_EN |
| TPS63070 | VOUT abs max; tụ VOUT; L | 12 V; 15/47/470 µF; 0,7/1,5/2,8 µH | SLVSC58B §6.1, §6.3 | R-4, R-7 |
| TPS63070 | BOM mẫu | XFL4020-152ME; CIN 2×10 µF/25 V; COUT 3×22 µF/16 V | SLVSC58B Table 2 | BOM |
| BQ25886 | Tụ, BTST, L | VBUS ≥ 1 µF; VBUS+PMID ≥ 10 µF sau derating; SYS 2×22 µF sau derating; BAT ≥ 10 µF; BTST 47 nF; REGN 4,7 µF; L 1 µH trong điều kiện đo | SLUSD88A Pin Functions, §7 | BOM |
| TPS54302 | BOOT | 0,1 µF | SLVSDG6C §7.2.3.2 | BOM |
| DMN2075U-7 | BVDSS, VGSS, VGS(th), IDSS, RDS(on) | 20 V; ±8 V; 0,4–1,0 V; ≤ 100 nA @16 V; ≤ 45 mΩ @2,5 V | Diodes DS31837 Rev 7 | Q1, Q2, Q4 (thay CSD13381F4) |
| DMG2305UX-7 | BVDSS, VGSS, VGS(th), RDS(on) | −20 V; ±8 V; −0,5…−0,9 V; ≤ 100 mΩ @−2,5 V | Diodes DS36196 Rev 8 | Q3 |
| SN74LVC2T45 | DIR | L = B→A, H = A→B | SCES516N Table 7-1 | U12, U13 DIR→GND |
| TUSB320LAI | VBUS_DET, EN_N | VBUS_DET qua 900 kΩ lên VBUS, abs max 4 V; EN_N active-low, pull-up nội | SLLSEQ8D Pin Functions, §6.1 | R53 910 kΩ, EN_N→GND |
| TPS63070 | VSEL, VAUX | VSEL cao kéo FB2 xuống; VAUX 100 nF | SLVSC58B Pin Functions, §6.3 | VSEL→GND |
| Mã đặt hàng | — | TLV6710DDCR, TMUX1511PWR, TPS259474LRPWR, TPS3808G01DBVR, SN74LVC2T45DCUR có trong Package Option Addendum | các datasheet trên | BOM |

## Bổ sung 07/11/2026 (delta review)

| IC / tài liệu | Thông số | Giá trị | Nguồn | Dùng cho |
|---|---|---|---|---|
| Semitec AT thermistor 103AT | Bảng R‑T | 0 °C 27,28 kΩ; 40 °C 5,827 kΩ; 45 °C 4,911 kΩ; 60 °C 3,020 kΩ; R25 10,0 kΩ ±1 %; B 3435 K ±1 % | PDF hãng do static.chipdip.ru lưu (DOC021891763). Khớp hai điểm TI SLUSD88A | H-7, R-1 |
| DMN2075U-7 | Ciss | 594,3 pF typ (không có max) | DS31837 Rev 7 | Timing latch, guard ×2 |
| DMG2305UX-7 | Ciss | 808 pF typ (không có max) | DS36196 Rev 8 | Q6 nhả 81 µs typ |
| TPS25947 | PGTH | rising 1,183/1,20/1,223 V; falling 1,076/1,09/1,116 V; rò −0,1/0,3 µA | SLVSFC9C §6.5 | PG U6/U16 |
| TPS25947 | PG khi chưa cấp nguồn | Vẫn thấp khi có pull-up yếu (26 µA) / mạnh (242 µA) | SLVSFC9C §6.5 | PG-timeout |
| TPS25947 | tD,ON / tD,OFF | 0,09/0,6/0,97 ms @2,7 V; tD,OFF 64,44 µs @2,7 V (một giá trị) | SLVSFC9C §6.6 | Không dùng làm cận an toàn nữa |
| TPS25947 | RCB | VREVTH −36,45…−22,3 mV; tRCB 1 µs; rò ngược khi không cấp nguồn 4,86 µA | SLVSFC9C §6.5–6.6 | U6, U9, U16, U17 |
| TLV6710 | VOL | ≤ 250 mV @3 mA (VDD 1,8 V), @5 mA (VDD 5 V); tpd(HL) 9,9 µs typ | SNVSAV4B §7.5–7.6 | Detector |
| TS3USB221 | OE, VCC, IOFF | OE H = ngắt; VCC 2,3–3,6 V; IOFF ±2 µA @VCC 0, VI/O 0–3,6 V; I/O chịu 5,5 V | SCDS220M Table 7-1, §5 | U13, U21 |
| MCP73833 | Timer và termination | Hết timer trong CC → Timer Fault (STAT1/STAT2 Hi-Z). Hết timer trong CV hoặc dòng giảm → kết thúc (§4.6), báo Charge Complete | DS20002005C §4.4.1, §4.6, Table 5-1 | H3 |
| CP2102 | VBUS pin, D+ pull-up | VBUS là ngõ vào sense, 5 V cho biết có kết nối USB; pull-up D+ 1,425–1,575 kΩ | Trích qua tìm kiếm từ datasheet Rev 1.8 và một bản mirror bên thứ ba. silabs.com trả HTML 3 lần → **[CHƯA XÁC MINH bản đầy đủ]** | Trường hợp switch data dính ON |
