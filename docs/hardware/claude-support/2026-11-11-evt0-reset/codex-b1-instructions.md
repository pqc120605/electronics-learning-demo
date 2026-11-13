# MoBot V2 tay cầm — chỉ dẫn cho Codex để đạt B1

- Ngày: 11/11/2026. Người viết: Claude (review/advisory). Người thực hiện: Codex lead.
- B1 trong tài liệu này là task `MM-HW-MOBOT-REMOTE-KICAD-001` (KiCad carrier tay cầm), lease mốc `schematic`.
- Tài liệu này không cấp quyền. Quyền đến từ khối xác nhận của Founder ở mục 1. Codex chỉ bắt đầu khi Founder gửi khối đó trong HQ.
- Tài liệu này thay mục 3 và mục 4 của `proposal.md` cùng thư mục: Founder không đo được bo mẫu, nên thiết kế dưới đây không dùng bất kỳ số đo nào của bo.

## 0. Tóm tắt giải pháp

Carrier tay cầm trở thành mạch gần như thụ động, cộng một khối nguồn 3 AA độc lập. Nguồn vào bo ESP32 chỉ qua chính cổng USB-C của bo. Carrier không nối VIN, không cấp vào chân 3V3, không nối EN.

Với kiến trúc này, bốn cổng trước schematic không còn đối tượng để chứng minh:

| Cổng bắt buộc (validator) | Vì sao đóng được |
|---|---|
| `D17-H3-CV-PROTECTION` | Không có pin sạc trong máy, không có mạch sạc. Chỉ còn một nghĩa vụ: không có đường nào đẩy dòng vào cell |
| `D17-ACTUATOR-PRODUCT` | Không có actuator, không có cassette. Loại trừ RUN/PROGRAM do bo chỉ có một cổng USB-C |
| `D17-OFF-DESIGN` | OFF là công tắc cơ nối tiếp pack. Khi tắt hoặc rút cáp, carrier không có nguồn nào chạm vào chân bo |
| `MCU-RESET-VETO-RESOURCES` | Không có veto, watchdog, latch. EN không nối. GPIO chỉ đọc joystick và nút |

Bo chưa đo được xử lý bằng ba cách: không dùng đường nguồn nội bộ của bo; footprint nhiều hàng cho khoảng cách hàng chân chưa biết; mục kiểm chứng `CLONE` theo D10 giữ nguyên là đo sau khi có PCB.

## 1. Khối xác nhận Founder cần gửi trong HQ

Codex không tự suy ra các quyết định này. Founder sao chép khối dưới, sửa nếu cần, ký và gửi.

```
=== XÁC NHẬN CỦA FOUNDER · tay cầm EVT0 và B1 · ngày __/11/2026 ===
Tôi là founder. Resume Hardware với phạm vi dưới đây.

F1. Tay cầm EVT0 dùng kiến trúc trong
    docs/hardware/claude-support/2026-11-11-evt0-reset/codex-b1-instructions.md mục 2.
    Quyết định này thay cho tay cầm: Q2 (kiến trúc nguồn v1), Q3 (pack Jauch 250832),
    "giữ cách ly toàn bộ I/O" ngày 09/11, G-B16/E1–E4, M-A và cassette, nhánh W,
    envelope 100 N/200 N, hướng H3 và trần 4,200 V. Các mục đó thành lịch sử cho tay cầm.
F2. Nguồn tay cầm: 3 pin AA tháo rời (alkaline hoặc NiMH), không sạc trong máy.
    Cắt áp thấp ở mức pack. EVT0 chấp nhận tự phục hồi sau khi cắt.
F3. Tiêu chí review r13 là danh sách đóng C1–C12 ở mục 4 của tài liệu trên.
    Điều gì ngoài danh sách thì ghi thành verification_item theo D10, không thành cổng mới.
F4. Cho phép Codex: lập cấu hình r13 tay cầm, lấy review độc lập, đối chiếu queue,
    tích hợp trust baseline của validator có review.
F5. Giữ nguyên: bo 30 chân USB-C họ CH340, điều khiển không dây, robot là hồ sơ riêng,
    trần giá robot + tay cầm dưới 1 triệu đồng, cổng chứng nhận đồ dùng trẻ em trước khi bán.

Đây chưa phải duyệt hash r13 và chưa cấp lease B1. Tôi duyệt hash và lease riêng
sau khi có review PASS trên đúng bytes. Không mua hàng, không cấp điện, không flash.
Chữ ký: <Chiến> · __/11/2026
=== HẾT ===
```

