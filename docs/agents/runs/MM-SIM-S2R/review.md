# MM-SIM-S2R — Phản biện khả thi kỹ thuật spec-v2

Ngày: 10/11/2026  
Phạm vi: đánh giá tĩnh tài liệu và mã được nêu; không sửa spec/mã, không chạy test/typecheck, không gửi nội dung ra ngoài workspace.

## Kết luận điều hành

**Spec khả thi như một thiết kế phần mềm theo từng lát cắt, nhưng chưa khả thi để cam kết đầy đủ các cổng hiện viết chỉ dựa vào dữ liệu hiện có.** Ba phụ thuộc dữ liệu đang bị xem như đã có nhưng thực tế còn thiếu/chưa xác thực: mô tả ray 25 lỗ trong `gridMm`; hình học lắp chân chính xác của catalog; và chuyển net breadboard vào hợp đồng hiện tại của SPICE. A* cho 16 dây có quy mô tính toán nhỏ và khả thi, nhưng cần benchmark trên fixture đông nhất cùng quy tắc endpoint/độ rộng vùng rõ ràng trước khi coi G6 đạt.

Không tìm thấy căn cứ để kết luận mesh breadboard thật có đủ lỗ nhìn thấy hoặc các tọa độ chân trong mesh biểu diễn một mẫu linh kiện cụ thể. Các giá trị đang có là metadata mô hình tham số/minh họa, không phải hồ sơ sản phẩm vật lý.

## Đánh giá từng điều khoản bắt buộc

### Mục 1 — Mô hình lưới breadboard

| Điều khoản | Verdict | Bằng chứng và phản biện |
|---|---|---|
| Gắn `RAIL_HOLES = 25`, đọc `rails` và `columns`, kiểm với mesh (spec §1, dòng 20) | **CHƯA XÁC ĐỊNH** về đúng số 25/mesh; **KHẢ THI** để mã hóa hằng có nguồn | Manifest có `columns: 30`, `pitch: 2.54`, 10 hàng và 4 tọa độ Z cho rails, nhưng không có số lỗ ray, số cột ray hay tọa độ X bắt đầu/kết thúc ray (`src/data/component-models.manifest.json:177-199`). Mesh là `parametric-mesh` (`:172-176`); file mesh/renderer không được yêu cầu đọc. Hằng 25 có thể được ghi theo quyết định sản phẩm có nguồn riêng, nhưng không suy ra và không kiểm được từ `gridMm` hiện tại. |
| Lỗ vùng giữa 30 cột × 10 hàng, hai nửa a–e/f–j (spec §1, dòng 18, 22, 25) | **KHẢ THI** về thuật toán; **CHƯA XÁC ĐỊNH** tính khớp hình ảnh/vật thật | `gridMm` có 30 cột và 10 tọa độ hàng (`src/data/component-models.manifest.json:177-193`); planner chấp nhận chỉ số cột 0–29, hàng 0–9 và tính điểm từ pitch/rows (`src/lib/assemblyLayout.ts:94-95,203-205`). Mesh hiển thị đúng từng lỗ chưa xác minh. |
| ID `bb1:T+:1..25`/ba ray còn lại và ánh xạ tọa độ lỗ (`spec-v2.md` §1, dòng 22, 27) | **CHƯA XÁC ĐỊNH** với dữ liệu hiện tại | Z của bốn ray có trong `rails`, nhưng không có 25 tọa độ X hoặc quy tắc suy ra X cho mỗi ray (`src/data/component-models.manifest.json:177-199`). Có thể định nghĩa từ pitch và một điểm gốc mới, nhưng gốc/số lỗ phải được thêm rõ và kiểm mesh. |
| `holeNet`, `stripHoles`, `parseHole`, `holeToMm`, `footprintHoles`, `canMount`, `occupancy`, `snapNearest` là hàm thuần (spec §1, dòng 24-29) | **KHẢ THI** | Đây là phép ánh xạ/parsing/kiểm tra trên dữ liệu bất biến. `holePoint` hiện tính tọa độ lỗ thuần từ grid (`src/lib/assemblyLayout.ts:94`); mã hiện có tách `stripOf` khỏi mesh renderer (`:95`). Cần quy định input lỗi, ray split, board id và chiếm lỗ trước khi viết API. |
| Không giả định mesh đồng nghĩa mô hình điện (spec §1; liên hệ §3) | **KHẢ THI** và đúng hướng | Net hiện tại không biết continuity nội bộ breadboard (`src/lib/circuitNets.ts:13-35`; `docs/claude-support/2026-11-09-sim-epic/audit-synthesis.md:53,62`). Tách `BreadboardSpec` khỏi mesh sẽ giải quyết khoảng trống dữ liệu mà không phụ thuộc renderer. |

