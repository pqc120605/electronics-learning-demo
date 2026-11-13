# MoBot V2 · Đề xuất tay cầm kiểu PS3 dùng pin AA

Yêu cầu người dùng: cầm kiểu gamepad PS3, chơi không dây, thay pin AA từ khoang sau. Tham khảo thao tác thay hai viên AA của [Bigben BB4300](https://www.fcc.report/FCC-ID/AVJ-4300T/1660653.pdf). Số viên của mẫu tham khảo không xác lập khả năng cấp tải cho MoBot.

## Hướng thiết kế đề xuất

- Hai tay nắm, hai cần analog đối xứng, cụm nút dưới ngón cái và khoang pin có nắp ở mặt lưng. Hai cần là đề xuất bố trí. Chức năng nút và ngân sách I/O cần chốt lại vì hồ sơ điện trước dùng một joystick.
- So khay 3 AA và 4 AA trong cùng dáng vỏ. Ưu tiên bố trí 3 AA để giữ vỏ gọn. Giữ 4 AA làm phương án nếu tải hoặc thời lượng không đạt với 3 AA. Đánh giá 2 AA như kích thước tham chiếu, chưa chọn cho WRL-20168.
- Con Thỏ AA R6P là loại pin dùng một lần cần thử đúng mã. So với LR6 kiềm và NiMH AA sạc ngoài. Chỉ công bố hỗ trợ theo kết quả chạy với pin mới và gần ngưỡng thay, có kiểm xung tải, báo pin yếu và robot dừng an toàn khi mất lệnh.
- Giữ WRL-20168 làm cơ sở đánh giá. Với nhiều hóa học AA, khảo sát buck-boost để cấp 5 V ổn định. USB chỉ dùng khi nạp firmware và phải cách ly nguồn khay. Bỏ mạch sạc onboard khỏi đề xuất AA. Giữ giao thức điều khiển robot hiện hành.

## Đầu ra trước khi duyệt cấu hình

Box 03 trả so sánh bố trí, khoảng hở nắp, cân bằng và khả năng thay pin với hai khay. Box 02 xác định cận tải, tiêu chí thời lượng và reset, dải nguồn cùng cách ngăn cấp ngược. Box 01 hợp nhất số viên, loại pin chuẩn và phạm vi điều khiển. Đây là đề xuất yêu cầu và bố trí, chưa phải cấu hình duyệt để mở KiCad hoặc CAD.