Sau khi review PASS, Founder gửi thêm hai câu riêng: duyệt đúng SHA-256 của r13, và cấp lease schematic cho `MM-HW-MOBOT-REMOTE-KICAD-001`.

## 2. Đặc tả thiết kế cho r13

### 2.1 Quy tắc nối với bo ESP32 (B01)

| Mã | Quy tắc |
|---|---|
| N1 | Nguồn vào B01 chỉ qua cổng USB-C của B01. Chân VIN của header: không nối |
| N2 | Chân 3V3 của header chỉ là ngõ ra từ B01 cấp cho joystick và điện trở kéo. Tải tổng ≤ 20 mA. Không có nguồn nào của carrier nối vào net này |
| N3 | Chân EN: không nối |
| N4 | Mọi net của carrier chạm header B01 chỉ thuộc một trong ba loại: GND; 3V3 theo N2; linh kiện thụ động tham chiếu về hai net đó |
| N5 | Không dùng GPIO0, 2, 5, 12, 15 (chân strap), GPIO1, 3 (UART0), GPIO16, 17 (có điều kiện theo P0-12) |
| N6 | Trục joystick chỉ dùng ADC1, vì ADC2 không dùng được khi radio chạy |

Hệ quả của N1–N4: khi B01 mất điện thì mọi thứ nối với GPIO cũng mất điện. Không cần phần tử cách ly. Hệ quả của N1: câu hỏi "bo clone có diode giữa VBUS và VIN không" không còn ảnh hưởng đến thiết kế.

### 2.2 Bảng chân đề xuất

Tên chân theo silkscreen đã chép trong `docs/hardware/evidence/esp32-devkit-v1-type-c-sample.md`. Ánh xạ silkscreen sang GPIO chưa được đo; firmware phải để bảng chân cấu hình được.

| Chức năng | Silkscreen | GPIO | Mạch |
|---|---|---|---|
| Joystick trái X | VP | 36 | Wiper → 1 kΩ → chân; 100 nF xuống GND tại chân |
| Joystick trái Y | VN | 39 | như trên |
| Joystick phải X | D34 | 34 | như trên |
| Joystick phải Y | D35 | 35 | như trên |
| Nút nhấn joystick trái | D32 | 32 | Nút xuống GND, 1 kΩ nối tiếp, pull-up nội |
| Nút nhấn joystick phải | D33 | 33 | như trên |
| Nút 1–6 | D25, D26, D27, D18, D19, D23 | 25, 26, 27, 18, 19, 23 | như trên |
| Header mở rộng I2C | D21, D22 | 21, 22 | Header 4 chân: 3V3, GND, SDA, SCL; không gắn pull-up mặc định |
| Dự phòng | D13, D14, D4 | 13, 14, 4 | Đưa ra pad thử, không nối |

GPIO34–39 không có pull nội; biến trở joystick tự định mức nên không cần. Hai đầu biến trở nối 3V3 và GND của B01.

### 2.3 Khối nguồn 3 AA

Chuỗi theo thứ tự:

```
Hộp 3×AA → PTC → chống ngược cực → công tắc trượt → boost 5 V → chặn dòng ngược → cáp USB-C đực liền dây
                                        │
                                detector áp pack → EN của boost, LED pin yếu
```

