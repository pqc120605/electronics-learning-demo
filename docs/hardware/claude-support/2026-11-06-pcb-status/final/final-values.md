# MoBot V2 r7 · Đối chiếu Codex, Claude r6, DeepSeek và giá trị chốt (06/11/2026)

> **Trạng thái 07/11/2026.** Bảng tổng bên dưới là kết quả đối chiếu ban đầu (06/11). Thiết kế đã chốt và các sửa đổi sau review nằm ở [final-bom.md](final-bom.md), [kicad-input-spec-r7.md](kicad-input-spec-r7.md), [thiet-ke-va-y-do.md](thiet-ke-va-y-do.md) và [delta-handset-2026-11-07.md](delta-handset-2026-11-07.md). NTC dùng bảng R‑T Semitec từ 07/11. Output script ở cuối file là lần chạy mới nhất.

Đây là kết quả đối chiếu chỉ đọc. Không file KiCad, file Codex hay file đầu vào nào bị sửa. Nguồn tin cậy theo thứ tự: datasheet hãng > script `calc_r7.py` > Codex box08 > Claude r6 > DeepSeek. Bảng thông số đã tra nằm trong [datasheet-checks.md](datasheet-checks.md). Output thật của script được dán ở cuối file.

Các mục trong "Đã chốt" được giữ nguyên: H3 (MCP73833-FCI/MF, 2,49 kΩ), R1 (0,62 Ω ±1 %), R5 (chỉ sạc ở 1,5 A/3 A, RILIM 1,24 kΩ, ICHG 0,50 A). r7 vẫn chờ duyệt hash và chưa có lease.

Không mục nào được gắn **CHỐT**. Mỗi mục đều còn phụ thuộc bench, dữ liệu NCC hoặc một thông số chưa tra được.

## Bảng tổng

| ID | Codex | Claude r6 | DeepSeek | Tính lại (script) | Giá trị chốt | Nhãn | Bằng chứng |
|---|---|---|---|---|---|---|---|
| H-1 | TPS61023 giữ, EN LOW ≤ 0,35 V, FB TBD | FB/L TBD | 732k/100k, 4,742–5,165 V, 1 µH, 10 µF + 2×22 µF | VOUT 4,742/4,950/5,165 V; IL đỉnh 2,16 A ở L −30 % | 732k/100k ±1 %, 1,0 µH Isat ≥ 4,5 A, CIN 10 µF, COUT 2×22 µF 10 V X7R | CHỐT CÓ ĐIỀU KIỆN | SLVSF14B §6.5, §8.2 |
| H-2 | TPS259474A ứng viên; L nếu thiếu cận retry | (LM66100, đã bị bác) | 267k/187k, 4,22k → 0,711–0,869 A, 1 nF, đổi sang L | V_EN 1,276–1,444 V; ILIM **0,660–0,918 A**; tITIMER 0,46–1,60 ms | 267k/187k, 4,22 kΩ, 1,0 nF; A→L là đề xuất | BÁC | SLVSFC9C §6.5, Eq 5–6 |
| H-3 | 3,266–3,417 V (8,25 ±0,2 %, Thevenin ≤ 10 kΩ); re-arm ≥ 3,50 V TBD | TLV6700 680k/97,6k (đã bị bác) | 715k/(97,6k+1k) ±1 %, R_H 1,1 MΩ, CT 3,9 nF | ±1 %: **3,200**–3,487 V; ±0,1 %: 3,251–3,433 V; nếu RESET có pull-up: **2,19–2,31 V** | Chưa chốt. Cần điện trở 0,1 % và cấu trúc hysteresis mới | BÁC | SBVS050N §6.5, §7.3.2 |
| H-4 | Ngưỡng TBD; cần veto độc lập khi đứt sense | Q_PROG/Q_CHG TBD | TLV6703 100k/9,53k, 4,50–4,62 V, "fail-off" | detect 4,469–4,729 V; deassert 4,367–4,682 V; đứt sense → **cho phép bật** | Chưa chốt. Detector một tầng không đạt yêu cầu đứt sense | BÁC | SBOS865B §7.5, Table 2 |
| H-5 | 2× TMUX1511, active-high, pull-down 6 MΩ | Một miền I/O, không mux | EN = PACK_OK·EN_CMD·NOR(...), 10k, ~143 µA | IDD + SEL ≤ 143 µA; IPOFF ≤ 10 µA | 2× TMUX1511, 10 kΩ, 100 kΩ pull-down EN, 3 SEL dư nối GND | CHỐT CÓ ĐIỀU KIỆN | SCDS390B §4, §5.5 |
| H-6 | 9,01 τ; thời gian tuyệt đối TBD | 9,01 τ | 2,505 kΩ, 226 ns, chờ 5 µs | 226 ns @10 pF; 2,26 µs @100 pF | Không chốt được vì thiếu C lấy mẫu | CHƯA XÁC MINH | ESP32 v5.3 Table 4-3 |
| H-7 | PG pull-up về input charger; NTC hở/ngắn, pack vắng, LDO test mode còn mở | VT1/VT2 → 24,6k/5,0k; thiếu bảng NTC | 4,7/4,7 µF, 680 Ω, NTC trực tiếp, R(0 °C) 28,7k | Cắt lạnh 0,4–4,3 °C; cắt nóng 40,8–47,9 °C; R(0 °C) theo TI 27,28k | 4,7 µF / 4,7 µF / 680 Ω giữ được. Cửa sổ NTC chưa chốt | CHƯA XÁC MINH | DS20002005C; SLUSD88A §8.3.7.4 |
| H-8 | TBD (LED, inrush, bias) | 0,445 A (IREG + ISS) | 0,458 A, biên 42 mA | Cực xấu **0,465 A**, biên 35 mA | ≤ 0,465 A steady-state; inrush 4,7 µF (24,7 µC) | CHỐT CÓ ĐIỀU KIỆN | DS20002005C bảng DC, Eq 5-1 |
| R-1 | 7,68k sai (~2 A), ~1,91k danh nghĩa; CE pull-down nội | 7,68k (sai công thức) | 1,91k; TS 5,11k/26,7k "0,3–44,7 °C"; CE 100k lên REGN | ICHG 0,422/0,501/0,582 A; TS DeepSeek dừng ở **−3,7…0,2 °C và 59,3…61,7 °C**; CE 4,23–4,63 V > OUT1 abs max 3,6 V | RICHGSET 1,91 kΩ. TS và CE phải thiết kế lại | BÁC | SLUSD88A §6.5, §8.3.7.4; SLLSEQ8D §6.1 |
| R-2 | TLV6700 OUTB bị đảo cực | 1,5M/97,6k 6,548 V trên OUTB | OUTA, 1,4887M/97,6k 0,1 %, R_H2 2 MΩ, 6,42–6,59 V | V_fall dùng VIT−: **6,241–6,551 V**. Cửa sổ founder 6,40–6,60 V (±1,55 %) hẹp hơn dải VIT− của TLV6700 (−1,90/+1,39 %) | **FAIL với TLV6700**. Cần IC có ngưỡng falling ≤ ±0,73 %, tỉ số chia 16,475 | BÁC | SNVSAV2B §5, §6.5; founder 06/11 |
| R-3 | Không kéo EN thẳng lên 8,4 V | TBD | 750k/100k → 4,96–5,17 V; EN 383k/100k + BZT52C5V6 | VOUT **4,852–5,286 V**; V_EN 1,28–1,82 V | FB 100k/13,3k (ví dụ TI) hoặc 750k/100k, 10 µH; mạng EN chưa chốt vì xung đột với R-2/R-5 | BÁC | SLVSDG6C §6.3.4, §6.3.8, §6.5 |
| R-4 | PS/SYNC thấp = forced PWM; chưa chứng minh cách ly dòng ngược | PFM (PS/SYNC cao) | 649k/100k, 1,5 µH, forced PWM | PWM 5,766–6,223 V; PFM tới 6,345 V; dòng âm 1,1/1,8 A | 649k/100k, 1,5 µH. Chế độ PS/SYNC chờ quyết định | CẦN FOUNDER | SLVSC58B §6.5, §8.4.5 |
| R-5 | Review MOTOR_EN/nSLEEP | AND + pull-down nSLEEP | 74LVC1G08, 100k ×3, "VIH 2,0 V" | LOGIC_EN (nút EN TPS54302) chỉ **1,22–1,77 V**, dưới VIH 2,0 V của LVC; nSLEEP VIH 2,5 V | Chưa chốt. Cần tín hiệu LOGIC_EN dạng số | BÁC | SLVSAR1E §6.5; SCES217 |
| R-6 | Kiểm ISEN abs max riêng | Đã cảnh báo 1,24 V @2 A | 1k/10 nF, "max 0,29 V" | Ngắn mạch trước OCP: **1,25–2,07 V** > 0,5 V | RC 1k/10 nF dùng được cho ADC; ISEN pin chưa được bảo vệ | BÁC | SLVSAR1E §6.1, §6.5 |
| R-7 | 2,03 mJ là mô hình; SMAJ 13,6 V không đủ | 220 µF → ≤ 7,5 V; SMAJ + PFM | 220 µF, kẹp 8,2 V chủ động, 22 Ω "5 W 2512" | 220 µF: 7,38–7,61 V (V0 6,00–6,29 V); 100 µF: tới 8,95 V | Bulk ≥ 220 µF hiệu dụng, 16 V low-ESR. Kẹp chủ động là đề xuất | CHỐT CÓ ĐIỀU KIỆN | Tính năng lượng; DS31447 |
| R-8 | — | LDO TBD | TPS7A2033, 3,3 V | 3,3 V −1,5 % = 3,25 V < **3,5 V** TUSB320 cần khi nguồn 3 A | TPS7A2036PDBVR (3,6 V) là đề xuất | BÁC | SLLSEQ8D §7.2; SBVS338H §5.5 |
| R-9 | Review DIR/OE và miền pull-up | A→B; OE/DIR TBD | DIR pull-down = "A→B", OE pull-up lên VCCB | DIR L = **B→A**; DIR/OE thuộc miền VCCA | DIR nối VCCA, OE pull-up 100k lên VCCA; TCA9517A EN pull-down; MAX98357A dùng pull-down nội SD_MODE (không thêm 100k), GAIN_SLOT = GND → 12 dB | BÁC | SCES584D Table 7-1; MAX98357A 19-6779 Rev 16 |
| R-10 | 0,386/1,005; 1,063/2,765 mm (sàng lọc) | Như Codex | Như Codex, VM/V5 0,301/0,780 mm | 0,386/1,005; 1,063/2,765; 0,300/0,781 mm | Không chốt được vì chưa có hằng số IPC gốc và stackup | CHƯA XÁC MINH | IPC-2221 (chưa tra) |

