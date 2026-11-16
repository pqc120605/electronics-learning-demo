# 12 — Codex hoàn thiện UI/UX theo WP0–WP5

Ngày: 15/11/2026. Phạm vi: kế hoạch `11-ke-hoach-codex-trien-khai.md` do founder giao triển khai.

**Đã hoàn tất WP0–WP5 trong phạm vi đã giao, gồm WP2A/2B.** E2E cuối 134/134; axe serious/critical 0/76 ở mỗi theme. Mặc định vẫn sáng; WP2C chưa được kích hoạt.

## Phạm vi và quyết định

- Giữ ngôn ngữ thị giác, URL, bản nháp và hành vi mô phỏng đang có. Mục tiêu đợt này là khả năng đọc, lựa chọn theme, hướng dẫn theo khu vực và phản hồi khi bàn tự do không hỗ trợ board được yêu cầu.
- Founder đã trả lời trong HQ: giữ CTA “Bắt đầu học” ẩn ở ≤520px; giữ nhãn “Phòng lắp mạch theo bài”.
- Mặc định theme vẫn **Sáng**. Người dùng có thể chủ động chọn Tối hoặc Theo hệ thống trong Trợ giúp. Chưa thực hiện WP2C (đổi mặc định sang hệ thống).
- Các năng lực liên quan: EXP-01/EXP-02 (onboarding và tour), CAT-06 (tìm/chọn trong thư viện), EXP-10 (chuyển ngữ cảnh sang công cụ). Mức nghiệm thu đợt này là các luồng tour/theme/phản hồi có thể kiểm bằng browser test; không tuyên bố đã đạt toàn bộ chiều sâu D3 của các năng lực đó.

## WP0 — Baseline và môi trường

Lượt đầu trong sandbox: typecheck exit 0; unit 619/623, exit 1. Bốn ca compile không tìm thấy Arduino AVR trong thư mục profile của sandbox. Khi trỏ `ARDUINO_DIRECTORIES_DATA` tới `C:/Users/ACER/AppData/Local/Arduino15`, platform AVR 1.8.8 đã có, nhưng sandbox báo Illegal System DLL Relocation lúc chạy avr-g++. Chạy cùng bốn ca với toolchain đã cài ngoài sandbox đạt 8/8. Không cài platform, package hay sửa dịch vụ compile để né lỗi.

Baseline xác minh lại trước bản build UI mới:

