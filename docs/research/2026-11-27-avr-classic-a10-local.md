# A10 · Mạch nút nhấn và LED trên Nano classic và Mega 2560

[Cấu hình A10](2026-11-27-avr-classic-electrical-firmware-a10-proposal.json) có SHA-256 `AD4E9498355E8284F1E3D3BEB4CB22970312A0D98424102F8D11702E30F4C1CD`. A10 kiểm độ sâu D3 cho hai mạch mẫu, gồm CAT-01–03, FW-04, FW-07–08, SIM-02–04.

| Board tham chiếu | Nút nhấn | LED ngoài | 5 V, GND | USART0 TX |
| --- | --- | --- | --- | --- |
| Nano classic V3.3 · A000005 · ATmega328P | D2/PD2 · J1.5 | D8/PB0 · J1.11 | J2.4, J2.2 | D1/PD1 · J1.1 |
| Mega 2560 Rev3 · A000067 · ATmega2560 | D22/PA0 · XIO0.3 | D23/PA1 · XIO0.4 | POWER0.5, POWER0.6 | D1/PE1 · PWML0.2 |

Các khóa chân 2D và 3D dùng cùng dữ liệu CAD tham chiếu. Nano có 36 vị trí, gồm sáu pad J4 của ICSP. A6/A7 là đầu vào ADC chuyên dụng. Mega có 98 vị trí, gồm hai đầu ICSP riêng cho ATmega2560 và ATmega16U2. JP6 bao gồm SCL, SDA, AREF. JP5 có bảng tên net CAD của footprint 2×2 tùy chọn. [Pinout Nano](https://docs.arduino.cc/resources/pinouts/A000005-full-pinout.pdf) · [Sơ đồ Nano](https://docs.arduino.cc/resources/schematics/A000005-schematics.pdf) · [Pinout Mega](https://docs.arduino.cc/resources/pinouts/A000067-full-pinout.pdf) · [Sơ đồ Mega](https://docs.arduino.cc/resources/schematics/A000067-schematics.pdf)

## Chạy trên Windows localhost

```powershell
$env:ARDUINO_DIRECTORIES_DATA = Join-Path $env:LOCALAPPDATA 'Arduino15'
$env:ARDUINO_UPDATER_ENABLE_NOTIFICATION = 'false'
node scripts/stage-a10-avr-firmware.mjs
$env:MACHMO_REQUIRE_A10_ASSETS = '1'
node --test tests/a10-avr-classic.test.mjs
npm.cmd run dev -- --host 127.0.0.1
```

Script đối chiếu Arduino CLI 1.5.1, core `arduino:avr` 1.8.8, AVR-GCC `7.3.0-atmel3.6.1-arduino7`, ánh xạ pad, mô hình và ngspice WASM. Hai HEX và manifest nằm dưới `.tmp/a10-local-assets`. Mỗi manifest ghi SHA-256 của mạch mẫu, nguồn biên dịch và HEX. Trình duyệt đối chiếu target và SHA-256 mạch mẫu cùng HEX trước khi mở worker. Dùng `MACHMO_ARDUINO_CLI` nếu bộ Arduino CLI đã khóa được cài ở vị trí khác. [Arduino AVR Core 1.8.8](https://github.com/arduino/ArduinoCore-avr/releases/tag/1.8.8)

Trong **Thư viện → Board**, chọn đúng board rồi bấm **Mở mạch nút nhấn và LED A10**. Bấm **Chạy firmware**, giữ hoặc nhả nút, sau đó chọn trạng thái đã ghi để đo DC. Trang giữ bản nháp trước khi thay bằng mạch mẫu. Bản nháp lưu trong storage của trình duyệt theo origin và giữ khóa `partId/pinId`.

## Kết quả mô phỏng

| Target | SHA-256 HEX | Byte UART đầu tiên |
| --- | --- | --- |
| `arduino:avr:nano:cpu=atmega328` | `22cf4d32bc3dadb5a99b868b9187e438a86ac7967782ba7999eaa336d54ccdf9` | `A10_READY NANO328P` |
| `arduino:avr:mega:cpu=atmega2560` | `2e1fb1941804aabd411d91164f4449bbb85e3b5b996c9b811fd496708d849fc1` | `A10_READY MEGA2560` |

- AVR8js 0.21.1 chạy hai HEX ở 16 MHz với USART0 danh định 9600 8N1. Cả hai bỏ qua xung nhấn 20 ms và cho sáu cạnh đúng thứ tự qua ba chu kỳ, sau khoảng 41,001–42,001 ms mô phỏng.
- Với nút nhả, đầu vào đo 5,0000 V và dòng LED xấp xỉ 0 mA. Với nút giữ, đầu vào đo 0,00049995 V, anode 2,084550 V và dòng LED 2,915450 mA ở cả hai mạch. Sai số KVL dưới 1 mV.
- ngspice 45.2 giải điểm làm việc DC với mức GPIO quan sát được. Đầu ra là nguồn lý tưởng 0/5 V, điện trở kéo lên 10 kΩ, điện trở nối tiếp 1 kΩ và diode của mạch mẫu ở 27 °C. Phép thử bao gồm GPIO số, thời gian firmware và dữ liệu USART0. ADC A8–A15 của Mega hiện chỉ có dữ liệu tra cứu và GPIO số trong runner AVR. Kiểm chứng vật lý thuộc một lượt riêng.

## Kiểm thử trên bản local

- Node A10 đạt 6/6. Các phép kiểm đối chiếu hình chiếu với model, neo dây vào pad, kiểm topology, chạy HEX của từng MCU, đo hai điểm DC và kiểm cơ chế chỉ cấp manifest/HEX từ localhost. Biên dịch mã chuẩn bị cho Nano bằng FQBN Mega bị chặn bởi điều kiện target trong mã nguồn.
- Chrome A10 đạt 6/6 trên bản sau review. Hai board đều qua thao tác chọn pad ở mặt 2D và nhấp trực tiếp vào PCB 3D ở desktop và khổ 375 px. Kiểm nhấn bằng bàn phím, dừng rồi chạy lại, lỗi HEX hoặc manifest, thu hồi worker khi rời trang, khôi phục bản nháp và xóa kết quả cũ khi mạch đổi. Ca nhập boot ROM Pico B2 và khởi động MicroPython trong browser cũng đạt.
- Hồi quy A1–A9 đạt đủ 77 ca Node qua các lượt chạy và 74/74 ca Chrome. Ca NUCLEO-L476RG chạm giới hạn thời lượng phiên Renode trong một lượt, sau đó đạt khi chạy riêng. Nhóm runner AVR và thư viện board đạt thêm 25/25 ca Node.
- `npm.cmd run typecheck`, `npm.cmd run build:local` và `npm.cmd run check:public-release` đều đạt. Hai HEX và manifest A10 chỉ ở kho local `.tmp`, ngoài đầu ra build tĩnh.
