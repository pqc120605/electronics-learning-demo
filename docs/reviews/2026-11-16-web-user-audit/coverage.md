# Ma trận bao phủ audit Mạch Mở

Ngày 16–17/11/2026 · Task MM-SW-USER-AUDIT-20261116. TESTED nghĩa là đã thực hiện đúng hành trình ghi ở bằng chứng; không có nghĩa mọi tổ hợp đầu vào/đặc tính vật lý đã được kiểm.

[Báo cáo](report.md) · [Gallery ảnh](gallery.html) · [Finding](findings.json)

## Route smoke desktop

| Route | Ảnh |
|---|---|
| / | [Trang chủ](screenshots/001-home-desktop.png) |
| `/app` | [010-app-desktop.png](screenshots/010-app-desktop.png) |
| `/topics` | [011-topics-desktop.png](screenshots/011-topics-desktop.png) |
| `/boards` | [012-boards-desktop.png](screenshots/012-boards-desktop.png) |
| `/components` | [013-components-desktop.png](screenshots/013-components-desktop.png) |
| `/projects` | [014-projects-desktop.png](screenshots/014-projects-desktop.png) |
| `/app/classroom-kits` | [015-app-classroom-kits-desktop.png](screenshots/015-app-classroom-kits-desktop.png) |
| `/tools/electronics-calculators` | [016-tools-electronics-calculators-desktop.png](screenshots/016-tools-electronics-calculators-desktop.png) |
| `/tools/spice` | [017-tools-spice-desktop.png](screenshots/017-tools-spice-desktop.png) |
| `/tools/sketch` | [018-tools-sketch-desktop.png](screenshots/018-tools-sketch-desktop.png) |
| `/tools/firmware-hex` | [019-tools-firmware-hex-desktop.png](screenshots/019-tools-firmware-hex-desktop.png) |
| `/community` | [020-community-desktop.png](screenshots/020-community-desktop.png) |
| `/feedback` | [021-feedback-desktop.png](screenshots/021-feedback-desktop.png) |
| `/privacy` | [022-privacy-desktop.png](screenshots/022-privacy-desktop.png) |
| `/login` | [023-login-desktop.png](screenshots/023-login-desktop.png) |
| `/admin/login` | [024-admin-login-desktop.png](screenshots/024-admin-login-desktop.png) |
| `/app/robot-simulation` | [025-app-robot-simulation-desktop.png](screenshots/025-app-robot-simulation-desktop.png) |

## Mobile 375×812

Không thấy document tràn ngang ở 20 route mẫu. Chiều cao/nested scroll dưới đây là số đo snapshot, không phải tiêu chí PASS UX.

| Route | Document W×H CSS px | Vùng cuộn | Ảnh |
|---|---:|---:|---|
| `/` | 360×4086 | 1 | [mobile-01-.png](screenshots/mobile-01-.png) |
| `/app` | 375×6482 | 1 | [mobile-02-app.png](screenshots/mobile-02-app.png) |
| `/topics` | 360×4633 | 0 | [mobile-03-topics.png](screenshots/mobile-03-topics.png) |
| `/boards` | 375×24025 | 1 | [mobile-04-boards.png](screenshots/mobile-04-boards.png) |
| `/components` | 375×5100 | 1 | [mobile-05-components.png](screenshots/mobile-05-components.png) |
| `/projects` | 360×7757 | 0 | [mobile-06-projects.png](screenshots/mobile-06-projects.png) |
| `/build/freestyle` | 360×1195 | 1 | [mobile-07-build-freestyle.png](screenshots/mobile-07-build-freestyle.png) |
| `/build?lesson=button-led&board=esp32-devkit` | 375×7497 | 3 | [mobile-08-build.png](screenshots/mobile-08-build.png) |
| `/learn/esp32-led?board=esp32-devkit` | 375×4981 | 1 | [mobile-09-learn-esp32-led.png](screenshots/mobile-09-learn-esp32-led.png) |
| `/app/classroom-kits` | 360×4058 | 1 | [mobile-10-app-classroom-kits.png](screenshots/mobile-10-app-classroom-kits.png) |
| `/tools/electronics-calculators` | 360×3262 | 0 | [mobile-11-tools-electronics-calculators.png](screenshots/mobile-11-tools-electronics-calculators.png) |
| `/tools/spice` | 360×2833 | 1 | [mobile-12-tools-spice.png](screenshots/mobile-12-tools-spice.png) |
| `/tools/sketch` | 360×1538 | 0 | [mobile-13-tools-sketch.png](screenshots/mobile-13-tools-sketch.png) |
| `/tools/firmware-hex` | 375×1884 | 0 | [mobile-14-tools-firmware-hex.png](screenshots/mobile-14-tools-firmware-hex.png) |
| `/community` | 360×3526 | 0 | [mobile-15-community.png](screenshots/mobile-15-community.png) |
| `/community/new` | 375×2002 | 0 | [mobile-16-community-new.png](screenshots/mobile-16-community-new.png) |
| `/feedback` | 375×1830 | 0 | [mobile-17-feedback.png](screenshots/mobile-17-feedback.png) |
| `/privacy` | 375×1221 | 0 | [mobile-18-privacy.png](screenshots/mobile-18-privacy.png) |
| `/login` | 375×1067 | 0 | [mobile-19-login.png](screenshots/mobile-19-login.png) |
| `/app/robot-simulation` | 375×2020 | 0 | [mobile-20-app-robot-simulation.png](screenshots/mobile-20-app-robot-simulation.png) |

