Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c6b3-490d-7972-8d8d-a0385ce98dcd
Read-only conditional geometry assessment, not physical gap approval.

**Cận full-part height hợp lệ về nguyên lý và cho gap có điều kiện 2,6198 mm với Hmin=16 mm.** Nó khép phép tính tách hai envelope dẫn điện còn nguyên vẹn; **chưa khép endpoint cơ, trailing contact hoặc bypass**. Travel16 mm chỉ là proposal, không thay CAD12 mm/r12.

Đã xem hình Table1/Sheet7 và Fig2/Sheet2 của [TFM Rev GB](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/attempt-4/samtec-tfm-drawing.pdf), cùng Fig2/Sheet2 của [SFM Rev EB](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/samtec-sfm-drawing.pdf).

**1. Datum và chiều cao**

| Thành phần | Cận đọc từ drawing |
|---|---:|
| TFM lead‑02, K=.226±.006 in | **5,8928 mm MAX** |
| SFM SMT finished height .185 +.002/−.005 in | **4,7498 mm MAX** |

TFM `.235/5,97 MAX` là chiều ngang trong section, không phải height. SFM phải dùng **finished dimension**, không dùng kích thước in-process `.190`.

K và finished height lấy tới vùng foot theo section. Vì vậy:

- Solder stand-off thêm 0,30 mm/phần phải là khoảng **foot-to-PCB sau lắp**, không lấy chính callout TFM “flush to .012” rồi cộng nó lần nữa.
- Cộng thêm vẫn có thể bảo thủ, nhưng phải đặt tên datum đúng.
- Burr/protrusion 0,08 mm/phần là allowance thiết kế; không tự là cận mọi solder spike, terminal bật khỏi housing hoặc chi tiết kim loại khác.

Với exact variant `‑A`, cần giữ nguyên option inventory; không áp cận này cho screw-down/clip/weld-tab hoặc phụ kiện thêm chưa tính.

**2. Tái lập phép tính**

\[
E_\Sigma=5,8928+4,7498+0,60+0,16=11,4026\ {\rm mm}
\]

\[
r=\tfrac12\sqrt{40^2+8^2}=20,3961\ {\rm mm}
\]

\[
g_{\min}\ge16-11,4026-r\sin5^\circ-0,20
=\mathbf{2,619765\ mm}
\]

Biên trên screening gap2 mm là **0,619765 mm**. Hmin cần theo chính model này là **15,380235 mm**.

Không credit S0 nominal là bảo thủ **nếu** datum hai PCB không xuyên nhau và Hmin được xác định từ trạng thái/datum có thứ tự đó. Không dùng A MAX mated làm S0 MIN.

**3. Điều kiện tilt quan trọng**

Công thức bán đường chéo chỉ đúng khi:

- 40×8 mm bao **toàn phần dẫn sau tolerance**;
- tâm envelope là pivot/datum của H, hoặc khoảng cách tới pivot thực không vượt r;
- 5° là **góc relative tổng**, không phải mỗi phần được nghiêng5°.

Các phản ví dụ số:

| Cách hiểu | Gap tính được |
|---|---:|
| Pivot giữa envelope40×8, relative5° | **2,6198 mm** |
| Pivot ở mép, dùng cả đường chéo | **0,8421 mm — không đạt2 mm** |
| Hai phần mỗi bên5°, relative10° | **0,8557 mm — không đạt2 mm** |

Nếu hai connector cùng chịu tilt quanh tâm bridge, phải dùng khoảng cách xa nhất từ **pivot bridge** tới mọi phần dẫn của cả hai connector. Ví dụ envelope chung40×25 mm, pivot giữa, cùng assumptions cho gap khoảng **2,3418 mm**. Đây vẫn chỉ là phép tính proposal.

**4. Khép được gì và còn thiếu gì**

Có thể nhận vào calculation packet:

> Khi mọi phần dẫn nguyên vẹn nằm trong hai full-height envelopes đã nêu; assembly allowances, relative tilt/pivot và Hmin được đáp ứng, hai envelope không thể tiếp xúc và có projected separation≥2 mm.

Đây là cận hình học bảo thủ, không cần biết last-wipe chính xác. Nó **không** bao:

- Terminal bị kéo khỏi housing, sợi dẫn/solder bridge vượt envelope.
- V/shield/bracket/test path nối vòng hai đảo.
- Local lift một đầu thấp hơn giá trị H ở tâm.
- Housing/guide gãy hoặc endpoint chỉ quan sát handle.

Để thành mechanical-endpoint proof, còn phải:

1. Khóa datum H và pivot; chỉ rõ `16 mm MIN` tại đâu.
2. Chứng minh cả A/B đạt cận trước khi **bất kỳ V nào** rút đủ để mở corridor.
3. Gắn blocker vào actual endpoint mỗi đầu, không suy từ cam travel.
4. Kiểm một đầu kẹt thấp, cầu nghiêng và tolerance stack.
5. Giữ inventory mọi metal/conductor trong envelope hoặc phân tích riêng.

**Disposition:** nhận **conditional gap calculation** để review. Không nhận “bridge đã cách ly thực”, không sửa artifact12 mm, và không coi cận nominal socket35,69 REF là MAX fit. Reserve40×25 mm và travel16 mm vẫn phải được ghép lại vào scope/fit/config proposal trước adoption.