**Kết quả ưu tiên (a):** vùng giữa có 300 vị trí lỗ suy ra từ 30×10. Để tạo tổng “400 lỗ nối”, cần cộng 4×25 lỗ ray, nhưng con số ray 25 hiện không nằm trong manifest; nó là đầu vào ngoài. `gridMm` hiện tại **không đủ** để xác định `bb1:T+:1..25` đầy đủ vì thiếu số lượng và gốc/extent X của ray. Không được báo PASS kiểm ray từ dữ liệu này.

### Mục 2 — Gắn linh kiện

| Điều khoản | Verdict | Bằng chứng và phản biện |
|---|---|---|
| `mount` cho breadboard/bench và giải quyết vị trí từ chân (spec §2, dòng 33-34) | **KHẢ THI** về cấu trúc; **CHƯA XÁC ĐỊNH** độ đúng hình học | `AssemblyPlacement`/planner hiện đã có mount, footprint, chân và snap (`src/lib/assemblyLayout.ts:13-29,156-173,198-205`). Manifest tách `pinsMm` khỏi `legsMm` (`src/data/componentModels.ts:5-7`). Tuy vậy `pinsMm` là điểm đầu nối điện, không mặc nhiên là chân cắm; chỉ `legsMm` mới ánh xạ được chân vào lỗ. |
| Mọi chân vào lỗ thật; mỗi lỗ một chân; hai chân cùng part không cùng strip trừ `intentionalShort`; footprint cách nhau ≥0,5 mm; straddle chỉ khi khai báo (spec §2, dòng 35) | **KHẢ THI CÓ ĐIỀU KIỆN** | Có thể kiểm bằng `canMount`; planner hiện đã từ chối lỗ trùng, xung đột net cùng strip và footprint giao nhau (`src/lib/assemblyLayout.ts:178-195`). Quy tắc hiện dùng biên tránh 0,05 mm, không phải padding 0,5 mm của spec (`:97`); cần thay đổi có chủ đích. Manifest không khai báo `intentionalShort` hay `straddle`; hiện chưa có metadata để chứng minh ngoại lệ nào hợp lệ. |
| Dùng `legsMm`/`pinsMm` cho catalog (spec §2, dòng 34; §7, dòng 108) | **CHƯA XÁC ĐỊNH** về mức đủ/đúng; một phần dữ liệu có sẵn | So 27 loại trong registry ngoài breadboard với manifest: 17 model có `legsMm` không rỗng; 9 model bench có `legsMm: []` nhưng có tọa độ `pinsMm`; board không ở manifest component này mà được lấy pin anchor riêng. Tổng quát hóa từ hai trường này không tạo được chân lắp nếu part chỉ có tọa độ pin điện. Mọi model parametric chỉ là kích thước thường gặp, không đại diện mã sản phẩm (`src/data/componentModels.ts:17-24,29-40`). |

Bảng kiểm 27 loại (ngoài `breadboard`), đối chiếu `src/data/componentRegistry.ts:55-93` với các entry có cùng ID trong manifest:

| Nhóm | Loại | Có legsMm | Có pinsMm | Nhận xét |
|---|---|---:|---:|---|
| Có chân lắp và tọa độ pin | `led`, `resistor`, `capacitor`, `button`, `buzzer`, `potentiometer`, `ldr`, `ultrasonic`, `oled`, `seven-segment`, `diode`, `rgb-led`, `transistor`, `mosfet`, `thermistor`, `slide-switch`, `tb6612` | Có, 2–16 | Có | Entry manifest lần lượt bắt đầu tại các dòng 824, 1326, 370, 252, 316, 1207, 770, 2136, 1042, 1623, 508, 1450, 2072, 923, 2021, 1757, 1866. `tb6612` có 16 legs nhưng chỉ 9 pins (`:1866` và tiếp theo); cần kiểm pin-map, không suy từ bằng số lượng. |
| Chỉ tọa độ đầu nối bench | `limit-switch`, `ir-sensor`, `servo`, `dc-motor`, `battery`, `relay`, `buck-converter`, `boost-converter`, `h-bridge` | Không (mảng rỗng) | Có | Các entry bắt đầu ở manifest dòng 878, 676, 1579, 424, 3, 1267, 203, 102, 562. Hợp lý nếu đúng là bench như spec D-SIM-02; không đủ để cắm lỗ. |
| Board MCU | `board` | Không ở manifest component | Anchor riêng | `modelFor` lấy `boardPinAnchors`/`boardAssets`, còn fallback dùng hộp (`src/lib/assemblyLayout.ts:103-108,120,230-233`). Cần kiểm nguồn anchor riêng trước khi khẳng định pin chính xác. |

