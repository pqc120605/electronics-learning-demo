# T8 / fixture / danh sách mua · rà dữ liệu trước KiCad (R-20261106-06)

Ngày 06/11/2026 · Claude (reviewer phần cứng, chỉ đọc) · tasks `MM-HW-MOBOT-IF-001`, `MM-HW-MOBOT-ROBOT-KICAD-001` · mức thiết kế, T8 và bench đều `NOT_RUN`.

Nhãn: **[HÃNG]** = đọc trực tiếp trang thông số hãng (Pololu). **[TÍNH]** = tôi tính từ số [HÃNG] hoặc số trong file. **[SUY LUẬN]** = lập luận cơ chế, chưa đo. **[VÍ DỤ]** = số giả định để thấy độ lớn, không phải dữ liệu. **[CHƯA XÁC MINH]** = chưa mở nguồn hãng. **[KHÔNG CÓ SỐ ĐO]**. Giá trị thiếu: **TBD**. Hệ số biên và ngưỡng pass: **Box 08 đặt**.

## 0. Nguồn đã mở, nguồn chưa mở

- **Đã mở (trình duyệt trong app, 06/11/2026):** Pololu #992 `/product/992/specs` và Pololu #1452 `/product/1452/specs`. Đây là trang thông số sản phẩm của hãng, không phải PDF datasheet; trang không ghi số revision. Tôi không tải file nào.
- **Không mở được:** TI LM73100 (`lit/ds/symlink/lm7310.pdf`, `lm73100.pdf`, `/product/LM73100` đều trả 404 trong pane). **Mọi số LM73100 dưới đây là [CHƯA XÁC MINH]**, chỉ dẫn lại từ file Codex. TPS63070 và DRV8833 tôi cũng **chưa mở**; số của chúng là [CHƯA XÁC MINH], trích từ file Codex/RELAY.
- Pololu #992/#1452 **không** công bố: L cuộn dây, J rotor, k_e, hiệu suất truyền ngược hộp số, dung sai dòng kẹt, hệ số nhiệt của R. Các số đó là **[KHÔNG CÓ trên trang hãng]**, không phải "chưa tra".

## 1. Điểm khóa từ trang hãng và dữ liệu T8 còn cần

Bảng này **nối tiếp** 12 mục ở `relay-R20261106-04/review-result.md` §2 (ký hiệu `#n` là mục của bảng đó, không nhắc lại tiêu chí của chúng). Cột "Điểm khóa" chỉ chứa số có nguồn; cột "Còn cần" là dữ liệu fixture/T8.

