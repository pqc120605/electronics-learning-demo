# 07 — WA-07 Codec project theo contract (NHÁP, chưa gửi Codex) · Luna · G-B · 5 file

Goal: Thêm `decode` và `normalizeProjectBundle` thuần, idempotent theo final-contracts §1, trả `unsupported` cho phiên bản/board lạ mà vẫn giữ raw.

Context:
- Đọc trước: `docs/product/2026-11-05-mach-mo-final-contracts.md` §1 (codec, normalization, fixture bắt buộc), `src/lib/projectBundle.ts`, `src/lib/savedProjects.ts:37,96,140`, `src/lib/workspaceStorage.ts`, `src/lib/projectTransfer.ts`, `src/lib/projectLimits.ts:2`, `e2e/journeys.spec.mjs:78,106,134`.
- Bằng chứng: e2e `:134` (library identity round trip) đang đỏ trong baseline; `savedProjects.ts:37` nuốt JSON hỏng thành `{damaged:true}`; contract yêu cầu giữ raw backup + unknown fields.
- Phụ thuộc: slice 01 (nền xanh) và 02 (báo lỗi lưu).

Scope:
- allowed_paths: `src/lib/projectBundle.ts`, `src/lib/savedProjects.ts`, `src/lib/workspaceStorage.ts`, `src/lib/projectTransfer.ts`, `tests/project-codec.test.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`, `e2e/**`.

Constraints: local-first; không thêm dependency; **không bump version bundle** trước khi có reader/migration/fixture; không xoá draft trùng template; không đổi `exportedAt`/ID để làm test xanh; unknown extension từ chối kèm danh sách, không strip im lặng.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu hoặc bump version.

Done when:
- Test mới phủ đủ fixture của contract §1 (draft rỗng + code hiện tại; sửa tay 2 bài × 2 board; branch; projectId + layout; unknown extension; future schema; unknown board + alias cũ; quota giữa các section).
- `npm.cmd test` exit 0; `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0 (kể cả `:134`).

Report: file đã đổi; lệnh + exit code; fixture nào chưa phủ và vì sao.
