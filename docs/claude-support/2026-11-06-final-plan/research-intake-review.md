# Lọc kết quả nghiên cứu ngoài (3 báo cáo) · 07/11/2026 · Leader Claude

Đầu vào: `D:\bao_cao_nghi_n_cuu_mach_mo.md` (báo cáo A), `D:\2026-11-07-mach-mo-nguon-va-khoang-trong.md` (B), `D:\tong_hop.md` (C, ghi lưu ở thư mục `.tmp/research-intake/antigravity/`). Tôi không biết A và B do công cụ nào làm; chỉ nêu theo nội dung.

## Kiểm lấy mẫu (tôi tự chạy 07/11/2026)
GitHub license API: `adafruit/Adafruit_CAD_Parts` MIT; `wokwi/wokwi-elements` MIT; `wokwi/avr8js` MIT; `sharpie7/circuitjs1` GPL-2.0; `uPesy/easyeda2kicad.py` AGPL-3.0; `arduino/docs-content` và `raspberrypi/documentation` CC-BY-SA-4.0; `ra3xdh/qucs_s` GPL-2.0. **NOASSERTION** (không có mã SPDX duy nhất): `espressif/kicad-libraries`, `fritzing/fritzing-parts`, `arduino/reference-en`, `ngspice/ngspice`, `renode/renode`. `sparkfun/SparkFun_KiCad_Library`: 404.
HTTP: `developer.digikey.com` 200, `www.digikey.com` 403, `fritzing.org` 403, TI models 404, Octopart 403, `pindexio.com/esp32-c3-devkitm-1/` 200, `snapeda.com` 200, `docs.wokwi.com` 200, KiCad license 200, `kicad-packages3D` 200. Nhiều link bị chặn bot nên 403 không có nghĩa là hỏng.

## Đánh giá từng báo cáo
| Báo cáo | Độ tin | Lý do |
|---|---|---|
| B | **Cao nhất** | ghi HTTP thật kèm phụ lục; ghi `NOASSERTION` đúng chỗ; nêu rõ link không mở được và phần chưa kiểm; license khớp mẫu của tôi. Lỗi: nói `fritzing.org` 200 (tôi đo 403, khác user-agent); 8 nhóm đối thủ chưa kiểm |
| C | Trung bình | ma trận P01–P25 đầy đủ và hữu ích, nhưng license sai hoặc quá chắc: ngspice ghi BSD-3-Clause (repo `NOASSERTION`, B ghi hỗn hợp), Renode MIT và Arduino reference CC-BY-SA-3.0 chưa xác minh; dòng `mo_hinh_3d_board` "ESP32-C3 DevKitM-1" gán cho "ESP32 DevKit 30 chân" là sai board và gán license Apache-2.0 của tài liệu ESP-IDF cho bản vẽ phần cứng; bằng chứng đối thủ P01/P02 lấy từ trang vercel không chính thức; gần như mọi dòng ghi "200 (Cao)" |
| A | **Thấp** | dòng trùng lặp (một nguồn lặp 6 lần), link license thay cho link repo, "EasyEDA Open Component Library" ghi `api` không có cơ sở, bảng khoảng trống nhãn cột sai, tự thừa nhận không tải được 3D micro:bit/HC-SR04. Không dùng |

