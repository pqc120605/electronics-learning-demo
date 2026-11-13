# P0-15 — tích hợp quyết định triển khai

11/11/2026. Founder yêu cầu “Làm nốt đi”. Tiếp tục cùng P0-15; lead ghi duy nhất trong attempt-4, hai advisor chỉ đọc/trả chat. Không sửa các snapshot cũ hoặc cấu hình/gate/approval.

## Kết quả cần đưa tới

Gộp thiết kế nguồn, toàn bộ conductor và trình tự interlock thành một hồ sơ quyết định cụ thể. Không dừng ở một phép kiểm fixture nữa. Có hai disposition trung thực: proposal đủ căn cứ để xin review/approval cho bước kế tiếp, hoặc packet quyết định bắt buộc còn thiếu có lý do và phương án cụ thể. Chưa được báo B1 ready khi chưa có cấu hình đúng hash được duyệt và preflight áp dụng đạt.

- Box02: chốt proposal nguồn ở cấp chức năng/linh kiện ứng viên, không số chân/schematic; hoặc chứng minh điều kiện MAX/default/nguồn nào cần thay đổi và đưa đúng phương án để Founder quyết. Không lặp mãi những candidate đã no-go.
- Box03: chốt một mating pair có nguồn/cycle/conductor đủ, tích hợp endpoint và trình tự manual trong giới hạn nghiên cứu M5; mọi giá trị overlap thiếu nguồn giữ là biến, nêu điều kiện đủ thay vì lấy lift12mm làm proof.
- Lead: kiểm kê conductor/connector, tích hợp bộ giả định/cận/nguồn và tình huống chuyển tiếp, truy vết yêu cầu sản phẩm so với research, verify claims và bàn giao Box01/08.

Quyền M5 vẫn chỉ reference CAD/profile/collision với proposal hash `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`. Lượt này ưu tiên thiết kế và hồ sơ quyết định; không mở CAD/FE mới ngoài quyền đó. Không GPIO assignment, schematic, KiCad, firmware, vendor, mua hàng, cài dependency hoặc thao tác thiết bị. Không Claude.

Điểm dừng thật: thay fault/product/storage/cable/PROGRAM experience envelope, nới D10, hoặc cần quyền build/bench/phê duyệt cấu hình. Phải có phương án review được trước khi hỏi; dữ liệu thiếu do kỹ sư còn tự tính/đọc được không biến thành câu hỏi Founder.
