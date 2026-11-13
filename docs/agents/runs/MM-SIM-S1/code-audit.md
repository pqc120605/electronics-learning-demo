# MM-SIM-S1 · Kiểm kê mã mô phỏng mạch

Ngày kiểm: 09/11/2026  
Phạm vi: đọc mã, không sửa mã sản phẩm. Không chạy typecheck/test vì câu hỏi được trả lời trực tiếp từ luồng và cấu trúc dữ liệu; chưa cần lệnh có thể tạo artifact.

## Tóm tắt

Các preset của builder không chỉ là model CAD: chúng có dữ liệu part, vị trí phần trăm, dây và endpoint theo pin. Tuy nhiên, bố trí 2D ban đầu là các tọa độ phần trăm viết sẵn, còn sơ đồ 2D/3D vẽ dây bằng một đường gấp khúc H-V-H cố định, không tìm đường tránh linh kiện. View assembly 3D có bộ xếp lên lưới breadboard dựa trên metadata hình học; điều đó không chứng minh model breadboard trực quan có đủ lỗ/tiếp điểm như breadboard thật. Vì vậy, lỗi hiển thị không thể quy về duy nhất “thiếu dữ liệu mạch”.

## A–E · Phán quyết các giả thuyết

| Giả thuyết | Phán quyết | Bằng chứng và giới hạn |
|---|---|---|
| A. Dữ liệu mạch bài học thiếu hoặc thiếu vị trí/chân, nên mạch chỉ có hình CAD. | **SAI** đối với dữ liệu preset trong builder; chưa chứng minh đây không thể là lỗi ở một runtime path khác. | `src/data/lessonCircuits.ts:14-26` khai báo part, tọa độ `x/y` và wires cho các bài; `:12-13` ánh xạ endpoint chỉ số sang ID pin bằng component definition. `src/pages/CircuitBuilderPage.tsx:853-860` nạp cả `circuit.placed` lẫn `circuit.wires`. `src/data/componentRegistry.ts:55-70` khai báo pin cho board và các linh kiện dùng trong preset. Bảng kiểm kê từng preset ở dưới. |
| B. Vị trí tính bằng công thức, không bám lưới lỗ breadboard. | **ĐÚNG một phần; phụ thuộc view.** | 2D canvas nhận tọa độ preset theo phần trăm và vẽ trực tiếp theo `part.x/part.y` (`src/data/lessonCircuits.ts:14-26`; `src/pages/CircuitBuilderPage.tsx:999-1000`). `SchematicView` dùng tọa độ phần trăm hoặc bố cục compact theo index (`src/components/builder/SchematicView.tsx:20-26, 107-115`). Ngược lại, 3D gọi `getAssemblyPlan`, tìm vị trí gắn theo chân/footprint, snap vào grid và kiểm tra xung đột (`src/lib/assemblyLayout.ts:210-218, 250-285`). |
| C. Dây không có luật đi dây. | **SAI theo nghĩa “không có quy tắc hình học nào”; ĐÚNG nếu ý là thiếu router tránh chướng ngại.** | Topology là các cạnh nối hai endpoint được tạo bởi `connection` hoặc thao tác nối hai chân (`src/data/lessonCircuits.ts:12-15`; `src/pages/CircuitBuilderPage.tsx:847`). Các view vẽ một đường H-V-H qua trung điểm X: builder 2D (`src/pages/CircuitBuilderPage.tsx:1001`), schematic (`src/components/builder/SchematicView.tsx:106`), fallback 3D (`src/components/builder/Assembly3DView.tsx:55`). Đây là quy tắc trình bày đơn giản, không phải pathfinding quanh part, bẻ góc có chi phí, hoặc kiểm tra giao cắt. `circuitNets.ts:13-45` chỉ gom endpoint nối bằng dây tường minh; không tính điện áp/dòng. |
| D. Breadboard không có lưới lỗ và dải nối. | **SAI về mô hình bố trí nội bộ; CHƯA XÁC ĐỊNH về chi tiết lỗ/tiếp điểm nhìn thấy trong mesh 3D.** | Registry chỉ mô tả breadboard như part 4 chân logic và đánh dấu `visual-only` (`src/data/componentRegistry.ts:57`), nhưng `assemblyLayout.ts:218-223` đọc `gridMm`/bounds từ mesh, `:203-205` chấp nhận cột 0–29 và hàng 0–9, còn `:95` và `:178-195` định nghĩa hai nửa dải theo hàng và ghi nhận lỗ đã dùng. `AssemblyStage.tsx:314` nói app xếp part vào dải cùng net. Những file đã đọc không đủ xác minh mesh có vẽ từng lỗ kim loại hay rail đúng mẫu breadboard thực. |
| E. Catalog 28 loại chưa đủ cho bài học. | **CHƯA XÁC ĐỊNH.** | `componentRegistry.ts:55-94` định nghĩa catalog và các loại pin; `:47-48` phân biệt `supported` với `visual-only`. Có thể thấy một số loại chưa có hành vi mô phỏng (`:60-63, :68-73`), nhưng không có ma trận yêu cầu bài học→linh kiện/behavior để chứng minh catalog thiếu bao nhiêu hay loại nào bắt buộc. Đếm “28 loại” trong plan không đủ làm bằng chứng về mức đủ/thiếu. |

