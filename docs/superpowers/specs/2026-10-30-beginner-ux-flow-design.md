# Đặc tả UX — Luồng sử dụng Mạch Mở cho người mới

**Ngày:** 30/10/2026  
**Trạng thái:** Bản thiết kế để founder review  
**Phạm vi:** Điều hướng chính, điểm bắt đầu, bài học và workspace `/build`

## 1. Bối cảnh và vấn đề

Mạch Mở có các trang Khám phá, Board, Linh kiện, Lắp mạch, Chủ đề, Dự án và bài học. Trang `/build` hiện kết hợp chọn bài, chọn board, chỉnh mạch, chọn chế độ xem 2D/3D/PCB, chỉnh code, chạy mô phỏng và đọc chẩn đoán. Người mới phải tự suy ra thứ tự thao tác và dễ phải cuộn qua nhiều khối nội dung.

Mục tiêu của thay đổi là giúp người mới trả lời được ba câu hỏi ở mọi thời điểm: **Tôi đang ở đâu? Tôi làm gì tiếp theo? Tôi sẽ thấy kết quả ở đâu?** Các chức năng chuyên sâu vẫn còn truy cập được, nhưng không làm nhiễu hành trình nhập môn.

## 2. Người dùng và mục tiêu

### Người mới

- Chưa biết chọn board, chân GPIO hay linh kiện nào.
- Muốn làm một bài chạy được mà không phải hiểu mọi tuỳ chọn trước.
- Cần hướng dẫn có thứ tự, giải thích thuật ngữ ngay tại chỗ và lỗi kèm cách sửa.

### Người đã có kinh nghiệm

- Muốn vào thẳng board, linh kiện, code hoặc workspace.
- Không muốn wizard cản trở thao tác tự do.

## 3. Nguyên tắc thiết kế

1. **Dẫn đường thay vì bắt nhớ:** mỗi màn hình có một hành động chính và chỉ rõ bước kế tiếp.
2. **Tăng dần độ sâu:** nạp bài mẫu và cấu hình an toàn trước; tuỳ chỉnh nâng cao mở khi người dùng cần.
3. **Dùng từ theo việc học:** “Chọn bài”, “Nối mạch”, “Viết code”, “Chạy thử”; thuật ngữ kỹ thuật được giải thích cạnh nơi xuất hiện.
4. **Không giả vờ mô phỏng thật:** gắn nhãn rõ dữ liệu tham khảo, đầu vào ảo, luồng minh hoạ và giới hạn mô phỏng.
5. **Giữ lối vào tự do:** người dùng có thể bỏ qua hướng dẫn, đổi board/bài, vào code hoặc chọn 2D/3D/PCB trực tiếp.

## 4. Kiến trúc thông tin đề xuất

Thanh điều hướng desktop dùng bốn mục cấp một; hai mục thư viện/lộ trình mở menu con dễ thấy (click hoặc keyboard; không phụ thuộc hover):

| Mục | Nội dung | Đích đến |
|---|---|---|
| Bắt đầu học | Bài nhập môn và lựa chọn cho người mới | `/` và bài nhập môn; nút chính mở bài đầu tiên |
| Thư viện | Board và linh kiện | Menu con mở trực tiếp `/boards` và `/components` |
| Phòng thử | Lắp mạch, code và chạy mô phỏng | `/build` |
| Lộ trình | Chủ đề và dự án | Menu con mở trực tiếp `/topics` và `/projects` |

Trên màn hình nhỏ, các mục nằm trong menu mở/đóng; menu con mở bằng click/tap, có nhãn và vùng chạm đủ lớn. Các route hiện tại tiếp tục hoạt động; thay đổi điều hướng không được làm mất deep link hoặc bookmark. Trang đang xem phải có trạng thái điều hướng hiện hành rõ ràng.

Trang Khám phá giữ vai trò điểm vào. Nút chính đưa tới bài nhập môn; lựa chọn phụ đưa tới Thư viện hoặc Phòng thử. Không dùng cùng một nút “Bắt đầu học” để dẫn tới một đích không giải thích trước.

