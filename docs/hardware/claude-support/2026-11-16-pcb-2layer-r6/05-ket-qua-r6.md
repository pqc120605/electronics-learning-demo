# MoBot r6 — phản hồi review độc lập r5 (16/11/2026)

**Trạng thái: bản sửa theo review, chờ review độc lập lại. KHÔNG được phép chế tạo, đặt fab hay cấp điện pin/motor.** Mọi phép đo điện, nhiệt và EMI: **NOT_RUN**.

Đầu vào: [review Codex r5](../../../reviews/2026-11-16-pcb-r5-independent-review/report.md), verdict CHANGES_REQUESTED (1 High, 6 Medium, 1 Low).

r6 nằm trong thư mục riêng `2026-11-16-pcb-2layer-r6/`. Lý do: giữ nguyên byte r5 mà review đã ghim hash. Kiểm cuối phiên:
- Snapshot r5 của Codex (`snapshot-before.json`): **22/22 khớp**.
- Snapshot r4 (`2026-11-14…/snapshot.json`): **28/28 khớp**.

## 1. Kết quả kiểm r6

KiCad 10.0.7. Lệnh `kicad-cli sch erc --severity-all --exit-code-violations --format json` và `kicad-cli pcb drc --severity-all --schematic-parity --exit-code-violations --format json`.

| Bo | ERC | DRC | Unconnected / parity | Log |
|---|---|---|---|---|
| Robot | exit 0, 0 violation | **exit 0, 0 violation** | 0 / 0 | `reports/robot-erc.json`, `reports/robot-drc.json` |
| Tay cầm | exit 0, 0 violation | **exit 0, 0 violation** (sau khi dời lỗ M3, mục R5-07) | 0 / 0 | `reports/handset-erc.json`, `reports/handset-drc.json` |

Rule còn `ignore`, mỗi rule có lý do; không có `drc_exclusions`:
- DRC `footprint_filters_mismatch`: symbol sinh tự động không có bộ lọc footprint.
- DRC `tuning_profile_track_geometries`: bo không dùng length tuning.
- ERC `footprint_filter`: cùng lý do với `footprint_filters_mismatch`.
- ERC `simulation_model_issue`: không mô phỏng.

Các rule trước đây bị ignore mặc định nay đã bật lại:
- `missing_courtyard` = error.
- `track_not_centered_on_via` = warning.
- `footprint_type_mismatch` = warning.
- `single_global_label` và `four_way_junction` = warning.

Cấu hình nằm ở `kicad/tools/mobot_build.py` (`write_project`).

## 2. Từng finding

### R5-01 (High) — đường nguồn thật, không chỉ tâm pad

**Cách sửa:**
- Thêm `kicad/tools/preroute.py`: đi tay theo thứ tự ưu tiên **trước** Freerouting, gồm vòng chuyển mạch, tụ vào/ra, BOOT/BTST, FB, ngõ ra motor và ISEN.
  - Thuật toán A* lưới 0,05 mm, khe hở 0,19 mm (luật tối thiểu 0,15 mm).
  - Cấm đi dưới thân IC.
  - Giữ làn thoát cho chân IC chưa có đường nối.
- Các đoạn này được khoá. `rip_ic.py` đọc `preroute.json` nên không gỡ chúng.
- Danh sách nằm trong `design_*.py`, khoá `preroute`.

**Thay đổi placement:**
- Tay cầm: C3 đặt cạnh C2, phía L1 (FIXED).
- Robot: vòng thoát 1,0 mm quanh chân IC (`escape_ring`). Các tụ/điện trở của U7 được gắn đúng chân.

Chiều dài track đo bằng **chính script của Codex** (`kicad/tools/measure_routes.py`, chỉ đổi BASE/OUT): đường tâm track ngắn nhất, bỏ phần trong pad/via, không tính plane. Kết quả ở `reports/route-measurements.json`.

