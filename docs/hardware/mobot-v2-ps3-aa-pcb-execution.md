# MoBot V2 · Thực thi kế hoạch PCB tay cầm AA

Áp dụng trình tự của [kế hoạch PCB tham khảo](claude-support/2026-11-06-pcb-first-plan/codex-pcb-execution-plan.md) cho [tay cầm PS3-style AA V1](mobot-v2-handset-ps3-aa-v1-qa-packet.md). WRL-20168, 3 AA NiMH, hai cần và hai nút là cơ sở triển khai tiền KiCad. R6P và LR6 thử riêng. Các mục mua clone, net map 30 chân và Jauch/H3 thuộc hướng cũ. Robot giữ phạm vi và dependency hiện hành. Stackup, fab và quy tắc DRC chờ cận thiết kế của board thực.

| Bước | Chủ trì | Điều kiện hoàn tất |
|---|---|---|
| Hợp đồng điều khiển và cận điện | Box 02 | Đặc tả LY/RX có phiên bản hoặc delta hai phía, gói mới hợp lệ, dừng và tái cấp quyền. Mã cell, tải xung, sụt áp, ngưỡng pin yếu, ADC và bảo vệ khi một miền mất nguồn có cận đúng nguồn. Mục tiêu 250 ms/2 giờ phải có cách nghiệm thu. |
| Liên động PROGRAM và bố trí | Box 03 | Khay 3 AA, joystick và cổng USB có bản vẽ. Xác định chuỗi ngắt pin, mở USB và chặn cassette khi phích còn cắm. Phân loại dung sai có nguồn và dữ liệu phải lấy trên mẫu. |
| Hợp nhất và review | HQ, Box 01, Box 08 | Box 01 đối chiếu hai nhánh. HQ lập cấu hình triển khai. Box 08 review đúng snapshot, phân biệt đầu vào chặn KiCad với bench tích hợp. |
| Mở KiCad | HQ và người dùng | Đóng đầu vào, duyệt SHA-256 cấu hình, lease đúng path và preflight đạt. Sau đó schematic → ERC → review → layout → DRC. |

QA hiện `changes_requested` trên packet SHA-256 `5E881E8497E0B211146368742F8FCF70FB0151963DB3BF2C6DF8F8A7B0423CFA`. Bench chưa chạy.
