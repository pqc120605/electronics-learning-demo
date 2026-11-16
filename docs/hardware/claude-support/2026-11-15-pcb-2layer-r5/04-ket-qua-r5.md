# MoBot r5 — kết quả phiên 15/11/2026

**Trạng thái: bản chờ review độc lập. KHÔNG được phép chế tạo, đặt hàng fab hay cấp điện pin/motor.** Cả hai bo đã route đủ, DRC/ERC/parity exit 0 (mục 4). Mọi phép đo điện, nhiệt và EMI trong phiên: **NOT_RUN**.

Quyết định của founder ở CHECKPOINT 1 (xem [PLAN.md](PLAN.md) mục 4): theo khuyến nghị, gồm a = A, b = chốt SKU trước (r5 giữ H-A), c = c3 USB-A, d = d1, e = e1. Placement đã được duyệt ở [CHECKPOINT-2.md](CHECKPOINT-2.md).

Sau checkpoint 2 có ba thay đổi placement, đều để route được:
- Tay cầm: L1 xoay 90° (`design_handset.py` FIXED) để hai nhánh LX1/LX2 không cắt nhau.
- Robot: J6 và J7 đổi chỗ cho nhau, đồng thời đảo chân 1/2 của từng đầu nối. Chiều quay motor vì vậy phải định nghĩa trong firmware.
- Robot: thêm vùng cấm track B.Cu dưới EP của U7 và U6, để giữ chỗ cho via nhiệt.
- Robot, cell U7: các tụ/điện trở được gắn đúng chân. Thứ tự đặt: C3/C4 (SYS 15/16) và C5/C6 (BAT 13/14) trước, rồi L2, rồi C7 (BTST); R5→chân 8, R6→chân 10, C8→chân 11, R8→chân 7. Lý do: C7 nằm sát phải chắn lối ra SYS/BAT, còn R5 ở xa khiến ILIM_C bị kẹp. Hệ quả: U7.12 BTST→C7 tăng từ 2,600 lên 5,049 mm (vẫn ngắn hơn r4 13,101 mm).

## 1. F01–F10

| F | Trạng thái | Bằng chứng |
|---|---|---|
| F01 | **CLOSED trên giấy** (topology). PCM đánh thức + MPN QA/QB: OPEN-TBD | `kicad/tools/design_robot.py` khối "# 1 — r5 (F01)": J3→F1→VPK→QA/QB đối đầu→`VBAT_PROT`; U7 BAT13/14, C5/C6, J15, TP1 đều trên `VBAT_PROT`. QD + R57/R58 dò cực tính tại VPK. Bảng trạng thái ở PLAN.md 4a. Chưa có mô phỏng hay đo |
| F02 | OPEN-TBD | Footprint cho clamp chủ động đã có (U9, R59–R62, Q6), D1 TVS chuyển DNP. Giá trị và MPN TBD vì thiếu motor, quán tính và braking profile. TPS63070 SLVSC58B, bảng chân: PS/SYNC thấp = forced PWM, cao = PWM/PFM power save. R24 lên VIN nên đang ở chế độ power save; việc chiều ngược năng lượng hồi về VIN chưa được tài liệu xác nhận |
| F03 | **CLOSED (bố trí)** | Cả 16 cặp ngắn hơn và nằm trong cell của IC (mục 2). Ripple/EMI: NEEDS_TEST |
| F04 | **CLOSED bố trí, NEEDS_TEST nhiệt** | U7: 9/9 via 0,6/0,3 mm, lưới 3×3 bước 0,9 mm trong EP 2,45 mm. U6: 12/12 via, lưới 3×4 bước 1,0 mm. Vùng B.Cu dưới EP không có track. Lý do và số liệu ở mục 1.1 |
| F05 | OPEN-TBD | Giữ H-A theo quyết định b, chờ SKU DevKit có sơ đồ/regulator |
| F06 | **CLOSED** | `design_robot.py`: R24 = 10k (PS_SYNC→VBAT_SW), R25 0 Ω DNP, ghi "loại trừ R24"; BOM `kicad/robot/bom.csv` |
| F07 | **CLOSED** bằng cách bỏ cơ chế CC | J5 đổi sang USB-A `USB_A_Molex_67643_Horizontal` (suffix MPN TBD). Q3/Q4/R33/R34/JP1 đã bỏ |
| F08 | **CLOSED bố trí**, sai số sense NEEDS_TEST | R27 cách AISEN 2,399 mm, R28 cách BISEN 3,276 mm. ISEN_A/B nằm trong netclass nguồn. Router không tách nhánh Kelvin riêng; nhánh ADC đi từ cùng net ISEN, chưa kiểm điểm lấy tín hiệu nằm trên pad shunt |
| F09 | OPEN-TBD (chặn chế tạo) | Xem mục 5 |
| F10 | **CLOSED schematic một phần** | Pin IC có electrical type thật (`mobot_build.py`, `pin_types`): tay cầm 8 power_in / 4 power_out / 15 input / 5 open_collector. PWR_FLAG chỉ đặt trên net cấp từ connector/cuộn cảm. Schematic vẫn dạng nhãn net, chưa vẽ theo khối dòng điện. Cơ khí vỏ, joystick: OPEN |

