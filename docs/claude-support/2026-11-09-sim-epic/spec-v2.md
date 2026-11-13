# Epic SIM · Đặc tả thiết kế v2 (bước S2) · 10/11/2026

Người đọc: founder (chọn), Codex Luna/Sol (làm). Tác giả: Leader Claude. Đây là đặc tả, chưa là mã; chưa Codex nào xác nhận khả thi. Căn cứ: `audit-synthesis.md` (cùng thư mục; E-xx là mã lỗi ở đó), `plan.md`, mã nguồn đã mở.
Từ khóa: **MUST** bắt buộc, **SHOULD** nên, **CHỌN** = founder quyết.

## 0. Nguyên tắc và hình dạng đích

1. **Một nguồn sự thật.** Mạch bài học là một `CircuitDocV2` (mục 6). 2D, sơ đồ, 3D, SPICE và test đều *suy ra* từ nó. Không view nào được giữ tọa độ riêng (khắc phục E-02).
2. **Breadboard là dữ liệu, không phải mesh.** Lỗ, dải, ray là hàm thuần có test (mục 1), không cần mở WebGL (E-01).
3. **Dây là đường định tuyến suy ra, không là đoạn H-V-H** (E-04).
4. **Mạch không đạt cổng thì test fail**, không rơi về "chỉ CAD" (mục 8).
5. Hàm thuần trong `src/lib/`, page chỉ điều phối (E-09). Không thêm dependency (D18); validator viết tay, không dùng zod.

Luồng đích: `CircuitDocV2 → mountResolve → netsV2 → layout2D → routeWires → {Canvas2D, Schematic, Assembly3D, workspaceSpice}`.

## 1. Mô hình lưới breadboard

**Bằng chứng:** manifest mesh `breadboard` (`src/data/component-models.manifest.json`) đã có `gridMm`: `pitch 2.54`, `columns 30`, 10 hàng (`rows` Z: −13.97…−3.81 và 3.81…13.97, rãnh giữa 7.62 mm), 4 ray (`rails` Z: −22.86, −20.32, 20.32, 22.86), `firstColumnX −36.83`, kích thước 83×55 mm, `kind: parametric-mesh`. `assemblyLayout.ts:203-205` chấp nhận cột 0-29, hàng 0-9. Đây là một breadboard nửa kích thước 400 lỗ nối.

**Quyết định D-SIM-01 · Mô hình theo bo 400 lỗ, 30 cột.** Lý do: khớp mesh hiện có và planner (khỏi đổi hình học); bo đủ cho mọi bài trong danh sách (nhiều nhất 7-đoạn: 10 part). *Rủi ro:* mesh là `parametric-mesh`, không phải CAD thật; số lỗ ray (25 mỗi ray ở bo thật) không có trong `gridMm` → S3 MUST đọc `rails` và `columns` rồi gắn `RAIL_HOLES = 25` làm hằng có comment nguồn, kiểm với mesh.

**Định danh lỗ** (chuỗi ổn định, dùng làm endpoint): `bb1:<cột 1..30><hàng a..j>`, ví dụ `bb1:14c`; ray: `bb1:T+:1..25`, `bb1:T-:…`, `bb1:B+:…`, `bb1:B-:…`. Ánh xạ hàng: chỉ số 0-4 → a-e, 5-9 → f-j (khớp `stripOf` ở `assemblyLayout.ts:95`).

**Luật nối trong bo (hàm `holeNet(holeId)` thuần):**
- Dải: 5 lỗ cùng cột và cùng nửa (a-e hoặc f-j) là một nút. Hai nửa không nối nhau (rãnh giữa).
- Ray: mọi lỗ cùng ray là một nút. Ray `T+` và `T-` là hai nút khác nhau; **CHỌN Q-SIM-5**: ray có đứt giữa (bo 830 điểm) hay liền (bo nhỏ). Khuyến nghị: liền, vì bo 400 lỗ thật thường liền; ghi trong `BreadboardSpec.railSplit: false` để đổi được.
- Tọa độ lỗ trong mm từ `gridMm` (`holePoint` đã có ở `assemblyLayout.ts:94`; hàm mới dùng chung, 2D và 3D cùng gọi).

