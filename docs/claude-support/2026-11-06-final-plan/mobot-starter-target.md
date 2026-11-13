# MởBot Starter: mục tiêu sản phẩm phần cứng (bản final)

Nguồn: artifact "MởBot Starter", gói giải pháp sản phẩm v1 ngày 03/11/2026, đọc ngày 06/11/2026 tại https://claude.ai/artifact/NKzoyN5pcRE3WyC5xBxWPz. Artifact được dựng từ Feature brief v1.1 và hình concept v1.1. File này chỉ là bản tóm tắt để Codex đọc ngay trong repo, không thay thế artifact. Hình concept chỉ thể hiện định hướng, không phải thiết kế sản xuất hay BOM.

## Lời hứa sản phẩm
"Lắp · Lái · Biến đổi": kit robot STEM bánh xe dạng lắp ghép. Cùng một lõi, người học lắp được 2 cấu hình là **xe rover** và **robot mini**. Người học tự lắp **tay điều khiển**. Mỗi hoạt động đều gắn với một bài học miễn phí trên Mạch Mở.

## Tính năng V1 và trạng thái theo brief
| Tính năng | Trạng thái |
|---|---|
| Hai cấu hình từ cùng một lõi (rover ↔ mini) | Cốt lõi V1 |
| Khung cơ khí mở, có điểm gắn module | Cốt lõi V1 |
| Gương mặt hiển thị trên màn hình (chờ, nghe, vui, cảnh báo) | Cốt lõi V1 |
| Loa và nút vật lý | Cốt lõi V1 |
| Giọng nói tiếng Việt kiểu nhấn để nói, có nút tắt micro | Cốt lõi, **cần xác thực** |
| Tay điều khiển tự lắp: ghép, lái, đổi chức năng nút | Cốt lõi V1 |
| Điều khiển qua web: lái cơ bản, bắt đầu và dừng thử thách | Cốt lõi V1 |
| Thử thách phát hiện vật cản | Cốt lõi V1 |
| Bài học miễn phí trên Mạch Mở, mở bằng QR, có gợi ý sửa lỗi | Cốt lõi V1 |
| Cảm biến chạm | Cân nhắc sau khi thử nghiệm |

Lời hứa tối thiểu (đề xuất): nếu phần giọng nói chưa đạt, Starter vẫn có lời chào và hướng dẫn phát sẵn qua loa. Hộp KHÔNG hứa khả năng hội thoại và KHÔNG ghi "AI".

## Hành trình người dùng V1
1. Mở hộp, quét QR.
2. Lắp rover.
3. Chào hỏi bằng nút nhấn để nói.
4. Tự lắp tay cầm và lái thử.
5. Làm thử thách vật cản: quan sát, chỉnh ngưỡng, thử lại.
6. Đổi sang cấu hình robot mini.
7. Dự án đầu tiên "Robot canh bàn học" (đề xuất): khi có vật lại gần, robot đổi sang mặt ngạc nhiên và nói câu cảnh báo do người học chọn.

## Hộp sản phẩm
Ba khay, xếp theo hành trình:
- Khay 1 · Bắt đầu: lõi, khung rover, bộ tay cầm, thẻ QR (dùng cho bước 1–4).
- Khay 2 · Thử thách đầu tiên (bước 5).
- Khay 3 · Đổi cấu hình: phần thân mini (bước 6).

Khi chưa có dữ liệu, KHÔNG in lên hộp: "AI", "trò chuyện tự nhiên", độ tuổi, thời lượng pin, số bài học.

## Bộ mở rộng
- E1 · Xe dò đường (ưu tiên cao)
- E2 · Bộ điều khiển sáng tạo
- E3 · Tay gắp mini
- E4 · Trạm cảm biến môi trường (IoT)
- Gói dự án số (ưu tiên cao, làm song song ngay từ đầu)

## Nguyên tắc tương thích
- Starter phải hoàn chỉnh mà không cần mua thêm.
- Mỗi bộ mở rộng có 1 lời hứa và 1 dự án.
- Bộ mở rộng ghi rõ "cần Starter".
- Dùng lại lõi của Starter.
- Mỗi bộ có đủ bốn nhịp: lắp, thử, giải thích, chia sẻ.
- Nhận diện thống nhất: teal/cam, khung mở.
- E2 bổ sung cho tay cầm Starter, không thay thế nó.
- Công bố chuẩn lắp ghép và kết nối trước khi bán bộ mở rộng đầu tiên.
- Nội dung cho Starter luôn miễn phí.

## Quyết định founder/business còn mở
- Khách hàng đầu tiên và độ tuổi.
- Phạm vi giọng nói ở V1.
- Có đưa tay cầm vào mọi bản Starter hay không.
- Câu chuyện demo.
- Giá bán và giá vốn.
- Chuẩn lắp ghép và kết nối.
- Tên MởBot và nhãn hiệu (hiện là tên làm việc).

## R&D phải xác thực (artifact KHÔNG chốt các mục này)
Bo mạch, MCU, cảm biến, sơ đồ kết nối, động cơ, pin, thời lượng dùng, kiến trúc xử lý giọng nói, kết nối mạng, chuẩn cơ khí, khả năng sản xuất, an toàn, vận chuyển, chứng nhận đồ dùng trẻ em, hoạt động khi không có mạng.

## Rủi ro đã nêu
- Phạm vi V1 lớn: 2 cấu hình, tay cầm và giọng nói cùng lúc.
- Người dùng kỳ vọng sai về giọng nói; lo ngại riêng tư.
- Giá thành.
- Hỗ trợ sau bán.
- Khung có lỗ dễ bị liên tưởng tới thương hiệu khác.
- Phụ thuộc vào mạng.
- An toàn nguồn điện và chứng nhận.
- Phân mảnh tồn kho.
