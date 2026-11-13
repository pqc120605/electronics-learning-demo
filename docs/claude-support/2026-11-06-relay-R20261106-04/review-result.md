# REVIEW_RESULT · RELAY R-20261106-04 (Codex → Claude) · cận xung ban đầu và năng lượng hồi VM trước KiCad

Ngày 06/11/2026 19:33 · Leader Claude · chỉ đọc, mức thiết kế. Ba file scope đã đọc toàn văn. **Tôi không mở datasheet nào**; điểm datasheet là trích từ file Codex hoặc RELAY, nhãn **[CODEX]**. Số tôi tính: **[TÍNH]**. Giả định minh họa, không phải dữ liệu: **[VÍ DỤ]**. Số đo: không có. Giá trị thiếu: **TBD**.

## 0. Cập nhật phân xử trước

- **F2 (PS/SYNC): rút.** Cáo buộc của tôi có điều kiện ("nếu mức cao = PWM cưỡng bức"). Codex trích TI §6 ngược chiều (cao = PWM/PFM tiết kiệm điện, thấp = forced PWM). Tôi chưa tự đối chiếu; chấp nhận cho tới khi Box 08 xác nhận bằng số trang. Nếu Codex đúng thì câu BOM `:203` nhất quán và F2 không còn.
- **F1:** nhận phân xử. Mức nào áp cho **xung sự cố**: 12 V (abs max VOUT/FB) hay 9 V (dải khuyến nghị 2,5–9 V) là câu hỏi cho Box 08; tôi không chọn. Phải ghi rõ trong tiêu chí.
- Tôi đồng ý bỏ 9,5 V, hệ số 70 %, 20 lần/phút và "nửa sức chứa tụ" khỏi tiêu chí: các số đó là đề xuất của tôi, không có căn cứ hãng. Dưới đây ngưỡng chỉ ở dạng **cấu trúc + ai đặt**.

**Cập nhật 19:40, founder trả lời:** robot **không** phải chịu ca thả/xuống dốc (cận C, ngoại lực quay bánh). Hệ quả: #7 chuyển từ "yêu cầu TBD" thành "yêu cầu đã nêu bằng lời của founder", cần Codex ghi thành văn bản yêu cầu sản phẩm. Còn hở (giả định, chưa được founder trả lời): bánh bị quay bằng tay khi nhấc robot lên, đẩy robot bằng tay lúc đang bật nguồn, vận chuyển. Codex nên ghi rõ các ca này nằm trong hay ngoài yêu cầu; nếu trong, đo một bước quá tốc nhỏ ở #7.

## 1. Phản biện cách xác lập cận hiện tại

**Điểm 1 · "Cận xung ban đầu" gộp ba cơ chế khác nhau.** Nếu gộp, định mức TVS/shunt sai. Tách thành ba cận độc lập:

| Cơ chế | Bản chất | Cận lý thuyết | Cần |
|---|---|---|---|
| A. Xung cảm kháng | dòng cuộn dây còn lại khi driver Hi-Z, chảy qua diode thân về `VM` | ½·L·I₀² ; dòng đỉnh ≤ I₀ | L, I₀ **có dấu** ngay trước ngắt |
| B. Hồi suất điện động | motor quay làm máy phát, nạp rail qua diode thân | điện áp rail ≤ V_emf − 2·V_diode ; dòng ≈ (V_emf − V_rail − 2V_d)/R_w | k_e, ω_max, R_w |
| C. Quá tốc (ngoại lực) | bánh bị quay nhanh hơn tốc độ được lái (dốc, thả rơi, tay kéo) | V_emf tăng theo ω ; không có cận nếu chưa có yêu cầu sản phẩm | yêu cầu "ω hoặc v tối đa bị cưỡng bức" (TBD, cần founder/product) |

Hệ quả thiết kế: với A và B, **điện áp rail do motor tự đẩy lên bị chặn bởi V_emf ở tốc độ đã lái** (≈ mức VM lúc đang chạy, cỡ 6 V), nên hồi B không tự vượt ngưỡng kẹp ≥8 V. Quá áp đến từ A (xung) và C (ngoại lực). Đây là **suy luận cơ chế, chưa đo**; nhưng nó đổi câu hỏi định mức: cận C là yêu cầu sản phẩm, không phải số đo motor.

