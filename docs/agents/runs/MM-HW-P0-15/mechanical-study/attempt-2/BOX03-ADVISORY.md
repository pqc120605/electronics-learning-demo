Native chat: 01a1a855-14f9-7d32-9d27-118e8a50627e
Turn: 01a1c567-025b-79c3-b146-9876d095d66f
Read-only advisory; not configuration approval.

**Hướng này phù hợp phạm vi reference study đã duyệt:** khảo sát profile key/channel/shutter và thay các kích thước thử là đầu ra nghiên cứu, không phải adoption sản phẩm. Giữ rõ ideal quasistatic/return bias; không suy ra lực, pawl hoặc interlock thực đã đạt.

Tôi đã đọc proposal/receipt. Chưa thấy `attempt-2/task.md` tại đường dẫn được nêu, nên phản biện dưới đây dựa trên geometry và thuật toán trong packet HQ; chưa review code attempt‑2. Không chạy CAD hoặc sửa tệp.

**1. Forbidden intervals phải giữ đường đi liên tục trong cả pose và carriage**

Phép tính nominal khớp hướng mở:

- Tại cạnh phải key `x=7,9`, ramp bắt đầu ở `y=−4,8`.
- Cam dịch +12 mm đưa biên ramp tại đó tới `y=−2,8`.
- Nhưng pose tiếp theo có thể tạo **nhiều forbidden intervals**, hoặc current carriage nằm trong một interval mới do key vừa tiến.

**Counterexample solver:** các interval `[3,5]` và `[6,8]`, carriage cũ tại 4 sau bước tiến key. Đẩy ra biên 5 có thể hợp lệ; chọn luôn biên 8 sẽ nhảy qua vật cản thứ hai. Endpoint không collision chưa chứng minh chuyển tiếp reachable.

**Test hữu hạn:**

- Unit test interval union với overlap, nesting, tangency và hai interval rời như trên.
- Kiểm đường nội suy giữa hai pose `(d,s)`, không chỉ endpoint.
- Cùng các case critical, giảm bước d từ 0,1 xuống 0,05 và 0,01 mm; log thay đổi jam/reachable.
- Khi rút, giữ nhánh reachable từ trạng thái trước; không tìm lại global minimum qua vùng cấm.
- Một key, roll 0/180 và pitch/yaw ±5°: mapping phải theo vị trí host thực.

Nếu không chứng minh liên tục giữa samples, ghi đúng **sampled quasistatic path**, không continuous passage proof.

**2. Cam và cửa hiện còn khoảng hở; rib có thể tạo collision mới**

Theo kích thước gửi:

- Cam A có Z từ **3,4 đến 4,6 mm**.
- Cửa có Z tới **2,7 mm**.
- Còn **0,7 mm** giữa hai phần.

Vì vậy cần hoặc một rib thực trong reference solid, hoặc khai báo đây là rigid coupling trừu tượng. Nếu thêm rib để nối, rib cũng phải tham gia mọi collision sweep; không được chỉ kiểm cam convex và cửa riêng.

**Test hữu hạn:**

- Xác nhận cam–rib–shutter cùng carriage và có kết nối thể tích trong reference geometry.
- Sweep carriage 0…12 ở key nominal và góc/offset biên; kiểm rib với key, guide và frame.
- So sánh frame relief cũ/mới. Nếu chỉ sau khi khoét rộng frame mới qua được, báo chính xác relief nào tạo passage.
- Cố định một shutter hoặc một carriage: không cho solver âm thầm dịch cửa còn lại hay bỏ rib khỏi collision.

Đây là kiểm reference connectivity/interference, không phải proof rib đủ bền.

**3. Probe 7,5/8,6 mm có thể bị crossbar che mất lỗi collar**

Với collar `[−17,5;−6,5]` và d=0…6,4, giao các khoảng Y nominal là:

`[−11,1;−6,5]`.

Hai probe nominal nằm trong khoảng đó, nên đáng khảo sát. Nhưng tại **d=6,4**, crossbar cũ `[−15;−13]` chuyển thành **`[−8,6;−6,6]`**:

- Probe −7,5 chắc chắn cắt crossbar.
- Probe −8,6 dày 0,3 mm cũng có overlap với crossbar.

Do đó một kết quả “hai probe bị chặn ở deep insertion” có thể không đến từ collar.

**Test hữu hạn:**

- Tách riêng collision contributor: shell/collar/crossbar/key.
- Giữ collar, bỏ crossbar; rồi giữ crossbar, bỏ/truncate collar.
- Kiểm d=0; 4; 6,4 cùng các góc/offset biên và approach/contact-box cases d<0.
- Giữ probe 1/2 mm làm đối chứng.
- Chỉ gọi “collar coverage” khi chính collar đáp ứng, không lấy collision của component khác thay thế.

**Kết luận:** có thể tiếp tục đúng reference scope, với ba nhóm test trên. Kết quả nên phân biệt **collision-free reference path**, **jam**, và **indeterminate giữa samples**; chưa được gọi keying đã thành cơ cấu hoặc interlock/B1 đã đạt.
