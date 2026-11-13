Model: GPT-6 Luna
Goal: Sửa hai nút cùng tên "Tiếp tục lắp mạch" để e2e hết ba ca đỏ.
Context: đọc trước `docs/claude-support/2026-11-06-software-depth/baseline-checks.md` (§2: e2e 25/28) và `roadmap.md` (WA-01). Tìm bằng Glob các file có chuỗi "Tiếp tục lắp mạch": theo báo cáo là `src/components/builder/BuilderGuidancePanel.tsx` và `src/lib/builderGuidance.ts` [đường dẫn chưa xác minh]. Task [đề xuất]: MM-SW-P1-L01.
Scope: allowed_paths tối đa 5 file: hai file trên, một file test e2e (kiểm bằng Glob, thường `tests/e2e/journeys.spec.mjs`), tối đa hai file nữa nếu cần. forbidden_paths: `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`, `package.json`, `supabase/**`.
Constraints: local-first; không thêm dependency; giữ contract trong `final-contracts`; không đổi schema dữ liệu; thay đổi nhỏ nhất (đổi nhãn/aria-label cho phân biệt được, hoặc gộp nút); không refactor.
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc nếu phải chạm quá 5 file.
Done when: `npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0; `npm.cmd run test:e2e` 28/28 hoặc ghi NOT_RUN kèm lý do môi trường (không báo đạt khi chưa chạy).
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SW-P1-L01/`.
Claude review: KHÔNG