Các dòng bắt đầu entry trong bảng chỉ định vị đối tượng; trường/kind được xác nhận trong JSON tương ứng. Có một lệch cấu hình đáng chú ý: spec §2 dòng 36 xếp TB6612 và siêu âm vào bench, nhưng manifest đánh `tb6612` và `ultrasonic` là `mount: "breadboard"` (`src/data/component-models.manifest.json:1887-1890,2157-2160`). Cần quyết định ưu tiên ở nguồn nào trước khi dùng modelFor để tự chọn vị trí. Đây là dữ liệu sẵn có trong workspace, không phải kiểm tra trực quan từng mesh. Phần “17 có legs” không có nghĩa đã chứng minh hình học của chúng khớp linh kiện người học sẽ mua.

### Mục 3 — Net và SPICE

| Điều khoản | Verdict | Bằng chứng và phản biện |
|---|---|---|
| `createNetIndexV2` union dây tường minh, holes cùng strip/rail, chân→hole, intrinsic pins; giữ endpoint `partId:pinId` (spec §3, dòng 40) | **KHẢ THI** | Union-find theo endpoint đã có (`src/lib/circuitNets.ts:11-35`). Có thể tạo khóa cho lỗ và hợp nhất endpoint; phải định nghĩa xung đột dây/short và ổn định ID. |
| `createNetIndex` cũ tương thích preset v1 (spec §3, dòng 40) | **KHẢ THI CÓ ĐIỀU KIỆN** | Hiện hàm chỉ nhận các dây tường minh, không thêm continuity vật lý (`src/lib/circuitNets.ts:13-35`). Adapter hoặc overload có thể giữ API, nhưng “v1” cần định nghĩa đúng phiên bản dữ liệu; hiện lesson preset ánh xạ endpoint rồi tạo wire edges, không phải `CircuitDocV2` đã xác lập (`docs/agents/runs/MM-SIM-S1/code-audit.md:20-28,44-62`). |
| `workspaceSpice` đọc net từ `netsV2` và suy GND từ breadboard (spec §3, dòng 41; §8 G9) | **KHÔNG KHẢ THI NHƯ CÂU ĐANG VIẾT VỚI API HIỆN TẠI**; **KHẢ THI SAU ADAPTER/HỢP ĐỒNG MỚI** | `WorkspaceSpiceInput` chỉ nhận `parts`, `connections`, `boardLogicLevel` và tùy chọn board (`src/lib/workspaceSpice.ts:9-16`). Hàm gọi `createNetIndex(validWires)` (`:160-168`) và xây node từ endpoint dây (`:252-279`). Nó tuyên bố không suy continuity giữa lỗ/ray (`:176-181`). Cần hoặc truyền `NetIndexV2`/net IDs vào SPICE, hoặc chiếu các nhóm breadboard thành topology mà compiler hiểu; chuyển mỗi named pin không tự tạo các net đồng nhất. |
| Bài thiếu GND tự suy ra từ net breadboard (spec §3, dòng 41) | **CHƯA XÁC ĐỊNH** về quy tắc mong đợi | SPICE hiện chỉ nhận GND nếu endpoint nguồn/board thuộc net tạo từ explicit wires (`src/lib/workspaceSpice.ts:252-263`). Spec không nói cách ray GND trở thành endpoint/module pin hay xử lý breadboard không có pin GND. |

### Mục 4 — Layout