**Chức năng thuần cần có (S3):** `parseHole`, `holeToMm`, `holeNet`, `stripHoles`, `footprintHoles(part)`, `canMount(part, mount)` (trả lý do từ chối, tiếng Việt), `occupancy(doc)`, `snapNearest(pointMm)`.

## 2. Gắn linh kiện (mount)

- Mỗi part có `mount`: `{kind:'breadboard', board:'bb1', col, row, rotation}` hoặc `{kind:'bench', slot}`.
- **Chân linh kiện vào lỗ**: lấy từ `legsMm`/`pinsMm` trong manifest mesh (đã có cho breadboard rỗng; part khác SHOULD có; nếu thiếu, S3 liệt kê). Chân i rơi vào lỗ = `col + round(legX/2.54)`, hàng tương ứng.
- **Luật gắn (MUST, kiểm bằng `canMount`):** mọi chân vào một lỗ có thật; một lỗ một chân; hai chân của cùng linh kiện không rơi cùng dải (trừ part khai `intentionalShort`); không chồng footprint (AABB, đệm 0,5 mm); linh kiện hai chân bắc qua rãnh giữa chỉ cho IC/module khai `straddle: true`.
- **Quyết định D-SIM-02 · Board MCU, pin nguồn, module lớn (motor, siêu âm, TB6612, pin) ở *bench*, nối vào breadboard bằng dây Dupont.** Lý do: bo ESP32 DevKit V1 30 chân rộng cỡ hai nửa bo và dài hơn bo (planner hiện cũng coi `board` là bench, `assemblyLayout.ts` mount bench); tránh cắm board đè kín breadboard. Linh kiện rời (R, LED, nút, LDR, biến trở, diode, tụ) ở trên breadboard.

## 3. Net (điện)

`createNetIndexV2(doc)`: union-find trên: (a) endpoint dây tường minh; (b) lỗ cùng dải/ray; (c) chân part → lỗ nó cắm; (d) chân `intrinsic` (hai chân GND của cùng board). Giữ khóa endpoint `partId:pinId` cho tương thích với `createNetIndex` hiện có (`circuitNets.ts:13`); thêm khóa lỗ. `createNetIndex` cũ SHOULD vẫn dùng được cho preset v1 trong giai đoạn chuyển.
Hệ quả: SPICE (`workspaceSpice.ts`) đọc net từ đây; bài "thiếu dây tới GND" suy ra tự động chứ không dựa bố cục.

## 4. Bố cục (suy ra, không viết tay)

**Quyết định D-SIM-03 · View chính là bản vẽ lắp 2D nhìn từ trên (top view)**, đúng Q-SIM-1 khuyến nghị: lỗ nhìn thấy, linh kiện đúng chân, dây có đường đi. 3D giữ làm tùy chọn, dùng **cùng** `mountResolve` và **cùng** polyline dây (nâng lên cung). Sơ đồ nguyên lý là view thứ ba, chỉ tạo từ net (không dùng tọa độ lắp). Lý do: E-02 (ba bố cục), ảnh 3D potentiometer cho thấy dây vắt cong khó đọc; 2D top view dễ test bằng hình học thuần, không phụ thuộc WebGL.

Luật bố cục 2D (mm, gốc là tâm bo):
1. Breadboard ở giữa. Part `bench` vào **làn**: làn trái (board MCU, nguồn pin), làn phải (đầu ra: motor, buzzer, hiển thị), làn dưới (cảm biến module). Gán làn theo `category` rồi thứ tự id, không theo tọa độ.
2. Mọi part có khung `footprint` w×h (mm) từ manifest mesh (`sizeMm`); khoảng cách tối thiểu giữa khung 4 mm cho dây.
3. Part bench xoay để hàng chân về phía breadboard (rotation 0/90/180/270 chọn giảm tổng độ dài dây).
4. Preset v1 có `x,y` % chỉ còn dùng làm *gợi ý thứ tự* khi di chuyển bản nháp (mục 9).
5. Hàm thuần `layout2D(doc): Placement[]`; 3D dùng `Placement` tương tự cộng chiều cao.

## 5. Luật đi dây