## 5. Luồng người mới

### Luồng A — làm bài đầu tiên

`Khám phá → chọn “Bắt đầu cho người mới” → mục tiêu và vật liệu → bài LED → xem linh kiện → làm theo bước → xem code/luồng → chạy thử`

Trang bài học hiển thị ngắn gọn trước khi bắt đầu: thời lượng, board, linh kiện cần có, mục tiêu và nút “Bắt đầu bước 1”. Khi học, chỉ một bước được làm nổi bật; có Trước/Tiếp theo, tiến độ và cách quay về bài.

### Luồng B — lắp và chạy trong Phòng thử

Workspace `/build` trở thành quy trình bốn bước có thanh tiến độ bám trên đầu vùng làm việc:

1. **Chọn bài:** chọn từ bài mẫu hoặc bắt đầu mạch trống; mô tả ngắn nói rõ người học sẽ làm gì.
2. **Lắp mạch:** nạp sẵn board và linh kiện; cho nối dây; hiển thị bước nối hiện tại, tên hai chân, hình/nhãn linh kiện và lưu ý an toàn.
3. **Viết code:** mặc định mở chế độ khối ở bài được hỗ trợ; lựa chọn C++ có nhãn “Tự viết code”. Không hỗ trợ khối/code thì nêu rõ lý do và không giả lập rằng code đang chạy.
4. **Chạy và quan sát:** nút chạy chính, nút từng bước và đầu vào ảo nằm cùng một cụm. Mạch 2D, assembly 3D, PCB và luồng giải thích là các chế độ xem con trong cùng bước; trạng thái đang chạy/dừng và giới hạn mô phỏng luôn nhìn thấy.

Chuyển bước không xoá mạch, code, board hoặc đầu vào. “Đặt lại bài” cần xác nhận nếu có thay đổi chưa lưu; nếu workspace đã tự lưu, thông báo xác nhận nội dung sẽ được khôi phục.

### Luồng C — người đã biết mình cần gì

Thanh điều hướng và các trang thư viện cho phép vào thẳng board, linh kiện, chủ đề, dự án hoặc workspace. Hướng dẫn lần đầu có thể thu gọn/bỏ qua và có thể mở lại từ nút trợ giúp.

## 6. Bố cục trong workspace

- **Thanh trên:** tên bài, board đang chọn, trạng thái lưu và tiến độ bước.
- **Khu chính:** nội dung đúng với bước hiện tại; ví dụ canvas trong bước lắp, editor trong bước code.
- **Inspector:** linh kiện/chân đang chọn, vai trò, nối tới đâu, lưu ý và hành động tiếp theo.
- **Thanh hành động:** một nút chính; các hành động phụ như đặt lại, chuyển chế độ và trợ giúp có thứ bậc thấp hơn.
- **Chế độ xem mạch:** 2D, 3D, PCB và luồng tín hiệu là tab con gắn với cùng bài, không phải các vùng dài xếp liên tục. Mỗi tab giữ nguyên selection và trạng thái mô phỏng.
- **Chẩn đoán:** lỗi đặt cạnh bước liên quan, theo thứ tự xử lý; mỗi lỗi nêu hiện tượng, nguyên nhân có thể và đề xuất thao tác. Mức độ tin cậy/giới hạn của heuristic được ghi rõ.

## 7. Hướng dẫn, phản hồi và thuật ngữ

- Lần đầu vào Phòng thử: một hướng dẫn ngắn, có thể bỏ qua; không dùng tooltip biến mất để truyền đạt bước bắt buộc.
- Mỗi bước có một câu hướng dẫn bằng động từ cụ thể, ví dụ “Nối GPIO 23 qua điện trở tới chân dương LED”.
- Chọn linh kiện mở giải thích theo ngữ cảnh: “Linh kiện này làm gì?”, “Vì sao dùng ở đây?”, “Nối chân nào?” và “Cần chú ý gì?”.
- Sau thao tác, phản hồi xác nhận ngay tại nơi thao tác. Dùng chữ/biểu tượng/trạng thái cùng màu để không dựa vào màu sắc đơn lẻ.
- Dùng cùng một tên cho cùng một hành động trên nút, hướng dẫn và thông báo hoàn tất.

