# Đặc tả: Thư viện board và linh kiện điện tử Mạch Mở

**Ngày:** 30/10/2026  
**Trạng thái:** Bản thiết kế chờ founder duyệt  
**Phạm vi:** Danh mục board MCU, module, linh kiện rời và chuẩn tài sản CAD dùng chung cho Mạch Mở.

## 1. Mục tiêu

Biến danh sách board hiện tại thành thư viện điện tử có thể tìm kiếm, so sánh và dùng làm nguyên liệu cho bài học/lắp mạch. Mở rộng số lượng nhưng luôn phân biệt dữ liệu đã kiểm chứng với dữ liệu tham khảo; không dựng hình giả chính xác cho board chưa có nguồn CAD phù hợp.

## 2. Hiện trạng và vấn đề

- Project có danh mục board ở `src/data/boards.ts`, dữ liệu model Arduino ở `src/data/arduinoBoardModels.ts`, dữ liệu board ESP32 ở `src/data/esp32DevkitModel.ts` và các asset CAD/GLB trong `assets/boards/`.
- Có các board ESP32, Arduino, STM32 và Raspberry Pi Pico; nhiều bản đang ở trạng thái preview. Một số model Arduino dùng cách đặt geometry theo CAD nhưng danh sách pin/component chưa đồng nghĩa với mọi linh kiện đều đã được định vị chính xác.
- Bài học có danh sách linh kiện mẫu trong `src/data/lessons.ts`, chưa phải catalogue thành phần dùng lại cho nhiều dự án.
- File STEP/CAD nguồn chưa tự động trở thành scene tương tác. Cần quy trình nhập, gắn metadata và kiểm tra riêng.

## 3. Người dùng và nhu cầu

- Học sinh/người mới muốn tìm linh kiện theo tên hoặc chức năng, hiểu chân, điện áp và cách nối an toàn.
- Giáo viên/mentor muốn chọn board và module tương thích cho bài tập.
- Nhóm sản phẩm muốn nhập thêm model mà không sửa các nhánh điều kiện trong renderer.

## 4. Phương án

1. **Tăng số model bằng geometry tự dựng:** nhanh nhưng không đáng tin về vị trí và revision; loại bỏ cho model board thật.
2. **Chỉ thêm board đã có CAD đầy đủ:** chính xác nhưng danh mục tăng chậm; giữ làm tiêu chuẩn cho nhãn “đã xác minh”.
3. **Khuyến nghị — catalogue nhiều lớp:** có thể thêm metadata cho nhiều board/linh kiện ngay; model được phân trạng thái `verified`, `reference`, `metadata-only` hoặc `unavailable`. Chỉ model đã đối chiếu nguồn mới được gọi là model board thật. Dùng CAD chính hãng/nguồn có quyền rõ ràng cho các board ưu tiên; dùng model package linh kiện theo đúng package khi thích hợp.

## 5. Phạm vi sản phẩm

### 5.1 Họ board MCU cần hỗ trợ trong catalogue

Catalogue thiết kế để mở rộng theo family và revision. Lô dữ liệu đầu tiên ưu tiên:

- **Arduino:** Uno R3, Nano classic, Mega 2560 R3 (đang có); Uno R4 Minima/WiFi, Nano Every, Nano ESP32 (metadata trước, model chỉ khi có nguồn đúng revision).
- **ESP:** ESP32 DevKit V1/DevKitC, ESP32-C3 DevKitM-1, ESP32-S3 DevKitC-1, ESP32-C6 DevKitC-1; có thể thêm ESP32-S2/H2 khi dữ liệu nguồn đủ.
- **STM32:** NUCLEO-F401RE, NUCLEO-F411RE, NUCLEO-L476RG hoặc board Nucleo phổ biến khác; STM32F103C8T6 Blue Pill phải ghi rõ là thiết kế/revision clone cụ thể.
- **Raspberry Pi MCU boards:** Pico, Pico W, Pico 2, Pico 2 W.

Không ép mỗi family phải có tất cả model tương tác ngay. Nguồn kỹ thuật và trạng thái model quyết định nhãn/khả năng mở scene.

### 5.2 Thư viện linh kiện

Nhóm catalogue mở rộng gồm:

- **Thụ động/cơ bản:** điện trở theo giá trị chuẩn, biến trở 10 kΩ, chiết áp/slide potentiometer, tụ gốm/tụ hóa, diode chỉnh lưu/Schottky/LED, transistor NPN/PNP, MOSFET logic-level, nút nhấn, công tắc, buzzer, relay module.
- **Cảm biến:** LDR/photoresistor, NTC, DHT22, DS18B20, HC-SR04, PIR, MPU6050, BMP280/BME280, BH1750, cảm biến độ ẩm đất, MQ-2, RC522.
- **Hiển thị/giao tiếp:** OLED SSD1306, LCD1602 I²C, LED 7 đoạn, ma trận LED, rotary encoder, keypad, HX711/load cell.
- **Chấp hành/nguồn:** servo SG90, DC motor, driver TB6612FNG/DRV8833, stepper 28BYJ-48 + ULN2003, breadboard, dây jumper, module nguồn.

Catalogue có thể tăng hơn danh sách này thông qua schema dữ liệu; mỗi linh kiện mới cần mã/loại rõ, mô tả pin, thông số đã có nguồn và tình trạng model/mô phỏng. Không yêu cầu tạo mesh khác nhau cho từng trị số cùng package nếu thông tin trị số có thể hiển thị độc lập.

### 5.3 Tương tác catalogue