## Toàn bộ 28 hồ sơ board

VIEWER_TESTED = render canvas/scene và đọc profile; LOOKUP_TESTED = không có viewer, đã xác nhận giới hạn. Thêm scene ESP32 LED đã mở và chụp riêng: [ảnh](screenshots/board-esp32-extra-led-scene.png). Pin picking mọi pad và xác nhận vật lý vẫn NOT_RUN.

| Board | Trạng thái | Ảnh |
|---|---|---|
| Seeed Studio XIAO ESP32-C3 | VIEWER_TESTED | [board-01-seeed-xiao-esp32c3.png](screenshots/board-01-seeed-xiao-esp32c3.png) |
| Seeed Studio XIAO ESP32-S3 | VIEWER_TESTED | [board-02-seeed-xiao-esp32-s3.png](screenshots/board-02-seeed-xiao-esp32-s3.png) |
| Adafruit QT Py ESP32-C3 | VIEWER_TESTED | [board-03-adafruit-qtpy-esp32-c3-5405.png](screenshots/board-03-adafruit-qtpy-esp32-c3-5405.png) |
| Adafruit Feather ESP32-S3 TFT · #5483 | VIEWER_TESTED | [board-04-adafruit-feather-esp32-s3-tft-5483.png](screenshots/board-04-adafruit-feather-esp32-s3-tft-5483.png) |
| Adafruit Feather ESP32-S3 · #5323 | VIEWER_TESTED | [board-05-adafruit-feather-esp32-s3-5323.png](screenshots/board-05-adafruit-feather-esp32-s3-5323.png) |
| ESP32 DevKit V1 | VIEWER_TESTED | [board-06-esp32-devkit.png](screenshots/board-06-esp32-devkit.png) |
| Arduino Uno R3 | VIEWER_TESTED | [board-07-arduino-uno-r3.png](screenshots/board-07-arduino-uno-r3.png) |
| Arduino Nano classic | VIEWER_TESTED | [board-08-arduino-nano-classic.png](screenshots/board-08-arduino-nano-classic.png) |
| Arduino Mega 2560 R3 | VIEWER_TESTED | [board-09-arduino-mega-2560-r3.png](screenshots/board-09-arduino-mega-2560-r3.png) |
| STM32 NUCLEO-F401RE | VIEWER_TESTED | [board-10-stm32-nucleo.png](screenshots/board-10-stm32-nucleo.png) |
| ESP32-C3-DevKitM-1 | LOOKUP_TESTED | [board-11-esp32-c3-devkitm-1.png](screenshots/board-11-esp32-c3-devkitm-1.png) |
| ESP32-DevKitM-1 | LOOKUP_TESTED | [board-12-esp32-devkitm-1.png](screenshots/board-12-esp32-devkitm-1.png) |
| ESP32-S3-DevKitC-1 | VIEWER_TESTED | [board-13-esp32-s3-devkitc-1.png](screenshots/board-13-esp32-s3-devkitc-1.png) |
| STM32F103C8T6 Blue Pill | VIEWER_TESTED | [board-14-stm32-blue-pill-f103.png](screenshots/board-14-stm32-blue-pill-f103.png) |
| Raspberry Pi Pico | VIEWER_TESTED | [board-15-raspberry-pi-pico.png](screenshots/board-15-raspberry-pi-pico.png) |
| Raspberry Pi Pico W | VIEWER_TESTED | [board-16-raspberry-pi-pico-w.png](screenshots/board-16-raspberry-pi-pico-w.png) |
| Raspberry Pi Pico 2 | VIEWER_TESTED | [board-17-raspberry-pi-pico-2.png](screenshots/board-17-raspberry-pi-pico-2.png) |
| Raspberry Pi Pico 2 H | VIEWER_TESTED | [board-18-raspberry-pi-pico-2-h.png](screenshots/board-18-raspberry-pi-pico-2-h.png) |
| ESP32-C6-DevKitC-1 | LOOKUP_TESTED | [board-19-esp32-c6-devkitc-1.png](screenshots/board-19-esp32-c6-devkitc-1.png) |
| STM32 NUCLEO-F411RE | LOOKUP_TESTED | [board-20-stm32-nucleo-f411re.png](screenshots/board-20-stm32-nucleo-f411re.png) |
| Arduino UNO R4 Minima | LOOKUP_TESTED | [board-21-arduino-uno-r4-minima.png](screenshots/board-21-arduino-uno-r4-minima.png) |
| Arduino UNO R4 WiFi | LOOKUP_TESTED | [board-22-arduino-uno-r4-wifi.png](screenshots/board-22-arduino-uno-r4-wifi.png) |
| Arduino Nano ESP32 | LOOKUP_TESTED | [board-23-arduino-nano-esp32.png](screenshots/board-23-arduino-nano-esp32.png) |
| Arduino Nano Every | LOOKUP_TESTED | [board-24-arduino-nano-every.png](screenshots/board-24-arduino-nano-every.png) |
| ESP32-S2-DevKitC-1 | LOOKUP_TESTED | [board-25-esp32-s2-devkitc-1.png](screenshots/board-25-esp32-s2-devkitc-1.png) |
| ESP32-H2-DevKitM-1 | LOOKUP_TESTED | [board-26-esp32-h2-devkitm-1.png](screenshots/board-26-esp32-h2-devkitm-1.png) |
| STM32 NUCLEO-L476RG | LOOKUP_TESTED | [board-27-stm32-nucleo-l476rg.png](screenshots/board-27-stm32-nucleo-l476rg.png) |
| STM32 NUCLEO-F446RE | LOOKUP_TESTED | [board-28-stm32-nucleo-f446re.png](screenshots/board-28-stm32-nucleo-f446re.png) |

