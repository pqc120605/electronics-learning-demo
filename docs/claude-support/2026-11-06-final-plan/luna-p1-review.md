# Review Luna P1-01…P1-05 (07/11/2026) · Leader Claude, chỉ đọc

Phương pháp: một subagent chỉ đọc đối chiếu code với prompt và báo cáo `D:\StartupOS\docs\agents\runs\MM-SW-P1-L01..L05`, tự chạy lại lệnh. Cả `electronics-learning-demo/` là untracked trong git cha nên không có `git diff`. Tôi chưa tự kiểm lại từng finding; không có finding mức High trở lên.

## Lệnh đã chạy lại (subagent)
`npm.cmd run typecheck` exit 0; `npm.cmd test` exit 0 (371/371, tuần tự); `npm.cmd run build:local` exit 0; `npm.cmd run test:e2e` exit 0 (30/30, gồm 2 ca Tab+Enter mới). Chưa chạy: lint (không có script), axe, offline thật, WebGL.

## Kết luận từng slice
| Slice | Kết luận | Ghi chú |
|---|---|---|
| P1-01 | ACCEPT | file đổi: `src/lib/builderGuidance.ts`, `e2e/journeys.spec.mjs`; gốc lỗi thật là selector "Tiếp tục viết code" bị trùng; nhãn guidance đổi thành "Bắt đầu lắp mạch →" (hơn mức "đổi nhãn nhỏ nhất") |
| P1-02 | ACCEPT-có-điều-kiện | thiếu test UI cho `role="status"`; cờ `draftSaveFailed` dính vĩnh viễn |
| P1-03 | ACCEPT-có-điều-kiện | phím R/Delete/mũi tên từ nút chân còn bubble lên linh kiện; `onFocus` 3D đổi linh kiện chọn khi Tab vào chân; chưa phủ WebGL |
| P1-04 | ACCEPT-có-điều-kiện | chưa có test offline thật; `activate` xóa cache cũ cùng `skipWaiting`/`clients.claim` |
| P1-05 | ACCEPT | `build:local` dùng `tsc -b` không có heap |

## Findings (không có High)
- **Medium · P1-02:** `tests/draft-storage-errors.test.mjs:17-31` chỉ test `saveDraft`, không test cảnh báo UI ở `CircuitBuilderPage.tsx:971`. Sửa: một ca e2e ép `localStorage.setItem` ném lỗi, assert đúng một `getByRole('status', {name:/Không lưu được bản nháp/})`.
- **Low · P1-02:** `CircuitBuilderPage.tsx:352,679-680,971`: cờ lỗi không reset khi ghi thành công; vùng `role="status"` chèn vào DOM cùng lúc với nội dung nên một số trình đọc màn hình bỏ lỡ. Sửa: luôn render container rỗng, reset cờ khi ghi thành công.
- **Low · P1-03:** `SchematicView.tsx:114`, `Assembly3DView.tsx:57` chỉ chặn bubble Enter/Space. Sửa: kiểm `event.target === event.currentTarget` ở handler của part. Câu hỏi: đây có phải ý định không.
- **Low · P1-03:** vòng Tab tìm chân thứ hai lặp tối đa 40 lần (`journeys.spec.mjs:58`), chỉ chứng minh "tới được", không chứng minh thứ tự Tab; ca 3D chỉ phủ fallback.
- **Low · P1-04:** `tests/service-worker-cache-version.test.mjs:76-80` kiểm đăng ký bằng regex trên mã nguồn (tautology); chưa có test `fetch`/`navigate` offline; chunk lazy của bản cũ có thể mất sau `activate`. Chưa thử trên trình duyệt thật.
- **Low · P1-05:** thêm heap cho `build:local` nếu lỗi hết heap quay lại.
- Báo cáo Codex khớp thực tế: 371/371, 30/30, build 0. Không phát hiện "nói làm mà code không có".

## Việc tiếp theo (thứ tự đề xuất)
1. **P1-L06 (Luna, nhỏ) vá điều kiện:** e2e cảnh báo lưu nháp; reset cờ và render container luôn có; chặn bubble phím ở nút chân (≤5 file, không phụ thuộc). Claude review: KHÔNG.
2. **P1-X01 codec project (WA-07, CẦN SOL, Claude review CÓ vì đổi schema lưu):** phụ thuộc P1-L01..L03 (đã xong). Lưu cục bộ là nơi lưu duy nhất, WA-02 vừa làm lộ đường lưu nháp. Prompt chưa viết.
3. **P1-X04 cổng ngspice WASM (WA-12):** chờ D5. **P1-X03 spike ESP32 runtime (WA-10):** chờ D13. Hai việc này chỉ phụ thuộc quyết định founder; chốt sớm để không chặn P6 và P4.
4. **P1-X02 K-RUN (WA-08, CẦN SOL, Claude review CÓ):** sau X01; phụ thuộc D4 (đã chốt) và hợp đồng `MM-RUN-001`.
5. **Offline e2e cho WA-11** (chunk lazy) gộp vào nhóm sau X01, không chặn X01.
