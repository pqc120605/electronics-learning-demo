# MoBot V2 · Biên bản xác nhận Founder Q1–Q8 và D1–D10

- Ngày: 07/11/2026, Asia/Bangkok.
- Người quyết định: Chiến, Founder Mạch Mở.
- Nguồn: xác nhận trực tiếp của Founder trong chat HQ ngày 07/11/2026.
- Trạng thái: đã xác nhận các quyết định dưới đây để lập cấu hình phần cứng mới. Phê duyệt hash cấu hình sẽ được thực hiện riêng sau khi Box 08 review đúng bytes.

## Quyết định đã xác nhận

| Mục | Quyết định |
|---|---|
| Q1 · A | Dùng mẫu bo đã chụp cho cả hai carrier. |
| Q2 · A | Kiến trúc nguồn tay cầm v1. |
| Q3 · A | Pack Jauch `250832`. |
| Q4 · B | Tách `verification_items` khỏi `blocking_unknowns` theo phạm vi D10. |
| Q5 · B | PCB 4 lớp cho cả hai carrier. |
| Q8 | Giữ bo 30 chân USB-C họ CH340. Founder không đo được mẫu. Mọi kích thước và điện nội bộ của bo là ước lượng cho tới khi có số đo. |
| D1 | Robot carrier là lõi Starter. Tay cầm là module riêng. |
| D2 | Thị trường đầu tiên là Việt Nam. Chưa ghi độ tuổi lên hộp. |
| D3 | Giọng nói V1 chỉ cam kết lời chào và hướng dẫn phát sẵn qua loa. V1 không có mic. Không ghi “AI” hoặc “trò chuyện tự nhiên”. |
| D4 | Web Serial qua USB để kiểm chứng ở P1. Wi-Fi + WebSocket cho V1 sau khi thử. |
| D6 | “L3” nghĩa là D3 trong `feature-depth-register`. |

Q6 và Q7 không nằm trong xác nhận này. Với cấu hình mới, Q1–Q3 và Q8 là căn cứ hiện hành cho lựa chọn bo và nguồn tay cầm. Phương án WRL-20168 và tay cầm PS3 dùng AA được giữ làm lịch sử thiết kế ở các phần mâu thuẫn với quyết định mới.

## D10 · Chấp nhận rủi ro có giới hạn

Founder chấp nhận đưa đúng các phép đo dưới đây vào `verification_items` thay vì `blocking_unknowns`. Sau khi cấu hình mới được duyệt đúng hash và đạt preflight, schematic và layout có thể dùng giá trị đo `TBD` cho các mục này. Box 08 phải review từng mục trước layout. Các mục ngoài danh sách vẫn theo cổng kiểm tra hiện hành. Chỉ Founder được đổi phạm vi chấp nhận.

