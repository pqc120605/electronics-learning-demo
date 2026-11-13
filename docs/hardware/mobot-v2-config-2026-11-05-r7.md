# MoBot V2 · Cấu hình r7 chờ duyệt

05/11/2026 · `MOBOT-V2-CONFIG-r7`. Kế thừa toàn bộ [r6](mobot-v2-config-2026-11-05-r6.md), SHA-256 `54657f1518a435701b8b3dde21e40c9dd7ca624aff64cfcb0487d7512fe7d104`. Ba mục dưới đây là toàn bộ phần thay đổi. Các yêu cầu nguồn, USB, giới hạn thiết kế và phạm vi KiCad khác của r6 tiếp tục áp dụng.

| Quyết định | Thay đổi và hệ quả đã chấp nhận |
|---|---|
| **H3 · Sạc tay cầm** | Đổi từ 0,25 A sang **0,40 A danh nghĩa**, dùng **MCP73833-FCI/MF** (DFN-10) và **RPROG 2,49 kΩ ±1%**. Gói ước tính 0,361–0,442 A theo ±10% của IC trước dung sai điện trở, khoảng 5 giờ CC danh nghĩa cho 2 Ah thay vì 8 giờ. Ước tính tổn hao 1,05 W và TJ 83 °C ở môi trường 40 °C theo mô hình nhiệt bo chuẩn 4 lớp trong datasheet, cần kiểm trên mẫu. Timer, pha CV, giảm dòng do nhiệt và lượng điện nạp lại của đúng pack vẫn cần xác minh. |
| **R1 · Giới hạn motor** | Mỗi kênh DRV8833 dùng **RISEN 0,62 Ω ±1%, 0,25 W**. Ngưỡng trip tĩnh theo bảng hãng và dung sai điện trở khoảng **0,256–0,391 A**, danh nghĩa 0,323 A. Mục tiêu danh nghĩa đổi từ 0,40 A xuống khoảng 0,32 A, trần đỉnh **0,45 A/kênh** giữ nguyên. Có thể giảm mô-men khởi động nếu chopping sớm. Mốc **L ≥ 0,39 mH** của gói là điều kiện sàng lọc theo mô hình blanking đã ghi, chờ BT-R1a và review quá độ. Nếu L thấp hơn mốc phải xem lại. |
| **R5 · Sạc robot** | Chỉ cho phép sạc khi **TUSB320LAI báo nguồn 1,5 A hoặc 3 A**, đặt **RILIM 1,24 kΩ** và giữ mục tiêu ICHG **0,50 A**. Gói tham chiếu 839–980 mA ở điều kiện bảng IINDPM 0,9 A của BQ25886. Nguồn Default không sạc robot và LED báo nguồn yếu. Củ sạc cổng A với cáp A–C và cổng USB máy tính chỉ báo Default không dùng để sạc robot. |

Nguồn quyết định: [Founder H3/R1/R5](claude-support/2026-11-05-mobot-r6/founder-decisions.md). H4 và R6 chờ box 08 tái review. H1/R3 chờ dữ liệu nhà cung cấp. H2/R2/R4 chờ đo. Các mục [TBD] và [THIẾU] trong gói vẫn mở. Thứ tự triển khai là tay cầm trước, robot sau. Phê duyệt đúng hash r7 và các điều kiện kỹ thuật là hai bước riêng.
