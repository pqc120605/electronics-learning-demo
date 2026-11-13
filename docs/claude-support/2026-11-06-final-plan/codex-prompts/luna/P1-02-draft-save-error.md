Model: GPT-6 Luna
Goal: Báo lỗi khi lưu nháp bài học/nhánh thất bại thay vì nuốt im lặng.
Context: đọc trước `docs/claude-support/2026-11-06-review-webapp/findings.md` (M1). Bằng chứng: `src/pages/CircuitBuilderPage.tsx:677-678` có `try{workspaceStorage.setItem(...)}catch{}`; dòng 513 `catch{}` khi `worker.postMessage`. Task [đề xuất]: MM-SW-P1-L02.
Scope: allowed_paths tối đa 4 file: `src/pages/CircuitBuilderPage.tsx` (sửa vài dòng, file ~1040 dòng), một helper nhỏ mới trong `src/lib/` (ví dụ `draftStorage.ts`), một file test node mới trong `tests/`, và tối đa một file giao diện cảnh báo. forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `package.json`.
Constraints: local-first; không thêm dependency; không đổi schema dữ liệu lưu; cảnh báo một lần, `role="status"`, nội dung "Không lưu được bản nháp trên trình duyệt này"; không thay đổi hành vi khi lưu thành công; không refactor file lớn.
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi schema dữ liệu.
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0 gồm test mới chứng minh có cảnh báo khi `setItem` ném lỗi và không có khi thành công.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SW-P1-L02/`.
Claude review: KHÔNG