## Kết luận dùng được
- **Dữ liệu mở có thể dùng (cần giữ ghi công):** KiCad symbols/footprints/packages3D (CC-BY-SA-4.0 kèm exception cho thiết kế dùng thư viện; B nêu, tôi chưa tự đọc trang license), Adafruit CAD Parts (MIT, STEP board/linh kiện Adafruit), tài liệu Arduino docs-content và Raspberry Pi documentation (CC-BY-SA-4.0, nội dung bài học tham khảo). Espressif kicad-libraries cần đọc `LICENSE.md` trước.
- **Mã dùng được:** `wokwi/wokwi-elements` (MIT, hiển thị linh kiện web), `wokwi/avr8js` (MIT, đã dùng). **Tránh nhúng vào bundle:** `circuitjs1` (GPL-2.0), `qucs_s` (GPL-2.0), `easyeda2kicad.py` (AGPL-3.0, chỉ nên chạy cục bộ).
- **Chỉ tham khảo, không đưa dữ liệu vào:** Pindexio (không có license), datasheet Espressif/Raspberry Pi (chỉ đọc), SnapEDA/EasyEDA/LCSC (cần tài khoản hoặc dịch vụ độc quyền), DigiKey/Mouser/Octopart API (cần tài khoản và online, trái local-first nếu bắt buộc; nếu dùng thì tùy chọn).
- **Khoảng trống 3D cấp board:** cả B lẫn C đều không tìm được mô hình board DevKit 30 chân có license rõ. Đây là việc phải tự dựng từ ảnh/số đo (khớp quyết định Q8 là kích thước chỉ ước lượng), không phải do thiếu tìm.

## Khoảng trống tính năng, gộp B + C (loại những mục trái local-first)
| Ưu tiên | Năng lực | Đối thủ tham chiếu | Slice đề xuất | Model |
|---|---|---|---|---|
| Cao | Xuất sơ đồ PNG/SVG/PDF | Scheme-It, CircuitLab | `P1-L07` xuất SVG/PNG từ SchematicView (không dependency) | Luna |
| Cao | Con trỏ đo, phân tích `.ac`/Bode | EveryCircuit, CircuitLab | WA-05 (cursor) rồi mở rộng WA-04 sang `.ac` | Luna |
| Cao | Runtime ESP32 | Wokwi, CRUMB | WA-10 (tài liệu quyết định, chờ D13) | Sol |
| Cao | Web Serial: nạp và monitor | Arduino IDE 2, Cloud Editor | theo D4 (Web Serial để kiểm chứng ở P1); cần thiết kế K-RUN trước | Sol rồi Luna |
| Cao | Bài chấm/rubric, dự đoán-quan sát-giải thích | Learn Arduino, Arduinax | WA-09 (CẦN SOL) | Sol |
| Trung bình | Blocks ↔ C++ | Tinkercad | cần dependency (Blockly); xin duyệt | Luna sau duyệt |
| Trung bình | Hoạt ảnh dòng/áp, thanh trượt R/L/C | Falstad, EveryCircuit | spike sau WA-04/05 | Luna |
| Trung bình | BOM giá/kho offline (CSV nhập tay) | LCSC | mở rộng WA-06; không gọi API trả phí | Luna |
| Thấp / hoãn | Soạn PCB, xem Gerber, QEMU/Renode, chia sẻ cộng đồng | KiCad, Renode, EveryCircuit | ngoài phạm vi Starter; chia sẻ cộng đồng trái local-first | — |

## Quyết định cần founder
1. Chính sách license: chấp nhận CC-BY-SA cho **dữ liệu** (KiCad, tài liệu Arduino/Pi) đóng gói riêng kèm ghi công; chỉ MIT/CC0/Apache cho **mã**; cấm GPL/AGPL trong bundle. Tôi không phải luật sư: cần ý kiến pháp lý trước khi bán sản phẩm.
2. Cho phép thêm dependency từng thư viện (bắt đầu `wokwi-elements` ở mức spike; Blockly) hay giữ nguyên "không dependency".

## Chưa kiểm
Tôi chưa mở trang license của KiCad/Espressif, chưa kiểm 8 nhóm đối thủ B ghi "chưa kiểm" (Proteus, CircuitLab, Scheme-It, OhStem xBot, LEGO SPIKE, QEMU, Cloud Editor, Arduino Education), chưa kiểm kích thước thực của bộ mô hình 3D, chưa xác nhận Adafruit CAD Parts có board nào khớp board dùng trong Mạch Mở.
