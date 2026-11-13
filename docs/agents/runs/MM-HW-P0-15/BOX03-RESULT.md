Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c51f-0b42-7490-93b8-c2f8cf1de443
Read-only advisory; no CAD/FE or accepted mechanical proof.

**M4 đề xuất tiếp tục captive double-break bridge và hai paddle độc lập, nhưng chưa đóng được finding partial‑plug.** Đã có candidate connector vượt screening 500 chu kỳ và một bộ tham số lực/khóa để kiểm; chưa có bằng chứng rằng hai paddle cách miệng USB 1–2 mm luôn phát hiện mọi plug còn nối điện.

Đã đọc task P0‑15, M3 và review P0‑14. Tôi chỉ đọc và tính trong chat; không ghi tệp, tạo CAD/FE, gán chân hoặc chọn MPN được duyệt.

### 1. Envelope USB‑C: điều có nguồn và điều chưa chứng minh

Nguồn USB‑IF R2.0 §3.2.1, trang 40, nêu chiều dài shell receptacle hiệu dụng **6,20±0,20 mm** và cho phép cấu hình shell khác nhau nếu đáp ứng yêu cầu giao diện. Vì vậy không thể lấy riêng chiều dài thân receptacle làm giới hạn cắm điện. Đây là tài liệu tham chiếu cũ; thư viện USB‑IF hiện liệt kê Release 2.5. [USB‑IF R2.0](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf), [thư viện hiện hành](https://www.usb.org/documents)

Drawing hãng Amphenol **10171746 Rev A** cho một receptacle tham chiếu có khẩu độ **8,34 +0,06/−0,02 ×2,56±0,04 mm**, cùng hình ghép plug. Nó không định danh connector trên B01 và không cung cấp trực tiếp khoảng rút tới **last electrical contact** của mẫu B01. [Drawing Amphenol](https://cdn.amphenol-cs.com/media/wysiwyg/files/drawing/10171746.pdf)

PDF USB‑IF vượt giới hạn đọc của công cụ web; lần đọc trong bộ nhớ bị lỗi DNS. Đã dừng cách tải đó, không ghi tệp và không lấy bản sao bên thứ ba làm bằng chứng.

**Finding M4:** chưa có cận chứng minh phần plug gây cản luôn hiện diện tại hai mặt phẳng ngoài receptacle, đặc biệt khi cắm hết hoặc cắm hờ. Không được dùng vỏ nhựa/overmould tùy hãng làm bảo đảm thay thế.

Điều kiện phải kiểm cho **từng nhánh paddle**, để còn chịu được một nhánh lỗi:

\[
\forall p\in E_{\text{electrically-connected}},\quad
\text{paddle}_i\text{ không thể tới dock},\quad i=A,B
\]

`E` phải bao một contact bất kỳ còn dẫn, kể cả shell/ground nếu thuộc đường dẫn liên quan, không chỉ VBUS/D+/D−.

**Phản ví dụ chưa loại:** plug còn dẫn nhưng phần vật liệu tại mặt phẳng kiểm không phủ corridor; paddle đi qua và dock dù USB chưa tách. Hai paddle cùng dựa vào một giả định shell sai sẽ cùng thất bại.

### 2. M4 — bảng tham số cơ và lực

Giữ chuỗi cassette out → bridge lift/park → port open của M2. Bổ sung các tham số sau; tất cả là **proposal**, chưa là dung sai chế tạo đã xác nhận.

| Hạng mục | M4 |
|---|---|
| Hai mặt phẳng paddle | Giữ nominal 1,0 và 2,0 mm trước miệng receptacle **chỉ để khảo sát**, chưa nhận làm vị trí hợp lệ |
| Aperture cassette USB tham chiếu | 9,0×3,2 mm; phải kiểm không cản plug hợp lệ và không tạo đường đi vòng |
| Mặt paddle | Phủ aperture +0,5 mm mỗi mép: nominal 10,0×4,2 mm |
| Hành trình paddle | 12 mm; endpoint chỉ nhận sau khi đầu paddle vào dock phía đối diện |
| Guide mỗi paddle | Hai vùng dẫn cách ≥12 mm; rơ ngang tổng ≤0,10 mm |
| Engagement pawl | Nominal 2,50 mm |
| Loss engagement | Chế tạo 0,10 + rơ 0,10 + mòn 0,15 + võng cụm 0,15 mm |
| Engagement còn lại | **≥2,00 mm** |
| Pawl/stop | Lõi ≥8×8 mm; nhô chịu lực ≤2 mm; tựa frame kim loại riêng |
| Cầu nâng | h nominal 12 mm; hMIN 11,8 mm |
| Gap mỗi đầu | `11,8−Lconductive,MAX−δrelative,MAX ≥2 mm` |
| Điều kiện sàng lọc connector | Nếu δMAX=0,20 mm thì cần `Lconductive,MAX≤9,6 mm` |

Hai paddle không được quét vào receptacle hoặc chạm contacts. Nếu envelope cuối yêu cầu làm vậy, phải loại geometry này, không tự thay yêu cầu.

**Coupling không solid-bind:** dùng phần tử kéo đàn hồi, không đặt lò xo nén có thể chạm đặc giữa tay và paddle. Allocation mỗi nhánh:

- Preload MAX 0,055 N.
- Độ cứng MAX 0,007 N/mm.
- Extension khả dĩ MAX 15 mm, được giới hạn bởi **stop đầu vào tựa frame**.
- Cản guide/link MAX 0,025 N.

Cận lực thăm dò:

`FMAX=0,055+0,007×15+0,025=0,185 N <0,20 N`.

Đây là contract chọn spring/link; chưa có part hoặc dữ liệu fatigue chứng minh. Nếu có một liên kết cứng song song, chạm đáy hoặc coil/link kẹt biến thành thanh cứng, cận 0,20 N mất hiệu lực.

Với lực tay 100 N:

`handle → pawl còn gài → backstop → frame`.

Pawl 8×8 mm, nhô 2 mm cho kéo/nén cộng uốn danh nghĩa khoảng **3,91 MPa**. Con số này không bao contact, gốc frame, fastener hoặc biến dạng toàn cụm.

Giữ retention **100 N service/200 N proof mỗi đường**; holder và connector không là phần chịu retention.

### 3. Trình tự hai chiều và lỗi đơn

**Đóng về RUN:** hai paddle tới dock → từng đầu paddle mở khóa pawl riêng → paddle được giữ chắn corridor → hai cửa kết cấu đóng → mới cho cầu hạ → cassette lắp cuối.

**Mở PROGRAM:** cassette/taps đã tách → cả hai đầu cầu park thật → pawl reconnect gài → cửa mở → paddle mới rút.

| Lỗi | Disposition cần chứng minh |
|---|---|
| Một follower gãy/mất coupling | Nhánh đó không được tạo endpoint giả; nhánh còn lại tự phát hiện plug |
| Mảnh follower nằm trong dock | Có thể giả một endpoint; nhánh còn lại phải chặn |
| Một pawl gãy hoặc bị giữ rút | Pawl còn lại tự chặn và chịu 100 N |
| Một cam gãy | Không được kéo cả hai pawl; endpoint actual quyết định |
| Một đầu cầu kẹt | Khóa đầu đó giữ cả cửa PC đóng |
| Một terminal kéo theo | Breakpoint còn lại phải cắt chính conductor |
| Một coupling thành thanh cứng | **Chưa bao:** có thể truyền lực vào plug; cần stop/clearance độc lập kiểm trường hợp này |
| Frame/datum chung gãy | **Chưa bao:** phải truy đường hỏng, không lấy hai sensor/pawl làm proof |
| Plug còn nối được nhưng không cản paddle | **Finding chính chưa đóng** |
| Shield/debug/dây test đi vòng | FAIL kiến trúc double-break |

Không dùng plug PC làm stop chịu lực. Sau khi paddle dock ở cổng rỗng, tải do người dùng cố cắm mới phải đi qua dock/backstop; chưa được chứng minh bằng cận lực thăm dò.

### 4. Conductor matrix — role, không số chân

Mọi conductor thực nối carrier–B01 đều phải đi theo:

`carrier → break A → cầu cứng → break B → B01`.

| Nhóm role | Số conductor cơ sở |
|---|---:|
| B01_EXTERNAL_5V + power return | 2 |
| JOY_X/Y, JOY_SW, BTN1/2 | 5 |
| JOY_VCC | 1 |
| RUN_REQUEST, FRESH_ARM, WDI | 3 |
| RELEASE reserved/inactive | 0 hoặc 1, tùy có nối thật |
| LOCK_POSITION, SAFETY_STATUS, SECOND_POSITION | 3 |
| E1–E4 | 4 nếu nối thật |
| Shield/drain, return bổ sung, reset/boot/test | `Nextra`, phải kiểm kê |

Nếu nối toàn bộ các role trên, kể cả RELEASE: **19+Nextra conductor mỗi breakpoint**. Không đồng nhất 16 GPIO với số contact connector; power/return không phải GPIO.

**Cassette pin:** ba cell có bốn node điện, nhưng candidate P0‑14 có **hai dây tải + sáu dây sense độc lập =8 conductor**. Không gộp thành bốn dây vì chúng cùng node. Contract:

`Nbattery = 2 + Nsense + Naux`.

Giữ `Nsense=6` cho đến khi Box02 trả topology mới rõ ràng. Mọi dây đó phải tách cùng cassette; không kéo cell taps tới B01.

### 5. Tối đa hai candidate thay DF11

**Ưu tiên khảo sát Samtec SFM/TFM; Harwin làm đối chứng.** Chưa chọn MPN hoặc cam tự ghép.

| Hạng mục | Samtec SFM/TFM | Harwin Datamate M80 |
|---|---|---|
| Cấu hình khảo sát | Double-row 15 hoặc 20 vị trí/row; mating pair/lead/plating phải khóa | M80‑5003042 header 30 contact; socket đối ứng còn phải khóa |
| Cycle evidence | Product Spec **Rev E, 25/09/2021**: 2.500 cycles pass cho cấu hình mô tả | C00542, **22/10/2024**: standard signal contact 500 operations |
| Current | 3,2 A với một pin powered mỗi row trong spec; không áp mọi tải/nhiệt | 3,3 A một contact/25°C; 2,6 A/85°C; all-contact lần lượt 3,0/2,2 A |
| Contact force/retention | Drawing socket: pushout MIN 0,5 lb ≈2,22 N; lực ghép/rút bảo đảm cho cấu hình chọn: TBD | Retention contact MIN 10 N; insertion MAX 2 N/contact theo gauge; withdrawal MIN 0,2 N/contact |
| Size | Drawing socket: chiều dài tham chiếu `1,27n+3,94 mm`: n=15 →22,99 mm; n=20 →29,34 mm | Header công bố 40×6×8,85 mm; cao trên PCB 5,55 mm |
| Overlap/travel | MAX conductive overlap chưa khóa | MAX conductive overlap chưa khóa; không dùng wipe MIN thay MAX |
| Giới hạn | Không promote test sang lead/plating khác | Jackscrew không mặc nhiên phù hợp thao tác cam captive |

Nguồn cho lead ghim:

- [Samtec product specification Rev E](https://suddendocs.samtec.com/productspecs/sfm-tfm.pdf), [socket drawing](https://suddendocs.samtec.com/prints/sfm-1xx-xx-xxx-d-xxx-x-xx-mkt.pdf), [mated views](https://suddendocs.samtec.com/prints/xfm%20mated%20document-mkt.pdf).
- [Harwin C00542](https://content.harwin.com/m/af82fc432c606a31/original/C005-C005XX-Component-Specification-Datamate-M80-and-M83-Series-2-00mm-4-00mm-pitch-High-Reliability.pdf), [header product/drawing links](https://www.harwin.com/products/M80-5003042).

**500 cycles chỉ là screening allocation của lượt này**, chưa là lifetime sản phẩm. DF11 30-cycle không được promote.

### 6. Fit khái niệm và chi phí

Holder MPD BA3AAW có kích thước nominal trên drawing **57,48×47,63×16,38 mm**. Drawing Rev G nêu dây 24 AWG và contact resistance dưới 50 mΩ cho contacts ±; điều đó không chứng minh holder có sáu dây sense độc lập hoặc rating toàn cassette. [MPD drawing](https://www.batteryholders.com/uploads/parts/BA3AAW/datasheets/BA3AAW-datasheet.pdf)

Phân vùng proposal:

| Khối | Bao nghiên cứu |
|---|---|
| Cassette dưới PCB | Reserve 64×54×22 mm, gồm vỏ/đầu ghép; **chưa xác nhận đủ** |
| Bridge Samtec | Hai connector song song; reserve footprint 35×25 mm để khảo sát guide, không là bao cuối |
| Bridge Harwin | Cần bao lớn hơn header 40×6 mm và socket/guide; chưa khóa |
| Khoang nâng | Mated height + PCB cầu +12 mm lift + park clearance; không dùng 12 mm làm tổng chiều sâu |
| Paddle/port | Ở mép PCB, tách khỏi bao bridge và vùng anten |

Với PCB 90×90 mm, cassette reserve rộng 64 mm để lại 26 mm ngang nhưng **không chứng minh đủ cho frame/cam**. Bố trí nhiều tầng có thể tránh chồng footprint, song làm tăng chiều dày. B01, anten và receptacle thực vẫn chưa có bao fit được xác minh; D10 giữ đúng phạm vi.

Chưa có giá hãng đủ dùng cho connector, chi tiết gia công hoặc cơ cấu. Không tạo cost range giả và không kết luận robot + tay cầm + charger dưới 1 triệu đồng.

### 7. Disposition M4

Có thể tích hợp ngay: conductor matrix và wire-count cassette; candidate connector có cycle evidence; coupling contract 0,185 N; khóa endpoint/pawl độc lập; fit reserve có nhãn proposal.

**Chưa đủ nhận M3/M4:** envelope plug còn dẫn, coupling jam/solid-link fault, dock/frame common fault và MAX conductive overlap của mating pair.

Scope sau exact-config/CAD approval phải kiểm đúng các bài này bằng swept-volume, contact/load và tolerance. Qualification 100/200 N, 100 N nút, cycle, mòn và kẹt thực hiện sau mẫu được duyệt; không chuyển thiếu sót kiến trúc sang D10.

Nếu không chứng minh được generic USB‑C cable envelope, delta cụ thể là **giới hạn PROGRAM vào một cable/adapter có envelope được kiểm**. Chưa áp delta hoặc yêu cầu Founder chọn lúc này; trước hết cần review finding nguồn và geometry trên.