| Bo | Đường | r5 (Codex) mm / via | r6 mm / via |
|---|---|---:|---:|
| Tay cầm | U1.1 VOUT → C2.1 | 12,536 | **1,77** / 0 |
| Tay cầm | U1.1 VOUT → C3.1 | 23,925 | **3,98** / 0 |
| Tay cầm | U1.4 VIN → C1.1 | — | 1,77 / 0 |
| Tay cầm | U1.3/U1.2 LX → L1 | — | 3,45 / 0 mỗi nhánh |
| Tay cầm | U3.1 IN → C6.1 | — | 1,86 / 0 |
| Robot | U7.17 SW → L2.2 | 11,434 | **5,02** / 0 |
| Robot | U7.12 BTST → C7.1 | 7,063 | **5,73 / 2** |
| Robot | U7.21 PMID → C2.1 | — | 2,52 / 0 |
| Robot | U7.23 VBUS → C1.1 | — | 2,83 / 0 |
| Robot | U2.3 VIN → C10.1 | — | 2,07 / 0 |
| Robot | U2.2 SW → L1.1 | — | 6,99 / 0 |
| Robot | U8.12 VIN → C16.1 | — | 2,61 / 0 |
| Robot | U6.12 VM → C26.1 | — | 2,39 / 0 |

**Còn mở trong R5-01:**
- BTST đi qua 2 via. Lý do: hàng chân dưới của U7 (TS/ILIM/ICHG/REGN/BTST, bước 0,5 mm) quá chật nên REGN và BTST phải xuống B.Cu (`kicad/tools/repair_u7.py`).
- Đường hồi GND và diện tích vòng chưa được phân tích.
- Ripple/EMI: NEEDS_TEST.
- Chưa có zone rail (T4).

### R5-02 (Medium) — dòng sạc

Codex đúng. R6 = 1,91 kΩ với K_ICHGSET điển hình 3810 Ω·A cho **ICHG ≈ 0,50 A**, termination ≈ 50 mA. Con số "≈ 2 A" và tổn hao 1,07 W trong 04-ket-qua-r5.md **sai**. Hiệu suất 93,4 % ở trang 1 BQ25886 SLUSD88A ghi cho 1 A, không phải 2 A.
- Ước lượng lại ở 0,50 A: P_out = 7,6 V × 0,5 A = 3,8 W.
- Tổn hao cả tầng sạc ≈ 0,2–0,3 W **nếu** hiệu suất cỡ 93 %. Đây là ước lượng, chưa phải số hãng ở 0,5 A. Thử nhiệt NOT_RUN.
- R6 **giữ nguyên**. Muốn đổi dòng sạc là quyết định thiết kế riêng.
- R5 = 1,24 kΩ đặt giới hạn dòng vào ≈ 0,895 A (số kiểm của Codex), giữ nguyên.

### R5-03 (Medium) — khoá khi sạc ở VBUS thấp

Sửa:
- Q5 đổi từ 2N7002 sang **DMN2075U-7**. Linh kiện này đã có trong BOM (Q2), không thêm MPN mới.
- R11 đổi từ 100k sang **22k**. Gate = VBUS × 100/122 = **3,52 V ở VBUS 4,3 V**.

Theo Diodes DMN2075U DS31837 Rev.7-3: VGS(th) ≤ 1,0 V; RDS(on) ≤ 45 mΩ ở VGS = 2,5 V; VGSS ±8 V. Với dòng sink cần 57,24 µA (số của Codex), sụt áp trên Q5 chỉ cỡ µV. VGS không vượt 8 V khi VBUS ≤ 9,7 V.

Còn mở:
- Thông số datasheet ở 25 °C; cận theo nhiệt độ chưa kiểm.
- Bảng VBUS ramp/brownout và đường MOTOR_EN/nSLEEP chưa lập lại.
- Thử thực tế NOT_RUN.

### R5-04 (Medium) — bias Q7/Q8 (tên r5: QA/QB)

Sửa:
- R2 đổi từ 100k sang **10k**. Khi Q9 dẫn: VGS = −V_S × 100/110 ≈ **−4,55 V ở 5,0 V; −5,45 V ở 6 V; −7,67 V ở 8,442 V**.
- Tiêu chí chọn ghi ngay trong value: VDS ≥ 20 V, **VGS max ≥ ±12 V**, **RDS(on) bảo đảm ở VGS = −4,5 V**. Ngưỡng −4,5 V ứng với pack 5,0 V; pack cắt PCM thấp hơn thì phải tính lại.
- Dòng tĩnh khi pack đúng chiều: 8,442/110k ≈ 77 µA cộng nhánh R57/R58 ≈ 42 µA.