Số [HÃNG] dùng chung (#992, 6 V): không tải 130 vòng/phút (typ, ±20 %) và 40 mA (typ, ±50 %); kẹt ngoại suy 0,36 A và 0,74 kg·cm, hãng ghi "lý thuyết, kẹt có thể làm hỏng motor hoặc hộp số"; tỷ số 100,37:1; Ø trục 3 mm; khối lượng motor 9,5 g. #1452: Ø40 × 7 mm; 0,15 oz mỗi bánh gồm lốp (≈4,3 g [TÍNH]); lỗ D Ø3 mm.

| # | Đại lượng | Điểm khóa (nguồn) | Còn cần từ fixture/T8 | Cách đo | Ca xấu nhất | Tiêu chí đủ để chọn linh kiện |
|---|---|---|---|---|---|---|
| #2 | R_w mỗi motor | R_w ≈ 6 V / 0,36 A ≈ **16,7 Ω** [TÍNH từ kẹt ngoại suy; hãng không ghi dung sai] | R_w đo 4 dây, nhiều vị trí rotor, nóng và lạnh, cả hai motor | LCR/DMM 4 dây, quay tay rotor qua vài vị trí, đo ngay sau chạy | R nhỏ nhất (lạnh, vị trí rotor xấu): dòng lớn nhất | R_w,min đo kèm số mẫu; số ngoại suy chỉ là mốc sàng lọc |
| #2 | L mỗi motor | **Không có số** | L đo ở tần số gần PWM/chopping của cấu hình thật | LCR, đo cả hai motor, rotor ở vài vị trí | L lớn nhất cho cận A (½LI²) | L,max đo; **thiếu số này thì cận A không tính được** |
| #1 | I₀ trước ngắt khi **đang lái** | Cận trên trạng thái lái ≈ VM/R_w ≈ 0,36 A ở 6 V, ≈ **0,38 A ở 6,35 V** [TÍNH]; hai motor ≈ 0,76 A | I₀ có dấu đo được (kèm trạng thái PWM/ILIM) | kẹp dòng hoặc shunt thấp L trên dây motor, đồng bộ nSLEEP | **Đảo chiều lệnh** ngay trước ngắt: dòng có thể tiến tới (V_emf+VM)/R_w ≈ 0,7 A [TÍNH, SUY LUẬN], chỉ bị ILIM chặn nếu chopping kịp (DRV8833 chưa mở, [CHƯA XÁC MINH]) | I₀,max đo, gồm ca đảo chiều; số 0,38 A chỉ là giả thuyết |
| #4 | k_e, V_emf | ω_m không tải ≈ 130 × 100,37 = 13 048 vòng/phút = 1366 rad/s; V_emf ≈ 6 − 0,04 × 16,7 ≈ 5,33 V; **k_e ≈ 3,9 mV·s/rad** [TÍNH, chồng dung sai ±20 % tốc độ, ±50 % dòng] | k_e đo độc lập (hở mạch, kèm tốc độ đo riêng) | quay motor bằng nguồn quay đo tốc độ, đo V hở mạch; hoặc xe chạy rồi disable và đọc V_emf | k_e cao nhất của hai mẫu, VM = VM_max | k_e,max đo; số tính chỉ để định thang |
| #5 | J_eq | **Không có số** (motor); bánh 4,3 g (không có J) | J_eq đo trên cụm thật | giảm tốc tự do từ ω_max, đo tốc độ và dòng (cần đo tốc độ, mục 3) | bánh/tải nặng nhất cho phép | xem #5 |
| 13 | Đường kính lăn, tốc độ xe tại ω_max | Ø40 mm danh nghĩa; 130 vòng/phút ↔ **0,27 m/s** ở 6 V, ≈ 0,35 m/s ở 6,35 V và +20 % [TÍNH] | đường kính lăn khi có tải (lốp nén), trượt (tốc độ xe ≠ tốc độ bánh) | đo quãng đường/vòng bánh và thời gian | r nhỏ nhất → emf/(m/s) lớn nhất | r có sai số; mọi quy đổi v↔V_emf dùng r,min |
| 14 | V_emf theo tốc độ **đẩy** | emf ≈ k_e·N·v/r ≈ **19,6 V mỗi m/s** [TÍNH, k_e ±20–25 %, r = 20 mm] | v_push,max (yêu cầu sản phẩm, TBD); lực tối thiểu để bánh quay ngược khi driver disable | lực kế + video có mốc, đẩy dọc bằng đầu tì mềm (như fixture) | đẩy nhanh nhất theo bao; V_emf có thể vượt mức lái | V_rail,max = emf(v_push,max) − 2V_d phải ≤ cận thấp nhất toàn rail; v_push,max do founder/Box 08 |
| 15 | Độ ngược truyền (η_ngược, ma sát tĩnh hộp số) | **Không có số** | lực đẩy tối thiểu làm motor phát điện; η_ngược = P_điện / P_cơ | lực kế, hoặc cùng phép đo #14 | η_ngược cao nhất (hộp số mới chạy rà, ấm) | η_ngược,max đo (không dùng 0 vì "100:1 khó ngược") |
| 16 | Khối lượng robot, tải | Không có (robot chưa có) | m mục tiêu (TBD), khối lượng cụm thử | cân | m lớn nhất của bao | m do Codex khóa; số cụm thử không thay m robot |
| 17 | Rò LM73100 tối đa, thời gian chặn tối đa | [CHƯA XÁC MINH]; 4,8 µA điển hình theo file Codex | số tối đa × nhiệt độ từ hãng; đo mẫu | đọc datasheet; đo ΔV rail nổi (xem mục 3 về tải đầu đo) | nóng, OUT giữ cao | xem #9 |
| 18 | Mẫu và phân tán | n = 2 motor, 2 mẫu LM73100 | số mẫu cho cận trên | — | cặp thuận lợi nhất | N do Box 08 đặt; n = 2 không bao được phân tán lô |

Hai điểm tôi chưa thấy trong bảng #1–#12 và muốn đưa lên:

1. **Đẩy tình cờ là cơ chế C, không phải B.** R04 §1 viết "V_emf chặn rail ≤ mức lái ≈ 6 V". Điều đó chỉ đúng khi bánh quay theo tốc độ được lái. Khi bị đẩy tay thì ω do người quyết định, V_emf theo mục 14: **rail do motor tự đẩy ≈ 19,6·v − 2V_d** [TÍNH]. Ví dụ [VÍ DỤ, V_d = 0,7 V mỗi diode giả định]: vượt 9 V ở v ≈ 0,53 m/s, vượt 12 V ở v ≈ 0,68 m/s, vượt 6,35 V ở v ≈ 0,40 m/s. Tốc độ người đi bộ vượt các mức này, nên "đẩy tình cờ" có cận **hữu hạn theo v_push,max**, không phải vô hạn; cận này là yêu cầu sản phẩm cộng η_ngược (#15). **Câu hỏi:** robot có bị đẩy lúc đã tắt driver với tốc độ nào là chấp nhận?
2. **Hai nhánh của cận A khác nhau khi đảo chiều.** Xem hàng #1. Đây là giả thuyết cần đo, không phải kết luận.

## 2. Rà fixture sàn phẳng (`mobot-robot-t8-flat-floor-fixture-review.md`)

| Cận cần đóng | Fixture nêu | Kết luận | Thiếu |
|---|---|---|---|
| Dòng trước ngắt có dấu | dòng từng motor có dấu; dòng tại ranh giới cầu H → VM; pre-trigger theo cạnh nSLEEP | **Đóng được có điều kiện** | băng thông và độ phân giải kênh dòng so với 0,38 A và so với tần số chopping/PWM (TBD, Box 08); ghi kèm trạng thái PWM/ILIM; ca **đảo chiều lệnh** trước ngắt; shunt nối tiếp phải không đổi đường hấp thụ (đặt shunt ở dây motor, không ở nhánh VM) |
| Năng lượng hồi hai motor, tụ chuẩn lớn | "tích phân năng lượng hồi cả hai motor" bằng trace; kẹp dự phòng chỉ để bảo vệ | **Chưa đóng** | fixture **không có tụ chuẩn C_ref**; tích phân qua đường kẹp là tích phân qua phần tử ứng viên (R04 §3 đã yêu cầu đo bằng C_ref không có shunt/TVS ứng viên); nếu kẹp dự phòng dẫn thì trace không chứng minh gì (fixture tự ghi). Cần: C_ref đo ở DC bias, điện áp định mức ≥ trần do Box 08 đặt, lặp với C ứng viên |
| Điện tích lọt phía converter khi LM73100 chuyển sang chặn | VIN/VOUT converter, dòng LM73100, ba ca OUT có áp / IN tụt chậm / IN tụt đột ngột, rò đo riêng | **Đóng được có điều kiện** | cách tạo "IN tụt chậm/đột ngột" lặp lại được (công tắc ngắt VIN, tốc độ dV/dt do Box 08 đặt); shunt ở chân IN nằm ở mức ≈ VOUT nên cần đầu đo vi sai (cặp đầu đo trừ nhau sẽ có nhiễu); C hữu hiệu phía converter (Box 08 mục 2 của fixture đã đòi); tải đầu đo lên rail nổi (xem mục 3) |
| Đẩy tình cờ | "giữ ca"; đầu tì mềm, đo lực và tốc độ, đo tốc độ xe và bánh riêng; bao "chưa gán số" | **Chưa đóng** (đúng, vì thiếu yêu cầu) | v_push,max, lực, thời lượng, chiều (founder/Box 08); lực tối thiểu quay ngược (#15); ghi cả ca đẩy khi driver disable **và** khi đang ngắt |
| Nhất quán hồ sơ | "bốn bánh #1090 Ø42 mm" | **Lệch với shortlist** (#1452 Ø40) và với `vm-isolation-t8-review` (mục tiêu 43 mm) | ba đường kính trong ba file; ảnh hưởng ≈ 5–7 % lên emf/(m/s) [TÍNH]. Cần Codex cập nhật hồ sơ fixture cho #1452 |

Nhận xét thêm: fixture nằm ở trạng thái "chưa đủ điều kiện cấp năng lượng" (đúng). Một **thứ tự hợp lý, ít rủi ro nhất** là bước 0 **không cấp năng lượng**: đo R, L, C, khối lượng, đường kính lăn, lực quay ngược bằng tay/lực kế; các số này đủ để tính cận A sơ bộ và chọn thang đo trước khi cấp VM. Đây là đề xuất, Box 08 quyết.

## 3. Rà danh sách mua (`mobot-robot-t8-purchase-shortlist.md`)

Danh sách hiện có chỉ gồm **#992 ×2, #1452 ×2 cặp, #1086 ×1 cặp (61,75 USD)**, và tự ghi "chưa gồm đồ đo". Nghĩa là **không món nào trong đó đo được** các cận ở mục 1. Cụm này đủ để lái, chưa đủ để lấy một con số nào của R04 §2. Hai ghi chú:

- Số lượng motor chỉ đủ n = 2. Hãng cảnh báo kẹt có thể làm hỏng motor/hộp số, và các lượt đo kích ngoại lực có thể phá mẫu. **Câu hỏi:** có mua một cặp dự phòng không (số lượng Box 08/founder quyết).
- Shortlist hoãn EVM, nguồn, kẹp tới sau khi QA rà fixture. Mục 2 cho thấy fixture còn thiếu C_ref và định mức kẹp, nên phải mua theo **năng lực** dưới đây, chưa theo mã.

**Đề xuất tối thiểu (theo năng lực, không chọn mã; giá [KHÔNG CÓ SỐ ĐO], tôi chưa khảo giá):**

| Nhóm | Cần | Phục vụ | Có thể đã có? |
|---|---|---|---|
| Đo thụ động (không cấp điện) | LCR meter đo R 4 dây và L; nếu không có DC bias cho tụ thì đo C_eff bằng nguồn dòng hằng + ΔV; cân 0,1 g; thước/lực kế | #2, #10, #14–#16 | TBD, hỏi founder |
| Scope | ≥ 4 kênh, băng thông ≥ 200 MHz (con số đến từ R04 #3, Box 08 chốt); 4 đầu đo thụ động có lò xo nối đất | #3, #6, #8 | TBD |
| Đầu đo vi sai hoặc cách ly | ít nhất 1, dùng cho shunt ở chân IN của LM73100 | #8 | TBD |
| Đo dòng | shunt 4 chân thấp L (giá trị Box 08 đặt) hoặc kẹp dòng DC với băng thông phù hợp; kẹp thường đắt hơn, shunt + đầu đo vi sai là phương án rẻ hơn [SUY LUẬN]. Cần hai dải: dòng motor ~0,4 A và dòng xung ngược | #1, #8 | TBD |
| Rò dài hạn | DMM/đầu đo có tải **≪ dòng rò cần đo**. Đầu đo thụ động 10 MΩ ở 6 V đã hút ≈ 0,6 µA [TÍNH], bằng ≈ 12 % của 4,8 µA điển hình, tức rò đo ra **thấp hơn thực** | #9 | TBD |
| Tụ chuẩn | bộ C_ref chọn được giá trị, điện áp định mức ≥ trần Box 08, ESR thấp; độ lớn cỡ mF nếu E ≈ 10 mJ [VÍ DỤ]: ΔV ≈ E/(C·V) = 1,7 V ở 1 mF, 0,35 V ở 4,7 mF [TÍNH]. C đo thật, không dùng giá trị ghi nhãn | #6, #10 | TBD |
| Nguồn | nguồn lab có giới hạn dòng cho VM/VIN (có thể đẩy VOUT ở #12 an toàn) | #12, kích | TBD |
| Tốc độ | cảm biến quang phản xạ hoặc đĩa mốc + camera quay chậm. Trang #992 ghi "no encoder" và **không nói có trục sau**, nên tôi không giả định gắn encoder được. Cần tốc độ bánh và tốc độ xe riêng (fixture đã đòi) | #4, #5, #13, #14 | TBD |
| Nhiệt | nhiệt kế hồng ngoại hoặc cặp nhiệt | #2, nhiệt dừng | TBD |
| Linh kiện đo | EVM/board giống chân cho DRV8833, LM73100, TPS63070 (R04 §3 yêu cầu cụm đại diện có đủ ba); tên EVM [CHƯA XÁC MINH] | #3, #8, #12 | không |
| Kẹp dự phòng độc lập | định mức theo dữ liệu bước 0 và Box 08; chưa chọn trước khi có L, I₀ ước tính | an toàn fixture | không |

**Thiếu rõ ràng so với yêu cầu fixture:** kẹp dòng/shunt thấp L, đầu đo vi sai, tụ chuẩn, LCR, nguồn giới hạn dòng, đo tốc độ, lực kế. Scope ≥ 200 MHz chỉ phục vụ #3 và #8; nếu Box 08 hạ yêu cầu băng thông thì giảm chi phí đáng kể. 7 kênh của R04 §3 vượt quá 4 kênh: chạy nhiều nhóm kênh lặp lại làm mất đồng bộ (giả định #10 ở R04 §5). **Câu hỏi:** chọn scope 8 kênh, hay hai scope đồng bộ trigger, hay chấp nhận chạy lặp và gắn kênh trigger chung?

## 4. Giả định có thể làm cận bị đánh giá thấp (bổ sung, không lặp R04 §5)

1. Dùng I₀ ≤ VM/R_w cho cả ca đảo chiều (hàng #1).
2. Lấy R_w từ kẹt ngoại suy rồi coi là cận dưới; R giảm khi lạnh và thay đổi theo vị trí rotor.
3. Lấy k_e hoặc tốc độ từ "typ ±20 %" thay giá trị cao nhất; emf/(m/s) lệch cùng chiều với tốc độ.
4. Dùng Ø40 danh nghĩa và bỏ lốp nén; r thật nhỏ hơn làm emf/(m/s) lớn hơn.
5. Coi V_emf bị chặn bởi VM (cơ chế B của R04) khi vẫn giữ ca đẩy tình cờ (cơ chế C).
6. Hạ η_ngược về 0 vì "100:1 khó quay ngược"; chưa có số.
7. Rò đo bằng đầu đo có tải; thấp hơn thực.
8. n = 2 mẫu; dung sai nhà sản xuất ±20 % / ±50 % cho thấy phân tán lớn, một cặp không bao được.
9. Dùng thông số fixture cũ (#1090, Ø42) cho tính quy đổi trong khi robot dùng #1452 Ø40.
10. Số liệu LM73100/TPS63070/DRV8833 trích gián tiếp qua file Codex; nếu file trích sai, mọi cận dẫn xuất sai theo. Tôi chưa tự đối chiếu.

## 5. Dữ liệu bắt buộc trước KiCad và phần kiểm trên robot hoàn chỉnh

Phần dưới áp dụng cho cả phương án module #2130/#4981 và bo con riêng. Phần khác biệt giữa hai phương án (partition carrier/bo con, bảng lỗi đầu nối) do chat con `relay06-partition` xử lý; tôi không lặp.

**Bắt buộc trước khi chốt giá trị và bố trí:**

1. Nhận dạng cụm: mã và ảnh, Ø lăn thật, tỷ số ngoài, khối lượng robot mục tiêu và khối lượng cụm thử (mục 1, hàng 13, 16). Đồng bộ #1090/#1452/43 mm.
2. R_w, L, k_e, ω_max, I₀ có dấu (kể cả đảo chiều), đo trên hai motor (hàng #1, #2, #4).
3. Yêu cầu sản phẩm bằng văn bản: VM_max, ω_max/v tối đa tự chạy, **v_push,max** (đẩy tình cờ), và quyết định cho ba ca mở: nhấc robot quay bánh bằng tay, đẩy tay khi đang bật nguồn, vận chuyển. Ca thả/xuống dốc đã loại.
4. E_rail bằng C_ref, V_peak và dV/dt cận A trên chân VM; η_ngược; lực quay ngược tối thiểu.
5. LM73100: rò **tối đa** × nhiệt độ, thời gian chặn **tối đa**, điện tích lọt; TPS63070: cận chịu VOUT khi EN thấp/VIN mất (hãng, hoặc đo). Cả hai [CHƯA XÁC MINH] ở phiên này.
6. C hữu hiệu tối thiểu/tối đa mỗi phía ở DC bias và nhiệt độ.
7. Box 08 chọn mức cận VOUT áp cho xung sự cố (12 V hay 9 V) và đặt biên.
8. Với phương án module: dữ liệu về tụ VM và phần tử bảo vệ có sẵn trên module (TBD, chưa mở trang module).

**Đề xuất đường chấp nhận nhỏ hơn [SUY LUẬN, Box 08 quyết]:** vẽ sơ đồ KiCad với vị trí phần tử kẹp/bulk ở dạng placeholder DNP, khóa **giá trị và layout công suất** chỉ sau mục 1–6. Cách này không giảm yêu cầu dữ liệu nhưng cho phép tiến vẽ phần không phụ thuộc.

**Kiểm trên robot hoàn chỉnh (không chặn KiCad):** nhiệt dừng lặp (T4), ngoại lực thật (T5), EMI, nhiều chu kỳ pin, E_rail ở khối lượng robot thật, v_push thực (xác nhận bao), ca vận chuyển nếu nằm trong yêu cầu.

## 6. Câu hỏi mở (không phải kết luận)

1. v_push,max và ca đẩy khi đang tắt driver: trong hay ngoài yêu cầu?
2. Nhấc robot quay bánh bằng tay, vận chuyển: trong hay ngoài yêu cầu?
3. Mua dự phòng một cặp #992?
4. Scope 8 kênh, hai scope, hay chạy lặp?
5. Hồ sơ fixture sẽ cập nhật sang #1452 Ø40 khi nào, và khóa đường kính lăn bằng cách nào?
6. TI LM73100 datasheet: ai mở và xác nhận rò tối đa, thời gian chặn tối đa trước Box 08?

## 7. Chưa làm

Không đo; không mở datasheet LM73100/TPS63070/DRV8833; không khảo giá đồ đo; không đọc module #2130/#4981; không đọc `bench-*.md`, `final-values.md`. Mọi số [TÍNH] ở đây dựa trên số Pololu ghi "typ" hoặc "lý thuyết" và chưa có dung sai chính thức, nên là thang độ lớn, không phải cận.
