# Hoàn thiện kế hoạch cập nhật local · 18/11/2026

Đối chiếu [kế hoạch 17/11](2026-11-17-web-update-roadmap.md) với mã, queue và [bằng chứng đợt tester](2026-11-18-tester-feedback-report.md).

| Đợt | Phần đã có | Phần tiếp tục |
| --- | --- | --- |
| 1 | Năm hoạt động, dự đoán và quan sát, khôi phục dữ liệu local | Kiểm với người mới để có số liệu thực tế |
| 2 | Mở Bot theo ngữ cảnh, tìm điểm lỗi, chọn bài và board, bản đồ chân Mega | Blue Pill và Nucleo cần dữ liệu hình học đúng revision |
| 3 | Dạng sóng, A/B, probe SPICE, nhãn nguồn kết quả | Đồ thị Serial từ đầu ra hiện có. Firmware/peripheral mới cần phạm vi kiểm chứng riêng |
| 4 | Gói giáo viên năm hoạt động, phiếu và đáp án tải offline | Mini-project, dự đoán, thử lỗi, lập hồ sơ và nhập lại |
| 5 | Có phần chuẩn bị cục bộ | Sync, chia sẻ, lớp học và analytics online chờ môi trường server |

## Mini-project · LRN-09, LRN-10, PRJ-02

Đèn cảnh báo dùng biến trở, nút cho phép và LED. Chọn tường minh Uno R3, Nano classic hoặc Mega 2560. Tái dùng topology và mô hình logic bàn tự do. Mô hình dùng ngưỡng đã đặt, đọc trạng thái nút và biến trở qua net. Thử sát ngưỡng, tháo/nối lại đường GND của nút rồi ghi dự đoán, quan sát và cách sửa lỗi. Sơ đồ tô đường tín hiệu HIGH ở lần chạy vừa ghi. Code Arduino sinh theo cấu hình để đối chiếu.

Hồ sơ JSON version 1 lưu ID dự án, board, mạch, code, nguồn mô hình và tối đa 20 lần thử. Bản sao nhận ID mới. Trang giữ một hồ sơ đang làm trên mỗi trình duyệt; lưu nhiều bản bằng file. Mở tệp cần xác nhận. Bộ đọc tái tạo mạch/code và chạy lại từng điều kiện để kiểm nội dung. Bản lưu hỏng hoặc chưa hỗ trợ được giữ nguyên và có nút tải về. Workspace bàn tự do và khóa học dùng các khóa lưu riêng.

Kiểm unit topology, biên, sự cố, codec và E2E tại 375/1440. Nghiệm thu một mini-project giáo dục. Phân biệt với mô phỏng điện, chạy firmware và đo trên thiết bị.

## Serial Plotter · OBS-03

Mở đồ thị cạnh Serial Monitor trên bàn tự do, giữ nguyên đầu ra văn bản. Đọc dòng hoàn chỉnh từ nguồn runtime đang hiển thị, hỗ trợ số đơn và cặp `nhãn:giá_trị`, bỏ dòng lỗi và giới hạn điểm/series. Trục ngang là thứ tự mẫu, không suy ra thời gian. Xuất CSV nếu có điểm. Kiểm parser, kết xuất và in-app ở 375/1440. Sử dụng trình chạy hiện tại. Không thêm provider hoặc kết nối thiết bị.

## Phiếu quan sát thử với người mới

Chạy với người tham gia tự nguyện trên bản local ở hai kích cỡ màn hình. Dùng mã lượt tự đặt trên giấy. Ghi nhóm màn hình, thời gian, hành động cần giúp và kết quả theo tiêu chí dưới đây. Dữ liệu lượt thử nằm ngoài ứng dụng.

| Mốc | Cách ghi nhận | Bằng chứng cần thấy |
| --- | --- | --- |
| Vào khóa học và tự chọn board | Ghi số lần cần hướng dẫn và thời gian từ trang mở đầu | Tự tìm được hoạt động đầu tiên và gọi tên board đã chọn |
| Hoàn thành hoạt động mạch kín | Ghi có/không và thao tác gây vướng | Giải thích được vì sao LED sáng khi đường về kín |
| Hoàn thành mini-project | Đếm ba phép thử trong hồ sơ và số gợi ý đã dùng | Dự đoán rồi chạy, tìm dây GND hở, nối lại và giải thích vì sao kết quả đổi |
| Quay lại sau 1–7 ngày | Ghi số lượt đồng ý quay lại, số lượt quay lại và số lượt làm thêm được một phép thử | Mở đúng hồ sơ trước đó, thay ngưỡng rồi ghi một quan sát mới |

Tổng hợp theo mốc với mẫu số và số lượt quan sát. Kết quả hiện tại của phiếu là **chưa có lượt thử**. Kiểm thử Playwright xác minh thao tác; chỉ lượt thực tế mới trả lời câu hỏi về trải nghiệm và quay lại.
