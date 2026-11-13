# MoBot V2 — đề xuất reset về mẫu thử EVT0

- Ngày: 11/11/2026. Người viết: Claude (vai trò review, không sửa hồ sơ của Codex).
- Trạng thái: **ĐỀ XUẤT, chưa có hiệu lực.** Chỉ có hiệu lực với những mục Founder ký ở mục 7.
- Người đọc: Founder quyết định; Codex lead thực hiện sau khi Founder chuyển.
- Không thay đổi: r12 (`8b3456…427b`), queue, trạng thái `USER_PAUSED` của P0-12. Tài liệu này không resume Hardware.
- Liên quan: `docs/agents/runs/MM-HW-P0-13/BOX01-SIMPLIFICATION-OPTION.md` là phương án đơn giản hóa chưa được chọn của Codex. Tài liệu này độc lập với tệp đó và không thay thế nó.

## 1. Vấn đề

Từ 05/11 đến 10/11 hồ sơ Hardware có 173 tệp, 12 revision cấu hình và 15 lượt P0. Chưa có schematic. B1 vẫn NOT_READY, bốn cổng trước schematic vẫn OPEN.

Nguyên nhân không nằm ở linh kiện. Có năm nguyên nhân, xếp theo mức ảnh hưởng:

| # | Nguyên nhân | Bằng chứng trong hồ sơ | Hậu quả |
|---|---|---|---|
| 1 | Bo ESP32 mẫu chưa được đo | `hardware-config-mobot-v2-typec-r8-robot.json`: `sku`, `revision`, `dimensions`, `internal_electrical` đều UNKNOWN/TBD. Q8: "Founder không đo được mẫu" | Mọi giả định về đường nguồn của bo phải lấy trường hợp xấu nhất |
| 2 | Yêu cầu "cách ly toàn bộ I/O trong CHARGE/PROGRAM" | `mobot-v2-handset-b01-architecture-v1.md`; Founder giữ lại ngày 09/11 | P0-13: 36 IC, hai nhánh an toàn A/B, isolator, watchdog; cassette khóa cơ 100 N/200 N |
| 3 | "Trần 4,200 V ở mọi điều kiện" cho pack Li-ion | P0-08; `mobot-v2-p0-06-handset-charger-candidates.md` tính IC sạc ±0,5% cho tối đa 4,221 V | Cửa sổ comparator 27,6 mV; TLV9031, LTC6702, LTC6752, ADCMP600, TPS3760 đều không đạt |
| 4 | Đòi cận MAX toàn miền cho mọi tham số trước khi được vẽ schematic | P0-13, P0-15: mỗi lượt kết thúc bằng phản ví dụ mới | Không có điểm dừng; số việc mở tăng theo từng lượt |
| 5 | Tay cầm chiếm đường găng | D1: "Robot carrier là lõi Starter. Tay cầm là module riêng" | Nhánh robot không có tệp mới từ 07/11 |

Nguyên nhân 2 và 3 là yêu cầu do chính quy trình sinh ra, không phải yêu cầu của sản phẩm. Mức chứng minh đang áp (hai kênh độc lập, chứng minh từng lỗi đơn, cận MAX toàn đời) là của hệ an toàn chức năng. Sản phẩm là bộ kit học tập 5 V, dòng dưới 1 A, giá dưới 1 triệu đồng.

Hướng 3 AA NiMH sạc ngoài (Founder chọn B ngày 10/11) đã gỡ nguyên nhân 3. P0-15 vẫn mang theo nguyên nhân 2 và 4 nên tiếp tục kẹt.

## 2. Nguyên tắc đề xuất

1. **Xóa yêu cầu bằng kiến trúc, không chứng minh yêu cầu.** Nếu carrier tay cầm không có miền nguồn riêng thì không có gì để cách ly.
2. **Tách mẫu thử khỏi sản phẩm.** EVT0 là mẫu do người lớn dùng trên bàn. Cận MAX, tuổi thọ và chứng nhận đồ chơi trẻ em thuộc cổng trước khi bán, không thuộc cổng trước schematic.
3. **Đo thay cho suy luận.** Thứ gì đo được trong 10 phút thì đo, không lập hồ sơ cận.
4. **Robot trước, tay cầm sau.** Theo D1 và D4, robot điều khiển được qua Web Serial và Wi-Fi mà không cần tay cầm.