## Toàn bộ 59 thẻ linh kiện

Đã mở từng card/2D; 45 card có GLB được chuyển sang 3D và render. 14 card MCU thuộc luồng board; không tự coi có thêm 14 GLB component độc lập. Không đo footprint/vị trí mọi chân.

| ID / tên | Thao tác | Ảnh 2D | Ảnh 3D |
|---|---|---|---|
| `seeed-xiao-esp32c3` · Seeed Studio XIAO ESP32-C3 | 2D/profile; 3D theo board | [component-01-seeed-xiao-esp32c3-2d.png](screenshots/component-01-seeed-xiao-esp32c3-2d.png) | — |
| `seeed-xiao-esp32-s3` · Seeed Studio XIAO ESP32-S3 | 2D/profile; 3D theo board | [component-02-seeed-xiao-esp32-s3-2d.png](screenshots/component-02-seeed-xiao-esp32-s3-2d.png) | — |
| `esp32-devkit` · ESP32 DevKit V1 | 2D/profile; 3D theo board | [component-03-esp32-devkit-2d.png](screenshots/component-03-esp32-devkit-2d.png) | — |
| `adafruit-qtpy-esp32-c3-5405` · Adafruit QT Py ESP32-C3 · #5405 | 2D/profile; 3D theo board | [component-04-adafruit-qtpy-esp32-c3-5405-2d.png](screenshots/component-04-adafruit-qtpy-esp32-c3-5405-2d.png) | — |
| `adafruit-feather-esp32-s3-tft-5483` · Adafruit Feather ESP32-S3 TFT · #5483 | 2D/profile; 3D theo board | [component-05-adafruit-feather-esp32-s3-tft-5483-2d.png](screenshots/component-05-adafruit-feather-esp32-s3-tft-5483-2d.png) | — |
| `adafruit-feather-esp32-s3-5323` · Adafruit Feather ESP32-S3 · #5323 | 2D/profile; 3D theo board | [component-06-adafruit-feather-esp32-s3-5323-2d.png](screenshots/component-06-adafruit-feather-esp32-s3-5323-2d.png) | — |
| `arduino-uno` · Arduino Uno R3 | 2D/profile; 3D theo board | [component-07-arduino-uno-2d.png](screenshots/component-07-arduino-uno-2d.png) | — |
| `arduino-nano` · Arduino Nano classic | 2D/profile; 3D theo board | [component-08-arduino-nano-2d.png](screenshots/component-08-arduino-nano-2d.png) | — |
| `arduino-mega` · Arduino Mega 2560 R3 | 2D/profile; 3D theo board | [component-09-arduino-mega-2d.png](screenshots/component-09-arduino-mega-2d.png) | — |
| `stm32-f401` · STM32 NUCLEO-F401RE | 2D/profile; 3D theo board | [component-10-stm32-f401-2d.png](screenshots/component-10-stm32-f401-2d.png) | — |
| `stm32-blue-pill` · STM32F103C8T6 Blue Pill | 2D/profile; 3D theo board | [component-11-stm32-blue-pill-2d.png](screenshots/component-11-stm32-blue-pill-2d.png) | — |
| `rp2040-pico` · Raspberry Pi Pico (RP2040) | 2D/profile; 3D theo board | [component-12-rp2040-pico-2d.png](screenshots/component-12-rp2040-pico-2d.png) | — |
| `rp2350-pico-2-h` · Raspberry Pi Pico 2 H (RP2350) | 2D/profile; 3D theo board | [component-13-rp2350-pico-2-h-2d.png](screenshots/component-13-rp2350-pico-2-h-2d.png) | — |
| `esp32-s3` · ESP32-S3 DevKitC-1 | 2D/profile; 3D theo board | [component-14-esp32-s3-2d.png](screenshots/component-14-esp32-s3-2d.png) | — |
| `resistor` · Điện trở xuyên lỗ | 2D + 3D render | [component-15-resistor-2d.png](screenshots/component-15-resistor-2d.png) | [component-15-resistor-3d.png](screenshots/component-15-resistor-3d.png) |
| `potentiometer` · Biến trở 10 kΩ | 2D + 3D render | [component-16-potentiometer-2d.png](screenshots/component-16-potentiometer-2d.png) | [component-16-potentiometer-3d.png](screenshots/component-16-potentiometer-3d.png) |
| `led` · LED 5 mm | 2D + 3D render | [component-17-led-2d.png](screenshots/component-17-led-2d.png) | [component-17-led-3d.png](screenshots/component-17-led-3d.png) |
| `button` · Nút nhấn 4 chân | 2D + 3D render | [component-18-button-2d.png](screenshots/component-18-button-2d.png) | [component-18-button-3d.png](screenshots/component-18-button-3d.png) |
| `ldr` · Quang trở LDR | 2D + 3D render | [component-19-ldr-2d.png](screenshots/component-19-ldr-2d.png) | [component-19-ldr-3d.png](screenshots/component-19-ldr-3d.png) |
| `ntc` · Điện trở nhiệt NTC | 2D + 3D render | [component-20-ntc-2d.png](screenshots/component-20-ntc-2d.png) | [component-20-ntc-3d.png](screenshots/component-20-ntc-3d.png) |
| `dht22` · Module DHT22 / AM2302 | 2D + 3D render | [component-21-dht22-2d.png](screenshots/component-21-dht22-2d.png) | [component-21-dht22-3d.png](screenshots/component-21-dht22-3d.png) |
| `hc-sr04` · Cảm biến siêu âm HC-SR04 | 2D + 3D render | [component-22-hc-sr04-2d.png](screenshots/component-22-hc-sr04-2d.png) | [component-22-hc-sr04-3d.png](screenshots/component-22-hc-sr04-3d.png) |
| `pir` · Cảm biến chuyển động PIR | 2D + 3D render | [component-23-pir-2d.png](screenshots/component-23-pir-2d.png) | [component-23-pir-3d.png](screenshots/component-23-pir-3d.png) |
| `slide-switch` · Công tắc gạt | 2D + 3D render | [component-24-slide-switch-2d.png](screenshots/component-24-slide-switch-2d.png) | [component-24-slide-switch-3d.png](screenshots/component-24-slide-switch-3d.png) |
| `limit-switch` · Công tắc hành trình | 2D + 3D render | [component-25-limit-switch-2d.png](screenshots/component-25-limit-switch-2d.png) | [component-25-limit-switch-3d.png](screenshots/component-25-limit-switch-3d.png) |
| `buzzer` · Buzzer chủ động | 2D + 3D render | [component-26-buzzer-2d.png](screenshots/component-26-buzzer-2d.png) | [component-26-buzzer-3d.png](screenshots/component-26-buzzer-3d.png) |
| `servo` · Servo micro SG90 (tham chiếu) | 2D + 3D render | [component-27-servo-2d.png](screenshots/component-27-servo-2d.png) | [component-27-servo-3d.png](screenshots/component-27-servo-3d.png) |
| `dc-motor` · Động cơ DC chổi than | 2D + 3D render | [component-28-dc-motor-2d.png](screenshots/component-28-dc-motor-2d.png) | [component-28-dc-motor-3d.png](screenshots/component-28-dc-motor-3d.png) |
| `motor-driver` · Driver cầu H TB6612FNG | 2D + 3D render | [component-29-motor-driver-2d.png](screenshots/component-29-motor-driver-2d.png) | [component-29-motor-driver-3d.png](screenshots/component-29-motor-driver-3d.png) |
| `mosfet` · MOSFET logic-level N-channel | 2D + 3D render | [component-30-mosfet-2d.png](screenshots/component-30-mosfet-2d.png) | [component-30-mosfet-3d.png](screenshots/component-30-mosfet-3d.png) |
| `relay` · Module relay 1 kênh | 2D + 3D render | [component-31-relay-2d.png](screenshots/component-31-relay-2d.png) | [component-31-relay-3d.png](screenshots/component-31-relay-3d.png) |
| `oled` · OLED I²C 0.96 inch (SSD1306) | 2D + 3D render | [component-32-oled-2d.png](screenshots/component-32-oled-2d.png) | [component-32-oled-3d.png](screenshots/component-32-oled-3d.png) |
| `lcd1602` · LCD 1602 + backpack I²C | 2D + 3D render | [component-33-lcd1602-2d.png](screenshots/component-33-lcd1602-2d.png) | [component-33-lcd1602-3d.png](screenshots/component-33-lcd1602-3d.png) |
| `neopixel` · LED RGB addressable WS2812B | 2D + 3D render | [component-34-neopixel-2d.png](screenshots/component-34-neopixel-2d.png) | [component-34-neopixel-3d.png](screenshots/component-34-neopixel-3d.png) |
| `rgb-led` · LED RGB 4 chân | 2D + 3D render | [component-35-rgb-led-2d.png](screenshots/component-35-rgb-led-2d.png) | [component-35-rgb-led-3d.png](screenshots/component-35-rgb-led-3d.png) |
| `ir-obstacle` · Module cảm biến vật cản hồng ngoại | 2D + 3D render | [component-36-ir-obstacle-2d.png](screenshots/component-36-ir-obstacle-2d.png) | [component-36-ir-obstacle-3d.png](screenshots/component-36-ir-obstacle-3d.png) |
| `photoresistor-module` · Module cảm biến ánh sáng AO/DO | 2D + 3D render | [component-37-photoresistor-module-2d.png](screenshots/component-37-photoresistor-module-2d.png) | [component-37-photoresistor-module-3d.png](screenshots/component-37-photoresistor-module-3d.png) |
| `soil` · Cảm biến độ ẩm đất điện dung | 2D + 3D render | [component-38-soil-2d.png](screenshots/component-38-soil-2d.png) | [component-38-soil-3d.png](screenshots/component-38-soil-3d.png) |
| `mpu6050` · IMU MPU-6050 breakout | 2D + 3D render | [component-39-mpu6050-2d.png](screenshots/component-39-mpu6050-2d.png) | [component-39-mpu6050-3d.png](screenshots/component-39-mpu6050-3d.png) |
| `bmp280` · Cảm biến áp suất BMP280 breakout | 2D + 3D render | [component-40-bmp280-2d.png](screenshots/component-40-bmp280-2d.png) | [component-40-bmp280-3d.png](screenshots/component-40-bmp280-3d.png) |
| `ir-receiver` · Mắt thu hồng ngoại 38 kHz | 2D + 3D render | [component-41-ir-receiver-2d.png](screenshots/component-41-ir-receiver-2d.png) | [component-41-ir-receiver-3d.png](screenshots/component-41-ir-receiver-3d.png) |
| `diode` · Diode chỉnh lưu / bảo vệ | 2D + 3D render | [component-42-diode-2d.png](screenshots/component-42-diode-2d.png) | [component-42-diode-3d.png](screenshots/component-42-diode-3d.png) |
| `capacitor` · Tụ điện gốm | 2D + 3D render | [component-43-capacitor-2d.png](screenshots/component-43-capacitor-2d.png) | [component-43-capacitor-3d.png](screenshots/component-43-capacitor-3d.png) |
| `electrolytic` · Tụ điện hoá | 2D + 3D render | [component-44-electrolytic-2d.png](screenshots/component-44-electrolytic-2d.png) | [component-44-electrolytic-3d.png](screenshots/component-44-electrolytic-3d.png) |
| `transistor-bjt` · Transistor NPN 2N2222 (tham chiếu) | 2D + 3D render | [component-45-transistor-bjt-2d.png](screenshots/component-45-transistor-bjt-2d.png) | [component-45-transistor-bjt-3d.png](screenshots/component-45-transistor-bjt-3d.png) |
| `breadboard` · Breadboard 400 điểm | 2D + 3D render | [component-46-breadboard-2d.png](screenshots/component-46-breadboard-2d.png) | [component-46-breadboard-3d.png](screenshots/component-46-breadboard-3d.png) |
| `jumper` · Dây jumper Dupont | 2D + 3D render | [component-47-jumper-2d.png](screenshots/component-47-jumper-2d.png) | [component-47-jumper-3d.png](screenshots/component-47-jumper-3d.png) |
| `usb-cable` · Cáp USB truyền dữ liệu | 2D + 3D render | [component-48-usb-cable-2d.png](screenshots/component-48-usb-cable-2d.png) | [component-48-usb-cable-3d.png](screenshots/component-48-usb-cable-3d.png) |
| `logic-level` · Module chuyển mức logic 4 kênh | 2D + 3D render | [component-49-logic-level-2d.png](screenshots/component-49-logic-level-2d.png) | [component-49-logic-level-3d.png](screenshots/component-49-logic-level-3d.png) |
| `dc-supply` · Nguồn DC thấp áp | 2D + 3D render | [component-50-dc-supply-2d.png](screenshots/component-50-dc-supply-2d.png) | [component-50-dc-supply-3d.png](screenshots/component-50-dc-supply-3d.png) |
| `power-bank` · Nguồn USB 5 V | 2D + 3D render | [component-51-power-bank-2d.png](screenshots/component-51-power-bank-2d.png) | [component-51-power-bank-3d.png](screenshots/component-51-power-bank-3d.png) |
| `buck` · Module hạ áp DC-DC | 2D + 3D render | [component-52-buck-2d.png](screenshots/component-52-buck-2d.png) | [component-52-buck-3d.png](screenshots/component-52-buck-3d.png) |
| `boost` · Module tăng áp DC-DC | 2D + 3D render | [component-53-boost-2d.png](screenshots/component-53-boost-2d.png) | [component-53-boost-3d.png](screenshots/component-53-boost-3d.png) |
| `h-bridge-l298n` · Module cầu H L298N | 2D + 3D render | [component-54-h-bridge-l298n-2d.png](screenshots/component-54-h-bridge-l298n-2d.png) | [component-54-h-bridge-l298n-3d.png](screenshots/component-54-h-bridge-l298n-3d.png) |
| `soil-relay-pump` · Bơm DC mini (tải tham chiếu) | 2D + 3D render | [component-55-soil-relay-pump-2d.png](screenshots/component-55-soil-relay-pump-2d.png) | [component-55-soil-relay-pump-3d.png](screenshots/component-55-soil-relay-pump-3d.png) |
| `rotary-encoder` · Encoder xoay KY-040 | 2D + 3D render | [component-56-rotary-encoder-2d.png](screenshots/component-56-rotary-encoder-2d.png) | [component-56-rotary-encoder-3d.png](screenshots/component-56-rotary-encoder-3d.png) |
| `rfid` · RFID RC522 breakout | 2D + 3D render | [component-57-rfid-2d.png](screenshots/component-57-rfid-2d.png) | [component-57-rfid-3d.png](screenshots/component-57-rfid-3d.png) |
| `mosfet-module` · Module MOSFET 1 kênh | 2D + 3D render | [component-58-mosfet-module-2d.png](screenshots/component-58-mosfet-module-2d.png) | [component-58-mosfet-module-3d.png](screenshots/component-58-mosfet-module-3d.png) |
| `seven-segment` · LED 7 đoạn 1 chữ số | 2D + 3D render | [component-59-seven-segment-2d.png](screenshots/component-59-seven-segment-2d.png) | [component-59-seven-segment-3d.png](screenshots/component-59-seven-segment-3d.png) |

