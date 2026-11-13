# Mạch Mở — tổng hợp P0-10 và P0-11, việc còn thiếu trước B1

**Ngày báo cáo:** 10/11/2026, Asia/Bangkok.  
**Phạm vi:** hai lượt hợp nhất sau review R-20261109-C11 và phân tích tiếp theo lựa chọn Founder.  
**Kết luận hiện tại:** hồ sơ và phương án đã tiến thêm; **chưa hoàn tất mục tiêu đóng bốn cổng thiết kế, B1 vẫn NOT_READY**. Các kết quả kiểm validator và tính toán không thay review thiết kế điện/cơ.

## 1. Trạng thái tổng quan

| Đối tượng | Trạng thái đọc lại khi lập báo cáo | Ý nghĩa |
|---|---|---|
| MM-HW-P0-10 | `in_review` | Hồ sơ hợp nhất C11/r12 đã có; chưa được coi là đóng các thiếu sót thiết kế |
| MM-HW-P0-11 | `in_review` | Có phân tích và phương án sau lựa chọn G-B/M-A; các cận kỹ thuật vẫn còn thiếu |
| MM-HW-P0-09 | `waiting` | Luồng B1 còn chờ bằng chứng đóng cổng |
| MM-HW-MOBOT-REMOTE-KICAD-001 | `waiting`, không lease | Chưa được triển khai schematic/B1 |
| Cấu hình handset r12 | `proposed`, chưa duyệt hash | Không có phê duyệt MPN/BOM hoặc quyền chế tạo |
| Bốn cổng trước schematic | Đều `OPEN` | Là các điểm chặn trực tiếp của B1 |
| Ba cổng mốc muộn | Đều `OPEN` | BOM, layout và sử dụng chuyển mode; không tự kéo chúng thành điều kiện đóng B1 sớm |
| Verification items | Giữ đủ 14 mục | Không có phép đo nào được tự chuyển thành PASS |

**SHA-256 r12:** `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`.

Queue chuẩn là `D:/StartupOS/docs/agents/tasks.json`. Báo cáo này chỉ phản ánh trạng thái tại thời điểm đọc, không tạo một bảng trạng thái vận hành thứ hai và không đổi queue.

## 2. Kết quả của lượt P0-10

Lượt này hợp nhất các mâu thuẫn mà C11 chỉ ra, đồng thời phân biệt rõ quyết định hướng với phê duyệt cấu hình.

| Hạng mục | Đã thực hiện | Giới hạn còn lại |
|---|---|---|
| Quyết định Founder | Ghi receipt từng câu; tách retention 100 N vận hành/200 N proof mỗi đường khỏi lực tay 100 N mỗi nút | Một số câu lịch sử chỉ có nguồn trong ngữ cảnh HQ, không có message ID gốc; đã nêu rõ |
| Charger r12 | Đưa BQ25170 family thành ứng viên chính; BQ25186 chuyển lịch sử; loại nội dung register/I²C cũ khỏi profile đang dùng | Chưa chọn suffix J/non-J, MPN, strap/setpoint hay BOM |
| Cấu hình | Đăng ký r12 proposed; giữ nguyên r11; giữ 14 verification items, tiêu chí và mốc cổng | Không tự PASS hoặc duyệt hash |
| Nguồn điện | Ghim 16 PDF TI và 177 ảnh trang, có hash và metadata; thêm nguồn cơ khí | Ghim được tài liệu không có nghĩa đã có đủ cận cho toàn mạch |
| H3 | Làm rõ CV có điều kiện 4,0176–4,0824 V và cửa sổ trip tĩnh tối đa 27,6 mV | Chưa có detector và chuỗi cutoff đáp ứng đầy đủ |
| Cơ khí | Chọn một proposal hình học lớn C11-MECH-P1, đánh dấu các giá trị mâu thuẫn là superseded | Chưa có geometry kín đủ cho CAD/FE; bản nhỏ và các review cũ không áp dụng cho r12 |
| Vật liệu | Kiểm lại SSAB có cơ sở 355 MPa cho dải dày bao gồm 8 mm; phân biệt lõi còn lại với phôi đề xuất ≥10 mm | Chưa có chứng chỉ stock/process, dữ liệu mỏi hoặc xác nhận chi tiết sau gia công |
| Review nội bộ | Hiệu đính hash ASCII, bổ sung hash geometry, rút nhãn chấp nhận vượt bằng chứng, ghi DISPOSITION F1–F9 | Các bản hiệu đính của lead không phải review độc lập đóng cổng |

