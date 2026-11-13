# P0-12 — ngân sách bleed và miền hoạt động

Proposal/document only. Bleed được tính là điện trở thụ động nối thường trực trên rail của nó; không phụ thuộc MCU. Không sửa r12/BOM hoặc tự tuyên bố budget hệ thống đạt.

| Tải | Điều kiện | Cận dòng | Công suất |
|---|---|---:|---:|
|RUN bleed2×10kΩ|5,25V,Rmin9,9kΩ mỗi con|1,060606mA|5,568182mW|
|JOY bleed2×22kΩ|3,6V,Rmin21,78kΩ mỗi con|0,330579mA|1,190083mW|
|JOY bleed nominal|3,3V,22kΩ mỗi con|0,300000mA|0,990000mW|
|Hai ADR4525 reference không tải|950µA MAX mỗi reference, nguồn trong điều kiện bảng|1,900mA|phụ thuộc rail thực|
|Hai TLV9031 comparator không tải|35µA MAX mỗi con, theo p9|0,070mA|phụ thuộc rail thực|

Nguồn/datasheet áp dụng: ADR45 RevG p4; TLV90xx SNOSDA3H p9; giá trị/dung sai bleed là yêu cầu proposal. Dòng reference/comparator không bao output load, pull-up, divider hoặc logic khác. Không ghép chúng vào mode bất kỳ khi chưa có topology.

## RUN: giữ trần tổng thay vì cộng tải ngoài bảng

Trần output vẫn0,500A, điện ápMAX5,25V→2,625W. Reserve bleedRUN1,060606mA **bên trong** trần này, còn0,498939394A cho B01/JOY và các tải khác cùngrail. Không cộng JOY bleed lần hai vào carrier nếu nó đã được cấp quaB01 trong tổngRUN.

Với hiệu suất tối thiểu0,8, packfloor3,2V và phụ tảipack20mA như allocation hiện tại, nhu cầuRUN vẫn1,045390625A khi mọi tảioutput nằm trong0,500A. Đây là allocation, chưa xác minh hiệu suất/phụ tải thật. Nếu cộng bleedRUN ngoài0,500A thì nhu cầu thành1,047565696A, **vi phạm cách phân bổ trần output hiện hành** dù chênh nhỏ; không chấp nhận cách cộng đó.

Nếu H3references/comparators cùng hoạt động trên một rail5V giả định, riêng IQ1,970mA→9,850mW, tương đương khoảng3,847656mA pack ở3,2V/eta0,8. Đây không phải khoản đã được chứng minh nằm trongaux20mA: mode, rail, loss, divider/pull và driver thật vẫnTBD. Reference5V không tự giải quyết supply envelope/CMRR/PSRR của comparator.

## Ma trận mode cần khóa trước r13

| Mode | RUN bleed | JOY bleed | H3 IQ | Phần chưa có cận |
|---|---|---|---|---|
|RUN ổn định|nhận dòng theoRUNrail, reserve trong500mA|nhận dòng theoJOYrail, tính qua nguồn thực|theo topology giám sát, chưa khóa|B01/RF/JOY/actuator/source efficiency vàaux partition|
|OFF đang xả|khôngzero trước khi rail xả|khôngzero trước khi rail xả|nếu còn bias thì vẫn cóIQ|injection từngrail, cận thời gian, reset vàdefault|
|CHARGE|RUN/JOY bị cưỡng bứcOFF; externalbias vẫn cần xét|như trái|reference/veto phải hoạt động đúng trước và trong charging|inputcurrent charger, heat, reference-ready, no-backpower|
|PROGRAM|PC có thể cấpB01, còn nguyên nghĩa vụisolation|tùy rail sauisolation/bypass, không giảzero|theo topology, TBD|USB/B01reverse, diagnosticcrossing/pull/clamp|
|Actuator đang cấp quyền|không tự cộng tảiactuator vào500mA B01|không thay proofisolation|theo topology, TBD|coilRmin/railMIN/duty3s/flyback/driver/packpeak|

Hai coil7,5Ω nominal cùng hoạt động3s vẫn là20J ở5V hoặc22,05J ở5,25V, chưaMAX do thiếuRmin/duty/rail. Không dùng dòngRUN1,045A để chứng minh actuatorpeak.

F5 được xử lý về định nghĩa nối và số bleed/khôngdoublecount. Ngân sách mode toàn sản phẩm **chưa đóng** khi còn các hàngTBD. Nếu cần switchedbleed để giảm tiêu thụ, phải có proposal và faultcoverage riêng, không tự đổi sang giải pháp đó.
