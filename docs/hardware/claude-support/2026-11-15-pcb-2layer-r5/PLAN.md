# MoBot r5 — kế hoạch Pha 0 (chờ founder ở CHECKPOINT 1)

Ngày: 15/11/2026. Phạm vi ghi: chỉ thư mục `docs/hardware/claude-support/2026-11-15-pcb-2layer-r5/`. Pha 0 chỉ tạo file này; chưa copy, chưa sửa generator, chưa đụng PCB/schematic.

## 0. Đã đọc và đã kiểm

| Nguồn | Ghi chú |
|---|---|
| `docs/reviews/2026-11-14-pcb-independent-review/report.md` | F01–F10, bảng khoảng cách F03, giới hạn DRC/ERC (pin passive ở `mobot_build.py:86`) |
| `docs/hardware/MOBOT-HAI-PCB-DE-XUAT-CAI-TIEN-2026-11-15.md` | Hướng A, H01–H08, R01–R10, mục 5 và 7 |
| `2026-11-12-pcb-2layer/02-tai-lieu-thiet-ke.md` (đoạn nguồn tay cầm, rủi ro mục 8), `03-ket-qua-thiet-ke.md:40–60` | Bài học r4: passives vẫn xếp theo hàng |
| `kicad/tools/design_handset.py`, `design_robot.py` (toàn bộ), `mobot_build.py:70–100` | Netlist, FIXED/REGIONS, netclass |
| Repo ME4169, `VI XU LY.kicad_pcb` (tải raw.githubusercontent, nhánh `main`, 1 017 569 byte, đọc bằng pcbnew 10.0.7) | Số liệu ở mục 1 |

Hash snapshot cũ: chạy lại SHA-256 cho 28 file trong `snapshot.json` ngày 15/11 → **28 OK, 0 khác, 0 thiếu**. Sẽ kiểm lại cuối phiên.

Lưu ý tọa độ: KiCad trục y hướng xuống; mép trên (y nhỏ) là phía anten. Trên cả hai bo hiện tại, hàng socket DevKit có chân 1 ở y = 53,05 và kéo lên tới y ≈ 17,5 (xoay 180°). DevKit vì vậy nằm ở **nửa trên**, đầu USB của DevKit hướng xuống mép dưới; dải y ≈ 56–76 giữa bo không nằm dưới hàng socket. Đây là chỗ đặt cell nguồn mà r4 chưa dùng.

## 1. Xác nhận nguyên tắc tham chiếu T1–T8 từ file ME4169

Bo 80,05 × 60,05 mm, gốc (100;100). Mọi linh kiện mặt F.

| T | Đo được trên file | Khớp prompt? |
|---|---|---|
| T1 | J1 terminal (107,9;144,0) trái-dưới; Q1 CSD25404Q3 (105,6;138,1) cách J1 6,4 mm; D1 BZT52C10 + R2 100k sát Q1; C4 220 µF (105,0;128,6); U1 LMR51420 (106,4;119,6) trái-trên; LDO U3 AP2112K-3.3 (120,0;127,5); MCU U2 (140,0;130,0) giữa; U5 DRV8220 (153,5;112,0) phải-trên; M1 terminal (174,4;116,0) mép phải | Có |
| T2 | Tâm U1 → C10 3,85 mm; → L2 5,54 mm; → C11/C12 7,06 mm | Có (prompt ghi 4–8 mm cho Cout) |
| T3 | U5 → C18 100 nF 3,87 mm; → C17 220 µF 9,36 mm; zone `Net-(M1-+)` 35,3 mm² và `Net-(M1--)` 32,6 mm² trên F.Cu | Có |
| T4 | 18 zone rail trên F.Cu (+12VIN, +12V, +5V, +5VA, +3.3V, motor ±); GND zone hai lớp 7 105 mm²; **B.Cu còn 2 zone +12V (39,4 và 139,2 mm²)**. Track: 0,3 mm F.Cu 178 đoạn, 0,25 mm 23, 0,5 mm 16 | Có, nhưng B.Cu không hoàn toàn GND |
| T5 | 280 via, 245 GND, tất cả 0,6/0,3 mm | Có |
| T6 | Y1 cách tâm MCU ~8,7 mm (TQFP 7×7, sát chân); C1/C2 100 nF quanh MCU; level shifter U4 TXB0106 (127,8;118,0) giữa MCU và J2 socket 1×8 (113,8;126,4) | Có |
| T7 | SW1–SW3, RV1, D2/D3 ở y ≈ 155–157 (mép dưới); J3/J7 cảm biến x = 169,6 mép phải; H1–H4 cách mép 3,5 mm; TP1–TP7 | Có |
| T8 | 0 linh kiện mặt B | Có |

