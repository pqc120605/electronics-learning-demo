# P0-15 — containment và chứng cứ chức năng, lượt 3

Founder yêu cầu tiếp tục ngày 11/11/2026. Giữ cùng task P0-15, không đổi cấu hình r12 hoặc cổng. Quyền reference M5 CAD vẫn là proposal `MOBOT-AA-M5-CAD-STUDY-r1`, SHA-256 `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`.

Lead là người ghi duy nhất trong `mechanical-study/attempt-3/**`; các advisor chỉ đọc và trả chat, không gọi thêm agent. Toàn bộ snapshot attempt-2 giữ nguyên.

## Đầu ra có thể kiểm

1. Điện: so sánh hai phần tử ngắt nối tiếp trên từng sense với monitor island thực sự floating. Kiểm mọi supply/return/reference/control/output/clamp, phân loại normal-off, một switch hỏng đóng, mất bias và lỗi điều khiển chung. Tạo mô hình đường dẫn để kiểm giả thuyết cut-set; mô hình lý tưởng không thay leakage/timing/linh kiện thực.
2. Cơ: biến giả thuyết tab/home thành các profile tham chiếu kiểm được; kiểm riêng mất panel còn tab, cửa kẹt, probe kẹt và bare plug. Không coi mất chỉ báo đồng nghĩa nối được nguồn hoặc hai thanh là tự độc lập. Cần phân biệt lỗi chỉ báo, mất một barrier và chuỗi thực sự dẫn đến bypass.
3. Chọn kết luận từ bằng chứng, không tự yêu cầu lại CAD consent hoặc Founder đo mẫu thay cho tính toán còn làm được. Nếu hai phương án đều có phản ví dụ, thay cách tiếp cận và nêu đúng delta còn cần quyết định; không lặp vô hạn.
4. Gói exact-snapshot cho Box08 sau các phép kiểm. Phép đo giữ NOT_RUN, số thiếu giữ TBD, không PASS cổng, duyệt MPN/hash hay mở B1.

Không schematic/GPIO/firmware/FE/material selection/manufacture/vendor/purchase/Claude/install/secrets/sibling app. Các khối kinematic có thể dựng chỉ trong quyền nghiên cứu đã duyệt; không gán proof lực hoặc certification.
