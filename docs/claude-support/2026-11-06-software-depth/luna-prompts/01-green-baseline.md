# 01 — WA-01 Nền xanh (NHÁP, chưa gửi Codex) · Luna · G-A · 4 file

Goal: Đưa baseline về xanh hoàn toàn: hết nút "Tiếp tục lắp mạch" trùng nhãn, bật `strict`, và làm `npm.cmd test` ổn định.

Context:
- Đọc trước: `electronics-learning-demo/docs/claude-support/2026-11-06-software-depth/baseline-checks.md` §2; `src/components/builder/BuilderGuidancePanel.tsx`; `src/lib/builderGuidance.ts:51`; `src/pages/CircuitBuilderPage.tsx:1018`; `package.json`; `tsconfig.app.json`; `e2e/journeys.spec.mjs:134,249`.
- Bằng chứng: `npm.cmd run test:e2e` → 25 pass / 3 fail, cùng lỗi `strict mode violation … 'Tiếp tục lắp mạch' resolved to 2 elements`. `tsc --strict` đã cho 0 lỗi (review-webapp, L1); `npm.cmd test` song song từng lỗi `spawn errno -4094` trong sandbox (M4), `tsc` từng hết heap (M3).
- Quyết định liên quan: giữ một hành động chính; chỉ đổi nhãn/aria để phân biệt, không đổi luồng.

Scope:
- allowed_paths: `src/components/builder/BuilderGuidancePanel.tsx`, `src/lib/builderGuidance.ts`, `src/pages/CircuitBuilderPage.tsx` (chỉ vùng quanh dòng 1018), `package.json` (chỉ field `scripts`), `tsconfig.app.json`.
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, `public/vendor/**`, mọi `.env*`, `e2e/**` (không sửa selector để "làm xanh").

Constraints: local-first; không thêm dependency; giữ contract trong `docs/product/2026-11-05-mach-mo-final-contracts.md`; thay đổi tối thiểu trong `CircuitBuilderPage.tsx` (1040 dòng).

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc đổi nhãn nút mà test khác đang dùng (grep trước và báo).

Done when:
- `npm.cmd run typecheck` exit 0 với `"strict": true`.
- `npm.cmd test` exit 0, pass ≥ 367, fail 0.
- `npm.cmd run test:e2e` exit 0: 28 passed, 0 failed.
- `npm.cmd run build:local` exit 0.

Report: file đã đổi; các lệnh trên + exit code; nếu cần đổi nhãn khác, nêu test bị ảnh hưởng.
