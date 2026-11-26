# Nghiệm thu local R2C · Breadboard Adafruit 239 và 65

Ngày 26/11/2026. Cấu hình [MM-CATALOG-FIDELITY-R2C-1](2026-11-26-catalog-fidelity-r2c-proposal.md) giữ nguyên SHA-256 `51E32E94A43CD50F39C3E7FEE339E54DFCEC42D26D51422E4598A55701F2D6DA`.

## Kết quả theo breadboard

| Mẫu | Hình học và kết nối | Ca mạch local |
| --- | --- | --- |
| Adafruit 239 | 830 lỗ, 63 cột, 130 dải nối. Bốn rail độc lập, mỗi rail có 50 lỗ thông suốt. | HEX Blink chạy trong AVR8js qua cổng SN74HC08 và LED. LED nhấp nháy khi jumper nối hai rail dương và giữ tắt khi bỏ jumper. |
| Adafruit 65 | 170 lỗ, 17 cột, 34 dải nối, không có rail. DIP-8 và DIP-16 khớp các lỗ qua khe e–f ở hướng 0° và 180°. | Mạch 5 V qua điện trở 1 kΩ và diode 1N4148 báo hở khi thiếu jumper. Ngspice đo sụt áp **0,6831068 V** qua diode khi nối đúng ở 25 °C. |

Sơ đồ lỗ, mô hình GLB và footprint được dựng từ cùng một cấu hình. Đối chiếu đủ 1.000 tâm lỗ. Kiểm tra mesh xác nhận bốn góc của từng miệng lỗ vuông nằm tại tọa độ đã khóa. KiCad 10.0.7 đọc được hai footprint với đường bao và dấu lỗ trên Dwgs.User, số pad đồng bằng 0.

## Bản nháp và diễn giải mô phỏng

Hai mẫu giữ ID ở kho và lưu spec riêng trong CircuitDocV2. Dây giữ mã lỗ hoặc `partId/pinId`. Kiểm mở lại sau khi tải trang, xuất và nhập dự án, cùng bản lưu tự động khi đổi bảng đã có dây. Bản nháp vẫn nằm trong trình duyệt. Mẫu 400 điểm giữ hành vi railSplit và ID đã lưu.

Kiểm thông mạch ảo tính từ các dải nối lý tưởng và jumper trong mạch. Công cụ phân biệt thông, hở và mã lỗ nằm ngoài mẫu. Kết quả AVR8js và ngspice là số đo từ mô hình. Kích thước thân tham chiếu lấy theo bản vẽ ZYJ-102 và ZY-170 do Adafruit liên kết. Kích thước tấm đế, ngàm và dung sai của mẫu Premium thật còn cần đo trực tiếp.

## Kiểm thử

- 180 bài Node đạt, gồm 7 bài R2C và hồi quy kho, breadboard 400 điểm, CircuitDocV2, sơ đồ, hình học, lưu nháp và mô phỏng R1/R2A/R2B.
- 6 ca Chrome R2C đạt khi chạy tuần tự. Đã kiểm từng mẫu ở 1440 px và 390 px, đổi cách xem, xoay 3D, chọn cùng lỗ, tải footprint, đo thông mạch, nối hai lỗ, lưu và xuất/nhập dây.
- `npm.cmd run build:public` và `git diff --check` đạt trên bản local.

- 41 ca hồi quy Chrome của R1/R2A/R2B, bàn lắp và kho linh kiện đạt qua hai lượt. 31 ca đạt ở lượt đầu. 10 ca từng chạm thời gian chờ đều đạt khi chạy lại một worker trên build cuối. Tổng cộng 47 ca Chrome khác nhau đã đạt khi tính cả R2C.

## Link dùng thử

- [Adafruit 239 · 830 điểm](http://127.0.0.1:5222/components?component=breadboard-adafruit-239)
- [Adafruit 65 · 170 điểm](http://127.0.0.1:5222/components?component=breadboard-adafruit-65)

Hai đường dẫn, hai GLB và hai footprint đã trả HTTP 200 qua preview local.
