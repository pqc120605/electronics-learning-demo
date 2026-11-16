# 00 — Tham chiếu phong cách (Learn Arduino Red) và token đề xuất cho Mạch Mở

Ngày: 2026-11-14 · Người làm: Claude · Trạng thái: **chờ founder duyệt ở Checkpoint A**

Nguyên tắc: chỉ học ngôn ngữ thị giác. Không copy code, asset, hình, SVG, font file hay text của Learn Arduino Red (LAR). Mọi minh họa Mạch Mở sẽ vẽ lại bằng SVG/CSS riêng.

## 1. Cách thu thập

- Mở thật bằng trình duyệt tích hợp và Playwright headless, viewport 1440×900 và 375×812.
- Đi 3 bài: `#button` (Push a button), `#blink` (Blink an LED), `#knob` (Turn a knob), cộng bản `/fr/#button`.
- Thao tác: bấm Run (▶), bấm nút nhấn trong scene, bật lớp schematic, chuyển bài qua dải Lessons.
- Trích token bằng `getComputedStyle`, đọc biến `:root`, `@keyframes`, `document.getAnimations()`, thống kê stroke SVG.
- Đối chiếu thêm Learn ESP32 `#sensor` và Electronics 101 `/closed-loop` (cùng tác giả/ngôn ngữ thị giác).

Ảnh minh chứng (thư mục `screenshots/review-2026-11-14/ref/`):

| Ảnh | Nội dung |
|---|---|
| `learn-arduino-red-button-1440x900.png` | Bố cục 1 màn hình: scene giữa, callout, panel phải, dải bài dưới |
| `learn-arduino-red-blink-1440x900.png`, `learn-arduino-red-knob-1440x900.png` | Chuyển bài, schematic popup |
| `learn-arduino-red-*-375x812.png` | Mobile: xếp dọc, thanh tab dưới |
| `learn-arduino-red-fr-button-1440x900.png` | Bản tiếng Pháp, cùng bố cục |
| `learn-esp32-sensor-1440x900.png` | Cùng hệ, accent cam, callout có icon |
| `electronics-101-closed-loop-1440x900.png` | Dòng điện chạy trên dây, nhãn 300 mA, schematic có mũi tên chiều dòng |

Quan sát khi chạy (ảnh từ trình duyệt tích hợp, không lưu file; mô tả ở mục 2.5): sau khi bấm Run và nhấn nút, dây hiện nhãn mức tín hiệu dạng viên thuốc (`5 V`, `LOW`, `GND`) dọc theo dây; dòng code đang chạy được tô nền; Serial Monitor in `D2 → HIGH (pressed)`; card bài hiện dấu ✓ khi hoàn thành.

## 2. Token trích được từ LAR

### 2.1 Màu (biến `:root` thật của site)

| Vai trò | Biến | Giá trị |
|---|---|---|
| Nền trang | `--bg` | `#f6eddd` |
| Nền sâu | `--bg-deep` | `#efe3d1` |
| Card | `--card` | `#f9f2e5` |
| Card mờ (callout) | `--card-soft` | `#faf4e9f7` |
| Sidebar | `--sidebar` | `#e9dcca` |
| Nền code | `--code-bg` | `#f8f0e3` |
| Chữ thân | `--ink` | `#4f535b` |
| Chữ phụ | `--muted` | `#696d74` |
| Chữ mờ | `--faint` | `#ada293` |
| Tiêu đề / nét đậm | `--navy` / `--navy-2` | `#18213d` / `#24304a` |
| Accent | `--teal` / `--teal-deep` | `#1aa3a1` / `#3f7f8e` |
| Đường kẻ | `--line` / `--line-soft` | `#cec0ad` / `#e2d7c7` |
| Đường mạch trang trí | `--trace` | `#d3bea3` |
| Track progress | `--track` | `#e3d8ca` |
| Code keyword / function | `--kw` / `--fn` | `#2a56a3` / `#c0652d` |

Learn ESP32 dùng cùng cấu trúc nhưng accent cam. Electronics 101 dùng teal. Tức là: **một khung trung tính kem + navy, mỗi sản phẩm một accent**.

### 2.2 Chữ

| Phần tử | Font | Cỡ / weight / line-height | Ghi chú |
|---|---|---|---|
| Thân | Barlow | 16px / 400; đoạn mô tả 18.3px / 23px | |
| Tiêu đề bài (H2 panel) | Barlow Semi Condensed | 25px / 700 / 30px, letter-spacing 1px, UPPERCASE | |
| Tab | Barlow Semi Condensed | 17.5px / 700, letter-spacing .7px, UPPERCASE | gạch chân khi active |
| Callout tiêu đề | Semi Condensed | ~13px / 700 UPPERCASE | |
| Code | JetBrains Mono | 13.5px / 20px | inline: nền `rgba(42,86,163,.07)`, radius 4px |
| Logo | Semi Condensed, letter-spacing rộng, tagline chữ hoa giãn cách | | |

