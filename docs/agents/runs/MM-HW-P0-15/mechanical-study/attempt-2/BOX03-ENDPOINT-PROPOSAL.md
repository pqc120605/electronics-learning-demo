Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c675-25e5-77d0-adc9-6357ebcb982f
Read-only reference proposal; not CAD execution, force validation or product adoption.

**Đề xuất một kiến trúc reference: hai thanh kiểm chứng độc lập xuyên qua bốn cửa sổ “home”, kết hợp cầu nâng có khóa thứ tự.** Cầu chỉ được hạ khi **hai shutter đóng và hai probe đã dock chắn corridor**. Chiều mở PROGRAM bắt buộc nâng cầu trước, sau đó mới rút thanh kiểm chứng để giải phóng cửa/probe.

Đã đọc report, protocol và review attempt‑2. Tôi không chạy CAD/solver hoặc ghi tệp. Kiến trúc dưới đây chưa là cơ cấu chịu lực hay product adoption.

### 1. Quy ước home và các phần chuyển động

Cần định nghĩa rõ để tránh nhầm “probe home” với vị trí park:

| Phần tử | Home dùng để cho phép nối cầu |
|---|---|
| Shutter A/B | Carriage tại 0 mm, cửa che corridor |
| Probe A/B | Docked, tâm Z=0, chắn corridor |
| Probe park trong PROGRAM | Z=+6/−6 mm theo reference hiện tại; **không phải home** |
| Bridge | Nâng/park trong PROGRAM; hạ/nối trong RUN |

Không đổi pose probe của attempt‑2; chỉ làm rõ trạng thái được dùng trong điều kiện reconnect.

**Số body reference:**

- 2 carriage shutter/cam/rib.
- 2 probe.
- 2 thanh kiểm chứng `V₁/V₂`.
- 1 bridge carriage cứng.
- 1 sequencer thủ công.

Tổng **8 body động học**, cộng cassette là 9. Nếu dựng thêm hai latch retention cassette thì tổng 11. Chưa tính lò xo, bearing hoặc các chi tiết phụ của cơ cấu thực.

### 2. Geometry kiểm chứng bốn home

Mỗi shutter và mỗi probe có hai proof-tab liền body, nằm ngoài corridor USB. Mỗi tab có một cửa sổ kín.

- Một hàng cửa sổ phục vụ V₁, hàng kia phục vụ V₂.
- V₁ và V₂ chạy trên guide/frame riêng.
- Mỗi thanh phải xuyên qua cửa sổ của **cả bốn body**, không phải mỗi thanh chỉ kiểm hai body.
- Cửa sổ chỉ thẳng hàng tại home; dịch shutter theo X hoặc probe theo Z làm mất đường xuyên.
- Khi hai thanh đã xuyên hoàn toàn, chúng bắt giữ cả bốn body ở home trong lúc bridge hạ.

Có thể khảo sát hai đường thanh chạy theo Y, ở hai bên corridor. Vị trí cụ thể và kích thước proof-tab là output profile tiếp theo; không được mặc nhiên bỏ va chạm của chúng khỏi frame/cam/key sweep.

Điều kiện reference:

\[
V_j=\text{inserted}\Rightarrow
S_A=S_B=0\ \land\ P_A=P_B=0,\qquad j=1,2
\]

Trong mô hình có tolerance, thay đẳng thức bằng các khoảng home, nhưng phải có:

\[
\text{accepted-home envelope}
\subseteq
\text{effective blocking/docked envelope}
\]

Một notch rộng đủ cho tab “gần home” đi qua nhưng cửa còn hở là **FAIL**, không chỉ là clearance chưa tối ưu.

### 3. State và thứ tự bắt buộc

| State | Bridge | V₁/V₂ | Shutter/probe | Chuyển tiếp được phép |
|---|---|---|---|---|
| RUN | Hạ/nối | Cắm, captive | Cả bốn home | Tháo cassette rồi nâng bridge |
| ISOLATE | Đang nâng | Vẫn captive | Vẫn khóa home | Chưa được mở cửa |
| ISOLATED | Hai endpoint đạt điều kiện tách | Có thể rút | Ban đầu home | Rút V₁/V₂ |
| PROGRAM | Park | Rút | Cửa/key/probe được chuyển động | PC có thể cắm |
| VERIFY-EMPTY | Park | Chưa cắm đủ | Probe dock; shutter trở về đóng | Chỉ khi đủ bốn home mới cắm đủ V₁/V₂ |
| RECONNECT | Park → hạ | Cắm đủ và bị giữ | Bốn home bị bắt giữ | Nối cầu, cassette lắp cuối |

Sequencer phải có hai vùng hành trình tách nhau:

1. Nâng bridge trong khi giữ thanh kiểm chứng.
2. Chỉ sau hai endpoint thật mới cho rút thanh.

Chiều ngược: cắm đủ **cả V₁ và V₂**, rồi mới mở đường hạ bridge. Không dùng vị trí tay handle thay vị trí actual bridge hoặc thanh.

### 4. Contact-order inequalities

Không đặt số cho overlap connector. Với từng breakpoint `i=A,B`, định nghĩa:

\[
g_i=h_i-L_{\mathrm{conductive},i}-\Delta_i
\]