Tổng: CHỐT 0 · CHỐT CÓ ĐIỀU KIỆN 4 · BÁC 10 · CẦN FOUNDER 1 · CHƯA XÁC MINH 3.

Cập nhật 06/11/2026: founder giữ ngưỡng UVLO robot falling 6,40–6,60 V tại pack. R-2 chuyển từ CẦN FOUNDER sang BÁC (FAIL với TLV6700). User cung cấp datasheet MAX98357A (19-6779 Rev 16), nên phần MAX98357A của R-9 đã được xác minh.

---

## H-1 · TPS61023 · CHỐT CÓ ĐIỀU KIỆN

- Công thức: VOUT = VREF·(1 + R1/R2) (Eq 4). IL_DC = VOUT·IOUT/(VIN·η) (Eq 5). ΔIL = VIN·D/(L·fSW), với D = 1 − VIN·η/VOUT (Eq 2, 6). Đỉnh = IL_DC + ΔIL/2.
- Đầu vào: VREF 580/595/610 mV (SLVSF14B §6.5). ILIM valley 2,7 A min tại 3,6 V. fSW 1,0 MHz typ. L −30 % theo §8.2.2.2. VIN 3,0 V, η 0,8, IOUT 0,5 A.
- Kết quả: VOUT 4,742/4,950/5,165 V. Ở 3,0 V và L 0,7 µH, đỉnh cuộn cảm 2,16 A. Dòng đáy âm, nghĩa là chạy gần biên DCM.
- Nguồn sai: DeepSeek tính ΔIL 1,20 App và đỉnh 1,64 A. Họ bỏ η trong D và bỏ L −30 %, nên thấp hơn khoảng 24 %. DeepSeek cũng viết VOUT "nằm trong 4,75–5,25 V". Điều này sai ở góc min 4,742 V, lệch 8 mV. So valley-limit với dòng đỉnh là bảo thủ, nên kết luận PASS vẫn đứng.
- Điều kiện còn lại: đo V5 tại chân DevKit, sau eFuse, khi Wi‑Fi TX ở pack 3,0–3,2 V (BT-H2). Kiểm Isat của L ≥ 4,5 A trên MPN thật.

## H-2 · TPS259474 · BÁC

- Công thức: V_EN = Vlogic·R2/(R1 + R2). RILM = 3334/ILIM (Eq 5). tITIMER = ΔVITIMER·C/IITIMER (Eq 6).
- Đầu vào: VUVLO(R) 1,183–1,223 V. VUVLO(F) 1,076–1,116 V. VSD(F) 0,45–0,74 V. Bảng ILIM: 6,65k → 0,425/0,500/0,575 A; 3,32k → 0,850/1,007/1,150 A. ΔV 1,286–1,741 V, I 1,2–2,5 µA. tRST chỉ có typ 110 ms.
- Kết quả: V_EN cao 1,276–1,444 V, vượt 1,223 V (biên 53 mV). V_EN thấp 0,167 V. ILIM **0,660/0,790/0,918 A**. tITIMER 0,46/0,84/1,60 ms với tụ ±10 %.
- Nguồn sai: DeepSeek ghi ILIM ±10 % (0,711–0,869 A). Bảng hãng cho thấy khoảng ±15 % (sai thông số). Lệch 7 % ở góc min.
- ĐỀ XUẤT THAY ĐỔI: DeepSeek đổi TPS259474**A** sang TPS259474**L** (latch-off). Hướng này hợp lý vì datasheet không có cận min cho tRST. Box08 phải duyệt. Không tự chốt.
- Điều kiện: chân OVLO của TPS259474x phải được xử lý (nối GND nếu không dùng). DeepSeek không đề cập. ILIM min 0,66 A lớn hơn ngân sách 0,5 A. Đo dòng đỉnh DevKit để chắc không trip nhầm (BT-H2).

## H-3 · TPS3808G01 · BÁC

- Công thức: V_fall = (VIT ± ISENSE·Rth)/k. V_rise khi RESET thấp: R_H song song R_bot. tD = CT/175 + 0,5 ms.
- Đầu vào: VIT 0,405 V ±2 %. ISENSE ±25 nA. VHYS nội 1,5 % typ (lấy 0 cho cận dưới). CT 180 nF → 0,62–1,44 s.
- Kết quả:
  - Điện trở ±1 % (như DeepSeek): V_fall **3,200**–3,487 V. Biên 0,3 mV tới 3,20 V.
  - Điện trở ±0,1 %: 3,251–3,433 V. Biên 51 mV. Thevenin 86,7 kΩ góp ±18 mV.
  - Nếu RESET có pull-up 100k lên VPACK: R_H đẩy dòng vào SENSE. V_fall tụt còn **2,19–2,31 V**.
  - V_rise khi RESET thấp, điện trở 0,1 %: 3,524–3,686 V. Đạt ≥ 3,50 V.
  - tD 12–35 ms.
- Nguồn sai: DeepSeek giữ 3,266–3,417 V nhưng chỉ định điện trở ±1 %. Dải đó cần hệ số 8,25 ±0,2 % đã chốt, tức điện trở cỡ 0,1 % (sai giả định). DeepSeek bỏ ISENSE. DeepSeek coi V_fall không đổi khi thêm R_H. Điều này chỉ đúng nếu RESET hoàn toàn high-Z, nhưng RESET phải kéo lên để lái EN (sai công thức). tD thiếu 0,5 ms và dung sai.
- Codex: dải 3,266–3,417 V đúng với 8,25 ±0,2 %. Codex giả định Thevenin ≤ 10 kΩ, mạng 715k/98,6k vi phạm giả định này.
- Giá trị đúng: điện trở 0,1 %, Thevenin ≤ 10 kΩ để sai số ISENSE ≤ 2 mV quy về pack (dòng chia áp ~45 µA từ pack). Hysteresis phải chỉ có tác dụng khi RESET thấp, ví dụ đệm RESET bằng một tầng riêng. Box02 cần giải lại cả mạng.

## H-4 · Detector raw VBUS · BÁC

- Công thức: V = VIT·(R1 + R2)/R2. Mức ra = VBUS·240/(100 + 100 + 240).
- Đầu vào: TLV6703 (SBOS865B) VIT+ 396–404 mV, VIT− 387–400 mV. OUT sink khi SENSE < VIT−.
- Kết quả: detect 4,469/4,597/4,729 V. Deassert 4,367/4,534/4,682 V (chưa tính R_H4). Mức ra cao 2,40–3,00 V, đạt VIH 2,0 V.
- Nguồn sai:
  - DeepSeek trích TLV6703 bằng mã SNVSAV2B của TLV6700 và gọi chân OUTA. TLV6703 chỉ có SENSE/OUT (sai thông số).
  - Detect danh nghĩa 4,56 V sai. Đúng là 4,597 V (sai số học).
  - Deassert dùng VIT+ thay vì VIT−.
  - Quan trọng nhất: khi đứt dây sense, R_D2 kéo SENSE về 0 và OUT thấp, tức hệ thống hiểu là "không có VBUS". Qua NOR ở H-5, quyền bật lại được cấp, nên mạch **fail-ON**, không phải fail-off như DeepSeek viết. Ma trận Codex yêu cầu veto độc lập khi đứt sense, và mục này chưa đạt.
