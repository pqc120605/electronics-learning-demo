# MoBot V2 · MOBOT-CTRL/1 · Ứng viên rà lại r2

MM-HW-MOBOT-IF-001. Bản lưu lượt Box 02 01a1b0b6-31ac-7651-8ab0-288e71390e5d. Thay bản ứng viên cũ chỉ chứa delta reset. Chờ Box 01 rà đúng snapshot. Chưa có kết quả firmware/bench.

## `MOBOT-CTRL/1` · Đặc tả hợp nhất cho HQ

Đã đối chiếu verdict Box 01 `01a1b0b2-81bc-7822-a165-4b09da6a27c0`. **V1 dùng `CMD` đúng 32 byte, lưu mốc boot ID cao nhất theo từng pairing, và chỉ tái cấp quyền từ trạng thái trục/nút đo thật.** Các mốc **20/80/200/250 ms** giữ ở cấp tiêu chí nghiệm thu.

### Wire format và kiểm tra frame

ESP‑NOW unicast mã hóa giữa hai peer đã ghép cặp. Các trường nhiều byte dùng **little-endian**, trục dùng `i16` có dấu. Header chung là `version:u8=1`, `type:u8`, `flags:u8`, `reserved:u8=0`.

| Frame | Layout theo offset byte, tính từ 0 |
|---|---|
| `POLL`, robot → tay cầm, **16 byte** | `[0..3]` header, `type=1`, `flags=0`; `[4..11] epoch:u64`; `[12..15] token:u32` |
| `CMD`, tay cầm → robot, **32 byte** | `[0..3]` header, `type=2`; `[4..11] epoch:u64`; `[12..19] handset_boot_id:u64`; `[20..23] token:u32`; `[24..27] seq:u32`; `[28..29] LY:i16`; `[30..31] RX:i16` |

`CMD.flags` bit 0 là **Giữ để chạy**, bit 1 là **Dừng**, các bit còn lại bằng 0. `LY/RX` trong `[-1000,+1000]`. `0` biểu diễn trung tính sau dead zone, dương là tiến/phải. Tay cầm luôn gửi **trục và nút đo thật**, kể cả lúc boot, robot đang khóa hoặc nút vẫn bị giữ. Robot chịu trách nhiệm ép đầu ra motor về dừng khi khóa.

`CMD` **24 byte là layout nháp đã bị thay thế**. V1 loại frame này trước khi cập nhật token, `seq`, timeout, boot ID hay trạng thái chạy. Nếu phát hiện thiết bị đã triển khai layout 24 byte, HQ phải tách version tương thích và lập phương án cập nhật hai phía trước khi ghép cặp.

### Boot ID, epoch và trình tự cấp quyền

1. **Trước khi phát:** robot lưu bền `robot_boot_generation` đã tăng trước `POLL` đầu tiên. `epoch` ghép `robot_boot_generation:u32` ở 32 bit cao và `arm_generation:u32` ở 32 bit thấp. Tay cầm lưu bền `handset_boot_id` đã tăng trước `CMD` đầu tiên. Giá trị mới chỉ được dùng sau khi commit thành công. Đổi thế hệ trước khi bộ đếm tràn, hoặc giữ khóa nếu không thể đổi an toàn.
2. **Xác thực frame trước:** robot kiểm đúng peer/pairing, version, loại, độ dài, reserved, flags, dải trục, epoch và token. `POLL` phát mỗi **20 ms**. Tay cầm lấy mẫu mới sau `POLL` và trả tối đa một `CMD` cho token đó. Robot chỉ xét token chưa dùng, tuổi **≤80 ms** theo đồng hồ đơn điệu phía robot.
3. **So boot ID với mốc lưu bền theo pairing.** ID thấp hơn bị loại. ID bằng mốc chỉ hợp lệ nếu `seq` mới trong luồng hiện tại. Với ID cao hơn, **khóa đầu ra và hủy quyền chạy trước**, rồi lưu bền mốc mới. Chỉ sau commit thành công mới mở epoch mới để bắt đầu trình tự tái cho phép. Frame báo boot mới không áp lệnh trục, không gia hạn quyền chạy và không được tính là mẫu nhả. `seq` của lần boot cũ không dùng để bác ID mới.
4. **Khóa khi lỗi lưu.** Commit lỗi hoặc record bị thiếu/hỏng trong khi pairing còn tồn tại thì giữ khóa. Lỗi tại tay cầm chặn phát `CMD` với ID chưa được lưu. Lỗi tại robot chặn cấp quyền. Ghép cặp lại phải vô hiệu hóa danh tính phiên và vật liệu ghép cặp cũ. Sau mất nguồn giữa commit, robot khởi động với đầu ra dừng, tải mốc đã lưu hợp lệ và phát epoch chưa từng dùng.
5. **Tái cho phép:** trong epoch hiện tại, robot phải nhận một mẫu thật có **hai trục trung tính, Dừng nhả, Giữ để chạy nhả**, rồi nhận cạnh nhấn thật mới khi hai trục vẫn trung tính. Bất kỳ mẫu lệch cần hoặc `Dừng=1` xen giữa đều hủy bước chuẩn bị. Nhả nút khi đang chạy thu hồi quyền ngay. Dừng, timeout, reset và nhận boot ID mới đều đưa robot về khóa. `Dừng=1` thắng trong frame hợp lệ, kể cả khi nút giữ cũng bằng 1.

