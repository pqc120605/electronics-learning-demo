# MoBot EVT0 · Quyết định hướng RUN và kiểm ngưỡng pack

Founder xác nhận trong HQ ngày 11/11/2026: “tôi chấp nhận hồ sơ, triển khai tiếp đi”. Đối tượng là [hồ sơ miền RUN 3 AA](EVT0-3AA-RUN-ENVELOPE.md), SHA-256 `555ae8ecd4a63a51f958fe338a39f9f56c01b238b99514d73a42bec7ec04bbb1`. HQ ghi nhận để tiếp tục hoàn thiện hướng phân tích. Phê duyệt revision cấu hình và quyền ghi KiCad là các bước riêng. Box 08 nhận snapshot chỉ đọc để kiểm lại C7–C9.

## Tách ngưỡng cắt tĩnh khỏi sàn RUN

Sàn **3,60 V dưới tải** là mức thấp nhất cần giữ tại cực pack trong miền RUN đang xét. Ngưỡng cắt tĩnh phải cao hơn sàn để chừa chỗ cho dung sai, bước sụt và trễ. Kế thừa phép tính TPS3760 ngưỡng âm 0,8 V từ [r14](../../../hardware/mobot-v2-handset-r14-closure.md). Sàng lọc cầu chia **36,5 kΩ / 10,0 kΩ**, sai số tổng phân bổ ±0,1% mỗi nhánh và ±150 nA tổng sai số tại SENSE. Áp dụng `Vtrip = VITN × (1 + Rtrên/Rdưới) ± Ierr × Rtrên` theo hai corner. Dải VITN là 0,792–0,808 V theo điều kiện hãng. [TI TPS3760, bảng Electrical Characteristics](https://www.ti.com/lit/ds/symlink/tps3760.pdf)

| Corner tính trên giấy | Giá trị |
|---|---:|
| Ngưỡng tĩnh thấp nhất | 3,672 V |
| Ngưỡng tĩnh cao nhất | 3,769 V |
| Biên nhỏ nhất từ ngưỡng tĩnh tới sàn RUN 3,60 V | 71,6 mV |
| Ví dụ phần thời gian toàn đường nếu bước sụt 20 mV và độ dốc 50 mV/ms | 1,03 ms |

Biên 71,6 mV ở pack chỉ tương đương khoảng 15,4 mV tại SENSE. Cận **17 µs MAX** của TPS3760 cho loại 0,8 V với CTS hở yêu cầu overdrive **20%**, khoảng 160 mV ở SENSE, vượt phần biên sẵn có. Vì vậy phép tính thu hẹp ngưỡng tĩnh nhưng chưa chứng minh ngắt trước sàn. Giữ ứng viên này làm ngưỡng kiểm khởi động hoặc giám sát tĩnh trong phân tích. Cần comparator/lớp veto khác có cận trễ ở overdrive phù hợp nếu muốn chứng minh nhánh động. Mạng sense phải được tính lại sau khi chọn tầng đó. [TI TPS3760, bảng Timing Requirements](https://www.ti.com/lit/ds/symlink/tps3760.pdf)

## Trình tự kiểm

1. Giữ CC/VBUS ở trạng thái chưa cho phép khi cấp nguồn logic hoặc khi thiếu thông tin về trạng thái lỗi.
2. Cho thử tải nội khi pack và từng cell nằm trong miền được xét. Đánh giá sàn 3,60 V ở cực pack và 3,10 V tại đầu boost dưới tải, gồm biên đo và trễ. Một lần đọc không tải không đủ để mở quyền RUN.
3. Khi mất bias, mọi quyền RUN bị xóa. Trạng thái lỗi mất dữ liệu phải trở về khóa. Muốn thử lại phải nhận biết được lần bật chủ ý mới hoặc có bằng chứng bộ đếm vẫn giữ đúng trạng thái qua brownout.

MAX977 trong hồ sơ miền RUN có VCC hoạt động tối đa **5,25 V**. Rail boost đề xuất lên tới **5,304 V**, nên cấp trực tiếp từ rail đó sẽ vượt dải hoạt động hãng. Chỉ giữ MAX977 làm ứng viên nếu có bias riêng phù hợp phép thử trễ 5 V, khóa chế độ tốc độ cao, kiểm tải ngõ ra ≤10 pF theo điều kiện thử và có veto độc lập khi bias mất. Với giả thiết dùng bias 5 V lấy sau boost, kiểm pack trước khi bật boost và kiểm từng cell trước khi mở VBUS là hai mốc riêng. Nếu dùng hai MAX977 để giám sát bốn kênh, riêng comparator có thể cần **2 mA ở 5 V** theo mức MAX 500 µA/kênh. Phải hạch toán dòng này và tổn hao cấp bias trong ngân sách 50 mA phía pack. [ADI MAX975/MAX977 Rev. 2, tr. 2–4](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX975-MAX977.pdf)

## Kết quả Box 08 và xử lý

Box 08 trả `changes_requested` tại turn `01a1c9b4-0be1-7142-844c-8b25ee155792`. Box xác nhận hai hash được giao, tái lập phép tính và giữ C7, C8, C9 OPEN. Các phép tính bổ sung dưới đây là phản hồi của HQ, chưa được Box 08 review.

| Finding | Xử lý |
|---|---|
| C7 · Nhánh xả của TPS25810 phải vào ngân sách port | **ACCEPT.** Nếu `OUT` đi thẳng tới đầu cáp, pha bleed thấp nhất 100 kΩ để lại yêu cầu cho tổng các nhánh song song còn lại `R ≥ 1/(1/72,4 kΩ − 1/100 kΩ) = 262,32 kΩ`. Đây là cận theo mô hình trở với điều kiện datasheet. Ví dụ, riêng nhánh xả nhanh 400 Ω nhận 10 mA tại 4 V trong điều kiện bảng. Với eFuse đặt giữa `OUT` và đầu cáp, nhánh xả tích hợp nằm phía trong khi eFuse mở, nên không được tính nó như đường xả tụ đầu cáp. Cần một nhánh xả có điều kiện ở mặt chuẩn port và tính nó trong ca eFuse kẹt. Tiếp tục đánh giá cả hai thứ tự, giữ kiểm VBUS tại đầu cáp và veto độc lập. [TI TPS25810 Rev. C, §6.5](https://www.ti.com/lit/ds/symlink/tps25810.pdf) |
| C7 · Cận dòng, điện tích và lỗi đơn | **ACCEPT, OPEN.** Duy trì ca nguồn ngoài thấp hơn, cao hơn, gần bằng và xuất hiện giữa phép kiểm với lúc đóng. Với tầng attach kẹt, tầng còn lại phải tự giữ OFF trước VBUS đã có áp. Với eFuse kẹt, tầng attach phải tự giữ OFF và không chỉ dựa vào hướng ORing. Xét thêm trạng thái cả hai đang ON khi nguồn ngoài xuất hiện. Datasheet TPS25947 chỉ nêu thời gian TYP cho ca fast reverse. Chưa có cận MAX toàn đường hoặc cách độc lập chứng minh dòng hai chiều. [TI TPS25947 Rev. C](https://www.ti.com/lit/ds/symlink/tps25947.pdf) |
| C8 · Khóa theo sàn mới và tách quá tải | **ACCEPT.** Phần ngưỡng pack ở trên đáp ứng bước sàng lọc tĩnh. Khi pack 3,50 V, 3,472 A qua 121,42 mΩ còn 3,078 V tại boost. Nếu đầu ra vẫn giữ 5,304 V ở 1,82 A, mô hình với VIN 3,10 V, hiệu suất 75% và tải phụ 50 mA đòi 4,202 A, vượt cận cắt muộn 4,118 A. Phân tích quá tải phải tính thứ tự cắt và xung riêng. Cận hiệu suất thực, trở toàn đường và miền tải của đúng cell/khay vẫn OPEN. |
| C9 · Bias MAX977 và giám sát từng cell | **ACCEPT.** Đã ghi ràng buộc bias riêng và tốc độ cao ở trên. Ví dụ `0,79 + 1,40 + 1,41 = 3,60 V` cho thấy ngưỡng pack vẫn có thể che một cell yếu. Cần veto từng cell, ma trận lỗi GND sense/chạm qua trở, cận trễ cả đường và chứng minh giữ khóa qua brownout. |

`node docs/agents/runs/MM-HW-P0-15/evt0-3aa-run-envelope.mjs` và `node ../docs/agents/validate.mjs` đều exit 0. Preflight `node ../docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` exit 1, `dispatch_eligible: false`. Tất cả các giá trị là phân bổ, chưa áp vào r14. Phép đo `NOT_RUN`.
