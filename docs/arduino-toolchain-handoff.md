# Chuyển sketch Mạch Mở sang Arduino IDE / Arduino CLI

## Luồng web hiện có

Trong Phòng thử mạch, chọn bài có nhãn code-subset rồi bấm **Xuất sketch .ino**. Tệp chứa code hiện tại, tên board/MCU, mức logic tham chiếu, chân output alias và link tài liệu board nếu có. Trước khi tải, Mạch Mở phân tích code bằng parser giáo dục và chặn trường hợp code sai phạm vi hoặc chân không khớp profile đang chọn.

Tệp `.ino` là bản chuyển giao để người dùng tự mở bằng Arduino IDE. Nó không kèm board core, thư viện bên ngoài, binary firmware hay cấu hình upload. Mạch Mở chưa biên dịch, xác thực compiler, kết nối USB/serial hoặc nạp code. Board name và alias trong header là gợi ý học tập; phải chọn đúng board/core revision và kiểm tra pinout/điện áp trước khi dùng phần cứng.

Trang `/tools/firmware-hex` kèm sketch Arduino Uno D13, HEX bare-metal assembly và HEX đã biên dịch từ sketch. Arduino IDE 2.3.10 với Arduino AVR Boards 1.8.8, target `arduino:avr:uno`, đã biên dịch sketch; kết quả chiếm 924 byte flash và 9 byte RAM. HEX được nạp vào AVR8js và cho chuyển mức D13 LOW → HIGH → LOW. CLI độc lập cùng bộ toolchain gặp lỗi Windows `Illegal System DLL Relocation` ở `avr-g++.exe`; bước compile được xác nhận qua Arduino IDE.

## Arduino CLI: công cụ ứng viên cho app companion

[arduino/arduino-cli](https://github.com/arduino/arduino-cli) là công cụ chính thức để cài core, xác định board, biên dịch và upload sketch. Kho GitHub công bố giấy phép GPL-3.0 và nêu lựa chọn license thương mại cho một số tình huống thương mại; cần đánh giá điều khoản trước khi app phát hành tích hợp sâu. Tài liệu upstream mô tả CLI, daemon gRPC và khả năng nhúng như các kiểu tích hợp riêng. Hướng phù hợp để khảo sát cho app là gọi CLI đã cài riêng trên máy người dùng hoặc giao tiếp daemon cục bộ; không nhúng binary vào web bundle.

Luồng app dự kiến:

1. Mở project bundle hoặc thư mục sketch từ Mạch Mở.
2. Liệt kê board/core đã cài; yêu cầu người dùng chọn target/FQBN nếu không xác định chắc chắn.
3. Chạy compile cục bộ, trả log và lỗi về giao diện; không upload mặc định.
4. Chỉ bật upload khi người dùng chọn thiết bị/cổng và bấm xác nhận riêng.
5. Ghi tool/version/target và kết quả compile vào báo cáo project; không tuyên bố build thành công nếu CLI chưa trả mã thoát 0.

Web vẫn không compile local: trang không gọi Arduino CLI/IDE, không quét cổng USB và không upload. Bản HEX mẫu trong web là artifact kiểm chứng, không biến trang thành compiler service.

## Nguồn

- [Arduino CLI trên GitHub](https://github.com/arduino/arduino-cli)
- [Arduino CLI releases](https://github.com/arduino/arduino-cli/releases)
- [Hướng dẫn chính thức: board, core, compile và upload](https://arduino.github.io/arduino-cli/dev/getting-started/)
- [Các kiểu tích hợp CLI, gRPC daemon và embedding](https://github.com/arduino/arduino-cli/blob/master/docs/integration-options.md)
