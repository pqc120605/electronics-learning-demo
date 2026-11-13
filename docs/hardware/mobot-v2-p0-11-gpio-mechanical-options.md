# P0-11 — lựa chọn GPIO và cơ khí

Founder đã chọn G-B và chấp nhận hướng M-A để tính tiếp trong HQ ngày 10/11/2026; biên nhận nguyên văn ở `mobot-v2-p0-11-founder-directions.json`. Đây là chốt hướng và mức chẩn đoán, chưa duyệt cấu hình/hash/MPN. r12 giữ nguyên; E1–E4 và các quan sát an toàn phần cứng vẫn được giữ.

## GPIO: khuyến nghị giữ một diagnostic tùy chọn

Nhu cầu bắt buộc là 15 chân: 5 baseline + 4 điều khiển riêng (RUN, FRESH_ARM, WDI, RELEASE) + 2 status + 4 E-channel. Hai status tùy chọn đưa tổng lên 17, vượt pool bảo đảm 16.

| Phương án | Tổng | Đánh đổi |
|---|---:|---|
| G-A: không xuất hai diagnostic tùy chọn về MCU | 15 | Còn một chân dự phòng; ứng dụng ít phân biệt nguyên nhân lỗi |
| **G-B: giữ SECOND_POSITION_OBSERVATION, không xuất H3_DEDICATED_STATUS** | **16** | Ưu tiên chẩn đoán khóa; sạc vẫn có bảo vệ độc lập và trạng thái tổng, nhưng không có mã trạng thái sạc riêng trên app; hết chân dự phòng |
| G-C: gộp hai diagnostic vào một tín hiệu phần cứng | 16 | Mất phân biệt nguyên nhân; thêm logic, dòng và phân tích lỗi/bias |
| Giữ cả hai tín hiệu riêng | 17 | Thiếu một chân bảo đảm; GPIO16/17 vẫn là điều kiện chưa xác minh |

G-B là hướng Founder đã chọn để triển khai hồ sơ tiếp; chưa áp dụng vào cấu hình hoặc phần mềm. Nếu bốn E-channel đều cần output, chúng cùng bốn control dùng tám trong chín output-capable còn trống; một output-capable và hai input-only có thể nhận ba status. Đây chỉ là fit theo loại chân, chưa có pinout hoặc continuity của clone.

Bỏ diagnostic MCU không được bỏ sensor vị trí thứ hai, veto từng nhánh hoặc bảo vệ H3. Mux 2:1 thông thường cần một data input và một select output nên vẫn tốn hai GPIO. Gộp RUN/FRESH_ARM là thay hợp đồng an toàn riêng, không được coi là dọn lại GPIO thông thường.

## Cơ khí: selector chỉ chuyển khi nút ở vị trí nghỉ

Stop cuối hành trình chưa giải quyết trường hợp lực tay 100 N kẹp gate ở giữa hành trình. Phương án M-A tách đường chịu lực khỏi gate cấp quyền:

1. Chưa cấp quyền: follower của nút tỳ vào stop kim loại gắn frame. Gate/plunger không nằm trên đường lực 100 N.
2. Nút đang bị nhấn: neutral interlock giữ selector tại một stop kết cấu riêng. Cấp quyền phải chờ người dùng thả nút; actuator không thắng lực tay.
3. Sau khi OFF thực và qualification hợp lệ: gate rút phần không chịu tải; lò xo nhỏ chuyển selector sang release-track khi follower ở vị trí nghỉ.
4. Người dùng nhấn lại: cam đẩy cassette vào để tháo tải contact rồi dịch key. Stop/detent chịu lực nút trong suốt chuyển động; gate không trở thành mặt chặn follower.
5. Khi lắp lại: các key phải thực sự ăn khớp; selector trở về inhibit. Gate-closed và key-engaged là hai quan sát khác nhau. RUN chỉ có sau các veto phần cứng hợp lệ và fresh-arm.

**Đánh đổi Founder đã chấp nhận để phân tích tiếp:** nếu đang giữ nút, người dùng phải thả nút rồi nhấn lại để nhả. Cơ cấu thêm selector/interlock nên kích thước, số chi tiết và giá có thể tăng; chưa có cận chi phí. Không tự chọn actuator lớn hơn hoặc tăng công suất.

Cần chứng minh `clearance_min = c_nom - tolerance - full_assembly_deflection - wear > 0` tại mọi vị trí và tổ hợp tải. Neutral window phải lớn hơn bao quét follower, sai lệch, biến dạng và allowance dị vật. Gate không được cắt đường lực 100 N ở bất cứ vị trí trung gian nào. Ví dụ độ nhạy: hệ số ma sát 0,003 nhân 100 N đã là 0,30 N; đây không phải hệ số thực đã đo. Bề mặt ít ma sát không thay được bằng chứng tách đường lực.

Mất bias trước release commitment phải chặn permission mới. Selector bị kẹp giữa hành trình không được tiến tới release. Sau khi cassette đã bắt đầu rời, không hứa tự bắt lại; Source và I/O phải giữ OFF đến khi tái khóa và fresh-arm. Hợp đồng này đã được đề xuất trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/box02-electrical-counterproposal.md`, không phải một phạm vi rủi ro mới đã được Founder duyệt.

## Biên hành trình cần sửa

Nếu 0,80 mm là độ lớn chuyển động, separation bằng `0,80*cos(theta) - 0,30`. Nó đạt 0,50 mm chỉ khi góc lệch bằng không. Với góc 5°, separation còn 0,496956 mm, thiếu 0,003044 mm.

| Hành trình giả định | Separation MIN tại 5°, loss 0,30 mm | Biên trên yêu cầu 0,50 mm |
|---|---:|---:|
| 0,80 mm | 0,496956 mm | −0,003044 mm |
| 0,85 mm | 0,546765 mm | +0,046765 mm |
| **0,90 mm** | **0,596575 mm** | **+0,096575 mm** |
| 1,00 mm | 0,696195 mm | +0,196195 mm |

Đề xuất phân tích tiếp hành trình 0,90 mm với góc lệch tối đa 5°; chưa sửa geometry r12. Loss 0,30 mm phải bao đúng dung sai, mòn và biến dạng theo phương chiếu, tránh tính góc hai lần. Phải kiểm lại contact điện, swept volume và khả năng thoát cả ba contact. Biên số này không chứng minh cả cơ cấu đạt.

Các phản ví dụ bắt buộc: một đường giữ hỏng; hai nút cùng bị preload; selector dừng giữa hành trình; gate kẹt mở/đóng; neutral interlock gãy; lò xo hỏng; hai nhánh hồi không đều; contact lệch; frame/datum chung hỏng; dị vật nối follower với selector; lắp nửa; sensor báo khóa sai. Thiếu mô hình thì giữ TBD; CAD/FE và thử vật lý đều NOT_RUN.

## Quyết định đã nhận và việc tiếp theo

- Đã chọn G-B: giữ chẩn đoán vị trí khóa thứ hai, không xuất trạng thái sạc riêng về MCU.
- Đã chấp nhận hướng M-A để tính tiếp. Kích thước, lực, dung sai cuối vẫn do thiết kế/QA chứng minh trước khi xin duyệt cấu hình.

Không hỏi lại các yêu cầu đã chốt: 100/200 N mỗi đường giữ; 100 N mỗi nút bằng tay; trần 4,200 V và cách ly toàn bộ I/O.

