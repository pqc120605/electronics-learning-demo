# Backlog nâng cấp

Ngày: 04/11/2026.
- Mức độ lỗi: Critical / High / Medium / Low.
- Điểm ưu tiên của tính năng: (Tác động + Rủi ro giảm được) × (6 − Công sức), mỗi yếu tố chấm 1–5. Cùng công thức với [learning-board-upgrade-proposal.md](../../learning-board-upgrade-proposal.md).
- Mỗi mục ghi mức bằng chứng: code / test / browser / hardware / distribution.

## Lỗi đã xác minh

### B01 · Medium · Trùng key React và nút tài liệu lặp trong catalog board — **ĐÃ SỬA**
- **Nơi xảy ra:** `/boards?board=seeed-xiao-esp32-s3`, 1440×900, board XIAO ESP32-S3.
- **Cách tái hiện:** mở route, xem console, đếm các link `a.board-source-link` trong `.board-cad-viewer`.
- **Kỳ vọng:** không có lỗi console; mỗi tài liệu xuất hiện một lần.
- **Thực tế:** 2 lỗi `Encountered two children with the same key … https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/`. Có 10 link, trong đó 2 cặp trùng URL.
- **Nguyên nhân:**
  1. `src/data/boards.ts`: `referenceDocs` của XIAO S3 có hai mục cùng URL guide ("Hướng dẫn…", "Pin map chính hãng…"), còn render dùng `key={doc.url}` (`src/pages/BoardCatalogPage.tsx:74`, `:91`).
  2. Ở 12 board, `sourceEvidenceUrl` cũng nằm trong `referenceDocs`, nên catalog hiện thêm nút "Tài liệu hãng" trỏ cùng file.
- **Bằng chứng:** `screenshots/B01-xiao-s3-duplicate-key.jpg`.
- **Đã sửa:**
  - Gộp hai mục trùng thành một mục "Hướng dẫn, pin map bản thường và phân biệt Sense/Plus".
  - Thêm helper `getCatalogEvidenceUrl(board)` trong `boards.ts`: không hiện nút "Tài liệu hãng" khi một tài liệu có nhãn đã trỏ cùng URL.
  - Thêm test `a board lists each reference link once…` trong `tests/data-integrity.test.mjs`.
- **Kiểm chứng:**
  - Test fail trước khi sửa, pass sau khi sửa.
  - Toàn bộ 349/349 pass; `typecheck` và `build:local` exit 0.
  - Trên trình duyệt sau khi reload: không còn lỗi "same key"; 8 link, cả 8 khác nhau.
  - Mức: **test + browser**.

### B02 · Medium · Nhãn "không chạy firmware" sai cho Uno/Nano
- **Nơi xảy ra:** `/boards?board=arduino-uno`, bảng so sánh, hàng "Phòng thử".
- **Cách tái hiện:** mở route, chọn so sánh Uno với một board khác, đọc hàng "Phòng thử".
- **Kỳ vọng:** Uno/Nano ghi rõ "chạy HEX ATmega328P đã biên dịch trong công cụ firmware (AVR8js)"; parser bài học vẫn là subset.
- **Thực tế:** "Có hồ sơ mô phỏng hành vi cơ bản trong phòng thử; không chạy firmware." Trong khi đó `/tools/firmware-hex` đã chạy được HEX Uno (`screenshots/T01-firmware-tool-run.jpg`).
- **Nguyên nhân:** `src/data/boardCapabilityRegistry.ts:107` dùng một câu cho mọi board có target, không đọc khả năng firmware.
- **Cách sửa tối thiểu:** thêm nhánh cho board có MCU `ATmega328P` (Uno, Nano), hoặc thêm cờ `firmwareTool: 'avr8js'` vào capability, rồi sinh câu từ cờ đó.
- **Kiểm chứng:** test khẳng định nhãn của Uno và Nano không chứa "không chạy firmware", còn ESP32 vẫn chứa. Mức: **code + browser** (văn bản lấy bằng `get_page_text`).

