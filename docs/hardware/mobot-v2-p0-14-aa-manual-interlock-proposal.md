# P0-14 — Đề xuất 3 AA NiMH, sạc ngoài và liên động thủ công

Ngày 10/11/2026 · trạng thái PROPOSED / nghiên cứu hướng B. Chủ hồ sơ: Codex lead. Đây là hồ sơ kiến trúc và yêu cầu thiết kế; không phải cấu hình được duyệt hoặc chứng cứ phần cứng đạt. Tất cả GPIO UNASSIGNED, đo thật NOT_RUN. Biên nhận nguyên văn: `mobot-v2-p0-14-aa-founder-direction.json`.

## 1. Quyết định đang có và giới hạn

Founder cho phép nghiên cứu 3 AA NiMH tháo rời, sạc ngoài, bỏ sạc Li-ion onboard và actuator nhả cassette có điện. Giữ điều khiển không dây, B01 30 chân USB-C CH340, G-B16/E1–E4, robot riêng, cách ly toàn bộ carrier/B01 trong PROGRAM và mục tiêu toàn bộ robot + tay cầm dưới 1 triệu đồng.

Chưa duyệt cell/MPN/BOM, tiêu chí cổng thay thế, revision/hash mới hoặc B1. Không sửa r12: `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`. Bốn cổng hiện hành vẫn OPEN; 14 verification items giữ nguyên. Không có r13 trong đợt này. Q2/Q3 mới là delta nghiên cứu, không tự khôi phục cấu hình AA lịch sử.

## 2. Kiến trúc tích hợp duy nhất để đánh giá

```text
3 AA NiMH trong cassette tháo rời, có tiếp cận từng cell
  → giới hạn dòng / đảo cực / giám sát từng cell (ứng viên cần khép)
  → nguồn 5 V dạng module + tụ và mạch phụ ở miền carrier
  → cầu PCB cứng captive, hai chỗ ngắt nối tiếp A/B trên mọi conductor
  → B01_EXTERNAL_5V + return + toàn bộ giao diện B01

PROGRAM: cassette đã ra → cầu đã nâng/park → cổng USB PC mới tiếp cận được.
PC chỉ cấp B01; không còn đường dẫn điện carrier↔B01.
```

`B01_EXTERNAL_5V` là vai trò nguồn đề xuất; KHÔNG gán VIN/5V/3V3 hoặc số chân. Cần sửa rõ điều cấm cấp VIN cũ khi trình cấu hình mới, không coi đó là đã duyệt. Không cấp 3V3 trực tiếp. Không còn phích RUN USB nội bộ, dây Y hoặc cổng RUN song song.

Mọi tụ/module/bleed mới nằm carrier. Không thêm tụ khối hoặc mạch phụ trên đảo B01 bằng giả định. Điện nội bộ và USB attach của clone vẫn thuộc phạm vi D10 đã có; không tự đóng hoặc mở rộng D10, và không tạo thêm yêu cầu chứng minh Cmax board-alone trước schematic chỉ bằng việc đổi nguồn carrier. Mọi linh kiện thêm phía B01 phải được khai báo và xét riêng.

### Ma trận conductor ở mức vai trò

| Nhóm | Yêu cầu ở PROGRAM |
|---|---|
| EXT5V, return | Hai chỗ ngắt nối tiếp; không đường nguồn song song |
| 5 role joystick/nút và JOY_VCC | Tách cả tín hiệu, công suất và các pull phụ |
| RUN_REQUEST, FRESH_ARM, WDI, RELEASE | Tách toàn bộ; RELEASE reserved/inactive, không actuator |
| LOCK_POSITION, SECOND_POSITION, SAFETY_STATUS | Tách toàn bộ, không cầu pull-up sang đảo kia |
| E1–E4 | Giữ tài nguyên; đường nào lắp thật đều qua cầu |
| Ground, shield, shell, test/debug/reset | Kiểm kê hết; không vít, spacer, dây phụ hoặc vỏ dẫn điện bypass |
| BAT0…BAT3/tap từng cell | Ở miền pin/carrier; tháo cùng cassette; không tới B01 |

