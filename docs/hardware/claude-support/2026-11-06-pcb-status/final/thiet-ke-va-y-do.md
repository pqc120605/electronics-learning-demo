# MoBot V2 r7 · Giải thích và ý đồ thiết kế (07/11/2026)

File này giải thích vì sao [final-bom.md](final-bom.md) chọn các giá trị và cấu trúc hiện tại. Số liệu có trong `calc_r7.py` (output ở cuối [final-values.md](final-values.md)). Nguồn datasheet nằm ở [datasheet-checks.md](datasheet-checks.md).

## 1. Nguyên tắc chung

1. **Mặc định là OFF.** Mỗi đường cấp quyền bật tải đều cần một tín hiệu chủ động. Mất nguồn, mất bias, IC dưới POR hay dây đứt đều phải dẫn về OFF, không cần firmware.
2. **Một nút quyết định cho mỗi carrier.** Tay cầm có `LOAD_EN`, robot có `EN_NODE`. Cả hai là nút wired-AND open-drain: một pull-up, nhiều phần tử kéo xuống. Bất kỳ điều kiện xấu nào kéo nút xuống là tải tắt. Cách này thay mạng logic nhiều cổng của DeepSeek, nên ít linh kiện hơn và không có trạng thái treo do cổng logic chưa có nguồn.
3. **Ngưỡng an toàn tính theo góc xấu nhất.** Dùng min/max datasheet, điện trở ±0,1 % ở các mạng ngưỡng, ±1 % ở chỗ khác, cộng dòng rò ngõ vào. Không dùng giá trị typ cho các cận an toàn.
4. **Giữ các quyết định founder:** H3, R1, R5 và cửa sổ UVLO robot 6,40–6,60 V. Khi quyết định làm một mục không đạt, ghi FAIL, không tự đổi quyết định (xem mục 6).

## 2. Tay cầm

### 2.1 Nút LOAD_EN

`LOAD_EN` kéo lên VPACK qua 100 kΩ. Có bốn phần tử kéo xuống:
- RESET của TPS3808 (pin yếu).
- OUTB detector Micro-USB.
- OUTB detector USB-C.
- Công tắc SW1 ở vị trí OFF.

`LOAD_EN` lái trực tiếp EN của boost TPS61023 và EN/UVLO của eFuse (qua 10 kΩ). Nó cũng lái SEL của TMUX qua RC. Mức cao 3,13–4,11 V vượt ngưỡng bật của cả ba IC và nằm dưới abs max (6,5 V eFuse, 7 V boost, 5,5 V SEL).

Ban đầu tôi giữ divider 267k/187k của DeepSeek cho EN eFuse. Phép tính cho thấy divider này cộng với pull-up 100 kΩ kéo EN xuống khoảng 1,05 V, dưới ngưỡng bật 1,223 V. Vì vậy divider bị bỏ.

### 2.2 UVLO 3,20 V với hysteresis đóng/ngắt

**Bài toán:** hệ số pack/SENSE 8,25 ±0,2 % đã chốt. Ngưỡng bật lại cần ≥ 3,50 V. DeepSeek nối điện trở hồi tiếp từ RESET về SENSE. Cách đó chỉ đúng khi RESET hoàn toàn thả nổi. Nhưng RESET phải kéo lên để lái tải, và khi đó dòng qua R_H làm ngưỡng ngắt tụt về khoảng 2,2 V.

**Cách giải:** thêm điện trở Rx = 866 kΩ song song với R_top, nối qua một N-MOS (DMN2075U-7). Gate của N-MOS là `LOAD_EN`.
- Khi tải đang chạy (`LOAD_EN` cao), N-MOS dẫn và Rx song song R_top. Hệ số thành 8,253, đúng giá trị đã chốt, nên ngưỡng ngắt là 3,262–3,424 V.
- Khi đã ngắt (`LOAD_EN` thấp), N-MOS tắt và chỉ còn R_top. Hệ số tăng, pack phải lên 3,501–3,785 V mới bật lại.
- Diode thân của N-MOS bị phân cực ngược (SENSE 0,4 V nhỏ hơn VPACK). IDSS 100 nA đã tính vào sai số.

