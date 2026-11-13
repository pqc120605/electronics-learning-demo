# MoBot V2 · Phương án tay cầm USB có dây v1

Đề xuất chuyển phạm vi tay cầm theo phương án dự phòng Box 01. Box 09 xác nhận hồ sơ công khai Jauch MATD 250832 Rev. 1.2 thiếu giới hạn sạc và sơ đồ dây cần thiết. Box 03 chưa có bằng chứng về cụm RUN đúng cấu hình để đo. Hai đầu vào này chặn cấu hình tay cầm pin hiện tại.

## Phạm vi đề nghị duyệt

- Giữ SparkFun WRL-20168 và gá rời. Một cổng USB-C trên B01 cấp nguồn cho tay cầm trong lúc chơi và dùng nạp firmware khi nối PC. Khi sử dụng, cần dây nối tới nguồn USB. Phương án chưa thay đổi giao thức điều khiển robot.
- Chuyển sang một miền nguồn USB được kiểm chứng. Bỏ pack Jauch, H3, cổng CHARGE, RUN OUT, cơ cấu đổi cáp RUN và hai tiếp điểm nhận dạng khỏi phiên bản có dây. Xác định lại bó dây, ngân sách tải USB và cơ chế đưa robot về trạng thái an toàn nếu rút cáp hoặc mất lệnh.
- Giữ robot ở phạm vi hiện hành. Rà lại dependency tay cầm/robot khi khóa tiêu chí bàn giao. Hướng tay cầm dùng pin được lưu để tiếp tục khi có tài liệu hãng và mẫu.

## Phần cần chốt sau quyết định phạm vi

Box 02 khóa cận USB, rail, ADC và mất nguồn. Box 03 khóa bố trí đầu nối, vùng chừa cáp và cách giữ dây. Box 08 rà hồ sơ hợp nhất. HQ trình hash cấu hình triển khai và chạy preflight trước khi cấp lease KiCad.
