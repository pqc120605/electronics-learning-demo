# MM-HW-P0-07-MCU-001 · MCU-RESET-VETO-RESOURCES

DESIGN PROPOSAL / OPEN · 09/11/2026. Bốn hướng Founder đã chọn; không gate PASS, không MPN/hash approval, không lease hoặc thiết bị. Box08 review đúng snapshot.

Tiêu chí nguyên văn: PASS only after independent review of resource feasibility and bounded default isolation/reset/panic/watchdog veto, including retained driven GPIO and loss of bias; FAIL if any path is unbounded or can re-enable without fresh permission. Missing design evidence remains OPEN, not PASS.

## Phân vai tài nguyên — exact GPIO UNASSIGNED

Tay cầm r7 tham chiếu dùng GPIO34/35/32/33/25. Pool chưa dùng theo nhãn và policy gồm **9 output-capable**:4/13/18/19/21/22/23/26/27; **2 input-only**:36/39; **2 conditional**:16/17 phụ thuộc module/memory. GPIO4 có pull-down nội, GPIO13 là JTAG cần review; GPIO14 không được tự mở lại. Nhãn không xác nhận continuity clone. Đây là phân vai nguồn lực, chưa gán chân/net triển khai trước khi cấu hình đúng hash được duyệt.

| Vai trò đề xuất | Nhu cầu | Assignment |
|---|---|---|
| RUN_REQUEST |1 output request, không trực tiếp cấp quyền RUN|UNASSIGNED, pool9|
| FRESH_ARM_REQUEST |1 output cho thao tác mới; HIGH tĩnh không tự arm|UNASSIGNED, pool9|
| LIVENESS_CHALLENGE_RESPONSE |1 output hoạt động; không dùng PWM tự chạy làm bằng chứng CPU khỏe|UNASSIGNED, pool9|
| RELEASE_REQUEST |1 output không vượt OFF qualification|UNASSIGNED, pool9|
| H3_I2C_SCL/SDA |2 bidirectional/open-drain nếu dùng BQ25186; không phải expander|UNASSIGNED, pool9|
| LOCK_POSITION |1 input vị trí cơ thực|UNASSIGNED, pool2 input hoặc9|
| SAFETY_STATUS |Ít nhất1 input quan sát, không thay safety path phần cứng|UNASSIGNED, pool2 input hoặc9|
| H3 status / feedback thứ hai / E1–E4 |Nhu cầu logic bổ sung|Số kênh TBD; không reserve GPIO|

Sáu role output/bidirectional không vượt9 chỉ là kiểm số học; chưa chứng minh feasibility tại từng corner, reset, bias hoặc clone. Không tính16/17 thành nguồn lực chắc chắn; không dùng36/39 làm output. Robot18/18, OE_N, nSLEEP và MCU_MOT_EN không được chuyển thành net handset.

## Veto độc lập và timing

Đề xuất supervisor bias-valid + external window watchdog/challenge + latch reset-dominant, trực tiếp chặn RUN và release. Request retained HIGH không được set latch. Recovery đòi trạng thái khóa/neutral rồi fresh request. Supervisor thấy rail khỏe không nhận biết CPU hang; PWM/peripheral còn chạy khi firmware treo không là challenge hợp lệ.

`t_fault_to_isolation,max = t_detect,max + t_latch,max + t_barrier_off,max`.

Mỗi hạng phải có min/max qua góc nguồn/nhiệt; hiện **TBD**. Nếu yêu cầu source-stop20ms được xác định áp dụng cho ca đó thì tổng phải≤20ms. Không tự đồng nhất watchdog timeout với20ms khi mốc bắt đầu còn chưa được định nghĩa.

`t_safe_to_release,max` còn cộng rail decay tại lower-trip, qualification≥100ms, propagation và hành trình cơ. Timestamp request không thay timestamp OFF thực. Allocation20ms/100ms lấy từ yêu cầu r9 kế thừa, chưa là bound hãng.

## Fault matrix và điều kiện review

| Ca cần bao phủ | Yêu cầu | Evidence |
|---|---|---|
| GPIO retained HIGH, panic/software reset/watchdog |Veto thắng mức drive cũ, cần quyền mới sau phục hồi|TBD / NOT_RUN|
| Peripheral clock tiếp tục khi firmware treo |Challenge phải phát hiện lỗi trong fault model, không tin PWM tự chạy|TBD / NOT_RUN|
| Watchdog lỗi hoặc chung bias/GND/reset |Phân tích lỗi chung, không tự đếm hai khối là độc lập|TBD / NOT_RUN|
| Boot pulse/brownout ramp/một miền mất nguồn |Default giữ khóa và cách ly trước vùng không xác định|TBD / NOT_RUN|
| Lock mất vị trí khi đang RUN |Thu hồi quyền và giữ/ngắt trước mất tiếp xúc với margin dương|TBD / NOT_RUN|
| I2C kẹt/default charger reload |Không phụ thuộc giao dịch I2C để tắt RUN hoặc ngăn nhả|TBD / NOT_RUN|

Chốt part, logic/reset defaults, VOH/VIH/pull/leakage/tổng tải, timing, challenge protocol và ưu tiên fault còn TBD. ESP32 Series v5.3 §5.3 tr52 chỉ nêu DC3,3V/25°C, không là proof mọi corner. PDF và excerpts nguồn gốc ở run A10 attempt2. Thiếu một ca hoặc bound bắt buộc thì gate vẫn OPEN; không tạo firmware, pin assignment hoặc thiết bị.