QA cuối lượt đã kiểm 242 file/hash khớp tại thời điểm đóng packet, registry khớp r12 và mọi cổng vẫn OPEN.

## 3. Kết quả của lượt P0-11

Lượt này đi sâu vào các cận đang thiếu và đưa ra lựa chọn sản phẩm cụ thể. Founder đã trả lời cả hai lựa chọn, không cần hỏi lại.

### H3: thu hẹp phương án, chưa chứng minh bảo vệ hoàn chỉnh

- Worksheet cho thấy REF33 không đủ biên dưới yêu cầu toàn nhiệt đang xét: riêng sai số reference đã khoảng ±26,42 mV tại mức trip 4,0962 V, lớn hơn nửa cửa sổ 13,8 mV.
- Đã lập phương án reference chính xác hơn kiểu ADR4525B, divider và TLV3201 minh họa. Đây chưa phải lựa chọn MPN.
- Khoảng trip partial sau provisional shift còn khoảng 2,17 mV mỗi phía. Nó vẫn thiếu hysteresis MAX, full-temperature CMRR/PSRR, aging, thermal history, ripple và các sai số ứng dụng khác.
- Divider mới đổi K, nên yêu cầu cắt có điều kiện là **55,922051 µs**, hoặc **51,733589 µs** khi trừ thêm guard 1 mV. Không dùng lại 59,060915 µs của mô hình cũ cho phương án mới.
- ADR45 Rev G đọc được từ nguồn hãng qua web, nhưng tải PDF hai lần timeout; đã dừng retry. **Chưa có PDF/hash cục bộ của nguồn này.**

### OFF/W: tính đúng từng rail và phân biệt MIN với MAX

- Có mô hình RC/KCL riêng cho RUN_OUT và JOY, không cộng tùy ý mọi dòng về cùng một rail.
- Chỉ ra phản ví dụ: bleed JOY 100 kΩ với dòng bơm 12 µA cho plateau 1,2 V, không chứng minh được rail thấp hơn 0,8 V.
- Proposal hai bleed JOY 22 kΩ cho thời gian xả điều kiện khoảng 0,614074 s khi một bleed hở; chưa chọn linh kiện hoặc sửa BOM.
- QA phát hiện 100 ms qualification trong r12 là **MIN**, không phải MAX. Đã sửa cách diễn giải và thêm mục tiêu qualifier 100–250 ms để phân tích. Với các allocation khác, tổng RC/cut/qualification là khoảng 2,973167 s; **chưa phải MAX của toàn hệ thống**.
- Khảo sát TPS22919/TPS22990 không cung cấp lối tắt: switching tables chỉ có TYP dưới tải thử, không thay được chứng minh MAX toàn tuyến. Hai PDF này đã ghim.

### GPIO: Founder đã chọn G-B

Giữ đủ E1–E4 và bốn control riêng, giữ SECOND_POSITION_OBSERVATION; không xuất H3_DEDICATED_STATUS riêng về MCU. Tổng là **16 GPIO**, vừa pool bảo đảm theo số lượng và hướng chân, không còn spare ở trường hợp này.

Đây là chốt mức chẩn đoán, **chưa gán GPIO, chưa xác minh clone và chưa sửa app**. Sensor thứ hai, veto và bảo vệ H3 độc lập vẫn giữ nguyên.

### Cơ khí: Founder đã chấp nhận hướng M-A để tính tiếp

Cơ cấu đề xuất chỉ đổi đường nhả khi nút đã trở về vị trí nghỉ. Nếu người dùng giữ nút trước khi được phép, họ phải thả rồi nhấn lại; actuator nhỏ không bị yêu cầu thắng lực tay 100 N.

