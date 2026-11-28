# Rà pin, mô phỏng điện và firmware trong thư viện Mạch Mở

Snapshot local `.tmp/na` tại nền `357e8fc427565c76acec8ecc78fcaa4206bdd7c1` và các thay đổi mô hình đang có trong worktree. Kiểm kê ngày 26/11/2026 bằng Vite SSR, đọc dữ liệu runtime của toàn bộ thư viện.

## Kết quả rà 28 board

Đã đếm 1.200 vị trí chân trong manifest viewer và 1.200 neo tọa độ. Con số này đếm theo vị trí pad, bao gồm pad nguồn, GND, NC và các pad có thể dùng chung net. Độ tin cậy phụ thuộc revision của từng nguồn. Bảng capability của 22 board có tối đa hai mục. 21 board có profile kịch bản dạy học.

| Board và revision | Vị trí trong viewer | Mục capability | Điểm cần xử lý hoặc xác minh |
|---|---:|---:|---|
| Seeed Studio XIAO ESP32-C3 · XIAO ESP32-C3 · schematic v1.3 · 2026-01-15 | 14 | 11 | So lại 14 pad với chức năng và các pad phụ theo tài liệu đúng revision. Registry hiện chỉ có 11 mục. |
| Seeed Studio XIAO ESP32-S3 · XIAO ESP32-S3 · STEP chính hãng v2 · bản thường (không phải Sense/Plus) | 14 | 14 | Duy trì bản thường. Đối chiếu riêng pad phụ và giới hạn chân boot, USB theo schematic. |
| Adafruit QT Py ESP32-C3 · Adafruit QT Py ESP32-C3 Rev B · #5405 | 14 | 0 | Đưa 14 pad đã có sang dữ liệu tra cứu chung. Kiểm STEMMA QT/boot theo Eagle Rev B. |
| Adafruit Feather ESP32-S3 TFT · #5483 · Adafruit Feather ESP32-S3 TFT · PID #5483 · 4 MB flash · 2 MB PSRAM | 28 | 27 | Kiểm tên trùng giữa 28 pad và 27 khóa tra cứu. Giữ alias SPI/I²C theo PID #5483. |
| Adafruit Feather ESP32-S3 · #5323 · Adafruit Feather ESP32-S3 · PID #5323 · 8 MB flash · no PSRAM | 28 | 27 | Kiểm tên trùng giữa 28 pad và 27 khóa tra cứu. Giữ alias riêng theo PID #5323. |
| ESP32 DevKit V1 · ESP32 Dev Kit Clone · thiết kế 30 chân | 30 | 2 | Khóa đúng thiết kế clone 30 chân. Kiểm GPIO chỉ vào, nhóm boot và hai chế độ chọn chân đang dùng quy tắc khác nhau. |
| Arduino Uno R3 · Uno Rev3 | 44 | 2 | Kiểm hợp nhất 44 vị trí CAD, hai ICSP và chức năng D0–D13/A0–A5. Điểm chạy firmware đầu. |
| Arduino Nano classic · Nano classic | 36 | 2 | Kiểm J1/J2/J4, hai đầu vào analog chuyên dụng A6/A7, phiên bản MCU và alias SDK. |
| Arduino Mega 2560 R3 · Mega 2560 Rev3 | 98 | 2 | Kiểm 98 vị trí và tên trùng qua đầu cắm. Worker có giới hạn hiện tại ở ADC A8–A15. |
| STM32 NUCLEO-F401RE · MB1136-F401RE-C04 · project package v1.1 | 32 | 24 | Thiếu 76 mục CN7/CN10 trong manifest. Khóa MB1136-F401RE-C04. Rà CN4/SWD riêng. |
| ESP32-C3-DevKitM-1 · ESP32-C3-DevKitM-1-N4X · PCB V1.0 | 30 | 2 | Kiểm 30 chân J1/J3, cách gọi GPIO và chân đặc biệt theo rev V1.0. QEMU C3 là ứng viên cho phép thử UART. |
| ESP32-DevKitM-1 · ESP32-DevKitM-1 · PCB V1.0 | 34 | 0 | 34 vị trí đã có trên viewer, cơ sở dữ liệu chung chưa có mục pin. Bổ sung I34–I39 theo chức năng đầu vào trong nguồn. |
| ESP32-S3-DevKitC-1 · ESP32-S3-DevKitC-1 · PCB V1.1 | 44 | 44 | Duy trì V1.1. Kiểm điều kiện flash/PSRAM dành chân theo module và nguồn USB. |
| STM32F103C8T6 Blue Pill · Họ board clone · revision/vendor chưa xác định | 40 | 2 | 40 chân hai hàng. Header SWD J5 còn thiếu trong danh sách tra chân. Giữ nhãn thiết kế clone cho tới khi xác minh đúng mẫu. |
| Raspberry Pi Pico · Pico R3 · thiết kế tham chiếu chính hãng | 40 | 2 | Liên kết nguồn đang trỏ Pico 2. Dùng pinout Pico R3 và kiểm ba chân SWD riêng ngoài 40 chân J0. |
| Raspberry Pi Pico W · Pico W · thiết kế tham chiếu chính hãng | 40 | 2 | Giữ J0 và kiểm SWD riêng. GPIO onboard và CYW43439 có phạm vi riêng cho Pico W. |
| Raspberry Pi Pico 2 · Pico 2 · thiết kế tham chiếu chính hãng · không header | 40 | 2 | Giữ phạm vi RP2350 và ba chân SWD riêng với chứng cứ PCB phù hợp. |
| Raspberry Pi Pico 2 H · Pico 2 H · SC1632 · with headers | 40 | 0 | Đưa J0 vào dữ liệu tra cứu chung, kiểm đầu SWD và giữ biến thể hàn header SC1632. |
| ESP32-C6-DevKitC-1 · ESP32-C6-DevKitC-1-N8 · PCB v1.2, schematic v1.4 | 32 | 2 | Kiểm 32 vị trí J1/J3, hai USB-C, và ghi rõ NC ở vị trí cuối. Kiểm thêm jumper đo dòng. |
| STM32 NUCLEO-F411RE · NUCLEO-F411RE · MB1136-F411RE-C04 | 108 | 2 | Giữ 108 mục Arduino/Morpho. Kiểm CN4/SWD và chú thích bridge theo F411RE. |
| Arduino UNO R4 Minima · UNO R4 Minima · ABX00080 | 32 | 2 | Kiểm đầu ICSP/debug theo PCB đúng ABX00080 ngoài 32 chân chính. Runner cần RA4M1. |
| Arduino UNO R4 WiFi · UNO R4 WiFi · ABX00087 | 32 | 2 | Kiểm đầu ICSP/debug/Qwiic theo PCB ABX00087. Tách RA4M1 khỏi module ESP32-S3 phụ. |
| Arduino Nano ESP32 · Nano ESP32 · ABX00083 | 30 | 2 | Giữ 30 chân và phân biệt số chân Arduino với số GPIO gốc theo chế độ numbering. |
| Arduino Nano Every · ABX00028 · NANOEveryV4.0 | 30 | 2 | Giữ 30 chân IPC và kiểm UPDI riêng theo tài liệu. MCU ATmega4809 cần backend đúng họ megaAVR 0-series. |
| ESP32-S2-DevKitC-1 · ESP32-S2-DevKitC-1-N8R2 · PCB V1, schematic 2022-08-17 | 44 | 2 | Giữ 44 chân đúng SOLO-2 N8R2 và điều kiện GPIO18. Backend target cần Xtensa LX7 một lõi của S2. |
| ESP32-H2-DevKitM-1 · ESP32-H2-DevKitM-1-N4 · PCB v1.2, schematic v1.3 | 30 | 2 | Giữ 30 chân đúng lô có thạch anh. Kiểm trạng thái GPIO13/14 và VBAT theo source lock. |
| STM32 NUCLEO-L476RG · NUCLEO-L476RG · MB1136-L476RG-C04 | 108 | 2 | Giữ 108 mục và kiểm CN4/bridge theo L476RG. BOM riêng C04 còn thiếu. |
| STM32 NUCLEO-F446RE · NUCLEO-F446RE · MB1136-F446RE-C04 | 108 | 2 | Giữ 108 mục và kiểm CN4/bridge theo F446RE. |