| Điều khoản | Verdict | Bằng chứng và phản biện |
|---|---|---|
| Một `mountResolve`/`Placement` dùng cho 2D, sơ đồ, 3D; schematic sinh từ net (spec §4, dòng 45-52) | **KHẢ THI**, nhưng tích hợp có rủi ro cao | 3D hiện có planner riêng và rõ ràng không dùng tọa độ 2D (`src/lib/assemblyLayout.ts:210-218`). Sơ đồ hiện tạo dây từ pin DOM và cách xếp riêng; audit đối chiếu 2D/schematic % với 3D (`docs/claude-support/2026-11-09-sim-epic/audit-synthesis.md:26-28,63`). Mô hình chung hợp lý, nhưng 2D layout ở mm cần viewBox/responsive transform rõ, còn schematic phải tiếp tục dùng topology thay vì ép tọa độ lắp. |
| Lane theo category/id, footprint từ `sizeMm`, khoảng hở 4 mm, xoay để rút dây (spec §4, dòng 48-52) | **KHẢ THI CÓ ĐIỀU KIỆN** | AABB/transform đã hỗ trợ footprint và xoay (`src/lib/assemblyLayout.ts:75-91`). `sizeMm` có cho các mesh (`src/data/componentModels.ts:7`), nhưng kích thước tham số không có provenance MPN (`:22-24`). Cần định nghĩa footprint mặt bằng (trục X/Z), lane bounds, cách tính wire clearance và timeout/tie-break cho tối ưu xoay. Chưa có dữ liệu để khẳng định mọi bài nằm gọn. |
| Dùng tọa độ % cũ làm gợi ý, không làm nguồn layout mới (spec §4, dòng 51) | **KHẢ THI**, migration chưa đủ căn cứ | Builder preset thực có x/y % và dây (`docs/agents/runs/MM-SIM-S1/code-audit.md:14-15,48-60`). Tuy nhiên workspace lưu còn nhiều state ngoài part/wires; cần bảo toàn những trường đó khi migrate (xem phần storage). |

### Mục 5 — Router và yêu cầu dây

| Điều khoản | Verdict | Bằng chứng và phản biện |
|---|---|---|
| Mỗi dây có đúng hai đầu hợp lệ là lỗ hoặc chân header (spec §5, dòng 57) | **CHƯA XÁC ĐỊNH** do xung đột endpoint schema | §3 yêu cầu giữ khóa endpoint `partId:pinId`, trong khi §5 chuyển sang đầu dây hole/header; §6 schema/Connection cần được thống nhất. Workspace SPICE hiện đòi hai `CircuitEndpoint` có `partId/pinId` (`src/lib/workspaceSpice.ts:131-145`). Đề nghị định nghĩa endpoint discriminated union (`pin` hoặc `hole`) và một cách chuẩn hóa net trước khi giao router. |
| A* trực giao trên ô 1,27 mm, bước=1, rẽ +3, giao +5, qua linh kiện cấm, route tất định (spec §5, dòng 58) | **KHẢ THI** về thuật toán; **CHƯA XÁC ĐỊNH** hiệu năng/độ bền 16 dây | Breadboard 83×55 mm, lưới có khoảng 65×43 bước theo cỡ spec (`spec-v2.md:18,170`; manifest `:155-159,177-199`), khoảng 2.800 ô mỗi lần tìm. 16 đường ở quy mô này không phải vấn đề lớn cho A* thuần với heap/visited hợp lý. Nhưng có thể cần state `(x,y,direction,bends)` để tính chi phí rẽ/giới hạn góc; endpoint bench mở rộng vùng tìm kiếm, thứ tự wire-ID làm route phụ thuộc thứ tự, và giao chéo/độ rộng dây/clearance chưa định nghĩa. Cần benchmark fixture 16 dây ở viewport thấp và cao; không thể tuyên bố timing hiện đã đạt. |
| Tối đa 3 góc rẽ nhưng khi vượt chỉ cảnh báo, không bỏ dây (spec §5, dòng 58; §8 G6, dòng 133) | **CHƯA XÁC ĐỊNH** do tiêu chí tự mâu thuẫn | G6 ghi “route tồn tại, ≤3 góc” như cổng kiểm, còn §5 nói vượt 3 góc là cảnh báo nhưng vẫn giữ dây. Chốt rõ route >3 bends là fail hay warning; nếu vẫn giữ route thì G6 không thể đòi ≤3 cho mọi dây. |
| Đầu dây thoát vuông góc ít nhất một ô (spec §5, dòng 59) | **CHƯA XÁC ĐỊNH** cách đo | Khả thi cho lỗ trên breadboard, nhưng spec áp dụng cả bench/header; cần quy tắc hướng tiếp tuyến của pin và chiều dài đoạn thoát. Hiện `getAssemblyPlan` chỉ tính đầu jumper và điểm đầu/cuối, không có polyline router (`src/lib/assemblyLayout.ts:320-350`). |
| Màu dây/net (spec §5, dòng 60) | **KHẢ THI** | Hợp đồng màu xác định được từ net class/index; cần ưu tiên trạng thái/khả năng tiếp cận màu cho người mù màu. Màu hiện trong legend không chứng minh các view đã đồng bộ. |
| Một polyline mm dùng cho Canvas2D và 3D (spec §5, dòng 61-62) | **KHẢ THI CÓ ĐIỀU KIỆN** | Tách route khỏi renderer là kiến trúc phù hợp; hiện ba view có các tuyến H-V-H riêng (`docs/claude-support/2026-11-09-sim-epic/audit-synthesis.md:14,26,65`; `src/lib/assemblyLayout.ts:333-350`). 3D cần nâng Z/clearance để tránh mesh; sơ đồ nguyên lý không nên dùng route vật lý theo chính spec. |

