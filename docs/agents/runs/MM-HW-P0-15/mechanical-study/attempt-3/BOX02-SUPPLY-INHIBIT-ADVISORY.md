Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c690-744e-7f90-b5d3-fbca31987696
Read-only source comparison; no approved cutoff or MPN.

**Chọn 2 × TPS22916CN làm candidate nghiên cứu cho hai inhibit nối tiếp; chưa nhận nó là bộ ngắt có deadline bảo đảm.** TPS22919 kém phù hợp hơn do thiếu cận reverse/backfeed trong PDF đã ghim. Điện áp pack tối thiểu, trạng thái khi rail trung gian sụp và thời gian ngắt vẫn là các điều kiện thiết kế chưa đóng.

Không sửa file, gán chân hoặc adopt MPN.

### 1. Đối chiếu nguồn local

| Hạng mục | TPS22916 | TPS22919 |
|---|---|---|
| PDF/revision | **SLVSDO5F, Dec-2021** | **SLVSEN5B, May-2019** |
| VIN hoạt động | 1–5,5 V | 1,6–5,5 V |
| Logic ON | HIGH ≥1 V; LOW ≤0,35 V | Tương tự |
| Shutdown | **100 nA MAX** cho bản active-high B/C/CN, VIN 1–5,5 V, −40…85°C, disabled, VOUT=GND | **800 nA MAX**, −40…125°C, disabled, VOUT=GND; không suy thành cận tại VIN 5,4 V |
| Quiescent enabled | **1 µA MAX**, theo bảng toàn miền VIN trên | **20 µA MAX**, theo điều kiện bảng |
| Reverse | Có RCB; reverse leakage ≤300 nA theo điều kiện bảng | Không có cận RCB tương đương trong PDF |
| QOD | CN không có; C/B: 150 Ω **TYP** | 24 Ω **TYP**, có thể không sử dụng |

Nguồn: [TPS22916, tr. 4–5, 17](/D:/StartupOS/electronics-learning-demo/docs/research/downloads/c11-r12/tps22916.pdf), [TPS22919, tr. 4–5, 13–14](/D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-11/tps22919.pdf).

Allocation pack tối đa 5,4 V nằm trong miền hoạt động, nhưng chỉ còn **0,1 V tới trần 5,5 V**. Đây chưa phải chứng minh biên transient hay OCV cell. Cả hai có absolute minimum VIN −0,3 V; **không thay bảo vệ đảo pack/cell**.

### 2. Cấu trúc hai inhibit

Proposal:

**nguồn đã bảo vệ → U_A → node giữa → U_B → nguồn monitor và LED**

- U_A nhận quyền A; U_B nhận quyền B.
- Mỗi ON có pull-down ngoài riêng; không dùng enable chung cưỡng bức cả hai ON.
- Nguồn logic always-on nằm trước chuỗi này.
- Sense vẫn đi qua hai bank riêng; nguồn monitor bị ngắt không thay các break sense.

| Lỗi đơn | Kết quả có thể giữ |
|---|---|
| ON_A kẹt HIGH | U_B còn quyền ngắt |
| ON_B kẹt HIGH | U_A còn quyền ngắt |
| U_A drain–source short | U_B còn phần tử ngắt |
| U_B drain–source short | U_A còn phần tử ngắt |
| Một node chung giữ cả hai ON HIGH | **Mất hai inhibit** |
| Nguồn/logic chung làm cả hai output không xác định | **Chưa được chứa bởi việc nhân đôi switch** |

Hai fault-domain phải độc lập ở **quyền điều khiển, đường reset/inhibit, driver và pull-down**. Hai IC nhận cùng một Q không tạo hai inhibit độc lập. Short enable sang pack cũng khác “enable HIGH hợp lệ”: nó có thể backfeed/hỏng rail AON nếu chưa có giới hạn và containment riêng.

### 3. Logic 1,8 V và mất bias

Một pull-down nghiên cứu **100 kΩ ±1%** mỗi ON:

- Tải khi HIGH tối đa khoảng **18,2 µA** tại 1,8 V, chưa cộng leakage.
- Để giữ ON ≤0,35 V khi driver mất nguồn, tổng dòng có thể bơm vào node phải **≤3,46 µA**.
- Cận đó phải bao gồm driver unpowered, coupling và backfeed; không chỉ leakage của switch.

Smart pulldown nội **không phải điện trở bảo đảm luôn nối**: nó bị ngắt sau khi ON được đưa HIGH. Không dùng 750 kΩ/530 kΩ TYP để chứng minh mất logic bias sẽ OFF.

### 4. Reverse và rail trung gian

TPS22916 có RCB nhưng:

- Activation khoảng −500 mA và response 10 µs là **TYP**, không phải cận bảo vệ tuyệt đối.
- Khi mắc nối tiếp và U_A OFF, VIN của U_B có thể xuống dưới 1 V. Không áp bảng hoạt động 1–5,5 V cho trạng thái đó.
- Nếu output còn điện trong khi node giữa thấp, phải xét điều kiện RCB cùng dòng từ ON/driver; không gọi output đã cách ly chỉ vì enable LOW.

Vì vậy **không cộng đơn giản 2 × 100 nA thành dòng OFF toàn chuỗi**. Cận shutdown có điều kiện VOUT=GND, trong khi node giữa và output thực có capacitor, bleed và các đường bơm dòng khác.

Các khoản phải tách riêng:

1. Dòng vào VIN hai load switch.
2. Dòng cấp AON/driver.
3. Dòng qua sense OFF.
4. Reverse/backfeed.
5. Dòng bleed khi RUN và năng lượng capacitor sau trip.

### 5. Timing và discharge

| Thông số | Cận trong PDF |
|---|---|
| TPS22916CN turn-off | 5 µs tại VIN 3,6/5 V; 10–25 µs ở điện áp thấp hơn — **TYP**, tr. 7 |
| TPS22916 RCB response | 10 µs — **TYP**, tr. 5 |
| TPS22919 turn-off | 6 µs — **TYP**, tr. 5 |
| QOD hai họ | Điện trở **TYP**, không có MAX để ký RC worst-case |

Do đó chọn **CN không QOD + bleed ngoài** để việc xả không phụ thuộc độ mạnh QOD khi rail sụp. Điều này vẫn không tạo MAX thời gian pass-FET mở.

Sau khi nguồn đã được ngắt, cận discharge có thể tính bằng:

\[
V_\infty=I_{\rm inj,max}R_{\max}
\]

\[
t=R_{\max}C_{\max}
\ln\frac{V_0-V_\infty}{V_{\rm target}-V_\infty}
\]

Ví dụ **allocation**, chưa phải cận mạch đã chứng minh: R=10 kΩ±1%, C≤120 µF, tổng injection≤1 µA, V₀≤5,4 V. Khi đó \(V_\infty≤10,1\) mV và xuống 0,1 V trong khoảng **4,962 s**, tính từ lúc nguồn đã ngắt. Bleed tiêu thụ tối đa khoảng **0,546 mA** tại 5,4 V trong RUN.

Không được dùng ví dụ này nếu chưa kiểm kê toàn bộ C và chứng minh injection≤1 µA.

### 6. Disposition

Proposal nghiên cứu bổ sung tối thiểu **2 load-switch IC, 2 pull-down riêng và bleed cuối rail**. Nếu thêm bleed node giữa, phải tính cả tải RUN và trạng thái một switch short. Đây chưa là BOM đầy đủ.

**Có cơ sở giữ TPS22916CN để nghiên cứu điện áp/logic và cut-set; chưa đủ ký bảo vệ hữu hạn.** Delta chức năng còn cần là:

- MAX thời gian nguồn bị ngắt, hoặc một đường inhibit khác có MAX phù hợp;
- cận unpowered/backfeed khi VIN switch thứ hai xuống dưới miền hoạt động;
- hai quyền inhibit không bị một lỗi chung cưỡng bức ON;
- ngân sách injection/capacitance để xả rail có cận.

Đó là phần kỹ sư còn phải đóng; chưa cần Founder chọn MPN/storage, mở rail, đổi GPIO hay cung cấp phép đo.