Trong đó `Lconductive` phải bao mọi contact/terminal có thể còn dẫn; `Δ` bao dung sai và biến dạng tương đối.

Điều kiện mở khóa V:

\[
h_{i,\mathrm{release,min}}
>
L_{\mathrm{conductive},i,\max}+\Delta_{i,\max}+g_{\mathrm{required}}
\]

cho **cả A và B**.

Nếu dùng sequencer coordinate q, cần thêm:

\[
q_{\mathrm{V\ withdraw,earliest}}
>
q_{\mathrm{both\ gaps\ established,latest}}
\]

và chiều ngược:

\[
q_{\mathrm{first\ contact\ make,earliest}}
>
q_{\mathrm{both\ V\ captured,latest}}
\]

ở hệ q tăng theo chiều reconnect, có margin dương sau tolerance.

Các số này là **biến thiết kế cần xác lập**, không phải chỉ đổi tên “park” thành “đã cách ly”.

### 5. Probe kiểm rỗng và lực tay

Trong PROGRAM, hai probe có thể dock sau khi collar đã rút khỏi corridor. Shutter còn bị key giữ mở thì cửa sổ shutter chưa thẳng hàng; bridge vẫn không được nối.

Coupling lực thăm dò ≤0,20 N vẫn tách khỏi đường tải:

`handle → V/pawl-stop còn chặn → frame`.

Một probe bị collar chặn không được trở thành stop nhận 100 N qua coupling. Kiến trúc thanh kiểm chứng **không tự chứng minh** lực này: lực cắm thanh khi tab chưa thẳng hàng cũng phải kết thúc ở frame/tab kết cấu, không đẩy probe vào plug. Cần khảo sát đúng load-path đó trước khi gọi đây là cơ cấu thực.

### 6. Bypass cụ thể và lỗi

| Fault | Kết quả của hypothesis |
|---|---|
| Một probe kẹt park | Cửa sổ không thẳng hàng; cả hai V không cắm đủ → không reconnect |
| Một shutter kẹt mở | Tương tự; không nối cầu |
| Thiếu một key | Attempt‑2 đã chặn đường thử tương ứng bằng cửa còn đóng; không mở rộng thành mọi trajectory |
| Hai shutter kẹt mở | Bare plug có bypass tới USB như report. Bridge vẫn bị chặn nếu proof-tabs thật đi cùng cửa; **không đạt yêu cầu “PC không thể tiếp cận khi cửa lỗi chung”** |
| Một V/pawl gãy | V còn lại phải tự kiểm cả bốn home và chặn hạ cầu; chưa là strength proof |
| Lò xo hồi shutter gãy | Không tự về home thì không reconnect; không cần giả định spring vẫn hoạt động |
| Lò xo probe gãy | Không dock thì không reconnect; probe có thể bị giữ sai vị trí, cần xét fragment |
| Common frame break | Có thể làm cả hai guide V dịch cùng nhau hoặc giải phóng bridge. Hai thanh không bao được lỗi chung này |
| Contact kéo theo | Housing endpoint có thể báo park trong khi một contact còn dẫn; cần breakpoint còn lại và trailing-contact bound |
| Forced bare plug | Hai cửa khỏe chặn các đường reference đã thử; xuyên thủng, biến dạng hoặc phá proof-tab chưa được mô hình hóa |

**Một bypass đơn đáng kiểm ngay:** shutter bị gãy khỏi carriage/proof-tab, trong khi phần tab vẫn ở home. Hai V có thể cùng “xác nhận cửa đóng” nhưng vật che corridor đã mất. Vì thế hai thanh kiểm chứng không tạo độc lập trước lỗi **mất phần chức năng nhưng giữ phần báo vị trí**. Không được giải bằng một assertion `tab_home == door_closed`.

### 7. Bộ test reference tiếp theo và phạm vi quyền

Có thể tiếp tục trong quyền **M5 reference-profile/collision study** hiện tại:

1. Dựng proof-tabs, hai V và bridge lock như rigid reference solids.
2. Exhaustive các trạng thái home/not-home của bốn body; chỉ trạng thái đủ bốn home cho cả hai V xuyên.
3. Sweep thứ tự hai chiều, kể cả một endpoint bridge kẹt và handle tiếp tục di chuyển.
4. Fault geometry: một V mất, một probe/cửa kẹt, mất panel cửa nhưng giữ proof-tab, hai cửa mở.
5. Kiểm toàn bộ tab/V mới với key, cam, rib, collar, frame và probe sweep.

Phạm vi này khớp hypothesis đã duyệt về endpoint locks và variable connector separation. Không cần xin lại CAD consent chỉ để tiếp tục profile/reference study.

**Không nằm trong kết luận được phép suy ra:** hiện thực hóa cơ cấu force-limited, chọn spring/material, strength 100/200 N, tolerance sản xuất, fatigue hoặc product adoption. Các việc đó cần scope/config tương ứng trước thực thi.

Kiến trúc này cho một **AND cơ khí reference có thể kiểm**, không đóng single-fault claim. Nếu mất panel nhưng giữ tab tạo bypass như trên, ghi kết quả FAIL của hypothesis quan sát vị trí đó; không gọi hai thanh là đã khắc phục lỗi.
