# 11 — Kế hoạch và hướng dẫn triển khai cho Codex: thiết kế lại UI/UX (đợt tiếp)

Ngày: 2026-11-15. Người viết: Claude, để founder chuyển cho Codex.
Hiện trạng và số liệu đợt trước: `10-thiet-ke-lai-ui-ux.md`. Đọc file đó trước.
Ngôn ngữ báo cáo: tiếng Việt. Không commit.

---

## 1. Tóm tắt cho Codex

Đợt 10 đã làm xong và đã kiểm chứng:
- Điều hướng 5 khu vực.
- Ba luồng chính, mỗi luồng ≤3 bước.
- Tour lần đầu và menu Trợ giúp.
- Lớp thị giác `redesign.css`.
- Sửa 3 e2e 3D.

Kết quả kiểm tra đợt 10: typecheck sạch; unit 623/623; e2e 119/119; axe serious 0 trên 76 lượt.

Việc của Codex là **làm tiếp 5 gói việc (WP1–WP5)** bên dưới. Không được làm tụt các con số trên. Mỗi gói kết thúc bằng bằng chứng từ tool.

| Gói | Nội dung | Ưu tiên | Ước lượng |
|---|---|---|---|
| WP0 | Xác minh nền (bắt buộc trước khi sửa) | — | 20 phút |
| WP1 | Cỡ chữ dễ đọc (468 khai báo 8–11px) | Cao | 0,5–1 ngày |
| WP2 | Chế độ tối theo giai đoạn | Trung bình | 2–3 ngày |
| WP3 | Tour cho bề mặt `/app` và trang Thư viện/Công cụ | Trung bình | 0,5 ngày |
| WP4 | Hoàn thiện nhỏ và dọn dẹp | Thấp | 1–2 giờ |
| WP5 | Kiểm tra cuối và báo cáo `12-…md` | Bắt buộc | 1–2 giờ |

Thứ tự bắt buộc: WP0 → WP1 → WP4 → WP3 → WP2 → WP5.
WP2 làm sau cùng vì nó đụng nhiều file nhất. Có thể dừng sau giai đoạn 2A nếu founder chưa duyệt bật mặc định.

---

## 2. Quyền cho phép (founder cấp cho Codex)

### 2.1 Được phép

- **Sửa/tạo file** trong:
  - `src/**`
  - `e2e/**`, `tests/**`
  - `index.html` (chỉ để chèn script đặt theme trước khi vẽ, ở WP2)
  - `.tmp/**`
  - `docs/claude-support/2026-11-14-web-ui-ux-review/**`. Ghi báo cáo mới `12-…md`; ảnh vào `img/12/`.
- **Lệnh chạy được** (Windows, dùng `npm.cmd`):
  - `npm.cmd run typecheck`
  - `npm.cmd test`
  - `npm.cmd run build:local`
  - `node node_modules/@playwright/test/cli.js test -c .tmp/pw-redesign.config.mjs [file]`
  - `node .tmp/route-audit.mjs <distDir> <port> <phase> [shots|axe|both]`
  - `git status` / `git diff` (chỉ đọc)
- **Mạng:** được tải từ internet để đọc tài liệu. Chỉ cài package mới khi đáp ứng cả bốn điều kiện:
  - đã đọc README và LICENSE;
  - license cho phép dùng;
  - cài với `--save-exact`;
  - ghi lý do vào báo cáo.
  Không cần package mới cho WP1–WP5.
- **Dùng app có sẵn trên máy:** Chromium của Playwright ở `../.tools/mach-mo-review/playwright`.

### 2.2 Cấm

- Không mở `.env` thật. Chỉ đọc `.env.example`.
- Không sửa `supabase/**`, `firmware/**`, `docs/hardware/**`, `vendor/**`, `assets/**`, `public/models/**`.
- Không đổi hay xoá URL công khai. Không xoá tính năng. Có thể gom hoặc ẩn link nhưng phải giữ route.
- Không copy code, asset hay chữ của Learn Arduino Red, Learn ESP32, Wokwi.
- Không nạp `@astryxdesign/core/astryx.css`, `reset.css` hay theme astryx. Chỉ dùng hook không cần CSS (hiện có `useFocusTrap`).
- Hiệu ứng chỉ dùng CSS/WAAPI. Không thêm thư viện animation. Mọi hiệu ứng phải tắt khi `prefers-reduced-motion: reduce`.
- Không `git commit`, `push`, `stash`, `reset`, đổi nhánh.
- Không tắt, skip hay nới test để có màu xanh. Test fail thì báo đúng sự thật. Chỉ sửa test khi test lỗi thời, và phải ghi lý do cạnh dòng sửa.
- Không xoá ảnh `img/10/**` (đó là bằng chứng của đợt trước).

