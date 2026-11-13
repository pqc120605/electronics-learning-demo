Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c6a3-cd21-7901-a15d-2c7843e155fa
Read-only advisory; no hardware approval, pin assignment, gate change or B1 permission.

**Chốt lượt 4: proposal INA152 + 12 PhotoMOS + 2 TPS22916CN chưa đủ căn cứ để review như thiết kế sẵn sàng triển khai.** Có thể đóng gói để review **kết luận no-go và hướng xử lý**. Không nên tiếp tục bổ sung vài linh kiện rồi giữ nguyên lời hứa bảo vệ: các khoảng thiếu hiện nằm ở front-end, fault-domain và thời gian đáp ứng của chuỗi.

Không yêu cầu Founder duyệt một cấu hình còn thiếu bằng chứng.

### Proposal duy nhất được tổng hợp

| Khối | Candidate/phương án | Trạng thái thực |
|---|---|---|
| Ba AA NiMH, holder, sạc ngoài | Giữ hướng đã chọn | Không đổi chemistry; miền điện áp vẫn là allocation nghiên cứu |
| Tap và guard | Sáu sense riêng; mỗi sense 2×499 Ω | Có phép tính giới hạn dòng; đoạn trước guard cần bảo vệ cơ khí |
| Reverse/clamp | Phải bảo vệ từng input khi cell đảo và khi monitor không có nguồn | **Chưa có mạng linh kiện đã chứng minh**; LM66100 bảo vệ đảo pack không thay chức năng này |
| Nguồn AON | TPS7A0218PDBVR | Candidate cấp logic, chưa phải nguồn AON hoàn chỉnh chịu mọi lỗi input |
| Memory/observe-release | Hai SN74AUP1G74DCUR, supervisor họ TLV809E | Có state contract; chưa ánh xạ đủ timer, logic và containment lỗi chung |
| Sense | Ba INA152EA, Ref giữa rail là hướng cần thiết kế lại | Chưa đóng sai số, open-wire/reverse và MAX settling |
| Sense isolation | 12 AQY212EH, hai bank độc lập | Cut-set chứa một switch sense kẹt ON theo các giả định đã ghi |
| Nguồn LED/monitor | Hai TPS22916CN nối tiếp, enable độc lập, pull-down ngoài | Hợp miền logic; chưa đóng unpowered/default và MAX ngắt |
| Startup/freshness | CHECK hữu hạn; chỉ gia hạn healthy sau frame đầy đủ | Chưa có chuỗi linh kiện/timing bảo đảm |
| B01 power | Chỉ sau kiểm nguồn hợp lệ; không chờ WDI để tự boot | Không gán chân; grant output/W vẫn tách khỏi boot |
| Load permission | AND giữa kiểm cell hợp lệ và nhánh inhibit độc lập | **Chưa chọn tầng công suất hoàn chỉnh** |

Mọi test, clamp, Ref và return của front-end phải ở phía sau hai bank sense. Không có debug, shield hay control wire nối vòng tới tap. Nguồn AON trước cutoff vẫn là tải pin và phải được tính riêng.

### Số lượng có thật trong danh sách ứng viên

Có **21 package đã được định danh ở mức candidate**:

- 12 AQY212EH;
- 3 INA152EA;
- 2 TPS22916CN;
- 2 SN74AUP1G74;
- 1 TPS7A02;
- 1 supervisor họ TLV809E, **chưa chốt suffix**.

Con số này **không phải BOM sản phẩm hoàn chỉnh**. Nó chưa gồm driver LED, comparator/reference, timer/freshness, logic còn thiếu, clamp/reverse, fuse và tầng ngắt tải. Không thể ghi tổng IC/BOM hay giá toàn kit bằng cách bỏ các khối này.

Riêng 12 LED có tổng dòng nhánh **60–360 mA** nếu mỗi LED nằm trong khoảng khuyến nghị 5–30 mA; chưa quy đổi thành dòng pin. Đây là lý do cần kiểm lại công suất/fit/BOM trước khi giữ kiến trúc, không phải bằng chứng đã vượt hoặc đạt ngân sách. [Panasonic ASCTB126E, printed tr. 2–3](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf)