| Khối | Yêu cầu bắt buộc | Ứng viên để Codex kiểm datasheet |
|---|---|---|
| Hộp pin | 3×AA nối tiếp, phân cực bằng hình dạng, tiếp điểm lò xo | Tùy nguồn hàng |
| PTC | Đặt ngay sau cực dương. Dòng giữ ≥ dòng vào boost lớn nhất ở nhiệt độ môi trường cao nhất, có derating | Chọn theo phép tính ở mục 2.4 |
| Chống ngược cực | Cắm ngược 3 cell không gây dòng ngược quá mức rò. Nếu dùng P-MOSFET thì Rds(on) phải được hãng công bố ở Vgs ≤ 2,5 V | P-MOSFET mức logic, hoặc LM66100 (đã ghim nguồn ở P0-15) |
| Công tắc | Nối tiếp đường pack, định mức DC ≥ 2 A | Công tắc trượt SPDT |
| Boost | Vào 2,7–4,8 V. Ra 5,1 V ±3%. Dòng ra liên tục ≥ 0,6 A ở Vin 3,0 V. Có chân EN. Ngắt hẳn tải khi tắt | TPS61023 (ứng viên từ kiến trúc v1) |
| Detector áp | Ngưỡng falling 3,15–3,30 V tại pack trên toàn dải nhiệt của linh kiện. Ngõ ra kéo EN xuống khi dưới ngưỡng | Họ voltage detector 3 chân; ABLIC S-1009 đã ghim ở P0-15 nhưng cần biến thể ngưỡng khác |
| Chặn dòng ngược ngõ ra | Khi đầu cáp bị cắm nhầm vào nguồn 5 V khác, dòng chảy ngược vào carrier không vượt mức rò của linh kiện chặn | LM66100 hoặc Schottky; nếu Schottky thì nâng điểm đặt boost để còn ≥ 4,75 V tại đầu cáp ở 0,5 A |
| Cáp ra | USB-C đực, chỉ VBUS và GND. Rp 56 kΩ từ CC lên VBUS. Không nối D+, D− | |
| LED pin yếu | Do detector lái, nằm ở khối nguồn, không nối về B01 | |
| Điểm thử | VBAT, sau công tắc, EN, 5V_OUT, GND | |

Ba ghi chú thiết kế:

- Điện áp 3 cell alkaline mới có thể tới 4,8 V. Boost phải làm việc đúng khi Vin sát Vout.
- Chặn dòng ngược ngõ ra là nghĩa vụ an toàn thật duy nhất còn lại: người dùng có thể cắm đầu cáp của carrier vào cổng sạc hoặc máy tính. Nếu không chặn, dòng có thể đi ngược qua boost vào pin alkaline.
- Vì nguồn vào B01 là cổng USB-C, người dùng cũng có thể cấp bằng sạc dự phòng và cáp thường mà không cần thay đổi gì.

### 2.4 Phép tính Codex phải lập và ghi nguồn

| Phép tính | Đầu vào | Dùng để |
|---|---|---|
| Dòng vào boost lớn nhất | Tải ra 0,5 A ở 5,1 V; Vin 3,0 V; hiệu suất nhỏ nhất theo đồ thị datasheet | Chọn PTC, công tắc, MOSFET, cuộn cảm |
| Sụt áp đường vào | PTC + MOSFET + công tắc + tiếp điểm ở dòng trên | Kiểm tra detector không cắt sớm |
| Điện áp tại đầu cáp | Điểm đặt boost − sụt qua linh kiện chặn − dây | Đạt ≥ 4,75 V ở 0,5 A |
| Cửa sổ ngưỡng detector | Dung sai ngưỡng + hệ số nhiệt theo datasheet | Nằm trong 3,15–3,30 V |
| Tải trên chân 3V3 | Hai joystick + pull-up | ≤ 20 mA |
| Dòng tĩnh khi công tắc tắt | Mọi nhánh trước công tắc | Ghi số, không đặt ngưỡng |

Dùng MIN/MAX của datasheet khi có. Chỗ chỉ có TYP thì dùng TYP, ghi rõ là TYP và thêm một `verification_item` đo trên mẫu. Không dừng thiết kế vì thiếu MAX.