### B03 · Low · Ghi chú SPICE lộ id nội bộ
- **Nơi xảy ra:** `/build?lesson=blink&guided=1` (Uno), khối "SPICE · mạch analog".
- **Thực tế:** "Board board-1 có chân ledOut có dây. SPICE không chạy GPIO/firmware…".
- **Kỳ vọng:** dùng tên hiển thị và tên chân thật, ví dụ "Arduino Uno R3 có chân D13 đang nối dây…".
- **Nguyên nhân:** `src/lib/workspaceSpice.ts:170` ghép `part.id` và id chân logic.
- **Cách sửa:** dùng `getCircuitPartDisplayLabel` (đã có) và alias chân của target.
- **Bằng chứng:** `screenshots/B03-lab-spice-note-internal-id.jpg`. Mức: **browser**.

### B04 · Low · Câu tiếng Anh và id nội bộ trong ghi chú SPICE
- **Nơi xảy ra:** `/tools/spice?workspaceSpice=…`, sau khi bấm "Chuyển mạch sang SPICE ↗" với mạch nguồn DC + 220 Ω + LED.
- **Thực tế:**
  - Dòng đầu là "Connectivity comes only from explicit workspace wires; 3D proximity and PCB copper are not used as electrical connections."
  - Các giả định ghi `battery-1: …`, `led-1: …`, `res-1: …`.
- **Nguyên nhân:** `src/lib/workspaceSpice.ts:147` (câu tiếng Anh) và `:213` (dùng `part.id`).
- **Cách sửa:** dịch câu: "Kết nối chỉ lấy từ dây đã nối trong workspace; khoảng cách 3D và đường đồng PCB không được coi là kết nối điện." Đổi `part.id` sang tên hiển thị.
- **Kiểm chứng:** test cho `compileWorkspaceSpice`: các ghi chú không khớp `/[a-z]+-\d+:/`, và không chứa câu tiếng Anh nào ở đầu chuỗi.
- **Bằng chứng:** `screenshots/B04-spice-handoff-english-note.jpg`. Mức: **browser + code**.

### B05 · Medium · BOM kit thiếu dây jumper và cáp USB; hiện id thô
- **Nơi xảy ra:** `/app/classroom-kits`, ESP32 DevKit V1, bài "LED nhấp nháy", 4 trạm.
- **Thực tế:**
  - BOM chỉ có board, breadboard, điện trở 220 Ω, LED.
  - Không có dây jumper, dù thư viện có ảnh tham chiếu `jumper` ở `src/data/componentReferences.ts:37`. Không có cáp USB đúng đầu cho board.
  - Dưới tên linh kiện hiện id thô `breadboard`, `resistor`, `led`.
- **Kỳ vọng:** mỗi trạm có dây jumper (ước lượng theo số dây của bài) và một cáp USB đúng loại cổng của board (Micro-USB / USB-C / USB-B).
- **Nguyên nhân:** `src/lib/classroomKit.ts:29` (`getKitInventory`) chỉ cộng linh kiện trong mạch bài học.
- **Cách sửa:**
  - Thêm "phụ kiện trạm" lấy từ board: loại cổng USB đọc từ `boards.ts`, hoặc ghi "kiểm tra cổng" nếu chưa có dữ liệu.
  - Thêm dây jumper với số lượng = số dây của bài lớn nhất + dự phòng.
  - Ẩn id thô.
- **Kiểm chứng:** test `getKitInventory(['blink'], 4)` có hàng jumper và cáp USB. Mức: **browser**.