Mỗi pad cần có khóa theo board/revision/đầu cắm/số pad và trạng thái nguồn. Khi nối mạch, giữ ID `partId/pinId` của bản lưu. Các trường cần phân biệt gồm số chân Arduino, GPIO MCU, alternate function, chiều I/O, NC, chân dành riêng và điều kiện lắp. Một target có hai alias cho bài mẫu vẫn có thể có nhiều pad tra cứu.

## Hiện trạng thực thi

- Bàn tự do đã có luồng chạy HEX cùng mạch số dành cho Uno R3. Bộ biên dịch topology hiện chặn bốn mã vừa hoàn tất hình học. Worker AVR riêng có Uno R3, Nano classic và Mega 2560 trong phạm vi tập lệnh và ngoại vi đã cấu hình. Có kết quả hồi quy compile và trace cho Uno/Mega từ đợt trước.
- Bàn tự do có đường đọc DHT22 với pull-up, tiếp điểm keypad và hiển thị anode chung. DHT11 thiếu nhánh ngoại vi tương ứng trong bàn. Cần kiểm bốn mã bằng firmware biên dịch, quan sát tín hiệu theo thời gian và kiểm các lỗi đấu mạch.
- `rp2040js` chạy CPU RP2040 cho đường UF2 của Pico và có đường MicroPython hiện hành cần rà hồi quy. Pico W cần kiểm giới hạn ngoại vi riêng, đặc biệt wireless. RP2350 của Pico 2 và Pico 2 H cần runner đúng MCU.
- Ứng viên runtime tiếp theo là ESP32-C3-DevKitM-1 N4X với fork QEMU chính thức của Espressif. Bằng chứng upstream về CPU/UART cho C3 chưa phải kết quả chạy trong Mạch Mở. Cần khóa phiên bản ESP-IDF, QEMU, machine, flash layout và log trước khi mở target. Tài liệu theo từng chip gồm ESP32, C3 và S3. [ESP32 QEMU](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/qemu.html) · [ESP32-C3 QEMU](https://docs.espressif.com/projects/esp-idf/en/stable/esp32c3/api-guides/tools/qemu.html) · [ESP32-S3 QEMU](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/tools/qemu.html)
- Với STM32 và Renesas, cần đối chiếu thiết bị và ngoại vi theo platform upstream. Ví dụ có hồ sơ Renode cho Uno R4 Minima và STM32F103. Tài liệu QEMU upstream liệt kê các máy STM32 cụ thể khác. [Danh sách Renode](https://renode.readthedocs.io/en/latest/introduction/supported-boards.html) · [Máy STM32 của QEMU](https://www.qemu.org/docs/master/system/arm/stm32.html)

## Thứ tự thực hiện

1. Dùng cùng khóa chân từ nguồn đã đối chiếu cho tra cứu 28 board. Chốt F401RE C04 và Pico R3 trước cho các thiếu sót cụ thể. Với header phụ còn thiếu chứng cứ, ghi vị trí và điều kiện cần xác minh.
2. Chạy firmware Uno R3 thật cùng bốn linh kiện trong bàn tự do. Đối chiếu mức logic và timing với UART của chương trình. Kiểm bộ giải ngspice cho một kênh hạn dòng của SA56 riêng, bằng mô hình diode tương đương được ghi tham số.
3. Khóa và kiểm từng runtime mới theo họ MCU. Mỗi target cần fixture boot, UART, GPIO và timing trước khi báo khả năng tương ứng. Kiểm ngoại vi bus, ADC, PWM riêng nếu engine có bằng chứng. Kiểm lại các runner AVR và Pico hiện hành.

Đợt đầu bám CAT-01/02/03/04, FW-04/07/08 và SIM-02/03/04. Kết quả dự kiến gồm đối chiếu pin có nguồn, sự kiện số từ runtime và phép đo bộ giải cho mạch giới hạn. Phiên bản local làm căn cứ cho từng bằng chứng.

[Cấu hình triển khai đợt A](2026-11-26-board-pin-electrical-firmware-a-proposal.json)
