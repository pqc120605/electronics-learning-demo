# Mạch Mở · Tiếp tục sau khi đổi tài khoản Codex

Mốc 07/11/2026. Đổi tài khoản trên cùng máy Windows và cùng hồ sơ ACER. Project đang ở D:/StartupOS/electronics-learning-demo. Queue chuẩn ở D:/StartupOS/docs/agents/tasks.json. File dự án và lịch sử chat local là hai nguồn dữ liệu riêng.

Các tệp rollout local của HQ và 9 box được tìm thấy trong C:/Users/ACER/.codex/sessions. Bản sao ZIP tại thư mục visualizations cùng phiên HQ là snapshot dự phòng. Không đảm bảo sidebar tự hiển thị chat sau đổi tài khoản. Chưa kiểm chứng thao tác đổi tài khoản trong phiên này.

## Thao tác tiếp tục

1. Giữ cùng hồ sơ Windows ACER, ứng dụng Codex và các thư mục dữ liệu đang dùng. Đăng xuất rồi đăng nhập tài khoản còn hạn mức trong ứng dụng.
2. Kiểm tra project Mạch Mở và chat HQ hiện có. Nếu hiển thị, mở chat đó và gửi câu lệnh tiếp tục bên dưới.
3. Nếu sidebar chưa có project, mở lại D:/StartupOS/electronics-learning-demo. Nếu lịch sử chưa hiển thị, dùng file này làm mốc bàn giao để tiếp tục bằng chat mới. Giữ nguyên bản sao lịch sử để có thể kiểm tra bằng cơ chế resume được phiên ứng dụng hỗ trợ. Việc khôi phục DB hoặc nhập rollout cần kiểm chứng riêng.

## Chat chuyên môn đã có

| Box | ID local |
|---|---|
| HQ | 01a1a84b-49b8-7dd0-b5ef-bd06feb4670e |
| 01 Architecture | 01a1a853-d232-7460-8d00-3312362df34a |
| 02 Electronics | 01a1a854-2163-70f2-a167-db281ef2ad08 |
| 03 Hardware | 01a1a855-14f9-7d32-9d27-118e8a50627e |
| 04 Learning | 01a1a855-8689-7941-bf01-e4bff1213834 |
| 05 Software | 01a1a856-6b8b-7220-be8e-8dfe7248c780 |
| 06 UX | 01a1a856-f10d-7d93-9684-5be471523aa6 |
| 07 Testing | 01a1a858-0ede-7221-84b1-fcfc1876a4a9 |
| 08 QA | 01a1a858-a54b-7eb1-a7c8-bf039a639757 |
| 09 Research | 01a1aecd-bd7e-7602-831f-b8155a19aab7 |

## Câu lệnh tiếp tục

```text
Tiếp tục Mạch Mở trên cùng máy. Workspace D:/StartupOS/electronics-learning-demo.
Đọc AGENTS.md, D:/StartupOS/docs/agents/README.md và queue tasks.json trước.
Đọc docs/account-switch-resume-2026-11-07.md và docs/hardware/mobot-v2-hardware-pause-2026-11-07.md.
Phần cứng đã tạm dừng theo Founder. P0-02 còn mở, hai proposal proposed, IF waiting, KiCad scoped và chưa có lease.
Giữ quyết định D10, D15(a), D16(c) và RUN → OFF → PROGRAM. Chỉ tiếp tục phần cứng khi tôi yêu cầu.
Đối chiếu mốc bàn giao với trạng thái thật trên đĩa và chat hiện có. Báo ngắn trạng thái tiếp nhận rồi làm theo nhiệm vụ tiếp theo của tôi.
```

Nguồn chính thức mô tả lịch sử local và mở lại chat đã lưu bằng thread/resume: https://learn.chatgpt.com/docs/app-server#start-or-resume-a-thread.