### 1.1 Số liệu nhiệt dùng cho F04

PDF hãng tải ngày 15/11, trích bằng `pdftotext`.

- **BQ25886, SLUSD88A:**
  - Tr.31 (layout): yêu cầu đủ via nhiệt trực tiếp dưới IC, nối xuống mặt GND.
  - Tr.8, KICHGSET typ 3810: R6 = 1,91 kΩ cho ICHG ≈ 2,0 A.
  - Tr.1: hiệu suất sạc 93,4 % ở adapter 5 V, pin 7,6 V; text trích không ghi dòng thử.
  - Ước lượng tổn hao cả tầng sạc: 7,6 V × 2 A × (1/0,934 − 1) ≈ 1,07 W, gồm cả cuộn cảm; phần trong IC chưa tách được.
  - Bảng RθJA của gói RGE bị lệch cột khi trích nên **không dùng**.
  - Kết luận: 9 via là số tối đa vừa EP với drill 0,3 mm. Đủ hay không phải đo; mục thử nhiệt NEEDS_TEST.
  - **Đề nghị founder xem lại ICHG ≈ 2 A trên bo 2 lớp.**
- **DRV8833, SLVSAR1E:**
  - Tr.6: RθJA 40,5 °C/W (PWP, JEDEC); tTSD 150–180 °C.
  - Dòng trip max 0,391 A/kênh (review 14/11). P = 2·I²·RDS(HS+LS); giá trị RDS chưa trích sạch nên P chưa tính.
  - 12 via là số tối đa vừa EP 3,4 × 5 mm.

## 2. Khoảng cách tâm pad r4 → r5 (sau route, `kicad/tools/measure_f03.py`)

| Bo | Cặp pad | r4 (mm) | r5 (mm) |
|---|---|---:|---:|
| Tay cầm | U1.4 VIN → C1 | 8,011 | 1,774 |
| Tay cầm | U1.1 VOUT → C2 | 12,314 | 1,774 |
| Tay cầm | U1.1 VOUT → C3 | 4,110 | 3,081 |
| Tay cầm | U3.1 IN → C6 | 13,278 | 1,864 |
| Robot | U7.23 VBUS → C1 | 14,681 | 1,792 |
| Robot | U7.21 PMID → C2 | 17,401 | 1,774 |
| Robot | U7.12 BTST → C7 | 13,101 | 5,049 |
| Robot | U2.3 VIN → C10 | 11,794 | 2,112 |
| Robot | U2.6 BOOT → C13 | 5,871 | 1,836 |
| Robot | U4.4 VIN → C14 | 8,599 | 2,059 |
| Robot | U8.12 VIN → C16 | 8,376 | 1,858 |
| Robot | U8.3 VAUX → C21 | 8,813 | 1,623 |
| Robot | U6.12 VM → C26 | 5,383 | 1,939 |
| Robot | U6.11 VCP → C24 | 6,627 | 2,467 |
| Robot | U6.3 AISEN → R27 | 4,384 | 2,399 |
| Robot | U6.6 BISEN → R28 | 8,549 | 3,276 |

## 3. T1–T8 đã áp dụng

| T | Robot | Tay cầm | Không áp được / lệch |
|---|---|---|---|
| T1 | Mép dưới J4/J3/J15/J5 → RP (x15–38, y59–71) → U7 (11;57) → U2 (10;21,5), U4 (10;35) → DevKit → U8 (76;63) → C22 + clamp → U6 (78;26) → J7 (y20)/J6 (y28) mép phải | J3 → F1/Q1/JP2 → J9 → U1 (26;63,5) → U3 (44,5;61) → J2.1 | — |
| T2 | 6 cell, đặt bằng `place_cells` | 2 cell | — |
| T3 | C26 + C24/C25 sát chân U6 | — | **C22 bulk gần U8, cách U6 ~30 mm. Ngõ ra motor là track 0,4 mm, chưa phải zone** |
| T4 | Rail đi bằng track netclass "Power" | như robot | **Chưa có zone F.Cu cho từng rail.** Có zone GND trên cả F.Cu và B.Cu. Track B.Cu: robot 211 mm, tay cầm 94 mm |
| T5 | 514/565 via là GND | 391/415 via là GND | — |
| T6 | RC/R nối tiếp sát hàng chân DevKit | RC joystick giữa hai hàng socket | DevKit không có thạch anh/decoupling riêng |
| T7 | TP mọi rail chính, M3 cách mép 3,5 mm | TP, M3 | Không có hàng UI ở mép dưới (robot không có nút; nút tay cầm theo envelope đã khóa) |
| T8 | Toàn bộ mặt F | Toàn bộ mặt F | — |

