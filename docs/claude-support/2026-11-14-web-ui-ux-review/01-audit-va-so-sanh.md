# 01 — Audit Mạch Mở trên trình duyệt và so sánh với web/app tham khảo

Ngày: 2026-11-14 · Người làm: Claude · Trạng thái: **Checkpoint A — chờ founder duyệt danh sách sửa**
Tham chiếu phong cách: [00-style-reference.md](00-style-reference.md). Kế thừa: `docs/reviews/2026-11-13-web-experience-review/report.md` (MM-WEB-01…11).

## 0. Phạm vi, công cụ, giới hạn

- Dev server `npm run dev` (Vite, localhost:5173). Trình duyệt: Playwright Chromium headless (bộ của dự án, `../.tools/mach-mo-review/playwright`) + trình duyệt tích hợp của Claude desktop.
- Script audit tạm (scratchpad, không commit): chụp mọi route × 3 viewport, đo `scrollHeight`, `scrollWidth`, đếm control không tên, ảnh thiếu `alt`, input không label, gom console error/warning và request lỗi.
- Script thao tác: lab (đi đủ 4 bước, bấm chạy), SPICE (bấm Chạy SPICE), bài học (4 tab), robot, bộ tính (nhập giá trị âm), HEX (nạp firmware mẫu), linh kiện.
- **Chưa làm ở lượt này** (ghi rõ để không hiểu nhầm):
  - Chưa kéo thả linh kiện/nối dây thủ công trong lab (cần "Tạo bản nháp" trước; để Giai đoạn 3 viết e2e).
  - Chưa đo tương phản màu tự động (chỉ đếm heuristic a11y). Chưa chạy axe.
  - Chưa test theme tối: app khai báo `color-scheme: light`, không thấy nút đổi theme.
  - Chưa test bàn phím toàn trang.
  - Lỗi `ERR_ABORTED` file `.glb` chưa xác định là lỗi thật hay do script đóng context (xem MM-UX-09).
- Skill: đã gọi `anthropic-skills:built-in-browser`. Các skill còn lại của Giai đoạn 1–2 (`ecc:browser-qa`, `agent-skills:browser-testing-with-devtools`, `ui-design:accessibility-audit`, `ecc:competitive-platform-analysis`, `ui-design:design-review`) **chưa gọi** để giữ ngân sách ngữ cảnh; thay bằng script Playwright ở trên. Sẽ gọi nhóm skill Giai đoạn 3–4 khi làm.

Ảnh: `screenshots/review-2026-11-14/<route>-<WxH>.png` (78 ảnh), số liệu thô `screenshots/review-2026-11-14/audit-results.json`, ảnh thao tác `screenshots/review-2026-11-14/interact/`, log thao tác `interact/interact-log.txt`.

## 1. Route và đo cuộn dọc

Route lấy từ `src/App.tsx:120-147` và `src/data/productRoutes.ts`. Route `/` công khai và `/app/...` dùng chung page component.

