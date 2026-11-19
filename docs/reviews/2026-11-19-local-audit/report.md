# Mạch Mở · Kiểm thử và cải tiến bản local

## Những thay đổi người dùng có thể thử

| Nhu cầu | Cách hoạt động trong bản local |
| --- | --- |
| Bắt đầu với ít bước hơn | Trang chủ và không gian học dẫn đến thử nghiệm mạch kín, có tiêu chí đọc được ngay trên màn hình. Hoàn thành một hoạt động sẽ mở bước tiếp theo. Người đã học có thể trở lại đúng hoạt động đang làm. |
| Quay lại dự án của mình | Mini-project lưu theo tên và mở từ Dự án. Sao chép tạo bản độc lập. Thư viện không đọc được có luồng tải dữ liệu gốc và mở lại thư viện sau khi sao lưu trên trình duyệt. |
| Sửa sai khi lắp mạch | Bàn tự do giữ đường đi dây khi đổi góc nhìn, mở lại nháp và nhập/xuất JSON. Hoàn tác dây có tối đa 30 bước trong phiên. Khi phát hiện bản nháp đã đổi ở tab khác, tab cũ giữ mạch đang làm để người dùng có thể tải về. |
| Hiểu kết quả mô phỏng điện | Bài bộ chia áp trong SPICE cho nhập dự đoán, chạy ngspice, đọc V(OUT) và so sánh. Sửa netlist hoặc đổi ví dụ xóa kết quả đã cũ. |

## Bằng chứng kiểm thử

- 52 ảnh từ 26 màn hình ở 375 px và 1440 px. [Ma trận route, ảnh và thao tác](coverage.md)
- 28 hồ sơ board, 16 trình xem 3D mở canvas. 59 thẻ linh kiện, 45 trình xem 3D mở canvas. [Số liệu và đường dẫn ảnh](route-and-board-evidence.json)
- Tester độc lập thực hiện 33 tổ hợp thao tác và viewport trên `index-CM589IoX.js`. Các ca bao gồm lắp và lưu mạch, nạp mô phỏng AVR/Pico, giới hạn ESP32, cursor dạng sóng, Serial CSV, PCB/CAD, SPICE, Mở Bot, kit lớp học, robot và offline sau khi truy cập. [Kết quả tester và ảnh](independent/CM589IoX-audit-summary.json)
- Tester kiểm lại mở nháp ở 375 px, bấm hoàn tác trên desktop, CTA và phục hồi thư viện trên `index-CGaPe2Lp.js`. Kết quả kiểm lại đúng phiên bản được ghi riêng. [Kết quả lần hai](independent/CGaPe2Lp-followup.json) · [Ảnh khôi phục nháp 2D](independent/CGaPe2Lp-mobile-resume-and-tools.png) · [Ảnh phục hồi thư viện](independent/CGaPe2Lp-capstone-recovery.png)
- Trên bản `index-D0WHFQ1Z.js`, tester kiểm đủ 7 nút trong 4 trạng thái bài nút nhấn ở 375 × 812. Cả 28 điểm kiểm đều thấy trọn 44 px, bấm được; khoảng cách nhỏ nhất với thanh phát là 12,7 px. [Ảnh sau sửa](independent/D0WHFQ1Z-mobile-button-lesson-controls-final.png) · [Số đo](independent/D0WHFQ1Z-followup-lesson-final.json)
- Lượt E2E toàn bộ trên bản đầu có 244 đạt, 6 lỗi và 1 skip analytics cần server. Lượt hồi quy dùng lệnh chuẩn trên bản cuối đạt 17/17, gồm cả sáu ca từng lỗi, đọc dữ liệu v4/v5, SPICE và lưu dự án. Bộ unit chạy toàn bộ đạt 779/779 trước đợt chỉnh cuối. Bộ unit theo phạm vi thay đổi đạt 31/31 trên mã cuối. [Nhật ký và mã thoát](verification.json)

