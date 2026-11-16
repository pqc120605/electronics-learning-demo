# MM-SW-P0-V2-TRACE-001 — implementation report

Date: 2026-11-14  
Scope: giáo dục/guest workspace; trace topology CircuitDocV2 cho hai bài đã có (`blink`, `button-led`). Đây không phải solver điện, firmware runtime hay phép đo.

## Thay đổi

- `src/lib/logicTraceV2.ts`: adapter dùng net index CircuitDocV2 (gồm pin, lỗ, dải breadboard và dây khai báo), rồi ánh xạ trạng thái bài học về đúng `wireIds`/pin keys của tài liệu. Dây tổng hợp chỉ tồn tại trong adapter; không lưu thành dây thật. Hướng luồng luôn `none` để không bịa chiều dòng điện.
- `src/pages/CircuitBuilderPage.tsx`: cho phép chạy/step trên `blink` và `button-led` khi có provider và topology qua các cổng chặn; bài khác hoặc lỗi G1–G4/G8 giữ fail-closed. Chiếu cùng kết quả tới breadboard, schematic, panel trạng thái và 3D.
- `src/components/builder/AssemblyStage.tsx`, `src/components/builder/BuilderToolbar.tsx`: hiển thị flow V2 trong 3D, chuyển endpoint pin/lỗ tường minh và nêu lý do khóa Run.
- `tests/logic-trace-v2.test.mjs`: sáu hồi quy cho LED bật/tắt, nút nhấn, mất dây, lỗi cấu trúc, bài chưa được hỗ trợ.
- `e2e/workspace-interaction-regressions.spec.mjs`: thêm một ca dự kiến kiểm tra Run và cross-view breadboard→schematic→3D. Ca này chưa có kết quả chạy do Playwright runner không trả kết quả.

## Kiểm chứng

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 tests/logic-trace-v2.test.mjs tests/lesson-circuit-docs.test.mjs tests/circuit-gates.test.mjs tests/circuit-schematic-v2.test.mjs` | **exit 0, 25/25** |
| `node --max-old-space-size=1024 node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` | **exit 0** |
| `npm.cmd run typecheck` | **exit 134**: Node/V8 `Zone Allocation failed` trong môi trường hiện tại. Cùng compiler/project chạy trực tiếp với heap 1 GB ở dòng trên đã exit 0. |
| `$env:NODE_OPTIONS='--max-old-space-size=1024'; npm.cmd run build:local` | **exit 0**; Vite build thành công, 292 modules. |
| `git diff --check` trên các file implementation đã tracked | **exit 0**; chỉ có cảnh báo đổi LF→CRLF từ Git. File E2E mới/untracked được kiểm riêng, không có whitespace cuối dòng. |
| Playwright trực tiếp: `node node_modules/@playwright/test/cli.js test e2e/workspace-interaction-regressions.spec.mjs -g 'CircuitDocV2 lesson trace'` | **NOT_VERIFIED**: preview server được gọi nhưng không có kết quả test trong 60 giây; dừng runner bằng Ctrl+C, không tính pass. |
| Kiểm tra thủ công qua trình duyệt | **NOT_RUN**: browser mặc định đang giữ service worker cũ và workspace local báo dữ liệu không hợp lệ; tab cách ly không kết nối được localhost. Không đặt lại/xóa dữ liệu trình duyệt. |

Một lượt chạy ba file gate/schematic song song trước đó thất bại ở khởi tạo native memory; lượt chạy tuần tự ở trên đạt 25/25. Không chạy toàn bộ suite trong báo cáo này.

## SHA-256 snapshot

```text
DCDD435B4DF0FCB3E3461BEA35470876B1191D1038F2A90A42365C8604A3CFDD  src/lib/logicTraceV2.ts
0D078D0681CCA306CC66B2818AA3A272EF14D51C31B3F8B0A93AC59E12E3A54E  tests/logic-trace-v2.test.mjs
570BAD410D7662EAFECF17AF8902A7CB17AA8FDE54E2482EC908A3572136F4B9  src/components/builder/AssemblyStage.tsx
D21F339410EB92EB1C20D2F4A67F9477BAE15B9E4BFC153CF90986919DF6A7B7  src/components/builder/BuilderToolbar.tsx
6C47B0185A635569C573797865BDBB3D43D8EAC9E17E93BE18C5BBBB77307636  src/pages/CircuitBuilderPage.tsx
F6E894A1C1FBE2A0ECF7BEDD43E5CC44E12B30A7BD9EAE7D2084F1B4D42484DB  e2e/workspace-interaction-regressions.spec.mjs
```

## Còn mở

- Chỉ `blink` và `button-led` có hợp đồng trace CircuitDocV2. Bài khác vẫn báo unsupported, không dùng topology/trace legacy để giả lập.
- E2E browser, keyboard/pointer cross-view và trạng thái trên browser sạch cần chạy lại khi runner/localhost khả dụng.
- Các khoảng cách cạnh tranh còn lại trong audit (đầy đủ 11 mạch V2, thao tác dây end-to-end, cross-probe mọi view/part, mô phỏng analog/firmware có provider phù hợp, provenance toàn catalog) chưa được giải quyết bởi lát cắt này.
- Queue chuẩn ở `D:/StartupOS/docs/agents/tasks.json` không được sửa; không tự đánh dấu task/destination đã hoàn tất.