Không lấy từ bo tham chiếu: Cin 2,2 µF, cuộn 0603 (L1), giá trị/footprint. Cin/Cout MoBot tính theo datasheet IC của MoBot.

## 2. Ánh xạ T1–T8 sang MoBot và floorplan

### 2.1 Robot 100 × 80 mm

```text
 y=0  ┌───────────────────────────────────────────────────────────────────────┐
      │ J10 J11 IR     │  keepout anten x36–70, y0–15   │ J9 HC-SR04  J8 OLED │
 y=15 ├────────────────┼────────────────────────────────┼─────────────────────┤
      │ CELL-5V  U2    │                                │ U5 AND + R gate     │
      │  C10 C13 L1 FB │   ESP32 DevKit (socket)        │ CELL-DRV U6 DRV8833 │ J6 Motor A
      │ CELL-3V3 U4    │   J1 x=40,0   J2 x=65,4        │  R27/R28 Kelvin     │ J7 Motor B
      │  C14 L3 FB     │   y≈17,5–53                    │  C26 C24 C25 sát chân│ (mép phải)
      │ UVLO U1, Q5    │   R nối tiếp sát hàng chân trái│ VM bulk C22 + clamp │
 y=45 │ CELL-CHG U7    │                                ├─────────────────────┤
      │  C1 C2 L2 C7   │ (đầu USB DevKit ~y58)          │ CELL-VM U8 TPS63070 │
      │  C3/C4 C5/C6 C8│ CELL-SRC U3 TPS2553 + CC (F07) │  C16/C17 L4 C18–C20 │
 y=70 │ J13 NTC  RP: F1│ + QA/QB/QD                     │  C21 R22/R23 R24/R25│
 y=80 └ J4 USB sạc(13) ─ J3 pack(23,5) ─ J15 SW(33,5) ─ J5 USB→DevKit(46) ─ TP ┘
```

| T | Áp vào robot | Vùng dự kiến (mm, chốt ở Pha 2) |
|---|---|---|
| T1 | Mép dưới J4/J3/J15/J5 giữ nguyên; RP (F01) ngay sau J3/F1; cell sạc U7 trái-dưới; buck 5V/3V3 bên trái; DevKit giữa; VM và driver bên phải; motor mép phải | RP x18–36, y60–70; CHG x3–20, y45–70 |
| T2 | 6 cell: CHG (U7), 5V (U2), 3V3 (U4), VM (U8), DRV (U6), SRC (U3). Mỗi cell đặt theo layout datasheet, đo lại F03 | 5V x3–20, y16–28; 3V3 x3–20, y29–40; VM x68–92, y56–72; DRV x70–90, y20–40; SRC x40–60, y58–72 |
| T3 | C26 (10 µF) + 100 nF VM tại chân 12; C22 + clamp giữa U8 và U6; ngõ ra MA/MB bằng zone F.Cu tới J6/J7 | Bulk/clamp x80–97, y41–55 |
| T4 | Zone F.Cu cho VPACK→VBAT_PROT, VBAT_SW, VM_6V, V5, V3V3_C, MA/MB; B.Cu GND liền; tín hiệu 0,3 mm, nguồn ≥0,5 mm hoặc zone | — |
| T5 | GND stitching quanh từng cell và mép bo, via 0,6/0,3 mm | Số via ghi ở Pha 3 |
| T6 | MCU là DevKit tháo lắp nên không có decoupling/thạch anh riêng; áp tương đương: R nối tiếp và RC lọc ADC sát hàng chân, I2C R48/R49 gần J8 | Một phần |
| T7 | Robot không có hàng nút; TP mọi rail gom thành hàng gần mép; M3 3,5 mm giữ | Một phần (không có UI) |
| T8 | Toàn bộ mặt F | Giữ |