**Điểm 2 · Dòng I₀ có một cận từ tài liệu đã có.** `kicad-input-spec-r7.md` chọn R5/R6 = 0,62 Ω với ngưỡng giới hạn dòng DRV8833 160/200/240 mV (từ review trước, `2026-11-06-review-hardware/findings.md`, tôi chưa tự mở datasheet), tức 0,258/0,323/0,387 A **[TÍNH, theo giá trị file]**. Đó là cận của dòng được **điều chế** ở trạng thái lái. Nó **không** phải cận của dòng đỉnh: thời gian blank/chopping của DRV8833 cho phép vượt ngưỡng trong khoảng ngắn, và chế độ phanh ngược/giảm dòng có thể đổi dấu. Tài liệu đủ để **đặt giả thuyết** I₀ ≈ 0,39 A, không đủ để khóa. Đo I₀ có dấu là bắt buộc (Codex đã yêu cầu; tôi đồng ý).

**Điểm 3 · Cận năng lượng hồi không thể khóa bằng tài liệu với hồ sơ hiện tại.** Công thức cần:

E_hồi ≤ η_ngược · [ ½·(J_rotor + J_tải/N²)·ω_m² + ½·m·v² ] , với ω_m = N·ω_bánh, v = ω_bánh·r_bánh.

Hiện **TBD hết**: J_rotor (chưa tra), J_tải (bánh + bánh răng ngoài), N ngoài (chưa khóa), r_bánh (43 mm mục tiêu, chưa khóa mã), m robot (chưa có), ω_m,max ở VM_max, η_ngược (hộp số 100,37:1 truyền ngược kém, nhưng chưa có số). **Kết luận: chưa đủ để khóa bằng tài liệu hoặc mô hình.** Mô hình chỉ cho ra *công thức*; mọi tham số đầu vào chưa có.

Thang độ lớn để thấy vì sao không bỏ qua phần tịnh tiến **[VÍ DỤ, không phải dữ liệu]**: m = 0,5 kg, v = 0,2 m/s cho ½mv² = 10 mJ, cùng bậc với ngân sách tụ 66 µF (1,34 mJ) và 220 µF (4,47 mJ) khi nâng 6,35 → 9 V **[TÍNH]**. Phần này không về hết rail vì η_ngược của hộp số 100:1 thấp, nhưng η_ngược chưa có số, nên không thể coi bằng 0.

**Điểm 4 · "Một phép đo đóng cả hai cận" khả thi, với điều kiện đo năng lượng bằng tụ chuẩn, không bằng mạng bảo vệ ứng viên.** Xem §3.

**Điểm 5 · Phân biệt hai đại lượng mà RELAY yêu cầu:** năng lượng hồi phía motor (đo ở nút VM motor) và điện tích lọt phía converter (đo ở chân IN của LM73100) cần hai điểm đo và hai tiêu chí khác nhau; không dùng chung một tụ.

## 2. Bảng định cỡ (đại lượng → nguồn/cách đo → ca xấu nhất → tiêu chí đủ để chọn linh kiện)

"Tiêu chí" là **điều kiện đủ để chọn**, không phải ngưỡng pass bench. Mọi hệ số biên do **Box 08 đặt** (TBD); tôi không đề xuất số.