## Bài học

44 case = 11 bài × breadboard/schematic/3D/run trên target được ghi trong JSON. Run là đã vào/thử trạng thái chạy theo case; không xác nhận mọi branch, mức input, board target hay tiêu chí sư phạm. Bài khái niệm không được gọi là solver/firmware.

| Bài | View/case và ảnh |
|---|---|
| `blink` | breadboard: [lesson-blink-breadboard.png](screenshots/lesson-blink-breadboard.png) · schematic: [lesson-blink-schematic.png](screenshots/lesson-blink-schematic.png) · 3d: [lesson-blink-3d.png](screenshots/lesson-blink-3d.png) · run: [lesson-blink-run.png](screenshots/lesson-blink-run.png) |
| `source-led` | breadboard: [lesson-source-led-breadboard.png](screenshots/lesson-source-led-breadboard.png) · schematic: [lesson-source-led-schematic.png](screenshots/lesson-source-led-schematic.png) · 3d: [lesson-source-led-3d.png](screenshots/lesson-source-led-3d.png) · run: [lesson-source-led-run.png](screenshots/lesson-source-led-run.png) |
| `button-led` | breadboard: [lesson-button-led-breadboard.png](screenshots/lesson-button-led-breadboard.png) · schematic: [lesson-button-led-schematic.png](screenshots/lesson-button-led-schematic.png) · 3d: [lesson-button-led-3d.png](screenshots/lesson-button-led-3d.png) · run: [lesson-button-led-run.png](screenshots/lesson-button-led-run.png) |
| `analog-potentiometer` | breadboard: [lesson-analog-potentiometer-breadboard.png](screenshots/lesson-analog-potentiometer-breadboard.png) · schematic: [lesson-analog-potentiometer-schematic.png](screenshots/lesson-analog-potentiometer-schematic.png) · 3d: [lesson-analog-potentiometer-3d.png](screenshots/lesson-analog-potentiometer-3d.png) · run: [lesson-analog-potentiometer-run.png](screenshots/lesson-analog-potentiometer-run.png) |
| `analog-ldr` | breadboard: [lesson-analog-ldr-breadboard.png](screenshots/lesson-analog-ldr-breadboard.png) · schematic: [lesson-analog-ldr-schematic.png](screenshots/lesson-analog-ldr-schematic.png) · 3d: [lesson-analog-ldr-3d.png](screenshots/lesson-analog-ldr-3d.png) · run: [lesson-analog-ldr-run.png](screenshots/lesson-analog-ldr-run.png) |
| `ir-alert` | breadboard: [lesson-ir-alert-breadboard.png](screenshots/lesson-ir-alert-breadboard.png) · schematic: [lesson-ir-alert-schematic.png](screenshots/lesson-ir-alert-schematic.png) · 3d: [lesson-ir-alert-3d.png](screenshots/lesson-ir-alert-3d.png) · run: [lesson-ir-alert-run.png](screenshots/lesson-ir-alert-run.png) |
| `ultrasonic-distance` | breadboard: [lesson-ultrasonic-distance-breadboard.png](screenshots/lesson-ultrasonic-distance-breadboard.png) · schematic: [lesson-ultrasonic-distance-schematic.png](screenshots/lesson-ultrasonic-distance-schematic.png) · 3d: [lesson-ultrasonic-distance-3d.png](screenshots/lesson-ultrasonic-distance-3d.png) · run: [lesson-ultrasonic-distance-run.png](screenshots/lesson-ultrasonic-distance-run.png) |
| `seven-segment-counter` | breadboard: [lesson-seven-segment-counter-breadboard.png](screenshots/lesson-seven-segment-counter-breadboard.png) · schematic: [lesson-seven-segment-counter-schematic.png](screenshots/lesson-seven-segment-counter-schematic.png) · 3d: [lesson-seven-segment-counter-3d.png](screenshots/lesson-seven-segment-counter-3d.png) · run: [lesson-seven-segment-counter-run.png](screenshots/lesson-seven-segment-counter-run.png) |
| `buck-boost-concept` | breadboard: [lesson-buck-boost-concept-breadboard.png](screenshots/lesson-buck-boost-concept-breadboard.png) · schematic: [lesson-buck-boost-concept-schematic.png](screenshots/lesson-buck-boost-concept-schematic.png) · 3d: [lesson-buck-boost-concept-3d.png](screenshots/lesson-buck-boost-concept-3d.png) · run: [lesson-buck-boost-concept-run.png](screenshots/lesson-buck-boost-concept-run.png) |
| `dc-motor-driver` | breadboard: [lesson-dc-motor-driver-breadboard.png](screenshots/lesson-dc-motor-driver-breadboard.png) · schematic: [lesson-dc-motor-driver-schematic.png](screenshots/lesson-dc-motor-driver-schematic.png) · 3d: [lesson-dc-motor-driver-3d.png](screenshots/lesson-dc-motor-driver-3d.png) · run: [lesson-dc-motor-driver-run.png](screenshots/lesson-dc-motor-driver-run.png) |
| `mosfet-switch` | breadboard: [lesson-mosfet-switch-breadboard.png](screenshots/lesson-mosfet-switch-breadboard.png) · schematic: [lesson-mosfet-switch-schematic.png](screenshots/lesson-mosfet-switch-schematic.png) · 3d: [lesson-mosfet-switch-3d.png](screenshots/lesson-mosfet-switch-3d.png) · run: [lesson-mosfet-switch-run.png](screenshots/lesson-mosfet-switch-run.png) |

