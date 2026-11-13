# Đánh giá tool theo nhu cầu · 05/11/2026

Dữ liệu npm lấy bằng `npm.cmd view <pkg> version license repository.url time.modified dist.unpackedSize` ngày 05/11/2026. `time.modified` là lần đổi metadata gần nhất trên registry, gần với ngày release mới nhất nhưng không đồng nghĩa. `dist.unpackedSize` là kích thước gói npm, **không phải** kích thước bundle sau build; bundle thật [chưa kiểm chứng] cho đến khi box05 build.

Stack hiện tại: React 19, Vite, TypeScript, Web Worker cho emulator (`src/workers/avr8js.worker.ts`), test `node --test`, E2E Playwright 1.64.1 (`package.json`).

**Quy ước gate:** mọi tool GPL/AGPL, và mọi WASM hoặc binary firmware phân phối lại, ghi **[gate G5]**: cần provenance, license từng thành phần và NOTICE gắn hash trước khi phát hành công khai.

## 1. Chạy firmware thật (G1)

| Tool | Version | License | time.modified | Chạy ở | Gói npm | Hợp stack | Rủi ro |
|---|---|---|---|---|---|---|---|
| **rp2040js** | 1.4.1 | MIT | 2026-10-18 | Trình duyệt (Worker), Node | 0,85 MB | Cao: cùng tác giả, cùng mô hình với `avr8js` đang dùng | Bootrom và loader UF2 nằm trong `demo/`, không export; flash không ghi được; không giả lập Wi‑Fi Pico W; chưa hỗ trợ RP2350 |
| MicroPython UF2 cho Pico (**loại**, founder giữ Arduino C++) | — | MIT (LICENSE repo micropython, đọc 05/11) | — | Chạy trên rp2040js | — | Không cần compiler | Giữ dòng này để lưu lý do loại |
| avr8js (đang dùng) | 0.21.1 | MIT | 2026-08-31 | Worker | 0,40 MB | Đang chạy | Chỉ AVR |
| QEMU Espressif | nhánh `esp-develop` | **GPL-2.0** (COPYING repo) | — | Native, cần server | — | Thấp: cần process riêng mỗi phiên | **[gate G5]** nếu phân phối binary; chi phí CPU server |
| Wokwi (dịch vụ) | — | Thương mại | — | Cloud | — | Trung bình | Phí theo học viên (Classroom 30 USD/học viên/học kỳ, wokwi.com/classroom, 05/11); phụ thuộc bên ngoài |

**Khuyến nghị (cập nhật 05/11 theo quyết định founder giữ Arduino C++):** rp2040js chạy firmware Arduino C++ đã biên dịch (UF2). Lý do: license MIT, mô hình worker giống AVR8js đã chạy ổn, README ghi "runs Arduino code". Code học viên cần compile service (mục 2). **Dự phòng:** khi compile service chưa có, chỉ chạy UF2 mẫu biên dịch sẵn. MicroPython bị loại theo quyết định founder.

## 2. Compile (G2)

| Tool | Version | License | Chạy ở | Backend / chi phí | Rủi ro |
|---|---|---|---|---|---|
| Không compile: MicroPython | — | MIT | Thiết bị/emulator | Không | Đổi ngôn ngữ học liệu |
| arduino-cli | v1.5.1 (theo `docs/reviews/claude-competitive-product-audit-2026-11-04/SOURCES.md`) | **GPL-3.0** | Server | Có: container, CPU theo lượt, sandbox mã người dùng | Bảo mật, chi phí; **[gate G5]** nếu phân phối trong app companion |
| Toolchain compile trong trình duyệt (WASM) | — | GCC là GPL | Trình duyệt | Không | Không tìm thấy gói npm được bảo trì cho Arduino core [chưa kiểm chứng, 1 lần tìm]; **[gate G5]** |

**Khuyến nghị (cập nhật 05/11):** compile service arduino-cli trong container không mạng, có giới hạn CPU/RAM/thời gian và rate limit; box08 duyệt sandbox trước khi mở. **Dự phòng:** xuất `.ino` + hướng dẫn Arduino IDE như hiện nay, và UF2/HEX mẫu biên dịch sẵn.

## 3. Nạp board thật (G2, W4a)

| Tool | Version | License | time.modified | Chạy ở | Gói npm | Rủi ro |
|---|---|---|---|---|---|---|
| **esptool-js** | 0.7.1 | Apache-2.0 | 2026-11-02 | Trình duyệt qua Web Serial | 0,87 MB | Web Serial chỉ có trên Chromium desktop; cần firmware `.bin` **[gate G5]** |
| Arduino IDE / arduino-cli trên máy học viên | — | [chưa kiểm chứng license IDE] | Máy người dùng | Không | Học viên tự cài; đây là đường hiện tại qua `.ino` |

