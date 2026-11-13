# 02 — WA-02 Báo lỗi lưu nháp (NHÁP, chưa gửi Codex) · Luna · G-A · 2 file

Goal: Khi lưu nháp bài/nhánh vào storage thất bại, hiện cảnh báo rõ thay vì nuốt lỗi im lặng.

Context:
- Đọc trước: `src/pages/CircuitBuilderPage.tsx:677-678` (hai effect `try{workspaceStorage.setItem(...)}catch{}`), `src/lib/workspaceStorage.ts`, `src/lib/savedProjects.ts` (đã báo lỗi quota), `docs/claude-support/2026-11-06-review-webapp/findings.md` M1.
- Rủi ro: storage đầy/bị chặn → người học tưởng đã lưu, tải lại mất code/nhánh. Local là nơi lưu duy nhất nên đây là lỗi chặn local-first.

Scope:
- allowed_paths: `src/pages/CircuitBuilderPage.tsx` (chỉ hai effect và một state cảnh báo), file test mới `tests/draft-save-failure.test.mjs`.
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`, `src/lib/savedProjects.ts` (không đổi schema).

Constraints: local-first; không thêm dependency; không đổi khóa/schema lưu trữ; chỉ báo lỗi một lần mỗi chuỗi lỗi liên tiếp; không ghi nội dung code người dùng vào log.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu hoặc khóa storage.

Done when:
- Test mới: giả lập `setItem` ném `QuotaExceededError` → cảnh báo `role="status"` xuất hiện đúng một lần; nháp trong React state còn nguyên.
- `npm.cmd test` exit 0 (test mới pass, tổng ≥ 368); `npm.cmd run typecheck` exit 0.

Report: file đã đổi; lệnh + exit code; ghi rõ cách giả lập storage trong test.
