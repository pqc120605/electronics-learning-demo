# LK · Kiểm kê model board

Mốc 20/11/2026, baseline e3a64ba. Một dòng cho mỗi board trong catalog. Số sau dấu `/` chỉ đếm chân có cả tọa độ và định danh pad/header trong manifest viewer. Mốc đếm Uno/Mega gồm header sử dụng bên ngoài, chưa cộng ICSP. Nano đếm hai dãy 15 chân, Pico đếm hai dãy 20 chân. ESP32 DevKit V1 đối chiếu với clone Brij Modi cụ thể.

| Board | GLB MiB | Top view CAD | Chân viewer / pad định danh · picking | Chân tham chiếu | Mục viewer / footprint CAD | Phân loại |
|---|---:|---|---|---|---|---|
| [arduino-uno-r3](https://docs.arduino.cc/hardware/uno-rev3) | 6.37 | Có | 25/0 · tắt | 32 · tài liệu/CAD hãng | 120 / 120 | Thiếu chân |
| [arduino-nano-classic](https://docs.arduino.cc/hardware/nano) | 3.87 | Có | 27/0 · tắt | 30 · tài liệu/CAD hãng | 37 / 37 | Thiếu chân |
| [arduino-mega-2560-r3](https://docs.arduino.cc/hardware/mega-2560) | 9.81 | Có | 75/0 · tắt | 86 · tài liệu/CAD hãng | 72 / 72 | Thiếu chân |
| [raspberry-pi-pico](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#board-design-files) | 0.43 | Có | 40/40 · bật | 40 · tài liệu/CAD hãng | 16 / 0 | Thiếu linh kiện |
| [esp32-devkit](https://github.com/BrijModi/ESP32-Dev-Kit-Clone) | 1.36 | Có | 30/0 · bật | 30 · CAD clone | 15 / 0 | Thiếu linh kiện |
| [seeed-xiao-esp32c3](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/) | 4.69 | — | 14/14 · bật | Chưa đối chiếu | 68 / 68 | Chưa xác minh |
| [seeed-xiao-esp32-s3](https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/) | 0.44 | — | 14/14 · bật | Chưa đối chiếu | 4 / 0 | Thiếu linh kiện |
| [adafruit-qtpy-esp32-c3-5405](https://github.com/adafruit/Adafruit-QT-Py-ESP32-C3-PCB) | 0.73 | — | 14/14 · bật | Chưa đối chiếu | 37 / 35 | Chưa xác minh |
| [adafruit-feather-esp32-s3-tft-5483](https://github.com/adafruit/Adafruit-ESP32-S3-TFT-Feather-PCB) | 1.34 | — | 28/28 · bật | Chưa đối chiếu | 56 / 54 | Chưa xác minh |
| [adafruit-feather-esp32-s3-5323](https://github.com/adafruit/Adafruit-Feather-ESP32-S3-PCB) | 1.5 | — | 28/28 · bật | Chưa đối chiếu | 49 / 47 | Chưa xác minh |
| [stm32-nucleo](https://www.st.com/en/evaluation-tools/nucleo-f401re.html) | 4.53 | Có | 32/32 · bật | Chưa đối chiếu | 18 / 0 | Thiếu linh kiện |
| [esp32-c3-devkitm-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c3/esp32-c3-devkitm-1/user_guide.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [esp32-devkitm-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitm-1/user_guide.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [esp32-s3-devkitc-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html) | 7.84 | Có | 44/44 · bật | Chưa đối chiếu | 48 / 48 | Chưa xác minh |
| [stm32-blue-pill-f103](https://stm32-base.org/boards/STM32F103C8T6-Blue-Pill.html) | 2.17 | Có | 40/40 · bật | Chưa đối chiếu | 12 / 0 | Thiếu linh kiện |
| [raspberry-pi-pico-w](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#board-design-files) | 1.37 | — | 40/40 · bật | Chưa đối chiếu | 24 / 0 | Thiếu linh kiện |
| [raspberry-pi-pico-2](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#board-design-files) | 4.17 | — | 40/40 · bật | Chưa đối chiếu | 53 / 0 | Thiếu linh kiện |
| [raspberry-pi-pico-2-h](https://pip.raspberrypi.com/categories/1264-raspberry-pi-pico-2-h) | 3.78 | — | 40/40 · bật | Chưa đối chiếu | 55 / 0 | Thiếu linh kiện |
| [esp32-c6-devkitc-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c6/esp32-c6-devkitc-1/user_guide.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [stm32-nucleo-f411re](https://www.st.com/en/evaluation-tools/nucleo-f411re.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [arduino-uno-r4-minima](https://docs.arduino.cc/hardware/uno-r4-minima) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [arduino-uno-r4-wifi](https://docs.arduino.cc/hardware/uno-r4-wifi) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [arduino-nano-esp32](https://docs.arduino.cc/hardware/nano-esp32) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [arduino-nano-every](https://docs.arduino.cc/hardware/nano-every) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [esp32-s2-devkitc-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s2/esp32-s2-devkitc-1/user_guide.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [esp32-h2-devkitm-1](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32h2/esp32-h2-devkitm-1/user_guide.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [stm32-nucleo-l476rg](https://www.st.com/en/evaluation-tools/nucleo-l476rg.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |
| [stm32-nucleo-f446re](https://www.st.com/en/evaluation-tools/nucleo-f446re.html) | — | — | — | Chưa đối chiếu | — / — | Thiếu model |

Phân loại “Đủ” chỉ nói về số pad và dữ liệu mô hình đang có theo phạm vi đối chiếu. Mốc tất cả pad, sai số 0,3 mm, kích thước board và dung lượng vẫn cần kiểm riêng. “Chưa xác minh” dùng khi chưa đối chiếu số chân hãng.