- Điều kiện: box02 thiết kế lại theo ma trận Codex. Cần giám sát toàn vẹn dây sense, veto độc lập đặt sau pass trước D1, và đường VBUS pass mặc định hở.

## H-5 · Logic EN 2× TMUX1511 · CHỐT CÓ ĐIỀU KIỆN

- Công thức: EN_SW = PACK_OK·EN_CMD·NOR(VBUS_MICRO_OK, VBUS_C_OK, USB_RAIL_PG). Dòng tĩnh = 2·IDD + 5·V/6 MΩ.
- Đầu vào: IDD 37/70 µA. Pull-down SEL 6 MΩ. IPOFF ±2 µA ở VDD 0. RON 4,5 Ω max. 74LVC1G27/1G11 (SCES488E/SCES487I).
- Kết quả: 74/77/143 µA. Rò I/O sang miền tắt ≤ 10 µA.
- Nguồn sai: DeepSeek cộng "2×60 µA detector" mà không có nguồn. TLV6703 có IDD vài µA. DeepSeek không tính IPOFF. Lệch nhỏ, không đổi kết luận.
- Điều kiện: logic chỉ đúng khi detector H-4 không fail-ON. Đo xung SEL khi 3V3_DEV ramp và khi MCU reset (BT-H4). Mỗi TMUX1511 có 4 SEL, nên 3 SEL dư phải nối GND.

## H-6 · ADC1 · CHƯA XÁC MINH

- Công thức: t = ln(2¹³)·(R_wiper/4 + RON)·C_eff = 9,011·τ.
- Kết quả: 226 ns ở 10 pF, 2,26 µs ở 100 pF.
- Thiếu: ESP32 Datasheet v5.3 không công bố điện dung lấy mẫu ADC1. Bảng 4-3 đo INL/DNL với tụ ngoài 100 nF. Với tụ 100 nF, tụ giữ áp cho mẫu nên chờ 5 µs đủ khi đổi kênh. Bước toàn dải lại cần khoảng 2,3 ms.
- Nguồn sai: DeepSeek đề xuất 100 pF, khác điều kiện đo của Espressif. Phần còn lại khớp với Codex/Claude r6.

## H-7 · MCP73833 · CHƯA XÁC MINH

- Công thức: I_LED = (VIN − VF − VOL)/R. R_NTC tại ngưỡng = VT/ITHERM.
- Đầu vào: ISINK ≤ 25 mA. VOL 0,4 typ / 1 V max @4 mA. ITHERM 47–53 µA. VT1 1,20–1,26 V. VT2 0,235–0,265 V. CBAT ≥ 4,7 µF (>250 mA). Điểm 103AT do TI công bố: 27,28 kΩ @0 °C, 3,02 kΩ @60 °C.
- Kết quả: LED 2,3–5,1 mA với VF 1,8–2,2 V giả định. R cắt lạnh 22,64–26,81 kΩ, tương ứng 0,4–4,3 °C. R cắt nóng 4,43–5,64 kΩ, tương ứng 40,8–47,9 °C. Nhiệt độ được ngoại suy beta, chưa có bảng Semitec.
- Nguồn sai: DeepSeek dùng B3435 cho 0 °C ra 28,7 kΩ, cao hơn điểm TI 5,2 % (dùng B25/85 ngoài dải). DeepSeek ghi VOL ≤ 0,4 V, nhưng max thật là 1 V.
- Về "NTC hở → ngắt": khi có pack, THERM vượt VT1 và IC báo lỗi nhiệt, đúng. Khi vắng pack, ITHERM tắt và có dòng kéo xuống 3–20 µA (§5.1.4.1), nên THERM không tự lên VDD. Không được nối pull-up nào vào THERM, nếu không IC có thể vào LDO test mode.
- Thiếu: bảng R‑T Semitec và dung sai B/R25. Cũng thiếu dải nhiệt sạc của B15 (NCC). Không chốt cửa sổ NTC khi chưa có hai dữ liệu này.

## H-8 · Dòng USB-C tay cầm · CHỐT CÓ ĐIỀU KIỆN

- Công thức: I = IREG,max + ISS,max + I_LED + I_detector.
- Đầu vào: IREG = 1000/(2,49 kΩ × 0,99) × 1,10 = 0,4462 A. ISS 3 mA max. Khi sạc có 2 LED sáng (STAT1 + PG; STAT2 Hi-Z theo Table 5-1), tính cực xấu VF = 0, VOL = 0.
- Kết quả: **0,465 A**, biên 35 mA tới 500 mA. Inrush 4,7 µF tương ứng 24,7 µC.
- Nguồn sai: DeepSeek tính Iq 0,5 mA (đúng là ISS 3 mA), 3 LED, và cộng TUSB320 cùng LDO. Tay cầm chỉ dùng Rd, không có TUSB320. Tổng lệch dưới 2 %.
- Điều kiện: giới hạn inrush USB-IF chưa được tra. Đo dòng VBUS và inrush khi cắm (BT-H3).

## R-1 · BQ25886 · BÁC

- Công thức: ICHG = RICHGSET/3810 Ω/A. TS = REGN·(RT2‖RNTC)/(RT1 + RT2‖RNTC).
- Đầu vào: dải 114 Ω–8 kΩ. ICHG_ACC ±15 % @500 mA. VT1 73,25 % (dừng ở 0 °C). VT2 68,25 % (ICHG 20 %). VT3 44,75 % (VREG 8,0 V, vẫn sạc). VT5 34,375 % (dừng ở 60 °C). CE active-low, pull-down 900 kΩ. TUSB320 OUT1 abs max VDD + 0,3 V.
- Kết quả:
  - RICHGSET 1,91 kΩ cho ICHG 0,422/0,501/0,582 A. Giá trị 7,68 kΩ cho 2,016 A.
  - Mạng TS 5,11k/26,7k của DeepSeek dừng sạc ở −3,7…0,2 °C và 59,3…61,7 °C. Ở 45 °C, mạng này chỉ hạ VREG.
  - CE kéo lên REGN qua 100k đạt 4,23–4,63 V, vượt abs max của OUT1 (3,6 V khi VDD 3,3 V).
- Nguồn sai: DeepSeek coi VT3 là ngưỡng dừng nên cửa sổ không phải 0–45 °C (sai thông số). Mạng CE vi phạm abs max của TUSB320 (thiếu thông số).
- Phép giải để dừng ở 0/45 °C cho RT1 ≈ 9,09 kΩ, RT2 ≈ 324 kΩ. Kiểm lại phép giải bằng ví dụ TI: ra 5,24k/30,31k, khớp. Ứng viên này cho T1 −0,6…1,2 °C và T5 44,3…46,3 °C. Đổi lại T3 xuống 31,7…33,5 °C, nên trên ~32 °C pack chỉ nạp tới 8,0 V. Đây là đánh đổi cần founder chọn. R(45 °C) cũng chưa tra.
- CE: pull-up về V3V3_USB (2,93–3,19 V) giữ OUT1 trong abs max. Tuy vậy, khi LDO chưa lên, CE sẽ thấp, tức cho phép sạc. Box02 cần mạng giữ CE cao cho tới khi TUSB320 có nguồn.

## R-2 · UVLO robot · BÁC (FAIL với TLV6700 dưới quyết định founder)

- Công thức: V_fall = VIT−·(1 + Rt/Rb) + ISENSE·Rt. V_rise = VIT+·(1 + Rt/(Rb‖RH)).
- Kết quả: V_fall **6,241/6,412/6,551 V**. V_rise 6,716–6,883 V. Nếu OUTA bị kéo lên qua mạng EN 100k/47k, R_H2 làm V_fall tụt còn 5,33–5,51 V.
- Nguồn sai: DeepSeek dùng VIT+ (0,396–0,404 V) cho cạnh falling. Datasheet cho VIT− 0,387–0,400 V. Góc min vì vậy rơi dưới mục tiêu 6,40 V. DeepSeek cũng giả định V_fall không đổi khi có R_H2, giống lỗi ở H-3. Cực tính OUTA (thấp khi dưới ngưỡng) thì đúng.
- Founder chốt ngày 06/11/2026: giữ V_fall 6,40–6,60 V tại pack.
- FAIL với TLV6700: tỉ lệ cửa sổ 6,60/6,40 = 1,0312, còn VIT− max/min = 0,400/0,387 = 1,0336. Dải ngưỡng của IC rộng hơn cửa sổ, nên không đạt kể cả khi điện trở lý tưởng (`calc_r7.py`, hàm `r2_uvlo`).
- Yêu cầu tính được: với điện trở 0,1 % và ISENSE ±25 nA qua Thevenin ≤ 100 kΩ, ngưỡng falling của IC phải trong ±0,73 % trên 0–40 °C. Tỉ số chia danh nghĩa là 16,475 (ở VIT− typ). Hysteresis phải tách khỏi nút EN.
- ĐỀ XUẤT THAY ĐỔI cho box08: chọn comparator/supervisor có ngưỡng chính xác hơn. TLV6710 (0,75 %) do DeepSeek gợi ý chưa được tra datasheet, và 0,75 % vẫn sát giới hạn ±0,73 %. Phương án khác là dùng tham chiếu ≤ 0,5 % riêng. Không đổi cửa sổ founder.

