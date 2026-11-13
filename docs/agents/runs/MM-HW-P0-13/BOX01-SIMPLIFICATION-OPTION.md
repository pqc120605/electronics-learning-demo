Native chat: 01a1a853-d232-7460-8d00-3312362df34a
Turn: 01a1c42c-b081-7e63-84b9-4a8a5fd5d13e
Alternative product delta for Founder consideration only; not current scope or configuration.

**Đề xuất Founder xem xét một delta duy nhất: tay cầm không dây dùng 3 AA NiMH tháo rời, sạc ngoài, chuyển RUN → OFF → PROGRAM bằng liên động cơ khí thủ công.** Giữ ESP32 CH340 30 chân, G‑B 16 vai trò, đủ E1–E4 và robot Starter riêng. Phương án AA lịch sử chỉ là nguồn tham khảo; áp dụng phương án này cần quyết định mới của Founder.

P0‑13 xác nhận hai topology hiện tại chưa chứng minh được **actual capture** sau mất bias. Chuỗi H3 cũng còn thiếu cận MAX áp dụng. Vì vậy delta này cần thay nghĩa vụ kiến trúc tương ứng, thay vì tiếp tục tăng lực lò xo hoặc thêm mạch. [Feasibility cuối box08](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-13/BOX08-FEASIBILITY-FINAL.md) · [Proposal P0‑13](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-13-closure-proposal.md)

**Trình tự sử dụng đề xuất**

1. **RUN:** cassette 3 AA nối với bộ nguồn điều áp của carrier. Tay cầm gửi lệnh không dây. Cửa PROGRAM bị cassette chặn.
2. **OFF:** người dùng tắt và tháo cassette hoàn toàn khỏi đầu cấp nguồn. Cơ cấu chỉ mở lối PROGRAM sau khi cassette đã tách điện; đầu nối và dây pin được giữ cố định để tránh nối vòng.
3. **PROGRAM:** người dùng ngắt giắc giao diện carrier–B01 và rút phích RUN nội bộ, rồi cắm PC vào cùng cổng USB‑C B01. Giắc giao diện phải ngắt toàn bộ I/O, sense, pull-up và đường nguồn có thể cấp ngược. Cửa PROGRAM hoặc phích PC chặn lắp lại cassette.
4. **Trở về RUN:** rút PC, đóng khoang PROGRAM, nối lại giao diện rồi lắp cassette. Robot vẫn cần trình tự tái cho phép chủ động; việc nguồn trở lại không cấp quyền chạy.

Đây là yêu cầu cho một **liên động tĩnh có vị trí nguồn tách rõ**, chưa phải cơ cấu đã chứng minh. Trong PROGRAM, B01 có thể được PC cấp điện; carrier và khay pin phải được cách ly khỏi nguồn đó.

