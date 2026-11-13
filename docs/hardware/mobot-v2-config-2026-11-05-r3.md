# MoBot V2 · Đề xuất cập nhật cấu hình r3

05/11/2026 · `MOBOT-V2-CONFIG-r3` · Phạm vi đề xuất cho bước KiCad: schematic và layout carrier robot/tay cầm sau khi duyệt cấu hình và xử lý đầu vào còn thiếu.

**BOM áp dụng:** lấy toàn bộ số lượng và yêu cầu từ [Excel r2](mobot-v2-bom-review-2026-11-05-r2.xlsx), SHA‑256 `89E87D6D5B1E7D80A20E20C0055E1EF7D87983F1FDDDE54B9DD4681646E1DC46`, rồi áp dụng bảng thay đổi dưới đây. Tham chiếu [hồ sơ kỹ thuật r2](mobot-v2-bom-review-2026-11-05-r2-handoff.md) cho các khối không đổi. Bản r2 và dự toán 1,194–1,714 triệu đồng đã được người dùng chấp nhận. Chi phí linh kiện thay thế r3 cần xác nhận riêng.

| Dòng | Lựa chọn đề xuất r3 | Thông tin làm đầu vào |
|---|---|---|
| B01 | **DFRobot FireBeetle 2 ESP32-E DFR0654-F**, bản có header, đối chiếu hồ sơ bo V1.0. Số lượng 2 | ESP32-WROOM-32E, USB-C 5 V, CH340. Kích thước bo tham khảo 60 × 25,4 mm. Dùng bản vẽ kích thước V1.0 để đối chiếu hàng chân, lỗ và đầu cắm. Đây là thay đổi họ board/USB-UART so với HH004223. [Hồ sơ hãng](https://wiki.dfrobot.com/dfr0654-f/) · [Bản vẽ kích thước](https://dfimg.dfrobot.com/wiki/24246/DFR0654-F_firebeetle-2-esp32-e_dimension_V1.0.png) · [Sơ đồ V1.0](https://dfimg.dfrobot.com/wiki/24246/DFR0654-F_firebeetle-2-esp32-e_schematics_V1.0.pdf) · [Kích thước nhà phân phối](https://www.anodas.lt/en/firebeetle-esp32-e-iot-microcontroller-with-header-dfrobot-dfr0654-f) |
| B02 | **Pololu #992**, Micro Metal Gearmotor LP 6 V, 100,37:1, không encoder. Số lượng 2 | Không tải điển hình **130 rpm, 40 mA** ở 6 V. Dòng kẹt ngoại suy **0,36 A**, mô-men kẹt ngoại suy **0,74 kgf·cm**. Ở điểm hiệu suất cao nhất: **100 rpm, 0,10 A, 0,17 kgf·cm**. Thân 10 × 12 × 25 mm, trục D Ø3 mm dài 9 mm theo mô tả hãng. [Thông số và bản vẽ Pololu](https://www.pololu.com/product/992/specs) |
| B21 | Socket/header tương thích DFR0654-F V1.0 | Thay cấu hình 2 thanh 1×15 mỗi carrier của r2. Chốt số chân, tâm hàng và chiều cao theo bản vẽ và mẫu trước khi khóa footprint. |

HH004223 có mã bán hàng và mô tả CP2102/30 chân, nhưng nguồn đã kiểm chưa cho thấy bản vẽ footprint và sơ đồ nguồn USB gắn với đúng revision. Listing GA12-N20 6 V/100 rpm công bố điện áp và tốc độ, chưa có dữ liệu dòng kẹt/mô-men cho đúng mã. Không chuyển thông số Pololu sang motor GA12-N20 của r2. [HH004223](https://linhkienvietnam.vn/module-node-mcu-32s-esp32-devkitc-dung-module-esp-wroom-32) · [GA12-N20](https://dientutuyetnga.com/products/ga12-n20-dong-co-giam-toc-6v-100rpm)

## Giới hạn đầu vào trước KiCad

- **Nguồn và motor:** 2 × 0,36 A = **0,72 A** là tổng dòng kẹt ngoại suy điển hình trên nhánh 6 V, tương đương 4,32 W điện đầu vào motor tại điểm đó. Dùng để sàng lọc B03/B04/B07, không dùng làm giới hạn đảm bảo cho dòng khởi động, dòng pack hoặc dòng ở nhiệt độ thấp. Cần đánh giá sai số, hai motor khởi động đồng thời, dòng giới hạn, pin thấp, nhiệt và tải logic/âm thanh cùng lúc. Pololu cảnh báo kẹt có thể làm hỏng motor/hộp số. Không lấy mô-men kẹt làm mô-men chạy liên tục. [Pololu](https://www.pololu.com/product/992)
- **Cơ khí:** 100 rpm là tốc độ ở điểm hiệu suất cao nhất, không phải 100 rpm không tải như motor r2. Trước khi kết luận đủ kéo bốn bánh, cần tính từ khối lượng, đường kính bánh, tỉ số truyền ngoài, lực quay tại chỗ và tổn hao bộ truyền. Có thể dùng khoảng tải giả định được chốt để thiết kế nguyên mẫu, sau đó kiểm thực tế riêng.
- **Board:** giữ cổng sạc pack B20 riêng. FireBeetle có sạc 1S trên bo; đầu pin trên bo không nằm trong kiến trúc nguồn MoBot. Tuyệt đối không nối pack 2S vào cổng pin 1S. Cần review đường cấp nguồn carrier và USB lập trình trên đúng revision, điều kiện cắm đồng thời, bố trí anten, ngân sách GPIO và socket theo mẫu. Tài liệu kích thước là bằng chứng danh nghĩa, chưa xác nhận revision hàng giao hay fit cả carrier. [DFRobot](https://wiki.dfrobot.com/dfr0654-f/)

## Chi phí của thay đổi

Giá tham chiếu cho **hai DFR0654-F là 21,24 USD** và **hai Pololu #992 là 47,90 USD**, cộng **69,14 USD** trước vận chuyển/thuế. Bốn linh kiện tương ứng của r2 chiếm **410.000đ**. Phần còn lại theo dự toán r2 là **784.128–1.304.128đ**, chưa điều chỉnh socket và các phát sinh do đổi board. Cần báo giá giao tới tay để chốt tổng r3. [DigiKey](https://www.digikey.com/en/products/detail/dfrobot/DFR0654-F/13978505) · [Pololu](https://www.pololu.com/product/992)

**Quyết định đề nghị:** xác nhận có đổi B01/B02/B21 theo r3 và chấp nhận báo giá lại hay giữ B01/B02 r2 để lấy hồ sơ chính xác từ nhà cung cấp/mẫu. r3 là thay đổi vật chất của cấu hình. Chỉ bắt đầu pin map, schematic và layout sau khi duyệt đúng revision/hash và giải quyết đầu vào chặn theo [quy trình dự án](../mission-control/parallel-build-policy.md).
