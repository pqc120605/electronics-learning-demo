# Roadmap web app — 12 hạng mục, 3 giai đoạn (NHÁP cho Leader Claude duyệt)

Ràng buộc cứng áp dụng cho mọi hạng mục: **(1) local-first** (chạy đủ bằng `npm.cmd run dev` và `build:local`, không mạng, không tài khoản; Supabase/đăng nhập chỉ tùy chọn, bật sau; public chỉ sau `check:public-release`), **(2)** tích hợp năng lực từ P01–P25 (chỉ P-ID nhãn D làm chuẩn D3), **(3)** độ sâu ngang tham khảo (D3), không dừng ở demo bề mặt.
Thang: D0–D4 của feature-depth-register. Công sức: S ≤ 2 file, M 3–5 file, L > 5 file. Mức chặn local-first: 0 = không chặn, 1 = làm yếu trải nghiệm local, 2 = chặn hoàn toàn dùng local, P = chặn public.

## 1. Chấm gap (4 tiêu chí)

| ID | Gap | Giá trị học tập | Chặn local-first | Phụ thuộc | Công sức | Giai đoạn |
|---|---|---|---|---|---|---|
| WA-01 | Nền xanh: nút "Tiếp tục lắp mạch" trùng (e2e 3 đỏ), `strict` tắt, `test` song song không ổn định | Trung bình | 1 (không tin được kiểm thử) | — | S | G-A |
| WA-02 | Lưu nháp lỗi bị nuốt `catch{}` (`CircuitBuilderPage.tsx:677-678`) | Cao (mất bài làm) | 2 (local là nơi lưu duy nhất) | WA-01 | S | G-A |
| WA-03 | Chân linh kiện `<span onClick>` không thao tác bằng bàn phím (`SchematicView.tsx:114`, `Assembly3DView.tsx:57`) | Cao (a11y) | 1 | WA-01 | S | G-A |
| WA-04 | Workspace→SPICE chỉ `.op` (`workspaceSpice.ts:282`); chưa chọn analysis/tham số | Cao | 0 | WA-01 | M | G-A |
| WA-05 | Công cụ đo: cursor + phép đo trên waveform SPICE và trace logic (OBS-06) | Cao | 0 | WA-04 | M | G-A |
| WA-06 | BOM chưa có variant identity (contract §5, KIT-01) | Trung bình–cao (mua đúng vật tư) | 0 | EF xác nhận giá trị mặc định | M | G-B |
| WA-07 | Codec project: decode/normalize/unsupported theo contract §1 (PRJ-03/04) | Cao (độ bền dữ liệu) | 2 | WA-02 | M | G-B |
| WA-08 | Kênh quan sát hợp nhất K-RUN: nhiều kênh digital, serial hai chiều, plotter (OBS-01..03) | Cao | 0 | contract K-RUN (MM-RUN-001) | L | G-B |
| WA-09 | Đánh giá theo rubric + live criteria (LRN-06/08, K-EVID) | Rất cao | 0 | WA-08 một phần; thiết kế K-EVID | L | G-B |
| WA-10 | ESP32 runtime strategy (FW-11): quyết định engine/handoff | Rất cao (board học chính) | 1 | quyết định founder (Q2) | L (nghiên cứu) | G-B |
| WA-11 | Service worker: cache có phiên bản + chunk lazy offline + e2e offline | Trung bình | 1 (offline) | — | S | G-C |
| WA-12 | Cổng phát hành: ngspice WASM chưa cleared; profile public không SPICE | Thấp (không học) | P | quyết định founder (Q1) | L | G-C |

AI hỗ trợ (OPS-06/07) **không** đưa vào 12 hạng mục: bản đám mây vi phạm local-first, hiệu quả chưa kiểm chứng; chuyển thành câu hỏi Q3. Hướng dẫn theo luật cục bộ (`builderGuidance.ts`) có thể nâng sau WA-09.

## 2. Ba giai đoạn

### G-A — local core usable (nền đáng tin để dùng cục bộ)
Mục tiêu: `dev`/`build:local`/e2e xanh, không mất dữ liệu im lặng, thao tác được bằng bàn phím, SPICE/đo đủ dùng.
1. **WA-01** Nền xanh (S, 4 file). 2. **WA-02** Báo lỗi lưu nháp (S). 3. **WA-03** Nối chân bằng bàn phím (S/M). 4. **WA-04** Workspace→SPICE đa analysis (M). 5. **WA-05** Cursor + đo (M).
Checkpoint: `typecheck`, `test`, `build:local`, `test:e2e` (28/28) xanh; 16 route không host ngoài.

