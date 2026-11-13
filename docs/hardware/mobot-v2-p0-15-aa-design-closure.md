# P0-15 — đối chiếu thiết kế AA và các điểm chưa khép

Ngày 10/11/2026. **Nghiên cứu có số liệu; chưa nhận topology, chưa B1-ready.** Chủ hồ sơ: Codex lead. Box 02 phụ trách điện, Box 03 phụ trách cơ/connector, Box 01 kiểm phạm vi. Các advisory gốc được lưu riêng trong run P0-15, có thread/turn. Không tạo GPIO assignment, schematic, CAD/FE, KiCad hoặc firmware.

## 1. Phạm vi còn hiệu lực

Founder đã cho nghiên cứu 3 AA NiMH tháo rời/sạc ngoài, điều khiển không dây, liên động thủ công; giữ CH340 30 chân, G-B16/E1–E4, robot riêng, toàn I/O cách ly ở PROGRAM và trần toàn bộ dưới 1 triệu đồng. Đây chưa là cấu hình AA được adopt.

Biên nhận B và r12 không thay đổi. r12 SHA256 `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`, trạng thái proposed, chưa approved; bốn cổng schematic OPEN, 14 verification items không đổi. Không r13 và không lease B1.

| Nội dung | Phân loại / hệ quả |
|---|---|
| Full I/O isolation, wireless, nguồn boot riêng grant W | Giữ yêu cầu; không dùng software hoặc radio reset làm chứng cứ physical gap |
| Trip cell 1,05–1,15 V | Allocation nghiên cứu, chưa Founder duyệt; không trở thành hard gate mới |
| Zero current tuyệt đối hoặc tự cắt mọi monitor | Chưa là quyết định sản phẩm. Phải có cận dòng sau trip và không tiếp tục xả nguy hiểm/tự khởi động, không tự áp vô hạn thời gian lưu pin |
| 500 lần PROGRAM | Screening allocation, chưa lifetime sản phẩm |
| 2.500 cycle Samtec | Kết quả thử của cấu hình hãng, không tuổi thọ mọi variant |
| 100 N thao tác, 100 N retention/200 N proof mỗi đường | Envelope phân tích đã có; chưa là strength đạt, chưa tự giảm |
| H3/Q2/Q3 và gate migration | Chỉ supersede đúng phạm vi sau quyết định adopt và review; nghiên cứu AA không tự PASS gate Li-ion cũ |

Đối chiếu phạm vi độc lập: `docs/agents/runs/MM-HW-P0-15/BOX01-SCOPE-AUDIT.md`. Không hỏi Founder chọn lại B, không dùng câu hỏi vận hành để né lỗi thiết kế chưa sửa.

## 2. Điện — hướng mới đã được xét

### A. Detector riêng từng cell

ABLIC S-1009C11I-M5T1U là candidate CMOS để sàng lọc; nguồn S-1009 Rev.5.1_03, tr.5,9,11–13 đã ghim. Ngưỡng25°C 1,088–1,112 V. Với coefficient MAX370 ppm/°C, cộng biên nhiệt65°C từ25 tới−40°C cho cận bảo thủ **1,061545–1,138455 V**. Release25°C với hysteresis4–6% là **1,13152–1,17872 V**. Lead đã đối chiếu bảng và tái lập phép tính; chưa xác nhận dung lượng khai thác hoặc điện áp RF sag.

Số0,90µA MAX chỉ ở điều kiện đo của hãng:25°C, VDD=release+0,6 V. Không dùng làm OFF MAX toàn miền. Nếu giả sử0,9µA liên tục thì mỗi cell21,6µAh/ngày hoặc0,648mAh/30ngày; **đây là tính điều kiện, không thời hạn lưu pin được cho phép**. Tổng dòng thực gồm detector, pull-up, latch, switch và leakage vẫn TBD.

CMOS operating MIN0,6 V; output source current không được bảo đảm tại nguồn1,1 V theo điều kiện được trích. Không gán OUT dưới MIN là LOW. Không tạo cầu bias5 V vào tap, nhưng tầng truyền trạng thái chưa có cận fail-off. Nguồn detector riêng mỗi cell tránh dồn monitor vào cell đáy, không tự giải quyết lỗi ngắt nguồn detector.

### Refinement Nch/local disconnect — bị loại cho adoption

S-1009N11I-M5T1U dùng output Nch, operating MIN **0,7 V** (khác CMOS). Pull-up ngay tại cell tránh yêu cầu CMOS source; nhưng topology detector kéo gate xuống khi undervoltage còn phản ví dụ:

| Lỗi/trạng thái | Hệ quả chưa được giải |
|---|---|
| OUT hoặc nhánh gate detector hở | Pull-up còn nguồn → fail-ON |
| Nhánh VDD detector hở, pull-up vẫn nối cell | Không sink được gate; không fail-off |
| VSS detector hở | OUT không có trạng thái được bảo đảm |
| Cell xuống dưới operating MIN | Gate vẫn được cấp DC qua pull-up, không chỉ có năng lượng lưu hữu hạn |
| Cell hồi điện áp sau trip | Detector tự release; không latch riêng có thể autoretry |
| Một cell đảo | Chưa bảo vệ nguồn detector; diode thân FET không chứng minh trạng thái hỏng chấp nhận được |