Thevenin tại SENSE là 8,16 kΩ, đạt giả định ≤ 10 kΩ của Codex. Sai số do dòng SENSE ±25 nA chỉ cỡ ±1,7 mV quy về pack.

**Hệ quả phụ có chủ đích:** khi cắm USB, detector cũng kéo `LOAD_EN` xuống, nên N-MOS tắt. Rút USB ra thì pack phải ≥ 3,50 V mới chạy lại. Sau khi sạc, pack thường trên 4 V nên không ảnh hưởng. Pack ở 3,3–3,5 V thì phải sạc thêm mới chạy. Tôi chọn hành vi bảo thủ này.

### 2.3 Detector VBUS fail-safe

**Bài toán:** detector của DeepSeek coi "dây sense đứt" giống "không có USB", nên lại cho bật tải (fail-ON). Ma trận Codex yêu cầu đứt sense phải giữ OFF.

**Cách giải:** thêm điện trở R_far = 10 kΩ kéo VBUS xuống GND, đặt ở **đầu xa** (trên interposer, ngay cổng). Thêm R_bias = 220 kΩ kéo nút S lên VPACK, ở đầu carrier.

| Tình huống | Điện áp S | Kết quả |
|---|---|---|
| Dây nguyên, không có USB | R_far thắng R_bias: 0,136–0,186 V | Dưới VIT− (0,387 V), cho phép |
| Đứt dây sense hoặc đứt GND | R_bias kéo S lên VPACK, 3,2–4,2 V | Chặn |
| Có USB | S ≈ VBUS | Chặn từ khoảng 0,4 V |

TLV6710 kênh INB kéo OUTB xuống khi INB vượt ngưỡng. Vì vậy mọi trạng thái "không chắc" đều kéo `LOAD_EN` xuống. Khi VPACK quá thấp để TLV6710 hoạt động, TPS3808 đã giữ RESET thấp (hợp lệ từ VDD 0,8 V). Biên nhiễu ở mức thấp là 201 mV.

**Cái giá:**
- Cổng USB tốn thêm 0,53 mA qua R_far.
- Pack tốn 18 µA mỗi kênh khi không cắm USB.
- Khi có USB, khoảng 5–9 µA chạy ngược từ S vào VPACK qua R_bias. Mức này nhỏ hơn nhiều so với tải tĩnh của carrier, nhưng box08 nên xác nhận nó không thành dòng nạp khi pack đầy.

### 2.4 Đường 5 V và eFuse

- TPS61023 dùng chia áp 732k/100k theo ví dụ của TI, L 1,0 µH. Tôi tính dòng đỉnh với L −30 % (2,16 A) để chọn Isat ≥ 4,5 A, vì giới hạn valley (2,7 A min, 3,7 A typ, không có max) cộng ripple có thể vượt 4,5 A khi quá tải.
- Chọn TPS259474**L** (latch-off) thay bản A. Datasheet chỉ cho tRST typ 110 ms, không có cận min, nên không chứng minh được khóa ngoài thắng auto-retry. Bản L tự giữ OFF sau lỗi. Mở lại bằng cách đưa `LOAD_EN` xuống (SW1, rút pack hoặc UVLO).
- ILIM 4,22 kΩ cho 0,660–0,918 A, trên ngân sách 0,5 A và dưới khả năng của boost.
- CdVdt 2,2 nF cho tốc độ 0,91 V/ms. Inrush vào tụ DevKit (giả sử 22 µF) chỉ khoảng 20 mA, nên không kích ITIMER.
- OVLO nối GND vì datasheet cấm để hở.

### 2.5 I/O joystick

