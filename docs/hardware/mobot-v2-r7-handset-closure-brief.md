# MoBot r7 · Chốt đầu vào tay cầm

Box 03 ưu tiên khóa tải mặc định OFF bằng phần cứng, ngắt nguồn chặn hai chiều khi OFF và cách ly tín hiệu theo miền nguồn. Box 08 trả changes_requested trên packet SHA-256 bf4ecd7e2560d4ea01197eb72937292135d96324ceec1a5bde50be1008717a70. Hai kết quả thống nhất hướng xử lý nhưng chưa chứng minh mạch đạt.

Box 02 chịu trách nhiệm đưa ra một phương án cấp khối có linh kiện ứng viên và kiểm góc xấu nhất. Tính cutoff theo ngưỡng falling, biên phục hồi và fail-off khi mất bias. Đối chiếu bốn trạng thái USB và chuyển tiếp, raw VBUS trước D1, ngắt hai chiều và đường joystick/pull-up khi rail tắt. Giữ MCP73833-FCI/MF 0,40 A theo r7, phân biệt timer và termination, xét NTC và pack vắng. Ghi các điều kiện cần cho QA, không tự điền TBD.

Box 03 xác định hồ sơ B15 có thể truy xuất và phương án thay thế nếu thiếu. Liệt kê hồ sơ cell/PCM, xung theo thời lượng, NTC, sạc theo nhiệt, kích thước và giới hạn cơ khí. Đổi pack cần bản đề xuất riêng. Chưa mở KiCad hoặc bench.

Box 08 tái review phương án cụ thể sau khi nhận hai đầu vào. HQ ghi nhận phê duyệt đúng hash trước khi cấp lease. Robot giữ sau tay cầm và còn cần B04, bằng chứng R1/R2/R4 và logic R5.
