# Baseline kiểm tra — 2026-11-06

Tất cả chạy từ `D:\StartupOS\electronics-learning-demo`, Windows, `npm.cmd`. Output đầy đủ nằm ở scratchpad phiên (không lưu vào repo).

## 1. Lệnh bắt buộc

| Lệnh | Exit | Tóm tắt |
|---|---|---|
| `npm.cmd run typecheck` | 0 | `tsc -p tsconfig.app.json --noEmit` không lỗi. |
| `npm.cmd test` | 0 | `ℹ tests 367 · pass 367 · fail 0 · cancelled 0` (32,3 s). Lưu ý: ở phiên review trước, cùng lệnh chạy song song từng lỗi `spawn errno -4094` trong sandbox; lần này đạt. Xem `2026-11-06-review-webapp/findings.md` M4. |
| `npm.cmd run build:local` | 0 | Vite build xong `✓ built in 2.55s`; `CircuitBuilderPage` 185 kB (gzip 56 kB), `index` 311 kB. Ghi vào `dist/` (đã gitignore). |
| `npm.cmd run check:public-release` | **1** | Chặn: ngspice WASM chưa cleared; thiếu 5 điều kiện (status, source commit, recipe/toolchain, inventory, review gắn hash). Artifact `/vendor/eecircuit-engine/spice.wasm`, SHA-256 `ed799542…ae886e4`. |

## 2. E2E (Chromium có sẵn tại `D:\StartupOS\.tools\mach-mo-review\playwright\chromium-1248`, không cài thêm)

`npm.cmd run test:e2e` → exit 1, **25 passed, 3 failed** (4,1 phút).

- Pass gồm 16 ca axe (`accessibility.spec.mjs`: 8 route × 375/1440 px), và các journey: curriculum→lesson, kéo dây bằng chuột thật + undo, XIAO S3 viewer, HEX firmware D13, SPICE RC + export, lưu/mở/nhập/xuất project, định danh portable.
- **3 fail đã kiểm chứng**, cùng nguyên nhân:
  - `journeys.spec.mjs:134` library identity round trip; `:249` ×2 slow Builder import (confirm/cancel).
  - `strict mode violation: getByRole('button',{name:'Tiếp tục lắp mạch',exact:true}) resolved to 2 elements`: một nút trong region "Việc cần làm tiếp theo" (`components/builder/BuilderGuidancePanel.tsx`, nhãn từ `lib/builderGuidance.ts:51`) và một nút `button-primary` (`pages/CircuitBuilderPage.tsx:1018`) trùng nhãn cùng lúc.
  - Kết luận: UI hiện hai nút cùng tên (mơ hồ cho screen reader và test) → hạng mục WA-01. Chưa phân biệt được là bug UI hay test cần đổi selector; đề xuất sửa UI trước.
- Phụ: e2e ghi `.tmp/playwright-report` và `.tmp/playwright-results` trong repo (do cấu hình).

## 3. Dev server + route (headless Chromium qua `@playwright/test`, 1440×900)

Dev server: `vite --host 127.0.0.1 --port 5180` (nền; đã tắt, xác nhận bằng request cuối "dev down"). Không dùng built-in browser pane vì pane không mở được localhost do phiên khác khởi chạy; thay bằng Playwright cùng Chromium.
Ảnh: `screenshots/*.png`; số liệu thô: `screenshots/routes.json`.

| Route | Kết quả | Host ngoài | Request lỗi | Console error | Cần mạng/tài khoản |
|---|---|---|---|---|---|
| `/` | ok | không | 0 | 0 | không |
| `/app` | ok | không | 0 | 0 | không |
| `/app/learn` | ok | không | 0 | 0 | không |
| `/app/learn/esp32-led` | ok | không | **1** | 0 | không |
| `/app/boards` | ok | không | **1** | 0 | không |
| `/app/components` | ok | không | 0 | 0 | không |
| `/app/lab` | ok | không | 0 | 0 | không |
| `/app/projects` | ok | không | 0 | 0 | không |
| `/app/classroom-kits` | ok | không | 0 | 0 | không |
| `/app/tools/calculators` | ok | không | 0 | 0 | không |
| `/app/tools/firmware` | ok | không | 0 | 0 | không |
| `/app/tools/spice` | ok | không | 0 | 0 | không (WASM phục vụ từ chính origin) |
| `/privacy` | ok | không | 0 | 0 | không |
| `/admin`, `/admin/login` | ok | không | 0 | 0 | **cần Supabase + tài khoản** (hiện "chưa kết nối"; tùy chọn) |
| `/no-such-route` | ok (404 của app) | không | 0 | 0 | không |

- **Local-first đạt ở mức tải route**: 0 host ngoài ở cả 16 route, không lỗi console. Chưa thử: tắt mạng hoàn toàn sau khi tải, chạy mô phỏng sâu từng route, service worker (chỉ đăng ký ở bản production).
- Cần kiểm tra thêm: `requestfailed` = 1 ở `/app/learn/esp32-led` và `/app/boards` (chưa rõ request nào; có thể là tải GLB bị hủy khi rời trang).

## 4. Chưa chạy / giới hạn

- `npm.cmd run build` / `build:public` (bị gate chặn, đã biết).
- Tắt mạng toàn phần, screen reader thật, touch thật, đo 768/1024 px.
- Không đọc `.env`; Supabase không cấu hình trong phiên này.