## R-3 · TPS54302 · BÁC

- Công thức: VOUT = VFB·(1 + R2/R3). V_EN = VPACK·Rb/(Rt + Rb) + Ip·(Rt‖Rb).
- Đầu vào: VFB 0,581–0,611 V. EN rising 1,23 typ / 1,28 V max. Ip 0,7 µA, Ih 1,55 µA (chỉ typ). BZT52C5V6 VZ 5,2–6,0 V, IR ≤ 1 µA @2 V.
- Kết quả: VOUT 750k/100k = **4,852/5,066/5,286 V**. Với 100k/13,3k = 4,863/5,077/5,298 V. V_EN 1,278–1,318 V @6,0 V (có thể chưa bật); 1,36–1,40 V @6,4 V; 1,77–1,82 V @8,4 V. ΔIL 0,40–0,70 App với 10 µH.
- Nguồn sai: dải VOUT của DeepSeek (4,96–5,17 V) hẹp hơn dải ±2,5 % của VFB. Lệch 2,2 % ở góc max. TI khuyên điện trở trên khoảng 100 kΩ.
- Xung đột: R-2 đặt 100k/47k và R-3 đặt 383k/100k vào cùng nút EN. R-5 lại dùng nút này làm ngõ vào logic. Box02 cần một sơ đồ EN thống nhất. Mạng EN chưa chốt.

## R-4 · TPS63070 · CẦN FOUNDER

- Kết quả: 649k/100k cho PWM 5,766/5,992/6,223 V. Ở PFM, tới 6,345 V (có IFB 100 nA). Dòng âm trung bình vào IN 1,1/1,8 A ở forced PWM.
- Nguồn sai: dải VOUT của DeepSeek hẹp hơn một chút (dưới 2 %). Giá trị negative current limit DeepSeek để [CẦN TRA] nay đã tra được.
- Đánh đổi: forced PWM đẩy năng lượng phanh về pack. Khi BMS mở, năng lượng này dồn lên tụ VIN (Claude r6 đã nêu). PFM không hút dòng ngược, nhưng toàn bộ năng lượng dồn vào tụ VM. Cần founder/box08 chọn, kèm BT-R4.

## R-5 · MOTOR_EN · BÁC

- Kết quả: theo kicad-input-spec, LOGIC_EN là nút EN của TPS54302. Nút này chỉ đạt 1,22–1,77 V, dưới VIH 2,0 V của 74LVC1G08 và trên VIL 0,8 V. Ngõ vào AND vì vậy không xác định.
- Nguồn sai: DeepSeek ghi nSLEEP VIH 2,0 V. Datasheet ghi 2,5 V (2,0 V là các chân khác).
- Giá trị đúng: cần LOGIC_EN dạng số ở 3,3 V, ví dụ ra từ comparator R-2 qua pull-up 3,3 V, rồi mới đưa vào AND. Giữ 100 kΩ pull-down cho MCU_MOT_EN và nSLEEP.

## R-6 · ISEN · BÁC

- Kết quả: khi ngắn mạch ngõ ra–ngõ ra, trước khi OCP tác động (IOCP 2–3,3 A, tDEG 4 µs), V_ISEN đạt **1,25–2,07 V**, vượt abs max 0,5 V. RC 1k/10 nF có fc 15,9 kHz và chỉ giảm ripple 50 kHz xuống khoảng 0,30 lần.
- Nguồn sai: DeepSeek giả định dòng ngắn mạch bị chopping chặn ở 0,323 A. Điều này bỏ qua blanking và OCP (sai giả định). Claude r6 đã cảnh báo đúng điểm này.
- Điều kiện: hỏi TI về độ bền ISEN với quá độ, hoặc thêm bảo vệ tại chân ISEN. Box08 quyết định. RC cho ADC giữ được, nhưng để đọc kẹt có thể cần fc thấp hơn (BT-R2).

## R-7 · Kẹp VM · CHỐT CÓ ĐIỀU KIỆN

- Công thức: E = 2·½·L·I². Vpeak = √(V0² + 2E/C).
- Kết quả: với L 10 mH, 0,45 A, 2 kênh, E = 2,025 mJ. Với C 220 µF hiệu dụng, Vpeak 7,38/7,56/7,61 V cho V0 6,00/6,22/6,29 V. Với 150 µF: 7,94–8,16 V. Với 100 µF: 8,75–8,95 V.
- Nguồn sai: DeepSeek dùng V0 6,0 V. V0 đúng phải lấy max VOUT của TPS63070 (6,22 V PWM, 6,35 V PFM). Brake 22 Ω ở 8,2 V tiêu 3,06 W liên tục, gói 2512 không đạt "5 W". SOA của DMP3098L chỉ có dạng hình.
- ĐỀ XUẤT THAY ĐỔI: kẹp chủ động TLV6700 + DMP3098L + 22 Ω cần box08 duyệt.
- Điều kiện: đo L motor (BT-R1a). Đo đỉnh VM khi đảo chiều và xung lặp (BT-R4). Mô hình chưa tính cơ năng.

## R-8 · LDO cho TUSB320LAI · BÁC → rút lại ngày 07/11 (xem cuối mục)

- Kết quả: TPS7A2033 cho VOUT min 3,25 V. TUSB320 cần VDD ≥ 3,5 V khi DFP báo 3 A (SLLSEQ8D §7.2), nên không đạt. TPS7A2036 cho min 3,546 V, đạt. VIN tại VBUS 4,4 V trừ diode là 3,95–4,10 V, đủ điều kiện VIN ≥ VOUT + 0,3 V.
- Nguồn sai: DeepSeek không xét yêu cầu 3,5 V. DeepSeek ghi 200 mA và VDO 130 mV, trong khi datasheet là 300 mA và 145 mV max (DBV).
- Đề xuất: TPS7A2036PDBVR. Đây là thay đổi MPN, cần box08 duyệt. Dòng ngược phải ≤ 5 % dòng định mức (§6.3.7). Diode PMEG2010 chưa được tra datasheet.

- **Sửa 07/11/2026 theo review Codex:** điều kiện VDD ≥ 3,5 V nằm trong đoạn TUSB320 ở vai **DFP** quảng cáo dòng qua I²C (SLLSEQ8D §7.2). Robot dùng UFP, GPIO mode. Lý do bắt buộc đổi sang 3,6 V vì vậy không đứng. Giữ TPS7A2033PDBVR: VOUT min 3,25 V, OUT1 abs max 3,55 V, mạch CE vẫn đúng. Cần kiểm ramp và mức logic trên bench (BT-R5).

## R-9 · Chân điều khiển · BÁC

- Kết quả: SN74LVC8T245 với DIR = L chạy B→A. DIR/OE được cấp từ VCCA, và OE phải giữ cao tới khi cả hai VCC lên.
- Nguồn sai: DeepSeek đặt DIR pull-down và ghi là "A→B". Thực tế đó là chiều ngược, cổng 5 V sẽ lái ngược vào GPIO khi OE bật. DeepSeek kéo OE lên VCCB thay vì VCCA. TCA9517A có pull-up nội lên VCCB, nên 100 kΩ pull-down có thể không đủ thắng (giá trị nội không công bố).
- Giá trị đúng: DIR nối VCCA (tất cả 8 kênh A→B). OE pull-up 100 kΩ lên VCCA. TCA9517A EN do GPIO lái, pull-down đủ mạnh. Box02 kiểm giá trị pull-up nội.
- MAX98357A (19-6779 Rev 16, do user cung cấp): SD_MODE có pull-down nội 100 kΩ (92–108 kΩ). Mức dưới B0 (0,08–0,355 V) là shutdown, nên khi không ai lái chân này, amp đã ở shutdown. Pull-down 100 kΩ ngoài của DeepSeek là thừa. Nó còn làm sai RSMALL = 94,0·VDDIO − 100 và RLARGE = 222,2·VDDIO − 100 (kΩ) dùng để chọn kênh, vì hai công thức này chỉ tính pull-down nội. Khi lái SD_MODE trực tiếp ở mức cao (kênh trái), VDD phải luôn ≥ VDDIO; nếu không, thêm khoảng 2 kΩ nối tiếp. GAIN_SLOT = GND cho 12 dB (11,4–12,6 dB), đúng như DeepSeek ghi "GAIN = 0 V".

## R-10 · Bề rộng trace · CHƯA XÁC MINH

