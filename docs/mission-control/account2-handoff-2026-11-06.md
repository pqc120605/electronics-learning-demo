# Mạch Mở · Bàn giao sang tài khoản Codex thứ hai

Snapshot ngày 06/11/2026 (UTC+7). Dùng tiếp trên cùng máy Windows và cùng checkout. Mở `D:/StartupOS/electronics-learning-demo` trong Codex. Giữ cây `D:/StartupOS` vì queue, tài liệu chung và profile agent nằm ở cấp cha. File này cập nhật và thay thế phần trạng thái của [bản bàn giao trước](account-handoff-2026-11-06.md).

## Bắt đầu

1. Khi thực hiện chuyển giao, kiểm tra lượt còn chạy và tạm dừng lịch HQ ở tài khoản cũ trước khi cho HQ mới ghi queue. Lịch cũ tên **Điều phối agent Mạch Mở**, ID `i-u-ph-i-agent-m-ch-m`. Chưa thay đổi lịch hoặc tài khoản ở lượt chuẩn bị này. Nếu lịch vẫn hiện sau khi đăng nhập, kiểm tra đích trước khi tạo lịch mới.
2. Đăng nhập tài khoản thứ hai, mở đúng project, dán nội dung [prompt khởi tạo](account2-bootstrap-prompt-2026-11-06.md). Kiểm tra các box còn hiện. Nếu thiếu, dùng [prompt theo box](chat-prompts.md) và các profile TOML để dựng lại đúng vai trò. Không giả định rằng lịch sử chat, OAuth hoặc trạng thái đang chạy tự di chuyển giữa tài khoản.
3. Chạy validator trên queue đang dùng, đối chiếu live status và bằng chứng, rồi tiếp tục việc đã được giao. Tệp queue trong ZIP chỉ là snapshot đối chiếu, không chép đè queue hiện hành.

## Nguồn trạng thái

- Queue chính: `D:/StartupOS/docs/agents/tasks.json`. SHA-256 snapshot `5fd81cedba83d52c0b81f3353525d3afadc0c0d8a096b9afc68137098c021285`. 20 task gồm 6 done, 4 in_review, 4 scoped, 3 waiting và 3 backlog. Không có lease active khi chụp.
- Workflow: [AGENTS.md](../../AGENTS.md), [quy trình agent](../../../docs/agents/README.md), [role cards](../../../docs/agents/roles.md), [quy tắc chạy song song](parallel-build-policy.md). HQ giữ queue và cấp lease. Tối đa hai agent/builder hoạt động theo chính sách dự án.
- Chín profile dự án nằm ở `D:/StartupOS/.codex/agents/`. Box 09 Research Scout có [skill riêng](../../.agents/skills/mach-mo-research-scout/SKILL.md) và [thư mục nghiên cứu](../research/README.md). Box 09 được tải tài liệu công khai theo quyền Codex thực tế. Phiên SnapEDA/Gmail hiện tại và ủy quyền đăng nhập theo tác vụ không được đóng gói.
- Các ID dưới đây là tham chiếu cho máy/tài khoản cũ. Kiểm tra quyền truy cập khi dùng trên tài khoản mới.

| Box | Thread ID cũ |
|---|---|
| 00 HQ | `01a1a84b-49b8-7dd0-b5ef-bd06feb4670e` |
| 01 Architecture | `01a1a853-d232-7460-8d00-3312362df34a` |
| 02 Electronics & Firmware | `01a1a854-2163-70f2-a167-db281ef2ad08` |
| 03 Hardware & Kit | `01a1a855-14f9-7d32-9d27-118e8a50627e` |
| 04 Learning | `01a1a855-8689-7941-bf01-e4bff1213834` |
| 05 Software | `01a1a856-6b8b-7220-be8e-8dfe7248c780` |
| 06 UI/UX | `01a1a856-f10d-7d93-9684-5be471523aa6` |
| 07 Testing | `01a1a858-0ede-7221-84b1-fcfc1876a4a9` |
| 08 QA | `01a1a858-a54b-7eb1-a7c8-bf039a639757` |
| 09 Research Scout | `01a1aecd-bd7e-7602-831f-b8155a19aab7` |

