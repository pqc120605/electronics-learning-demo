# C11/r12 — bộ số liệu điện hợp nhất

Đối tượng là proposal r12, không MPN/setpoint/hash approval. Tất cả cổng giữ OPEN. Bảng nguồn và hash nằm trong `docs/research/downloads/c11-r12/sources.json`; mỗi số trích dẫn bên dưới có PDF và ảnh trang cùng tên `part-pN.png`. `calculate.py` và `calculations.json` trong `docs/agents/runs/MM-HW-P0-10/` thay các witness H3 và pulse cũ cho đợt này.

## H3: nguồn ghim và cửa sổ trip

BQ25170 SLUSDJ8A p6 và BQ25170J SLUSEF8 p6: ±0,5% ở25°C, ±0,8% trên−40..125°C, theo điều kiện bảng (VIN trong miền áp dụng và đủ headroom). Không dùng headline±0,5% làm cận toàn nhiệt. BQ25170 p14 Table7-1:47kΩ chọn Li-ion4,05V; đây là ứng viên strap, không BOM/setpoint đã duyệt. Không lấy strap LiFePO4 thấp hơn làm phương án Li-ion mà không chứng minh profile phù hợp.

| Đại lượng | Giá trị/cận | Loại bằng chứng |
|---|---:|---|
| CV MIN/MAX có điều kiện | 4,0176–4,0824V | ±0,8% bảng p6, chưa bao toàn ứng dụng |
| Trần pack | 4,200V | yêu cầu Founder |
| Trip MAX allocation | 4,110V | mục tiêu thiết kế, chưa chứng minh |
| Cửa sổ tĩnh | 27,6mV | 4,110−4,0824 |
| Tâm/sai số đối xứng tối đa trước guard | 4,0962V/±13,8mV | giới hạn toán học, chưa là mạch |
| Hysteresis đúng chiều và cận | TBD | cần kiểm cả khởi động/recovery/chatter |
| Offset comparator/full-temperature | TBD | TLV3201 PDF đã ghim, chưa đủ ghép mạch cụ thể |
| Reference initial/line/load/drift/aging | TBD | REF33 đã ghim, suffix/tải/nhiệt chưa khóa |
| Divider tolerance/tempco/aging/sense leakage | TBD | không cộng sai số điển hình làm MAX |
| Normal ripple/transient/guard | TBD | phải trừ khỏi27,6mV |
| Cutoff detect→driver→MOS isolation MAX | TBD; yêu cầu≤59,060915µs dưới allocation hiện tại | không lấy TYP làm MAX |
| Ipeak fault toàn miền | 2,387511478A | (5,5−2,9)/1,089; mọi đầu vào là allocation |
| Tụ Cmin/ESRmax | 10mF/10mΩ | allocation, chưa có MPN/cận tuổi thọ |
| Parasitic/overdrive | 20mV/20mV | allocation; Kmax1,601201201 |
| Reverse/bypass/TS/sense path | TBD | hai tầng ngắt hoàn chỉnh, mỗi tầng MOS đối đầu; không tụ hoặc đường tải bypass |

Phương trình điều kiện: `Vpeak <= Vtrip,max + Kmax*Voverdrive + Ipeak*ESRmax + Ipeak*tcut/Cmin + Vparasitic`. Đây không phải chứng minh charge-fault envelope đầy đủ. Ipeak còn cần cận nguồn/overshoot, pack floor, điện trở còn lại sau lỗi đơn, pulse-rating và đường năng lượng mọi tụ/OUT/tải. BQ25170 không có SYS như BQ25186; phân tích SYS/I2C cũ chỉ còn lịch sử, phải phân tích lại OUT và đường pin thực.

Dải partial cũ3,9645–4,0356V rộng71,1mV và nằm dưới CV MAX. Dịch cả dải lên trên CV MAX sẽ cần tripMAX>4,1535V; riêng K·20mV+20mV=52,024mV đã vượt46,5mV headroom trước ESR và trễ. Vì thế không thể cứu dải cũ chỉ bằng cắt nhanh hơn dưới cùng allocation.

| Phương án chưa chọn để Founder/reviewer xét | Số có điều kiện | Đánh đổi/chỗ thiếu |
|---|---:|---|
| Thiết kế detector mới, giảm sai số và cắt nhanh | tổng cửa sổ<27,6mV; cutoff<59,061µs trước guard bổ sung | chưa có full error/MAX chain |
| Giữ310µs, tăng Cmin | ≥52,488181mF tại ESR≤10mΩ | thể tích/inrush/rò/tuổi thọ/bypass và xả OFF |
| Giữ310µs/10mF, giới hạn fault current độc lập | ≤0,926243316A | còn một Rmin≥2,807038Ω; hai R gây sụt≥2,24563V ở0,4A, có thể mất headroom |
| Đổi profile/charger để CV thấp hơn | setpoint/cận TBD | BQ25170 không có strap Li-ion thấp hơn4,05V; cần quyết định mới |
| Chấp nhận giới hạn bảo vệ khác | TBD, không đề nghị tự nâng4,200V | chỉ Founder được đổi phạm vi chấp nhận |

Không phương án nào được tự chọn hoặc tự PASS. Cận tương quan I=(5,5−4,110)/1,089=1,276400A cho phép thời gian dài hơn, nhưng chưa thay cận toàn miền khi chưa chứng minh trajectory/tụ/ESR/bypass. Không dùng lại310µs ở trip4,05V làm witness mới.

## ISET, nhiệt, recharge, OVP và timer