**Khuyến nghị (cập nhật 05/11):** esptool-js nạp `.bin` Arduino do compile service tạo cho `esp32-devkit`, sau đó Serial Monitor qua Web Serial. **Dự phòng:** giữ xuất `.ino` + hướng dẫn Arduino IDE (`docs/arduino-toolchain-handoff.md`).

## 4. Lập trình khối (G4)

| Tool | Version | License | time.modified | Gói npm | Rủi ro |
|---|---|---|---|---|---|
| **blockly** | 13.4.0 | Apache-2.0 | 2026-11-02 | 17,6 MB | Bundle lớn [chưa kiểm chứng sau tree-shaking], bắt buộc lazy-load; kéo thả khó ở 375 px |
| Microsoft MakeCode | — | MIT [theo `SOURCES.md` 04/11] | — | — | Là cả nền tảng, không phải thư viện nhúng; khó gắn vào parser hiện có |

**Khuyến nghị:** Blockly với generator sinh tập con Arduino mà `parseSupportedArduinoSubset` đã nhận. **Dự phòng:** nếu founder bỏ G4, không làm khối.

## 5. MQTT / IoT (G3)

| Tool | Version | License | time.modified | Gói npm | Ghi chú |
|---|---|---|---|---|---|
| Broker ảo tự viết | — | Mã của dự án | — | — | Khoảng 100 dòng, không mạng; đủ cho lát 1 |
| **mqtt** (MQTT.js) | 5.16.1 | MIT | 2026-10-14 | 1,85 MB | Trình duyệt qua WebSocket; cần broker thật |
| Mosquitto (broker tự host) | — | EPL-2.0 / EDL-1.0 [chưa kiểm chứng trong phiên] | — | — | Chạy server; không phân phối trong web app |

**Khuyến nghị:** lát 1 broker ảo trong trang, không thêm package. **Dự phòng:** MQTT.js + broker tự host khi G2 có board thật.

## 6. E2E khi loopback bị chặn (W3, G6)

Thực tế 05/11: E2E chạy được trên máy founder (25/28 pass). Loopback chỉ bị chặn trong môi trường agent.

| Cách | Cần cổng mạng | Thay đổi | Rủi ro |
|---|---|---|---|
| **Chạy trên máy founder**, hoặc cấp quyền loopback cho riêng lệnh `test:e2e` trong sandbox agent | Có (127.0.0.1:5196) | Không | Phụ thuộc người/quyền |
| Playwright `page.route` phục vụ `dist/` từ đĩa | Không | Thêm config/fixture Playwright (lease riêng) | Service worker/PWA và Worker module cần kiểm thêm [chưa kiểm chứng]; `BrowserRouter` (`src/main.tsx:3`) cần fallback `index.html` |
| Test logic bằng Node (đã có 367 test) | Không | — | Không thay được kiểm tương tác trình duyệt |

**Khuyến nghị:** cấp quyền loopback cho `test:e2e` hoặc chạy trên máy founder. **Dự phòng:** `page.route` không mở cổng. Playwright 1.64.1 (Apache-2.0) đã có, không cần thêm package.

## 7. License / SBOM cho G5

| Tool | Version | License | time.modified | Vai trò |
|---|---|---|---|---|
| **@cyclonedx/cyclonedx-npm** | 6.0.1 | Apache-2.0 | 2026-08-11 | Xuất SBOM CycloneDX từ cây npm |
| license-checker-rseidelsohn | 5.0.1 | BSD-3-Clause | 2026-07-15 | Liệt kê license dependency, chặn danh sách cấm |
| Script upstream `build-ngspice.sh` (EEcircuit-engine) | theo tag | MIT (wrapper) | — | Build lại WASM có `build-meta.json` (từ 1.9.0) |
| eecircuit-engine | 1.9.0 có sẵn; dự án ghim 1.8.0 | MIT (wrapper) | 2026-10-31 | **[gate G5]** WASM ngspice: Modified BSD với ngoại lệ LGPL/MPL theo `docs/spice-redistribution-audit-2026-11-03.md:68` |

**Khuyến nghị:** build lại WASM từ tag ghim + CycloneDX cho phần JS. **Dự phòng:** bản public không kèm SPICE (G5 phương án C).

## Kênh tìm kiếm đã dùng

npm registry (`npm.cmd view`), README và LICENSE trên GitHub (rp2040js, esptool-js, qemu Espressif, micropython), tài liệu trong repo. Không dùng Context7: README chính thức của rp2040js và esptool-js đọc trực tiếp được và đủ cho đánh giá.