| Route | Page | scrollHeight 1440×900 | 1366×768 | 375×812 | Cuộn ngang 375 |
|---|---|---|---|---|---|
| `/` | ExplorePage | 3105 | 3105 | 4059 | không |
| `/app` | AppHomePage | 4299 | 4299 | 5903 | không |
| `/app/learn`, `/topics` | TopicsPage | 2643 / 2639 | 2643 / 2639 | 3980 / 3915 | không |
| `/app/learn/esp32-led`, `/learn/esp32-led` | LessonPage | **8575** / 8538 | 8647 / 8538 | 12950 / 12885 | không |
| `/app/robot-simulation` | RobotSimulationLessonPage | 1464 | 1464 | 1956 | không |
| `/app/boards`, `/boards` | BoardCatalogPage | **9895** / 9693 | 10028 / 9693 | 21107 / 21041 | không |
| `/app/components`, `/components` | ComponentsPage | 2704 / 2625 | 2724 / 2625 | 4742 / 4676 | không |
| `/app/lab`, `/build` | CircuitBuilderRoute | 2351 (bước 1); **5170** (bước 4) | 2351 | 4013 | không |
| `/app/projects`, `/projects` | ProjectsPage | 4021 / 4017 | 4115 / 4017 | 6490 / 6424 | không |
| `/app/classroom-kits` | ClassroomKitPage | 2014 | 2070 | 3349 | không |
| `/app/tools/calculators`, `/tools/electronics-calculators` | ElectronicsCalculatorsPage | 1375 / 1371 | 1375 / 1371 | 2893 / 2828 | không |
| `/app/tools/firmware`, `/tools/firmware-hex` | FirmwareHexToolPage | 1005 / **900 ✓** | 897 / 893 | 1133 / 1067 | không |
| `/app/tools/spice`, `/tools/spice` | SpiceWorkbenchPage | 1954 / 1783 | 1970 / 1783 | 2349 / 2261 | không |
| `/privacy` | PrivacyPage | **900 ✓** | 869 | 1091 | không |
| `/admin`, `/admin/login` | AdminGate (chưa kết nối Supabase) | 900 ✓ | 768 ✓ | 812 | không |
| `*` (404) | RoutePlaceholder | 900 ✓ | 768 ✓ | 812 | không |

Kết luận: ở 1440×900 chỉ 4/27 route không cuộn dọc (firmware public, privacy, admin, 404). Ở 1366×768 chỉ admin và 404. **Không route nào cuộn ngang ở 375** (đạt).

Console: không có `pageerror` hay console error nào ở mọi route. Chỉ có cảnh báo WebGL "GPU stall due to ReadPixels" ở `/` (nhiễu driver headless) và `ERR_ABORTED` cho `models/esp32-devkit-v1-30pin.glb`, `models/esp32-led-assembly.glb`.

A11y heuristic (mọi route, 3 viewport): 0 control không tên, 0 `<img>` thiếu `alt`, 0 input không label, mỗi trang đúng 1 `<h1>`. Đây là kiểm tra tự động tối thiểu, không thay audit đầy đủ.

## 2. Bảng lỗi Mạch Mở

P0 = sai dữ liệu/dead-end luồng chính; P1 = chức năng/hiểu biết cốt lõi giảm; P2 = chất lượng.

