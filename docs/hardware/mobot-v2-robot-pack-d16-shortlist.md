# MoBot V2 · Shortlist pack robot theo D16(c)

Box 03 đã hoàn tất sàng lọc tài liệu. Q7 vẫn mở. Ngân sách thiết kế đang dùng để sàng lọc là khoảng 1,76 A, mục tiêu không vượt 1,85 A, và sạc 8,4 V CC/CV ở 0,50 A danh nghĩa.

| Pack 2S | Bằng chứng | Điều kiện còn mở |
|---|---|---|
| Ultralife UBBL20-C1 | 2,5 A xả liên tục. Profile khuyến nghị 466 mA đến 8,4 V rồi giữ CV đến 50 mA ở 0–45 °C. Đầu VHR-2N. TDS Rev. J ghi 2,75 Ah; danh mục ghi 2,4 Ah. | Revision/dung lượng hàng giao, dòng xung theo thời lượng, đặc tuyến PTC theo nhiệt, cân bằng, hành vi PCM và cực tính mặt ghép. TDS không nêu NTC đưa ra ngoài. |
| RS PRO 176-9352 | 3 A xả liên tục, 8,4 V sạc, 0–45 °C khi sạc, PCM bảo vệ quá áp/thấp áp từng cell. Dây rời đỏ/đen AWG 24. | Dòng xung, ngắt quá dòng/phục hồi, cân bằng, NTC, điều kiện kết thúc sạc và đầu ghép có định hướng. |
| B04 7V2AH-4A-2S1P | Dữ liệu nhà bán đủ sàng lọc ban đầu. | Chờ hồ sơ đúng revision theo nhánh Founder của D16(c). |

Ưu tiên rà Ultralife trước vì tài liệu công bố profile sạc chi tiết hơn. Cả hai ứng viên qua sàng lọc dòng liên tục. Ngưỡng bảo vệ PCM không dùng làm định mức dòng xung. Chưa có bằng chứng đủ để chốt thay B04. Mọi thay đổi pack cần Founder chọn và review cấu hình robot tương ứng.

Nguồn: [Ultralife TDS Rev. J](https://ultralifecorporation.com/?p=475) · [Danh mục Ultralife](https://ultralifecorporation.com/battery-energy/standard-cell-technologies/soft-packs-li-ion/) · [RS PRO datasheet](https://docs.rs-online.com/9486/0900766b816e8204.pdf) · [D16(c)](mobot-v2-founder-decision-d15-d16.md).
