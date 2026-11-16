# 05 · Audit model, bài học phòng lắp mạch và luồng tín hiệu

Ngày: 2026-11-14 · Phạm vi: `public/models/**`, manifest/pin anchors, 11 bài trong `builderLessons.ts`, các view 2D/schematic/3D/breadboard, mô phỏng luồng tín hiệu. Không commit.

## 1. Lỗi tìm thấy và đã sửa

| # | Mức | Vị trí | Lỗi (bằng chứng) | Sửa |
|---|---|---|---|---|
| M1 | Cao | `public/models/esp32-s3-devkitc-1-v1.1.glb` node `J1`, `J3` | Hai header 1×22 nằm **ngang qua board**: bounding box 55,9 × 11,5 × 2,5 mm theo trục X, trong khi 22 pad trong `esp32-s3-devkitc-1.pin-anchors.json` chạy dọc trục Z (178,0 → 231,4 mm). Toàn model đo 84 × 74 mm, board thật 25,4 × 69 mm. Nguyên nhân: footprint PADS đặt pad theo trục X cục bộ, còn STEP KiCad `PinHeader_1x22` dựng chân theo trục Y. | Xoay thêm +90° quanh trục dọc cục bộ cho node J1/J3 (chỉ đổi quaternion trong JSON chunk GLB, không đổi mesh). Sau sửa: J1 x −271,1…−268,6, z 176,7…232,6 mm (phủ đúng 22 pad ±1,27 mm). |
| M2 | Cao | cùng GLB, node `U4` (ESP32-S3-WROOM-1) | Module lệch 5,3 mm ra ngoài mép trái và 11,6 mm ra ngoài đầu board. Gốc footprint PADS ở pad 1 (pad x 0,25…17,75; hàng đáy y 17,76), còn STEP KiCad đặt tâm thân ở gốc. | Dịch U4 +9,0 mm (X) và +5,26 mm (Z): thân 18 × 25,5 mm canh giữa hai header, antenna nhô 6,3 mm. Tổng chiều dài model 69,1 mm, khớp kích thước hãng 69 mm. |
| M3 | Trung bình | `component-models.manifest.json` + `scripts/generate-component-models.mjs:77` · `tb6612` | Hàng chân thứ hai có thứ tự `stby, ain1, ain2, pwma` ở x −1,27…6,35, trong khi hàng một là `vm, vcc, gnd, a01, a02` từ x −8,89. Breakout SparkFun ROB-14451 có hai cột cùng chiều: VM‑VCC‑GND‑AO1‑AO2… và PWMA‑AIN2‑AIN1‑STBY‑BIN1‑BIN2‑PWMB‑GND. Chân 3D vì vậy cắm sai lỗ breadboard. | Hàng hai thành `pwma −8,89, ain2 −6,35, ain1 −3,81, stby −1,27`; các chân NC còn lại được tính lại. Mesh không đổi vì 16 chân vàng vẫn đủ. |
| L1 | Cao | bài `dc-motor-driver` · `lessonCircuits.ts`, `assemblyLayout.ts:145`, `breadboardDiagram.ts` | AIN1 nối `board:input`, AIN2 nối `board:trig`. Cả hai alias đều ánh xạ về **cùng một GPIO** (`['input', byGpio(input)], ['trig', byGpio(input)]`), nên AIN1 = AIN2 luôn bằng nhau và motor không quay theo chiều nào. Thêm vào đó, PWMA đi qua chân `ECHO` (kiểu input), còn STBY `seg0` trùng D2 với input trên Uno. | AIN1 = input, AIN2 = chân LED, PWMA = input+1 (D3 có PWM trên Uno; GPIO19 trên ESP32), STBY = `seg6` (D8 / GPIO32). `getLessonBoardSupport` khóa bài nếu chân trùng hoặc board chưa có bảng chân STBY. |
| L2 | Cao | bài `ultrasonic-distance` | HC-SR04 lấy VCC từ chân `3V3` (bản thường cần 4,5–5,5 V) và ECHO nối thẳng GPIO. | Thêm chân board `v5` ("5V / VIN", nối ở cuối danh sách để giữ chỉ số cũ). VCC module lấy từ 5V; ECHO đi qua cầu chia 1 kΩ/2 kΩ (5 V × 2/3 ≈ 3,33 V). Validator chấp nhận ECHO trực tiếp hoặc qua cầu chia; cảnh báo `hcsr04-echo-logic-level` chỉ còn khi thiếu cầu chia; thêm `hcsr04-supply-3v3`. |
| L3 | Trung bình | bài `mosfet-switch` | Gate được lái từ `board:input` (GPIO IN) và không có điện trở kéo xuống Gate–GND. Lúc reset, gate thả nổi có thể làm motor tự chạy. | Gate lấy từ chân xuất `ledOut` qua điện trở cổng; thêm `resistor-pd-1` 10 kΩ từ Gate về GND. Validator đổi theo. |
| V1 | Trung bình | `src/lib/circuitValidation.ts` | Diode hồi tiếp **đúng chiều** (cathode → M+, anode → M−) của bài MOSFET vẫn bị cảnh báo "kiểm tra lại cực tính" (`polarized-positive-to-ground`, `polarized-negative-to-power`). | `isFlybackClamp()` bỏ qua kiểm tra cực tính khi diode mắc ngược song song với tải cảm (`dc-motor`). |
| T1 | Thấp | `src/lib/logicTrace.ts` | Mọi net nguồn đều có nhãn chung "Nguồn". Nếu nhãn của tải ghi sau thì ghi đè nhãn của nguồn cấp. | Thêm `powerLabel()`: nhãn lấy từ chân cấp nguồn (`3V3`/`5V` theo `supplyLabel` của target, `5V` cho `v5`, `V+`, `VOUT`, `VM`). Nhãn của tải không còn ghi đè nhãn của nguồn cấp. |