| Lệnh | Kết quả |
|---|---|
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd test` (đúng thư mục Arduino, ngoài sandbox) | exit 0, 623/623, không skip |
| `npm.cmd run build:local` | exit 0 |
| Playwright với `.tmp/pw-redesign.config.mjs` | exit 0, 119/119 |

E2E baseline phục vụ bản `dist` cố định. Trong lúc chờ e2e, phần source được chỉnh tiếp sau khi unit baseline đạt; không build lại `dist` cho tới khi baseline 119 ca kết thúc. Đây là điều chỉnh lịch thực thi so với yêu cầu tuần tự tuyệt đối của WP0, giữ riêng snapshot runtime trước và sau.

## WP1 — Chữ dễ đọc

- Chuyển 846 khai báo chữ trong 36 file CSS sang `--mm-text-sm` (13px). Bộ đếm tính cả `font-size`, shorthand `font`, `px`, `rem` và `em` với mốc 16px.
- Trước: 858 khai báo dưới 13px, trong đó 652 dưới 12px. Sau: còn 12 khai báo dưới 13px, đều là tọa độ chữ trong SVG; 9 trong số đó dưới 12 đơn vị SVG.
- Không còn khai báo chữ HTML dưới 12px theo bộ đếm này. Đây không phải tuyên bố mọi chữ trong canvas/SVG luôn có 13 pixel trên màn hình: nhãn kỹ thuật thay đổi theo zoom, có phần tra cứu HTML bên cạnh.
- Tăng chữ theo token và kiểm tra cả site theo nhóm thay đổi; không chạy lại build riêng cho từng file CSS. Thay vào đó, dùng build, toàn bộ e2e, ảnh 38 route × 3 kích thước và axe sau khi hợp nhất. Giữ các chuỗi `min-height:0`/cuộn nội bộ của bố cục một màn hình.

Ngoại lệ có chủ đích:

| File | Selector SVG | Cỡ trong hệ tọa độ |
|---|---|---|
| BreadboardEditor.css | `.diagram-board-note`, `.diagram-board-pin text` | 11 |
| BreadboardEditor.css | `.diagram-row-labels,.diagram-rail-labels` | 10 |
| BreadboardEditor.css | `.diagram-trench-label` | 9 |
| BreadboardEditor.css | `.diagram-bench-lane text`, `.diagram-button-mark` | 10 |
| BreadboardEditor.css | `.diagram-component-value` | 11 |
| BreadboardEditor.css | `.diagram-level-pill text` | 10 |
| CircuitSchematicV2.css | `.schematic-title-block text` | 12 |
| CircuitSchematicV2.css | `.schematic-net-reference,.schematic-role-marker text` | 12 |
| CircuitSchematicV2.css | `.schematic-terminal text` | 12 |
| pcb-viewer.css | `.pcb-reference text` | 0,9 (hệ tọa độ PCB) |

## WP4 — Phản hồi và dọn dẹp

- Bàn tự do báo rõ board chưa hỗ trợ và board đang dùng, giữ mạch đã lưu; vẫn xử lý tham số đúng một lần và xóa riêng `board`/`part` khỏi URL.
- Giới hạn phần board lạ đưa vào thông báo ở 100 ký tự, render bằng text React.
- Đã liệt kê và xóa đúng 15 ảnh thử trong `img/10/probe/`; các thư mục bằng chứng `img/10/before`, `after`, `tour` được giữ.
- Không thấy listener 5314 cần dọn ở thời điểm kiểm tra. Các preview do phiên này tạo được quản lý cùng runner; không dừng server của phiên khác.

## WP3 — Tour và Trợ giúp

- Tour mới: `app-home` 4 bước, `library` 4 bước, `tools` 3 bước; dùng các URL `/app` và công khai tương ứng.
- Mỗi tour kết thúc ở Trợ giúp. Các bước mô tả CTA bắt đầu/tiếp tục theo tiến độ thực tế, không hứa mọi người đều có bài đang học dở.
- Tour tìm lại mục tiêu khi pathname đổi, kể cả hai URL cùng dùng một tour ID.
- Menu và hộp thoại có giới hạn chiều cao, cuộn nội bộ. Mobile vẫn giữ lời mời phía trên thanh điều hướng 5 mục.
- Kiểm tra ảnh phát hiện menu 375px có x = −32,21875px. Ca hồi quy đã tái hiện lỗi này; CSS mobile chuyển sang neo theo viewport với lề phải 12px. Test kiểm cả hai biên ngang và biên dưới, cùng ảnh minh chứng.
- Unit test ánh xạ tour đã chạy RED → GREEN. Browser test đi qua mọi bước của các tour mới, xác nhận spotlight hiện, kiểm Esc và axe khi mở.

## WP2A/2B — Theme tùy chọn

- Thêm helper thuần `src/lib/theme.ts`; theme chỉ dùng khóa `mm-theme`. Đọc giá trị lạ hoặc storage bị chặn thì mặc định sáng; storage lỗi vẫn đổi được theme trong phiên hiện tại.
- Script trước bundle trong `index.html` dùng cùng quy tắc kiểm giá trị. Test reload kiểm nền tối ngay ở `domcontentloaded`.
- Trợ giúp có radiogroup Sáng/Tối/Theo hệ thống. CSS media query phản ánh thay đổi hệ thống khi người dùng đã chọn chế độ đó. Sự kiện storage đồng bộ theme giữa các tab.
- Token tối bao gồm RGB companion, màu chữ, trạng thái, đường viền, màu trên nút và alias cũ. Đường lưới trang trí dùng token để giảm độ nổi ở nền tối.
- Vùng mạch, sơ đồ, CAD, breadboard và phần minh họa dùng `.mm-keep-light` để bảo toàn ý nghĩa màu điện và nền giấy. Các panel ứng dụng còn lại theo theme.
- Chuyển các màu UI lặp lại sang token theo vai trò; không đổi palette linh kiện CAD theo phép đảo màu. Bản in kit luôn dùng nền trắng, độc lập lựa chọn trên màn hình.
- Không thêm dependency hoặc thư viện animation; reduced-motion tiếp tục tắt animation/transition.

## Review và lỗi đã xử lý

Review độc lập dùng source snapshot trước phiên tại `.tmp/ui12/source-before`, không lấy Git diff vốn trộn nhiều thay đổi cũ. Reviewer không ghi file và không chạy kiểm tra thay implementer.

| Phát hiện | Xử lý và kiểm chứng |
|---|---|
| Trộn chữ tối cố định với nền tối trong workspace bài học | Vùng workspace kỹ thuật giữ bảng màu sáng; ca axe chi tiết bài LED |
| Ô code/selected controls bài nút nhấn | Nền/chữ theo cùng token; ca axe bài button-led |
| Bản in kit bị theme tối chi phối | Reset màu giấy trong media print; ca print kiểm nền trắng và chữ tối |
| Disclaimer firmware, trạng thái lỗi mô phỏng thiếu tương phản | Dùng token trạng thái; ca firmware và audit route |
| Badge board/so sánh/giới hạn robot còn màu cũ | Token hóa các trạng thái tương ứng; audit tối và ca robot |
| Tên truy cập nút trên SVG thiếu chữ SW đang hiện | Bổ sung SW vào accessible name; axe bài button-led và unit breadboard |
| Menu mobile bị cắt khỏi mép trái dù axe pass | Ca biên ngang RED, sửa neo viewport, kiểm ảnh và ca hồi quy |

## Kiểm tra cuối và số liệu

| Kiểm tra | Kết quả mới |
|---|---|
| Typecheck | exit 0 |
| Unit toàn bộ | 625/625, exit 0, không skip (baseline 623) |
| Unit theo phạm vi sau sửa accessible name | 13/13, exit 0 |
| Build local cuối | exit 0 |
| E2E toàn bộ cuối | **134/134, exit 0**, một lượt trên snapshot cuối |
| Ca tương phản card trực tiếp | 4/4, kiểm 375/1440 và sáng/tối |
| Audit sáng | 38 route, 114 ảnh, 76 lượt axe, 0 serious/critical |
| Audit tối | 38 route, 114 ảnh, 76 lượt axe, 0 serious/critical |
| Tràn ngang | 0/114 ở mỗi theme |
| Trang một màn hình cuộn dọc desktop | 0/16 ở mỗi theme (8 route × 2 kích thước) |

| Bộ đếm CSS | Trước | Sau |
|---|---:|---:|
| Khai báo font dưới 13px | 858 | 12, toàn bộ là ngoại lệ SVG |
| Khai báo dưới 12px | 652 | 9, toàn bộ là ngoại lệ SVG |
| Màu ghi trực tiếp, tính cả tokens | 1.582 | 1.428 |
| Màu ghi trực tiếp ngoài tokens.css | 1.546 | 1.192 |
| Màu ghi trực tiếp trong app.css | 806 | 617 |

Bộ đếm màu chỉ tính CSS, không gộp palette TSX/GLB. Các số khác tài liệu đợt 10 vì đếm trên source hiện tại, có cả shorthand và rem/em ở phần chữ. Unit 625 xác minh phần logic; sau các chỉnh sửa CSS/markup nhỏ cuối phiên, build/typecheck, unit theo phạm vi và toàn bộ browser suite được dùng để xác minh phần bị ảnh hưởng.

### Phát hiện qua ảnh ngoài axe

- Ca mobile cũ phát hiện ô đổi loại dây chỉ có tỷ lệ hiển thị 0,9904. Giảm gap/padding của bố cục mobile, giữ chữ 13px và assertion ratio 1; ca đã pass cả read/branch/write/stale. Nút về website ở thanh đầu mobile giữ route/tên truy cập, dùng biểu tượng để vừa chiều ngang.
- Sau khi axe báo 0, rà contact sheet vẫn tìm thấy card Quyền riêng tư/404 nền tối trong theme sáng. Test tỷ lệ tương phản trực tiếp đã chạy RED (2 fail/2 pass), đổi nền card sang token surface, rồi GREEN 4/4. Đây là lý do không diễn giải axe 0 như đầy đủ WCAG.

### Lệnh và artifact

Chạy Windows bằng npm.cmd, với PLAYWRIGHT_BROWSERS_PATH trỏ tới ../.tools/mach-mo-review/playwright. Các ca compile dùng ARDUINO_DIRECTORIES_DATA=C:/Users/ACER/AppData/Local/Arduino15; phải chạy ngoài sandbox trên máy này để avr-g++ hoạt động.

`npm.cmd run typecheck` · `npm.cmd test` · `npm.cmd run build:local` · `node node_modules/@playwright/test/cli.js test -c .tmp/pw-redesign.config.mjs`

`THEME=light node .tmp/route-audit.mjs dist 5313 final12-light both` và lệnh tương tự THEME=dark/final12-dark. Trong PowerShell, đặt bằng $env:THEME thay vì cú pháp prefix shell.

- [Log và snapshot SHA-256](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/validation12/snapshot.json)
- [Danh sách file sửa và SHA-256](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/validation12/changed-files.md)
- [Gallery đối chiếu 38 route: trước / sau sáng / sau tối, 3 kích thước](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/validation12/gallery.html)

Bộ ảnh cuối: **228 ảnh route**, cùng ảnh tương tác tour/theme/print/dây được lưu riêng. Gallery dùng đường dẫn tương đối để mở được cùng cây thư mục tài liệu. Ảnh after12-dark là lượt trung gian có lỗi; ảnh dùng nghiệm thu là final12-light/final12-dark. Không lấy Git HEAD làm baseline vì checkout đã có 326 mục thay đổi từ trước phiên.

## Ảnh minh chứng tiêu biểu

### Trang chủ sáng / tối

![Trang chủ sáng](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/final12-light/1440x900/home.png)

![Trang chủ tối](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/final12-dark/1440x900/home.png)

### Tour / menu mobile

![Tour không gian học](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions/tour-app-375.png)

![Menu theme trọn viewport](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions/theme-menu-375.png)

### Điều khiển dây mobile

![Trước sửa: đáy điều khiển bị cắt](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/regressions/mobile-wire-controls-before-fix.png)

![Sau sửa: điều khiển đầy đủ trong bốn trạng thái](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions/mobile-selected-wire-controls.png)

### Card quyền riêng tư

![Card trước sửa, axe chưa báo](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/regressions/privacy-card-before-fix.png)

![Card sau sửa nền theo theme](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/final12-light/1440x900/privacy.png)

### Bản in kit từ theme tối

![Giấy trắng khi in](D:/StartupOS/electronics-learning-demo/docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions/kit-print-from-dark.png)

## Giới hạn nghiệm thu

- NVDA/trình đọc màn hình thật: NOT_RUN. Thiết bị mobile thật: NOT_RUN. Lighthouse/đo hiệu năng: NOT_RUN.
- Browser đã chạy: Chromium headless do Playwright quản lý. Firefox/Safari và kiểm tra bằng tay trên thiết bị thật: NOT_RUN.
- Không thay dữ liệu người học, schema workspace hay thuật toán mô phỏng điện/firmware trong đợt này.
- `build:local` là kiểm tra nội bộ. Không có thao tác phát hành, commit, push, mua hàng hay tác động thiết bị.
- WP2C chờ founder duyệt ảnh tối và quyết định đổi mặc định. Hiện người dùng tự chọn theme; mặc định sáng được giữ.
