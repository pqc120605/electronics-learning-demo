# MoBot V2 tay cầm · Delta B01/B15 sau duyệt linh kiện

MM-HW-MOBOT-IF-001. Tổng hợp Box 02 và 03 cho Box 08. Người dùng đã duyệt cặp linh kiện theo [biên bản](mobot-v2-handset-component-selection-v1-approval.md), SHA-256 của bản lựa chọn `27ADC3163EF54C7ADCF3E0D04F22B62DFB7558D2BE6510597942AD6EC25D44AA`.

## Giao diện có thể khóa từ tài liệu

- B01 là SparkFun WRL-20168, USB-only. Để cổng pin onboard trống, cấp USB-C bằng cáp RUN hoặc PC. Dùng bản vẽ SparkFun cho outline, hai lỗ 4-40 và vùng anten; chiều dài danh nghĩa 59,69 mm. Không dùng kích thước Beetrona. [Hướng dẫn phần cứng](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/hardware_overview/) · [Bản vẽ](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/board_files/dimensions.pdf).
- Carrier giữ GH 12 cực, 11 dây và một khoang trống. Đầu ghép phía B01 theo giao diện SparkFun. B15 Jauch 250832 Rev. 1.2 có dây danh nghĩa 50 mm và đầu XHP-3. Carrier dùng họ XH 3 cực, B3B-XH-A là ứng viên cắm đứng. Chưa khóa thứ tự BAT+/BAT−/NTC hoặc hướng cắm cuối. [JST XH](https://www.jst-mfg.com/product/pdf/eng/eXH.pdf).

## Mục còn mở

- Jauch ghi 4,2 V, 0–45 °C và dòng sạc chuẩn/tối đa 1,25/2,50 A. Cận H3 0,358–0,446 A nằm dưới giới hạn dòng. Cần cận CV, dòng kết thúc, timer được phép, đặc tính NTC và cực tính đúng đầu ghép. H3 khoảng 30 mA kết thúc danh nghĩa, timer 5,4–6,6 giờ. Sàng lọc 2,5 Ah / 0,358 A khoảng 7 giờ nếu nạp đủ dung lượng định mức, chưa tính CV; đây không phải thời gian thực tế từ UVLO. Tính lại theo lượng nạp từ UVLO và nhiệt. Nếu không đạt, trình delta charger/THERM riêng. [Jauch Rev. 1.2](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf) · [Microchip MCP73833](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf).
- Đối chiếu CC và bridge theo revision, cận dòng USB và sụt áp đến regulator qua cáp, switch và diode. Rà lại ADC, sense rail và GND khi đổi B01.
- Giữ yêu cầu hai tiếp điểm RUN và giám sát GND_FUNC. Đo đúng cụm SparkFun, cáp và gá để chứng minh đóng muộn, mở sớm và I/O cách ly. Kiểm cực tính đầu pin, độ vừa, cáp và vùng anten trên cụm. Bench chưa thực hiện.

Box 08 rà phần có thể khóa, xác định tài liệu hoặc số đo tối thiểu còn cần để quyết định H3 và KiCad. Packet này ghi nhận cặp đã duyệt, chưa phải cấu hình triển khai.
