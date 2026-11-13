Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c525-0e46-7d02-8421-e74e99422c06
Read-only analysis; no schematic, MPN or gate approval.

**Refinement A: Nch + pull-up cục bộ giải quyết yêu cầu CMOS phải source dòng ở 1,1 V, nhưng chưa tạo được disconnect fail-off.** Ngay cả khi có FET với \(R_{DS(on)}\) được bảo đảm tại gate thấp, vẫn còn phản ví dụ hở OUT, điện áp detector quá thấp và tự đóng lại sau khi cell hồi áp.

**Đính chính:** S-1009 bản **Nch có điện áp hoạt động tối thiểu 0,7 V**; 0,6 V thuộc bản CMOS. Candidate nghiên cứu là **S-1009N11I-M5T1U**, SOT-23-5, Rev.5.1_03. Các cận ngưỡng nghiên cứu trước vẫn áp dụng; không thành cấu hình được duyệt. [ABLIC, tr. 4 và 8](https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf)

Cấu trúc được xét ở mức phân tích: detector lấy nguồn từ chính cell; OUT kéo gate N-FET xuống khi undervoltage; điện trở kéo gate lên cực dương cell khi healthy; điện trở gate–source xả gate. Không nối logic sang rail 5 V.

| Trường hợp | Kết quả |
|---|---|
| **Healthy, OUT hi-Z** | Pull-up cấp gate, tránh cần CMOS source current. Tuy nhiên gate thực nhỏ hơn \(V_\text{cell}\) do divider/leakage; \(R_{DS(on)}\) phải được bảo đảm tại điện áp nhỏ nhất thực đó và dòng tải thật. |
| **OUT/đường gate từ detector bị hở** | **Fail-ON:** pull-up vẫn cấp gate. FET tốt hơn không sửa được lỗi này. |
| **Nhánh cấp VDD riêng của detector hở nhưng pull-up còn nguồn** | Detector mất khả năng sink; gate có thể tiếp tục HIGH. Nếu toàn bộ nhánh chung cấp cả pull-up cùng hở thì gate–source có thể kéo OFF, nhưng không bao phủ lỗi nhánh riêng. |
| **VSS detector hở** | Không có trạng thái OUT được bảo đảm; không thể coi là LOW. |
| **Dây harness series hở** | Tạo gap tải nếu thực sự là conductor duy nhất. Đây khác lỗi dây detector; phải kiểm cả bypass và năng lượng phía tải. |
| **Cell hồi áp sau cutoff** | Detector tự release. Không có latch riêng thì có thể đóng lại, sụt áp rồi trip lặp; chưa đáp ứng reset bằng thao tác tay. |

**Không chứng minh được OFF dưới 0,6 V bằng “gate energy nhỏ”.** Khi OUT mất hiệu lực và pull-up còn nối cell, gate có nguồn DC duy trì:

\[
V_{GS}\approx V_\text{cell}\frac{R_{GS}}{R_{PU}+R_{GS}}
\]

Gate không chỉ giữ một gói năng lượng hữu hạn rồi tự hết. Điện áp gate nhỏ vẫn có thể cho phép năng lượng từ hai cell còn lại đi qua channel.

Ví dụ đối chứng hãng: **PMV40UN2**, datasheet 24-Apr-2014, có \(V_{GS(th)}\) tối thiểu **0,4 V tại 250 µA, 25°C**. Với cell 0,59 V và divider ít suy hao, không có cơ sở gọi channel là OFF. Ngưỡng này không cho biết dòng cụ thể tại 0,59 V; nó đủ bác suy luận “dưới 0,6 V chắc chắn tắt”. Part này cũng chỉ bảo đảm \(R_{DS(on)}\) từ 1,8 V, nên **không được chọn cho tải cell 1,1 V**. [Nexperia PMV40UN2, tr. 6](https://assets.nexperia.com/documents/data-sheet/PMV40UN2.pdf)

**Diode thân và đảo cell:**

- N-FET đặt ở nhánh âm, source về cực âm cell và drain về đường return bên ngoài có thể chặn chiều dòng xả **D→S** khi OFF; diode thân **S→D** vẫn dẫn chiều ngược. Một FET không tạo cách ly hai chiều.
- Đảo FET để đổi chiều chặn có thể khiến diode thân vượt qua chức năng cutoff khi xả.
- Hai FET đối đầu có thể chặn hai chiều, nhưng không tự giải quyết gate drive, hở OUT, latch hoặc nguồn detector bị đảo.
- Cell lắp ngược cấp nguồn âm cho detector chưa được bảo vệ. Không suy từ gate âm rằng toàn bộ cụm sẽ hỏng theo trạng thái an toàn.

**Dòng sau trip phải tính cả pull-up.** Khi OUT LOW:

\[
I_\text{cell}=I_\text{detector}+\frac{V_\text{cell}-V_{OUT}}{R_{PU}}+I_\text{leakage}
\]

Ví dụ chỉ để phân bổ: \(R_{PU}=1\,MΩ\) tạo thêm tối đa khoảng 1,1 µA tại cell 1,1 V, tương đương **26,4 µAh/ngày/cell**, chưa cộng detector, divider và leakage. Không được lấy 0,9 µA của detector làm dòng OFF toàn cụm; thông số đó có điều kiện đo cụ thể. [ABLIC, tr. 8](https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf)

**Disposition:** dừng refinement này ở **insufficient_evidence**, không đề cử bộ MBOM hoàn chỉnh.

Delta thực cần Founder chọn khi HQ trình phương án cụ thể là: sau trip có chấp nhận **tháo cassette/tháo cell để lưu kho**, hay sản phẩm phải **giữ nguyên pin và tự ngắt, khóa OFF lâu dài**. Chưa cần invent thời hạn lưu kho. Codex vẫn có thể chuẩn bị ngân sách \(I_\text{OFF,max}\times t\), phương án latch/manual reset và bảo vệ đảo cell cho hai chế độ; các lỗi fail-ON nêu trên phải được sửa ở thiết kế, không chuyển thành yêu cầu đo mẫu hoặc D10.