Đã lập hợp đồng trước/sau release commitment và các điều kiện tách đường lực. Đồng thời phát hiện hành trình 0,80 mm không có biên góc sau allowance 0,30 mm: tại 5° chỉ còn separation 0,496956 mm. Hành trình **0,90 mm tại 5°** cho 0,596575 mm là proposal phân tích tiếp, **chưa thay geometry r12**. Clearance 0,25 mm cũng chỉ là worksheet, chưa có geometry/CAD/FE chứng minh.

## 4. Các vấn đề còn tồn tại để hoàn tất task

Các chủ trì bên dưới là trách nhiệm đề xuất theo vai trò, không phải thông báo đã giao lượt chạy mới.

| ID / mức ưu tiên | Việc còn thiếu | Chủ trì đề xuất | Điều kiện đóng |
|---|---|---|---|
| H3-01 — chặn B1 | Full error budget cho detector, reference và divider | Box02, Box09 hỗ trợ nguồn | Có MIN/MAX áp dụng cho đúng nhiệt, supply, common-mode, hysteresis, dung sai và tuổi thọ; không lấy TYP làm MAX; trip MIN/MAX có biên dương so với CV và trần bảo vệ |
| H3-02 — chặn B1 | Topology năng lượng và thời gian từ phát hiện tới cách ly | Box02 | Bao phủ lỗi đơn, reverse/bypass, tụ cell-side, capacitor open/ESR/ESL, current bound, startup/reference-ready, slow ramp/chatter và charge sau ngắt; chứng minh đáp ứng timing của chính phương án cuối |
| OFF-01 — chặn B1 | Interface và ma trận mixed-bias từng crossing | Box02 | Chọn được interface/pull/clamp phù hợp; tính dòng vào đúng rail ở các trường hợp cấp nguồn/mất nguồn/ramp/một tầng lỗi; actual isolation không suy từ EN hoặc receiver LOW |
| OFF-02 — chặn B1 | Qualifier/reset/default và MAX toàn tuyến | Box02 + Box01 | Có cận MIN/MAX, reset dominance, fresh-edge và retained-HIGH handling; tổng detect/latch/interface/barrier đáp ứng deadline, tính đúng qualification và rail decay |
| MCU-01 — chặn B1 | Đưa G-B từ quyết định hướng thành hợp đồng tài nguyên và điện | Box01 + Box02 | Đếm đủ loại chân, domain/default/bias/diagnostic; giữ các quan sát bảo vệ độc lập, không dùng GPIO16/17 như nguồn bảo đảm; review tính khả thi trước gán chân |
| MECH-01 — chặn B1 | Geometry M-A đầy đủ và tách lực tại mọi vị trí | Box03 + Box02 giao diện điện | Xác định stop, neutral interlock, route, commit, datum, tolerance/wear/deflection và swept envelope; không để lực nút 100 N kẹp gate; xét từng nhánh và lỗi chung |
| MECH-02 — chặn B1 ở phạm vi bằng chứng thiết kế được yêu cầu | Phân tích cơ và tính bền đủ mức | Box03, Box08 xét phương pháp | Bao phủ tải kéo 100/200 N từng đường, 100 N từng nút và tổ hợp tải; stress/contact/fillet/frame, fatigue/life và spring return theo tiêu chí được chấp nhận; không gọi beam calculation là FE |
| ACT-01 — chặn B1 | Actuator và nguồn sản phẩm | Box03 + Box02, Box09 nguồn | Có net force MIN trên đoạn làm việc, return/drag, Rmin lạnh, rail thấp/nhiệt, duty/pulse/retry/flyback, ngân sách dòng/năng lượng/nhiệt và chi phí; không dùng nominal catalog như MAX/MIN đã bảo đảm |
| PROC-01 — cần xử lý trước CAD/FE | Phạm vi và quyền CAD/FE phân tích | HQ chuẩn bị, Founder quyết phạm vi thật sự cần | Có cấu hình/phạm vi phân tích cụ thể và quyền tương ứng; giải quyết phụ thuộc giữa bằng chứng cơ khí cần có và quy định exact-hash trước CAD; không tự coi duyệt M-A là quyền tạo CAD |
| REVIEW-01 — trước đóng gate | Review độc lập đúng snapshot | Box08, HQ giữ registry | Reviewer phân xử từng cổng theo bằng chứng; mỗi kết luận ghim đúng configuration và review bytes theo preflight hiện hành; không tái dùng review của snapshot cũ |
| CONFIG-01 — trước B1 | Hợp nhất các phương án đã được chấp nhận vào revision tiếp theo | HQ, với đầu vào Box01/02/03 | Một bộ số liệu và geometry nhất quán; G-B/M-A/profile/sources/unknowns đồng bộ; review lại đúng bytes trước xin duyệt hash; không sửa đè r12 đã đóng packet |

