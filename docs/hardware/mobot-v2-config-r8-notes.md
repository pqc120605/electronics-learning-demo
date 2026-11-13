# MoBot V2 · Ghi chú cấu hình Type-C r8

Nguồn quyết định là [biên bản Founder 07/11](mobot-v2-founder-decision-q1-q8.md). Box 02 rà nguồn/USB, Box 03 rà ảnh/BOM. Cả hai trả handoff chỉ đọc cho HQ. Q6/Q7 nằm ngoài xác nhận này. Giữ thứ tự và phụ thuộc KiCad hiện hành.

## B01 cho cả hai carrier

| Mã | Cách dùng trong r8 |
|---|---|
| 02030089 | Beetrona, ứng viên nguồn hàng USB-C CH340 30 chân. Chưa đối chiếu được PCBA với ảnh. |
| EP000723 | EasyWare, tham chiếu USB-C/CH340C. Kích thước ≈51,5 × 28 mm chỉ là ước lượng của listing, chưa xác minh cho mẫu. |
| HH004223 | Biến thể USB-C CP2102 trong BOM cũ. Không dùng thay trực tiếp. |
| WRL-20168 | SparkFun thuộc cấu hình lịch sử. Không đưa vào BOM r8. |

[Hồ sơ ảnh mẫu](evidence/esp32-devkit-v1-type-c-sample.md) là mốc đối chiếu B01. Khi xác lập BOM giao hàng cần truy xuất đúng PCBA/revision. Phương án gá rời của tay cầm giảm phụ thuộc hình học DevKit. Đầu vào cơ khí vẫn cần đối chiếu pitch, khoảng cách và lệch hàng, chiều cắm, outline, chiều cao, lỗ gá, độ nhô USB-C, khoảng hở cáp và vùng anten. Mọi kích thước và điện nội bộ của mẫu là ước lượng, chưa xác minh.

## Kiểm chứng D10

Theo D15(a), cấu hình hiện hành đã tách thành [JSON tay cầm r8](../mission-control/hardware-config-mobot-v2-typec-r8-handset.json) và [JSON robot r8](../mission-control/hardware-config-mobot-v2-typec-r8-robot.json). JSON gộp cũ là hồ sơ lịch sử. Hai proposal theo dõi sáu nhóm USB, UVLO, VM, nhiệt, ADC và bo clone theo carrier áp dụng. Mỗi mục có tiêu chí PASS/FAIL, người phụ trách và thời điểm. Mọi số đo là TBD và kết quả NOT_RUN. Box 08 rà từng mục và cận định lượng trước layout. Riêng Q2-A phải theo dõi phép thử C-to-C cả hai chiều cắm. Rd 5,1 kΩ trên từng CC là tham chiếu danh nghĩa, còn termination thực của mẫu chưa biết.

Hai ca `B01-C2C-A` và `B01-C2C-B` được theo dõi riêng trong JSON. P0 chuẩn bị hồ sơ. P1 kiểm attach, VBUS và boot theo từng chiều khi có mẫu và quyền cấp điện. PROGRAM/Web Serial kiểm riêng. Một chiều FAIL thì chuyển Founder xử lý Q2-A.

| D10 | Đầu vào nghiệm thu cần khóa |
|---|---|
| USB | Box 02 tách dòng, inrush, sụt áp và reset theo RUN, PROGRAM và CHARGE. Ngân sách nhánh 5 V tay cầm 0,50 A từ r6 cần rà lại với tải r8. Robot giữ chính sách R5 theo r7. |
| UVLO | Box 02 khóa ngưỡng cắt/hồi, hysteresis, nhiệt độ, nội trở và tải xung riêng từng carrier. Mốc dừng tải 3,20 V của r6 là căn cứ rà tay cầm. |
| VM | Box 02 khóa cận VM và từng rail converter theo trạng thái, cận dòng/xung/năng lượng/điện tích/nhiệt, kể cả mất bias hoặc mất đường hồi về pack. |
| Nhiệt | Box 02 khóa giới hạn tuyệt đối linh kiện và bề mặt. Box 03 khóa môi trường, vỏ, thông gió, tư thế, điểm đo và chu kỳ tải từng carrier. |
| ADC | Box 02 khóa dải, sai số và settling theo đúng joystick/B01 và tải radio. |
| Clone | Box 03 khóa mặt chuẩn, bao lắp, dung sai, khoảng hở USB/anten. Box 02 khóa giả định điện có cận theo từng carrier. Kiểm trên đúng mẫu/revision. |