Vấn đề còn lại sau khi sửa: legacy `layout-2d` vẫn khóa 3 bài khái niệm như baseline. Bài siêu âm vẫn migrate được sang CircuitDocV2 vì hai điện trở chia áp được xếp lên breadboard trước module.

## 2. Những gì đã kiểm và không có lỗi

- **Kích thước board GLB** (`node scripts/audit-board-models.mjs`), đối chiếu với kích thước hãng: DevKit V1 52,9 × 29,2; Uno 69 × 53,7; Nano 43,2 × 17,8; Mega 101,6 × 53,3; Pico 21 × 52,3 (tính cả USB); QT Py 17,8 × 21,7; Feather 52,2 × 22,9; XIAO C3/S3 21 × 19 / 22,5 × 17,8 mm. Tất cả đều khớp. `missing=0 orphan=0 pinsOutside=0` cho mọi board.
- **Quét linh kiện nhô khỏi PCB > 2 mm** trên mọi GLB board: chỉ còn U1 của DevKit V1 (5,8 mm) và U4 của S3 (6,3 mm). Cả hai là antenna module nhô ra, đúng với board thật. `esp32-led-assembly.glb` là cảnh lắp ráp nên không áp dụng phép đo này.
- **Pinout J1/J3 của S3** khớp hướng dẫn hãng v1.1: J1 = 3V3, 3V3, EN, 4…14, 5V, GND; J3 = GND, TX, RX, 1, 2, 42…19, GND, GND.
- **Mesh linh kiện**: pitch chân khớp footprint KiCad. LED 2,54 mm (pad 1 là cathode); điện trở 10,16 mm; diode DO-41 10,16 mm; TO-220 G‑D‑S; LED 7 đoạn LTS‑6760 với chân 1–10 = E D COM C DP B A COM F G; HC-SR04 VCC‑TRIG‑ECHO‑GND; buzzer 7,6 mm; tụ 5 mm.
- **Topology 11 bài** (`tests/lesson-topology-audit.test.mjs`): mỗi bài có hợp đồng net riêng; không có ngắn mạch VCC/5V–GND; validator không báo `error` và không báo sai cực tính trên mạch mẫu; điện trở chỉ dùng 220 Ω / 1 kΩ / 2 kΩ / 10 kΩ. LED dùng 220 Ω ở 3,3 V, tức khoảng 5,9 mA. LED 7 đoạn là cathode chung với COM1/COM2 nối GND.

## 3. Mô phỏng luồng tín hiệu (học theo pattern Learn Arduino Red, không dùng lại code hay asset)

- `src/lib/signalFlow.ts`:
  - `activeCodeLine` ưu tiên số dòng mà parser trả về trong `frame.events`; nếu không có thì tìm `digitalWrite` tạo ra mức của frame, bỏ qua lệnh TRIG.
  - `describeSignalFrame` dựng dòng Serial từ frame của provider, ví dụ `digitalWrite(23, HIGH) · LED sáng`, `pulseIn(ECHO) ≈ 35 cm → …`. Ba bài khái niệm có tiền tố `[minh họa]`.
  - `appendSerial` chỉ thêm dòng khi frame đổi. `flowLegend` liệt kê mỗi nhãn net một lần.
- `src/components/builder/SignalFlowPanel.tsx` gồm chú giải mức trên dây, code có đánh số với dòng đang chạy tô nền (`aria-current="step"`) và Serial log (`role="log"`). Có badge "minh họa · không chạy code" cho bài khái niệm. Panel hiện ở cả chế độ legacy và CircuitDocV2.
- Sơ đồ nguyên lý (`SchematicView` + `SchematicFlow.css`) có vạch chạy theo chiều trace (`forward`/`reverse`) và nhãn mức (5V / 3V3 / HIGH / LOW / GND / TRIG / ECHO 5V / ECHO ~3,3V). Khi `prefers-reduced-motion: reduce` thì animation tắt; e2e xác nhận `animationName = none`.
- Breadboard V2 và 3D đã có sẵn pill, vạch và LED sáng theo trace (báo cáo 02). Lần này nhãn nguồn dùng `powerLabel` nên cũng hiện 5V/3V3.
- Mọi số liệu lấy từ `programFrame` (provider) và `getLogicFlow` / `traceCircuitDocV2`; phần này không tạo số mới.

