# D17-ACTUATOR-PRODUCT · P0-08

PROPOSED / OPEN. Không MPN/hash/pin approval, không lease, không bench. Datasheet chỉ chứng minh đúng hàng/điều kiện; mọi cận không có nguồn là TBD.

Tiêu chí nguyên văn: PASS khi ngân sách sản phẩm đầy đủ và đáp ứng các cận nguồn/điện/nhiệt/trạng thái đã review; FAIL nếu còn tải ngoài bảng, không đáp ứng cận hoặc chưa có giải pháp sản phẩm.

Nguồn đầy đủ file/revision/hash: [source-bounds](mobot-v2-p0-08-source-bounds.md), [manifest](../research/downloads/p0-08-2026-11-09/source-manifest.json).

## Phần làm được và điểm dừng

Hướng đã duyệt là khóa cơ thụ động, điện chỉ cấp quyền. Phương án mới để Founder duyệt nằm trong architecture-proposal: captive-cassette/trapped-key; lớp bộ định vị cam truyền động xung, lực giữ do cơ hình học. Đây chưa chọn motor/servo/MPN. Không dùng Adafruit2776 lab-only làm ngân sách sản phẩm và không tự chuyển solenoid spring-return.

| Ngân sách | Giá trị có căn cứ | Còn thiếu |
|---|---|---|
| RUNrail/total | 4,75–5,25V/0,50A, yêu cầu kế thừa | peak/inrushB01 thật TBD |
| Packfloor/efficiency/aux | 3,20V/0,80/20mA là requirement | chưa là bound nhà sản xuất |
| Pack baseline | (5,25×0,50)/(3,20×0,80)+0,020=1,045390625A | chưa cấp budget cho actuator |
| Actuator peak/hold/duty/energy | TBD, chưa có part và geometry đủ để chọn | không điền số đoán hoặc coi hold0 là wholepath0 |
| Force/stroke/life/thermal | TBD | cần geometry/candidate datasheet trước reviewPASS |

DRV8833 chỉ là ví dụ driver đã có nguồn lịch sử, không được chọn bừa làm cơ cấu: nó không cung cấp force/stroke/contact sequencing. Phải chọnactuator sau geometry constraints, rồi tínhstall, fuse/currentlimit, pulse/duty, inductiveenergy và pathoff. **Không thể hoàn thành mục part/forceMAX khi chưa chứng minh hình học; nhánh này dừng tại proposal.**

## Hình học bắt buộc

Đường tiếp xúc: RUN engaged→lệnhOFF→ngắtnguồn/I/O thực vàqualifyrail→mởpermissionchuyểncơ→OFFdetent→PROGRAMaccessible. Phải chứng minh không có đườngtắt qua gá lệch/cắm nửa/driver lỗi/serviceaccess, kểcả cưỡngbức trong giới hạn tải đượcreview. Cơ giữ không chỉ dựa torque hoặccoil đangcấpđiện.

Bằng chứng cần: CAD có kíchthước vàtolerancestack hoặc mẫu địnhdanh; contacttravel so vớilocktravel; worst-force/stroke; friction/aging; two-position feedback; service release có nguồnngoài. Không có CAD/mẫu hiện tại: **STOP geometry**; không chế tạo CAD khi cấu hình chưa duyệt.

| Fault | PASS/FAIL cần chốt | Status |
|---|---|---|
| Drop/shock/vibration | Không tựnhả hoặc mấtcontacttrướccáchly | force/spectrum/timingTBD,NOT_RUN |
| Forcedpull/partialengagement | Không bypassOFF tronggiớihạnreview; pháhỏngkhôngtạophéprútnguyhiểm | geometry/limitTBD |
| Spring/materialaging,nhiệt/ẩm | Giữ/returnđủsauchu kỳ | life/thermalTBD |
| Jamlocked | Giữkhóa nhưng cóserviceprocedure không bypasssafety | tool/accessTBD |
| StuckON/falseposition/commonGND | Không nhả sớm hoặc tựRUN | circuit/geometryTBD |

Điểm dừng được báo Founder và Founder chỉ cho phép đề xuất kiến trúc mới. Gói này xin review insufficiency/requirements; chưa đủ đóng cổng.