30 vị trí connector là ứng viên kích thước, không phải connector pinout. Chưa chứng minh đủ conductor sau kiểm kê phụ trợ và contact power derating.

## 3. Nguồn hãng đã ghim và mức chứng cứ

Metadata/hash nguyên tệp nằm `docs/research/downloads/p0-14/sources.json`. Lead đã đối chiếu text và ảnh trang 1 FDK/MPD; ảnh trong run `source-pages/`. Bản nguồn công khai được giữ nguyên, không thực thi.

| Ứng viên / nguồn | Dữ liệu có căn cứ | Giới hạn |
|---|---|---|
| FDK HR-3UTG, Data sheet ZKH, tr.1 | 1,2 V nominal; capacity 2000/1900 mAh theo charge190mA×16h, discharge380mA tới1,00V ở20°C; discharge khuyến nghị0–50°C | Hãng ghi các giá trị mô tả performance, không bảo đảm. Không suy OCVmax, dòng ngắn mạch, tuổi thọ hay runtime bảo đảm từ đồ thị/25mΩ typical |
| FDK thông báo27/03/2026 | Có thay đổi vật liệu, phải ghim đúng revision/lot thực mua | Không trộn số của hai revision hoặc cell khác trạng thái |
| Pololu S7V8F5 #2123, specs + schematic ©2014 tr.1 | Module5V, Vin2,7–11,8V theo trang hãng; reference dùng TPS63060 | 500mA–1A/efficiency phụ thuộc điều kiện; chưa có bảo đảm toàn miền của allocation bên dưới; không reverse protection |
| MPD BA3AAW, RevG27/02/2019, tr.1 | 57,48×47,63×16,38mm; dây24AWG80°C; contact resistance UNDER50mΩ cho +/- contacts theo EIA-540J000; PP UL94-HB | Sửa thiếu sót trong advisory đầu: có cận contact R, nhưng không phải rating dòng toàn khay. Không tự hiểu50mΩ là từng contact nội bộ hay nhân6 để chứng minh nhiệt |
| Keystone catalogue Plastic Holders, tr.1–2 | 2464 PC mount /2465 wire leads là3AA;2463 là2AA | Không có rating dòng/độ bền đủ trong catalogue; chưa chọn holder |

