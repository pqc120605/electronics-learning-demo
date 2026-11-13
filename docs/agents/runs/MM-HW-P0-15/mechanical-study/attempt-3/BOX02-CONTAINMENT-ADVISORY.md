Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c685-37a2-76a1-9302-91b7e38a24f2
Read-only advisory, not approved hardware topology or product configuration.

**Đề xuất tiếp tục A: hai switch nối tiếp trên mỗi sense, chia thành hai bank điều khiển độc lập.** Cut-set này loại đường xả 44,45 µA khi **một switch sense** kẹt ON. Floating island B cũng chịu được một switch biên kẹt ON, nhưng nhạy hơn với lỗi enable làm nhiều sense cùng đóng. Cả hai còn cần ngắt nguồn monitor/LED; containment sense không đồng nghĩa toàn hệ thống đã ngừng xả pin.

Không adopt MPN/hash, không tạo schematic hoặc sửa file.

### 1. Miền và conductor phải đưa vào mô hình

Dùng AQY212EH đã ghim làm **candidate phân tích**, không gọi OFF là cách ly tuyệt đối.

| Nhóm đường | A — hai break/sense | B — floating island |
|---|---|---|
| Sáu sense H/L | Mỗi dây qua \(A_i\) rồi \(B_i\); không dùng chung một dây tap giữa hai cell | Mỗi dây qua một switch biên |
| Supply monitor + | Qua cutoff nguồn riêng; không nối từ tap phụ | Một đường biên phải ngắt |
| Ground/return monitor | Có thể chung BAT0; vì thế mọi sense cần hai break | Một đường biên phải ngắt; không nối BAT0 ở chỗ khác |
| Reference | Nằm phía monitor, sau các switch sense | Hoàn toàn trong island |
| Test supply, test return, clamp | Đều ở phía monitor; không clamp về battery-side trước switch | Hoàn toàn trong island |
| Output healthy | Có thể về logic chung, nhưng không có nhánh trực tiếp tới tap | Phải qua optical barrier; không mang ground qua |
| Control switch | LED/driver ở miền controller; output PhotoMOS ở sense | LED/driver ở ngoài island; không có conductor control chạy xuyên barrier |
| Debug, shield, mounting metal | Không được tạo đường mới tới tap | Không được nối island về controller/battery |
| Sense guard | Đặt sát nguồn tap, trước conductor dài | Tương tự |

B phải có **8 đường biên dẫn điện được ngắt**: 6 sense + supply + return. Output optical không phải đường dẫn kim loại qua biên. Mọi test/reference/control có dây xuyên thêm đều làm thay đổi con số này.

### 2. Cut-set trong OFF

**A:** đường sense \(i\) dẫn khi:

\[
C_i=A_i\land B_i
\]

Trong OFF, hai bank đều mở. Nếu \(A_i\) kẹt ON, \(B_i\) vẫn chặn đường tap → INA152 → Ref/BAT0. Vì thế phản ví dụ 44,45 µA không còn là đường dẫn nominal; nó trở thành đường có switch OFF và leakage.

Một bank driver kẹt HIGH làm sáu switch của bank đó đóng, **bank kia vẫn ngắt cả sáu dây**. Điều này chỉ đúng nếu không có một node enable chung có thể cưỡng bức cả hai bank ON.

**B:** gọi tám switch biên là \(E_1…E_8\). Khi tất cả OFF, island không có đường DC nominal ra ngoài. Một switch kẹt ON chỉ nối island với một node ngoài; chưa tạo vòng dòng nominal nếu mọi đường khác thực sự đã ngắt.

Nhưng **hai đường biên dẫn tới hai điện thế khác nhau có thể tạo vòng dòng**. Ví dụ bank sáu sense cùng kẹt ON, dù supply và return đã mở:

\[
BAT1\rightarrow80kΩ\rightarrow Ref_{\rm island}
\rightarrow80kΩ\rightarrow BAT3
\]

Với chênh áp 2,4 V và hai guard 998 Ω, dòng nominal khoảng **14,82 µA**. Reference “floating” vẫn nối các nhánh điện trở với nhau. Vì vậy **ngắt nguồn/ground không bù được lỗi nhiều sense cùng đóng**.

### 3. Bảng lỗi

| Lỗi | A | B |
|---|---|---|
| Một switch sense kẹt ON | Break nối tiếp còn lại giữ containment | Một tiếp xúc ngoài duy nhất chưa tạo vòng nominal |
| Một switch supply/return kẹt ON | Phải xét cutoff nguồn riêng; không được lấy kết quả sense thay cho kết quả nguồn | Các đường biên khác mở thì chưa có vòng nominal |
| Một bank sense enable HIGH | Bank sense còn lại vẫn chặn | Nhiều tap được nối vào mạng island: có phản ví dụ 14,82 µA |
| Enable chung cưỡng bức mọi switch HIGH | **Không đạt** | **Không đạt** |
| Mất bias/nguồn LED | Phải làm dòng LED về trạng thái tắt; không chỉ để gate driver floating | Tương tự; output healthy cũng phải mất freshness |
| Fuse mở | Không còn tải qua fuse; core trước fuse vẫn tiêu thụ. Sense chỉ còn leakage nếu bank OFF | Phải mở cả supply, return và sense; không coi fuse mở là island đã floating |
| Cell đảo | PhotoMOS hai chiều không tự bảo vệ INA152 trong CHECK/RUN | Tương tự; floating sau trip không sửa lỗi trong lúc đo |