Vgs gần bằng Vcell×Rgs/(Rpu+Rgs), chưa gồm leakage; “cell dưới0,6 V thì FET chắc chắn tắt” không có căn cứ. PMV40UN2 chỉ là đối chứng nêu trong advisory: không được nhận làm FET tải1,1 V vì Rds(on) được trích từ1,8 V. Back-to-back FET có thể chặn hai chiều nhưng không sửa lỗi fail-ON/latch.

**Disposition: REJECT topology Nch/pull-up hiện tại cho adoption.** Detector family vẫn là nguồn tham khảo; không tiếp tục đổi tên FET rồi coi finding đã đóng.

### B. Monitor5 V cắt sạch sau trip

Chưa khép bằng chuỗi linh kiện có cận. Latch sau cutoff có thể mất trạng thái; giữ START khiến kiểm–trip–khởi động lặp. Đưa latch lên trước cutoff tạo tải tồn tại sau trip; thêm monostable không tự nhớ rằng lượt START đó đã dùng. Đây là thiếu thiết kế, không chuyển sang D10/qualification.

### Reverse/short và stored energy

LM66100DCKR là candidate đảo **pack**, TI SLVSEZ8A tr.4–5 đã ghim; không bảo vệ detector trước một cell đảo hoặc thay fuse. Operating1,5–5,5 V không chứng minh chịu short/nhiệt. Chưa chọn fuse MPN khi prospective short current và phối hợp holder/dây chưa có cận. Không đổi module5V/giá benchmark thành rating được bảo đảm.

Giữ nghĩa vụ P0-14: mọi sense/tap conductor ra cùng cassette; không bypass fuse hoặc đảo B01. Residual C/V/energy và mọi injection cần cận theo topology cuối; không giả nguồn tháo đồng nghĩa rail0 V.

## 3. Cơ M4-R1 — tìm được giới hạn thật của phương án hiện tại

Đã tải được PDF USB-IF R2.0 tháng8/2019 từ hãng; không còn blocker DNS ở lead. Đây là reference lịch sử, không tuyên bố tuân thủ R2.5 hoặc đúng receptacle trên clone B01.

Figure3-3 tr.46–47 và3-11 tr.57–58 cho exposed shell≥6,51mm; plug shell6,65±0,10mm. Note7 tr.40 cho effective receptacle shell length6,20±0,20mm ở điều kiện được mô tả. **Nếu** mating-stop thật đảm bảo Dmax≤6,40mm, phần kim loại ngoài miệng được suy bảo thủ chỉ **6,51−6,40=0,11mm**.

Paddle ngoài miệng phải thỏa đồng thời `a+t+Δaxial < Pmin` và `a−Δtoward_port >0`. Hai vị trí1/2mm không được cận0,11mm bảo đảm; allowance võng assembly0,15mm đã lớn hơn dải đó. Không lấy chiều dài shell reference làm hard-stop clone đã kiểm. Không kết luận mọi phương án detector sát cổng đều bất khả thi; **chỉ không nhận geometry M3/M4 với stack hiện tại**.

Falsifier còn thật: có conductor hoặc shell còn tiếp xúc điện trong khi cả hai paddle dock được, cho nhả pawl/reconnect. Hai nhánh cùng dựa vào giả định sai về shell không độc lập trước lỗi chung đó. Không lấy overmould của vài cáp làm proof cho mọi cáp.

### Cận lực có điều kiện, không strength proof

- Coupling proposal: preloadMAX0,055N + kMAX0,007N/mm×extensionMAX15mm + dragMAX0,025N = **0,185N**, dưới allocation0,20N.
- Pawl engagement2,50mm trừ0,10 chế tạo,0,10 rơ,0,15 mòn,0,15 võng còn **2,00mm**.
- Pawl8×8mm, nhô2mm, tải100N: ứng suất danh nghĩa kéo/nén+uốn **3,90625MPa**; không bao fastener, contact/frame hoặc tập trung ứng suất.

Chưa chọn spring/material, chưa chứng minh coupling jam thành thanh cứng, dock khi cắm mới100N, frame/datum chung hoặc endurance. Không ghi PASS từ ba phép tính này. Retention100/200N vẫn cần chứng cứ riêng; không để holder hoặc connector gánh chức năng giữ.

### Delta adapter/cáp PROGRAM — chỉ là đề nghị, chưa adopt

Một collar cứng captive với envelope từ đầu plug≥12,5mm, nếu Dmax≤6,4mm thì ngoài miệng≥6,1mm, cho phép khảo sát paddle1/2mm với biên lớn hơn. Nhưng **chưa có keying chứng minh cáp không collar bị chặn trước contact điện**. Nhãn “chỉ dùng cáp đi kèm” không sửa falsifier. Chưa chọn cable/adapter, giá/replacement/chi phí và trải nghiệm cần xem xét. Không dùng lựa chọn nghiên cứu này làm cớ xin Founder duyệt một cơ cấu chưa chứng minh.