| Chức năng | Giữ hoặc thay trong delta |
|---|---|
| **Nguồn pin** | Thay Jauch bằng 3 AA NiMH đúng mã, tháo ra sạc ngoài. Đánh giá `BK‑3MCCE` từ hồ sơ AA cũ; chưa chọn BOM. LR6/R6P nằm ngoài phạm vi ban đầu. |
| **Nguồn RUN** | Bảo vệ đảo cực/quá dòng, ngắt pin yếu có hysteresis và bộ nguồn 5 V cho B01. TPS63070 là ứng viên có tài liệu hãng, dải vào 2–16 V; khả năng tải phải tính tại điện áp pin thực. Dòng switch 3,6 A không phải dòng đầu ra bảo đảm. [TI TPS63070](https://www.ti.com/product/TPS63070) |
| **Mode và I/O** | Liên động thủ công buộc tháo pin và ngắt giao diện trước PROGRAM. Giữ yêu cầu cách ly toàn bộ I/O. Cần chứng minh giắc ngắt đủ mọi đường cấp ngược và không thể thao tác đi vòng trong phạm vi được duyệt. |
| **MCU và điều khiển** | Giữ W software-only feed, hardware veto, fresh-arm, mất lệnh và không tự re-arm. G‑B16/E1–E4 được bảo toàn; chức năng quan sát phải được đối chiếu lại, chưa gán GPIO. |
| **Cơ khí** | Bỏ actuator nhả cassette có điện. Giữ các giới hạn tải hiện hành trừ khi Founder đổi rõ, nhưng phải phân bổ lại chúng cho cassette, khóa cửa và đầu nối thủ công. |

**Các quyết định cần Founder thay rõ**

- **Q2:** thay kiến trúc có cổng CHARGE và nhả cassette bằng điện bằng thao tác tháo pin/ngắt giao diện để vào PROGRAM.
- **Q3 và H3:** bỏ Jauch cùng sạc Li‑ion onboard khỏi tay cầm. `D17-H3-CV-PROTECTION` chỉ được ghi **superseded/N/A theo phạm vi mới sau phê duyệt**, không ghi PASS.
- **D17 actuator/direct-return và M‑A:** thay bằng gate liên động thủ công. Bỏ yêu cầu actuator thu hồi guard để bắt follower đang chuyển động.
- **Yêu cầu mất bias:** đề xuất cho phép tiếp tục thao tác thủ công **sau khi pin và mọi đường nối carrier–B01 đã tách vật lý**, kể cả khi carrier không còn bias. Trước điểm tách đó phải tiếp tục bị chặn. Đây là thay đổi thật so với nghĩa vụ “mất bias vẫn khóa” và cần Founder duyệt.
- **Định nghĩa OFF:** nếu vẫn bắt buộc rail xuống dưới ngưỡng trước khi mở cơ cấu, gate rail-discharge vẫn còn. Delta nên trình rõ OFF là **nguồn ngoài đã tách, I/O đã ngắt và năng lượng dư nằm trong cận an toàn đã review**. Không tự coi “rút pin” đồng nghĩa điện áp bằng không.

**Những chuỗi có thể bỏ khỏi tay cầm:** charger H3, NTC/timer/CV charging, reference/comparator bảo vệ quá áp sạc, hai barrier ngắt sạc và tụ dự trữ phục vụ witness H3; hai coil/driver/clamp nhả cassette, pulse timer và chuỗi capture ≤1 ms. Tụ nguồn, giám sát pin yếu, bảo vệ RUN và reset/veto vẫn phải có theo thiết kế mới. Các chuỗi sạc/bảo vệ của robot giữ phạm vi riêng.

**Gate còn lại trước B1**

- Xác định đúng mã cell, khay và đầu ghép; dải pin dưới tải, cell yếu nhất, UVLO, tải xung, hiệu suất và ngân sách toàn hệ thống.
- Chứng minh liên động **ngắt pin và giao diện trước khi PC có thể kết nối**, chặn lắp lại pin khi PROGRAM còn mở; xét cắm hờ, đảo thao tác, một chi tiết hỏng và dây nối vòng.
- Khép năng lượng dư, backfeed và trạng thái điện của từng đường khi một miền mất nguồn.
- Review lại OFF/MCU theo phạm vi mới. Không mang kết luận PASS hoặc exception từ topology cũ sang.
- Kiểm bao không gian, thao tác thay pin và BOM toàn bộ dưới **1 triệu đồng**. Hiện chưa có báo giá hợp nhất; tiết kiệm từ việc bỏ H3/actuator mới là lợi ích dự kiến.

**Đường tới B1 ngắn nhất:** Founder duyệt phạm vi delta này → box02/03 lập một dossier nguồn–giắc–liên động có cận → box08 review đúng snapshot → HQ chính thức supersede gate H3 và thay gate actuator bằng tiêu chí liên động mới → duyệt cấu hình/hash và tích hợp trust baseline trước preflight. Lượt mở lại nguồn Panasonic trả 403, nên mã NiMH hiện chỉ là ứng viên từ hồ sơ lịch sử, cần ghim tài liệu hãng trước khi khóa.

Phương án này bỏ hai chuỗi đang gây bế tắc, nhưng **chưa đủ căn cứ cam kết B1 ready**. Nếu Founder giữ nguyên yêu cầu nhả chỉ sau rail-qualified có điện và mất bias luôn giữ khóa, simplification thủ công này chưa giải được gate đó.