Có 6 kênh TMUX1511: 5 tín hiệu và 1 kênh cấp nguồn joystick (JOY_VCC). Joystick vì vậy tắt cùng I/O ở trạng thái `10`/`11`, đúng yêu cầu của Codex.

SEL lấy từ `LOAD_EN` qua RC 100 kΩ/1 µF, nên I/O chỉ mở khoảng 0,2 s sau khi rail lên. Tụ 100 nF tại chân ADC theo đúng điều kiện đo INL/DNL của Espressif. Sai số chia sẻ điện tích ≤ 0,4 LSB nếu C lấy mẫu 10 pF, ≤ 4 LSB nếu 100 pF. Firmware chờ ≥ 5 ms sau khi mở mux.

### 2.6 Sạc tay cầm

Giữ MCP73833 theo founder. NTC nối thẳng THERM, không pull-up. Lý do: pull-up lên THERM có thể đưa IC vào LDO test mode khi vắng pack (§5.1.4.1). Cửa sổ sạc ước tính cắt lạnh 0,4–4,3 °C và cắt nóng 40,8–47,9 °C. Cận nóng có thể vượt 45 °C ở góc xấu. Thêm điện trở để kéo cận nóng xuống thì cận lạnh lại tụt về khoảng −16 °C, nên tôi giữ nối thẳng. Cần bảng R‑T Semitec và dải sạc của B15 để đóng mục này.

## 3. Robot

### 3.1 Nút EN_NODE

`EN_NODE` = chia áp 100 kΩ/47 kΩ từ VPACK2, cho 2,02–2,72 V. Có bốn phần tử kéo xuống:
- OUTA UVLO.
- Hai detector VBUS.
- SW1.

Nút này lái EN của TPS54302 (ngưỡng ≤ 1,28 V) và gate N-MOS hysteresis UVLO (VGS ≥ 1,62 V). BZT52C5V6 kẹp nút dưới 7 V nếu R34 hở.

Trước đây có ba mạng EN xung đột: DeepSeek R-2 dùng 100k/47k, R-3 dùng 383k/100k, và R-5 dùng nút analog làm logic. Giờ chỉ còn một nút.

### 3.2 UVLO 6,40–6,60 V

TLV6700 không thể đạt cửa sổ của founder: dải VIT− của nó (−1,9/+1,4 %) rộng hơn cửa sổ (±1,55 %). TLV6710 kênh INA có VIT− 397–403 mV (±0,75 %). Với điện trở 0,1 % và Thevenin 10,5 kΩ, ngưỡng ngắt ra 6,418–6,582 V, nằm trong cửa sổ. Hysteresis dùng cùng kỹ thuật N-MOS như tay cầm, với Rx 2,84 MΩ. Ngưỡng bật lại 6,85–7,15 V.

### 3.3 Detector VBUS robot

Nguyên lý giống tay cầm. VPACK2 có thể tới 8,4 V, vượt abs max 7 V của INB. Vì vậy R_bias tăng lên 470 kΩ và thêm R_sd 100 kΩ từ S xuống GND. Khi đứt dây, S chỉ lên 1,08–1,50 V: vẫn chặn được và an toàn cho chân INB.

### 3.4 Sạc BQ25886

