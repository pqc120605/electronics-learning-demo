Model: GPT-6 Luna
Goal: Gắn phiên bản vào tên cache của service worker và dọn cache cũ để cache không tăng vô hạn qua các lần deploy.
Context: đọc trước `docs/claude-support/2026-11-06-review-webapp/findings.md` (L3). Bằng chứng: `public/sw.js:1` `CACHE_NAME='mach-mo-shell-v1'` cố định; `public/sw.js:50-57` chèn mọi `/assets/*.js|css` vào cùng cache, `activate` chỉ xóa cache khác tên; `src/lib/registerServiceWorker.ts:1` gọi là "bounded app-shell cache". Task [đề xuất]: MM-SW-P1-L04.
Scope: allowed_paths tối đa 3 file: `public/sw.js`, `src/lib/registerServiceWorker.ts`, một file test mới. forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `package.json`, `supabase/**`.
Constraints: local-first; không thêm dependency; không đổi hành vi offline hiện có; dọn entry không còn trong danh sách precache hiện tại; mọi route phải còn mở được offline như trước (kiểm bằng cách đọc code, không khẳng định offline khi chưa thử).
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi cách build (ví dụ cần plugin tạo hash thì dừng, đề xuất thay vì tự thêm).
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0; `npm.cmd run build:local` exit 0; test chứng minh tên cache đổi khi phiên bản đổi và cache cũ bị xóa ở `activate`.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SW-P1-L04/`.
Claude review: KHÔNG