### 2.3 Hình khối

| Token | Giá trị đo |
|---|---|
| Radius callout/tag | 7px |
| Radius code inline | 4px |
| Radius card/panel (ước từ ảnh) | ~10–12px |
| Viền | `0.8px solid #cec0ad` |
| Bóng | rất nhẹ, lệch dưới: `0 4px 10px -8px rgba(60,45,20,.5)` |
| Padding tag | `4px 9px 4px 8px` |
| Panel phải | rộng ~409px ở 1440; khoảng giữa vùng ~16–24px |

### 2.4 Minh họa board/linh kiện/dây

- Scene là **canvas 3D isometric** (2 `<canvas>`), shading flat/cel: mảng màu phẳng, viền tối dày, bóng đổ mềm. SVG phủ trên cho callout, đường dẫn đứt nét, chấm neo.
- Stroke SVG đo được: đường trang trí `#d3bea3` 1.5px; viền navy `#18213d`–`#24304a` 2–2.4px; đường dẫn callout đứt nét `5px 4px` 1.6px; viền trắng 3px quanh dây.
- Nền: lưới mờ kiểu giấy kỹ thuật + họa tiết đường mạch in ở mép.
- Dây: màu theo vai trò (đỏ nguồn, đen/xám GND, cam/vàng/xanh tín hiệu), viền tối, đầu dây có chân cắm.
- Callout: card kem, icon line trái, tiêu đề UPPERCASE, 1–2 dòng giải thích, nối vào chi tiết bằng đường đứt nét + chấm teal có halo.

### 2.5 Chuyển động (`@keyframes` đọc từ stylesheet)

| Tên | Thời lượng / easing | Dùng cho |
|---|---|---|
| `halo` | 2800ms linear, lặp; scale .6→2.1, opacity .9→0 | chấm neo callout |
| `sch-flow` | stroke-dashoffset → −22px | dòng chạy trên schematic |
| `nudge` | box-shadow teal 0→3px→0 | gợi ý control cần bấm |
| `insp-in` / `insp-up` | opacity 0, translate 6–14px, scale .95 → 1 | inspector/popover xuất hiện |
| `row-pulse`, `param-flash`, `line-flash` | flash nền teal/cam rồi tắt | khi giá trị/dòng code đổi |
| `celebrate` | translateY −5px, scale 1.02 | hoàn thành bài |
| `loader-shine` | translate −100%→300% | loader |

- Site có khối `@media (prefers-reduced-motion)`.
- Electronics 101: dòng điện = **dash vàng chạy dọc dây**, dây đổi màu đỏ→xanh theo phía nguồn, bóng đèn sáng có quầng, nhãn `300 mA` dạng pill navy; schematic có mũi tên chiều dòng.
- LAR khi Run: pill mức logic trên từng dây, dòng code đang chạy tô nền, Serial Monitor in sự kiện.

### 2.6 Bố cục bài 1 màn hình (1440×900, `scrollHeight = 900`)

```
┌ rail icon ~60px ┬ logo + tagline ─────────── card tiến độ (BASICS 0/16) + giờ ┐
│ Home            │                                    ┌ panel phải ~410px ─────┐│
│ Lessons         │  SCENE trung tâm (~65% bề ngang)    │ Tabs OVERVIEW/PINOUT…  ││
│ Components      │  callout neo vào linh kiện          │ Tiêu đề + mô tả + bước ││
│ Simulator       │  schematic popup góc trái           ├────────────────────────┤│
│ Settings        │  toolbar nổi: undo redo − + ⓘ lớp   │ TRY IT: code + ▶       ││
│ Language        │                                    │ Serial monitor          ││
├─────────────────┴── LESSONS: dải card ngang có ảnh linh kiện, < > ─────────────┘
```

- Mobile 375×812: xếp dọc (scene → schematic → toolbar → lessons → panel), tab bar icon cố định ở đáy, `scrollHeight` 1631–1673, không cuộn ngang.
- Chuyển bài: bấm card ở dải Lessons, đổi hash (`#blink`, `#knob`), scene vẽ lại, card active viền accent, card xong có ✓.
- Ngôn ngữ: nút globe ở rail + tiền tố đường dẫn `/fr/`.

## 3. Token đề xuất cho Mạch Mở (cùng tinh thần, không clone)

Giữ bản sắc Mạch Mở (đỏ gạch `#b82f28`, navy `#1d2b49`, nền kem) và tổ chức lại theo hệ "khung trung tính + 1 accent". Accent Mạch Mở là **đỏ gạch**; màu **tín hiệu** là xanh mạch in đậm hơn teal LAR, chỉ dùng cho trạng thái tín hiệu/dòng điện/focus.

