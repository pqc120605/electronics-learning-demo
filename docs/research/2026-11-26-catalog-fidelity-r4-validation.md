# Nghiệm thu local R4 · Cảm biến và điều khiển hiển thị

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R4-1**. Phạm vi CAT-04, CAT-05, EDA-03, SIM-02 và SIM-03. Cấu hình được duyệt theo SHA-256 `674FD405FCB4CA7641FE2F20E29023D2727F03E5EDCC1CFBE64DFEAE6803FAA3`. [Hồ sơ đã duyệt](2026-11-26-catalog-fidelity-r4-proposal.md)

## Hình học và luồng sử dụng

- 15 mã xuất hiện trong kho với biến thể đặt hàng, hình 2D có số pad, mô hình 3D xoay và chọn chân, footprint KiCad tải được và bài đo trên bàn tự do. Mỗi bài có bộ điều khiển ảo, nguồn theo cấu hình, các dây giao tiếp và điều kiện thử mất kết nối. Hai DIP qua khe breadboard trong luồng lắp thử từ kho.
- [Manifest R4](../../src/data/catalog-r4-packages.json) lưu SHA-256 nguồn KiCad, SHA-256 footprint xuất, GLB, số pad, kích thước và phép kiểm tiếp xúc. Các footprint OPT3001, MAX6951 và TLC5928 dẫn xuất từ bản vẽ hãng theo hồ sơ đã khóa. OPT3001 và VL53L0X dùng mesh dựng theo outline. BME280 dùng thân tham chiếu cao khoảng 0,93 mm và đánh dấu lỗ thông hơi trên mặt nắp. Các chi tiết quang và lỗ thông hơi thể hiện theo bề mặt package. Căn thân DS3231 và TLC5928 theo chiều cao package đã đối chiếu.
- Mô hình số chạy qua net của tài liệu mạch và đồng hồ ảo. Trạng thái thanh ghi, phép chuyển đổi và độ sáng LED là kết quả của subset giáo dục đã kiểm. Mục tra cứu MAX6951 ghi quy định EP nối GND trên PCB thật. Bài ảo R4 dùng EP như điểm hình học ngoài luồng tín hiệu. Chưa kiểm mạch thật, dung sai quang, nhiệt, EMC hoặc nạp firmware lên thiết bị. Bản nháp lưu trong trình duyệt và có thể xuất file.

## Kiểm từng mã

| Mã | Hành vi được kiểm |
| --- | --- |
| DS18B20+ | Reset/presence, scratchpad khởi tạo 85 °C, hai mẫu có dấu, chờ 750 ms, CRC-8 và tháo DQ. |
| TMP102AIDRLR | 4 strap địa chỉ, nhiệt độ 12 bit, cửa sổ ALERT 30/28 °C, mất SDA. |
| TMP117AIDRVR | ID 0117, one-shot 15,5 ms, cờ DRDY, đọc trước và sau chuyển đổi. |
| HDC1080DMBR | ID thiết bị và nhà sản xuất, hai mẫu nhiệt độ/độ ẩm 14 bit, NACK khi còn bận. |
| OPT3001DNPR | Chuyển địa chỉ theo ADDR, pull-up 10 kΩ, CRF và hai mẫu 10,24/320 lx. |
| BME280 | Hiệu chuẩn từ byte đọc trên bus, forced-mode, status đang đo, hai mẫu bù nhiệt độ/áp suất/độ ẩm, CSB và SDO. |
| DS3231SN# | BCD 24 giờ, chuyển ngày và năm nhuận, tick với VBAT và OSF sau khi mất hai nguồn. |
| ADXL345BCCZ | Địa chỉ thay thế, ID, XYZ little-endian, 100 Hz và standby. |
| VL53L0CXV0DH/1 | 2,8 V, XSHUT, thời gian đối chiếu single-shot, đọc 120 và 645 mm và xóa cờ. |
| LIS3DHTR | SA0, ID, XYZ 12 bit, BDU và đọc liền bằng auto-increment. |
| MAX6951CEE+ | Khung 16 bit, chốt /CS, giải mã hai digit qua mạng tải có dây, shutdown giữ dữ liệu, display test và nhánh LED hở. |
| TLC5940NT | 192 bit và PWM 12 bit từng kênh, XLAT, BLANK, GSCLK và miền Hi-Z. |
| TLC5928PWPR | 16 bit, LAT, SOUT, BLANK, hai mẫu và từng kênh. |
| TLC59116IPWR | I²C và địa chỉ đổi theo A0, reset, MODE1, LEDOUT và PWM từng kênh. |
| TLC5916IN | Dịch 8 bit, LE, /OE, SDO, mẫu và ngõ ra Hi-Z theo chân điều khiển. |

