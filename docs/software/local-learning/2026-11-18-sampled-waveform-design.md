# Đợt 3a — con trỏ trên mẫu logic và phép đo có giới hạn

Theo roadmap local đã được founder yêu cầu tiếp tục. Khả năng liên quan: OBS-01/OBS-06, M08/M07. Không thêm runtime/solver, dependency, schema hoặc dịch vụ.

## Luồng người dùng

Trong tab Dạng sóng và dock waveform của bàn tự do, chọn kênh đo rồi đặt con trỏ A/B bằng thanh trượt có nhãn, dùng được bằng bàn phím. Hiển thị timestamp mô phỏng tuyệt đối của từng mẫu, mức HIGH/LOW/UNKNOWN, Δt theo ms và cửa sổ dữ liệu đang giữ. Có thể A=B, đảo A/B. Đo không chạy hoặc thay mạch, code, lựa chọn board hay bản nháp.

Dữ liệu freestyle là snapshot lấy mẫu, không phải danh sách cạnh chuyển mức. Không đưa chúng vào bộ ước tính tần số/duty, không tổng hợp xung từ trường PWM, không suy điện áp hoặc thời gian HIGH liên tục qua vùng thiếu dữ liệu. PWM chỉ là metadata runtime được ghi nhãn riêng. Mẫu không có GPIO đang đo hiển thị UNKNOWN; vẫn có thể lấy chênh lệch hai timestamp hợp lệ. Nói rõ giới hạn lấy mẫu và 512 mẫu gần nhất, không bịa số mẫu đã mất.

Cursor giữ identity theo timestamp khi thêm mẫu/rolling window; không để index cũ trỏ nhầm sang mẫu khác. Mẫu bị đẩy khỏi cửa sổ phải xóa/reset lựa chọn với thông báo nhìn thấy. A/B mặc định đầu/cuối cửa sổ nếu chưa đặt cần có semantics rõ. Có nút đặt lại để người học kiểm soát. Trace rỗng, board/code/topology đổi hoặc lần chạy mới không hiện số đo cũ. Tái dùng cơ chế generation và clear trace của Bench; context/capture prop chỉ là metadata phiên trong bộ nhớ, không tạo store mới. Đổi tab hoặc dock có thể reset cursor cục bộ nếu được nêu rõ.

Đường vẽ hiện tại giữ khoảng trống khi thiếu pin; thêm marker không thay dữ liệu hoặc bắc cầu qua chỗ thiếu. Kênh đo độc lập với ưu tiên tám kênh đang vẽ, vẫn phải chọn từ GPIO thực sự có trong mẫu. Không tự map board lạ thành một profile khác để báo mức đo.

## Phép đo trên transition trace hiện có

`measureLogicSignal` chỉ nhận transition events hợp lệ: timestamp hữu hạn, không âm, tăng nghiêm ngặt và level boolean. Đầu vào sai/thiếu chu kỳ trả null, không tạo tần số/duty có vẻ hợp lý. Giữ fixture AVR blink cũ. Mẫu lặp cùng mức ở các thời điểm khác có thể được chấp nhận như plateau; cạnh lên đầu tiên cần có trạng thái trước để xác định. Không dùng giả định period/duty để điền chỗ thiếu.

## Nghiệm thu

- Fixture GPIO13 `(0,LOW),(25,HIGH),(75,LOW)`: A25/B75 là HIGH→LOW, Δt50ms; đảo vẫn50; A=B25 là0.
- Pin thiếu ở A25 cho UNKNOWN→HIGH, Δt50ms; PWM0.5 chỉ metadata50%, không có phép đo duty/tần số mới.
- 600 timestamp 0..599 giữ512 mẫu88..599: cursor100 còn đúng, cursor20 bị vô hiệu/reset được báo; thay mẫu cuối cùng timestamp599 cập nhật đúng level.
- NaN/Infinity/âm/thứ tự đảo/duplicate timestamp không tạo kết quả số giả; input không hợp lệ trả giá trị lỗi thay vì ném.
- Bàn tự do sửa code/board/topology/chạy mới xóa số đo cũ; chọn cursor không ghi storage. Keyboard và bố cục375×812/1440×900 có E2E và ảnh.
- Fixture transition0L/10H/20L/30H cho50Hz/50%, một chu kỳ; invalid không được ước tính. Kiểm unit/SSR, typecheck/build local và các browser suite liên quan sau freeze/review.

Đây là lát cắt con trỏ số, chưa phải oscilloscope, protocol decode, timebase/trigger/VCD đầy đủ hoặc nghiệm thu vật lý. Phần server vẫn để sau.
