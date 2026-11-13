# Nguồn và mức bằng chứng

Mọi nguồn web được truy cập ngày **04/11/2026**. Nội dung được lấy bằng context-mode (`ctx_fetch_and_index`, `ctx_execute` với `fetch`), hoặc bằng built-in browser khi trang là SPA. Chỉ có tóm tắt claim, không chép nội dung.

Cột **Loại bằng chứng**:
- `docs`: trang chính thức nói có.
- `browser`: đã mở và thao tác trên trình duyệt.
- `api`: dữ liệu từ GitHub REST API.
- `không đọc được`: tải trang thất bại hoặc không có nội dung.

## A. Bằng chứng nội bộ Mạch Mở

| Mã | Nguồn | Claim hỗ trợ |
|---|---|---|
| M-code | Source `D:\StartupOS\electronics-learning-demo\src\…` (file:line ghi trong REPORT/BACKLOG) | Có hoặc không có trong code |
| M-test | `node --test --test-concurrency=1 tests/*.test.mjs` → 349/349 pass sau khi sửa | Asset lock, toàn vẹn dữ liệu, link tham chiếu không trùng |
| M-browser | `http://localhost:5173` (Vite dev), Claude Browser, 1440×900 và 375×812 | Luồng đã thao tác; ảnh trong `screenshots/` |
| M-learn | `/learn`, `src/data/curriculumSchema.ts`, `src/data/learningPath.ts` | 11 bài, tiên quyết có kiểu |

## B. Sản phẩm tham chiếu

| Mã | URL | Loại | Claim được hỗ trợ | Chưa xác minh |
|---|---|---|---|---|
| S-wokwi-docs | https://docs.wokwi.com/ (các mục: supported hardware, logic analyzer, GDB debugging, serial monitor, WiFi/IoT Gateway, diagram.json, Custom Chips) | docs | Logic analyzer xuất VCD sang PulseView; GDB (F1, breakpoint); serial monitor cấu hình trong `diagram.json`; WiFi ảo có Internet, MQTT, HTTP; IoT Gateway; Custom Chips C API (beta) | Chưa dùng thử simulator |
| S-wokwi-hw | https://docs.wokwi.com/ (supported hardware) | docs | AVR (ATmega328P Uno/Nano, ATmega2560, ATtiny85); ESP32/S2/S3/C3/C5β/C6/C61/H2/P4/S31β; STM32 C031/L031/F103C8; RP2040, RP2350 | Mức độ hỗ trợ ngoại vi từng chip |
| S-wokwi-ci | https://docs.wokwi.com/ (Wokwi CI) | docs | CLI, automation scenario, GitHub Actions, hỗ trợ MCP | Giá CI |
| S-wokwi-price | https://wokwi.com/pricing | docs | Community €0 (mô phỏng không giới hạn, project công khai, WiFi ảo); Hobby €5.6/tháng | Điều khoản dùng trong lớp học |
| S-crumb | https://crumbsim.com/ · https://crumbsim.com/guide/ | docs | App desktop Windows/macOS/Linux bán trên Steam (>100.000 bản); AVR, ESP32, Pico chạy firmware thật; scope, multimeter, FFT; logic số tới máy tính 8-bit; 10 tầng thử thách và chiến dịch học; Component API; Steam Workshop; undo 50 bước/tab; Ctrl+D; Flip Polarity; CRUMB Advanced "Coming soon", miễn phí cho người đã mua | Chưa dùng thử |
| S-proteus | https://www.labcenter.com/ | docs | VSM: SPICE hỗn hợp + đồng mô phỏng MCU kèm ngoại vi; breakpoint, chạy từng bước, xem biến; Visual Designer (flowchart cho Arduino/Raspberry Pi); IoT Builder; Proteus 9 ProPilot AI; VSM System Meter; trả phí | Giá cụ thể; chưa dùng thử |
| S-aixenix | https://arduino.aixenix.com/en/ | docs | Bàn 3D; C++ thật; giả lập ATmega328P/2560 (timer, PWM, ADC, ngắt, serial); trợ lý AI; chế độ direct và breadboard; upload USB trên Chrome/Edge; pinout từ ảnh; link chia sẻ; tài khoản cloud; 26 project | Chưa dùng thử; độ chính xác giả lập |
| S-camp | https://arduinax.com/ | docs | Tuổi 9–15; 12 bài có quiz; 18 linh kiện trong lab 3D; 14 máy; trang phần cứng thật, khắc phục sự cố, an toàn, từ vựng | Chưa dùng thử |
| S-lavercel | https://learnarduino.vercel.app/ | docs | Chỉ Uno; 16 thí nghiệm trên trình duyệt; Uno 3D; điều khiển bài học; theo dõi tín hiệu | Không coi là cùng sản phẩm với S-laFR |
| S-laFR | https://learn-arduino-red.vercel.app/fr/ | browser | SPA; Uno 3D có hotspot gắn nhãn (Port USB, broches d'alimentation, microcontrôleur, broches numériques/analogiques); 16 bài; tab Aperçu/Brochage/Exemple/Spécifications; panel code; Moniteur série; tiến độ 0/16; điều hướng dưới; credit thiết kế x.com/DilumSanjaya. Ảnh: `screenshots/R01-learn-arduino-fr-reference.jpg` | License asset; không sao chép UI hay asset |
| S-falstad | https://www.falstad.com/circuit/ · repo `pfalstad/circuitjs1`, `sharpie7/circuitjs1` | docs, api | Schematic động, màu điện áp, chấm dòng. CircuitJS1 là **GPL-2.0** | — |
| S-pindexio | https://pindexio.com/esp32-c3-devkitm-1/ | docs | Bảng pin có cảnh báo strapping; wiring; PCB Maker beta; link affiliate Shopee | Độ chính xác pin |
| S-arduedu | https://www.arduino.cc/education/ | docs | Kit kèm nội dung online; Alvik (Nano ESP32); PLC Starter Kit; Science Kit R3 | Tính năng quản lý lớp |
| S-makecode | https://makecode.com/ | docs | Block sinh ra code thật; editor gồm blocks, language editor, simulator, code generator | — |
| S-blockly | https://github.com/RaspberryPiFoundation/blockly | api | Apache-2.0; release `blockly-v13.4.0`; đã chuyển sang Raspberry Pi Foundation | — |
| S-spike | Trang LEGO Education SPIKE Prime | docs | Đã ngừng bán; app hỗ trợ tới 30/06/2031 | — |
| S-tinkercad | https://www.tinkercad.com/circuits | không đọc được | SPA; chỉ lấy được tiêu đề | Mọi tính năng |
| S-ohstem | https://ohstem.vn/xbot/ | không đọc được | Trang render bằng JS; không trích được nội dung | Mọi tính năng |
| S-littlebird | Little Bird "Crack the Code" | không đọc được | HTTP 403 | Mọi tính năng |

