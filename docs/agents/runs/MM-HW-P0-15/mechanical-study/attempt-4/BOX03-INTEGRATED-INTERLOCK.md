Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c6a3-e40d-7572-add2-c1c206438fba
Read-only advisory; no hardware approval, pin assignment, gate change or B1 permission.

**Chốt một candidate nghiên cứu: 2 bộ Samtec SFM‑125‑T2‑S‑D‑A / TFM‑125‑02‑S‑D‑A, tạo hai breakpoint nối tiếp cho mọi conductor carrier–B01.** Có nguồn cycle đúng mã thử, đủ contact và một trình tự thao tác tích hợp để review. **Chưa đủ nhận cấu hình hoặc B1** vì contact-gap, sequencing thực, fit và BOM chưa khép.

Không sửa file, chạy CAD/FE hoặc duyệt MPN. Đã đọc closure và [obligations attempt‑3](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-3/OBLIGATIONS-AND-FAULT-SCOPE.md:10).

### 1. Exact mating-pair candidate và giới hạn nguồn

| Mục | Candidate chốt cho dossier |
|---|---|
| Socket | **SFM‑125‑T2‑S‑D‑A** |
| Header | **TFM‑125‑02‑S‑D‑A** |
| Contact | 50, hai hàng ×25; pitch 1,27 mm |
| Plating | `‑S`: 30 µin gold tại contact, tin tail |
| Mount | Vertical SMT |
| Mated stack | XFM Rev C tr.1, Table 1: fully mated **6,30 mm nominal**, A MAX **6,48 mm** |
| Cycle evidence đúng mã | Report **1170762 Rev 1**, 01/11/2017, thử chính cặp trên |
| Kết quả cycle | Nhóm 2.500 cycles: 190/192 điểm ΔLLCR≤5 mΩ; 2 điểm 5–10 mΩ, không open failure trong nhóm báo cáo |
| Số lượng trong interlock | **2 socket +2 header**, không phải một cặp chia hai bank |

