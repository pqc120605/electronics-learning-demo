# Prompt cho DeepSeek · chốt nhóm C (MoBot r7)

Dán khối dưới vào chat.deepseek.com. Bật chế độ suy luận (DeepThink) và Search. Đính kèm `../2026-11-05-mobot-r6/kicad-input-spec.md` nếu giao diện cho tải file.

```text
Vai trò: kỹ sư thiết kế nguồn và mạch hỗn hợp, chuyên thiết bị pin Li-ion cho học sinh. Ưu tiên an toàn và tính worst-case hơn tối ưu chi phí.

BỐI CẢNH (đã chốt, KHÔNG thay đổi)
Dự án MoBot V2 r7 gồm 2 PCB carrier cắm ESP32 DevKit (ESP32-WROOM-32, cổng Micro-USB).
- Tay cầm: pack 1S Li-ion 2 Ah (B15, 4,2 V sạc, cutoff 3,20 V tại pack), boost TPS61023 → 5 V; ngân sách 0,977 A từ pack (η giả định 80%). Sạc MCP73833-FCI/MF, RPROG 2,49 kΩ ±1% (0,402 A danh nghĩa), USB-C, nguồn USB 5 V/500 mA. UVLO TPS3808G01, hệ số pack/SENSE 8,25 ±0,2%, falling 3,266–3,417 V. eFuse TPS259474ARPWR (2 FET đối lưng) cho 5 V carrier↔DevKit: OFF khi EN/UVLO < 0,45 V, ON khi > 1,223 V. Boost EN LOW khi ≤ 0,35 V. 5 đường I/O: JOY_X, JOY_Y (ADC1), JOY_SW, BTN1, BTN2; đề xuất 2× TMUX1511 (bảo vệ 3,6 V chỉ công bố tại VDD = 0 V).
- Ma trận nguồn tay cầm (Micro-USB/USB-C): 00 = chạy từ pack khi pack/bias hợp lệ và có lệnh bật mới; 10 = Micro-USB cấp DevKit, carrier/boost/I/O/sạc OFF; 01 = chỉ miền USB-C sạc có điều kiện, DevKit OFF; 11 = như 10 cộng miền sạc. Mọi trạng thái chưa xác định → OFF. Mất bias/POR/brownout/đứt sense → xóa quyền bật bằng phần cứng.
- Robot: pack 2S (B04, 8,4 V đầy), ngân sách 1,762 A. Buck TPS54302 → 5 V logic (EN khuyến nghị ≤ 5,5 V, tuyệt đối 7 V). Buck-boost TPS63070 → 6 V motor. DRV8833, sense 0,62 Ω ±1% → trip 0,256–0,391 A, trần 0,45 A/kênh, VM vận hành tối đa 10,8 V. Motor Pololu #992 (L chưa đo, giả định 0,39–10 mH). Bulk 220 µF 16 V. Sạc BQ25886 (2S boost) chỉ khi TUSB320LAI báo 1,5 A/3 A; RILIM 1,24 kΩ; mục tiêu ICHG 0,50 A; datasheet ghi ICHG = RICHGSET / 3810 Ω/A tại điểm tham chiếu. NTC 103AT-2. UV2_DIV hiện 1,5 MΩ/97,6 kΩ dùng TLV6700 nhưng logic cũ bị đảo cực (OUTB sink khi INB trên ngưỡng).
- Môi trường thiết kế: 0–40 °C, linh kiện 0603/0805, PCB 2 lớp 1 oz mặc định (nêu nếu cần 4 lớp).

NHIỆM VỤ
Chốt giá trị linh kiện và cận thiết kế cho 18 mục sau. Mỗi mục đưa một phương án chính, tối đa một phương án dự phòng.
H-1 TPS61023: R chia áp FB cho 5,0 V, L, Cin, Cout.
H-2 TPS259474A: chia áp EN/UVLO, RILIM theo ngân sách 5 V; chọn biến thể A (auto-retry) hay L (TPS259474LRPWR, latch-off), kèm điều kiện thời gian khóa ngoài phải thắng retry.
H-3 TPS3808G01: mạng re-arm sao cho ngưỡng phục hồi thấp nhất ≥ 3,50 V, tụ CT, cận trễ tổng từ lúc pack chạm ngưỡng tới lúc tải OFF.
H-4 Detector raw VBUS Micro-USB (lấy sau pass, trước D1) và USB-C: chia áp gate, ngưỡng detect/deassert theo VBUS 4,4–5,5 V, fail-off khi đứt dây sense.
H-5 Logic EN 2× TMUX1511: chỉ HIGH ở trạng thái 00, giữ LOW khi mất bias; giá trị pull-up nút; tổng dòng rò.
H-6 Thời gian chờ ADC1: dùng R_settle = R_wiper/4 + RON (R_wiper 10 kΩ giả định), C_eff, mục tiêu ½ LSB 12 bit.
H-7 MCP73833: CIN, CBAT, điện trở LED (ISINK ≤ 25 mA), pull-up PG/STAT về input charger, mạng THERM cho NTC 10 kΩ và cách phát hiện NTC hở/ngắn, pack vắng.
H-8 Dòng USB-C tổng tay cầm: charger + bias + LED + inrush, kiểm ≤ 500 mA.
R-1 BQ25886: RICHGSET cho 0,50 A (E96), mạng TS cho 103AT-2 cửa sổ sạc 0–45 °C, logic CE active-low mặc định tắt khi CHG_OK_N high-Z, L và C.
R-2 UVLO robot: mạch mới đúng cực tính (TLV6700 hoặc IC thay thế), ngưỡng falling 6,40–6,60 V tại pack, hysteresis, fail-off khi mất bias.
R-3 TPS54302: FB cho 5,0 V, L, C, mạng EN an toàn với pack 6,0–8,4 V.
R-4 TPS63070: FB cho 6,0 V, L, C; chọn PS/SYNC forced PWM hay power save, có tính đến năng lượng trả về.
R-5 Logic MOTOR_EN = LOGIC_EN AND MCU_MOT_EN, OFF khi MCU reset/high-Z; pull-down nSLEEP.
R-6 RC lọc ISEN → ADC1 và kiểm ISEN không vượt abs max khi ngắn mạch đầu ra.
R-7 Kẹp VM khi phanh/đảo chiều: đỉnh VM ≤ 9,0 V với L 10 mH, 0,45 A, 2 kênh; so TVS khác, active clamp, brake resistor có ngưỡng.
R-8 LDO 3,3 V cho TUSB320LAI từ VBUS: IQ, dropout.
R-9 SN74LVC8T245 DIR/OE, TCA9517A EN, MAX98357A SD_MODE và GAIN: mức chân mặc định an toàn khi rail ramp.
R-10 Bề rộng trace IPC-2221 cho các net nguồn (VPACK 1,2 A, VPACK2 2,5 A, VM 1,0 A, V5 1,0 A) ở 2 lớp 1 oz, ΔT 10 °C.

QUY TẮC
1. Chỉ dùng số liệu ở BỐI CẢNH hoặc từ datasheet chính hãng (ti.com, microchip.com, espressif.com, littelfuse.com). Với mỗi thông số lấy từ datasheet, ghi mã datasheet + bảng/mục. Không chắc → ghi [CẦN TRA: tên thông số, datasheet]. KHÔNG đoán VREF, ngưỡng, dòng rò.
2. Mọi giá trị điện trở chọn từ E96 (±1%), tụ từ E6/E12 kèm điện áp định mức và loại điện môi (X7R/X5R, tính derating DC bias).
3. Tính worst-case với dung sai linh kiện và dải nhiệt 0–40 °C. Ghi giá trị min/nom/max.
4. Mọi kết quả so với yêu cầu: PASS / FAIL / CẦN ĐO (khi phụ thuộc L motor, nội trở pack hoặc bố trí PCB).
5. KHÔNG thay đổi các quyết định đã chốt ở BỐI CẢNH. Nếu một quyết định làm mục nào không thể đạt, ghi FAIL và nêu lý do, không tự đổi.
6. KHÔNG khẳng định đạt chứng nhận an toàn nào.

ĐỊNH DẠNG ĐẦU RA (tiếng Việt, chỉ kết quả cuối, không trình bày quá trình suy luận)
Với mỗi mục, đúng khối này:
### <ID> <tên>
| RefDes đề xuất | Linh kiện / MPN | Giá trị | Package |
Công thức: <công thức>
Đầu vào: <thông số = giá trị (nguồn)>
Kết quả min/nom/max: <...>
Kết luận: PASS | FAIL | CẦN ĐO — <một câu>
Dự phòng: <một dòng hoặc "không">
Box08 cần kiểm: <tối đa 2 gạch>

Cuối cùng, một bảng tổng 18 dòng: ID | giá trị chốt | kết luận | số mục [CẦN TRA].
```