| Token mới (`src/styles/tokens.css`) | Giá trị | Vai trò | Tương phản ước tính trên `--mm-bg` |
|---|---|---|---|
| `--mm-bg` | `#f5eedf` | nền trang | |
| `--mm-bg-deep` | `#ece2cf` | rail, vùng chìm | |
| `--mm-surface` | `#fbf6ec` | card/panel | |
| `--mm-surface-glass` | `rgb(251 246 236 / 96%)` | callout trên scene | |
| `--mm-ink` | `#1d2b49` | tiêu đề, nét đậm | ~12:1 |
| `--mm-text` | `#3f4656` | chữ thân | ~8.5:1 |
| `--mm-muted` | `#5b6272` | chữ phụ | ~5.6:1 |
| `--mm-faint` | `#8a7f6e` | chỉ viền/trang trí, không cho chữ | <4.5:1 |
| `--mm-line` / `--mm-line-soft` | `#d4c6b0` / `#e6dccb` | viền | |
| `--mm-accent` | `#b82f28` | CTA, active, thương hiệu | ~5.9:1 |
| `--mm-signal` | `#0f7c80` | tín hiệu HIGH, dòng điện, focus | ~4.9:1 |
| `--mm-signal-soft` | `rgb(15 124 128 / 14%)` | nền flash | |
| `--mm-power` / `--mm-gnd` / `--mm-data` | `#c8372d` / `#2b3242` / `#d98a1c` | màu dây theo vai trò | |
| `--mm-warn` / `--mm-error` / `--mm-ok` | `#a8620a` / `#b3261e` / `#2f7d4f` | chẩn đoán mạch | |
| `--mm-font-display` | `'Bahnschrift SemiCondensed','Arial Narrow',sans-serif` | tiêu đề UPPERCASE | Barlow (OFL) chỉ thêm nếu founder duyệt tự host font |
| `--mm-font-body` | `'Aptos','Segoe UI',system-ui,sans-serif` | thân (giữ hiện tại) | |
| `--mm-font-mono` | `'Cascadia Mono',Consolas,monospace` | code, số đo | |
| `--mm-radius-sm/md/lg` | `4px / 8px / 12px` | | |
| `--mm-shadow-callout` | `0 6px 14px -10px rgb(49 39 24 / 45%)` | | |
| `--mm-dur-fast/base/slow` | `150ms / 220ms / 300ms` | transition | |
| `--mm-ease` | `cubic-bezier(.2,.7,.2,1)` | | |
| `--mm-rail-w` / `--mm-panel-w` / `--mm-header-h` / `--mm-dock-h` | `64px / clamp(340px,28vw,420px) / 56px / 96px` | khung 1 màn hình | |

Mọi cặp chữ/nền cho văn bản phải ≥4.5:1. Số trên là ước tính; Giai đoạn 4 sẽ đo lại bằng script.

## 4. Pattern sẽ áp dụng (Giai đoạn 3, nếu được duyệt)

1. **Khung 1 màn hình (≥1280×720)**: `height:100dvh`, grid `rail | stage | panel`, hàng dưới là dock bước/bài. Nội dung dài vào panel có tab, cuộn nội bộ. <768px: xếp dọc, cuộn dọc, rail thành tab bar đáy.
2. **Stage trung tâm**: canvas mạch hiện có của Mạch Mở ở giữa; toolbar nổi (zoom, lớp schematic, chạy/dừng).
3. **Callout neo**: card kem + đường dẫn đứt nét `5 4` + chấm neo; halo chỉ khi đó là bước cần làm.
4. **Dây theo vai trò** dùng `--mm-power/gnd/data`, viền sáng 2–3px tách khỏi nền.
5. **Dòng điện/tín hiệu do engine điều khiển**:
   - Trace logic (provider bài học / avr8js): pill mức logic trên dây, trạng thái LED lấy từ state mô phỏng; dash chỉ chạy khi `running`, dừng khi stop.
   - Dòng SPICE: độ dày/tốc độ dash tỷ lệ |I| từ eecircuit-engine; hướng theo dấu I. Chưa có kết quả engine → không vẽ dòng, ghi "chưa chạy".
   - Phần không từ engine gắn nhãn **"minh họa"**.
6. **Flash khi giá trị đổi**: 220ms, chỉ khi số từ engine thay đổi.
7. **Panel phải**: tab UPPERCASE condensed, gạch chân 2px accent; khối "Thử ngay" code + chạy; serial monitor thu gọn.
8. **Dock bài**: card ngang, active viền accent, xong có ✓.
9. **Reduced motion**: mọi animation/transition bọc `@media (prefers-reduced-motion: no-preference)`; khi giảm chuyển động, dòng điện = mũi tên tĩnh + số.

## 5. Điều không làm

- Không dựng lại scene 3D cel-shading kiểu LAR (ngoài phạm vi; Mạch Mở đã có scene 3D riêng).
- Không dùng logo, chữ, tagline, họa tiết mạch in hay tên CSS/keyframe của LAR. Tên keyframe ở trên chỉ là bằng chứng quan sát.
