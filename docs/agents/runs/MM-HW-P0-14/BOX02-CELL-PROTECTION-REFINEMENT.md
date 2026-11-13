Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c508-4029-7660-80c0-da589c758aef
Read-only advisory; sources below are not locally pinned by this response; no design approval.

**MM-HW-P0-14: giữ phương án B làm candidate nghiên cứu; chưa đủ bằng chứng để chuyển sang schematic.** Phương án A có phản ví dụ tap-open; B giải quyết được trường hợp đó về đại số nhưng còn lỗi dòng bias và nguồn duy trì sau cutoff.

| Kiến trúc | Kết quả |
|---|---|
| **A — đo ba điện áp vi sai qua bốn tap dùng chung** | Loại cấu hình đơn giản chưa có chẩn đoán open-wire. Hai cell thực tế 0,9 V và 1,5 V có tổng 2,4 V; tap giữa bị hở, mạng điện trở đối xứng có thể báo 1,2 V cho cả hai, che cell yếu. |
| **B — hai dây sense độc lập/cell, bias về trạng thái lỗi, comparator và latch phần cứng** | Giữ làm candidate. Sáu dây sense phải được tính đầy đủ trong cassette và cơ cấu ngắt. Không dùng thêm GPIO. |

Với B, xét mô hình lý tưởng trên miền thiết kế **tap 0…5,4 V, nguồn monitor \(V_S=4,75…5,25\) V**:

\[
P=H/2,\quad N=(L+V_S)/2,\quad D=P-N+V_S/2=V_\text{cell}/2
\]

Dây H hở kéo P về 0; dây L hở kéo N về \(V_S\). Với L hở, \(D\le(5,4-4,75)/2=0,325\) V, thấp hơn ngưỡng mục tiêu 0,55 V. Đây là kết quả đại số; clamp, saturation và miền common-mode vẫn phải chứng minh cho mạch thực.

Candidate detector là **ba TPS3700, dùng INA**, nối vào latch lỗi phần cứng. Với hệ số chia \(\beta=0,715455\), cận falling 387…400 mV tương ứng **1,0818…1,1182 V/cell**, *chưa cộng sai số front-end*. Khoảng còn lại tới yêu cầu 1,05…1,15 V là khoảng **31,8 mV mỗi phía**. Startup tối đa 450 µs; propagation 18 µs chỉ là typical, không dùng làm cận ngắt bảo đảm. [TI TPS3700, SBVS187G, tr. 6–7](https://www.ti.com/lit/ds/symlink/tps3700.pdf)

Candidate front-end là **OPA4192/OPA2192**, tổng mười amplifier. Datasheet cho nguồn 4,5…8 V, bias tối đa ±5 nA và dòng tĩnh tối đa 1,5 mA/amplifier toàn dải nhiệt. Tuy nhiên vùng chuyển common-mode có phần chỉ dẫn sang đặc tính typical; chưa thể ký ngân sách sai số toàn miền bằng thông số offset ở một điểm đo. [TI OPAx192, SBOS620E, tr. 10–11](https://www.ti.com/lit/ds/symlink/opa4192.pdf)

Các cận và phản ví dụ cần giữ nguyên trong handoff:

- **Giới hạn dòng sense:** hai điện trở 50 kΩ ±0,1% nối tiếp, đặt sát nguồn tap, cho tối đa khoảng **108,1 µA** khi một điện trở bị short và đầu dây còn lại chạm 0 V tại tap 5,4 V. Đoạn trước điện trở vẫn cần bảo vệ cơ khí.
- **Bias có thể đưa dòng vào tap:** nhánh kéo lên có thể cấp khoảng **26,3 µA**. Vì vậy không được mô tả topology này là hoàn toàn không có dòng nạp/redistribution giữa các cell.
- **Cutoff tải chính chưa đủ:** monitor có thể tiêu thụ tới **15 mA**, chưa kể mạng điện trở và logic. Nếu nó tiếp tục chạy sau trip, cell yếu vẫn bị xả. Cần cơ chế ngắt cả nguồn monitor và giữ OFF đến thao tác tái khởi động có kiểm soát.
- **Fuse mở không bảo đảm mọi đường đã ngắt:** các dây sense có thể tạo đường bypass nhỏ. Phải phân tích cả fuse-open, mất nguồn monitor và partial engagement.
- **Đảo cell hoặc short đột ngột:** không được suy từ công thức điện áp âm rằng comparator chắc chắn báo lỗi; phải chứng minh clamp, common-mode và trạng thái mặc định. Short cần bảo vệ dòng riêng.

Trước schematic, cần đóng bốn nghĩa vụ: ngân sách sai số bảo đảm; miền lỗi/clamp và reverse; cutoff mặc định OFF kể cả mất nguồn; phối hợp fuse–dây–holder cùng đường sense bypass. Startup phải cấp nguồn kiểm tra trong thời gian hữu hạn, giữ tải bị inhibit và không phụ thuộc WDI để tự khởi động.

Sau đó mới qualification bằng cell cùng loại/cùng tình trạng, RF sag, nhiệt, tiếp xúc holder và lỗi cell yếu hữu hạn. Mixed chemistry vẫn unsupported; không yêu cầu “zero reversal tức thời”. Contact resistance và dây 24 AWG của holder không chứng minh ampacity toàn bộ holder. **D10 không mở rộng; chưa có pin assignment, schematic hay hardware validation.**
