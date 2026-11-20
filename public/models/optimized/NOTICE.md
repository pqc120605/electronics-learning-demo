# Bản nén dành cho trình xem Mạch Mở

Các GLB trong thư mục này được chuyển từ GLB cùng tên ở thư mục `models/` bằng gltfpack 1.3.0 với `-cc -kn -km -ke -vp 20 -vn 12`. Bản nén giữ tên node, nén và lượng tử hóa dữ liệu đỉnh. Không dùng làm CAD nguồn. Tên, SHA-256, kích thước, số node và sai số tọa độ của cả hai bản được ghi trong `src/data/optimizedBoardModels.json`.

- Arduino Uno R3, Nano classic và Mega 2560 R3 theo CAD thiết kế tham chiếu Arduino và các package KiCad được dẫn trong `docs/reviews/2026-11-19-full-web-audit/lk-board-data.md`.
- ESP32-S3-DevKitC-1 v1.1, Pico 2 H, XIAO ESP32-C3, Blue Pill và Nucleo có hồ sơ nguồn và giấy phép ở các tệp `.NOTICE.txt` cùng tên trong thư mục `models/`.
- Raspberry Pi Pico 2 bản không header dùng `public/cad/raspberry-pi-pico-2.step`; xem điều khoản gốc tại `public/cad/raspberry-pi-model-license.txt`.
- Giải nén dùng meshoptimizer 1.3.0 theo giấy phép MIT. [Giấy phép meshoptimizer](meshoptimizer-LICENSE.md)