| Phát hiện | Cách tái hiện và minh chứng |
| --- | --- |
| Đã sửa · Mở nháp mobile che khuất mạch | Tạo mạch mẫu, chỉnh dây, mở lại bằng `?resume=1` trên 375 px. Bản chụp cũ hiển thị bảng chọn board phía trước. Bản mới mở mạch và hiện Nhập bản nháp, Hoàn tác dây trong khung. [Trước](independent/CM589IoX-targeted-mobile-resume-board-panel.png) · [Sau](independent/CGaPe2Lp-mobile-resume-and-tools.png) |
| Đã sửa · Nút đổi loại và xóa dây bị cắt ở 375 px | Chọn dây `w-input-to-button` trong bài nút nhấn. Bản giữa còn che 13 px cạnh dưới. Thanh chọn bài gọn hơn và giữ nguyên các đường dẫn, nên đủ chỗ thao tác trong bản cuối. [Trước](independent/CGaPe2Lp-followup-failure-mobile-lesson-controls-375.png) · [Sau](independent/D0WHFQ1Z-mobile-button-lesson-controls-final.png) |
| Đã sửa · Lưu v5 làm mất lựa chọn dây | Chấp nhận chuyển bản nháp v4 sang v5, nối và sửa một dây rồi đổi chế độ xem. Bản mới giữ định danh dây và tính lại net từ tài liệu vừa lưu. Bản v4 được kiểm giữ nguyên byte. [Lượt hồi quy](evidence/final-e2e.log) |
| Đã sửa · SPICE từng có thể giữ kết quả của lượt trước | Chạy bộ chia áp, đổi ví dụ trước khi worker gửi xong. Với mạch từ workspace, chạy rồi đổi kiểu phân tích. Bản mới loại cả kết quả trả muộn và đường dẫn mang kết quả cũ. [Lượt hồi quy](evidence/final-e2e.log) |
| Còn mở · Tiêu đề nhỏ ở thanh đầu mobile | Mở không gian học ở 375 px. Cụm trợ giúp, đăng nhập và về website ép tên trang ở thanh đầu. Tiêu đề chính vẫn đọc được trong nội dung. [Ảnh thanh đầu](screenshots/routes/375/workspace.png) |
| Còn mở · Trang thư viện và dự án còn dài | Bản đo ở 375 px cho thấy vùng nội dung Dự án và Board cao khoảng 7,9 nghìn và 7,3 nghìn px. Bước tiếp theo cho UX là đưa lọc và hồ sơ đang làm lên đầu, giảm lượng nội dung phải lướt trên cùng một màn hình. [Dự án](screenshots/routes/375/projects.png) · [Board](screenshots/routes/375/boards.png) |
| Model Blue Pill và NUCLEO-F401RE còn thiếu xác nhận vị trí chân | Mở hồ sơ board và đối chiếu nguồn hình học theo revision. Blue Pill có nhiều biến thể. NUCLEO có tài liệu gốc MB1136 C04, còn asset web được ghi là hình tham chiếu. [Hồ sơ nguồn model](../../board-model-sourcing.md) |
| Mức hỗ trợ firmware phụ thuộc board | AVR và Pico có ca chạy firmware. ESP32 có ca chạy sketch rút gọn và ca từ chối `Wire.h`. Một trình xem 3D mở được chỉ xác nhận được khả năng hiển thị. [Ảnh AVR](independent/CM589IoX-final-avr-runtime-375.png) · [Dữ liệu tester](independent/CM589IoX-audit-summary.json) |

## Giới hạn đợt local

- Ghi đồng thời tuyệt đối từ hai tab vẫn có thể tranh chấp ở `localStorage`. Ca xung đột hiện kiểm được tab cũ đã quan sát thay đổi. Thư viện có một chỗ lưu dữ liệu phục hồi. Bản báo cáo đang làm đã hỏng có thể tải nguyên bản để cứu dữ liệu. Xóa bộ nhớ trình duyệt có thể làm mất bản lưu cục bộ.
- Khả năng giữ chân cần đo bằng lượt dùng thật tự nguyện, bao gồm hoàn thành thử nghiệm đầu và quay lại tiếp tục học. [Phiếu quan sát](../../software/local-learning/2026-11-18-roadmap-local-finish.md#phiếu-quan-sát-thử-với-người-mới)
- Đồng bộ, đăng nhập, cộng đồng và lớp học online, analytics, triển khai Mini PC, thiết bị vật lý và thử trên điện thoại thật để lại cho các đợt tương ứng. Offline đã kiểm sau khi truy cập và làm ấm cache.
