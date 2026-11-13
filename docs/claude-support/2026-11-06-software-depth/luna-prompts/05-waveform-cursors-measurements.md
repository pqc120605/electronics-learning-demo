# 05 — WA-05 Cursor và phép đo trên waveform (NHÁP, chưa gửi Codex) · Luna · G-A · 5 file

Goal: Thêm hai cursor và phép đo (Δt, ΔV, tần số/duty) cho waveform SPICE và trace logic, ghi rõ nguồn dữ liệu.

Context:
- Đọc trước: `src/components/builder/SimulationInstrumentsPanel.tsx:52-53,77` (3 tab, polyline SVG), `src/components/builder/DigitalWaveform.tsx`, `src/pages/FirmwareHexToolPage.tsx` (tải CSV trace D13), `docs/product/2026-11-05-mach-mo-final-contracts.md` §3 (không biến boolean GPIO thành V; dataset có sourceKind/unit/timebase).
- Bằng chứng: hiện chỉ vẽ đường, không cursor/đo (OBS-06 = chưa có). Tham khảo năng lực: P15, P16, P04 (nhãn D).
- Mẫu golden: RC `.tran` (V theo s) và blink AVR 2,03 Hz, duty 50 % (đã có trong status).

Scope:
- allowed_paths: `src/components/builder/SimulationInstrumentsPanel.tsx`, `src/components/builder/DigitalWaveform.tsx`, `src/lib/waveformMeasure.ts` (mới), `tests/waveform-measure.test.mjs` (mới), CSS cạnh panel.
- forbidden_paths: `docs/agents/tasks.json`, `docs/product/**`, `supabase/**`, `vendor/**`, `src/simulation/**`, mọi `.env*`.

Constraints: local-first; tự viết SVG, không thêm thư viện chart; hàm đo thuần, không phụ thuộc DOM; không gọi trace giáo dục là "đo thật"; cursor thao tác được bằng phím mũi tên và có `aria-valuetext`.

Approval boundaries: dừng hỏi trước khi xoá file, thêm dependency (kể cả thư viện FFT), đổi schema dữ liệu quan sát.

Done when:
- Test thuần hàm: RC golden cho ΔV khớp, blink cho 2,03 Hz ± 0,05 và duty 50 % ± 1 %.
- `npm.cmd test` exit 0; `npm.cmd run typecheck` exit 0; `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0 (nếu 01 đã xong).

Report: file đã đổi; lệnh + exit code; ghi rõ dữ liệu nào là mô phỏng/giáo dục.