## Luồng dữ liệu: bài học → mạch → bố cục → vẽ

1. `src/data/builderLessons.ts:3,25-91` khai báo 11 ID bài trong picker; `src/pages/CircuitBuilderPage.tsx:174-180` lấy bài từ query và chọn storage theo bài. `src/data/lessons.ts:48-134` là nội dung bài học riêng `esp32-led`, không phải cùng ID `blink`.
2. `src/pages/CircuitBuilderPage.tsx:848-860` gọi `getBuilderLesson(nextId)` và `circuitForLesson(nextId)`, rồi ghi `circuit.placed`/`circuit.wires` vào state.
3. `src/data/lessonCircuits.ts:10-15` định nghĩa kiểu part, chuyển endpoint dạng `part:index` sang ID pin ổn định, và preset mặc định. Các nhánh `:17-26` trả preset từng bài.
4. Khi người dùng tạo dây, `src/pages/CircuitBuilderPage.tsx:847` gọi `createWireFromKeys` với hai pin keys và lưu edge; bản chỉ số preset cũng được chuyển về `{partId,pinId}` ở `lessonCircuits.ts:12-13`.
5. Net index được tạo từ danh sách dây trong `src/lib/circuitNets.ts:14-35`; nó chỉ hợp nhất endpoint được nối rõ. Nhóm net hiển thị trong schematic ở `:37-45`.
6. Assembly 3D gọi `getAssemblyPlan(parts,wires,options)` (`src/components/builder/AssemblyStage.tsx:80-84`; hàm ở `src/lib/assemblyLayout.ts:210-218`) để trả placements, pin points và wire ends.
7. `src/pages/CircuitBuilderPage.tsx:998-1001` chọn view: canvas 2D, `SchematicView`, hoặc `AssemblyStage`. `SchematicView` đo vị trí pin DOM rồi vẽ dây topology (`src/components/builder/SchematicView.tsx:36-56, 102-116`). `AssemblyStage` dựng 3D/canvas, overlay và danh sách parts (`src/components/builder/AssemblyStage.tsx:62-84, 272-325`); fallback HTML là `Assembly3DView` (`:234`).

## Breadboard và vị trí

- `componentRegistry.ts:57` chỉ có bốn endpoint logic (`railPlus`, `railMinus`, `rowA`, `rowB`); không khai báo từng lỗ như pin riêng.
- `assemblyLayout.ts:95` phân các vị trí vào strip `top` hoặc `bottom` theo `row < 5`, mỗi cột thành một strip. `:156-173` xoay offset chân từ metadata, tìm lỗ gần nhất theo pitch/các hàng, rồi từ chối nếu snap error vượt giới hạn. `:178-195` ngăn trùng lỗ, xung đột net trong cùng strip và va chạm footprint.
- `assemblyLayout.ts:267-285` duyệt rotation/cột/hàng để chọn ứng viên hợp lệ, ưu tiên vị trí gần preset hoặc cùng cột/net. Linh kiện còn lại được xếp trên bench theo shelf/footprint (`:290-305`). Các quy tắc này thuộc view 3D; tọa độ 2D không được tái dùng (`:210` comment).
- Metadata thực của mesh (pitch, vị trí rail, hình vẽ lỗ) được nạp qua `getComponentMesh('breadboard')` (`assemblyLayout.ts:218-223`), nhưng implementation/provider đó không nằm trong bộ file được yêu cầu. Không kết luận hình học hiển thị chính xác.