Còn mở: MPN Q7/Q8 vẫn TBD; chưa tính SOA, tổn hao và hành vi mất gate.

### R5-05 (Medium) — ISEN/Kelvin

Sửa:
- Shunt R27/R28 và D3/D4 được dời ra khỏi làn ngõ ra motor.
- ISEN được pre-route trước ngõ ra motor, chế độ ưu tiên B.Cu.
- J6/J7 trả về thứ tự chân gốc: MA1→J6.1, MA2→J6.2, MB1→J7.1, MB2→J7.2. Ngõ ra không còn cắt nhau và không cần đảo chiều trong firmware.

| Đường | r5 mm / via | r6 mm / via |
|---|---:|---:|
| U6.6 ISEN_B → R28.1 | 13,664 / 2 | **7,95 / 2** |
| U6.3 ISEN_A → R27.1 | — | 4,74 / 2 |
| R28.1 → R30.1 (nhánh ADC) | 54,36 | **61,79 / 6** — dài hơn |
| U6.5 MB2 → J7.2 | 13,03 (0,2 mm) | 14,58 / 0, **rộng 0,3 mm** |
| U6.7 MB1 / U6.4 MA2 / U6.2 MA1 | — | 11,61 / 13,66 / 10,64, đều 0 via |

Còn mở:
- Nhánh ADC dài 61,8 mm, qua 6 via, đi về chân VP/VN ở hàng trái DevKit. Chưa có ngân sách nhiễu PWM.
- F08 giữ **OPEN** cho tới khi phân tích nhiễu và đo được dòng trip.

### R5-06 (Medium) — hàn vùng EP