Ước tính sơ bộ của tôi, chưa kiểm datasheet: tải 0,5 A ở 5,1 V với hiệu suất 85% và Vin 3,0 V cho dòng vào khoảng 1,0 A; dòng trung bình khoảng 0,21 A cho thời gian chạy khoảng 9 giờ với cell 1900 mAh.

### 2.5 Cơ khí không cần số đo

| Mã | Quy tắc |
|---|---|
| M1 | Bo cắm vào hai hàng socket cái 1×15, bước 2,54 mm |
| M2 | Hàng A cố định. Hàng B có ba footprint song song cách hàng A 22,86 mm, 25,40 mm và 27,94 mm. Các pad cùng vị trí của ba footprint nối chung net. Khi có bo thật thì hàn một socket vào hàng vừa |
| M3 | Không dùng bốn lỗ bắt vít của bo. Bo được giữ bằng socket |
| M4 | Vùng cấm linh kiện cao dưới bo: 62 × 34 mm. Linh kiện ≤ 2 mm được đặt dưới bo |
| M5 | Đầu anten: cấm đồng trên mọi lớp, rộng hết bề ngang vùng M4, dài 15 mm tính từ chân cuối cùng về phía anten |
| M6 | Đầu USB-C của bo hướng ra mép carrier, mép carrier không vượt quá chân đầu tiên quá 3 mm |
| M7 | Nếu không hàng nào vừa, EVT0 dùng dây nhảy từ socket; ghi vào kết quả `CLONE` |

Bước 2,54 mm và ba khoảng cách hàng là giả định theo dòng bo DOIT 30 chân phổ biến, chưa đo trên mẫu. M2 và M7 tồn tại để giả định sai không làm hỏng lô PCB.

## 3. Trình tự thực hiện

Làm đúng thứ tự. Mỗi bước có điều kiện xong.

**Bước 1 — Nhận quyền.** Ghi nguyên văn khối mục 1 vào `docs/hardware/mobot-v2-founder-decision-q1-q8.md` dưới một anchor mới. Cập nhật `policy.hardware_work_pause.resumed_scope` trong `D:/StartupOS/docs/agents/tasks.json` theo đúng phạm vi F4. Xong khi validator queue exit 0.

**Bước 2 — Đóng hồ sơ cũ theo lịch sử.** Thêm mục vào `docs/hardware/supersession.md`: r12 và các hồ sơ P0-07 đến P0-15 của tay cầm là lịch sử kể từ F1. Chuyển trạng thái `MM-HW-P0-12`, `MM-HW-P0-13`, `MM-HW-P0-15` theo `allowed_transitions` của queue, lý do "superseded by founder decision F1". Không ghi là hoàn thành thiết kế. Không sửa r12.

**Bước 3 — Lập hồ sơ thiết kế r13.** Viết `docs/hardware/mobot-v2-handset-r13-design.md` gồm: sơ đồ khối, bảng net theo mục 2.1–2.3, phép tính mục 2.4 có URL, revision và số trang datasheet, MPN ứng viên cho từng khối, bảng lỗi đơn cho khối nguồn (cắm ngược pin, ngắn mạch ngõ ra, cắm nhầm đầu cáp vào nguồn khác, một cell yếu). Xong khi mọi dòng của mục 2 có nguồn hoặc được đánh dấu TYP kèm verification_item.

**Bước 4 — Lập cấu hình r13.** Tạo `docs/mission-control/hardware-config-mobot-v2-typec-r13-handset.json`, id `MOBOT-V2-CONFIG-r13-HANDSET`. Yêu cầu:

