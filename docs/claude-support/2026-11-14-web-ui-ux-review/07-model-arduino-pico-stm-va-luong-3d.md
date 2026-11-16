# 07 · Model Arduino/Pico/STM32, sơ đồ nguyên lý, luồng tín hiệu 3D

Ngày: 2026-11-14 · Tiếp nối báo cáo 05. Không commit. Dùng KiCad 10.0.7 (`D:/StartupOS/.tools/kicad-10.0.7`) theo cho phép của founder.

## 1. Việc đã làm

### 1.1 Sơ đồ nguyên lý legacy không còn thẻ đè nhau
- `src/lib/schematicLayout.ts` (`resolveSchematicLayout`): thẻ nào không va chạm thì giữ đúng vị trí preset; thẻ va chạm được dời tới chỗ trống gần nhất. Kích thước thẻ đo từ DOM thật, và canvas cao thêm khi cần.
- `SchematicView.tsx` dùng layout này khi màn hình rộng; bố cục mobile cũ giữ nguyên.
- Test:
  - `tests/schematic-layout.test.mjs`: 11 bài × 3 bề rộng (700/950/1200 px) không có thẻ nào đè nhau.
  - e2e `legacy schematic cards never overlap in any lesson`: đo `getBoundingClientRect` của cả 11 bài trên Uno.
- Hạn chế: khung builder là vùng cuộn, nên ở bài siêu âm phải cuộn trong khung mới thấy hàng thẻ dưới cùng (canvas cao 641 px, thẻ thấp nhất kết thúc ở 626 px).

### 1.2 Motor quay trong 3D theo trạng thái mô phỏng
- `AssemblyStage` nhận prop `motorStates` tính từ `programFrame` (`CircuitBuilderPage.tsx`):
  - Bài TB6612: chiều Thuận/Đảo/Dừng và PWM 0/65 % lấy từ engine khái niệm.
  - Bài MOSFET: tải bật thì PWM 100 %.
- Overlay quay ⟳/⟲ có tốc độ tỉ lệ theo PWM, kèm nhãn "PWM x % · minh họa".
- Khi bật `prefers-reduced-motion`, overlay đứng yên; e2e đã kiểm `animationName = none`.
- Lý do không quay mesh: trục motor là hình trụ tròn đều, xoay mesh sẽ không nhìn thấy.
- Servo: chưa bài nào dùng servo nên chưa nối.

### 1.3 Script S3 DevKitC
- `scripts/build-esp32-s3-devkitc-1-model.py` có thêm `MODEL_TRANSFORM_BY_REF` và `apply_model_transforms()`, chạy sau `SaveBoard`:
  - J1/J3: `rotate z -90` (header nằm mặt dưới nên dấu đảo).
  - U4: `offset (9, -5.26)`.
- Lý do sửa trên text: API `fp.Models()` của pcbnew trả về bản sao, gán vào không có tác dụng.
- Kiểm chứng: lấy bản sao `.kicad_pcb` dẫn xuất (trong scratchpad), áp transform rồi export bằng kicad-cli. Kết quả khớp chính xác GLB đã sửa tay:
  - U4: min (−267,4; 1,6; 170,2), size 18,0 × 3,1 × 25,5 mm.
  - Header: z 176,7…232,6 mm.
  - Thử `+90` cho header thì lệch hẳn ra ngoài (z 123,4…).
- **Chưa sửa** file `.kicad_pcb` dẫn xuất, vì nó nằm trong `assets/` (vùng cấm sửa). Script cũng chưa chạy, vì nó ghi vào `assets/`.

### 1.4 Bài `source-led` mặc định dùng pin
- Mạch preset: `battery-1 (+)` → `res-1` → `led-1` (anode → cathode) → `battery-1 (−)`. Không còn board trong vòng mạch.
- Bài chuyển sang kịch bản cố định (`simulationMode: 'fixed-scenario'`):
  - Parser trả `{kind:'concept', lesson:'source-led'}`.
  - Engine trả `ledOn: true`.
  - Code mẫu chỉ còn chú thích.
  - Serial ghi `[minh họa] Nguồn DC → điện trở → LED sáng → cực âm`.