Báo cáo này cung cấp evidence đúng variant; **không là bảo đảm tuổi thọ sản phẩm** hoặc mọi batch. Screening 500 lần PROGRAM vẫn chưa là quyết định lifetime. [Report hãng, tr.1 và 7–8](https://suddendocs.samtec.com/testreports/1170762_report_rev_1_elp.pdf)

`T2` là Tiger Eye LITE theo drawing socket; không được chuyển nguyên rating/vật liệu của socket `‑02` sang T2. Current/thermal của cặp chọn phải được đối chiếu đúng điều kiện tải trước BOM. Drawing hãng và mated views đã ghim: [socket](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/samtec-sfm-drawing.pdf), [mated views, tr.1](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/samtec-xfm-mated.pdf).

Cặp 40 contact được nêu trong commentary là candidate ban đầu; **không dùng giá hoặc cycle của nó làm dữ liệu cặp 50 contact này**. Giá landed cặp cuối còn TBD.

### 2. Conductor matrix và hai breakpoint

Mỗi conductor đi:

`carrier → connector A → trace trên cầu captive → connector B → B01`.

**Hai bank chức năng trong một connector không phải hai breakpoint.** A và B là hai giao diện tháo riêng nối tiếp trên **cùng từng conductor**.

| Role/group | Số conductor cơ sở | Quy tắc |
|---|---:|---|
| B01_EXTERNAL_5V + power return | 2 | Chức năng chưa gán pin; không mặc nhiên là VIN |
| JOY_X/Y, JOY_SW, BTN1/2 | 5 | Qua A và B |
| JOY_VCC | 1 | Qua A/B; không kéo nguồn vòng |
| RUN_REQUEST, FRESH_ARM, WDI, RELEASE | 4 | RELEASE có thể reserved/inactive; chưa tự bỏ khỏi inventory |
| LOCK_POSITION, SAFETY_STATUS, SECOND_POSITION | 3 | Qua A/B nếu thực sự liên đảo |
| E1–E4 | 4 | Giữ resource; conductor thực phải kiểm kê |
| **Cơ sở** | **19** | Không phải connector pin assignment |
| Shield/drain, return/Kelvin bổ sung, reset/boot/test | `Nextra` | Liệt kê riêng, không gộp vào tên GND |

50 contact cho phép `19+Nextra≤50`, tức tối đa **31 conductor bổ sung**. Không tự điền hết spare hoặc song song power contact khi chưa phân tích.

Boundary phải khai báo thêm:

- Shell USB onboard thuộc đảo B01, không nối frame carrier qua bracket/vít.
- EN/BOOT/UART onboard giữ trong B01; nếu đưa ra carrier/debug thì qua A/B.
- Không có dây test, programmer phụ, spacer dẫn điện hoặc shield nối vòng.
- B01 có điện từ PC vẫn có thể phát RF; bridge không là RF barrier.
- Mọi tụ module/bulk carrier ở phía carrier. Phụ kiện thêm trên đảo B01 phải khai báo; không tạo gate Cmax mới cho onboard B01 ngoài D10.

Cassette có **bốn node điện**, nhưng candidate sense cũ là **2 tải +6 sense =8 dây**. Giữ contract:

`Nbattery=2+Nsense+Naux`.

Chỉ Box02 mới chốt số conductor thực của topology mới; mọi conductor cassette phải tách cùng cassette. Cơ sở inventory hiện hành: [closure:84](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-15-aa-design-closure.md:84).

### 3. Một trình tự RUN → OFF → PROGRAM → RUN

Không tháo/cắm dây lẻ. Hai mating pair A/B nằm trên một cầu captive, tay sequencer thao tác chúng.

**RUN → PROGRAM**

1. Thu hồi grant; tháo cassette. Tách cả tải và mọi sense/tap.
2. Cassette ra khỏi vị trí khóa mới cho nâng cầu. Hai shutter và hai probe còn bị V₁/V₂ giữ ở home.
3. Nâng **cả đầu A và B** tới endpoint đủ gap. Mỗi đầu có blocker riêng; một đầu chưa đạt thì vẫn giữ cả V.
4. Sau hai gap, rút V₁/V₂; bridge bị giữ park.
5. Rút witness khỏi corridor, cho probe park. M5 adapter dùng hai key mở shutter theo đường cam reference.
6. Cắm PC qua adapter; không có đường lắp cassette hoặc hạ bridge trong PROGRAM.

**PROGRAM → RUN**

1. Rút PC và **rút adapter khỏi tay cầm**. Không cho “PC rút nhưng adapter còn đó” thành điều kiện RUN.
2. Cho hai probe dock; hai shutter phải về closed. Witness kiểm mặt panel tại Z=±0,7 mm theo refinement đã ghi.
3. Chỉ sau một chu trình kiểm hợp lệ mới cắm đủ V₁/V₂ qua bốn home; không dùng vị trí witness tức thời để tự nhận completion.
4. V bắt giữ shutter/probe, cửa PC bị che; mới cho hạ cầu và mate A/B.
5. Cassette lắp cuối. B01 được cấp nguồn để boot, grant vẫn inhibited tới qualification/fresh-arm.

**Khi PC còn contact:** với adapter/envelope đã kiểm, collar phải ngăn probe dock; key có thể giữ shutter mở; V chưa được giải phóng để reconnect. Nhưng linkage/cycle-completion thực chưa được mô hình hóa đầy đủ, nên đây là **contract cần kiểm**, chưa là proof cơ cấu.

Witness 14 fixture và counterexample thin-tail được phân loại đúng trong [report attempt‑3:38](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-3/REPORT.md:38). Cấu hình thin-tail tĩnh không tự là single-fault system bypass.

### 4. Điều kiện H đủ, không dùng wipe làm MAX

Có thể dùng **toàn conductive extent** để tạo cận bảo thủ, thay vì đoán last-contact wipe.

Với mỗi pair, gọi:

- `S0,min`: khoảng hai datum PCB khi fully mated.
- `Efixed,max`: phần dẫn cao nhất từ datum PCB cố định về phía cầu.
- `Emoving,max`: phần dẫn xa nhất từ datum PCB cầu về phía cố định.
- `Δmax`: nghiêng, dung sai relative và biến dạng đã phân bổ.

Điều kiện đủ:

\[
S_{0,\min}+H_{\min}>
E_{\rm fixed,max}+E_{\rm moving,max}+\Delta_{\max}+g_{\rm required}
\]

Áp dụng cho **mọi phần dẫn có thể nối liên đảo**, không chỉ contact nominal.

Đầu A/B phải đạt điều kiện trên trước khi blocker nhả V. Hạ cầu chỉ được bắt đầu sau khi cả hai V đã captured.

**Drawing hiện có chưa đủ điền trọn cận số này:** cần dựng các datum/contact extents của đúng header/socket, gồm phần pin nhô, sway và tolerance. Không được dùng bounding box nhựa làm bounding box kim loại. Hãng có drawing nên đây là đầu ra kỹ thuật còn phải trích/tính, **không phải câu hỏi Founder**.

Mated views 6,48 mm vẫn có wipe MIN0,38 mm; wipe nominal0,56 mm không phải ngắt MAX. Lift12 mm vẫn là allocation, chưa phải proof. [Closure:86](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-15-aa-design-closure.md:86)

Một terminal kéo khỏi housing nằm ngoài phép tính nominal này; cần chứng minh breakpoint còn lại vẫn cắt đường hoặc khóa cơ không giải phóng.

### 5. Fit, part count và thao tác beginner

Socket 25 positions/row có chiều dài tham chiếu:

`25×1,27+3,94=35,69 mm`.

Vì vậy reserve cầu **35×25 mm cũ đã thiếu ≥0,69 mm chiều dài**, trước guide/frame. Đề xuất reserve nghiên cứu **≥40×25 mm**, chưa xác nhận fit toàn cụm.

Chiều sâu khoang tối thiểu phải theo:

`mated-height MAX + PCB cầu MAX + lift MAX + park clearance`.

Ví dụ **chỉ để reserve**: 6,48+1,6+12+1,0 = **21,08 mm**, chưa bao stack tolerance/overtravel, cover, guide hoặc linh kiện hai phía. PCB1,6 mm và clearance1 mm là proposal, không số đã duyệt. Không lấy lift12 mm làm tổng chiều sâu. [Fit hiện hành:90](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-15-aa-design-closure.md:90)

Count reference hiện tại: 2 shutter +2 probe +2 witness +2 V +1 bridge +1 sequencer +1 cassette = **11 body chuyển động**, chưa các latch/stop/link thực.

Trải nghiệm phải gom thành một thao tác “kiểm/đóng” được sequencing, không bắt beginner tự hiểu và điều khiển 11 body. Nếu geometry cần nhiều nút hoặc bước riêng ngoài tháo cassette/gạt sequencer/cắm adapter, phải trình delta UX, không giấu dưới tên “manual interlock”.

### 6. Hai lựa chọn quyết định, không thêm probe

**A — Tiếp tục M5 với phụ kiện PROGRAM xác định.**  
Chấp nhận nghiên cứu sản phẩm có adapter keyed/collar captive, phải rút adapter trước RUN; mất/hỏng adapter cần replacement đúng loại. Giữ reference tests hiện có, hoàn thiện endpoint/V/cycle-completion, contact extent, fit và giá trước adoption. Không coi chọn hướng này là duyệt cơ cấu hoặc B1.

**B — Giữ yêu cầu dùng cáp PROGRAM generic.**  
Không adopt cơ chế detector/collar M5. Giữ phần nguồn AA và double-break đã nghiên cứu, nhưng phải đổi kiến trúc tiếp cận PROGRAM; không dùng hai probe xa miệng làm USB-empty proof. Đây là nhánh thiết kế khác, chưa có lịch/BOM đủ cam kết.

**Disposition:** dossier đã đủ cụ thể để Box01/08 review **candidate, sequence và quyết định cable/UX**, chưa đủ xin duyệt cấu hình để schematic/B1. Founder chỉ cần phân xử delta cable/PROGRAM khi packet fit/BOM/UX được tích hợp; contact extents, linkage và fault coverage còn là trách nhiệm kỹ thuật, không chuyển sang D10 hoặc giao Founder đo thay.