**Nguồn ADR45 chưa tải được là thiếu sót về truy xuất, không phải toàn bộ blocker H3.** Có PDF cũng chưa giải quyết được hysteresis/aging/MAX chain hoặc chứng minh topology. Tương tự, G-B đã xử lý lựa chọn vượt số chân nhưng không tự đóng cổng MCU.

## 5. Phần Codex làm và phần cần Founder hỗ trợ

### Codex và các vai trò kỹ thuật có thể làm tiếp

1. Hoàn thiện topology, bảng sai số, ma trận dòng và cận thời gian; tìm phương án có cận phù hợp thay vì xin nâng yêu cầu để làm xanh.
2. Khép G-B thành bảng vai trò/domain và chẩn đoán; không cần hỏi lại mức chẩn đoán đã chọn.
3. Làm rõ geometry/stop/route/commit M-A ở mức proposal, lập các tổ hợp tải và tiêu chí phân tích.
4. Chuẩn bị phương án CAD/FE phân tích có phạm vi cụ thể để giải quyết PROC-01; không bắt Founder tự chọn các chi tiết kỹ thuật còn TBD.
5. Lập packet review cuối, kiểm snapshot và cập nhật queue/registry đúng vai trò.

### Founder chỉ cần hỗ trợ khi đến điểm phụ thuộc

| Hỗ trợ | Khi nào cần | Không suy ra từ hỗ trợ đó |
|---|---|---|
| Cung cấp PDF ADR45 nếu tải được từ máy/tài khoản của Founder | Để ghim đúng tài liệu đang tham chiếu; Codex đã dừng sau hai timeout | Không tự thành xác nhận thông số hay phê duyệt reference |
| Chuyển câu hỏi dữ liệu hẹp cho hãng và gửi phản hồi về | Khi đã xác định thông số/điều kiện không có trong nguồn công khai; Codex chuẩn bị nháp, hiện không có quyền liên hệ vendor | Không phải quyền mua, đặt chế tạo hoặc dùng lời trả lời không rõ suffix làm guarantee |
| Quyết phạm vi CAD/FE phân tích cụ thể | Sau khi HQ chuẩn bị gói rõ ràng cho PROC-01 | Không phải lease KiCad hoặc sản xuất |
| Chọn đánh đổi sản phẩm mới nếu phương án bắt buộc phải đổi | Chỉ khi có lựa chọn có số, ảnh hưởng tới UX/kích thước/profile/chi phí | Không hỏi lại G-B, M-A, 100/200 N, trần 4,200 V hoặc cách ly toàn bộ I/O |
| Duyệt exact configuration/hash | Sau review theo quy trình và bằng chứng phù hợp | Không tự cấp quyền mua hàng, flash, cấp điện pin/motor hoặc sản xuất |

Chưa yêu cầu Founder mua mẫu hoặc đo ngay. Mẫu vật lý bổ sung bằng chứng ma sát, dung sai gia công, lực nóng/lạnh, mòn và độ bền thực; nó không được tự nhập thành quyền thực hiện trong task này.

## 6. Điều kiện nào mới được gọi là “done”

**Hoàn tất lát cắt hồ sơ:** các tài liệu/receipt/phép tính/nguồn có truy xuất, mâu thuẫn đã xử lý, QA kiểm tính nhất quán và các thiếu sót được công khai. Hai lượt đã đạt nhiều đầu ra ở mức này, nhưng task vẫn `in_review`, không tự đánh dấu `done` trong queue.

**Hoàn tất mục tiêu đóng thiết kế trước B1:** cả bốn cổng dưới đây phải được reviewer độc lập chấp nhận theo tiêu chí của chúng:

