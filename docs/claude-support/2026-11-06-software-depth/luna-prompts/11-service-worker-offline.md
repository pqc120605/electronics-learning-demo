# 11 — WA-11 Service worker có phiên bản và offline (NHÁP, chưa gửi Codex) · Luna · G-C · 4 file

Goal: Cache service worker theo phiên bản build, dọn bản cũ, và chứng minh bằng e2e rằng app mở được offline sau lần tải đầu.

Context:
- Đọc trước: `public/sw.js` (dòng 1 `CACHE_NAME='mach-mo-shell-v1'` cố định; dòng 11-12 chỉ precache asset ở `index.html`; dòng 50-57 cache-first `/assets/*.js|css` không bao giờ xoá bản cũ), `src/lib/registerServiceWorker.ts:1` (comment nói "bounded"), `vite.config.ts`, `docs/claude-support/2026-11-06-review-webapp/findings.md` L3.
- Bằng chứng: bằng đọc code; chưa kiểm bằng trình duyệt production. Đây là phần của local-first: offline là đặc tính mặc định mong đợi.

Scope:
- allowed_paths: `public/sw.js`, `src/lib/registerServiceWorker.ts`, `vite.config.ts` (chỉ nếu cần tạo manifest build), `e2e/offline.spec.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, `public/vendor/**`, mọi `.env*`.

Constraints: local-first; không thêm dependency (không Workbox khi chưa có approval); chỉ cache same-origin GET; không cache mô hình lớn/tệp người dùng/Supabase như comment hiện nay; không bản cũ kẹt sau deploy.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc cache thêm loại tài nguyên mới.

Done when:
- E2E mới chạy trên `vite preview` bản `build:local`: tải `/app/lab`, đặt offline, tải lại → vẫn hiển thị app; cache cũ bị xoá sau lần cập nhật giả lập.
- `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0; `npm.cmd run typecheck` exit 0.

Report: file đã đổi; lệnh + exit code; kích thước cache sau 2 lần deploy giả lập.