### Mục 8 — Cổng kiểm tự động G1–G13

| Gate | Verdict | Phản biện khả thi |
|---|---|---|
| G1 schema v2/required fields/unique IDs (dòng 128) | **KHẢ THI** | Validator thuần Node có thể kiểm schema và tập ID. Cần chốt nguồn schema/fixture v1 và xử lý unknown keys. |
| G2 part có registry type, footprint, legs/pins (dòng 129) | **CHƯA XÁC ĐỊNH** | 27 loại có nguồn tọa độ lắp khác nhau: 17 `legsMm`, 9 `pinsMm` bench, board anchor riêng. `pinsMm` bench không thay thế `legsMm` cho cắm lỗ; metadata kiểu/straddle/footprint còn thiếu hoặc chỉ tham số. Cần tách yêu cầu footprint/pads bench khỏi legs breadboard. |
| G3 mọi pin endpoint tồn tại (dòng 130) | **KHẢ THI** | So ID endpoint với `componentRegistry` và pin list; registry đã có pin IDs (`src/data/componentRegistry.ts:38-45,55-93`). |
| G4 hole hợp lệ, một hole một chân/một endpoint dây (dòng 131) | **KHẢ THI CÓ ĐIỀU KIỆN** | Dễ kiểm sau khi lưới ray có kích thước đầy đủ và schema endpoint `hole` thống nhất. Hiện grid không chứa tọa độ/count ray. |
| G5 không overlap 0,5 mm, không ra ngoài board/bench (dòng 132) | **KHẢ THI CÓ ĐIỀU KIỆN** | AABB, transform và bounds đã có (`src/lib/assemblyLayout.ts:88-91,97,203-205`). Cần giải quyết `sizeMm` minh họa, vùng breadboard-vs-bench và cách tính footprint theo xoay. |
| G6 wire endpoints hợp lệ, khác net, route tồn tại, ≤3 góc, không xuyên part (dòng 133) | **CHƯA XÁC ĐỊNH** như một gate nhất quán | Endpoint schema chưa thống nhất; route có thể >3 góc và spec §5 cho phép giữ với warning; “crossing allowed” nhưng net-short prevention / wire overlap cần quy tắc chính xác. Các kiểm riêng khả thi sau khi sửa hợp đồng. |
| G7 mọi pin có net hoặc `openPins` reason (dòng 134) | **KHẢ THI** | Kiểm tập pin của registry so với net index, cộng danh sách exception có lý do. Cần cho phép pin intrinsically shorted/NC semantics rõ. |
| G8 có nguồn/GND; LED-resistor cảnh báo (dòng 135) | **KHẢ THI** như kiểm cấu trúc giáo dục | Tồn tại `findLedSeriesPath` dựa trên net quan hệ (`src/lib/circuitNets.ts:60-82`). Không chứng minh nguồn/giá trị an toàn; spec phải giữ cảnh báo không diễn giải như xác minh điện. |
| G9 analog workspace nạp SPICE (dòng 136) | **KHÔNG KHẢ THI** với API hiện tại nếu net vật lý mới là nguồn chuẩn; **KHẢ THI SAU THAY ĐỔI HỢP ĐỒNG** | SPICE nhận explicit connections, không nhận netsV2 và không suy continuity breadboard (`src/lib/workspaceSpice.ts:9-16,160-180`). Cần adapter và test giữ semantics; nếu không, mạch nối bởi dải lỗ vẫn bị báo thiếu dây. |
| G10 2D/3D/hole pin parity ≤1e-6 mm (dòng 137) | **KHẢ THI** về số học khi cùng transform/source | Dùng một `Placement` và một phép biến đổi tọa độ là hợp lý. Không thể đạt bằng việc chỉ so ba renderer độc lập hoặc làm tròn theo CSS; so vị trí model-local trước chiếu và xác định tolerance floating-point. |
| G11 counts đúng ở DOM, 375/768/1440 px (dòng 138) | **KHẢ THI** | E2E có thể đếm `data-testid`/accessible nodes và responsive viewport; không cần hình học thật. Cần xác định chính xác “chế độ xem” và có thể ẩn part ngoài viewport nhưng vẫn ở DOM. |
| G12 hash ảnh các chế độ phải khác (dòng 139) | **KHẢ THI** như sentinel, nhưng **KHÔNG ĐỦ** làm bằng chứng hình ảnh | Hash khác chỉ báo byte khác, không chứng minh mỗi view đúng; hash trùng có thể do crop/ảnh trống, còn khác do font/cursor/anti-alias. Thêm assertion nội dung/landmark hoặc snapshot được duyệt; ảnh khác nhau không thay semantic check. |
| G13 migrate fixture draft v1→v2, mở lại không mất part/dây (dòng 140) | **CHƯA XÁC ĐỊNH** cho dữ liệu thật hiện có | Workspace thực lưu `schemaVersion:4`, `placed`/`wires` và nhiều state khác, không phải chỉ `{id,type,x,y}` (`src/pages/CircuitBuilderPage.tsx:109-146,675-681`). Không có bằng chứng fixture V1 trong scope. Lưu v2 vào khóa riêng và giữ bản cũ là hướng an toàn, nhưng migration phải bắt đầu từ format/key thật (xem dưới). |

