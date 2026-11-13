# 08 — WA-08 Kênh quan sát hợp nhất K-RUN (NHÁP, chưa gửi Codex) · **ĐỀ XUẤT SOL** · G-B · chạm > 5 file

Lý do đánh dấu SOL: cần thiết kế kiến trúc (union `RuntimePayload`, `ObservationDataset`, adapter cho 3 provider) trước khi Luna triển khai; ước tính ≥ 8 file (contracts, 3 adapter, panel, worker AVR, trang firmware, test). Luna chỉ nhận sau khi Sol chốt thiết kế (tương ứng MM-RUN-001).

Goal: Hợp nhất dữ liệu quan sát (logic, serial, điện áp) thành `ObservationDataset` có đơn vị và trục thời gian, hỗ trợ nhiều kênh digital, serial hai chiều và plotter.

Context:
- Đọc trước: `docs/product/2026-11-05-mach-mo-final-contracts.md` §3 (union, bảng tương thích quantity/unit/timebase, golden examples), `src/components/builder/SimulationInstrumentsPanel.tsx`, `src/lib/logicTrace.ts`, `src/lib/avr8jsRunner.ts:39`, `src/workers/avr8js.worker.ts`, `src/simulation/spice.worker.ts:63`, `src/pages/FirmwareHexToolPage.tsx`.
- Bằng chứng: hiện chỉ kênh D13/PB5 (≤ 128 chuyển mức) và SPICE polyline; Serial Monitor chỉ đọc UART0. Tham khảo năng lực: P05, P04, P15 (nhãn D).

Scope (đề xuất cho Sol, chia thành slice Luna ≤ 5 file sau thiết kế):
- allowed_paths: `src/simulation/**`, `src/lib/observation*.ts` (mới), `src/components/builder/SimulationInstrumentsPanel.tsx`, `src/workers/avr8js.worker.ts`, `tests/observation-*.test.mjs` (mới).
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, mọi `.env*`.

Constraints: local-first; không thêm dependency; không biến boolean GPIO thành V; không gọi LED canvas là tải đã giải điện; stale/cancel/timeout/truncation phải vào report.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency, đổi schema dữ liệu, hoặc đổi kiểu hiện có trong `simulation/contracts.ts`.

Done when:
- Golden examples của contract §3 (subset boolean trace; AVR D13 logic/cycles/16 MHz + UART text; SPICE RC voltage/V/s) pass; dataset sai đơn vị bị từ chối.
- `npm.cmd test` exit 0; `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0.

Report: file đã đổi; lệnh + exit code; adapter nào còn dùng kiểu cũ.
