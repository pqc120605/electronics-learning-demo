# Bảng thông số trích xuất từ datasheet

- Nguồn 1: `docs/research/downloads/250832.pdf` — Jauch LI18650JC-26 1s1p (Jauch No. 250832), 3 trang.
- Nguồn 2: `docs/research/downloads/ti-tps25947.pdf` — TI TPS25947xx eFuse (SLVSFC9C, rev. 5/2026), 75 trang; tập trung biến thể **TPS259474L** (Adjustable OVLO, Circuit Breaker, Latch-Off, PG/PGTH).
- Quy ước: ô không tìm thấy trong tài liệu ghi "không có trong tài liệu". Số trang là số trang in trên tài liệu (trùng số trang PDF trong cả hai file).

---

## 1. Pin Jauch 250832 (battery pack 1s1p, cell INR18650JC-26)

### 1.1. Thông số chung của pack

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Nominal Voltage | — | — | 3.6 | — | V | — | 2 |
| Typ. Capacity | — | — | 2600 | — | mAh | 0.2C / 2.75V discharge | 2 |
| Rated Capacity | — | — | 2500 | — | mAh | 0.2C / 2.75V discharge | 2 |
| Weight | — | — | Approx. 50 | — | g | — | 2 |
| Internal Resistance (nội trở) | — | không có trong tài liệu | | | | | — |
| Life Expectancy | — | — | 500 cycles ~ 80% of capacity | — | cycles | 0.2C/0.2C @ 25°C | 2 |
| Delivery State of Charge | — | — | Max 30% by air; Max 60% by sea | — | % | — | 2 |

### 1.2. Charging Characteristics (per battery pack)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Charge Voltage | — | — | — | 4.2 | V | — | 2 |
| Standard Current (sạc) | — | — | 1250 | — | mA | — | 2 |
| Max. Current (sạc) | — | — | — | 2500 | mA | — | 2 |
| Operating Temperature (sạc) | — | 0 | — | +45 | °C | — | 2 |

### 1.3. Discharging Characteristics (per battery pack)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Cut-off Voltage (điện áp cắt xả) | — | — | 2.80 | — | V | — | 2 |
| Standard Current (xả liên tục chuẩn) | — | — | 1250 | — | mA | — | 2 |
| Max. Current (dòng xả liên tục tối đa) | — | — | — | 3000 | mA | — | 2 |
| Peak / pulse discharge current (dòng xả đỉnh) | — | không có trong tài liệu | | | | | — |
| Operating Temperature (xả) | — | −20 | — | +60 | °C | — | 2 |
| Recommended Storage Temperature | — | −20 | — | +25 | °C | max. 3 month | 2 |

### 1.4. PCM Parameter (mạch bảo vệ pack)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Overcharge Det. Voltage | — | 4.23 | 4.28 | 4.33 | V | datasheet ghi "4.28 ± 0.05 V" | 2 |
| Overcharge Rel. Voltage | — | 4.03 | 4.08 | 4.13 | V | datasheet ghi "4.08 ± 0.05 V" | 2 |
| Overdischarge Det. Voltage | — | 2.70 | 2.80 | 2.90 | V | datasheet ghi "2.80 ± 0.10 V" | 2 |
| Overdischarge Rel. Voltage | — | 2.70 | 2.80 | 2.90 | V | datasheet ghi "2.80 ± 0.10 V" | 2 |
| Overcurrent Range | — | 6.0 | — | 12.0 | A | — | 2 |
| Second protection | — | — | 7.0 | — | A | fast acting fuse | 2 |
| NTC | — | không có trong tài liệu (chỉ ghi nhãn "NTC" không kèm giá trị) | | | | | 2 |

> Lưu ý: tài liệu trình bày dạng "giá trị ± dung sai"; các cột Min/Max ở bảng 1.4 được tính trực tiếp từ giá trị danh định ± dung sai ghi trong tài liệu (không phải tự ước lượng).

---

## 2. eFuse TI TPS259474L (thuộc họ TPS25947xx)

Điều kiện thử chung của toàn bộ mục Electrical Characteristics (trừ khi ghi khác): −40°C ≤ TJ ≤ 125°C, VIN = 12V, OUT = Open, VEN/UVLO = 2V, VOVLO = 0V (cho TPS259470x/4x), RILM = 549Ω, dVdT = Open, ITIMER = Open, PGTH = Open, PG = Open; mọi điện áp quy chiếu GND. (trang 8–11)

### 2.1. Điện áp làm việc và giới hạn tuyệt đối

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Input Voltage Range (khuyến nghị) | VIN | 2.7 | — | 23 | V | Recommended Operating Conditions; với TPS259472x phải giới hạn theo ngưỡng OVC | 8 |
| Maximum Input Voltage Range (abs. max) | VIN | max(−15, VOUT − 21) | — | 28 | V | −40°C ≤ TJ ≤ 125°C | 7 |
| Maximum Input Voltage Range (abs. max) | VIN | max(−15, VOUT − 22) | — | 28 | V | −10°C ≤ TJ ≤ 125°C | 7 |
| Output Voltage Range (khuyến nghị) | VOUT | — | — | min(23, VIN + 20) | V | — | 8 |
| Continuous Switch Current (khuyến nghị) | IMAX | — | — | 5.5 | A | TJ ≤ 125°C, IN to OUT | 8 |
| Maximum Continuous Switch Current (abs. max) | IMAX | — | Internally Limited | — | A | IN to OUT | 7 |
| Junction temperature (khuyến nghị) | TJ | −40 | — | 125 | °C | — | 8 |
| Storage temperature | TSTG | −65 | — | 150 | °C | — | 7 |

