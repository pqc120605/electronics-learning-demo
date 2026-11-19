# Review độc lập · MM-SW-LOCAL-SERIAL-PLOT-001

- Box 08 chốt **PASS** ngày 19/11/2026, khớp [sáu SHA-256 của snapshot cuối](snapshot-reviewed.json).
- Kiểm parser trên dòng LF/CRLF, dòng chia giữa các frame, dòng quá dài và dữ liệu thừa. Giới hạn 256 mẫu, bốn chuỗi, 512 ký tự mỗi dòng. CSV giữ thứ tự mẫu và giá trị thật của nguồn Serial. Tên trùng thuộc tính đối tượng dùng phép tra thuộc tính riêng.
- Chạy lại và thay board/code/mạch xóa dữ liệu cũ; Dừng giữ mẫu cuối. Không thay trình chạy hoặc Serial Monitor. Nguồn phiên chạy được ghi rõ, đồ thị dùng số thứ tự mẫu.
- Ảnh kiểm đầu phát hiện popup dạng sóng đè lên đồ thị. Review lại tìm thêm ca chạy từ Code rồi vào Quan sát. Bản cuối tính chế độ hiển thị theo panel, tab và đồ thị đang mở. Dạng sóng vẫn có thể xem ở dock khi popup nhường chỗ.
- Giới hạn của bản này gồm bỏ qua dòng lỗi, bỏ dòng cuối chưa kết thúc và giữ bốn chuỗi đầu tiên của lượt chạy. Kiểm thực thi do lead ghi tại `report.md`.
