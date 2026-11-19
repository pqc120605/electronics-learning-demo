# LK · Dữ liệu CAD cho năm board ưu tiên

Mốc 20/11/2026. Phạm vi là dữ liệu tham chiếu trong web, mô-đun thư viện board. [Kiểm kê 28 board](lk-kiem-ke-board.md) ghi trạng thái trước khi sửa.

| Board | Nguồn tọa độ | Footprint CAD | Pad header liên kết với ID hiện có hoặc mới | GLB |
|---|---|---:|---:|---:|
| [Uno R3](https://docs.arduino.cc/hardware/uno-rev3/) | Arduino UNO-TH Rev3e, nhập Eagle vào KiCad, CC BY-SA 4.0 | 120 | 44, gồm 12 pad ICSP | 6,37 MiB |
| [Nano classic](https://docs.arduino.cc/hardware/nano/) | Arduino Nano V3.3, nhập Eagle vào KiCad, CC BY-SA 4.0 | 37 | 36, gồm 6 lỗ ở footprint J4 chưa lắp header | 3,87 MiB |
| [Mega 2560 R3](https://docs.arduino.cc/hardware/mega-2560/) | Arduino MEGA2560 Rev3e, nhập Eagle vào KiCad, CC BY-SA 4.0 | 72 | 98, gồm 12 pad ICSP | 9,81 MiB |
| [ESP32 DevKit V1 clone](https://github.com/BrijModi/ESP32-Dev-Kit-Clone) | PCB KiCad tham chiếu 30 chân của Brij Modi, MIT theo README nguồn | 26 | 30 tại J2/J3 | 1,36 MiB |
| [Raspberry Pi Pico](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html#board-design-files) | RPI-PICO-R3a-PUBLIC.brd, nhập Allegro vào KiCad 10.0.7, giấy phép design file permissive đi cùng nguồn | 51 có Reference | 40 tại J0 | 0,43 MiB |

- Dữ liệu hiển thị ghi revision, đường dẫn và SHA-256 nguồn, giấy phép, Reference, giá trị CAD, pad, vị trí, lớp và net khi nguồn có cung cấp. Loại điện riêng của chân chip chưa được suy ra từ tên net.
- Với Arduino, phép tịnh tiến X/Z từ PCB sang GLB được kiểm trên tâm vùng header chính. Chênh lệch tâm nằm dưới 0,001 mm ở cả ba model. Tâm từng pad dùng tọa độ nguồn PCB. Khoảng chênh tâm header chỉ xác nhận phép căn ở cấp cụm. Ba model đều báo `picking=true` và `pinsOutside=0`.
- Với ESP32 clone và Pico, kiểm trực tiếp X/Z của 30 và 40 pad so với anchor đã công bố. Giữ nguyên revision tham chiếu và các ID chân đã lưu.
- File STEP được ghim đúng kiểu xuống dòng theo digest đã đăng ký. Audit thân board STEP/GLB tăng từ 3/8 lên 8/8 phép so khớp. Cổng vẫn so SHA-256 tuyệt đối.
- KiCad xuất CSV vị trí và IPC-D-356 cho ba Arduino và Pico vào `D:/StartupOS/hardware-sources/exports/`. Các nguồn Arduino đã có trong kho được chép và ghim bằng `SOURCES.json` bên ngoài repo. Bản Allegro Pico đã được nhập lại ở khu vực KiCad riêng. Không cần tạo PCB mới.

Chưa nghiệm thu vật mẫu, DRC viền/chồng pad cho toàn bộ nguồn, ngưỡng dung lượng GLB của L5 hoặc các board sau nhóm ưu tiên. Footprint CAD có thể là pad thử, vị trí DNP hoặc mặt đồng chưa gắn linh kiện. Các hình dáng 3D cũ vẫn dùng đúng điều khoản đi cùng asset gốc.
