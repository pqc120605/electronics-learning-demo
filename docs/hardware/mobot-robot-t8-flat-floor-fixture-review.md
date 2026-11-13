# MoBot V2 robot · Hồ sơ fixture T8 trên sàn phẳng

Tổng hợp Box 02 `01a1b0e6-99eb-7e03-8bbd-6d3adebce94b` và Box 03 `01a1b0e6-b0db-70c0-ab60-b9022f6260ba`. [Quyết định phạm vi](mobot-robot-vm-relay-r05-disposition.md). T8 và bench `NOT_RUN`.

**Cụm ứng viên:** hai Pololu #992, bốn bánh #1090 Ø42 mm danh nghĩa, truyền ngoài 1:1 mỗi bên. Chưa có bằng chứng cụm hoàn chỉnh, fixture hoặc carrier đã lắp. Trước khi lấy cận, ghi mã/ảnh cụm, đường kính lăn, tải và khối lượng vận hành.

**Bao sử dụng:** sàn phẳng, giữ ca đẩy tình cờ. Chốt loại sàn/độ bám, tải tối đa, lệnh/tốc độ tối đa và bao lực, tốc độ, chiều, thời lượng đẩy. Chưa gán số. Đo tốc độ xe và bánh riêng để phát hiện trượt. Ca ưu tiên là đẩy dọc khi driver đã disable, đầu tì mềm tại vị trí cố định có đo lực và tốc độ. Ca đẩy trùng lúc ngắt cần ghi riêng nếu nằm trong bao.

| Phần đo | Trả dữ liệu |
|---|---|
| Quá độ đồng bộ | Pre-trigger theo cạnh nSLEEP, cùng EN, VIN/VOUT converter, VM tại driver, dòng từng motor có dấu, dòng tại ranh giới cầu H → VM, dòng LM73100, shunt và kẹp dự phòng. Lấy đỉnh/dốc/độ rộng xung, tích phân năng lượng hồi cả hai motor và điện tích lọt về converter. Ca OUT có áp trước, IN tụt chậm/đột ngột, pin đầy và đường hồi pack bị chặn. |
| Rò dài hạn | Dải đo riêng khi LM73100 đã chặn, định lượng tải đầu đo. Ghi rail nổi và có đường xả, mức nâng áp theo thời gian và cận rò theo trạng thái nguồn. |
| Bảo vệ fixture | Kẹp dự phòng độc lập chịu xung đầu ngay cả khi shunt hở hoặc mất mọi bias. Ngưỡng dừng từng rail cộng tăng áp trong trễ, overshoot và sai số phải nằm trong cận áp dụng. Có ngắt kích/ngoại lực và stop khi vượt dòng/nhiệt hoặc mất kênh đo. Gắn cờ nếu kẹp dự phòng dẫn; trace đó không chứng minh shunt chính đủ. |

**Box 08 cần rà trước khi thử:** dữ liệu nào khóa được từ tài liệu, cận sử dụng cần HQ quyết định, điều kiện đưa fixture lên năng lượng và phần không được chạy khi chưa định mức kẹp. Tách phép đo đầu vào T8 khỏi bench carrier hoàn chỉnh. Chưa cấp quyền bench/KiCad.

## Kết luận Box 08 và bàn giao cụm thử

Box 08 pass phạm vi và phương pháp đo trên snapshot `AA8329D02389C17E6A3BF2955796268AC47333E7D70DF32445CBC468F8297108`. Fixture chưa đủ điều kiện cấp năng lượng. Phần bổ sung này lưu kết luận cho hash gốc.

1. Người có mẫu xác nhận mã, ảnh, tỷ số truyền ngoài, đường kính lăn, khối lượng và tải của cụm đã lắp. HQ khóa sàn, tốc độ tự chạy và bao đẩy tình cờ từ yêu cầu vận hành. Có thể xét bao thử năng lượng thấp riêng cho lượt đầu.
2. Trước khi cấp năng lượng, phải có sơ đồ fixture thực, giới hạn điện áp/dòng/năng lượng nguồn và lực/tốc độ/thời lượng kích cơ, mã và định mức kẹp chịu xung đầu, điện dung hữu hiệu từng phía, ngưỡng dừng qua sai số và trễ, cùng kiểm nối probe không tạo đường hồi. Ca VOUT bị đẩy áp khi converter mất VIN vẫn chờ nếu chưa có cận áp dụng.
3. Chỉ lấy trace T8 khi các điều kiện trên đạt và có phép thao tác. T8 và bench carrier hoàn chỉnh vẫn NOT_RUN.