### G-B — depth parity (nâng nhóm D1/D2 lên D3)
6. **WA-06** BOM biến thể. 7. **WA-07** Codec project. 8. **WA-08** K-RUN capture. 9. **WA-09** Rubric/assessment. 10. **WA-10** ESP32 strategy.
Checkpoint: ít nhất 3 nhóm (SPICE, Instruments, Học) đạt D3 theo tiêu chí đo được dưới đây; ESP32 có quyết định kiến trúc.

### G-C — public readiness
11. **WA-11** Service worker/offline. 12. **WA-12** Gate phát hành.
Checkpoint: `npm.cmd run build` (gồm `check:public-release`) exit 0 hoặc profile public đã loại SPICE; kiểm tra offline.

## 3. Giải pháp từng hạng mục

Mọi dependency mới chỉ **đề xuất**, chưa chọn; không thêm khi chưa có approval.

### WA-01 Nền xanh
- Hướng: phân biệt/gộp hai nút "Tiếp tục lắp mạch" (giữ một hành động chính trong `BuilderGuidancePanel`, nút còn lại đổi nhãn/aria rõ nghĩa); thêm `"strict": true` vào `tsconfig.app.json` (đã kiểm: `tsc --strict` cho 0 lỗi trong phiên review-webapp); đặt `--test-concurrency=1` và `NODE_OPTIONS=--max-old-space-size=4096` trong script.
- File: `src/components/builder/BuilderGuidancePanel.tsx`, `src/lib/builderGuidance.ts`, `src/pages/CircuitBuilderPage.tsx`, `package.json`, `tsconfig.app.json`.
- Dependency: không. Rủi ro: đổi nhãn làm vỡ selector e2e/test khác → grep trước. 
- Tiêu chí D3 (nền): `npm.cmd run test:e2e` = 28 passed, 0 failed; `typecheck` exit 0 với strict; `npm.cmd test` pass 367+.

### WA-02 Báo lỗi lưu nháp
- Hướng: bắt lỗi `setItem` ở hai effect (`CircuitBuilderPage.tsx:677-678`), đặt trạng thái cảnh báo một lần với `role="status"`; không đổi schema.
- File: `CircuitBuilderPage.tsx`, test mới `tests/…` (storage quota giả). Dependency: không.
- Rủi ro: trang 1040 dòng khó sửa; giữ thay đổi tối thiểu. Tiêu chí: test giả lập `setItem` ném lỗi → cảnh báo hiện đúng một lần; nháp trong bộ nhớ không mất.

### WA-03 Nối chân bằng bàn phím
- Hướng: đổi pin `<span>` thành `<button type="button" aria-pressed aria-label>` ở `SchematicView` và `Assembly3DView`; cấp luồng chọn chân → chọn chân (Enter/Space) đồng bộ trạng thái `pending`.
- File: `SchematicView.tsx`, `Assembly3DView.tsx`, `e2e/journeys.spec.mjs` hoặc `e2e/accessibility.spec.mjs`, CSS liên quan. Dependency: không.
- Rủi ro: style `.part-pin` dựa vào `span`. Tiêu chí: e2e tạo một dây chỉ bằng bàn phím; 16 ca axe vẫn pass.

### WA-04 Workspace→SPICE đa analysis
- Hướng: mở rộng `compileWorkspaceSpice` để chọn `.op/.tran/.dc` cho mạch R/C/L/V đã hỗ trợ (kiểm bằng `spiceNetlist.ts` hiện có); UI chọn analysis + thông số hợp lệ, giữ chặn MCU/GPIO; kết quả quay về workspace theo fingerprint hiện có.
- File: `lib/workspaceSpice.ts`, `simulation/spiceNetlist.ts` (nếu cần), `pages/SpiceWorkbenchPage.tsx`, `tests/workspace-spice.test.mjs`. Dependency: không (ngspice WASM sẵn).
- Rủi ro: tên đơn vị, giới hạn 20 000 điểm, thời gian worker. Tiêu chí D3: tạo mạch RC trong workspace → chọn `.tran` → thấy đồ thị đúng τ trong dung sai khai báo → mở lại từ project lưu; test unit + e2e.

### WA-05 Cursor + đo
- Hướng: thêm hai cursor kéo bằng bàn phím/chuột trên waveform SPICE và `DigitalWaveform`; đo Δt, ΔV, tần số/duty từ mẫu thật; ghi rõ nguồn dữ liệu (sourceKind). Tự viết SVG, không thêm thư viện.
- File: `SimulationInstrumentsPanel.tsx`, `DigitalWaveform.tsx`, `lib/waveformMeasure.ts` (mới), test, CSS. Dependency: không.
- Rủi ro: không giả đo "thật" cho scenario subset. Tiêu chí: test thuần hàm đo trên golden RC (V/s) và blink 2,03 Hz; a11y cursor.