| Verification item | PASS / FAIL cần ghi trong cấu hình mới | Người đo đề xuất | Thời điểm đo đề xuất |
|---|---|---|---|
| USB attach, boot và flash | PASS khi trace ở từng trạng thái nằm trong giới hạn dòng và sụt áp áp dụng cho cổng/chế độ đã review. FAIL khi vượt giới hạn hoặc mất nguồn/reset ngoài yêu cầu. | Box 07 hoặc người vận hành bench được Founder cho phép, Box 02 xác lập cận | PCB mẫu, sau quyền cấp điện riêng. Pha flash chỉ sau quyền flash riêng. |
| UVLO động và nội trở pack | PASS khi UVLO cắt/phục hồi trong cửa sổ đã review ở cận nội trở, nhiệt độ và tải xung. FAIL khi vượt cửa sổ, đóng ngắt lặp hoặc pack rời giới hạn cho phép. | Người vận hành bench được Founder cho phép, Box 02 xác lập cận | PCB mẫu, sau quyền thử pin riêng. |
| VM: xung, năng lượng hồi và điện tích lọt về converter | PASS khi đỉnh áp từng rail và ứng suất xung/nhiệt của linh kiện nằm trong cận đã review, kể cả mất bias và mất đường hồi về pack. FAIL khi bất kỳ cận nào bị vượt. | Người vận hành bench được Founder cho phép, Box 02 xác lập cận | PCB mẫu, sau quyền chạy motor riêng. |
| Nhiệt thật | PASS khi nhiệt độ tuyệt đối của linh kiện và bề mặt liên quan dưới các giới hạn đã review trong vỏ và chu kỳ tải đã định. FAIL khi vượt một giới hạn. | Box 07 hoặc người vận hành bench được Founder cho phép | Mẫu tích hợp sau quyền vận hành tương ứng. |
| Độ ổn định ADC joystick | PASS khi ADC đạt dải, sai số và thời gian ổn định đã review qua hành trình và tải radio. FAIL khi có mẫu vượt tiêu chí ở ca nghiệm thu. | Box 07 hoặc người vận hành bench được Founder cho phép | Mẫu tay cầm sau quyền cấp điện và flash tương ứng. |
| Kích thước và điện nội bộ bo clone | PASS khi đúng mẫu/revision khớp vùng lắp, kết nối và các giả định điện đã review của carrier. FAIL khi sai lệch gây không vừa, sai chức năng hoặc vượt cận thiết kế. | Box 03 phụ trách cơ khí, Box 02 phụ trách điện. Người thao tác theo quyền riêng. | Đối chiếu với mẫu thật sau PCB theo D10. Có thể xác nhận phần cơ khí không cấp điện ngay khi có mẫu. |

Các ngưỡng định lượng và tên người đo cần khóa trong cấu hình mới hoặc hồ sơ kiểm chứng được Box 08 review. Giá trị đo còn `TBD`. Thiếu kết quả đo là `NOT_RUN` hoặc `UNKNOWN`, không được ghi PASS.

## Việc tiếp tục bị chặn theo xác nhận Founder

Cần văn bản cho phép riêng trước khi gửi PCB đi sản xuất, cấp điện pin Li-ion hoặc chạy motor trên PCB đã lắp, flash firmware hay mua hàng. Không tuyên bố “đã an toàn” hoặc “hợp lệ” cho giá trị chưa đo. Giữ review từng `verification_item` của Box 08 trước layout và giữ cổng chứng nhận đồ dùng trẻ em.

**Chữ ký ghi nhận theo xác nhận trong chat: `<Chiến>` · 07/11/2026.**


## Bổ sung trực tiếp ngày 08/11/2026 — nguyên văn

=== XÁC NHẬN BỔ SUNG CỦA FOUNDER · mở rộng D10 · ngày 08/11/2026 ===
Tôi là founder. Bổ sung vào D10: các thông số của pack Jauch 250832 mà datasheet Rev 1.2 không có (dòng kết thúc sạc, timer sạc, loại và đường đặc tính NTC, dòng xả xung, nội trở pack, connector, cực tính, kích thước cơ khí) chuyển sang verification_items, giá trị thận trọng để TBD. Tôi không xin nhà sản xuất Jauch lúc này. Báo cáo UN 38.3 và IEC 62133-2 thật vẫn bắt buộc trước khi đóng gói và chứng nhận đồ dùng trẻ em. Mọi hạn chế khác của D10 giữ nguyên.
D15(b): MỞ cho STACKUP-DRC và cận fab, chuyển sang cổng mốc "trước lease layout", Box 08 duyệt từng mục.
Chữ ký: <Chiến> · 08/11/2026
=== HẾT ===


<a id="d17"></a>
<a id="d17-hw"></a>

## D17-HW — disposition P0-02 được Founder duyệt ngày 08/11/2026