- RICHGSET 1,91 kΩ, vì ICHG = R/3810 Ω/A. Giá trị 7,68 kΩ cũ cho khoảng 2 A.
- **TS: dừng sạc ở 45 °C.** IC mặc định dừng ở 60 °C và chỉ hạ áp từ 45 °C. Tôi chọn dừng cứng ở 0 °C và 45 °C vì sản phẩm cho học sinh và dữ liệu nhiệt của B04 chưa có. Mạng RT1 9,53 kΩ / RT2 2,00 MΩ đạt T1 −0,1…1,5 °C và T5 43,3…45,2 °C. Script đã thử thêm điện trở nối tiếp NTC nhưng không cải thiện, vì hai ngưỡng dừng đã dùng hết bậc tự do.
- **Đánh đổi:** ngưỡng warm (T3) rơi xuống 31–33 °C. Phòng 30–35 °C ở Việt Nam sẽ thường khiến pack chỉ nạp tới 8,0 V, thiếu khoảng 10 % dung lượng. Nếu datasheet B04 cho phép sạc tới 60 °C theo JEITA, có thể quay về mạng TI 5,24k/30,31k để nạp đầy tới 45 °C.
- **CE:** cũ, pull-up CE lên REGN đẩy chân OUT1 của TUSB320 vượt abs max. Mạch mới:
  - CE kéo lên REGN qua 100 kΩ, nên mặc định không sạc.
  - Q2 (N-MOS) chỉ kéo CE xuống khi Q3 (P-MOS, source = V3V3_USB, gate = OUT1) dẫn.
  - Q3 chỉ dẫn khi TUSB320 có nguồn và chủ động kéo OUT1 xuống, tức nguồn báo 1,5 A/3 A.
  - TUSB320 chưa có nguồn, OUT1 high-Z, hay pull-up hở đều cho kết quả không sạc.
  - OUT1 luôn ≤ V3V3_USB, nằm trong abs max.
- **LDO 3,6 V** (TPS7A2036) vì TUSB320 cần VDD ≥ 3,5 V khi nguồn báo 3 A. Bỏ diode chặn để còn đủ headroom ở VBUS 4,4 V. Dòng ngược nhỏ hơn 5 % định mức theo §6.3.7.

### 3.5 Buck 5 V, buck-boost 6 V, motor

- TPS54302: FB 100k/13,3k theo ví dụ của TI, L 10 µH.
- TPS63070 để **power save** (PS/SYNC = VIN). Ở forced PWM, năng lượng phanh được đẩy ngược về VIN (tới 1,1–1,8 A). Khi BMS mở, năng lượng này dồn vào khoảng 20 µF tụ VIN, có thể vượt áp. Ở power save, năng lượng ở lại tụ VM. Phép tính cho 7,38–7,66 V với 220 µF và L 10 mH, dưới 10,8 V của DRV8833 và 12 V abs max VOUT của TPS63070. Tổng tụ VOUT 286 µF nằm trong 15–470 µF cho phép. Cần BT-R4 xác nhận vì datasheet không nói rõ hành vi dòng âm ở power save.
- MOTOR_EN lấy từ V5_R qua chia áp 100k/200k (3,21–3,56 V), AND với GPIO. Mạch chỉ chạy khi buck 5 V đã lên, nghĩa là UVLO đạt và không có USB. Ngõ ra AND lái nSLEEP (VIH 2,5 V) và EN TPS63070. Mất 3V3_DEV hoặc MCU reset thì nSLEEP được kéo xuống.
- Lọc ISEN cho ADC đổi thành 10 kΩ/100 nF (fc 159 Hz) để đọc dòng kẹt. Ripple chopping 50 kHz bị giảm 300 lần. Xung 2 V trong 4 µs chỉ làm ADC lệch 8 mV.

### 3.6 I/O và audio

- 8T245: DIR nối cứng VCCA (cả 8 kênh A→B). OE pull-up lên VCCA, đúng miền datasheet quy định.
- TCA9517A dùng pull-up nội của EN.
- MAX98357A: SD_MODE nối V5_R qua 10 kΩ, nên luôn ở kênh trái. Firmware gửi mono vào kênh trái. Không có BCLK thì IC ở standby. GAIN_SLOT nối GND cho 12 dB. Không thêm pull-down ngoài, vì nó làm sai ngưỡng chọn kênh.

## 4. Ma trận trạng thái tay cầm

