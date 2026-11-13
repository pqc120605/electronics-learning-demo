# P0-02 — interface/fab/fixture mechanical requirements proposal v1

Source Box03 turn `01a1bb9e-251c-7460-8f5f-088dc2f32124`; Sol/high. Status: PROPOSED; no material choices approved, no hardware build or physical evidence. New values below are proposed requirements and must not be copied as manufacturer guarantees.

**Đề xuất đóng trên giấy phần giao diện tay cầm bằng một hợp đồng bó dây 150 mm và baseline fab có điều kiện tiếp nhận.** Các giá trị dưới đây là yêu cầu thiết kế mới để Box02 tính và Box08 review, chưa phải thông số đã duyệt hoặc số đo mẫu. Chúng cụ thể hóa ba đầu vào mà QA yêu cầu, gồm điện trở toàn tuyến, dung sai fab và bằng chứng OFF thực. [Verdict Box08 ngày 08/11](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-02-box08-2026-11-08.md)

**Hợp đồng bó dây đề xuất**

| Mục | Yêu cầu để đưa vào proposal |
|---|---|
| Cấu trúc | **11 dây, GH 12 cực**, một khoang trống. Giữ năm tín hiệu, GND chức năng, rail sense và hai vòng nhận dạng có đường hồi riêng. USB RUN đi bằng cáp riêng. |
| Đầu carrier | `SM12B-GHS-TB` cắm ngang, `GHR-12V-S`, terminal `SSHL-002T-P0.2`. Miệng hướng khoang B01. |
| Dây và chiều dài | Đồng mềm mạ thiếc **AWG 28**, vỏ ngoài **0,76–1,00 mm**. Chiều dài đường dẫn **150 ±10 mm**, tính cả phần vòng bảo trì. DCR yêu cầu ở nhiệt độ bó dây tối đa **50 °C: ≤0,25 Ω/m**. Đây là yêu cầu mua dây, cần datasheet hoặc chứng nhận lô đáp ứng. |
| Điện trở hoàn chỉnh | **≤0,15 Ω mỗi đường ở 50 °C**, từ điểm nối trên B01 đến pad carrier, gồm dây, GH, đầu ghép B01 và mối nối. Với 160 mm dây, ngân sách dây là **0,040 Ω**. Dành **0,050 Ω** cho tiếp xúc GH sau thử môi trường, còn **0,060 Ω** cho các mối nối khác. |
| GND và sense | Đề xuất **dòng hồi đồng thời qua GND chức năng ≤20 mA** và **lệch mass tổng ≤5 mV**. Bó dây chiếm tối đa **3 mV**, còn **2 mV** cho đường đồng và các phần chưa tính. Mỗi vòng sense dự trù tối đa **0,30 Ω** cho hai đường dây, cộng riêng công tắc và mạng cuối tuyến. Box02 phải chứng minh cận này đáp ứng ADC, logic, tải quá độ và phát hiện lỗi. |
| Giữ dây | Điểm giữ trên gá trong phạm vi **20 mm sau housing**. Chừa một đoạn chùng và bán kính uốn đề xuất **≥5 lần đường kính bó**, đồng thời tuân thủ cận lớn hơn nếu hãng dây yêu cầu. Housing phải tháo được bằng tay sau khi mở khoang bảo trì, lực kéo dây truyền vào gá. |

