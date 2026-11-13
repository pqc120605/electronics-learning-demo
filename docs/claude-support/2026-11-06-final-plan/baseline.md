# Baseline · 06/11/2026

## Lệnh đã chạy (exit code thật)

| Lệnh | Thư mục | Exit | Kết quả |
|---|---|---|---|
| `node docs/agents/validate.mjs` | `D:\StartupOS` | 0 | 20 task, 143 capability, 0 lỗi |
| `npm.cmd run typecheck` | project | 0 | |
| `npm.cmd test` | project | 0 | 367/367 đạt (lượt đầu cùng ngày bị lỗi `spawn -4094` ở chế độ song song; lượt này đạt) |
| `npm.cmd run build:local` | project | 0 | |
| `npm.cmd run check:public-release` | project | **1** | chặn: ngspice WASM `ed799542…ae886e4` chưa cleared (5 điều kiện thiếu) |
| e2e `test:e2e` (từ phiên khác, không chạy lại) | project | — | 25/28, 3 ca đỏ do hai nút "Tiếp tục lắp mạch" trùng tên [báo cáo software-depth] |

Chưa chạy: `kicad-cli`, lint (không có script), axe, bench, firmware.

## Track phần cứng · Năng lực | Mức hiện tại | Bằng chứng

Thang: L0 không có · L1 có tài liệu/ý định · L2 có thiết kế đã review · L3 đã đo/chạy thật. Dòng không có bằng chứng: tối đa L1.

| Năng lực | Mức | Bằng chứng |
|---|---|---|
| Nguồn/pin tay cầm | L1 | readiness:12-13; findings H2-H4; gate-matrix.md:63-65 (mọi số bench UNKNOWN, findings:11) |
| Nguồn/công suất robot | L1 | kicad-input-spec-r7.md:190-221; review-result R-04 (cận VM chưa đo) |
| Firmware ESP32 | L0 | repo không có firmware ESP32 (findings H1); MM-ESP32-001, MM-RUN-001 `scoped` (tasks.json:1774, 1689) |
| Pin map / net map | L1 | gate-matrix.md:55-56, 66 |
| Mặt hiển thị (OLED 128x64) | L1 | BOM1:13, 37; spec-r7 J7 |
| Loa (MAX98357A) | L1 | R6:10; BOM2:25, 35 (chưa MPN) |
| Mic / giọng nói | L0 | BOM1:13, 61 ("không mic trên robot") |
| Cảm biến vật cản (HC-SR04, TCRT5000) | L1 | BOM1:40, 54 |
| Khung cơ khí mở / 2 cấu hình | L0–L1 | BOM1:16 (PETG tự in, chưa chốt); gate-matrix.md:53, 69 |
| Điều khiển qua web (kênh radio) | L0 | không có trong tài liệu phần cứng |
| Tay cầm | L1 | gate-matrix 4/32; MOBOT-CTRL/1 (reset-review-candidate-r2.md:11) |
| KiCad project | L0 | gate-matrix.md:61 (chưa có file) |
| EVT/DVT/PVT, bench | L0 | không có tiêu chí vào/ra; bench NOT_RUN |
| Chứng nhận đồ dùng trẻ em | L0–L1 | handset.md:272 (một dòng "cần chuyên gia xác nhận") |

## Track phần mềm · P01–P25 (L0–L3 ≡ D0–D3). Tất cả đường dẫn dưới `src/`

Nguồn: báo cáo subagent (đọc file; các dòng ghi [matrix] lấy từ `2026-11-06-software-depth/depth-matrix.md`). **Không dòng nào đạt L3.**

| P | Mức | Bằng chứng |
|---|---|---|
| P01 Board 3D/pinout | L2 | components/board/BoardViewer.tsx:236 [matrix]; data/learningPath.ts:8-12 |
| P02 Thí nghiệm/tự đánh dấu | L2 | lib/learningProgress.ts:4,101 |
| P03 CRUMB Advanced | L1 | components/builder/SimulationInstrumentsPanel.tsx:52 [matrix] |
| P04 Proteus | L1 | không có module IoT/robot |
| P05 Wokwi | L2 (AVR) / L0–L1 (ESP32) | lib/avr8jsRunner.ts:39-46; data/boardCapabilityRegistry.ts:117-121 |
| P06 Tinkercad | L1 | lib/arduinoSketchExport.ts; lib/classroomKit.ts:137 |
| P07 AIXenix | L1 | lib/builderGuidance.ts:51 [matrix] |
| P08 Arduinax | L1 | nền P02 (nguồn chưa kiểm) |
| P09 Falstad/CircuitJS | L2 | simulation/spiceNetlist.ts:77,145-169 [matrix] |
| P10 Pindexio | L1 | components/board/BoardPinoutExplorer.tsx; data/boardCapabilityRegistry.ts:100-115 |
| P11 Arduino Education | L1 | lib/classroomKit.ts:37,137,181 |
| P12 OhStem xBot (robot) | L0 | chỉ có chữ "robot" ở data/components.ts:32-40, data/boards.ts:222 |
| P13 LEGO SPIKE | L1 | data/learningPath.ts:12 |
| P14 Little Bird | L1 | data/components.ts; lib/educationalProgram.ts |
| P15 EveryCircuit | L2 | pages/SpiceWorkbenchPage.tsx:64,423 [matrix]; lib/savedProjects.ts:118 |
| P16 CircuitLab | L2 | lib/workspaceSpice.ts:282 [matrix] (chỉ .op) |
| P17 KiCad | L1 | lib/kicadSpiceImport.ts; components/pcb/Pcb2DViewer.tsx:37 [matrix] |
| P18 EasyEDA | L0 | lib/classroomKit.ts:117 (chỉ CSV BOM) |
| P19 Fritzing | L1 | components/builder/SchematicView.tsx:107-118 [matrix] |
| P20 Scheme-It | L0 | không tìm thấy xuất ảnh/PDF sơ đồ |
| P21 LCSC | L0 | không có sourcing trong lib/ |
| P22 Arduino IDE 2 | L1 | lib/arduinoSketchExport.ts; pages/FirmwareHexToolPage.tsx:58 |
| P23 Cloud Editor | L0 | không áp dụng ở local; thay bằng local compile bridge (FW-05) |
| P24 QEMU | L0 | chưa có runtime (cần spike) |
| P25 Renode | L0 | như P24 |

Điểm nền: không có `navigator.serial/bluetooth/usb`, không có `getUserMedia`, không có QR, không có `RobotConfiguration` trong `src` (grep của subagent). Đã có: 11 bài/4 chặng (`learningPath.ts:8-12`), `projectBundle.ts`/`savedProjects.ts`/`classroomKit.ts` (gói dự án số có nền), analytics Supabase gửi page_view/lesson_open nếu cấu hình (`analytics.ts:29-45`).