Định danh có namespace `D17-HW` từ lượt xử lý review P0-03 R-20261108-C01. `D17` trong lịch sử hardware là alias của cùng quyết định này, không đổi nội dung hoặc phạm vi đã duyệt. `D17` về license trong tài liệu founder-decisions là quyết định khác; đề nghị bên sở hữu dùng `D17-LIC`. Các gate ID vận hành `D17-OFF-DESIGN`, `D17-ACTUATOR-PRODUCT`… giữ nguyên để không phá tham chiếu; chúng thuộc D17-HW, không thuộc license. Các anchor cũ được bảo toàn.

Nguồn: Founder trả lời trực tiếp “ok duyệt” trong HQ cho bản D17 tại D:/StartupOS/docs/agents/runs/MM-HW-MOBOT-IF-001/p0-closure-candidate/founder-disposition-proposal.md.

Founder xác nhận P0-02 tay cầm hoàn thành ở cấp hồ sơ cấu hình PROPOSED và hợp đồng yêu cầu, không phải chứng minh thiết kế hay phần cứng đạt. Cho phép chuyển phần còn mở của HANDSET-POWER-DESIGN, CARRIER-INTERFACES, B01-SUPPLY và HANDSET-PACK-H3 sang các gate có điều kiện: trước lease schematic phải đóng kiến trúc bảo vệ/cấp quyền OFF, nguồn và ngân sách actuator sản phẩm, cùng phương án tương thích CV/bảo vệ H3; trước khóa BOM phải đóng truy xuất B01; trước cho phép sử dụng chuyển mode phải có bằng chứng OFF đúng cụm theo Q2-OFF. D15(b) về fab trước lease layout giữ nguyên. Các nghĩa vụ này vẫn OPEN, không nhập vào D10 và không được coi là PASS. Phê duyệt hash, lease, chế tạo và vận hành vẫn riêng.

D17 ưu tiên các mô tả lịch sử yêu cầu đóng bốn mục này trước hoàn tất P0-02; không miễn các nghĩa vụ hoặc dời mốc beyond nội dung trên. Đây là duyệt disposition, KHÔNG phải duyệt hash cấu hình hoặc vật liệu ứng viên.


<a id="p0-06"></a>

## P0-06 — bốn hướng thiết kế · 09/11/2026

Founder xác nhận trực tiếp “xác nhận” trong HQ sau khi đọc lại cả bốn hướng. Nguyên văn xác nhận trong P0-06 được ghi dưới đây; đây không phải duyệt hash, gate hoặc lease.

=== XÁC NHẬN CỦA FOUNDER · bốn quyết định cho hồ sơ P0-05 · ngày 09/11/2026 ===
Tôi là founder và tôi chọn các hướng sau. Hãy ghi nguyên văn vào biên bản chính thức (docs/hardware/mobot-v2-founder-decision-q1-q8.md). Đây KHÔNG phải duyệt hash cấu hình, KHÔNG đóng cổng nào, KHÔNG mở lease.

1. Cơ cấu actuator (D17-ACTUATOR-PRODUCT): chọn nhóm "khóa cơ thụ động, điện chỉ cấp quyền". Điều kiện: phải chứng minh hình học bắt buộc RUN→OFF→PROGRAM, mất bias vẫn khóa, không đi vòng qua gá lệch hay thao tác sai. Nếu không chứng minh được thì dừng và báo tôi; phương án lùi là solenoid spring-return. Chưa chọn MPN.
2. Kiến trúc OFF (D17-OFF-DESIGN): giữ họ ứng viên điện trong cấu hình làm lớp cách ly (O-A), kết hợp giữ cơ khí độc lập có feedback vị trí và liên động RUN (O-C). Không chọn O-B.
3. Sạc H3 (D17-H3-CV-PROTECTION): chọn H-C, bộ sạc có dung sai điện áp CV chặt hơn để VREG tối đa thấp hơn ngưỡng PCM quá sạc tối thiểu 4,23 V của pack Jauch 250832 có margin. Đề xuất ít nhất hai ứng viên có datasheet kèm revision và trang; chốt MPN cần tôi duyệt riêng. Chưa hỏi Jauch. Q3 (pack Jauch 250832) giữ nguyên.
4. Veto reset MCU (MCU-RESET-VETO-RESOURCES): chọn hướng chốt/logic phần cứng dùng chân từ 13 vị trí chưa dùng của tay cầm. Không dùng expander I2C, không đổi chính sách chân r7. Chưa gán chân cụ thể.

