# Mạch Mở · Gói dẫn đường phần mềm (Claude, 05/11/2026)

Claude chỉ ghi trong thư mục này theo phép riêng của user cho phiên này. Không sửa `src/`, `tests/`, `package.json`, `tasks.json`, `AGENTS.md`, `CLAUDE.md`. Codex viết code theo các brief.

## Lộ trình (xếp theo tác động chia chi phí)

| # | ID | Việc | Box | Phụ thuộc | Công sức | Brief |
|---|---|---|---|---|---|---|
| 1 | W3 | Sửa 2 selector E2E, đóng MM-DATA-ID-001 | 05, 07, 08 | — | S | [W3](briefs/W3.md) |
| 2 | G6 | Lưu bằng chứng typecheck/build:local/E2E 28/28 | 07 | W3 | S | [G6](briefs/G6.md) |
| 3 | W5 | Đóng 3 task `in_review` | HQ, 07, 08, 01, 02, 03 | — | S | [W5](briefs/W5.md) |
| 4 | W2 | CSV firmware có SHA-256 HEX; chặn xuất lượt bị dừng | 05, 01, 07, 08 | — | S–M | [W2](briefs/W2.md) |
| 5 | G1 (lát 1) | Spike rp2040js chạy UF2 Arduino C++ biên dịch sẵn trong Node | 02, 05 | HQ duyệt dependency | S | [G1](briefs/G1.md) |
| 6 | W4a | MM-ESP32-001: decision record ESP32 | 02, 01, 08 | — | S | [W4](briefs/W4.md) |
| 7 | W1 | Catalog chọn biến thể điện trở | 05, 06, 07, 08 | Thiết kế box06 | M | [W1](briefs/W1.md) |
| 8 | G5 | Gate ngspice: build lại có provenance, hoặc public không SPICE | 05, 08, founder | Quyết định founder | M | [G5](briefs/G5.md) |
| 9 | W4b | MM-BOM-002: kit giữ biến thể điện trở | 05, 07, 08 | W1 | M | [W4](briefs/W4.md) |
| 10 | G1 (lát 2–3) | Worker + UI Pico chạy UF2 | 05, 06, 07, 08 | G1 lát 1 | M+M | [G1](briefs/G1.md) |
| 11-0 | G2 (lát 0) | Kiểm toolchain ARM64 cho 3 core trước khi mua Raspberry Pi 5 | 02, 08 | — | S | [G2](briefs/G2.md) |
| 11a | G2 (lát 1) | Compile service arduino-cli, pilot trên Raspberry Pi 5 tại chỗ qua tunnel, VPS khi mở rộng (container sandbox) + client | 01, 02, 05, 08, founder, người vận hành | Lát 0; founder chốt người vận hành, hạn mức | L | [G2](briefs/G2.md) |
| 11b | G2 (lát 2) | Nạp `.bin` Arduino lên ESP32 thật bằng esptool-js + Serial Monitor | 05, 02, 08 | W4a, G2 lát 1 | M | [G2](briefs/G2.md) |
| 12 | G4 | Lập trình khối (Blockly) sinh tập con Arduino | 06, 04, 05, 07, 08 | Quyết định nhóm tuổi | M | [G4](briefs/G4.md) |
| 13 | G3 (lát 1) | MQTT ảo trong trang + 1 bài IoT | 04, 01, 05, 08 | Bài học box04 | M | [G3](briefs/G3.md) |

Đề xuất task cho queue: [codex-handoff.md](codex-handoff.md). So sánh tool: [tool-evaluation.md](tool-evaluation.md).

**Khuyến nghị G1/G2 (cập nhật 05/11 theo quyết định founder giữ Arduino C++, xem [founder-decisions.md](founder-decisions.md)):** rp2040js 1.4.1 (MIT) chạy UF2 Arduino C++ cho Pico trong trình duyệt. Code học viên cần compile service arduino-cli (GPL-3.0, chạy làm dịch vụ) trong container sandbox; đây là backend đầu tiên của sản phẩm. Pilot chạy trên Raspberry Pi 5 tại chỗ qua tunnel (06/11), chuyển VPS khi mở rộng. ESP32 không giả lập; nạp `.bin` lên board thật bằng esptool-js 0.7.1 (Apache-2.0) qua Web Serial. MicroPython bị loại.