- Bỏ `source-led` khỏi export sketch Arduino và khỏi tín hiệu PCB.
- Test hợp đồng topology đã cập nhật; validator không báo lỗi với mạch pin.
- **Cách đảo lại:**
  - `lessonCircuits.ts`: trả về `{placed:defaults,wires:defaultWires}`.
  - `builderLessons.ts`: `code: (target) => outputCode(...)` (code cũ ghi trong chú thích).
  - `educationalProgram.ts`: bỏ `'source-led'` khỏi danh sách concept và thêm lại dòng `if(lesson==='source-led')lesson='blink'`.
  - `curriculumSchema.ts`: `simulationMode:'code-subset'`.
  - `signalFlow.ts`: bỏ `source-led` khỏi `conceptLessons`.

### 1.5 Độ chính xác model Arduino Uno/Nano/Mega và Pico

| Kiểm tra | Cách đo | Kết quả |
|---|---|---|
| Lỗ bắt vít Uno/Mega | pcbnew đọc `*-viewer.kicad_pcb` (chỉ đọc), trừ 0,127 mm nửa nét viền | Uno (13,97;2,54) (15,24;50,8) (66,04;7,62) (66,04;35,56); Mega thêm (90,17;50,8) (96,52;2,54). Khớp bản vẽ Arduino. |
| Vị trí thân linh kiện so với tâm pad | so tâm mesh GLB với tâm pad CAD cho cả 33/18/39 linh kiện có thân | **Uno ZU4 (DIP-28) lệch 7,62 mm theo Y** → đã dời node, nay khớp ±0,3 mm. Nano J3 (Mini-B) lệch 4,2 mm vì thân đầu nối kéo về mép board, đúng thực tế. Mega không lệch. |
| Nguyên nhân ZU4 | đọc `assets/.../attach_reference_models.py` | Script ghi offset Y của model mà không đổi dấu (pad Y hướng xuống, model Y hướng lên). Package có pad đối xứng nên lỗi bị che. File nằm trong `assets/` nên không sửa. |
| **Linh kiện thiếu thân 3D** | `noMeshFeatures` / `has3dBody=false` | Uno thiếu 87 thân, gồm toàn bộ header, ICSP, jack DC, USB‑B, thạch anh, resonator, nút RESET, D1, T1. Mega và Nano thiếu tương tự. |
| Pico ×4 | anchor chân trong `raspberryPiBoardModels` | Chân 1 = GP0, 20 = GP15, 21 = GP16, 40 = VBUS; pitch 2,54 mm; hai hàng cách 17,78 mm. Khớp datasheet, không cần sửa. |

**Bổ sung thân linh kiện:**
- Công cụ: `scripts/attach-board-bodies.py` (khớp pad, dùng đúng quy ước trục), cấu hình trong `scripts/board-bodies/*.json`. Mỗi ref được export riêng bằng kicad-cli (`--no-board-body --component-filter REF`) rồi ghép vào GLB bằng `scripts/merge-glb-nodes.mjs`.
- Uno, +13 thân: IOH0/IOL0/POWER0/AD0 (header cái), ICSP0/1, X1 jack, Y1 thạch anh HC‑49, Y2 resonator, RESET0, D1, T1, X2 USB‑B.
- Mega, +16 thân: tương tự Uno, thêm XIO0 2×18.
- Nano, +4 thân: J1/J2 header đực ở mặt dưới, SW1, Y1.
- Phát hiện lúc làm: góc xoay model KiCad cùng chiều với footprint, chỉ offset Y cần đổi dấu. Bản đầu dùng `−θ` làm header lệch đúng bằng chiều dài hàng chân; đã sửa và ghi chú trong script.
- Đặt `rotateX 180` cho header mặt dưới cũng làm đảo trục Y của model; script bù lại bằng `scale y = −1`.
- Thư viện KiCad 10 không có STEP cho USB‑B, nên **X2 là hộp tham số** 16,5 × 10,9 × 12,0 mm (theo cỡ Molex 61729), mặt trước nhô 6,35 mm khỏi mép PCB (`scripts/make-box-part-glb.mjs`).
- Kiểm sau khi ghép:
  - Mọi thân mới nằm trên tâm pad. Riêng X1/X2 lệch theo thân đầu nối.
  - Mặt trước jack nhô 1,7 mm khỏi mép board.
  - Chiều dài tổng Uno 75,3 mm, Mega 108,3 mm.
