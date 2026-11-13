Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c567-1a3c-70a3-83f1-8d4bc0302084
Read-only advisory; not configuration approval.

**P0-15: giữ hướng A với bộ nhớ lỗi luôn có nguồn ở mức µA làm phương án nghiên cứu ưu tiên.** Tụ tạo cạnh đơn thuần chưa giải quyết được mất nguồn/rebound. **BQ77915 không có biến thể được tài liệu hiện tại chứng minh phù hợp với 3AA NiMH.** Chưa có topology hoàn chỉnh để nhận hoặc chuyển sang schematic.

Đã đọc task attempt-2 và hai kết quả Box02 trước. Không ghi file hay thay cấu hình.

**A — nguồn monitor đóng theo phiên START, bộ nhớ tách khỏi rail monitor**

Phân tích cạnh tụ cho thấy hai phản ví dụ:

- START giữ nguyên trong lúc nguồn monitor sụp: diode clamp và điện trở xả có thể đưa tụ về trạng thái tạo được xung mới khi rail hồi phục.
- START lấy từ battery rail: mất tiếp xúc rồi nối lại khi nút vẫn giữ tạo một bước điện áp mới. Tụ không phân biệt được bước đó với thao tác nhấn mới.

Vì vậy, **tụ chỉ tạo xung; nó không chứng minh “phải nhả START mới được reset”**.

Phương án có thể tiếp tục là một khối nhớ luôn cấp từ **toàn pack**, trước cutoff tải/monitor. Nó cần giữ các quy tắc sau:

| Tình huống | Hành vi cần thiết |
|---|---|
| Cắm pin/POR/brownout | Tải và monitor OFF; chưa cho phép START. |
| START đang giữ khi nguồn trở lại | Tiếp tục OFF đến khi thực sự thấy START được nhả. |
| Nhả rồi nhấn START | Cho đúng một phiên kiểm hữu hạn; tải vẫn OFF. |
| Fault hoặc hết thời gian trong startup | Hủy phiên, khóa OFF; không cấp B01 để “thử tiếp”. |
| Healthy được xác nhận | Cho RUN; tiếp tục giám sát trong RUN. |
| Trip trong RUN | Ngắt tải và nguồn monitor, thu hồi quyền khởi động; giữ nút không tái khởi động. |

**Candidate linh kiện cho phần nhớ, chưa phải toàn bộ topology:** hai **SN74AUP1G74DCUR**, VSSOP-8. TI **SCES644D, Dec-2015**, tr. 6: mỗi IC có \(I_{CC}\le0,9\,µA\), −40…85°C, nguồn 0,8–3,6 V và inputs ở rail. Hai IC đóng góp tối đa **1,8 µA tiền dòng tĩnh**, chưa gồm input leakage, tải đầu ra hoặc mạch khác. Không nối trực tiếp vào pack có thể vượt 3,6 V. [TI SN74AUP1G74 PDF](https://www.ti.com/lit/ds/symlink/sn74aup1g74.pdf)

**TPS7A0218PDBVR** là candidate rail 1,8 V: TI **SBVS277C, Sep-2022**, tr. 5–7, VIN 1,5–6 V. Ground current MAX 60 nA đến 85°C có điều kiện **không tải**; không cộng nó vào 1,8 µA rồi gọi là tổng được bảo đảm. [TI TPS7A02 PDF](https://www.ti.com/lit/ds/symlink/tps7a02.pdf)

Những phần **chưa khép**:

- POR/brownout và logic “đã quan sát nhả START” chưa được ánh xạ thành chuỗi linh kiện có timing đầy đủ.
- Front-end phải đo từng cell, phát **active-health mặc định OFF**; đo tổng pack không bảo vệ được cell yếu.
- Trip phải ngắt cả đường sense/bias có thể vượt cutoff. Chỉ tắt nguồn 5 V chưa bảo đảm input protection diode không tiếp tục lấy dòng từ tap.
- Startup timer, cutoff và front-end chưa có MAX tổng thời gian/dòng. **Idle/off tổng vẫn TBD**, không dùng dòng của hai flip-flop thay cho tổng hệ thống.

Đây là thiếu sót thiết kế Codex còn làm được; chưa cần Founder cung cấp số đo hoặc quyết định linh kiện.

**B — autonomous AFE: BQ77915**

Nguồn hãng: **SLUSCU0L, Aug-2023**, PDF. Bảng tr. 3 có UV thấp nhất **1,8 V/cell** ở BQ7791513; không có variant UV 1,2 V trong bảng. Dải factory-programmable 1,2–3 V không chứng minh có MPN mua được cho 1,2 V. Tr. 7 có mức POR tới **4 V**; vì vậy pack 3,6 V không có bảo đảm cold-start. [TI BQ77915 PDF](https://www.ti.com/lit/ds/symlink/bq77915.pdf)

**Phản ví dụ quyết định:** ba NiMH đang ở 1,2 V/cell, tổng 3,6 V, vẫn là tình huống vận hành cần xét; variant UV 1,8 V coi cả ba cell undervoltage. Nới allocation 1,05–1,15 V lên 1,2 V cũng không sửa được variant và cold-start.

Dòng fault MAX **15 µA**, shutdown MAX **0,5 µA** có điều kiện; **UV fault không đồng nghĩa shutdown**. Open-wire có delay MAX **5,3 s**. Load-removal recovery không tự chứng minh reset bằng thao tác tay. Miền input cell khuyến nghị 0–5 V không phải bảo đảm chịu cell đảo. [TI BQ77915, tr. 6–9, 31](https://www.ti.com/lit/ds/symlink/bq77915.pdf)

Do hai bất tương thích cơ bản trên, không tiếp tục ghép BQ77915 vào thiết kế và không đề xuất đổi chemistry/số cell.

**Delta sản phẩm thực sự còn để Founder quyết định sau khi có số liệu:** chấp nhận nguồn nhớ luôn tiêu thụ một lượng nhỏ khi pin còn lắp, hay yêu cầu tháo/ngắt cassette để lưu kho. Mỗi **1 µA** được chứng minh tương ứng **0,024 mAh/ngày**, khoảng **0,72 mAh/30 ngày** đi qua mỗi cell trong chuỗi. Đây là hệ số tính toán, không phải thời hạn lưu kho hoặc hardgate mới.

Hướng A có tiến triển về cách giữ lỗi qua cutoff; phần bảo vệ cell, sense isolation và ngân sách dòng/timing vẫn chưa đủ. D10 và các gate hiện hành giữ nguyên.
