# MoBot V2 · Phép đo bổ sung cho mẫu đầu (07/11/2026)

Bổ sung cho [`../../2026-11-05-mobot-r6/bench-test-plan.md`](../../2026-11-05-mobot-r6/bench-test-plan.md). Các phép đo ở đây kiểm những khối mới trong [delta-handset-2026-11-07.md](delta-handset-2026-11-07.md) và [final-bom.md](final-bom.md). Ngưỡng đạt lấy từ `calc_r7.py`. Mọi kết quả hiện là UNKNOWN.

Thiết bị chung: nguồn DC có giới hạn dòng, oscilloscope ≥ 4 kênh với băng thông ≥ 200 MHz, DMM, tải điện tử, máy tính có cổng USB 2.0, cáp Micro-USB và USB-C, pack giả lập (nguồn DC 3,0–4,2 V cho 1S, 6,0–8,4 V cho 2S). Không dùng pack thật cho các ca lỗi.

## BT-H4a · Trình tự VBUS tay cầm

| Bước | Thao tác | Đo | Đạt |
|---|---|---|---|
| 1 | Carrier ON (đã nhấn SW4), cắm Micro-USB | LOAD_EN, V5_BST, EN_PASS, VBUS_PASS | LOAD_EN < 0,45 V trong ≤ 20 µs. VBUS_PASS chỉ lên khi V5_BST < 1,01 V |
| 2 | Lặp 20 lần, cắm nhanh có nảy | như trên | Không lần nào VBUS_PASS > 0,4 V khi V5_BST > 1,01 V |
| 3 | Rút Micro-USB | LOAD_EN | Giữ thấp tới khi nhấn SW4 |
| 4 | Cắm Micro-USB và USB-C gần đồng thời, hai thứ tự | LOAD_EN, VBUS_PASS | Carrier OFF trong mọi trường hợp |
| 5 | Tháo dây sense VBUS_PROG→S khi đang cắm và khi chưa cắm | S, LOAD_EN | S ≥ 3,2 V, LOAD_EN thấp |
| 6 | Nối tắt U9 IN–OUT (mô phỏng dính đóng), carrier ON, cắm Micro | LOAD_EN | U11 kéo LOAD_EN thấp |
| 7 | Hở Q5 (gỡ linh kiện), carrier ON, cắm Micro | EN_PASS | U10 giữ EN_PASS < 1,076 V khi V5_BST = 5 V |
| 8 | Không pack, cắm Micro | VBUS_PASS, DevKit | DevKit chạy, nạp firmware được |

## BT-H4b · Latch và SW4

| Bước | Thao tác | Đạt |
|---|---|---|
| 1 | Cắm pack (nguồn 3,8 V) | LOAD_EN thấp, không tự bật |
| 2 | Nhấn SW4 | LOAD_EN lên 2,49–3,40 V và giữ sau khi nhả. Đo độ rộng xung TRIG_G: 2,35–5,89 ms |
| 3 | Giữ SW4, cắm Micro rồi rút, vẫn giữ | OFF |
| 4 | Giữ SW4 rồi cắm pack | OFF (RESET TPS3808 còn thấp) |
| 5 | Hạ nguồn pack xuống 3,15 V rồi nâng lên 3,9 V | OFF tới lần nhấn mới |
| 6 | Đo thời gian từ veto tới LATCH_G > VPACK − 0,5 V | Ghi giá trị; kỳ vọng ≤ 162 µs (Ciss typ ×2) |
| 7 | Ngắn mạch V5_DEV qua 1 Ω khi đang chạy | U6 latch-off. U12 kéo LOAD_EN thấp trong 16,8–27,6 ms. Nhấn SW4 mới thì chạy lại |
| 8 | Đo thời gian từ LOAD_EN cao tới PG U6 cao | ≤ 16 ms (biên với PG-timeout) |

## BT-H4c · I/O và USB data

| Bước | Đo | Đạt |
|---|---|---|
| 1 | SEL của U7/U8 khi mỗi nguồn veto kéo | ≤ 0,45 V |
| 2 | Từ LOAD_EN xuống tới JOY_VCC_C < 0,3 V | Ghi giá trị |
| 3 | Dòng rò từng đường JOY/BTN về DevKit khi carrier OFF và DevKit chạy bằng USB | ≤ 2 µA mỗi đường |
| 4 | Enumeration USB khi nạp firmware | CP2102 nhận trên máy tính, nạp được |
| 5 | Carrier ON, cắm Micro-USB, theo dõi D+ phía J4 | Không có pull-up 1,5 kΩ trước khi VBUS_PASS lên |
| 6 | ADC JOY_X/JOY_Y: đọc 1000 mẫu sau khi mở mux 5 ms | Độ lệch so với giá trị tĩnh ≤ 4 LSB |

## BT-R6a · Trình tự VBUS và latch robot

Giống BT-H4a/BT-H4b, thay LOAD_EN bằng EN_NODE, V5_BST bằng V5_R, U10/U11/U12 bằng U18/U19/U20. Thêm:

| Bước | Thao tác | Đạt |
|---|---|---|
| 1 | Cắm pack 2S giả lập khi đang giữ SW4R | Q_por giữ EN_NODE thấp ≥ 32 ms, không chốt |
| 2 | VPACK2 = 8,4 V, nhấn SW4R | VGS Q6R và Q_trig2 không vượt ±8 V (đo trực tiếp) |
| 3 | Veto UVLO khi motor đang chạy | MOTOR_EN thấp trong ≤ 1 µs sau EN_NODE (AND3) |

## BT-ISEN · Ngắn mạch đầu ra DRV8833

| Bước | Thao tác | Đạt / quyết định |
|---|---|---|
| 1 | Nguồn VM giới hạn 3,5 A. Nối tắt AOUT1–AOUT2 qua công tắc cơ khí, lệnh chạy 100 % | Ghi đỉnh xISEN bằng probe đặt sát chân, độ dài xung |
| 2 | Lặp 10 lần, kiểm DRV8833 còn chạy bình thường | Nếu đỉnh > 0,5 V quá 1 µs, hoặc IC suy giảm: lắp D3/D4 rồi đo lại trip theo BT-R1b |

## BT-R5a · CE BQ25886 qua ramp

| Bước | Thao tác | Đạt |
|---|---|---|
| 1 | Cắm nguồn USB-C Default (cáp A–C) | CE ≥ 1,3 V suốt quá trình, không sạc |
| 2 | Cắm nguồn 1,5 A / 3 A | CE xuống < 0,4 V sau 3,6–3,8 ms tính từ OUT1 thấp |
| 3 | Rút cáp khi đang sạc; rút CC khi VBUS vẫn còn | CE lên ≥ 1,3 V trước khi sạc lại |
| 4 | Ramp VBUS chậm 0→5 V trong 100 ms | Không có xung sạc |

## BT-R4a · Chế độ PS/SYNC

Chạy BT-R4 hai lần: R66 lắp (power save) và R67 lắp (forced PWM). Ghi đỉnh VM, dòng vào VPACK2, nhiệt TPS63070. Chọn cấu hình có đỉnh VM thấp hơn và không có dòng âm vào pack khi BMS mở.
