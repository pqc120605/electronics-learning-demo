# MoBot · Điểm chặn trước thiết kế PCB

## Trạng thái tại 06/11/2026

Tay cầm và robot đều `scoped` trong queue, chưa có lease KiCad. Tay cầm đi trước. Box 02 và 03 đã rà snapshot mới trong [delta §7](claude-support/2026-11-06-pcb-status/final/delta-handset-2026-11-07.md#7-snapshot-sau-delta) và đề nghị giữ `changes_requested`. Kết luận gần nhất của box 08 thuộc snapshot trước delta, nên cần review độc lập bản mới sau khi sửa. R7 vẫn `proposed` trong queue. Delta chứa thay đổi vật chất cần revision/hash riêng.

## Tay cầm · Thứ tự cần chốt

| Ưu tiên | Điểm tồn đọng | Bằng chứng hoặc quyết định để đóng | Chủ trì |
|---|---|---|---|
| 1 | **Bo DevKit tham chiếu có lỗi nguồn CP2102.** Trên PCB BrijModi đã khóa, VDD và VBUS cùng nối /5v, REGIN không nối. VDD tối đa tuyệt đối 4,2 V. | Chốt đúng revision DevKit có đường nguồn đúng, đối chiếu sơ đồ và PCB với bo mục tiêu. Không suy rằng bo thực giống tệp tham chiếu. | 03 xác định bo, 02 rà nguồn |
| 2 | **Chuyển USB chưa chứng minh ngắt trước cấp sau khi có lỗi đơn.** U10 đo rail trước U6, U11 chỉ thấy áp sau pass và không thể bảo đảm ngắt trước khi U9 bị chập. | Chứng minh cách ly thực và đường cắt độc lập, gồm U6/U9 dính dẫn, đứt sense, mất bias, rail dư và cắm/rút nảy. Khóa bản đồ interposer đúng revision và cơ khí chống đi vòng. JP2 mặc định hở chỉ tách VBUS. Hai đường data trực tiếp cũng cần được tách nếu dùng switch data. | 02 + 03, 08 review |
| 3 | **Latch và trình tự I/O/data còn mở.** Spec/BOM mâu thuẫn PG U6. SW4 tạo xung nhưng chưa bảo đảm chỉ nhận nhấn sau khi đã thấy nhả ở trạng thái hợp lệ. | Đồng bộ PG/PGTH, chứng minh cận timeout và xóa quyền chạy qua fault/POR. Chứng minh sáu đường I/O gồm JOY_VCC và USB data ngắt đúng thứ tự. Giải quyết backfeed nếu switch data dính ON và rail CP2102 mất nguồn hoặc đang ramp. | 02, 08 review |
| 4 | **Ngân sách dòng USB chưa được chứng minh.** U9 6,65 kΩ là ngưỡng bảo vệ, không bảo đảm dòng toàn cổng. | Chọn kiến trúc giới hạn tải theo trạng thái USB hoặc giao diện tự cấp nguồn có cách ly được chứng minh. Xác minh attach, trước/sau enumeration, suspend và inrush. Chỉ dùng Micro-USB để nạp firmware không thay đổi các yêu cầu về dòng. Xét riêng USB-C sạc ở từng loại nguồn. | 02, 08 review |
| 5 | **B15, UVLO động và H3.** LK37478 thiếu hồ sơ đúng cell/PCM, tải xung ở pin yếu, NTC và profile sạc. | Có hồ sơ đúng lô, đầu PH và cực tính. Đối chiếu sụt áp và trễ với biên UVLO khoảng 62 mV, dải nhiệt sạc, timer, NTC lỗi, pack vắng và PCM mở. Nếu không đủ tài liệu, trình phương án pack thay thế có hồ sơ để duyệt riêng. | 03 + người dùng, 02 kiểm |
| 6 | **Revision và QA.** Delta đổi pass, veto, latch và USB data ngoài phạm vi bytes r7. | Đóng snapshot tay cầm nhất quán spec/BOM/values, box08 review độc lập, người dùng duyệt đúng hash, HQ cập nhật và chạy preflight trước khi cấp lease schematic. | HQ, 08, người dùng |

Nguồn chính: [PCB BrijModi](../../assets/boards/esp32-devkit-v1-30pin/upstream/ESP32%20Dev%20Kit.kicad_pcb) · [Silicon Labs CP2102/9, bảng 2–3](https://www.silabs.com/documents/public/data-sheets/CP2102-9.pdf) · [eLabGuy Rev. 1.1](https://www.elabguy.com/USB_PT.php) · [TI TPS25947](https://www.ti.com/lit/ds/symlink/tps25947.pdf) · [USB-IF USB 2.0](https://www.usb.org/document-library/usb-20-specification).

## Robot · Việc riêng sau tay cầm

- Xác minh B04 đúng revision, dòng xung theo thời lượng, nội trở, bảo vệ/cân bằng và dải nhiệt sạc. Đối chiếu đầu dây và cực tính; nếu chọn B2B-XH-A, pitch JST XH là 2,50 mm.
- Chốt UVLO 2S, POR và quyền chạy motor. U18 đo V5_R thấp chưa chứng minh VM, audio và I/O đã tắt. Rà lại pass/veto, latch và USB data theo lỗi đơn. Ngưỡng NTC tính sàng lọc của robot chưa đảm bảo cửa sổ 0–45 °C nếu đó là yêu cầu cho pack.
- Chốt đỉnh dòng, ngắt kẹt và bảo vệ xISEN, cùng biên năng lượng hồi và đường hấp thụ khi pack đầy/BMS mở. BT-R1a hoặc bằng chứng tương đương là đầu vào trước lease robot. Chốt CE/OTG và giới hạn sạc theo nguồn USB.

## Xác nhận trên mẫu

Các phép đo dạng sóng chuyển nguồn, dòng ngược, thông mạch/lắp vừa, sụt áp Wi-Fi, ADC settling, nhiệt, chu kỳ sạc và đỉnh VM vẫn UNKNOWN hoặc NOT_RUN. Chốt trước tiêu chí và điều kiện đo. Thông mạch mẫu xác nhận bản đồ đã khóa, không thay cho sơ đồ nguồn cần để quyết định thiết kế. Sau khi được cấp lease, review schematic trước layout rồi mới kiểm ERC/DRC và BOM refdes. [Kế hoạch bench bổ sung](claude-support/2026-11-06-pcb-status/final/bench-additions.md)