**Quyết định D-SIM-04 · Router trực giao tất định trên lưới nửa bước (1,27 mm).**
- Mỗi dây là **dây nhảy** (breadboard ↔ breadboard hoặc bench ↔ breadboard). Đầu dây cắm vào lỗ trống hoặc chân header; MUST có đúng hai đầu hợp lệ (lỗ có thật hoặc chân tồn tại).
- Thuật toán: A* trên lưới, chi phí: bước 1, rẽ +3, giao dây khác +5 (giao vuông góc được phép, chạy song song chồng nhau bị cấm), đi qua khung part −∞ (cấm). Duyệt dây theo `id` để tất định. Tối đa 3 góc rẽ; vượt thì **cổng cảnh báo** chứ không bỏ dây.
- Đầu dây thoát vuông góc với mặt bo ít nhất một ô trước khi rẽ.
- **Màu theo loại net** (MUST, dễ test): nguồn dương (3V3/5V) đỏ, GND đen, tín hiệu xanh/vàng/cam xoay theo chỉ số net. App đã có chú thích màu ở `canvas-legend`.
- Đầu ra: `Polyline[]` (mm). Canvas2D vẽ trực tiếp; 3D nâng cung cao `min(8, 2 + len/10)` mm; sơ đồ nguyên lý dùng router riêng (đường nối net, không tạo dây vật lý).
- Thay ba đoạn H-V-H lặp: `CircuitBuilderPage.tsx:998`, `SchematicView.tsx:106`, `Assembly3DView.tsx:55` đều gọi `routeWires` (S5).

## 6. Schema dữ liệu mạch bài học

```ts
type CircuitDocV2 = {
  schema: 2
  lessonId: string
  breadboards: { id: 'bb1'; spec: '400-30'; railSplit: boolean }[]   // 0 hoặc 1 bo đợt đầu
  parts: {
    id: string                 // ổn định, ví dụ 'led-1'
    type: string               // khóa registry (28 loại hiện có)
    value?: { ohm?: number; farad?: number; label?: string }
    mount: { kind: 'breadboard'; board: 'bb1'; col: number; row: number; rotation: 0|90|180|270 }
         | { kind: 'bench'; lane: 'left'|'right'|'bottom'; order: number }
  }[]
  wires: { id: string; from: Endpoint; to: Endpoint; role?: 'power'|'ground'|'signal' }[]
  openPins?: { partId: string; pinId: string; reason: string }[]   // chân để hở có chủ đích
  expect: { partCount: number; wireCount: number; netCount: number; steps?: string[] }
}
type Endpoint = { kind: 'pin'; partId: string; pinId: string } | { kind: 'hole'; holeId: string }
```
- File dữ liệu: `src/data/lessonCircuits/<lessonId>.json` (hoặc `.ts` xuất object) thay `src/data/lessonCircuits.ts`; `circuitForLesson` đọc doc rồi trả `{placed, wires}` tương thích cho code cũ trong giai đoạn S3-S6. **CHỌN Q-SIM-6** hình thức: `.ts` có kiểu (khuyến nghị: bắt lỗi biên dịch, khỏi validator JSON) hay `.json` (Antigravity/DeepSeek sửa dễ hơn). Khuyến nghị `.ts`.
- `expect` là hợp đồng với test và e2e: số part và dây hiển thị phải khớp (chặn "thiếu linh kiện", lỗi mà S0 không bắt được).
- **Ví dụ `blink`** (mạch: GPIO23 → R → LED → GND, board ở bench):
  - parts: `board-1` bench left; `bb-1`; `res-1` mount `{board:'bb1', col:10, row:2, rotation:0}` (`row` là chỉ số 0-9, 2 = hàng c; neo `mount` là chân đầu; chân tại 10c và 14c); `led-1` `{board:'bb1', col:14, row:3, rotation:0}` (chân anode 14d, cathode 15d). (Sửa theo review S3A/B: ví dụ cũ ghi hàng bằng chữ.)
  - wires: `board-1:GPIO23 → hole bb1:10a`; `hole bb1:15a → hole bb1:T-:1`; `hole bb1:T-:2 → board-1:GND`.
  - Net: 10a, 10c cùng dải (R chân 1 = GPIO23); R chân 2 (14c) cùng dải 14 với anode (14d); cathode 15d cùng dải 15 với 15a → ray `T-` → GND. Không dây nào cần nối trực tiếp R với LED: dải làm điều đó, đúng điều bài breadboard cần dạy (cụ thể hóa E-01).

