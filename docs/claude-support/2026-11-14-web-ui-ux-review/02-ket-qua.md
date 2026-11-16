# 02 — Kết quả Giai đoạn 3–4: sửa, nâng cấp và xác minh

Ngày: 2026-11-14 · Người làm: Claude · Phạm vi duyệt ở Checkpoint A: cải tiến #1–#6 và #8 trong [01-audit-va-so-sanh.md](01-audit-va-so-sanh.md). Ngôn ngữ thị giác theo [00-style-reference.md](00-style-reference.md).

Mặc định đã chọn cho 3 câu hỏi founder chưa trả lời riêng: (1) trang chủ `/` và `/app` dùng khung cuộn nội bộ như #8, không đổi luồng trang giới thiệu; (2) không thêm font Barlow, dùng `Bahnschrift SemiCondensed` có sẵn; (3) #7, #9, #10 để sau.

## 1. File đã sửa

Chỉ liệt kê thay đổi của phiên này. Repo đã có nhiều file sửa dở trước phiên (ví dụ `AssemblyStage.tsx`, `lib/*.ts`, phần khác của `e2e/journeys.spec.mjs`) — không động tới.

| File | Thay đổi |
|---|---|
| `src/styles/tokens.css` | Thêm token `--mm-*` (màu, chữ, radius, thời lượng, easing, kích thước khung); ánh xạ `--paper`, `--line`, `--focus-ring`, `--ink-soft`, `--ink-faint` sang token mới |
| `src/styles/one-screen.css` (mới) | Khung 1 màn hình ≥1280×720; layout stage + panel cho lab và bài học; tab bài học; dock; focus ring; tương phản AA |
| `src/App.tsx` | Import `one-screen.css` |
| `src/components/SiteShell.tsx` | Bọc `main` + `footer` trong `.site-scroll` (vùng cuộn nội bộ) |
| `src/styles/app.css` + 12 file CSS trang/component* | Thay màu cứng `#e8f2f2…` → `--mm-surface`; `#2dd4c5…`/`#58dfd0`/`#147f91`/`#1576a1`/`#119889` → `--mm-signal` (thay cơ học bằng perl, giữ alpha) |
| `src/pages/CircuitBuilderPage.tsx` | Bọc JSX thành `builder-topline` / `builder-workbench` (`builder-guide` + lưới + `builder-guide-after`) / dock; sửa tự cuộn khi tải; nối nhãn tín hiệu trace và LED sáng vào breadboard |
| `src/components/builder/BuilderStepper.tsx` | ✓ chỉ hiện cho bước đứng trước bước hiện tại |
| `src/pages/LessonPage.tsx` | Bài học thành stage (mạch + luồng lệnh) + panel 5 tab (`role=tablist/tab/tabpanel`, phím ←/→/Home/End) + dock chuyển phần; animation đổi tab bằng Web Animations API |
| `src/components/builder/BreadboardDiagram.tsx` | Prop `traceLevel`, `wireSignals`, `litPartIds`: viền dây theo mức, pill `HIGH/LOW/VCC/GND`, dash chạy khi tín hiệu "chạy", LED sáng |
| `src/components/builder/BreadboardEditor.tsx` / `.css` | Chuyển prop xuống diagram; CSS pill/dash/LED; dash chỉ chạy khi `prefers-reduced-motion: no-preference` |
| `src/components/lesson/LessonCircuitWorkspace.tsx` | `LessonCircuitFlow.level`; truyền mức + LED sáng |
| `src/components/lesson/ButtonLedLessonLab.css` | Cập nhật selector khung riêng của bài nút nhấn cho lớp `.site-scroll` mới |
| `src/pages/ElectronicsCalculatorsPage.tsx` | Vùng kết quả hiện câu chung khi đã có lỗi theo ô |
| `tests/lesson-circuit-workspace.test.mjs` | Thêm assertion `level` |
| `e2e/one-screen-layout.spec.mjs` (mới) | Kiểm không cuộn dọc ở 1440/1366, không cuộn ngang ở 375, tab bài học, pill tín hiệu |
| `e2e/journeys.spec.mjs` (1 test) | Test "lesson code steps…": thêm 2 bước bấm tab (Code, Board và pinout) trước khi dùng control nằm trong tab. Không bỏ assertion nào |

