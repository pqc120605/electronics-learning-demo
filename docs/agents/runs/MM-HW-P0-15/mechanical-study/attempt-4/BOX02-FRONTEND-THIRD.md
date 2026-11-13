# Box 02 — raw advisory result

Chat: 01a1a854-2163-70f2-a167-db281ef2ad08; turn: 01a1c6ba-eed8-72a2-a85b-ec12bc52d9f7

**Đại số của lead đúng.** Tỷ lệ 1/3 giữ input trong miền dương khi xét một cell đảo theo allocation −1,8…5,4 V. Đánh đổi là offset, hysteresis và lỗi bias của comparator quy đổi về cell với hệ số **3**; mạng 200 kΩ/100 kΩ cần ngân sách bias chặt.

### Đại số và common-mode

Đặt \(P=V_+\), \(N=V_-\):

\[
P=\frac{H+2V_L}{3},\qquad N=\frac{L+2V_H}{3}
\]

\[
P-N=\frac{V_{\rm cell}-2(V_H-V_L)}3
\]

Với \(V_L=1,25V,\ V_H=1,80V\), ngưỡng lý tưởng là **1,10 V/cell**.

| Node | Tap −1,8…5,4 V, reference lý tưởng |
|---|---:|
| P | **0,2333…2,6333 V** |
| N | **0,6000…3,0000 V** |

Ở rail 3,3 V, khoảng cách nhỏ nhất tới rail trên là **0,3 V**. Phải trừ tolerance reference, divider và rail; không suy từ nominal 3,3 V rằng còn đủ margin.

Không bắt buộc thêm rail 3,3 V: mạng này cũng có thể chạy comparator từ rail monitor 5 V hiện có. Việc chọn rail và level translation về AON 1,8 V vẫn cần được ghi rõ.

### Guard 998 Ω phải nằm trong tỷ lệ

Nếu dùng nguyên Rtap=200 kΩ rồi cộng guard 998 Ω:

\[
V_{\rm trip}=\frac{200998}{100000}(1,80-1,25)
=\mathbf{1,105489V}
\]

Muốn giữ nominal 1,10 V thì **tổng arm tap**, gồm guard, conductor và switch ON, phải là 200 kΩ. Không chỉ lấy resistor chính bằng 200 kΩ.

### Ngân sách sai số DC

Với mỗi arm tổng có tolerance ±\(t\):

\[
a=\frac{R_{\rm ref}}{R_{\rm tap}+R_{\rm ref}},\quad
\frac{1-t}{3+t}\le a\le\frac{1+t}{3-t}
\]

Trong miền normal quanh threshold \(H≤5,4V,\ L≤4,35V\):

| Phân bổ | Lỗi quy đổi về cell |
|---|---:|
| Mỗi arm tổng ±0,1% | **≤8,937 mV** |
| Mỗi arm tổng ±0,01% | **≤0,894 mV** |
| Mỗi reference ±0,5 mV | Khoảng **≤2,001 mV** |

Đây là **allocation toàn miền**, không phải tolerance linh kiện đã chọn.

Với arm ±0,01%, reference ±0,5 mV và tổng lỗi comparator tại input ≤14 mV:

\[
E_{\rm cell}\le0,894+2,001+3(14)
=\mathbf{44,895mV}
\]

Cửa sổ trip có điều kiện là **1,0551…1,1449 V/cell**. Như vậy topology có ngân sách để tiếp tục; điều kiện **14 mV tổng lỗi comparator** phải được chứng minh, không mặc nhiên được đáp ứng.

### Cận TLV3501/3502 và trở nguồn

TI **SBOS321E** cho propagation **7 ns MAX** ở overdrive 20 mV, **12 ns MAX** ở 5 mV, với bước thử 100 mV và miền nhiệt nêu trong bảng. Không dùng shutdown TYP làm deadline. [TI, tr. 6](https://www.ti.com/lit/ds/symlink/tlv3501.pdf)

Tại 25°C, offset MAX ±6,5 mV; CMRR MIN 57 dB. Nhưng drift offset chỉ có TYP, và bias MAX nêu tại common-mode cụ thể. Chưa đủ để ký 14 mV toàn miền. [TI, tr. 5](https://www.ti.com/lit/ds/symlink/tlv3501.pdf)

Mạng 200 kΩ/100 kΩ có:

\[
R_{\rm th}=66,667kΩ
\]

Mỗi **10 nA bias không triệt tiêu** gây **2 mV lỗi quy đổi về cell**. Vì vậy cận bias phải áp dụng tại common-mode thực của từng cell. Nếu giảm cả hai arm cùng tỷ lệ, ảnh hưởng bias giảm tương ứng nhưng dòng tap tăng; đây là tradeoff kỹ sư có thể tính tiếp.

### Open-wire và reference faults

| Fault | Kết quả lý tưởng |
|---|---|
| Cell đảo, nguồn/reference hợp lệ | \(P-N<0\): fault |
| H–L short | \(P-N=-1,10/3\): fault |
| **H hở** | \(P=1,25V\), nên \(P-N=0,05-L/3\). Cell đầu L=0 có thể **false-healthy** |
| **L hở** | \(N=1,80V\), nên \(P-N=H/3-0,9667\). H=5,4 V cho **+0,8333 V**, false-healthy |
| Cả hai hở | \(P-N=-0,55V\): fault |
| Reference cao mất về 0 | Ngưỡng trở thành âm: **false-healthy** |
| Reference thấp mất về 0, reference cao còn đúng | Ngưỡng tăng: thường fail-off |

Do đó vẫn cần continuity test tách khỏi mạng UV, đặt **sau cả hai bank PhotoMOS**. Xung ép comparator HIGH/LOW chỉ kiểm comparator/output; không chứng minh dây nối đúng hoặc reference hợp lệ.

**Counterexample quan trọng:** hai reference cùng giảm còn một nửa:

\[
V_L=0,625V,\quad V_H=0,900V
\]

Tỷ số vẫn bằng **1,44**, nhưng ngưỡng cell giảm còn **0,55 V**. Cell 0,8 V bị báo healthy. Kiểm chéo tỷ số hai reference sẽ không bắt được lỗi này, dù supervisor rail chung vẫn báo nguồn tốt.

Reference validity vì thế cần **kiểm mức tuyệt đối độc lập**, không chỉ kiểm tỷ số hoặc tạo proof-frame từ chính hai reference đó.

**Disposition:** giữ topology 1/3 làm proposal DC nghiên cứu thay INA152. Đại số, miền node và ngân sách sai số đã có cận có điều kiện. Ba việc cụ thể trước khi nhận thiết kế là chứng minh lỗi comparator ≤14 mV toàn miền, reference validity chống common-scale fault, và continuity/test-switch faults. Chưa adopt reference MPN, rail mới, pin map hoặc trạng thái gate.