## C. Nguồn công cụ và model (GitHub REST API, 04/11/2026)

| Repo | License | Release / tag mới nhất | Commit HEAD | Ghi chú |
|---|---|---|---|---|
| wokwi/avr8js | MIT | v0.21.1 (31/08/2026) | `bee6f0a94e0e` | Đang dùng (vendored) |
| wokwi/rp2040js | MIT | v1.4.1 (18/10/2026) | `5fbd20508a58` | Ứng viên MCU thứ hai |
| wokwi/wokwi-elements | MIT | v1.9.2 | `5178c0cc1b45` | Web component linh kiện |
| eelab-dev/EEcircuit-engine | MIT | không có release | `be15b07abaf2` (25/10/2026) | Nguồn của `eecircuit-engine` 1.8.0 đang dùng |
| eelab-dev/EEcircuit | MIT | v3.1 | `0db7d45870bf` | UI tham khảo |
| sharpie7/circuitjs1 | GPL-2.0 | không có release | `dd47cf43a1ba` (push cuối 2024) | Chỉ học ý tưởng |
| pfalstad/circuitjs1 | GPL-2.0 | không có release | `8ac55f22a036` | Đang được cập nhật |
| tscircuit/tscircuit | MIT | v0.0.3074 | `9d9dac87426b` | Mạch dạng code (React) |
| tscircuit/circuit-json | ISC | v0.0.543 | — | Định dạng mạch JSON |
| RaspberryPiFoundation/blockly | Apache-2.0 | blockly-v13.4.0 | — | Lập trình khối |
| arduino/arduino-cli | GPL-3.0 | v1.5.1 | — | Compile/upload; lưu ý copyleft khi phân phối |
| microsoft/playwright | Apache-2.0 | v1.64.1 | — | E2E |
| dequelabs/axe-core | MPL-2.0 | v4.14.0 | — | a11y |
| donmccurdy/glTF-Transform | MIT | — | push 20/10/2026 | Tối ưu GLB |
| GoogleChrome/workbox | **chưa xác minh** (giới hạn rate API) | — | — | PWA |
| jakearchibald/idb | **chưa xác minh** (giới hạn rate API) | — | — | IndexedDB |
| ngspice | https://ngspice.sourceforge.io/download.html | docs | Trang tải nguồn chính thức; dùng cho phương án build tái lập | — |
| morluto/rea (plugin REA) | MIT | 6.8.0 | `1998e65705af` | Có trong máy; tool MCP không được nạp trong phiên |

Giới hạn: GitHub REST API trả lỗi rate limit sau khoảng 14 repo. License của Workbox và idb cần xác minh lại trước khi dùng.
