Model: GPT-6 Luna
Goal: Làm kết quả `npm test` và `typecheck` ổn định hơn: test tuần tự, đủ heap cho `tsc`, và bật `strict`.
Context: đọc trước `docs/claude-support/2026-11-06-review-webapp/findings.md` (M3, M4, L1). Bằng chứng reviewer: `npm test` song song có lúc lỗi `spawn -4094`, chạy `--test-concurrency=1` thì 367/367; `tsc` hết heap có lúc; `tsc --strict` với heap lớn cho 0 lỗi; `tsconfig.app.json` chưa bật `strict`. Lượt baseline 06/11 của Claude: `npm test` đạt, nên nguyên nhân có thể là môi trường [chưa kết luận]. Task [đề xuất]: MM-SW-P1-L05.
Scope: allowed_paths tối đa 2 file: `package.json` (chỉ phần `scripts`), `tsconfig.app.json` (thêm `"strict": true`). forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `src/**`, `package-lock.json`.
Constraints: local-first; không thêm dependency, không cài package; không đổi phiên bản; script `test` thêm `--test-concurrency=1`; heap cho typecheck qua cách không cần dependency (ví dụ `node --max-old-space-size=4096 node_modules/typescript/bin/tsc ...` hoặc biến môi trường trong script, kiểm trên Windows).
Approval boundaries: dừng và hỏi founder nếu bật `strict` sinh lỗi kiểu (đừng sửa `src/**` trong slice này), trước khi xoá file hoặc thêm dependency.
Done when: `npm.cmd run typecheck` exit 0 với `strict`; `npm.cmd test` exit 0 (≥367 đạt); `npm.cmd run build:local` exit 0.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SW-P1-L05/`.
Claude review: KHÔNG
