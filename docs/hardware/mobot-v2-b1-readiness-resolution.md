# B1 — kết quả hội tụ kỹ thuật sau khi chốt W và100N/200N

Ngày 09/11/2026. Trạng thái **NOT_READY** trên bằng chứng hiện có; không thay r11 hoặc tự đóng gate. Đây là hồ sơ số liệu để reviewer xử lý các điểm còn thiếu, không phải một sơ đồ, CAD hay pin assignment.

Quyết định hiện hành: [Founder chọn W và envelope](mobot-v2-founder-decision-q1-q8.md#b1-w-envelope). Source mới nằm ở [manifest](../research/downloads/b1-readiness-2026-11-09/source-manifest.json). Nguồn P008 giữ nguyên ở thư mục p0-08-2026-11-09. File tính thuần toán: D:/StartupOS/docs/agents/runs/MM-HW-P0-09/b1-readiness/calculate.py.

## 1. Sửa đúng phạm vi yêu cầu

- MCU chuyển nhánh W đã được Founder chọn: software-only feed, không PWM/DMA/peripheral tự feed. Không tuyên bố phát hiện peripheral vẫn tạo heartbeat hợp lệ khi CPU/task treo. Fault latch, retained-HIGH/LOW, bias fault và fresh permission vẫn bắt buộc. Không tự gọi window watchdog là challenge.
- NTC/R–T, termination, timer, nội trở/pulse và thông số pack được D10 nêu rõ có thể giữ TBD. Chúng không tự trở thành blocker trước schematic. Kiến trúc bảo vệ độc lập và cận an toàn theo D17 vẫn phải review trước B1.
- CAD không phải điều kiện được viết trong tiêu chí gate. Có thể nộp proof giải tích với kích thước/dung sai trước CAD; không được nói thiếu CAD tự nó chứng minh bất khả thi. Tuy nhiên hiện vẫn thiếu proof cơ cấu cụ thể.

## 2. Pawl có số liệu và tọa độ đề xuất

Nguồn hãng SSAB Domex355MC công bố minimum yield355MPa cho bề dày1,80–3,00mm, đặc tính thử theo chiều cán. HTML hãng được ghim cùng hash trong manifest; chưa có cert vật liệu chi tiết sẽ mua hoặc derating qua mọi môi trường/tuổi thọ.

Ứng viên giải tích: mỗi đường giữ phải tự chịu proof200N; pawl có bề rộng tối thiểu8mm, dày tối thiểu1,8mm, unsupported length tối đa1mm. Kt=3 là **allocation phải kiểm chứng**, không là thông số SSAB.

| Phép tính tại200N | Kết quả |
|---|---:|
| A=bt |14,4mm²|
| Z=bt²/6 |4,32mm³|
| Bending sau Kt3 |138,889MPa|
| Peak rectangle shear sau Kt3 |62,500MPa|
| Von Mises kết hợp bảo thủ |176,093MPa|
|355MPa/chỉ số trên |2,016|

Đây chỉ là conditional section check. Cần bổ sung bearing/tear-out/holes/anchorage, uốn vỏ, fatigue và ảnh hưởng gia công. Không đưa lực chính qua vỏ nhựa: striker thép→pawl→backstop thép→bracket→frame/mount.

Allocation tọa độ để reviewer đánh giá, chưa phải kích thước connector xác nhận: RUN tại x=0; overlap danh nghĩa2,5mm; tổng mất overlap≤0,5mm để còn≥2,0mm; khi chưa OFF-qualified thì hard stop giữ x≤0,5mm; first hazardous contact loss phải x≥3,5mm. Nếu overtravel sau phát hiện≤1mm thì biên còn2mm. Không đổi biên này thành thời gian bằng giả định người dùng rút chậm. Hành trình y để nhả chưa chốt vì thiếu overlap upper/clearance.

Hai pawl cùng một cam/shaft không mặc nhiên độc lập: cam kẹt ở trạng thái nhả có thể mở cả hai. Cần cấu trúc mà một lỗi phần tử cấp quyền không mở cả hai trước OFF. Hiện chưa có proof đó; gate vẫn OPEN.

## 3. Motor và ngân sách pulse

Pololu #2367 MP6V,100:1 là ứng viên screening, chưa chọn sản phẩm. Hãng công bố tại6V:220rpm/70mA không tải; stall0,94kg·cm/0,67A được nêu là extrapolation và stall có thể hỏng motor/gearbox. Không dùng nó làm torque-min tại rail4,75–5,25V hay MAX stall current. Cam allocation2N×3mm cần6mNm trước friction/loss; catalogue cho thấy có cơ sở khảo sát, không chứng minh hoạt động.

LTC6993 RevF p4–5: với NDIV≥512, full-temperature pulse accuracy MAX±3,0% theo đúng grade; không dùng mức2,3% trong phần features làm full-temperature. Nếu pulse danh nghĩa0,450s và tổng sai số RSET±1%, upper=0,468135s. Cộng một switch-off3ms **nếu đúng điều kiện áp dụng** cho0,471135s. Đây chưa chứng minh startup/default/no-auto-retry, rest interval hoặc toàn nhánh đã cắt. Hai lần tải PDF thất bại, đã dừng; số liệu được đọc từ PDF hãng online, chưa có hash byte PDF local.

TPS2553 SLVS841G Oct2026 p6–7 đã ghim: toff MAX3ms chỉCL1µF/RL100Ω; RILIM210kΩ cho DC110…150mA; RILIM49,9kΩ cho DC475…565mA trên dải nhiệt được ghi. Response to short2µs chỉ TYP. Vì thế không tuyên bố peak≤150mA/300mA/565mA trước regulation. Resistor tolerance còn phải tính, không ghép song song hai IC để đoán current sharing.

Nếu chỉ dùng DC150mA và pulse upper0,471135s: P≤0,7875W; E_DC≤0,371019J. Cần cộng E_transient,max chưa có và năng lượng flyback. Motor có thể không đủ torque ở5V/150mA. Các giá trị năng lượng không chứng minh nhiệt độ motor/vỏ.

## 4. H3: cửa sổ khả thi số học, chưa đủ bound ứng dụng

Đề xuất nghiên cứu supplement TLV3201 + REF3325, chưa thay candidate baseline hay duyệt part/setpoint. TLV3201 SBOS561C p5–6 có MAX55ns theo supply/overdrive20mV/load15pF; không lấy55ns tính từ ideal zero-overdrive crossing. Offset±4mV full-temperature không tự bao mọi directional threshold; hysteresis1,2mV là TYP.

REF33 SBOS392I p6: initial±0,15%, drift MAX30ppm/°C. Dùng BOX span165°C cho miền−40…125°C, không dùng chỉ100°C. Một số line/load full-temperature, thermal hysteresis, aging và noise là TYP; chưa đóng full trip interval.

Screening gain1,6 với resistor±0,1%, offset±4mV, input5nA tại60k và reference initial+BOX drift cho partial trip3,964526823…4,035527477V. Đây chưa có đủ line/load/common-mode/supply/hysteresis/aging/noise. Allocation complete trip3,95…4,05V **chưa được chứng minh**.

| BQ setpoint khảo sát | Conditional normal max theo+0,5% | So với lower allocation3,95V |
|---|---:|---:|
|3,80V|3,8190V|Còn131,0mV cho sai số chưa bao|
|3,90V|3,9195V|Còn30,5mV|
|4,00V|4,0200V|Không phù hợp allocation này|

Không chọn3,80/3,90V tại đây; giảm setpoint có đánh đổi dung lượng chưa được định lượng.

Điều kiện cần: Vpeak≤Vtrip,max+Kmax·Voverdrive+∫Ifaultdt/Cmin+Ipeak·ESRmax+Vparasitic,max≤4,200V. Với Kmax1,601201 và20mV overdrive, phần pack tăng32,024mV. **Nếu** cutoff≤10µs, external Cmin100µF, ESRmax50mΩ và fault current được giới hạn độc lập:

-0,44A cho Vpeak≤4,148024V, còn51,976mV.
-0,565A cho Vpeak≤4,166774V, còn33,226mV.

Đây là witness số học, không proof:0,44A là normal-current screening;0,565A là DC current-limit, không initial fault peak. Cutoff10µs, capacitor và parasitic bounds chưa có đủ part/circuit evidence. Không suy capacitance của cell từ Ah.

Hai CSD25402Q3A trong một opposed-FET stage có Qg screening19,4nC tại điều kiện25°C/−4,5V/−10V;5mA MIN driver giả định cho3,88µs. Driver đó chưa được chọn/đặc tả, Qg chưa mở rộng được tới mọi application corner. Cần **hai complete independently controlled barriers** nếu fault model yêu cầu một switch short; hai opposed FET đơn thuần chỉ chặn hai chiều, không tự thành hai kênh ngắt độc lập.

## 5. Những nhánh đã loại đúng lý do

- TPS3890 SLVSD65A p5 cũng không cung cấp MAX assertion áp dụng; không thay TPS3808 để rồi gọi18µs NOM là MAX.
- REF33/TLV3201 tạo hướng nghiên cứu có ích nhưng chưa giải quyết toàn bộ threshold/default/mixed-bias/cutoff.
- TPS2553 DC limit150mA không mang được H3 target0,4A; mức49,9kΩ hỗ trợ normal0,44A về DC nhưng chưa khép peak fault.
- Các actual measurement mà D10 cho hoãn không được yêu cầu sớm để làm khó B1; đồng thời D10 không miễn bốn design gates.

## 6. Yêu cầu review kế tiếp

Review đúng các số liệu và provenance, rồi chỉ ra circuit/material/contact evidence tối thiểu còn thiếu hoặc trả counter-proposal có cận và nguồn. Không đóng gate chỉ vì có số học khả thi. Không coi việc chọn W/100N là approve hash/MPN hoặc miễn D17. Không đủ cơ sở nộp final hash approval hay mở B1 trên snapshot này.
