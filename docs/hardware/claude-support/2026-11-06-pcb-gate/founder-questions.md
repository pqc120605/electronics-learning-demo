# Câu hỏi cho founder · MoBot V2 (06/11/2026 chiều)

Bảy câu, xếp theo mức chặn lease KiCad (1 = chặn nhiều nhất). Tôi không tự chốt câu nào. Không mở lại hai quyết định đã chốt: UVLO robot falling 6,40–6,60 V (TLV6700 loại) và board là mẫu 30 chân USB-C đã chụp, họ CH340 (CH340C chỉ là ứng viên). Mã nguồn như `gate-matrix.md`. Giá và chi phí `[chưa kiểm chứng]`.

## Q1. Chặn cả hai lease · Mẫu đã chụp có thay luôn WRL-20168 cho tay cầm không?

Ngày 06/11 queue ghi mẫu Type-C CH340 (TJ:2423, 12:24). Sau đó bạn duyệt kiến trúc B01 v1 với SKU Beetrona 02030089 (AV1:7, 12:57) và duyệt WRL-20168 + Jauch (CS:7, 14:43). Chưa doc nào ghi cái nào thay cái nào.

- **A.** Mẫu đã chụp cho cả hai carrier. WRL-20168 và Beetrona chỉ là tham chiếu.
- **B.** Mẫu đã chụp cho robot, WRL-20168 cho tay cầm.
- **C.** WRL-20168 cho cả hai.

**Khuyến nghị: A**, đúng chỉ thị hiện tại; chỉ chuyển sang B nếu không xác định được chip và kích thước mẫu (xem resolutions.md §3-§4).

## Q2. Chặn lease tay cầm · Kiến trúc nguồn tay cầm nào là bản hiện hành?

Ba mô tả cùng tồn tại: kiến trúc v1 (AV1:8): carrier không cấp VIN, cáp RUN OUT, cổng USB-C của DevKit là đường cấp nguồn duy nhất; bản nháp CP:31: pack → boost → eFuse → Q_ISO → VIN cùng hai cổng VBUS độc lập; r6/r7: LM66100 và interposer Micro-USB (KS6:45).

- **A.** Kiến trúc v1 (đã được bạn duyệt 12:57).
- **B.** Bản nháp CP (carrier cấp VIN qua Q_ISO).
- **C.** Hoãn, đo mẫu trước rồi chọn.

**Khuyến nghị: A.** Ít linh kiện mạch cách ly hơn và đã được duyệt. Cần EF xác nhận mẫu có Rd 5,1 kΩ trên cả hai CC (resolutions.md §6).

## Q3. Chặn lease tay cầm · Tay cầm dùng pack và nguồn nào?

Pack LK37478 thiếu hồ sơ (QD:15), Jauch 250832 là ứng viên đã duyệt làm cơ sở (CS:7), 3×AA là hướng ở AA:10. Họ connector cũng khác theo từng hướng (PH 2 chân, XH 3 cực, GH 12 cực).

- **A.** Jauch 250832 Rev. 1.2.
- **B.** LK37478.
- **C.** 3×AA.

**Khuyến nghị: A.** Có datasheet hãng. Chọn C nếu bạn muốn bỏ hẳn rủi ro Li-ion và sạc (đổi kiến trúc, cần cấu hình mới).

## Q4. Chặn mọi lease · `blocking_unknowns` phải rỗng, xử lý thế nào?

Validator yêu cầu rỗng lúc duyệt (VM:42). r7 còn 5 nhóm, gồm phép đo cần PCB (TJ:2624-2632).

- **A.** Đóng hết trước lease. Bench cần PCB nên vòng lặp, kéo dài mốc rất lâu.
- **B.** Tách `verification_items` (đo sau PCB) khỏi `blocking_unknowns`, bạn chấp nhận rủi ro bằng văn bản.
- **C.** Hai giai đoạn: lease chỉ cho schematic, bench trước khi lease layout.

**Khuyến nghị: B**, giữ trần rủi ro bằng Box08 review từng mục verification trước khi vẽ layout.

## Q5. Chặn layout · Số lớp PCB và giới hạn cơ khí

Chưa doc Codex nào chốt stackup. Nhiệt MCP73833 TJ 83 °C của r7 giả định bo 4 lớp (R7:7). BOM giới hạn 100×100 mm (BOM1:55).

- **A.** 2 lớp cho cả hai, nhiệt phải đo.
- **B.** 4 lớp cho cả hai.
- **C.** Tay cầm 4 lớp, robot 2 lớp; outline giao box03 đề xuất sau khi đo mẫu.

**Khuyến nghị: B** cho mẫu đầu (số lượng ít, chi phí chênh lệch nhỏ so với rủi ro nhiệt).

## Q6. Không chặn lease tay cầm, chặn lease robot · Robot có chờ schematic tay cầm không?

Robot phụ thuộc IF-001 và REMOTE-KICAD-001 (TJ:2543). Nền robot (Micro-USB, interposer) chưa khớp mẫu Type-C.

- **A.** Giữ thứ tự: tay cầm xong, robot sau.
- **B.** Cho phép làm kiến trúc robot (giấy) song song, chỉ lease khi schematic tay cầm qua Box08.
- **C.** Bỏ phụ thuộc, hai lease chạy song song (policy cho tối đa 2 writer, PBP:14).

**Khuyến nghị: B.** Giữ giá trị của bài học tay cầm mà không để robot nhàn rỗi.

## Q7. Không chặn lease · Pack robot B04 và cửa sổ NTC

B04 chỉ có số nhà bán (R6:11). Cắt sạc 0–45 °C an toàn hơn nhưng phòng 30–35 °C sẽ chỉ nạp tới khoảng 8,0 V (TY:100-101, claude-support/2026-11-06-pcb-status/final).

- **A.** Giữ B04, xin hồ sơ NCC, cắt sạc 0–45 °C cho tới khi có datasheet.
- **B.** Đổi pack có datasheet cho phép sạc tới 60 °C và dùng mạng TI mặc định.

**Khuyến nghị: A.**
