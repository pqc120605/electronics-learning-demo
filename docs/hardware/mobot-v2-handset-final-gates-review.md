# MoBot V2 tay cầm · Rà các điều kiện cuối trước KiCad

MM-HW-MOBOT-IF-001. Tổng hợp kết quả mới của Box 02 và 03 trên [hồ sơ xác minh](mobot-v2-handset-wrl20168-jauch250832-verification.md), SHA-256 `E0C68C5518C94E17CD354047D7B253B2F6E6478C3E185C36C1332E1442FA3A26`.

## Đã có căn cứ

- WRL-20168 USB-only, để trống cổng pin onboard. Dùng outline, lỗ gá và vùng anten theo SparkFun. Đầu pack dùng họ JST XH 3 cực, bước 2,50 mm. Mã cắm đứng hoặc ngang tùy hướng tháo pack. JST xác định hình học và số khoang, không xác định dây pack.
- SparkFun đo 67/89,9 mA trung bình/đỉnh với firmware trống, 140/300 mA với ví dụ Wi-Fi ở USB-C 5 V và không pin. Dùng làm mốc tham chiếu, chưa phải cận firmware MoBot, inrush, boot/flash hoặc trước USB configuration.
- H3 đạt sàng lọc dòng 0,358–0,446 A. Box 02 bổ sung CV 4,168–4,232 V theo điều kiện bảng Microchip, kết thúc sàng lọc 20–42 mA, timer 5,4–6,6 giờ. 0,358 A × 5,4 giờ ≈ 1,93 Ah là cận lượng nạp lý tưởng nếu duy trì CC ở góc này, chưa tính taper/giảm dòng do nhiệt. Cận THERM phía IC chưa quy đổi được sang nhiệt độ khi chưa có R–T của pack.

## Đầu vào tối thiểu còn mở

1. Tài liệu Jauch MATD 250832 Rev. 1.2 xác nhận cận CV, termination, timeout/recharge, đường R–T và dung sai NTC, sơ đồ XHP-3 theo mặt ghép. Cực tính có thể xác nhận trên đúng pack. Cần cận pack dưới tải để chốt UVLO. BQ25180 là ứng viên delta nếu hãng bác H3, vẫn cần profile hãng trước khi chọn thanh ghi.
2. Cận USB/ADC, sụt áp tới regulator, rail sense và hành vi hở GND trên đúng bo/cáp/joystick. Không dùng dòng ví dụ SparkFun làm giới hạn tuyệt đối.
3. Đúng WRL-20168, cáp, đầu chụp, gá và công tắc để ghi mốc CC/VBUS mất hợp lệ và I/O thực sự cách ly khi giữ từng tiếp điểm kia đóng. D2F chỉ có dung sai riêng của công tắc. Ngàm RUN/PROGRAM dự phòng giữ phích trong bước nhả tiếp điểm vẫn cần bằng chứng thời gian giữ, độ rơ và lỗi một kênh.

Nguồn: [SparkFun](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/hardware_overview/), [JST](https://www.jst-mfg.com/product/index.php?lang=2&series=277), [Jauch](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf), [Microchip](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf), [Omron](https://omronfs.omron.com/en_US/ecb/products/pdf/en-d2f.pdf).

Box 08 rà các cận mới và phân định đầu vào trước thiết kế với bench tích hợp. Kiểm trên mẫu chưa chạy. Cấu hình triển khai và lease chưa được duyệt.
