# MoBot V2 · MOBOT-CTRL/1 · Ứng viên rà lại

MM-HW-MOBOT-IF-001. Bản lưu đề xuất Box 02, lượt 01a1b0ac-8d13-7001-95af-9b7b7694cc90, phản hồi review Box 01 01a1b0b2-81bc-7822-a165-4b09da6a27c0. Chờ Box 01 kiểm lại trên snapshot này. Điều phối tự động đang tạm dừng. Không có phê duyệt triển khai hoặc kết quả bench.

## MOBOT-CTRL/1 · Delta reset và tái cho phép

**Chốt đề xuất dùng bộ đếm khởi động lưu bền ở cả hai phía.** Robot dùng bộ đếm để tạo epoch mới sau reset. Tay cầm gửi mã lần khởi động trong mọi `CMD` để robot phát hiện reset ngay cả khi người dùng vẫn giữ nút chạy. Giữ các mốc **20/80/200/250 ms** ở cấp tiêu chí.

### Nhận dạng lần khởi động

- **Robot:** giữ `epoch:u64` trong `POLL` và `CMD`, ghép từ `robot_boot_generation:u32` và `arm_generation:u32`. Tăng và lưu bền `robot_boot_generation` **trước khi phát POLL đầu tiên** sau boot. Tăng `arm_generation` mỗi lần chuyển sang trạng thái khóa do Dừng, timeout hoặc phát hiện tay cầm reset. Khi đổi epoch, hủy mọi token đang chờ và trạng thái tái cho phép trước đó.
- **Tay cầm:** thêm `handset_boot_id:u64` ngay sau `epoch` trong `CMD`, nâng độ dài từ **24 lên 32 byte**. `POLL` giữ **16 byte**, mã hóa vẫn little-endian. Tay cầm tăng và lưu bền ID trước khi gửi `CMD` đầu tiên sau boot. Khi khởi động với nút vẫn bị giữ, tay cầm có thể phản hồi để robot biết ID mới, nhưng phải gửi đúng trạng thái nút thực và giữ lệnh trục ở trung tính cho đến khi hoàn tất tái cho phép. **Không giả lập một lần nhả nút.**
- **Khi robot thấy ID mới:** chỉ xét thay đổi ID sau khi xác thực peer, frame và token còn tươi của epoch hiện tại. ID cao hơn lập tức thu hồi quyền chạy, ghi nhận ID và đổi epoch. Frame báo ID mới không được áp lệnh motor hoặc tính là bước nhả để tái cho phép. ID thấp hơn bị loại, kể cả khi gói đến sau có `seq` cao. Với ID mới, kiểm `seq` theo lần khởi động mới thay vì so với bộ đếm của lần trước.
- **Lỗi lưu trữ:** chỉ dùng giá trị mới sau khi lưu thành công. Nếu bộ đếm mất, hỏng, tràn hoặc bị xóa trong khi vẫn còn danh tính ghép cặp cũ, giữ khóa chạy và yêu cầu khôi phục qua quy trình ghép cặp lại. NVS hỗ trợ lưu bền sau `nvs_commit()`. Trình tự tăng, lưu và bắt đầu phát là yêu cầu của MoBot cần kiểm qua ca mất nguồn giữa chừng. [Espressif NVS, `nvs_commit` và khả năng phục hồi](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/storage/nvs_flash.html)

### Bảng trạng thái và ca kiểm

| Ca kiểm | Kết quả bắt buộc |
|---|---|
| **Đang chạy, nhận `Dừng=1` hợp lệ mới**, đồng thời `Giữ để chạy=1` và trục lệch | Dừng thắng. Thu hồi quyền, yêu cầu đầu ra dừng và đổi epoch. Giữ nút Dừng hoặc gửi lặp không tạo cạnh tái cho phép. |
| **Nhả Giữ để chạy** | Thu hồi quyền ngay khi nhận lệnh nhả hợp lệ. Muốn chạy lại phải thấy hai trục trung tính, Dừng nhả, nút giữ thực sự nhả, rồi nhận cạnh nhấn mới khi trục vẫn trung tính. |
| **Gói cũ, trùng hoặc sai phiên** | Sai peer/version/độ dài, epoch cũ, token đã dùng, token quá **80 ms**, ID boot thấp hơn hoặc `seq` không tăng trong cùng lần boot đều bị loại. Không cập nhật motor, không gia hạn timeout và không tính vào trình tự tái cho phép. |
| **Mất lệnh** | Robot phát `POLL` mỗi **20 ms**. Sau lệnh hợp lệ mới cuối cùng, thu hồi quyền trong **≤200 ms**. Đầu ra điều khiển motor phải đạt trạng thái dừng trong **≤250 ms** tính từ cùng mốc, tức tối đa **50 ms** cho xử lý và đổi đầu ra sau khi hết hạn. Gói cũ tới sau không khôi phục quyền. |
| **Tay cầm reset trong khi nút vẫn giữ** | Frame tươi đầu tiên có ID boot mới làm robot thu hồi quyền và đổi epoch. Nút đang giữ không tạo cạnh nhấn mới. Nếu robot chưa nhận được frame báo lần boot mới, nó vẫn phải dừng theo timeout. Thử cả gói của lần boot cũ còn trên đường trước và sau khi robot nhận biết reset. |
| **Robot reset khi tay cầm vẫn giữ nút** | Đầu ra khởi động ở trạng thái dừng. Epoch trước reset không dùng lại. Phản hồi mới có nút đang giữ không cấp quyền. Chỉ cho chạy lại sau trình tự trung tính → nhả thật → nhấn mới trong epoch hiện tại. |
| **Mất điện trong lúc cập nhật bộ đếm hoặc khởi động với dữ liệu lưu bị thiếu** | Sau phục hồi, thiết bị hoặc dùng một danh tính phiên mới hợp lệ, hoặc giữ khóa. Kiểm rằng không có frame nào được phát hoặc chấp nhận với epoch/ID đã dùng lại. |

**Còn cần review phía robot:** trạng thái điện cụ thể của driver khi Dừng, timeout và reset, gồm lựa chọn **brake, coast hoặc disable**, dòng và năng lượng hồi. Mốc **250 ms** đo tại đầu ra điều khiển motor. Thời gian và quãng đường để bánh xe dừng hẳn là tiêu chí bench riêng. Các ca trên là tiêu chí kiểm, chưa có kết quả đo.