| # | Đại lượng cần giới hạn | Nguồn hoặc cách đo | Điều kiện xấu nhất | Tiêu chí đủ để chọn linh kiện | Trước KiCad? |
|---|---|---|---|---|---|
| 1 | I₀ có dấu mỗi motor ngay trước ngắt | kẹp dòng/shunt thấp L trên từng dây motor, đồng bộ `nSLEEP`; tài liệu chỉ cho giả thuyết (§1 điểm 2) | hai motor cùng chiều, VM = VM_max (5,77–6,35 V + dung sai) | I₀,max đo (max trên N lần lặp; N do Box 08 đặt), vượt cận tài liệu thì giải thích | **Có** |
| 2 | L, R_w mỗi motor | LCR meter gần tần số PWM; R 4 dây; hai motor | motor nóng | số có độ không đảm bảo; L nhỏ nhất cho dI/dt, R nhỏ nhất cho dòng hồi | **Có** |
| 3 | Cận xung A: V_peak tại chân `VM` driver, dV/dt, độ rộng | scope ≥200 MHz, lò xo nối đất, chân `VM` của `U10`; mạng chuẩn §3 | I₀,max, hai bridge cùng ngắt | V_peak,A,max đo trên mạng chuẩn ≤ cận linh kiện thấp nhất trên rail − biên Box 08 | **Có** |
| 4 | k_e, ω_m,max ở VM_max | tài liệu Pololu (no-load) + đo hở mạch back-EMF theo tốc độ | VM_max | V_emf,max; xác nhận B ≤ V_emf − 2V_d | **Có** |
| 5 | J_eq phía trục motor | thử giảm tốc tự do từ ω_max có đo tốc độ + dòng | cụm đúng bánh/bánh răng ngoài cuối | J_eq số đo với dải sai số; bánh chưa khóa thì đo cận trên bằng tải quán tính lớn hơn | **Có** (cụm đại diện) |
| 6 | Năng lượng hồi về rail E_rail (hai motor) | **một** phép đo bằng tụ chuẩn lớn (§3) tại ω_max; tỷ lệ theo ω² từ các bậc 25/50/75/100 % | hai motor cùng quay, cùng ngắt | E_rail,max đo + phần chưa đo (C) cộng theo cận | **Có** |
| 7 | Quá tốc ngoại lực (C) | yêu cầu sản phẩm: ω/v tối đa cưỡng bức; thử kéo bánh bằng nguồn quay đo được | ω_ngoại,max theo yêu cầu | V_emf(ω_ngoại) và E_rail cho ω_ngoại; **yêu cầu TBD** | **Có (yêu cầu)**; đo robot đầy đủ để xác nhận |
| 8 | Điện tích lọt phía converter khi LM73100 dẫn → chặn | dòng ngược tại chân `IN` (shunt thấp L, nối tiếp) + áp `IN`/VOUT; 3 ca: OUT có áp trước, IN tụt chậm, IN mất đột ngột | OUT cao hơn IN lúc chuyển | Q_lọt = ∫I_ngược dt; ΔV_converter = Q_lọt / C_hữu hiệu phía converter ≤ cận VOUT thấp nhất (12 V abs / 9 V khuyến nghị, Box 08 chọn mức) | **Có** |
| 9 | Dòng rò ngược dài hạn của LM73100 | datasheet **tối đa** × nhiệt độ (không dùng 4,8 µA điển hình); đo mẫu | OUT giữ cao lâu, nóng | tốc độ rail nổi = I_rò,max / C_converter; thời gian tới mức nguy hiểm (§4) | **Có** (tài liệu); đo xác nhận sau |
| 10 | C hữu hiệu phía motor và phía converter | LCR ở DC bias và nhiệt độ thực; tổng ≤ 470 µF theo `TPS63070 §7.3` [CODEX] kèm điều kiện L | MLCC ở 6–9 V, nóng/lạnh | C_eff,min cho tính hấp thụ; C_eff,max cho khởi động | **Có** |
| 11 | Ngưỡng kẹp và năng lượng phần tử kẹp/xả | đường cong V_C–I_PP của TVS hoặc đặc tính ngưỡng shunt tự cấp; SOA/nhiệt FET, điện trở xả | dòng đỉnh từ #1/#3, E từ #6/#7 | V_C(I_peak) ≤ cận rail − biên; E một lần ≤ định mức xung; nhiệt lặp theo tần số dừng từ ca sử dụng | **Có** (dữ liệu hãng); đo robot đầy đủ để xác nhận |
| 12 | U8 khi VOUT bị đẩy áp, EN thấp, VIN mất | datasheet TPS63070 (hiện **không có** cận theo RELAY); nếu thiếu thì đo mẫu bằng nguồn lab giới hạn dòng đẩy VOUT | VIN = 0, EN thấp | cận chịu đựng đo/được hãng bảo đảm; nếu không có thì giữ LM73100 cô lập và ΔV_converter không vượt cận hãng đã biết | **Có** |

**Bắt buộc trước KiCad:** #1–#6, #8–#12 (dữ liệu phần cứng/hồ sơ) và **yêu cầu sản phẩm** của #7. **Kiểm trên robot hoàn chỉnh (không chặn KiCad):** nhiệt dừng lặp (T4), ngoại lực thật (T5), dốc, EMI, nhiều chu kỳ pin, xác nhận E_rail ở khối lượng robot thật.

## 3. Phép đo đại diện duy nhất: lấy cả hai cận và tách hai đại lượng

