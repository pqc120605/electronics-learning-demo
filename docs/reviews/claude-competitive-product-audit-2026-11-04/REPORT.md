# Mạch Mở — Review sản phẩm, so sánh đối thủ và kế hoạch nâng cấp

Ngày: 04/11/2026 · Người review: Claude Code (Opus 5.5), chạy trong desktop app · Prompt: `D:\StartupOS\docs\prompt-claude-mach-mo-review-and-competitive-expansion-2026-11-04.md`

Các file đi kèm: [COMPARISON.md](COMPARISON.md) · [comparison.csv](comparison.csv) · [SOURCES.md](SOURCES.md) · [UPGRADE-BACKLOG.md](UPGRADE-BACKLOG.md) · [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) · [TOOLING-SHORTLIST.md](TOOLING-SHORTLIST.md) · [CHANGELOG.md](CHANGELOG.md) · [screenshots/](screenshots/)

Báo cáo liên quan: [Claude web audit 02/11](../claude-web-audit-2026-11-02/REPORT.md) · [Codex project audit 04/11](../codex-project-audit-2026-11-04/REPORT.md)

## 1. Kết luận ngắn

1. **Mạch Mở đã là một sản phẩm học có thật.** Phần cứng mô phỏng tuy hẹp nhưng trung thực. Hai lõi thật hiện có:
   - AVR8js chạy HEX ATmega328P cho Uno/Nano, kèm logic analyzer và UART.
   - ngspice 45.2 (WASM) giải mạch analog. Mạch có thể đi từ workspace sang SPICE, và luồng này đã chạy được trong trình duyệt.
   - Các nhãn giới hạn ("không chạy firmware", "model giáo dục") có mặt ở hầu hết bề mặt.
2. **Chưa thể phát hành công khai.** `check:public-release` fail-closed vì gốc build của artifact ngspice WASM chưa được xác nhận. Đây là gate chặn, không phải lỗi code. Không sửa metadata để vượt qua.
3. **Khoảng cách với đối thủ** không nằm ở số board. Nó nằm ở bốn mảng:
   - Debug firmware: GDB/breakpoint, VCD export.
   - Kết nối IoT: WiFi/MQTT ảo.
   - Đường từ trình duyệt ra board thật: build và upload.
   - Hạ tầng lớp học: lớp nhiều người, chấm bài.

   Wokwi đã có phần lớn mảng IoT/debug (được docs xác nhận). CRUMB và Proteus có scope và co-simulation. Lợi thế riêng của Mạch Mở là:
   - Tiếng Việt.
   - Board CAD có nguồn gốc rõ ràng.
   - Ranh giới bằng chứng rõ ràng.
   - Lộ trình bài học gắn với kit lớp học.
4. **Ưu tiên kế tiếp nên là độ tin cậy và gate phát hành, không phải thêm engine:**
   - Giải quyết provenance ngspice.
   - Thêm E2E cho 7 hành trình.
   - Gom nhãn khả năng mô phỏng về một nguồn.
   - Hoàn thiện BOM kit.

   Sau đó mới mở rộng sang RP2040 (rp2040js, MIT) và VCD export.

## 2. Phạm vi, phương pháp, mức bằng chứng

| Mức | Nghĩa |
|---|---|
| **code** | Có trong source, đã đọc file:line |
| **test** | Có test tự động chạy pass trong phiên này |
| **browser** | Đã thao tác trên `http://localhost:5173` (dev server Vite) trong phiên này |
| **hardware** | Đã chạy trên board thật. **Không có mục nào đạt mức này trong review này.** |
| **distribution** | Đủ điều kiện phân phối công khai (license + provenance). **Chưa đạt** (gate SPICE). |

- **Workspace:** `D:\StartupOS\electronics-learning-demo`.
- **Không review:** `.env` thật, backend/tài khoản (chưa có), PWA offline trên thiết bị thật.
- **Báo cáo Codex 04/11** được dùng như đầu vào để kiểm lại, không coi là sự thật (mục 5).

### Skill và plugin đã kiểm tra và sử dụng

