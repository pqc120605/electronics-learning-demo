Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c674-e8e1-7a01-b878-4b7c34da1bf5
Read-only advisory; conditional analysis, not topology adoption or physical proof.

**Kết quả lượt này: phép thử active open-wire có miền phân biệt khả thi trong mô hình tuyến tính, nhưng proposal “INA152 + một PhotoMOS mỗi sense” chưa đủ để nhận topology.** Có phản ví dụ cụ thể với một PhotoMOS kẹt ON; đồng thời nguồn hãng chưa cho MAX settling cần để ký deadline bảo vệ.

Hai PDF INA152/Panasonic local vẫn khớp SHA-256 trong manifest HQ. Không sửa file hoặc tạo artifact phần cứng.

### 1. Kích thích thử được tính

Candidate phân tích cho **sáu dây sense độc lập**:

- Mỗi dây có hai điện trở giới hạn sát tap: **2 × 499 Ω, ±0,1%**.
- Sau PhotoMOS, từng đầu vào được thử lần lượt qua **100 kΩ ±0,1%**, nối tới 0 V rồi nguồn thử 4,75–5,25 V.
- Chỉ thử một dây mỗi lần; kết thúc phải ngắt kích thích và đo baseline lại.
- Đây là giá trị nghiên cứu, chưa chọn MPN hoặc phê duyệt mạng điện trở.

Dòng từ nguồn kích thích bị giới hạn khoảng **54,1 µA** trong miền chênh áp tối đa 5,4 V. Nếu một điện trở guard bị short, điện trở còn lại giới hạn khoảng **10,83 mA** tại 5,4 V. Các cận này không bảo vệ đoạn conductor trước điện trở.

Với INA152 chuẩn, Ref = 0, đặt \(R\) là điện trở nội tương ứng, \(R_T\) là điện trở thử và \(T\) là mức kích thích:

| Dây hở | Output lý tưởng trước saturation |
|---|---|
| H của cell 1/2/3 | \(Y_H(T)=2RT/(R_T+2R)-L\) |
| L của cell 1/2/3 | \(Y_L(T)=\frac H2\frac{R_T+2R}{R_T+R}-\frac{R}{R_T+R}T\) |