## 8. Tiếp cận và responsive

- Điều hướng bằng bàn phím, focus nhìn thấy được, tên accessible cho nút icon, vùng điều khiển chạm mục tiêu tối thiểu khoảng 44×44 px.
- Màu chữ đáp ứng tương phản; trạng thái lỗi/cảnh báo/thành công có nhãn văn bản.
- Tôn trọng `prefers-reduced-motion`; chuyển bước không làm mất focus hoặc cuộn người dùng về vị trí bất ngờ.
- Mobile ưu tiên một cột: bước hiện tại, canvas, inspector có thể mở/đóng và thanh hành động dễ với tới; không tạo cuộn ngang.

## 9. Ngoài phạm vi

- Không thay đổi mô hình dữ liệu board/linh kiện, parser, firmware engine hoặc độ chính xác CAD trong đặc tả UX này.
- Không thêm chức năng mô phỏng điện/analog/SPICE hay compiler/nạp code.
- Không thay đổi thương hiệu, palette màu tổng thể hoặc tạo lại toàn bộ site từ đầu.
- Không biến mọi người dùng thành wizard bắt buộc; đường vào tự do và deep link vẫn được hỗ trợ.

## 10. Tiêu chí chấp nhận

1. Người mới nhìn thấy khu vực bắt đầu học, thư viện, phòng thử và lộ trình mà không phải đoán ý nghĩa link.
2. Trong `/build`, thứ tự Chọn bài → Lắp mạch → Viết code → Chạy và quan sát nhìn thấy được; người dùng biết bước hiện tại và bước tiếp theo.
3. Chuyển bước không làm mất mạch, code, board, selection và trạng thái đầu vào.
4. Người dùng vào thẳng 2D/3D/PCB hoặc C++ được mà không phải hoàn thành hướng dẫn.
5. Trạng thái lỗi có cách sửa cạnh nội dung liên quan; các nhãn mô phỏng khái niệm/đầu vào ảo luôn rõ.
6. Điều hướng, tab, inspector và thao tác chính sử dụng được bằng bàn phím; layout không tràn ngang trên màn hình nhỏ.
7. Route và bookmark hiện tại vẫn hoạt động hoặc có đường chuyển tương đương.

## 11. Rủi ro và quyết định cần giữ

- Gom nhiều route vào hub có thể làm tăng thêm một lần bấm; điều hướng con cần hiển thị ngay và link nổi bật vẫn cho phép vào thẳng.
- Wizard có thể gây cản trở người có kinh nghiệm; cần cho phép nhảy bước và không chặn người dùng khi bước trước chưa hoàn hảo, ngoại trừ điều kiện an toàn/validator đã có.
- Tập trung nhiều chế độ xem trong tab có thể làm người mới không thấy 3D/PCB; cần nhãn mô tả lợi ích của từng chế độ, ví dụ “Sơ đồ nối”, “Mô hình 3D”, “Lớp đồng PCB”.
- Localhost chưa được xác nhận trên trình duyệt người dùng; nghiệm thu giao diện phải được thực hiện sau khi có server truy cập được từ Chrome của người dùng.

## 12. Tự rà soát đặc tả

- Không yêu cầu tính năng mô phỏng mà backend/parser hiện tại chưa có.
- Phân biệt luồng code minh họa với đường đồng PCB và dòng điện thật.
- Giữ route cũ, đường truy cập trực tiếp, board/linh kiện thư viện và chế độ tự viết code.
- Xác định rõ các trạng thái người dùng, hành vi khi đổi bước, responsive, bàn phím và phản hồi lỗi.
- Đặc tả tập trung vào luồng dùng và phân cấp hiển thị; không bao gồm đại tu hình ảnh hoặc dữ liệu CAD.
