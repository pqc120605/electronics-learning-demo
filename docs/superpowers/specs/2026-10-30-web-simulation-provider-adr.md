# ADR: Cách đưa mô phỏng MCU lên web Mạch Mở

**Ngày:** 30/10/2026  
**Trạng thái:** Chấp nhận theo phạm vi founder đã yêu cầu triển khai  
**Quyết định:** Mô hình lai: simulator logic học tập nội bộ cho toàn bộ board tham chiếu; provider firmware bên ngoài là tích hợp tùy chọn sau khi giải quyết license, privacy và triển khai.

## Bối cảnh

Founder muốn người học thử nhiều MCU phổ biến trực tiếp trên web. Bản hiện tại không có một CPU simulator chung; engine nội bộ thực thi một tập lệnh nhỏ. Cần phân biệt:

- **Mô phỏng hành vi học tập:** một interpreter xác định mô phỏng các lệnh và phần tử được hỗ trợ, nhưng không chạy mã máy/firmware MCU.
- **Giả lập firmware:** biên dịch hoặc nhận binary rồi mô phỏng CPU/peripheral; phụ thuộc chính xác board, firmware format và mức hỗ trợ của từng provider.
- **Mô phỏng điện:** tính điện áp/dòng và trạng thái mạch; cần solver/netlist/linh kiện model, không suy ra từ mô phỏng GPIO.

## Phương án đã đánh giá

| Phương án | Phạm vi board | Chạy trực tiếp trong browser? | Giới hạn/chi phí tích hợp |
|---|---|---|---|
| Simulator logic nội bộ | Có thể bao phủ nhiều board nếu khai báo mapping theo board/revision | Có | Không phải firmware; hành vi phải gắn rõ với từng profile và operation hỗ trợ. |
| Wokwi | Tài liệu chính thức nêu Arduino, ESP32, STM32, Pico và thêm nhiều board/linh kiện; nhận firmware từ nhiều toolchain | Dịch vụ Wokwi riêng; có thể mở project bằng link | Tài liệu đã kiểm tra chưa mô tả API/iframe nhúng thương mại cho app này. Điều khoản có free use giới hạn và commercial license/subscription; cần hỏi/duyệt điều khoản trước khi embed hoặc chuyển code người học. |
| Espressif QEMU fork | ESP32 target cụ thể, CPU/memory và một số peripheral | Không phải runtime browser được tài liệu hướng dẫn | Cần backend/worker riêng, quản lý firmware build, tài nguyên và kiểm soát binary. Không bao phủ Arduino/STM32. |
| Renode | Nhiều SoC và board nhúng; tài liệu liệt kê STM32 Nucleo-64, Blue Pill cùng nhiều platform khác | Không phải simulator browser turnkey | Backend/container hoặc build/runtime WebAssembly riêng; độ fidelity phụ thuộc model peripheral. Nguồn chính thức có thể yêu cầu dịch vụ thương mại để bổ sung platform mới. |
| QEMU AVR | AVR family và một số machine như Mega2560 | Không turnkey browser | Tài liệu mô tả peripheral hỗ trợ còn hạn chế; muốn dùng cần xây backend/runtime và UI phần cứng. Không thay thế Wokwi cho IoT. |
| Tự biên dịch firmware bằng Arduino CLI | Các board core/package mà CLI hỗ trợ | Không giả lập board | Chỉ compile/upload; cần ghép emulator/provider khác để chạy firmware. |
| KiCad CAD → GLB | Model PCB và package STEP/VRML đã gắn với footprint | Có, sau khi export GLB | Chỉ tạo hình học 3D; không phải simulator MCU hay netlist solver. Model nguồn/revision/license phải xác thực. |

## Quyết định

Mở rộng engine hiện hữu thành **21 board profile cho bài GPIO/LED logic chung**, mỗi profile khai báo board ID, MCU/architecture, logic level, pin alias của bài học và link tài liệu board. Hệ thống tiếp tục từ chối cú pháp không hỗ trợ và code có pin alias không khớp board.

Giữ riêng provider interface để sau này có thể nối Wokwi/Renode/QEMU mà không thay đổi scene PCB hay component catalogue. Chưa gửi code hoặc project người học ra dịch vụ ngoài, chưa nhúng iframe thương mại, chưa gọi logic profile là firmware simulation.

## Điều kiện để mở rộng firmware simulation

1. Chọn provider/target cụ thể và xác nhận board/peripheral fidelity cần thiết.
2. Xác minh quyền dùng cho sản phẩm web thương mại, embed/API, redistribution và lưu trữ diagram/project.
3. Quyết định code người học có được chuyển sang service ngoài không; nếu có, xin consent, nêu nơi xử lý và thời gian lưu.
4. Thiết kế backend/job sandbox cho compiler/emulator nếu provider không chạy browser-side; giới hạn CPU, memory, thời gian và mạng.
5. Tạo compatibility manifest theo chính xác MCU, board revision, peripheral và part model đã kiểm tra.

## Nguồn kỹ thuật chính thức đã tra cứu

- [Wokwi docs — mô phỏng Arduino, ESP32, STM32 và các board khác](https://docs.wokwi.com/)
- [Wokwi VS Code project configuration — firmware formats theo họ board, diagram và toolchains](https://docs.wokwi.com/vscode/project-config)
- [Wokwi Terms of Service — free limitations và commercial license](https://wokwi.com/legal/terms)
- [Espressif ESP-IDF — QEMU emulator](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/qemu.html)
- [Renode — supported boards](https://renode.readthedocs.io/en/latest/introduction/supported-boards.html)
- [QEMU — AVR system emulator và các machine được hỗ trợ](https://www.qemu.org/docs/master/system/target-avr.html)
- [Arduino CLI — compile, board manager và tích hợp](https://docs.arduino.cc/arduino-cli/)
- [KiCad — PCB 3D model export và các định dạng GLB/STEP](https://docs.kicad.org/master/en/pcbnew/pcbnew.html)
