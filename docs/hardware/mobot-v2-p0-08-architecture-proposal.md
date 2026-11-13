# Phương án A/B để Founder duyệt · chưa chọn

Ngày 09/11/2026. Sol 6.1 phân tích, lead ghi. Quyền hiện tại chỉ là đề xuất kiến trúc mới trong ràng buộc cũ; không duyệt hash, MPN, setpoint, GPIO, CAD hoặc cổng.

## Vấn đề đã xác minh

Baseline cần 8–14 chân mới: sáu output/bidirectional, hai input bắt buộc, hai input quan sát bổ sung và tối đa bốn kênh E1–E4. Pool chắc chắn 9 output-capable + 2 input-only = 11; tính thêm GPIO16/17 có điều kiện vẫn chỉ 13. Không được tự bỏ kênh hoặc coi chân có điều kiện là chắc chắn.

## Hai phương án

| Hạng mục | A: request RUN/ARM chung | B: request mã hóa hai dây |
|---|---|---|
| RUN và fresh permission | Một dây, LOW-qualified sau POR/fault rồi cạnh mới | Hai dây mã hóa IDLE/ARM/RUN/RELEASE |
| Release | Một request riêng | Mã trên hai dây |
| Liveness | Một đường bidirectional challenge candidate, chưa có circuit proof | Như A |
| H3 | Hai chân I2C hiện có, polling status | Như A |
| Feedback thứ hai | Vẫn cảm biến thật vào veto phần cứng; MCU đọc status tổng hợp | Như A |
| Nền output/bidirectional | 5 | 5 |
| Bốn kênh E1–E4 | Giữ đủ 4 theo giả định | Giữ đủ 4 theo giả định |
| Input MCU | LOCK_POSITION, SAFETY_STATUS | Như A |
| Rủi ro | Fresh-edge/LOW qualification, một chân challenge chưa chứng minh | Thêm glitch/metastability khi chuyển mã, không tiết kiệm hơn A |

Khuyến nghị **khảo sát A**, chưa quyết định thay baseline. Budget A là 9 output/bidirectional + 2 input = 11, **không có dự phòng**, không cần tính GPIO16/17. Đây chỉ là fit số học. Không gán exact GPIO.

## Giữ chức năng, không giấu việc giảm quan sát

- RUN_REQUEST và FRESH_ARM_REQUEST chuyển thành một giao thức phần cứng. Không coi HIGH hoặc cạnh do cấp nguồn là fresh permission.
- H3 status đọc qua bus I2C đã có; OV/nhiệt không phụ thuộc giao dịch bus hay firmware. Bỏ dây IRQ không đồng nghĩa bỏ bảo vệ.
- Hai cảm biến vị trí vẫn tồn tại trong safety path độc lập. SAFETY_STATUS tổng hợp chỉ để quan sát; một bit không cho MCU phân biệt mọi lỗi. Nếu sản phẩm cần chẩn đoán riêng từng sensor thì phải giải bài toán đó, không tự bỏ yêu cầu.
- E1–E4 vẫn giữ bốn kênh cận trên; chưa chốt số kênh sản phẩm hoặc hướng I/O.

## Trình tự phần cứng cần chứng minh

POR/FAULT/BIAS_INVALID → xóa permission → WAIT_LOW. Request đang HIGH phải bị bỏ qua tới khi LOW hợp lệ liên tục trong khoảng có MIN/MAX. Sau bias/lock/sense/liveness hợp lệ mới nhận cạnh mới. Fault/reset thắng cạnh trùng thời điểm; không nhớ cạnh để tự RUN khi hồi nguồn.

OFF/RELEASE trước hết thu hồi RUN; chỉ cho chuyển cơ khi source và I/O đã cách ly thực, rail dưới ngưỡng đủ thời gian, bias hợp lệ và NOT FAULT. Mọi lỗi trở lại WAIT_LOW.

**Chưa có proof một chân challenge-response.** TPS3430 là window watchdog, không phải challenge generator và không phát hiện CPU treo nếu peripheral vẫn tạo xung hợp lệ. Phương án A phải chứng minh giao thức bidirectional một chân, arbitration/turn-around/stuck drive, phần cứng kiểm challenge và MAX timing. Nếu phải thêm chân challenge thứ hai thì budget thành 12 > 11: dừng, báo Founder; không âm thầm thay challenge bằng PWM.

## Cơ khí đề xuất: trapped-key / captive-cassette

Khóa thụ động giữ cassette ở RUN. Điện chỉ mở phần tử cấp quyền chuyển chặng; không là lực giữ duy nhất. RUN → chặng OFF có kiểm chứng vật lý → PROGRAM; không tiếp cận PROGRAM bằng đường cơ khác. Feedback vị trí thật tham gia veto độc lập.

Lớp phần tử cấp quyền để khảo sát: bộ định vị cam dùng truyền động xung, trạng thái giữ do hình học cơ thụ động. Chưa chọn motor/servo/MPN; không chuyển sang solenoid spring-return. Mất nguồn không được tự mở đường rút.

**STOP hình học:** chưa có CAD có kích thước/dung sai/contact sequence hoặc mẫu định danh. Chưa chứng minh lực, hành trình, driver stuck ON, gá lệch, rút cưỡng bức, rung/rơi, mòn và service release. Không tạo CAD hoặc build trong lượt này.

## Phạm vi xin duyệt

Cho phép tiếp tục khảo sát A và concept captive-cassette, giữ toàn bộ safety requirements và bốn E-channel giả định. Đây không phải duyệt khả thi, lựa chọn linh kiện, GPIO, hash hay gate. Sau khi có circuit/geometry proof vẫn cần review độc lập. Nếu không duyệt, giữ baseline STOP; không có lựa chọn tự động.
