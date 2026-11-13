# Mạch Mở · Bàn giao khi đổi tài khoản Codex

Ngày 06/11/2026, máy Windows hiện tại. Mở lại đúng thư mục `D:/StartupOS/electronics-learning-demo`. Project còn dùng `D:/StartupOS/docs` và tám profile trong `D:/StartupOS/.codex/agents`. Giữ nguyên cây thư mục cha. `D:/StartupOS/app` là dự án khác.

## Prompt mở chat HQ trên tài khoản mới

> Tiếp tục điều phối Mạch Mở trong D:/StartupOS/electronics-learning-demo. Đọc docs/mission-control/account-handoff-2026-11-06.md, AGENTS.md, D:/StartupOS/docs/agents/README.md, roles.md và tasks.json. Đọc queue trực tiếp, kiểm tra tám profile .codex/agents ở D:/StartupOS và kiểm tra các chat/automation hiện thấy trước khi khôi phục. Dùng đúng chuyên môn 01–08, HQ giữ queue, tối đa hai agent đang chạy, không cấp lease ngoài điều kiện. Chốt tay cầm trước và cho web độc lập chạy tiếp theo phạm vi đã duyệt. Không gọi Claude hoặc gửi hồ sơ dự án ra ngoài.

## Điểm tiếp tục

Queue hiện có 20 task: 6 done, 4 in_review, 4 scoped, 3 waiting, 3 backlog. Không có lease active tại lần đọc. Hash queue tại lần chụp: `68cfa92198ac6cbedd2079b4dc10e951cf061f7d9a4010824468b761ea4957cd`. Dùng hash và trạng thái đọc mới nếu queue thay đổi.

- **Tay cầm MoBot:** r6 đã được duyệt. r7 còn proposed và chưa có duyệt đúng hash. [Cấu hình r7](../hardware/mobot-v2-config-2026-11-05-r7.md), [packet box08](../hardware/mobot-v2-r7-box08-review-packet.md), [ma trận chuyển nguồn](../hardware/mobot-v2-r7-handset-transition-matrix.md). Kết quả mới nhất của 02/03 ưu tiên dock ngắt nguồn bằng khóa cơ kết hợp khóa điện độc lập và sàng lọc pin DNK653448 1.200 mAh. Cả hai vẫn là ứng viên. Cần bằng chứng cơ khí/thứ tự tiếp điểm, tải xung ở pin yếu, NTC và timer sạc. Sau khi QA chấp nhận đầu vào, trình revision riêng và hash cho user. Hai carrier KiCad ở scoped, tay cầm trước robot.
- **Web:** Catalog điện trở dữ liệu đã done với 32/32 test và typecheck. 01/06 đã bàn giao thiết kế capture Uno R3 và UI catalog, chưa có task triển khai/lease cho hai lát đó. [Điểm tích hợp](web-next-dispatch.md). Task nhập tệp MM-DATA-ID-001 chờ browser loopback, Node và source QA đã có bằng chứng. Public ngspice gate vẫn chờ.

Nếu chat cũ hiện trên tài khoản mới, kiểm tra quyền truy cập và lượt cuối trước khi tái sử dụng. Nếu thiếu, dựng chat HQ/box cần thiết từ [prompt khởi tạo](chat-prompts.md), profile TOML và tài liệu bàn giao. Đừng coi title chat là bằng chứng đã nạp đúng profile.

Trước khi cho tài khoản mới ghi queue hoặc cấp lease, dừng hoạt động ghi và lịch điều phối cũ để tránh hai HQ cùng sửa. Tạo lại lịch điều phối trên tài khoản mới nếu lịch cũ không hiện hoặc không chạy được. Kiểm tra trạng thái thực tế trước khi bật lịch mới. Không sao chép kho xác thực, API key hoặc toàn bộ thư mục cấu hình người dùng. Nếu sang máy khác, cần bản sao mã nguồn, các thay đổi chưa commit và các đường dẫn dự án nêu trên.
