# 03 — Đợt 1: phần còn dở, đa MCU và chạy code trên web

Ngày: 2026-11-14 · Người làm: Claude · Tiếp nối [02-ket-qua.md](02-ket-qua.md).

Quyết định của founder (hỏi ngày 2026-11-14):
- Chạy ESP32: "Làm như cách Learn ESP32 làm".
- Thêm `rp2040js`: đồng ý.
- Model linh kiện: "Làm cả 2" (SVG tự vẽ + model 3D nguồn mở) — **để Đợt 2**.
- Thứ tự: Đợt 1 = phần còn dở + đa MCU.

## 1. Learn ESP32 chạy code thế nào (đã kiểm)

Mở `https://learn-esp32.vercel.app/#blink` bằng Playwright: không có editor chỉnh sửa được (không thấy `textarea`, `contenteditable`, `.cm-content`). Bấm Run chỉ in các dòng "Compiling sketch… Writing… Hard resetting via RTS pin." rồi `GPIO 2 → LOW · GPIO 4 → HIGH`. Không có request mạng nào tới máy chủ biên dịch hay file WASM giả lập; chỉ tải các bundle JS (`index-*.js`, `stage-*.js`, `kit-*.js`). Tức là mô hình hành vi viết sẵn cho từng bài.

Mạch Mở làm cùng tinh thần nhưng **cho sửa code và chạy lại**, và ghi rõ đây là thông dịch, không in log "biên dịch/nạp" giả.

## 2. Đã làm

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| MM-UX-04 lý do khóa | Nút "Mạch lắp thử · logic" có 🔒 + đoạn giải thích ngay dưới hàng nút, nối bằng `aria-describedby` | `CircuitBuilderPage.tsx` (`builder-view-lock-reason`) |
| #9 Thư viện board danh sách–chi tiết | ≥1280×720: danh sách trái cuộn, chi tiết board phải dính (sticky); hàng board gọn, ẩn link nguồn lặp; chọn board không cuộn trang | `.tmp/wip/boards.png` (ảnh kiểm), `one-screen.css` |
| #10 Logic analyzer AVR nhiều kênh | `avr8jsRunner` ghi chuyển mức của mọi chân đang OUTPUT D0–D13, A0–A5 (tối đa 2.048 sự kiện); lab hiển thị thêm kênh ngoài D13 | `tests/firmware-workflow.test.mjs` (test mới) |
| Pico RP2040 chạy firmware thật | Thêm `rp2040js@1.4.1`. Đọc UF2, chạy CPU Cortex-M0+ trong Web Worker (≤1 s mô phỏng, 125 MHz), ghi GPIO 0–29 + UART0. Firmware mẫu **tự lắp ráp từ lệnh Thumb** (không lấy file ngoài): GP25 nháy ~2,08 Hz | `screenshots/review-2026-11-14/after/interact/pico-rp2040-blink.png`, `tests/rp2040-runner.test.mjs` |
| Chạy code Arduino/ESP32 trên web | Trang mới `/tools/sketch` và `/app/tools/sketch` (mục "Chạy code" trong nhóm Công cụ). Trình thông dịch Arduino C++ con; 6 hồ sơ board (ESP32 DevKit V1, ESP32-S3-DevKitC-1, Uno, Nano, Mega 2560, Pico); 5 ví dụ; Serial Monitor, chân đầu ra (LED/PWM), đầu vào (giữ nút, thanh trượt ADC), logic analyzer; lỗi có số dòng | `after/interact/sketch-esp32-button.png`, `sketch-esp32-pwm.png`, `sketch-uno-375.png`; `tests/sketch-interpreter.test.mjs` |

### Trình thông dịch sketch hỗ trợ
- Kiểu `int/long/unsigned/float/double/bool/byte/char/uintN_t/String`, mảng 1 chiều có khởi tạo, `const`, `#define`.
- Hàm người dùng có tham số và `return`, đệ quy ≤64 tầng; `if/else`, `while`, `do…while`, `for`, `break`, `continue`, toán tử C (gồm `?:`, `+=`, bit), chia số nguyên cắt phần lẻ như C.
- `pinMode`, `digitalWrite/Read`, `analogRead` (12 bit ESP32, 10 bit AVR/Pico), `analogWrite`, `ledcAttach/ledcWrite/ledcSetup/ledcAttachPin`, `delay`, `delayMicroseconds`, `millis`, `micros`, `Serial.begin/print/println/printf` (DEC/HEX/BIN), `map`, `constrain`, `min/max/abs`, `random/randomSeed`, `sqrt/pow/sin/cos…`, `String()`.
- Luật board: chân không tồn tại → lỗi; ESP32 GPIO 34–39 không được OUTPUT; `LED_BUILTIN` không có trên ESP32-S3-DevKitC-1; `analogRead` trên chân không có ADC → lỗi.
- **Không hỗ trợ** (báo lỗi rõ): `switch/case`, con trỏ/struct/class, `WiFi`, `Wire` (I²C), `SPI`, BLE, ngắt, đa nhiệm FreeRTOS.
- Thời gian ảo: mỗi thao tác cộng 0,25 µs; `delay` nhảy thời gian. Không phản ánh tốc độ CPU thật.

