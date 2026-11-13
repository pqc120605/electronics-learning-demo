# MoBot EVT0 · Điều kiện cấp nguồn RUN từ 3 AA

Đề xuất yêu cầu chức năng cho C7–C9, dùng cùng [miền RUN đã review](EVT0-3AA-RUN-ENVELOPE.md) và [phản hồi Box 08](EVT0-3AA-RUN-DISPOSITION.md). Hồ sơ dùng để kiểm thứ tự và tìm phản ví dụ trước schematic.

| Trạng thái | Điều kiện vào | Đường nguồn được phép | Điều kiện rời trạng thái |
|---|---|---|---|
| OFF | Switch OFF, mất bias, hoặc không xác định được trạng thái lỗi | VBUS khóa. Hủy quyền quảng bá. Nhánh xả chỉ được phép trong cửa sổ detach đã chứng minh. | Có tín hiệu bật chủ ý, hoặc có quyền thử lại được giữ qua brownout. |
| Kiểm trước tải | Có quyền thử và đo pack hợp lệ | Cho phép nuôi tầng bảo vệ, giữ đầu USB-C chưa cấp VBUS. Đọc tap và kiểm hợp lý giá trị từng cell. | Ba kênh cell, phép đo pack và nguồn bảo vệ đều hợp lệ. Nếu thiếu bất kỳ điều kiện nào, giữ OFF. |
| Thử tải nội | Kiểm trước tải đạt | Chỉ nối tải nội để kiểm đủ khả năng cho 1,5 A. Đo đồng thời pack, đầu boost, rail đầu ra và từng cell, kèm cận sai số và thời gian ổn định. | Mọi cận đạt trong cả cửa sổ thử đã review. Mất bias hoặc sụt quá cận thì hủy quyền. |
| Chờ attach | Thử tải đạt, nguồn bảo vệ vẫn hợp lệ | Cho phép quảng bá CC trong thời gian đã giới hạn. Kiểm vSafe0V tại đầu cáp và attach đúng sink. | Sink hợp lệ, VBUS trước đóng hợp lệ và tầng veto độc lập đang cho phép. Timeout hoặc nguồn ngoài xuất hiện thì trở về OFF. |
| RUN | Hai tầng cấp nguồn đủ điều kiện | Cấp VBUS cho đúng B01 và giám sát liên tục. Chứng minh bước tải từ tải nội sang B01 không làm mất biên trước khi cắt. | Detach, mất bias, quá tải, cell yếu hoặc sụt dưới miền cho phép thì xóa quyền RUN. |
| Lỗi / thử lại | VBUS đã ngắt | Nếu được thử lại, tiêu thụ quyền thử trước khi bật tải nội. Nếu không phân biệt được brownout với bật chủ ý, mặc định khóa. | Một lần thử có tải. Thất bại thì giữ OFF tới thao tác chủ ý tiếp theo. |

**Tiêu chí C8 bằng hồ sơ:** Mốc 3,60 V tại pack và 3,10 V tại boost áp dụng dưới tải. Ví dụ tải thử 1,50 A ở rail tối đa 5,304 V tiêu thụ 7,956 W. Mỗi 100 ms thử tiêu tán khoảng 0,796 J ở tải thử, trước tổn hao đầu vào. 100 ms chỉ dùng để quy đổi năng lượng, thời lượng chính thức `TBD`. Phải tính nhiệt tải thử ở số lần lặp xấu nhất, độ sụt áp trong quá trình chuyển tải, khoảng thời gian cho phép attach sau thử và cận phát hiện lúc nguồn sụt. Pin không qua kiểm định thì tay cầm không cấp VBUS. Cần miền tối thiểu được hãng bảo đảm cho tổ hợp thực để chứng minh có thể RUN trong điều kiện sản phẩm, kể cả khi cơ chế khóa đã được xác định.

**Tiêu chí C7 bằng hồ sơ:** Mỗi tầng phải có điều kiện ngắt và đường điều khiển độc lập đủ để xét lỗi một tầng kẹt. Kiểm vSafe0V trước attach không bao phủ nguồn ngoài xuất hiện đúng lúc đóng. Kiểm độc lập ngưỡng cấp/không cấp và cận dòng, điện tích khi đang đóng. Cơ chế phát hiện dòng ngược có thể bỏ sót nguồn ngoài thấp hơn rail carrier. Xét các trường hợp đó ở mặt chuẩn đầu cáp. [Sàng lọc LTC4368-2](EVT0-3AA-C7-REVERSE-SCREEN.md)

**Tiêu chí C9 bằng hồ sơ:** Khi một tín hiệu cell không hợp lệ thì veto RUN, kể cả tap GND hở và tín hiệu về đúng mức biểu kiến do một đường trở hữu hạn. Nguồn điều khiển mất phải dẫn về OFF, không tự cấp lại khi nguồn logic hồi. Mọi chốt giữ quyền cần xác định trạng thái sau POR, ưu tiên đường khóa mặc định phần cứng. Mô tả trên chưa chọn comparator, bộ nhớ hay loại công tắc.

Giữ mục phép đo sau PCB theo D10. Mẫu pin/khay, thời lượng thử, B01 exact SKU, trễ toàn đường và công suất thực `TBD`; phép đo `NOT_RUN`. Phương án là đầu vào thiết kế, chưa áp vào r14.