Nếu một hướng ở trên đòi đổi Q1-Q8 hoặc vật liệu ngoài phạm vi này, hãy dừng và nêu đúng quyết định nào bị ảnh hưởng. Mọi giới hạn chưa có nguồn giữ TBD, mọi phép đo NOT_RUN. Không mua hàng, flash, cấp điện, KiCad.
Chữ ký: <Chiến> · 09/11/2026
=== HẾT ===


<a id="p0-07"></a>

## P0-07 — hướng ứng viên sạc và preflight · 09/11/2026

Nguồn: Founder giao trực tiếp trong HQ: “Ghi quyết định BSD-3-Clause và quyết định loại BQ25185/ cho BQ25186 làm ứng viên chính”. BQ25185 bị loại khỏi shortlist hiện hành; BQ25186 là **ứng viên chính để lập hồ sơ**, chưa duyệt MPN/BOM/setpoint/hash. Giữ Q3 Jauch250832 và bốn hướng P0-06. Timer/profile/NTC/CV transient và bảo vệ độc lập chưa chứng minh; gate vẫn OPEN. Không tự liên hệ hãng hoặc chọn vật liệu khác.

BSD-3-Clause đã được Founder xác nhận trong D19 tại docs/claude-support/2026-11-06-final-plan/founder-decisions.md; quyết định đó chỉ cho mã phụ thuộc đã nêu, giữ copyright/license khi phân phối, ý kiến pháp lý trước bán vẫn chưa làm. Không mở rộng license hoặc nhận Wokwi vào app. Đây là tham chiếu quyết định có sẵn, không tạo một approval license mới.


<a id="p0-08"></a>
## 09/11/2026 · P0-08: trần pack và ghim review ngoài proposal

Founder cung cấp nguyên văn: “Trần 4,200 V” = trần điện áp sạc tuyệt đối của pack Jauch 250832 tại đầu cực pack ở mọi điều kiện (dung sai, line, load, nhiệt, sense, gợn, transient, độ trễ bảo vệ). Không hỏi Jauch. Q3 giữ nguyên. Không dùng ngưỡng PCM làm giới hạn sạc.

D19 BSD-3-Clause giữ nguyên phạm vi đã ghi. Loại BQ25185; BQ25186 là ứng viên chính, chưa duyệt MPN/suffix/setpoint. Hướng đã chọn giữ nguyên: khóa cơ thụ động, điện chỉ cấp quyền; OFF O-A+O-C, không O-B; H3 H-C; MCU chốt/logic phần cứng, không I2C expander, không đổi r7. E1–E4=4 chỉ là cận trên lập kế hoạch, chưa phải quyết định sản phẩm.

Founder trả lời trực tiếp: “Cho phép ghim review_sha256 ở registry (đề xuất)”. Phạm vi: tasks.json hardware_configurations.<id>.gate_reviews ghim hash byte REVIEW_RESULT của từng cổng. Proposal vẫn có review_ref; review envelope ghim đúng hash toàn bộ proposal; validator kiểm cả hai. Không nhúng review_sha256 vào proposal để tránh vòng hash. Quyết định này điều chỉnh bước 6 của prompt P0-08, không phê duyệt hash/MPN/cổng.

Sau khi báo GPIO upper14>pool11/13 và chưa có proof hình học, Founder trả lời: “Cho Codex đề xuất kiến trúc mới trong ràng buộc hiện tại để tôi duyệt”. Đây là quyền chuẩn bị phương án, chưa chọn phương án A/B, chưa duyệt cơ cấu, GPIO, CAD, hash hoặc phần cứng.