## 3. Trung thực về mức mô phỏng

| Công cụ | Loại | Ghi chú trên UI |
|---|---|---|
| `/tools/sketch` | Thông dịch mã nguồn | "Không biên dịch và không nạp firmware thật; WiFi, I²C, SPI chưa mô phỏng" |
| Pico (trang firmware) | Giả lập CPU thật (rp2040js) | Chưa nạp bootrom RP2040 → UF2 từ Pico SDK/Arduino-Pico có thể dừng sớm; firmware mẫu không cần bootrom |
| Uno/Nano (trang firmware, lab) | Giả lập CPU thật (avr8js) | Như cũ, thêm kênh logic analyzer |
| ESP32 firmware thật | **Chưa có** | Chưa có giả lập ESP32 mã nguồn mở chạy trong trình duyệt |

## 4. File

Mới: `src/lib/sketchInterpreter.ts`, `src/pages/SketchRunnerPage.tsx/.css`, `src/lib/rp2040Runner.ts`, `src/workers/rp2040.worker.ts`, `src/components/firmware/Rp2040FirmwarePanel.tsx`, `tests/sketch-interpreter.test.mjs`, `tests/rp2040-runner.test.mjs`, `e2e/sketch-and-pico.spec.mjs`.

Sửa: `package.json`/`package-lock.json` (`rp2040js`), `src/App.tsx` (2 route), `src/data/productRoutes.ts`, `src/data/productFeatureRegistry.ts` (mục "Chạy code"), `src/lib/avr8jsRunner.ts`, `src/components/builder/SimulationInstrumentsPanel.tsx`, `src/components/builder/DigitalWaveform.tsx` (prop `engineLabel`, `maxEvents`), `src/pages/FirmwareHexToolPage.tsx`, `src/pages/BoardCatalogPage.tsx`, `src/pages/CircuitBuilderPage.tsx`, `src/styles/one-screen.css`, `tests/firmware-workflow.test.mjs`, `tests/spice-routes.test.mjs` (regex nhóm Công cụ cho phép thêm mục sau `firmware`; vẫn kiểm `spice` có mặt).

## 5. Kiểm tra (lượt cuối, sau mọi sửa)

| Lệnh | Kết quả | Log |
|---|---|---|
| `npm.cmd run typecheck` | exit 0 | `D:/StartupOS/r3b-typecheck.log` |
| `npm.cmd test` | 557 tests, 557 pass, 0 fail (thêm 9 test mới) | `D:/StartupOS/r3b-test.log` |
| `npm.cmd run build:local` | exit 0 | `D:/StartupOS/r3b-build.log` |
| `npm.cmd run test:e2e` | exit 1 — `Port 5196 is already in use` (process `vite preview` PID 33356 có từ trước phiên; Claude không được phép dừng) | `D:/StartupOS/r3-e2e-official.log` |
| Playwright cùng bộ spec, port 5208 | **75 passed, 3 failed** — 3 lỗi đều đã có ở baseline trước khi sửa (`journeys.spec.mjs:35` ×2, `journeys.spec.mjs:812`); 3 e2e mới đạt | `D:/StartupOS/r3b-e2e-alt.log` |

Lượt đầu có 1 unit test fail: `spice-routes.test.mjs` khóa đúng mảng `['calculators', 'spice', 'firmware']`. Đã đặt `sketch` cuối nhóm và nới regex cho phép thêm mục sau `firmware` (vẫn kiểm SPICE có mặt).

Kiểm tra trình duyệt (dev server): `/app/tools/sketch` ở 1440×900 có `scrollHeight = 900`; 375×812 không cuộn ngang. Không có console error.

## 6. Chưa làm (Đợt 2 trở đi)

- **Model linh kiện chi tiết** (SVG tự vẽ theo datasheet + model 3D nguồn mở có giấy phép) và bổ sung model còn thiếu.
- Nạp **bootrom RP2040** (BSD-3, từ github.com/raspberrypi/pico-bootrom-rp2040) để chạy UF2 Pico SDK — cần founder cho phép tải file.
- Đưa trình thông dịch sketch vào bước "Viết code" của phòng lắp mạch (hiện lab vẫn dùng parser theo mẫu của từng bài).
- Callout neo trên scene kiểu Learn Arduino Red; trang chủ 1 màn hình thật.
- ESP32 chạy firmware thật (cần giả lập Xtensa/RISC-V; chưa có lựa chọn mã nguồn mở chạy trong trình duyệt).
