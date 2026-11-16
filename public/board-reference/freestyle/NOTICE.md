# Board top-view renders — Mạch Mở

Generated locally from the existing reference GLBs on 2026-11-15. These are educational reference views, not physical measurements, PCB footprints, or approval to manufacture. Connection stations in the 2D workbench are logical aliases, separate from physical pad positions.

## esp32-devkit

- Image: esp32-devkit-top.png
- Model: /models/esp32-devkit-v1-30pin.glb?v=b3d0a6b0be09
- Revision: Mô hình tham chiếu
- Source: https://github.com/BrijModi/ESP32-Dev-Kit-Clone
- Attribution: ESP32 Dev Kit Clone của Brij Modi; phải giữ ghi công của tác giả gốc.
- License statement from the source registry: MIT (thiết kế gốc; mesh gói linh kiện có điều khoản riêng)
- Limits: Hình học board dựa trên thiết kế clone KiCad được nêu tên; không đại diện cho mọi board bán dưới tên DevKit V1.

## esp32-s3-devkitc-1

- Image: esp32-s3-devkitc-1-top.png
- Model: /models/esp32-s3-devkitc-1-v1.1.glb?v=1ffe23480ffa
- Revision: Espressif ESP32-S3-DevKitC-1 · PCB V1.1 · PADS reference import
- Source: https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html
- Attribution: Espressif Systems (reference PADS/BOM) và KiCad Libraries Contributors (mesh package). Xem NOTICE cạnh GLB; không ngụ ý liên kết với Espressif.
- License statement from the source registry: Điều khoản Espressif reference design; package models KiCad CC BY-SA 4.0 kèm ngoại lệ chính thức.
- Limits: Viewer nội bộ được dựng từ PADS ASCII/BOM chính hãng V1.1: 48 footprint có mesh package và 44 pad header chọn được. PADS nhập vào có lỗi DRC; outline từ PADS lệch 0,125 mm với PDF kích thước. Đây là tái dựng giáo dục, chưa đối chiếu board vật lý và không dùng để chế tạo.
- Original notice: /models/esp32-s3-devkitc-1-v1.1.NOTICE.txt

## arduino-uno-r3

- Image: arduino-uno-r3-top.png
- Model: /models/arduino-uno-r3.glb?v=53330cd2b0d2
- Revision: Arduino Uno Rev3 · source CAD import
- Source: https://docs.arduino.cc/hardware/uno-rev3
- Attribution: Tệp CAD Arduino Uno Rev3; phải giữ ghi công nguồn và điều khoản chia sẻ tương tự.
- License statement from the source registry: CC BY-SA 4.0 (CAD tham chiếu; mesh gói linh kiện của bên thứ ba có thể có điều khoản riêng)
- Limits: Vị trí PCB theo CAD Rev3 đã nhập; đây không phải xác minh một board clone ngoài đời.

## arduino-nano

- Image: arduino-nano-top.png
- Model: /models/arduino-nano-classic.glb?v=43c1f8047b7f
- Revision: Arduino Nano classic · source CAD import (V3.3)
- Source: https://docs.arduino.cc/hardware/nano
- Attribution: Tệp CAD Arduino Nano; phải giữ ghi công nguồn và điều khoản chia sẻ tương tự.
- License statement from the source registry: CC BY-SA 4.0 (CAD tham chiếu; mesh gói linh kiện của bên thứ ba có thể có điều khoản riêng)
- Limits: Viewer theo thiết kế CAD V3.3; không đại diện cho mọi Nano clone.

## arduino-mega-2560

- Image: arduino-mega-2560-top.png
- Model: /models/arduino-mega-2560-r3.glb?v=adf1fcf07b4a
- Revision: Arduino Mega 2560 Rev3 · source CAD import
- Source: https://docs.arduino.cc/hardware/mega-2560
- Attribution: Tệp CAD Arduino Mega 2560 Rev3; phải giữ ghi công nguồn và điều khoản chia sẻ tương tự.
- License statement from the source registry: CC BY-SA 4.0 (CAD tham chiếu; mesh gói linh kiện của bên thứ ba có thể có điều khoản riêng)
- Limits: Vị trí PCB theo CAD tham chiếu Rev3; thân package dùng chung chỉ để minh họa.

## raspberry-pi-pico

- Image: raspberry-pi-pico-top.png
- Model: /models/raspberry-pi-pico.glb?v=aa1b6f4bb7b9
- Revision: Pico R3 · CAD tham chiếu chính hãng
- Source: https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#board-design-files
- Attribution: Raspberry Pi Ltd.; tệp thiết kế board Pico R3. Khi phân phối lại phải kèm thông báo giấy phép.
- License statement from the source registry: MIT (tệp model Raspberry Pi; mesh của bên thứ ba đi kèm giữ điều khoản riêng)
- Limits: Viewer được chuyển từ CAD cơ khí chính thức. Pin J0 lấy trực tiếp từ Allegro R3 và chức năng từ sơ đồ pinout hãng; chưa đo trên board vật lý.
- Original notice: /cad/raspberry-pi-model-license.txt

## stm32-blue-pill-f103

- Image: stm32-blue-pill-f103-top.png
- Model: /models/stm32-blue-pill-f103.glb?v=a520c6f436e2
- Revision: Tái dựng giáo dục · bản Blue Pill phổ biến 53,34 × 22,86 mm
- Source: https://stm32-base.org/boards/STM32F103C8T6-Blue-Pill.html
- Attribution: KiCad Libraries Contributors (package 3D). Blue Pill là họ board clone không thương hiệu; không liên kết với ST.
- License statement from the source registry: Package KiCad CC BY-SA 4.0 (kèm ngoại lệ thư viện)
- Limits: Dựng bằng scripts/build-stm32-education-boards.py: kích thước, hai hàng 1×20 cách 15,24 mm và thứ tự chân theo stm32-base; vị trí thạch anh, LDO, LED, nút và jumper là ước lượng. Chưa chạy code STM32.
- Original notice: /models/stm32-blue-pill-f103.NOTICE.txt

## stm32-nucleo-f401re

- Image: stm32-nucleo-f401re-top.png
- Model: /models/stm32-nucleo-f401re.glb?v=9124a49017a5
- Revision: Tái dựng giáo dục · Nucleo-64 70 × 82,5 mm (không dùng CAD của ST)
- Source: https://www.st.com/en/evaluation-tools/nucleo-f401re.html
- Attribution: KiCad Libraries Contributors (package 3D), Arduino (hình học header Uno R3). Không liên kết hay được ST xác nhận.
- License statement from the source registry: Package KiCad CC BY-SA 4.0 (kèm ngoại lệ thư viện); hình học header Arduino lấy từ CAD Arduino Uno R3, CC BY-SA 4.0.
- Limits: Dựng bằng scripts/build-stm32-education-boards.py: kích thước 70 × 82,5 mm và đánh số header theo UM1724; header Arduino cùng hình học Uno R3; vị trí linh kiện phụ và header morpho là ước lượng. Chưa chạy code STM32.
- Original notice: /models/stm32-nucleo-f401re.NOTICE.txt