- `supersedes` trỏ r12 kèm SHA-256 của r12.
- `blocking_unknowns: []`.
- `milestone_gates` và `external_design_gates` giữ đủ bốn ID bắt buộc ở stage `schematic`: `D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`, `D17-H3-CV-PROTECTION`, `MCU-RESET-VETO-RESOURCES`. Giữ `D15B-FAB-LAYOUT` ở `layout`, `D17-B01-TRACEABILITY` ở `bom`, `D17-OFF-ASSEMBLY` ở `operation`, trạng thái OPEN.
- Viết lại `scope` và `pass_fail` của bốn cổng schematic theo cột "Tiêu chí" ở mục 4, dẫn chiếu F1.
- `verification_items`: giữ `USB`, `UVLO`, `THERMAL`, `ADC`, `CLONE`, `FAB-STACKUP-DRC`. Bỏ tám mục `JAUCH-*` kèm ghi chú thay thế bởi F1. Thêm `RUNTIME-CURRENT`, `CUTOFF-RECOVERY`, `REVERSE-PLUG`.
- Thứ tự hash và ghim review làm theo `blocking_unknowns_resolution.hash_order` và `gate_schema_contract` đã có trong r12. Không nhúng `review_sha256` vào proposal.

**Bước 5 — Tích hợp trust baseline.** `validate.mjs` hiện chỉ tin r8, r10, r11 (`trustedHandsetProposalIds`). Thêm r13 là một thay đổi validator riêng, có test trong `validate.test.mjs`, có review độc lập. Không nới bất kỳ kiểm tra nào khác. Xong khi bộ test validator đạt toàn bộ.

**Bước 6 — Review độc lập trên đúng bytes.** Gửi reviewer (Box 08) file r13 và hồ sơ bước 3. Reviewer chấm theo đúng C1–C12 ở mục 4, không thêm tiêu chí. Kết quả là một file `docs/hardware/reviews/<tên-chữ-thường-số-gạch-nối>.md` có front matter JSON gồm `type: "REVIEW_RESULT"`, `configuration_sha256`, `gate_ids`, `verdict`, `reviewer`, `relay_id` dạng `R-YYYYMMDD-Cnn`. Nếu FAIL: sửa thành revision mới, không sửa r13 đã review.

**Bước 7 — Ghim vào registry.** Trong `hardware_configurations["MOBOT-V2-CONFIG-r13-HANDSET"]`: `reference`, `configuration_sha256`, `blocking_unknowns: []`, `gate_reviews` với `review_ref` và `review_sha256` cho từng cổng PASS. Trạng thái vẫn `proposed`.

**Bước 8 — Xin Founder duyệt hash.** Trình đúng một dòng: id, SHA-256, đường dẫn review. Sau khi Founder trả lời, ghi `status: "approved"`, `approved_by: "user"`, `approved_sha256` bằng đúng hash.

**Bước 9 — Đối chiếu phụ thuộc của B1.** `MM-HW-MOBOT-REMOTE-KICAD-001` đang phụ thuộc `MM-HW-P0-08`, `-OFF-001`, `-ACTUATOR-001`, `-H3-001`, `-MCU-001`, `MM-HW-MOBOT-IF-001`, `MM-HW-GATE-PREFLIGHT-003`. Đóng bốn task cổng P0-08 bằng tham chiếu tới review r13, ghi lịch sử thật. Đổi `hardware_config_id` của B1 từ r11 sang r13. Cập nhật `input_refs` sang hồ sơ r13.

**Bước 10 — Lease và dispatch.** Sau khi Founder cấp lease schematic: `status: "in_progress"`, `execution_requested: true`, `execution_mode: "builder"`, `snapshot.kind: "file-hashes"`, `write_lease` với `lane: "hardware"`, `milestone: "schematic"`, `hardware_config_id` là r13, `base_snapshot` trùng `snapshot.reference`, `paths` nằm trong `allowed_paths` (`hardware/mobot-v2/handset-carrier/**`, `docs/hardware/mobot-v2/handset-carrier/**`), `status: "active"`. Chạy:

```bash
node docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001
```

B1 READY khi lệnh trả `dispatch_eligible: true`, `errors: []`, exit 0.

## 4. Tiêu chí review r13 (danh sách đóng)

Mỗi tiêu chí kiểm được bằng cách đọc bảng net và datasheet. Không tiêu chí nào cần đo.

