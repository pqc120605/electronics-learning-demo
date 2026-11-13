# Box 02 — raw advisory result

Chat: 01a1a854-2163-70f2-a167-db281ef2ad08; turn: 01a1c6b3-28e7-75c0-b204-cbba5123e020

**Đề xuất mới: comparator vi sai trực tiếp, có bias chung và kiểm continuity tách khỏi phép đo UV.** Topology này bỏ INA152 và có candidate comparator với propagation MAX. Phần DC dưới đây khép được **có điều kiện**; chưa chứng minh toàn bộ single-fault vì reference và các switch thử có thể tạo false-healthy.

### 1. Comparator và điều kiện MAX

Chọn nghiên cứu **TLV3502DCNR** — dual comparator, TI **SBOS321E, Apr-2016**. Tr. 6 công bố:

- **7 ns MAX**, −40…125°C, bước vi sai 100 mV, overdrive 20 mV;
- **12 ns MAX** với overdrive 5 mV;
- nguồn theo điều kiện bảng 2,7–5,5 V.

Đây là MAX của comparator trong phép thử được nêu, **không phải deadline từ lúc cell bắt đầu sụt áp**. Không tự áp nó cho mọi slew rate hoặc tải output. [TI TLV3502, tr. 6](https://www.ti.com/lit/ds/symlink/tlv3502.pdf)

TLV3502 có offset MAX ±6,5 mV tại 25°C, nhưng drift nhiệt chỉ có TYP; bias MAX tại điểm common-mode nêu trong bảng cũng không tự bao phủ mọi node của thiết kế. Vì vậy phải tách phép tính DC có điều kiện khỏi claim toàn nhiệt. [TI, tr. 5](https://www.ti.com/lit/ds/symlink/tlv3502.pdf)

### 2. Mạng bốn điện trở

Thay dạng không bias bằng:

\[
P=(H+B)/2,\qquad N=(L+T)/2
\]

với allocation nghiên cứu:

\[
B=2,000V,\quad T=3,100V,\quad T-B=1,100V
\]

Do đó:

\[
P-N=\frac{V_{\rm cell}-1,100V}{2}
\]

Bốn arm nominal **10 kΩ**; arm sense phải tính cả guard, switch ON và điện trở bổ sung. Chưa chọn MPN cho module B/T.

Lý do thêm B: dạng \(P=H/2\) đưa input âm khi cell đầu lắp ngược. Với miền thử **tap −1,8…5,4 V**, B/T ±2 mV và sai số mỗi arm tổng ±0,1%, tính được:

| Node | Miền điện áp có điều kiện |
|---|---:|
| P | **0,0971…3,7027 V** |
| N | **0,6465…4,2522 V** |

Các node nằm trong miền conservative 0…\(V_S-0,2V\) khi \(V_S≥4,75V\). Miền tap này là **allocation fault**, chưa phải cận NiMH do hãng bảo đảm. Nếu nguồn monitor không hợp lệ, không được giải mã output thành healthy.

### 3. Ngân sách ngưỡng DC

Với \(a,b\) là hệ số divider thực:

\[
P=aH+(1-a)B,\quad N=bL+(1-b)T
\]

Nếu mỗi arm tổng ±0,1%, thì \(|a-0,5|,|b-0,5|≤0,0005\).

Dùng:

- B và T mỗi rail ±2 mV;
- miền normal quanh threshold: H≤5,4 V, L≤4,35 V;
- **allocation tổng lỗi comparator tại node ≤10 mV**, gồm offset, bias, common-mode, hysteresis và ảnh hưởng nguồn;

cận quy đổi về cell là:

\[
E_{\rm cell}\le6,5+4,004+20
=\mathbf{30,504mV}
\]

Suy ra cửa sổ trip có điều kiện:

\[
\boxed{1,069496…1,130504V/cell}
\]

Nó nằm trong allocation 1,05–1,15 V. Nhưng **10 mV tổng lỗi comparator và ±2 mV B/T chưa được bộ linh kiện thực chứng minh toàn miền**. Không gọi cửa sổ này là guarantee của TLV3502.

### 4. Fault DC của mạng đo

| Fault | Kết quả lý tưởng |
|---|---|
| Cell yếu | Trip khi \(V_{\rm cell}<T-B\), có dải sai số trên |
| Cell đảo, node còn trong miền đã tính | \(P-N<0\), báo fault |
| H–L sense short | \(P-N=-0,55V\), báo fault |
| **H hở** | \(P=B\); \(P-N=0,45-L/2\). Cell đầu L=0 có thể **false-healthy** |
| **L hở** | \(N=T\); \(P-N=H/2-2,1\). H=5,4 V có thể **false-healthy** |
| B mất về 0, T còn đúng | Tăng threshold: thường fail-off |
| **T mất về 0 hoặc B tăng quá mức** | Threshold có thể xuống dưới 0: **false-healthy** |
| Comparator/output stuck | Cần phép thử đổi trạng thái; output HIGH tĩnh không đủ |

### 5. Proof-frame không bypass hai bank sense

Mọi test node và test return phải nằm **sau cả hai PhotoMOS**. Không lấy node giữa hai break để đo.

Proposal continuity:

1. Hai bank sense ON.
2. Một selector nội bộ tách mạng UV khỏi sense đang thử.
3. Sense H được kéo về 0 qua 10 kΩ; sense L được kéo lên nguồn thử qua 10 kΩ.
4. Comparator continuity riêng đọc node qua mạng 1 MΩ + 1 MΩ bias về B.
5. Sau kiểm tra, ngắt pull thử, nối lại mạng UV rồi mới đo cell.

Trong miền healthy **trở nguồn hiệu dụng ≤2 kΩ**:

| Phép thử | Healthy | Open | Threshold đề xuất |
|---|---:|---:|---:|
| H kéo xuống | X≥**0,8759 V** | X≤**0,0100 V** | X=0,5 V |
| L kéo lên | X≤**4,5002 V** | X≥**4,7362 V** | X=4,6 V |

Threshold ở input comparator tương ứng 1,25 V và 3,3 V sau bias B. Với low-sense test, khoảng nhỏ nhất tại input khoảng **49,9 mV**. Allocation tổng lỗi continuity comparator/reference/ratio phải **≤25 mV** để còn margin.

Điều kiện ≤2 kΩ là miền availability nghiên cứu, chưa phải DCIR hãng. Trở cao hơn có thể bị từ chối như lỗi.

Mạng 1 MΩ tạo trở Thevenin lớn; vì vậy bias current của comparator continuity phải được kiểm tại **common-mode thực**, không lấy số tại \(V_{CC}/2\) thay thế. Đây là điều kiện cụ thể cần khép trước khi chọn linh kiện cho khối continuity.

Hai pha ép comparator HIGH/LOW riêng chỉ kiểm comparator và output. Chúng **không thay phép kiểm dây ở trên**. Selector/test switch cũng phải được kiểm trạng thái OFF trước baseline; một switch kéo lên bị kẹt có thể nâng điện áp sense và che cell yếu.

### 6. Counterexample quan trọng nhất

Giả sử cell thật 0,8 V, B vẫn 2 V nhưng T sụp về 0:

\[
P-N=(0,8+2)/2=1,4V>0
\]

Comparator báo healthy. Phép ép HIGH/LOW vẫn có thể tạo đúng hai trạng thái; continuity vẫn thấy dây nối tốt. **Proof-frame đó vẫn pass nếu không kiểm reference độc lập.**

Do đó permission cần đồng thời:

- continuity hợp lệ;
- comparator/output đổi trạng thái đúng;
- test selectors đã trở về trạng thái đo;
- **B/T nằm trong cửa sổ được kiểm bằng reference độc lập**;
- baseline UV hợp lệ và còn freshness.

Kiểm reference bằng chính reference đang được kiểm không chứa lỗi này.

### Disposition

Đây là **proposal front-end mới có phương trình và miền phân biệt định lượng**, đủ để review kiến trúc DC. Chưa đủ nhận thiết kế nguồn/B1.

Phần cần đóng tiếp rất cụ thể:

1. Chứng minh tổng lỗi UV ≤10 mV tại node và continuity ≤25 mV trong miền vận hành.
2. Ánh xạ reference guard độc lập và kiểm selector/test-switch OFF.
3. Level translation output comparator sang AON 1,8 V, gồm mất nguồn/backfeed.
4. Lập timing từ RC, switch thử và freshness; chỉ dùng 7/12 ns khi điều kiện phép thử thực sự áp dụng.

Không cần Founder thay chemistry/GPIO hoặc nới D10 để làm các việc này. Cut-set 12 PhotoMOS vẫn là hypothesis containment riêng; nó chưa trở thành proof cho reference, test-switch hoặc fault của comparator.
