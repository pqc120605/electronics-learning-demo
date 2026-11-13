# Mạch Mở · Dashboard tiến độ

Chụp lúc **22:25, 05/11/2026 (UTC+7)**. Số lượng lấy từ queue, trạng thái hoạt động lấy từ lượt mới nhất của tám box. Đây là ảnh chụp tại thời điểm kiểm tra. [Hàng đợi gốc](../../../docs/agents/tasks.json)

| Hoàn tất | Trong review | Đang chờ | Đã khoanh phạm vi | Chưa bắt đầu | Đang thực thi |
|---:|---:|---:|---:|---:|---:|
| **6** | **3** | **3** | **2** | **3** | **0** |

**17 task trong queue.** Tám box đều đã kết thúc lượt gần nhất. Hai kết quả mới của box 01 và 06 đang chờ HQ chuyển thành task triển khai. Con số 6/17 chỉ phản ánh queue hiện tại, gồm cả việc thiết lập quy trình và thiết kế.

## Các box đang ở đâu

| Box | Kết quả mới nhất | Việc tiếp theo hoặc điều kiện còn thiếu |
|---|---|---|
| **01 Architecture** | Đã bàn giao phạm vi truy xuất nguồn gốc tín hiệu Uno R3 D13 và CSV. Đã chạy lại hai fixture Node. | HQ chốt task triển khai riêng và phạm vi ghi cho box 05. |
| **02 Electronics & Firmware** | Đã bàn giao phân tích tay cầm MoBot r6 và bằng chứng D13 trên AVR8js. | Tay cầm còn thiếu hồ sơ đúng cell/mạch bảo vệ, tải xung, chu kỳ sạc và bằng chứng cách ly nguồn/I/O. |
| **03 Hardware** | Đã lập hồ sơ r6 và so sánh pin thay thế. Đề xuất giữ LK37478. | Chờ hồ sơ đúng pack B15. Robot còn vướng giới hạn dòng, ngắt kẹt và năng lượng trả về khi phanh. |
| **04 Learning** | Đã sẵn sàng nhận việc. | Chưa có task học liệu được giao trong queue hiện tại. |
| **05 Software** | Đã hoàn tất dữ liệu và bộ nhận diện điện trở 220 Ω, 10 kΩ. Đã bàn giao bản sửa nhập tệp. | Chờ task giao diện catalog và metadata capture firmware. |
| **06 UI/UX** | Đã bàn giao thiết kế bộ chọn trị số trong trang catalog hiện tại. | Chờ triển khai và kiểm luồng deep link, bàn phím và màn hẹp. |
| **07 Testing** | Xác nhận catalog 32/32 và typecheck đạt. Task nhập tệp đạt 4/4 Node và typecheck. | Kiểm thử trình duyệt cho luồng nhập tệp chờ môi trường cho phép loopback. |
| **08 QA** | Đã duyệt mã catalog và bản sửa lỗi nhập tệp. Đã tái review nguồn và USB của MoBot. | MoBot còn điều kiện kỹ thuật trước KiCad. Các mục thiết lập còn ở review trong queue cần HQ đối chiếu và đóng sổ. |

## Việc còn lại và điểm đang vướng

| Việc | Trạng thái | Điều kiện để tiến tiếp |
|---|---|---|
| **Giao diện catalog 220 Ω / 10 kΩ** | Thiết kế đã bàn giao. Chưa bắt đầu triển khai. | HQ chốt phạm vi tệp cho box 05. Sau triển khai, kiểm deep link và thao tác bằng bàn phím. |
| **Capture firmware Uno R3 / CSV** | Phạm vi kiến trúc đã bàn giao. Chưa bắt đầu triển khai metadata mới. | Tách task triển khai từ MM-RUN-001. Gắn đúng digest HEX, target, pin và thời gian mô phỏng. |
| **Luồng nhập và lưu dự án** | Mã sửa đã qua QA. Browser **NOT_RUN** do loopback trả `EACCES`. | Chạy lại ca xác nhận và hủy nhập trên cùng phiên bản mã khi loopback khả dụng. Codec và khôi phục đầy đủ vẫn ở MM-DATA-001. |
| **KiCad tay cầm MoBot r6** | Đã ghi duyệt cấu hình r6. Đang chờ kỹ thuật. | Xác minh hồ sơ LK37478/B15 và đóng điều kiện về tải, sạc 1S, cách ly. Box 03 đã nêu rõ hồ sơ cần bổ sung. |
| **KiCad robot MoBot r6** | Đang chờ kỹ thuật. | Chứng minh giới hạn dòng, bảo vệ khi kẹt, tải pin, nhiệt, năng lượng phanh và cách ly USB/I/O. |
| **Pilot, BOM UI và ESP32** | Pilot và BOM UI ở backlog. ESP32 mới khoanh phạm vi nghiên cứu. | Chốt quyết định pilot, hợp đồng BOM và bằng chứng đúng target trước khi triển khai tương ứng. |
| **Phát hành công khai** | Gate phân phối ngspice vẫn chờ. | Xử lý hồ sơ phân phối riêng. Kiểm tra nội bộ hiện có phạm vi riêng. |

## Toàn bộ hàng đợi

| Task | Trạng thái queue | Box phụ trách |
|---|---|---|
| `MM-WF-001` | Hoàn tất | 01 |
| `MM-BASE-001` | Hoàn tất | 07 |
| `MM-DEC-001` | Chưa bắt đầu | 01 |
| `MM-CONTRACT-001` | Hoàn tất | 05 |
| `MM-BOM-001` | Đang chờ | 03 |
| `MM-UX-001` | Hoàn tất | 06 |
| `MM-FIX-001` | Hoàn tất | 05 |
| `MM-BOM-002` | Chưa bắt đầu | 05 |
| `MM-DATA-001` | Chưa bắt đầu | 05 |
| `MM-DATA-ID-001` | Đang chờ | 05 |
| `MM-CAT-R-001` | Hoàn tất | 05 |
| `MM-HW-001` | Đang chờ | 03 |
| `MM-RUN-001` | Đã khoanh phạm vi | 02 |
| `MM-ESP32-001` | Đã khoanh phạm vi | 02 |
| `MM-ARCH-PLAN-001` | Chờ kết luận review trong queue | 01 |
| `MM-PARALLEL-SETUP-001` | Chờ kết luận review trong queue | 01 |
| `MM-SW-BUILDER-SMOKE-001` | Chờ kết luận review trong queue | 05 |

Hai mục BOM/intake cũ trong queue còn ghi lý do theo cấu hình v1. Hồ sơ r6 đã có phê duyệt riêng với trạng thái `pending_technical_review`. Phần MoBot trong dashboard dùng hồ sơ r6 để mô tả điều kiện kỹ thuật hiện tại. [Hồ sơ review r6](../hardware/mobot-v2-r6-readiness-review.md)

Queue schema 2, `updated_on: 2026-11-05`. SHA-256 tại lần đọc `cf07498d7f8ef5327c3d32d863149c41a884aa784afd132066c992cf1614910b`. [Bàn giao web](web-next-dispatch.md) · [Quy tắc refresh](README.md)
