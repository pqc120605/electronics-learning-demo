# MoBot V2 r6 · Kế hoạch bench test

05/11/2026. Người thực hiện: **bench operator là con người** (founder hoặc kỹ thuật viên được founder chỉ định). Agent không thực hiện, không flash thiết bị, không mua hàng. Mỗi lần đo ghi theo `docs/agents/templates/test-report.md`: ngày, mẫu, revision PCB, firmware, thiết bị đo, nhiệt độ phòng, kết quả số.

Phép đo này chạy **sau khi có PCB mẫu**. Riêng BT-R1a (đo L motor) chạy được ngay vì chỉ cần motor.

## Quy tắc an toàn chung

- Làm việc trên bề mặt chống cháy, có khay kim loại hoặc túi chống cháy pin Li-ion trong tầm tay. Không để pin sạc không người trông.
- Khi chưa cần pin, dùng nguồn DC phòng thí nghiệm có giới hạn dòng thay pack.
- Không đo khi pack phồng, nóng bất thường, có mùi hoặc vỏ hở. Cách ly pack đó ngay.
- Không đoản mạch pack để "thử bảo vệ". Thử OC chỉ bằng tải điện tử có giới hạn.
- Đeo kính bảo hộ khi thử kẹt motor và phanh.
- Học sinh không tham gia các phép đo này.

## Thiết bị chung

| Thiết bị | Yêu cầu tối thiểu |
|---|---|
| Nguồn DC lab | 0–12 V, 0–3 A, giới hạn dòng chỉnh được |
| Tải điện tử DC | ≥ 3 A, chế độ CC và xung |
| Oscilloscope | ≥ 2 kênh, ≥ 50 MHz, có single-shot trigger |
| Probe dòng hoặc điện trở shunt | Probe dòng DC ≥ 1 MHz, hoặc shunt 0,1 Ω 1 % + đo vi sai |
| Đồng hồ vạn năng | Có thang µA |
| Đồng hồ LCR | Đo L ở 1 kHz |
| Nhiệt kế | Cặp nhiệt loại K hoặc camera nhiệt |
| Buồng hoặc hộp nhiệt | Giữ 40 °C ± 2 °C |
| Nguồn USB | 1 cục sạc USB-C PD (có 1,5 A/3 A), 1 cục sạc cổng A + cáp A–C, 1 cổng USB máy tính |

---

## BT-H2 · Xung Wi‑Fi và sụt áp tay cầm (H2)

**Setup:** tay cầm hoàn chỉnh, DevKit, pack B15. Shunt 0,1 Ω nối tiếp pack. Kênh 1 đo VPACK tại đầu pack, kênh 2 đo áp shunt, kênh 3 (nếu có) đo V5_DEV.

**Bước:**
1. Sạc đầy pack, nghỉ 30 phút. Đo V hở.
2. Nạp firmware thử: bật Wi‑Fi, phát liên tục 802.11b ở công suất tối đa, kèm đọc joystick.
3. Ghi dòng pack đỉnh, trung bình, sụt VPACK, V5_DEV min trong 60 s.
4. Xả pack bằng tải điện tử tới V hở 3,40 V, nghỉ 10 phút, lặp bước 3.
5. Lặp bước 3–4 ở 40 °C.
6. Tính `R_đường = ΔV / ΔI` từ cạnh xung.

**Pass:**
- V5_DEV ≥ 4,75 V suốt thời gian đo ở mọi điều kiện.
- VPACK dưới tải ≥ 3,25 V khi V hở = 3,40 V (không chạm UVLO carrier do xung).
- Dòng pack đỉnh ≤ 2 A (1C nhà bán).
- Không reset ESP32 (log brownout = 0).

**Fail:** bất kỳ điều kiện nào trên. Ghi R_đường để box02 cập nhật H2.

**An toàn:** không xả pack dưới 3,0 V.

## BT-H3 · Sạc 1S (H3)

**Setup:** tay cầm, pack B15 xả tới cutoff 3,20 V dưới tải. NTC gắn pack. Shunt nối tiếp VBUS và nối tiếp pack. Đo nhiệt vỏ U1 và nhiệt pack.

**Bước:**
1. Cắm cục sạc cổng A + cáp A–C. Ghi dòng VBUS, dòng sạc, áp pack mỗi 5 phút tới khi STAT báo xong hoặc timer hết.
2. Ghi tổng mAh nạp vào, thời gian, nhiệt U1 max, nhiệt pack max.
3. Lặp ở 40 °C.
4. Rút NTC (hở) khi đang sạc; sau đó nối tắt NTC.
5. Cắm USB-C khi pack vắng.

