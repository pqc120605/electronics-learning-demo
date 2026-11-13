# P0-05 · Hồ sơ thiết kế bốn cổng tay cầm

Task gốc `MM-HW-P0-05`, bổ sung hướng đã chọn trong `MM-HW-P0-06` · 09/11/2026 · DOCUMENT ONLY / PROPOSED. Chủ trì ghi hồ sơ: Codex lead; tư vấn dùng `gpt-6.1-sol`. Founder đã xác nhận bốn hướng tại §7; MPN actuator/charger và GPIO cụ thể chưa chọn. Box08 quyết định gate trên đúng snapshot; cả bốn gate vẫn OPEN, mọi phép đo NOT_RUN.

Bổ sung sau C06: review R-20261109-C06 nhận hồ sơ ban đầu ở mức document-only; verdict cả bốn gate là `insufficient_evidence`. Bytes đã sửa dưới đây cần review riêng; không chuyển acceptance của hash cũ thành review hash mới. Bằng chứng bổ sung và disposition nằm trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-05/attempt-2/`.

## Mục lục

1. [Căn cứ và cách đọc cận](#1-căn-cứ-và-cách-đọc-cận)
2. [D17-OFF-DESIGN](#2-d17-off-design)
3. [D17-ACTUATOR-PRODUCT](#3-d17-actuator-product)
4. [D17-H3-CV-PROTECTION](#4-d17-h3-cv-protection)
5. [MCU-RESET-VETO-RESOURCES](#5-mcu-reset-veto-resources)
6. [Bàn giao Box 08 và quyết định còn thiếu](#6-bàn-giao-box-08-và-quyết-định-còn-thiếu)
7. [Hướng Founder đã chọn và FMEA khóa thụ động](#7-hướng-founder-đã-chọn-và-fmea-khóa-thụ-động)

## 1. Căn cứ và cách đọc cận

Nguồn chuẩn là `docs/mission-control/hardware-config-mobot-v2-typec-r8-handset.json`, SHA-256 `c5d342db0db6c3cb419078bd9342c1766b7f537df87f590077aef73f083dc626`, cùng closure P0-04, hợp đồng MCU r1 §§6–7, quyết định Q2-OFF và kiến trúc B01 v1. Hash các đầu vào nằm trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-05/input-snapshot.json`. Không chuyển topology CP2102/Micro-USB cũ sang board USB-C CH340 thực.

Bản đề xuất mới P0-06 là `docs/mission-control/hardware-config-mobot-v2-typec-r9-handset.json`, SHA256 `e8a1d0d319f11d71d0b5040731664f72076396eb5f39d968d8df45e6039510a3`. R8 là baseline lịch sử giữ nguyên. R9 chỉ ghi hướng đã xác nhận, typed stage/required IDs và applicability handset, chưa approved hash/gate/MPN. Các bảng so sánh bên dưới là lịch sử A10; trạng thái lựa chọn hiện tại do §7 quyết định. Acceptance C06 chỉ gắn với snapshot lịch sử, không tự chuyển sang revision này.

Số từ JSON `power_design` và `whole_path_budget` dưới đây là **yêu cầu/ứng viên kế thừa**, không phải thông số hãng được bảo đảm: RUN 4,75–5,25 V, tối đa tổng 0,50 A; pack floor tính toán 3,20 V; hiệu suất yêu cầu tối thiểu 0,80; dòng auxiliary yêu cầu tối đa 20 mA; RUN OUT OFF tối đa 0,80 V; nguồn ngừng cấp yêu cầu tối đa 20 ms; xác nhận OFF liên tục tối thiểu 100 ms; timeout OFF 4.000 ms; tổng điện dung hiệu dụng yêu cầu tối đa 100 µF; dòng source OFF yêu cầu tối đa 10 µA và các nguồn backfeed khác tối đa 20 µA. Điện dung B01, cáp, dung sai và bias phải nằm trong tổng này; chưa được kiểm chứng.

Tính lại từ các yêu cầu: `(5,25 × 0,50)/(3,20 × 0,80) + 0,020 = 1,045390625 A`. Đây chưa bao gồm actuator sản phẩm ngoài allocation. Hiệu suất, auxiliary, sag, peak và nhiệt cần chứng minh; phần chênh với dòng xả pack không tự trở thành ngân sách actuator.

Pack: Jauch No.250832 Rev1.2 trang2–3, bản Founder cung cấp `D:/250832.pdf`, SHA-256 `f591005fb42722eb8f55aba91425e920c23a288cc4d897114968968e0609609a`. Trang2: CC-CV4,2 V, sạc0…45°C; PCM overcharge detect4,28±0,05 V/release4,08±0,05 V; discharge detect/release đều2,80±0,10 V, còn câu hỏi về hysteresis; dòng xả công bố3 A. Bảo vệ pack không phải cận vận hành cho charger. NTC không có bảng R–T trong tài liệu này. Những thông số thiếu giữ TBD theo đúng D10, không dùng pack khác thay thế.