## 7. Catalog đợt đầu theo nhu cầu bài học

**Ma trận 11 bài builder → part (từ S1 bảng preset, ĐÃ KIỂM):**

| Bài | Part | Có breadboard? |
|---|---|---|
| blink, source-led | board, breadboard, LED, R | có |
| button-led | + nút nhấn | có |
| ir-alert | + cảm biến IR | có |
| ultrasonic-distance | + HC-SR04 | có |
| analog-potentiometer | + biến trở | có |
| analog-ldr | + LDR, R 10 kΩ | có |
| seven-segment-counter | board, breadboard, LED 7 đoạn, 7 R | có (10 part, 16 dây: ca xấu nhất) |
| buck-boost-concept | board, pin, buck/boost, LED, R | không (bench) |
| dc-motor-driver | board, pin, TB6612, motor | không (bench, 10 dây) |
| mosfet-switch | board, pin, R, MOSFET, motor, diode | không (bench) |

**Kết luận:** 11 bài hiện có **không cần loại mới**; mọi part đã có trong registry (28 loại). Việc catalog đợt đầu là **làm đủ dữ liệu cho 28 loại**: có `footprint`, `legsMm`/`pinsMm`, nhãn chân, hành vi (hiện 10 `supported`, 20 `visual-only`). Điều này nghiêng giả thuyết E về "SAI cho bài hiện có".

**Phạm vi đợt đầu CHỌN Q-SIM-2 (làm rõ):** kế hoạch ghi "6 bài hiện có" nhưng `lessons.ts` có 6 id mà chỉ `esp32-led` có nội dung (5 slug linh kiện trả 404, K9), còn builder có 11 bài. Khuyến nghị đợt đầu = **6 mạch builder có breadboard nhỏ**: `blink`, `source-led`, `button-led`, `analog-potentiometer`, `analog-ldr`, `ir-alert`. Đợt hai: `ultrasonic-distance`, `seven-segment-counter` (stress test) rồi ba mạch bench (`buck-boost-concept`, `dc-motor-driver`, `mosfet-switch`, chỉ cần layout + router, không strip).

**Mở rộng catalog (Q-SIM-3, mục tiêu ~20 loại):** ứng viên theo bốn chặng của `learningPath.ts` (output, input, display, power; ĐÃ KIỂM có 4 chặng) và robot MởBot. Chưa có bài nào kéo chúng, nên đây là đề xuất, mỗi slice 4 loại, mỗi loại chỉ nhận khi có bài hoặc phiên bản robot cần:
- Đợt A (output/input): tụ gốm 100 nF, nút nhấn 4 chân, DIP switch, LED bar.
- Đợt B (analog/sensing): TMP36 hoặc DHT22, photodiode/phototransistor, joystick, rotary encoder.
- Đợt C (display/IC): 74HC595, I²C LCD 1602, đèn 4 số 7 đoạn, op-amp LM358.
- Đợt D (power): LDO AMS1117, diode Zener, PTC/cầu chì, pin 2×AA có công tắc.
- Đợt E (motion): servo SG90 (đã có `servo`; thêm khung chân), stepper 28BYJ+ULN2003, cảm biến IMU MPU6050, đầu thu IR VS1838.
Founder SHOULD cắt danh sách theo bài cụ thể trước khi giao Luna; tôi không có bằng chứng bài nào cần từng loại.

**Giữ ở mức thuộc tính, không thêm loại:** màu LED, giá trị điện trở (dải màu), dung tích tụ (đã có kiểu `value` ở mục 6).

## 8. Cổng kiểm tự động

Chạy trên **mọi** `CircuitDocV2`; mạch fail thì test fail (không có "chỉ CAD"). Bắt buộc từ S3-S4, mở rộng S6.

