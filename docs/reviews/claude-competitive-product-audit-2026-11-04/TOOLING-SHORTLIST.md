# Danh sách công cụ ứng viên

Ngày: 04/11/2026. Metadata lấy từ GitHub REST API (xem [SOURCES.md § C](SOURCES.md#c-nguồn-công-cụ-và-model-github-rest-api-04112026)). Mỗi công cụ được xếp vào một trong ba mức:

- **Học ý tưởng:** chỉ đọc để học thiết kế, không dùng mã.
- **Tích hợp kỹ thuật:** dùng trong dev hoặc chạy cục bộ.
- **Được phân phối:** có trong bản public. Mức này cần license tương thích và provenance.

Không cài công cụ nào trong review này.

## Bảng tóm tắt

| Công cụ | Repo · tag/commit | License | Bảo trì | Trình duyệt/WASM | Đường tích hợp | Mức | Lựa chọn thay thế |
|---|---|---|---|---|---|---|---|
| Playwright | microsoft/playwright · v1.64.1 | Apache-2.0 | Tích cực | Điều khiển Chromium/Firefox/WebKit | devDependency, `e2e/` | Tích hợp kỹ thuật (dev) | Vitest browser mode, Cypress |
| axe-core | dequelabs/axe-core · v4.14.0 | MPL-2.0 | Tích cực | Chạy trong trang | `@axe-core/playwright` trong E2E | Tích hợp kỹ thuật (dev) | Lighthouse a11y |
| rp2040js | wokwi/rp2040js · v1.4.1 · `5fbd20508a58` | MIT | Tích cực (18/10/2026) | JS thuần, chạy trong Worker | Vendor giống AVR8js | Có thể phân phối | Tự viết: không khả thi |
| avr8js | wokwi/avr8js · v0.21.1 · `bee6f0a94e0e` | MIT | Tích cực | JS thuần | **Đang dùng** | Đã phân phối được | — |
| EEcircuit-engine (ngspice WASM) | eelab-dev/EEcircuit-engine · `be15b07abaf2` | MIT (wrapper); ngspice có license riêng | Tích cực (25/10/2026) | WASM | **Đang dùng**, bản 1.8.0 | **Bị chặn** cho phân phối | Tự build ngspice (xem dưới) |
| wokwi-elements | wokwi/wokwi-elements · v1.9.2 | MIT | Tích cực | Web Components | Thay một phần visual 2D | Có thể phân phối | Giữ visual hiện có |
| tscircuit / circuit-json | tscircuit · v0.0.3074 / v0.0.543 | MIT / ISC | Rất tích cực, API còn 0.0.x | JS | Tham khảo định dạng JSON mạch | Học ý tưởng | `.machmo.json` hiện có |
| Blockly | RaspberryPiFoundation/blockly · v13.4.0 | Apache-2.0 | Tích cực | JS | Editor khối sinh C subset | Có thể phân phối | MakeCode (nền tảng riêng) |
| glTF-Transform | donmccurdy/glTF-Transform | MIT | Tích cực (20/10/2026) | Node CLI | Script tối ưu GLB, chỉ ở build | Tích hợp kỹ thuật (build) | gltfpack (meshoptimizer) |
| arduino-cli | arduino/arduino-cli · v1.5.1 | **GPL-3.0** | Tích cực | Binary native | Compile phía server, hoặc người dùng tự chạy | Học ý tưởng / tích hợp phía server | Chỉ nhận HEX từ người dùng |
| CircuitJS1 (Falstad) | pfalstad/circuitjs1 · `8ac55f22a036` | **GPL-2.0** | Tích cực | GWT → JS | Không tích hợp | Chỉ học ý tưởng | Tự viết lớp tô màu từ kết quả ngspice |
| Workbox | GoogleChrome/workbox | **chưa xác minh** | — | Service worker | PWA offline | — | Service worker tự viết |
| idb | jakearchibald/idb | **chưa xác minh** | — | IndexedDB wrapper | Lưu project lớn | — | API IndexedDB trực tiếp |
| REA | morluto/rea · 6.8.0 · `1998e65705af` | MIT | — | — | Phân tích `spice.wasm` (`inspect_wasm_artifact`) | Công cụ điều tra, không phân phối | `wasm-objdump` của WABT |

## Spike đề xuất (tiêu chí pass/fail)

| Spike | Pass | Fail → dừng |
|---|---|---|
| Playwright kéo dây | `mouse.move(steps: 10)` tạo đúng 1 dây D13 → R; chạy ổn định 10/10 lần | Kéo dây không ổn định sau khi chỉnh wait/threshold |
| axe 8 route | Báo cáo có danh sách vi phạm theo mức; 0 `critical` sau khi sửa | — |
| rp2040js blink | Mục tiêu ở [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md#slice-4--spike-rp2040-và-vcd-f07-f05--cần-duyệt) | UF2 không boot được sau 2 ngày |
| VCD export | PulseView mở được tệp, đúng số cạnh so với CSV hiện có | — |
| Blockly → subset | 3 bài (blink, button, potentiometer) sinh code mà parser hiện tại chấp nhận | Parser cần mở rộng ngữ pháp lớn |

## ngspice provenance

Hiện trạng:
- `public/vendor/eecircuit-engine/spice.wasm` đến từ gói npm `eecircuit-engine` 1.8.0 (ngspice 45.2).
- `audit:spice-engine` chạy đúng (`v(out)=2.5 V`), nhưng status là `not-cleared` và inventory là `unknown`.
- Gate chặn phát hành vì chưa có bằng chứng artifact này được build từ nguồn nào, bằng toolchain nào, và gồm những thành phần license nào.

| Phương án | Cách làm | Ưu | Nhược | Tiêu chí xong |
|---|---|---|---|---|
| **A. Build tái lập (khuyến nghị)** | Ghim EEcircuit-engine `be15b07abaf2` + tarball ngspice 45.2 từ https://ngspice.sourceforge.io/download.html (ghi SHA-256) + phiên bản Emscripten; build trong container; xuất `spice-engine-provenance.json` | Tự kiểm soát; chứng minh được; cập nhật được | Tốn công thiết lập toolchain; hash có thể khác artifact npm, nên phải đổi sang artifact tự build | 2 lần build cho cùng hash; inventory license đầy đủ; gate đọc provenance |
| B. Xin build record | Mở issue hoặc liên hệ eelab-dev xin lệnh build, phiên bản toolchain, hash nguồn của bản 1.8.0 | Ít công | Phụ thuộc bên ngoài; có thể không có record | Record khớp hash artifact hiện có |
| C. Phát hành tạm không có SPICE | Bản public ẩn `/tools/spice` và handoff; giữ SPICE ở `build:local` | Phát hành nhanh | Mất một điểm khác biệt chính | Gate có chế độ "không có SPICE" được founder duyệt; không đổi metadata artifact |

**REA:** `inspect_wasm_artifact` có thể liệt kê import/export, section và custom section `producers` của `spice.wasm`. Thông tin này hỗ trợ phương án B (ví dụ biết phiên bản Emscripten/clang), nhưng **không thay thế được** provenance. Cần WABT 1.0.42 qua `REA_WABT_BIN_DIRECTORY` và MCP REA đã kết nối; trong phiên này không có tool nào được nạp nên chưa chạy. Một cách nhẹ hơn, không cần REA, là đọc custom section `producers` bằng `wasm-objdump -x`.