## 4. Connector, conductor và fit

Mỗi conductor carrier–B01 có hai breakpoint nối tiếp A/B trên cầu PCB cứng; không có dây/shield/test path vòng. Role matrix cơ sở nếu tất cả được nối:16 GPIO roles +EXT5V/return2 +JOY_VCC1 = **19+Nextra conductor mỗi breakpoint**. RELEASE có thể inactive nhưng không tự trừ khỏi tài nguyên được giữ nếu chưa chốt kết nối. Battery node4 không đồng nghĩa4dây; công thức `Nbattery=2+Nsense+Naux`, candidate cũ6sense là8dây, topology mới đặt detector tại cell phải tính lại liên kết thật.

Samtec SFM/TFM Product Spec RevE25/09/2021, tr.2 có thử2.500cycles cho cấu hình mô tả; current3,2A là một pin powered mỗi row. Không promote sang mọi lead/plating. XFM Mated Views RevC,tr.1, cặp SMT lead−02: separation fully-mated6,30mm nominal, A MAX6,48mm vẫn wipeMIN0,38mm; wipe nominal0,56mm **không** là hành trình ngắtMAX. Product spec và mated views không tự ghép thành cùng mating set nếu chưa khóa revision/variant. MAX conductive overlap của cặp được chọn vẫn TBD. DF11 chỉ30cycle không được nhận làm connector sản phẩm lặp thường xuyên.

Harwin M80 là candidate đối chứng của Box03, chưa ghim đủ mating set và chưa chọn. Không mở tiếp survey rộng để né việc xác nhận một mating pair thật.

Fit chỉ là reserve khái niệm: cassette64×54×22mm, cầu35×25mm cho khảo sát Samtec; PCB target90×90mm/trần100×100mm. Không chứng minh đủ khi chưa có B01/anten/frame/cam/cầu nâng thật. Mated height +PCB cầu+12mm lift+park clearance là chiều sâu tổng cần xét, không lấy12mm làm cả khoang.

## 5. Sạc ngoài và chi phí

Xem `docs/agents/runs/MM-HW-P0-15/budget-screening.md`. Hai candidate sàng lọc: BQ-CC17 có manual cho1–4cell; Lii-S1 một slot có thể xử lý3cell lần lượt, nhưng chưa chốt trải nghiệm/profile/pair với FDK hoặc giáVND. Một combo BQ-CC17+4EneloopPro niêm yết800.000đ và hết hàng không phải giácharger rời; không nhận combo đó làm BOM đạt trần, không suy mọi sạc đều có giá này. AdapterUSB5V, cáp, charger, cells, protection, connector, PCB/lắp ráp/vỏ và robot phải được tính đủ. Chưa có total dưới1triệu.

BOM cũ CP2102/Li-ion và shortlist mẫuT8 không phải giá sản phẩmAA/CH340. Không đổi cấu hình robot hoặc xóa chi phí charger để báo đạt.

## 6. Disposition và bước được phép tiếp tục

| Finding P0-14 | Tiến bộ trong P0-15 | Trạng thái thiết kế |
|---|---|---|
| Monitor15mA sau trip | Có detectorµA với ngưỡng thực; đã bác việc dùng0,9µA làm OFF tổng | OPEN; chưa có tổngdòng/time/latch/fail-off |
| Tap-open/clamp/reverse | Local-cell tránh phép trừ tap chung; thửlocalNch đã có counterexamplefail-ON | Topology thửbịloại; nghĩa vụOPEN |
| Partial-plug M3 | Đã pinUSB-IF, có bất đẳng thức0,11mm và bác stack1/2mm | Geometry hiện tại chưa nhận; không chỉ “thiếuPDF” |
| Conductor/gap | Có19+Nextra vàphânbiệt6sense/4node, nguồn mated/wipe thật | MAXgap/bypass/variantOPEN |
| Cycle/fit/budget | CóspecSamtec vàscreeningcharger, bócstaleBOM | Productlifetime/fit/landedcostOPEN |

Không tạo taskID mới để làm các finding biến mất, không đánh P0-15 đã hoàn tất thiết kế. Bảng trên là kết quả một đợt nghiên cứu và giới hạn cần review.

Nguồn/hash chính thức: `docs/research/downloads/p0-15/design-sources.json` và `cost-sources.json`;9tệp pin,1Amphenol403 không pin. Phép tính tái lập: `docs/agents/runs/MM-HW-P0-15/checks.py`. Hồ sơ P0-14 gồm37tệp và r12 đã kiểm không đổi.

Source/reference: [ABLIC](https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf), [TI LM66100](https://www.ti.com/lit/ds/symlink/lm66100.pdf), [USB-IF R2.0](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf), [Samtec specification](https://suddendocs.samtec.com/productspecs/sfm-tfm.pdf), [Samtec mated views](https://suddendocs.samtec.com/prints/xfm%20mated%20document-mkt.pdf).
