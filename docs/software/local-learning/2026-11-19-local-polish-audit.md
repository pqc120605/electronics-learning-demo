# Hoàn thiện local và kiểm tra độc lập · 19/11/2026

Phạm vi lấy từ [kế hoạch và kết quả 19/11](2026-11-17-web-update-roadmap.md) và [ca tester đã có](2026-11-18-tester-feedback-report.md). Hành trình cần đạt từ trang chủ đến phép thử đầu, quay lại đúng hoạt động và mở tiếp dự án. Người tự lắp cần khôi phục được đường đi dây và thao tác nối sai.

| Task | Tiêu chí kiểm |
| --- | --- |
| MM-SW-LOCAL-FIRST-EXPERIMENT-001 | Nút chính đưa khách mới đến mạch kín, khách cũ về đúng hoạt động. Bắt đầu và giải thích được kết quả trên 375/1440. Tiến độ đạt tiêu chí có đường đi đến bước kế tiếp. |
| MM-SW-LOCAL-PORTFOLIO-001 | Lưu hồ sơ mini-project theo tên, mở và sao chép từ thư viện Dự án. Giữ khóa hồ sơ cũ, kiểm xung đột, khôi phục và lưu trữ đầy. |
| MM-SW-LOCAL-WIRE-RECOVERY-001 | Dây bàn tự do giữ đường đi sau đổi view, reload và xuất/import. Hoàn tác thao tác dây gần nhất, giữ topology và code độc lập. Dữ liệu nháp trước thay đổi vẫn mở. |
| MM-SW-LOCAL-ANALOG-PRACTICE-001 | Với preset bộ chia áp, ghi dự đoán trước khi chạy rồi đối chiếu với `V(OUT)` từ ngspice. Hiện chênh lệch và ý nghĩa hai điện trở bằng nhau, xóa kết quả khi đổi ví dụ hoặc netlist. |
| Audit sau triển khai | Tester vào bản build bằng trình duyệt, ghi route, thao tác, kết quả, ảnh 375/1440 và cách tái hiện. Bao phủ các nhóm tính năng và nêu phạm vi model, backend, thiết bị và thao tác chưa kiểm. |

Kết quả triển khai, lượt kiểm độc lập và các điểm còn tồn tại nằm trong [báo cáo kiểm thử bản local](../../reviews/2026-11-19-local-audit/report.md) và [ma trận ảnh theo màn hình](../../reviews/2026-11-19-local-audit/coverage.md).

## Các giới hạn cần xử lý riêng

- Blue Pill là nhóm board nhiều biến thể. NUCLEO-F401RE có Altium và manual của ST cho MB1136 C04, còn model trên web là hình dựng tham chiếu. Cần đối chiếu pad/hình học theo cùng revision và điều khoản cho asset phái sinh trước khi mở vị trí dây 3D. [Hồ sơ nguồn model](../../board-model-sourcing.md)
- Runtime ESP32 hiện chạy trình thông dịch Arduino rút gọn. Mô phỏng firmware/ngoại vi cần một bài và board có fixture riêng. Bài SPICE ở lượt này xác minh điện áp bộ chia DC từ solver, còn I²C là phạm vi khác. [Danh sách board và giới hạn runtime](../../../src/lib/freestyle/freestyleCircuit.ts)
- Có [phiếu thử với người mới](2026-11-18-roadmap-local-finish.md#phiếu-quan-sát-thử-với-người-mới). Tester trình duyệt ghi lỗi thao tác; tỷ lệ hoàn thành và quay lại cần người học tự nguyện.
- Đồng bộ, cộng đồng online, lớp học online và analytics được để sau các hạng mục local, theo quyết định ngày 19/11. Nghiệm thu online nằm ở môi trường Mini PC.
