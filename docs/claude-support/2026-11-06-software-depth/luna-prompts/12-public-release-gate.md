# 12 — WA-12 Cổng phát hành public (NHÁP, chưa gửi Codex) · **ĐỀ XUẤT SOL** · G-C · quyết định founder + > 5 file

Lý do đánh dấu SOL: chọn giữa (a) đóng provenance ngspice, (b) profile public loại SPICE, (c) thay engine là quyết định scope/license/chi phí của founder (Q1); phương án (b) chạm ≥ 6 file (cấu hình build, routes, App, gate script, test, tài liệu). Luna chỉ nhận sau khi có quyết định.

Goal: Có một đường build public (`npm.cmd run build`) exit 0 mà không phân phối artifact ngspice WASM chưa cleared; `build:local` giữ đầy đủ.

Context:
- Đọc trước: `scripts/check-public-release-gates.mjs`, `public/licenses/spice-engine-provenance.json`, `public/licenses/NGSPICE-NOTICE.txt`, `docs/spice-redistribution-audit-2026-11-03.md`, `src/data/productRoutes.ts`, `src/App.tsx:20-23,130-137`, `package.json` (script `build` = `check:public-release` + `build:local`).
- Bằng chứng: baseline `check:public-release` exit 1, thiếu 5 điều kiện; artifact `/vendor/eecircuit-engine/spice.wasm` SHA-256 `ed799542…ae886e4`. Status ghi: đây là thiếu bằng chứng, không phải kết luận vi phạm.

Scope (đề xuất cho phương án b, sau quyết định):
- allowed_paths: `scripts/check-public-release-gates.mjs`, `vite.config.ts`, `src/data/productRoutes.ts`, `src/App.tsx`, `tests/public-release-profile.test.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, `public/vendor/**` (không xoá file), mọi `.env*`.

Constraints: local-first (`build:local` và `dev` vẫn có SPICE); gate vẫn fail-closed; artifact public phải kiểm bằng hash/inventory thật, marker không là biên bảo vệ (contract §6); không tuyên bố binary "được cấp phép".

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc đổi tiêu chí gate.

Done when:
- `npm.cmd run build` exit 0 ở profile public và `dist` không chứa `spice.wasm` (kiểm bằng lệnh liệt kê/hash); `npm.cmd run build:local` exit 0 và vẫn có SPICE.
- `npm.cmd test` exit 0 (test profile mới pass); `npm.cmd run check:public-release` exit 0 ở profile public hoặc ghi rõ lý do nếu gate vẫn chặn.

Report: file đã đổi; lệnh + exit code; hash artifact trước/sau.