- Tìm theo tên thường gọi, mã linh kiện, họ board, giao thức và nhóm chức năng.
- Lọc theo board family, module, cảm biến, thụ động, hiển thị và chấp hành.
- Trang chi tiết hiển thị chức năng, pinout, điện áp/mức logic, interface, cảnh báo, board/module tương thích, nguồn tài liệu và trạng thái kiểm chứng.
- Không khẳng định tương thích chỉ vì hai module có cùng tên cảm biến; dùng biến thể/mã board cụ thể khi nguồn phân biệt được.

## 6. Dữ liệu và asset manifest

Mỗi bản ghi board cần tối thiểu: ID ổn định, tên/alias, family, MCU, board revision/variant, logic level, giao tiếp, URL nguồn chính hãng, URL bằng chứng, checksum archive nếu có, ghi chú license/attribution, trạng thái CAD/model và ghi chú sai khác clone.

Mỗi linh kiện cần tối thiểu: ID, tên/alias, nhóm, mã manufacturer hoặc module variant (nếu xác định được), chức năng đơn giản, package/footprint, pinout, dải điện áp/dòng nếu có nguồn, giao tiếp, cảnh báo, datasheet/source URL, license/model source, model status, scene node/hotspot mapping nếu đã có 3D.

Các trạng thái chuẩn:

- `verified`: đúng revision/variant, placement và orientation được đối chiếu với nguồn CAD/BOM/placement hoặc dữ liệu nhà sản xuất.
- `reference`: hình học tham khảo, khác biệt/thiếu dữ liệu được công khai.
- `metadata-only`: có tài liệu kỹ thuật nhưng chưa có model 3D thích hợp.
- `unavailable`: chưa đủ nguồn hoặc chưa thể sử dụng asset.

Không dùng suy luận từ vị trí gần nhau để khai báo kết nối điện. Không hiển thị giải thích vị trí như sự thật thiết kế nếu chỉ là suy luận CAD.

## 7. Quy trình nhập model

1. Chọn chính xác board revision/variant hoặc module.
2. Lấy CAD, STEP, BOM, schematic, placement/centroid từ nhà sản xuất hoặc nguồn có điều khoản dùng lại rõ.
3. Lưu nguồn, ngày lấy, checksum, revision và tình trạng quyền sử dụng trong manifest.
4. Chuyển đổi sang định dạng renderer yêu cầu; kiểm tra đơn vị, origin, trục, mặt trên/dưới và orientation.
5. Đối chiếu outline/kích thước, số linh kiện, designator và placement với nguồn.
6. Kiểm tra model bằng viewer; linh kiện thiếu hoặc không chắc được bỏ trống/đánh dấu, không đặt vật thể thay thế tùy ý.
7. Chỉ bật `verified` khi đạt đủ kiểm tra kỹ thuật và quyền phân phối. Nếu quyền chưa rõ, lưu URL nguồn/metadata và để preview.

EasyEDA Pro xuất STEP/OBJ khi linh kiện có model 3D được bind; model thiếu hoặc không đúng vẫn dẫn đến file assembly không đầy đủ. Xem [hướng dẫn xuất 3D](https://prodocs.easyeda.com/en/pcb/export-3d-file/) và [tạo thư viện 3D](https://prodocs.easyeda.com/en/3d-model/file-new-3d-model/).

## 8. Kiến trúc dữ liệu đề xuất

- Tách records board và component khỏi renderer; renderer chỉ nhận manifest đã chuẩn hóa.
- Catalogue component dùng được trong board detail, lesson, assembly builder và tìm kiếm.
- Asset 3D, metadata giáo dục, pin/electrical data và source/license là các trường riêng; trạng thái một trường không được suy ra từ trường khác.
- Chọn board cụ thể trong catalogue phải không làm bài học ESP32 LED tự đổi target code nếu lesson chưa hỗ trợ board đó.

## 9. Ngoài phạm vi

- Bảo đảm mọi model clone ngoài thị trường có cùng layout.
- Tạo model 3D giả để tăng số lượng.
- Chạy SPICE hoặc xác nhận mạch điện đúng chỉ bằng hình học.
- Cho người dùng upload tùy ý CAD trong giai đoạn đầu.
- Chuyển đổi mọi archive CAD tự động không cần kiểm tra.

## 10. Tiêu chí chấp nhận

- Catalogue có thể mở rộng mà không thêm logic riêng cho từng linh kiện vào renderer.
- Có ít nhất các họ MCU đã nêu và nhóm linh kiện cơ bản/cảm biến/chấp hành đã nêu, với trạng thái dữ liệu minh bạch.
- Người dùng tìm/lọc được board và linh kiện theo tên/nhóm.
- Trang chi tiết không bịa điện áp, pinout, package hay kết nối; dữ liệu chưa xác minh được ghi rõ.
- Không dùng model sai revision làm model `verified`.
- Nguồn CAD và tình trạng quyền sử dụng có thể truy ngược từ manifest.

## 11. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Board cùng tên có nhiều clone/revision | Gắn rõ revision/variant và không khái quát model sang clone khác. |
| STEP không có đủ model component | Đối chiếu BOM và export; hiển thị thiếu, không dựng geometry phỏng đoán. |
| License không cho phép phân phối derived GLB | Không đóng gói asset; chỉ giữ metadata và link nguồn đến khi được làm rõ. |
| Thư viện quá rộng làm giảm chất lượng | Ưu tiên linh kiện hay dùng trong bài học, quality/status gate bắt buộc. |
| Học sinh đấu sai điện áp/dòng | Gắn cảnh báo theo board/module cụ thể và nguồn datasheet. |
