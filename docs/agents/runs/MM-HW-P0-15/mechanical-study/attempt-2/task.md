# M5 tiếp tục — cam tham chiếu theo tiếp xúc, không luật identity

Nguồn: Founder yêu cầu “triển khai tiếp cho tôi” sau nghiên cứu M5. Giữ đúng quyền nghiên cứu `MOBOT-AA-M5-CAD-STUDY-r1`, hash `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`; không thay proposal đã duyệt, không áp thiết kế sản phẩm. Các tệp và snapshot study trước giữ nguyên.

Lead là người ghi duy nhất trong `mechanical-study/attempt-2/**`. Box03 đọc và phản biện cơ/solver; Box02 độc lập nghiên cứu bảo vệ nguồn và trả advisory, không sửa file. Không agent con/Claude/FE/schematic/GPIO/PCB/mua/thiết bị/dependency.

## Công việc thực thi

1. Thay luật mở cửa theo identity bằng reference cam/rib cứng + hai carriage một bậc trượt. Tìm miền không va chạm từ tiếp xúc hình học thực của các khối khóa theo tọa độ host; lật180° phải tự đổi cam tác động mà không có mapping theo tên key. Constraint tuyến tính và return-bias là lý tưởng, không khẳng định lực/ma sát hay chốt thực đã đạt.
2. Kiểm đường cắm/rút có lịch sử vị trí, dừng khi frame/cửa hoặc giới hạn stroke chặn. Không coi mọi pose cưỡng bức xuyên vật thể là đường có thể đi tới.
3. Phân loại separated/touching-tolerance/interpenetrating. Kiểm tĩnh bằng kernel trên các ca chọn; không giả proof liên tục từ lưới lấy mẫu.
4. Khảo sát profile collar dài hơn minimum12,5mm đã cho nghiên cứu, đầu dò đặt trong phần collar được kiểm soát thay vì suy vật liệu thật từ outer-box USB. Giữ đối chiếu vị trí1/2mm cũ. Đây là profile nghiên cứu đầu ra, không adopt phụ kiện hoặc thay cấu hình/hardware MP N.
5. Các kích thước profile mới, frame relief và vị trí đầu dò phải ghi thành tham số có provenance; giữ shell/input reference, stroke12mm và key lead2…5mm. Không có thay đổi material/force envelope hoặc layout thật.
6. Giữ tìm lỗi mất collar, một cửa kẹt mở/khóa thiếu và lỗi chung; không lựa assertion để giấu bypass. Sau kết quả, Box08 review đúng snapshot. B1 vẫn chờ thiết kế điện/cơ/fit/BOM và phê duyệt riêng.

Các giới hạn bắt buộc: chưa mô hình manufacturing tolerance, ma sát/lò xo/chốt endpoint, giữ100/200N, connector overlap thật, B01/anten/cassette hoặc toàn bộ kit. Không đổi trạng thái cổng hoặc registry phê duyệt vận hành. Không tạo taskID mới để làm các finding biến mất.