Điện trở nội có nominal 40 kΩ, absolute tolerance ±20%; không được dùng nominal làm cận. [TI INA152, SBOS184, tr. 1–2](https://www.ti.com/lit/ds/symlink/ina152.pdf)

Các kết quả **có điều kiện**:

- Hở H: bước kích thích tạo thay đổi tuyến tính ít nhất **1,853 V** trước clipping.
- Hở L: thay đổi ít nhất **1,151 V** trước clipping.
- Với đường healthy có trở nguồn hiệu dụng mỗi đầu vào ≤2 kΩ, cận bảo thủ thay đổi vi sai là **0,207 V**, chưa cộng sai số analog.

Điều kiện ≤2 kΩ là miền phân tích, **không phải DCIR MAX đã được FDK bảo đảm**. Trở nguồn cao hơn có thể bị loại như lỗi; không được tự coi đó là cell hỗ trợ.

### 2. Saturation và cell đảo ngăn kết luận “đã phân biệt đủ sáu dây”

Không thể lấy hai biên độ tuyến tính trên làm threshold chẩn đoán trực tiếp:

- **H hở ở tap cao:** hai kết quả có thể cùng nằm dưới rail. Baseline thường đã báo UV; phải kết hợp baseline với phép thử, không yêu cầu riêng biên độ luôn lớn.
- **L hở:** baseline \(H/2\) có thể giả healthy. Phép thử hai mức khắc phục được về đại số, nhưng biên độ sau clipping cần cận output thực tại đúng nguồn, Ref, tải và nhiệt.
- **Cell đảo:** với Ref = 0, cell đầu đảo có thể đưa đầu vào H xuống âm. Không được áp cận common-mode của bảng **5 V, Ref = VS/2** sang cấu hình này rồi suy output chắc chắn LOW.

Delta kỹ thuật đáng xét là **Ref = VS/2**, đo \(Y-Ref\), dùng cả cửa sổ hợp lệ và phép thử. Nó chuyển phép đo cell đảo khỏi yêu cầu output âm và gần điều kiện bảng 5 V hơn. Tuy nhiên phép thử H-hở cũng đổi theo Ref; **không được giữ nguyên các threshold vừa tính**. Đây là thay đổi front-end cần tính lại, chưa phải thiết kế đã khép.

### 3. Timing/freshness: phần nào tính được, phần nào nguồn chưa bảo đảm

Nếu phân bổ tổng điện dung mỗi test node **≤1 nF**, mạng thụ động cho:

\[
\tau_{\max}=(100,1kΩ\parallel96kΩ)\,1nF=49,01\,µs
\]

Settling RC tới 0,1% cần tối đa **338,6 µs** trong mô hình đó. Đây chưa gồm INA152, comparator và logic.

INA152 nêu settling 23/25 µs và overload recovery 5 µs dưới cột **TYP**, không phải MAX. Vì thế không thể chọn một slot 1 ms hay 5 ms rồi gọi là deadline được hãng bảo đảm. Dòng 650 µA cũng thuộc điều kiện bảng ±10 V, không phải cận tổng ở nguồn 5 V. [TI INA152, tr. 2–3](https://www.ti.com/lit/ds/symlink/ina152.pdf)

Với ba kênh đo song song, một baseline và hai mức thử cho sáu dây cần ít nhất **13 slot**. Quan hệ thiết kế phải là:

\[
T_{\rm frame,max}=T_{\rm isolation,on,max}+13T_{\rm slot,max}
\]

\[
T_{\rm fault,max}\le T_{\rm freshness,max}+T_{\rm cutoff,max}
\]

Token healthy chỉ được gia hạn sau **toàn bộ frame hợp lệ**, không bởi oscillator đang chạy. Hiện chưa có cận đầy đủ để gán số cho hai phương trình này.

### 4. Một PhotoMOS kẹt ON: phản ví dụ sau cutoff

Giả sử PhotoMOS ở dây H của cell trên kẹt dẫn, các switch khác mở, nguồn monitor tắt nhưng ground/Ref còn nối BAT0. Vẫn tồn tại đường thụ động:

**tap H → guard → điện trở đầu vào INA152 → điện trở về Ref → BAT0.**

Tại H = 3,6 V và điện trở nominal:

\[
I=\frac{3,6}{80k+998}=44,45\,µA
\]

Tương đương **1,067 mAh/ngày** đi qua chuỗi pin. Đường này không cần op-amp được cấp nguồn; clamp bên trong có thể tạo thêm đường dòng. Đây là phản ví dụ đối với tuyên bố “tắt monitor thì sense không vượt cutoff”.

Panasonic **ASCTB126E 202204**: printed tr. 2 cho off leakage MAX 1 µA, turn-off MAX 1 ms tại điều kiện bảng 25°C. Printed tr. 3 ghi LED khuyến nghị **5–30 mA**, đúng như HQ đính chính. Không dùng các số đó thành cận toàn nhiệt. [Panasonic catalog](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf)

### 5. Delta kiến trúc cần thiết

Để loại phản ví dụ stuck-ON, phải thay ít nhất một phần cấu trúc:

- **Hai phần tử ngắt nối tiếp mỗi sense**, có điều khiển và kiểm tra phù hợp; hoặc
- **Monitor island thực sự floating sau trip**, ngắt cả supply, return/reference và mọi đường điều khiển/output có thể làm return.

Chỉ thêm timer, sửa threshold hoặc chọn PhotoMOS leakage thấp hơn **không loại đường dẫn khi switch kẹt ON**.

**Kỹ sư còn tự xử lý được:** tính lại front-end Ref giữa rail, chọn phương pháp có settling MAX phù hợp, thiết kế phép thử/chẩn đoán và containment đường sense. Không cần Founder cung cấp phép đo chưa được phép.

**Chưa cần Founder chọn MPN hay thời hạn lưu kho.** Khi có hai phương án containment với dòng, BOM và fit cụ thể, mới trình đánh đổi về tiêu thụ/chi phí hoặc thao tác ngắt cassette. Lượt này cung cấp được phép thử định lượng và phản ví dụ kiến trúc; chưa đủ cơ sở nhận topology hoặc đổi gate.
