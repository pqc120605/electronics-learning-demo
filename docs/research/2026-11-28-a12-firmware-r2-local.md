# A12-FW-R2 · Firmware và mạch nút nhấn/LED local

Kiểm thử ngày 28/11/2026. [Cấu hình đã duyệt](2026-11-28-a12-firmware-r2-proposal.json) có SHA-256 `EF88A72E4DBA5015A288D84DDCCF9EDA0B0A84DD05A8AAAC3E77AD663DA15960`. Nghiệm thu D3 trong phạm vi hai mạch mẫu của FW-04, FW-07, FW-08 và SIM-02–04. Dùng lại hai ELF đúng SHA-256 và sơ đồ chân của A12 gốc.

| Board | Runner và tín hiệu đã kiểm | Trễ sáu cạnh sau thay đổi đầu vào | DC khi giữ nút |
| --- | --- | ---: | ---: |
| ESP32-S2-DevKitC-1-N8R2 PCB V1.0 | QEMU 5.2 trong Podman. ELF Xtensa thực thi từ SRAM, GPIO4 vào, GPIO5 ra, byte UART0. | 49,972–49,996 ms | GPIO4 0,000330 V, anode 2,005918 V, dòng LED 1,294082 mA |
| Arduino Nano Every ABX00028 V4.0 | avr-mcsim. Chạy mã máy AVRxt từ vector reset 0x0000, PA0 vào, PE3 ra, byte USART1 ALT1 tại PC4. | 42,122–43,707 ms | PA0 0,000500 V, anode 2,084550 V, dòng LED 2,915450 mA |

Hai mạch nhả nút đo được 3,3000 V và 5,0000 V ở đầu vào, dòng LED xấp xỉ 0 mA. Cả hai bỏ qua xung nhấn 20 ms và thực thi đủ ba chu kỳ nhấn/nhả. Log ghi dấu thời gian từ đồng hồ mô phỏng của đầu vào, cạnh LED và byte UART cuối dòng. Điểm làm việc ngspice 45.2 dùng trạng thái GPIO vừa đo, với sai số tuyệt đối KVL dưới 1 mV.

## Runner

- QEMU giữ commit nền `a8c6e6bd8c4dc4f95aee87c30e3b3093512ae7b5`. Bản vá thực hiện input enable, mux, hướng và latch cho hai chân. Loader SRAM bỏ qua bước ROM đặt clock. Adapter đặt APB Timer Group 0 ở 80 MHz và so sánh tick của Timer 0 với clock QEMU. Byte UART0 được lấy từ đầu ra thiết bị QEMU. [Tài liệu Espressif](https://www.espressif.com/sites/default/files/documentation/esp32-s2_technical_reference_manual_en.pdf)
- avr-mcsim giữ commit nền `79bc71230444385f25c57526e1870494ccab0634`. Flash Intel HEX trích từ ELF đã khóa bằng avr-objcopy. Runner dùng CLK_PER 16 MHz, giữ phần lẻ nanô giây, lấy xung TCB3 từ TCA chia 64 và phát CAPT ở TOP theo CCMPL. TCB3 của ELF này dùng PWM8 với đầu ra PWM tắt. UART ghi nhận TXDATAL từ firmware, DRE và byte hoàn tất ở 9600 8N1. VREF được lưu ở mức thanh ghi khi Arduino core khởi tạo. [Datasheet Microchip](https://ww1.microchip.com/downloads/en/DeviceDoc/ATmega4808-09-DataSheet-DS40002173C.pdf)
- Bàn lắp mở phiên theo tab trên localhost. Mẫu GPIO/UART và kết quả DC bị xóa khi dừng, sửa mạch hoặc phiên hết hạn. Khi runner thiếu hoặc sai mã băm, mạch vẫn có hai trạng thái đo DC đặt bằng tay.
- Phạm vi QEMU là boot SRAM, hai chân GPIO, Timer 0 và byte UART. Phạm vi avr-mcsim là đường tín hiệu của bài mẫu và byte TX. Các asset runner nằm ngoài build tĩnh. Bản này được kiểm local trên laptop.

## Bằng chứng trên laptop

| Lượt kiểm | Kết quả | Log trong `.tmp/a12-fw-r2/` |
| --- | --- | --- |
| Build runner từ bản vá và test A12 đồng hồ, GPIO, UART và DC | 3/3 đạt | `stage-final.log` |
| Chrome A12 | 11/11 đạt. Gồm desktop, 375 px, 2D/3D, mạch mẫu, dừng/chạy lại, hai tab cùng board, khôi phục bản nháp và sai số đo. | `chrome-a12-final.log` |
| Node A1–A11 trên bản sửa cuối | 86/86 đạt, 0 bỏ qua | `regression-a1-a11-node-final.log` |
| Chrome A1–A6, A10–A11 | 66/66 đạt | `chrome-browser.log` |
| Chrome A7–A9 | 18/20 đạt lượt đầu. Hai ca NUCLEO-F401RE hết 20 giây khởi động khi chạy hai nhóm song song. Chạy riêng cả hai đạt. | `chrome-renode.log`, `chrome-f401-retry.log` |
| Chrome A7/A9 trên build cuối | 4/4 đạt. Kiểm lại F401RE ở hai khổ và hai ca dọn phiên khi rời trang. | `chrome-affected-a7-a9.log` |

Typecheck, `check:public-release`, `build:local` và `git diff --check` đạt. Đã kiểm đầu ra tĩnh không chứa ELF, ROM thử hoặc binary runner A12. Cấu hình build và dấu băm binary đã đạt lưu trong `.tmp/a12-fw-r2/runtime/manifest.json`. [Lệnh chuẩn bị lại runner](../../scripts/stage-a12-fw-r2.ps1).