### B06 · Gate · Phát hành công khai bị chặn
- `npm.cmd run check:public-release` exit 1: `Public release blocked: the ngspice WASM redistribution gate is not cleared for this exact artifact.`
- **Không vượt gate và không sửa metadata.** Hướng xử lý ở [TOOLING-SHORTLIST.md](TOOLING-SHORTLIST.md#ngspice-provenance) và slice 2 của [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

### Câu hỏi mở (chưa xác minh, không phải lỗi)
- **Q1:** `assemblyLayout.ts` có map asset riêng, có thể lệch với asset lock. Cần đối chiếu lại.
- **Q2:** archive CAD XIAO C3 thiếu LICENSE (theo Codex). Cần mở archive.
- **Q3:** kéo dây bằng chuột hoặc touch thật. Pane không phát `pointermove`; cần Playwright hoặc kiểm tay.
- **Q4:** các lỗi a11y từ 02/11 chưa kiểm lại: menu mobile, focus bị thanh dưới che ở 375 px, cuộn chuột trên canvas 3D.
- **Q5:** 1–5 touch target < 24 px mỗi route ở 375 px; chưa phân tích từng mục.

## Tính năng và năng lực

| # | Mục | Hệ thống | Tác động | Rủi ro | Công sức | Điểm | Phụ thuộc | Bằng chứng nhu cầu |
|---|---|---|---|---|---|---|---|---|
| F01 | E2E Playwright cho 7 hành trình + axe | UX/eng | 4 | 5 | 2 | 36 | — | Không có E2E; pane không kiểm được kéo dây |
| F02 | Build ngspice tái lập, gỡ gate phát hành | Solver | 5 | 5 | 3 | 30 | Toolchain Emscripten | B06 |
| F03 | Capability một nguồn: nhãn firmware/sim sinh từ dữ liệu (sửa gốc B02) | Board | 3 | 4 | 2 | 28 | — | B02; proposal 02/11 mục `describePart` |
| F04 | BOM kit có phụ kiện trạm (B05) | Lớp học | 3 | 2 | 1 | 25 | Dữ liệu cổng USB | B05 |
| F05 | Xuất VCD từ logic analyzer | Firmware | 3 | 1 | 1 | 20 | — | Wokwi (docs) |
| F06 | Schematic tô màu điện áp từ kết quả SPICE | Schematic | 4 | 1 | 3 | 15 | F02 cho bản public | Falstad (docs) |
| F07 | RP2040 chạy UF2 (rp2040js) | Firmware | 5 | 2 | 4 | 14 | Spike | Wokwi, CRUMB (docs) |
| F08 | Tiến độ học theo bước (đọc/lắp/chạy) | Học tập | 4 | 2 | 3 | 18 | — | Proposal 02/11 |
| F09 | Quiz tự kiểm cuối bài | Học tập | 3 | 1 | 2 | 16 | — | Circuit Camp (docs) |
| F10 | Breakpoint/step cho AVR8js | Firmware | 4 | 1 | 4 | 10 | F05 | Wokwi GDB, Proteus (docs) |
| F11 | Upload Web Serial cho Uno (HEX có sẵn) | Firmware | 4 | 3 | 4 | 14 | Quyết định về arduino-cli | AIXenix (docs) |
| F12 | Broker MQTT giả lập trong tab | IoT | 4 | 1 | 4 | 10 | F07 hoặc ESP32 | Wokwi (docs) |
| F13 | Chia sẻ bằng link (nén vào URL fragment, không cần server) | Project | 3 | 2 | 2 | 20 | Giới hạn kích thước URL | Wokwi, AIXenix (docs) |
| F14 | Lớp học có mã lớp và nộp bài | Lớp học | 5 | 2 | 5 | 7 | Backend, chính sách dữ liệu | Arduino Education (docs) |
| F15 | Tách `CircuitBuilderPage.tsx` (930 dòng) | UX/eng | 2 | 3 | 4 | 10 | F01 làm lưới an toàn | Codex, proposal 02/11 |
| F16 | Lập trình khối (Blockly → C subset) | Học tập | 4 | 1 | 4 | 10 | Parser subset | MakeCode, Proteus (docs) |

Không đưa vào backlog: nhận diện pinout từ ảnh bằng AI (rủi ro sai cao, trái với nguyên tắc bằng chứng); Steam/marketplace.