- Đã tối ưu GLB bằng bản sao của `optimize-board-glb.mjs` (bản gốc ghi sao lưu vào `assets/`): Uno 1662 → 121 primitive, Mega 3111 → 142.
- Version Arduino lên 3.5.0, `board-asset-lock` được xuất lại. Test `board-catalog` đổi `withoutMesh` của Uno từ 87 thành 74, có chú thích.

### 1.6 Board STM32 (Blue Pill + Nucleo-F401RE)
**Ràng buộc:**
- Hồ sơ `assets/boards/vendor/nucleo-f401re/SOURCE.md` đã quyết định không phát hành hình học dẫn xuất từ CAD MB1136 (giấy phép ST OPLA).
- Blue Pill cộng đồng có sẵn (SinaKarvandi, 41,2 × 36,2 mm) không phải dạng Blue Pill và đã bị loại khỏi gate phát hành.

**Cách làm:** cả hai board là **tái dựng giáo dục**, dựng bằng `scripts/build-stm32-education-boards.py` (pcbnew) chỉ từ footprint và model thư viện KiCad (CC BY-SA 4.0).
- Blue Pill:
  - 53,34 × 22,86 mm; hai hàng 1×20 cách 15,24 mm, chân hướng xuống.
  - LQFP‑48 xoay 45°, thạch anh 8 MHz và 32,768 kHz, LDO, RESET, BOOT 2×3, SWD 1×4 góc vuông, 2 LED.
  - Micro‑USB `USB_Micro-B_Molex_47346-0001`.
  - Thứ tự chân theo stm32-base.
- Nucleo:
  - 70 × 82,5 mm; ST‑LINK (LQFP‑48, mini‑USB), MCU LQFP‑64 xoay 45°, B1/B2, LD1–3, ổn áp, X2.
  - CN5/CN6/CN8/CN9 lấy **chính xác hình học header Arduino Uno R3** từ CAD Arduino (CC BY-SA). Kiểm tra: hai hàng cách nhau 48,26 mm.
  - Header morpho CN7/CN10 2×19 đặt theo ước lượng.
  - 4 lỗ bắt vít.
- Kiểm hình học: không pad nào nằm ngoài board, không có cặp pad nào giữa hai linh kiện cách nhau dưới 1,6 mm. `audit-board-models`: `missing=0 orphan=0 pinsOutside=0`.

**Dữ liệu đi kèm:**
- `public/models/stm32-*.glb` và `*.NOTICE.txt`.
- `src/data/stm32-*.pads.json` (inventory pad).
- `src/data/stm32BoardModels.ts`:
  - Pin anchors: Blue Pill 40 chân; Nucleo 32 chân header Arduino, nhãn kiểu `D13 · PA5` theo bảng UM1724 có sẵn trong repo.
  - Morpho chỉ đánh số, chưa có tên tín hiệu.
- `board-asset-lock`, `boardModelSources` (đổi sang `educational-reconstruction`, `published`, kèm notice).
- Danh mục board (`BoardCatalogPage`) và các script lock/audit.
- `componentAnatomy` (`stm32-blue-pill`, `stm32-f401`).
- Mục `stm32-blue-pill` trong thư viện linh kiện + nguồn tham chiếu.

**Chạy code:** dự án không có engine giả lập STM32 và không thêm dependency. Phòng test vẫn chỉ có "mô phỏng hành vi cơ bản" như trước; manifest và notice ghi "Chưa chạy code STM32".

**Test chính sách đã đổi kỳ vọng (có chú thích):** `smoke.test.mjs` (số model phát hành 14 → 16; Nucleo/Blue Pill chuyển sang `educational-reconstruction`), `learning-flow.test.mjs` (Nucleo có viewer).