## Dây: tạo, biểu diễn, định tuyến

- Preset dây là `CircuitConnection` với ID dây và hai endpoint; helper `connection` chuyển index thành pin ID (`lessonCircuits.ts:8-13`). Tương tác người dùng tạo dây giữa hai pin keys (`CircuitBuilderPage.tsx:847`).
- Net là thành phần liên thông của các cạnh tường minh (`circuitNets.ts:13-35`); nó không gộp các lỗ breadboard cùng dải như một quan hệ điện độc lập trong dữ liệu topology.
- 2D builder, schematic và fallback 3D đều lấy hai tọa độ endpoint rồi tạo `M … H mid V … H …` (`CircuitBuilderPage.tsx:1001`, `SchematicView.tsx:106`, `Assembly3DView.tsx:55`). Có luật vẽ góc vuông đơn giản; không thấy router tránh part, bám grid 2D, kiểm va chạm dây hoặc tối ưu đường ngắn.
- Assembly plan có `wireEnds` với endpoint jumper đưa tới lỗ trống trong cùng strip (`assemblyLayout.ts:333-350`), nhưng file này chỉ tính hai đầu; đường dây 3D hiển thị trong fallback vẫn là H-V-H. Không xác minh renderer WebGL thực vẽ jumper thành vật thể hay chỉ dùng endpoints này nếu chưa đọc renderer/scene module.

## Kiểm kê preset builder

“Có pin” nghĩa là endpoint của preset ánh xạ qua danh mục pin trong registry; “có net” nghĩa là có wire edge tạo nhóm nối tường minh. Chưa chạy kiểm tra runtime về mọi endpoint.

| ID bài builder | Part trong preset | Số part | Có tọa độ | Wires | Endpoint pin / net |
|---|---|---:|---|---:|---|
| `blink` (mặc định) | board, breadboard, LED, resistor | 4 | Có | 3 | Có khai báo; có net |
| `button-led` | mặc định + button | 5 | Có | 5 | Có khai báo; có net |
| `ir-alert` | mặc định + IR sensor | 5 | Có | 6 | Có khai báo; có net |
| `ultrasonic-distance` | mặc định + ultrasonic | 5 | Có | 7 | Có khai báo; có net |
| `seven-segment-counter` | board, breadboard, display, 7 resistor | 10 | Có | 16 | Có khai báo; có net |
| `source-led` | mặc định | 4 | Có | 3 | Có khai báo; có net |
| `buck-boost-concept` | board, battery, converter, LED, resistor | 5 | Có | 5 | Có khai báo; có net |
| `dc-motor-driver` | board, battery, TB6612, motor | 4 | Có | 10 | Có khai báo; có net |
| `mosfet-switch` | board, battery, resistor, MOSFET, motor, diode | 6 | Có | 8 | Có khai báo; có net |
| `analog-potentiometer` | board, breadboard, LED, resistor, potentiometer | 5 | Có | 6 | Có khai báo; có net |
| `analog-ldr` | board, breadboard, LED, 2 resistor, LDR | 6 | Có | 7 | Có khai báo; có net |

Đếm part/wire lấy từ nhánh dữ liệu `src/data/lessonCircuits.ts:14-26`; ID và tiêu đề builder lấy từ `src/data/builderLessons.ts:3,25-91`. Nội dung `esp32-led` trong `src/data/lessons.ts:48-134` là một lesson khác: năm mục parts (gồm jumper) và pinMap ở `:60-100,110-113`; không có trường tọa độ hoặc connection graph ở dạng `CircuitConnection`. Không được cộng nó thành preset thứ 12. Đây là bất nhất/đường chuyển đổi cần truy tiếp nếu hiển thị bài `esp32-led` qua một entry path khác.