\* `AppWorkspaceNavigation.css`, `SiteNavigation.css`, `builder/AssemblyStage.css`, `builder/ScenarioPredictionChallenge.css`, `builder/SevenSegmentChallenge.css`, `builder/SimulationInstrumentsPanel.css`, `pages/AppHomePage.css`, `ClassroomKitPage.css`, `ElectronicsCalculatorsPage.css`, `FirmwareHexToolPage.css`, `RobotSimulationLessonPage.css`, `SpiceWorkbenchPage.css`.

Không sửa: `supabase/**`, `firmware/**`, `docs/hardware/**`, `vendor/**`, `scripts/check-public-release-gates.mjs`, cấu hình build/CI, `package.json`. Không thêm dependency.

## 2. Lỗi đã sửa (map về 01)

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| MM-UX-01 | Đã sửa: 0/52 lượt đo desktop (26 route × 2 viewport) còn cuộn dọc (trước: 44/52) | Bảng mục 4; `screenshots/review-2026-11-14/after/audit-results.json`; e2e `one-screen-layout.spec.mjs` pass |
| MM-UX-02 | Đã sửa: canvas ở stage giữa; nút chạy/dừng trong dock luôn thấy (nút "Tạm dừng mô phỏng" ở đáy khung 900px) | `after/interact/lab-02-lap-mach.png`, `after/interact/lab-05-run.png` |
| MM-UX-03 | Đã sửa: ở bước 2 chỉ "Chọn bài" có ✓ | `after/interact/lab-02-lap-mach.png` |
| MM-UX-04 | **Chưa sửa**: chưa thêm lý do khóa cạnh nút chế độ; banner "Tạo bản nháp để chỉnh sửa" vẫn ở stage | — |
| MM-UX-05 | Đã sửa: bài học 1 màn hình, panel 5 tab | `after/app-lesson-1440x900.png`, `after/interact/lesson-high.png` |
| MM-UX-06 | Một phần: không cuộn trang, nhưng danh sách board vẫn cuộn trong vùng nội dung (master–detail #9 chưa làm) | `after/app-boards-1440x900.png` |
| MM-UX-07 | Đã sửa: chỉ cuộn khi bước đổi thật, `block:'nearest'` | `after/app-lab-1440x900.png` (h1 thấy ở đầu) |
| MM-UX-08 | Đã sửa trong code; **chưa chụp lại** ảnh nhập số âm | `ElectronicsCalculatorsPage.tsx` (`FIELD_ERROR_SUMMARY`); unit test calculator a11y vẫn pass |
| MM-UX-09 | Chưa xử lý, chưa kiểm lại | — |
| MM-UX-10 | Hết do bỏ thanh nhảy dính, thay bằng tablist | `after/app-lesson-1440x900.png` |
| MM-UX-11 | Một phần: mức logic trên dây + LED sáng từ trace thật (bài LED, lab V2). Chưa có probe/đồ thị/dòng điện SPICE (#7) | `after/interact/lesson-high.png`; e2e "lesson wires show the trace level…" pass |
| a11y phát sinh khi đo | Đã sửa tương phản: chữ phụ trong mạch bài học, `.card-kicker`, `.capability-badge--reference`, `.robot-obstacle-button` | axe (serious/critical) 0 lỗi trên 12 route × 375/1440; e2e accessibility pass |

Về độ trung thực số liệu: pill `HIGH/LOW` và LED sáng lấy từ `getLessonCircuitFlow` (bài LED) và `traceCircuitDocV2().flows` + `deriveOutputState().ledLit` (lab). Đây là **trace logic bài học, không phải điện áp/dòng điện đã giải**; nhãn sẵn có trong UI ("Trace logic của bài học; không tính dòng/áp") giữ nguyên. Không có số đo nào được vẽ bằng animation. Dash chạy chỉ khi trace báo tín hiệu và dừng khi trace về null. "Bàn thử nhịp" ở tab Board đổi nhãn thành "Minh họa: …".

## 3. Đối chiếu phong cách với 00-style-reference

| Pattern | Áp dụng | Ghi chú |
|---|---|---|
| Nền kem + navy + 1 accent | Có, mọi trang (token + thay màu cứng) | Accent đỏ gạch Mạch Mở, tín hiệu teal đậm — không trùng teal LAR |
| Tiêu đề condensed | Có (Bahnschrift SemiCondensed) | Tab bài học UPPERCASE như LAR |
| Bài 1 màn hình: stage giữa, panel tab phải, dock dưới | Có cho lab và bài học LED | Trang danh mục/công cụ chỉ có khung cuộn nội bộ, chưa có stage |
| Callout neo trên scene | **Chưa** | Chưa làm |
| Tín hiệu trên dây do trạng thái mô phỏng điều khiển | Có (pill + dash + LED) | Chưa có dòng điện SPICE |
| Reduced motion | Có cho phần thêm mới (dash, transition, đổi tab) | |

So từng cặp ảnh before/after (`screenshots/review-2026-11-14/*.png` ↔ `after/*.png`): nền xám-teal `#e8f2f2` đổi sang kem `#fbf6ec` ở rail, panel, card; lab và bài học chuyển từ trang tài liệu dài sang workspace. Khác biệt còn lại so với LAR: minh họa là breadboard 2D/3D hiện có của Mạch Mở (không phải isometric cel-shading); header bài học còn cao (~150px); trang chủ vẫn là landing cuộn trong khung.

## 4. scrollHeight trước/sau (px, viewport desktop)

| Route | 1440×900 trước → sau | 1366×768 trước → sau |
|---|---|---|
| `/` | 3105 → 900 | 3105 → 768 |
| `/app` | 4299 → 900 | 4299 → 768 |
| `/app/learn` | 2643 → 900 | 2643 → 768 |
| `/app/learn/esp32-led` | 8575 → 900 | 8647 → 768 |
| `/app/robot-simulation` | 1464 → 900 | 1464 → 768 |
| `/app/boards` | 9895 → 900 | 10028 → 768 |
| `/app/components` | 2704 → 900 | 2724 → 768 |
| `/app/lab` | 2351 → 900 | 2351 → 768 |
| `/app/projects` | 4021 → 900 | 4115 → 768 |
| `/app/classroom-kits` | 2014 → 900 | 2070 → 768 |
| `/app/tools/calculators` | 1375 → 900 | 1375 → 768 |
| `/app/tools/firmware` | 1005 → 900 | 897 → 768 |
| `/app/tools/spice` | 1954 → 900 | 1970 → 768 |
| `/boards`, `/components`, `/build`, `/topics`, `/projects` | 9693 / 2625 / 2347 / 2639 / 4017 → 900 | → 768 |
| `/learn/esp32-led`, `/tools/electronics-calculators`, `/tools/spice` | 8538 / 1371 / 1783 → 900 | → 768 |
| `/tools/firmware-hex`, `/privacy`, `/admin`, `/admin/login`, 404 | 900 → 900 | ≤768 → 768 |

375×812: mọi route vẫn cuộn dọc (cho phép); `scrollWidth ≤ innerWidth` ở cả 26 route.

## 5. Kiểm tra đã chạy (lượt cuối, sau mọi sửa)

| Lệnh | Kết quả | Log |
|---|---|---|
| `npm.cmd run typecheck` | exit 0 | `D:/StartupOS/final-typecheck.log` |
| `npm.cmd test` | 544 tests, 544 pass, 0 fail | `D:/StartupOS/final-test.log` |
| `npm.cmd run build:local` | exit 0 (`✓ built`) | `D:/StartupOS/final-build.log` |
| `npm.cmd run test:e2e` | **exit 1, không chạy được test**: `[WebServer] Error: Port 5196 is already in use`. Port bị một `vite preview` (PID 33356, khởi động 01:06, trước phiên) giữ; Claude không được phép dừng process này | `D:/StartupOS/final-e2e-official.log` |
| Playwright cùng bộ spec, cùng dist, config tạm port 5208 (scratchpad, không sửa config repo) | **70 passed, 3 failed** | `D:/StartupOS/final-e2e-alt.log` |

3 test fail đều **đã fail ở baseline trước khi sửa** (baseline: 65 passed, 3 failed, cùng 3 test):
- `journeys.spec.mjs:35` "3D event marker excludes selected pins outside the current frame" ở 1440px và 375px: `.assembly-pin-marker` không chứa "GPIO 18".
- `journeys.spec.mjs:812` "3D lesson preview ignores stale legacy parts…": không thấy text "Đang xem trước topology mạch v5".

Lượt e2e đầu sau sửa có 14 fail (11 mới). Nguyên nhân: selector `.site-frame:has(.button-lab) > main` hỏng do lớp `.site-scroll`; regex pill mất escape; 1 test cũ cần mở tab. Đã sửa cả ba; lượt cuối còn đúng 3 fail baseline.

Kiểm tra khác: axe (wcag2a/aa, 21a/aa, 22aa; serious/critical) trên dev server: 0 lỗi ở 12 route × 375/1440.

**Chưa chạy**: kiểm bàn phím toàn trang; Lighthouse; trình duyệt khác Chromium; thiết bị thật. Ảnh after chụp từ dev server (Vite); e2e chạy trên bản build.

## 6. Mục chưa làm và lý do

| Mục | Lý do |
|---|---|
| #7 probe node + đồ thị + dòng điện SPICE có hướng/độ lớn | Founder để sau; cần đưa kết quả eecircuit-engine vào sơ đồ |
| #9 boards master–detail, #10 logic analyzer avr8js | Để sau |
| MM-UX-04 lý do khóa ngay cạnh nút chế độ | Chưa làm lượt này |
| Callout neo kiểu LAR trên scene | Ngoài #1–#6/#8 |
| Trang chủ 1 màn hình thật (hero + panel tab) | Thay đổi luồng sản phẩm, cần founder quyết |
| MM-WEB-01/02/04 (P0 kế thừa 13/11) | Chưa tái kiểm; không thuộc phạm vi duyệt |
| Skill | Đã gọi `anthropic-skills:built-in-browser`. Các skill Giai đoạn 3–4 trong prompt chưa gọi để giữ ngân sách ngữ cảnh; thay bằng axe + Playwright + đo trực tiếp |
| Port 5196 | Founder cần dừng process `vite preview` PID 33356 rồi chạy lại `npm.cmd run test:e2e` để có kết quả lệnh chính thức |

## 7. Bổ sung: cải tiến #7 — probe SPICE (founder duyệt sau Giai đoạn 4)

### Cách lấy số
- Ngspice (eecircuit-engine) chỉ trả dòng nhánh của nguồn áp. Worker chèn **nguồn 0 V nối tiếp** mỗi R/C/L/D sau khi netlist qua `inspectSpiceNetlist` (ammeter SPICE chuẩn): `R1 A B 1k` → `R1 A __mmp_r1 1k` + `vmmp_r1 __mmp_r1 B DC 0`. Nguồn 0 V không làm đổi điện áp/dòng của mạch.
- Kết quả được đổi tên `i(vmmp_r1)` → `i(r1)`; điện áp nút phụ `v(__mmp_*)` bị bỏ. Netlist người học trong editor không đổi.
- Dấu: `i(x) > 0` = dòng qua phần tử từ nút thứ nhất sang nút thứ hai trong dòng netlist (cùng quy ước nguồn của ngspice). Với phân tích AC, worker chỉ giữ độ lớn → UI ghi `|I|`, không vẽ chiều.

### UI (trang `/tools/spice` và `/app/tools/spice`)
- **Sơ đồ đo · nút và nhánh**: tự dựng từ netlist. Mỗi nút là điểm đo áp, mỗi phần tử hai cực là một nhánh. Độ dày nét theo |I| so với nhánh lớn nhất; ký hiệu → ← ↑ ↓ và vạch chạy theo chiều dòng. Vạch chạy nhanh hơn khi |I| lớn; tắt khi `prefers-reduced-motion`. Q/M (nhiều chân) chưa vẽ, có ghi chú.
- Bấm (hoặc Tab + Enter) một nút/nhánh → chọn probe, đồ thị chuyển sang `v(nút)` hoặc `i(phần tử)`.
- **Thời điểm đo**: slider theo trục thời gian/tần số; sơ đồ, dòng đọc probe và đường con trỏ trên đồ thị cùng đổi theo điểm dữ liệu được chọn.
- Dòng đọc probe ghi rõ: số từ ngspice; dòng qua R/C/L/D đo bằng nguồn 0 V Mạch Mở chèn; mô phỏng, không phải phép đo thực. Bố cục sơ đồ là minh họa, không phải schematic gốc.

### File
| File | Thay đổi |
|---|---|
| `src/simulation/spiceProbes.ts` (mới) | `parseSpiceTopology`, `instrumentSpiceNetlist`, `cleanProbeSeries`, `probeValue`, `formatEngineering` |
| `src/simulation/spice.worker.ts` | Chèn ammeter trước khi giải; làm sạch tên series |
| `src/components/spice/SpiceProbeMap.tsx` / `.css` (mới) | Sơ đồ đo, probe chọn bằng chuột/bàn phím, vạch dòng |
| `src/pages/SpiceWorkbenchPage.tsx` | Lưu netlist cùng kết quả; slider thời điểm đo; dòng đọc probe; con trỏ trên đồ thị |
| `tests/spice-probes.test.mjs` (mới) | 4 test, gồm 1 test chạy **ngspice thật trong Node**: `v(out)=2,5 V` không đổi, `i(r1)=i(r2)=2,5 mA`, `i(v1)<0` |
| `e2e/spice-probes.spec.mjs` (mới) | Bộ chia áp: nút `out` = 2,5 V, R1 = 2,5 mA chiều in→out; RC: kéo slider đổi số đọc, có con trỏ trên đồ thị |

### Số đo trên trình duyệt (dev server, ngspice WASM)
| Ví dụ | Kết quả đọc từ probe |
|---|---|
| Bộ chia áp `.op` | v(out) = 2,5 V; i(r1) = i(r2) = 2,5 mA (in→out→0); i(v1) = −2,5 mA |
| LED + 330 Ω `.op` | v(anode) = 1,4334 V; i(r1) = i(d1) = 10,81 mA |
| RC `.tran` tại 2,822 ms | i(c1) = 3,771 mA chiều out→0 (tụ đang nạp) |

Ảnh: `screenshots/review-2026-11-14/after/interact/spice-probe-led-op.png`, `spice-probe-rc-tran.png`.

### Kiểm tra (sau #7)
| Lệnh | Kết quả | Log |
|---|---|---|
| `npm.cmd run typecheck` | exit 0 | `D:/StartupOS/p7-typecheck.log` |
| `npm.cmd test` | 548 tests, 548 pass, 0 fail | `D:/StartupOS/p7-test.log` |
| `npm.cmd run build:local` | exit 0 | `D:/StartupOS/p7-build.log` |
| `npm.cmd run test:e2e` | exit 1, `Port 5196 is already in use` (cùng nguyên nhân mục 5) | `D:/StartupOS/p7-e2e-official.log` |
| Playwright port 5208 | **72 passed, 3 failed** — đúng 3 test fail từ baseline | `D:/StartupOS/p7-e2e-alt.log` |
| axe `/tools/spice` 375/1440 | 0 lỗi serious/critical (trang chưa chạy mô phỏng) | — |

### Giới hạn còn lại
- Chưa có probe trong phòng lắp mạch (lab dùng trace logic, không dùng SPICE). Chuyển mạch lab sang SPICE dùng handoff sẵn có rồi xem probe ở trang SPICE.
- Bấm chuột vào nhánh dọc phải trúng nét/nhãn; vùng bấm rộng 18px quanh nét.
- axe chưa chạy trên trạng thái đã có kết quả.