JST công bố dây AWG 30–26, vỏ 0,76–1,00 mm và điện trở tiếp xúc tối đa **30 mΩ ban đầu / 50 mΩ sau thử**. Định mức 1 A của catalogue gắn với AWG 26. Nó không xác nhận cả bó AWG 28 hoàn chỉnh. Phía B01 có thể dùng đầu ghép hoặc pigtail, nhưng phải đáp ứng cùng cận điện trở, chiều cắm và chống kéo. Mã đầu ghép và cách lắp vẫn cần khớp PCBA được cung ứng. [Catalogue JST GH](https://www.jst-mfg.com/product/pdf/eng/eGH.pdf)

Nếu Box02 chứng minh được ngân sách tải và ngưỡng trên, HQ có thể dùng hợp đồng này để đóng yêu cầu **CARRIER‑INTERFACES** trên giấy. Đo điện trở và thử giữ dây sau đó xác nhận chất lượng cụm giao. Điều kiện còn chặn là cách nối B01 cụ thể và cận điện của toàn tuyến, thay vì chờ mọi kích thước clone.

**Baseline fab đề xuất**

Dùng **JLC04161H‑3313A**, bốn lớp, **1,6 mm**, mask xanh, ENIG và mép phay. L2 là GND liên tục, L3 phân phối nguồn. Dùng trace/space tín hiệu **0,15/0,15 mm**, via **lỗ/pad 0,30/0,60 mm**, đồng cách mép phay **0,30 mm**. Kiểm riêng từ mép lỗ đến đồng khác net lớp trong **0,20 mm cho via / 0,30 mm cho PTH**. Clearance pad–đồng vẫn áp dụng đồng thời. [Stackup JLCPCB](https://jlcpcb.com/impedance) · [Năng lực PCB cứng](https://jlcpcb.com/capabilities/pcb-capabilities)

Để tính điện, đề xuất ghi vào điều kiện mua PCB **đồng ngoài hoàn thiện tối thiểu 30 µm, đồng trong tối thiểu 12 µm và mạ thành lỗ tối thiểu 20 µm cục bộ**. Đây là **yêu cầu tiếp nhận đề xuất**, chưa được JLC bảo đảm cho option mặc định. HQ cần bằng chứng fab áp dụng hoặc đổi cận tính theo giá trị fab chấp nhận.

Tính lại với bề rộng thấp hơn bản vẽ **20%**, đồng ngoài tối thiểu 30 µm, điện trở suất thiết kế **0,0214 Ω·mm²/m** và chiều dài đường đi tối đa 25 mm:

| Nhánh tay cầm | Bề rộng đề xuất | Kết quả tính DC |
|---|---:|---:|
| Pack, 0,977 A | **1,10 mm** | **19,80 mV** |
| RUN 5 V, 0,60 A | **0,90 mm** | **14,86 mV** |

Đây là delta từ bề rộng dự trù 0,80/0,65 mm, nhằm giữ phân bổ sụt áp sau dung sai. Số tính chưa gồm đường hồi, via và cổ pad. Với lỗ via nhỏ nhất 0,22 mm, thành đồng tối thiểu 20 µm và bo dày nhất 1,76 mm theo yêu cầu trên, mô hình thân via cho **≤2,50 mΩ/via**. Chọn số via từ sụt áp, phân dòng và nhiệt của đường thực tế. Các tính toán này không phải kết quả đo nhiệt. [Dung sai gia công JLCPCB](https://jlcpcb.com/capabilities/pcb-capabilities)

**Proposal fixture OFF riêng**

Đề xuất dùng **ngàm kẹp vai cứng đầu chụp**, chặn bằng điểm dừng trên gá, hồi về trạng thái giữ khi mất bias. Gá giữ B01 theo chuẩn mép và mặt đỡ. Thêm khối kẹp độc lập tháo được để thử khả năng giữ khi chốt chính kẹt mở. Mỗi phần giữ cần được kiểm riêng; hai phần cùng phụ thuộc một vai đầu chụp hoặc một gá yếu vẫn có lỗi chung.

Đo hành trình **thân phích** bằng đầu đo đặt trực tiếp, lấy gá cổng làm mốc. Đo chốt ở kênh riêng, cùng lực kéo, CC/VBUS và trace OFF thực. Fixture phải cho đặt lực kéo trước OFF, kéo dọc và lệch, giữ chốt ở trạng thái kẹt mở/đóng, và kiểm tiếp cận lẫy bảo trì khi bỏ từng bước. PASS khi biên nhả sau OFF thực vẫn dương sau sai số, và các khe ngoài không cho tác động lẫy hoặc kéo đầu chụp đi vòng. **Lực/góc và hành trình chốt chưa có số đủ căn cứ để khóa.** Cần mã chốt, cáp và mẫu B01 trước khi chốt chúng trong proposal fixture. Proposal này cần duyệt riêng trước chế tạo hoặc thử, phù hợp hướng giải vòng phụ thuộc mà Box08 đã nêu. [Kết luận P0‑02](/D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-p0-02-conclusion-2026-11-08.md)

**Gói dữ liệu nhà bán và fallback có điều kiện**

| Đối tượng | Yêu cầu chính xác | Nếu không lấy được |
|---|---|---|
| **B01** | Ảnh hai mặt của hàng dự kiến giao, SKU/lô hoặc định danh tương đương, marking PCB/bridge/regulator, nhãn header và cam kết biến thể giao không thay âm thầm. Sơ đồ đúng revision nếu có. | Đề xuất lập **mẫu chuẩn nhận hàng** từ một lô truy xuất được, để người vận hành được phép đối chiếu trước khi khóa nguồn cung. Nếu không giữ được biến thể ổn định, trình Founder lựa chọn bo có hồ sơ hãng bằng revision riêng. |
| **Jauch `250832` Rev. 1.2** | Bản vẽ mặt ghép XHP‑3 có khoang 1 và bảng dây, NTC R–T/dung sai/vị trí, dải CV cho phép, termination, timer và recharge. | Nếu thiếu ánh xạ dây, đề xuất xác minh trên đúng pack theo nhiệm vụ riêng. Nếu thiếu giới hạn profile hoặc NTC, cần trình phương án pack/charger có hồ sơ đủ để duyệt riêng. |

Cặp fallback trên chưa thay quyết định Founder. H3, B01 theo ảnh và D10 tiếp tục là căn cứ hiện hành. Phần có thể đóng tiếp bằng giấy là hợp đồng bó dây và baseline fab sau khi Box02 xác nhận ngân sách, fab đáp ứng cận mua và Box08 review. **OFF-release và dữ liệu profile/NTC còn thiếu vẫn là các điều kiện thiết kế cần bằng chứng riêng.**
