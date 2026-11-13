# Khảo sát A / captive-cassette sau duyệt hướng

Ngày 09/11/2026 · MM-HW-P0-09. Founder đã duyệt **hướng khảo sát**, được ghi ở [biên bản](mobot-v2-founder-decision-q1-q8.md#p0-09-a-direction). Bản đề xuất được duyệt có SHA-256 `eb0ed196421db5df263d448285d318386162b35f5084a9c4ed4fc8b4e170adf2`.

Đây là hợp đồng yêu cầu và kế hoạch chứng minh, chưa phải mạch, firmware, CAD hoặc phép đo. Không thay bytes r11, không gán GPIO, không chọn MPN/setpoint, không đóng cổng hoặc cấp lease.

## 1. Phạm vi A và tài nguyên

Gộp RUN/ARM bằng trình tự phần cứng; giữ RELEASE_REQUEST riêng; giữ liveness; dùng hai chân I2C sẵn có cho H3; feedback thứ hai vẫn thuộc safety path độc lập, MCU quan sát status tổng hợp. E1–E4 giữ cận trên bốn kênh theo giả định lập kế hoạch.

Budget ứng viên: 5 output/bidirectional nền + 4 E-channel + 2 input = 11 chân mới. Pool chắc chắn cũng 9 output-capable + 2 input-only; không có dự phòng. Đây là số học, chưa chứng minh tương thích chân hoặc chức năng. GPIO16/17 không được tính vào pool chắc chắn. Exact GPIO/net vẫn UNASSIGNED.

## 2. Hợp đồng trạng thái cần chứng minh

| Trạng thái | Điều kiện chuyển tiếp | Quyền |
|---|---|---|
| RESET/FAULT | POR, reset, fault hoặc bias không hợp lệ; chỉ thoát khi reset được nhả hợp lệ | RUN=0, RELEASE=0 |
| WAIT_LOW | Request phải LOW liên tục đủ thời gian có cận; mọi prerequisite hợp lệ | Không RUN, không nhả |
| READY | LOW-qualified, khóa/bias/liveness hợp lệ, không fault; chỉ nhận cạnh mới sau READY | Chưa RUN trước cạnh hợp lệ |
| RUN | Nhận cạnh LOW→HIGH mới; mọi veto vẫn thắng | RUN có điều kiện |
| OFF_VERIFY | Thu hồi RUN; chờ source OFF thực, I/O cách ly thực và rail qualified | Không nhả |
| RELEASE_ELIGIBLE | Bằng chứng OFF, bias hợp lệ và NOT FAULT; còn cần release request | Chỉ đủ điều kiện nhả, RUN=0 |

Không nhớ HIGH/cạnh xảy ra trước READY để thực hiện sau đó. Sau OFF/fault, muốn RUN lại phải qua WAIT_LOW→READY→fresh edge. Reset/fault trùng cạnh hoặc rơi vào vùng bất định phải thắng; hồi bias không tự arm.

| Đại lượng cần bound | Trạng thái hiện tại |
|---|---|
| T_LOW_QUAL,min/max và READY guard | TBD; chưa có phần tử/giao thức được chọn |
| Reset assertion/release, recovery/removal | TBD tại mạch/tải/bias thực |
| T_fault_isolate,max = T_detect,max + T_veto,max + T_barrier_off,max | TBD; không thay MAX bằng TYP |
| T_release_eligible,max | Phải cộng isolation, decay theo lower-trip, qualification và propagation; TBD |
| Bias-valid/default dưới miền bảo đảm | TBD; không dựa output IC đang undefined |

## 3. Challenge-response một dây: chưa có proof

Window watchdog chỉ kiểm cạnh sớm/muộn/stuck; peripheral/DMA/PWM có thể vẫn tạo cạnh khi CPU treo. Nó không thay challenge-response. Challenge cũng chỉ bao phủ fault model và tiến trình được định nghĩa, không chứng minh mọi phần mềm đúng.

Giao thức ứng viên để khảo sát, chưa chọn encoding/độ dài/tốc độ/part:

1. Bộ giám sát phát challenge mới; MCU ở pha nhận.
2. Hai phía nhả đường trong khoảng turnaround có cận.
3. MCU trả response phụ thuộc challenge trong cửa sổ cho phép.
4. Bộ giám sát kiểm nội dung, freshness và thời gian; chỉ cập nhật liveness khi hợp lệ.
5. Replay, stale response, contention, frame sai hoặc deadline miss phải thu hồi quyền trong bound.

Phải xác định phần cứng phát/kiểm challenge, clock/state/timer, idle bias, direction control, rise/fall, turn-around và common-cause. Chưa chứng minh một chân đáp ứng các việc này. Retained drive HIGH/LOW, short-to-rail và mất nguồn một phía phải được bao phủ.

Nếu phải tách challenge/response thành hai dây thì cần thêm ít nhất một chân MCU: budget thành 12>11. **Dừng và báo Founder**, không dùng chân có điều kiện như chắc chắn, không bỏ E-channel, không đổi thành fixed-frequency watchdog để làm xanh.

## 4. Ma trận kiểm chứng dự kiến

Tất cả kết quả dưới đây là **NOT_RUN**; đây chưa phải test phần cứng hay mô phỏng thực thi.

| Ca | Kết quả bắt buộc |
|---|---|
| Request HIGH trước/trong/sau POR | Không RUN tới khi có LOW-qualified và cạnh mới sau READY |
| LOW ngắn rồi HIGH | Không arm nếu chưa đủ qualification |
| Fresh edge đồng thời fault/reset | Reset thắng, không lưu request |
| Reset một miền, MCU vẫn giữ drive | Thu hồi quyền; phục hồi vẫn cần fresh sequence |
| Bias ramp/drop/chatter | Không xuất quyền trong miền undefined, không tự restart |
| Mất lock feedback khi RUN | Veto trong bound; cơ giữ tới physical OFF |
| Challenge stale/sai/thiếu/sớm/muộn | Fault/veto theo deadline đã review |
| Peripheral tiếp tục phát xung khi CPU treo | Không được coi là proof liveness ngoài fault model |
| Một dây stuck/contended/backpowered | Không giữ RUN hoặc cấp RELEASE sai |
| I2C treo/H3 không đọc được | Safety độc lập vẫn giới hạn; quan sát phải báo không hợp lệ |
| Lệnh source OFF nhưng đường còn dẫn | Không RELEASE |
| Sense falsely-low hoặc common-ground fault | Không tạo proof OFF giả |
| Fault trong qualification hoặc đang nhả | RUN=0; cơ chế giữ/thu hồi release phải có bound và proof |

## 5. Yêu cầu hình học captive-cassette

Các bất đẳng thức dưới đây là yêu cầu kiểm chứng, chưa phải giá trị đã thiết kế:

- Isolation-complete,max + margin < thời điểm sớm nhất mất tiếp xúc nguy hiểm.
- OFF-qualification-complete,max + margin < thời điểm cơ có thể nhả sớm nhất.
- Trước OFF-qualified, khả năng giữ tối thiểu phải lớn hơn tải gây rút lớn nhất trong envelope thao tác/fault đã review.
- Tổng sai lệch chế tạo/lắp/mòn/nhiệt/biến dạng phải nhỏ hơn biên hình học chống bypass.
- Hành trình phát hiện mất khóa cộng hành trình trong thời gian veto phải nhỏ hơn khoảng còn lại trước mất tiếp xúc nguy hiểm.
- Mọi đường RUN→PROGRAM phải đi qua OFF; gá lệch, cắm nửa và tool-access không được mở đường tắt.
- Sensor không được báo safe sớm hơn trạng thái giữ thực, kể cả dung sai/fault được xét.
- Service release phải có điều kiện nguồn pack/ngoài, I/O và năng lượng dư được chứng minh; không chỉ dựa công tắc vị trí hay thời gian thao tác danh nghĩa.

Cần đúng connector/cassette revision, datum, tolerance stack, force–travel/retention, vật liệu, hướng/lực/tốc độ thao tác, vị trí/hysteresis sensor, tuổi thọ, shock/vibration và service access. Phải lập contact sequence cho nguồn, return, CC, I/O, shield và sense khi cắm/rút/nghiêng/cắm nửa, rồi xét contact hở/chập và cơ kẹt.

Chưa có CAD/mẫu/dữ liệu này: **STOP geometry proof**. Không tự tạo CAD hoặc coi concept là đã bảo đảm RUN→OFF→PROGRAM.

## 6. Điều kiện dừng và bước kế tiếp

Giữ bốn cổng OPEN. Dừng nếu cần thêm chân, chia sẻ chức năng chưa chứng minh, thiếu MAX bắt buộc, retained drive/bias có thể arm, hoặc geometry/contact sequence không được chứng minh. Không đổi fallback.

Đầu ra tiếp theo chỉ có thể là hồ sơ circuit/protocol khả thi và đầu vào hình học đủ rõ để xin review/ủy quyền tiếp. Việc duyệt hướng khảo sát hôm nay không cho phép tạo schematic, CAD, KiCad hoặc gán chân; exact configuration/hash và các cổng áp dụng vẫn là điều kiện trước các artifact đó.
