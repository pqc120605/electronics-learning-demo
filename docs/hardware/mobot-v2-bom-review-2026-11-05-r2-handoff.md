# MoBot V2 · Hồ sơ gửi kỹ thuật r2

05/11/2026 · `MOBOT-V2-BOM-REVIEW-r2` · Đề xuất cấu hình để review trước schematic. Áp dụng cho một robot và một tay cầm. Bản Excel giữ cột `Note` do kỹ thuật gửi và thêm cột phản hồi bên phải. [Bản r1](mobot-v2-bom-review-2026-11-05-r1.md) lưu giả định ban đầu.

## Các mục đã điền lại

| Dòng | Lựa chọn r2 | Giá niêm yết và điểm cần đối chiếu |
|---|---|---|
| B01 | **HH004223**, ESP32 DevKit V1, ESP-WROOM-32, CP2102, 30 chân, **USB-C**. Một cho robot, một cho tay cầm | **140.000đ/bo**, 280.000đ/cặp. Đây là SKU nhà bán. Cần ảnh hoặc bản vẽ đúng revision, khoảng cách hai hàng chân và đường cấp 5 V/USB trước footprint. [Linh Kiện Việt Nam](https://linhkienvietnam.vn/module-node-mcu-32s-esp32-devkitc-dung-module-esp-wroom-32) |
| B09 | **Soldered 333100**, OLED SSD1306 I²C 0,96 inch, đơn sắc xanh | Chọn SKU có tài liệu phần cứng để đối chiếu. Cần báo giá nội địa, kiểm kích thước, hướng đầu nối và pull-up. Màu xanh là màu hiển thị đơn sắc. [Sản phẩm](https://soldered.com/products/display-oled-i2c-white-0-96-ssd1306) · [Hồ sơ hãng](https://docs.soldered.com/ssd1306/hardware/) |
| B11 | **G10 / 8R1W**, loa 28 mm, 8 Ω, 1 W | SKU tham chiếu. Xác minh bề dày, gá loa và giới hạn công suất từ B10. [Nguồn hàng](https://laptrinhnhunga-z.com/san-pham/lap-trinh-nhung-a-zg10-loa-8-ohm-1w-duong-kinh-28mm-8r1w/) |
| B12 | **HC-SR04** theo mã hàng TME, 1 chiếc | **25.000đ** theo bảng giá công khai. Cần xác minh điện áp và chuyển mức Echo cho ESP32. [TME](https://www.tme.vn/Product.aspx?id=1583) |
| B13 | Module dò line đơn **TCRT5000 dạng ngang** theo listing Đức Huy, 2 chiếc | Cần báo giá theo biến thể này, kiểm mức OUT và gá. [Đức Huy](https://dientuduchuy.com/products/cam-bien-do-line-don-5v-tcrt5000-ngang) |

B01 dành cho nạp chương trình qua USB-C. B20 là cổng USB-C riêng để sạc pin. Kỹ sư cần kiểm cấp ngược giữa hai đường nguồn và điều kiện cắm đồng thời. B12/B13 vẫn nằm trong dự toán. Chưa có quyết định đưa cảm biến ra khỏi bộ.

## Tài liệu hãng cho các mục kỹ thuật yêu cầu

| Dòng | Sơ đồ tham chiếu và BOM của hãng | Đầu ra cần có trong sơ đồ MoBot sau khi duyệt cấu hình |
|---|---|---|
| B05 — BQ25886RGET | [TI SLUUC11, §4.2 Fig. 9 và §4.3 BOM](https://www.ti.com/lit/ug/sluuc11/sluuc11.pdf) · [Datasheet](https://www.ti.com/lit/ds/symlink/bq25886.pdf) | Sạc pack 2S 8,4 V từ 5 V. Kiểm mục tiêu 0,5 A, dòng đầu vào, cảm biến nhiệt pack, ngắt tải khi sạc và LED báo trạng thái. |
| B06 — TUSB320LAIRWBR | [TI TUSB320EVM](https://www.ti.com/tool/TUSB320EVM) · [Datasheet TUSB320LAI](https://www.ti.com/product/TUSB320LAI) | Xác nhận nhận diện C–C/A–C, giới hạn dòng và hành vi khi pin cạn. EVM tham chiếu họ TUSB320, cần đối chiếu đúng biến thể LAI trước khi dùng. |
| B07 — TPS63070RNMR | [TI TPS63070EVM-693, schematic/BOM](https://www.ti.com/lit/ug/slvuao5a/slvuao5a.pdf) | EVM tham chiếu 3,3/5 V. MoBot cần đánh giá nhánh motor mục tiêu 6 V với hai N20 khởi động cùng lúc, dòng kẹt, nhiệt và năng lượng trả về. |
| B08 — TPS54302DDCR | [TI TPS54302EVM-716](https://www.ti.com/tool/TPS54302EVM-716) · [Datasheet](https://www.ti.com/product/TPS54302) | Kiểm tải nhánh 5 V logic/âm thanh ở điện áp pin thấp và khi motor đóng cắt. |
| B10/B11 — MAX98357A + loa | [ADI MAX98357 TQFN evaluation system, Fig. 3 và danh sách linh kiện](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357DEVTQFN-MAX98357EVSYSTQFN.pdf) | Chốt gain, giới hạn công suất cho loa 8 Ω/1 W, đầu nối và giảm nhiễu. |
| B14 — MCP23017-E/SO | [Microchip DS20001952](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf) | Giữ số lượng lắp bằng 0. Chỉ xét lắp khi kiểm ngân sách GPIO; xác minh đúng revision và các chân giới hạn chức năng. |
| B16 — MCP73833-FCI/UN | [Microchip DS20002005C, Typical Application và bảng mã đặt hàng](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf) | Xác minh suffix 4,2 V, giới hạn dòng sạc 1S, NTC và trạng thái tải khi sạc. |
| B17 — TPS61023DRLR | [TI TPS61023EVM-052, §3 schematic/BOM](https://www.ti.com/lit/ug/slvubp5/slvubp5.pdf) | Kiểm nguồn 5 V khi Wi-Fi phát, pin thấp, nhiệt và ngắt áp thấp. |

Các tài liệu liên kết là thiết kế tham chiếu của hãng. Sơ đồ MoBot và BOM theo refdes sẽ được lập sau khi giải quyết thông số còn thiếu và người dùng duyệt đúng phiên bản cấu hình theo [quy trình dự án](../mission-control/parallel-build-policy.md). B24–B26 liệt kê bảo vệ, linh kiện thụ động và đầu nối cần tách theo mã, giá trị, định mức và số lượng ở bước đó. Cả ba dòng B11/B16/B17 giữ nguyên ghi chú kỹ thuật dù ô được đánh dấu Accepted.

## Ngân sách và đầu vào chặn thiết kế

- Giá VND có nguồn cho hai DevKit, hai N20, hai pack và HC-SR04 cộng **589.128đ**. Giá này chưa phải báo giá giao tới tay và chưa gồm các linh kiện còn lại.
- Giữ các khoảng ước tính r1 theo nhóm, thay giá cặp DevKit từ 296.000đ thành 280.000đ, cho tổng **1.194.128–1.714.128đ**. HC-SR04 25.000đ nằm trong khoản cảm biến 40.000–65.000đ, chỉ tính một lần. Chi phí SKU OLED và loa cần báo lại. Kịch bản thấp vẫn vượt trần 194.128đ.
- Chốt exact revision B01 và xác minh nguồn USB của mẫu. Cần thông số dòng khởi động/kẹt và mô-men của đúng B02 để kiểm B03/B04/B07. Lấy báo giá trọn bộ, gồm lắp PCB, nguồn, pin, đầu nối, cơ khí PETG và tay cầm. Sau đó mới cập nhật cấu hình xin duyệt.
