# P0-06 · Ứng viên H-C cho tay cầm · chưa chốt MPN

Founder chọn hướng H-C ngày09/11/2026; Q3 Jauch250832 giữ nguyên. Bảng này là sàng lọc tài liệu, không chốt IC, điện trở, setpoint, bus hoặc topology. Mọi phép đo NOT_RUN. Hai PDF hãng nguyên bản cùng revision, URL, hash và trích trang nằm trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-06/sources/`, `source-manifest.json`, `source-excerpts.txt`.

| Thuộc tính | BQ25185 — chờ Founder duyệt MPN | BQ25186 — chờ Founder duyệt MPN |
|---|---|---|
| Tài liệu hãng | [SLUSF65B RevB August2026](https://www.ti.com/lit/ds/symlink/bq25185.pdf),32 trang | [SLUSF69A RevA January2025](https://www.ti.com/lit/ds/symlink/bq25186.pdf),57 trang |
| Regulation accuracy | ±0,5% mọi VBATREG, typical measurement tại4,2V; tr.7 | ±0,5% mọi VBATREG, typical measurement tại4,2V; tr.6 |
| Điều kiện bảng | VIN5V,VBAT3,6V;−40°C<TJ<125°C nếu không ghi riêng; typical TJ25°C. Hàng accuracy không có điều kiện dòng riêng. Header tr.6–7 | Cùng điều kiện header; tr.5–6. Không extrapolate sang mọi line/load/transient |
| VREGmin/typ/max tại target4,20V | 4,179/4,200/4,221V — tính từ±0,5%, không là phép đo | 4,179/4,200/4,221V — cùng phép tính |
| Chọn điện áp | R-set standalone; các lựa chọn3,6/3,65/4,02/4,1/4,2/4,35/4,4V; tr.1. Chưa chọn resistor/setpoint | I2C,3,5–4,65V,bước10mV; tr.1,32. Chưa chọn register/setpoint |
| Dòng cài đặt | Range typical5–1000mA; KISET285/300/315AΩ,10mA<ICHG<1000mA,±10% accuracy fast-charge≥40mA ởVIN5V; tr.7. 400mA danh nghĩa tương ứng300/0,4=750Ω, chỉ là phép tính khảo sát, chưa chọn điện trở/BOM | Range5–1000mA; vùng trên35mA bước10mA có400mA,±10% từ40mA; tr.6,33–34. Chưa chọn register/firmware |
| NTC | Hot/cold theo TS, tr.18; cấu hình pull-up/thermistor phải khớp pack thật, Jauch R–T còn thiếu | NTC/JEITA và ngưỡng cấu hình, tr.24–25; cần kiểm defaults và giới hạn cell, không dùng default thay Jauch R–T |
| Timer | tMAXCHG360min **TYP**, precharge0,25×tMAXCHG; tr.8. DPPM/thermal ảnh hưởng hành vi, không coi6h là full wall-clock bound | Tùy chọn3/6/12h và watchdog, tr.36; đây là lựa chọn register chưa duyệt, không giả mặc định12h |
| Termination |10% ICHG TYP/tr.7, chức năng tr.12; ở0,4A danh nghĩa là40mA, chưa chứng minh phù hợp dòng kết thúc Jauch |5/10/20% ICHG selectable, tr.34; chưa chọn, phải đối chiếu termination Jauch và trạng thái thermal/DPPM |
| Tài nguyên/tác động | Standalone ít phụ thuộc firmware nhưng timer/termination hạn chế; power-path/SYS cần map lại, không thay pin-to-pin FCI | Cần I2C pull-up/rail/resource/register/reset/watchdog. Đây là charger I2C, không phải I/O expander; quyết định không dùng expander vẫn giữ. Nếu yêu cầu nguồn sạc không phụ thuộc MCU thì phải chứng minh default/protection độc lập; chưa phân bus |

## Các phép tính và phần còn thiếu

Với target4,20V và accuracy±0,5%: `4,20×0,995=4,179V`; `4,20×1,005=4,221V`. So PCMmin Jauch `4,28−0,05=4,230V`, margin số học `4,230−4,221=0,009V=9mV`. Số này chưa bao gồm các hiệu ứng không nằm trong điều kiện accuracy, sụt sense/đường nối hay transient; không tự cộng trùng sai số đã bao trong thông số. Cần Box08 khóa envelope đầy đủ ở đầu cực pack.

**Giới hạn quan trọng:** Jauch Rev1.2 tr.2 vẫn ghi charge4,2V, không có positive tolerance.4,221V vẫn cao hơn4,200V21mV; vượt qua phép sàng lọc PCM không chứng minh tương thích cell. VREGmin4,179V thấp hơn mục tiêu21mV và gần về điện áp, nhưng không có dữ liệu dung lượng tại mức đó để hứa “gần đầy” theo phần trăm. Termination/profile/NTC thực của Jauch vẫn TBD. Chưa liên hệ Jauch.

**BQ25185 timer là điểm yếu thực:** với rated2,5Ah hoặc typical2,6Ah từ Jauch Rev1.2 tr.2 và dòng danh nghĩa0,4A, phép chia lý tưởng cho6,25h/6,5h, chưa kể CV. Timer360min typ có thể kết thúc trước khi đạt mức nạp mong muốn nếu hoạt động ở full-CC và không có cơ chế gia hạn phù hợp. Không suy chức năng timer pause/slowdown sẽ luôn cứu mọi ca. Vì vậy BQ25185 chỉ là ứng viên CV đạt sàng lọc, **chưa là giải pháp profile đạt**; cần loại/đổi phương án nếu không giải quyết được cận timer. Không tự tắt timer hoặc tăng dòng để làm xanh.

BQ25186 có lựa chọn timer dài hơn nhưng chưa có lựa chọn đã duyệt hoặc bằng chứng profile/time bound. Ví dụ khảo sát khác: setpoint4,17V (IC hỗ trợ bước10mV) cho4,14915–4,19085V nếu cùng±0,5%; margin tới4,2V là9,15mV trước phần chưa bao. Đây chỉ là trade-off khảo sát lower CV/capacity, không chọn setpoint thay Founder và không chứng minh capacity/termination/transient.

## Tiêu chí trước khi xin chốt MPN

Cần lập sơ đồ năng lượng dự kiến cho BAT/SYS/USB/CHARGE/RUN, cận line/load/temp/transient CV, timer min/max/hành vi fault, ICHGmax sau sai số điện trở/register, NTC/profile đúng pack, thermal trong vỏ, current-input/inrush, backfeed/PCM-open/pack-absent/default watchdog và veto OFF không phụ thuộc firmware. RPROG2,49kΩ của FCI không chuyển sang hai IC này. Mục tiêu0,40A kế thừa phải được tính lại theo IC thực, chưa đổi bằng phạm vi dòng supported.

H3-CV-PROTECTION tiếp tục OPEN. Hai ứng viên chưa được chọn; không có mua hàng, BOM product đã khóa, cấu hình build hoặc thao tác thiết bị.