## Nên giữ và nên viết lại khi xử lý lỗi

**Nên giữ nguyên:** định danh `partId/pinId` và topology tách khỏi view; registry pin definitions; `createNetIndex` như phép gom endpoint tường minh; phân biệt visual-only/supported; ghi chú về pin/mesh minh họa; metadata footprint/legs làm input để snap và cảnh báo không đủ chỗ. Các ranh giới này giảm nguy cơ nhầm hình học, topology và mô phỏng điện.

**Nên viết lại theo lát cắt, sau khi có repro:** preset lesson thành dữ liệu có schema kiểm được và có test mọi endpoint; mô hình breadboard thành lưới/strip độc lập với mesh renderer; layout logic 2D dựa trên footprint/pin geometry thay vì tọa độ tay cho preset; router dây riêng (đầu nối, grid, tránh va chạm, kiểm tra giao nhau) dùng chung cho views. Giữ 3D như renderer tùy chọn; không xem mô hình 3D hiện tại là kiểm chứng breadboard thật.

## Rủi ro khi sửa `CircuitBuilderPage.tsx`

File có 1.056 dòng và đang chứa state/workspace persistence, khôi phục draft, nhập/chuyển bài, lịch sử topology, tương tác pointer/drag, chuyển view, simulation modes/SPICE/firmware và JSX của nhiều view (các vùng liên quan: `:174-227`, `:847-860`, `:968`, `:994-1003`, `:1012-1032`). Sửa layout/wires tại đây có nguy cơ làm lệch state đã lưu, ghi đè draft, làm đứt ổn định endpoint, thay đổi thao tác kéo/chọn pin, hoặc ảnh hưởng mô phỏng không thuộc lỗi render. Các phần tính toán nên được tách vào module thuần và kiểm thử theo scope; page giữ vai trò điều phối state/props.

## File đã đọc

- `docs/claude-support/2026-11-09-sim-epic/plan.md` — mục 1–3 (theo yêu cầu).
- `AGENTS.md` và `../docs/agents/README.md` — workflow và giới hạn review.
- `src/data/lessonCircuits.ts`
- `src/data/lessons.ts`
- `src/data/builderLessons.ts` — đọc bổ sung để kiểm kê ID thật của picker.
- `src/data/componentRegistry.ts`
- `src/lib/assemblyLayout.ts`
- `src/lib/circuitNets.ts`
- `src/components/builder/AssemblyStage.tsx`
- `src/components/builder/Assembly3DView.tsx`
- `src/components/builder/SchematicView.tsx`
- `src/pages/CircuitBuilderPage.tsx` — chỉ vùng liên quan tới state lesson, nạp preset, wiring và render view.

## File chưa đọc

- `src/data/board-pin-anchors.json`, mesh manifests/metadata và model assets: để ngỏ xác minh kích thước/lỗ/rail thực được hiển thị.
- Assembly scene/WebGL renderer được dùng bên trong `AssemblyStage.tsx`: chưa kiểm đường vẽ mesh/wire 3D thực.
- CSS của builder/schematic/assembly: chưa kiểm cắt cụt, clipping, kích thước responsive hoặc visibility.
- Tests/e2e và kết quả trình duyệt S0: không được yêu cầu đọc trong S1; do đó báo cáo này xác minh cấu trúc mã, không tái hiện triệu chứng UI.
- `src/data/builderLessons.ts` đã đọc bổ sung như ghi ở trên; không đọc phần logic còn lại ngoài danh sách ID/title cần đối chiếu.

## Kiểm tra và giới hạn

- Filesystem edits: chỉ tạo file báo cáo này.
- Tests/typecheck: **NOT_RUN** — chỉ audit tĩnh theo yêu cầu; không sửa code và không cần tạo artifact kiểm thử.
- Claude review: **NOT_RUN** — `AGENTS.md` cấm gửi nội dung dự án hoặc yêu cầu review sang Claude.
- Các giả thuyết về “chỉ có CAD”, tỷ lệ linh kiện thực sự bị thiếu trong browser, clipping và mesh breadboard nhìn thấy không được xác minh bằng chạy ứng dụng; chúng cần repro S0.
