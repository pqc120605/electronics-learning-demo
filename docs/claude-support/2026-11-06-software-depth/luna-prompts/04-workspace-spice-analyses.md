# 04 — WA-04 Workspace→SPICE đa analysis (NHÁP, chưa gửi Codex) · Luna · G-A · 4 file

Goal: Cho phép biên dịch mạch analog trong workspace sang `.op`, `.tran` hoặc `.dc` (thông số hợp lệ), không chỉ `.op`.

Context:
- Đọc trước: `src/lib/workspaceSpice.ts` (kết thúc `.op` ở dòng ~282), `src/simulation/spiceNetlist.ts:77,145-169,207` (validator `.op/.tran/.ac/.dc`, tối đa 20 000 điểm), `src/pages/SpiceWorkbenchPage.tsx:423`, `tests/workspace-spice.test.mjs`, `docs/product/2026-11-05-mach-mo-final-contracts.md` §3.
- Bằng chứng: workspace chỉ sinh `.op` (`workspaceSpice.ts:282`); bộ tính RC đã có `.tran` (`calculatorSpice.ts:103`) nên validator đủ.
- Nguồn tham khảo năng lực: P09, P15, P16 (nhãn D) — chỉ tham khảo workflow, không sao chép UI.

Scope:
- allowed_paths: `src/lib/workspaceSpice.ts`, `src/pages/SpiceWorkbenchPage.tsx`, `tests/workspace-spice.test.mjs`, một file UI nhỏ mới `src/components/spice/AnalysisPicker.tsx`.
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, `public/vendor/**`, `src/simulation/spice.worker.ts`, mọi `.env*`.

Constraints: local-first (ngspice WASM nội bộ, không mạng); không thêm dependency; vẫn chặn MCU/GPIO/linh kiện chưa map; kiểm đơn vị như hiện có; giữ fingerprint handoff 24 000 ký tự; không đụng `check:public-release`.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu handoff.

Done when:
- Test mới: mạch RC trong workspace + `.tran` → netlist hợp lệ, `inspectNetlist` không lỗi, số điểm ≤ 20 000; thông số sai bị chặn với lý do.
- `npm.cmd test` exit 0 (tests mới pass); `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0.
- Kiểm tay (báo kết quả): chạy mạch RC trong `/app/tools/spice` thấy đồ thị với τ=RC trong dung sai khai báo.

Report: file đã đổi; lệnh + exit code; giới hạn còn lại (không `.ac` từ workspace).
