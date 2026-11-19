# Bản local sau phản ánh tester — 18/11/2026

## Bàn lắp mạch

- Cuộn lên hoặc xuống trên khung mạch 2D để zoom tại con trỏ. Nút −/+, thanh cuộn và “Vừa khung 2D” vẫn dùng được. Rê chuột hoặc Tab vào dấu chân board để hiện nhãn GPIO. Điểm nối dùng con trỏ bàn tay.
- Chọn thân linh kiện để xem thông tin ngay cạnh mạch. Chọn thân board để xem danh sách chân và các linh kiện/cổng đã có trong hồ sơ model. Điện trở và tụ điện nhận trị số dương và đơn vị, dùng lại cơ chế kiểm tra và lưu bản nháp hiện hành. Trị số xuất hiện ở hình lắp và sơ đồ. Đọc tín hiệu analog trong SPICE với mạch và model phù hợp.
- Nối bằng hai lần chọn hoặc kéo từ một đầu đến đầu kia. Khi chọn dây, có thể đổi từng đầu dây hoặc kéo chốt đường đi. Đổi đầu dây cập nhật kết nối sau khi dữ liệu hợp lệ. Đổi đường hiển thị giữ nguyên hai đầu và chỉ tồn tại trong khung 2D hiện tại.
- Khi bàn tự do nhận dữ liệu runtime, cửa sổ dạng sóng mở cạnh mạch với đồ thị ở đầu. Đóng được trong lúc chạy và vẫn có thể xem trace trong tab Dạng sóng. A/B hiện thời gian tới 0,001 ms, giữ timestamp gốc, và xóa số đo cũ khi đổi code, board hoặc kết nối.

Ảnh Chromium [375 px](../../agents/runs/MM-SW-TESTER-CIRCUIT-001/bench-wave-375.png) và [1440 px](../../agents/runs/MM-SW-TESTER-CIRCUIT-001/bench-wave-1440.png).

## Học và chọn board

Đặt bộ chọn bài ở trang chủ đề, màn chọn board và trang bài học. Có thể vào thẳng bất kỳ bài nào. Khi chuyển bài, board đang chọn được mang theo và hệ thống kiểm tra tương thích của bài mới. Link “Chọn lại board” đưa về bước chọn tường minh của đúng bài. Thông tin nguồn và bảng chân chi tiết ở vùng mở rộng để ưu tiên mục tiêu và thao tác bắt đầu.

Gói giáo viên tại cuối trang Nền tảng điện tử gồm 5 hoạt động, 13 trường hợp, phần hướng dẫn, phiếu và đáp án. Chọn board riêng cho gói rồi tải HTML dùng offline. Test tải file và so sánh dữ liệu trên hai route ở 375 và 1440 px, gồm dữ liệu hỏng, phiên bản mới hơn và chế độ trình duyệt chặn lưu. Mẫu in Chromium A4 15 trang, phiếu bắt đầu ở trang 3 và đáp án ở trang 9. [Bản in mẫu Arduino Uno R3](../../agents/runs/MM-SW-BEGINNER-TEACHER-PACK-001/teacher-pack-uno-a4.pdf).

## 3D và độ phủ model

3D giữ lỗ và hướng xoay đã khai báo của LED, dựng dây từ đúng đầu cắm, và ghi nguồn tọa độ theo từng đầu dây. Đã đối chiếu tám board trong bàn tự do. Tọa độ Mega lấy từ manifest CAD Rev3e và model GLB đang hiển thị. Có 70 vị trí tín hiệu D0–D53 và A0–A15, cộng ba vị trí nguồn/GND. Bản tạo lại giữ 16 tọa độ cũ và bổ sung 57. D20/D21 dùng header COMMUNICATION0 để phân biệt với tiếp điểm SDA/SCL trùng net ở JP6.

Hai bản STM32 Blue Pill và Nucleo hiện dùng mô hình dựng lại. Chưa có CAD khớp revision để đặt dây 3D theo chân đã xác minh. Các đầu dây thiếu tọa độ có chẩn đoán trong view 3D. Lưới ray breadboard dựa trên hình học tham chiếu 400 lỗ. Phạm vi kiểm là phần mềm và model có sẵn.

Ảnh Chromium [Uno 3D](../../agents/runs/MM-SW-TESTER-3D-001/uno-blink-3d.png) và [Mega 3D](../../agents/runs/MM-SW-TESTER-3D-001/mega-blink-3d.png).

## Mở Bot

Lớp nhận diện câu hỏi nhận các tình huống như LED không sáng, chỉnh trị số và dây, zoom, mở dạng sóng và giải thích PWM. Trả các bước kiểm tra cụ thể từ kho kiến thức cục bộ, kèm nguồn. Câu hỏi về chân hoặc mã board chưa biết giữ thông báo cần xác minh đúng model. Mở Bot hiện dùng truy xuất nội dung cục bộ.

## Kiểm chứng

| Lượt | Kết quả | Nhật ký |
| --- | --- | --- |
| `npm.cmd test` trước chỉnh bố cục in, nhãn cuối và thêm tọa độ Mega | Exit 0, 762 đạt, 0 lỗi, 0 bỏ qua | `.tmp/agent-checks/feedback-unit-full.log` |
| Unit hồi quy bản cuối, gồm LED 3D, 70 chân Mega, khóa học, đường dây, dạng sóng và Mở Bot | Exit 0, 33 đạt | `.tmp/agent-checks/feedback-unit-retest.log` |
| `npm.cmd run typecheck` bản cuối | Exit 0 | `.tmp/agent-checks/feedback-typecheck-retest.log` |
| `npm.cmd run test:e2e --` với 8 spec liên quan bản cuối | Exit 0, build production local đạt, 62 đạt | `.tmp/agent-checks/feedback-e2e-retest.log` |

Các bộ E2E sớm phát hiện nhãn select gộp và focus trong iframe. Bản cuối đã kiểm lại keyboard, tải file, giữ board, kết nối và chẩn đoán ở hai cỡ màn hình. Review mã và SHA-256 nằm trong thư mục từng task. Bản hiện tại đang chạy local ở cổng 5320.
