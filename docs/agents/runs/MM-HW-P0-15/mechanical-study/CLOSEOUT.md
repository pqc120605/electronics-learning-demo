# Chốt đợt nghiên cứu M5, giữ P0-15 chưa hoàn tất thiết kế

Box 08 đã trả closure pass cho hai finding P2, tham chiếu `BOX08-STUDY-REVIEW.md`. Đây là nghiệm thu phạm vi nghiên cứu CAD được Founder duyệt đúng hash, không nhận M5 làm cơ cấu sản phẩm. Report hiện tại SHA256 `a67cc0126adab7f87be754ac7b1dd8f8708fad22eff3b7a5631710755aa88fd6`; XBF `fdb71c9938a2c05fe9d99680d2bc2c8d2e8bc594753242809074ceefc9f9fc05`.

Đã có bốn pose CAD tham chiếu, file XBF, ảnh, số liệu quét hữu hạn, đối chiếu kernel và ca phản biện. Kết quả phân biệt đầy đủ va chạm khối bao, presence vật liệu, chuyển động áp đặt, miền lấy mẫu và phần chưa mô hình hóa. Tangency không thống kê riêng được giữ thành deviation công khai. Không cần người dùng duyệt lại quyền CAD đã cấp cho r1.

Các việc thiết kế còn lại trong **cùng P0-15**:

1. Cơ cấu thực truyền vị trí khóa sang cửa/chốt theo tọa độ host, có xử lý lật180° và lệch, không chỉ áp luật scalar trong phần mềm.
2. Profile/clearance khi cắm nghiêng; nguồn và tolerance cho vùng vật liệu/contact thật; endpoint/pawl/độ phủ lỗi chung và cầu hai breakpoint. Chưa có proof lực/độ bền.
3. Bảo vệ pin fail-off, manual latch/reset, reverse từng cell và dòng sau trip; không phục hồi topology Nch/pull-up đã bị loại.
4. Mating pair/gap/cycle, fit toàn bộ và BOM đủ robot+tay cầm+charger/phụ kiện. Không suy từ kích thước cụm tham chiếu hoặc sample không va chạm thành đạt các mục này.

Không tạo task ID mới để làm các finding biến mất, không đánh P0-15 done hoặc B1 ready. Trạng thái queue sau đợt là waiting vì thiếu bằng chứng thiết kế mới; owner là Codex lead và chuyên môn điện/cơ, **không phải đang chờ người dùng duyệt CAD**. Mọi nhánh tư vấn/review đợt này đã trả, không có agent đang chạy ngầm. Quyền nghiên cứu r1 còn giới hạn như biên nhận; thay đổi phạm vi/material/adoption hoặc B1 cần cổng tương ứng, không được tự nâng quyền.

R12 và mọi cổng/approval vận hành giữ nguyên. Không sản xuất, mua, FE, flash, cấp điện hoặc sửa ứng dụng.