## Các hành trình còn lại

| Nhóm | Đã thử | Giới hạn / bằng chứng |
|---|---|---|
| Freestyle | 8 board, 4 view, 4 mẫu, trace, dây click/drag/keyboard, draft JSON | [6 board](evidence/freestyle-boards.json), [2 STM32 + Uno compiler](evidence/freestyle-remaining-and-compile.json), [mẫu](evidence/freestyle-samples.json), [drag A/B sạch](evidence/wire-drag-fresh-comparison.json), [keyboard](evidence/keyboard-pin-pin.json). Nano/Mega compile chưa chờ hoàn tất. |
| Board/copper | 4 board F.Cu/B.Cu, net GND, vùng đồng, fit | [Viewers](evidence/copper-viewers.json), [layout](evidence/copper-layout.json). Không suy copper ra net điện workspace. |
| Sketch | 5 ví dụ, 8 target, button/slider, invalid syntax | [14 case](evidence/sketch-cases.json). Interpreter subset, không chạy ngoại vi mạng. |
| Firmware | AVR samples, target-confirmation, Pico, invalid file, CSV | [Evidence](evidence/firmware-cases.json). Không flash thiết bị/không UF2 tùy ý. |
| SPICE | .op/.tran/.ac/.dc, LED, CSV, .include, nhập KiCad XML+IPC | [Analyses](evidence/spice-cases.json), [CAD import](evidence/spice-cad-import.json), [ảnh solver](screenshots/spice-cad-import-solver.png). Cursor/probe interactive chưa đủ bằng chứng, không đánh PASS. |
| Calculators | 4 bộ tính, default/0/âm/rỗng, handoff | [Evidence](evidence/calculators-and-robot.json). Chưa thử mọi miền số. |
| Project | Save/export/import, duplicate/rename/tags/delete bản thử, mở project riêng, bad JSON | [Import](evidence/project-isolated-import.json), [Open](evidence/project-open-and-extra-scene.json), [rename](screenshots/project-isolated-rename-tags.png), [delete](screenshots/project-isolated-delete-copy.png). Quota/eviction/crash/restore từng revision NOT_RUN. |
| Kit | 8 trạm, 0 trạm, JSON/share/CSV roundtrip, bad JSON | [Evidence](evidence/kit-cases.json). Override UI/legacy mapping chưa đi hết; unit v1/v2 đã chạy. |
| Community | Local Markdown/ảnh/.ino, 6-file reject, reload/download, comment/report/filter/search | [Attachments](evidence/community-attachments.json), [post/guide](evidence/community-and-guide.json). Online/RLS/moderation NOT_RUN, Supabase chưa cấu hình. |
| Feedback | Empty validation, review, file download | [Evidence](evidence/feedback-and-community.json). Clipboard/email sending NOT_RUN. |
| Bot | 10 câu, source/unknown handling, 3D, reduced-motion | [Queries](evidence/community-and-guide.json), [reduced motion](evidence/mobile-interaction.json). Không phải AI từ xa. |
| Tour/theme | 7 tour, 34 bước, desktop/mobile; 3 theme | [Tours](evidence/tours.json), [theme](evidence/critical-route-and-theme.json). Theme không audit lại mọi màn. |
| Robot | 6 lệnh/tình huống + checklist 3/3 | [Evidence](evidence/calculators-and-robot.json). Chỉ minh họa khái niệm. |
| Accessibility | axe 6 màn, keyboard pin-pin và vài control | [axe](evidence/axe-sample.json), [keyboard](evidence/keyboard-pin-pin.json). Screen reader/physical touch/cross-browser NOT_RUN. |
| Auth/admin/offline | Đọc route và trạng thái kết nối | Login/admin online, offline SW và remote services NOT_RUN. Không thao tác tài khoản hoặc thiết bị thật. |

## Lỗi công cụ và case không dùng làm bằng chứng kết luận

- Timeout locator theo accessible name hoặc phần tử bị ẩn không tự được tính là lỗi sản phẩm. Một số macro bị ngắt nên chỉ còn ảnh, đã nêu riêng thay vì bịa kết quả JSON.
- `wire-drag-comparison.json` có clickStart tồn dư: không dùng làm bằng chứng chính; dùng `wire-drag-fresh-comparison.json` A/B sạch.
- `spice-cad-final.json` ghi probe NOT_RUN do không match accessible button; ảnh solver/điện áp quan sát được vẫn hợp lệ. Không đánh probe/cursor PASS.
- Vài ảnh locator copper/profile bị clipping do nested scroll. Dùng `copper-mega-svg.png` cùng layout JSON để đánh giá vùng đồng.
- Unit test 4 ca compiler đỏ vì môi trường Arduino trong sandbox; log đầy đủ được giữ, không skip/assertion edit.
- 12 board lookup-only và các model tham số/reconstruction không bị tính là asset lỗi chỉ vì chưa có CAD/solver/firmware.
