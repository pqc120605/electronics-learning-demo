# MoBot V2 r5 · Kiểm tra đầu vào KiCad

05/11/2026. Người dùng duyệt r5 và xác nhận carrier dùng đúng thiết kế BrijModi được hiển thị trên Mạch Mở. [Cấu hình r5](mobot-v2-config-2026-11-05-r5.md), SHA‑256 `491DD8D033038DC695C914B52259E00E8582E5D9AF9B060DAA86249891BB27E2`.

## Đã xác định được

- B01 là thiết kế tham chiếu BrijModi ESP32 DevKit V1 clone Micro‑USB, CP2102, 30 chân. Hai header 1×15 bước 2,54 mm. Trong PCB nguồn, hai gốc header cách nhau 25,5016 mm theo phương ngang hai hàng và lệch dọc hàng 0,1016 mm. Dùng tọa độ đầy đủ khi kiểm footprint. [PCB nguồn](../../assets/boards/esp32-devkit-v1-30pin/upstream/ESP32%20Dev%20Kit.kicad_pcb)
- Schematic tham chiếu đưa USB VBUS qua D1 tới đầu vào AMS1117. Đây là mô tả thiết kế gốc để phân tích nguồn carrier. [Hồ sơ mô hình](../../assets/boards/esp32-devkit-v1-30pin/README.md)
- Bo thương mại cùng tên cần đối chiếu riêng trước khi mua hoặc xác nhận lắp vừa. Không cần chọn một clone khác để định danh bo mục tiêu của prototype.

## Cần đóng trước khi giao thiết kế

1. Ngân sách dòng cho hai Pololu #992 khởi động hoặc kẹt cùng lúc, cộng logic và loa khi pin thấp. Mốc r5 là 0,72 A ngoại suy điển hình trên nhánh motor 6 V. Cần chốt giới hạn dòng thiết kế, điện áp pack tối thiểu dưới tải, giới hạn nhiệt và khả năng của pack/converter/driver. Kiểm thực tế với bộ truyền PETG là bước xác minh mẫu riêng.
2. Chính sách nguồn cho ba tình huống cắm Micro‑USB nạp, cắm USB‑C sạc và cắm cả hai. Yêu cầu giữ motor tắt khi sạc, chặn cấp ngược và xác định nguồn cấp logic ở từng trạng thái.
3. Giá r5 sau khi đổi bo và motor. Dự toán r2 là mốc người dùng đã chấp nhận, còn giá giao tới tay của linh kiện r5 cần cập nhật.
4. Registry tại thời điểm kiểm chỉ có `MOBOT-HWCFG-001` v1 ở trạng thái `proposed`. Lead cần ghi nhận cấu hình và hash được duyệt, xử lý các đầu vào chặn, cấp phạm vi ghi và chạy preflight validator. [Quy trình](../mission-control/parallel-build-policy.md)

Trạng thái: hoàn tất đối chiếu nguồn bo tham chiếu. Schematic và PCB MoBot chờ hoàn tất các điều kiện trên.