### 2.3 Cấu hình Codex gợi ý

Founder tự quyết. Claude không sửa `~/.codex/config.toml`.

```toml
# chạy trong D:\StartupOS\electronics-learning-demo
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[sandbox_workspace_write]
network_access = true          # đọc tài liệu; không cài package nếu chưa ghi lý do
```

Nếu sandbox chặn Playwright mở Chromium hoặc mở port, cho phép riêng lệnh test. Không mở quyền toàn máy.

---

## 3. Skill áp dụng

Đường dẫn trên máy founder. Codex mở file `SKILL.md` để đọc; nếu không đọc được thì làm theo tóm tắt bên dưới.

| Skill | Đường dẫn | Dùng ở | Quy tắc phải theo |
|---|---|---|---|
| verification-before-completion | `~/.claude/plugins/cache/my-skills/my-skills/1.0.0/skills/verification-before-completion/SKILL.md` | Mọi gói | Chỉ nói "xong/đã sửa" khi có output lệnh của lần chạy mới nhất. Ghi lệnh và con số vào báo cáo. |
| systematic-debugging | `.../my-skills/1.0.0/skills/systematic-debugging/SKILL.md` | Khi test fail | Tái hiện → tìm nguyên nhân gốc → sửa nhỏ nhất → chạy lại. Không đoán, không sửa nhiều chỗ cùng lúc. |
| test-driven-development | `~/.claude/plugins/cache/addy-agent-skills/agent-skills/0.6.15/skills/test-driven-development/SKILL.md` | WP2, WP3 | Viết test e2e/unit trước, thấy test fail, rồi mới code. |
| accessibility-review | `.../my-skills/1.0.0/skills/accessibility-review/SKILL.md` | WP1–WP3 | WCAG 2.2 AA: tương phản ≥4.5:1 (chữ thường), ≥3:1 (chữ lớn, viền control); vùng bấm ≥24×24; focus thấy rõ; ARIA đúng vai trò. |
| frontend-design | `.../my-skills/1.0.0/skills/frontend-design/SKILL.md` | WP1, WP2 | Theo hệ token sẵn có, không tạo phong cách mới. Ưu tiên phân cấp chữ rõ ràng. |
| design-impeccable | `~/.claude/skills/design-impeccable/SKILL.md` | WP1, WP2 | Kiểm tra từng màn bằng ảnh chụp, không chỉ đọc CSS. |
| make-interfaces-feel-better, motion-foundations | `~/.claude/plugins/cache/ecc/ecc/2.2.3/docs/ja-JP/skills/{make-interfaces-feel-better,motion-foundations}/SKILL.md` | WP2 (chuyển theme), WP3 | Hiệu ứng 150–300 ms, easing `--mm-ease`; không làm nhảy layout; tắt khi reduced-motion. |

Quy ước dự án, bắt buộc:
- `CLAUDE.md` / `AGENTS.md` ở gốc repo.
- `docs/claude-support/2026-11-14-web-ui-ux-review/00-style-reference.md`: chỉ học pattern, không copy.

---

## 4. Gói việc chi tiết

### WP0 — Xác minh nền (bắt buộc, không sửa code)

1. Đặt biến môi trường (Git Bash):
   ```bash
   export PLAYWRIGHT_BROWSERS_PATH="$(cd .. && pwd -W)/.tools/mach-mo-review/playwright"
   export MSYS_NO_PATHCONV=1   # không có biến này Git Bash biến "/learn/x" thành "D:/Git/learn/x"
   ```
   PowerShell: `$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path ..\.tools\mach-mo-review\playwright)`
