# A12 · ESP32-S2-DevKitC-1 và Arduino Nano Every

Kiểm thử local ngày 28/11/2026 trên nhánh `codex/catalog-r1-r5-release`, nền `357e8fc`. [Cấu hình A12 đã duyệt](2026-11-28-s2-nano-every-electrical-firmware-a12-proposal.json) có SHA-256 `F558C56AB135BD4D4AD5912D7AE48C368B588D54A63F41542D567A3EC7674919`. Phạm vi gồm CAT-01–03, FW-04, FW-07–08 và SIM-02–04. Đã xác minh chân 2D/3D, mạch mẫu và phép đo DC. Tiêu chí D3 còn mở cho firmware nối với mạch.

| Board và revision | Nút | LED | Nguồn, GND | UART trên header |
| --- | --- | --- | --- | --- |
| ESP32-S2-DevKitC-1-N8R2 PCB V1.0 · 44 pad | J1.4 · GPIO4 | J1.5 · GPIO5 | J1.1 3V3, J1.22 GND | J3.2 GPIO43 TX, J3.3 GPIO44 RX |
| Arduino Nano Every ABX00028 V4.0 · 30 pad | JP3.5 · D2/PA0 | JP3.11 · D8/PE3 | JP2.12 5V, JP3.4 GND | JP3.1 D1/PC4 TX, JP3.2 D0/PC5 RX |

Chọn chân trên bản vẽ 2D và mô hình 3D dùng cùng khóa pad. Thư viện board phân biệt hai cổng Micro-USB của S2 và đường SWD của SAMD11 trên Nano Every. `Serial` của Nano Every đi qua cầu USB của SAMD11 bằng USART3. Mạch A12 dùng `Serial1` qua USART1 ở D1/D0. Bản nháp cũ được lưu một lần trong `localStorage` theo origin trước khi mở mạch mẫu. Dây nối giữ `partId/pinId`.

## Điểm làm việc DC

ngspice 45.2 tính ở 27 °C với GPIO lý tưởng, đầu vào trở kháng cao, pull-up 10 kΩ, điện trở nối tiếp LED 1 kΩ và điện trở công tắc đóng 1 Ω. Nhả và giữ được chọn trực tiếp ở bảng đo. Khi đổi trạng thái hoặc sửa mạch, bảng xóa số đo cũ.

| Board | Điện áp đầu vào khi nhả | Điện áp đầu vào khi giữ | Anode LED khi giữ | Dòng LED khi giữ |
| --- | ---: | ---: | ---: | ---: |
| ESP32-S2 | 3,3000 V | 0,000330 V | 2,005918 V | 1,294082 mA |
| Nano Every | 5,0000 V | 0,000500 V | 2,084550 V | 2,915450 mA |

Khi nhả, dòng LED xấp xỉ 0 mA trên cả hai board. Sai số KVL dưới 1 mV.

## Firmware đã kiểm đến đâu

- **ESP32-S2.** Biên dịch ELF32 Xtensa với bộ công cụ Espressif đã khóa. ELF 13.356 byte có SHA-256 `F87088AEC949D5C9B835B7981B3DC25110213B85B294852059FB30417CA50748`. Build QEMU 5.2 tại commit `a8c6e6bd8c4dc4f95aee87c30e3b3093512ae7b5` trong Podman 6.1.4 trên WSL2. Generic loader chạy mã từ SRAM tại `0x40024064`. Trace CPU ghi được lệnh tại entry và UART0 phát `A12_READY=esp32s2`. Phép thử dùng vùng ROM giả rỗng để khởi động trực tiếp từ SRAM. Mô hình GPIO ở commit này chỉ phục vụ đọc strapping, trả 0 cho thanh ghi đầu vào và bỏ qua ghi. Marker `A12_LED=1` xuất hiện từ mức LOW mặc định, trước mọi thao tác nhấn. Còn thiếu bằng chứng GPIO4/GPIO5, chống dội, ba chu kỳ và ngspice lấy mức từ firmware. [Mã GPIO QEMU tại commit đã duyệt](https://github.com/Ebiroll/qemu-xtensa-esp32s2/blob/a8c6e6bd8c4dc4f95aee87c30e3b3093512ae7b5/hw/gpio/esp32s2_gpio.c)
- **Nano Every.** Biên dịch target ATmega4809 với Arduino CLI 1.5.1, core `arduino:megaavr` 1.8.8 và `mode=off`. ELF 63.508 byte có SHA-256 `C68120C65D0ECD84D34222E82497D6F8B667E5EC7ACDC279561ADCDBA058205F`. Link Windows chính thức của MPLAB X 6.35 trả HTTP 403 khi thử GET toàn tệp. Kho lưu trữ của hãng liệt kê 6.30 trở xuống. Chưa tải hoặc cài được đúng bộ cài 6.35 và chưa chạy thử MDB, GPIO hay UART của Nano Every. [Trang tải MPLAB X](https://www.microchip.com/en-us/tools-resources/develop/mplab-x-ide) · [Kho lưu trữ Microchip](https://www.microchip.com/en-us/tools-resources/archives/mplab-ecosystem)

## Kiểm thử local

| Lượt kiểm | Kết quả | Log tại `.tmp/a12-vendor/` |
| --- | --- | --- |
| Node A1–A11 và ba ca A12 | 89/89 đạt, 0 bỏ qua | `node-regression.log` |
| Chrome A1–A6, A10–A11 | 66/66 đạt | `chrome-regression-browser.log` |
| Chrome A7–A9 | 20/20 đạt | `chrome-regression-renode.log` |
| Chrome sau chỉnh đầu cắm, giao diện và bản nháp A12 | 20/20 đạt gồm 5 A12 và 15 A2/A11 | `chrome-reviewed.log` |
| Node sau chỉnh, phạm vi chân board và DC | 21/21 đạt, 0 bỏ qua | `node-reviewed.log` |
| Build local sau chỉnh | Đạt, còn cảnh báo `eval` từ `rp2040js` và import của `builderLessons` | `build-reviewed.log` |
| QEMU S2 build, dấu vết CPU và UART | Build đạt, CPU/UART đạt, GPIO còn mở | `qemu-build-v4.log`, `s2-probe-host.log`, `s2-probe-trace.log`, `s2-probe-uart.log` |

`npm.cmd run typecheck`, `npm.cmd run check:public-release` và `git diff --check` đạt. Thư mục build tĩnh đã được kiểm tra khỏi ELF, ROM thử và tệp runner A12. Bản preview local có tại `http://127.0.0.1:5251/boards` trong phiên chạy. Chưa phát hành và chưa kiểm trên board vật lý.