| Micro / C | Detector | LOAD_EN | Boost, eFuse, I/O | Sạc |
|---|---|---|---|---|
| 00 | Cả hai cho phép | Cao nếu pack ≥ ngưỡng và SW1 ON | ON. I/O mở sau ~0,2 s | OFF |
| 10 | Micro chặn | Thấp | OFF. eFuse chặn hai chiều | OFF |
| 01 | C chặn | Thấp | OFF | ON (MCP73833) |
| 11 | Cả hai chặn | Thấp | OFF | ON |
| Đứt sense hoặc GND sense | Chặn | Thấp | OFF | — |
| Pack dưới 0,8–1,8 V | TPS3808 RESET thấp | Thấp | OFF | — |
| Lỗi quá dòng eFuse | — | — | eFuse latch OFF tới khi LOAD_EN về thấp | — |

## 5. Dòng tĩnh khi lưu kho

Tay cầm khoảng 150 µA khi SW1 OFF. Gồm: chia áp UVLO 52 µA, pull-up LOAD_EN 42 µA khi bị kéo xuống, 2×18 µA bias detector, và IDD các IC. Robot ở mức tương tự. Với pack 2 Ah, mức này rút khoảng 0,1 Ah mỗi tháng.

Để lâu nhiều tháng sau khi đã cutoff, pack có thể xả sâu. Đề xuất ghi trong hướng dẫn: "rút pack khi cất lâu". Một phương án khác là cho SW1 cắt cả VPACK của mạch giám sát, nhưng việc này cần box08 xét lại.

## 6. Những gì chưa đóng

- **ISEN DRV8833 FAIL:** khi ngắn mạch ngõ ra–ngõ ra, chân xISEN lên 1,25–2,07 V, vượt abs max 0,5 V. Nguyên nhân là R1 0,62 Ω đã được founder chốt. Có footprint Schottky DNP và câu hỏi cần gửi TI.
- **Phụ thuộc NCC:** NTC Semitec, dải sạc B15/B04, hồ sơ cell/PCM, nội trở pack.
- **Phụ thuộc bench:** BT-H2 (V5, sụt áp), BT-H3 (dòng, inrush), BT-H4 (chuyển trạng thái, rò), BT-R1a (L motor), BT-R4 (đỉnh VM).
- **Cần box08 duyệt:** mọi dòng "Đề xuất" trong BOM, đặc biệt kiến trúc detector, nút wired-AND, TLV6710, N-MOS hysteresis, TPS259474L, TPS7A2036, power save cho TPS63070.
- **Chưa tra datasheet:** SN74LVC2T45 (SCES516N), mã đặt hàng TLV6710DDCR, LED, cuộn cảm, tụ polymer, connector.

Mọi giá trị chỉ dùng cho KiCad sau khi r7 được duyệt đúng hash và HQ cấp lease.

## 7. Quyết định founder ngày 07/11/2026

- **xISEN:** chấp nhận rủi ro trên mẫu đầu. Để footprint Schottky D3/D4 (DNP) song song điện trở sense. Thử ngắn mạch có kiểm soát (BT-ISEN) và hỏi TI trước khi sản xuất loạt. Lý do không lắp ngay: dòng thuận của Schottky ở 0,24 V làm lệch ngưỡng trip.
- **Connector pack:** tay cầm JST PH 2,0 mm 2 chân (theo listing B15), robot JST XH 2,54 mm 2 chân. Phải kiểm cực tính khi có pack thật.
- **MOSFET:** SOT-23 để hàn tay. N-MOS DMN2075U-7 (VGS(th) 0,4–1,0 V, VGSS ±8 V, IDSS ≤ 100 nA, RDS ≤ 45 mΩ @2,5 V) thay CSD13381F4. Gate thấp nhất là 1,62 V (UVLO robot), vẫn trên VGS(th) max. P-MOS DMG2305UX-7 (−0,5…−0,9 V, ±8 V).
- **Pin map GPIO** chốt trong [kicad-input-spec-r7.md](kicad-input-spec-r7.md). Tránh chân strap (0, 2, 5, 12, 15), GPIO14 (PWM khi boot) và UART nạp. Analog chỉ dùng ADC1, vì ADC2 không dùng được khi bật Wi‑Fi. Các chân điều khiển motor/amp có pull mặc định OFF khi boot.
- **TUSB320:** VBUS_DET qua 910 kΩ lên VBUS (datasheet yêu cầu 900 kΩ, abs max chân 4 V). EN_N nối GND.