G1–G13 có thể là test tự động; “chạy mọi CircuitDocV2” cần quy định test lấy corpus ở đâu và kiểm cả fixture bài học lẫn user document, không chỉ một happy-path (`spec-v2.md:124-142`).

## Kiểm tra các điểm ưu tiên

### (a) Ray 25 lỗ và `gridMm`

**Không đủ dữ liệu hiện tại.** `gridMm` mô tả 30 cột, 10 hàng và bốn giá trị Z của ray, không biểu diễn 25 vị trí X hay số lỗ (`src/data/componentModels.ts:6-7`; `src/data/component-models.manifest.json:177-199`). Vì vậy `bb1:T+:1..25` không thể được kiểm tra từ grid; `RAIL_HOLES = 25` sẽ là hằng cứng dựa nguồn/giả định khác. Cần thêm `railColumns`/count và quy ước X origin/pitch, hoặc định nghĩa 25 bằng công thức kèm nguồn và test hình học sau khi đọc mesh.

### (b) Metadata chân của 27 loại

Tất cả 27 registry IDs ngoài breadboard đã map được vào một component model ngoại trừ `board`, lấy anchors riêng. Trong 26 model manifest: 17 có legs; 9 bench không có legs nhưng có pins; cả 26 có bounds/size và pin locations. Tuy nhiên `component-models.ts` nói rõ parametric mesh là kích thước thường gặp, model module thật khác về kích thước/thứ tự chân (`src/data/componentModels.ts:17-24`). `legsMm`/`pinsMm` vì vậy “có dữ liệu” nhưng không đồng nghĩa đã có chân/footprint đúng sản phẩm. Các part dự kiến bench có thể dùng pins để vẽ wire-end giáo dục; không được cho cắm lên breadboard. Board pins từ anchors cần đối chiếu riêng. Hiện chưa thể chứng nhận mọi `footprintHoles`/mount cho 27 loại bằng dữ liệu này.

### (c) Draft storage thực tế: key và durability

`getBrowserStorage` lấy browser `localStorage` hoặc `sessionStorage`; nếu getter bị chặn thì fallback in-memory chỉ sống trong page (`src/lib/workspaceStorage.ts:5-21,32-37`). Page chọn `sessionStorage` cho guided lesson và `localStorage` cho workspace thường, với keys:

- workspace guided: `machmo-guided-workspace-${lesson}`; workspace thường: `machmo-builder-session`;
- draft guided: `machmo-guided-lesson-drafts-${lesson}`; thường: `machmo-lesson-drafts`;
- branch guided: `machmo-guided-branch-session-${lesson}`; thường: `machmo-branch-session`.

Nguồn keys: `src/pages/CircuitBuilderPage.tsx:174-181`; serial hóa workspace `schemaVersion:4` và payload nhiều trường ở `:675-678`. localStorage bền qua lần mở trang/browser thông thường cho đến khi bị xóa/evict; sessionStorage có phạm vi phiên tab; fallback mất khi trang kết thúc (`workspaceStorage.ts:5-15`). Quarantine chỉ sao lưu ba main keys và guided-prefix entries rồi xóa originals sau khi backup (`workspaceStorage.ts:1-3,58-73`). Vì vậy giả định “v1 `{id,type,x,y}` draft/preset lưu tại một key” trong `spec-v2.md:146` không đúng với luồng hiện tại. `lessonCircuits.ts` là preset mã nguồn riêng, không phải user draft. Cần định danh migrate từ schemaVersion 4 + cả các khóa lesson/branch, giữ phần code/board/drafts/project/library, và quyết định rõ guided session có cần migrate hay không.

