Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c406-ea7f-7cb0-bf03-1ab8ec25b203
Read-only advisory received by HQ; verbatim final text follows.

**Đề xuất `P0‑13‑M‑A‑P1`: giữ C11 làm lõi retention, bổ sung selector hai track với neutral interlock kết cấu và một điểm release-commit xác định.** Proposal này đủ để HQ/08 review các tham số và phạm vi CAD/FE tiếp theo; **chưa đủ đóng gate actuator hoặc đưa B1 về ready**.

Tôi chỉ đọc tài liệu và tính toán trong chat. Không sửa r12, gán chân, chọn MPN được duyệt, tạo CAD/FE hoặc liên hệ bên ngoài.

Đã đối chiếu [C11 canonical](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-c11-mechanical-canonical.md), [M‑A/G‑B](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-11-gpio-mechanical-options.md), [mode budget P0‑12](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-12-mode-power-budget.md), cùng các advisory direct-return/counterproposal P0‑09. Giữ G‑B16, E1–E4, cách ly toàn I/O trong CHARGE/PROGRAM và trần pack 4,200 V.

**1. Geometry duy nhất cho proposal**

Hệ trục giữ đúng C11: **x kéo cassette; y nhả key/nhịp; z chiều rộng**. A/B dùng key, frame, selector, neutral interlock và gate riêng.

| Thành phần | Tham số proposal |
|---|---|
| Retention key | Dài 40 mm theo y; lõi sau gia công ≥12 mm theo z ×8 mm theo x |
| Contact | Striker tại y=0; support tại y=±12 mm; lồi R20,0±0,1/lõm R20,5±0,1 mm; vùng hữu ích ≥Ø8 mm |
| Phôi key/contact | Phôi thép có chứng chỉ dày ≥10 mm; giữ lõi ≥8 mm sau gia công |
| Frame | Tiết diện hữu hiệu ≥16×8 mm; đoạn 10 mm **song song x**; lệch tâm lực ≤5 mm |
| Unload | Tăng hành trình đề xuất từ 0,80 lên **0,90 mm**, lệch phương ≤5°, tổng loss theo phương chiếu ≤0,30 mm |
| Tab/stop chịu lực nút | Lõi ≥8×8 mm; tab nhô ≤2 mm; độ lệch điểm đặt lực nút ≤8 mm |
| Selector | Shuttle ngang z, hành trình 3,0 mm; hai đầu có vai tựa frame; không dùng plunger làm end-stop |
| Hai track | INHIBIT kết thúc ở stop frame; RELEASE cho follower đi vào chuỗi unload rồi nhả key |
| Neutral interlock | Lưỡi kết cấu riêng bắt selector khi follower rời vị trí nghỉ; chiều sâu bắt danh nghĩa 3,0 mm |
| Gate actuator | Đặt phía sau vách frame, ngoài bao quét follower; hành trình làm việc 1,2 mm |
| Khoảng cách follower–gate | Danh nghĩa ≥0,80 mm **ở mọi vị trí selector/follower** |
| Khe chuyển track tại neutral | Clearance danh nghĩa ≥1,0 mm, đo sau khi đã trừ bao hình học follower |
| Key withdrawal | Chọn hành trình proposal **25 mm**; cần xác nhận thoát striker/support trong swept-volume cuối |
| Bao quét key tối thiểu | 65 mm theo y, chưa cộng nút, đầu ghép, dẫn hướng và khoảng service |

Hai mặt chặn đầu selector chịu lực follower phải tựa frame. Link actuator–selector là liên kết đàn hồi có lực giới hạn; nó **không được trở thành đường chịu 100 N** nếu selector bị neutral interlock giữ.

Chuyển động unload và rút key là hai đoạn nối tiếp bằng dogleg kín. Không dùng ramp cho phép lực rút key đi vòng đoạn unload.

