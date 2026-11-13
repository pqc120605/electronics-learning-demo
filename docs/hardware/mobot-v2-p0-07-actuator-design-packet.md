# MM-HW-P0-07-ACTUATOR-001 · D17-ACTUATOR-PRODUCT

DESIGN PROPOSAL / OPEN · 09/11/2026. Bốn hướng Founder đã chọn; không gate PASS, không MPN/hash approval, không lease hoặc thiết bị. Box08 review đúng snapshot.

Tiêu chí nguyên văn: PASS khi ngân sách sản phẩm đầy đủ và đáp ứng các cận nguồn/điện/nhiệt/trạng thái đã review; FAIL nếu còn tải ngoài bảng, không đáp ứng cận hoặc chưa có giải pháp sản phẩm.

## Kiến trúc chức năng

Khóa cơ thụ động chịu tải giữ phích; điện chỉ di chuyển phần tử cấp quyền, không là lực giữ duy nhất. Đề xuất chức năng phần tử cho phép là chặn cơ có trạng thái không điện blocked, driver có giới hạn xung/duty phần cứng và dập năng lượng. Đây không chốt solenoid/servo/MPN; spring-return là fallback sau khi dừng/báo Founder, không tự chuyển fallback.

Driver bị stuckON phải không vượt điều kiện OFF: hai điều kiện nối tiếp/giữ cơ độc lập cùng feedback vị trí thật. Hai driver chungreturn/bias không tự tạo độc lập.

## Ngân sách và cơ khí

| Hạng mục cần khóa | Giá trị/nguồn hiện có | Còn thiếu |
|---|---|---|
| RUN/B01 | 4,75–5,25V/tổng0,50A, requirement r9 | Budget B01peak/inrush thực TBD |
| Pack allocation kế thừa |1,045390625A tại floor3,2V/eta yêu cầu0,8/aux20mA | Không bao permission actuator; efficiency guaranteed/sag TBD |
| Phần tử cấp quyền | Vnom/Vmin/Vmax, peak/hold/stall/duty/energy | Tất cả TBD; chưa có datasheet product |
| Giữ/nhả | Force/stroke/travel/time/tolerance/life | TBD, không gán số giả |
| Feedback | Cảm biến vị trí và offset/hysteresis/plausibility | Part/rail/load/default/timing TBD |

Adafruit2776/MeanWell trong A10 là lab-only lịch sử, không budget sản phẩm. Passive lock không đồng nghĩa zero-current: permission/chốt/sense/driver phải phân vào nhánh nguồn cụ thể, không đếm đôi RUN0,5A và aux20mA.

## FMEA mở rộng và tiêu chí dừng

| Ca | Phản ví dụ FAIL / điều kiện cần chứng minh | Cận |
|---|---|---|
| Rơi/va đập/rung | Chốt tự nhả hoặc tiếp điểm mất trước cách ly | Gia tốc/phổ/rơi/hướng/timing TBD / NOT_RUN |
| Kéo cưỡng bức/phá khóa | Bypass trình tự trong giới hạn lực review hoặc tạo tiếp xúc nguy hiểm khi gãy | Lực/độ bền/giới hạn phá hỏng TBD / NOT_RUN |
| Lão hóa lò xo/vật liệu theo nhiệt | Lực giữ/return không đủ sau thời gian/chu kỳ/nhiệt | Vật liệu/cycles/temp/humidity TBD / NOT_RUN |
| Kẹt ở khóa | Giữ là trạng thái fail-safe nhưng không bảo trì được; không cho bypass khi nguồn còn | Tool/access/procedure lực phục hồi TBD / NOT_RUN |
| Driver stuckON/feedback falsely-safe/brownout | Không nhả sớm hoặc cấp RUN khi chưa khóa | Independence/timing/default TBD / NOT_RUN |
| Gá lệch/cắm nửa/service release | Không đi vòng feedback hoặc thứ tự nguồn | Geometry/tolerance/rail residual TBD / NOT_RUN |

**Dừng ở proposal và báo Founder** nếu: không có bằng chứng hình học ngăn rút trước OFF thực ở mọi ca bắt buộc; mấtbias/mộtfault có thể nhả; không có cận force/stroke/duty/nhiệt; feedback chỉ từ command; không xác định service release khi nguồn ngoài còn. Thiếu dữ liệu là thiếu proof, không tự coi physical FAIL, nhưng không tiến tới build hoặc tự đổi fallback. Đóng gate cần hồ sơ geometry/fault/budget với cận được reviewer chấp nhận; chưa có geometry/CAD/build trong task này.
