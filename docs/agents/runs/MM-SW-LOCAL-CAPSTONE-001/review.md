# Review độc lập · MM-SW-LOCAL-CAPSTONE-001

- Phán quyết cuối của Box 08 ngày 19/11/2026 **PASS** trên [mười hash đã chốt](snapshot-reviewed.json).
- Lượt đầu yêu cầu sửa tô tín hiệu. `activeKeys` của sơ đồ nhận khóa đầu nối, trang truyền ID dây. Playwright ban đầu tái hiện ở cả 375 và 1440 px. Bản sửa tìm net chứa dây rồi chuyển các đầu nối của net vào sơ đồ. Review lại xác nhận đầy đủ hash và ánh xạ đã đúng.
- Model đọc nút, biến trở và LED qua net của tài liệu; code mẫu ghi đúng pin và điều kiện ADC. Bộ đọc hồ sơ so mạch/code/pin map với bản dựng lại và tái tính các quan sát. ID gốc giữ qua nhập, bản sao có ID mới. Khóa riêng và đối chiếu bản lưu trước mỗi lần ghi bảo vệ draft khác và bản lưu từ tab khác.
- `LocalCapstonePage.tsx` tại lần review cuối có SHA-256 `a0d0516664daf6b8fccf215198cb59a14e6b66d027828ac34e2ec5e0b70c8846`.
- Ảnh browser phát hiện biến trở còn hiện khối giữ chỗ. Đã bổ sung ký hiệu ba đầu VCC, wiper và GND. Review cuối kiểm tọa độ tương ứng thân ký hiệu, route giữ đúng khóa net và ký hiệu đang dùng của các linh kiện khác. Test đối chiếu ba net về board, gồm A0 nhận wiper.
- Phạm vi là review mã nguồn. Kiểm thử thực thi do lead ghi ở `report.md`.