### Vector và ca nghiệm thu

Vector mã hóa `CMD`, với `epoch=0x0000000100000002`, `boot_id=7`, `token=42`, `seq=9`, `LY=-1000`, `RX=500`, chỉ bật Giữ để chạy:

```text
01 02 01 00  02 00 00 00 01 00 00 00
07 00 00 00 00 00 00 00  2A 00 00 00
09 00 00 00  18 FC  F4 01
```

| Vector hoặc ca lỗi | Kết quả mong đợi |
|---|---|
| **32 byte đúng layout** tại hai đầu mã hóa/giải mã | Đọc lại đúng các trường trên. Khi robot đang khóa, frame có trục lệch và nút giữ bật vẫn giữ đầu ra dừng. Khi đã có quyền và mọi điều kiện khác hợp lệ, áp đúng `LY/RX`. |
| **24 byte hoặc sai độ dài** | Endpoint V1 loại `CMD` 24 byte. Nếu có parser legacy, kiểm parser đó không nhận `CMD` 32 byte như frame legacy. Frame sai độ dài không tiêu thụ token, không cập nhật mốc boot và không gia hạn timeout. |
| **Gói cũ trước và sau khi thấy ID mới** | Trước khi robot biết reset, gói từ ID cũ chỉ còn cơ hội được nhận nếu vẫn thỏa toàn bộ cửa sổ độ tươi và thứ tự. Sau khi thấy ID mới, quyền chạy bị thu hồi ngay. Gói ID thấp hoặc epoch cũ tới sau bị loại, kể cả sau khi robot reset. |
| **Tay cầm reset, nút giữ vẫn bị đè** | Frame tươi đầu tiên mang ID cao hơn làm robot khóa, kể cả khi `Giữ để chạy=1`. Nếu frame báo reset không tới, robot dừng theo timeout. Sau khi đổi epoch, trạng thái giữ liên tục không tạo quyền chạy. |
| **Robot reset khi cần lệch** | Đầu ra khởi động ở trạng thái dừng, epoch mới. Cần lệch hoặc nút đang giữ không thể tạo bước chuẩn bị. Thử `neutral/release → lệch cần → nhấn` và `neutral/release → Dừng → nhấn`. Cả hai phải giữ khóa. |
| **Dừng và Giữ để chạy cùng bật** | Với frame hợp lệ, Dừng thắng và xóa quyền. Gói trùng hoặc cũ không gia hạn timeout hay đóng góp vào trình tự tái cho phép. |
| **Cắt nguồn trước, trong và sau commit ở mỗi phía** | Thử cập nhật boot generation ở robot, boot ID ở tay cầm và mốc ID theo pairing trên robot. Đặc biệt cắt ngay sau khi robot commit ID cao hơn. Khi khởi động lại, ID thấp phải bị loại. Ca commit lỗi hoặc record mất/hỏng phải giữ khóa. |
| **Timeout và biên tuổi token** | Token ở **80 ms** có thể được nhận nếu mọi kiểm tra khác đạt, quá **80 ms** bị loại. Mất lệnh hợp lệ mới thì thu hồi quyền trong **≤200 ms** và đưa đầu ra motor tới trạng thái dừng trong **≤250 ms** tính từ lệnh hợp lệ mới cuối cùng. |

**Quyết định phía motor vẫn mở:** `brake`, `coast` hay `disable`, mức điện đầu ra khi reset, dòng và năng lượng hồi. Review robot phải khóa trạng thái đó trước khi dùng nó làm điểm kết thúc phép đo **250 ms**. Quãng đường dừng bánh xe là phép bench riêng. Bảng trên là vector đặc tả, chưa có kết quả firmware hoặc bench.
