# P0-15 — cụm khóa hai đầu cầu và phương án nguồn AA

11/11/2026. Box 08 chấp nhận snapshot nghiên cứu cụm khóa M5 gồm 29 tệp. B1 còn thiếu thiết kế tích hợp để review và cấu hình AA đủ căn cứ cho Founder duyệt đúng hash.

## Cách ly khi nạp firmware

Thứ tự đề xuất là bỏ quyền RUN, tháo cassette với toàn bộ đường pin và sense, tách hai đầu cầu, giữ cầu ở vị trí tách rồi mới cắm USB. Khi quay về RUN, rút USB, hoàn tất chu trình đóng cửa và khóa, nối lại cầu, lắp cassette cuối và yêu cầu thao tác cấp quyền mới. Tụ carrier có thể còn điện sau khi tháo pin. Khoảng hở vật lý trên mọi đường nối mới là điều kiện cho phép cắm USB. Nhánh bảo vệ cell trong RUN vẫn phải đáp ứng cận ngắt riêng.

- Hai cặp connector Samtec `SFM-125-T2-S-D-A` / `TFM-125-02-S-D-A` là ứng viên cho hai điểm tách. Mỗi điểm dự trù tối đa 46 đường và còn 4 contact trên 50, với điều kiện 21 đường header và 25 đường USB-C/shell là toàn bộ các đường qua cầu. Các đường ngoài danh sách phải thực sự không nối. Danh sách dây chính xác còn phụ thuộc kết nối RUN và board B01. [Cận số đường](interface-capacity-proposal.json)
- Hành trình tối thiểu 16,0 mm cho khoảng cách tính toán 2,3418 mm khi toàn bộ phần dẫn nằm trong envelope 40×25 mm, pivot ở giữa, độ nghiêng tương đối tối đa 5° và các khoản dung sai đã nêu được đáp ứng. Cận cũ 11,8 mm không đủ để chứng minh mức sàng lọc 2 mm bằng cách tính này. Bản vẽ connector cho chiều cao linh kiện. Khoản hở sau lắp, hành trình thực và envelope toàn cụm vẫn là đầu vào cần xác minh. [Cận connector](connector-bounds.json) · [Kết quả tính](connector-bounds-results.json)
- Cụm CAD có hai cửa gắn thanh khóa liền thân và hai đầu cầu có lỗ khóa. Trong chín đường cắm reference, bảy ca thiếu điều kiện park bị chặn. Hai đối chứng có đủ điều kiện hoặc bỏ vật cản đều tới vùng có khả năng tiếp xúc. Tám khoảng hạ và 16 phép kiểm giao khối cho thấy thanh còn trong lỗ chặn hạ đầu cầu ở xấp xỉ 16,0 mm. Kết quả áp dụng cho các dẫn hướng lý tưởng và tư thế đã mô hình. [Mô hình và phạm vi](SEQUENCER-REFINEMENT-PLAN.md) · [Ảnh CAD](endpoint-parked.png)
- Box 08 tái lập cận gap, số đường và các ca hình học trên snapshot SHA-256 `e4ab071fc50f7de82dbad0567c019f055b7074ac3b7b0e50958e4000964441a9`. Finding P2 phát hiện bộ tính cũ có thể nhảy qua một khoảng cấm hữu hạn. Bản tính bổ sung giữ chuyển động trong miền liên thông của vật cản đứng yên, bác phản ví dụ và tái lập chín đường trên 1.375 đoạn chuyển động tuyến tính. Bản bổ sung do lead kiểm và được lưu riêng khỏi snapshot đã review. [Box 08](BOX08-ENDPOINT-REVIEW.md) · [Kiểm bổ sung](guarded-carriage-results.json)