Đây là kết quả đường dẫn, **không phải chứng minh mọi lỗi chung của logic, PCB hoặc nguồn bias đã được chứa**.

### 4. Số lượng và cận điện có điều kiện

Theo **Panasonic ASCTB126E 202204**, printed tr. 2: tại điều kiện bảng 25°C, AQY212EH có \(R_{\rm ON,max}=2,5Ω\), leakage OFF MAX 1 µA, turn-off MAX 1 ms. Printed tr. 3 ghi LED khuyến nghị **5–30 mA**. Không biến các số này thành cận toàn nhiệt. [PDF Panasonic đã ghim](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf)

| Hạng mục | A | B dùng cùng loại switch cho tám đường biên |
|---|---:|---:|
| PhotoMOS ngắt biên | 12 | 8 |
| Optical output healthy | Không bắt buộc vì chung miền logic | Ít nhất 1 |
| Tổng PhotoMOS tối thiểu trong phép so sánh | **12** | **9** |
| LED biên dẫn liên tục | 12 | 8 |
| Tổng dòng LED biên nếu mỗi LED 5–30 mA | **60–360 mA** | **40–240 mA** |
| B khi healthy-output LED đang ON | — | **45–270 mA** tổng |
| Điện trở ON mỗi sense | ≤5 Ω theo điều kiện bảng | ≤2,5 Ω theo điều kiện bảng |

Đây là **tổng dòng các nhánh LED**, chưa quy đổi thành dòng pin qua converter.

Với A, hai switch OFF nối tiếp **không làm leakage giảm một nửa**. Dùng cận bảo thủ 1 µA cho mỗi đường sense, tổng sáu đường là **≤6 µA tại điều kiện bảng**, kể cả một switch sense kẹt ON. Chưa gồm dòng qua isolation barrier, core, nguồn monitor hoặc các đường khác.

Với B, có thể dùng tổng bảo thủ **8 µA cho tám boundary switches** tại cùng điều kiện, trước khi xét lỗi nhiều switch cùng ON và các đường ngoài danh sách.

Điện trở 5 Ω của A bằng 0,015625% của 32 kΩ, nhưng đây chỉ là tỷ lệ điện trở; **không phải sai số toàn phép đo**. Guard, mismatch giữa hai nhánh, Ref và clamp vẫn phải nằm trong phép tính INA152.

Ba INA152 vẫn cần ở cả hai phương án. Không đưa ra “tổng IC hoàn chỉnh”: driver LED, cutoff nguồn, timer/freshness và mạch kiểm tra chưa được ánh xạ đủ; đếm chúng như đã tồn tại sẽ tạo MBOM giả.

### 5. Nguồn LED/monitor là containment riêng cần bổ sung

Nếu một bank driver của A kẹt ON và nguồn LED vẫn sống sau trip, sáu LED có thể tiếp tục tiêu thụ **30–180 mA**, dù các sense đã được bank kia ngắt. Do đó A chỉ giải quyết đường tap, chưa giải quyết toàn bộ xả pin.

Proposal A cần bổ sung:

- Hai chức năng inhibit độc lập cho nguồn monitor và nguồn cấp các bank LED.
- Driver điều khiển cutoff đặt ở miền always-on, không phụ thuộc rail mà chính nó ngắt.
- Một lỗi driver bank HIGH phải được chức năng ngắt nguồn còn lại dừng cấp dòng LED.
- Một lỗi cutoff nguồn kẹt ON phải còn các driver LED OFF và các break sense hoạt động.
- Thời gian tắt phải gồm xả năng lượng rail LED; không lấy riêng 1 ms của PhotoMOS làm tổng thời gian.

**Loại linh kiện/cận cho cutoff nguồn chưa được chọn trong nguồn đã ghim.** Đây là phần tử kiến trúc cụ thể còn thiếu, không phải một giá trị timing có thể điền tùy ý. INA152 settling vẫn là TYP; cut-set mới không khép được deadline đo. [TI INA152 SBOS184, tr. 2–3](https://www.ti.com/lit/ds/symlink/ina152.pdf)

### 6. Chọn proposal nghiên cứu

**Chọn A để lead lập mô hình cut-set độc lập**, vì:

- Tính chịu lỗi một switch sense được thể hiện trực tiếp trên từng conductor.
- Một bank enable HIGH vẫn còn một bank đầy đủ chặn sáu sense.
- Không phải thêm một miền floating với supply, return, output và debug đều cần cách ly.

Điều kiện để tiếp tục A là **hai bank không có common override cưỡng bức ON**, và bổ sung containment nguồn LED/monitor như trên. Nếu vẫn dùng một enable chung hoặc để nguồn LED sống vô hạn khi driver kẹt HIGH, proposal không đạt mục tiêu sau trip.

Chưa cần Founder chọn storage, MPN hoặc cung cấp phép đo. Phần tiếp theo là việc kỹ sư: ánh xạ hai đường inhibit, kiểm đường nguồn/return thực và tính ngân sách dòng–thời gian; chưa thay chemistry, GPIO, D10 hoặc gate.
