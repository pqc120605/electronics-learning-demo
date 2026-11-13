# Câu hỏi cho founder · MoBot V2 (06/11/2026)

Bảy câu, xếp theo mức chặn KiCad (1 = chặn nhiều nhất). Tôi không tự chốt câu nào. Mã nguồn như `gate-matrix.md`. Các giá cả ghi `[chưa kiểm chứng]` vì repo không có báo giá.

## Q1. Chặn mọi thứ · Dùng board DevKit nào?

Các doc đang chỉ về bốn board khác nhau: BrijModi CP2102 Micro-USB (KS7:23), HH004223 CP2102 USB-C (BOM2:9), mẫu Type-C CH340 bạn chụp (DB:10-12) và SparkFun WRL-20168 (CS:7, GR:7). Pin map, footprint, interposer USB và cơ khí đều phụ thuộc câu này. Spec r7 (mtime 09:47) có trước cả hai lần bạn chọn board (DB 11:40, CS 14:43).

- **A.** BrijModi CP2102 Micro-USB 30 chân. Ưu: spec r7 và footprint header đã viết (PF:7). Nhược: RD:11 nói bo tham chiếu có lỗi nguồn CP2102, cần đúng revision của bo thật.
- **B.** Mẫu Type-C CH340 của bạn. Ưu: bạn đã có bo. Nhược: chưa biết nhà sản xuất, revision, sơ đồ hay outline (DB:14, DB:27); interposer Micro-USB phải thiết kế lại.
- **C.** SparkFun WRL-20168. Ưu: có sơ đồ và bản vẽ công khai (WR:7) và bạn đã duyệt làm cơ sở cho tay cầm (CS:7). Nhược: footprint khác 30 chân, giá có thể cao hơn `[chưa kiểm chứng]`.

**Khuyến nghị: C cho tay cầm.** Robot giữ A chỉ khi đã đo đúng revision; nếu không, chờ B hoặc đổi sang C.

## Q2. Chặn tay cầm · Tay cầm dùng nguồn nào?

LK37478 thiếu hồ sơ (RD:15), Jauch 250832 đã được duyệt làm cơ sở nhưng chưa có hồ sơ đủ (CS:7, QD:15), và 3×AA là một kiến trúc khác (AA:10).

- **A.** Jauch 250832 Rev. 1.2. Ưu: có datasheet hãng, NTC và cận CV, giữ H3. Nhược: connector XH 3 cực (GR:7) khác PH 2 chân trong spec (KS7:42).
- **B.** LK37478 (B15). Ưu: rẻ, đã vào BOM. Nhược: không có hồ sơ cell/PCM/NTC; không loại trừ cell giả.
- **C.** 3×AA. Ưu: bỏ charger H3, NTC, UVLO TPS3808 và rủi ro Li-ion. Nhược: đổi kiến trúc, cần r8 và khảo sát buck-boost.

**Khuyến nghị: A.**

## Q3. Chặn thiết kế mạch · Phạm vi r8 cho đường VBUS và latch

Delta (DL:126-138) đưa ra bảy thay đổi vật chất ngoài bytes r7: VBUS pass, eFuse nối tiếp, latch SW4, cách ly I/O và USB data, detector, UVLO mới, robot tương ứng. BOM có 50 dòng "Đề xuất" cần box08 duyệt (26 tay cầm, 24 robot).

- **A.** Duyệt đầy đủ r8 cho cả hai board. Ưu: đúng yêu cầu r6 là cách ly phần cứng không phụ thuộc người dùng (R6:25-26). Nhược: khối lượng review và bench lớn.
- **B.** Đơn giản hóa: công tắc cơ RUN/PROGRAM cắt pack khỏi DevKit, bỏ pass U9, U10, U11, TS3USB221 và latch. Ưu: ít linh kiện. Nhược: phụ thuộc người dùng, trái yêu cầu r6.
- **C.** Làm r8 đầy đủ cho tay cầm trước, robot sau khi tay cầm qua bench (khớp CB:9).

**Khuyến nghị: C.**

## Q4. Chặn layout · Bao nhiêu lớp PCB?

Spec giả định 2 lớp 1 oz (KS7:259) nhưng tính nhiệt MCP73833 TJ 83 °C theo bo 4 lớp (KS7:135, R7:7). Bo 2 lớp nóng hơn, chưa có số.

- **A.** 2 lớp cho cả hai. Ưu: rẻ. Nhược: nhiệt MCP73833 và TPS63070 (RB:147) chưa chứng minh.
- **B.** 4 lớp cho cả hai. Ưu: khớp giả định nhiệt, dễ đi nguồn 2,5 A. Nhược: giá cao hơn `[chưa kiểm chứng]`.
- **C.** Tay cầm 4 lớp, robot 2 lớp.

**Khuyến nghị: B** cho mẫu đầu (ít chiếc, rủi ro nhiệt đắt hơn chênh lệch giá).

## Q5. Chặn outline · Giới hạn cơ khí

BOM giới hạn carrier ≤ 100×100 mm (BOM1:55). Chưa có outline, lỗ gá, vị trí USB-C hay khe motor và bánh (BOM1:57). Gá RUN của tay cầm chưa đo (B01C:17).

- **A.** Xác nhận trần 100×100 mm cho cả hai.
- **B.** Giao box03 đề xuất outline sau khi bạn chọn Q1 và Q2.

**Khuyến nghị: B.**

## Q6. Không chặn schematic · Pack robot B04

Chỉ có số nhà bán (R6:11), biên pack 0,238 A (RB:140). Không chặn schematic (KS7:281) nhưng chặn nghiệm thu an toàn.

- **A.** Giữ B04, xin hồ sơ NCC.
- **B.** Đổi sang pack có datasheet.
- **C.** Mẫu đầu chạy bằng nguồn lab giới hạn dòng (BT:10) tới khi có hồ sơ.

**Khuyến nghị: A kèm C.**

## Q7. Không chặn schematic · Cửa sổ nhiệt khi sạc

Robot dừng sạc cứng ở 0 và 45 °C. Đánh đổi: phòng 30–35 °C ở Việt Nam sẽ khiến pack chỉ nạp tới khoảng 8,0 V, thiếu khoảng 10 % dung lượng (TY:100-101). Tay cầm cắt 0,2–4,6 °C và 40,7–48,4 °C (DL:152).

- **A.** Giữ 0–45 °C cho tới khi có datasheet B04. Ưu: an toàn cho sản phẩm học sinh. Nhược: nạp thiếu ở phòng nóng.
- **B.** Dùng mạng TI mặc định (5,24k/30,31k) nếu datasheet B04 cho phép sạc tới 60 °C (TY:101).

**Khuyến nghị: A.**