### 2.2. Nội trở dẫn (ON Resistance IN–OUT)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| On-resistance | RON | — | 28.2 | — | mΩ | VIN = 12V, IOUT = 3A, TJ = 25°C | 9 |
| On-resistance | RON | — | — | 45 | mΩ | 2.7 ≤ VIN ≤ 23V, IOUT = 3A, −40°C ≤ TJ ≤ 125°C | 9 |

> ⚠️ Mâu thuẫn trong tài liệu: trang 1 (Features) ghi "RON = 28.3mΩ (typical)" và tiêu đề ghi "28mΩ", trong khi bảng Electrical Characteristics trang 9 ghi 28.2 mΩ (typ) tại VIN = 12V, IOUT = 3A, TJ = 25°C. Ghi nhận cả hai.

### 2.3. Ngưỡng UVLO (EN/UVLO) — dùng cho TPS259474L

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| UVLO Rising threshold | VUVLO(R) | 1.183 | 1.20 | 1.223 | V | điều kiện chung mục 6.5 | 9 |
| UVLO Falling threshold | VUVLO(F) | 1.076 | 1.09 | 1.116 | V | điều kiện chung mục 6.5 | 9 |
| EN/UVLO Falling Threshold for lowest shutdown current | VSD(F) | 0.45 | — | 0.74 | V | — | 9 |
| EN/UVLO leakage current | IENLKG | −0.1 | — | 0.1 | µA | — | 9 |
| IN Supply UVP Rising threshold | VUVP(R) | 2.44 | 2.53 | 2.64 | V | — | 8 |
| IN Supply UVP Falling threshold | VUVP(F) | 2.35 | 2.42 | 2.55 | V | — | 8 |
| Enable Pin Voltage Range (khuyến nghị) | VEN/UVLO | — | — | 5 | V | VIN < 5V có thể kéo thẳng lên IN; VIN > 5V hoặc có reverse polarity: khuyến nghị trở kéo ≥ 350kΩ | 8 |

### 2.4. Ngưỡng OVLO / OVP — TPS259474L dùng Adjustable OVLO

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| OVLO Rising threshold | VOV(R) | 1.183 | 1.20 | 1.223 | V | áp dụng TPS259470x/4x | 9 |
| OVLO Falling threshold | VOV(F) | 1.076 | 1.09 | 1.116 | V | áp dụng TPS259470x/4x | 9 |
| OVLO pin leakage current | IOVLKG | −0.1 | — | 0.1 | µA | 0.5V < VOVLO < 1.5V | 9 |
| OVLO Pin Voltage Range (khuyến nghị) | VOVLO | 0.5 | — | 1.5 | V | TPS259470x/4x | 8 |
| Overvoltage lock-out response time | tOVLO | — | 1.2 | — | µs | VOVLO > VOV(R) to VOUT↓ (TPS259470x/4x) | 11 |
| Overvoltage Clamp Threshold (OVC, 3.8V) | VOVC | 3.65 | 3.88 | 4.1 | V | OVCSEL = Shorted to GND; **chỉ TPS259472x, không áp dụng cho 474L** | 9 |
| Overvoltage Clamp Threshold (OVC, 5.7V) | VOVC | 5.25 | 5.74 | 6.2 | V | OVCSEL = Open; chỉ TPS259472x | 9 |
| Overvoltage Clamp Threshold (OVC, 13.8V) | VOVC | 13.2 | 13.85 | 14.5 | V | OVCSEL = 390kΩ to GND; chỉ TPS259472x | 9 |

> TPS259474L thuộc nhóm "Adjustable OVLO, Circuit Breaker, Latch-Off" theo Device Comparison Table (trang 4); các ngưỡng OVC pin-selectable chỉ thuộc biến thể TPS259472x.

