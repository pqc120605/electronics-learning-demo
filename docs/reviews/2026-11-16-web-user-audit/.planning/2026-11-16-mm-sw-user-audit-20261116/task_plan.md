# Task Plan: MM-SW-USER-AUDIT-20261116

## Goal
Thực hiện audit người dùng thật mọi nhóm tính năng, board và model, có ảnh, bước tái hiện, ma trận bao phủ và báo cáo tiếng Việt; không sửa mã.

## Next Step
Bàn giao report.md, coverage.md, gallery.html và verification.json; audit done, 16 finding của website vẫn OPEN.

## Current Phase
Phase 5 — complete

## Phases

### Phase 1: Requirements & Discovery
- [x] Hiểu yêu cầu audit, không triển khai sửa
- [x] Kiểm queue, source snapshot và các kỹ năng liên quan
- [x] Ghi phạm vi/giới hạn
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Task queue, thư mục screenshots/evidence, hai advisor độc lập chỉ đọc
- [x] Desktop 1440×1000, mobile 375×812; mọi route/canonical group và model
- **Status:** complete

### Phase 3: Browser journeys and model coverage
- [x] Route smoke + ảnh từng phần
- [x] Học, freestyle, builder, board/component viewer, công cụ, lưu/nhập/xuất
- [x] Mở Bot, cộng đồng, góp ý, auth/admin, responsive/keyboard
- [x] Mỗi board/model có evidence và nhãn tested/unsupported/NOT_RUN
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Tái hiện lỗi quan trọng và đối chiếu source
- [x] Kiểm bằng chứng, số liệu, ảnh và source không đổi
- **Status:** complete

### Phase 5: Delivery
- [x] Báo cáo, gallery, coverage và queue
- [x] Bàn giao phát hiện theo ưu tiên
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Dùng browser context thử riêng, không đăng bài online hoặc kết nối thiết bị | Bảo vệ dữ liệu người dùng và tránh tác động thật |
| Tách kiểm runtime khỏi giả thuyết đọc source | Không báo lỗi UI chưa tái hiện là đã chứng minh |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| Dynamic import node:fs không được hỗ trợ trong VM Playwright MCP | Dùng page.screenshot để ghi ảnh, lead ghi JSON bằng tool filesystem |
| Initializer tạo named plan bên trong .planning thay vì root | Dùng đúng PLAN_ID và đường dẫn vừa in ra, không tạo plan thứ hai |