| Skill / plugin | Kiểm tra | Dùng thế nào |
|---|---|---|
| `D:\skill\danh-sach-skill.md` | Đã đọc | Đối chiếu skill có thật trong phiên |
| `ecc:research-ops` | Đã nạp | Tách fact có nguồn / suy luận / khuyến nghị; ghi ngày cho mọi nguồn |
| `rea:reverse-engineer-anything` (REA) | Đã nạp và đọc skill. Plugin REA **6.8.0**, MIT, `github.com/morluto/rea`, commit `1998e65705af`. Plugin khai báo MCP server nhưng **không có tool `rea` nào được nạp trong phiên**. | **Không dùng** cho review source: chính skill nói không dùng REA với repo có source đầy đủ. Ứng viên duy nhất phù hợp là `inspect_wasm_artifact` cho `public/vendor/eecircuit-engine/spice.wasm`, nhưng tool này cần WABT 1.0.42 và MCP đã kết nối, nên chưa chạy. Xem [TOOLING-SHORTLIST.md](TOOLING-SHORTLIST.md#ngspice-provenance). |
| Built-in browser (Claude Browser) | Có | Route, console, viewport 375/1440, thao tác luồng |
| context-mode (`ctx_*`) | Có | Lấy trang đối thủ, index và lọc thay vì đọc HTML thô |

Không gọi Codex hay agent ngoài. Không stage, commit, push hay deploy. Không cài skill hay tool mới. axe-core đã được chuẩn bị nhưng **chưa chạy** (mục 7).

## 3. Lệnh đã chạy và kết quả

| Lệnh | Exit | Kết quả |
|---|---|---|
| `node --test --test-concurrency=1 tests/*.test.mjs` (trước khi sửa) | 0 | 348 pass, 0 fail, 76 s |
| `npm.cmd run typecheck` | 0 | — |
| `npm.cmd run build:local` | 0 | 256 module |
| `npm.cmd run audit:spice-engine` | 0 | DC `v(out)=2.5 V`; status `not-cleared`, inventory `unknown` |
| `npm.cmd run check:public-release` | **1** | `Public release blocked: the ngspice WASM redistribution gate is not cleared for this exact artifact.` → **gate chặn** |
| `npm.cmd run audit:board-models` | 0 | 15 scene (14 board + 1 scene lắp ESP32), `missing=0`, `orphan=0` |
| `npm.cmd run audit:board-model-geometry` | 0 | 87 s; chi tiết không lưu lại |
| `npm.cmd audit --omit=dev` | 0 | 0 lỗ hổng |
| Test mới `reference link once` | 1 → 0 | Fail trước khi sửa, pass sau khi sửa ([CHANGELOG.md](CHANGELOG.md)) |
| Sau khi sửa: `node --test --test-concurrency=1 tests/*.test.mjs` | 0 | **349/349 pass**, 77,6 s |
| Sau khi sửa: `npm.cmd run typecheck`, `npm.cmd run build:local` | 0, 0 | — |

Đếm lại từ source (khớp với Codex):
- 28 board; 14 board có viewer 3D/evidence đã publish; 4 copper viewer.
- 21 builder target; 58 linh kiện; 28 loại trong palette; 37 mesh (25 tham số, 12 CAD nguồn).
- 11 bài học (8 bài parser subset, 3 bài kịch bản cố định).
- `CircuitBuilderPage.tsx` dài 930 dòng.

## 4. Review theo 8 hệ thống con

| # | Hệ thống | Trạng thái | Bằng chứng | Nhận xét chính |
|---|---|---|---|---|
| 1 | Học tập | Tốt, hẹp | code, test, browser | 11 bài có bài tiên quyết dạng dữ liệu, preflight, tiến độ cục bộ. Chưa có quiz chấm tự động hay tiến độ theo bước. |
| 2 | Board & Linh kiện | Mạnh nhất | code, test, browser | Asset lock SHA-256, audit model `missing=0`, nguồn/license từng board. B01 đã sửa; B02 còn mở. |
| 3 | Lắp mạch 3D | Khá | code, browser | 2D/3D đồng bộ; undo/redo đúng (xóa 3 dây → undo 3 lần → 3 dây → redo → 2 dây). Kéo chuột thật trong pane không tạo dây. Chuỗi pointer tổng hợp có `pointermove` thì tạo được dây, nên logic đúng và đây là giới hạn pane. Chuột/touch thật **chưa xác minh**. |
| 4 | Schematic/PCB/net | Một phần | code, browser | Net chỉ từ dây đã nối rõ ràng (được ghi rõ). Copper viewer có 4 board, chưa nối với net workspace. |
| 5 | Code & mô phỏng | Tốt cho AVR | code, test, browser | Công cụ HEX: nút chạy bị khóa tới khi tick xác nhận ATmega328P; đổi board thì bỏ tick. Mẫu blink cho D13 2,03 Hz, duty 50 %, 16.000.001 chu kỳ/1000 ms; có xuất CSV trace. SPICE: ví dụ RC chạy trong 0,5 s. Netlist sai bị từ chối và kết quả cũ bị xóa. Handoff workspace → SPICE chạy với mạch nguồn + 220 Ω + LED, ra `.op` với `v(n003)`, `v(n002)`, `i(v1)`. |
| 6 | Project/PWA | Một phần | code, browser | Lưu cục bộ; xuất/nhập `.machmo.json` ≤ 5 MiB; trạng thái rỗng rõ ràng. Offline chưa kiểm. |
| 7 | Lớp học/cộng đồng/kit | Một phần | code, browser | Planner: in, JSON, gói chia sẻ, CSV, nhập; không thu dữ liệu học sinh. BOM thiếu jumper và cáp USB (B05). Chưa có lớp nhiều người hay cộng đồng. |
| 8 | Website & app workspace | Tốt | browser | 27 route; ở 375 px, 8 route đã đo, không route nào cuộn ngang (`scrollWidth` 371). Skip link và Escape đóng menu desktop đã được sửa kể từ 02/11. |

### Bảy hành trình người dùng

| Hành trình | Kết quả | Ghi chú |
|---|---|---|
| Người mới học | Đạt (browser) | `/learn` → bài blink → lab có hướng dẫn "Sẵn sàng chạy" |
| Tự lắp mạch | Đạt một phần | Undo/redo đạt. Kéo dây bằng chuột thật chưa xác minh. |
| Board/model | Đạt, có lỗi nhỏ | B01 (đã sửa), B02 |
| Firmware | Đạt | HEX mẫu chạy được; logic analyzer và UART hiển thị |
| SPICE | Đạt | Ví dụ và handoff chạy được; B03, B04 là lỗi nội dung |
| Project/PWA | Chưa kiểm hết | Lưu/xuất/nhập chưa thao tác; offline chưa kiểm |
| Lớp học/kit | Đạt một phần | B05 |

## 5. Đối chiếu với báo cáo Codex 04/11

| Điểm Codex | Kết quả kiểm lại |
|---|---|
| Duplicate key ở XIAO S3 | **Xác nhận** (2 lỗi console). Nguyên nhân rộng hơn Codex ghi: 12 board lặp `sourceEvidenceUrl` thành nút thứ hai. **Đã sửa** (B01). |
| Nhãn firmware không nhất quán | **Xác nhận** (B02) |
| Builder 930 dòng | Xác nhận. Nợ bảo trì, không phải bug. |
| Hai đường parser | Xác nhận. Đây là thiết kế có chủ ý, nhưng cần nhãn thống nhất. |
| `assemblyLayout.ts` giữ map asset riêng | **Câu hỏi mở**: chưa kiểm lại trong phiên này |
| BOM thiếu jumper/USB | **Xác nhận** (B05) |
| Không có E2E | Xác nhận: không có Playwright trong `package.json` |
| Provenance SPICE | Xác nhận: gate exit 1 |
| Archive XIAO C3 thiếu LICENSE | **Câu hỏi mở**: chưa mở archive |
| Không có Git baseline riêng | Xác nhận: thư mục nằm trong repo cha `D:\StartupOS`, nhiều file untracked |

## 6. Lỗi đã xác minh

Định dạng đầy đủ ở [UPGRADE-BACKLOG.md](UPGRADE-BACKLOG.md#lỗi-đã-xác-minh).

| ID | Mức | Vị trí | Tóm tắt | Trạng thái |
|---|---|---|---|---|
| B01 | Medium | `/boards?board=seeed-xiao-esp32-s3` | React báo trùng key; nút tài liệu hiện hai lần | **Đã sửa + test** |
| B02 | Medium | `/boards?board=arduino-uno` (bảng so sánh) | "Phòng thử: …không chạy firmware" trong khi công cụ HEX chạy firmware Uno | Mở |
| B03 | Low | `/build?lesson=blink` | Ghi chú SPICE lộ id nội bộ "Board board-1 có chân ledOut…" | Mở |
| B04 | Low | `/tools/spice?workspaceSpice=…` | Câu tiếng Anh trong UI tiếng Việt (`src/lib/workspaceSpice.ts:147`), kèm id `battery-1`, `led-1`, `res-1` | Mở |
| B05 | Medium | `/app/classroom-kits` | BOM thiếu jumper và cáp USB; hiện id thô `breadboard`, `resistor`, `led` | Mở |
| B06 | Gate | Toàn sản phẩm | `check:public-release` exit 1 (provenance SPICE) | Gate chặn |

## 7. Những gì chưa kiểm

- **axe-core:** đã chuẩn bị nhưng chưa chạy.
- **Viewport 768 và 1024:** chưa đo. Ở 375 chỉ đo cuộn ngang và đếm touch target < 24 px (1–5 mục mỗi route, chưa phân tích từng mục).
- **Bàn phím, focus, reduced motion:** chỉ kiểm lại skip link và Escape trên desktop. Chưa kiểm lại: menu mobile, focus bị thanh dưới che ở 375 px, cuộn chuột trên canvas 3D.
- **`/projects`:** chưa thao tác lưu, đổi tên, xuất hay nhập.
- **Kéo dây bằng chuột hoặc touch thật** trên trình duyệt người dùng.
- **Phần cứng thật:** không có.
- **Đối thủ chưa truy cập được:** OhStem xBot (trang render bằng JS), Tinkercad Circuits (SPA, chỉ lấy được tiêu đề), Little Bird Crack the Code (HTTP 403). Ghi "chưa đủ bằng chứng" trong bảng so sánh.

## 8. Năm năng lực thiếu quan trọng nhất

1. **Debug firmware:** breakpoint/step, xem biến, xuất VCD. Wokwi có GDB và VCD sang PulseView; Proteus có breakpoint (docs).
2. **MCU thứ hai chạy firmware thật:** RP2040/RP2350 qua rp2040js (MIT, v1.4.1). Hiện chỉ có ATmega328P.
3. **IoT ảo:** WiFi/MQTT/HTTP giả lập. Wokwi có (docs). Đây là chữ "IoT" trong định vị sản phẩm.
4. **Đường ra board thật:** compile và upload qua Web Serial. AIXenix có upload USB trên Chrome/Edge (docs). arduino-cli là GPL-3.0.
5. **Lớp học có giáo viên:** mã lớp, nộp bài, chấm theo tiêu chí. Cần backend.

Kịch bản trước/sau: [COMPARISON.md](COMPARISON.md#kịch-bản-trướcsau).

## 9. Ba công cụ nên thử trước

| Công cụ | Lý do | Tiêu chí spike |
|---|---|---|
| **Playwright 1.64.1 + axe-core 4.14.0** | E2E cho 7 hành trình và a11y tự động; khắc phục giới hạn kéo dây của pane | Kéo D13 → điện trở bằng `mouse.move` nhiều bước; pass nếu số dây tăng đúng 1 và axe không còn vi phạm `serious`/`critical` ở 8 route |
| **rp2040js 1.4.1 (MIT)** | Cùng tác giả và mô hình với AVR8js; Pico/Pico W đã có CAD | Blink UF2 trên Pico chạy trong Worker; pass nếu GP25 đổi trạng thái ≥ 4 lần trong 2 s mô phỏng |
| **Build ngspice tái lập được** | Gỡ gate phát hành | Build `spice.wasm` hai lần cho cùng hash, có ghi toolchain; `audit:spice-engine` cho `v(out)=2.5 V` |

## 10. Bước tiếp theo

1. Slice 1: E2E + a11y + sửa B02–B05.
2. Slice 2: gỡ gate SPICE bằng build tái lập.
3. Slice 3: nhãn khả năng mô phỏng một nguồn (sửa gốc B02).
4. Slice 4: spike RP2040 + VCD export.
5. Slice 5: lớp học có tài khoản (cần quyết định sản phẩm).

Chi tiết: [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

## 11. Quyết định cần founder

1. **Provenance SPICE:** tự build lại, hay xin build record từ eelab-dev? Hay tạm phát hành không có SPICE?
2. **MCU thứ hai:** RP2040 (dễ, MIT) hay ESP32 (thị trường VN lớn hơn, nhưng chưa có emulator mở tương đương trong trình duyệt)?
3. **arduino-cli (GPL-3.0):** chạy phía máy chủ, hay chỉ nhận HEX do người dùng tự build?
4. **Lớp học có tài khoản:** làm trong năm nay, hay giữ mô hình "gói chia sẻ thủ công"?
5. **Hai đường mô phỏng code:** giữ cả parser subset và HEX với nhãn rõ, hay chuyển dần bài học sang HEX biên dịch sẵn?