## 3. Bước 0 — đo bo mẫu

Dụng cụ: đồng hồ vạn năng có thang diode, thước kẹp. Không cấp điện.

| Phép đo | Cách đo | Dùng để |
|---|---|---|
| Diode VBUS → VIN | Thang diode, que đỏ ở chân VBUS cổng USB-C, que đen ở chân VIN; rồi đảo que | Xác nhận bo có diode chặn dòng từ VIN ngược về cổng USB |
| Thông mạch VIN ↔ ngõ vào AMS1117 | Thang thông mạch | Xác nhận VIN nối thẳng rail 5 V |
| Rd trên CC1, CC2 | Thang điện trở từ CC1, CC2 xuống GND | Biết bo có 5,1 kΩ hay không (ảnh hưởng nguồn USB-C chuẩn) |
| Mã IC cầu USB và ổn áp | Đọc bằng mắt/kính lúp | Chốt CH340 loại nào, ổn áp loại nào |
| Kích thước bo, tâm 4 lỗ, khoảng cách hai hàng chân, bước chân | Thước kẹp | Footprint carrier |

Ghi chú về bằng chứng: schematic tham chiếu `assets/boards/esp32-devkit-v1-30pin/upstream/ESP32 Dev Kit.kicad_sch` có linh kiện `D_Schottky` và `AMS1117-3.3`. Tôi chưa dò net của diode đó và chưa đối chiếu với mẫu của Founder. Phép đo trên là thứ quyết định, không phải schematic tham chiếu.

Nếu Founder không có dụng cụ: một đồng hồ vạn năng và một thước kẹp phổ thông là đủ. Đây là khoản chi mở khóa nhiều nhất trong toàn bộ dự án.

## 4. Tay cầm EVT0

### 4.1 Kiến trúc

```
3×AA NiMH (tháo rời, sạc ngoài)
   │
   ├─ PTC ─ chống ngược cực ─ công tắc nguồn
   │
   ├─ detector áp pack ──► EN
   │                        │
   └────────────────────► boost 5 V ──► cáp USB-C liền (có Rp trên CC) ──► cổng USB-C của bo ESP32

Bo ESP32:  chân 3V3 ──► joystick ×2, nút nhấn (toàn linh kiện thụ động)
           GPIO/ADC ◄── joystick, nút
```

Ba điểm làm cho bài toán cũ biến mất:

- **Một miền nguồn.** Joystick và nút lấy điện từ chân 3V3 của chính bo ESP32. Carrier không có rail riêng nối vào GPIO. Khi bo mất điện thì joystick cũng mất điện. Không còn dòng ký sinh qua diode bảo vệ của GPIO, nên không cần phần tử cách ly nào.
- **Một cổng, một cáp.** Pin cấp cho bo qua đúng cổng USB-C của bo. Muốn nạp firmware phải rút cáp pin rồi cắm cáp máy tính. Hai nguồn không thể cùng nối. Đây chính là ý ban đầu của kiến trúc v1 ("cổng USB-C onboard là đường cấp nguồn duy nhất của B01"). Liên động này thay cho cassette, khóa cơ, actuator, watchdog cửa sổ và isolator.
- **Không có Li-ion.** Không có mạch sạc trên bo, nên không có bài toán 4,200 V và H3.

### 4.2 Linh kiện theo chức năng

Chưa chọn MPN. Chọn MPN là việc của Codex sau khi Founder ký.

