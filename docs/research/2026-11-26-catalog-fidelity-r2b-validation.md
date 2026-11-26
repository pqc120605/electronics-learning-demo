# Nghiệm thu local R2B · 12 IC giao tiếp và tín hiệu

Ngày 26/11/2026. Hồ sơ cấu hình [R2B đã duyệt](2026-11-26-catalog-fidelity-r2b-proposal.md) giữ nguyên SHA-256 `E9C5113901FAD2FDFCC24589DB2CAEA701A4692F5A90AA73499BD025EC0670C4`. Công việc thuộc kho linh kiện, bàn lắp tự do, mô phỏng mạch và chạy firmware Uno. Toàn bộ bằng chứng dưới đây được tạo trên bản local.

## Hình học và bàn lắp

Đã kiểm 174 chân của 12 IC trên bảy kiểu package. Ký hiệu 2D, pad KiCad và điểm chọn trong mô hình WebGL dùng cùng ID chân. Nguồn và hash KiCad 10.0.7 nằm trong cấu hình đã duyệt và thông tin đi kèm tài sản. Với các chân xuyên lỗ, tâm chân trên STEP trùng tâm pad trong phép kiểm. Với chân dán mặt, giao diện mô hình đánh dấu pad và công cụ sinh tài sản kiểm vùng tiếp xúc tại mặt đặt chân. DIP được đặt bắc qua khe breadboard. SMD được đặt trên bàn và nối bằng đầu chân ảo. Kiểm lưu lại dây cho MCP23017 và ADS1115 sau khi mở lại bản nháp.

## Kết quả theo linh kiện

| Linh kiện | Kết quả local |
| --- | --- |
| CD4051BE | Quét 8 kênh theo hai chiều. Đạt ca INH, cách ly kênh và xung đột hai nguồn áp. |
| CD74HC4067PWR | Quét 16 kênh theo hai chiều. Đạt đổi kênh, ngắt và đo trên net có dây. |
| PCF8574N | Chốt xuất 0xFE, đọc 0xFC khi kéo P1 xuống, ngắt và reset đúng. Chrome gửi 0xFE trên bàn và đọc lại qua bộ điều khiển ảo. |
| MCP23017-E/SP | Cổng A/B độc lập, hỗ trợ các thanh ghi BANK=0 trong hồ sơ, chốt ngắt và kiểm giới hạn GPA7/GPB7. |
| 24LC256-I/P | Quay vòng trang ở 0x003F, đọc liên tiếp, repeated START, WP, ACK polling 5 ms và giữ nội dung qua chu kỳ nguồn ảo trong cùng phiên. |
| MCP4921-E/P | Lệnh 0x3800 chỉ đổi đầu ra sau khi chốt /LDAC. Đạt gain 1× và 2×, shutdown, kiểm độ dài và thứ tự bit. |
| ADS1115IDGSR | Mã dương 0x4000, mã âm 0xE000, bão hòa có dấu và thời gian single-shot 7,8125 ms. |
| TCA9548APWR | Quét tám nhánh. Mặt nạ có hiệu lực sau STOP, xử lý hai thiết bị cùng địa chỉ và phản hồi open-drain. |
| LM358P | Ngspice chạy cả hai kênh. Bộ đệm ~0,500 V, không đảo gain 2 ~2,000 V, bão hòa ở 3,300 V. |
| LM393P | Ngspice chạy cả hai kênh. Ngõ kéo xuống ~0,005 V và nhả lên 5,000 V với điện trở kéo. Ca nối dây kiểm thiếu kéo lên, hai ngõ bằng nhau và nguồn trực tiếp ngoài miền. |
| SN65HVD230DR | Hai nút 3,3 V cho vi sai dominant 2 V, recessive, standby và trạng thái X giữa hai ngưỡng nhận. |
| MAX3232EIDR | Hai đường đảo mức ở miền 3,3 V và ±5 V của bài thử. Kiểm nối vòng, điện áp chưa xác định và mất nguồn. |

## Kiểm liên kết và hồi quy

- AVR8js đi qua thanh ghi TWI để chuyển giữa PCF8574 và MCP23017 cùng địa chỉ 0x20 trên hai nhánh TCA. Kiểm ACK/NACK, dữ liệu, repeated START và STOP.
- AVR8js gửi SPI 0x3800 tới MCP4921. Điện áp 1,250 V đi trên net VOUT–AIN0 và được ADS1115 đọc thành 0x4E20 qua I²C.
- Kiểm NACK khi dây SDA/SCL sai, thiếu kéo lên 4,7 kΩ và thiếu nguồn IC.
- 106 bài kiểm tra Node đạt, gồm 16 bài R2B và hồi quy R1/R2A, tải nháp, đặt linh kiện, sơ đồ và ngspice.
- 41 ca Chrome/Playwright đạt, gồm 12 ca từng IC, một ca bộ điều khiển ảo trên bàn và 28 ca hồi quy. Chrome dùng WebGL phần mềm trong tự động hóa.
- `npm.cmd run build:public` và `git diff --check` đạt. Bản build dùng kiểm phát hành ngspice sẵn có. Hai ca bộ đệm ngspice dùng bước nguồn dự phòng và hội tụ trong miền đo.
- [Mở kho linh kiện local ngay tại ADS1115](http://127.0.0.1:5222/components?component=ads1115).

## Phạm vi kết quả

I²C và SPI dùng miền giao tiếp đã ghi trong hồ sơ, có bộ điều khiển ảo và adapter thanh ghi AVR8js. Các ca thanh ghi dùng CPU AVR8js cục bộ. Hồi quy HEX Blink dùng tệp đã duyệt. LM358 và LM393 dùng mô hình điểm làm việc DC. CAN và RS-232 được kiểm ở lớp transceiver 3,3 V. EEPROM giữ nội dung trong phiên mạch đang chạy. Các số đo là kết quả của mô hình. Chưa có phép đo trên kit thật. Bản này nằm trên máy local và chưa được phát hành.