<a id="p0-09-a-direction"></a>
## 09/11/2026 · duyệt hướng khảo sát A / captive-cassette

Founder trả lời nguyên văn trong HQ: “duyệt”, cho câu hỏi “Bạn có duyệt hướng khảo sát A và cơ cấu captive-cassette trong bản đề xuất không? Đây chỉ là duyệt hướng nghiên cứu, chưa duyệt thiết kế hay chế tạo.”

Đối tượng: docs/hardware/mobot-v2-p0-08-architecture-proposal.md, SHA-256 `eb0ed196421db5df263d448285d318386162b35f5084a9c4ed4fc8b4e170adf2`. Chọn A làm hướng khảo sát hiện hành, không chọn B để triển khai. Giữ đủ bốn E-channel theo giả định lập kế hoạch, bảo vệ độc lập MCU, không I2C expander, không đổi chính sách r7. Ghi nhận tại docs/agents/runs/MM-HW-P0-09/founder-direction-approval.json.

Đây không phải duyệt hash r11 hay cấu hình khác, gate PASS, MPN/suffix/setpoint, GPIO/net, CAD/schematic/PCB/KiCad, mua hàng hay cấp điện/flash. Các STOP về circuit proof, challenge một chân, MAX timing và hình học vẫn giữ. Tiếp tục khảo sát tài liệu/yêu cầu kiểm chứng trong các ràng buộc đó.


<a id="b1-w-envelope"></a>
## 09/11/2026 · B1: nhánh W và envelope cơ khí

Sau khi yêu cầu tiếp tục tới B1, Founder trả lời nguyên văn: “Chọn W, ghi rõ giới hạn và review độc lập (đề xuất)”. Chọn window watchdog phần cứng với software-only feed sau kiểm tra tiến trình; cấm PWM/DMA/peripheral tự feed. Không tuyên bố phát hiện peripheral vẫn tạo chuỗi WDI hợp lệ khi CPU/task treo, không gọi đây là challenge-response. Veto độc lập, retained-HIGH/LOW, bias fault, fault latch và fresh permission vẫn bắt buộc. Nhánh challenge một dây không còn là nghĩa vụ của hướng khảo sát hiện hành; đây không phải đóng gate MCU.

Founder trả lời nguyên văn: “Chốt envelope để phân tích và review (đề xuất)”: giữ lực kéo100N, proof tĩnh200N cho mỗi đường giữ độc lập; chỉ nhả sau physical OFF khi người dùng đã thả lực kéo; jam giữ khóa, không yêu cầu motor mở khi đang chịu100N. Đây là acceptance allocation, không phải số đo hoặc vật liệu/cơ cấu đã đạt. Không tự chuyển solenoid fallback.

Nguồn lựa chọn và phạm vi: docs/hardware/mobot-v2-b1-required-decisions.md; receipt tại docs/agents/runs/MM-HW-P0-09/b1-readiness/founder-input.json. Cần review độc lập; r11/hash/MPN/setpoint/gate/lease và các quyền thiết bị chưa được duyệt bởi các lựa chọn này. Giữ Q3,D10,D17,trần4,200V,r7 và bốn E-channel giả định.

## B1 direct-return — duyệt hướng phân tích ngày 09/11/2026

Founder trả lời trực tiếp trong HQ: **“Duyệt hướng direct-return để hoàn thiện hồ sơ”**.

Phạm vi được duyệt: tiếp tục proposal hai đường giữ kim loại độc lập, cửa cấp quyền có lò xo hồi, thao tác đẩy vào rồi nhả hai chốt; tính lại nguồn thay witness motor cũ. Giữ 100 N vận hành và 200 N proof mỗi đường; ngân sách bộ dưới 1 triệu đồng. Takaha chỉ là ứng viên đối chiếu, chưa chọn MPN. Nguồn proposal: `docs/agents/runs/MM-HW-P0-09/b1-readiness/box03-direct-return-proposal.md`, SHA-256 `50bb9f62c4d46ef9857f597398d2a0939b9d131bb3874094b9476078b0aec010`.

