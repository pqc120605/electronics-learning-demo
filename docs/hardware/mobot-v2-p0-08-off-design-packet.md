# D17-OFF-DESIGN · P0-08

PROPOSED / OPEN. Không MPN/hash/pin approval, không lease, không bench. Datasheet chỉ chứng minh đúng hàng/điều kiện; mọi cận không có nguồn là TBD.

Tiêu chí nguyên văn: PASS khi kiến trúc có cận và độ phủ lỗi được Box08 chấp nhận, không dựa firmware hoặc trạng thái lệnh làm bằng chứng cách ly; FAIL khi chưa chứng minh hoặc có lỗi nhả/cấp quyền sai.

Nguồn đầy đủ file/revision/hash: [source-bounds](mobot-v2-p0-08-source-bounds.md), [manifest](../research/downloads/p0-08-2026-11-09/source-manifest.json).

## Linh kiện ứng viên và miền bias

Giữ họ O-A+O-C: TPS25810RVCR source; hai TPS22916CNYFPR barrier; hai tầng TMUX1511PWR cho IO thích hợp≤3,6V khi mất nguồn; TLV6710DDCR sense; TPS3808G01DBVR supervisor; SN74LVC1G74DCTR latch; TPS61023DRLR boost. Đây là candidate selection để phân tích, không BOM đã duyệt, không net/pin assignment.

Bảng MAX/TYP trong source-bounds là đầu vào bắt buộc. Phải xét sourceon+barrieroff; IN1/IN2/AUXramp/mất từngrail; VDDIOon/off; MCU/B01/JOY cấpngoài; GND/reference đứt. TPS22916 ISD100nA không thay forwardleakage. TPS25810 reverse3µA chỉ tới85°C. TMUX1511 không dùng bảo vệ poweredoff5,25V. Boostleak3µA chỉ25°C, không full-temperature guarantee.

## Hai cận sense và hysteresis

Phép screening đề xuất INA của TLV6710, Rtop90,9kΩ/Rbottom100kΩ, mỗi điện trở±0,1%. Đây là giá trị tính toán, chưa duyệt BOM. Dùng threshold falling397…403mV và risingMAX413mV; không cộng thêm offset nếu đã nằm trong Vthreshold. Cận theo công thức Vtrip=Vthreshold×(1+Rt/Rb) ± |Iin|Rt.

Nếu tạm allocation |Iin|≤25nA, kết quả: fallingLOW0,754877203…0,772335160V; risingHIGH≤0,791443358V. Rising cũng cần<0,80V để không duy trì OFF-qualified khi rail đã vượt0,80V. Iin±25nA chỉ được datasheet đặc tả tạiinput6,5V; áp dụng ở0,4V còn TBD. PCBleak, divideraging/nhiệt,grounderror vàreferencebias cũng TBD. Đây chưa phải hai cận guaranteed ứng dụng.

## Ngân sách thời gian

Fault→detectMAX + latchMAX + barrierOFFMAX ≤20ms. Chỉ latch3,3V có asyncMAX7,9ns; TPS25810toffMAX4,5ms chỉCL1µF/RL100Ω. TLV6710detect vàTPS3808assert chỉTYP; TPS22916toff khôngMAX. Vì vậy tổng hiện **TBD**, không kết luận20ms.

Screening decay với yêu cầu Ceff≤100µF, một bleed hở, RremainingMAX10,1kΩ, Ibackfeed30µA, Vstart5,25V: plateau0,303V,τ1,010s; đếnlowertrip0,754877203V mất2,417057406s. Cộng100msqualification và4,5ms source-off tham chiếu =2,521557406s, còn1,478442594s trong4s cho các delay chưa có cận. Các giá trị C/I/Vstart là yêu cầu phân bổ, không số đo; lowertrip cũng chưa guaranteed. Không dùng phép cộng này tự chốt timeout.

Một screening leakage6line×2tầng×2µA=24µA đã lớn hơn allocation backfeed20µA nếu tất cả là đường cộng độc lập. Mạch series thật cầnKCL theo từngfault; không gọi24µA là dòng thực. Một tầng stuckON còn lại6×2µA=12µA cũng chưa gồm pullup/JOY/sense/ESD. Không nhân10nA typical để làm xanh.

## Logic và fault coverage

RUN_ALLOWED=FRESH_PERMISSION∧LOCK_CONFIRMED∧BIAS_VALID∧¬FAULT. RELEASE_ALLOWED=SOURCE_OFF_PROVEN∧IO_ISOLATED_PROVEN∧RAIL_LOW_QUALIFIED∧BIAS_VALID∧¬FAULT. Actualrelease còn cầnrequest. Bảng32hàng ở r11-notes. Senseinvalid/biaslost không tạo TRUEproof.

| Lỗi | Bằng chứng bắt buộc / phản ví dụ FAIL | Còn thiếu |
|---|---|---|
| Một barrier/IOswitch kẹtON | Tầng còn lại cáchly vớiMAX phù hợp hoặc giữkhóa | forwardleakage, mixedbias và thời gian TBD |
| Senseopen/short/stucksafe | Hai đường chứng cứ không cùng cho OFFgiả | topology vàtestfault TBD |
| Mất nguồn/reference/GND/reset chung | Không đồng thời vô hiệuhaihàngrào rồinhảkhóa | independence, default dướiPOR TBD |
| Bleedopen/short | Nhánhcòn lại đủdecay; short không quá nhiệt | R/Cactual, thermal TBD/NOT_RUN |
| MCUretainedHIGH/peripheral chạy | Veto độc lập, không tựfresharm | circuitqualification/challenge TBD |
| Feedbackvị trí sai/driver stuckON | Cơgiữ tới physicalOFF, không chỉ lệnh | geometry và propagation TBD |

Verdict đề nghị: insufficient_evidence. Cần circuit/bias proof và nguồn có MAX tại các corner còn thiếu; không đổi sang O-B.