## 8. Sửa theo review ngày 07/11/2026

| Phát hiện | Sửa | Bằng chứng |
|---|---|---|
| RC 100 kΩ/1 µF trên SEL giữ joystick/nút nối ESP32 khoảng 0,2 s sau khi ngắt | Bỏ tụ. SEL lấy từ LOAD_EN qua 10 kΩ, ngắt trong cỡ µs (cộng tpd detector 9,9 µs). Khi bật, mux chỉ dẫn khi V3V3_DEV hợp lệ. JOY_VCC cũng đi qua mux nên không có cấp ngược lúc ramp. | `d_sel_v2`; SCDS390B §5.5 |
| Chưa có phần cứng bảo đảm tải đã ngắt trước khi VBUS cấp cho ESP32 | Để hở jumper VBUS của interposer eLabGuy Rev. 1.1. Thêm eFuse pass U9 (TPS259474L) từ VBUS_PROG sang VBUS_PASS. Q5 (gate = LOAD_EN) giữ EN_PASS thấp khi carrier đang chạy, nên pass không thể bật trước khi carrier tắt. Sau khi LOAD_EN xuống, carrier tắt trong ≤ 64 µs, còn pass cần ≥ 2,9 ms (RC trên EN_PASS) cộng tD,ON ≥ 0,09 ms. Mất pin: LOAD_EN = 0, pass bật, nạp DevKit được khi vắng pack. Đứt sense: detector chặn, carrier OFF, pass ON. Cả hai eFuse có RCB 1 µs. | `d_pass`; SLVSFC9C §6.5–6.6 |
| ILIM quy về pin 1,29–1,79 A | RILM 4,22 kΩ → 5,11 kΩ: ILIM 0,545–0,758 A, dòng pin 1,06–1,48 A @3,20 V, η 0,8. ILIM min vẫn ≥ 0,5 A cho ESP32. Quá ILIM lâu hơn tITIMER thì latch OFF. | `d_ilim_v2` |
| Nguồn sạc USB được lấy bao nhiêu | Tay cầm chỉ có Rd 5,1 kΩ, nên nguồn chỉ được coi là Default: 500 mA với USB 2.0 (TI SLLSEQ8D Table 2). Tổng cực xấu 0,466 A. | `h8_usb` |

**Còn mở sau review:**
- **Lệnh bật mới sau khi rút USB.** Khi USB được rút và pack hợp lệ, LOAD_EN tự lên lại nếu SW1 đang ON, nên carrier tự chạy. Ma trận Codex yêu cầu phải có lệnh bật mới. Hai cách: (a) SW1 là nút nhấn kết hợp latch (cần chọn IC latch có datasheet cho dải VPACK 3,2–4,2 V, vì 74LVC không có thông số ở 3,6–4,5 V); (b) firmware chỉ nhận đã bật sau một lần nhấn. Box02/box08 chọn trước khi chốt schematic khối LOAD_EN.
- **Đặc tuyến bảo vệ của LK37478** (dòng theo thời lượng xung) và ngưỡng NTC theo pack: chờ NCC. PTC F1 phải có dòng giữ ≥ 1,5 A (dòng pin 1,48 A ở ILIM max) và dòng cắt dưới ngưỡng OC của PCM.
- **Robot** cần cùng cấu trúc pass VBUS khi làm robot, thay LM66100 trong r6.

## 9. Latch phần cứng và sửa theo review robot (07/11/2026)

### 9.1 Latch "lệnh bật mới" cho LOAD_EN (founder chọn latch phần cứng)

