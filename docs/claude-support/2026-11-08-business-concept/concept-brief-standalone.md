# Mạch Mở / MởBot Starter: mô tả concept và môi trường dự án

Tài liệu này đọc được một mình. Nó mô tả sản phẩm, môi trường và các số liệu chi phí hiện có của dự án để team business dùng cho việc đánh giá thị trường Việt Nam, tìm đối thủ và xây dựng mô hình kinh doanh. "Mạch Mở" và "MởBot" là tên làm việc, chưa đăng ký nhãn hiệu.

## 1. Tóm tắt

Mạch Mở là website học điện tử, lập trình nhúng (lập trình cho bo mạch nhỏ) và IoT (thiết bị nối mạng), miễn phí, chạy ngay trên máy người học, không cần tài khoản. MởBot Starter là kit robot STEM bánh xe dạng lắp ghép: cùng một lõi, người học lắp thành xe rover hoặc robot mini, tự lắp thêm tay điều khiển, và mỗi hoạt động gắn với một bài học trên Mạch Mở. Thị trường đầu tiên dự kiến là Việt Nam.

## 2. Khách hàng dự kiến

Dự án chưa có nghiên cứu khách hàng hay số liệu người dùng. Các nhóm khách có thể có: phụ huynh mua cho con; trường học và trung tâm STEM; người tự học. Độ tuổi mục tiêu chưa chốt và chưa được ghi lên hộp.

## 3. Sản phẩm gồm ba lớp

| Lớp | Hạng mục | Mô tả đời thường |
|---|---|---|
| (a) Web học miễn phí Mạch Mở | 11 bài học chia 4 chặng | Học theo lộ trình từ cơ bản đến robot |
| | Mô hình 3D mạch và board | Xem và xoay mạch, board trên màn hình |
| | Phòng lắp mạch ảo, lưu bản nháp trên máy | Thử nối linh kiện, kết quả lưu trong trình duyệt |
| | Mô phỏng mạch bằng SPICE (phần mềm tính hành vi mạch điện) | Chạy thử mạch để xem dòng và áp |
| | Mã QR mở bài học, điều khiển robot từ trình duyệt | Quét QR trên hộp để vào đúng bài; lái robot qua web |
| (b) Kit MởBot Starter | Lõi robot dùng chung, khung cơ khí mở | Một lõi lắp được hai hình dạng |
| | Màn hình hiển thị khuôn mặt, loa, nút bấm | Robot có mặt biểu cảm, phát lời chào thu sẵn |
| | Cảm biến vật cản | Robot nhận biết vật lại gần |
| | Tay điều khiển tự lắp (module riêng) | Người học tự lắp, đổi chức năng nút |
| | Hộp ba khay xếp theo hành trình | Khay 1 bắt đầu; khay 2 thử thách đầu tiên; khay 3 đổi cấu hình |
| (c) Bộ mở rộng và gói số | E1 Xe dò đường | Robot bám đường kẻ |
| | E2 Bộ điều khiển sáng tạo | Bổ sung cho tay cầm của Starter |
| | E3 Tay gắp mini | Gắn thêm tay gắp |
| | E4 Trạm cảm biến môi trường | Dự án IoT đo môi trường |
| | Gói dự án số | Dự án đóng gói để tải về, chia sẻ |

Nguyên tắc: Starter hoàn chỉnh mà không cần mua thêm; mỗi bộ mở rộng có một lời hứa và một dự án, ghi rõ "cần Starter", dùng lại lõi Starter; nội dung cho Starter luôn miễn phí.

## 4. Hành trình người dùng 7 bước

1. Mở hộp, quét QR để vào bài học.
2. Lắp xe rover từ lõi và khung.
3. Nhấn nút chào hỏi: robot phát lời chào và hướng dẫn thu sẵn qua loa, không nghe người nói.
4. Tự lắp tay cầm và lái thử.
5. Làm thử thách vật cản: quan sát, chỉnh ngưỡng, thử lại.
6. Đổi sang cấu hình robot mini.
7. Dự án đầu tiên "Robot canh bàn học": có vật lại gần thì robot đổi mặt ngạc nhiên và nói câu cảnh báo do người học chọn.

## 5. Môi trường và ràng buộc

- **Local-first (chạy và lưu tại máy người dùng).** Web chạy trong trình duyệt, không cần tài khoản đám mây; bài học và bản nháp lưu trên thiết bị. Thống kê truy cập chỉ bật khi được cấu hình và chỉ ghi mã phiên ngẫu nhiên.
- **Offline.** Web lưu bộ nhớ đệm để mở lại một số trang khi mất mạng; lần đầu cần có mạng.
- **Board ESP32 30 chân.** ESP32 là bo vi điều khiển có sẵn Wi-Fi và Bluetooth, làm "bộ não" của robot và tay cầm. Loại được chọn có 30 chân, cổng USB-C, niêm yết 140.000 đ/bo tại một nhà bán trong nước. Đây là board bán rời kiểu clone, không có sơ đồ chính hãng; kích thước và điện bên trong là ước lượng từ ảnh và web.
- **Nguồn điện và pin.** Robot dùng pin 2S (hai cell Li-ion nối tiếp, khoảng 8,4 V khi đầy) cho hai động cơ N20 và sạc qua USB-C. Tay cầm dùng một pack riêng.
- **Giọng nói V1.** Chỉ phát lời chào và hướng dẫn thu sẵn qua loa, không có micro. Hộp không ghi "AI" hay "trò chuyện tự nhiên", không ghi độ tuổi, thời lượng pin, số bài học.
- **An toàn trẻ em và chứng nhận.** Chưa có kế hoạch chứng nhận đồ dùng trẻ em; cần chuyên gia xác nhận tiêu chuẩn áp dụng.
- **Phần cứng cần có để ra sản phẩm.** Bo mạch in (PCB), firmware (chương trình nạp trong bo), thiết kế khung cơ khí, bản mẫu thử, đóng gói.