**Sự cố trong lúc làm (đã khắc phục):** một lần thay chuỗi trên `src/data/boardModelSources.ts` làm mất phần đầu file. Phần đầu đã khôi phục từ HEAD; trước đó đã đối chiếu 39 chuỗi đặc trưng của dòng 1–143 với bundle `dist/` dựng lúc 15:55 trong phiên và không thấy sai khác. Sau đó chỉ chèn lại 2 mục STM32. Diff cuối của file chỉ gồm 2 mục này.

### 1.7 Luồng tín hiệu trong 3D
- Phần lớn đã có từ trước:
  - Dây đổi màu theo tín hiệu.
  - Vạch chạy theo chiều trace; tắt khi `reducedMotion()`.
  - Chip nhãn mức trên dây (`assembly-chip`).
- Đợt 05 đã thêm `powerLabel`, nên chip hiện `5V`/`3V3`/`VM`/`GND` khớp với panel 2D.
- e2e `3D ultrasonic run labels supply and ECHO wires like the 2D panel` xác nhận có chip `GND` và chip TRIG/ECHO.

## 2. Bằng chứng

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run typecheck` | sạch |
| `npm.cmd test` | 601/601 pass |
| `npm.cmd run build:local` | OK (cảnh báo `eval` có sẵn từ trước) |
| `e2e/signal-flow.spec.mjs` (port 5297) | 9/9 pass (trước khi chạy toàn bộ) |
| e2e toàn bộ (port 5297) | 101 pass, 4 fail (lần chạy kéo dài 3,7 giờ trên máy đang tải nặng). 3 fail là baseline (`journeys.spec.mjs:35` ×2, `:812`). Fail thứ tư `:671 schematic pins can be connected with Tab and Enter` hết thời gian khi chờ nút "Tự nối dây từ đầu" lúc tải trang, tức trước khi tới phần sơ đồ. Chạy lại riêng test này với `--repeat-each 2`: 4/4 pass (gồm cả test 3D Tab/Enter). Kết luận: test chập chờn do timeout, không phải hồi quy. |

Ảnh after trong `img/07/`:
- `after-arduino-uno-r3-3d.png`, `after-arduino-mega-2560-r3-3d.png`, `after-arduino-nano-classic-3d.png`
- `after-stm32-blue-pill-f103-3d.png`, `after-stm32-nucleo-3d.png`
- `after-ultrasonic-schematic-no-overlap.png`, `after-ultrasonic-3d-signal-chips.png`, `after-motor-3d-spin.png`
- `after-source-led-battery.png`, `after-source-led-panel.png`

Số đo before của các GLB Arduino có ở bảng mục 1.5. Bản GLB before được giữ trong scratchpad của phiên.

## 3. Chưa làm / cần quyết định
1. Các file trong `assets/` chưa sửa vì là vùng cấm:
   - `.kicad_pcb` dẫn xuất của S3.
   - `attach_reference_models.py` (lỗi dấu Y).
   - README Arduino (vẫn ghi "header không lắp").
   Lần export lại bằng pipeline cũ sẽ lặp lại lỗi ZU4 và mất các thân linh kiện mới. Pipeline mới nằm trong `scripts/`.
2. USB‑B Uno/Mega là hộp tham số, chưa phải model đầu nối thật.
3. Vị trí linh kiện phụ của STM32 là ước lượng. Thứ tự hàng chân Blue Pill (hàng nào ở trên khi USB bên trái) và vị trí morpho Nucleo cần đối chiếu board thật hoặc bản vẽ UM1724.
4. Chưa có tên tín hiệu cho chân morpho CN7/CN10.
5. `boardCapability.modelStatus` gộp mọi model đã phát hành (kể cả tái dựng) thành `cad-reference`, nên câu "Có mô hình CAD tham chiếu 3D" hơi quá đối với bản tái dựng. Chưa đổi, vì S3/XIAO đang dùng chung ngữ nghĩa này.
6. Servo chưa có chuyển động trong 3D vì chưa bài nào dùng servo.
