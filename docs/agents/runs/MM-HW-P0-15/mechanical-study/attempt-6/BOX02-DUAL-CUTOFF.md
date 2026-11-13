Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c85a-dc90-7ac0-84f1-26511760da72

**Chọn hai relay thường mở TX2-3V mắc nối tiếp trước converter, với hai đường cho phép độc lập trên từng nhánh coil.** Một kênh báo khỏe giả hoặc một tiếp điểm hàn dính vẫn để kênh kia ngắt tải. Việc cho cả hai kênh quyền ngắt từng coil cũng xử lý đường tiêu thụ còn sót sau trip mà phương án mỗi kênh điều khiển coil riêng sẽ để lại.

Finding P1 vẫn áp dụng. Một guard hở có thể tạo \(P-N=+0,45\) V với cell thật 0,8 V. Bằng chứng độc lập phải kéo dài từ điểm lấy Kelvin, reference và latch tới phần tử ngắt tải. [Review P1](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-5/BOX08-REVIEW.md) · [Báo cáo r2](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-5/REPORT-r2.md)

### Đường tải và cấp coil

Đường tải là **nguồn pack đã bảo vệ → tiếp điểm A → tiếp điểm B → converter**. Mỗi coil có nhánh cấp riêng, qua hai phần tử ngắt nối tiếp do A và B điều khiển, rồi tới khối điều hòa điện áp coil. Hai nhánh không dùng chung rail sau hai phần tử ngắt. Driver và mạch giám sát cần nguồn kiểm tra trước tiếp điểm để CHECK có thể chạy khi tải còn OFF.

Ở mức logic, \(C_i=A_i\land B_i\) cho từng coil. Với \(W_i\) là tiếp điểm hàn dính, đường tải dẫn khi \((C_A\lor W_A)\land(C_B\lor W_B)\). Phép kiểm logic giữ tải OFF khi A báo khỏe giả và tiếp điểm A đồng thời hàn dính, miễn B còn ra được lệnh ngắt. Đổi A/B cho kết quả tương tự.

| Ca lỗi | Đường cần kiểm và kết quả có điều kiện |
|---|---|
| A báo khỏe giả hoặc gate A kẹt ON | Hai phần tử do B điều khiển cắt cấp cho cả hai coil. Tiếp điểm B mở. |
| Một tiếp điểm hàn dính | Tiếp điểm còn lại tự cắt toàn bộ dòng converter. Mỗi tiếp điểm phải đủ khả năng ngắt riêng. |
| Pack+ chập vào một nhánh coil sau các gate | Coil nhánh đó có thể vẫn hút. Nhánh coil còn lại phải tách điện đủ để tiếp điểm của nó mở. |
| Một rail coil chung sau gate bị nối sang Pack+ | Cả hai coil có thể hút dù A/B yêu cầu OFF. Đây là phản ví dụ loại cách dùng rail coil chung sau gate. |
| Mất gate drive hoặc bias | Mỗi gate phải có bias cục bộ về trạng thái ngắt. Phải truy cả body diode, ESD, đường logic và tụ có thể giữ gate hoặc cấp ngược coil. |
| Flyback và nguồn ngược từ converter | Clamp coil phải khép trong nhánh coil tương ứng. Tụ converter có thể còn cấp tải sau khi tiếp điểm mở, nên cần tách thời điểm ngắt dòng pin khỏi thời điểm tải mất điện. |
| Mất BAT0, fuse mở hoặc reference chung hỏng | Kiểm return qua sense, debug, shield, clamp và nguồn driver. Nếu chỉ còn đường sense bị giới hạn bởi guard, cận 77,57 µA qua coil ở 20 °C tương ứng khoảng **5,49 mV** với trở coil lớn nhất trong bảng. Cận DC đó chỉ có giá trị sau khi loại các đường cấp khác và năng lượng lưu trong tụ. |

### Cận hãng và phần cần qualification

Panasonic TX2-3V là relay không chốt, coil 3 V, **46,7 mA nominal**. Hai coil cộng **93,4 mA nominal** trong RUN. Hãng khuyến nghị điện áp coil trong ±5% mức định mức, tức **2,85–3,15 V**. Pick-up tối đa 2,25 V và drop-out tối thiểu 0,30 V là thông số ban đầu tại **20 °C**. Tiếp điểm chuẩn định mức **2 A tại 30 VDC với tải thuần trở**. Release **4 ms MAX** tại 20 °C, từ coil đang cấp áp định mức, **không có diode flyback và chưa tính bounce**. [Panasonic TX, ASCTB18E 201908, tr. 2](https://mediap.industry.panasonic.eu/assets/download-files/import/ds_61022_en_tx.pdf)

Mức 4 ms chưa đủ làm deadline bảo vệ RUN. Qualification cần ghi đồng thời **điện áp và dòng coil, dòng pin, trạng thái dẫn của từng tiếp điểm**, rồi xác định thời điểm dòng pin xuống dưới giới hạn sau trip. Các ca quyết định là coil nóng tại pack thấp, pack cao, clamp thực, một tiếp điểm bị cưỡng bức dẫn, một nhánh driver kẹt, mất bias và tải converter có inrush. Mỗi tiếp điểm phải chịu được ca ngắt một mình, kể cả khi tiếp điểm kia hàn dính. Cận 2 A thuần trở chưa xác lập kết quả đó.

Nếu giữ **100 µA** làm ngân sách so sánh, sau khoản sense 77,57 µA còn **22,43 µA** cho AON, nguồn CHECK, driver và leakage của hai nhánh coil. Khi một kênh kẹt HIGH, kênh kia phải cắt được **cả nguồn khối điều hòa coil**, nếu không dòng tĩnh của khối này vẫn tính vào 22,43 µA. [Cận sense trong báo cáo r2](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-5/REPORT-r2.md)

**Kỹ sư còn tự làm được** phần chọn khối cấp coil đáp ứng 2,85–3,15 V dưới sag, lập cận dòng OFF, truy đường cấp ngược và chuẩn bị tiêu chí qualification. **Đầu vào thật sự cần Founder** xuất hiện khi đã có BOM, fit và thời lượng pin để quyết định có chấp nhận tải coil của phương án này, hoặc khi trình cấu hình fixture đúng hash để xin quyền bench. Hiện phương án đủ cụ thể để review đường lỗi, còn P1 chưa đóng ở cấp thiết kế.
