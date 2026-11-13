# P0-11 — hợp đồng đề xuất sau lựa chọn G-B / M-A

Founder đã chọn hướng; tài liệu này là phần phân tích tiếp, không phải phê duyệt thiết kế. r12 vẫn là bản proposed chưa sửa. Không gán chân hoặc đặt tên net như thể đã có schematic.

## G-B: tài nguyên và tách diagnostic khỏi bảo vệ

Giữ năm tín hiệu baseline; RUN_REQUEST, FRESH_ARM_REQUEST, WDI và RELEASE_REQUEST riêng biệt; LOCK_POSITION và SAFETY_STATUS bắt buộc; bốn E-channel; thêm SECOND_POSITION_OBSERVATION. Tổng 16. H3_DEDICATED_STATUS không đi về MCU.

Trong trường hợp cả E1–E4 cần output, chín output-capable chưa dùng đủ cho tám control/E outputs cộng một status input. Hai input-only còn lại nhận hai status. Đây là kiểm khả năng theo hướng chân, chưa gán từng GPIO, chưa chứng minh giới hạn ADC/pull-up/clone hoặc chức năng E-channel cụ thể. Không còn spare ở cận này.

H3 detector/thermal veto/cutoff vẫn độc lập với MCU. Hai quan sát khóa thật vẫn đi vào hai đường hardware veto; không nối chúng thành một sensor duy nhất. Ba tín hiệu về MCU là diagnostic: stuck HIGH/LOW, đứt dây hoặc MCU treo không được tạo quyền RUN hay nhả. Ứng dụng chưa được sửa ở task này; thay đổi mô tả giao diện sẽ là task phần mềm sau khi hợp đồng ổn định.

## M-A: trạng thái và cam kết nhả

| Pha cơ khí đề xuất | Đường chịu lực | Permission và RUN |
|---|---|---|
| Locked, chưa OFF | Follower → stop → frame riêng | Gate chặn chọn đường nhả; RUN chỉ khi khóa thật và fresh-arm |
| Nút bị giữ trước permission | Stop/interlock kết cấu chịu 100 N | Trì hoãn permission; không bắt actuator thắng tải |
| OFF đã qualify, follower ở neutral | Gate điều khiển selector không tải | Chỉ chuyển route nếu cả hai kênh OFF hợp lệ; RUN bị veto |
| Selector đang đổi route | Interlock phải chặn follower rời neutral | Chưa được xem là release commit; mất bias phải không mở ra đường nhả |
| Release commit, follower vào route nhả | Cam/detent/stop kết cấu chịu lực tay | Giữ Source/I/O OFF, gate không được trở thành mặt chịu tải |
| Cassette đang rời hoặc absent | Không hứa tái bắt cassette khi mất bias | Không RUN đến khi tái lắp, hai khóa hợp lệ và fresh-arm |

Điểm commit phải có định nghĩa hình học quan sát được và nằm sau OFF qualification, không chỉ một bit firmware. Guard trước commit: selector chưa chốt đúng route thì follower không có đường nhả. Guard sau commit: đường OFF không được phục hồi dù selector/gate bị kẹt. Hai nhánh phải tự giữ được khi nhánh kia hỏng; frame/datum và dị vật chung vẫn cần FMEA.

## Worksheet clearance và đường lực

Đề xuất sơ bộ clearance nominal 0,50 mm, trừ tolerance stack 0,15 mm, full-assembly deflection allocation 0,05 mm và wear allowance 0,05 mm còn 0,25 mm. Đây là **yêu cầu hình học giả định**, chưa là kết quả CAD/FE. Dị vật, cable force, thermal expansion và các allowance chưa phân bổ vẫn TBD; không được dùng 0,25 mm làm clearance đã chứng minh.

Stop mới phải nhận 100 N ở bất kỳ vị trí button nào trong pha chưa được phép nhả, không chỉ khi button tới cuối hành trình. Khi kết hợp pull 200 N với button 100 N, phải phân tích vector lực/moment trên cả frame; không được dùng bài tính chỉ có key chịu 200 N. Một stop/neutral interlock gãy được tính là một fault; nhánh kia vẫn phải giữ. Liên kết giữa hai nhánh không được làm fault này lan sang cả hai.

Hành trình dogleg đề xuất 0,90 mm và góc tối đa 5° cho separation 0,596575 mm khi tổng loss 0,30 mm. Phải chứng minh việc tăng hành trình không làm contact điện đổi trước OFF và không gây va chạm với ba contact/selector. Bao quét trên 64 mm từ phương án cũ không tự chứng minh fit cho cơ cấu mới có thêm selector.

## Những gì có thể phân tích tiếp mà không cần Founder chọn lại

1. Khép vị trí stop/route/commit và tất cả clearance theo cùng datum; lập các tổ hợp pull/button/skew và single fault.
2. Hoàn thiện mạch đề xuất cho ba diagnostic và các crossing, giữ default invalid và không cấp ngược miền mất nguồn.
3. Tìm dữ liệu reference/comparator có cận hysteresis/toàn nhiệt/tuổi thọ; khóa topology năng lượng trước khi tính H3 peak.
4. Chọn qualifier proposal có MIN ≥100 ms, mục tiêu MAX ≤250 ms và chứng minh các delay còn lại. Mức MAX này chỉ là allocation mới để phân tích, chưa được linh kiện bảo đảm.

Geometry, MAX của actuator/driver, giới hạn cả mạch và CAD/FE vẫn chưa đủ. Không suy lựa chọn G-B/M-A thành exact configuration/hash/lease. Hồ sơ review phải giữ các chỗ đó OPEN/TBD/NOT_RUN.