| Mã | Cổng | Tiêu chí |
|---|---|---|
| C1 | D17-OFF-DESIGN | Bảng net: VIN và EN của B01 không nối (N1, N3) |
| C2 | D17-OFF-DESIGN | Bảng net: mọi net chạm header B01 thuộc ba loại của N4 |
| C3 | D17-OFF-DESIGN | Công tắc nối tiếp đường pack; khi tắt, 5V_OUT không có nguồn |
| C4 | D17-ACTUATOR-PRODUCT | Không có actuator, cuộn dây, chốt điện trong BOM |
| C5 | D17-ACTUATOR-PRODUCT | Đường nguồn từ carrier sang B01 chỉ là một đầu cáp USB-C; B01 có một cổng USB-C |
| C6 | D17-H3-CV-PROTECTION | Không có IC sạc, không có cổng sạc, không có pin gắn chết |
| C7 | D17-H3-CV-PROTECTION | Có linh kiện chặn dòng ngược ở ngõ ra và chống ngược cực ở ngõ vào; datasheet cho dòng rò ngược |
| C8 | D17-H3-CV-PROTECTION | Có PTC ngay sau cực dương; dòng giữ có phép tính derating |
| C9 | D17-H3-CV-PROTECTION | Cửa sổ ngưỡng detector tính từ datasheet nằm trong 3,15–3,30 V |
| C10 | MCU-RESET-VETO-RESOURCES | Không dùng chân bị cấm ở N5; trục joystick chỉ trên ADC1 (N6) |
| C11 | MCU-RESET-VETO-RESOURCES | Tải 3V3 tính được ≤ 20 mA; không có nguồn carrier nối vào net 3V3 |
| C12 | Chung | Mỗi giá trị TYP dùng thay MAX có một verification_item tương ứng |

Một tiêu chí không đạt thì FAIL cổng tương ứng. Phát hiện nằm ngoài C1–C12 được ghi thành verification_item hoặc ghi chú cho mốc `layout`/`bom`/`operation`, theo F3.

## 5. Khi nào Codex dừng và hỏi Founder

Chỉ ba trường hợp:

1. Không linh kiện nào có hàng đáp ứng một dòng "yêu cầu bắt buộc" ở mục 2.3.
2. Tổng giá ước tính của tay cầm làm vượt trần 1 triệu đồng cho cả bộ.
3. Một tiêu chí C1–C12 không thể đạt với kiến trúc mục 2.

Các trường hợp khác không dừng: thiếu số MAX thì dùng TYP kèm verification_item; ứng viên không đạt thì chọn ứng viên khác đạt cùng yêu cầu và ghi lại; ý tưởng cải tiến thì ghi vào backlog, không đưa vào r13.

## 6. Nghiệm thu B1 sau khi có lease

1. Dự án KiCad nằm trong `hardware/mobot-v2/handset-carrier/`.
2. ERC không lỗi; mỗi cảnh báo có giải thích.
3. Schematic khớp bảng net của hồ sơ r13; có script hoặc bảng đối chiếu C1–C12 trên netlist xuất ra.
4. Footprint ba hàng theo M2 có trong thư viện dự án.
5. BOM sơ bộ có MPN, giá ước tính và nguồn hàng.

Layout là lease khác, cần `D15B-FAB-LAYOUT` PASS. Số lớp PCB quyết định ở mốc đó.

## 7. Giới hạn của tài liệu này

- Tôi đã đọc `validate.mjs` (các đoạn về hardware proposal, cổng và lease), bản ghi task B1, registry r12 và file r12. Chưa chạy validator.
- Chưa mở datasheet của TPS61023, LM66100 hay detector. Các thông số ở mục 2.3 là yêu cầu thiết kế; ứng viên phải được Codex kiểm theo datasheet.
- Bảng chân mục 2.2 dựa trên silkscreen đã chép và đặc tính chung của ESP32, chưa kiểm trên mẫu.
- `allowed_transitions` của queue chưa được tôi đọc; bước 2 và bước 9 phải theo đúng luật chuyển trạng thái hiện có.
- Robot không nằm trong tài liệu này. `MM-HW-MOBOT-ROBOT-KICAD-001` đang phụ thuộc B1 tay cầm nên sẽ được mở khóa sau.