- Pull-up duy nhất của LOAD_EN (R10, 100 kΩ) được cấp qua P-MOS Q6 (DMG2305UX-7). Gate Q6 (LATCH_G) kéo lên VPACK bằng R57 100 kΩ, nên mặc định Q6 tắt.
- **Bật:** nhấn SW4 kéo LATCH_G về GND qua 1 kΩ, VGS Q6 −3,17…−4,16 V. Nếu không có veto, LOAD_EN lên 2,97–3,90 V. Q7 (DMN2075U-7, gate = LOAD_EN qua 1M/1M, 1,47–1,97 V) dẫn và giữ LATCH_G thấp sau khi nhả nút.
- **Xóa quyền:** bất kỳ veto nào (TPS3808 RESET, detector Micro/USB-C, SW1 OFF) kéo LOAD_EN ≤ 0,4 V. Gate Q7 ≤ 0,2 V, dưới VGS(th) min 0,4 V, nên Q7 tắt. R57 kéo LATCH_G lên và Q6 tắt sau ≤ 0,1–0,3 ms (Ciss giả định 0,5–1,5 nF). Khi veto hết, LOAD_EN vẫn thấp cho tới lần nhấn SW4 kế tiếp.
- **Cắm pack hoặc brownout:** LATCH_G = VPACK, nên OFF. Nhấn SW4 khi còn veto thì nhả nút ra vẫn OFF.
- Không đặt tụ trên LATCH_G. Một tụ 100 nF sẽ làm Q6 nhả chậm khoảng 150 ms, và các veto ngắn hơn không xóa được quyền bật.
- Lợi phụ: khi OFF, R10 không còn nguồn, tiết kiệm 42 µA dòng tĩnh.
- Ma trận mục 4 đổi trạng thái `00`: chỉ ON sau khi nhấn SW4, với pack ≥ ngưỡng, không có USB và SW1 ON.
- Robot cần latch tương tự cho EN_NODE. VPACK2 tới 8,4 V vượt VGSS ±8 V của DMG2305UX-7, nên gate Q6 robot phải có chia áp. Làm ở pha robot.

### 9.2 Sửa theo review robot

| Mục | Review | Xử lý |
|---|---|---|
| R-1 cuộn cảm | Input ghi L giữa SW–SYS, Figure 20 đặt L giữa PMID–SW | Nhận sai. L2 đặt PMID–SW_CHG (BQ25886 boost từ PMID lên SYS). |
| R-1 CE | Cần chứng minh OFF qua ramp và mất attach | CE kéo lên REGN 100 kΩ (0,9 × REGN ≥ 4,23 V > VIH 1,3 V, thắng pull-down nội 900 kΩ). Q2 chỉ dẫn khi Q3 dẫn. Q3 cần V3V3_USB có nguồn và OUT1 thấp; ở trạng thái unattached và khi mất attach, OUT1 = H (Table 3). Còn mở: đo thực tế qua ramp (BT-R5). |
| R-1 NTC | Đối chiếu B04 | Chờ NCC. |
| R-2/R-5 | V5R_OK có thể còn HIGH do tụ sau veto | Đổi U9 thành SN74LVC1G11 (AND3). Thêm ngõ A = EN_NODE, nên veto kéo MOTOR_EN xuống ngay. R34 47k → 68k để EN_NODE 2,56–3,44 V có biên với VIH 2,0 V. nSLEEP ≥ 3,03 V > 2,5 V (VOH = VCC − 0,1 V @ −100 µA, SCES487I). Rò, trễ và POR của TLV6710: đo bench. |
| R-6/R-7 | ISEN, cơ năng, ESR, PS/SYNC HIGH vẫn có thể vào PWM | Đồng ý vẫn OPEN. Giữ footprint Schottky DNP. Đo BT-ISEN và BT-R4 trước khi chốt PS/SYNC; nếu đo thấy đường hồi năng lượng, cân nhắc thêm footprint kẹp/brake. |
| R-8 | Điều kiện 3,5 V chỉ áp dụng khi TUSB320 là DFP | Nhận. Quay lại TPS7A2033PDBVR. |