Đây là duyệt hướng hoàn thiện dossier, không duyệt bytes r11 hoặc revision mới, không gán PASS gate, không mở lease B1 hay quyền chế tạo/mua hàng/thiết bị. Các cận lực kéo–hồi, dòng lạnh, feedback/fault, hình học và BOM giá phải được hoàn thiện/review trước trình duyệt MPN/hash. Nếu vượt ngân sách hoặc không đủ cận để đóng B1, HQ trình delta thay vì tự chọn fallback. D10 giữ nguyên.

## B1 release-button misuse envelope — 09/11/2026

Founder chọn nguyên văn: **“Ấn/kéo bằng tay, tối đa 100 N mỗi nút nhả; không dùng dụng cụ”**. Đây là envelope đầu vào để tính tab/thành dogleg và đường truyền lực nút nhả, không là kết quả proof hay chấp thuận chế tạo. Phân biệt với 100 N vận hành/200 N proof mỗi đường giữ cassette. Không tự mở rộng sang dụng cụ/đòn bẩy hoặc quảng bá chống phá mọi tình huống. Exact configuration/hash, MPN và gate vẫn chờ review/phê duyệt riêng.

## B1 H3 mode-access — quyết định Founder09/11/2026

Founder chọn nguyên văn: **“Giữ cách ly toàn bộ I/O; hoàn thiện cơ chế/default charger phù hợp”** trong CHARGE/PROGRAM. Không mở ngoại lệ bus H3, không suy ra được cấp nguồn B01. Tiếp tục đề xuất cơ chế cấu hình charger không phụ thuộc B01 hoặc candidate có cấu hình/default phù hợp; không tự chọn MPN thay Founder. Startup/POR/reset phải được phân tích với trần pack4,200V, hai bảo vệ độc lập và profile recovery/termination. Mọi delta candidate/cấu hình cần review và duyệt đúng hash trước build. BQ25185 vẫn bị loại theo quyết định trước cho tới khiFounder đổi rõ; không tự khôi phục.
## 11/11/2026 · F1–F5 tay cầm EVT0

Founder trả lời nguyên văn **“xác nhận”** trong HQ cho câu hỏi xác nhận F1–F5 theo [bản rà soát EVT0](mobot-v2-evt0-b1-intake-2026-11-11.md). Nội dung dưới đây là diễn giải phạm vi xác nhận.

- **F1.** Tay cầm EVT0 dùng nguồn qua cổng USB-C duy nhất của B01, phát hiện CC trước khi cấp VBUS và giữ giao diện header thụ động. Riêng tay cầm, hướng này thay Q2/Q3 cũ, cách ly I/O CHARGE/PROGRAM, G-B16/E1–E4, M-A/cassette, nhánh W, envelope 100 N/200 N và hướng H3/trần 4,200 V.
- **F2.** Ba pin AA alkaline hoặc NiMH tháo rời, sạc ngoài nếu dùng pin sạc. Cắt áp thấp theo pack và tự phục hồi là hướng phân tích. Hồ sơ phải xét đảo áp cell yếu và bật lại lặp dưới tải.
- **F3.** Giữ C1–C12 theo bản rà soát đã sửa. Giữ phạm vi D10 đã duyệt, gồm các giới hạn và mốc review trước layout.
- **F4.** Lập đề xuất r13 cho tay cầm, đối chiếu queue và validator, lấy review độc lập của Codex trên snapshot. Duyệt hash và cấp lease schematic vẫn là các quyết định riêng sau review.
- **F5.** Giữ ESP32 USB-C 30 chân họ CH340, điều khiển không dây, robot là hồ sơ riêng, giá cả bộ dưới 1 triệu đồng và cổng chứng nhận đồ dùng trẻ em trước khi bán.