### (d) Net source của `workspaceSpice`

Hiện SPICE đọc `input.connections` có endpoint `partId/pinId`, gọi `createNetIndex(validWires)` và lấy các node/GND từ các dây tường minh (`workspaceSpice.ts:9-16,131-147,160-168,252-279`). Nó không đọc `netsV2`; comment hiện nói không suy continuity giữa lỗ/ray (`:176-181`). Muốn net vật lý là nguồn chuẩn, cần thêm hợp đồng/compiler input hoặc adapter trước khi compile, và kiểm cùng một fixture để net hole continuity xuất hiện trong SPICE mà không làm short ngoài ý muốn. Chuyển đổi direct “workspaceSpice đọc net từ đây” hiện không phải thay tên API đơn giản.

### (e) A* 1,27 mm và 16 dây

**Quy mô hợp lý; hiệu năng chưa đo.** Với vùng board khoảng 83×55 mm, lưới 1,27 mm có khoảng 66×44 điểm (xấp xỉ 2.900 trạng thái vị trí trước khi tính hướng/bends); tối đa 16 lượt route là vừa phải cho A* bounded. Tuy nhiên router phải tính chi phí rẽ nên state cần chứa hướng vào/ra; giới hạn 3 bends cần count trong state; obstacle padding phải tương thích footprint; đường bench có thể vượt board; thứ tự route theo ID tạo phụ thuộc thứ tự và có thể làm một path tốt bị chiếm. “Giao +5 nhưng giao vuông góc cho phép” cần phân biệt crossing với overlap/parallel adjacency. Đề nghị benchmark đúng `seven-segment-counter` 16 dây với fixed ordering, fixture xoay/đổi vị trí, ghi max/median thời gian và assert đủ 16 routes. Hiện tại không có benchmark nên chưa cam kết được ngưỡng thời gian.

## Giả định sai hoặc cần sửa trong spec (đề xuất, không tự sửa)

1. **Ray có 25 lỗ đã đủ căn cứ từ `gridMm`** — không đúng; grid chỉ có 4 tọa độ Z. Bổ sung số lỗ, X origin/pitch hoặc nguồn độc lập và trạng thái kiểm mesh.
2. **Breadboard rỗng đã có `legsMm`/`pinsMm` đủ cho toàn bộ hole map** — không đúng: entry breadboard có `pinsMm: {}` và `legsMm: []` (`component-models.manifest.json:151-176`). Lỗ grid là mô tả tọa độ, không phải pin electrical manifest. Ngoài ra, manifest đặt `tb6612`/`ultrasonic` lên breadboard, trái với quyết định đặt hai module trên bench (`component-models.manifest.json:1887-1890,2157-2160`; `spec-v2.md:36`).
3. **27 part geometry đã/đang có thể xác nhận chỉ bằng việc trường tồn tại** — không đúng. Phần lớn mesh là parametric illustration; `pinsMm` không thay thế pad/lead mounting geometry (`componentModels.ts:17-24`; `assemblyLayout.ts:112,245-254`). Phân loại “được dùng cho mounting” riêng với “được dùng làm điểm wire minh họa”.
4. **`workspaceStorage` chứa draft V1 đơn giản và preset có thể migrate như một nguồn** — sai với mã: keys tách local/session và payload chính đang schemaVersion 4, có state code/project/library (`CircuitBuilderPage.tsx:109-146,174-181,675-681`). Lập fixture thật có 4 key families trước khi chọn migration.
5. **`workspaceSpice` có thể đọc `netsV2` mà không đổi hợp đồng** — sai hiện tại; API chỉ nhận part/connections và explicit wire graph (`workspaceSpice.ts:9-16,160-180`). Nêu adapter/net contract và cách biểu diễn rail/strip net.
6. **Lưới ray/footprint đủ để đặt part trên mesh chính xác** — chưa có bằng chứng: `component-models.manifest.json` chỉ ghi mesh metadata; audit synthesis cũng đánh dấu renderer/mesh chưa được mở (`audit-synthesis.md:80-83`). Không dùng pass planner để khẳng định mesh có lỗ nhìn thấy đúng.
7. **“Crossing +5”, “crossing allowed”, “parallel overlap banned” và “wire có bề rộng/clearance” cùng tự xác định hành vi** — chưa đủ; thêm định nghĩa intersection loại nào được tính và khoảng cách tối thiểu.
8. **3 bends chỉ là warning nhưng G6 bắt buộc ≤3** — mâu thuẫn kiểm định; chọn warning/nonblocking hoặc hard gate.
9. **Ảnh các view khác hash nghĩa là đúng view** — không đúng về logic kiểm chứng; hash cần kèm checks nội dung/landmark hoặc ảnh chuẩn được review.
10. **“Chạy mọi CircuitDocV2” xác định được phạm vi** — chưa; chỉ rõ corpus bài, mẫu migrated, dự án người dùng fixture và kiểm nào fail-fast.