Rủi ro đã biết: ISA_ADC/ISB_ADC đi về chân VP/VN ở **hàng trái** (J1 chân 13–14, y ≈ 20–23) trong khi U6 ở bên phải; đường ADC dài ~30 mm chạy dưới DevKit. Sẽ đặt RC (R29/C27, R30/C28) sát chân DevKit, nhánh Kelvin đi cặp với GND tham chiếu.

### 2.2 Tay cầm 80 × 76 mm

```text
 y=0  ┌───────────────────────────────────────────────────────────┐
      │ J6 joystick trái │ keepout anten x23–57, y0–15 │ J7 joystick phải │
      │ RC JLX/JLY sát   │                             │ RC JRX/JRY     │
 y=30 │ J1 chân 11–14    │  ESP32 DevKit               │                │
      │ SW2 SW3 SW4      │  J1 x=27,3  J2 x=52,7       │ SW5 SW6 SW7    │
      │ (envelope tay)   │  y≈17,5–53 — vùng ADC yên   │ J5 UART        │
 y=55 ├──────────────────┼─────────────────────────────┼────────────────┤
      │ J3 3xAA  F1 Q1   │ CELL-BB U1 L1 C1 C2 C3 FB   │ (LiPo DNP nếu  │
      │ J9 SW  UVLO U2   │ CELL-SW U3 C6 C7 → J2.1 3V3 │  giữ) J8, U4   │
 y=76 └ TP ──────────────┴──── (J4 USB DNP) ── TP ──────┴────────────────┘
```

| T | Áp vào tay cầm | Ghi chú |
|---|---|---|
| T1 | 3×AA J3 trái-dưới → F1/Q1 → J9 công tắc → cell buck-boost → cell TPS2553 → J2 chân 1 (3V3, y = 53,05) | Đi một chiều trái→phải dọc dải dưới |
| T2 | CELL-BB: U1, L1, C1 (VIN), C2/C3 (VOUT), R2/R3 FB; CELL-SW: U3 + C6 tại IN, C7 tại OUT | Theo TPS631000 tr.18 |
| T3 | Không có motor | Không áp |
| T4 | Zone F.Cu VBAT_SW, V3V3_BB, V3V3_DEV; B.Cu GND liền | — |
| T5 | Stitching quanh cell và mép | — |
| T6 | RC lọc joystick sát chân ADC (J1 chân 11–14), cách vùng LX ≈ 30 mm | H08 |
| T7 | Nút giữ theo envelope bàn tay đã chốt (không đổi thành hàng mép dưới); TP mọi rail; M3 3,5 mm | Không áp hàng UI mép dưới vì ergonomics đã khóa |
| T8 | Toàn bộ mặt F | — |

Điểm cần kiểm ở Pha 2: đầu USB của DevKit nhô xuống khoảng y ≈ 58–60 (tùy SKU). Cell U3 gần J2.1 có thể nằm dưới phần nhô này; cần chiều cao linh kiện < khoảng hở socket (stack height TBD theo SKU DevKit).

### 2.3 Cách sửa generator

Copy `kicad/` sang r5, thêm khóa `CELLS` vào `DESIGN`: mỗi cell có anchor (x, y, rot của IC) và danh sách offset tương đối `{ref: (dx, dy, rot)}` lấy từ layout datasheet. `mobot_build.py` đặt CELLS trước, FIXED sau, REGIONS chỉ còn cho phần tín hiệu. Lý do: placement lặp lại được, review được theo offset, không phụ thuộc bộ xếp hàng.

## 3. F01–F10: cách đóng dự kiến

