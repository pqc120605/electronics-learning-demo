# P2–P8 · Outline (chi tiết sau P1; mọi số công sức là [ước lượng, độ tin cậy thấp] theo số phiên agent, không có ngày)

Quy ước từng phase: mục tiêu/lý do · entry · exit (nhị phân) · deliverables · phụ thuộc HW↔SW · quyết định founder · rủi ro/dự phòng · công sức.

## P2 · Mạch Starter (màn hình, âm thanh, cảm biến, nút) + KiCad
- **Mục tiêu/lý do:** biến V2 thành mạch Starter. Sau P1 vì cần schematic tay cầm đã qua Box 08 và hợp đồng MCU.
- **Entry:** P1 Exit 3–5; D1, D2, D7 chốt; outline sơ bộ từ P3-S01 (cơ khí chốt trước layout).
- **Exit:** schematic + layout tay cầm và robot qua ERC/DRC 0 lỗi chặn; Box 08 PASS; BOM variant có giá và so với trần (D11); expansion port gán chân (dự trữ cho E1–E4). Chưa gửi PCB đi sản xuất.
- **Deliverables:** project KiCad 2 board, BOM, DRC/netclass có nguồn, tài liệu chân mở rộng.
- **Phụ thuộc:** SW cần pin map để làm điều khiển robot (P4).
- **Quyết định founder:** D7 (tay cầm có trong mọi Starter?), D8 (Q6/Q7), D11 (giá), chọn fab.
- **Rủi ro:** năng lượng hồi VM (cần T8), pin B04/B15 chưa hồ sơ, board clone. Dự phòng: đo T8 bước 0 trước layout robot; module-first.
- **Công sức:** Sol 15–25 phiên, 5–8 lượt Claude review.

## P3 · Cơ khí 2 cấu hình + tay cầm tự lắp
- **Mục tiêu/lý do:** rover ↔ mini từ cùng lõi; chạy song song với P2 ở mức outline.
- **Entry:** D1, D9 (định nghĩa mini, đường kính bánh).
- **Exit:** outline/lỗ gá/chuẩn gắn module được chốt bằng CAD hoặc bản vẽ có số đo; thử lắp được cả 2 cấu hình bằng mẫu in; hướng dẫn lắp tay cầm.
- **Phụ thuộc:** SW bài lắp rover/mini (P4).
- **Rủi ro:** thiết kế khung giống thương hiệu khác (TGT:76); dự phòng: khung riêng, rà soát khác biệt. **Công sức:** Sol 8–15 phiên (tài liệu/CAD do founder hoặc công cụ ngoài nếu cần).

## P4 · Giọng nói hoặc lời hứa tối thiểu + bài học hành trình Starter
- **Mục tiêu/lý do:** hoàn tất hành trình 7 bước; giọng nói chưa xác thực nên lời hứa tối thiểu (lời chào phát sẵn, không ghi "AI") là mặc định cho tới khi D3 chốt khác.
- **Entry:** D3, D4; P2 pin map; K-RUN thiết kế xong.
- **Exit:** điều khiển robot qua web (lái, bắt đầu/dừng thử thách) chạy với robot thật hoặc mô phỏng có nhãn rõ; ≥ bài phủ bước 1–7; QR mở đúng bài; không hộp/UI nào ghi "AI"/"trò chuyện tự nhiên" khi chưa kiểm chứng.
- **Rủi ro:** micro/dữ liệu trẻ em; Web Speech phụ thuộc dịch vụ ngoài [chưa kiểm chứng]. Dự phòng: lời hứa tối thiểu. **Công sức:** Luna 10–16, Sol 3–5; Claude review CÓ (micro/giọng nói).

## P5 · EVT/DVT, bench, an toàn
- **Mục tiêu:** thay mọi UNKNOWN bằng số đo. **Entry:** PCB tay cầm và robot đã có; founder cấp phép bench.
- **Exit:** T1–T8 và BT-H4 có báo cáo; Box 08 sign-off an toàn nguồn/pin; tiêu chí EVT→DVT viết nhị phân.
- **Rủi ro:** thiết bị đo; pin Li-ion cho trẻ em. **Công sức:** Sol 6–10, tester 4–6, founder làm bench.

## P6 · Public web + gói số
- **Mục tiêu:** `check:public-release` exit 0 và `build:public`; gói dự án số đầu tiên ("Robot canh bàn học").
- **Entry:** D5 (ngspice WASM); P4 bài học xong. **Exit:** gate exit 0 với hash artifact; gói dự án mở được trên local khi offline; Claude review trước `build:public`.
- **Rủi ro:** WASM không cleared: dự phòng loại engine khỏi bản public. **Công sức:** Luna 8–12, Sol 3–4.

## P7 · PVT, đóng gói, chứng nhận
- **Mục tiêu:** lô thử sản xuất, 3 khay, QR in, kế hoạch/pre-scan chứng nhận theo độ tuổi/thị trường (D2).
- **Exit:** BOM đóng gói; kế hoạch chứng nhận có phòng thử; PVT báo cáo. Không bịa tiêu chuẩn/giá: [chưa kiểm chứng] cho tới khi chuyên gia xác nhận. **Công sức:** Sol 4–6 (tài liệu); phần còn lại ngoài phạm vi agent.

## P8 · E1 + chuẩn tương thích
- **Mục tiêu:** công bố chuẩn lắp ghép và kết nối trước khi bán E1 (TGT:56). **Exit:** tài liệu chuẩn; E1 (xe dò đường) có lời hứa, dự án, bốn nhịp lắp/thử/giải thích/chia sẻ; ghi "cần Starter". **Công sức:** Sol 6–10, Luna 4–8.