**Cụm đại diện:** hai Pololu #992 + bánh cuối cùng (hoặc tải quán tính đã đo J ≥ bánh thật) + DRV8833 (EVM hoặc board giống chân) + LM73100 (EVM) + TPS63070 (EVM hoặc `U8` thật) + dây dài gần thật. Khóa mã bánh và tỷ số ngoài trước, hoặc đo hai biên (bánh nhẹ/nặng) để bao.

**Đo năng lượng không dựa vào mạng bảo vệ ứng viên.** Đặt **tụ chuẩn lớn** C_ref (điện dung đo ở DC bias thực, ESR thấp) ở nút `VM` motor, **không** có shunt/TVS ứng viên. Với C_ref đủ lớn để V_rail không tới giới hạn:

E_rail = ½·C_ref·(V_cuối² − V_đầu²) (cộng phần tiêu tán nếu đo được).

Cách này cho **tổng năng lượng hồi** (#6) bằng một số đo, không cần biết J, η, m riêng lẻ, đúng ý Box 08 ("một phép đo trực tiếp trên đúng cụm đóng được cả hai cận thì không cần đo riêng mọi đại lượng trung gian"). Lặp với **C nhỏ** (C ứng viên) trong dải tốc độ nâng dần để lấy **dạng xung** V_peak, dV/dt (cận A, #3), dừng khi chạm giới hạn do Box 08 đặt.

**Trình tự:**
1. Nâng tốc độ: 25 → 50 → 75 → 100 % PWM (hai motor cùng chiều, rồi ngược chiều); mỗi bậc ghi I₀ có dấu hai motor.
2. Ngắt: `nSLEEP` thấp, `EN` U8 thấp, VIN hở (ca xấu nhất); ghi đồng bộ các kênh dưới.
3. Lặp ≥N lần mỗi điều kiện (N do Box 08 đặt) để lấy cận trên thống kê; ghi nhiệt độ.
4. Bước **quá tốc**: quay bánh bằng nguồn ngoài đo được tới ω_ngoại theo yêu cầu #7, hai motor trả về.

**Kênh ghi (đồng bộ, cùng thang thời gian):**

| Kênh | Điểm đo | Cho cận |
|---|---|---|
| CH1 | áp tại chân `VM` của `U10` (motor) | #3, #6 |
| CH2 | áp tại `VOUT/IN` phía converter | #8, #12 |
| CH3 | `nSLEEP`, `EN`, trạng thái VIN | thứ tự ngắt |
| CH4–5 | dòng motor A, B có dấu | #1 |
| CH6 | dòng qua chân `IN` của LM73100 (shunt thấp L, có dấu) | #8, Q_lọt |
| CH7 | dòng nhánh hấp thụ/tụ chuẩn | #6, #11 |

**Tách hai đại lượng RELAY yêu cầu:** *năng lượng hồi phía motor* = tích phân công suất vào nút `VM` motor (CH1 × dòng nhánh motor/driver) hoặc ΔV của C_ref; *điện tích lọt phía converter* = ∫CH6 dt khi LM73100 chuyển sang chặn. Hai điểm đo, hai tụ khác nhau; **không** chia sẻ C_ref.

## 4. Điện tích lọt phía converter và rail nổi: lập luận cần kiểm

- **Rò dài hạn.** Rò điển hình 4,8 µA [CODEX] không phải cận. Minh họa **[TÍNH]**: 4,8 µA vào 66 µF cho 0,073 V/s, hơn 4 V sau 60 s nếu không có đường xả. Với rò *tối đa* ở nhiệt độ cao (TBD) có thể nhanh hơn. Hệ quả: rail phía converter **nổi lên về mức `OUT`** theo thời gian. Mức cao nhất bị chặn bởi mức `OUT` (đã bị kẹp bởi mạng motor), rò không đẩy vượt mức đó. Vậy **mạng kẹp phía motor phải nằm dưới cận VOUT của U8** (12 V abs, hoặc 9 V nếu mức khuyến nghị áp cho xung dài), chứ không chỉ dưới cận DRV8833. [LẬP LUẬN, chưa đo]
- **Xung chuyển sang chặn.** Điện tích lọt = ∫dòng ngược dt trong lúc LM73100 còn dẫn ngược. Thời gian đáp ứng *tối đa* chưa có (RELAY chỉ có điển hình). Cần số tối đa từ datasheet hoặc đo CH6. Phần này nhỏ so với phía motor nhưng đập vào tụ nhỏ phía converter (C22a–c 66 µF danh định, hữu hiệu nhỏ hơn).
- **Năng lượng cuộn L4** (1,5 µH) khi `EN` thấp lúc đang có dòng: cỡ µJ ở dòng vài A, nhỏ; vẫn ghi CH2 để xác nhận.

## 5. Giả định có thể làm cận bị đánh giá thấp

1. Dùng giá trị **điển hình** (rò 4,8 µA, thời gian đáp ứng, no-load rpm) thay giá trị tối đa/tối thiểu.
2. Tính ở VM danh định 6 V thay VM_max 6,35 V cộng dung sai.
3. Một motor thay vì hai motor cùng chiều; hai bridge cùng đóng góp dòng vào `VM`.
4. Điện dung ghi nhãn thay C hữu hiệu ở DC bias/nhiệt; **polymer C23 cũng suy giảm theo nhiệt độ thấp (TBD)**.
5. Bỏ phần tịnh tiến ½mv² vì "hộp số 100:1 truyền ngược kém" khi η_ngược chưa có số.
6. Lấy tốc độ từ no-load mà quên ω thực có thể cao hơn khi VM = VM_max hoặc có ngoại lực kéo (#7).
7. Dùng dòng stall ngoại suy làm cận, trong khi chỉ để sàng lọc (đúng ghi chú Box 03).
8. Probe/đất dài làm ring sai; đo ở đầu dây thay vì chân `VM`.
9. Bỏ ESL/ESR của dây nối và tụ chuẩn, nên V_peak đo thấp hơn thực tế ở chân IC.
10. Mất đồng bộ giữa các kênh làm sai Q_lọt hoặc E.
11. Giả sử LM73100 và U8 ở nhiệt độ phòng khi robot nóng/lạnh.
12. Yêu cầu ngoại lực (#7) chưa viết: nếu không có, cận C vô hạn về hình thức.

## 6. Điều kiện đủ để khóa bằng tài liệu hoặc mô hình (không cần đo)

Chỉ khi **đồng thời** có: (a) J_rotor, k_e, R, L từ hãng cho đúng #992 (hoặc số đo); (b) bánh, N ngoài, m robot, v tối đa, η_ngược có số có sai số; (c) yêu cầu ngoại lực #7; (d) cận chịu đựng VOUT của U8 khi EN thấp/VIN mất, từ hãng; (e) thời gian đáp ứng và rò **tối đa** của LM73100. Hiện (a) một phần, (b)–(e) **chưa có**. Vậy: **chưa khóa được bằng tài liệu/mô hình; cần đo một lần theo §3 hoặc hoãn chọn linh kiện.** Có thể chọn *họ* bảo vệ (shunt tự cấp + tụ) nhưng chưa chọn *giá trị*.

## 7. Việc cho Codex

1. Chốt yêu cầu ngoại lực (#7) với founder/product: có ca thả/dốc không; nếu không, ghi rõ giới hạn cho cận C.
2. Khóa mã bánh, đường kính lăn, tỷ số ngoài, khối lượng robot mục tiêu (cho J_eq và m).
3. Lấy từ hãng: LM73100 rò *tối đa* và thời gian đáp ứng *tối đa*; U8 cận chịu VOUT khi EN thấp/VIN mất (hãng không bảo đảm thì ghi rõ và dùng đo #12).
4. Box 08 duyệt cấu trúc phép đo §3 và đặt mọi hệ số biên.
5. Chọn tụ chuẩn C_ref (điện dung đo ở DC bias, ESR thấp); chuẩn bị cụm đại diện; xin phép founder cho bench.
6. Sau khi có #1–#12, chuyển Box 02 định mức shunt/TVS/tụ.

## 8. Chưa xong / không kiểm chứng

- Không mở datasheet nào; chưa đo; công thức §1 và §3 là mô hình, mọi tham số đều TBD.
- Cơ chế "V_emf chặn điện áp rail" (§1) là suy luận, cần số đo #4, #6, #7 để xác nhận.
- Chưa đọc `bench-additions.md`, `final-values.md`, `bench-test-plan.md` để xem BT-R1a/BT-ISEN đã có dữ liệu nào cho #1, #2.
- Tham số Pololu #992 (J_rotor, no-load rpm, k_e) tôi chưa tra; không đưa số nào.
