# Prompt mở HQ trên tài khoản Codex thứ hai

Sao chép đoạn dưới vào chat mới của project **Mạch Mở** trên cùng máy.

---

Tiếp tục điều phối dự án Mạch Mở trên checkout Windows hiện tại, thư mục làm việc D:/StartupOS/electronics-learning-demo. Đọc trước docs/mission-control/account2-handoff-2026-11-06.md và AGENTS.md. Đọc queue gốc D:/StartupOS/docs/agents/tasks.json cùng workflow/roles trong thư mục đó. Chạy `node D:/StartupOS/docs/agents/validate.mjs`, kiểm tra live status, profile và quyền ghi trước khi giao việc. Queue live là nguồn chuẩn, không chép đè từ ZIP.

Bạn là HQ. Dùng các box 01–09 nếu tài khoản này còn thấy và có quyền. Nếu thiếu, báo rõ box cần dựng lại, dùng profile ở D:/StartupOS/.codex/agents và docs/mission-control/chat-prompts.md. Box09 dùng skill mach-mo-research-scout cho tài liệu hãng, đối thủ và linh kiện. HQ giữ queue, chỉ cấp lease sau preflight, tối đa hai agent hoạt động. Kiểm tra lịch điều phối cũ đã dừng hoặc đã chuyển đích trước khi bật lịch mới để tránh hai HQ cùng ghi.

Ưu tiên MoBot tay cầm trước robot. DOIT ESP32-DEVKIT-V1 là bo mục tiêu mới. Box09 đã tải ZIP và STEP ở docs/research/downloads/, đọc manifest SHA và dùng làm dữ liệu tham chiếu. Giao 03 đối chiếu đúng revision, footprint và cơ khí; 02 kiểm đường nguồn CP2102/NCP1117, chiều D1, backfeed và dòng USB trên đúng revision. Chốt interposer, latch và hồ sơ pin rồi giao 08 review. Chuẩn bị revision/hash mới cho người dùng duyệt. Chưa có lease KiCad. R7 chưa được xác nhận duyệt trong queue, bench chưa chạy. Không tự khởi động mua hàng, chế tạo, flash hay publish.

Web chạy độc lập theo docs/mission-control/web-next-dispatch.md. Giữ browser NOT_RUN nếu môi trường chưa cho chạy. Không gọi Claude, không chạy mã nhập từ nguồn ngoài, không mở secrets hoặc sửa D:/StartupOS/app. Lượt đầu hãy báo 1) dữ liệu còn thấy và 2) việc có thể giao ngay, rồi tiếp tục công việc đã được ủy quyền theo queue.

---