| F | Mức | Cách đóng dự kiến trong r5 | Kỳ vọng trạng thái cuối |
|---|---|---|---|
| F01 | High | Khối RP mới bao cả BAT U7 và tải (mục 4a); bảng trạng thái trong schematic note | CLOSED trên giấy nếu chọn A/B; phần PCM đánh thức = OPEN-TBD |
| F02 | High | Theo quyết định d; schematic có chỗ cho clamp, giá trị TBD | OPEN-TBD (thiếu motor/inertia) |
| F03 | High | Placement theo CELLS; bảng cũ/mới cho 14 cặp | CLOSED khi mọi cặp ngắn hơn và nằm trong cell |
| F04 | High | Via trong EP U7 (2,45×2,45) và U6 (3,4×5); số via kèm phép tính P_diss/θ từ datasheet | CLOSED bố trí; nhiệt thật NEEDS_TEST |
| F05 | High | Theo quyết định b | Phụ thuộc SKU DevKit |
| F06 | Medium | R24 = 10 kΩ, R25 DNP mặc định, ghi chú "lắp loại trừ" trong BOM | CLOSED |
| F07 | Medium | Theo quyết định c | CLOSED nếu chọn USB-A hoặc IC có tài liệu |
| F08 | Medium | R27/R28 sát chân AISEN/BISEN, return rộng về GND/EP U6, nhánh Kelvin từ pad shunt; netclass ISEN = nguồn | CLOSED bố trí; sai số đo NEEDS_TEST |
| F09 | High | Lập part matrix; MPN thiếu ghi TBD; không đổi footprint cuộn cảm khi chưa có land pattern Coilcraft | OPEN-TBD (chặn chế tạo) |
| F10 | Medium | Schematic theo khối, pin type đúng (sửa bản copy `mobot_build.py:86`), NC/DNP rõ; ref silk gần linh kiện | CLOSED schematic; cơ khí vỏ OPEN-TBD |

## 4. Quyết định cần founder (CHECKPOINT 1)

### a) F01 — chống đảo cực cho cả đường sạc và xả

Vì sao FET đơn hiện tại không đủ: khi pack cắm ngược và USB có điện, BQ25886 có thể đẩy BAT lên tới mức điều chỉnh. Một PFET có gate nối GND (dù ở chiều nào) khi đó có VGS âm và **mở**, hoặc body diode dẫn, nối pack ngược vào bus. Muốn chặn hai chiều cần hai FET đối đầu và gate được điều khiển bởi **điện áp đo ngay tại đầu pack**, không lấy từ bus.

**A. FET P đối đầu + bộ dò cực tính rời (khuyến nghị)**

```text
J3.1 ─F1─ VPK ──D[QA]S──┬──S[QB]D── VBAT_PROT ──┬─ U7 BAT13/14, C5/C6
             │       G──┴──G                    └─ J15 SW → VBAT_SW → tải
             │          │  RGS (G–S chung), zener G–S nếu VGS max < 8,442 V
             RD1        RG
             ├──G[QD]D──┘          QD: NFET tín hiệu
             RD2      S
J3.2 ── GND ─┴────────┘
```

QD chỉ dẫn khi V(VPK) − V(J3.2) vượt ngưỡng đặt bằng RD1/RD2 (đề xuất ~3 V, chốt sau). QD dẫn thì kéo gate QA/QB xuống, cả hai mở, dòng đi được hai chiều. Pack ngược: gate QD âm, QA/QB tắt, hai body diode chặn ngược nhau. MPN QA/QB/QD: TBD. Yêu cầu: VDS ≥ 20 V (lúc lỗi VDS QA ≈ Vbus + |Vpack| ≈ 16 V), RDS(on) tại VGS = −6 V, ID ≥ 2,5 A, VGS max của QD chịu −8,4 × tỉ lệ chia.

**B. Cùng tầng công suất QA/QB, điều khiển bằng IC bảo vệ có tài liệu** (MPN TBD). Ngưỡng và tốc độ ngắt xác định hơn, đổi lại chi phí, diện tích và phải tìm được IC đúng hai chiều.

**C. Cầu chì + diode crowbar ngược** — **loại**: lúc lỗi BAT vẫn thấy −VF của diode ở dòng lớn, vượt −0,3 V của BQ25886 §7.1.

Bảng trạng thái cho A (B tương tự):

