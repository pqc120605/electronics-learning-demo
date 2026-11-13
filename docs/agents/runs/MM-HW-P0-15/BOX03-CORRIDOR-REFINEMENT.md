Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c526-bd8e-71d3-9cf0-7152095ca21e
Read-only dimensional/source study; no CAD/FE, accepted geometry or gate approval.

**Refinement M4‑R1: nguồn USB‑IF đã cho phép thu hẹp bài toán, nhưng chưa chứng minh được hai paddle ngoài miệng cổng cho mọi cáp USB‑C hợp chuẩn.** Giữ nguyên finding này; không đưa vị trí 1/2 mm vào cấu hình như đã đạt.

Đã đọc hình trực tiếp từ PDF ghim, render trong bộ nhớ, không ghi tệp. R2.0 chỉ là reference tháng 8/2019; không tuyên bố phù hợp R2.5 hoặc xác minh connector B01.

**1. Bất đẳng thức corridor kim loại**

Từ USB‑IF R2.0:

| Hình/trang | Dữ liệu đọc được |
|---|---|
| Figure 3‑3, tr.46; Figure 3‑11, tr.57 | Exposed shell/GND **≥6,51 mm** |
| Figure 3‑3, tr.47; Figure 3‑11, tr.58 | Chiều dài plug shell **6,65±0,10 mm**; bề rộng **8,25±0,03 mm**; chiều dày **2,40±0,03 mm** |
| Note 7, tr.40 | Effective receptacle shell length **6,20±0,20 mm** |

[Nguồn đã ghim](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/usb-typec-r20-reference.pdf)

Gọi `D` là độ sâu đầu plug tính từ mặt miệng và `Lexp` là chiều dài shell lộ ra. Phần shell còn ở ngoài miệng có chiều dài:

\[
P=L_{\rm exp}-D
\]

**Nếu** mating stop/enclosure bảo đảm `Dmax≤6,40 mm`, thì:

\[
P_{\min}\ge6,51-6,40=\mathbf{0,11\ mm}
\]

Bất đẳng thức này áp dụng bảo thủ cho trạng thái vẫn đang ghép: không cần lấy riêng VBUS hay data để bỏ qua shell/ground. Tuy nhiên, phải xác nhận `Dmax` bằng datum/mating-stop thực; không tự đồng nhất chiều dài shell reference với một hard-stop đã kiểm của clone.

Với một paddle nằm hoàn toàn ngoài miệng:

\[
a_i+t_i+\Delta_{\rm axial,i}<P_{\min}
\]

đồng thời:

\[
a_i-\Delta_{\rm toward-port,i}>0
\]

Hai điều kiện yêu cầu paddle vừa gặp phần plug được bảo đảm, vừa không đi vào receptacle.

**Kết quả:** mặt phẳng 1 và 2 mm của M3 không được cận 0,11 mm bảo đảm. Xê dịch cả hai sát miệng cũng chưa khép được: riêng allowance biến dạng assembly **0,15 mm** đang dùng đã lớn hơn toàn dải 0,11 mm.

Không kết luận mọi detector sát miệng đều bất khả thi. Kết luận hữu hạn là **hai paddle với stack hiện tại không được chứng minh bằng generic metal-shell envelope này**.

**2. Last-contact và falsifier còn lại**

Hình có kích thước contact, nhưng không cho một giá trị scalar “rút X mm thì mọi conductor đã ngắt” dùng trực tiếp cho B01. Phải ghép các datum, spring-contact envelope, mating stop và shell contact; không lấy nominal signal-contact length thay last-contact.

Falsifier cần giữ:

- Plug còn một contact điện hoặc shell dẫn.
- Hai paddle vẫn tới dock vì nằm ngoài đoạn shell được bảo đảm hoặc bị lệch/biến dạng.
- Hai pawl nhả, cho reconnect.

PDF hiện có **không loại được falsifier đó cho geometry M3/M4**. Cáp có overmould lớn thường cản paddle không phải bằng chứng cho mọi cáp.

