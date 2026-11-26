# Cấu hình đề xuất R3 cho Mạch Mở

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R3-1** gồm đúng 19 mã nguồn và bán dẫn trong [lộ trình kho linh kiện](2026-11-26-catalog-fidelity-r2a-proposal.md). Mục tiêu D3 cho 2D, 3D tham chiếu, footprint và các ca mô phỏng đã định nghĩa trên bản local. Phạm vi năng lực CAT-04, CAT-05, EDA-03, SIM-02 và SIM-03. Bảng này xác định cấu hình để duyệt trước khi tạo mô hình, mạch mẫu và mã triển khai.

## Biến thể, package và ánh xạ chân

Số chân theo bản vẽ của hãng. Mỗi mã dùng cùng ánh xạ trong kho, sơ đồ, bàn 3D, footprint và bộ mô phỏng. Các chữ viết tắt phần package trỏ đến bộ nguồn hình học đã khóa ở cuối hồ sơ.

| ID kho | Hãng và mã đặt hàng | Package tham chiếu | Ánh xạ theo số chân | Datasheet |
| --- | --- | --- | --- | --- |
| `lm7805` | ST L7805CV · 5 V | TO220-3 | 1 IN, 2 GND và tab, 3 OUT | [L78](https://www.st.com/resource/en/datasheet/l78.pdf) |
| `lm317` | TI LM317T/NOPB · bản LM317-N điều chỉnh | TO220-3 · NDE | 1 ADJ, 2 OUT và tab, 3 IN | [LM317-N Rev Q](https://www.ti.com/lit/ds/symlink/lm317-n.pdf) |
| `tl431` | TI TL431AILP · bản A | TO92 · LP | 1 REF, 2 A, 3 K | [TL431 Rev S](https://www.ti.com/lit/ds/symlink/tl431.pdf) |
| `lm2596` | TI LM2596T-5.0/NOPB · 5 V cố định | TO220-5 · NDH | 1 VIN, 2 SW, 3 GND và tab, 4 FB, 5 ON/OFF, mức thấp bật | [LM2596 Rev G](https://www.ti.com/lit/ds/symlink/lm2596.pdf) |
| `lm2577` | TI LM2577T-ADJ/LF03 · điều chỉnh | TO220-5 · NDH | 1 COMP, 2 FB, 3 GND và tab, 4 VIN, 5 SW | [LM2577 Rev D](https://www.ti.com/lit/ds/symlink/lm2577.pdf) |
| `tps61023` | TI TPS61023DRLR · điều chỉnh | SOT563 · DRL | 1 FB, 2 EN, 3 VIN, 4 GND, 5 SW, 6 VOUT | [TPS61023 Rev B](https://www.ti.com/lit/ds/symlink/tps61023.pdf) |
| `lm1117` | TI LM1117MPX-3.3/NOPB · 3,3 V | SOT223 · DCY | 1 GND, 2 VOUT và tab, 3 VIN | [LM1117](https://www.ti.com/lit/ds/symlink/lm1117.pdf) |
| `tps5430` | TI TPS5430DDAR · điều chỉnh | SOIC8-EP · DDA | 1 BOOT, 2 NC, 3 NC, 4 VSENSE, 5 ENA, 6 GND, 7 VIN, 8 PH, 9 EP nối GND | [TPS5430 Rev L](https://www.ti.com/lit/ds/symlink/tps5430.pdf) |
| `tps62160` | TI TPS62160DSGR · điều chỉnh | WSON8 · DSG | 1 PGND, 2 VIN, 3 EN, 4 AGND, 5 FB, 6 VOS, 7 SW, 8 PG, 9 EP nối AGND | [TPS62160 Rev E](https://www.ti.com/lit/ds/symlink/tps62160.pdf) |
| `bq24074` | TI BQ24074RGTR · sạc tuyến tính một cell | QFN16 · RGT0016B | 1 TS, 2–3 BAT, 4 /CE, 5 EN2, 6 EN1, 7 /PGOOD, 8 VSS, 9 /CHG, 10–11 OUT, 12 ILIM, 13 IN, 14 TMR, 15 ITERM, 16 ISET, 17 EP nối VSS | [BQ24074 Rev N](https://www.ti.com/lit/ds/symlink/bq24074.pdf) |
| `ref5025` | TI REF5025IDR · 2,5 V, REF50xxI | SOIC8 · D | 1 DNC, 2 VIN, 3 TEMP, 4 GND, 5 TRIM/NR, 6 VOUT, 7 NC, 8 DNC | [REF50 Rev O](https://www.ti.com/lit/ds/symlink/ref50.pdf) |
| `lm4040` | TI LM4040A25IDBZR · 2,5 V, grade A | SOT23 · DBZ | 1 K, 2 A, 3 để hở trong mạch thử | [LM4040 Rev Q](https://www.ti.com/lit/ds/symlink/lm4040.pdf) |
| `1n4007` | Vishay 1N4007-E3/54 · diode chỉnh lưu silicon | DO41 | 1 K có vạch, 2 A | [1N4001–1N4007](https://www.vishay.com/docs/88503/1n4001.pdf) |
| `1n5819` | Vishay 1N5819-E3/54 · Schottky | DO41 | 1 K có vạch, 2 A | [1N5817–1N5819](https://www.vishay.com/docs/88525/1n5817.pdf) |
| `1n4733a` | Vishay 1N4733A-TAP · Zener 5,1 V | DO41 | 1 K có vạch, 2 A | [1N4728A–1N4761A Rev 2.7](https://www.vishay.com/docs/85816/1n4728a.pdf) |
| `2n3906` | onsemi 2N3906G · BJT PNP | TO92 · Case 29 Style 1 | 1 E, 2 B, 3 C | [2N3906](https://www.onsemi.com/download/data-sheet/pdf/2n3906-d.pdf) |
| `tip120` | onsemi TIP120G · Darlington NPN | TO220-3 · TO-220AB | 1 B, 2 C và tab, 3 E | [TIP120](https://www.onsemi.com/pdf/datasheet/tip120-d.pdf) |
| `irlz44n` | Infineon IRLZ44NPBF · MOSFET kênh N | TO220-3 · TO-220AB | 1 G, 2 D và tab, 3 S | [IRLZ44N Rev 1.1](https://www.infineon.com/dgdl/Infineon-IRLZ44N-DataSheet-v01_01-EN.pdf?fileId=5546d462533600a40153567217c32725) |
| `2n7000` | Microchip 2N7000-G · MOSFET kênh N | TO92 · TO-92 thẳng | 1 S, 2 G, 3 D | [DS20005695A](https://ww1.microchip.com/downloads/en/DeviceDoc/2N7000-N-Channel-Enhancement-Mode-Vertical-DMOS-FET-Data-Sheet-20005695A.pdf) |

## Hình học, tích hợp và lưu dự án

- Kho có hình 2D theo hình chiếu, chú thích chân, package, trạng thái mô phỏng, datasheet và nút lắp thử. Cảnh 3D có hình học thân, chân hoặc tiếp điểm thật theo package tham chiếu, vạch cathode hoặc dấu định hướng khi có. Dùng chung dữ liệu ánh xạ chân giữa mặt trên, mặt dưới, góc xoay và footprint. Footprint KiCad tải được có lớp, pad, kích thước và lỗ khoan theo nguồn đã khóa.
- TO220-3 và DO41 dùng kiểu chân theo footprint. TO92 khóa bản thẳng bước 1,27 mm. TO220-5 khóa chân đan hàng NDH. Lắp trực tiếp vào breadboard khi kiểm đặt xác nhận cả bước lẫn sự độc lập của các dải đồng. TO92 1,27 mm, TO220-5 và linh kiện SMD dùng nối dây trên bàn mô phỏng. Kích thước thân là tham chiếu package cho phiên bản ghi trong bảng. Dung sai, khả năng lắp cơ khí và sản xuất PCB cần kiểm riêng nếu sử dụng ngoài web.
- Tab TO220 dùng chung nút điện với chân tương ứng. SOT223 có hai diện tiếp xúc mang số 2. Pad EP của DDA, DSG và RGT có số riêng để chọn, đo và nối đất theo datasheet. Với BQ24074, mỗi pad BAT và OUT chọn được riêng, phép kiểm mạch xác nhận hai pad cùng tên đã nối đúng cụm, đồng thời xác nhận chân VSS và EP đều về mass. NC và DNC có mặt hình học. DNC để trống, cửa sổ kem hàn không được tính là chân.
- Giữ 19 ID kho đã có, khóa biến thể R3-1 trong dữ liệu khi tạo linh kiện. Bảo toàn `partId/pinId` và mạch cũ. Nếu mẫu cũ có ánh xạ khác, giữ nguyên ý nghĩa của endpoint cũ, thử tải lại, xuất/nhập và tạo linh kiện mới theo map R3. Bản nháp tiếp tục lưu cục bộ.

## Mô phỏng và mạch thử

Các dải dưới đây là tiêu chí nghiệm thu mô hình giáo dục. Dùng nguồn và tải ảo ở 25 °C. Mạch ghép theo kết nối người dùng trên bàn và có điểm đo. Dùng ngspice đã có trong dự án. Linh kiện bán dẫn dùng mô hình nguyên lý, nguồn tuyến tính và tham chiếu dùng mô hình hành vi DC, bộ nguồn xung dùng mô hình trung bình ở trạng thái xác lập. Toàn bộ tham số mô hình do Mạch Mở viết từ datasheet và các giả thiết ghi trong hồ sơ. Nguồn tài liệu hãng được liên kết, không phân phối tệp macro của hãng.

### Ổn áp và tham chiếu DC

| ID | Mạch thử chính | Ca thay đổi hoặc đấu thiếu |
| --- | --- | --- |
| `lm7805` | VIN 9 V, tải 100 Ω, Cin 0,33 µF, Cout 0,1 µF. Vout 4,75–5,25 V. | VIN 6 V làm mất ổn áp 5 V. Mô hình dùng khoảng dự trữ 2 V, kiểm Vout giảm dưới 4,75 V. |
| `lm317` | VIN 9 V, 240 Ω từ OUT về ADJ, 720 Ω từ ADJ về GND, tải 330 Ω. Với Vref 1,25 V và Iadj 50 µA, Vout khoảng 5,04 V. Dải 4,90–5,18 V. | VIN 6 V đi vào vùng mất ổn áp với khoảng dự trữ mô hình 2,5 V. Hở ADJ có chẩn đoán. |
| `tl431` | Nguồn 9 V qua 1 kΩ vào K, hai điện trở 10 kΩ chia áp từ K về REF và REF về A. Vka 4,85–5,15 V ở vùng dòng shunt từ 1 mA. | Nối REF sang K cho 2,43–2,56 V. Thiếu dòng phân cực cho biết ra ngoài vùng kiểm. |
| `lm1117` | VIN 5 V, tải 33 Ω, Cin 10 µF và Cout tantalum 10 µF. Vout 3,20–3,40 V. | VIN 4 V làm Vout rời mức 3,3 V trong mô hình dự trữ 1,2 V. |
| `ref5025` | VIN 5 V, tải 1 kΩ, CL 1 µF, các chân TEMP và TRIM/NR để hở. Vout 2,495–2,505 V. | VIN 2,5 V thiếu khoảng dự trữ 0,2 V. UI báo ngoài vùng mô hình ổn áp. |
| `lm4040` | Nguồn 5 V qua 2,49 kΩ vào K cho xấp xỉ 1 mA, A về GND. Vka 2,490–2,510 V. | Rút nguồn phân cực hoặc hạ dòng xuống dưới 60 µA. Trạng thái mất tham chiếu phải phân biệt với ca danh định. |

### Năm bộ chuyển đổi nguồn xung

Trong bảng, Rtop nối từ ngõ ra về chân feedback, Rbot nối từ feedback về mass. Kiểm nguồn, mass, feedback, tải và đường L/C/diode theo topology chọn. Với mô hình trung bình, kiểm cân bằng công suất theo hiệu suất minh họa 85% cho buck và 80% cho boost. Giới hạn fixture là hai lần dòng tải danh định dưới đây, với từ chối hoặc báo ngoài phạm vi nếu vượt ngưỡng. Khi thay tỉ lệ chia áp hoặc tải trong vùng đã định nghĩa, kết quả phải thay đổi theo mạch và phép đo. Điện áp nút SW/PH chỉ dùng để nhận dạng đường nối. Ripple, quá độ, tần số và dạng sóng chuyển mạch, ổn định vòng lặp, nhiệt và EMI nằm ngoài mô hình R3.

| ID | Topology thử và tải danh định | Ca kiểm thứ hai |
| --- | --- | --- |
| `lm2596` | Buck 12 V → 5 V, tải 20 Ω, L33 µH, Cin 470 µF, Cout 220 µF, diode Schottky hồi dòng. FB nối tới Vout. ON/OFF=0 V. Vout 4,75–5,25 V. | ON/OFF=5 V dừng cấp tải. Rút đường FB phát hiện sai mạch. |
| `lm2577` | Boost 5 V → 12 V, tải 120 Ω, L100 µH, Cin 100 µF, Cout 680 µF, diode Schottky chỉnh lưu và COMP 2 kΩ nối tiếp 0,1 µF xuống mass. Vref 1,23 V, Rtop 8,76 kΩ, Rbot 1 kΩ. Vout 11,4–12,6 V. | VIN 3 V nằm ngoài phép thử cấp nguồn. Rút FB có chẩn đoán. |
| `tps61023` | Boost đồng bộ 3,3 V → 5 V, tải 50 Ω, L1 µH, Cin 22 µF, Cout 44 µF. Rtop 741 kΩ, Rbot 100 kΩ, Vref PWM 0,595 V, EN nối VIN. Vout 4,75–5,25 V. | EN=0 V ngắt đường cấp ngõ ra. Kiểm tải còn nối và ngõ ra suy về 0 ở trạng thái xác lập. |
| `tps5430` | Buck 12 V → 5 V, tải 20 Ω, L15 µH, Cin 10 µF, Cout 220 µF, Schottky hồi dòng và Cboot 10 nF giữa BOOT và PH. Rtop 10 kΩ, Rbot 3,24 kΩ, Vref 1,221 V. ENA để hở theo datasheet. Vout 4,75–5,25 V. | Kéo ENA về 0 V thì dừng cấp tải. Kiểm kết nối chân 6 với EP 9. |
| `tps62160` | Buck đồng bộ 5 V → 3,3 V, tải 16,5 Ω, L2,2 µH, Cin 10 µF, Cout 22 µF. Rtop 312 kΩ, Rbot 100 kΩ, Vref 0,8 V. VOS về Vout, EP về AGND. Vout 3,14–3,46 V. | EN=0 V ngừng cấp. Nhận diện PG kéo thấp ở trạng thái ngõ ra dưới ngưỡng khi IC hoạt động và nhả khi ổn áp hoặc khi tắt. Dùng điện trở kéo lên 10 kΩ, kiểm cả trường hợp bỏ kéo lên. |

Diode Schottky ở ba fixture bất đồng bộ là linh kiện chức năng phụ trợ đã có hoặc mô hình chung hợp lệ của bàn. Ca điện của diode R3 được xác nhận riêng bên dưới. Các mạch này dùng tải ảo và minh họa topology, giá trị ổn định hoặc bảo vệ của phần cứng cần quy trình xác thực riêng.

### Sạc BQ24074 và linh kiện bán dẫn

| ID | Mạch thử chính | Ca kiểm bổ sung |
| --- | --- | --- |
| `bq24074` | IN 5 V, EN1 cao, EN2 thấp cho USB500. Tải OUT 44 Ω tương đương khoảng 100 mA ở 4,4 V. Cin 1 µF, Cout 4,7 µF, Cbat 4,7 µF, TS 10 kΩ về VSS, ISET 1,78 kΩ, ILIM 1,5 kΩ, TMR và ITERM để hở, /CE thấp. Pin ảo 3,6 V cho Vout 4,30–4,50 V, dòng sạc 0,36–0,41 A, tổng dòng nguồn không vượt 0,51 A. | Tăng điện áp pin ảo về vùng 4,2 V để kiểm chuyển từ CC sang CV và giảm dòng tới ngưỡng kết thúc mạch thử 50 mA. /CHG kéo thấp khi sạc và nhả khi kết thúc hoặc /CE cao. /PGOOD kéo thấp khi IN hợp lệ. Cả hai có kéo lên 10 kΩ. /CE cao giữ OUT cấp tải và dừng sạc. Mô hình pin ảo DC không tính chu kỳ sạc, hóa học pin, nhiệt và bảo vệ phần cứng. |
| `1n4007` | Dòng thuận 10 mA cho Vf 0,50–0,85 V. | Quét thuận 1 và 10 mA để kiểm xu hướng. Dòng rò mô hình dưới 10 µA ở 12 V ngược. |
| `1n5819` | Dòng thuận 10 mA cho Vf 0,18–0,45 V. | Kiểm Vf thấp hơn 1N4007 cùng dòng. Dòng rò mô hình dưới 1 mA ở 5 V ngược. |
| `1n4733a` | Cấp dòng ngược 49 mA, Vka 4,845–5,355 V. | Cấp thuận 10 mA, kiểm Vf 0,55–0,95 V để bắt lỗi đảo cực. |
| `2n3906` | E=5 V, tải C→GND 470 Ω, kéo 1 mA ra B. Dòng tải trên 9 mA và sụt E–C dưới 0,25 V. | B kéo về E thì dòng tải dưới 10 µA. Kiểm cảnh báo cực tính sai ở mạch thử. |
| `tip120` | Tải 47 Ω từ 5 V xuống C, E=GND, cấp 5 V qua Rb 2,2 kΩ. Vce 0,60–1,50 V. | B kéo về E thì dòng tải dưới 100 µA. Hiển thị tab cùng nút C. |
| `irlz44n` | Tải 50 Ω từ 5 V xuống D, S=GND. Vgs=5 V, Vds dưới 10 mV tại khoảng 100 mA. | Vgs=0 V cho dòng tải dưới 10 µA ở chiều chặn. Kiểm đường diode thân S→D bằng dòng 10 mA. |
| `2n7000` | Tải 250 Ω từ 5 V xuống D, S=GND. Vgs=5 V, Vds dưới 0,25 V tại khoảng 20 mA. | Vgs=0 V cho dòng tải dưới 10 µA ở chiều chặn. Kiểm đường diode thân S→D bằng dòng 10 mA. |

Bàn mô phỏng ghi rõ loại mô hình và tình trạng khi mạch nằm ngoài dải đã kiểm. Giữ các luồng AVR8js, MicroPython và USB hiện có. R3 không thêm build firmware hay thao tác nạp thiết bị. Ca tích hợp dùng mạch 9 V → L7805 → 1N5819 → tải 100 Ω qua breadboard R2C, đo đầu ra và thử tháo dây nối. Hai dải cần tách khi tháo jumper. Các ca tải nguồn thử dùng giới hạn cục bộ, không thêm phụ thuộc runtime.

## Nghiệm thu local

- Kiểm từng mã trong Chrome. Tìm và mở trong kho, xem mã đặt hàng, gọi đúng hình 2D, xoay và chọn chân ở 3D, đối chiếu pinout, gốc và cực tính. Tải đúng footprint, đặt qua luồng lắp thử và đo từng fixture theo bảng. Kiểm mạch ghép với breadboard R2C.
- Đối chiếu từng tiếp xúc của 19 mã với footprint và hình STEP, gồm chân NC/DNC, tab, EP và dấu định hướng. Với loại SMD đo vùng chồng phần kim loại với pad tại mặt lắp, với THT đo tâm và hướng chân so với lỗ. Dung sai kiểm giữa tiếp xúc 3D và vị trí tham chiếu cho THT tối đa 0,15 mm. Với SMD, mỗi tiếp xúc cần chồng lên đúng pad và không giao với pad lân cận. Đối chiếu số pad và kích thước footprint với bản vẽ hãng, ghi sai khác và trạng thái từng biến thể.
- Chạy test Node cho cấu hình, hình học, xuất footprint, hồi phục bản nháp và ngspice. Mỗi mã ít nhất có một ca danh định và một ca lỗi kết nối hoặc thay điều kiện. Xác nhận thông số đổi theo mạch đã lắp. Mở lại bản nháp đã lưu và kiểm mô phỏng giữ dây, chân và kết quả khi chuyển giữa 2D và 3D. Kiểm desktop và khung nhìn 390 px.
- Chạy hồi quy local R1/R2A/R2B/R2C gồm catalog, chọn/đặt/nối, lưu/khôi phục, footprint, ngspice, các trace linh kiện và firmware đã có. Chạy bộ test Chrome tương ứng, typecheck và `npm.cmd run build:public`. Ghi số ca đạt, lỗi và ca bị bỏ qua nếu có. Check build chỉ là nghiệm thu local, giữ cổng phân phối ngspice và quy trình phát hành hiện tại.

## Bộ nguồn hình học khóa theo SHA-256

Nguồn KiCad 10.0.7 ở cài đặt local. Cột footprint ghi `Thư_viện/Tên`, tương ứng `footprints/Thư_viện.pretty/Tên.kicad_mod`. STEP cùng tên trong thư viện cùng tên, trừ nơi cột ghi rõ nguồn thay thế. Với WSON dùng STEP generic cùng kích thước thân 2 × 2 mm và EP 0,9 × 1,6 mm, đối chiếu chân và mặt lắp với DSG0008A. Với BQ24074 dùng body 3 × 3 mm và EP 1,68 × 1,68 mm theo bản vẽ TI RGT0016B. Asset GLB chuyển từ STEP giữ ghi công nguồn KiCad theo [giấy phép thư viện](https://www.kicad.org/libraries/license/).

| Package | Footprint KiCad | SHA-256 footprint | SHA-256 STEP |
| --- | --- | --- | --- |
| TO220-3 | `Package_TO_SOT_THT/TO-220-3_Vertical` | `E116FBDC5F090042CBD25C86EAEF6544BB417581019E1D2DA0B5DC6E40B7B4BF` | `7CB065D935DF5771F0BA6E48DDD180863A121AF76483DAD7F18E667A7B68204A` |
| TO220-5 | `Package_TO_SOT_THT/TO-220-5_P3.4x3.7mm_StaggerOdd_Lead3.8mm_Vertical` | `DB543CD4143BD5B86F98B338A0913D47E98EA7E6E44574A07509493345BB4F1A` | `D7962BDB0828F2D617258183DF50C90920EF8E316727B628ECB8671809B4EFCF` |
| TO92 | `Package_TO_SOT_THT/TO-92_Inline` | `FC2E306A210A4F40C12F2AF3CC09BF923761C9FAADFEED9E6D331799A6BDE77D` | `F0B61C32ECBF0067157ADC5A3D4966CEADF5D6DAFE93C51AF35F76C41C71A54A` |
| SOT563 | `Package_TO_SOT_SMD/SOT-563` | `5DB336475DF2EB434A83572346092EFBA42569EFF34D06282FA8F90BF3B786A4` | `76C34AA4905777C0A8ABE4718019904A3A9F8343CAB7CC056F4516B7EF5165FC` |
| SOT223 | `Package_TO_SOT_SMD/SOT-223-3_TabPin2` | `B6BABDABD232A3E3170A86A17E8ED042377C2BB1854965C489D82C0E98179444` | `77AD6DBACC493CB619C728F26D2DDCF461EB0FEB6B977B47D01D51E67016F654` · `SOT-223.step` |
| SOIC8-EP | `Package_SO/TI_SO-PowerPAD-8` | `9C8AA32351F3E80287FD4FCB02BC559CC23D3AB18494248A11DA0D7FF8CC08A3` | `53B055EE4D166C0B9DE551669CC1294F95B96BAACBFE26D9316B576C1CE29FBF` |
| WSON8 | `Package_SON/Texas_DSG0008A_WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.6mm` | `FA30BCD3829C456865F0F79F87E2AE74D7B92912AB9E6A3D4026EEC63F8A895A` | `7672CAC8D88D8679800EF3BF90954E7996EA74E8DDB1F157F2D82BCA6B2015E4` · `WSON-8-1EP_2x2mm_P0.5mm_EP0.9x1.6mm.step` |
| QFN16 | `Package_DFN_QFN/WQFN-16-1EP_3x3mm_P0.5mm_EP1.68x1.68mm` | `407C05FEDA04356243424834AE0BF8C97B4B702A6FB261102D8874AD8FB72AFD` | `5CF5334CFC656BD6D862F8585CD09E4E5DF8CF505CFD6EBB00CE69E35A707340` |
| SOIC8 | `Package_SO/SOIC-8_3.9x4.9mm_P1.27mm` | `3C9B63198DD4DBF5E6C28C84702C29FAD46A35103B821A19306C4AC888AD8E76` | `07F46CFF378D30E6C27DFD5A03092C795323F86D91C71FC7E743F4F418DC553A` |
| SOT23 | `Package_TO_SOT_SMD/SOT-23` | `7FB2859C6463F3A37966A1A20C31D8BFE7D4E8459D00BB165D5A7488270816C5` | `DD5D1711204E1D8D26CD11490923BD84340820BAA69538C385A4300EC2539BC0` |
| DO41 | `Diode_THT/D_DO-41_SOD81_P10.16mm_Horizontal` | `FDB8A0FAFB90BA28FA9108225076263EDE43610F2DE398AEB6D4947E3EAC85D8` | `C3E23D4B276811B74EECB329BD4480209AD3DBC8CF6E6E3F2A5B542C5CA343C1` |

Chỉ triển khai sau khi người dùng duyệt SHA-256 của đúng tệp này. Phạm vi duyệt gồm 19 biến thể, hình học tham chiếu, mạch thử và các phép kiểm local.