| Chức năng | Yêu cầu | Ghi chú |
|---|---|---|
| Boost 5 V | Vào 2,7–4,5 V, ra 5 V, dòng ra ≥ 0,6 A | TPS61023 đã là ứng viên trong kiến trúc v1 |
| Detector áp pack | Ngưỡng falling trong 3,15–3,30 V, có hysteresis, ngõ ra kéo EN của boost | Tương đương 1,05–1,10 V mỗi cell. Cửa sổ 1,05–1,15 V/cell trong P0-15 là allocation nghiên cứu, Founder chưa duyệt |
| Cầu chì | PTC tự phục hồi ngay sau cực dương hộp pin | Giá trị giữ chọn theo dòng vào boost lớn nhất |
| Chống ngược cực | P-MOSFET hoặc diode lý tưởng | LM66100 đã được ghim nguồn trong P0-15 |
| Cáp ra | USB-C đực liền dây, Rp 56 kΩ từ CC lên VBUS | Nguồn 5 V mặc định theo USB-C |
| Hộp pin | 3×AA, có lò xo, phân cực bằng hình dạng | |

Không dùng trong EVT0: detector từng cell, latch sau cắt, đo áp pin bằng ADC của ESP32. Báo pin yếu bằng một LED trên mạch nguồn do detector lái. Đo pin bằng ADC cần thêm một dây từ pack sang GPIO và có thể thêm sau.

Cắt ở mức pack là cách làm thông thường của thiết bị 3 cell NiMH. Nó không bảo vệ được trường hợp một cell yếu hơn hẳn hai cell còn lại. Rủi ro này được ghi nhận cho EVT0 và xem lại trước khi bán.

### 4.3 Ước tính (chưa đo)

| Đại lượng | Giả định | Kết quả |
|---|---|---|
| Dòng trung bình của bo ở 5 V | 130 mA khi radio chạy | 0,65 W |
| Công suất lấy từ pin | Hiệu suất boost 85% | 0,76 W |
| Dòng pin trung bình | Pack 3,6 V danh nghĩa | 0,21 A |
| Thời gian chạy | Cell 1900 mAh | khoảng 9 giờ |
| Dòng vào boost lúc đỉnh | Bo lấy 0,5 A ở 5 V, pack 3,0 V | khoảng 1,0 A |

Các số này là ước tính của tôi từ giả định trong bảng. Dòng thật của bo phải đo trên EVT0.

### 4.4 Những gì đề xuất này thay thế

Nếu Founder ký mục 7, các nghĩa vụ sau không còn áp dụng cho tay cầm EVT0: cách ly I/O (OFF O-A + O-C), G-B 16 vai trò và E1–E4, M-A và cassette captive, envelope 100 N/200 N, watchdog nhánh W, gate H3. Hồ sơ P0-07 đến P0-15 được giữ làm lịch sử, không xóa.

## 5. Robot EVT0

Robot là lõi Starter và phải đi trước. Tôi chỉ đọc cấu hình r8-robot, chưa đối chiếu lại r7 và các hồ sơ VM/relay ngày 06/11. Bảng dưới là hướng xử lý, Codex cần đối chiếu với r7 trước khi áp dụng.

| Mục mở trong r8-robot | Hướng xử lý cho EVT0 |
|---|---|
| ROBOT-R6: chống cấp đồng thời, cấp ngược, cách ly I/O Type-C | Diode lý tưởng trên đường 5 V từ buck vào VIN. Điện trở nối tiếp trên các đường GPIO sang driver motor. Dựa trên kết quả đo ở bước 0 |
| ROBOT-R3 và Q7: pack 2S | Chọn pack 2S có PCM tích hợp, có sẵn tại Việt Nam. Cần Founder chọn |
| ROBOT-R5: mạch sạc trên bo, CE, veto motor khi sạc | Đề nghị EVT0 sạc ngoài bằng bộ sạc 2S rời. Bỏ được R5. Cần Founder quyết |
| ROBOT-R1: dòng đỉnh motor | Chuyển sang đo trên EVT0 theo cơ chế D10 |
| ROBOT-R2: phát hiện kẹt | Giới hạn dòng của driver cộng firmware; đo trên EVT0 |
| ROBOT-R4: năng lượng hồi về VM | Tụ bulk và TVS trên VM; đo trên EVT0 |
| STACKUP-DRC | Xem mục 6 |

Giữ nguyên: UVLO robot falling 6,40–6,60 V tại pack (Founder chốt 06/11).