### 2.5. Bảo vệ quá dòng / dòng giới hạn (Overcurrent Protection)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Overcurrent Threshold | ILIM | 0.425 | 0.500 | 0.575 | A | RILM = 6.65kΩ | 9 |
| Overcurrent Threshold | ILIM | 0.850 | 1.007 | 1.150 | A | RILM = 3.32kΩ | 9 |
| Overcurrent Threshold | ILIM | 1.800 | 2.028 | 2.200 | A | RILM = 1.65kΩ | 9 |
| Overcurrent Threshold | ILIM | 3.960 | 4.452 | 4.840 | A | RILM = 750Ω | 9 |
| Overcurrent Threshold | ILIM | 5.400 | 6.068 | 6.600 | A | RILM = 549Ω | 9 |
| Dải ILIM điều chỉnh được | ILIM | 0.5 | — | 6 | A | Features: "Adjustable threshold (ILIM) 0.5A to 6A"; độ chính xác ±10% với ILIM > 1A | 1 |
| Circuit Breaker Threshold (single point failure) | IFLT | — | 0.1 | — | A | ILM Pin Open | 9 |
| Circuit Breaker Threshold (single point failure) | IFLT | — | 1.1 | 2.1 | A | ILM Pin Shorted to GND | 9 |
| Scalable Fast Trip Threshold (ISC : ILIM ratio) | ISCGain | — | 201 | — | % | — | 10 |
| Fixed Fast-trip current threshold | IFT | — | 22.2 | — | A | — | 10 |
| VOUT threshold to exit Current Limit Foldback | VFB | — | 1.9 | — | V | — | 10 |
| Circuit-Breaker response time | tCB | — | 2 | — | µs | IOUT > 1.2 × ILIM and ITIMER expired to IOUT↓ (TPS259474x) | 11 |
| Scalable fast-trip response time | tSC | — | 500 | — | ns | IOUT > 3 × ILIM to IOUT↓ | 11 |
| Fixed fast-trip response time | tFT | — | 500 | — | ns | IOUT > IFT to IOUT↓ | 11 |
| ILM Pin Resistance (khuyến nghị) | RILM | 549 | — | 6650 | Ω | — | 8 |

### 2.6. Reverse Current Blocking (IN–OUT)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Forward regulation voltage | VFWD | — | 4.7 | 16.9 | mV | VIN − VOUT, IOUT = 10mA | 10 |
| Threshold for fast BFET turn off (enter RCB) | VREVTH | −36.45 | −29.3 | −22.3 | mV | VIN − VOUT | 10 |
| Threshold for fast BFET turn on (exit RCB) | VFWDTH | 83 | 104.1 | 125 | mV | VIN − VOUT | 10 |
| Reverse leakage current | IREVLKG | — | 10.1 | — | µA | (VOUT − VIN) = 21.5V | 10 |
| Reverse Current Blocking comparator response time | tRCB | — | 1 | — | µs | (VOUT − VIN) > 1.3 × VREVTH to BFET OFF | 11 |
| Reverse Current Blocking recovery time | tSWRCB | — | 50 | — | µs | (VIN − VOUT) > VFWDTH to VOUT↑ | 11 |

### 2.7. Bảo vệ quá nhiệt (Overtemperature Protection)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Thermal Shutdown Rising Threshold | TSD | — | 154 | — | °C | TJ↑ | 10 |
| Thermal Shutdown Hysteresis | TSDHYS | — | 10 | — | °C | TJ↓ | 10 |

### 2.8. Dòng tiêu thụ và thông số phụ (TPS259474x)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| IN Supply Quiescent Current (TPS259474x) | IQ(ON) | — | 428 | 610 | µA | điều kiện chung mục 6.5 | 9 |
| IN Supply Shutdown Current | ISD | — | 4.4 | 28.7 | µA | VEN < VSD(F) | 9 |
| Analog Load Current Monitor Gain | GIMON | 165 | 182 | 200 | µA/A | IOUT = 0.5A đến 5.5A, IOUT < ILIM | 10 |
| dVdt Pin Charging Current | IdVdt | 0.81 | 2.21 | 3.82 | µA | — | 11 |
| PGTH Rising threshold (TPS259472x/4x) | VPGTH(R) | 1.183 | 1.20 | 1.223 | V | — | 10 |
| PGTH Falling threshold (TPS259472x/4x) | VPGTH(F) | 1.076 | 1.09 | 1.116 | V | — | 10 |

### 2.9. Nhiệt (Thermal Information, package RPW/QFN-10)

| Tham số | Ký hiệu | Min | Typ | Max | Đơn vị | Điều kiện thử | Trang |
|---|---|---|---|---|---|---|---|
| Junction-to-ambient thermal resistance | RθJA | — | 41.7 | — | °C/W | PCB 4 lớp tùy chỉnh (2s2p), 8 thermal via dưới IC | 8 |
| Junction-to-ambient thermal resistance | RθJA | — | 74.5 | — | °C/W | PCB 4 lớp JEDEC (2s2p), không thermal via | 8 |

---

## 3. Các mục ưu tiên KHÔNG tìm thấy trong tài liệu

| Mục yêu cầu | File | Kết quả |
|---|---|---|
| Nội trở cell/pack (Internal Resistance / IR / impedance) | 250832.pdf | Không có trong tài liệu |
| Dòng xả đỉnh (peak/pulse discharge current) | 250832.pdf | Không có trong tài liệu (chỉ có Max. Current xả 3000 mA và Overcurrent Range PCM 6.0–12.0 A, trang 2) |
| Điện áp cắt sạc/điện áp danh định cell (ngoài mức pack) | 250832.pdf | Chỉ có dữ liệu mức pack (trang 2); không có bảng riêng cho cell INR18650JC-26 |
| Dung lượng/đặc tuyến chi tiết của NTC | 250832.pdf | Không có trong tài liệu (chỉ xuất hiện nhãn "NTC" trang 2, không giá trị) |
