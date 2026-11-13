# Đề xuất lease cho Cursor — UI giai đoạn 1 (2026-11-10)

Trạng thái: **ĐỀ XUẤT, chưa active.** Chỉ Codex lead được thêm task này vào `../docs/agents/tasks.json`, chạy `node D:/StartupOS/docs/agents/validate.mjs --dispatch-task <task-id>` và cấp lease. Cursor không được ghi cho tới khi lease active.

## Nội dung đề xuất
- Mục tiêu: làm lại UI giai đoạn 1 theo hướng trải nghiệm của P01 (Learn Arduino Red, nhãn D trong `docs/research/2026-11-05-mach-mo-reference-coverage.md`): shell + điều hướng, trang `/`, `/app`, `/app/learn`. Chỉ học luồng/cấu trúc, không sao chép asset, văn bản, CSS hay mã của mẫu.
- Executor: Cursor. Role card để validator: `software_engineer` (lane phần mềm). Validator có thể không nhận executor ngoài tám role native — nếu bị từ chối, lead quyết định cách ghi (không đoán ở đây).
- Điều kiện trước: hiện chưa có lease active nào trong `tasks.json` (đã kiểm 2026-11-10: 0/60 task). Giới hạn tối đa hai writer song song và đường dẫn rời nhau.

### write_lease.paths (product-relative, đề xuất)
- `src/styles/**`
- `src/components/SiteShell.tsx`
- `src/components/SiteNavigation.tsx`
- `src/components/LearningPath.tsx`
- `src/pages/AppHomePage.tsx`
- `src/pages/ExplorePage.tsx`
- `src/pages/TopicsPage.tsx`

### Cấm (ngoài lease)
`src/simulation/**`, `src/workers/**`, `src/lib/**`, `src/data/**`, `src/pages/CircuitBuilderPage.tsx`, `src/components/builder/**`, `src/components/board/**`, `tests/**`, `e2e/**`, `package.json`, `supabase/**`, `vendor/**`, `public/**`, `.env*`.

### Xung đột cần lead xử lý
- `src/styles/app.css` và `SiteShell.tsx` là file dùng chung; mọi task Codex khác chạm chúng phải chờ hoặc ở lane rời nhau.
- Baseline: e2e đang 25 pass / 3 fail do hai nút "Tiếp tục lắp mạch" trùng nhãn (`BuilderGuidancePanel.tsx` + `CircuitBuilderPage.tsx:1018`) — nằm ngoài lease này; Cursor không được sửa e2e để làm xanh.

### Done when
`npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0; `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` không tệ hơn baseline và 16 ca axe vẫn pass; ảnh `/`, `/app`, `/app/learn` ở 375px và 1440px.

### Đóng lease
Lead lấy manifest trước/sau, kiểm file đổi nằm trong lease, freeze/release lease trước `in_review`/`in_test`.