| ID | Mức | Route | File:line | Bằng chứng | Cách sửa tối thiểu |
|---|---|---|---|---|---|
| MM-UX-01 | P1 | gần như mọi route | layout chung `src/components` shell + `src/styles/app.css` | Bảng mục 1; `app-lesson-1440x900.png` | Khung `100dvh` grid (header/rail/stage/panel/dock), nội dung dài vào panel/tab cuộn nội bộ ở ≥1280×720 |
| MM-UX-02 | P1 | `/app/lab`, `/build` | `src/pages/CircuitBuilderPage.tsx` | `interact/lab-full-step4.png`: trang 5170px; nút "▶ Chạy mô phỏng" ở y=4663; canvas breadboard bắt đầu dưới nếp gấp (`interact/lab-05-run.png`) | Đưa canvas vào stage trung tâm, nút chạy/dừng vào toolbar nổi, mô tả bước/mục tiêu/kiểm tra vào panel phải có tab |
| MM-UX-03 | P1 | `/app/lab` | `CircuitBuilderPage.tsx` stepper | `app-lab-1440x900.png`: đang ở "Bước 1/4" nhưng chip "Lắp mạch" và "Viết code" đã hiện ✓ | Chỉ hiện ✓ khi bước thật sự hoàn tất; bước chưa làm hiện số thứ tự |
| MM-UX-04 | P1 | `/app/lab` bước 4 | `CircuitBuilderPage.tsx` | log: `button[disabled]:Mạch lắp thử · logic`; banner "bản xem trước chỉ đọc… Tạo bản nháp để chỉnh sửa" (MM-WEB-03 cũ **vẫn còn**) | Nút chế độ bị khóa cần lý do + hành động ngay cạnh (tooltip/inline "Tạo bản nháp để bật") |
| MM-UX-05 | P1 | `/app/learn/esp32-led` | `src/pages/LessonPage.tsx` | 8575px; 4 tab (Chuẩn bị/Lắp mạch/Board và pinout/Code/Kiểm tra) chỉ cuộn tới section, không đổi nội dung | Biến 5 tab thành stepper thật: mỗi lần chỉ một bước trong panel, hình mạch cố định ở stage |
| MM-UX-06 | P1 | `/app/boards`, `/boards` | `src/pages/BoardCatalogPage.tsx` | 9895px (1440), 21107px (375) | Master–detail: danh sách cuộn nội bộ bên trái, chi tiết board bên phải |
| MM-UX-07 | P2 | `/app/lab` (dev) | `CircuitBuilderPage.tsx:816-820` | Probe: khi tải trang `h1` "Lắp thử một mạch" ở `top=-97` (trang tự cuộn tới stepper). Guard `stepMounted` bị vượt khi StrictMode chạy effect 2 lần | Chỉ cuộn khi `builderStep` đổi do người dùng (so giá trị trước), hoặc bỏ hẳn khi đã thành khung 1 màn hình. Cần kiểm lại ở bản build |
| MM-UX-08 | P2 | `/app/tools/calculators` | `ElectronicsCalculatorsPage.tsx:77` + `lib/calculatorValidation.ts:8` | Nhập V nguồn = −5: câu "V nguồn phải là số dương." hiện 2 lần (dưới ô và ở vùng kết quả `role=alert`) | Khi có lỗi theo ô, vùng kết quả hiện câu chung "Sửa ô được đánh dấu để xem kết quả" |
| MM-UX-09 | P2 (câu hỏi) | `/`, `/app`, boards, lesson | tải `.glb` | `requestfailed … net::ERR_ABORTED` | Kiểm lại có huỷ request khi unmount hay do script; nếu thật thì thêm AbortController/try-catch êm |
| MM-UX-10 | P2 (câu hỏi) | bài học | `LessonPage` thanh tab dính | `interact/lesson-tab-Code.png`: chữ của nội dung phía sau lộ dưới thanh tab dính | Nền thanh tab đặc + viền dưới; sẽ hết nếu áp MM-UX-05 |
| MM-UX-11 | P1 | lab, lesson | mô phỏng | Không có hiển thị dòng điện/hướng/độ lớn trên dây, không có probe node, không có đồ thị theo thời gian trong lab (SPICE nằm ở trang riêng). Có sẵn: trace logic, Serial Monitor, tab "Trace số / Logic Analyzer", "Waveform SPICE" | Xem mục 5 (cải tiến #5–#7) |

Kế thừa từ báo cáo 13/11 (chưa tái kiểm lượt này, giữ nguyên mức): MM-WEB-01 (P0 trạng thái lưu mâu thuẫn), MM-WEB-02 (P0 hai breadboard), MM-WEB-04 (P0 topology giữa các view), MM-WEB-05…09, MM-WEB-11. MM-WEB-03 và MM-WEB-10 đã tái hiện (thành MM-UX-04, MM-UX-01/02).

Hoạt động đúng đã thấy: SPICE "Chạy SPICE" chạy được (ngspice WASM, trang ghi rõ chạy cục bộ); HEX nạp firmware mẫu → "Cấu trúc hợp lệ, 36 byte, 4 bản ghi"; bộ tính có validate; robot có 5 lệnh và 3 checkpoint; không route nào cuộn ngang trên mobile.

## 3. Bảng độ sâu tính năng

Ký hiệu: ✔ có, đã thấy · ◐ một phần · ✖ không thấy · ? chưa kiểm.

| Tính năng | Mạch Mở | Learn Arduino Red | Learn ESP32 | Electronics 101 | Wokwi | Falstad | Tinkercad | EveryCircuit | CRUMB |
|---|---|---|---|---|---|---|---|---|---|
| Bài 1 màn hình (1440) | ✖ (trừ 2 trang) | ✔ 900/900 | ✔ | ✔ | ✔ editor | ✔ | [không truy cập editor: cần đăng nhập] | ? (chỉ landing) | ? (app desktop) |
| Minh họa mạch là trung tâm | ◐ (canvas dưới nếp gấp) | ✔ | ✔ | ✔ | ✔ | ✔ | ? | ? | ? |
| Callout neo vào linh kiện | ✖ | ✔ | ✔ | ✔ nhãn | ✖ | ✖ | ? | ? | ? |
| Dòng điện động trên dây | ✖ | ◐ pill mức logic | ? | ✔ dash + mA | ✖ | ✔ chấm chạy | ? | (marketing nêu có) | ? |
| Probe/đồ thị theo thời gian | ◐ SPICE trang riêng | ✖ | ✖ | ◐ Maths | ◐ Logic Analyzer (tài liệu) | ✔ 3 scope | ? | ? | ? |
| Đổi tham số, phản hồi ngay | ◐ (lab: đầu vào ảo; SPICE: sửa netlist) | ✔ Hold/Toggle | ✔ kéo vật cản | ✔ công tắc | ✔ | ✔ slider C/L/R | ? | ? | ? |
| Code + chạy | ✔ khối lệnh + C++ subset; avr8js HEX | ✔ | ✔ | ✖ | ✔ biên dịch thật | ✖ | ? | ✖ | ? |
| Serial monitor | ✔ tab | ✔ | ✔ | ✖ | ✔ | ✖ | ? | ✖ | ? |
| Báo lỗi mạch | ✔ "Kiểm tra mạch" 8 nhóm | ✖ | ✖ | ✖ | ◐ (`wokwi-cli lint`, tài liệu) | ◐ | ? | ? | ? |
| Schematic | ✔ | ✔ popup | ✔ | ✔ | ✖ | ✔ | ? | ✔ | ? |
| Tiến độ / ✓ bài | ◐ (stepper ✓ sai, MM-UX-03) | ✔ 0/16 | ✔ 0/20 | ✔ 0/9 | ✖ | ✖ | ? | ✖ | ✖ |
| Đổi ngôn ngữ | ✖ (chỉ VI) | ✔ `/fr/` | ✔ | ✔ | ✖ | ✖ | ? | ? | ? |
| Mobile không cuộn ngang | ✔ | ✔ | ✔ | ✔ | ? | ? | ? | ? | ? |

Learn Arduino (learnarduino.vercel.app) hiện chuyển sang trang giới thiệu NavSprout (aggregator), không phải app bài học (`ref/learnarduino-home-1440x900.png`).

## 4. Ưu điểm cụ thể đáng học

| Site | Ưu điểm đã thấy | Ảnh / URL |
|---|---|---|
| Learn Arduino Red | Toàn bộ bài trong 900px: scene, callout, panel tab, code + chạy, serial, dải bài. Khi chạy, pill mức logic hiện ngay trên dây; dòng code đang chạy tô nền; bài xong có ✓ | `ref/learn-arduino-red-button-1440x900.png` · https://learn-arduino-red.vercel.app/#button |
| Learn ESP32 | Scene kể tình huống (vật cản kéo được), callout có icon, schematic thu nhỏ trong scene | `ref/learn-esp32-sensor-1440x900.png` |
| Electronics 101 | Dòng điện = dash chạy dọc dây, nhãn `300 mA` trên linh kiện, schematic có mũi tên chiều dòng, toggle "Switch closed" trong panel | `ref/electronics-101-closed-loop-1440x900.png` |
| Wokwi | 2 cột code / simulation, nút ▶ / ＋ part / ⋮ nổi trên canvas | `ref/wokwi-uno-new-1440x900.png` |
| Falstad | Chấm dòng điện chạy theo hướng và tốc độ; 3 scope theo thời gian ở đáy; slider tham số ở cột phải; RUN/Stop luôn thấy | `ref/falstad-circuitjs-1440x900.png` |
| CircuitLab | Editor mở không cần đăng nhập, palette theo nhóm (DC Sources, Passive…) | `ref/circuitlab-1440x900.png` |
| MakeCode | Trang chủ editor: "New Project / Start Tutorial / My Projects" ngay màn đầu | `ref/makecode-home-1440x900.png` |
| Arduino Education, OhStem, Tinkercad, EveryCircuit, CRUMB | Chỉ xem landing/guide: lộ trình theo kit/khóa, thi đấu (OhStem), animated circuit là thông điệp chính (EveryCircuit). Không thao tác luồng chính | `ref/*-1440x900.png` |

Không truy cập được: Little Bird (403 CloudFront chặn quốc gia), Scheme-It, Fritzing (trang xác minh bot), EasyEDA (403). AIXENIX, Arduinax: chưa mở lượt này. Nghiên cứu thêm 3 simulator IoT/ESP32 trên internet: **chưa làm** lượt này.

## 5. Cải tiến đề xuất (xếp theo giá trị/công sức)

| # | Cải tiến | Sửa ID | Giá trị | Công sức | Ghi chú |
|---|---|---|---|---|---|
| 1 | Token mới (00 mục 3) trong `src/styles/tokens.css`, ánh xạ biến cũ sang token mới | — | cao | thấp | Không đổi markup |
| 2 | Sửa ✓ sai ở stepper lab | MM-UX-03 | cao | thấp | |
| 3 | Sửa thông báo lỗi trùng ở bộ tính; bỏ tự cuộn khi tải lab | MM-UX-08, 07 | thấp | thấp | |
| 4 | Workspace lab 1 màn hình: stage canvas giữa, panel phải (bước/mục tiêu/kiểm tra/code/trace), dock stepper đáy, toolbar nổi có Chạy/Dừng | MM-UX-02, 04, 01 | rất cao | cao | Trọng tâm Giai đoạn 3 |
| 5 | Pill mức logic + dash tín hiệu trên dây, LED sáng theo state trace thật; dừng khi stop; reduced-motion = tĩnh | MM-UX-11 | cao | trung bình | Trace đã có, chỉ cần vẽ lên canvas |
| 6 | Bài học dạng stepper 1 màn hình (hình mạch cố định, panel đổi theo bước) | MM-UX-05, 10 | cao | trung bình | |
| 7 | Probe node + đồ thị theo thời gian từ eecircuit-engine trong SPICE workbench; dòng điện có hướng/độ lớn trên sơ đồ SPICE | MM-UX-11 | cao | cao | Chỉ số liệu từ engine |
| 8 | Khung app shell `100dvh` cho các trang còn lại (topics, components, projects, classroom, tools, privacy) với cuộn nội bộ | MM-UX-01 | trung bình | trung bình | |
| 9 | Boards: master–detail | MM-UX-06 | trung bình | trung bình | |
| 10 | Logic analyzer đơn giản cho avr8js (GPIO theo thời gian) | MM-UX-11 | trung bình | cao | Có tab sẵn, cần kiểm nội dung |

## 6. Câu hỏi cần founder quyết

1. **Trang chủ `/` và `/app`** là trang giới thiệu dài. Yêu cầu "không cuộn ở ≥1280×720" áp cho cả hai không? Đề xuất: áp cho workspace/bài/công cụ; trang giới thiệu chuyển thành 1 màn hình hero + panel tab ("Học / Lab / Công cụ") — đây là thay đổi luồng, cần duyệt.
2. **Font Barlow** (OFL): cho phép tự host trong `public/fonts` không? Nếu không, dùng `Bahnschrift SemiCondensed` (có sẵn trên Windows) + fallback.
3. Phạm vi Giai đoạn 3 đề xuất: #1–#6 và #8 trước; #7, #9, #10 nếu còn thời gian. Đồng ý không?