Chưa đóng được bằng KiCad. Đề nghị đưa vào yêu cầu fab/lắp ráp:
- Via trong EP được plug và cap (kiểu IPC-4761 VII), hoặc tent từ mặt B nếu nhà lắp ráp chấp nhận.
- Paste dạng ô cửa sổ theo [TI SLUA271C §3.4](https://www.ti.com/lit/an/slua271c/slua271c.pdf).
- Tiêu chí void/X-ray do nhà lắp ráp chốt.

Số via giữ như r5: U7 có 9; U6 có 12, trong đó **6** nằm trong cửa sổ mask theo đếm của Codex. **OPEN** chờ nhà lắp ráp.

### R5-07 (Medium) — rule ignore và courtyard joystick

- Mức severity đã công khai (mục 1). Hai cảnh báo `track_not_centered_on_via` trên robot được sửa đúng điểm (`kicad/tools/center_vias.py` đọc DRC JSON).
- `Joystick_PTH` được thêm F.CrtYd: −13,05…13,05 × −13,85…13,05 mm. Courtyard này phủ thân F.Fab 25,6 mm + pad, **không** gồm envelope núm khi nghiêng.

Courtyard mới lộ ra **5 lỗi thật** trên tay cầm:
- J6 chồng lỗ M3 H1 (3,5;3,5) và J7 chồng H2 (76,5;3,5): 2 `courtyards_overlap` + 2 `npth_inside_courtyard`.
- J6 chồng socket J1 khoảng 0,05 mm.

Với footprint SparkFun COM-09032 hiện tại, thân joystick phủ lên lỗ bắt vít góc trên. Tôi **không** thu nhỏ courtyard hay thêm exclusion để DRC xanh.

**Founder chọn dời lỗ M3 (16/11).** Đã sửa trong `design_handset.py`:
- H1 từ (3,5; 3,5) sang **(3,99; 33,49)**; H2 từ (76,5; 3,5) sang **(76,01; 33,49)**.
  - Hai lỗ đối xứng qua trục giữa, nằm giữa đáy joystick và cụm nút.
  - Vị trí được tìm tự động: gần góc cũ nhất mà courtyard lỗ (bán kính 3,49 mm + 0,2 mm) không chồng linh kiện nào và không nằm trong vùng anten.
  - H3/H4 giữ nguyên. Bốn lỗ giờ tạo hình chữ nhật 72,0 × 39,0 mm (cũ 73 × 69 mm).
- J6 dịch sang trái 0,1 mm (x = 12,4) để courtyard không chạm socket J1.
- Route lại tay cầm: DRC exit 0, 0 lỗi, 0 mối hở. Chiều dài các đường trong cell U1/U3 không đổi so với bảng R5-01.

**Hệ quả cần kiểm:**
- Vỏ phải đổi vị trí trụ vít trên.
- Lỗ ở y = 33,5 nằm gần vùng ngón cái, nên đầu vít/trụ vỏ phải được kiểm với envelope tay.
- Thân joystick vẫn nhô ra ngoài mép trái/phải bo khoảng 0,6 mm theo F.Fab của footprint hiện tại. Phần này chờ SKU joystick thật.

### R5-08 (Low) — BOM/annotation/silk

- Đổi tên QA/QB/QD thành **Q7/Q8/Q9**; tên net QD_G/QD_D giữ nguyên.
- Kiểm r6:
  - `bom.csv` không còn reference `?`.
  - Netlist XML xuất không có cảnh báo annotation.
  - pos dùng Q5/Q7/Q8/Q9.
- Ref chưa đặt được lên Silk:
  - Robot (14): C27 C28 C5 Q6 R15 R28 R30 R42 R44 R46 R50 R62 U1 U8.
  - Tay cầm (4): J6 J7 R33 R36.
- Đã xuất bản vẽ lắp ráp F.Fab + Silk + Edge: `reports/robot-assembly.pdf`, `reports/handset-assembly.pdf`.
- Còn mở: U1/U8 (IC nguồn) nên có nhãn Silk; cần đặt tay.

### Các điểm khác Codex nêu

- **TPS63070 (F02):** Codex dẫn SLVSC58B §8.4.1 tr.10 có nói dòng ngược từ output về input. Câu trong r5 cho rằng "chưa được tài liệu xác nhận" là **sai** và được rút lại. Clamp U9/Q6/R62 vẫn cần vì chế độ PFM, EN tắt, pin đầy hoặc PCM ngắt chưa được chứng minh. F02 **OPEN**.
- **Phép đo không ra:** script không đo được J4.A4 → U7.23 và U8.7 → U6.12 (trả `None`) dù DRC báo đã nối. Nhiều khả năng đường đi qua pad ở điểm mà mô hình HitTest không bắt; cần đo tay trong KiCad.
- **Đường dài do `autofix.py` nối thêm**, rộng 0,2 mm: J15.2 → U2.3 VBAT_SW **69,5 mm / 4 via** (r5: 103,2 / 3); một đoạn EN_NODE dài khoảng 18 mm. Chưa có ngân sách dòng/sụt áp cho VBAT_SW.

## 3. Còn chặn chế tạo

- Vỏ: cập nhật trụ vít theo H1/H2 mới; kiểm envelope tay và SKU joystick (R5-07).
- MPN TBD: Q7/Q8, U9/Q6/R59–R62, D1 (d2), L1/L3 robot, C22, suffix Molex 67643; land pattern Coilcraft XEL4030/XFL4020.
- SKU DevKit (F05), motor/inertia/braking (F02), pack/PCM (F01 wake-up).
- Quy trình via-in-EP với nhà lắp ráp (R5-06).
- Ngân sách nhiễu nhánh ADC (R5-05), ngân sách sụt áp VBAT_SW và zone rail (T4).
- Mọi thử điện/nhiệt/EMI: NOT_RUN.

## 4. Tái lập

Thư mục `2026-11-16-pcb-2layer-r6/`, chạy theo thứ tự:
1. `sh kicad/tools/route.sh <bo>`: build + pre-route + Freerouting + post.
2. `python.exe kicad/tools/hand_patch.py robot`: via nhiệt EP.
3. Lặp `python.exe kicad/tools/autofix.py <bo>` tới khi in `CLEAN`.
4. Riêng robot: `repair_u7.py rip`, rồi `repair_u7.py route`, rồi autofix lại.
5. `center_vias.py <bo> <drc.json>`, rồi `fix_pro.py <bo>`.

Freerouting không tất định, nên chạy lại có thể ra đường khác; luôn kiểm DRC và chạy lại `measure_routes.py`.

Hồ sơ kèm theo:
- Gerber/drill: `gerber/<bo>/` (26 file mỗi bo).
- BOM/pos: `kicad/<bo>/bom.csv`, `pos.csv`.
- Ảnh: `images/r6-*-routed-top.png`.
- Danh sách pre-route: `kicad/<bo>/preroute.json`.
