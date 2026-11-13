# MM-HW-P0-07-H3-001 · D17-H3-CV-PROTECTION

DESIGN PROPOSAL / OPEN · 09/11/2026. Bốn hướng Founder đã chọn; không gate PASS, không MPN/hash approval, không lease hoặc thiết bị. Box08 review đúng snapshot.

Tiêu chí nguyên văn: PASS khi phương án CV/bảo vệ có căn cứ và được review phù hợp giới hạn pack; FAIL nếu suy PCM là giới hạn sạc cho phép, thiếu cận hoặc chưa được review.

## Ứng viên và bằng chứng CV

BQ25186 là ứng viên chính theo Founder, chưa duyệt orderable MPN/setpoint/BOM. BQ25185 loại khỏi shortlist; SLUSF65B RevB tr24 ghi đổi tMAXCHG720→360phút (giá trị bảng tr8 TYP), nên nguồn RevA/Rev* cũ không dùng cho timer hiện tại.

BQ25186 SLUSF69A bảng §5.5 tr6: −0,5 ở MIN/+0,5 ở MAX, không ở cột TYP. Header VIN5V,VBAT3,6V,−40°C<TJ<125°C unless otherwise noted; riêng VREG_ACC ghi “All VBATREG settings, typical measurement at VBATREG=4.2V”. Không có footnote gắn riêng mở rộng phạm vi. **Đây là giới hạn MIN/MAX công bố theo điều kiện bảng; chưa chứng minh full application envelope.**

Figure5-1 tr10 trong §5.7 Typical Characteristics: VIN5V,CIN2,2µF,COUT10µF,CBAT1µF; đường−40/25/85/105°C, không125°C, không line-sweep/transient. Đồ thị không bổ sung guaranteed corner. BQ25185 tr7/tr9 có cùng phân biệt bảngMIN/MAX và figureTYP; chỉ lưu làm lịch sử loại.

| Setpoint khảo sát, chưa chọn | Khoảng số học nếu±0,5% áp dụng | Margin PCMmin4,230V | Margin charge4,200V |
|---|---|---|---|
|4,20V|4,179–4,221V|+9mV|−21mV|
|4,17V|4,14915–4,19085V|+39,15mV|+9,15mV|

Không gọi9mV là worstcase pack margin. Các phần chưa bao trong accuracy như line/load/sense/transient là TBD; không cộng trùng phần hãng đã bao. Jauch250832 Rev1.2 tr2 chỉ charge4,2V không có positive tolerance. Tại ví dụ4,17V, muốn giữ≤4,2V còn cần ΔVapplication,max+ΔVtransient,max≤9,15mV và budget margin được review. Không suy phần trăm capacity từ VREGmin.

## Kiến trúc bảo vệ và profile

Charger lập trình tới pack; đường OV độc lập MCU có sense/reference riêng, latchfault và phần tử ngắt sạc phù hợp hai chiều. PCM pack là lớp cuối, không thay regulator. Yêu cầu cửa sổ: Vnormal,max<Vtrip,min; Vtrip,max+ΔVduring_detection/isolation,max≤Vpack_allowed,max. Divider/ref/temp/aging/sense/delay/MOSFET/leakage đều TBD; nếu không có cửa sổ phải dừng, không nới theo PCM.

Nguồn PDF local tr.6–8/24–25/32–36: VREG3,5–4,65V bước10mV, ICHG5–1000mA; termination disable/5/10/20%, timer3/6/12h hoặc disable (mặc định sau reset6h), watchdog có thể reload defaults/HW_RESET. Chưa chọn12h hoặc cho phép disable. Theo tr.36, **TS_EN=0 tắt điều khiển sạc tự động theo TS, trong khi giám sát TS vẫn hoạt động**; không coi bit do MCU duy trì là bảo vệ nhiệt độc lập. Dòng0,4A là mục tiêu chưa có profile proof; accuracy ICHG±10% ở fast-charge≥40mA và điều kiện bảng. Không ngoại suy termination accuracy từ điểm thử khác.

Jauch NTC R25/B/R-T/tolerance/thermal lag và termination/profile cònTBD theoD10; không dùng NTC10k/B3435 của packkhác.0–45°C sạc từpackp2. Timer wallclock, DPM/thermalextended time, systemload và actualIBAT cần cận.

## Ca xét gate — mọi phép đo NOT_RUN

Register/defaultsai/watchdogreload/I2Cstuck phải vẫn bị protection độc lập giới hạn; OV sense/ref/bias fault và switchstuck phải có faultcoverage; NTCopen/short/outofrange không sạc ngoài profile; thermal/DPM/load không false-terminate; PCMopen/packabsent/PC/USB không cấpngược ngoài dự kiến. Mọi cận, partprotection, góctải/nhiệt/delay chưa có nguồn giữTBD. Primarycandidate không bằng MPNapproval; chưa đủ evidence đónggate.