**Pass:**
- Dòng VBUS ≤ 0,50 A ở mọi thời điểm.
- Áp pack cuối ≤ 4,232 V (VREG max).
- Nhiệt pack ≤ 45 °C [TBD: H1, thay bằng giới hạn hãng cell].
- TJ ước tính U1 (từ nhiệt vỏ) không chạm điều tiết nhiệt quá 20 % thời gian [TBD: H3, box02 chốt tiêu chí].
- Bước 4: sạc dừng trong ≤ 1 s cả hai trường hợp.
- Bước 5: không có điện áp trên VPACK lớn hơn 4,232 V.
- Ghi mAh nạp so với 2.000 mAh; nếu timer dừng trước khi đầy, báo founder (H3).

**An toàn:** theo dõi pack liên tục; dừng ngay nếu pack > 50 °C.

## BT-H4 / BT-R6 · Cách ly nguồn và I/O, 4 trạng thái USB (H4, R6)

Chạy cho cả tay cầm và robot.

**Setup:** đồng hồ µA nối tiếp lần lượt các đường: V5_DEV, VBUS_PROG, VBUS_C, VPACK. Oscilloscope trên LOAD_EN/LOGIC_EN, MOTOR_EN (robot), V5_DEV.

**Bước:**
1. Lặp ma trận: từ 00 cắm Micro trước rồi C; cắm C trước rồi Micro; từ 11 rút Micro trước rồi C; rút C trước rồi Micro.
2. Lặp với: pack đầy, pack ở cutoff, pack vắng, pack có protector mở (mô phỏng bằng ngắt dây pack).
3. Lặp khi nhấn reset DevKit trong mỗi trạng thái.
4. Ở trạng thái 10 (chỉ Micro-USB), nạp firmware thành công 3 lần liên tiếp.
5. Ở trạng thái 10, đo áp trên V5_R / V5_BST, VM_6V và từng chân I/O phía ngoại vi.

**Pass:**
- LOAD_EN (và MOTOR_EN) thấp trong mọi trạng thái có USB, không có xung cao > 0,4 V dài hơn 1 µs [TBD: H4, box08 chốt độ rộng xung cho phép].
- Dòng ngược vào miền đã tắt ≤ 10 µA mỗi đường [TBD: H4/R6, box08 duyệt ngưỡng].
- Áp trên rail carrier đã tắt ≤ 0,3 V.
- Không đường nào nối VBUS_PROG với VBUS_C (đo điện trở giữa hai net khi không cắm: > 1 MΩ).
- Nạp firmware 3/3 lần.
- Robot: motor không quay ở mọi bước có USB và khi reset.

## BT-R1 · Giới hạn dòng motor (R1)

**BT-R1a · Đo L và R cuộn dây (chạy được ngay, không cần PCB).**
1. Đo R cuộn dây #992 bằng đồng hồ 4 dây ở 25 °C, xoay trục tới 3 vị trí, ghi min.
2. Đo L bằng LCR ở 1 kHz, 3 vị trí trục.
3. Làm với ≥ 3 motor.

**Pass:** L min ≥ 0,39 mH (điều kiện overshoot với RISEN 0,62 Ω, xem `robot.md` R1). Nếu L ≥ 0,80 mH, có thể chọn 0,576 Ω.

**BT-R1b · Dòng đỉnh trên PCB.**
1. Nguồn DC lab thay pack, 7,4 V, giới hạn 2,5 A.
2. Probe dòng trên dây motor A. Khóa trục motor bằng kẹp cơ khí.
3. Lệnh 100 % chiều thuận. Ghi dòng đỉnh, dòng chopping trung bình trong 0,5 s.
4. Lặp ở 40 °C, và với VPACK 6,5 V và 8,4 V.
5. Lặp với hai motor khởi động cùng lúc (không khóa trục) và ghi dòng VPACK đỉnh.

**Pass:**
- Dòng đỉnh mỗi kênh ≤ 0,45 A.
- Dòng VPACK khi hai motor khởi động cùng lúc ≤ 1,85 A.
- nFAULT không báo OCP.

**An toàn:** giữ thời gian kẹt ≤ 0,5 s mỗi lần, nghỉ ≥ 10 s; Pololu ghi kẹt có thể làm hỏng motor.

## BT-R2 · Ngưỡng phát hiện kẹt (R2)

**Setup:** robot hoàn chỉnh trên sàn thật, nguồn pack B04. Ghi ISA_ADC/ISB_ADC qua firmware log và probe dòng.