- BQ25170 p6 KISET270/300/330AΩ: RISET750Ω±1% cho dòng điều kiện0,356436–0,444444A. Chưa chọn resistor/suffix; termination tại điều kiện600Ω/4,2V không được sao sang750Ω/4,05V.
- BQ25170 p7 OVP rising103/104/105% VSET: cận105% của4,05V là4,2525V, vượt trần4,200V. OVP nội không thay bảo vệ độc lập.
- BQ25170 p7–8 và p15–18; BQ25170J p7–8,p15–18: TS/NTC/JEITA, recharge và timer phải áp theo đúng suffix. Bản J chưa được chọn; không đồng nhất profile hai bản. Recharge threshold và full fault/TS timing tại application: TBD cho tới bảng profile theo suffix hoàn tất.
- BQ25170 p7 hot176..200mV/cold0,99..1,09V, TS36,5..39,5µA: labels0..45°C không chứng minh cửa sổ Jauch sau dung sai NTC/thermal coupling. Full R–T, độ trễ và độc lập thermal-veto: TBD.
- BQ25170 p8: precharge28,5..31,5min; fast-charge9,5..10,5h. Nạp2,6Ah với CCmin0,356436A riêng pha CC≈7,294h chưa bao CV. Timer/profile/TS restart và capacity tradeoff còn cần review, không hứa phần trăm dung lượng đạt được.

## OFF và MCU: cận nguồn áp dụng

| IC / nguồn | Trang ghim | Phạm vi/chỗ còn thiếu |
|---|---|---|
| TPS3430 SBVS366A | p6 và phần7.3.3.2 | preset nhanh lower1,48–2,22ms/upper9,35–12,65ms; feed4–6ms là đề xuất. tWD-del50ns TYP không đóng MAX toàn tuyến |
| TMUX1511 SCDS390B | p6–7,p15 | powered-off±2µA ởVDD0,VS≤3,6V,VD0; không kéo sang5,25V. transition55/80ns và supply-off4µs theo tải thử, không phải rail-system MAX |
| TLV6710 SNVSAV4B | p5–6 | divider7,5k/10k±0,1%, tổng node±100nA là allocation; falling0,693404–0,706606V/risingMAX0,724121V. Input current tại0,4V và detectMAX áp dụng vẫn TBD |
| TPS22916 | p5–7 và bảng6.5–6.6 | shutdown-current không phải forward output leakage; tOFF MAX hệ thống TBD |
| TPS3808 / SN74LVC1G74 | PDF và ảnh trang nguồn | qualifier/reset dominance, removal/recovery, mixed-bias conditions và delayMAX toàn mạch TBD |
| TPS25810 / TPS61023 / TPS25947 | PDF và ảnh trang nguồn | cận dòng, dropout/rail/fault/turnoff phải áp đúng revision/tải; chưa thay allocation thành guarantee |
| REF33 / TLV3201 / CSD25402Q3A | PDF và ảnh trang nguồn | chỉ ứng viên mạng detector/MOS; chưa chọn suffix, chưa có fully bounded circuit |

Watchdog W software-only; heartbeat hợp lệ vẫn chạy khi CPU treo nằm ngoài bảo đảm đã chấp nhận. Fault/bias/position xóa RUN và LOW_SEEN; phục hồi WDO không tự arm. Request phải LOW đủ thời gian rồi có cạnh mới sau READY. 12,65+7,35=20ms chỉ có phần watchdog được ghim; qualifier/latch/barrier/logic còn allocation cần cận. GPIO retained HIGH không có quyền vượt veto phần cứng.

## GPIO và JOY

| Vai trò | MIN | MAX |
|---|---:|---:|
| Baseline joystick/nút |5|5|
| RUN_REQUEST, FRESH_ARM, WDI, RELEASE_REQUEST riêng biệt |4|4|
| Status bắt buộc |2|2|
| E1–E4 giả định quy hoạch |4|4|
| Status tùy chọn |0|2|
| Tổng |15|17|

Pool bảo đảm tổng16=5 baseline+11 unused, có9 unused output-capable và2 input-only. Pool conditional tổng18 dùng thêmGPIO16/17 chưa được bảo đảm. **MAX thiếu1 chân**; không gán GPIO hoặc tự gộp RUN/FRESH_ARM, bỏ status hay E-channel. Gộp RUN/ARM là phương án kiến trúc chưa chọn; định hướng pin/r7 không thay đổi. Tên năm baseline trong giao diện hiện tại là JOY_X/JOY_Y/JOY_SW/BTN1/BTN2, không tự biến thành bốn trục joystick.

JOY_VCC là đường công suất: Cmax, dV/dt, Ipeak, reverse leakage, cutoffMAX TBD. Hai pot10k+bleed100k ở3,3V≈0,693mA nominal; ba pull-up10k đóng≈0,990mA trên rail thực; không phải moduleMAX. Ví dụ10µF/3,3V/1ms là33mA trung bình nạp tụ, không peak đã chứng minh. Bỏ bucket sáu signal×2µA cũ: năm signal và power-path riêng. Sáu crossing safety bắt buộc +0..2 optional +E theo mạch sau này. Worksheet allocation10µA+6..8µA+1µA để lại1..3µA cho JOY power/khác trong20µA, **chưa là KCL đã đạt**. Bleed100k với12µA có plateau1,2V; từng receiving rail cần KCL riêng theo bias/fault/bypass.

## Năng lượng actuator

Hai coil nominal7,5Ω cùng chạy3s:20J ở5V;22,05J ở5,25V. Đây không MAX: Rmin lạnh, rail tại tải, timerMAX/duty, flyback và force nóng TBD. Bỏ pulse0,45s và ngân sách motor/clutch cũ. Nguồn pack/boost phải tính lại; không suy pack3A cho phép tải này trên toàn miền.