## Điểm tiếp tục MoBot

- **Người dùng đã chọn DOIT ESP32-DEVKIT-V1 thay BrijModi** cho revision tiếp theo. Đây là quyết định chọn dòng bo. SKU/revision PCB và phạm vi cấu hình mới chưa được xác minh/duyệt. [Quyết định DOIT](../hardware/mobot-next-revision-doit-board-decision.md)
- **Box 09 đã tải CAD** vào `docs/research/downloads/`. ZIP KiCad V6+ chứa symbol 30 chân, footprint và STEP. CAD cho hai hàng cách 25,40 mm, bước 2,54 mm, 30 pad và 4 lỗ không mạ. STEP rời khớp bản trong ZIP. Đã kiểm lại SHA-256 hai tệp. Đây là hình học tham chiếu, chưa xác nhận mẫu thực hoặc giấy phép riêng. [Nguồn và hash](../research/downloads/snapeda-doit-esp32-cad-sources.md)
- **Box 02 đã rà DOIT V0** (drawing ESP12E, 2014-04-13). VDD CP2102 nằm trên rail 3,3 V, REGIN/VBUS nối VCCUSB. Rail 3,3 V dùng chung đầu ra CP2102 và NCP1117, nên phải kiểm tương tác hai regulator và khi chỉ cấp VIN. D1 SS14 nằm giữa VCCUSB và VIN; chiều trong bản trích xuất còn OPEN. Bản vẽ V0 chưa được chứng minh là revision của CAD hoặc bo thực. Kiểm dòng toàn cổng, backfeed và raw VBUS trước D1. [Bản vẽ V0](https://mischianti.org/wp-content/uploads/2024/11/DOIT-ESP32-DevKit-V1-schematics.pdf)
- **Giao việc kế tiếp:** 03 đối chiếu CAD, thứ tự pin/chiều lắp, vị trí USB, khe anten, vỏ và interposer với đúng SKU/revision hoặc tài liệu mẫu. 02 xác nhận nguồn USB trên đúng bo và khép các ca fault nguồn/data; 09 bổ sung tài liệu hãng nếu thiếu. 08 tái review đúng snapshot sau khi 02/03 có đầu vào. Hợp đồng ngắt trước/cấp sau, latch, nguồn USB và hồ sơ B15/B04 vẫn mở. [Báo cáo điểm chặn](../hardware/mobot-pcb-readiness-2026-11-06.md)
- **KiCad:** IF-001 in_review, hai task carrier scoped, chưa có lease. Tay cầm trước robot. R6 đã được duyệt trong box cũ và còn pending technical review. R7 hiện proposed trong queue, hash `9ef75eb96829669e730717eb8565290485f75ad8ca673a87b66c729cd4661d5d`. Biên bản nhập từ công cụ ngoài chưa được HQ xác nhận. Đổi DOIT và các thay đổi pass/veto/latch/data cần revision/hash mới. Chỉ cấp lease sau khi đúng revision được người dùng duyệt, box08 xác nhận và preflight đạt. Bench/mua hàng/thiết bị thuộc quyền riêng.

## Điểm tiếp tục web

MM-CAT-R-001 done với 32/32 kiểm thử và typecheck. Box 06 đã bàn giao UI hai biến thể điện trở. Box 01 đã bàn giao contract metadata capture Uno R3, cần chốt phạm vi ghi và lease trước khi triển khai. MM-DATA-ID-001 chờ chạy browser do loopback bị chặn; Node và source QA đã đạt. Gate public ngspice vẫn chờ. [Bàn giao web](web-next-dispatch.md)

## Phạm vi gói

Gói ZIP chứa bản bàn giao, prompt, profile dự án, skill 09 và bản sao tài liệu/queue chọn lọc để tham chiếu. Mã nguồn và CAD tải về vẫn nằm trong workspace trên máy này. Gói không chứa cookie, mật khẩu, API key, thư mục xác thực, lịch sử chat riêng hoặc tệp CAD có điều khoản chưa xác minh.