## Đề xuất chỉnh spec trước khi giao các slice phụ thuộc

- Tách `BreadboardElectricalSpec` khỏi visual manifest; bổ sung ray count + X mapping/rail split và provenance. Gate ray ở trạng thái blocked cho đến khi dữ liệu được đọc/đối chiếu với model.
- Định nghĩa trường `lead/leg/pad` theo vị trí và vai trò: mounting legs cho breadboard parts; connector pins cho bench parts; board header anchors riêng. Có trạng thái nguồn (source CAD / parametric / unknown), tránh cho parametric coordinate đi qua gate như “verified footprint”.
- Chốt endpoint schema có kiểu (`pin`/`hole`) và cách biểu diễn một jumper vật lý kết thúc tại lỗ, đồng thời giữ net electrical ổn định theo `partId/pinId`.
- Ghi hợp đồng chuyển `NetIndexV2` vào SPICE: API nhận net identity hoặc adapter sinh connections; định nghĩa intrinsic shorts, ground alias, open pins, và test một net tạo qua strip/ray.
- Sửa migration: nguồn thật là workspace schemaVersion 4 và keys local/session hiện hữu; thêm fixtures từng key, bản sao lưu không ghi đè v1/v4, hồi phục data khi migration dở. `lessonCircuits` vẫn là source preset riêng.
- Chọn G6: >3 góc là warning hay fail. Nêu điều kiện crossing/overlap/spacing, router boundary cho bench, pin exit tangent, deterministic tie-break và thời gian tối đa trên 16 wires.
- Đổi G12 thành kiểm tra phân biệt view theo semantic marker/DOM cùng snapshot ảnh; chỉ assert “hash phải khác” không đủ.
- Tách G2 thành kiểm `physical metadata exists` và `illustrative geometry allowed`; không gán “verified” cho parametric data. Nếu G2 phải chặn mọi part, thêm bảng chuẩn hóa toàn 27 part và board anchors trước khi chạy toàn corpus.

## File đã đọc

- `AGENTS.md`.
- `../docs/agents/README.md`.
- `docs/claude-support/2026-11-09-sim-epic/spec-v2.md` (toàn bộ).
- `docs/claude-support/2026-11-09-sim-epic/audit-synthesis.md` (toàn bộ).
- `docs/agents/runs/MM-SIM-S1/code-audit.md` (toàn bộ).
- `src/lib/assemblyLayout.ts`.
- `src/data/component-models.manifest.json`.
- `src/data/componentModels.ts` (đọc thêm để xác định nghĩa `pinsMm`/`legsMm` và mức độ minh họa).
- `src/data/componentRegistry.ts` (đọc thêm để liệt kê đúng 27 loại ngoài breadboard).
- `src/lib/circuitNets.ts`.
- `src/lib/workspaceStorage.ts`.
- `src/lib/workspaceSpice.ts`.

## File chưa đọc và giới hạn

- File mesh `.glb`, scene/WebGL renderer thực tế và CSS; không xác minh lỗ kim loại, clipping hay render thực.
- `src/data/board-pin-anchors.json`; board anchors được nhận diện qua mã nhưng không mở nội dung/đo từng chân.
- `src/data/lessonCircuits.ts` và các test/e2e dùng migration/router; các kết luận về chúng chỉ giới hạn ở tham chiếu đã đọc trong audit synthesis/S1, không phải tái chạy.
- Không mở ứng dụng để tái hiện triệu chứng UI.

## Lệnh và kiểm tra

- Đọc/tìm kiếm tĩnh bằng PowerShell và Node read-only để lấy cấu trúc JSON/đếm trường manifest; không có lệnh ghi vào sản phẩm.
- `npm.cmd run typecheck`: **NOT_RUN** — review tĩnh, không cần để xác định các câu hỏi dữ liệu/API.
- `npm.cmd test`: **NOT_RUN** — review tĩnh, không cần để xác định các câu hỏi dữ liệu/API.
- Claude review: **NOT_RUN** theo `AGENTS.md` (không gửi nội dung dự án hoặc yêu cầu review sang Claude).
- Artifact duy nhất được tạo theo scope: `docs/agents/runs/MM-SIM-S2R/review.md`.