## 2. D17-OFF-DESIGN

Tiêu chí JSON nguyên văn: “PASS khi kiến trúc có cận và độ phủ lỗi được Box08 chấp nhận, không dựa firmware hoặc trạng thái lệnh làm bằng chứng cách ly; FAIL khi chưa chứng minh hoặc có lỗi nhả/cấp quyền sai.”

Q2-OFF bắt buộc giữ phích RUN tới khi xác nhận I/O thực sự cách ly, Source thực sự tắt và RUN OUT dưới ngưỡng; mất bias hoặc timeout giữ phích. Source command/EN/SEL không thay bằng chứng trạng thái đường dẫn. Service release chỉ tiếp cận sau tách pack, loại/chặn nguồn ngoài, cách ly I/O và xác nhận rail dư theo cận đã review.

Bảng A6 thực có tại `D:/StartupOS/electronics-learning-demo/datasheet-table.md`, cùng `browser-report.md` ở thư mục gốc. Đã đối chiếu phần TPS25947; không di chuyển/sửa bảng. Cận bên dưới vẫn lấy trực tiếp PDF local `docs/research/downloads/ti-tps25947.pdf`, **TI SLVSFC9C October2020 revised May2026**,75 trang; số trang sau là trang in/PDF khớp nhau. [Nguồn hãng](https://www.ti.com/lit/ds/symlink/tps25947.pdf). Không nhận nhãn PASS từ bảng tư vấn cũ hoặc dùng hàng NTC của pack khác cho Jauch.

| Cận TPS25947 | Nguồn và điều kiện | Hệ quả cần review |
|---|---|---|
| VIN khuyến nghị2,7–23 V; TJ−40…125°C | SLVSFC9C §6.3 tr.8 | Không suy hành vi ngoài miền bias. |
| EN rising1,183–1,223 V; falling1,076–1,116 V; VSD(F) min0,45 V/typ0,74 V | tr.9 | Ngắt chắc cần driver thấp hơn cận thấp có margin; divider/driver/GND cần cận. |
| Shutdown input current max28,7 µA | tr.9, VEN<VSD(F) | Dòng lấy từ IN, không phải OUT leakage. |
| Unpowered OUT leakage4,86 µA TYP | tr.10, VOUT12 V,VIN0 V | Không bảo đảm Source OFF≤10 µA toàn miền. |
| OUT leakage OVLO max443 µA | tr.9, OVLO,VOUT>VIN | Khác shutdown; không gom thành cùng leakage OFF. |
| Threshold0,425–0,575 A với RILM6,65 kΩ | tr.9 | 0,50 A danh nghĩa không là cận dòng cứng≤0,50 A. |
| Circuit breaker2 µs; reverse-block1 µs; retry A110 ms | §6.6 tr.11, **TYP, không MAX** | Không chứng minh ngắt≤20 ms hoặc race reset/retry. |
| L latch lỗi circuit-breaker | §7.3.5.2 tr.31 | Không thay latch quyền RUN toàn hệ thống. |
| Powered cable tại OUT gây stress OUT–IN | §8.3 tr.61 | Cần transient và trạng thái DC; TVS không thay hàng rào DC. |

| Phương án so sánh lịch sử A10 — lựa chọn hiện tại xem §7 | Tài nguyên / ưu nhược | Khi nào FAIL |
|---|---|---|
| O-A hoàn thiện họ ứng viên JSON | TPS25810, hai TPS22916, hai tầng TMUX1511, hai TLV6710 sense, logic quyền nhả và reset; giữ hướng đầu vào nhưng cần MAX leakage/timing/từng miền bias. | Một phần tử dẫn hoặc đường I/O/pull-up/clamp vượt nguồn, chưa chứng minh tầng còn lại cô lập; nguồn chung làm hai sense báo sai. |
| O-B eFuse latch-off | TPS259474LRPWR, RILM/ITIMER/dVdt và transient protection; Source CC vẫn cần phần tử riêng. Có latch một số fault nhưng thêm nguồn/tải/bias. | Dựa TYP để đóng20 ms/leakage, EN kẹt hoặc latch ngoài giữ, thiếu CC/IO isolation, coi latch IC là quyền RUN mới. |
| O-C giữ/cấp quyền cơ khí khác | Giữ thụ động hoặc đường giữ độc lập, feedback vị trí và liên động RUN; actuator/part/budget TBD. | Rút được trước OFF hoặc suy vị trí từ lệnh; dùng hai actuator chung driver/return như hai đường độc lập. |

**Kiểm đại số có điều kiện từ yêu cầu JSON:** một bleed hở, R còn lại max10.100 Ω, Ceff100 µF, Ibackfeed30 µA, V0=5,25 V: V∞=0,303 V; τ=1,010 s; thời gian tới0,80 V=2,320926 s; tới0,77412 V=2,374938 s. Cộng20 ms source-stop và100 ms qualification cho2,494938 s, còn1,505062 s so timeout4 s. Đây là allocation, chưa chứng minh C/leakage/cận propagation/cơ khí. **Upper trip chỉ chống nhả sớm; cần lower trip để tính nhả chậm nhất**, nên phép tính không đóng timeout. Hai bleed chung return có lỗi chung.

| Lỗi/điều kiện phải bao phủ | Nghĩa vụ và phản ví dụ FAIL |
|---|---|
| Một barrier VBUS kẹt dẫn | Barrier còn lại ngắt có cận hoặc giữ phích; upstream còn điện qua switch kẹt là FAIL. |
| Một tầng I/O/JOY kẹt dẫn | Tầng còn lại cô lập mọi đường; tín hiệu EN/SEL đúng không chứng minh switch thật đã ngắt. |
| Một bleed hở/chập | Hở: plateau/timing qua nhánh còn lại; chập: giới hạn nhiệt/ngắn mạch. Rail thấp trong khi nguồn vẫn cấp nóng không đủ OFF. |
| Sense hở/chập/báo thấp | Sense độc lập/plausibility giữ veto; cùng nút sense đứt làm cả hai báo thấp là FAIL. |
| Bias/reference/GND chung lỗi | Không RUN/nhả; hai comparator cùng reference hoặc ground shift không là hai kênh độc lập. |
| Driver actuator kẹt ON | Đường còn lại giữ hoặc ngăn RUN trước nguy hiểm; chung transistor/return cấp cả hai là FAIL. |
| MCU treo/GPIO HIGH/reset/panic/watchdog | Veto độc lập có ưu tiên, phục hồi cần quyền mới; latch retained HIGH sau reset là FAIL. |
| Brownout/ramp/mất bias | Thu hồi quyền trước miền không xác định, giữ phích; hồi nguồn tự RUN là FAIL. |
| CHARGE/PC/B01/I/O có nguồn | Xét như trạng thái vận hành, không gọi là lỗi thứ hai; cách ly IO, không backfeed. RUN sense thấp nhưng IO còn sống là FAIL. |
| Chốt kẹt mở sau boot | Phải có giữ độc lập hoặc chứng minh ngắt trước mất tiếp xúc; chỉ kiểm vị trí lúc boot là thiếu. |
| Kéo sớm/lệch/đi vòng | Giữ đủ tới OFF thực với margin chuyển động; CC/VBUS mất trước isolation là FAIL. |
| Bảo trì bỏ bước | Pack tháo nhưng PC/charger còn cấp không đủ quyền service release. |

Mỗi hàng cần xét trong RUN, yêu cầu OFF, qualification, đang nhả; vẽ map năng lượng gồm ESD/pull-up/JOY/sense/cáp và đánh dấu common causes. Cận current-test xác nhận thực sự ngắt TBD; tải test không được che backfeed.

**Còn thiếu để Box08 xét PASS/FAIL:** MAX leakage/tắt/trễ từng trạng thái, full Ceff/ESR/ESL/năng lượng, hai cận sense và hysteresis/filter, proof isolation thực, cơ cấu giữ/feedback/duty, thời gian từ lỗi tới đầu ra và FMEA nguồn/bias/GND chung. Các ô này vẫn TBD; OFF-ASSEMBLY là gate đo đúng cụm ở mốc sau, không được tự đóng tại A10.

## 3. D17-ACTUATOR-PRODUCT

Tiêu chí JSON nguyên văn: “PASS khi ngân sách sản phẩm đầy đủ và đáp ứng các cận nguồn/điện/nhiệt/trạng thái đã review; FAIL nếu còn tải ngoài bảng, không đáp ứng cận hoặc chưa có giải pháp sản phẩm.”

| Phương án so sánh lịch sử A10 — lựa chọn hiện tại xem §7 | Lợi ích / tài nguyên và nhược điểm | Phản ví dụ FAIL |
|---|---|---|
| Solenoid spring-return, điện chỉ dùng để nhả | Có thể giữ khi mất điện nếu cơ cấu đúng; cần coil, driver, dập năng lượng, feedback thật, dòng giữ/duty và nhiệt trong vỏ. Chưa có MPN sản phẩm. | Driver kẹt ON nhả sớm; coil nóng hoặc nguồn sụt làm sense mất bias; không điện nhưng cơ cấu vẫn tự nhả. |
| Chốt cơ/bistable dùng xung | Giảm tải giữ liên tục; cần xác nhận vị trí thật, driver xung, giới hạn xung và cơ chế khóa lại khi phục hồi. | Mất điện ở trạng thái nhả; khởi động lại cấp RUN dù chưa khóa; dùng lệnh xung thay chứng cứ vị trí. |
| Motor/servo kéo chốt có giữ cơ độc lập | Có điều khiển hành trình; cần driver/PWM hoặc bus, feedback, dòng khởi động/stall và cơ cấu không trôi khi mất rail. | Servo mất nguồn trôi khỏi vị trí giữ; MCU treo giữ lệnh nhả; stall làm sense thấy OFF giả. |
| Khóa cơ thụ động, điện chỉ cấp quyền | Có thể giảm điện giữ; cần chứng minh hình học bắt buộc RUN→OFF→PROGRAM, mất bias vẫn khóa, không thể đi vòng qua gá lệch/thao tác sai. | Có thể rút trước cách ly hoặc mất bias tự mở; đèn/lệnh OFF bị xem là khóa vật lý. |

Ứng viên lab Adafruit2776 không phải BOM sản phẩm. [Trang hãng Adafruit2776, Technical Details](https://www.adafruit.com/product/2776) công bố5 V,1,1 A và4,5 Ω±5%; trang HTML không cung cấp revision/trang PDF hay đủ cận force–stroke/duty/nhiệt. Hai chiếc ở số công bố tương đương2,2 A/11 W tại5 V (phép tính tải danh nghĩa, chưa gồm driver), vượt allocation tổng RUN0,50 A. Nếu dùng nhánh boost riêng vẫn phải tính pack/boost/sag/nhiệt/shared-fault; nguồn MeanWell lab riêng không chứng minh sản phẩm pin đáp ứng.

Bảng tải sản phẩm phải có B01/joystick/LED/sense/reset/logic/driver/actuator/feedback, phân biệt tải nằm trong RUN0,50 A hay auxiliary20 mA để tránh đếm đôi. Mỗi tải cần min/max rail, peak/hold/stall, duty, thời gian đồng thời, nguồn cấp, efficiency theo góc, inrush và năng lượng dập. Các ô actuator đều TBD. Lực giữ, lực thao tác, hành trình, kích thước vỏ, thời gian nhả và service release TBD; Founder quyết nhóm cơ cấu và trade-off sản phẩm trước lựa chọn MPN.

**Còn thiếu để Box08 xét PASS/FAIL:** loại sản phẩm, budget đầy đủ, force–stroke/duty/nhiệt, phản hồi vị trí, fault matrix và cận release/backfeed trên đúng cụm. Không có kết quả bench; gate tiếp tục OPEN.

## 4. D17-H3-CV-PROTECTION

Tiêu chí JSON nguyên văn: “PASS khi phương án CV/bảo vệ có căn cứ và được review phù hợp giới hạn pack; FAIL nếu suy PCM là giới hạn sạc cho phép, thiếu cận hoặc chưa được review.”

[Microchip MCP73833/4 DS20002005C, copyright2009–2025](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf), tr.3: VREG4,168–4,232 V ở VDD5,2 V,IOUT10 mA,TA−5…55°C; option FCI4,20 V ở tr.27. Jauch Rev1.2 tr.2 chỉ ghi charge4,2 V, chưa cho positive tolerance. **Cận trên tại điểm kiểm đã hơn32 mV**; đây là xung đột cần giải quyết, không phải proof charger luôn ở4,232 V. PCM detect thấp nhất4,23 V không cho phép sạc trên giới hạn vận hành và không bảo đảm hoàn thành sạc. Full envelope line/load/nhiệt/transient còn thiếu.

**Phản ví dụ H-A/C06 F4:** `4,232−(4,28−0,05)=0,002 V=2 mV`. Cận VREG cao và PCM detect thấp có chồng lấn có điều kiện, nên không có margin dương bảo đảm tránh PCM ngắt khi đang sạc ở góc cao. Đây là phân tích worst-case tài liệu, chưa phải quan sát PCM đã trip hay chứng minh một mẫu chắc chắn trip; delay PCM, tải/sụt áp/nhiệt/profile thật còn TBD. Không dùng PCM để mở rộng giới hạn charge4,2 V của pack.

| Phương án so sánh lịch sử A10 — H-C đã chọn hướng, chưa MPN | Tài nguyên / ưu nhược | Phản ví dụ FAIL |
|---|---|---|
| H-A giữ FCI và Jauch, bổ sung căn cứ pack | Ít thay vật liệu nhưng cần tài liệu Jauch xác nhận CV/overshoot thực và envelope charger tương thích. | Coi4,2 V nominal hoặc PCM4,23–4,33 V là cửa sổ sạc được phép. |
| H-B giữ FCI, thêm bảo vệ độc lập | Comparator/reference/sense độc lập, phần tử ngắt sạc hai chiều và latch TBD; tăng bias/leakage/nhiệt và complexity. | Vtrip,max+overshoot+sai số>Vpack,allowed,max; lỗi chung reference/sense hoặc switch stuck-on; nuisance trip trong CV bình thường. Chưa có cửa sổ số hợp lệ. |
| H-C charger/setpoint khác | MPN TBD, có thể giảm CV envelope; cần tính lại termination/recharge/timer/NTC/nhiệt và product impact. | Tưởng RPROG FCI điều chỉnh CV; đổi IC mà chưa có cận upper CV hoặc phá profile pack. |
| H-D pack khác có hồ sơ phù hợp | MPN TBD; cần Founder đổi Q3, cơ khí/connector/nguồn/chứng nhận. | Dùng spec pack khác cho Jauch hoặc tự đổi Q3. |

Cần khóa `CV_total=setpoint+tolerance+line/load+drift+sensing/drop+transient`; `USB_total=Icharge,max+IC/LED/bias/protection+inrush`; `Plinear,max=(Vcharge_input,max−Vbattery,min)×Icharge,max`, bao góc CC/lỗi kéo dài. Tải rút từ battery khi sạc có thể ảnh hưởng kết thúc theo dòng. Dòng chính xác với RPROG2,49 kΩ±1% còn cần đặc tả đủ điều kiện; mục tiêu0,40 A là quyết định kế thừa, không ngoại suy dải guaranteed từ điểm R khác.

DS20002005C tr.13 mô tả system-test LDO: pack vắng không có nghĩa VBAT không được cấp. Tr.14 có đường diode PG về input; phải tính backfeed khi thêm pull-up. NTC open/short/pack vắng/PCM mở phải có state/fault analysis, không dùng NTC10k/B3435 từ pack khác cho Jauch. NTC R–T, timer, termination và dữ liệu Jauch hoãn theo D10 vẫn TBD, nhưng D10 không miễn proof tương thích CV/bảo vệ.

**Còn thiếu để Box08 xét PASS/FAIL:** charge-voltage tolerance/transient được phép của đúng pack, full charger envelope, cửa sổ trip có cận, độc lập sense/reference/ngắt, nguồn USB/thermal/leakage/termination và fault coverage. P0-06 đã chọn hướng H-C; H-A/B/D chưa chọn, MPN/setpoint vẫn cần Founder duyệt. Phân tích FCI ở trên là lý do loại hướng hiện tại, không là đặc tả charger mới. Gate tiếp tục OPEN.

## 5. MCU-RESET-VETO-RESOURCES

Tiêu chí JSON nguyên văn: “PASS only after independent review of resource feasibility and bounded default isolation/reset/panic/watchdog veto, including retained driven GPIO and loss of bias; FAIL if any path is unbounded or can re-enable without fresh permission. Missing design evidence remains OPEN, not PASS.”

Theo contract §§2/6 và C01, **18/18 GPIO còn lại đã dùng trong robot r7 tham chiếu theo chính sách loại chân hiện hành**. Đây không phải bằng chứng tay cầm đã hết18 GPIO. E1–E4 là nhu cầu mở rộng logic UNASSIGNED, không phải chân rảnh dự trữ. Đếm tài nguyên riêng cho handset và robot phải giữ đúng nguồn; gate audio robot không được chuyển sang handset.

### 5.1 Tài nguyên riêng tay cầm — inventory, không gán chân mới

Target vẫn là mẫu B01 classic ESP32 30 chân USB-C họ CH340; exact module/silicon/memory và net clone chưa xác minh. Theo [r7 §2.2 dòng113–123](claude-support/2026-11-06-pcb-status/final/kicad-input-spec-r7.md:113) và [contract §3](mobot-v2-esp32-mcu-contract.md:161), tham chiếu tay cầm dùng đúng **5 GPIO**:

| Tín hiệu tham chiếu đã dùng | GPIO | Giới hạn |
|---|---|---|
| JOY_X | 34 | ADC1 input-only, không pull nội |
| JOY_Y | 35 | ADC1 input-only, không pull nội |
| JOY_SW | 32 | Digital input; pull/debounce theo giao diện |
| BTN1 | 33 | Digital input |
| BTN2 | 25 | Digital input; không đọc ADC2 nên không suy tranh chấp ADC2/Wi-Fi |

Nguồn pool: [phiên chép nhãn ảnh dòng23–26](evidence/esp32-devkit-v1-type-c-sample.md:23) có25 nhãn GPIO trên30 vị trí; VIN/3V3/hai GND/EN không tính GPIO. Policy contract loại7 GPIO có nhãn header:1,2,3,5,12,14,15; còn18 vị trí tham chiếu. GPIO0 bị loại nhưng không ở header nên không trừ lần nữa; GPIO6–11 flash và37/38 không có ở header cũng không thêm vào pool. Sau5 vị trí tham chiếu đã dùng còn**13 vị trí chưa dùng**, chưa là chân được duyệt:

| Nhóm chưa dùng trong inventory handset | GPIO | Số lượng |
|---|---|---:|
| Input-only, không pull nội | 36/VP,39/VN | 2 |
| Có khả năng output theo silicon tham chiếu, chưa assignment | 4,13,18,19,21,22,23,26,27 | 9 |
| Output-capable conditional module/memory | 16/RX2,17/TX2 | 2 |

11 vị trí không mang điều kiện memory16/17 cộng2 conditional bằng13; tất cả vẫn cần review clone/default/boot/nguồn. GPIO13 còn JTAG MTCK; GPIO4 có pull-down nội. GPIO14 bị loại do policy, không gọi là strap. Bảng này không xác nhận continuity hoặc tính khả thi allocation đã hoàn tất.

Nhu cầu logic mới cho handset gồm RUN permission nếu dùng MCU; veto độc lập khi reset/panic/watchdog/hang; driver giữ/nhả; feedback vị trí/OFF thực/isolation/Source; bus mở rộng và E1–E4: **đều UNASSIGNED** về cơ chế, số kênh và tài nguyên. Một signal không mặc nhiên cần một GPIO riêng, nhưng không được bỏ feedback bằng cách coi command là observation. R7 handset chưa phân SDA/SCL; I2C21/22/U14 “có sẵn” ở bảng robot không phải bus handset đã được cấp.

**Applicability:** yêu cầu thu hồi quyền và cách ly độc lập áp dụng chức năng cho tay cầm. Các tên MCU_MOT_EN,OE_N/GPIO4,U9,MOTOR_EN,nSLEEP và bus21/22 trong scope/contract gốc là ví dụ **robot**, không chứng minh handset có những net đó. R9 trong P0-06 đã làm rõ wording scope theo handset, giữ nghĩa vụ và không chuyển/xóa gate; topology/MPN/GPIO cụ thể vẫn TBD. Cận nSLEEP bên dưới chỉ tham chiếu robot, không được dùng để ký gate handset; phần tử isolation/actuator thực handset cần cận riêng.

### 5.2 Các hướng C01 và điều kiện reset/veto

| Hướng C01 so sánh lịch sử — P0-06 chọn chốt/logic, không expander hoặc nới policy | Tài nguyên / điều kiện | Phản ví dụ FAIL |
|---|---|---|
| Chia sẻ enable MCU_MOT_EN/OE_N bằng chốt/logic phần cứng | Có thể tránh GPIO mới nhưng cần ưu tiên veto/reset độc lập; phân biệt motor, IO isolation và audio; feedback trạng thái thật và chống glitch. | AND/pull-down không thắng GPIO đang drive HIGH; cùng enable làm mở audio hoặc IO ngoài quyền. |
| Expander I2C | Robot có bus tham chiếu; handset cần tạo/phân bổ bus sau review, chưa chọn SDA/SCL. Thêm địa chỉ, pull-up/tải bus, rail và default state; veto không cần giao dịch I2C. Part/MPN/reset pin/timing TBD. | SDA/SCL kẹt hoặc MCU treo khiến latch expander tiếp tục ON; không gửi OFF được. |
| Xem lại chân đang loại theo chính sách r7 | Cần review exact module/strap/boot/UART/JTAG và tính mất chức năng debug; thay cấu hình trước assignment. GPIO14 bị loại theo policy r7, không gọi là strap; GPIO16/17 còn conditional module/memory. | Làm lệch strap, xung ROM boot tác động tải, xung đột UART/debug; thêm chân vẫn không giải quyết veto độc lập. |

P0-06 đã chọn hướng chốt/logic phần cứng; chưa gán GPIO hoặc chọn part. Reset/panic/watchdog/hang phải thu hồi quyền kể cả GPIO/peripheral giữ HIGH. Supervisor chỉ thấy rail tốt không chứng minh CPU không treo. EN LOW/boot/download mặc định cách ly; brownout từng miền, CHARGE và mất bias phải veto trước khi control ra ngoài cận. Phục hồi cần quyền RUN mới. Reset tay cầm cũng không chứng minh robot đã dừng.

Đường nSLEEP dưới đây là **robot r7 lịch sử** để kiểm khả thi tài nguyên, không phải topology handset mới: MCU→SN74LVC1G11 (U9, V3V3_DEV)→MOTOR_EN→DRV8833.nSLEEP/TPS63070.EN/R48. [DRV8833 SLVSAR1E RevE §6.5 tr.6](https://www.ti.com/lit/ds/symlink/drv8833.pdf): nSLEEP LOW≤0,5 V, HIGH≥2,5 V. [SN74LVC1G11 RevI §5.3 tr.4 và §5.5 tr.5](https://www.ti.com/lit/ds/symlink/sn74lvc1g11.pdf): VIH2,0 V tại VCC3,0–3,6 V;1,7 V chỉ tại2,3–2,7 V; VOH≥VCC−0,1 V ở−100 µA. VOH2,4/2,3 V tại tải lớn/VCC3 V không đủ nSLEEP2,5 V. [ESP32 Series v5.3 §5.3 bảng5-3 tr.52](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf): VOH≥0,8VDD trong điều kiện bảng; không mở rộng sang mọi góc nhiệt/áp.

Cần chứng minh `VOH_MCU,min−VIH_U9−ΔV1>0` và `VOH_U9,min−2,5−ΔV2>0`. Ví dụ contract tại3,3 V cho0,64/0,70 V trướcΔV, chưa là PASS. Tổng tải phải gồm R48, nSLEEP, EN converter, leakage và động; ví dụ `3,3/99k+13µA=46,33µA` chỉ ở đúng điều kiện contract, không extrapolate cận dòng nSLEEP. GPIO4 At Reset có pull-down nội; OE_N pull-up ngoài cần chứng minh VIH qua chia áp/leakage/mất rail, không coi oe=0 là đang drive LOW. Nguồn reset IO_MUX: ESP32 Series v5.3 Appendix A.4 tr.69 và Notes tr.62, theo contract.

**Còn thiếu để Box08 xét PASS/FAIL:** fault model và đường phát hiện reset/hang, logic/chốt exact part, rail min/max, cận bias/pull/leakage/VOH/VIH/tải, thời gian detect→isolate→power-off, chống auto-enable và ngân sách tài nguyên riêng từng carrier. Part/time/ΔV thiếu giữ TBD. Phải xét chung nguồn/reset/GND và driver stuck-on, không coi hai kênh cùng phụ thuộc một bias là độc lập. Gate tiếp tục OPEN.

## 6. Bàn giao Box 08 và quyết định còn thiếu

### Bằng chứng nguồn bổ sung C06 F1

Bốn PDF hãng đúng revision đã lưu nguyên bản trong `D:/StartupOS/docs/agents/runs/MM-HW-P0-05/attempt-2/sources/`; `source-manifest.json` ghi URL yêu cầu/URL sau redirect, thời điểm tải UTC, SHA-256 và số trang. `source-excerpts-addendum.txt` trích layout nguyên trang, kèm tên file/trang để reviewer kiểm cột MIN/TYP/MAX offline. Các trang in sau khớp thứ tự PDF tính từ1:

| PDF local | Revision | Trang evidence |
|---|---|---|
| mcp73833-ds20002005c.pdf | Microchip DS20002005C | 3:VREG/điều kiện;4:current/THERM;13:LDO;14:PG diode;27:FCI |
| drv8833-slvsar1e.pdf | TI SLVSAR1E July2015 | 6:logic nSLEEP và dòng, bảng TA25°C trừ ghi riêng |
| sn74lvc1g11-revi.pdf | TI SCES487I November2024 | 4:VIH;5:VOH/tải/nhiệt độ |
| esp32-series-v5.3.pdf | Espressif Series v5.3 | 52:DC3,3V/25°C;62:pin notes;69:IO_MUX/reset |

Các cận trong §§4/5 đã đối chiếu bytes local; không mở rộng điều kiện bảng. Ảnh/nhãn header chỉ là inventory tham chiếu. PDF gốc và excerpt bổ sung không thay bằng chứng thiết kế topology hoặc bench.

Box08 nhận đúng hash hồ sơ và input snapshot, đánh giá độc lập từng gate; trả `PASS`, `changes_requested` hoặc `insufficient_evidence` kèm nguồn/cận và phạm vi. R9 được tạo theo xác nhận Founder trong P0-06, không phải theo quyền tự quyết từ review tư vấn. Gate vận hành OFF-ASSEMBLY, traceability/BOM, FAB/layout và14verification items vẫn giữ mốc riêng.

C03 F1/F2 về typed stage và required_gate_ids vẫn là hạng mục preflight trước B1; A10 không sửa validator hay âm thầm đóng các finding đó. Sau A10 còn cần xử lý preflight hardening, Box 08 review, Founder duyệt hash cấu hình riêng và kiểm dispatch trước khi xem xét lease. Duyệt hash không tự đóng gate.

Founder đã chọn nhóm cơ cấu và hướng tài nguyên MCU trong P0-06. Phần còn cần duyệt riêng là MPN actuator/charger, chi tiết có thay vật liệu hoặc Q1–Q8, sau khi có cận. Hồ sơ dừng chờ REVIEW_RESULT; không có mua hàng, flash, cấp điện hoặc KiCad.

## 7. Hướng Founder đã chọn và FMEA khóa thụ động

Nguồn thẩm quyền: xác nhận trực tiếp trong HQ và [biên bản P0-06](mobot-v2-founder-decision-q1-q8.md#p0-06). Hướng hiện hành: actuator là **khóa cơ thụ động, điện chỉ cấp quyền**; OFF giữ **O-A + O-C**, không O-B; H3 chọn **H-C**, giữ Jauch; MCU dùng **chốt/logic phần cứng** từ pool13tham chiếu chưa dùng, không expander I2C, không nới policy r7, chưa gán GPIO. MPN chưa chọn; spring-return chỉ là phương án lùi sau khi không chứng minh được hình học và đã dừng/báo Founder.

R9 thêm `stage` thuộc schematic/layout/bom/operation và `required_gate_ids`. Schematic giữ4gate; layout thêm FAB; BOM/operation giữ các mốc riêng. Đây là metadata chờ validator thực thi, không tự đóng C03 F1/F2: cần trusted baseline chống xóa gate, enum exact, và review evidence cho PASS trong task validator riêng. Registry approval hiện hành vẫn trỏ r8proposed; r9 chưa đăng ký làm cấu hình build hoặc được duyệt hash.

| Lỗi/kịch bản khóa cơ thụ động | Thuộc tính phải chứng minh | Phản ví dụ FAIL / cận còn thiếu |
|---|---|---|
| RUN→OFF→PROGRAM bình thường | Hình học ngăn PROGRAM/rút RUN tới khi OFF thực đã qualification và cấp quyền nhả | Chốt chỉ theo lệnh OFF, VBUS/IO còn dẫn; hành trình/thứ tự/timing TBD |
| Mất bias/brownout/hồi nguồn | Vẫn khóa, cách ly giữ; hồi không tự cấp RUN/nhả | Lực giữ cần điện liên tục hoặc reset mở chốt; rail/default bounds TBD |
| Gá/phích lệch, cắm nửa | Không đi vòng retention/interlock, feedback từ chối trạng thái mơ hồ | Feedback báo khóa dù chưa đủ ăn khớp; dung sai/cơ khí/lực TBD |
| Thao tác sai/service release | Không tiếp cận bypass khi pack/PC/CHARGE còn có thể cấp rail | Rút pack được xem là đủ trong khi PC vẫn cấp; đường thao tác/rail residual TBD |
| Driver kẹt cấp quyền | Ràng buộc cơ độc lập vẫn chặn chuyển tiếp sai hoặc chặn RUN trước nguy hiểm | Một transistor cấp đồng thời toàn quyền nhả; topology/channel/current TBD |
| Feedback kẹt ở trạng thái khóa | Không suy command là position, có coverage lỗi/plausibility | Một sense chung hỏng báo vị trí hợp lệ; sensor geometry/timing TBD |
| Nguồn/GND/reset/sense lỗi chung | Chỉ rõ điểm lỗi chung, bias mất không cho nhả | Hai kênh mất chung return/reference vẫn cùng báo đúng; independence TBD |
| Mòn/biến dạng/kẹt/gãy | Giữ/nhả đúng qua dung sai và tuổi thọ dự kiến | Ngàm gãy khi RUN cho phép rút sớm; vật liệu/force/stroke/cycles TBD |

Không có đo nào đã chạy. Phần điện permission/chốt/feedback phải tính vào budget auxiliary hoặc nhánh nguồn thực, không giả khóa thụ động đồng nghĩa zero current. Cần cận detect→veto→isolate→source-off→qualification→nhả, độc lập với GPIO retainedHIGH. Dossier chưa là thiết kế đóng gate.

Bảng sạc mới tại [P0-06 charger candidates](mobot-v2-p0-06-handset-charger-candidates.md): BQ25185/BQ25186 mới đạt screening accuracy dưới PCMmin với9mV số học; timer6h của BQ25185 là hạn chế chưa đóng. Cận4,221V vẫn hơn charge4,2V của Jauch và chưa có transient/profile proof. Vì chưa chốt MPN/setpoint, hash r9 đóng băng cho review hiện tại; quyết định vật liệu tương lai cần revision tiếp theo, không sửa âm thầm bytes r9 đã trình.
