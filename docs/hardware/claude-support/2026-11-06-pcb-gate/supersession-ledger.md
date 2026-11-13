# Supersession ledger · tay cầm (06/11b)

Chưa có Qn nào được trả lời, nên cột "Bị thay bởi" chỉ ghi nhánh **có thể** xảy ra theo phương án khuyến nghị, và cột "Còn hiệu lực?" là **CHƯA XÁC ĐỊNH**. Thứ tự thời gian lấy từ mtime tệp (06/11): CP 12:18, AV1 12:57, CS 14:43, GR 14:57, AA 15:19. Thời gian không đủ để kết luận doc nào thay doc nào. Mã nguồn như `gate-matrix.md`.

| Doc/mục cũ | Bị thay bởi | Theo Qn | Còn hiệu lực? |
|---|---|---|---|
| r6/r7: LM66100 cấp VIN + interposer Micro-USB (KS6:45; R6:20-26) | Kiến trúc v1: carrier không cấp VIN, cáp RUN OUT (AV1:7-9) | Q2-A | **Chưa xác định.** Interposer Micro-USB giả định board Micro-USB, đã trái với mẫu Type-C (TJ:2423) |
| Bản nháp CP: pack → boost → eFuse → Q_ISO → VIN, hai cổng VBUS (CP:31) | Kiến trúc v1 (AV1) | Q2-A | **Chưa xác định.** CP:68-89 (bằng chứng cần thu thập từ mẫu) vẫn dùng được dù chọn nhánh nào |
| Kiến trúc v1 với cáp RUN OUT và TPS25810 ứng viên (AV1:7-9; user "duyệt" 12:57) | Không có doc nào thay rõ ràng. WRL-20168 (CS) và 3×AA (AA) có thể thay phần B01 và pack nhưng không nói thay AV1 | Q1, Q2 | **Chưa xác định.** Phần B01 SKU 02030089 của AV1 xung đột với Q1 |
| B01 = Beetrona 02030089 (AV1:7), EP000723 (EV:30), HH004223 (BOM2:9) | Mẫu đã chụp (TJ:2423; D0-2) | Q1-A | **Một phần.** D0-2 đã chốt mẫu đã chụp; SKU nào khớp mẫu vẫn chưa biết |
| B01 = WRL-20168 cho tay cầm (CS:7, mtime 14:43) | Mẫu đã chụp | Q1-A | **Chưa xác định** (Q1 mở). Nếu Q1-A thì CS/WR/GR hết hiệu lực cho B01 |
| Pack LK37478/B15 (r6, RD:15) | Jauch 250832 (CS:7) | Q3-A | **Chưa xác định.** Hồ sơ B15 vẫn thiếu (B01C:19) |
| Pack 3×AA (AA:10) | Jauch 250832, hoặc giữ nếu Q3-C | Q3-A / Q3-C | **Chưa xác định.** AA mới nhất theo mtime (15:19) nhưng không có "duyệt" ghi lại |
| Connector JST PH 2 chân (KS7:42, theo listing B15) | JST XH 3 cực 2,50 mm (GR:7) nếu Jauch | Q3-A | **Chưa xác định** |
| Connector JST XH 3 cực 2,50 mm (GR:7) | PH nếu giữ LK37478; GH nếu bó dây tín hiệu | Q3 | **Chưa xác định** |
| Connector JST GH 12 cực, 11 dây (B01C:7) cho bó tín hiệu | Không có | Q2 | **Còn hiệu lực theo doc, nhưng AV1:7 chỉ nói "bó dây tín hiệu ngắn có khóa"**, chưa chốt họ |
| r7 `.md`, `proposed` (TJ:2619-2623) | JSON mới trong `mission-control/` | Q4 | **Không đủ cho lease** theo TJ:2330-2331 dù Q4 trả lời thế nào |

Khi founder trả lời Q1–Q3, cập nhật cột "Còn hiệu lực?" theo nhánh đã chọn.