2. Chạy lần lượt: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build:local`, rồi `node node_modules/@playwright/test/cli.js test -c .tmp/pw-redesign.config.mjs`.
3. Kỳ vọng: typecheck sạch, unit 623/623, e2e 119/119. Nếu khác, **dừng** và báo số liệu. Có thể một phiên khác đã sửa file.
4. Port: 5196 và 5297 bị `vite preview` cũ giữ. Dùng `.tmp/pw-redesign.config.mjs` (port 5311); route-audit dùng 5312–5314.

### WP1 — Cỡ chữ dễ đọc

Vấn đề: 36 khai báo 8px, 91 khai báo 9px, 181 khai báo 10px và 160 khai báo 11px trong `src/**/*.css`; riêng `app.css` chiếm phần lớn. Người mới khó đọc.

Quy tắc:
- Chữ nội dung (đoạn văn, mô tả, label form, chú thích có nghĩa) ≥ **13px**. Ở 375px ≥ **12px**.
- Nhãn trang trí viết hoa hoặc mono (eyebrow, số bước, badge) ≥ **11px**.
- Thay bằng token: `--mm-text-xs` (12), `--mm-text-sm` (13), `--mm-text-base` (15). Không dùng số cứng mới.

Các bước:
1. Viết script đếm `.tmp/count-font-sizes.mjs`: liệt kê file, dòng, selector, cỡ. Lưu kết quả ban đầu vào báo cáo.
2. Sửa theo từng file, thứ tự:
   1. `src/styles/app.css` (lesson, catalog, builder, home)
   2. `LessonCircuitWorkspace.css`
   3. `ButtonLedLessonLab.css`
   4. `SpiceWorkbenchPage.css`, `FirmwareHexToolPage.css`, `ClassroomKitPage.css`
   5. các file còn lại
3. Sau mỗi file: chạy `npm.cmd run build:local`, rồi `ROUTES=<route liên quan> node .tmp/route-audit.mjs dist 5313 wp1 both`.
4. Nếu trang `mm-fit` (`/build`, `/app/lab`, `/learn/esp32-led`, `/tools/sketch`, `/build/freestyle`) bắt đầu cuộn dọc ở 1366×768: sửa khoảng cách hoặc panel cuộn nội bộ. Không được giảm cỡ chữ dưới quy tắc.

Nghiệm thu:
- Script đếm: chữ nội dung còn 0 khai báo <12px. Nhãn trang trí còn 0 khai báo <11px.
- Mọi ngoại lệ được ghi trong báo cáo kèm lý do (ví dụ nhãn chân trong SVG breadboard).
- Audit 38 route: axe serious 0; 375px 0 trang cuộn ngang; `mm-fit` ≥1280 không cuộn dọc.
- e2e toàn bộ pass.

### WP2 — Chế độ tối theo giai đoạn

Vấn đề: CSS có 1 552 màu hard-code (`app.css` 804, `BreadboardEditor.css` 180, `pcb-viewer.css` 76, `ComponentAnatomy.css` 62, …). TSX có thêm màu hex (`ComponentIllustration.tsx` 78, …).

**2A — Hạ tầng (opt-in, mặc định vẫn sáng)**

1. Test trước (TDD), thêm vào `e2e/theme.spec.mjs`:
   - Chọn "Tối" → `html[data-theme="dark"]` → reload vẫn giữ.
   - Axe 0 serious trên `/`, `/boards`, `/community` ở chế độ tối.
   - Không có flash sáng: chụp ngay sau `domcontentloaded`, nền phải tối.
2. `tokens.css`: thêm hai khối ghi đè cho mọi `--mm-*`, gồm cả `--mm-surface-rgb` và `--mm-signal-rgb`:
   - `:root[data-theme="dark"] { … }`
   - `@media (prefers-color-scheme: dark) { :root[data-theme="system"] { … } }`
   Bảng màu tối gợi ý: nền `#141a26`, surface `#1c2433`, ink `#eef0f4`, text `#c9cfdb`, muted `#9aa3b5`, line `#2f3a4f`, accent `#ff6b5e`, signal `#3cc2c7`. Kiểm từng cặp chữ/nền ≥4.5:1.
3. `index.html`: thêm script inline nhỏ, chạy trước bundle. Script đọc `localStorage['mm-theme']` (`light|dark|system`, mặc định `light`), gán `document.documentElement.dataset.theme`, và bọc `try/catch`.
4. UI chọn theme có 3 lựa chọn Sáng / Tối / Theo hệ thống:
   - Đặt trong `HelpMenu` (`src/components/onboarding/Onboarding.tsx`), mục "Giao diện".
   - Dùng `role="radiogroup"` với 3 `input type=radio` có label. Không dùng menu ARIA phức tạp.
5. Bọc vùng không đổi màu bằng class `.mm-keep-light`, khối này đặt lại token về giá trị sáng:
   - canvas 3D, breadboard SVG, schematic, PCB viewer, ảnh linh kiện.
   Mạch giữ nền "giấy" để màu dây và LED còn đúng nghĩa.

**2B — Chuyển màu hard-code sang token (từng file)**

