# Danh sách ảnh board và mã module tham chiếu

**Trạng thái:** lựa chọn nội dung đã được chủ dự án chấp thuận ngày 2026-11-02  
**Cập nhật:** 2026-11-02

Tài liệu này tập hợp nguồn ảnh hai mặt, tài liệu board và các mã module cụ thể để đối chiếu mô hình. Chỉ ảnh đã xác nhận quyền tái phân phối mới được lưu trong web; các ảnh khác vẫn là link nghiên cứu. Người duyệt nội dung cuối là chủ dự án.

## Cách đọc mức độ bằng chứng

- **Nguồn hãng / đúng revision:** có thể dùng làm chuẩn pinout, kích thước hoặc thành phần cho đúng sản phẩm/revision ghi trong nguồn.
- **Ảnh cộng đồng / bên thứ ba:** giúp quan sát mặt trước/sau hoặc nhận diện biến thể; không chứng minh board web có cùng layout, BOM hoặc quyền sử dụng lại ảnh.
- **Mã tham chiếu:** là lựa chọn sản phẩm cụ thể để nội dung có điểm tựa. Danh mục hiện vẫn có thể mô phỏng một loại tổng quát; không tự động khẳng định mô phỏng tương đương sản phẩm đó.
- Không nhúng ảnh từ URL bên ngoài trực tiếp vào ứng dụng nếu chưa kiểm tra điều khoản hotlink, giấy phép, ghi công và độ ổn định URL. Ưu tiên CAD/STEP chính hãng có giấy phép rõ ràng cho model 3D.

## Board: tài liệu chuẩn và ảnh hai mặt