- `D17-OFF-DESIGN`
- `D17-ACTUATOR-PRODUCT`
- `D17-H3-CV-PROTECTION`
- `MCU-RESET-VETO-RESOURCES`

Sau đó phải có revision cấu hình cuối nhất quán, review đúng bytes, trạng thái blocker/gate và registry khớp, Founder duyệt đúng hash, task/lease được cấp trong phạm vi đã duyệt và preflight chấp nhận. Thay đổi gate/blocker bytes làm đổi hash: phải ghim lại snapshot theo quy trình, không coi một review cũ bao mọi revision.

Ba cổng muộn vẫn phải được theo dõi riêng: `D17-B01-TRACEABILITY` trước khóa BOM; `D15B-FAB-LAYOUT` trước layout; `D17-OFF-ASSEMBLY` trước sử dụng chuyển mode. Box08 vẫn phải xét 14 verification items trước layout theo chính sách hiện hành. Chúng không được tự chuyển PASS, cũng không nên bị dùng để chặn sai mốc.

## 7. Kiểm chứng và độ mới của bằng chứng

| Kiểm tra | P0-10 | P0-11 |
|---|---|---|
| Validator | Exit 0; errors=[]; 56 task tại lúc chạy | Exit 0; errors=[]; 57 task tại lúc chạy |
| Test validator | 61/61; exit 0 | 61/61; exit 0 |
| Tính toán | Script exit 0, phép tính có điều kiện | Script exit 0; QA chạy lại, JSON khớp |
| QA | Kiểm tính nhất quán packet, không đóng gate | Kiểm và recheck proposal, sửa finding về qualifier, không đóng gate |
| CAD / FE / bench | NOT_RUN | NOT_RUN |

Đây là kết quả các lượt đã chạy, **không chạy lại tests khi chỉ viết báo cáo tổng hợp**. Báo cáo đã đọc lại các log, registry, configuration và kiểm hash hiện có:

- P0-11: 42/42 file trong manifest còn khớp.
- P0-10: 241/242 file còn khớp; duy nhất `D:/StartupOS/docs/agents/tasks.json` khác vì queue vận hành đã thêm P0-11. QA lịch sử của P0-10 đã kiểm 242/242 tại thời điểm đóng packet. Không mô tả manifest lịch sử là snapshot nguyên vẹn của queue hiện tại.
- r12 giữ đúng hash nêu ở đầu báo cáo; 14 verification items và bảy cổng OPEN vẫn có trong cấu hình hiện tại.

Các con số về cửa sổ trip, thời gian, lực, clearance và năng lượng là phân tích dưới điều kiện/giả định đã ghi. Không có kết luận “đã an toàn”, “đã hợp lệ” hoặc “phần cứng đã đạt”.

## 8. Tài liệu gốc để bàn giao

- [P0-10 REPORT](../agents/runs/MM-HW-P0-10/REPORT.md)
- [P0-10 QA snapshot cuối](../agents/runs/MM-HW-P0-10/FINAL-CONSISTENCY-REVIEW.md)
- [DISPOSITION C11](../agents/runs/MM-HW-P0-10/DISPOSITION-C11.md)
- [P0-11 REPORT](../agents/runs/MM-HW-P0-11/REPORT.md)
- [P0-11 verification](../agents/runs/MM-HW-P0-11/verification.json)
- [P0-11 QA](../agents/runs/MM-HW-P0-11/QA-REVIEW.md)
- [Biên nhận G-B/M-A](mobot-v2-p0-11-founder-directions.json)
- [Phân tích H3/OFF](mobot-v2-p0-11-h3-off-analysis.md)
- [Hợp đồng theo hướng đã chọn](mobot-v2-p0-11-selected-interface-contract.md)
- [RELAY P0-10](../agents/runs/MM-HW-P0-10/RELAY-REVIEW_REQUEST.md)
- [RELAY P0-11](../agents/runs/MM-HW-P0-11/RELAY-REVIEW_REQUEST.md)

Các RELAY chỉ là artifact để Founder tự chuyển nếu muốn. Không gửi nội dung dự án tới Claude hoặc vendor khi lập báo cáo này.
