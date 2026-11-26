# Cấu hình đề xuất R2B cho Mạch Mở

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R2B-1** gồm 12 IC giao tiếp và tín hiệu trong [danh sách R2](2026-11-26-catalog-fidelity-r2a-proposal.md). Phạm vi nghiệm thu local gồm ký hiệu 2D, xem 3D, footprint tải được, lắp và lưu dây, bài thử riêng cho từng IC và các mạch thử liên kết bên dưới. Capability áp dụng gồm CAT-04, CAT-05, EDA-03, SIM-02 và SIM-03.

## Mã đặt hàng và package

| ID kho | Mã đặt hàng | Package hãng | Tệp KiCad tham chiếu | Nguồn pinout và chức năng |
| --- | --- | --- | --- | --- |
| `cd4051b` | TI CD4051BE | PDIP-16 (N) | `DIP-16_W7.62mm` | [CD405xB Rev. O](https://www.ti.com/lit/ds/symlink/cd4051b.pdf) |
| `cd74hc4067` | TI CD74HC4067PWR | TSSOP-24 (PW) | `TSSOP-24_4.4x7.8mm_P0.65mm` | [CD74HCx4067 Rev. D](https://www.ti.com/lit/ds/symlink/cd74hc4067.pdf) |
| `pcf8574` | TI PCF8574N | PDIP-16 (N) | `DIP-16_W7.62mm` | [PCF8574 Rev. K](https://www.ti.com/lit/ds/symlink/pcf8574.pdf) |
| `mcp23017` | Microchip MCP23017-E/SP | SPDIP-28 (SP), 300 mil | `DIP-28_W7.62mm` | [DS20001952](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf) |
| `24lc256` | Microchip 24LC256-I/P | PDIP-8 (P), 300 mil | `DIP-8_W7.62mm` | [DS20001203X](https://ww1.microchip.com/downloads/en/DeviceDoc/24AA256-24LC256-24FC256-256-Kbit-I2C-Serial-EEPROM-20001203X.pdf) |
| `mcp4921` | Microchip MCP4921-E/P | PDIP-8 (P), 300 mil | `DIP-8_W7.62mm` | [DS21897B](https://ww1.microchip.com/downloads/en/DeviceDoc/21897B.pdf) |
| `ads1115` | TI ADS1115IDGSR | VSSOP-10 (DGS0010A) | `TSSOP-10_3x3mm_P0.5mm` | [ADS111x Rev. E](https://www.ti.com/lit/ds/symlink/ads1115.pdf) |
| `tca9548a` | TI TCA9548APWR | TSSOP-24 (PW) | `TSSOP-24_4.4x7.8mm_P0.65mm` | [TCA9548A Rev. H](https://www.ti.com/lit/ds/symlink/tca9548a.pdf) |
| `lm358` | TI LM358P | PDIP-8 (P) | `DIP-8_W7.62mm` | [LM358 Rev. AB](https://www.ti.com/lit/ds/symlink/lm358.pdf) |
| `lm393` | TI LM393P | PDIP-8 (P) | `DIP-8_W7.62mm` | [LM393 Rev. AH](https://www.ti.com/lit/ds/symlink/lm393.pdf) |
| `sn65hvd230` | TI SN65HVD230DR | SOIC-8 (D) | `SOIC-8_3.9x4.9mm_P1.27mm` | [SN65HVD23x Rev. O](https://www.ti.com/lit/ds/symlink/sn65hvd230.pdf) |
| `max3232` | TI MAX3232EIDR | SOIC-16 hẹp (D) | `SOIC-16_3.9x9.9mm_P1.27mm` | [MAX3232E Rev. E](https://www.ti.com/lit/ds/symlink/max3232e.pdf) |

Dùng bảng chân đúng package ở trên. Pin 1, số pad, cực tính, chân nguồn và NC phải hiện nhất quán trên 2D, footprint và 3D. ID linh kiện mới dùng hậu tố `-r2b`. Mỗi đầu dây tiếp tục lưu bằng `partId/pinId`. Các vị trí đặt package xuyên lỗ được kiểm hai hướng qua khe e–f của breadboard 400 điểm. IC SMD đặt cạnh breadboard với đầu nối tại pad thật và dùng dây ảo. VSSOP-10 của TI được giữ đúng tên trên giao diện. Ký hiệu `ADS1115IDGS` trong thư viện KiCad 10.0.7 tham chiếu footprint `TSSOP-10_3x3mm_P0.5mm` cho bản DGS. [Bản vẽ TI DGS0010A](https://www.ti.com/lit/ds/symlink/ads1115.pdf#page=51)

## Nguồn hình học đã đối chiếu trên laptop

KiCad 10.0.7. Với mỗi hàng, tệp `.kicad_mod` lấy từ `footprints/<library>.pretty` và STEP lấy từ `3dmodels/<library>.3dshapes`. Phép kiểm hình học dùng tọa độ, góc quay và offset trong footprint của thư viện. Các chân xuyên lỗ phải khớp tâm pad trong 0,05 mm. Với SMD, kiểm dấu chân 1, thứ tự pad và giao phần tiếp xúc của mỗi chân với đúng pad đồng. Mô hình dựng từ package tham chiếu của KiCad, phép đo kích thước và dung sai theo nhà sản xuất cần thực hiện riêng. [Giấy phép thư viện KiCad](https://www.kicad.org/libraries/license/)

| Package trong KiCad | SHA-256 footprint | SHA-256 STEP |
| --- | --- | --- |
| `Package_DIP/DIP-8_W7.62mm` | `44500FC2989169A1EA877BA89E69CD60D0A77414AF60FD2D1997DE5569F2DEE5` | `4A377A56A8D9E9C0B86C095EF9ECC1869AC19E7F5069A3247B294250BF4F235D` |
| `Package_DIP/DIP-16_W7.62mm` | `08CEC2C2FAFEFFB19D0C6D17DB37B67017E6518147516B0B75E6A4719B235465` | `17A30B1F0AB3FD5384A1231E3C63C394888D5B952C542A8C189E023ED3467464` |
| `Package_DIP/DIP-28_W7.62mm` | `554208C80F8BD504CE7A1DFCB1B5321C6CD89A465F2DEB73D92BCE1A1F5E9A8B` | `7BF4503E368AD9B7A3EDDFA94BC8DEE656DA5D6921B677E17307B3D7F29177AB` |
| `Package_SO/TSSOP-24_4.4x7.8mm_P0.65mm` | `F90A7D7F67E28018A3CD6412407F451A79C53AD36E334329B114CDD895A47106` | `706322F42D9793EBF28D5B80100A68BFA8769998A00B78ACADF7AF937FC1454F` |
| `Package_SO/SOIC-8_3.9x4.9mm_P1.27mm` | `3C9B63198DD4DBF5E6C28C84702C29FAD46A35103B821A19306C4AC888AD8E76` | `07F46CFF378D30E6C27DFD5A03092C795323F86D91C71FC7E743F4F418DC553A` |
| `Package_SO/SOIC-16_3.9x9.9mm_P1.27mm` | `A3E0CAD48591B1BF41F77AA964868C62B28D32F1014A42A763A17AC184231F7F` | `D5EEDDB4C0B304DC61950919B126FC61D7586ABD5F16AB71A2A79759EC6498BF` |
| `Package_SO/TSSOP-10_3x3mm_P0.5mm` | `E54C3D2D0C55B0B4F834390BF39F761CF5314CC77AAC950AD7FE1D9F61803C66` | `39602ED75F3C6C524A0E4BAB680480A2804B32AA5AA5EB0D979F088F4FB9C652` |

## Cấu hình điện và ca thử từng IC

Mọi mức và đơn vị trong bảng là điều kiện của mô hình hoặc tiêu chí kiểm trên máy. Phần logic dùng mức nguồn danh định đã ghi và đồng hồ sự kiện. Các kết quả X, Z và NACK hiển thị riêng. Đầu vào sai miền nguồn, mất GND, đường SDA/SCL hở và mode giao tiếp ngoài cấu hình phải báo giới hạn ở đúng net hoặc giao dịch.

| IC | Điều kiện và hành vi đưa vào mô hình | Ca nghiệm thu local |
| --- | --- | --- |
| CD4051BE | VDD = 5,0 V, VSS = VEE = 0 V. Công tắc analog hai chiều lý tưởng, A là bit chọn thấp nhất. INH = 1 ngắt toàn bộ kênh. Dải tín hiệu thử 0–5 V. | Quét 8 kênh với mức `0,25 + 0,50 × k` V. Kiểm truyền kênh→COM và COM→kênh, Z ở kênh ngắt và X nếu hai nguồn lý tưởng kéo đối nhau. |
| CD74HC4067PWR | VCC = 5,0 V, GND = 0 V. S0 là bit chọn thấp nhất, /E = 1 ngắt toàn bộ. Cùng mô hình công tắc hai chiều lý tưởng và dải thử 0–5 V. | Quét 16 kênh với mức `0,20 + 0,25 × k` V. Kiểm truyền ngược, vô hiệu và tách kênh khi đổi địa chỉ. |
| PCF8574N | 5,0 V, I²C 100 kHz. A2:A0 chọn 0x20–0x27, mặc định 0x20. Sau reset chốt bằng 0xFF. Bit 0 kéo xuống, bit 1 nhả ở mức kéo lên yếu. INT open-drain khi đầu vào đổi và nhả theo giao dịch đọc/ghi cổng đã tạo ngắt hoặc khi mức trở lại giá trị trước. | Ghi 0xFE, thấy P0 thấp. Giữ P1 ở bit 1, kéo ngoài P1 xuống rồi đọc 0xFC. Kiểm INT, nhả ngắt, reset 0xFF và NACK địa chỉ sai. |
| MCP23017-E/SP | 5,0 V, I²C 100 kHz, 0x20–0x27. Dùng BANK=0, tăng địa chỉ liên tiếp. Mô phỏng RESET, IODIR, GPPU, GPIO, OLAT và ngắt thay đổi đầu vào với GPINTEN, INTCON=0, INTF, INTCAP. GPA7, GPB7 dùng đầu ra theo giới hạn hãng. | Kiểm hai cổng A/B độc lập, reset, ghi OLAT và đọc GPIO với tín hiệu ngoài. Kiểm giá trị giữ trong INTCAP, xóa ngắt khi đọc và cảnh báo khi dùng bit 7 làm đầu vào. [Ghi chú Microchip về GPA7/GPB7](https://support.microchip.com/s/article/GPA7---GPB7-Cannot-Be-Used-as-Inputs-In-MCP23017) |
| 24LC256-I/P | 5,0 V, I²C 100 kHz, địa chỉ 0x50–0x57. Bộ nhớ 32 KiB khởi tạo 0xFF, page 64 byte. Sau ghi hợp lệ mô hình bận 5 ms. Mô phỏng WP, con trỏ đọc, repeated START, ACK polling và vòng địa chỉ trang. Nội dung giữ khi tắt/bật nguồn ảo trong cùng phiên chạy. | Ghi hai byte qua địa chỉ 0x003F, byte thứ hai vòng về 0x0000 trong cùng trang. Đọc tuần tự từ 0x003F sang 0x0040. Kiểm dữ liệu giữ khi WP bật, NACK lúc bận và dữ liệu còn sau bật lại nguồn ảo. |
| MCP4921-E/P | VDD = 5,0 V, VREF = 2,500 V, SPI mode 0 MSB-first ở 1 MHz. Lệnh 16 bit qua /CS, BUF=0. Mô phỏng gain 1×/2×, /SHDN và chốt /LDAC. Giá trị lý tưởng `VOUT = G × VREF × D / 4096`. | Tải 0x3800, kiểm 1,250 V sau chốt, giữ mức cũ trước chốt. Khi /LDAC nối GND, từ 0x1800 cho 2,500 V sau cạnh lên /CS. Kiểm shutdown, lệnh thiếu bit và bit thứ tự sai. |
| ADS1115IDGSR | VDD = 5,0 V, I²C 100 kHz, ADDR chọn 0x48–0x4B. Mode single-shot, 128 SPS, PGA ±2,048 V. Mô phỏng chọn kênh đơn/vi sai, con trỏ thanh ghi, bit OS, thanh ghi Conversion và giới hạn mã có dấu. Mỗi chân analog trong 0–5 V. Comparator tắt trong phép thử này. | Kiểm +1,024 V → 0x4000, −0,512 V vi sai → 0xE000, bão hòa mã dương/âm, đọc trước và sau 7,8125 ms ảo, đổi địa chỉ qua ADDR. |
| TCA9548APWR | VCC và cả nhánh thử kéo lên 5,0 V qua 4,7 kΩ trên SDA/SCL. I²C 100 kHz, địa chỉ 0x70–0x77. Bit mặt nạ tương ứng nhánh 0–7, áp dụng sau STOP. RESET mức thấp đóng ngắt về mặt nạ 0. | Quét cả tám bit, chuyển giữa hai thiết bị cùng địa chỉ ở các nhánh khác nhau. Kiểm lệnh trước STOP, nhánh đóng NACK, hai nhánh mở cùng lúc truyền open-drain và báo khi hai phản hồi dữ liệu khác nhau. |
| LM358P | 5,0 V đơn, 25 °C, hai kênh. Model DC hành vi với hệ số hở 100.000 và giới hạn mô hình 0–3,3 V. Miền điện áp chung đưa vào bài thử là 0–3,0 V. Tải 10 kΩ xuống GND. Đây là tham số mô hình, số đo đầu ra thực còn phụ thuộc tải và nhiệt độ. | Chạy điểm làm việc ngspice. Bộ đệm nhận 0,50 V cho 0,495–0,505 V. Mạch không đảo hai điện trở hồi tiếp 10 kΩ với đầu vào 1 V cho 1,98–2,02 V. Ca bão hòa đạt giới hạn mô hình và ca đầu vào ngoài miền có chỉ báo. |
| LM393P | 5,0 V đơn, 25 °C, hai comparator open-collector. Kéo lên 10 kΩ tới 5 V. Hai đầu vào trong 0–3,0 V. Model DC dùng nhánh kéo xuống tương đương 10 Ω khi V+ thấp hơn V−. | Đổi hai mức vào 1,00 và 2,00 V. Điểm làm việc ngspice ở mức thấp ≤0,4 V, mức cao ≥4,95 V qua điện trở kéo. Bỏ kéo lên phải hiện Z ở ngõ nhả. Kiểm cả hai kênh, điểm V+ = V− được đánh dấu X. |
| SN65HVD230DR | 3,3 V riêng. RS = 0 V ở chế độ nhanh, RS = 3,3 V ở chế độ standby. Hai điện trở kết thúc tuyến 120 Ω tương đương 60 Ω vi sai. Driver D=0 cho mức dominant 2,0 V vi sai trong mô hình, D=1 nhả bus về recessive. Receiver R=0 khi V(CANH)−V(CANL) ≥0,9 V và R=1 khi ≤0,5 V. | Hai IC cùng bus, một D=0 thắng một D=1. Kiểm standby nhả driver, receiver theo mức bus và X ở khoảng giữa ngưỡng. Ca thử là lớp transceiver vật lý. |
| MAX3232EIDR | VCC = 3,3 V, C1–C4 = 100 nF theo điều kiện thử TI. Hai đường TX/RX đảo mức. Tải phát 3 kΩ. Mô hình charge pump ổn định dùng ±5 V danh định. Phía nhận dùng miền RS-232 thử ≤−3 V và ≥+3 V. | DIN 0/1 cho TOUT +5/−5 V, lần lượt đưa điện áp đó sang RIN để kiểm ROUT 0/1 ở miền 3,3 V. Kiểm cả hai kênh, dấu điện áp, chế độ mất nguồn và X ở vùng điện áp thử chưa xác định. |

Các bài mux thử công tắc lý tưởng và đánh dấu trạng thái cách ly. Mô hình DC LM358P và LM393P ưu tiên điểm làm việc trong miền ghi trên bảng. Thời gian trễ truyền, nhiễu, đặc tính ký sinh và nhiệt cần có hồ sơ mô hình riêng. [Thông số thu SN65HVD230](https://www.ti.com/lit/ds/symlink/sn65hvd230.pdf#page=23) · [Điều kiện tụ MAX3232E](https://www.ti.com/lit/ds/symlink/max3232e.pdf#page=5)

## Ca kiểm liên kết trên bàn lắp mạch

- Uno R3 dùng rail 5 V và GND chung cho I²C/SPI trong bảng. I²C lấy SDA ở A4 và SCL ở A5 cùng hai điện trở kéo lên 4,7 kΩ. SPI lấy MOSI ở D11, SCK ở D13, /CS ở D10 và /LDAC ở D9 trong ca thử DAC. Bộ điều khiển ảo và adapter thanh ghi AVR8js dùng cùng kết nối net. Các ca 3,3 V CAN và RS-232 dùng nguồn và logic riêng. [Pinout Arduino Uno R3](https://content.arduino.cc/assets/Pinout-UNOrev3_latest.pdf)
- Dùng hai nhánh TCA9548A cho PCF8574 và MCP23017 ở cùng địa chỉ 0x20. Bằng chứng phải thể hiện địa chỉ, ACK/NACK, dữ liệu và thời điểm STOP. Mạch thứ hai đổi điện áp DAC bằng SPI và đọc lại qua ADS1115 trên I²C. Dây VOUT đến AIN0, AIN1 về GND. Lệnh 0x3800 cho ADC vi sai 0x4E20 ở dải ±2,048 V.
- Chạy ca thanh ghi AVR8js và fixture bus phần mềm. Dùng mẫu HEX Uno đã duyệt khi phù hợp. Tín hiệu trả về có nguồn gốc rõ ràng từ AVR, giao dịch mô hình hoặc solver DC. Mức điện áp RS-232 và CAN được thử trong bài transceiver với điều kiện nguồn riêng.
- Kiểm từng IC trên Chrome ở kho và trên bàn. Chọn cùng chân qua 2D, pad và 3D, kiểm đổi góc nhìn, tải footprint, đặt linh kiện và giữ dây khi mở lại. Kiểm thiếu nguồn, sai chân bus, địa chỉ trùng và ngắt kênh. Chạy hồi quy R1/R2A và `npm.cmd run build:public` trên laptop.

## Trạng thái

Hồ sơ chờ xác nhận SHA-256 của đúng tệp này. Phạm vi duyệt là biểu diễn tham chiếu, mô phỏng và kiểm thử local cho 12 mã trong bảng.