Nguồn trực tiếp: [FDK](https://www.fdk.com/product_e/nimh_e/tech_info/HR-3UTG.pdf), [FDK revision notice](https://www.fdk.com/whatsnew-e/release20260327-e.html), [Pololu specs](https://www.pololu.com/product/2123/specs), [reference](https://www.pololu.com/file/0J791/s7v8x-schematic.pdf), [MPD](https://www.batteryholders.com/uploads/parts/BA3AAW/datasheets/BA3AAW-datasheet.pdf), [Keystone](https://www.keyelco.com/pdfs/prod04-plasticholders.pdf).

### Allocation điện — chưa là rating đã đạt

Nguồn RUN cho B01: nominal5V; allocation4,75–5,25V và500mA. Với Pout2,625W, efficiency allocation0,80: Iin0,994318A tại3,3V;1,09375A tại3,0V, chưa cộng mạch phụ. Cần cận module/tải/đường dẫn/derating thật trước khi nhận thiết kế. Không dùng switch-current của IC làm output rating module.

RUN input3,0–5,4V là miền thiết kế đề xuất, không phải cell range đã được hãng bảo đảm. Có thể chọn front-end được bảo vệ trên miền rộng hơn để không cần bịa OCVmax; miền hoạt động, fault và chemistry không hỗ trợ phải tách rõ. Không dùng Li-ion3S BMS cho NiMH3cell.

## 4. Bảo vệ từng cell và năng lượng dư

Pack UVLO không đủ: pack3,30V nhưng hai cell1,45V thì cell thứ ba chỉ0,40V. Cần giám sát từng cell với trip allocation1,10V, cửa sổ1,05–1,15V; pack3,3V/recover3,6V chỉ là allocation phụ. Không thêm MCU GPIO. Phải khép reference/offset/divider/temperature, common-mode, thời gian mất nguồn, tap-open, tap-short, cả pack đảo và một cell đảo, dòng vòng khi fuse mở, startup default và latch inhibit. Chưa có IC/module được chọn hoặc ngưỡng được chứng minh.

**Holder hai dây không tự cung cấp BAT1/BAT2.** MPD/Keystone catalogue chỉ xác nhận holder series; không coi sửa khay/hàn tap là đã có cấu hình được duyệt. Cần cassette có điểm lấy từng cell và current limit sát nguồn từng nhánh, hoặc ba holder đơn với topology được review; lựa chọn vẫn đề xuất, không mua/chế tạo.

Tụ ở carrier vẫn tích năng lượng sau tháo pin. Ví dụ có điều kiện Ceff≤100µF,V≤5,25V cho1,378125mJ; nếu1mF là13,78125mJ. Hai bleed10kΩ±1%, một hở, Rmax10,1kΩ: đến0,8V mất1,900185s nếu không injection; với10µA injection là2,016876s và plateau0,101V. Script `check-evidence.py` tái lập. Đây không là Cmax module thật, không là ngưỡng an toàn đã duyệt, không phải thời gian chờ mà người dùng được coi luôn thực hiện.

Khoảng hở đã được chứng minh có thể loại carrier khỏi đường USB mà không cần tuyên bố carrier0V. Tuy nhiên contact còn tích điện phải được che, không bị chập khi nâng/park; cần Cmax/Vmax/Imax thật và acceptance năng lượng/phóng điện cho vùng đó. Mọi contact tap phải ra cùng cassette; không cho đường sense bắc qua fuse hoặc island mà chưa tính dòng.

## 5. Liên động M2 — thao tác và tiêu chí hình học

Hai đầu cầu A/B là hai chỗ ngắt nối tiếp trên **mỗi** conductor, guide độc lập, không terminal chung hoặc dây mềm vắt qua hai gap. Housing position không đủ phát hiện terminal bị kéo theo; một lỗi terminal ở A phải còn ngắt B thật, và ngược lại.

| Pha | Allocation bắt buộc |
|---|---|
| RUN, cassette còn lắp | Tab cassette chặn camq=0 |
| Rút cassette | Mọi nguồn/tap hết dẫn trước b=6mm; tab còn chặn tới b≥12mm |
| q0…14mm | Nâng cả hai đầu; cửa USB vẫn khóa |
| q14…22mm | Park; endpoint blockers thực ở cả A và B mới cho nhả cửa |
| q22…30mm | Mở hai cửa USB độc lập |
| PROGRAM | Cầu bị giữ park, chặn cassette; PC cấp B01 độc lập |
| Trở về | Cổng phải rỗng và hai cửa đóng thật trước hạ cầu; cassette lắp cuối |

Mỗi gap: hmin−Lconductive,max−δrelative,max≥2mm. Allocation12mm nominal,11,8mm min,δmax0,2mm → Lconductive,max≤9,6mm. Đây là yêu cầu sàng lọc mating pair, chưa phải kích thước connector đã chứng minh. Hai cửa đều phải phụ thuộc endpoint A và B; không lấy vị trí tay cam làm chứng cứ. Hai đường giữ100N vận hành/200N proof mỗi đường và100N mỗi nút nhả vẫn là yêu cầu phân tích, chưa đạt.

Ứng viên Hirose DF11-30DS-2DSA(05)/DF11-30DP-2DSA(08): advisory Box03 dẫn nguồn hãng, receptacle32×5×6,6mm, RcontactMAX30mΩ, **30 mating cycles**. Chưa ghim drawing/overlap, force, retention, derating của mating pair, không nhận làm connector sản phẩm cho thao tác thường xuyên. [Hirose](https://www.hirose.com/product/p/CL0543-0565-8-05).

Điểm cần khép riêng: cáp PC còn cắm không được chịu100N do tay cam/cửa. Phần kiểm tra port rỗng chỉ dùng lực nhỏ; pawl/stop tựa frame phải nhận tải trước khi lực tới plug. Cần xét cắm hờ từ trước contact đầu, plug cong, một follower/pawl/cam hỏng và PC cắm trong chuyển tiếp. Tên gọi “hai cửa” chưa chứng minh cơ chế này.

## 6. Cold-start, W, G-B và radio

B01 phải boot được khi vào RUN mà chưa có fresh-arm/WDI. Nguồn boot qua bridge hợp lệ; grant điều khiển đầu ra được bảo vệ, không khóa nguồn boot duy nhất. W luôn inhibit grant cho tới qualification, không reset B01 liên tục trước khi firmware có thể feed. Nếu bổ sung resetCPU sau qualification phải chứng minh cơ chế riêng; chưa có chức năng đó trong proposal.

RUN_REQUEST=yêu cầu protected operation; FRESH_ARM=LOW qualification+edge; WDI=software-only; RELEASE=reserved/inactive; LOCK/SECOND_POSITION=quan sát liên động thủ công; SAFETY_STATUS=quan sát bảo vệ. E1–E4 giữ nguyên. Không gán GPIO. Fault/brownout/watchdog/mất pin xóa grant; nguồn hồi hoặc giữHIGH không tự arm. Quan hệ token/phase cũ chỉ tái dùng sau mapping và review, không tuyên bố17ca logic cũ chứng minh kiến trúc mới.

PC cấp B01 thì ESP32 vẫn có radio. Khoảng hở I/O không cắt RF. Firmware/protocol phải khởi động unarmed, loại lệnh cũ; robot cần timeout/fresh-arm riêng. Đây là yêu cầu chưa triển khai, không proof hành vi thật và không thay cấu hình robot. Không tự thêm yêu cầu tuyệt đối cấm RF với firmware tùy ý thành gate mới.

## 7. BOM/chi phí/fit — chưa chứng minh

| Hạng mục thuộc tổng bộ | Mức chứng cứ |
|---|---|
| 3cell cùng model/revision, cassette/holder/taps, charger ngoài | Candidate nguồn có; giá lẻ landed TBD. Charger phải hỗ trợ3cell riêng lẻ, không mặc định loại chỉ sạc cặp2/4 phù hợp |
| Module5V | Pololu #2123 niêm yếtUS$9,95 ngày10/11/2026 trong bản specs; chưa phí/vận chuyển/thuế/tỷ giá; không chuyển thành giá BOM Việt Nam đã chốt |
| Per-cell monitor/fuse/reverse, bridge/connectors/interlock | Chưa khóa MPN/rating; giá TBD |
| B01, PCB4lớp/lắp ráp/vỏ, robot đầy đủ | Chưa có subtotal hợp nhất trong P0-14 |

Không kết luận đạt dưới1triệu. Không loại charger khỏi chi phí khi Founder chưa có đồ. Bao PCB vẫn≤100×100mm,target90×90; holder57,48×47,63mm không chứng minh cả cầu/cam/joystick/cassette vừa vỏ. Fit, lực thao tác và độ dễ dùng phải được kiểm trên proposal cụ thể trước build; physical validation vẫn NOT_RUN.

## 8. Đề xuất di chuyển nghĩa vụ — không áp dụng vào registry

| Nghĩa vụ hiện tại | Đề nghị nếu AA được Founder nhận | Bằng chứng còn cần |
|---|---|---|
| Li-ion H3 / Jauch CV/NTC/timer | Superseded/out-of-scope có provenance; không PASS | Scope AA cuối được duyệt; không Li-ion charger/charging path ẩn |
| Actuator/direct-return capture | Thay bằng manual cassette/bridge/PC positive interlock | Hình học/force/connector/fault evidence và review; không lấy delay của actuator cũ |
| OFF | Giữ yêu cầu mất quyền và phân miền, cập nhật định nghĩa áp dụng | Physical gap, residual/contact fault, nguồn và tap protection |
| MCU reset/veto/resources | Giữ W/G-B/boot/grant nghĩa rõ | Role budget, default/fault, retainedHIGH/fresh-arm, protocol boundary |
| Fabrication/BOM/layout/certification | Giữ stage phù hợp | Nguồn/fit/BOM; kiểm sau mẫu có người đo/PASS-FAIL/thời điểm |

Không chuyển thiết kế thiếu sang verification items chỉ để blocking_unknowns rỗng. Ngược lại, phép đo vốn được D10 chấp nhận không bị tự đổi thành yêu cầu mẫu trước schematic. B1 vẫn NOT_READY tới khi proposal/config hợp nhất, review đúng snapshot, Founder duyệt đúng bytes, cổng áp dụng và preflight thật đều đạt.

## 9. Đầu ra kỹ thuật tiếp theo trong phạm vi đã được giao

Box02 trả một topology bảo vệ cell có cận/nguồn và phản ví dụ; Box03 trả cơ chế port-empty tách lực100N và lỗi đơn. Lead ghép kết quả trong phụ lục của hồ sơ này, sau đó Box08 review một snapshot. Chỉ các quyết định sản phẩm mới hoặc phê duyệt exact configuration mới quay lại Founder; không hỏi chọn lại hướng B.

Các advisory nguồn: `docs/agents/runs/MM-HW-P0-14/BOX02-RESULT.md`, `BOX02-POWER-ENTRY-REFINEMENT.md`, `BOX02-BOOT-ROLE-REFINEMENT.md`, `BOX03-RESULT.md`, `BOX03-M2-REFINEMENT.md`. Nội dung mâu thuẫn trong bản đầu (RUN USB, phải chờ Cmax B01 mới nghiên cứu được) đã được thay bằng refinement sau và disposition tích hợp bên trên; giữ bản gốc để truy vết.

## 10. M3 — bổ sung cơ chế kiểm cổng rỗng, thay phần trở về của M2

Advisory đầy đủ: `docs/agents/runs/MM-HW-P0-14/BOX03-M3-PORT-REFINEMENT.md`, turn `01a1c508-6779-71b3-bef3-c13bf25fae1e`. Đây là proposal chưa được chứng minh strength/hình học; M2 vẫn giữ chiều tháo cassette/nâng cầu, M3 thay trình tự reconnect.

Hai paddle ở hai mặt phẳng trước miệng USB, nominal1/2mm là allocation cần đối chiếu drawing; mỗi paddle phủ toàn corridor plug+0,5mm mỗi mép, không đưa vào contact receptacle. Chỉ endpoint thật tại dock đối diện mới rút pawl của nhánh đó. Mỗi nhánh thăm dò có coupling giới hạn≤0,20N, còn mỗi pawl/stop tựa frame độc lập phải nhận100N; không thanh cứng từ nút tới plug, không coupling chạm đáy trước frame stop. Các giá trị này là tiêu chí thiết kế đề xuất, chưa phải số spring/material đã chọn.

Chiều PROGRAM→RUN: cầu vẫn park/cassette bị chặn; hai paddle kiểm rỗng. Có plug dù cắm hờ còn dẫn thì ít nhất một paddle không được dock, pawl giữ. Cả hai dock mới nhả hai pawl; paddle giữ chắn corridor trong lúc hai cửa đóng. Cửa đóng hết mới cho rút paddle, hạ cầu và lắp cassette cuối. Chiều RUN→PROGRAM phải gài lại pawl trước mở cửa/rút paddle. PC không được cắm vào giữa chuyển tiếp.

Các phản ví dụ vẫn OPEN: paddle cong nhưng giả endpoint; coupling solid-bind truyền lực vào plug; một datum/frame chung gãy phá cả hai nhánh; shell/adapter ngoài envelope đi vòng paddle; một cửa hỏng và cửa kia không tự che hết; connector contact kéo theo hoặc wire/shield bypass. Mảnh follower kẹt dock chỉ được bao nếu nhánh còn lại thực sự độc lập và vẫn nhận biết plug. Hai pawl không mặc nhiên độc lập khi cùng dùng frame yếu. Lõi8×8mm do Box03 đề xuất chưa là phân tích strength.

Giữ DF11 chỉ làm reference/prototype theo30cycles và điều kiện hãng; chưa chọn cho sản phẩm. Cần xác định số lần PROGRAM mục tiêu, overlap/force/retention/cycle/derating và connector thay thế phù hợp trước khóa BOM/giai đoạn tương ứng. Không tự giảm tuổi thọ hoặc gọi double-break tăng cycle rating.

## 11. Kết quả slice bảo vệ cell — không có topology được nhận cuối

Nguồn advisory: `BOX02-CELL-PROTECTION-REFINEMENT.md`, turn `01a1c508-4029-7660-80c0-da589c758aef`. Đã khảo sát hai kiến trúc rồi dừng đúng scope; không gọi một candidate còn lỗi là đã đóng nghĩa vụ bảo vệ.

**A: bốn tap chung, ba phép đo vi sai thụ động đơn giản** không đủ khi tap giữa hở. Hai cell0,9/1,5V tổng2,4V có thể bị mạng đối xứng đọc thành1,2/1,2V, che cell yếu. Đây là counterexample cho topology không chẩn đoán openwire, không phải kết luận mọi mạch4tap đều bất khả thi.

**B: hai dây sense độc lập mỗi cell, bias fail-low, comparator+latch** là candidate phân tích, không lựa chọn thiết kế sản phẩm. Sáu dây sense + hai dây công suất phải được kiểm kê riêng; nhãn BAT0…BAT3 ở trên là node điện, không số dây thực cuối. Tháo cassette phải tách toàn bộ conductor thật. Mô hình lý tưởng P=H/2,N=(L+Vs)/2,D=P−N+Vs/2=Vcell/2; Vs4,75–5,25V,tap0–5,4V. Khi senseL hở, Dmax0,325V dưới target0,55V; chưa chứng minh clamp/common-mode/saturation của linh kiện thật.

Box02 đề xuất3TPS3700 và10amplifier OPAx192 để sàng lọc. Nguồn mới được advisory dẫn: TI TPS3700 SBVS187G,tr.6–7 và OPAx192 SBOS620E,tr.10–11, chưa nằm trong6tệp local pin. Với beta0,715455, detector387…400mV tương ứng1,08183…1,11817V/cell trước sai số front-end; startup450µsMAX, propagation18µsTYP không được dùng làm trễMAX. Các số này là trích từ advisory chờ kiểm chứng nguồn của topology, không phải guarantee đã được lead ký nhận.

**Disposition của lead: không promote B thành preferred BOM hoặc ready schematic.** Các lỗi thiết kế còn tồn tại:

- Nhánh sense có thể đưa khoảng26,3µA vào tap; không được quảng bá “không nạp pin” theo nghĩa mọi nhánh bằng0.
- Dòng monitor tới15mA theo budget advisory, chưa điện trở/logic. Cắt tải mà monitor còn chạy vẫn xả cell yếu. Cần cutoff cả monitor, defaultOFF và startup kiểm tra hữu hạn không bootloop; chưa có mạch có cận.
- Hai điện trở50kΩ±0,1% nối tiếp sát nguồn cho conditional108,1µA khi một short tại5,4V, không bảo vệ đoạn trước điện trở, không tự đóng fuse-open/bypass hoặc đảo cell.
- Chưa khép sai số/common-mode/clamp/reverse và timing toàn topology. Không có candidate fuse/reverse được nhận với rating/phối hợp holder.
-10amplifier,3detector,6dây sense làm tăng BOM/standby/cassette complexity; chưa phù hợp mục tiêu đơn giản/dưới1triệu bằng chứng hiện có. Không bắt Founder chọn một topology như thể đã có cost/fit proof.

Trước schematic cần design evidence thật cho source protection, lỗi dây/tap, mặc định khi mất bias và cutoff monitor; sau đó mới tách qualification RF sag/nhiệt/contact/celllot đúng stage và có người đo/thời điểm/PASS-FAIL. Không chuyển những lỗi nêu trên vào D10 hoặc viện mixedchemistry unsupported để bỏ trường hợp một NiMH yếu. Nguồn hãng để reviewer đối chiếu: [TPS3700](https://www.ti.com/lit/ds/symlink/tps3700.pdf), [OPAx192](https://www.ti.com/lit/ds/symlink/opa4192.pdf).
