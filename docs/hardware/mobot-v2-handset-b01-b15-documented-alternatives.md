# MoBot V2 tay cầm · Phương án linh kiện có hồ sơ hãng

MM-HW-MOBOT-IF-001. Đề xuất thay cho hai SKU thiếu dữ liệu trong [bản chốt trước KiCad](mobot-v2-handset-b01-pre-kicad-closeout.md). BOM và cấu hình đã duyệt hiện giữ nguyên.

| Vị trí | Ứng viên ưu tiên | Đã xác minh từ hãng | Việc cần đóng trước khi chốt thay |
|---|---|---|---|
| B01 | SparkFun Thing Plus ESP32 WROOM USB-C, `WRL-20168` | ESP32-WROOM, CH340C, pinout đồ họa, schematic và kích thước bo có trong hồ sơ SparkFun. Bo có thêm charger MCP73831 và cổng pin. Tài liệu mô tả chế độ USB-only. | Cố định đúng revision, đối chiếu CC, chân ADC/I/O, đường USB-only và cận dòng. Để cổng pin onboard trống trong phương án tay cầm, H3 vẫn ở carrier. Cập nhật đầu ghép, gá và vùng anten theo bản vẽ. Kiểm kinh phí so với bo phổ thông. |
| B15 | Jauch `250832`, Rev. 1.2 | 1S1P, 2.600 mAh điển hình, 4,2 V, sạc tối đa 2,5 A, 0–45 °C, PCM, NTC, cầu chì và đầu JST XHP-3. Hồ sơ ghi cell và mã pack. | Giới hạn dòng sạc đủ rộng cho H3 0,40 A, nhưng tài liệu pack chưa xác nhận đầy đủ dòng kết thúc và timer H3. Đối chiếu yêu cầu cell, NTC, profile, tải xung ở pin yếu, cực tính và kích thước gá trước khi duyệt. |

Nguồn hãng: [SparkFun WRL-20168](https://www.sparkfun.com/sparkfun-thing-plus-esp32-wroom-usb-c.html), [sơ đồ và kích thước SparkFun](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/hardware_overview/), [pinout SparkFun](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/board_files/graphical_datasheet.pdf), [Jauch 250832 Rev. 1.2](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf).

Tài liệu hãng thay phần suy đoán pinout, hình học bo, cell và bảo vệ pack. Biên nhả của cụm cáp/gá tùy chỉnh và ngắt I/O vẫn thuộc xác minh kỹ thuật của cụm. Đề xuất này chưa phải cấu hình triển khai hoặc phê duyệt KiCad.