## 4. Bằng chứng (lệnh đã chạy)

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run typecheck` | sạch. Một lần chạy giữa chừng báo `SiteShell.tsx(54,10) AuthMenu` từ phiên đăng nhập song song; lần sau đã hết. |
| `npm.cmd test` (lần cuối, đã gồm 3 file test mới) | 594/594 pass |
| `npm.cmd run build:local` | build OK (cảnh báo `eval` có sẵn từ trước) |
| Playwright `e2e/signal-flow.spec.mjs` (config tạm `.tmp/pw-alt.config.mjs`, port 5297, `PLAYWRIGHT_BROWSERS_PATH=../.tools/mach-mo-review/playwright`) | 5/5 pass |
| Playwright toàn bộ e2e (port 5297) | 96 pass, 5 fail. 3 fail là baseline (`journeys.spec.mjs:35` ×2, `:812`). 2 fail mới ở `accessibility` `/build?lesson=blink` do axe `listitem`: `<ol role="log">` làm mất vai trò list. Đã sửa bằng cách bọc `role="log"` ở `div` ngoài. Chạy lại `accessibility` + `signal-flow`: 21/21 pass. |

Ảnh after nằm trong `img/05/`:
- `after-esp32-s3-devkitc-1-3d.png`: header dọc theo cạnh dài, module ở đầu board.
- `after-ultrasonic-signal-panel.png`, `after-ultrasonic-schematic-flow.png`, `after-ultrasonic-logic-canvas.png`, `after-ultrasonic-3d.png`
- `after-blink-v2-breadboard.png`, `after-blink-v2-signal-panel.png`
- `after-mosfet-preset.png`, `after-motor-preset-uno.png`

Không có ảnh before của GLB S3 dạng render. Bằng chứng before là số đo bounding box ở bảng mục 1. Bản GLB cũ được giữ ở scratchpad của phiên, không nằm trong repo.

## 5. Chưa làm / cần quyết định

1. **Sơ đồ nguyên lý legacy bị chật** ở bài siêu âm, vì bố cục đặt thẻ theo % vị trí preset và thẻ chồng một phần lên nhau. Cần auto-layout hoặc tăng chiều cao canvas; việc này để phiên thiết kế lại UI.
2. **Motor/servo chưa có phản hồi chuyển động trong 3D.** LED sáng theo state; motor hiện chiều/PWM dạng chữ trong `sim-state` và Serial `[minh họa]`.
3. `noMeshFeatures` (Uno 87, Mega 33, XIAO C3 21, Feather 14/17) là các feature tra cứu không có node mesh riêng, không phải linh kiện đặt sai. Chưa rà từng feature.
4. Bài `source-led` mang tên "nguồn thấp áp" nhưng preset dùng GPIO thay cho pin/nguồn DC. Topology đúng cho LED, nhưng cần founder quyết định có đổi sang `battery` hay không.
5. Bài `buck-boost-concept` còn đặt board-1 mà không nối dây nào. Đây là bài khái niệm nên chưa đổi.
6. Không có KiCad CLI trên máy nên GLB S3 được sửa trực tiếp bằng transform node. `scripts/build-esp32-s3-devkitc-1-model.py` và file `.kicad_pcb` derived chưa được sửa: lần export lại sau sẽ lặp lỗi nếu không đặt `rotate z 90` cho J1/J3 và offset (9; 5,26) mm cho U4. File `.kicad_pcb` nằm trong `assets/` nên chưa động tới.

## 6. File đã đổi

- Model: `public/models/esp32-s3-devkitc-1-v1.1.glb`, `src/data/board-asset-lock.json`, `src/data/esp32-s3-devkitc-1.inventory.json`, `src/data/esp32-s3-devkitc-1.pin-anchors.json` (sha256 mới `1ffe2348…`), `src/data/component-models.manifest.json` (tb6612), `scripts/generate-component-models.mjs:77`.
- Bài học: `src/data/componentRegistry.ts` (chân `v5`), `src/data/lessonCircuits.ts`, `src/data/lessonCircuitDocs.ts`, `src/data/builderLessons.ts`, `src/lib/circuitValidation.ts`, `src/lib/logicTrace.ts`, `src/lib/assemblyLayout.ts`, `src/lib/breadboardDiagram.ts`, `src/lib/lessonPreflight.ts`.
- Luồng tín hiệu: `src/lib/signalFlow.ts`, `src/components/builder/SignalFlowPanel.{tsx,css}`, `src/components/builder/SchematicView.tsx`, `src/components/builder/SchematicFlow.css`, `src/pages/CircuitBuilderPage.tsx`.
- Test: `tests/lesson-topology-audit.test.mjs`, `tests/model-placement-audit.test.mjs`, `tests/signal-flow.test.mjs`, `tests/assembly-scene.test.mjs` (hướng ECHO + nhãn 5V), `e2e/signal-flow.spec.mjs`.