## Lệnh đã chạy (05/11/2026, Windows 11, tại `electronics-learning-demo`)

| Lệnh | Exit | Dòng kết quả chính |
|---|---|---|
| `npm.cmd test` | 0 | `tests 367`, `pass 367`, `fail 0` |
| `npm.cmd run typecheck` | 0 | Không có lỗi |
| `npm.cmd run build:local` | 0 | `✓ built in 4.65s` |
| `npm.cmd run test:e2e` | 1 | `3 failed`, `25 passed (5.2m)`. Lỗi chính: `Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Tiếp tục lắp mạch', exact: true }) resolved to 2 elements` (xem [W3](briefs/W3.md)). Không có lỗi loopback/EACCES |
| `npm.cmd view <pkg> version license repository.url time.modified dist.unpackedSize` | 0 | Cho rp2040js, avr8js, esptool-js, blockly, mqtt, @wokwi/elements, @playwright/test, @cyclonedx/cyclonedx-npm, license-checker-rseidelsohn, eecircuit-engine, @microsoft/eslint-formatter-sarif (kết quả trong `tool-evaluation.md`) |
| `grep`, `find`, `ls`, `sed` chỉ đọc | 0 | Trích file:dòng trong các brief |

Không chạy `git log`: sản phẩm không có lịch sử riêng trong repo cha (một commit duy nhất `4119a11` của workspace), không giúp kết luận. Không chạy `npm.cmd run build`: không có trong danh sách lệnh được phép; kết quả 05/11 từ review trước ghi trong [G5](briefs/G5.md).

Ngoài các lệnh trên, Claude đọc README và LICENSE của rp2040js, esptool-js, qemu Espressif, micropython trên GitHub (chỉ đọc qua HTTP) để kiểm chứng license và API.

## Phát hiện mới so với dashboard

- E2E chạy được trên máy founder; loopback không bị chặn. Ghi chú `EACCES` của MM-DATA-ID-001 thuộc môi trường agent.
- 3 journey W3 fail do hai nút cùng tên "Tiếp tục lắp mạch" (`src/lib/builderGuidance.ts:51` và `src/pages/CircuitBuilderPage.tsx:1018`), không phải do luồng dữ liệu.
- Trang firmware cho tải CSV của lượt đã bấm dừng (`src/pages/FirmwareHexToolPage.tsx:150`, `:214`).
- `getKitInventory` gộp điện trở theo họ (`src/lib/classroomKit.ts:45-46`), đúng lỗ hổng mà MM-BOM-002 cần sửa.
- `docs/agents/runs/MM-PARALLEL-SETUP-001/review.md` đã có QA PASS cho cả setup lẫn smoke; queue chưa ghi.
- `eecircuit-engine` 1.9.0 đã có trên npm; dự án ghim 1.8.0.

## Nguồn

Mọi file trong danh sách nguồn đều tồn tại. `docs/MACH-MO-MVP-STATUS.md` (700 dòng) chỉ đọc mục lục; `docs/product/2026-11-05-mach-mo-final-contracts.md` và `…-feature-depth-register.md` không đọc toàn văn vì các brief không cần chúng để chỉ file:dòng.

## Skill

Đã gọi: ecc:search-first, ecc:documentation-lookup, my-skills:system-design, my-skills:testing-strategy. my-skills:verification-before-completion và stop-slop đã nạp trước đó trong phiên và được áp dụng khi viết bản cuối. documentation-lookup: không dùng Context7 vì README chính thức đọc trực tiếp đủ; các skill gợi ý cài package hoặc spawn agent đều bị bỏ qua theo phạm vi ghi.