- Kết quả: 0,386/1,005 mm (1,2 A), 1,063/2,765 mm (2,5 A), 0,300/0,781 mm (1,0 A). Khớp Codex, Claude r6 và DeepSeek.
- Thiếu: hằng số IPC-2221 chưa tra từ bản gốc. Stackup và độ dày đồng của nhà sản xuất PCB cũng chưa có.

---

## Output thật của `python calc_r7.py` (exit 0)

```text

========================================================================
H-1 TPS61023 (SLVSF14B sec 6.5, 8.2)
========================================================================
  VOUT 732k/100k: min 4.742 / nom 4.950 / max 5.165 V  [DeepSeek 4.742/4.950/5.165]
  VOUT min < 4.75 V ? True  (DeepSeek ghi 'nam trong 4,75-5,25 V')
  VIN 3.0 V, L 1.00 uH: IL_DC 1.042 A, dIL 1.560 App, dinh 1.822 A, day 0.262 A (ILIM valley min 2.7 A tai 3.6 V)
  VIN 3.0 V, L 0.70 uH: IL_DC 1.042 A, dIL 2.229 App, dinh 2.156 A, day -0.073 A (ILIM valley min 2.7 A tai 3.6 V)
  VIN 3.2 V, L 0.70 uH: IL_DC 0.977 A, dIL 2.231 App, dinh 2.092 A, day -0.139 A (ILIM valley min 2.7 A tai 3.6 V)
  fSW chi co gia tri typ 1.0 MHz trong 6.5 -> dung typ. L -30 % theo khuyen nghi 8.2.2.2.

========================================================================
H-2 TPS259474 (SLVSFC9C sec 6.5, Eq 5, Eq 6)
========================================================================
  V_EN khi logic cao (3.3 V +/-5 %): min 1.276 / nom 1.359 / max 1.444 V  [can > VUVLO(R) max 1.223 V]
  V_EN khi logic thap 0.4 V (goc xau): 0.167 V (VSD(F) min 0.45 V; VUVLO(F) min 1.076 V)
  ILIM R=4.22k: min 0.660 / nom 0.790 / max 0.918 A  [ty le min/max lay tu 2 diem bang 6.5; DeepSeek 0.711/0.790/0.869]
  t_ITIMER C=1nF +/-10%: min 0.463 / nom 0.839 / max 1.596 ms  [DeepSeek 0.51-1.45 (bo dung sai tu)]
  tRST auto-retry (ban A): chi co typ 110 ms, khong co min/max.

========================================================================
H-3 TPS3808G01 (SBVS050N sec 6.5, 7.3.2 Eq 1)
========================================================================
  V_fall +/-1% (RESET high-Z): min 3.200 / nom 3.342 / max 3.487 V  [DeepSeek ghi 3.266-3.417 voi +/-1%]
  V_fall +/-0.1% (RESET high-Z): min 3.251 / nom 3.342 / max 3.433 V
  V_fall +/-0.1%, RESET keo len VPACK qua 100k: min 2.186 / nom 2.245 / max 2.305 V  [R_H boi them dong vao SENSE]
  Bien toi 3.20 V: +/-1% -> 0.3 mV; +/-0.1% -> 51.4 mV; co pull-up -> -1013.7 mV
  V_rise (RESET thap, VHYS noi = 0): min 3.524 / nom 3.605 / max 3.686 V  [muc tieu >= 3.50 V]
  tD CT=3.9nF: min 0.0123 / nom 0.0228 / max 0.0350 s  [DeepSeek 22.3 ms, thieu +0.5 ms va dung sai]
  Tre SENSE->RESET: chi co typ 20 us (khong co max).
  Thevenin SENSE = 86.7 kOhm (Codex gia dinh <= 10 kOhm); sai so do ISENSE quy ve pack = +/-17.9 mV

========================================================================
H-4 Detector raw VBUS TLV6703 (SBOS865B sec 7.5, Table 2)
========================================================================
  V_detect (VBUS tang, VIT+): min 4.469 / nom 4.597 / max 4.729 V  [DeepSeek 4.50/4.56/4.62]
  V_deassert (VBUS giam, VIT-): min 4.367 / nom 4.534 / max 4.682 V  [DeepSeek 4.44/4.50/4.56; chua tinh R_H4]
  Muc ra cao tai VBUS 4.4 V: 2.400 V (74LVC VIH 2.0 V @VCC 3-3.6 V)
  Muc ra cao tai VBUS 5.0 V: 2.727 V (74LVC VIH 2.0 V @VCC 3-3.6 V)
  Muc ra cao tai VBUS 5.5 V: 3.000 V (74LVC VIH 2.0 V @VCC 3-3.6 V)
  Dut day SENSE: R_D2 keo SENSE ve 0 -> OUT thap = 'VBUS vang' -> NOR o H-5 = 1 -> CHO PHEP bat (fail-ON).

========================================================================
H-5 2x TMUX1511 (SCDS390B sec 5.5)
========================================================================
  Dong tinh IDD + SEL: min 74.000 / nom 76.887 / max 142.887 uA  [IDD 37/70 uA/IC]
  Ro I/O sang mien tat (VDD=0, VS<=3.6 V): <= 10 uA tong (5 x IPOFF 2 uA)
  RON max 4.5 Ohm; 8 SEL co, 5 dung, 3 SEL du noi GND.

========================================================================
H-6 ADC1 settling (ESP32 datasheet v5.3 Table 4-3)
========================================================================
  R_settle 2504.5 Ohm, C 10 pF: t = 9.011 tau = 225.7 ns
  R_settle 2504.5 Ohm, C 100 pF: t = 9.011 tau = 2256.8 ns
  C lay mau ADC1 KHONG co trong datasheet v5.3 -> [CHUA XAC MINH]. Bang 4-3 do voi tu ngoai 100 nF.
  Neu dat 100 nF tai chan ADC: tau = 0.250 ms; buoc toan dai can 2.26 ms.

========================================================================
H-7 MCP73833 (DS20002005C bang DC, 5.1.4.1, 6.1.1.3)
========================================================================
  LED 680 Ohm, VIN 4.75 V, VF 1.8 V (gia dinh): 2.84-4.38 mA (VOL 0-1 V)
  LED 680 Ohm, VIN 4.75 V, VF 2.2 V (gia dinh): 2.26-3.79 mA (VOL 0-1 V)
  LED 680 Ohm, VIN 5.25 V, VF 1.8 V (gia dinh): 3.57-5.12 mA (VOL 0-1 V)
  LED 680 Ohm, VIN 5.25 V, VF 2.2 V (gia dinh): 2.98-4.53 mA (VOL 0-1 V)
  R_NTC tai nguong lanh: 22.64/24.60/26.81 kOhm
  R_NTC tai nguong nong: 4.434/5.000/5.638 kOhm
  Nhiet do cat lanh (bang Semitec, NTC +/-1 %): 0.2..4.6 C (nom 2.4)
  Nhiet do cat nong: 40.7..48.4 C (nom 44.5)
  R(0 C): TI 27.28 k; DeepSeek dung B3435 -> 28.70 k (lech 5.2 %)
  R(45 C) uoc tinh: 4.911 k (beta 25/60) vs B3435 4.847 k (bang Semitec)

========================================================================
H-8 Dong USB-C tay cam (DS20002005C; r7 H3)
========================================================================
  IREG max 0.4462 A; ISS 3.0 mA; 2 LED (VF=0) 15.60 mA; detector 78 uA
  Tong steady-state cuc xau: 0.4649 A ; bien 35.1 mA toi 0.5 A
  Inrush 4.7 uF: Q = 24.7 uC

========================================================================
R-1 BQ25886 (SLUSD88A sec 6.5, 8.3.7.4, Fig 18)
========================================================================
  ICHG R=1.91k: min 0.422 / nom 0.501 / max 0.582 A  [+/-15 % @500 mA, +/-1 % R]
  ICHGSET 7.68k (input spec) -> 2.016 A
  Kiem phuong trinh voi vi du TI 0-60 C: RT1 5.24k RT2 30.31k (TI: 5.24k/30.31k)
  DeepSeek 5.11k/26.7k: dung sac T1 -4.0..0.4 C; T3 (VREG 8.0 V, VAN SAC) 43.7..46.5 C; dung sac T5 59.0..62.0 C
  Giai cho T1=0 C, T5=45 C (R45 uoc tinh 4.911k): RT1 9.247k RT2 352.50k
  Ung vien E96 9.09k/324k: T2 (ICHG 20 %) 5.6..7.3 C
  Ung vien E96 9.09k/324k: T1 -0.9..1.4 C; T3 31.6..33.9 C; T5 44.2..46.8 C
  CE keo len REGN 4.7 V qua 100k (900k noi): 4.23 V; OUT1 abs max VDD+0.3 = 3.6 V @VDD 3.3 -> vuot True
  CE keo len REGN 5.15 V qua 100k (900k noi): 4.63 V; OUT1 abs max VDD+0.3 = 3.6 V @VDD 3.3 -> vuot True
  CE keo len V3V3_USB 3.250 V qua 100k: 2.93 V (VIH_CE 1.3 V; <= VDD+0.3)
  CE keo len V3V3_USB 3.546 V qua 100k: 3.19 V (VIH_CE 1.3 V; <= VDD+0.3)

========================================================================
R-2 UVLO robot TLV6700 (SNVSAV2B sec 6.5)
========================================================================
  V_fall (VIT-, OUTA high-Z): min 6.241 / nom 6.412 / max 6.551 V  [DeepSeek dung VIT+ 0.396-0.404 -> 6.42/6.50/6.59]
  V_rise (OUTA thap): min 6.716 / nom 6.799 / max 6.883 V
  Neu OUTA bi keo len (100k len VPACK, 47k xuong): V_fall = 5.326..5.505 V
  Founder chot V_fall 6.4-6.6 V: ty le cua so 1.0312; ty le VIT- max/min 1.0336 -> KHONG KHA THI ke ca voi dien tro ly tuong
  Dung sai nguong falling toi da cua IC (doi xung, R 0.1 %, ISENSE qua 100 kOhm): +/-0.73 % (TLV6700: -1.90 / +1.39 %)
  Ty le chia can (danh nghia giua cua so, VIT- typ): 16.475

========================================================================
R-3 TPS54302 (SLVSDG6C sec 6.5, 6.3.4 Eq 1-2, 6.3.8)
========================================================================
  VOUT 750k/100k: min 4.852 / nom 5.066 / max 5.286 V  [DeepSeek 4.96/5.07/5.17]
  VOUT 100k/13.3k (vi du TI): min 4.863 / nom 5.077 / max 5.298 V
  V_EN tai VPACK 6.0 V (gom Ip 0.7 uA typ): 1.278..1.318 V (VENrising max 1.28 V; abs max 7 V; khuyen nghi <= 5.5 V)
  V_EN tai VPACK 6.4 V (gom Ip 0.7 uA typ): 1.359..1.402 V (VENrising max 1.28 V; abs max 7 V; khuyen nghi <= 5.5 V)
  V_EN tai VPACK 8.4 V (gom Ip 0.7 uA typ): 1.767..1.823 V (VENrising max 1.28 V; abs max 7 V; khuyen nghi <= 5.5 V)
  R_EN2 ho: EN bi kep boi BZT52C5V6, VZ 5.2-6.0 V @5 mA (DS18004); IR <= 1 uA @ VR 2 V
  L 10 uH, VIN 8.4 V, fSW 290 kHz: dIL 0.698 App (dinh @0.9 A = 1.25 A, HS limit min 4 A)
  L 10 uH, VIN 8.4 V, fSW 400 kHz: dIL 0.506 App (dinh @0.9 A = 1.15 A, HS limit min 4 A)
  L 10 uH, VIN 8.4 V, fSW 510 kHz: dIL 0.397 App (dinh @0.9 A = 1.10 A, HS limit min 4 A)

========================================================================
R-4 TPS63070 (SLVSC58B sec 6.5, 8.4.5)
========================================================================
  VOUT 649k/100k PWM (+/-1 %, IFB 100 nA): min 5.766 / nom 5.992 / max 6.223 V  [DeepSeek 5.87/5.99/6.11]
  VOUT 649k/100k PFM (-1/+3 %): min 5.766 / nom 5.992 / max 6.345 V
  Gioi han dong am trung binh vao IN (forced PWM): 1.1/1.8 A (VIN 5 V, VOUT 6.5 V).

========================================================================
R-5 MOTOR_EN (DRV8833 SLVSAR1E 6.5; SN74LVC1G08 6.x)
========================================================================
  nSLEEP VIH = 2.5 V, VIL = 0.5 V (khong phai 2.0 V); pull-down noi 500 k typ.
  LOGIC_EN (= nut EN TPS54302 theo R-3) = 1.22..1.77 V; 74LVC1G08 VIH 2.0 V / VIL 0.8 V @VCC 3-3.6 V -> doc THAP hoac khong xac dinh
  Tai nSLEEP khi cao: 39.6 uA

========================================================================
R-6 ISEN (DRV8833 SLVSAR1E 6.1, 6.5)
========================================================================
  Chopping: VTRIP max 0.240 V -> ITRIP max 0.391 A
  Ngan mach ra-ra truoc OCP (IOCP 2.0 A, tDEG 4 us): V_ISEN = 1.25 V vs abs max 0.5 V
  Ngan mach ra-ra truoc OCP (IOCP 3.3 A, tDEG 4 us): V_ISEN = 2.07 V vs abs max 0.5 V
  RC 1k/10nF: fc 15.9 kHz; suy giam o 50 kHz PWM: x0.303

========================================================================
R-7 Kep VM (nang luong cuon day; DMP3098L DS31447 Rev 8)
========================================================================
  V0 6.00 V, C 100 uF, L 10 mH: E 2.025 mJ -> Vpeak 8.75 V
  V0 6.00 V, C 150 uF, L 10 mH: E 2.025 mJ -> Vpeak 7.94 V
  V0 6.00 V, C 220 uF, L 10 mH: E 2.025 mJ -> Vpeak 7.38 V
  V0 6.22 V, C 100 uF, L 10 mH: E 2.025 mJ -> Vpeak 8.90 V
  V0 6.22 V, C 150 uF, L 10 mH: E 2.025 mJ -> Vpeak 8.10 V
  V0 6.22 V, C 220 uF, L 10 mH: E 2.025 mJ -> Vpeak 7.56 V
  V0 6.29 V, C 100 uF, L 10 mH: E 2.025 mJ -> Vpeak 8.95 V
  V0 6.29 V, C 150 uF, L 10 mH: E 2.025 mJ -> Vpeak 8.16 V
  V0 6.29 V, C 220 uF, L 10 mH: E 2.025 mJ -> Vpeak 7.61 V
  Brake 22 Ohm tai 8.2 V: 0.373 A, 3.06 W lien tuc (2512 thuong 1-2 W, khong phai 5 W)

========================================================================
R-8 LDO cho TUSB320LAI (SBVS338H 5.5; SLLSEQ8D 6.1, 7.2)
========================================================================
  TPS7A2033 DBV: VOUT min 3.250 V; (dieu kien VDD >= 3.5 V chi ap dung khi TUSB320 la DFP quang cao 3 A) -> <3.5, UFP van dung duoc; OUT1 abs max VDD+0.3 = 3.55 V
     VBUS 4.4 V, VF 0.3: VIN 4.10 V; dieu kien bang VIN >= VOUT+0.3 = 3.60 V -> OK; dropout max 145 mV @300 mA
     VBUS 4.4 V, VF 0.45: VIN 3.95 V; dieu kien bang VIN >= VOUT+0.3 = 3.60 V -> OK; dropout max 145 mV @300 mA
  TPS7A2036 DBV: VOUT min 3.546 V; (dieu kien VDD >= 3.5 V chi ap dung khi TUSB320 la DFP quang cao 3 A) -> >=3.5; OUT1 abs max VDD+0.3 = 3.85 V
     VBUS 4.4 V, VF 0.3: VIN 4.10 V; dieu kien bang VIN >= VOUT+0.3 = 3.90 V -> OK; dropout max 145 mV @300 mA
     VBUS 4.4 V, VF 0.45: VIN 3.95 V; dieu kien bang VIN >= VOUT+0.3 = 3.90 V -> OK; dropout max 145 mV @300 mA

========================================================================
R-9 Chan dieu khien (SN74LVC8T245 Table 7-1; TCA9517A 7.3.2)
========================================================================
  8T245: OE=L,DIR=H -> A->B ; OE=L,DIR=L -> B->A ; OE=H -> Hi-Z. DIR/OE tham chieu VCCA.
  DeepSeek: DIR keo xuong = 'A->B' -> SAI, thuc te B->A. OE keo len VCCB -> sai mien (phai VCCA).
  TCA9517A EN active-high, co pull-up noi len VCCB (gia tri khong cong bo).
  MAX98357A chi RPD noi: SD_MODE qua RSMALL 210.2k = 1.005..1.120 V; qua RLARGE 633.3k = 0.419..0.481 V (B1 0.65-0.825, B2 1.245-1.5 V)
  MAX98357A RPD noi // 100k ngoai: SD_MODE qua RSMALL 210.2k = 0.610..0.656 V; qua RLARGE 633.3k = 0.231..0.251 V (B1 0.65-0.825, B2 1.245-1.5 V)

========================================================================
R-10 IPC-2221 (k=0.048/0.024, b=0.44, c=0.725 - [CHUA XAC MINH tu ban IPC])
========================================================================
  VPACK 1.2 A lop ngoai: 0.386 mm
  VPACK 1.2 A lop trong: 1.005 mm
  VPACK2 2.5 A lop ngoai: 1.063 mm
  VPACK2 2.5 A lop trong: 2.765 mm
  VM 1.0 A lop ngoai: 0.300 mm
  VM 1.0 A lop trong: 0.781 mm
  V5 1.0 A lop ngoai: 0.300 mm
  V5 1.0 A lop trong: 0.781 mm

========================================================================
D-H2 TPS259474L (SLVSFC9C Eq 4)
========================================================================
  CdVdt 2.2 nF -> SR 0.91 V/ms; 0->5 V trong 5.5 ms; inrush voi 22 uF = 20.0 mA
  OVLO noi GND (khong de ho, SLVSFC9C Table 5-1). PG de ho, PGTH noi GND [box02 xac nhan].
  LOAD_EN cao: 3.13..4.11 V (EN/UVLO can > 1.223 V, abs max 6.5 V, khuyen nghi <= 5 V; TPS61023 EN > 1.2 V, abs max 7 V)
  LOAD_EN thap: dong chim 42 uA -> VOL << 0.45 V (VSD(F) min)
  Divider 267k/187k bi bo: voi pull-up 100k no keo LOAD_EN xuong ~0.81*VPACK -> V_EN min ~1.05 V < 1.223 V.

========================================================================
D-H3 TPS3808G01 + NMOS chuyen mach hysteresis (DMN2075U-7 DS31837 Rev 7)
========================================================================
  Chon: R_bot 9.20k, R_top 72.3k, Rx 866k (0.1 %, E192)
  He so OK = 8.2531 (muc tieu 8.25 +/-0.2 %: +0.038 %); Thevenin 8.16 kOhm
  V_fall 3.262..3.424 V (bien 62 mV toi 3.20 V); V_rise 3.501..3.785 V (>= 3.50 V)
  Dong chia ap tu pack @4.2 V: 51.5 uA; NMOS IDSS 100 nA + ISENSE 25 nA da tinh
  CT de ho: tD 12/20/28 ms (SBVS050N 6.6). RESET keo len VPACK qua 100k; gate NMOS = RESET.
  Vgs NMOS khi OK: >= 2.72 V (VGS(th) max 1.0 V; RDS(on) <= 45 mOhm @2.5 V)

========================================================================
D-H4 Detector VBUS fail-safe: TLV6710 kenh INB (OUTB thap khi INB > VIT+)
========================================================================
  Day nguyen, VBUS vang: S = 0.136..0.186 V < VIT-(INB) min 0.387 V -> cho phep
  Dut day sense hoac GND: S = VPACK 3.20..4.20 V > VIT+ max 0.403 V -> chan (OUTB thap)
  VBUS co mat (>= 0.403 V tai S): chan. VBUS 5.5 V < abs max INB 7 V
  Dong tu USB qua R_far: 0.53 mA; dong tu pack khi vang VBUS: 18.3 uA
  Bien nhieu muc thap: 201 mV
  Robot (470k tu VPACK2, 100k tai S): vang+nguyen S = 0.116..0.163 V; dut day S = 1.08..1.50 V (can > 0.403 V, < 7 V)

========================================================================
D-H6 Tu 100 nF X7R tai moi chan ADC1 joystick (dieu kien do ESP32 Table 4-3)
========================================================================
  tau 0.250 ms; 9.01 tau = 2.26 ms -> cho >= 5 ms sau khi mo TMUX
  Chia se dien tich voi C_lay_mau 10 pF: sai so <= 0.41 LSB (12 bit)
  Chia se dien tich voi C_lay_mau 100 pF: sai so <= 4.10 LSB (12 bit)

========================================================================
D-R1 BQ25886 mang TS 3 dien tro (RT1, RT2, Rs noi tiep NTC)
========================================================================
  Chon E96: RT1 9.53k, RT2 511.0k, Rs 0.000k (noi tiep NTC)
    T1: -1.3..0.9 C
    T2: 4.7..6.9 C
    T3: 30.5..32.8 C
    T5: 43.0..45.5 C
  So voi 2 dien tro 9.09k/324k: T3 31.7..33.5 C. NTC theo bang Semitec, dung sai +/-1 %.
  CE: 100k len REGN; Q_CE (DMN2075U-7) keo CE xuong khi Q_P (DMG2305UX-7) dan;
      Q_P source = V3V3_USB, gate = OUT1 (pull-up 100k len V3V3_USB). OUT1 <= VDD (abs max VDD+0.3) OK.
      V3V3_USB 3.55 V: Vgs Q_P khi OUT1 thap = -3.15 V (RDS(on) <= 100 mOhm @-2.5 V); gate Q_CE = 3.55 V (VGS(th) max 1.0 V)
      V3V3_USB 3.65 V: Vgs Q_P khi OUT1 thap = -3.25 V (RDS(on) <= 100 mOhm @-2.5 V); gate Q_CE = 3.65 V (VGS(th) max 1.0 V)

========================================================================
D-R2 TLV6710 INA (SNVSAV4B 7.5) + NMOS chuyen mach, cua so founder 6.40-6.60 V
========================================================================
  Chon: R_bot 11.10k, R_top 180.0k, Rx 2.84M (0.1 %, E192); Thevenin 10.5k
  V_fall 6.418..6.582 V (cua so 6.40-6.60 V); V_rise 6.851..7.146 V
  Dong chia ap @8.4 V: 44.0 uA
  EN_NODE (100k/68k): 2.56..3.44 V; EN TPS54302 rising max 1.28 V, abs max 7 V; Vgs NMOS >= 2.16 V (DMN2075U-7 VGSS 8 V, VGS(th) max 1.0 V)

========================================================================
D-R5 MOTOR_EN = AND3(EN_NODE, V5R_OK, MCU_MOT_EN), 74LVC1G11 VCC = V3V3_DEV (sua 07/11)
========================================================================
  EN_NODE khi cho phep: 2.57..3.44 V (VIH 2.0 V @VCC 3-3.6 V; ngo vao chiu 5.5 V)
  Veto (UVLO, USB, SW1) keo EN_NODE xuong -> MOTOR_EN thap ngay, khong phu thuoc tu tren V5_R.
  V5R_OK = V5_R qua 100k/200k: 3.21..3.56 V (giu: chi bat khi buck da len)
  VOH LVC1G11 @IOH -100 uA = VCC-0.1 >= 3.03 V (VCC 3.135 V); tai nSLEEP 36 uA -> nSLEEP >= 3.03 V > VIH 2.5 V

========================================================================
D-R6 Loc ISEN -> ADC1: 10k / 100 nF
========================================================================
  fc 159 Hz; suy giam 50 kHz x0.0032; tau 1.0 ms
  Xung ISEN 2.07 V trong 4 us vao 10k/100nF: dV tai ADC = 8.3 mV
  Chan ISEN: van FAIL abs max khi ngan mach (R1 0.62 Ohm da chot). De xuat footprint Schottky DNP + hoi TI.

========================================================================
D-R9 MAX98357A SD_MODE noi V5_R qua 10k (kenh trai), GAIN_SLOT = GND
========================================================================
  SD_MODE = 4.37..4.85 V > B2 max 1.5 V -> trai; VDD = VDDIO = V5_R

========================================================================
D-ILIM2 TPS259474L ILIM 5.11k va dong quy ve pack (SLVSFC9C Eq 5, bang 6.5)
========================================================================
  RILM 4.22k: ILIM 0.660/0.790/0.918 A -> dong pack @3.20 V, eta 0.8: 1.29..1.79 A
  RILM 5.11k: ILIM 0.545/0.652/0.758 A -> dong pack @3.20 V, eta 0.8: 1.06..1.48 A
  Yeu cau: ILIM min >= 0.50 A (ESP32-WROOM-32 can nguon >= 0.5 A).
  Qua ILIM lau hon tITIMER (0.46-1.60 ms) -> circuit breaker cat va latch (ban L).

========================================================================
D-PASS eFuse pass VBUS Micro-USB -> DevKit (TPS259474LRPWR thu 2)
========================================================================
  EN_PASS khi carrier OFF, VBUS 4.40-5.50 V: 1.353..1.738 V (VUVLO(R) max 1.223 V; EN khuyen nghi <= 5 V)
  Nguong bat theo VBUS: 3.74..3.98 V
  C_EN 100 nF: VBUS 4.4 V -> EN_PASS cham 1.223 V sau 6.93 ms (tau 3.12 ms)
  C_EN 100 nF: VBUS 5.0 V -> EN_PASS cham 1.223 V sau 4.79 ms (tau 3.12 ms)
  Thu tu khi cam Micro-USB voi carrier dang chay:
    LOAD_EN dang cao -> Q5 dan -> EN_PASS giu thap tu dau, pass khong the bat truoc carrier.
    Detector TLV6710 tpd 9.9 us typ -> LOAD_EN thap -> eFuse carrier tD,OFF <= 64 us;
    pass: Q5 tat, EN_PASS len trong >= 2.9 ms + tD,ON >= 0.09 ms -> khoang ho >= 2.8 ms.
  Mat pin: LOAD_EN = 0 -> pass bat khi co VBUS (nap DevKit duoc khi vang pack).
  Dut day sense: detector chan -> LOAD_EN thap -> carrier OFF, pass ON. An toan.
  RCB: chan nguoc khi VOUT > VIN + 29 mV (1 us); ro nguoc khi khong cap nguon 4.86 uA (@12 V).
  ILIM pass RILM 5.11k: 0.545..0.758 A (nguon USB 2.0 Default 500 mA)

========================================================================
D-SEL2 SEL TMUX1511 lai truc tiep tu LOAD_EN qua 10k (bo C 1 uF)
========================================================================
  Cu (100k/1 uF): ngat sau 0.221 s (SEL tu 4.11 V xuong VIL 0.45 V)
  Moi (10k, C ky sinh ~130 pF gia dinh): ngat sau 2876 ns + tpd detector 9.9 us
  Bat: TMUX chi dan khi VDD (V3V3_DEV) hop le; JOY_VCC cung qua mux -> khong co cap nguoc luc ramp.

========================================================================
D-LATCH LOAD_EN tu giu: Q6 DMG2305UX-7 (P) + Q7 DMN2075U-7 (N) + nut SW4 ON
========================================================================
  LOAD_EN cao 2.97..3.90 V -> gate Q7 1.47..1.97 V (VGS(th) max 1.0 V) -> Q7 dan, giu LATCH_G thap
  LOAD_EN bi keo xuong (VOL <= 0.4 V) -> gate Q7 <= 0.20 V < VGS(th) min 0.4 V -> Q7 tat
  Q7 tat -> R57 keo LATCH_G len; Ciss gia dinh 0.5 nF: Q6 tat sau <= 106 us
  Q7 tat -> R57 keo LATCH_G len; Ciss gia dinh 1.5 nF: Q6 tat sau <= 319 us
  -> Moi tin hieu chan dai hon ~0.4 ms deu xoa quyen bat. RESET TPS3808 giu thap >= tD 12 ms.
  Nhan SW4 @VPACK 3.2 V: LATCH_G = 0.032 V, VGS Q6 = -3.17 V (can < -0.9 V; VGSS +/-8 V)
  Nhan SW4 @VPACK 4.2 V: LATCH_G = 0.042 V, VGS Q6 = -4.16 V (can < -0.9 V; VGSS +/-8 V)
  Cam pack: LATCH_G = VPACK qua R57, VGS 0 -> OFF mac dinh. Chi bat lai khi nhan SW4.
  Nhan SW4 khi co USB/UV/dut sense: phan tu keo xuong thang 100k -> LOAD_EN van thap -> nha nut la OFF.
  Dong khi OFF: 0 qua R10/R57; khi ON: R57 42 uA + chia ap gate Q7 2.1 uA

========================================================================
D-ROBOT2 Latch EN_NODE, eFuse DevKit, pass VBUS robot, tre CE (07/11)
========================================================================
  VPACK2 6.24 V: VGS Q6R khi nhan/giu = -3.12 V (VGS(th) max -0.9 V, VGSS +/-8 V)
  VPACK2 8.4 V: VGS Q6R khi nhan/giu = -4.20 V (VGS(th) max -0.9 V, VGSS +/-8 V)
  EN_NODE khi giu: 2.57..3.44 V -> Q7R dan (VGS(th) max 1.0 V)
  Veto keo EN_NODE: dong chim 84 uA, VOL << 0.25 V (spec @5 mA) < VGS(th) min 0.4 V
  Q6R nha sau tau = 100k x Ciss (0.1-0.3 ms). Khong tu tren LATCH2_G.
  eFuse DevKit robot: EN = EN_NODE 2.57..3.44 V (> 1.223 V, <= 5 V khuyen nghi); RILM 5.11k
  CE: V3V3_USB 3.25 V -> gate Q2 cuoi 2.95 V; vuot VGS(th) max 1.0 V sau 3.8 ms
  CE: V3V3_USB 3.35 V -> gate Q2 cuoi 3.05 V; vuot VGS(th) max 1.0 V sau 3.6 ms
  Xung OUT1 thap ngan hon 1.3 ms khong the bat sac (gate chua toi VGS(th) min 0.4 V)
  Mat attach/VBUS: OUT1 = H hoac VDD = 0 -> Q3 tat -> C31 xa qua R32 -> CE len theo REGN; REGN mat thi IC khong sac.

========================================================================
D-DELTA-H Delta tay cam theo review 06/11 (box02/box08)
========================================================================
  LOAD_EN cao (PG da len): 2.58..3.40 V; gate Q7 (x2/3) 1.72..2.27 V
  LOAD_EN cao (PG con thap (khoi dong)): 2.49..3.28 V; gate Q7 (x2/3) 1.66..2.19 V
  LOAD_EN khi Q6 tat: IDSS Q6 <= 1 uA x 205k = 205 mV (< SEL VIL 0.45 V, < boost VEN_L 0.35 V)
  LOAD_EN khi bi veto: dong chim 89 uA; VOL <= 0.40 V (TPS3808 @1 mA) / 0.25 V (TLV6710 @3 mA)
  SEL khi veto: <= 0.40 V + 10k x 1 uA = 0.41 V < VIL 0.45 V (bien 40 mV, gioi han boi TPS3808)
  Xung kich C_t 19.8 nF: Q_trig dan 2.35..4.84 ms
  Xung kich C_t 24.2 nF: Q_trig dan 2.86..5.89 ms
  Thoi gian Q7 bat (Ciss x2 guard): 0.68 ms < xung kich min -> chot duoc
  Cam pack khi dang giu SW4: xung <= 5.8 ms < RESET TPS3808 tD min 12 ms -> RESET van giu LOAD_EN thap -> khong chot
  Giu SW4 xuyen qua veto roi het veto: khong co xung moi -> giu OFF. Can nha va nhan lai.
  Q6 nha sau veto: tau R57 x Ciss_p = 81 us typ (guard x2: 162 us)
  PG-timeout (LOAD_EN 3.41 V): X vuot VIT+ sau 16.8 ms
  PG-timeout (LOAD_EN 2.6 V): X vuot VIT+ sau 27.6 ms
  U6 bat: tD,ON <= 0.97 ms (2.7 V) .. 2.35 ms (12 V) + ramp toi PG 4.41 V / 0.91 V/ms = 4.9 ms -> <= ~7.2 ms typ
  PGTH 100k/39.2k: PG khi V5_DEV >= 4.14..4.41 V (V5_DEV min ~4.71 V)
  U10 INB: V5_BST > 0.97..1.01 V -> chan EN_PASS
  Xa V5_BST qua 2.2k (C 35 uF): duoi nguong sau 130 ms; ton hao 2.3 mA @5 V
  Xa V5_BST qua 2.2k (C 50 uF): duoi nguong sau 184 ms; ton hao 2.3 mA @5 V
  U9 RILM 6.65k (diem bang 6.5): ILIM 0.421/0.500/0.581 A; ITIMER 10 nF -> 4.6..16.0 ms
  TS3USB221: OE H = ngat; IOFF <= 2 uA @VCC 0, VI/O 0-3.6 V (SCDS220M); VCC 2.3-3.6 V tu V3V3_DEV
  Q_D gate = VBUS_PASS/2: 2.18..2.78 V (> VGS(th) max 1.0 V) -> OE thap -> data noi

========================================================================
D-DELTA-R Delta robot tuong ung delta tay cam (07/11)
========================================================================
  U18 INB: V5_R > 0.97..1.01 V -> chan EN2_PASS
  Xa V5_R qua 2.2k (C 35 uF): duoi nguong sau 132 ms; ton hao 2.3 mA
  Xa V5_R qua 2.2k (C 60 uF): duoi nguong sau 224 ms; ton hao 2.3 mA
  SW4R @VPACK2 6.24 V: buoc gate 3.12 V (VGSS 8 V), xung 2.30..5.14 ms
  SW4R @VPACK2 8.4 V: buoc gate 4.20 V (VGSS 8 V), xung 2.90..5.89 ms
  EN_NODE len du de Q7R chot: 71 us (3 gate, Ciss x2) << xung min
  Q_por giu EN_NODE thap >= 32 ms sau khi cam pack (> xung SW4R max 5.9 ms)
  VPACK2 ramp cham hon tau: P khong len -> khong giu; nhung SW4R chi tao xung khi nhan, khong khi giu.
  PG-timeout U16 (EN_NODE 3.44 V): 16.7 ms
  PG-timeout U16 (EN_NODE 2.57 V): 28.0 ms
  PGTH U16 100k/39.2k: PG khi V5_DEV >= 4.14..4.41 V (V5_R min 4.863 V - RON)
  U16 bat: tD,ON + ramp 0.91 V/ms toi 4.41 V ~ 6-7 ms typ (dVdT khong co min/max: TBD bench)
```

Exit code: 0