1. Viết `.tmp/count-hardcoded-colors.mjs`. Script đếm hex và rgb theo file và in tổng; lưu số ban đầu là 1 552.
2. Mỗi file: thay màu bằng token `--mm-*` có nghĩa gần nhất. Thiếu token thì thêm token có tên theo nghĩa (ví dụ `--mm-warn-soft`), không đặt tên theo màu.
3. Thứ tự: `app.css` → `AppHomePage.css` → `Community.css` → trang Công cụ → `ComponentAnatomy.css`. File breadboard/PCB/schematic chỉ thay phần khung bao ngoài; phần còn lại nằm trong `.mm-keep-light`.
4. Sau mỗi file: audit 38 route ở **cả hai** chế độ.
   - Script hiện chỉ có `colorScheme`. Thêm option `THEME=dark` để set `localStorage['mm-theme']='dark'` qua `addInitScript`.
   - Chụp ảnh vào `img/12/dark/`.

**2C — Bật "Theo hệ thống" làm mặc định.** Chỉ làm khi founder duyệt ảnh `img/12/dark/` và toàn bộ 38 route đạt axe 0 serious ở chế độ tối.

Nghiệm thu 2A:
- e2e theme pass.
- Chế độ sáng không đổi: so ảnh `after` của đợt 10, chênh lệch chỉ ở menu Trợ giúp.

Nghiệm thu 2B:
- Số màu hard-code ngoài `.mm-keep-light` giảm, và báo cáo ghi rõ số trước/sau.
- Axe tối 0 serious trên 38 route × 2 kích thước.

### WP3 — Tour cho bề mặt `/app` và thêm trang

1. Test trước. Thêm vào `e2e/onboarding-tour.spec.mjs`:
   - `/app` hiện lời mời tour "Không gian học".
   - Ở `/app/lab`, Trợ giúp mở tour lab và các bước trỏ đúng vùng trong layout có sidebar.
   - 375px: thanh dưới 5 mục không bị lời mời che. Lời mời nằm trên thanh, `bottom: 84px` đã có.
2. `src/components/onboarding/tours.ts`:
   - Thêm tour `app-home` cho `/app`, ≤5 bước: sidebar 5 khu vực, "Tiếp tục bài", Trợ giúp.
   - Có thể thêm `library` (`/boards`, `/components`, ≤4 bước, có bước chỉ nút "Lắp thử trên bàn tự do") và `tools` (`/tools/sketch`).
   - Mỗi tour ≤7 bước. Bước cuối trỏ `.help-menu-button`; unit test hiện có đã kiểm điều này.
3. Cập nhật `tourIdForPath`, `TOUR_ORDER` và `tests/onboarding-tours.test.mjs`. Ví dụ `/app` lúc này trả `null`; sau khi thêm tour phải đổi kỳ vọng.
4. Chọn selector: chỉ dùng class hoặc id ổn định đã có. Không thêm `data-*` vào component của phiên khác nếu không cần.

Nghiệm thu: e2e tour pass; axe khi tour đang mở 0 serious ở 375 và 1440; reduced-motion vẫn tắt animation.

### WP4 — Hoàn thiện nhỏ và dọn dẹp

1. Xoá thư mục ảnh thử `docs/claude-support/2026-11-14-web-ui-ux-review/img/10/probe/`. Đây là ảnh tạm, không phải bằng chứng. Liệt kê file trước khi xoá.
2. Dừng `vite preview` còn chạy ở port 5314 nếu còn: `netstat -ano | findstr :5314`, rồi `taskkill /PID <pid> /F`. **Không** tắt tiến trình ở 5196/5297 nếu chưa hỏi founder, vì có thể là phiên khác.
3. Hỏi founder hai điểm, ghi câu trả lời vào báo cáo:
   - Có giữ việc ẩn CTA "Bắt đầu học" ở ≤520px không?
   - Có giữ nhãn mới "Phòng lắp mạch theo bài" (trước là "Phòng thử") không?
4. `FreestyleBench.tsx`: tham số `?board=` hiện bỏ qua board không có trong `freestyleBoards` mà không báo gì. Thêm `setNotice('Board … chưa có trên bàn tự do; đang dùng …')` và một e2e cho trường hợp này.

### WP5 — Kiểm tra cuối và báo cáo