| Cổng | Kiểm | Chặn lỗi |
|---|---|---|
| G1 schema | `schema: 2`, đủ trường, id duy nhất | E-06 |
| G2 part | `type` có trong registry; part có `footprint` và `legs`/`pins` | E-12 |
| G3 chân | mọi endpoint `pin` tồn tại trong định nghĩa part | E-03 |
| G4 lỗ | mọi endpoint `hole` hợp lệ; một lỗ một chân; một lỗ một đầu dây | E-01 |
| G5 chồng | không hai footprint chồng (đệm 0,5 mm); không part ngoài khung bo/bench | E-02 |
| G6 dây | hai đầu hợp lệ, không dây nối cùng net, route tồn tại, ≤3 góc, không qua khung part | E-04 |
| G7 hở | mọi chân có net hoặc có trong `openPins` kèm lý do | E-03 |
| G8 nguồn | có ít nhất một nguồn và một GND; LED có điện trở trong đường (cảnh báo, không chặn) | E-05 |
| G9 SPICE | mạch analog nạp được vào `workspaceSpice` (đã có WA-04) | E-05 |
| G10 parity | tọa độ pin ở 2D, 3D và vị trí lỗ trùng trong 1e-6 mm sau chiếu | E-02 |
| G11 expect | e2e: số part, số dây hiển thị trong DOM bằng `expect` ở mỗi chế độ xem, ở 375/768/1440 px | E-10 |
| G12 ảnh | e2e chụp mỗi chế độ xem; **băm ảnh các chế độ phải khác nhau** (chặn lặp lại lỗi md5 trùng của S0-v2, E-10) | E-10 |
| G13 migrate | bản nháp v1 mẫu → v2 → mở lại không mất part, dây | E-06 |

G1-G10 là test thuần Node (chạy `npm.cmd run test`, không cần trình duyệt). G11-G12 là e2e, chạy sau S5.

## 9. Di chuyển bản nháp cũ (Q-SIM-4)

Giả định (CHƯA KIỂM, S3 phải đọc `workspaceStorage.ts` trước): bản nháp lưu part `{id,type,x,y}` và dây `{from:{partId,pinId},to}`, và preset đổi qua `lessonCircuits.ts`. Hướng:
1. **Khóa mới, không ghi đè khóa cũ.** Ghi v2 vào khóa lưu riêng; v1 để nguyên đến khi người dùng lưu v2 lần đầu (đường lui).
2. `migrateV1toV2(draft)` hàm thuần: giữ `id/type/value` và dây pin-pin; bỏ `x,y`; dùng `getAssemblyPlan` làm *gợi ý* mount ban đầu cho part chưa biết, còn lại `bench`; sinh `expect` từ số hiện có; ghi `migratedFrom: 1` và danh sách cảnh báo ("dây X chưa có lỗ").
3. Không tự sửa lỗi mạch của người dùng: dây hở vẫn hở, chỉ gắn cờ.
4. **Claude review kiểu CP-06:** đọc fixture dữ liệu lưu cũ thật (do founder xuất từ trình duyệt, hoặc fixture trong `tests/`) và chạy thử `migrate` trước khi mở S3 cho người dùng.
5. Tải trang thất bại thì hiện thông báo và nút "dùng bản mẫu", không để trắng (liên quan P1-02 "draft-save-error").

## 10. Quyết định cần founder

**ĐÃ CHỐT 10/11/2026:** founder trả lời "Chốt theo khuyến nghị" cho Q-SIM-1…7: dùng cột "Khuyến nghị" dưới đây (2D top view mặc định; đợt đầu 6 mạch `blink, source-led, button-led, analog-potentiometer, analog-ldr, ir-alert`; làm đủ 28 loại trước; đổi schema với khóa lưu mới; ray liền; dữ liệu `.ts`; giữ logic + liên kết SPICE). Chưa chạy S2r nên điều khoản kỹ thuật vẫn có thể được sửa theo phản biện.

