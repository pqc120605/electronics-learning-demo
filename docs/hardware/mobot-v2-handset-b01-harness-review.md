# MoBot V2 tay cầm · Hợp nhất bó dây và phương án pin

MM-HW-MOBOT-IF-001. Đề xuất HQ cho Box 08 review, dựa trên lượt mới của Box 02 và Box 03. Bổ sung [packet nhận dạng RUN](mobot-v2-handset-b01-run-sense-review.md), SHA-256 `3A950D7E6971F64C6203241427004EB7AE96D2779D49EFE3C58FDA43C93F1D11`.

## Bó dây đề xuất

Theo Box 02, cấp joystick tại carrier qua công tắc mặc định tắt. Theo Box 03, ưu tiên một đầu nối JST GH 12 cực cắm ngang, ứng viên `SM12B-GHS-TB` và `GHR-12V-S`. Kết hợp hai đề xuất thành 11 dây trên đầu nối 12 cực, để một cực không đấu. Mười một dây gồm năm tín hiệu điều khiển, GND chức năng, dây đo rail B01 và bốn dây sense/return riêng. USB qua cáp riêng. Không gán số chân ở bước này. Mã đặt hàng, vùng chừa và khả năng đấu thực tế cần đối chiếu bản vẽ hãng.

Đo rail B01 trước cách ly I/O qua đầu vào trở kháng cao. Hở dây phải báo không hợp lệ. Cần giới hạn dòng rò qua dây đo khi một bên mất nguồn. PC cũng có thể làm rail B01 hợp lệ, nên rail này chỉ là một điều kiện cùng với hai vòng nhận dạng, attach, VBUS RUN và các veto. Rà sai số giữa nguồn joystick và ADC trước khi khóa JOY_VCC, thời gian ổn định và trình tự nối tín hiệu.

## Pin

Giữ BOM hiện hành trong khi tìm hồ sơ B15 LK37478. VARTA `56457 201 020` vẫn là ứng viên. Box 02 ghi nhận dòng H3 nằm trong giới hạn pack nhưng profile kết thúc khoảng 30 mA và timer danh nghĩa 6 giờ chưa khớp khuyến nghị 10 mA hoặc 3,5 giờ của pack. Cần xác minh chấp nhận profile hoặc đề xuất thay đổi H3, cùng biên pin yếu, cửa sổ NTC và ảnh hưởng dung lượng từ 2 Ah xuống 1 Ah. [Hồ sơ pack](mobot-v2-r6-handset-pack-decision.md).

## Câu hỏi cho QA

Rà đề xuất 11 dây trên 12 cực và việc chuyển nguồn joystick về carrier. Xác định dữ liệu cần để khóa đường sense, cách ly và mã đầu nối. Phân loại phần có thể chốt trên giấy so với phần cần mẫu Beetrona, cáp và gá. Rà điểm chưa tương thích của pack VARTA, giữ trạng thái ứng viên. KiCad tiếp tục chờ hồ sơ đúng mẫu, kết luận timing/cơ khí, pin và cấu hình triển khai được duyệt đúng hash.
