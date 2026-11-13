# Thiết kế: board viewer chính xác hơn, hover linh kiện và danh mục ESP/STM

**Trạng thái:** Phạm vi được founder duyệt trong hội thoại ngày 29/10/2026.

## Mục tiêu

Sửa lỗi thể hiện linh kiện Arduino theo CAD nguồn, cho người học rê chuột lên đúng linh kiện để đọc chức năng và lý do bố trí, đồng thời mở rộng danh mục board phổ biến ESP32 và STM32 với nguồn và revision được ghi nhận.

## Quyết định sản phẩm

- Board là một revision cụ thể, không gom các board clone có layout khác nhau dưới một mô hình duy nhất.
- Vị trí và package lấy từ thiết kế CAD/BOM nguồn; không gắn model dựa trên tên gọi gần đúng.
- Khi nguồn chưa đủ để dựng board đáng tin cậy, board được ghi là preview/tham khảo thay vì tạo model giả rồi gọi là CAD chính xác.
- Hover đổi highlight và nội dung inspector; click/tap/keyboard tiếp tục chọn được từ danh sách linh kiện.
- Inspector giải thích tên linh kiện, chức năng, kết nối trong mạch và lý do vị trí (ví dụ đường USB ngắn tới USB-UART, tụ lọc đặt sát rail/IC, header đặt dọc mép để dễ cắm).
- Nhãn “vì sao đặt ở đây” chỉ xuất hiện khi có căn cứ layout/schematic; nếu không, nêu rõ đây là giải thích nguyên tắc bố trí, không phải ý đồ đã xác nhận của nhà thiết kế.
- Không tuyên bố mô phỏng điện hay xác nhận tương thích mọi biến thể board.

## Nguyên nhân và cách xử lý

Script Arduino hiện chèn model 3D với offset zero cho tất cả footprint. Header through-hole có pad 1 lệch so với gốc footprint, nên hình header có thể không trùng hàng lỗ. Sửa generator bằng transform riêng theo footprint: lấy origin của model KiCad cùng quy ước pad/rotation của footprint, rồi xuất lại GLB và so khớp tâm chân/model với CAD. Schematic Nano classic ghi IC3 là ATmega328P-32MUR; đây là package QFN/VQFN nên giữ model QFN và ghi rõ mã part để phân biệt với biến thể Nano dùng TQFP.

Viewer hiện chọn node bằng bounding sphere gần đúng, nhóm nhiều node vào một feature và chỉ pick lúc click. Thêm thao tác hover và highlight node/component riêng, giữ fallback danh sách DOM để dùng được bằng touch/keyboard.

## Danh mục đề xuất

- Giữ ESP32 DevKit V1 30-pin hiện tại như một thiết kế clone tham chiếu cụ thể.
- Thêm ESP32-C3 DevKitM-1 và ESP32-S3 DevKitC-1 theo revision có tài liệu nguồn.
- Thêm STM32 NUCLEO-F401RE theo board design package chính thức của ST.
- Thêm STM32F103C8T6 Blue Pill như board clone tham chiếu, ghi rõ các nhà sản xuất có thể khác nhau.
- Chỉ gắn GLB/CAD hoàn chỉnh cho board khi có nguồn hình học, BOM/part mapping và quyền sử dụng rõ ràng; các board còn thiếu được hiện ở trạng thái preview.

## Nghiệm thu

1. Header Arduino thẳng hàng với pad thực tế; body MCU và connector khớp package/revision nguồn.
2. Hover từng node linh kiện trên Uno/Nano/Mega làm nổi đúng node và cập nhật inspector; click/tap và danh sách vẫn hoạt động.
3. Inspector có giải thích “Vì sao đặt ở đây” có căn cứ hoặc ghi rõ suy luận nguyên tắc.
4. Danh mục ESP/STM có tên board, MCU, độ chính xác/revision và trạng thái nguồn CAD; không phát sinh GLB giả cho mục preview.
5. Build production thành công; ghi rõ các board chưa có model chính xác nếu nguồn CAD chưa thể đóng gói trong lượt này.
