Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c44d-4907-77a1-999c-5ea4c0eb73de
Read-only integration refinement; no implementation/approval.

**Cần sửa chuỗi nguồn trước: B01 phải được cấp nguồn để boot mà không cần fresh-arm hoặc WDI.** Grant phần cứng chỉ cho phép các đầu ra được bảo vệ; không phải điều kiện cấp nguồn ban đầu cho controller.

**Topology nguồn AA đề xuất**

```text
Cassette → bảo vệ nguồn/pin yếu → công tắc mode thủ công → module5V
                                                    ├─ safety logic/W
                                                    └─ cầu double-break → B01_EXTERNAL_5V

Safety grant → inhibit/enable các đầu ra được bảo vệ
               không khóa nguồn boot duy nhất của B01
```

Cầu đã nối đúng vị trí RUN và nguồn hợp lệ thì B01 được cấp điện. Trong PROGRAM, cầu tách toàn bộ; PC có thể cấp B01 độc lập. Các bảo vệ điện như pin yếu/quá dòng vẫn được quyền cắt nguồn controller, không cần firmware cho phép.

**Cold-start và W**

| Pha | Nguồn B01 | W/grant |
|---|---|---|
| Lắp pin, vào mode RUN | Có sau khi nguồn ổn định | Mọi grant mặc định inhibited; qualification cũ bị xóa |
| Boot firmware | Tiếp tục có điện | Chưa có WDI hợp lệ thì không grant |
| WDI software hợp lệ, proof hợp lệ | Có điện | Chỉ bắt đầu LOW qualification; chưa tự arm |
| Fresh-arm hợp lệ sau qualification | Có điện | Có thể tạo grant cho đầu ra được bảo vệ |
| Watchdog/reset/bias fault | Có thể vẫn có điện để phục hồi | Grant bị thu hồi và latch inhibit; WDO recovery không khôi phục grant |
| PROGRAM qua PC | PC cấp điện | Carrier đã tách; grant carrier không có đường cấp ra B01 |

**Không nối WDO trực tiếp thành reset liên tục trong lúc boot.** Với preset W nhanh, nếu WDO reset B01 trước khi firmware kịp boot/feed, sẽ xảy ra:

`boot → chưa có WDI → watchdog reset → boot lại → chưa có WDI…`

Cơ chế tối thiểu cho proposal này là **W luôn giám sát và inhibit grant, nhưng không reset CPU trong startup**. Reset nguồn/brownout của controller là đường riêng. Nếu muốn watchdog tự reset CPU sau khi hệ thống đã chạy, cần một chức năng hardware “watchdog đã được qualify” để cho phép đường reset đó; chưa đưa chức năng này thành phần đã có.

Việc không reset CPU lúc startup **không bypass W**: grant vẫn bị chặn suốt thời gian chưa có liveness hợp lệ.

**Mapping ý nghĩa cũ sang hướng AA**

| Role/grant cũ | Ý nghĩa trong proposal AA |
|---|---|
| RUN_REQUEST | Yêu cầu cho phép hoạt động được bảo vệ; không bật nguồn boot B01 |
| FRESH_ARM_REQUEST | Giữ LOW qualification rồi cạnh mới sau READY |
| WDI | Software-only feed sau kiểm tra tiến trình |
| RELEASE_REQUEST | Giữ reserved/inactive; không điều khiển actuator điện đã bỏ |
| LOCK_POSITION / SECOND_POSITION | Quan sát vị trí liên động thực, cần contract mới; không thay proof khoảng hở |
| SAFETY_STATUS | Trạng thái inhibit/armed để quan sát; không tự tạo quyền |
| E1–E4 | Giữ nguyên resource; chưa mặc nhiên chọn tải hoặc chức năng |

Giữ nguyên quan hệ timer/token đã review **cho grant phù hợp sau khi mapping**. Các pha release/capture điện cũ không được tự chuyển thành chứng minh liên động thủ công mới. Không thêm GPIO; tất cả vẫn UNASSIGNED.

**Ranh giới RF phải ghi riêng**

PC-powered ESP32 trong PROGRAM **vẫn có thể chạy và phát radio**. Cầu tách I/O không ngắt anten/radio tích hợp. Reset, firmware “PROGRAM mode” hoặc một bit status không phải physical RF barrier.

Yêu cầu chức năng cần ghi, chưa triển khai:

- Firmware hợp lệ khởi động ở trạng thái không armed, không phát lại quyền/lệnh cũ.
- Robot hết hạn lệnh và yêu cầu trình tự tái cho phép phù hợp sau reset/mất liên kết.
- Robot không coi việc nhận lại packet, reconnect hoặc handset tự khai `armed` là đủ để tự khôi phục chuyển động.
- Việc nạp/chạy chương trình thử trong PROGRAM phải được phân biệt với một handset runtime đã được phép điều khiển.

**Counterexample còn lại:** firmware trên B01 do PC cấp có thể phát packet điều khiển hợp lệ trong PROGRAM. Nếu yêu cầu là “PROGRAM tuyệt đối không thể gây robot chạy, kể cả firmware sai”, topology ngắt cầu hiện tại **chưa chứng minh điều đó**. Cần quyền cho phép độc lập tại robot hoặc một cơ chế ngắt RF vật lý phù hợp; không được claim đã có bằng software/reset. Robot vẫn là phạm vi riêng, chưa đóng gate từ handoff này.

**Verdict:** sửa mapping trên loại được boot-loop do tự khóa nguồn controller. Liên động thủ công bảo vệ đường dẫn điện carrier–B01; W bảo vệ grant theo fault model đã chọn; **không cơ chế nào trong hai cơ chế đó tự tạo cấm RF vật lý ở PROGRAM**.