## 10. Chốt nốt (07/11/2026)

### 10.1 Đã chốt thêm bằng thiết kế

| Mục | Cách chốt | Bằng chứng |
|---|---|---|
| Latch robot | Q6R/Q7R/SW4R giống tay cầm. Gate Q6R lái qua chia áp 100k/100k nên VGS = −VPACK2/2 = −3,12…−4,20 V, trong VGSS ±8 V. Q7R gate = EN_NODE 2,57–3,44 V. | `d_robot_v2`; DS36196, DS31837 |
| Cấp DevKit robot | Thay LM66100 bằng TPS259474L (U16), EN từ EN_NODE, ILIM 5,11 kΩ. Chặn hai chiều giống tay cầm. | SLVSFC9C |
| Pass VBUS robot | U17 + Q8 (gate = EN_NODE) giống U9/Q5 tay cầm. Jumper VBUS interposer hở. | `d_pass` |
| CE qua ramp | Q3 → R63 10 kΩ → gate Q2, C31 1 µF + R32 100 kΩ xuống GND. Sạc chỉ bật 3,6–3,8 ms sau khi OUT1 thấp liên tục. Xung OUT1 < 1,3 ms không bật được. V3V3_USB chưa lên hoặc OUT1 = H thì CE = 0,9 × REGN, tức không sạc. | `d_robot_v2`; SLLSEQ8D Table 3 |
| PS/SYNC | Lắp R66 0 Ω lên VIN (power save), chừa R67 0 Ω xuống GND (DNP). BT-R4 chọn chế độ mà không phải làm lại PCB. | SLVSC58B §8.4.5 |
| xISEN | Founder chấp nhận rủi ro mẫu đầu, footprint Schottky DNP, BT-ISEN. | quyết định 07/11 |
| TLV6710 rò, trễ, POR | IIN ±25 nA đã tính trong V_fall. tpd 9,9 µs typ. Dưới VDD 1,8 V, EN_NODE = 0,405 × VPACK2 < 1,1 V (ngưỡng falling EN TPS54302) nên buck tắt. Latch cũng đã nhả. | SNVSAV4B §7.5; SLVSDG6C §6.5 |

### 10.2 Không tính ra được, dùng cận an toàn

Hai mục dưới đây cần dữ liệu không thể suy ra bằng tính toán. PCB mẫu đầu vẫn làm được, vì footprint không đổi; chỉ giá trị linh kiện có thể phải đổi.

| Mục | Cận đang dùng | Cần gì để đóng | Ai |
|---|---|---|---|
| NTC B15/B04 | Tay cầm cắt 0,4–4,3 °C và 40,8–47,9 °C. Robot dừng −0,1…1,5 °C và 43,3…45,2 °C. Bảng R‑T Semitec ngoại suy từ hai điểm TI. | Datasheet Semitec 103AT-2, dải nhiệt sạc của B15/B04. Nếu pack có NTC khác, đổi RT1/RT2 theo `d_r1`. | Box03 / NCC |
| PCM LK37478 | Dòng pin ≤ 1,48 A ở ILIM max; PTC giữ ≥ 1,5 A. | Ngưỡng OC/thời gian của PCM. Nếu OC < 1,5 A thì giảm RILM hoặc chọn PTC khác (không đổi footprint). | Box03 / NCC |

Các mục chỉ đóng được bằng đo: BT-H2, BT-H3, BT-H4, BT-R1a, BT-R4, BT-R5, BT-ISEN. Tất cả đo trên mẫu đầu.

## 11. Delta theo review 06/11

Xem [delta-handset-2026-11-07.md](delta-handset-2026-11-07.md). File đó thay các giá trị cũ ở §8–§9 (R10 100k, chia áp Q7 1M/1M, SW4 kéo trực tiếp LATCH_G, RILM U9 5,11 kΩ, PGTH→GND).