### WA-06 BOM biến thể
- Hướng: làm theo final-contracts §5: variant identity (family + value/unit + package), thiếu value = unknown, `bomKey` ổn định, CSV/UI/share pack cùng identity.
- File: `lib/classroomKit.ts`, `pages/ClassroomKitPage.tsx`, `data/…` (preset), `tests/classroom-kit.test.mjs`. Dependency: không.
- Rủi ro: giá trị mặc định cần EF xác nhận (không tự đoán 220 Ω); đổi schema kit → cần approval. Tiêu chí D3: hai điện trở khác value không gộp; test CSV/JSON round trip.

### WA-07 Codec project
- Hướng: `decode(raw) → {status, document?, rawBackup, unknownFields, issues}` + `normalizeProjectBundle` thuần/idempotent theo contract §1; fixture bắt buộc trong contract.
- File: `lib/projectBundle.ts`, `lib/savedProjects.ts`, `lib/workspaceStorage.ts`, `lib/projectTransfer.ts`, test. Dependency: không.
- Rủi ro: đổi schema dữ liệu (cần approval); e2e `:134` đang đỏ. Tiêu chí: tất cả fixture contract pass; unknown/future version → unsupported giữ raw.

### WA-08 K-RUN capture hợp nhất  — ĐỀ XUẤT SOL
- Hướng: kiểu `RuntimePayload`/`ObservationDataset` (contract §3); adapter cho subset, AVR (D13 + UART), SPICE; nhiều kênh digital, serial plotter.
- File chạm > 5 (contracts, adapters, panel, worker, 3 page). Cần thiết kế trước (MM-RUN-001).
- Dependency: không. Rủi ro: lớn. Tiêu chí D3: nhiều kênh, trục thời gian có đơn vị, truncated/stale hiển thị; golden examples contract §3 pass.

### WA-09 Rubric/assessment — ĐỀ XUẤT SOL
- Hướng: `AssessmentAttempt` (met/not-yet/ungradable) tách khỏi progress (contract §4); tiêu chí live trên trạng thái mạch; bắt đầu cho 3 bài analog.
- File > 5, thêm schema lưu trữ. Rủi ro: tránh gọi "chấm điểm" khi chỉ là code subset. Tiêu chí D3: bài có rubric → met/not-yet đúng với 2 mạch đúng/sai trong test.

### WA-10 ESP32 strategy — ĐỀ XUẤT SOL (nghiên cứu)
- Hướng: bảng khả thi cho (a) scenario/subset hiện có, (b) handoff Arduino IDE/`.ino`, (c) QEMU/Renode cục bộ (P24/P25) — chỉ nghiên cứu, không thêm dependency. Phụ thuộc Q2.
- Tiêu chí: tài liệu quyết định có: target/peripheral, giấy phép, OS/browser, artifact, expected/actual (theo reference-coverage §4.3).

### WA-11 Service worker
- Hướng: `CACHE_NAME` theo hash build, dọn entry cũ, precache chunk lazy theo manifest; e2e tắt mạng sau tải.
- File: `public/sw.js`, `src/lib/registerServiceWorker.ts`, `e2e/…`, `vite.config.ts` (nếu cần manifest). Dependency: không.
- Rủi ro: cache sai gây bản cũ kẹt. Tiêu chí: e2e production preview, offline mở `/app/lab`.

### WA-12 Gate phát hành — ĐỀ XUẤT SOL
- Hướng theo quyết định Q1: (a) đóng 5 điều kiện provenance, hoặc (b) profile build public loại SPICE route + WASM, giữ `build:local` đầy đủ. Không phải quyết định kỹ thuật thuần.
- Tiêu chí: `npm.cmd run build` exit 0 ở profile đã chọn; artifact không chứa WASM chưa cleared (kiểm bằng hash/gate).

## 4. Tiêu chí D3 đo được theo nhóm (tóm tắt)
- SPICE: tạo → chạy ≥3 analysis → đo bằng cursor → lưu/mở lại; test unit + e2e.
- Instruments: ≥2 kênh digital + serial hai chiều + đo; golden dataset.
- Học: rubric/live criteria; AssessmentAttempt tách progress.
- BOM/Project: variant round trip; codec fixture; e2e identity xanh.
- Firmware: quyết định ESP32 + (nếu chọn) compile handoff chạy end-to-end cục bộ.
- Board/Schematic/Chia sẻ/AI: chưa có hạng mục G-A/G-B riêng; giữ trong register, mở sau khi G-A/G-B xong.