HQ ghi tên người đo khi có người được chỉ định và quyền phù hợp. Cận chưa khóa giữ mở; giá trị đo vẫn TBD và trạng thái NOT_RUN. Box 08 review từng mục trước layout.

JSON tách riêng các điều kiện còn mở cho RUN/veto/cách ly tay cầm, giao diện và BOM, Jauch/H3, stackup/DRC và robot R1–R6. Box 02 và 03 đã xác định điều kiện đóng, nhưng các bằng chứng cần thiết chưa đủ để đóng toàn bộ. Q6/Q7 và phụ thuộc tay cầm trước robot giữ theo queue hiện hành. Việc chấp nhận đo sau PCB theo D10 chỉ áp dụng cho sáu nhóm đã ký.

## Đối chiếu tài liệu cho vòng đóng P0-02

- **Jauch 250832.** Rev. 1.2 xác nhận 1S1P, sạc CC/CV 4,2 V, dòng chuẩn 1,25 A, dòng tối đa công bố 2,50 A và dải nhiệt sạc 0–45 °C. H3 qua sàng lọc về dòng theo hồ sơ trước. Chưa khóa cận dung sai CV, termination/timer, R–T và dung sai NTC hoặc thứ tự cực theo mặt ghép. Ngưỡng bảo vệ quá áp PCM không dùng làm cận CV của bộ sạc. [Datasheet Jauch Rev. 1.2](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf) · [Review H3](mobot-v2-handset-wrl20168-jauch250832-verification.md).
- **Stackup tham chiếu.** Có cấu hình 4 lớp 1,6 mm công khai, đồng ngoài 35 µm và đồng trong 15,2 µm trong bảng tương ứng. Dùng làm điểm xuất phát so sánh khả năng gia công. Stackup/DRC sản phẩm cần khóa với yêu cầu đường hồi, dòng, nhiệt, package và vùng chừa của từng carrier. [JLCPCB stackup](https://jlcpcb.com/impedance) · [Khả năng gia công PCB cứng](https://jlcpcb.com/capabilities/pcb-capabilities/).
- **Q2-A.** Khi lập phiếu P1, đổi chiều đầu cắm tại B01 và giữ cố định đầu phía nguồn. Ghi mẫu, cáp, nguồn và trace riêng. Hai kết quả vẫn NOT_RUN.

Các mốc kỹ thuật trong JSON dùng để theo dõi từng hạng mục. Cấu hình chung chỉ trình duyệt khi toàn bộ `blocking_unknowns` đã đóng.

### Bàn giao Box 02 và 03

| Trạng thái | Hợp đồng tay cầm để review |
|---|---|
| RUN | Pack hợp lệ, CHARGE vắng, đúng cáp tại B01 và có lệnh mới. Chỉ mở I/O sau attach, VBUS hợp lệ và cả hai rail ổn định. |
| PROGRAM | PC cấp B01 qua USB-C onboard. RUN OUT, I/O và nguồn joystick tắt. |
| CHARGE hoặc PROGRAM + CHARGE | Veto lấy VBUS trước charger, cách ly I/O rồi tắt RUN và xóa quyền RUN. Nếu PC cấp riêng B01 thì PROGRAM có thể tiếp tục. |
| Mất bias, lỗi sense, mất attach, đổi cáp | Mặc định tắt bằng phần cứng. Hai vòng sense phát hiện bất đồng. Chỉ cho phép I/O lại sau kiểm rail dư và lệnh RUN mới. |

Cần chứng minh biên nhả từng tiếp điểm trên đúng cụm khi kênh kia kẹt, kể cả khi PC cấp B01 còn RUN OUT gặp một sink khác. Cần tính cận xả rail qua veto và mất bias. Ngân sách 0,50 A của nhánh 5 V không dùng làm giới hạn lấy dòng host. [Kiến trúc RUN](mobot-v2-handset-b01-architecture-v1.md) · [RUN sense](mobot-v2-handset-b01-run-sense-review.md) · [TI TPS25810](https://www.ti.com/lit/ds/symlink/tps25810.pdf).

- **Jauch/H3.** Dải dòng sàng lọc 0,358–0,446 A đạt cận dòng công bố. Cần hồ sơ pack để đối chiếu CV, timer/termination, NTC và cực tính. XH 3 cực bước 2,50 mm là tham chiếu mặt ghép; cần xác minh ánh xạ dây. [JST XH](https://www.jst-mfg.com/product/pdf/eng/eXH.pdf) · [MCP73833](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf).
- **Gá và PCB.** Box 03 đề xuất GH 12 cực cho 11 dây phía carrier, bao lắp tham chiếu 55 × 32 × 20 mm cho thân B01, tách vùng cáp và anten. Stackup tham chiếu JLC04161H-3313A. DRC đề xuất 0,15/0,15 mm trace/space, lỗ/pad via 0,30/0,60 mm và cách mép phay 0,30 mm. Các giá trị này chờ kiểm điện, nhiệt, footprint và lắp mẫu. [Bó dây](mobot-v2-handset-b01-harness-closure-review.md) · [Stackup tham chiếu](https://jlcpcb.com/impedance).
- **Nhiệt.** Đề xuất điều kiện môi trường 25 ± 2 °C và 35 ± 2 °C trong vỏ PETG đóng. Chờ khóa thông gió, tải, thời gian ổn định và cận nhiệt linh kiện/bề mặt. Pack Jauch khi sạc phải nằm trong dải hãng, tính cả sai số đo.
- **Robot.** R1 giữ quyết định RISEN và R5 giữ chính sách sạc theo CC của r7. BT-R1a hoặc bằng chứng đúng cụm, phát hiện kẹt, cận hấp thụ VM, CE/veto và cách ly Type-C vẫn mở. Hồ sơ B04 hiện chỉ có dữ liệu sàng lọc từ nhà bán. Q7 cần hồ sơ hãng đúng pack hoặc Founder quyết định phương án khác. [Cấu hình r7](mobot-v2-config-2026-11-05-r7.md) · [BOM B04](mobot-v2-bom-review-2026-11-05-r1.md) · [Cổng VM](mobot-robot-vm-pre-kicad-closure.md).


## Cập nhật có hiệu lực 08/11/2026 — D10 bổ sung và D15(b) MỞ

Mục này ưu tiên các mô tả lịch sử phía trên về việc phải xin hồ sơ Jauch ngay hoặc STACKUP-DRC phải đóng trước hash. Chỉ proposal tay cầm được sửa. Proposal robot không thuộc lượt này. Nguồn quyết định: biên bản Q1–Q8 phần xác nhận bổ sung nguyên văn.

### Số liệu pack được Founder cung cấp

Jauch 250832 Rev1.2 (29/07/2022), trang2: cell LI INR18650JC-26,1s1p; Vnom3,6V; dung lượng typ2600mAh, rated2500mAh tại0,2C/2,75V. CC-CV4,2V, dòng chuẩn1250mA/max2500mA, nhiệt sạc0..45°C. Xả cut2,80V, chuẩn1250mA/max3000mA,-20..60°C.

Trang3: PCM quá sạc detect4,28±0,05V/release4,08±0,05V; quá xả detect2,80±0,10V và release2,80±0,10V; overcurrent6..12A; fusefast7A. Có NTC nhưng không có đặc tuyến. UN38.3 YES và IEC62133-2:2017 YES là thông tin trên datasheet, chưa thay các báo cáo thật. UL1642/UL2054 YES/NO chưa xác định.

Hai câu hỏi hồ sơ còn lưu: ngưỡng nhả quá xả bằng ngưỡng phát hiện có phải lỗi in? YES/NO của UL áp dụng tiêu chuẩn/cell/pack nào? Không tự sửa số hay khẳng định chứng nhận UL.

Termination, timer pack, NTC, xung xả, nội trở, connector, cực tính và kích thước chuyển verification, TBD. Không gán JST XHP-3 từ alternatives thành dữ liệu hãng. Không xin hãng các mục này lúc này theo Founder. Cận CV cho phép chưa nằm trong danh sách bổ sung: giữ phần chưa chứng minh tương thích trong HANDSET-PACK-H3. Bảo vệ ngắn mạch tay cầm phải độc lập với PCM6..12A/fuse7A. UVLO phải vượt2,90V cộng sai số/sag/trễ, không dùng mốc danh nghĩa2,80V làm đủ biên.

### Đối chiếu B01 — không chọn thay Founder

| Mã | Nguồn file:dòng | Mâu thuẫn | Cách áp dụng Q1/Q8 |
|---|---|---|---|
|02030089|mobot-v2-config-r8-notes.md:9|Listing chưa truy xuất tới PCBA ảnh|Ứng viên CH340/USB-C30chân; chưa chọn SKU giao hàng|
|EP000723|evidence/esp32-devkit-v1-type-c-sample.md:30; notes:10|Nhiều biến thể cùng listing, chưa khớp ảnh|Tham chiếu CH340C, kích thước/điện nội bộ ước lượng, không xác minh|
|HH004223|mobot-v2-config-r8-notes.md:11|CP2102 khác họ CH340 Q8|Mã BOM cũ bị loại khỏi lựa chọn hiện hành, không thay thế|
|WRL-20168|mobot-v2-handset-b01-b15-documented-alternatives.md:7; notes:12|Bo SparkFun khác mẫu30chân đã chụp Q1/Q8|Phương án lịch sử, không đưa vào r8|

Không phát hiện SKU trái Q1/Q8 đang được chọn trong JSON tay cầm: board.sku vẫn UNKNOWN. Không khôi phục mã lịch sử. B01-SUPPLY vẫn cần truy xuất hàng dự kiến giao, D10 về đo clone không miễn định danh này.

### Mã cụm fixture

mobot-v2-off-fixture-requirements-r0.md:1 là MOBOT-HANDSET-OFF-FIXTURE-REQ-r0, mã tài liệu yêu cầu; dòng110–112 liệt kê MPN/revision actuator, phích/gá/chốt còn thiếu. mobot-v2-p0-02-interface-fab-proposal-v1.md:41 nói rõ chưa có mã chốt/cáp/mẫuB01. Không tìm thấy mã cụm triển khai hoàn chỉnh. Trạng thái CẦN FOUNDER, không tự đặt mã tài liệu thành mã cụm đã xác định.

### Ngân sách điện toàn tuyến — chưa đủ để đóng CARRIER-INTERFACES

|Nhánh|Điện áp|Dòng typ|Dòng đỉnh/cận|Công thức/tổng/biên và nguồn|
|---|---|---|---|---|
|Pack|3,6Vnom; CC-CV4,2V|TBD theo tải, không dùng dòng thử1250mA làm dòng tay cầm|TBD; maxxả3000mA công bố không thay xung|Ipack=Pout/(Vpack×eta)+Iq; margin=3A−Ipack,max=TBD; JauchRev1.2 trang2|
|Bảo vệ/eFuse|TBD sụt qua phần tử|TBD|TBD Itrip/trễ/SOA|Vdrop=I×Ron; biên trip/tải/xung=TBD; chưa có bản cấu hình thực đủ cận|
|ChargerH3|Đầu vàoTBD; packCC-CV4,2V|Mục tiêu0,40A, quyết địnhH3 (không phải trị số typ hãng)|Cận charger/Thermal=TBD trong bảng toàn tuyến này|0,40A<1,25A chuẩn pack, nhưng chưa chứng minh CV/NTC/profile; JauchRev1.2 trang2. Pheat=(Vin−Vbat)×Ichg|
|Buck-boost RUN|5V là yêu cầu kiến trúc; dung saiTBD|TBD|TBD|Iin=5V×Iout/(Vpack×eta)+Iq; hiệu suất tối thiểu/thermal/SOA=TBD|
|3V3 trên clone|3,3V danh nghĩa, thực tế ước lượng không xác minh|TBD|TBD|Regulator/marking/Ron/giới hạn nhiệt chưa xác minh; không suy IC AMS1117 từ hình dạng|
|ESP32 RF|3,3V tại điều kiện bảng|240mA chỉ typ TX802.11b/1Mbps/+19,5dBm|TBD: bảng không bảo đảm đỉnh|Espressif ESP32 Series Datasheet v5.3 trang52 §5.4 bảng5-4,25°C/TX duty50%; không nhân/dùng làm max toànDevKit|
|Joysticks|TBD theo miềnJOY_VCC|TBD|TBD|I=sum(V/Rpot)+tải khác; Rpot/sốpot/revision=TBD|
|LED|TBD|TBD|TBD|I=(Vrail−Vf)/R; Vf/R/sốLED/duty=TBD|
|Sense/reset/USBbridge và khác|TBD theo từngmiền|TBD|TBD|Cộng Iq,pullup,sense,bridge,actuator; không tính trùng với dòngDevKit|
|Tổng RUN|TBD tại điểm đo từngrail|TBD|TBD|Ptotal=sum(Vrail×Irail)+loss; I3V3=IESP+Ijoy+ILED+Iother; marginrail=Ilimit,min−Itotal,max=TBD|
|Tổng CHARGE|NguồnCHARGE=TBD|TBD|TBD|Iinput=Ichg+Iq+phầnđượcphépchạy; RUN bịveto; không cộng RUN như chế độ đồngthờiđãđượcphép|

Nguồn Espressif: https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf (đọc08/11/2026). Đỉnh Wi-Fi toànbo và sụt áp pack qua tải xung: TBD. DeltaV=Istep×Rdynamic+deltaVtransient; không có cận pack/clone để thay bằng số cứng. Tổng và mọi biên vẫn TBD, không dùng các yêu cầu mua dây/fab đang proposed làm thông số đã đo.

### Cận fab — D15(b) đã MỞ

STACKUP-DRC và cận fab chuyển khỏi blocking_unknowns sang FAB-STACKUP-DRC, cổng trước lease layout, Box08 duyệt từng mục. Không chọn nhà fab, không gán cận mạ trung bình thành tối thiểu. PASS khi hồ sơ option áp dụng, đồng/mạ/via/trace/clearance/package và đường hồi/ngân sách đạt tiêu chí đã review; FAIL nếu thiếu cận hoặc không đáp ứng. Thiếu review phải chặn lease layout.

### Trạng thái bốn đầu vào

|Đầu vào|Trạng thái|
|---|---|
|Mã cụm fixture|CẦN FOUNDER — chỉ có mã tài liệu yêu cầu, chưa có mã/revision cụm thật|
|Ngân sách điện toàn tuyến|CẦN FOUNDER/đầu vào thiết kế — bảng đã lập; tổng/đỉnh/cận cònTBD, chưa đóng hợp đồng điện|
|Cận fab áp dụng|CHUYỂN CỔNG MỐC trước lease layout theo D15(b) MỞ; chưa chọn fab|
|Hồ sơ Jauch/B01|Jauch đúng8nhómthiếu CHUYỂN VERIFICATION; cận CV/protection và truyxuấtB01 vẫn chưa đóng|

P0-02 chưa đạt blocking_unknowns=[]; còn HANDSET-POWER-DESIGN, CARRIER-INTERFACES, B01-SUPPLY, HANDSET-PACK-H3 (phạm vi còn lại). Không hạ các mục ngoài D10 bổ sung để đạt số lượng blocker rỗng.

### Tiếp tục sau xác nhận Founder

Founder trả lời “xác nhận, hãy chạy nốt đi”, sau đó yêu cầu “chạy tiếp task đi”. Vì chưa cung cấp mã cụm hiện hữu, HQ áp dụng lựa chọn cho phép Box02/03 **đề xuất cụm fixture mới trong cấu hình riêng**. Đây là quyền chuẩn bị proposal có linh kiện/revision, không phải xác nhận mã cụm cũ, duyệt hash, chế tạo hoặc vận hành. D10 bổ sung và D15(b) đã ký vẫn có hiệu lực; các mục ngoài phạm vi đó vẫn giữ gate.


## Tích hợp candidate P0-02 v1 sau yêu cầu hoàn thiện của Founder

Hai handoff tại D:/StartupOS/docs/agents/runs/MM-HW-MOBOT-IF-001/p0-closure-candidate/box02-electrical.md và box03-assembly.md là nguồn cho phần handset.candidate_configuration, power_design và whole_path_budget mới trong JSON. Các lựa chọn là proposed, cần review và Founder duyệt hash; không thay thành linh kiện đã đo hay đã chế tạo. Mã MOBOT-HANDSET-OFF-ASM-v1 là mã proposal mới, giải quyết thiếu định danh ứng viên, không xác nhận cụm đã tồn tại.

Hợp đồng điện đề xuất: RUN4,75–5,25V, tổng<=0,50A; bó dây150±10mm<=0,15ohm/đường; hồi<=20mA, lệchGND<=5mV. Với eta yêu cầu>=80% và tải phụ phía pack<=20mA, Ipack phân bổ=(5,25×0,50)/(3,20×0,80)+0,020=1,045390625A, thấp hơn3A công bố1,954609375A. Đây là phân bổ thiết kế có điều kiện, không phải chứng minh xung/nhiệt/hiệu suất thật. Các dòng tải thực B01, joystick, LED, bridge và tải phụ trong bảng trước vẫnTBD; không biến tổng yêu cầu thành số đo hay tự gán dòng từng tải.

Hai actuator Adafruit2776 và nguồn MeanWell ngoài chỉ là candidate cụm kiểm của03. Không đưa dòng cuộn hút vào ngân sách20mA phụ hoặc0,50A RUN, không tự chọn nguồn ngoài cho sản phẩm và không nhận tương đương khi product không dùng cùng cận. Định mức/duty/lỗi chung và chi phí cònOPEN.

OFF đề xuất: hai kênh riêng7,50/10kohm0,1%, ngưỡng thực<0,80V cộng điều kiện cáchly/cấpngược; source-off<=10uA, backfeedkhác<=20uA; Ceff<=100uF; hai bleed10kohm1% mỗi nhánh đủ khi nhánh kia hở. Với Rmax10,1kohm,Iback30uA:Vinf0,303V; từ5,25V xuống0,60V tính khoảng2,84s. Window100ms, timeout4s và source-stop20ms là yêu cầu nghiệm thu mới, không là cận hãng hay kết quả thực. Nếu các ngân sách không đáp ứng thì tính/sửa proposal, không ghi PASS.

Ngưỡng hồi83/10kohm là candidate; biênstart26,391mV/cut42,496mV giữ điều kiện từ handoff. Đỉnh Wi-Fi/sag thực vẫnTBD. H3giữ0,40A và4,20V danh nghĩa; không suy CV4,232V được Jauchcho phép từ PCM4,230V. Bổ sungOVP hoặc đổi profile mới chỉ là hướng nghiên cứu, chưa nhập thành quyết định được duyệt.

Trạng thái hiện tại: định danh candidate cụm đã có; hợp đồng/ngân sách proposal đã có; fab đã chuyển cổng trước lease layout; Jauchmissing đã chuyển đúngverification. Các blocker trước đó giữ tới khi08 phân xử cấpP0-02 dựa trên quyết định Founder thật, không mặc nhiên dùng kết luận ghi chú cũ làm cổng mới. Chưa có phê duyệt hash hay kết quả physical.


### Disposition QA cuối candidate — đính chính mốc P0

Review08 kiểm9/9hash và phân biệt rõ Q2-OFF yêu cầu bằng chứng đúngcụm nhưng KHÔNG tự đặt thời hạn trướcP0/duyệthash. Những mô tả HQ trướcđây áp mốc đó cho mọi bằng chứng thực đã quá chặt, không được dùng làm quyền tạo gate mới. Cấu hình giữ blocker theo D15/D16 hiệnhành tới khi Founder disposition; không xóa bằng cách đổi nghĩa blocking_unknowns.

Hợp đồng RUN/bó dây có thể chốt ở cấp yêu cầu proposal. Toàn sản phẩm vẫn còn ngân sách/nguồn actuator OPEN; các actuator/nguồn lab không được gán thành giải pháp sản phẩm. Cận senseOFF dùng bảo thủ0,72412V khi xét nhánh có ngưỡng tăng tối đa413mV; cộng50mV thành0,77412V, dưới0,80V. Không gán pin; số tính có điều kiện không xác nhận độ phủ lỗi hay nghiệm thu.

Bản disposition duy nhất đề nghị Founder duyệt được lưu tại D:/StartupOS/docs/agents/runs/MM-HW-MOBOT-IF-001/p0-closure-candidate/founder-disposition-proposal.md. Chưa được duyệt, chưa di chuyển bốn blocker sang milestone gates. Đây là điểm dừng quyết định, không phải yêu cầu mở thêm dự án fixture.


## Chốt disposition D17 — 08/11/2026

Founder đã trả lời “ok duyệt” đối với D17, nội dung ghi trong biên bản Q1–Q8. Bốn blocker P0 được chuyển sang sáu milestone_gates OPEN trong JSON: OFF-design, actuator-product và H3-CV/protection trước lease schematic; B01-traceability trước khóa BOM; OFF-assembly trước dùng chuyển mode; fab trước lease layout giữ D15(b).

blocking_unknowns=[] chỉ xác nhận không còn input chặn đóng hồ sơ P0-02 theo D17. Không xác nhận các gate, thiết kế, thông số thực hoặc vật liệu đã đạt/đã được duyệt hash. Tất cả giá trị đo vẫnTBD/NOT_RUN; các trách nhiệm/ngưỡng D10 trước layout và cổng chứng nhận giữ nguyên. Ba gate schematic OPEN nên hai task KiCad không được cấp lease từ lần chốt hồ sơ này.

Trạng thái bốn đầu vào ở cấp P0: mã cụm candidate ĐÃ ĐÓNG định danh proposal (không phải cụm thực); ngân sách/hợp đồng yêu cầu ĐÃ ĐÓNG ở cấp proposal, phần actuator-product vẫnOPEN trước schematic; cận fab CHUYỂN CỔNG MỐC trước layout; Jauchmissing CHUYỂN VERIFICATION, CV/protection sang gate trước schematic, truyxuấtB01 sang gate trước khóaBOM. Các mô tả lịch sử “P0 chưa đạt vì còn bốn blocker” đã được D17 thay thế về mốc, không bị xóa nghĩa vụ.
