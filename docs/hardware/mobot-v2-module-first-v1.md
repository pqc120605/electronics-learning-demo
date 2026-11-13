# MoBot V2 · Ưu tiên module tháo lắp

Yêu cầu người dùng: dùng module ở các khối phù hợp để dễ chế tạo và thay. Đề xuất ở cấp kiến trúc, ưu tiên robot và giữ hướng tay cầm AA. Thay module nguồn hoặc driver là thay đổi cấu hình cần review lại các đường bảo vệ và duyệt trước triển khai.

| Khối | Lựa chọn |
|---|---|
| MCU tay cầm | Giữ SparkFun WRL-20168 dạng bo tháo rời theo hồ sơ AA. Chốt đầu ghép và gá trong cấu hình triển khai. |
| OLED và cảm biến robot | Ưu tiên bo module có đúng revision, đầu cắm có khóa hoặc phân cực. BOM hiện có Soldered 333100, HC-SR04 và TCRT5000 làm ứng viên. Giữ kiểm mức logic, đặc biệt Echo, và gá đầu nối. |
| Driver robot | Ưu tiên đánh giá Pololu #2130 DRV8833. Có nSLEEP và chân sense. Module mặc định kéo nSLEEP lên và nối sense xuống GND. Muốn giữ R1 phải sửa jumper và lắp điện trở sense, rồi kiểm lại fail-off, dòng trip, đường năng lượng hồi và topology VM/GND đúng schematic module. Nếu không đạt, giữ driver trên một bo con chuyên dụng tháo được. [Pololu #2130](https://www.pololu.com/product/2130/) |
| Nguồn motor | Ứng viên Pololu #4981 S13V25F6, buck-boost 6 V có EN, dùng để so với TPS63070 trên carrier. Kiểm EN lúc mất điều khiển, tải xung và giới hạn VOUT bị đẩy áp. Bảo vệ đảo cực đầu vào không đóng được đường dòng hồi từ motor. [Pololu #4981](https://www.pololu.com/product/4981) |
| Khóa nguồn, chặn ngược và shunt VM | Giữ gần driver và tụ VM theo yêu cầu xung hồi. Ưu tiên trên carrier hoặc cùng bo con driver nếu chứng minh được cận vòng dòng, đầu nối và hành vi thiếu module. Không chọn module phổ thông không có cận và sơ đồ. |
| Sạc robot và điều kiện pin | Chỉ thay bằng module có hồ sơ phù hợp pack 2S, nhận diện USB-C, NTC và veto tải. Giữ đánh giá tích hợp hiện tại nếu chưa tìm được module đáp ứng. |

Đầu nối phải có hướng cắm rõ, chịu dòng và giữ chắc. Tháo lắp khi tắt nguồn. Thiếu hoặc lắp lỗi module phải giữ motor tắt. T8 định mức shunt và tụ trên đúng topology đã chọn. Chưa thay BOM, chưa mua các module ứng viên, chưa mở KiCad.