**3. Delta cụ thể nếu tiếp tục: PROGRAM adapter có envelope kiểm soát**

Đây là **proposal cần Founder duyệt nếu chọn**, chưa áp dụng:

- Cung cấp một adapter/cáp PROGRAM với **collar cứng captive**, được định vị với plug; không dùng vòng rời trượt trên dây.
- Collar tạo envelope cản liên tục từ vùng shell tới phía sau, tránh khoảng trống để paddle lọt qua khi cắm hờ.
- Yêu cầu chiều dài envelope kiểm soát từ đầu plug **≥12,5 mm**. Với `Dmax≤6,4 mm`, phần cản ngoài miệng còn **≥6,1 mm**.
- Khi đó có thể khảo sát lại paddle tại 1/2 mm với margin thực, nhưng vẫn phải kiểm toàn bộ hành trình partial insertion.
- Khoang PROGRAM cần **keying chặn cáp thường không có collar trước khi tiếp xúc điện**. Chỉ ghi “hãy dùng cáp đi kèm” không đủ.
- Cáp mất/hỏng: dùng replacement đúng envelope; không mở đường bypass cho cáp bất kỳ. Giá adapter, replacement, vận chuyển và phần cơ phải tính trong kit dưới 1 triệu đồng.

**Điểm chưa giải:** chưa có thiết kế keying và collar được chứng minh chống cáp lạc/cáp không collar. Delta này là một specification có thể xét, không phải adapter đã chọn hoặc geometry đã đạt. Nó cũng thay trải nghiệm từ “dùng cáp USB‑C bất kỳ phù hợp” sang “dùng phụ kiện PROGRAM xác định”.

**4. Samtec: số mating/wipe thực đọc từ hình**

Từ **XFM Mated Views Rev C, tr.1, Table 1**, cặp vertical SMT:

- SFM‑D lead style **‑02** với TFM‑D lead style **‑02**.
- Board separation fully mated nominal: **6,30 mm**.
- “A MAX”: **6,48 mm**.
- Wipe fully mated nominal: **0,56 mm**.
- Wipe MIN tại A MAX: **0,38 mm**.

[Nguồn mated views đã ghim](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/samtec-xfm-mated.pdf)

Điểm quan trọng: tăng separation từ 6,30 lên 6,48 mm **vẫn được mô tả có wipe 0,38 mm**. Vì vậy A MAX không phải endpoint ngắt.

Drawing mated ghi rõ các kích thước dựa trên nominal. Chưa có MAX last-conductive-overlap và toàn bộ contact-deflection tolerance để thay `Lconductive,max` trong công thức gap. **Không dùng 0,56 mm như hành trình ngắt bảo đảm**, cũng không suy `12−0,56` thành gap an toàn.

Product specification Rev E mô tả một cấu hình vertical SMT mated-height 6,50 mm và báo 2.500 cycles pass. Nó không khớp hoàn toàn số nominal 6,30 mm của bảng mated trên. Do đó phải khóa **đúng mating set, revision, lead style và plating** trước khi nhập cycle result; không promote 2.500 cycles cho mọi SFM/TFM. [Product specification đã ghim](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/samtec-sfm-tfm-productspec.pdf)

**Disposition cuối lượt**

- **Đóng được:** cận nguồn cho shell lộ ra; phép kiểm corridor có số; bác bỏ việc dùng 1/2 mm hoặc wipe nominal như proof.
- **Chưa đóng:** generic partial‑plug detection, actual hard-stop B01 và MAX conductive overlap của mating pair.
- **Không mở thêm survey:** nếu HQ muốn giữ hai paddle ngoài miệng, đưa delta PROGRAM adapter/collar/keying nêu trên vào review rồi mới trình Founder. Nếu giữ hỗ trợ cáp generic, geometry hiện tại chưa đủ để xin scope triển khai như một thiết kế đã khép.

Không đổi D10, r12, MPN, gate hoặc quyền CAD/FE từ refinement này.