| Mã | Câu hỏi | Phương án | Khuyến nghị và lý do |
|---|---|---|---|
| Q-SIM-1 | View mặc định | (a) 2D top view + 3D tùy chọn; (b) giữ 3D mặc định | (a). Phụ thuộc hình học thuần, test được, dễ đọc (D-SIM-03) |
| Q-SIM-2 | Phạm vi đợt đầu | 6 mạch builder có breadboard (khuyến nghị) / 11 bài / `lessons.ts` 6 id | 6 mạch builder `blink, source-led, button-led, analog-potentiometer, analog-ldr, ir-alert`. Làm rõ vì "6 bài hiện có" là mơ hồ |
| Q-SIM-3 | Catalog | ~20 loại mới theo 5 đợt 4 loại / chỉ làm đủ 28 loại | Làm đủ 28 loại trước; thêm loại mới chỉ khi có bài kéo (mục 7) |
| Q-SIM-4 | Đổi schema, chuyển bản nháp | có / không | Có, khóa lưu mới, giữ v1 làm đường lui |
| Q-SIM-5 (mới) | Ray có đứt giữa không | liền / đứt | Liền (bo 400 lỗ nhỏ), `railSplit` đổi được |
| Q-SIM-6 (mới) | Dữ liệu mạch dạng | `.ts` có kiểu / `.json` | `.ts` |
| Q-SIM-7 (mới) | Mô phỏng điện cho phòng thử | giữ logic + liên kết SPICE / tính V, I ngay trong phòng thử | Giữ logic và liên kết SPICE trong epic này; ngoài phạm vi SIM v2 (E-05 là vấn đề riêng, kế hoạch sau) |

## 11. Rủi ro và giả định chưa kiểm
- Mesh breadboard `parametric-mesh`: hình lỗ trong 3D chưa ai đọc renderer; nếu mesh không vẽ lỗ đúng `gridMm`, 3D sẽ lệch 2D (S3 kiểm bằng test hình học và một ảnh 3D thật).
- `legsMm`/`pinsMm` của 27 part còn lại chưa được rà (manifest breadboard rỗng); nếu thiếu thì S6 gồm bổ sung (chú: dữ liệu ngoài chỉ nhận từ nguồn ĐƯỢC DÙNG trong `docs/data-sources/registry.md`, mã `D17-LIC`).
- Router A* có thể chậm với 16 dây (7-đoạn); lưới nửa bước 83×55 mm ≈ 65×43 ô, chấp nhận được; S4 đo thời gian.
- `CircuitBuilderPage.tsx` (1056 dòng): chỉ chạm vùng chọn view và nạp preset (dòng ~847-860, 994-1003); tách module khi cần (E-09).
- Chưa tái hiện triệu chứng "mạch chỉ CAD" (E-03). S0c phải chạy trước S5 để không xây xong rồi mới thấy còn lỗi.
- S0-v2 không phân biệt các view (E-10), nên baseline "trước" của S7 phải chụp lại bằng G12.

## 12. Sửa đổi v2.1 (10/11/2026) theo S2r và S0c

Nguồn: `docs/agents/runs/MM-SIM-S2R/review.md` (10 giả định sai, tôi kiểm lại 5 điểm bằng node/đọc mã, đều đúng), `.tmp/ai-intake/antigravity/2026-11-10/sim-audit-v3/`. Các sửa này **thay** điều khoản cũ nếu mâu thuẫn.