| Board trong Mạch Mở | Chuẩn để đối chiếu | Ảnh hai mặt tham khảo | Giới hạn |
| --- | --- | --- | --- |
| Arduino Uno R3 | [Arduino UNO R3: pinout, schematic, CAD](https://docs.arduino.cc/hardware/uno-rev3) | [MikroE: Uno Rev3 front/back](https://embeddedwiki.com/articles/template38-with-gyro-3-click/gyro-3-click-arduino-uno-rev3-necto-atmega328p) | Tài liệu hãng là nguồn chuẩn cho Uno Rev3. Ảnh MikroE là nguồn bên thứ ba, chỉ để đối chiếu hình ảnh; không xác nhận model/clone khác. |
| Arduino Nano classic | [Arduino Nano classic: pinout, schematic, CAD](https://docs.arduino.cc/hardware/nano) | [Nano V3.3 front/back](https://iot-kmutnb.github.io/blogs/arduino/arduino_nano/) | Ảnh blog ghi Nano V3.3, không coi là ảnh chính hãng hay bằng chứng cho mọi Nano clone. |
| Arduino Mega 2560 R3 | [Arduino Mega 2560 Rev3: pinout, schematic, CAD](https://docs.arduino.cc/hardware/mega-2560) | [MikroE: Mega 2560 Rev3 front/back](https://embeddedwiki.com/articles/template39-with-angle-6-click/angle-6-click-arduino-mega-2560-rev3-necto-atmega2560) | Ảnh ngoài hãng chỉ để so sánh; board clone/revision khác phải kiểm tra riêng. |
| ESP32 DevKit V1 (model clone tham chiếu) | [BrijModi ESP32 Dev Kit Clone CAD](https://github.com/BrijModi/ESP32-Dev-Kit-Clone) | [DOIT ESP32 DevKit V1 30P community repository](https://github.com/TronixLab/DOIT_ESP32_DevKit-v1_30P) | Model hiện có theo thiết kế clone của BrijModi; repo DOIT là một board khác, không được dùng để xác nhận hình học, linh kiện hay pinout của model đó. |
| ESP32-DevKitC V4 (board khác, không thay thế hàng trên) | [Espressif ESP32-DevKitC V4 user guide](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html) | Ảnh có callout và sơ đồ thành phần trong hướng dẫn | Sản phẩm chính hãng Espressif; khác clone DevKit V1. Chỉ dùng làm board riêng khi thêm đúng model/revision. |

Tài liệu Arduino chính hãng có ảnh sản phẩm và tệp pinout/CAD; ảnh cộng đồng chỉ dùng để quan sát biến thể cụ thể, không xác nhận board clone khác. Uno/Nano đã có ảnh CC được nhúng với attribution trong thư viện board. Tài liệu Espressif mô tả rõ DevKitC V4 và các phiên bản header, nên không được gộp chung với ESP32 DevKit V1 clone.

## Mã module cụ thể được chọn làm điểm tham chiếu

| Chức năng | Lựa chọn tham chiếu | Nguồn chính | Điều cần giữ rõ trong sản phẩm |
| --- | --- | --- | --- |
| Siêu âm | HC-SR04 phổ thông; tài liệu hướng dẫn Adafruit PID #3942 | [Adafruit: ultrasonic sonar sensors](https://learn.adafruit.com/ultrasonic-sonar-distance-sensors), [bản hướng dẫn/PDF](https://cdn-learn.adafruit.com/downloads/pdf/ultrasonic-sonar-distance-sensors.pdf) | HC-SR04 không có một nhà sản xuất duy nhất. ECHO thường là 5 V; phải chia áp trước GPIO 3.3 V và đối chiếu module đang có. |
| Hồng ngoại phản xạ | Seeed Grove Infrared Reflective Sensor, SKU **101020029**, phiên bản v1.2 | [Trang sản phẩm Seeed](https://www.seeedstudio.com/Grove-Infrared-Reflective-Sensor-p-1230.html), [wiki và tài nguyên Eagle](https://wiki.seeedstudio.com/Grove-Infrared_Reflective_Sensor/) | OUT là LOW khi nhận phản xạ, HIGH khi không nhận; tầm tham khảo 4–15 mm, điện áp 3.3–5 V. Bài học mô phỏng hiện theo polarity của module tham chiếu nhưng không xác minh module người học đang có. Seeed đánh dấu SKU đã ngừng bán; đây là nguồn tham khảo, không phải gợi ý mua hàng hiện hành. |
| OLED | Adafruit monochrome OLED #326, 0.96 inch, 128×64, SSD1306 | [Adafruit guide](https://learn.adafruit.com/monochrome-oled-breakouts), [PDF có ảnh/đấu dây](https://cdn-learn.adafruit.com/downloads/pdf/monochrome-oled-breakouts.pdf) | Bản cụ thể có lựa chọn SPI/I²C qua solder jumper và phần cứng tương thích 3/5 V; các breakout generic có thể khác địa chỉ, pinout, regulator. |
| LCD 16×2 RGB | Seeed Grove LCD RGB Backlight V5 | [Seeed guide và version history](https://wiki.seeedstudio.com/Grove-LCD_RGB_Backlight/) | V5 đổi driver RGB sang SGM31323, địa chỉ RGB sang 0x30 và thêm hỗ trợ 3.3/5 V; wiki còn có thông số V4, nên phải chọn đúng mục phiên bản. Không đồng nhất với LCD 1602 backpack PCF8574 phổ thông. |
| Relay | Seeed Grove Relay, SKU **103020005**, dùng revision V1.2 làm mốc | [Trang sản phẩm](https://www.seeedstudio.com/Grove-Relay.html), [wiki so sánh V1.1/V1.2](https://wiki.seeedstudio.com/Grove-Relay/) | V1.1 dùng 5 V; V1.2 hỗ trợ 3.3–5 V. Dù datasheet có định mức tiếp điểm cao, hướng dẫn Mạch Mở chỉ dùng tải thấp áp, không khuyến khích đấu điện lưới. |
| MOSFET module | Seeed Grove MOSFET, SKU **103020008** | [Trang sản phẩm Seeed](https://jp.seeedstudio.com/Grove-MOSFET.html), [Grove MOSFET wiki](https://wiki.seeedstudio.com/Grove-MOSFET/) | Là module đóng cắt tải, không phải transistor/MOSFET rời; phải xác nhận cực tính, loại tải và giới hạn dòng theo tài liệu cụ thể. Chưa gán thông số điện cho mô hình chung. |
| Driver cầu H | Adafruit TB6612 breakout, PID **#2448** | [Adafruit guide, pinout và tải](https://learn.adafruit.com/adafruit-tb6612-h-bridge-dc-stepper-motor-driver-breakout?view=all), [TB6612FNG datasheet Toshiba](https://toshiba.semicon-storage.com/info/TB6612FNG_datasheet_en_20141001.pdf?did=10660&prodName=TB6612FNG) | Với breakout #2448: VCC logic 2.7–5.5 V; VM 4.5–13.5 V; dòng kênh phụ thuộc nhiệt/tản nhiệt. Không dùng giới hạn breakout để mô tả mọi module TB6612. |
| Hạ áp | Pololu D24V5F5, item **#2843** | [Thông số sản phẩm](https://www.pololu.com/product/2843), [tài nguyên/STEP](https://www.pololu.com/product/2843/resources) | Bộ hạ cố định 5 V, Vin 5.1–36 V, dòng liên tục tối đa điển hình 500 mA nhưng phụ thuộc Vin và nhiệt. Không đồng nhất với module LM2596 chỉnh áp. |
| Tăng áp | Pololu U3V16F5, item **#4941** | [Thông số sản phẩm](https://www.pololu.com/product/4941), [tài nguyên/STEP](https://www.pololu.com/product/4941/resources) | Bộ tăng cố định 5 V; khởi động từ 2.7 V, sau khi chạy có thể làm việc từ 1.3 V. Dòng liên tục phụ thuộc Vin/nhiệt; không đại diện module MT3608 chỉnh áp. |
| Servo | TowerPro SG90 Digital chính hãng | [Trang nhà sản xuất](https://towerpro.com.tw/product/sg90-7/) | Hàng gắn nhãn SG90 có nhiều clone; thông số cơ khí/điện có thể khác. Không cấp servo từ GPIO; chọn nguồn theo servo thật. |

Các lựa chọn trên là mã tham chiếu để biên tập nội dung, không phải yêu cầu người dùng phải mua đúng thương hiệu. Tương thích điện cần được kiểm tra theo board + module + nguồn cụ thể.

## Ảnh và model: quyết định an toàn cho bản hiện tại

1. Chỉ nhúng ảnh có trang nguồn xác nhận license cho phép tái phân phối; ghi tác giả, trang nguồn, license và thay đổi ngay dưới ảnh. Ảnh đã được tải và tối ưu phải tuân thủ cả điều khoản share-alike khi license yêu cầu.
2. Với ảnh hai mặt dùng để xác nhận vị trí linh kiện, cần đúng mã/revision board. Ảnh clone chỉ giúp nhận diện clone đó.
3. Chỉ thêm model 3D tải về khi trang nguồn nêu rõ license cho file hình học, điều kiện ghi công/share-alike và quyền tạo tác phẩm phái sinh. Ghi nguồn, license, hash, revision và mọi chuyển đổi vào manifest/NOTICE.
4. Các model khối dựng tham số hiện có tiếp tục được gắn nhãn minh họa; việc có mã module tham chiếu không biến mesh thành CAD chính xác.
5. Nội dung an toàn về nguồn, relay và tải cảm ứng vẫn cần chủ dự án duyệt trước khi phát hành công khai.

## Quyết định và trạng thái triển khai

- Chủ dự án đã chấp thuận các lựa chọn tham chiếu miễn phí, trừ điều khoản thu phí; người duyệt nội dung cuối là chủ dự án.
- Chủ dự án đã chấp nhận share-alike. Ảnh CC BY-SA được lưu cùng giấy phép, attribution và ghi chú thay đổi trong giao diện; danh mục đầy đủ có tại [reference-image-attribution.md](reference-image-attribution.md).
- Bài IR đã đổi sang mô hình giáo dục active-LOW theo Grove 101020029 và ghi rõ SKU đã ngừng bán, không đại diện module/clone khác.
- Ảnh local hiện có: Arduino Uno R3 (Mr Revolution, CC BY 3.0), Arduino Nano V3 (Nevit Dilmen, CC BY-SA 3.0/GFDL), Arduino Mega 2560 Rev3 (Arduino, CC BY-SA 4.0), Raspberry Pi Pico hai mặt (Michael H./Laserlicht, CC BY-SA 4.0), HC-SR04 tương thích (Suyash Dwivedi, CC BY-SA 4.0), cùng ảnh tham khảo cho điện trở, LED, biến trở, tactile switch, LDR, tụ gốm, tụ điện hóa, breadboard, NTC dạng bead, diode, transistor, servo, motor DC mini, relay module, buzzer 6 V và dây jumper. Mỗi ảnh linh kiện có attribution, license và ghi chú về phạm vi ngay trong thư viện; ảnh chung không xác nhận mã trị số, footprint, pinout hay thông số điện. Chi tiết đầy đủ: [reference-image-attribution.md](reference-image-attribution.md).
- Các ảnh cộng đồng Pico và HC-SR04 giúp nhận diện biến thể, không xác nhận clone/revision khác. Ảnh Mega do Arduino đăng trên Commons, nhưng cũng không thay thế đối chiếu PCB/BOM của model web.
- Nội dung nguồn/relay/driver giới hạn ở tải thấp áp; không hướng dẫn thao tác điện lưới.
- Những board khác hiện vẫn dùng ảnh/link nghiên cứu hoặc sơ đồ; cần xác minh từng ảnh trước khi nhúng. Chưa có ảnh mặt sau cho các board khác ngoài ảnh hai mặt Pico.

