# Rà đầu cắm phụ và debug trên 28 board

Đối chiếu bảng chân A1 với manifest CAD và các tài liệu hãng trong [cấu hình A2](2026-11-27-esp32-c3-electrical-firmware-a2-proposal.json). Danh mục chính gồm 1.276 vị trí. Đầu cắm phụ mở từ mục **SWD, debug và đầu cắm phụ** trong trang chi tiết board. Mục có điểm chọn dùng cùng ID ở mặt 2D và PCB 3D. Mục tra cứu dùng tên và số pad theo tài liệu hiện có.

| Board | Chân A1 | Kết quả rà đầu cắm phụ |
|---|---:|---|
| Seeed XIAO ESP32-C3 | 14 | JTAG là chức năng trên GPIO4–GPIO7 đã đưa ra header. Pad mặt dưới cần đối chiếu bản vẽ đúng V1.3 trước khi thêm neo. |
| Seeed XIAO ESP32-S3 thường | 14 | Cần đối chiếu pad dưới và đầu mở rộng với bản thường. Sense và Plus có nguồn CAD riêng. |
| Adafruit QT Py ESP32-C3 #5405 | 14 | CONN1 STEMMA QT có bốn điểm chọn từ Eagle Rev B. SDA GPIO5, SCL GPIO6. |
| Adafruit Feather ESP32-S3 TFT #5483 | 28 | Bảng CONN1 mặt sau, SDA GPIO42, SCL GPIO41 và nguồn VSENSOR. X1 BAT mặt sau, pad 1 GND, pad 2 VBAT theo Eagle. |
| Adafruit Feather ESP32-S3 #5323 | 28 | CONN1 có bốn điểm chọn từ Eagle. SDA GPIO3, SCL GPIO4 và nguồn VSENSOR. X1 BAT mặt trước, pad 1 GND, pad 2 VBAT. |
| ESP32 DevKit V1 clone | 30 | Cổng Micro-USB tới cầu UART. Danh mục chỉ xác nhận hai hàng của bản 30 chân. Pad phụ trên clone khác cần nhận diện revision. |
| Arduino Uno R3 | 44 | Hai ICSP đã có trong A1. JP2, TP_USBVCC0 và TP_XUSB0 hiện thuộc nhóm tra cứu footprint. |
| Arduino Nano classic | 36 | J4 sáu pad ICSP đã có. CAD biểu diễn pad chưa lắp đầu cắm. |
| Arduino Mega 2560 R3 | 98 | ICSP0, ICSP1 và JP6 đã có trong manifest. JP5 là footprint phụ, chưa có bảng chức năng theo phiên bản. |
| NUCLEO-F401RE C04 | 108 | CN4 sáu pad có điểm chọn. Bảng tra bổ sung CN2, JP1, JP5, JP6. |
| ESP32-C3-DevKitM-1 PCB V1.0 | 30 | JTAG trên J3.8–J3.11, USB native trên J3.13–J3.14 và UART0 trên J3.2–J3.3. Micro-USB của board nối cầu UART. |
| ESP32-DevKitM-1 PCB V1.0 | 34 | Cổng Micro-USB tới cầu UART. J1/J3 là các header trong cấu hình tham chiếu. Chân test trên module cần riêng sơ đồ. |
| ESP32-S3-DevKitC-1 PCB V1.1 | 44 | CAD có hai cổng J2/J4. Tài liệu phân biệt USB native với USB–UART. Thông tin GPIO phụ thuộc biến thể flash/PSRAM. |
| STM32 Blue Pill F103 clone | 40 | J5 là vị trí SWD trong hình tham chiếu. Thứ tự chân và tọa độ cần PCB của clone cụ thể. |
| Raspberry Pi Pico R3 | 40 | J2 SWD ở mép dưới có ba điểm chọn theo dữ liệu Allegro R3a đã nhập và phép đổi trục của model. |
| Raspberry Pi Pico W | 40 | J2 SWD ngay dưới MCU, ba điểm chọn theo Allegro `rpi-picow-r3-2.brd` đã nhập và phép đổi trục của model W. |
| Raspberry Pi Pico 2 | 40 | SWD ở mép dưới. Tên tín hiệu đã có. Cần đối chiếu tọa độ và orientation từ nguồn trực tiếp của Pico 2. |
| Raspberry Pi Pico 2 H SC1632 | 40 | JST-SH ba chân đã có thứ tự từ đặc tả Raspberry Pi. CAD cần xác định vị trí tiếp điểm trong thân cắm. |
| ESP32-C6-DevKitC-1 PCB v1.2 | 32 | Hai USB-C theo PCB, một đường qua cầu UART. Jumper đo dòng cần đối chiếu pad theo schematic đúng revision. |
| NUCLEO-F411RE C04 | 108 | CN4 sáu pad có điểm chọn trên layout MB1136C. Bảng tra bổ sung CN2, JP1, JP5, JP6. |
| Arduino UNO R4 Minima ABX00080 | 32 | J2 SWD 10 pad và J1 ICSP 6 pad có điểm chọn từ đúng Altium và STEP. J2.6 là NC. |
| Arduino UNO R4 WiFi ABX00087 | 32 | J2 Qwiic, J6 ESP Header, J3 ICSP và JOFF có điểm chọn từ đúng Altium và STEP. J6 thuộc ESP32-S3 phụ. J3 thuộc RA4M1. |
| Arduino Nano ESP32 ABX00083 | 30 | Hai hàng JP1/JP2 đã tra. Các pad nội bộ cần CAD có tọa độ để thêm điểm chọn. |
| Arduino Nano Every V4.0 | 30 | Bảng SWD mặt dưới của SAMD11. Vị trí 4 bỏ pad. UPDI đến ATmega4809 nằm trên PCB. |
| ESP32-S2-DevKitC-1 PCB V1 | 44 | Hai Micro-USB theo schematic, gồm USB native và USB–UART. Cần nguồn hình học cho test pad riêng nếu bổ sung. |
| ESP32-H2-DevKitM-1 PCB v1.2 | 30 | Hai USB-C theo schematic, gồm USB native và USB–UART. Bảng J1/J3 dùng đúng revision. |
| NUCLEO-L476RG C04 | 108 | CN4 sáu pad có điểm chọn trên layout MB1136C. BOM riêng C04 vẫn mở. |
| NUCLEO-F446RE C04 | 108 | CN4 sáu pad có điểm chọn trên layout MB1136C. Bảng tra bổ sung CN2, JP1, JP5, JP6. |

Tài liệu UM1724 nêu CN4.6 dành riêng trong bảng dây target ngoài. SB15 nối SWO với PB3 khi đóng. BOM C04 của F401RE, F411RE và F446RE ghi SB12 và SB15 lắp bằng điện trở 0 Ω. BOM riêng L476RG C04 chưa có trong bộ nguồn. CN4.1 là điện áp tham chiếu từ target. Nhóm SWD của Pico có SWCLK, GND và SWDIO. [UM1724 Rev 17](https://www.st.com/resource/en/user_manual/um1724-stm32-nucleo64-boards-mb1136-stmicroelectronics.pdf) · [Đặc tả đầu debug Raspberry Pi](https://pip.raspberrypi.com/documents/RP-008189-DS)