| # | Sửa | Thay điều khoản |
|---|---|---|
| R1 | **Tách `BreadboardElectricalSpec` khỏi manifest mesh.** `gridMm` không có số lỗ ray (chỉ 4 giá trị Z). S3a định nghĩa `railHoles: 25`, `railX(i)` (ray chia nhóm 5 lỗ, quy ước ghi rõ) và `source: 'assumption-400-tie'`. Phần ray vào trạng thái **chưa kiểm hình** cho tới khi có một ảnh 3D thật đối chiếu số lỗ ray; dải 30×10 theo `gridMm` giữ nguyên | §1 |
| R2 | **Module theo manifest, không ép bench.** `ultrasonic` và `tb6612` có `mount: "breadboard"` trong manifest; cho phép cắm breadboard. Bench chỉ cho part có `legsMm` rỗng (board MCU, pin, motor, relay, buck/boost, h-bridge, servo, limit-switch, ir-sensor) | D-SIM-02, §2 |
| R3 | **Nguồn hình học từng part:** `geometrySource: 'cad' \| 'parametric' \| 'unknown'`. Hầu hết là `parametric` (`componentModels.ts:17-24`). `pinsMm` (điểm nối bench) tách khỏi `legsMm` (chân cắm lỗ) | §2, §7 |
| R4 | **G2 tách đôi:** G2a (chặn) có `legsMm` hoặc `pinsMm` đúng vai trò; G2b (cảnh báo, không chặn) nguồn đã xác thực. Không gán "đã kiểm" cho dữ liệu tham số | G2 |
| R5 | **Cầu SPICE:** `workspaceSpice` chỉ nhận `connections` pin-pin và gọi `createNetIndex` (`workspaceSpice.ts:9-16,160`). Thêm `compileSpiceConnections(doc)` (slice S3e) sinh dây ảo pin-pin theo cây khung mỗi net của `createNetIndexV2`, **không đổi API SPICE**. G9 chạy qua cầu này | §3, G9 |
| R6 | **Endpoint:** dây vật lý có `Endpoint = pin \| hole`; net điện giữ khóa `partId:pinId`; lỗ có khóa `bb1:…`; dây tới chân header của bench dùng `pin`. Hai loại cùng một union-find | §3, §5, §6 |
| R7 | **Di chuyển bản nháp theo định dạng thật:** workspace `schemaVersion: 4`, khóa `machmo-builder-session`, `machmo-lesson-drafts`, `machmo-branch-session` (local) và `machmo-guided-workspace-<bài>`, `machmo-guided-lesson-drafts-<bài>`, `machmo-guided-branch-session-<bài>` (session) (`CircuitBuilderPage.tsx:174-181,675-678`). Migration giữ mọi trường khác (code, project, library), chỉ đổi phần `placed`/`wires`; v2 ghi khóa mới `machmo-circuit-v2-*`; fixture cho cả 4 họ khóa | §9, G13 |
| R8 | **G6:** vượt 3 góc là **cảnh báo**, không chặn. Chặn: không có đường, đường xuyên footprint, hai dây chạy song song chồng đoạn, đầu dây hở. Giao vuông góc được phép; khoảng cách tối thiểu giữa hai dây song song = 1 ô (1,27 mm); đầu dây thoát theo tiếp tuyến của chân/lỗ ít nhất 1 ô; hòa kết quả A* theo thứ tự (chi phí, `wire.id`, hướng) | §5, G6 |
| R9 | **G11:** đếm bằng `data-testid` riêng (`circuit-part`, `circuit-wire`, `circuit-pin`), không dùng DOM hiện tại (S0c đếm 6/3/3 dây cho cùng 3 dây thật). Thêm vào S5b | G11 |
| R10 | **G12:** ngoài "băm ảnh khác nhau", mỗi view phải có marker DOM/nhãn riêng (`data-view`), và **view PCB phải hiển thị đúng part/chân của bài hoặc ghi rõ "chỉ board"** | G12 |
| R11 | **Corpus cổng:** danh sách doc ở `src/data/lessonCircuits/index.ts` + fixture `tests/fixtures/`; cổng chạy toàn bộ, fail-fast theo doc | §8 |
| R12 | **PCB 2D (nguyên nhân E-03):** nút "PCB 2D · đường đồng" nằm cùng hàng chọn mạch nhưng chỉ hiện board ESP32 (cùng một ảnh cho mọi bài) và tự ghi topology không thành copper. Xem Q-SIM-8 | §4 |

**ĐÃ CHỐT 10/11/2026: Q-SIM-8 = (a)** (founder: "Đồng ý (a)"). Slice S5e thực hiện.

**Q-SIM-8 (mới) · View "PCB 2D · đường đồng" trong phòng thử.** Phương án: (a) đổi nhãn thành "PCB board (tham chiếu)", đưa khỏi hàng chọn view mạch, đặt ở "Hồ sơ board"; (b) giữ nguyên chỗ nhưng ghi rõ; (c) dựng copper cho mạch bài (ngoài phạm vi). Khuyến nghị (a): rẻ nhất, gỡ nguyên nhân gây hiểu nhầm. Giao thành slice S5e (≤2 file) sau S5a.
