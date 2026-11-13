# MoBot robot · Phân xử RELAY R-20261106-05

Nguồn tư vấn: [phản hồi RELAY](../claude-support/logs/2026-11-06-1933.md). Đối chiếu Box 02 lượt `01a1b0d7-8050-77b0-b6f4-9d82ba744a45` và Box 03 lượt `01a1b0d7-6df0-7ff2-8cbf-3aa72a0372a1`. T8 và bench chưa chạy.

| Mục | Kết luận HQ |
|---|---|
| A/B/C | Chấp nhận tách xung cuộn dây, hồi do quay và ngoại lực. Không dùng back-EMF ở tốc độ danh nghĩa làm cận cho toàn sự kiện. Không dùng ngưỡng trip tĩnh làm cận dòng lúc ngắt. |
| Cận năng lượng | Chấp nhận thiếu đầu vào. Ứng viên cụm thử: 2×Pololu #992, 4×#1090 42 mm, tỷ số truyền ngoài 1:1 mỗi bên; #1090 chỉ làm ứng viên thử, chưa khóa BOM. Cần bao khối lượng, tốc độ, mặt sàn và ngoại lực. |
| Phép đo đại diện | Ưu tiên tích phân công suất đồng bộ trên đúng cụm, tách năng lượng phía motor khỏi điện tích lọt qua LM73100. ΔE của tụ chuẩn chỉ đối chiếu phần tích trong tụ. Tụ khác làm đổi điện áp và dòng hồi, nên không coi hai lượt là cùng tải hay dùng số tụ lớn làm cận tự động cho tụ nhỏ. QA cần duyệt giới hạn và bảo vệ fixture trước khi thử. |
| Rail converter nổi | Chấp nhận rủi ro nâng áp do rò, chưa chấp nhận suy ra trần chung của cả hai rail. Nếu có đường xả được chứng minh, kiểm riêng đỉnh quá độ và mức cân bằng phía converter. 4,8 µA là điển hình. 9 V dải điều áp và 12 V abs max không xác lập giới hạn VOUT bị đẩy áp khi tắt. |
| Tối thiểu trước KiCad | Dùng cận đúng cụm và đúng bao sử dụng. Không bắt buộc đo riêng toàn bộ 12 đại lượng nếu trace trực tiếp đã đủ cận. Cần định mức phần tử, ngưỡng, nhiệt và xét lỗi shunt hở. Kiểm tích hợp sau để xác nhận trên carrier hoàn chỉnh. |

## Quyết định phạm vi và handoff

Người dùng xác nhận robot V1 chỉ chạy trên sàn phẳng. Bỏ chạy dốc khỏi phạm vi vận hành V1, giữ kiểm ngoại lực tình cờ trên sàn phẳng. Khối lượng, tốc độ, lực và thời lượng thử còn cần cận có căn cứ.

Box 08 pass phương pháp trên snapshot SHA-256 `16479AE908C6922EB269D7BFF1B8E86C5FC0CF75258C8B3285EBD876BDA566BF`. Fixture cần kẹp dự phòng độc lập chịu xung đầu, ngưỡng dừng và cờ khi kẹp dự phòng dẫn. Tách trace quá độ điện tích lọt khỏi phép đo rò kéo dài trên rail nổi. Tích phân trực tiếp là phép chính, tụ chuẩn chỉ đối chiếu. T8 và bench chưa chạy.