**Lệch thứ tự so với prompt:** nguồn, FB, bootstrap và Kelvin **không** được đi tay trước. Toàn bộ do Freerouting route theo netclass. Phần đi tay sau Freerouting:
- Tay cầm: LX1 rộng 0,3 mm (`kicad/tools/hand_patch.py`).
- Robot, `kicad/tools/fix_u6.py`: MA2 hạ xuống y = 26,32 mm, rộng 0,3 mm. MB2 đi ra từ U6.5 qua khe giữa via ISEN_B và MA2, rộng 0,2 mm, khe hở 0,165 mm mỗi bên; đây là khe hở nhỏ nhất của phần đi tay, vẫn trên luật 0,15 mm. Đoạn này nằm dưới thân R27, giữa hai pad.
- Robot, `kicad/tools/grid_patch.py` (A* hai lớp, lưới 0,05 mm, khe hở 0,16 mm): đoạn MB2 tới J7.1 gồm 2 đoạn F.Cu dài 8,79 mm rộng 0,2 mm. STAT_K U7.2→D5.1: 5 đoạn, 2 via, 5,76 mm, rộng 0,2 mm. CE_N U7.3→R9.1: 4 đoạn, 2,30 mm, rộng 0,2 mm.
- Robot, `kicad/tools/move_part.py`: chỉ dùng để gỡ CE_N. Script không tìm được chỗ trống để dời R9 nên R9 giữ nguyên chỗ.

Các toạ độ trong `fix_u6.py` gắn với đúng lần route này. Freerouting không tất định, nên nếu chạy lại `route.sh robot` thì phải làm lại phần đi tay rồi kiểm DRC.

**Lưu ý điện:** MB2 rộng 0,2 mm trên khoảng 12 mm. Dòng trip max 0,391 A/kênh; chưa tính sụt áp/nhiệt của đoạn này, NEEDS_TEST.

## 4. ERC/DRC/parity

Lệnh `kicad-cli sch erc --severity-all --exit-code-violations --format json` và `kicad-cli pcb drc --severity-all --schematic-parity --exit-code-violations --format json`, KiCad 10.0.7:

| Bo | ERC | DRC | Log |
|---|---|---|---|
| Tay cầm | exit 0, 0 violation | exit 0, 0 violation, 0 unconnected, 0 parity | `reports/handset-erc.json`, `reports/handset-drc.json` |
| Robot | exit 0, 0 violation | exit 0, 0 violation, 0 unconnected, 0 parity | `reports/robot-erc.json`, `reports/robot-drc.json` |

- `ignored_checks`/exclusion: project r5 không đặt rule severity "ignore" và không có exclusion. Luật dùng: clearance 0,15 mm, min track 0,15 mm, via 0,6/0,3 mm (`mobot_build.py` `write_project`, `fix_pro.py`).
- ERC 0 nhờ có PWR_FLAG trên các net: tay cầm GND, VBAT_SW, VBUS_CHG; robot GND, VBUS_CHG, VBAT_SW, V5, V3V3_C. Các cờ này tắt kiểm "power input not driven" trên những net đó.
- Fab: `gerber/handset/`, `gerber/robot/` (26 file/bo, gồm drill). BOM/pos: `kicad/<bo>/bom.csv`, `pos.csv`. Ảnh: `images/r5-*-routed-top.png`. Gerber cả hai bo xuất lại sau khi DRC sạch; vẫn **không dùng để đặt hàng** khi mục 5 còn TBD.

## 5. TBD còn chặn chế tạo

- MPN: QA/QB (PFET ≥ 20 V), U9 comparator + ref, Q6, R59/R60/R62, D1 (nếu dùng d2), suffix Molex 67643, L1/L3 robot, C22 polymer, MLCC (DC bias, ESR).
- Land pattern Coilcraft: XEL4030-102ME (tay cầm L1) và XFL4020-152ME (robot L4) vẫn dùng footprint Changjiang.
- Joystick: MPN mua được + bản vẽ hãng (footprint hiện là SparkFun COM-09032).
- SKU/revision DevKit: quyết định F05 và chiều cao dưới phần nhô USB.
- Motor N20 cụ thể: dòng stall, quán tính, braking profile (F02).
- Pack 2S + PCM: hành vi đánh thức khi PCM đã ngắt (F01).
- ICHG ≈ 2 A cần founder xác nhận (mục 1.1).
- Chưa có zone rail (T4).

## 6. Hash snapshot cũ

Chạy lại SHA-256 cho 28 file trong `docs/reviews/2026-11-14-pcb-independent-review/snapshot.json` cuối phiên: **28/28 khớp**. Thư mục `2026-11-12-pcb-2layer/` không bị sửa.