Chạy đủ, theo thứ tự, và ghi số liệu vào báo cáo:
```bash
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:local
node node_modules/@playwright/test/cli.js test -c .tmp/pw-redesign.config.mjs
node .tmp/route-audit.mjs dist 5313 after12 both            # sáng
THEME=dark node .tmp/route-audit.mjs dist 5313 after12-dark both   # nếu đã làm WP2
```
Ảnh: `img/12/<phase>/<WxH>/<route>.png`. Đổi `imgRoot` trong script hoặc thêm biến `IMG_DIR`; không ghi đè `img/10`.

Báo cáo `docs/claude-support/2026-11-14-web-ui-ux-review/12-…md` gồm:
- thay đổi;
- số liệu trước/sau (cỡ chữ, màu hard-code, axe, cuộn);
- lệnh đã chạy;
- việc chưa làm;
- câu trả lời của founder ở WP4.

---

## 5. Lệnh tái lập nhanh

```bash
cd /d/StartupOS/electronics-learning-demo
export PLAYWRIGHT_BROWSERS_PATH="$(cd .. && pwd -W)/.tools/mach-mo-review/playwright"
export MSYS_NO_PATHCONV=1
npm.cmd run build:local
node node_modules/@playwright/test/cli.js test -c .tmp/pw-redesign.config.mjs e2e/onboarding-tour.spec.mjs
ROUTES=/,/learn/blink node .tmp/route-audit.mjs dist 5313 probe both
```

## 6. Bẫy đã gặp, cần tránh

- **Opacity trong animation làm axe báo sai tương phản.** Animation cho nội dung trang chỉ dùng `translate`. Opacity chỉ dùng cho lớp phủ do người dùng mở (menu, tour).
- **Thứ tự CSS:** `SiteNavigation.css` nạp **trước** `app.css`. Muốn ghi đè `app.css` thì đặt quy tắc trong `redesign.css`, file nạp cuối.
- **Header mobile:** `app.css` ở ≤680px đẩy Menu xuống hàng 2 và đặt `width:100%`. `redesign.css` đã ghi đè thành một hàng. Đừng để header cao lại: route focus cuộn `h1` lên dưới header sticky và gây lỗi `target-size`.
- **React StrictMode** chạy effect 2 lần. Effect áp dụng một lần (như `?part=`) phải có ref chặn, giống `intentApplied` trong `FreestyleBench`.
- **Lời mời tour hiện ở mọi test e2e mới trên `/`, `/build`, `/learn/esp32-led`, `/build/freestyle`.** Nếu test cần bấm vùng góc trái dưới, seed `localStorage['mm-tour-seen']` bằng `addInitScript`, giống `e2e/onboarding-tour.spec.mjs`.
- **Unit test đọc source** và đòi các chuỗi cố định: `F.spice.publicRoute`, `F.community.publicRoute`, `['calculators', 'spice', 'firmware', …]`, `features: ['community']`, `<AuthMenu variant="public"`, `<AuthMenu variant="app"`. Giữ nguyên các chuỗi này.
- **Gate hook trên máy founder** có thể đòi khai báo "call site + chỉ dẫn" trước lần sửa đầu tiên mỗi file. Khai báo ngắn rồi làm tiếp.

## 7. Prompt dán cho Codex

```
Bạn là Codex, triển khai tiếp đợt thiết kế lại UI/UX của Mạch Mở tại D:\StartupOS\electronics-learning-demo.
Đọc trước: CLAUDE.md, AGENTS.md (nếu có), docs/claude-support/2026-11-14-web-ui-ux-review/10-thiet-ke-lai-ui-ux.md và 11-ke-hoach-codex-trien-khai.md.
Làm theo đúng file 11: thứ tự WP0 → WP1 → WP4 → WP3 → WP2 (dừng sau 2A/2B nếu founder chưa duyệt 2C) → WP5.
Tuân thủ mục 2 (quyền/cấm) và áp các skill ở mục 3. Mọi kết luận "đã sửa" phải kèm output lệnh mới nhất.
Không commit. Không tắt/skip test. Không sửa supabase/**, firmware/**, docs/hardware/**, vendor/**, assets/**, public/models/**. Không mở .env.
Trên Windows dùng npm.cmd; Playwright cần PLAYWRIGHT_BROWSERS_PATH=../.tools/mach-mo-review/playwright và config .tmp/pw-redesign.config.mjs.
Kết thúc mỗi WP: báo ngắn bằng tiếng Việt gồm file đã sửa, lệnh đã chạy, số liệu, việc còn lại.
Cuối cùng viết docs/claude-support/2026-11-14-web-ui-ux-review/12-…md.
```
