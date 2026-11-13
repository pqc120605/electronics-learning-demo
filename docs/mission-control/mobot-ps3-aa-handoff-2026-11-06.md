# Bàn giao MoBot V2 · Tay cầm PS3-style AA · 06/11/2026

## Tiếp tục từ đây

Workspace `D:/StartupOS/electronics-learning-demo`. HQ giữ queue tại `D:/StartupOS/docs/agents/tasks.json`. Đọc `AGENTS.md`, `../docs/agents/README.md` và `docs/mission-control/parallel-build-policy.md` trên checkout đang dùng. Dùng trạng thái sống của các chat và queue tại thời điểm tiếp tục.

Người dùng muốn tay cầm dáng PS3, **chơi không dây**, nắp lưng thay AA. Cơ sở V1: WRL-20168, 3 AA NiMH sạc ngoài, hai cần Alps RKJXV1220001, khay MPD BA3AAW. LY tiến/lùi, RX đổi hướng, hai nút Giữ để chạy và Dừng, 2 ADC1 + 2 input số. R6P Con Thỏ và LR6 đánh giá riêng. 4 AA chỉ xét nếu cấu hình cơ sở hụt tiêu chí hoặc thay đổi yêu cầu. Hướng USB có dây bị bác. Hồ sơ cặp Jauch và H3 thuộc hướng dùng pin trước đó.

Box 08 đã hoàn tất lượt review và trả `changes_requested` trước KiCad. Pass phạm vi I/O và 3 AA NiMH làm cơ sở. Trang hãng ghi Alps Standard, nguồn cung mẫu chưa xác minh. Bench chưa chạy. Chưa có lease hay hash cấu hình triển khai được duyệt.

| Gate còn mở | Việc tiếp theo |
|---|---|
| Hợp đồng robot | Box 01 điều phối và kiểm chéo. Box 02 khóa delta có version, mapping LY/RX, mã hóa, chu kỳ gửi, peer/phiên/thứ tự/độ tươi và điều kiện tái cấp quyền. Chốt đầu ra motor khi dừng. Mục tiêu đề xuất ≤250 ms, đo trên robot sau tích hợp. |
| Nguồn, ADC và pin | Box 02 đóng dải ADC, vùng trung tính, reset và cận tải thật, mã cell, sụt áp, UVLO và tiêu chí phép thử 2 giờ. TPS63070 + TPS25810 là ứng viên. Thử Con Thỏ riêng trước khi công bố hỗ trợ. |
| PROGRAM và chống cấp ngược | Box 03 khóa cassette/cửa trượt. Box 02 đối chiếu mốc ngắt điện trước khi mở cổng và chặn tiếp điểm khi USB cắm. Rà I/O, JOY_VCC mặc định tắt, dòng hồi VBUS/I/O/sense và GND_FUNC hở. Cần đúng mẫu cho cận quyết định thiết kế. |

Hợp nhất một cấu hình triển khai sau khi đóng đầu vào. Box 08 rà đúng snapshot, người dùng duyệt đúng SHA-256, HQ chạy preflight rồi xét lease tay cầm. Robot theo dependency hiện hành.

## Chat hiện có, host local

| Box | ID | Lượt gần nhất tại thời điểm bàn giao |
|---|---|---|
| 01 Architecture | `01a1a853-d232-7460-8d00-3312362df34a` | Hoàn tất phạm vi và bảng phân bổ. |
| 02 Electronics & Firmware | `01a1a854-2163-70f2-a167-db281ef2ad08` | Hoàn tất đề xuất hợp đồng và giao diện điện. |
| 03 Hardware | `01a1a855-14f9-7d32-9d27-118e8a50627e` | Hoàn tất đề xuất khay, cần và liên động. |
| 08 QA | `01a1a858-a54b-7eb1-a7c8-bf039a639757` | Hoàn tất QA, `changes_requested` trước KiCad. |
| 09 Research Scout | `01a1aecd-bd7e-7602-831f-b8155a19aab7` | Tham gia khi có yêu cầu tìm nguồn cụ thể. |

Profile dùng GPT-6.1 Sol / Medium. Giữ tối đa hai nhánh hoạt động. HQ gửi vào box hiện có sau khi đọc lượt cuối và kiểm trạng thái, tránh giao trùng. Không gọi Claude.

## Prompt dán vào phiên Codex tiếp theo

```text
Tiếp tục vai HQ Mạch Mở ở D:/StartupOS/electronics-learning-demo. Đọc docs/mission-control/mobot-ps3-aa-handoff-2026-11-06.md, AGENTS.md và queue chuẩn ../docs/agents/tasks.json. Kiểm tra các box hiện có bằng wait_threads hoặc read_thread lượt cuối. Tay cầm V1 kiểu PS3, chơi không dây, 3 AA NiMH làm cơ sở, thử Con Thỏ R6P riêng. Box08 đã trả changes_requested trên packet QA hash 5E881E8497E0B211146368742F8FCF70FB0151963DB3BF2C6DF8F8A7B0423CFA. Giao Box01 đề xuất phân bổ và kiểm chéo, HQ điều phối Box02/03 đóng hợp đồng robot, cận nguồn/ADC và liên động PROGRAM. Không gửi trùng, tối đa hai nhánh hoạt động. Không mở KiCad trước khi cấu hình triển khai đủ bằng chứng, được duyệt đúng hash và preflight đạt. Không gọi Claude. Báo ngay bước thực hiện được và đầu vào thật sự cần người dùng.
```
