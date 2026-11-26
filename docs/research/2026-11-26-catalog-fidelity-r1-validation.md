# Kết quả kiểm thử local MM-CATALOG-FIDELITY-R1

Ngày 26/11/2026. Người dùng đã duyệt [cấu hình R1](2026-11-25-catalog-fidelity-r1-proposal.md), SHA-256 `3F2B432AF585D7CB547777D6FB2B6BD5AA4737B1E3C91085E8A99C73D0FAD947`. Kết quả dưới đây ghi nhận bản local đã kiểm.

- 8 mã đặt hàng có 82 đầu nối. Cùng một ID chân được dùng cho ký hiệu 2D, pad, anchor 3D và đầu dây trong CircuitDoc. Trên Chrome điện thoại, đã đặt MCP3008-I/P, nối DGND với AGND, tải lại và mở bản nháp, rồi đối chiếu hai đầu nối trong Schematic.
- Bốn GLB sinh từ thư viện KiCad 10.0.7 khóa theo SHA-256. Phép cắt mesh tại 0,2 mm dưới mặt đặt đo sai lệch lớn nhất 0 mm theo độ phân giải phép tính hiện tại. Đã thử đổi góc WebGL trên Chrome sau khi chọn chân trong 2D và footprint. Kích thước hiển thị theo dạng lắp của thư viện. Dung sai chế tạo và lead form từng lô là phạm vi đối chiếu riêng.
- DIP chỉ tự đặt qua khe breadboard và các chân nằm trên các dải điện khác nhau. Kiểm cả bốn góc xoay. TO-92 chân thẳng đặt cạnh breadboard để nối trực tiếp.
- Mô hình số đã kiểm bảng AND, giữ trạng thái Schmitt khi lên/xuống, chân preset/clear và cạnh lên của flip-flop, thanh ghi dịch và chốt SN74HC595, ngõ ra Z, tám kênh ADC, bit null và thứ tự MSB-first. Phép thử MCP3008 theo SPI mode 0 và ADC lý tưởng 10 bit. Mẫu 2,5 V ở CH6 cho mã 512.
- Phần điện ở lượt R1 ban đầu dùng các bài thử đã định điều kiện. Kết quả nối bộ giải vào bàn lắp mạch được ghi ở mục bên dưới.

| Phép đo bằng ngspice WASM trong Chrome | Điều kiện | Kết quả |
|---|---|---|
| 1N4148-TAP, VF | IF 1, 5 và 10 mA tại 25 °C | 0,610 / 0,691 / 0,728 V |
| 1N4148-TAP, dòng rò | Áp ngược 20 V tại 25 °C | 3,847 nA, dưới 25 nA trong datasheet |
| 2N3904BU, vùng khuếch đại | VCE 1 V, IB 50 µA tại 25 °C | IC 9,320 mA tại điểm thử |
| 2N3904BU, VCE(sat) | IC 10 và 50 mA, IB bằng IC/10, tại 25 °C | 0,056 / 0,112 V, dưới các giới hạn tương ứng 0,2 / 0,3 V |
| 2N3904BU, dòng ngắt | VCE 30 V, VEB 3 V tại 25 °C | 0,063 nA, dưới 50 nA trong datasheet |
| TMP36GT9Z, VOUT điển hình | 0 / 25 / 75 °C, nguồn giả định 3,3 V, tải 1 MΩ | 0,500 / 0,750 / 1,250 V |

Model diode và BJT là bản DC của Mạch Mở trong miền đã thử. Các số đo trong bảng là kết quả mô phỏng. Sai số part-to-part, nhiễu, tải động, nhiệt và trễ lan truyền cần kiểm riêng. TMP36 dùng mức điện áp điển hình so với nhiệt độ. Các bit của MCP3008 được kiểm riêng với bộ lượng tử hóa lý tưởng. [Vishay 81857 Rev. 1.6](https://www.vishay.com/docs/81857/1n4148.pdf) · [onsemi 2N3904/D Rev. 3](https://www.onsemi.com/download/data-sheet/pdf/2n3904-d.pdf) · [TMP36 Rev. H](https://www.analog.com/media/en/technical-documentation/data-sheets/tmp35_36_37.pdf) · [MCP3008 DS20001295E](https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP3004-MCP3008-Data-Sheet-DS20001295.pdf)

## Kiểm tra đã chạy

- `node scripts/generate-catalog-r1-models.mjs`: khớp SHA-256 của cấu hình, footprint và STEP. Sinh bốn GLB và manifest, đối chiếu tâm các pad.
- `npm.cmd run build:public`: thành công trong phạm vi build local.
- `node --test`: hai nhóm kiểm thử liên quan chạy 30 và 43 ca, đều đạt. Nhóm thứ hai gồm pin/pad R1, đặt DIP, mạch và sơ đồ, parser và engine ngspice.
- Playwright Chrome: 9 ca kho, WebGL và ngspice đạt trong lượt đầu. Ca MCP3008 chạy lại bằng locator của linh kiện đã đặt và đạt cả phần nối chân, lưu và mở bản nháp. Các trang catalog và GLB thử nghiệm trả HTTP 200 từ localhost cổng 5222.

## Bàn lắp mạch và firmware

- Bàn đã dùng kết nối dây và net của CircuitDocV2 cho hai luồng. AVR8js chạy Intel HEX của Uno R3 và giải mạch số theo thay đổi GPIO. Ngspice nhận netlist DC từ phần analog đã nối dây, gồm nguồn lý tưởng, điện trở, 1N4148-TAP, 2N3904BU và nguồn điện áp tương đương TMP36GT9Z.
- Firmware Blink Uno có sẵn chạy qua SN74HC08N và điện trở nối tiếp LED. Unit test kiểm D13 và mức đọc lại vào GPIO, qua 32 triệu chu kỳ CPU. Chrome đã thấy LED đổi giữa sáng và tắt, hiển thị cùng trạng thái ở Quan sát, rồi dừng được từ thanh thao tác.
- Mạch MCP3008 nối biến trở ở CH6 cho 512 tại 2,5 V với xung SPI mode 0 từ GPIO. Ca này sử dụng kích thích cạnh ảo. SPI phần cứng và mô phỏng hỗn hợp MCU–ngspice còn ngoài miền kiểm.
- Chrome mở mạch diode trên bàn trong ngspice, chạy đến điểm làm việc và quay về đúng bản nháp với toàn bộ dây. Kết quả solver được xem tại trang SPICE, có chức năng tải CSV. Bản nháp của bàn nằm trong bộ nhớ cục bộ của trình duyệt.
- `npm.cmd run build:public` thành công. 43 ca Node và 12 ca Chrome liên quan đạt trên bản local. Ba ca biên dịch AVR hiện có dừng trước bước giả lập do sandbox thiếu Arduino AVR core và index. Fixture Blink đã được duyệt vẫn chạy được bằng HEX có sẵn.
- Đã đối chiếu đủ 72 ID còn lại. [Hồ sơ R2A](2026-11-26-catalog-fidelity-r2a-proposal.md) khóa đề xuất cho 14 IC và ghi yêu cầu bằng chứng của 58 mục. R2A chờ duyệt SHA-256 `D049BCB6254DEA581EEEC7CB480BF68F05083F0A9765E22939C5547DC8FB8713`.