## 6. Chi phí và chuỗi cung ứng đã biết

Các số dưới đây là dự toán linh kiện của một robot kèm một tay cầm. Chưa gồm hộp, tài liệu, kiểm thử, chứng nhận, vận chuyển và nhân công.

| Số liệu | Giá trị |
|---|---|
| Trần ngân sách mục tiêu | 1.000.000 đ |
| Dự toán linh kiện | 1.194.128 – 1.714.128 đ |
| Phần có giá niêm yết (2 board, 2 động cơ, 2 pin, 1 cảm biến siêu âm), chưa phải giá giao tận nơi | 589.128 đ |
| Board ESP32 30 chân USB-C | 140.000 đ/bo (niêm yết) |
| Cảm biến siêu âm HC-SR04 | 25.000 đ (niêm yết) |

Các giá khác (màn hình, loa, mạch sạc, khung, hộp, bộ mở rộng, giá bán lẻ) và khả năng cung ứng số lượng lớn **[chưa kiểm chứng]**.

## 7. Các giai đoạn phát triển

| Giai đoạn | Nội dung |
|---|---|
| P0 | Chốt quyết định nền tảng |
| P1 | Lõi web chạy cục bộ, khung firmware |
| P2 | Mạch điện Starter |
| P3 | Cơ khí hai cấu hình, tay cầm tự lắp |
| P4 | Giọng nói tối thiểu, bài học theo hành trình |
| P5 | Thử mẫu EVT/DVT, đo kiểm, an toàn |
| P6 | Web công khai, gói dự án số |
| P7 | Thử sản xuất, đóng gói, chứng nhận |
| P8 | Bộ mở rộng E1, chuẩn tương thích |

## 8. Rủi ro lớn nhất

1. **Giá vốn vượt trần:** linh kiện dự toán 1,19–1,71 triệu đ so với trần 1 triệu đ, giá bán hợp lý có thể không đủ biên lợi nhuận.
2. **Pin và nguồn cho trẻ em:** nếu không đạt yêu cầu an toàn, có thể không bán hợp pháp cho học sinh.
3. **Chứng nhận và độ tuổi chưa chốt:** thời gian và chi phí kiểm định chưa biết.
4. **Phạm vi lớn:** hai cấu hình, tay cầm và điều khiển web cùng lúc, kéo dài thời gian ra mắt.
5. **Board bán rời không sơ đồ, không số đo:** lô khác nhau có thể không tương thích, tăng chi phí hỗ trợ.
6. **Kỳ vọng sai về giọng nói, khung giống thương hiệu khác:** rủi ro khiếu nại và hình ảnh thương hiệu.

## 9. Câu hỏi dành cho team business

1. Quy mô thị trường Việt Nam: bao nhiêu phụ huynh, trường, trung tâm STEM phù hợp, theo thành phố?
2. Đối thủ trực tiếp tại Việt Nam: kit robot STEM nào đang bán, giá, kênh, độ tuổi?
3. Đối thủ gián tiếp: lớp robot, khóa học online, đồ chơi lắp ráp?
4. Định giá Starter và từng bộ mở rộng, khi dự toán linh kiện đã vượt trần mục tiêu 1.000.000 đ.
5. Kênh bán: trực tiếp, qua trường, qua trung tâm hay thương mại điện tử?
6. Độ tuổi mục tiêu của khách mua và người dùng.
7. Nhu cầu chứng nhận tại Việt Nam cho đồ chơi và thiết bị điện dùng pin cho trẻ em: yêu cầu, chi phí, thời gian.
8. Mô hình doanh thu bộ mở rộng E1–E4: bán lẻ từng bộ, gói theo lớp hay đăng ký.
9. Mô hình doanh thu gói dự án số, khi nội dung Starter luôn miễn phí.
10. Tay cầm nằm trong mọi hộp Starter hay bán rời?
11. Hỗ trợ sau bán và bảo hành pin, linh kiện.

## 10. Phụ lục: thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| ESP32 | Bo vi điều khiển (máy tính rất nhỏ) có Wi-Fi và Bluetooth, "bộ não" của robot |
| Board 30 chân | Bo ESP32 gắn sẵn trên mạch thử, có 30 chân nối ra ngoài |
| PCB | Bảng mạch in, tấm mạch gắn linh kiện |
| SPICE | Phần mềm tính hành vi mạch điện (dòng, áp) |
| Local-first | Chạy và lưu dữ liệu tại máy người dùng, không bắt buộc mạng hay tài khoản |
| BOM | Bảng linh kiện và giá của sản phẩm |
| Firmware | Chương trình nạp trong bo mạch để điều khiển robot |
| EVT / DVT / PVT | Ba đợt thử mẫu trước khi sản xuất: kỹ thuật, thiết kế, sản xuất |
| Pin 2S | Hai cell Li-ion nối tiếp, khoảng 8,4 V khi đầy |
| N20 | Loại động cơ nhỏ cho bánh xe robot |
| QR | Mã vạch hai chiều quét bằng điện thoại |