### Ba điểm ngăn ký thiết kế — không thể giải bằng approval

**1. Chưa có front-end bảo đảm phát hiện lỗi trong toàn miền đã nêu.**

Phép thử open-wire hai mức có kết quả tuyến tính hữu ích, nhưng baseline, clipping và cell đảo chưa được khép chung trong một cấu hình Ref/clamp. INA152 chỉ công bố settling và overload recovery dưới cột **TYP**; không thể suy MAX bằng hệ số an toàn. [INA152 SBOS184, tr. 2–3](D:/StartupOS/electronics-learning-demo/docs/research/downloads/c11-r12/../ina152.pdf)

**2. Hai inhibit chưa có bảo đảm trạng thái khi mất nguồn và MAX ngắt.**

TPS22916CN nhận logic 1,8 V, nhưng khi mắc nối tiếp, VIN switch thứ hai có thể xuống dưới 1 V. Bảng hoạt động không bao phủ toàn bộ trạng thái đó. Turn-off là TYP; QOD không có ở CN. Bleed ngoài có thể tạo cận xả **sau khi nguồn đã ngắt**, không tạo MAX thời điểm nguồn bị ngắt. [TPS22916 SLVSDO5F, tr. 4–7, 17](D:/StartupOS/electronics-learning-demo/docs/research/downloads/c11-r12/tps22916.pdf)

**3. “Hai fault-domain” mới là yêu cầu, chưa là thiết kế.**

Hai bank hoặc hai load switch cùng nhận một quyền điều khiển không chứa lỗi quyền đó kẹt HIGH. Nhánh thứ hai phải tự thu hồi permission khi mất freshness, mất bias hoặc startup hết hạn; không chỉ sao chép output của nhánh thứ nhất. Chưa có BOM/timing cho nhánh độc lập này.

### Sàng lọc bổ sung duy nhất

Tôi kiểm tra **đường ngắt có bias tách riêng dùng TPS22953**, nhằm tránh phụ thuộc hoàn toàn vào VIN trung gian. Nó không giải quyết được điểm dừng: bảng switching vẫn cho turn-off khoảng 6 µs dưới **TYP**, đồng thời không sửa MAX settling và lỗi front-end. Vì vậy không promote thành phương án thay thế và dừng mở rộng catalogue. [TI TPS22953, SLVSCT5D, tr. 9–10](https://www.ti.com/lit/ds/symlink/tps22953.pdf)

### Hai phương án quyết định cụ thể

| Phương án | Việc được tiến hành | Điều kiện/quyền thực sự |
|---|---|---|
| **1 — giữ yêu cầu bảo vệ hiện tại; loại chuỗi candidate này khỏi proposal sản phẩm** — **khuyến nghị** | Giữ kết quả cut-set làm yêu cầu đầu vào. Thiết kế lại front-end và cutoff với cận đáp ứng/default phù hợp trước khi xin cấu hình schematic/B1. | Đây vẫn là việc kỹ sư; chưa cần Founder đổi sản phẩm hoặc cung cấp số đo. Không gọi current proposal “gần đủ”. |
| **2 — tiếp tục đánh giá linh kiện hiện tại theo chương trình qualification riêng** | Chuẩn bị một cấu hình fixture trước PCB sản phẩm: nguồn giả lập cell có giới hạn dòng, miền nhiệt/điện áp, tiêu chí pass/fail và kiểm lỗi xác định rõ. | Cần phê duyệt **cấu hình fixture/hash và quyền bench** trước artifact/device action. Characterization mẫu không tự biến TYP thành MAX bảo đảm toàn bộ sản phẩm; nếu dùng kết quả làm cơ sở thiết kế phải chốt phạm vi assurance riêng. |

**Không nên xin Founder miễn các thiếu sót thiết kế hoặc đẩy chúng sang post-PCB/D10.** Nếu không chọn thay đổi cơ sở qualification, việc đúng tiếp theo là phương án 1. Lượt nghiên cứu này dừng với no-go có nguyên nhân cụ thể; chưa có cơ sở xin duyệt MPN/hash sản phẩm hoặc mở B1.
