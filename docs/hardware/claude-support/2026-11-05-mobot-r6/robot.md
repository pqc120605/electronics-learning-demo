# MoBot V2 r6 · Robot (2S, DRV8833) · R1–R6

05/11/2026 · Claude hỗ trợ phần cứng, chỉ ghi gói bàn giao. Datasheet truy cập ngày 05/11/2026. Làm sau tay cầm theo thứ tự founder yêu cầu.

Ký hiệu nguồn repo:
- `r6` = `docs/hardware/mobot-v2-config-2026-11-05-r6.md`
- `ifp` = `docs/hardware/mobot-v2-r6-interface-review-packet.md`
- `rr` = `docs/hardware/mobot-v2-r6-readiness-review.md`
- `bom` = `docs/hardware/mobot-v2-bom-review-2026-11-05-r1.csv`

Datasheet:
- [DRV8833 SLVSAR1E](https://www.ti.com/lit/ds/symlink/drv8833.pdf)
- [TPS63070 SLVSC58B](https://www.ti.com/lit/ds/symlink/tps63070.pdf)
- [TPS54302 SLVSDG6C](https://www.ti.com/lit/ds/symlink/tps54302.pdf)
- [BQ25886 SLUSD88A](https://www.ti.com/lit/ds/symlink/bq25886.pdf)
- [TUSB320LAI SLLSEQ8D](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf)
- [SN74LVC8T245 SCES584D](https://www.ti.com/lit/ds/symlink/sn74lvc8t245.pdf), [SN74LVC2T45 SCES516N](https://www.ti.com/lit/ds/symlink/sn74lvc2t45.pdf), [TCA9517A SCPS245E](https://www.ti.com/lit/ds/symlink/tca9517a.pdf)
- [Pololu #992 specs](https://www.pololu.com/product/992/specs)

---

## R1 · Giới hạn dòng DRV8833 · **CẦN FOUNDER QUYẾT**

### Hiện trạng

- r6: giới hạn danh nghĩa **0,40 A/kênh**, trần tính cả sai số **0,45 A/kênh** (`r6:9`).
- Box08: với 0,50 Ω, trip có thể lên 0,48 A trước dung sai điện trở và blanking (`rr:13`).
- Motor Pololu #992: dòng kẹt **0,36 A tại 6 V**, là giá trị ngoại suy lý thuyết; Pololu ghi kẹt có thể làm hỏng motor hoặc hộp số. Tốc độ không tải 130 rpm typ ±20 %, dòng không tải 40 mA typ ±50 %. Không công bố điện trở cuộn dây, độ tự cảm, dung sai dòng kẹt.

### Truy nguyên nhân (systematic debugging)

**Triệu chứng:** 0,50 Ω cho trip max 0,48 A > 0,45 A.

**Dữ kiện DRV8833 SLVSAR1E:**
- `ICHOP = VTRIP / RISENSE` (§7.3.3 Equation 1; §8.2.2 Equation 2).
- VTRIP: **160 / 200 / 240 mV** (min/typ/max), §6.5 Current control.
- tBLANK: **3,75 µs**; trong thời gian này comparator bỏ qua ISEN (§7.3.3).
- Tần số PWM nội 50 kHz (§6.5); khi trip, cầu H tắt tới đầu chu kỳ PWM kế (§7.3.3).

**Giả thuyết 1:** nguyên nhân chính là sai số điện trở sense. **Bác bỏ.** Với ±1 %, điện trở chỉ đóng góp ±1 %; VTRIP đóng góp −20 %/+20 %.

**Giả thuyết 2:** nguyên nhân là dải VTRIP của IC. **Xác nhận.** Tỉ số max/danh nghĩa:

`ITRIP,max / ITRIP,nom = (240 / 200) × 1 / 0,99 = 1,212`

Muốn ITRIP,max ≤ 0,45 A thì ITRIP,nom ≤ 0,45 / 1,212 = **0,371 A**. **Mục tiêu r6 "0,40 A danh nghĩa và 0,45 A max" không thể đạt chỉ bằng điện trở sense với DRV8833**, với mọi giá trị điện trở. Đây là giới hạn của IC, không phải lỗi chọn linh kiện.

**Yếu tố thứ hai: overshoot trong blanking.** Trong 3,75 µs, dòng tăng thêm `ΔI = (dI/dt) × tBLANK`, với `dI/dt ≤ VM / L` khi motor đứng yên (không có sức phản điện động). Độ tự cảm motor: [THIẾU: L cuộn dây #992; Pololu không công bố; đo bằng LCR, BT-R1]. Điều kiện để overshoot nằm trong biên còn lại:

`L_min = VM,max × tBLANK / (0,45 − ITRIP,max)`

### Tính lại điện trở sense

`ITRIP,min = 0,160 / (R × 1,01)`, `ITRIP,nom = 0,200 / R`, `ITRIP,max = 0,240 / (R × 0,99)`. Biên = 0,45 − ITRIP,max. L_min tính với VM,max = 6,15 V (6 V +2,5 %; [cần box02 xác nhận sai số đầu ra TPS63070 theo chia áp FB]).

| R (±1 %) | Dãy | ITRIP min | nom | max | Biên tới 0,45 A | L_min cho overshoot | P sense ở 0,45 A |
|---|---|---|---|---|---|---|---|
| 0,50 Ω | E24 | 0,317 A | 0,400 A | **0,485 A** | −35 mA (trượt) | — | 0,101 W |
| 0,56 Ω | E24 | 0,283 A | 0,357 A | 0,433 A | 17 mA | 1,36 mH | 0,113 W |
| 0,576 Ω | E96 | 0,275 A | 0,347 A | 0,421 A | 29 mA | 0,80 mH | 0,117 W |
| **0,62 Ω** | **E24** | **0,256 A** | **0,323 A** | **0,391 A** | **59 mA** | **0,39 mH** | **0,126 W** |
| 0,68 Ω | E24 | 0,233 A | 0,294 A | 0,357 A | 93 mA | 0,25 mH | 0,138 W |

Cách tính L_min, ví dụ 0,62 Ω: `6,15 V × 3,75 µs / 0,059 A = 0,39 mH`.

### Phát hiện phụ cần box02 xác nhận

ISEN có abs max **0,5 V** (§6.1). Trong lúc chopping bình thường, ISEN ≤ 0,240 V cộng overshoot, an toàn. Khi ngắn mạch đầu ra, OCP analog cho phép dòng tới **IOCP 2–3,3 A** trong tDEG 4 µs (§6.5). Ở 2 A, ISEN = 2 × 0,62 = **1,24 V**, vượt abs max. Với mọi R > 0,25 Ω đều có điều này. Datasheet không nói rõ ISEN có chịu được quá độ này không. [cần box02/box08 xác nhận với TI, hoặc thêm phương án bảo vệ ISEN; chưa phải finding đã kiểm chứng].

### Phương án

| | A. Hạ mục tiêu: 0,62 Ω | B. Giữ 0,40 A, thêm vòng giới hạn ngoài | C. Đổi driver có giới hạn dòng chính xác hơn |
|---|---|---|---|
| ITRIP | 0,256–0,391 A | Ngoài: chính xác hơn; DRV8833 làm lớp dự phòng | [THIẾU: box02 chọn IC] |
| Đạt trần 0,45 A | Có, biên 59 mA nếu L ≥ 0,39 mH | Tùy thiết kế (`ifp:30`) | Tùy IC |
| Mô-men khởi động | ITRIP min 0,256 A < dòng kẹt 0,36 A typ: một số mẫu sẽ bị chopping khi khởi động/kẹt, mô-men giảm | Giữ 0,40 A | — |
| Linh kiện thêm | 2 điện trở | Op-amp/comparator mỗi kênh, quyền ngắt cầu H | IC mới, footprint mới |
| Duyệt revision | Có (đổi mục tiêu 0,40 A, `ifp:34`) | Không đổi mục tiêu; thêm mạch | Có (đổi B03) |

### Đề xuất

**A: RISEN = 0,62 Ω ±1 %, 0,25 W, 0805 hoặc 1206**, mỗi kênh một điện trở (2 cái). Lý do: biên 59 mA lớn nhất trong các giá trị E24 còn giữ ITRIP min trên 0,25 A; yêu cầu L motor thấp nhất. Mục tiêu danh nghĩa đổi từ 0,40 A sang 0,32 A, cần founder duyệt revision. Thay thế: 0,576 Ω E96 (ITRIP nom 0,347 A, gần phương án r7 trong `ifp:34`) nếu đo L ≥ 0,80 mH và muốn giữ mô-men.

Mã gợi ý: [TBD: R1, box03 chọn MPN điện trở 0,62 Ω ±1 % 0,25 W, TCR ≤ 100 ppm/°C]. Mua ở VN: [chưa kiểm chứng].

### Rủi ro còn lại

- Chưa biết L motor, nên chưa chứng minh overshoot.
- Câu hỏi ISEN abs max khi ngắn mạch chưa được giải.
- r6 cấp nhánh motor 6 V cố định, nên dòng kẹt thực tế chủ yếu do điện trở cuộn dây quyết định (6 V / 0,36 A ≈ 16,7 Ω suy ra từ số ngoại suy). DRV8833 chỉ là lớp giới hạn dự phòng.

---

## R2 · Ngắt khi motor kẹt · **CẦN ĐO THẬT**

### Hiện trạng

- r6: phải ngắt khi lỗi/kẹt kéo dài (`r6:9`).
- `ifp:32`: dòng kẹt 0,36 A có thể không chạm ngưỡng; cần nhận biết không quay hoặc bảo vệ theo thời gian/năng lượng, chốt lỗi, yêu cầu lệnh mới.
- Motor không có encoder (`bom` B02; r6 dùng #992 không encoder).
- DRV8833 không có phát hiện kẹt; chỉ có chopping, OCP 2–3,3 A, TSD 150 °C min (§6.5). OCP không chạm được ở 0,36 A.

### Tính toán

Điện áp trên RISEN khi kẹt: `V = I_kẹt × R`. Với 0,36 A typ và 0,62 Ω: **0,223 V** (nếu chưa bị chopping). Với ITRIP min 0,256 A: 0,159 V. Lọc RC rồi đưa vào ADC ESP32 hoặc comparator là đọc được. Ngưỡng phát hiện phải nằm giữa dòng chạy bình thường có tải và dòng kẹt. [THIẾU: dòng chạy có tải trên robot thật, dòng kẹt thật; đo BT-R2].

Năng lượng nhiệt trong motor khi kẹt 1 s: `P = 6 V × 0,36 A = 2,16 W` trong motor N20 nhỏ. Không có số chịu nhiệt của motor: [THIẾU: Pololu không công bố thời gian kẹt cho phép].

### Phương án

| | A. Firmware: ADC đọc ISEN qua RC, chốt lỗi | B. Phần cứng: comparator + RC định thời, kéo nSLEEP thấp, chốt | C. Thêm encoder phát hiện không quay |
|---|---|---|---|
| Độc lập firmware | Không | Có | Không (cần firmware đếm) |
| Linh kiện | 2 RC, 2 kênh ADC | Comparator (TLV6700 còn một kênh trống nếu dùng window) + RC + latch [TBD: R2, box02] | Motor khác hoặc encoder thêm; ngoài r6 |
| Thay r6 | Không | Không | Có |

### Đề xuất

A cho prototype, với quy tắc đề xuất: nếu dòng lọc > ngưỡng kẹt trong > T_kẹt khi đang có lệnh chạy, tắt kênh, giữ OFF tới lệnh mới. Ngưỡng và T_kẹt chốt sau BT-R2. B là lớp dự phòng nếu box08 yêu cầu độc lập firmware. Không chọn C vì ngoài phạm vi r6.

Chân ADC: dùng ADC1 của ESP32 (ADC2 không dùng được khi Wi‑Fi bật) [cần box02 xác nhận chân trống trên BrijModi].

### Rủi ro còn lại

- Ngưỡng kẹt phụ thuộc dòng chạy có tải; tải PETG và bánh xe chưa có số.
- Nếu ITRIP min (0,256 A) thấp hơn dòng kẹt, DRV8833 sẽ chopping và dòng đọc được kẹt ở mức ITRIP; ngưỡng phát hiện phải thấp hơn ITRIP min.

---

## R3 · Tải pack 2S và nhiệt · **CẦN DỮ LIỆU NCC**

### Hiện trạng

- r6: dừng tải dưới **6,50 V dưới tải**, mục tiêu ≤ **1,85 A**, hiệu suất sàn 80 %, tải trực tiếp 0,05 A (`r6:11`).
- Công thức r6: `(6 × 0,90 + 5 × 0,70) / (6,50 × 0,80) + 0,05 = 1,762 A`.
- Pack B04 MTM 7V2AH-4A-2S1P: 2 A liên tục, 4 A tức thời, theo nhà bán (`r6:11`, `bom` B04). Thiếu nội trở, xung, ngưỡng cắt/phục hồi (`ifp:42`).

### Tính toán

**Biên pack:** 2,0 − 1,762 = **0,238 A** (11,9 %) so với số nhà bán. Với trần 1,85 A: 0,15 A.

**Tổn hao converter** (giả định r6 η = 80 %):
- Nhánh motor: `6 × 0,90 × (1/0,8 − 1) = 1,35 W`.
- Nhánh logic: `5 × 0,70 × (1/0,8 − 1) = 0,875 W`.
- Tổng 2,225 W (khớp `ifp:46`).

**Nhiệt TPS63070 (θJA 63 °C/W, JEDEC):** nếu toàn bộ 1,35 W tỏa trong IC, TJ = 40 + 1,35 × 63 = **125 °C**. Đây là cận trên; một phần tổn hao nằm ở cuộn cảm và tụ. [THIẾU: hiệu suất TPS63070 ở VIN 6,5–8,4 V, VOUT 6 V, 0,9 A, đọc từ đồ thị hiệu suất SLVSC58B hoặc đo; box02]. TPS63070 cho phép IOUT 2 A khi VIN ≥ 4,5 V hoặc VOUT ≥ 4,5 V (§6.5), đủ cho 0,9 A.

**Nhiệt DRV8833 (PWP, θJA 40,5 °C/W):** RDS(ON) HS 325 mΩ + LS 275 mΩ = 600 mΩ ở VM 5 V, TJ 85 °C (§6.5). Hai kênh ở 0,45 A: `2 × 0,45² × 0,6 = 0,243 W`, TJ = 40 + 0,243 × 40,5 = **49,8 °C**. Biên lớn.

**Điện trở sense:** 2 × 0,126 W = 0,25 W ở 0,45 A (R1).

**Nhiệt pack:** `P = I² × R_pack`. Ví dụ R_pack = 0,1 Ω (giá trị ví dụ, không phải số B04): 1,85² × 0,1 = 0,34 W. [THIẾU: R_DC pack B04 ở 40 °C, SOC thấp; NCC].

**Sụt áp tới ngưỡng 6,50 V:** `R_đường,max = (V_hở − 6,50) / 1,762`. [THIẾU: OCV theo SOC của B04; NCC].

### Phương án

| | A. Giữ r6, lấy hồ sơ B04 | B. Giảm tải đồng thời bằng firmware (không chạy loa và motor cùng lúc ở pin thấp) | C. Đổi pack có hồ sơ |
|---|---|---|---|
| Thay r6 | Không | Không | Có |
| Biên pack | 0,238 A theo nhà bán | Tăng thêm 0,15 A × 5 V / (6,5 × 0,8) ≈ 0,14 A | Tùy pack |
| Cần dữ liệu | R_DC, xung, ngưỡng BMS | Như A | Hồ sơ pack mới |

### Đề xuất

A, kèm B làm chính sách firmware an toàn. Dữ liệu cần từ NCC pack B04 giống danh sách H1 trong `handset.md` (mục 1–7), cộng xác nhận BMS 2S có cân bằng.

### Rủi ro còn lại

- Converter TPS63070 có thể nóng trong vỏ PETG kín. Cần đo BT-R3.
- Hiệu suất 80 % là giả định; nếu thấp hơn, dòng pack vượt 1,85 A.

---

## R4 · Năng lượng trả về khi phanh/đảo chiều · **CẦN ĐO THẬT**

### Hiện trạng

- TPS63070 có giới hạn dòng âm, cho phép dòng chạy từ đầu ra về đầu vào khi forced PWM (SLVSC58B §8.4.1; `rr:15`).
- VM của DRV8833 phải ≤ **10,8 V** (dải vận hành) và ≤ 11,8 V abs max (§6.1, §6.3).
- `ifp:46`: không lấy pin làm sink năng lượng phanh; tính tụ bằng `½ C (V_limit² − V_start²)`.

### Phân tích nguồn năng lượng

1. **Năng lượng cuộn cảm** khi cầu H chuyển sang coast/fast decay: dòng cuộn dây đổ về VM qua diode thân. `E_L = ½ L I²` mỗi kênh.
2. **Động năng** chỉ trả về khi sức phản điện động lớn hơn VM. Với VM = 6 V cố định và motor 6 V, sức phản điện động ở tốc độ không tải nhỏ hơn VM, nên năng lượng cơ không chảy ngược trong vận hành bình thường. Ngoại lệ: robot bị đẩy hoặc xuống dốc làm motor quay nhanh hơn tốc độ không tải. Tham khảo: vận tốc tối đa `π × 0,043 m × 130 / 60 = 0,293 m/s` (bánh 43 mm theo `bom` B29, 130 rpm theo Pololu), động năng `½ m v² = 0,0428 J/kg`. [THIẾU: khối lượng robot].
3. **Phanh chậm (slow decay, cả hai ngõ ra cùng mức)**: dòng tuần hoàn trong cầu H và cuộn dây, không về VM.

### Tính tụ bulk VM

`V_peak = √(V_start² + 2 E / C)`, V_start = 6,15 V, E = 2 kênh × ½ L × 0,45². L chưa biết, nên tính theo ba giá trị giả định (không phải thông số motor):

| L giả định | E (2 kênh) | C = 47 µF | C = 100 µF | C = 220 µF |
|---|---|---|---|---|
| 1 mH | 0,20 mJ | 6,81 V | 6,47 V | 6,30 V |
| 5 mH | 1,01 mJ | 8,99 V | 7,62 V | 6,86 V |
| 10 mH | 2,03 mJ | **11,14 V** (vượt 10,8 V) | 8,85 V | 7,50 V |

Với C = 220 µF hiệu dụng (sau derating), V_peak ≤ 7,5 V cho L tới 10 mH, biên 3,3 V tới 10,8 V. Với động năng: 220 µF từ 6,15 V lên 10,8 V hấp thụ `½ × 220 µF × (10,8² − 6,15²) = 8,7 mJ`. Tương đương động năng của khối lượng 8,7 mJ / 0,0428 J/kg ≈ 0,20 kg ở vận tốc không tải nếu toàn bộ quay ngược về VM. Thực tế hộp số 100:1 và tổn hao sẽ giảm phần quay về; [cần đo BT-R4].

### Phương án

| | A. Tụ bulk + TVS + PFM | B. Tụ bulk + forced PWM (trả về pack qua TPS63070) | C. Chỉ dùng slow decay, không fast decay |
|---|---|---|---|
| Mạch | 220 µF/16 V trên VM + TVS SMAJ8.0A + PS/SYNC = cao (PFM, không hút dòng ngược) [box02 xác nhận PFM không sink] | 220 µF, PS/SYNC = thấp | Firmware: đảo chiều qua brake rồi coast |
| Khi pack đầy/BMS mở | Tụ và TVS hấp thụ | Năng lượng đi về pack; BMS mở thì VIN TPS63070 tăng, nguy hiểm | Không tạo năng lượng ngược từ L |
| Độc lập firmware | Có | Có | Không |

TVS SMAJ8.0A (Littelfuse): VR 8,0 V, VBR 8,89–9,83 V ở 1 mA, VC max 13,6 V ở IPP 29,4 A (10/1000 µs), 400 W. Số liệu từ trang phân phối (Farnell, DigiKey); chưa đối chiếu PDF Littelfuse [cần đối chiếu PDF hãng]. VR 8,0 V cao hơn VM bình thường 6,15 V nên không dẫn khi chạy. VC 13,6 V ở dòng lớn vượt 10,8 V, nên TVS chỉ là lớp thứ hai; tụ bulk là phần hấp thụ chính.

### Đề xuất

A + C: tụ 220 µF/16 V (polymer hoặc điện phân low-ESR) + 1 µF gốm sát chân VM, TVS SMAJ8.0A, TPS63070 ở PFM, firmware đảo chiều qua brake. Năng lượng ước tính: ≤ 2,03 mJ (cuộn cảm, L ≤ 10 mH giả định) → V_peak ≤ 7,5 V.

Mã: TVS Littelfuse SMAJ8.0A (DO-214AC/SMA); thay thế Bourns SMAJ8.0A. Tụ: [TBD: R4, box03 chọn MPN 220 µF 16 V low-ESR]. Mua ở VN: [chưa kiểm chứng].

### Rủi ro còn lại

- L motor chưa biết; nếu > 10 mH, phải tăng C.
- Chưa xác nhận TPS63070 ở PFM hoàn toàn không hút dòng ngược khi VOUT tăng [box02 đọc §8.4.1 và §8.4.5 PS/SYNC].
- Robot bị đẩy bằng tay khi tắt nguồn: motor thành máy phát, nạp VM qua diode thân. Chưa có số.

---

## R5 · Sạc 4,2 W vượt 2,5 W của USB 5 V/500 mA · **CẦN FOUNDER QUYẾT**

### Hiện trạng

- Charger BQ25886 + TUSB320LAI; mục tiêu 0,50 A vào pack 8,4 V (`ifp:52`, `bom` B05, B06).
- `0,50 A × 8,4 V = 4,2 W` > `5 V × 0,5 A = 2,5 W` (`rr:17`).
- `ifp:52`: ILIM của BQ25886 không hỗ trợ dưới 500 mA.

### Tính toán (BQ25886 SLUSD88A, TUSB320LAI SLLSEQ8D)

**Giới hạn đầu vào.** `IINMAX = KILIM / RILIM`, KILIM = 1110 A·Ω. Bảng IINDPM: đặt 0,5 A → **457–553 mA**; đặt 0,9 A → **839–980 mA**; đặt 1,5 A → 1413–1624 mA. Đặt 0,5 A vẫn có thể lấy 553 mA, **vượt 500 mA**. BQ25886 không thể giữ một cổng USB mặc định dưới 500 mA.

**Dòng sạc.** ICHG_ACC ở 500 mA: **±15 %**; ở 250 mA: ±25 %. VREG 8,4 V khi VSET để hở (> 150 kΩ), sai số ±0,5 %.

Dòng vào cần cho 0,5 A + 15 %, η 80 % (giả định), VBUS 4,75 V:
`0,575 × 8,4 / 0,80 / 4,75 = 1,27 A` (khớp `ifp:52`). IINDPM đặt 0,9 A sẽ chặn ở ≤ 0,98 A, giảm dòng sạc tương ứng.

**Nhận diện nguồn.** TUSB320LAI ở chế độ UFP đọc mức Rp: Default (VCC 0,25–0,61 V), Medium 1,5 A (0,7–1,16 V), High 3 A (1,31–2,04 V) (§6.5). Ở GPIO mode (ADDR hở), OUT1/OUT2 là open-drain báo chế độ dòng (Bảng 3) [box02 đọc Bảng 3 để chốt logic]. Khi chưa có nguồn (dead battery), IC mặc định UFP/SNK với Rd. TUSB320LAI VDD 2,7–5 V: VBUS tới 5,25 V vượt mức này, cần LDO 3,3 V từ VBUS [TBD: R5, box02 chọn LDO].

Cáp USB-A → C thường có Rp 56 kΩ (Default). Như vậy phần lớn cục sạc điện thoại cổng A sẽ bị nhận là Default.

### Phương án

| | A. Chỉ sạc khi nguồn báo 1,5 A/3 A | B. A + tầng thấp 0,15 A cho nguồn Default qua bộ giới hạn ngoài | C. Đổi charger hỗ trợ IIN < 500 mA |
|---|---|---|---|
| Mạch | TUSB320LAI OUT1 → EN sạc (CE); RILIM 1,24 kΩ (E96) → IIN 895 mA nom, 839–980 mA | Thêm công tắc giới hạn dòng ≤ 450 mA trước VBUS BQ25886; ICHG 0,15 A; VINDPM 4,3 V tự giảm dòng | IC mới [THIẾU: box02 chọn] |
| Dòng vào max | ≤ 0,98 A, dưới 1,5 A | Tầng thấp: 0,15 × 1,25 × 8,4 / 0,8 / 4,75 = 0,414 A trước bias | Tùy IC |
| Sạc từ cục sạc USB-A | **Không** (LED báo "nguồn yếu") | Có, chậm: 2 Ah / 0,15 A ≈ 13 h | Có |
| Thời gian sạc 2 Ah ở CC | ≈ 4 h (0,5 A) | 4 h hoặc 13 h | Tùy |
| Thay r6 | Không đổi linh kiện; thêm chính sách | Thêm linh kiện | Đổi B05 |

RICHGSET cho 0,5 A: KICHGSET 3810 Ω·A theo §6.5. Nếu `ICHG = KICHGSET / RICHGSET` thì R = 3810 / 0,5 = 7,62 kΩ, E96 7,68 kΩ → 0,496 A. [cần box02 xác nhận công thức ở §8.3, vì bản trích PDF in lệch ký hiệu].

### Đề xuất

**A.** An toàn và đơn giản nhất, không vượt nguồn nào. Đánh đổi: không sạc được từ cục sạc cổng A thông thường. Founder quyết định chấp nhận đánh đổi này hay đầu tư B.

| Vai trò | Mã | Package | Lý do | Thay thế | Mua ở VN |
|---|---|---|---|---|---|
| Nhận diện CC | TUSB320LAIRWBR (r6) | X2QFN-12 | Đọc mức Rp, dead-battery Rd | Hai điện trở Rd + comparator đọc CC [TBD] | [chưa kiểm chứng] |
| RILIM | 1,24 kΩ ±1 % | 0402/0603 | IIN 839–980 mA | 1,21 kΩ (917 mA nom) | Có [chưa kiểm chứng mã] |

### Rủi ro còn lại

- Nguồn 1,5 A giả (cáp hoặc sạc kém chất lượng báo sai Rp): IINDPM ≤ 0,98 A và VINDPM 4,3 V là lớp bảo vệ thứ hai.
- r6 yêu cầu chặn SYS của BQ25886 cấp tải carrier (`ifp:52`). BATFET nối SYS và BAT (SLUSD88A, mô tả chân SYS). Tải carrier phải lấy từ pack qua đường riêng có enable (R6), **không nối vào SYS**; SYS chỉ có tụ 2 × 22 µF theo datasheet.

---

## R6 · Cách ly USB và I/O · **GỠ TRÊN GIẤY**

### Hiện trạng

Giống H4 (`r6:18-26`, `ifp:9-18`, `rr:16`), cộng nhiều ngoại vi trên miền carrier: DRV8833, MAX98357A (I²S), OLED I²C, HC-SR04 (5 V), 2 TCRT5000 (`bom` B03, B09–B13).

### Kiến trúc đề xuất

1. **Interposer Micro-USB và LM66100 cấp DevKit**: như H4 trong `handset.md`.
2. **Hai enable phần cứng.**
   - `LOGIC_EN` (EN của TPS54302 nhánh 5 V) = không có VBUS_PROG **và** không có VBUS_C **và** VPACK trên ngưỡng UVLO 6,50 V. Wired-AND open-drain như H4. [TBD: R6, box02 kiểm mức EN TPS54302 khi pull-up từ VPACK tới 8,4 V].
   - `MOTOR_EN` (EN TPS63070 và nSLEEP DRV8833) = `LOGIC_EN` **và** lệnh GPIO từ ESP32. nSLEEP có điện trở kéo xuống, nên motor OFF khi reset và khi GPIO ở high-Z (`r6:20`).
3. **UVLO 6,50 V**: TLV6700. `R_top / R_bot` để 0,400 V ở 6,50 V: tỉ số 16,25. Ví dụ R_top = 1,5 MΩ, R_bot = 97,6 kΩ: V_trip = 0,4 × 1597,6 / 97,6 = **6,548 V** [TBD: R6, box02 tinh chỉnh E96 và hồi tiếp hysteresis].
4. **Cách ly I/O sang ngoại vi carrier.** Ngoại vi carrier tắt khi có USB nạp, còn DevKit vẫn chạy. Đường số đi qua bộ dịch mức có chức năng cách ly nguồn:
   - **SN74LVC8T245** (8 kênh, hai nguồn 1,65–5,5 V, Ioff, "VCC isolation": nếu một trong hai VCC = 0, cả hai cổng ở high-Z). VCCA = 3V3 DevKit, VCCB = rail carrier. Hướng A→B cho AIN1, AIN2, BIN1, BIN2, I²S BCLK, LRCLK, DIN, HC-SR04 TRIG.
   - **2 × SN74LVC2T45** (2 kênh mỗi IC, cùng tính năng) hướng B→A cho HC-SR04 ECHO (5 V), TCRT5000 OUT ×2 và nFAULT của DRV8833 (4 kênh).
   - **TCA9517A** cho I²C OLED: high-Z khi tắt nguồn (SCPS245E Features).
   - nSLEEP: không đi qua buffer; dùng kéo xuống trên carrier và GPIO qua điện trở nối tiếp [TBD: R6, box02 kiểm dòng qua diode ESD khi DRV8833 tắt].

   Mức VCCB: rail carrier nào (5 V hay 3,3 V) phụ thuộc mức vào của từng ngoại vi. [TBD: R6, box02 lập bảng từng chân: hướng, rail, VIH/VIL]. Không cần thêm số kênh ngoài danh sách trên trừ khi box02 phát hiện thiếu.
5. **Sạc và tải**: BQ25886 VBUS chỉ từ USB-C; tải carrier không nối SYS (R5).

### Phương án

| | A. Bộ dịch mức có VCC isolation (đề xuất) | B. Điện trở nối tiếp lớn trên mọi I/O | C. Bỏ trạng thái "DevKit chạy, carrier tắt" |
|---|---|---|---|
| Dòng ngược | Chặn bởi Ioff/high-Z | Giới hạn nhưng không chặn | Không còn |
| Đáp ứng r6 | Có | Một phần | Không (trái `r6:21`) |
| Linh kiện | 4 IC | Nhiều điện trở | — |

### Đề xuất

A. Bốn IC (một 8T245, hai 2T45, một TCA9517A) đã có datasheet hãng; đủ để vẽ schematic. Bench xác nhận dòng ngược (BT-R6).

| Vai trò | Mã | Package | Thay thế | Mua ở VN |
|---|---|---|---|---|
| Dịch mức 8 kênh | SN74LVC8T245PWR | TSSOP-24 | 2 × SN74LVC4T245 [chưa kiểm datasheet] | [chưa kiểm chứng] |
| Dịch mức 2 kênh (×2) | SN74LVC2T45DCUR | VSSOP-8 | SN74LVC1T45 ×2 [chưa kiểm datasheet] | [chưa kiểm chứng] |
| Buffer I²C | TCA9517ADGKR | VSSOP-8 | PCA9517 [chưa kiểm datasheet] | [chưa kiểm chứng] |
| Ideal diode, UVLO | LM66100DCKR, TLV6700DDCR | như H4 | như H4 | [chưa kiểm chứng] |

### Rủi ro còn lại

- MAX98357A và DRV8833 có cấu trúc chân vào khi VDD = 0 chưa được kiểm [THIẾU: box02 đọc abs max chân logic khi tắt nguồn]. Buffer giải quyết phía DevKit; phía buffer → ngoại vi đã cùng miền.
- Bảng chân chi tiết chưa có; số kênh có thể đổi khi box02 lập pin map.

---

## An toàn Li-ion (robot)

Như phần an toàn trong `handset.md`, cộng:
- Pack 2S phải có BMS cân bằng; chưa xác nhận ở B04 (R3).
- Motor kẹt làm nóng motor và driver: R2 chốt lỗi, yêu cầu lệnh mới.
- Bánh xe và hộp số có thể kẹp ngón tay trẻ: ngoài phạm vi mạch, ghi để box03 xét cơ khí.
- Chuẩn có thể áp dụng: như `handset.md` [cần chuyên gia xác nhận].
