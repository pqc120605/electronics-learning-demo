# MoBot V2 r6 · Bàn giao triển khai KiCad

05/11/2026. Người dùng đã trả lời **“duyệt”** cho [cấu hình r6](mobot-v2-config-2026-11-05-r6.md) và yêu cầu tiếp tục. Hash SHA‑256 đối chiếu từ tệp là `54657F1518A435701B8B3DDE21E40C9DD7CA624AFF64CFCB0487D7512FE7D104`. Phạm vi được duyệt là schematic và layout hai carrier nguyên mẫu, BOM theo refdes, ERC và DRC. Hồ sơ này lưu bằng chứng duyệt để HQ đưa vào registry theo quy trình.

## Đầu vào bàn giao

- Bo mục tiêu là chính thiết kế BrijModi trên Mạch Mở. [Preflight r5](mobot-v2-r5-kicad-preflight.md) có hình học header và bằng chứng đường USB nguồn. Một bo bán lẻ tương đương chỉ cần đối chiếu khi xác nhận lắp vừa hoặc chuẩn bị sản xuất.
- Ngân sách robot theo r6 là 0,90 A tại 6 V cho motor và 0,70 A tại 5 V cho logic/loa, tương đương khoảng 1,762 A phía pack ở góc giả định. Tay cầm khoảng 0,977 A trước tải phụ. Kỹ sư cần xác nhận ngưỡng cắt và phục hồi khi pin thấp, giới hạn dòng cùng dung sai và khả năng của pack/converter trong các điều kiện đã duyệt.
- Hướng review VBUS là dùng giao diện nạp Micro‑USB có điểm cảm nhận VBUS trước bo DevKit, giữ nguyên thiết kế BrijModi và truyền dữ liệu qua giao diện nạp. Cần xác định cách tích hợp điểm cảm nhận và kiểm rằng vẫn phát hiện được khi pack cạn. Trong trạng thái nạp, phần cách ly phải xử lý cả đường nguồn và I/O tới ngoại vi tắt nguồn. Có USB‑C sạc thì motor/tải carrier tắt độc lập firmware. Bảng trạng thái r6 là tiêu chí nghiệm thu.
- Đã tìm được `D:/StartupOS/.tools/kicad-10.0.7/bin/kicad-cli.exe`. `version` trả về **10.0.7**. Tiến trình trong sandbox báo không ghi được khóa cấu hình HKCU. Lượt này chỉ kiểm phiên bản, chưa xác minh ERC/DRC.

## Trạng thái sẵn sàng

Tại thời điểm kiểm, [hàng đợi chung](../../../docs/agents/tasks.json) vẫn ghi `MOBOT-HWCFG-001` revision 1 ở trạng thái `proposed`, chưa có hash duyệt r6 và chưa có lease ghi cho hai carrier. Các mục `MM-BOM-001` và `MM-HW-001` hiện là công việc BOM/intake, chưa phải phạm vi triển khai carrier. HQ cần gắn bản duyệt r6 vào cấu hình máy đọc, ghi kết quả review các đầu vào còn thiếu, cấp lease đúng phạm vi và chạy preflight validator trước khi giao builder. [Quy trình dự án](../mission-control/parallel-build-policy.md)

Trạng thái của lượt này là **đã bàn giao dữ liệu cấu hình và phê duyệt, chưa tạo schematic hoặc PCB**.