| Pack | USB | SW | QD | QA/QB | BAT U7 | Tải | Ghi chú |
|---|---|---|---|---|---|---|---|
| đúng | không | OFF | dẫn | mở | = Vpack | tắt | dòng tĩnh RD1+RD2, RGS: TBD µA |
| đúng | không | ON | dẫn | mở | = Vpack | chạy | tổn hao 2·I²·RDS(on) |
| đúng | có | OFF | dẫn | mở | sạc | tắt | — |
| đúng | có | ON | dẫn | mở | sạc | khóa bởi Q5/EN_NODE | giữ khóa chạy khi sạc |
| ngược | không | OFF/ON | tắt | tắt | ≈ 0 V | tắt | điện áp âm chỉ còn ở J3, F1, VPK, gate QD, TP1: phải kiểm từng phần |
| ngược | có | OFF/ON | tắt | tắt | charger thấy "không pin" | khóa | hành vi BQ25886 khi không pin: kiểm datasheet |
| không có | có | — | tắt | tắt | "không pin" | khóa | **Rủi ro mở:** pack có PCM đã ngắt (0 V) sẽ không được đánh thức. Cần datasheet PCM của pack (R02) |

### b) F05 — tay cầm cấp DevKit

- **H-A**: giữ cấp 3V3 vào chân 3V3. Chỉ hợp lệ khi chọn được một SKU DevKit có sơ đồ và regulator chịu được cấp ngược.
- **H-B**: cấp 5 V vào đường USB/5V của DevKit qua switch có chặn ngược. Thêm rail 5 V (TPS631000 phải đổi setpoint hoặc thêm converter), tốn diện tích và hiệu suất.
- Khuyến nghị: **chốt SKU DevKit trước**. Có tài liệu thì H-A (ít thay đổi nhất); dùng clone không rõ thì H-B. Chưa có SKU thì r5 giữ H-A và để F05 OPEN-TBD.

### c) F07 — nguồn USB ra DevKit trên robot

- c1. IC source controller Type-C có tài liệu (MPN TBD, cần tra).
- c2. Comparator có ngưỡng, trễ và bảng trạng thái attach/detach.
- c3. **(khuyến nghị nếu cáp vừa)** Đổi J5 sang ổ USB-A, cấp qua TPS2553, dùng cáp USB-A→cổng DevKit. Nguồn USB-A không cần CC, nên bỏ hẳn Q3/Q4/R33–R35/C31/JP1 và đóng F07 bằng cách loại bỏ cơ chế. Đổi lại: thay connector, chiều cao ổ A và một sợi cáp ngắn.

### d) F02 — năng lượng hồi về VM

- d1. **(khuyến nghị)** Clamp chủ động: comparator đo VM_6V, mở NFET xả qua điện trở công suất khi vượt ngưỡng; đặt sát U6/C22.
- d2. Giữ TVS, nhưng chọn part có VC tại dòng xung thực ≤ ceiling. Cần đường đặc tính, hiện chưa đủ dữ kiện.
- d3. Giới hạn bằng chính sách điều khiển (coast thay brake, không đảo chiều khi đang chạy nhanh) và tăng Ceff. Giảm rủi ro nhưng không tạo cận phần cứng; chỉ dùng kèm d1/d2.
- Biến TBD dù chọn hướng nào: model motor N20, dòng stall, quán tính rotor + bánh + khối lượng robot, tốc độ max, chế độ brake/coast và decay của DRV8833, TPS63070 có hút dòng ngược khi VOUT > setpoint hay không. r5 chỉ chừa footprint và ghi giá trị TBD.

### e) LiPo DNP tay cầm

- e1. **(khuyến nghị)** Giữ footprint nhưng dời cả cụm sang góc phải-dưới cạnh J8, nhường dải dưới-giữa cho cell nguồn AA; BOM/assembly ghi rõ AA-only.
- e2. Variant AA-only bỏ hẳn cụm U4/J4/J8 (bớt diện tích và rủi ro lắp nhầm, nhưng mất đường lên LiPo).

## 5. Giới hạn và cách dừng

- Phép đo điện/nhiệt/EMI: NOT_RUN trong toàn phiên.
- Không bịa MPN; ô MPN mới ghi TBD.
- Founder giới hạn phiên ở **70 % hạn mức token 5 giờ**. Nếu chạm ngưỡng giữa Pha 1–3, tôi dừng ở mốc lưu được gần nhất và ghi trạng thái dở dang vào `r5/04-ket-qua-r5.md`.
- Pha 1 chỉ bắt đầu sau khi founder trả lời a–e.
