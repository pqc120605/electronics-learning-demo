# MoBot V2 tay cầm · Bổ sung review nhận dạng RUN

MM-HW-MOBOT-IF-001. Bổ sung cho [packet trước KiCad](mobot-v2-handset-b01-pre-kicad-review.md), SHA-256 `EDC38CE80484F2C1DF847F3C21E35A1B7904E336D856415FDF3C1AD37368051F`. Tổng hợp các lượt trả kết quả mới của Box 02 và 03. Các mục ngoài phạm vi bổ sung tiếp tục theo packet gốc.

- Hai tiếp điểm thường hở, cơ cấu hồi riêng, hai gờ riêng trên đầu chụp RUN. Cáp RUN giữ đầu phía carrier bằng chặn tháo từ bên trong. Chọn ngàm RUN/PROGRAM làm dự phòng nếu đầu chụp thiếu biên hành trình.
- Hai vòng điện có giám sát, bốn dây `SENSE_A`, `RET_A`, `SENSE_B`, `RET_B`, tách khỏi GND chức năng và shield. Mỗi vòng phân biệt nhả, đóng, hở và chập bằng mạng điện trở cuối tuyến. Phân biệt chập chéo bằng mã riêng và kích tuần tự hoặc cơ chế tương đương có chứng minh. JST GH 10 cực là ứng viên nếu đủ sáu dây chức năng kể cả GND, ngoài bốn dây sense.
- Chỉ cho RUN sau khi thấy hai vòng nhả hợp lệ, rồi đóng hợp lệ và có lệnh RUN mới. Nếu khởi động khi cáp đã cắm thì cần rút và cắm lại. Mất bias, veto CHARGE, lỗi vòng hoặc hai vòng bất đồng thì cách ly I/O, tắt RUN và xóa quyền RUN. Khi cho phép nối I/O vẫn cần xác nhận attach, VBUS RUN, không FAULT và hai rail hợp lệ.
- Từng tiếp điểm phải đóng sau khi USB ổn định. Khi rút, từng tiếp điểm phải đủ biên nhả để I/O ngắt trước khi USB mất ổn định, kể cả nếu tiếp điểm kia kẹt đóng. Khoảng hành trình hữu dụng sau sai số đo phải lớn hơn tốc độ rút dùng để kiểm nhân tổng thời gian phát hiện và ngắt ở góc xấu nhất. Xét cắm hờ, nảy, nhầm cáp, đầu chụp kẹt, gá biến dạng hoặc xê dịch và thay cụm sau bảo trì. Hai vòng độc lập về điện vẫn chia sẻ đầu chụp và gá.

Box 08 rà hợp đồng lỗi, tính khả thi của việc khóa phần điện từ tài liệu, và bằng chứng còn cần trước KiCad. Các cửa sổ sense, dung sai cơ khí, độ trễ ngắt, số dây chức năng cuối, dữ liệu đúng B01 và hồ sơ B15 vẫn mở. Chưa có phép đo mẫu trong lượt này.