Phần cơ cần tích hợp tiếp là khung dẫn hướng và cơ cấu buộc đúng thứ tự tháo cassette, giữ cầu, thu V và hoàn tất chu trình đóng cửa. Cảnh CAD hiện cao khoảng 40 mm và chỉ thể hiện cụm khóa. Cần kiểm độ vừa với toàn tay cầm, đường cắm lệch hoặc đi vòng, chi tiết kim loại bị kéo khỏi connector và lỗi chung của khung. Kiểm độ bền và tuổi thọ thuộc bước có bằng chứng riêng. Bản ghi chu kỳ Samtec 1170762 Rev. 1 áp dụng cho nhóm mẫu của đúng cặp mã, không xác lập tuổi thọ tay cầm. [Bản vẽ TFM Rev GB](https://suddendocs.samtec.com/prints/tfm-1xx-xx-xxx-d-xxx-x-xx-mkt.pdf) · [Báo cáo chu kỳ Samtec](https://suddendocs.samtec.com/testreports/1170762_report_rev_1_elp.pdf)

## Bảo vệ pin khi RUN

Giữ 3 AA NiMH, sạc ngoài và các vai trò G-B16 đã chốt. Box 02 loại INA152 với chuỗi bias/cutoff cũ ở mức thiết kế. Hai kênh UV độc lập có thể giảm nguy cơ lỗi một đường sense làm phép đo sai, nhưng phương án 24 PhotoMOS dùng 30 linh kiện chính và dự trù 120–720 mA cho các nhánh LED theo dòng kích đã giả định. Cấu hình đó còn thiếu cận điện và gây áp lực lên chi phí, thể tích và thời lượng pin. [Phương án hai kênh](BOX02-DUAL-CHANNEL-ALTERNATIVE.md) · [Ngân sách có điều kiện](dual-channel-comparison.json)

Box 02 xác định ADG4612 không phù hợp để thay trực tiếp ở rail 5 V hiện xét vì tap 5,4 V có thể vượt rail 4,75 V. Lead tìm được ứng viên **TMUX2821DSGR**. TI ghi dải tín hiệu ±5,5 V và mô tả high-impedance khi VDD bằng 0. Một kênh UV với sáu dây sense và hai điểm ngắt cần sáu IC hai kênh. Hai kênh UV độc lập với 12 dây sense cần 12 IC, tức 14 đường cassette nếu tính cả hai đường nguồn. Với 140 µA MAX/IC ở điều kiện nguồn và logic của bảng, tổng dòng nguồn IC là 0,84 mA hoặc 1,68 mA. Đây là ngân sách cho các IC sense, chưa gồm phần cấp nguồn, comparator, latch hay tải. [Audit Box 02](BOX02-CMOS-ALTERNATIVE.md) · [TI SCDS488, tr. 5–7 và 20](https://www.ti.com/lit/ds/symlink/tmux2821.pdf)

Các giới hạn cần giữ khi dùng số của TI:

| Mục | Điều kiện bảng và phần còn thiếu |
|---|---|
| Powered-off | MAX ±0,1 µA tới 85 °C và ±2 µA tới 125 °C, thử với cặp điện áp +5 V/0 V và VDD=0. Cần cận dòng rò ở tap âm, 5,4 V và trong vùng rail sụp. |
| ON/OFF | Các số dòng rò trong bảng dùng VDD=3,3 V và điều kiện điện áp riêng. Cần xác định rail monitor thực, đường GND khi từng domain mất nguồn và giới hạn dòng qua clamp. |
| Thời gian | tOFF từ lệnh điều khiển ≤220 µs với VDD 2,5–5,5 V, VS=3,3 V, tải thử 50 Ω/35 pF. Thời gian từ cell yếu đến ngắt tải còn gồm phát hiện, latch và khối ngắt nguồn. |
| Nhánh nguồn chính | Dòng liên tục tối đa theo package giảm từ 1,1 A ở 25 °C còn 0,87 A ở 85 °C và 0,27 A ở 125 °C tại điều kiện bảng. Ứng viên này đang xét cho sense. |

Mạng chia áp bias 1/2 có cận trip tính theo 256 corner là 1,07133–1,12873 V. Khi đặt công tắc gần tap và phân bổ bốn đóng góp rò tối đa 1 µA mỗi arm trong đoạn trở kháng không quá 1 001 Ω, sai số thêm tại mỗi đầu vào khoảng 2,004 mV. Cửa sổ có điều kiện thành **1,06332–1,13675 V/cell**. Điều kiện còn phải chứng minh gồm lỗi comparator 10 mV tại node, reference ±2 mV, arm tổng ±0,1%, dòng rò theo cả miền ứng dụng và trở kháng thực của cell. Cửa sổ 1,05–1,15 V vẫn là mục tiêu nghiên cứu. [Phép tính và giả thiết](direct-frontend-results.json) · [Datasheet comparator](https://www.ti.com/lit/ds/symlink/tlv3502.pdf)

Phần điện cần chốt tiếp là hai miền ngắt thực sự độc lập hoặc cơ chế kiểm sai tap tương đương, reference độc lập, default khi mất nguồn, giới hạn thời gian hoặc điện lượng rút sau trip và khả năng giữ OFF cho tới thao tác cấp quyền mới. Kiểm hở dây bằng trở kháng và ép comparator đổi trạng thái có thể bỏ sót một dây nối nhầm sang tap khác. Cận dòng toàn tay cầm, chi phí dưới ngân sách bộ và số đường cassette cuối cùng còn mở.

## Trạng thái triển khai

P0-15 tiếp tục ở `in_progress`. Bằng chứng của lượt này gồm phép tính, mô hình hình học tham chiếu và review đúng snapshot. Phép đo vật lý `NOT_RUN`. Cấu hình r12 vẫn là hồ sơ đang chờ xử lý các cổng của hướng cũ. Để vào B1 theo hướng AA, cần hoàn chỉnh cơ cấu và mạch nguồn, review cấu hình áp dụng, Founder duyệt đúng hash rồi chạy preflight cho lease schematic. Quyền CAD reference của nghiên cứu M5 đã có và được dùng cho mô hình trên.