Ca ghép TMP102–TLC59116 đọc I²C rồi cập nhật OUT0 và đọc lại LEDOUT0. Kiểm 31 °C bật, 29 °C giữ sáng và 27 °C tắt. Hai thiết bị trùng địa chỉ phải báo xung đột. Rút dây giao tiếp làm giao dịch hỏng theo đúng net đã sửa.

## Kiểm thử R4

- **33/33 ca Node R4 đạt** trong [catalog-r4.test.mjs](../../tests/catalog-r4.test.mjs) và [catalog-r4-protocol.test.mjs](../../tests/catalog-r4-protocol.test.mjs). Kiểm từng mã với hai bộ mẫu, mất dây điều khiển, số pad, hash và vị trí lắp. Kiểm tra schema cho cả 15 tài liệu mạch thử.
- **16/16 ca Chromium R4 đạt qua hai lượt.** Kiểm từng mã từ kho tới bàn tự do, gồm chọn cùng chân ở 2D, footprint và 3D, xoay mô hình, tải footprint và chạy qua dây đã lắp. Kiểm bố cục trên desktop và ở 390 px. Chạy lại 7 ca chịu ảnh hưởng trên build cuối, gồm BME280, 5 IC LED và mạch ghép. Ca mạch ghép đạt cả lưu bản trước, tiếp tục nháp, xuất dự án, tháo dây nhận NACK rồi nhập file để khôi phục.
- KiCad 10.0.7 đọc và xuất SVG cả **15/15 footprint**. GLB đều dưới 177 KiB và được đọc qua trình đọc mô hình của Mạch Mở.
- R4 lưu LED theo `anode/cathode`. Nháp sinh trong lượt đầu dùng alias `a/k` được khôi phục theo đúng cực. Hai ID dây REXT có thể trùng ID linh kiện ở nháp tạm. Trình đọc đổi riêng ID dây trùng, giữ ID linh kiện và chuyển điểm gấp khúc sang ID dẫn xuất. Ca kiểm [round-trip](../../tests/catalog-r4.test.mjs) xác nhận dữ liệu này.

## Hồi quy R1, R2A, R2B, R2C và R3

- **136/136 ca Node đạt** trên snapshot cuối, bao gồm R1, R2A, R2B, R2C, R3, R4, thư viện, kiểm hình học và định tuyến dây. Ba ca xuất/nhập bản nháp cũng đạt trong lượt kiểm riêng cùng 33 ca R4.
- **62/62 ca Chromium đạt.** R1 8 ca, R2A 15 ca, R2B 13 ca, R2C 6 ca, R3 20 ca. Các ca ngspice của R1 và R3 thực thi qua WASM trên trình duyệt. Sửa khôi phục nháp R4 chỉ áp dụng cho tài liệu có linh kiện R4.

## Kiểm tra build và môi trường

- `npm.cmd run typecheck`, `npm.cmd run build:local` và `git diff --check` đạt. Vite vẫn ghi cảnh báo từ `rp2040js` và import động `builderLessons.ts`.
- Lượt `npm.cmd test` toàn repo ghi **943/956 đạt**. Bốn ca cần Arduino AVR core, tám ca lỗi quyền kết nối loopback trong sandbox, một ca định tuyến 16 dây vượt 200 ms ở lượt chạy chung. Ca tốc độ định tuyến đã đạt khi chạy lại cùng bộ 136 ca. Chromium chạy qua Vite chỉ bind vào loopback.
- [Kho linh kiện R4 trên laptop](http://127.0.0.1:5244/components?component=tmp102) · [Mạch ghép TMP102 và TLC59116](http://127.0.0.1:5244/build/freestyle?fixture=r4-i2c-led).