## 6. PCB hai lớp

Q5 chọn 4 lớp cho cả hai carrier. Đề nghị xét lại thành 2 lớp. Carrier chỉ mang bo ESP32 cắm chân, joystick, driver motor và mạch nguồn. Không có tín hiệu tốc độ cao trên carrier. Hai lớp với mặt GND liền rẻ hơn, dễ sửa tay hơn và dễ cho người học đọc hơn. Đây là khuyến nghị, quyết định thuộc Founder.

## 7. Quyết định cần Founder ký

Mỗi dòng độc lập. Dòng không ký thì quyết định cũ còn hiệu lực.

| Mã | Nội dung | Quyết định cũ bị thay |
|---|---|---|
| E1 | Tay cầm EVT0 dùng kiến trúc một miền nguồn, cấp điện qua cổng USB-C của bo, theo mục 4 | "Giữ cách ly toàn bộ I/O" (09/11); G-B16; M-A; envelope 100 N/200 N; nhánh W |
| E2 | Cắt pin NiMH ở mức pack cho EVT0 | Hướng detector từng cell trong P0-15 |
| E3 | Cấp quyền EVT0: schematic và layout KiCad, mua linh kiện mẫu, đặt PCB mẫu, cấp điện và flash trên bàn do người lớn thao tác | Các lệnh cấm trong handoff 10/11, chỉ trong phạm vi EVT0 |
| E4 | Robot đi trước tay cầm | Thứ tự làm việc hiện tại |
| E5 | Robot EVT0 sạc pack 2S bằng bộ sạc rời | ROBOT-R5 |
| E6 | PCB 2 lớp cho cả hai carrier | Q5 |
| E7 | Cổng trước schematic của EVT0 chỉ gồm: kết quả đo bước 0, sơ đồ khối, bảng dòng/áp danh nghĩa theo datasheet. Cận MAX và các verification items chuyển sang đo trên EVT0 | Bốn cổng B1 và yêu cầu cận MAX trước schematic |

Không đề nghị thay đổi: cổng chứng nhận đồ dùng trẻ em trước khi bán; quyền riêng trước sản xuất hàng loạt; UVLO robot 6,40–6,60 V; D1–D4; trần giá dưới 1 triệu đồng.

Nếu Founder muốn giữ sạc Li-ion trên tay cầm thì E1 và E2 không áp dụng và bài toán 4,200 V quay lại. Khi đó việc cần làm là nới "trần 4,200 V tuyệt đối" thành giới hạn theo datasheet pack, vì không IC sạc phổ thông nào đạt trần tuyệt đối.

## 8. Tiêu chí hoàn thành EVT0

1. Bước 0 có kết quả đo ghi vào tệp evidence.
2. Schematic robot và tay cầm qua ERC, có review độc lập.
3. Layout qua DRC theo luật của nhà sản xuất PCB được chọn.
4. Mẫu lắp xong: bo khởi động bằng pin; nạp firmware qua cáp máy tính; tay cầm điều khiển được robot.
5. Đo trên mẫu: dòng tay cầm, ngưỡng cắt pack, dòng đỉnh motor, UVLO robot, nhiệt độ bề mặt linh kiện nguồn.

Sau mục 5 mới quyết định những gì cần siết để thành sản phẩm.

## 9. Giới hạn của tài liệu này

- Tôi đã đọc: `HARDWARE-HANDOFF-2026-11-10.md`, P0-13, P0-15, biên bản Founder Q1–Q8 và các bổ sung, ma trận B1, kiến trúc tay cầm v1, cấu hình r8-robot, evidence bo mẫu. Chưa đọc phần còn lại trong 173 tệp.
- Không chạy kiểm tra, script hay validator nào. Không đo thiết bị.
- Các con số ở mục 4.3 là ước tính. Các hướng xử lý ở mục 5 chưa đối chiếu r7.
- Yêu cầu của tiêu chuẩn đồ chơi điện áp dụng tại Việt Nam chưa được tra cứu trong tài liệu này. Việc đó thuộc cổng trước khi bán.