**Bước:**
1. Chạy thẳng trên sàn phẳng 10 s, ghi dòng trung bình và đỉnh mỗi kênh.
2. Chạy lên dốc thử [TBD: R2, box03 chốt độ dốc], ghi dòng.
3. Chặn robot vào tường (kẹt), ghi dòng và thời gian tới khi firmware chốt lỗi.
4. Ghi nhiệt vỏ motor sau 5 lần kẹt liên tiếp.

**Pass:**
- Khoảng cách giữa dòng chạy có tải lớn nhất (bước 1–2) và dòng kẹt (bước 3) ≥ 20 % để đặt ngưỡng [TBD: R2, box08 duyệt].
- Firmware chốt lỗi trong T_kẹt đã chốt; motor không tự chạy lại khi chưa có lệnh mới.
- Nhiệt vỏ motor ≤ 60 °C [TBD: R2, không có giới hạn hãng; box02 đề xuất].

## BT-R3 · Tải pack 2S và nhiệt (R3)

**Setup:** robot trong vỏ PETG đóng, ở 40 °C. Cặp nhiệt trên TPS63070, TPS54302, DRV8833, pack.

**Bước:**
1. Chạy kịch bản tải đồng thời: hai motor 100 %, loa phát 0,5 W, Wi‑Fi phát, OLED bật, 10 phút.
2. Ghi dòng pack trung bình/đỉnh, VPACK min.
3. Ghi nhiệt mỗi điểm mỗi phút.
4. Lặp ở VPACK gần 6,6 V (pack gần cutoff).

**Pass:**
- Dòng pack trung bình ≤ 1,85 A.
- VPACK ≥ 6,50 V dưới tải khi bắt đầu ở 6,8 V hở [TBD: R3, chỉnh theo OCV B04].
- Nhiệt vỏ IC ≤ 85 °C; nhiệt pack ≤ 45 °C [TBD: R3, thay bằng giới hạn hãng].
- Không có TSD (nFAULT, PG ổn định).

## BT-R4 · Đỉnh VM khi phanh/đảo chiều (R4)

**Setup:** robot hoặc bo + motor, oscilloscope trên VM_6V (sát chân VM DRV8833) và VPACK, single-shot trigger ở 7 V.

**Bước:**
1. Motor 100 %, chuyển sang coast (cả hai ngõ vào thấp). Bắt đỉnh VM.
2. Motor 100 % thuận, đảo chiều 100 % ngay, không qua brake.
3. Đảo chiều theo firmware (brake rồi coast rồi đảo).
4. Đẩy robot bằng tay nhanh hơn tốc độ không tải khi nguồn tắt và khi nguồn bật.
5. Lặp bước 1–2 với pack đầy (8,4 V) và với pack ngắt (mô phỏng BMS mở) trong lúc motor đang chạy.

**Pass:**
- VM đỉnh ≤ 9,0 V (biên 1,8 V tới 10,8 V) ở mọi bước [TBD: R4, box08 duyệt biên].
- VPACK không tăng quá 8,5 V.
- Không reset, không TSD.

**An toàn:** bước 5 có thể gây quá áp. Bắt đầu với nguồn lab giới hạn dòng, không dùng pack thật cho tới khi bước 1–4 pass.

## BT-R5 · Sạc 2S từ các nguồn USB (R5)

**Setup:** robot, pack B04 xả tới 6,6 V hở. Shunt trên VBUS và trên pack.

**Bước:**
1. Cắm cục sạc USB-C có 1,5 A/3 A. Ghi dòng VBUS, dòng sạc, thời gian, nhiệt BQ25886.
2. Cắm cục sạc cổng A + cáp A–C.
3. Cắm cổng USB máy tính bằng cáp C–C.
4. Rút NTC khi đang sạc; nối tắt NTC.
5. Ở 40 °C, lặp bước 1.

**Pass:**
- Bước 1: dòng VBUS ≤ 0,98 A; dòng sạc 0,425–0,575 A trong pha CC; áp pack cuối ≤ 8,44 V (8,4 V +0,5 %).
- Bước 2–3 (phương án A): không sạc, LED báo nguồn yếu, dòng VBUS ≤ 10 mA [TBD: R5, box02 chốt dòng bias].
- Bước 4: sạc dừng.
- Motor và tải carrier OFF trong mọi bước.

**An toàn:** không sạc pack 2S không có BMS cân bằng.

---

## Mục chưa có phép đo

H1, R3 (phần dữ liệu NCC) và H3, R1, R5 (phần founder quyết) không thay được bằng đo. Các phép đo trên chỉ xác nhận thiết kế sau khi những mục đó đã chốt.
