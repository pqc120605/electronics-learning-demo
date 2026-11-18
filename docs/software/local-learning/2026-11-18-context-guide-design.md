# Đợt 2a — Mở Bot theo hoạt động đang học

Đây là lát cắt tiếp theo của roadmap đã duyệt, chạy local và dùng Guide hiện có. Không tạo bot/store/gợi ý thứ hai. Thực hiện sau khi snapshot đợt 1 kết thúc kiểm thử.

## Vấn đề và kết quả

Khóa nền tảng đã có trạng thái thí nghiệm, nhưng Mở chưa nhận ngữ cảnh đó. Người mới cần biết mình đang ở bước nào, kết quả vừa xem đến từ đâu và thao tác tiếp theo nằm ở đâu. Một câu trả lời hỏi đáp tham chiếu board hiện tại cũng không được tiếp tục hiển thị như còn đúng sau khi ngữ cảnh đã đổi.

Tái dùng `GuideContextBridge`, `GuideSnapshot`, tab Đang làm, route hướng dẫn và kho FAQ. Một adapter thuần chỉ chia sẻ metadata allowlist từ hoạt động hiện tại: ID/tiêu đề/bước, board được chọn tường minh, số gợi ý đã mở, và quan sát hiện hành nếu thực sự tồn tại. Không chia sẻ code, signature có code, toàn bộ session, lịch sử quan sát, storage raw, danh tính hoặc dữ liệu tệp.

## Hành vi

- Bài code chưa có board hợp lệ: chỉ hướng tới chọn board, không chọn hộ hoặc dựng kết quả.
- Chưa dự đoán: hướng tới dự đoán. Đã dự đoán nhưng chưa quan sát: nói chưa có kết quả và đưa focus tới nút quan sát; không chạy hộ.
- Có quan sát hợp lệ: nêu kết quả, dự đoán khớp/khác và loại bằng chứng. Kết quả này là topology hoặc trace subset, không phải phép đo điện hay thực thi firmware.
- Đổi control/board/activity: loại bỏ kết quả hiện tại khỏi ngữ cảnh ngay. Lịch sử hoàn thành không thay thế lần quan sát hiện hành.
- Tái dùng các mức gợi ý đã mở từ dữ liệu hoạt động. Guide không tự mở gợi ý hoặc chọn đáp án.
- Hành động nội bộ chỉ cuộn/focus tới ID được allowlist trong khóa: board, điều khiển, dự đoán, quan sát, giải thích, gợi ý. Không nhận selector/URL tùy ý, không thay dữ liệu.
- Câu gợi ý rõ nghĩa như “Tôi nên làm gì tiếp?” hoặc “Giải thích kết quả hiện tại” có thể trả advice deterministic theo activity, kèm nguồn vào khóa. Câu hỏi có tên board/clone cụ thể vẫn đi qua guard hiện có; ngữ cảnh không ghi đè biến thể được hỏi.
- Khi snapshot thay đổi, câu trả lời hỏi đáp cũ được xóa/đánh dấu cần hỏi lại. Giữ câu hỏi trong bộ nhớ panel, không gửi ra mạng. Escape và focus về nút mở vẫn hoạt động; action nội bộ trả focus đúng mục tiêu.

## Nghiệm thu

1. Adapter không xuất outcome trước quan sát, kể cả session có lịch sử cũ; không xuất code/raw/signature.
2. Nút nhấn và threshold lấy result hiện hành; thay input/board/ngưỡng xóa bằng chứng hiển thị cũ.
3. Board null/lạ và activity lạ không bị gán sang ESP32 hoặc một activity khác.
4. Hỏi tiếp theo/kết quả có nguồn và không bypass guard câu hỏi explicit Uno R4/clone.
5. E2E 375/1440: mở trợ giúp, đọc Đang làm, action bằng bàn phím focus đúng mục, không chạy hoặc thay dữ liệu; đổi context không giữ câu trả lời cũ.
6. Typecheck, unit và các E2E course/guide cũ cùng mới đạt trên snapshot đóng; review độc lập theo hash. Không dependency/server/thiết bị.

## Phần tiếp theo còn trong roadmap

Lát cắt này hoàn thiện hỗ trợ người mới trong khóa nền tảng. Cross-probe nâng cao, thêm anchor hãng, probe/debug sâu hơn và mini-project/gói giáo viên vẫn là các task tiếp theo, không suy ra đã hoàn tất từ việc bot có ngữ cảnh.
