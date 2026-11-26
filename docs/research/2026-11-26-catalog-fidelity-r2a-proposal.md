# Cấu hình đề xuất R2A cho kho linh kiện Mạch Mở

Ngày 26/11/2026. R2A gồm 14 trong 72 mục còn lại. Mỗi hàng chốt một mã đặt hàng Texas Instruments, một package cơ khí và phép thử chức năng. Mã khác hậu tố cần đối chiếu tài liệu của đúng biến thể trước khi dùng.

## Biến thể và nghiệm thu

| ID hiện có | Mã đặt hàng | Package | Chức năng | Ca kiểm dự kiến | Nguồn sơ cấp |
| --- | --- | --- | --- | --- | --- |
| `sn74hc02` | SN74HC02N | PDIP-14 N | Bốn cổng NOR | Cả bốn tổ hợp đầu vào trên cả bốn cổng, kể cả hai đầu vào cùng cao. | [Biến thể SN74HC02N](https://www.ti.com/product/SN74HC02/part-details/SN74HC02N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc02.pdf) |
| `sn74hc04` | SN74HC04N | PDIP-14 N | Sáu cổng NOT | Hai mức vào trên cả sáu cổng. | [Biến thể SN74HC04N](https://www.ti.com/product/SN74HC04/part-details/SN74HC04N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc04.pdf) |
| `sn74hc32` | SN74HC32N | PDIP-14 N | Bốn cổng OR | Cả bốn tổ hợp trên từng cổng. | [Biến thể SN74HC32N](https://www.ti.com/product/SN74HC32/part-details/SN74HC32N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc32.pdf) |
| `sn74hc86` | SN74HC86N | PDIP-14 N | Bốn cổng XOR | Cả bốn tổ hợp, kiểm hai đầu vào bằng nhau. | [Biến thể SN74HC86N](https://www.ti.com/product/SN74HC86/part-details/SN74HC86N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc86.pdf) |
| `sn74hc125` | SN74HC125N | PDIP-14 N | Bốn bộ đệm ba trạng thái | Cả bốn kênh. OE thấp truyền mức, OE cao đưa đầu ra về Z. | [Biến thể SN74HC125N](https://www.ti.com/product/SN74HC125/part-details/SN74HC125N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc125.pdf) |
| `sn74hc126` | SN74HC126N | PDIP-14 N | Bốn bộ đệm ba trạng thái | Cả bốn kênh. OE cao truyền mức, OE thấp đưa đầu ra về Z. | [Biến thể SN74HC126N](https://www.ti.com/product/SN74HC126/part-details/SN74HC126N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc126.pdf) |
| `sn74hc138` | SN74HC138N | PDIP-16 N | Giải mã 3 sang 8 | Quét tám địa chỉ và các chân cho phép. Chỉ ngõ được chọn xuống thấp khi cho phép. | [Biến thể SN74HC138N](https://www.ti.com/product/SN74HC138/part-details/SN74HC138N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc138.pdf) |
| `sn74hc139` | SN74HC139N | PDIP-16 N | Hai bộ giải mã 2 sang 4 | Quét bốn địa chỉ trên cả hai nửa. Thử cho phép một nửa trong khi nửa kia tắt. | [Biến thể SN74HC139N](https://www.ti.com/product/SN74HC139/part-details/SN74HC139N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc139.pdf) |
| `sn74hc151` | SN74HC151N | PDIP-16 N | Bộ chọn 8 sang 1 | Quét tám ngõ vào với cả hai đầu ra thuận và đảo, kiểm trạng thái khi vô hiệu. | [Biến thể SN74HC151N](https://www.ti.com/product/SN74HC151/part-details/SN74HC151N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc151.pdf) |
| `sn74hc153` | SN74HC153N | PDIP-16 N | Hai bộ chọn 4 sang 1 | Quét bốn địa chỉ, kiểm dữ liệu và chân cho phép độc lập cho từng nửa. | [Biến thể SN74HC153N](https://www.ti.com/product/SN74HC153/part-details/SN74HC153N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc153.pdf) |
| `sn74hc157` | SN74HC157N | PDIP-16 N | Bốn bộ chọn 2 sang 1 | Đổi giữa hai mẫu bốn bit khác nhau. Kiểm mức ra khi chân strobe vô hiệu. | [Biến thể SN74HC157N](https://www.ti.com/product/SN74HC157/part-details/SN74HC157N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc157.pdf) |
| `sn74hc165` | SN74HC165N | PDIP-16 N | Thanh ghi dịch vào song song | Nạp mẫu bất đối xứng, đọc tám bit đúng thứ tự. Kiểm cổng chặn clock và hai đầu ra thuận, đảo. | [Biến thể SN74HC165N](https://www.ti.com/product/SN74HC165/part-details/SN74HC165N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc165.pdf) |
| `sn74hc164` | SN74HC164N | PDIP-14 N | Thanh ghi dịch ra song song | Dịch mẫu bất đối xứng. Kiểm cạnh lên, ghép AND của hai đầu vào nối tiếp và xóa bất đồng bộ. | [Biến thể SN74HC164N](https://www.ti.com/product/SN74HC164/part-details/SN74HC164N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc164.pdf) |
| `sn74hc245` | SN74HC245N | PDIP-20 N | Thu phát bus song song hai chiều | Truyền tám bit ở cả hai hướng, kiểm OE vô hiệu, phát hiện X khi hai nguồn chủ động kéo ngược nhau. | [Biến thể SN74HC245N](https://www.ti.com/product/SN74HC245/part-details/SN74HC245N), [datasheet](https://www.ti.com/lit/ds/symlink/sn74hc245.pdf) |

## Nguồn chuẩn hình học

Dùng KiCad 10.0.7 hiện có trong workspace. Kiểm mặt trên, dấu chân số 1, số thứ tự chân, hàng chân cách 7,62 mm và bước dọc hàng 2,54 mm. Bản triển khai phải ghi trang pinout của TI, phiên bản tài liệu, hash nguồn hình và ID ổn định cho từng chân. Package dùng cùng ánh xạ số pad ở 2D, 3D và footprint. Lắp qua khe breadboard với toàn bộ pad khớp lỗ, kiểm xoay và mở lại bản nháp.

| Package KiCad | SHA-256 thư viện footprint `Package_DIP.pretty` | SHA-256 nguồn STEP `Package_DIP.3dshapes` |
| --- | --- | --- |
| `DIP-14_W7.62mm` | `6E9FC056D23E88E219B9E20D58FF74E1D351CA9A77A7B3E6B633F5475D6040F1` | `3DAE072A95C64BEE0D1E58BE8E75383639F5017AB982DE1749D05808A4EED058` |
| `DIP-16_W7.62mm` | `08CEC2C2FAFEFFB19D0C6D17DB37B67017E6518147516B0B75E6A4719B235465` | `17A30B1F0AB3FD5384A1231E3C63C394888D5B952C542A8C189E023ED3467464` |
| `DIP-20_W7.62mm` | `CAD70146D4309F902333A00F6A27A700EDF6E27F0225FC25A716C05E3BA0A3F5` | `CA359C9B9E0CE94EFCB6C96866513F659EEF6517D629ACE3C4A0A779F6FD57BB` |

## Phạm vi mô phỏng R2A

- Miền thử là logic lý tưởng 5 V với Arduino Uno R3. Bảng trạng thái và điều khiển hoạt động theo datasheet. Hiển thị X cho tín hiệu chưa xác định hoặc xung đột và Z cho ngõ ra được ngắt. Mô hình chưa bao gồm trễ truyền, dòng, nhiệt, sai số ngưỡng và ký sinh.
- Kiểm từng IC độc lập. Kiểm luồng từ GPIO qua mạch đang lắp tới đầu ra hoặc chân đọc lại cho các họ cổng, bộ đệm, bộ chọn và thanh ghi. Dùng fixture phần mềm và HEX Uno đã được duyệt khi ca thử phù hợp. Giữ bản nháp cũ và đường nối theo `partId/pinId`.
- Chuẩn bị bài thực hành gắn với từng nhóm. Ca thử phải khai báo miền nguồn, tín hiệu vào, đầu ra dự đoán và cách phân biệt X với Z. Dùng logic probe hoặc dạng sóng để chứng minh đầu ra.
- R2A giới hạn ở mô phỏng trình duyệt và tài liệu KiCad tham chiếu. Phạm vi nghiệm thu chưa bao gồm sản xuất PCB, cấp điện vật lý hoặc nạp USB.

## 58 mục cần tiếp tục khóa cấu hình

Các ID sau giữ trạng thái tham chiếu trong kho. Danh sách kế thừa [hồ sơ R1](2026-11-25-catalog-fidelity-r1-proposal.md). Mỗi nhóm dưới đây cần khóa biến thể và điều kiện đo trước khi kết nối vào runtime.

| Nhóm | Số mục | ID | Bằng chứng phải khóa |
| --- | ---: | --- | --- |
| R2B · Giao tiếp và tín hiệu | 12 | `cd4051b`, `cd74hc4067`, `pcf8574`, `mcp23017`, `24lc256`, `mcp4921`, `ads1115`, `tca9548a`, `lm358`, `lm393`, `sn65hvd230`, `max3232` | Chốt IC theo package, VCC và bảng chân. Kiểm mux khi ngắt, giao dịch và trạng thái thanh ghi, ngưỡng/dải vào của op-amp và comparator, trạng thái TX/RX của transceiver. |
| R2C · Breadboard | 2 | `breadboard-adafruit-239`, `breadboard-adafruit-65` | Chốt sơ đồ lỗ, phân đoạn rail và kích thước theo đúng mẫu. Kiểm nối ngầm, khoảng trống giữa hàng và ánh xạ ở cả hai chế độ lắp. |
| R3 · Nguồn và bán dẫn | 19 | `lm7805`, `lm317`, `tl431`, `lm2596`, `lm2577`, `tps61023`, `lm1117`, `tps5430`, `tps62160`, `bq24074`, `ref5025`, `lm4040`, `1n4007`, `1n5819`, `1n4733a`, `2n3906`, `tip120`, `irlz44n`, `2n7000` | Chốt điện áp danh định, model SPICE và quyền phân phối, tải thử cùng vùng dòng–áp. Với bộ chuyển đổi nguồn phải ghi rõ mô hình trung bình hay chuyển mạch và mạch ứng dụng tương ứng. |
| R4 · Cảm biến và hiển thị | 15 | `ds18b20`, `tmp102`, `tmp117`, `hdc1080`, `opt3001`, `bme280`, `ds3231`, `adxl345`, `vl53l0x`, `lis3dh`, `max6951`, `tlc5940`, `tlc5928`, `tlc59116`, `tlc5916` | Phân biệt IC trần với breakout. Chốt địa chỉ, thanh ghi, thời gian chuyển đổi, đơn vị dữ liệu hoặc mapping kênh hiển thị. Kiểm dữ liệu đổi khi thay kích thích và mất kết nối. |
| R5 · Cơ điện và âm thanh | 10 | `lm386`, `max98357a`, `tpa2012d2`, `ne5532`, `l293d`, `drv8833`, `drv8825`, `uln2003a`, `uln2803a`, `drv8871` | Chốt nguồn/tải, model khuếch đại hoặc driver, chế độ phanh/thả trôi/dịch bước, và điều kiện giới hạn dòng. Kiểm riêng tín hiệu điều khiển và phản ứng của tải. |

Trạng thái R2A là đề xuất chờ duyệt revision. Các linh kiện R2–R5 chỉ được ghi là mô phỏng được sau khi từng ca nghiệm thu có kết quả trên đúng biến thể.