**Vật liệu:** SSAB Domex355MC là ứng viên cho chi tiết chịu lực, ở trạng thái sản phẩm có chứng chỉ tương ứng. Hãng công bố ReH≥355 MPa cho dày 6,01–16,00 mm; cơ tính thử dọc chiều cán. Vì vậy phôi 10 mm có nguồn phù hợp, nhưng không tự xác nhận chi tiết sau gia công, chất lượng bề mặt hoặc hướng chịu lực. E=190–210 GPa dùng trong các phép tính dưới là **giả thiết phân tích**, không phải cận hãng đã xác lập. [SSAB, Mechanical Properties](https://www.ssab.com/en/brands-and-products/ssab-domex/product-offer/355mc)

**2. Phase, đường lực và release-commit**

Đề xuất định nghĩa **commit là selector đã tới và tựa chắc tại đầu RELEASE**, trong khi hai key còn ăn khớp. Commit chỉ được bắt đầu sau physical-OFF, neutral hợp lệ và fresh release permission.

Đây là định nghĩa thiết kế cần HQ/08 xét rõ. Không mặc nhiên đồng nhất commit với thời điểm cassette đã rời.

| Phase | Vị trí/hành vi | Đường chịu 100 N nút |
|---|---|---|
| P0 — INHIBIT | Selector ở đầu inhibit; gate chặn chuyển track | Nút → follower → stop cố định → frame |
| P1 — nút đang bị giữ | Neutral interlock bắt selector; actuator không thắng lực tay | Nút/follower và interlock → frame; gate chỉ chịu preload của liên kết đàn hồi |
| P2 — nút được thả, đang chọn track | Follower nằm trong neutral pocket; selector chạy giữa hai đầu | Nếu nhấn lại sớm: follower gặp land kết cấu trên selector; land truyền lực qua guide/shoulder vào frame |
| P3 — COMMIT | Selector tựa đầu RELEASE; follower vẫn ở neutral | Chưa có lực nhả key; xác nhận commit không thay xác nhận key |
| P4 — nhấn lại/unload | Follower ép cassette vào 0,90 mm trước khi dịch key | Nút → cam unload/guide/stop → cassette/frame |
| P5 — key rút | Follower dịch key; selector bị giữ ở track hiện tại bởi interlock kết cấu | Nút → key/dogleg/guide → frame; không qua gate |
| P6 — lắp/tái khóa | Key phải ăn khớp, selector inhibit và gate đóng trước fresh RUN | Stop/frame chịu thao tác; không cho RUN chỉ từ tín hiệu cửa đóng |

P2 cần **land kết cấu liên tục** che toàn hành trình nút khi selector chưa tới endpoint. Land không được có cửa mở từng phần cho follower chui chéo.

Lực actuator khi selector kẹt chỉ tăng tới cận của liên kết đàn hồi; không dùng coupling cứng để truyền tải interlock sang plunger. Proposal allocation cho lực coupling là ≤0,18 N; hình dạng/lò xo cụ thể chưa chọn.

**Mất bias:**

- Trước commit: yêu cầu selector trở lại INHIBIT; key vẫn giữ; không chấp nhận một selector nằm giữa là release permission.
- Sau commit: không hứa bắt lại cassette/key đang di chuyển. Source và toàn I/O tiếp tục OFF tới khi tái khóa hợp lệ và fresh-arm.
- **Chưa khép:** nếu mất bias lúc selector đang di chuyển về RELEASE, quán tính có thể đưa nó vượt điểm commit trước khi lực hồi dừng được. Cần tính năng lượng, lực hồi, hành trình phanh và capture geometry. Một công tắc endpoint hoặc bảng trạng thái không chứng minh được trường hợp này.

Do đó, định nghĩa commit ở trên giúp khóa interface nhưng **không tự đóng proof mất bias trước commit**.

**3. Bảng tính retention và nút**

Mỗi nhánh chịu riêng 200 N khi nhánh kia không khả dụng:

| Kiểm tra | Công thức | Kết quả |
|---|---|---:|
| Moment key | `200×24/4` | 1.200 N·mm |
| Uốn key | `6M/(12×8²)` | 9,375 MPa |
| Cắt key bảo thủ | `1,5×200/(12×8)` | 3,125 MPa |
| Frame axial + bending | `200/(16×8)+6×(200×5)/(16×8²)` | 7,422 MPa |
| Stem nút, 100 N lệch 8 mm | `100/64+6×100×8/(8×8²)` | 10,938 MPa |
| Uốn tab nhô 2 mm | `6×100×2/(8×8²)` | 2,344 MPa |

Đoạn frame 10 mm song song lực không cộng thêm `200×10`. Nếu bố trí khác, phải tính lại.

Tại E=190 GPa, mô hình dầm riêng cho:

- Võng stem nút 8 mm: **0,000263 mm**.
- Võng tab nhô 2 mm: **0,00000412 mm**.

Đây chỉ là biến dạng của hai tiết diện lý tưởng, **không là cận độ võng cả cụm**. Contact, gốc guide, datum và vùng tay cầm còn đóng góp.

Hertz C11 vẫn cho áp suất đỉnh khoảng 114,53 MPa tại contact 200 N dưới giả thiết E=210 GPa, ν=0,30. Không dùng áp suất đó làm von Mises hoặc chia 355 MPa để kết luận hệ số an toàn. Phải kiểm contact hữu hạn, chuyển tiếp và độ nghiêng của đúng assembly.

**4. Clearance và swept volume**

Các số dưới là **phân bổ thiết kế cần kiểm**, không phải tolerance của sản phẩm đã được xác nhận.

| Bất đẳng thức | Stack proposal | Biên tính |
|---|---|---:|
| Follower không chạm gate | `0,80−0,10 chế tạo−0,05 rơ−0,10 mòn−0,15 võng cụm−0,10 lắp` | **+0,30 mm** |
| Neutral đủ chỗ chuyển track | `1,00−0,10 chế tạo−0,10 rơ−0,10 mòn−0,15 võng` | **+0,55 mm** |
| Interlock còn bắt | `3,00−0,10 chế tạo−0,10 rơ−0,10 mòn−0,15 võng` | **2,55 mm** |
| Unload trước rút key | `0,90cos5°−0,30` | **0,596575 mm** |
| Biên so với separation 0,50 | `0,596575−0,50` | **+0,096575 mm** |
| Gate thoát latch | `1,20−0,90 overlap−0,10 tolerance−0,05 wear` | **+0,15 mm** |

Điều kiện swept-volume tổng quát:

`distance(S_follower(q), S_gate(g)) ≥ clearance_min >0`

với mọi vị trí `q` của nút/selector, mọi `g` của gate và các tổ hợp tải được yêu cầu.

Chưa được suy rằng việc các stack có số dương đã chứng minh bất đẳng thức này. Cần kiểm rằng:

1. Không có vị trí trung gian đổi mặt chịu lực sang gate.
2. Guide/frame giữ độ võng cụm ≤0,15 mm dưới **hai nút 100 N đồng thời**, cộng lực cassette theo fault case.
3. Không có đường thoát chéo qua cửa track mở một phần.
4. Cả ba contact thoát được sau unload mà không cấn pocket cầu.

Đây là các bài toán geometry/contact cụ thể cho CAD/FE, không phải yêu cầu nghiên cứu lại cơ cấu từ đầu.

**5. Actuator: cận yêu cầu và shortlist đóng**

Allocation C11 cho từng gate:

| Thành phần | Cận proposal |
|---|---:|
| Lò xo gate riêng | 0,16–0,18 N trên đoạn làm việc |
| Drag guide | ≤0,05 N |
| Feedback cơ | ≤0,02 N |
| Gravity quy đổi | ≤0,01 N |
| Drag/từ dư actuator khi tắt | ≤0,02 N |
| Lực mở ngoài lớn nhất | `0,18+0,05+0,02+0,01=0,26 N` |
| Net pull yêu cầu sau lò xo/ma sát nội actuator | **≥0,30 N** |
| Lực hồi ròng | `0,16−0,05−0,02−0,01−0,02=0,06 N` |
| Tiêu chí hồi đề xuất | **≥0,05 N** |
| Đoạn hành trình cần bảo đảm | **1,2 mm**, từ vị trí pull-start cách vị trí hút hết 1,2 mm |
| Công mở ngoài | ≥0,312 mJ; với yêu cầu 0,30 N: 0,36 mJ |

Cận gravity 0,01 N tương ứng khối lượng chuyển động khoảng ≤1 g nếu không hạn chế hướng. Nếu plunger/link thực nặng hơn, phải tính lại; không được giữ allocation này tùy ý.

Không yêu cầu hồi trong 30 ms. RUN chờ xác nhận thật. Nhưng vẫn cần lực hồi ròng để chứng minh cơ cấu có thể trở về, và timing cần thiết để giải trường hợp mất bias trước commit.

| Candidate chưa approved | Dữ liệu hãng | Thiếu để nhận |
|---|---|---|
| **Takaha SSBH‑0830‑01** | 5 V, 7,5 Ω, bảng 600 mA; continuous duty; stroke tổng 5 mm; curve 20 °C trước nóng | Net pull MIN ở đoạn 1,2 mm/rail thấp/cuộn nóng; hồi MIN; Rmin lạnh; nhiệt và lực sau duty |
| **Adafruit 2776** | 5 V; 4,5 Ω±5%; 1,1 A; 3 mm/80 gf; lò xo hồi; 12,6 g | Ý nghĩa net/gross của lực; MIN lực nóng; hồi/từ dư; duty 3 s và rest interval |

Takaha không có bảng bảo đảm full-temperature; nominal 7,5 Ω và 600 mA cũng không khớp trực tiếp V/R. Adafruit có dung sai điện trở nhưng chưa nêu điều kiện nhiệt đủ để dùng nó làm Rmin lạnh toàn miền. Không nội suy lực catalogue thành MIN. [Takaha, catalog tr.1](https://www.takaha.co.jp/product/ss/pdf/SSBH-0830.pdf), [Adafruit 2776, Technical Details](https://www.adafruit.com/product/2776)

Hai nhánh cùng cấp 3 s, screening nominal:

| Candidate | Dòng hai cuộn tại 5 V | Công suất | Năng lượng |
|---|---:|---:|---:|
| Takaha, 7,5 Ω | 1,333 A | 6,667 W | 20 J |
| Adafruit, 4,5 Ω | 2,222 A | 11,111 W | 33,333 J |

Chưa là MAX. Không cộng actuator vào trần RUN 500 mA hoặc dùng dòng pack RUN để chứng minh tải actuator; giữ mode budget P0‑12. Timer độc lập, chống retry, clamp và cắt driver stuck-ON thuộc nhánh điện cần ghép.

**6. Feedback và fault**

Mỗi nhánh phải duy trì riêng các sự thật **key engaged, selector inhibit/committed và gate closed**. Không đồng nhất chúng. G‑B16 chỉ giữ diagnostic đã chọn; các kiểm chứng phần cứng không tự trở thành GPIO mới.

| Lỗi | Disposition proposal / phần chưa chứng minh |
|---|---|
| Gate kẹt đóng, mất lực mở | Không release; giữ OFF khi chuyển mode |
| Selector kẹt giữa | Không endpoint release; land kết cấu chặn follower; cần kiểm swept contact |
| Mất lò xo hồi gate | Không được giả định hồi; feedback thiếu gate-closed giữ RUN veto |
| Gate kẹt mở | Nhánh kia phải vẫn giữ; không cho RUN nếu cửa không đóng |
| Key chưa ăn khớp nhưng cửa đóng | RUN veto; không claim retention |
| Neutral interlock gãy | Có thể tạo đường follower–selector sai phase; cần phân tích mảnh gãy và đường lực, chưa được bao bởi beam check |
| Gãy datum hoặc dị vật nối hai cơ cấu | Hai sensor không giải quyết được; phải kiểm fault chung, không tuyên bố độc lập chỉ vì có hai nhánh |
| Hai nhánh hồi không đều | Không fresh RUN tới khi cả hai đạt trạng thái hợp lệ |
| Mất bias sau commit | Giữ Source/I/O OFF; không hứa tái bắt cassette |

**7. Chi phí, khả năng khép và quyết định tiếp theo**

Giá Adafruit hiện niêm yết **4,95 USD/chiếc**, tức 9,90 USD cho hai chiếc, chưa thuế/vận chuyển. Takaha và giá gia công chưa có báo giá được xác minh. [Giá hãng Adafruit](https://www.adafruit.com/product/2776)

Chỉ hai phôi key 40×12×10 mm đã khoảng **75,4 g** nếu giả định mật độ 7,85 g/cm³, chưa tính frame, selector, actuator và vỏ. Không có cơ sở xác nhận fit hoặc tổng bộ dưới **1 triệu đồng**.

Có thể nhận ngay vào dossier: trục thống nhất; phôi/lõi đúng chiều dày; free-body; tính unload 0,90 mm; phase table; phân bổ clearance; contract actuator và fault matrix.

**Chưa thể chứng minh bằng tính tay hiện tại:**

- Clearance assembly dưới tải và contact ở mọi vị trí selector.
- Capture trước commit khi mất bias giữa chuyển động.
- Local stress, biến dạng datum, mảnh gãy và common fault.
- Lực actuator nóng/lạnh, hồi, duty và giá toàn bộ.

Bước tiếp theo tối thiểu là HQ/08 review `P0‑13‑M‑A‑P1`, đặc biệt **định nghĩa commit trước hành trình nhấn lại**. Nếu được nhận, HQ khóa các tham số thành revision/hash để xin Founder duyệt đúng **scope CAD/FE kiểm swept volume, contact và loss-bias capture**, cùng giả thiết vật liệu. Việc đó không gồm chế tạo, mua hoặc vận hành mẫu.

CAD/FE sẽ không tạo ra cận lực–hồi actuator hoặc giá. Dữ liệu hãng và báo giá vẫn cần packet riêng; nếu không có cận áp dụng, không được dùng catalogue typical để đưa B1 về ready.
