# Đề xuất cấu hình R5 · Audio và driver tải

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R5-1**. Nhóm kế tiếp gồm 10 mã trong [lộ trình kho linh kiện](2026-11-26-catalog-fidelity-r2a-proposal.md), sau [R4](2026-11-26-catalog-fidelity-r4-validation.md). Mức nghiệm thu D3 trong phạm vi 10 bài đo local, gồm CAT-04, CAT-05, EDA-03, SIM-02 và SIM-03.

## Biến thể và đánh số chân

Bảng dùng số pad khi nhìn từ mặt trên. Dấu `/` trước tên biểu thị tín hiệu tích cực mức thấp. Pad EP dùng số kế tiếp trong footprint. Chân NC để hở. Các GND cùng tên được giữ thành chân riêng và nối về chung một net trong mạch thử. Giữ ID kho hiện có. Nếu pin cũ tương đương, giữ `pinId` hoặc dùng ánh xạ khi đọc nháp. Trường hợp chưa xác định được ánh xạ sẽ hiện cảnh báo để người dùng sửa dây.

| ID kho và mã đặt hàng | Package và thứ tự chân | Nguồn |
| --- | --- | --- |
| `lm386` · LM386N-1/NOPB | PDIP-8 P. 1 GAIN1, 2 IN−, 3 IN+, 4 GND, 5 VOUT, 6 VS, 7 BYPASS, 8 GAIN8. | [TI LM386](https://www.ti.com/lit/ds/symlink/lm386.pdf) |
| `max98357a` · MAX98357AETE+T | TQFN-16 T1633+4, 3 × 3 mm. 1 DIN, 2 GAIN_SLOT, 3 GND, 4 SD_MODE, 5–6 NC, 7–8 VDD, 9 OUTP, 10 OUTN, 11 GND, 12–13 NC, 14 LRCLK, 15 GND, 16 BCLK, 17 EP nối mặt phẳng GND để tản nhiệt. | [ADI MAX98357A, cột TQFN](https://www.analog.com/media/en/technical-documentation/data-sheets/max98357a-max98357b.pdf) |
| `tpa2012d2` · TPA2012D2RTJR | WQFN-20 RTJ0020D, 4 × 4 mm. 1 G1, 2 OUTL+, 3 PVDD, 4 PGND, 5 OUTL−, 6 NC, 7 /SDL, 8 /SDR, 9 AVDD, 10 NC, 11 OUTR−, 12 PGND, 13 PVDD, 14 OUTR+, 15 G0, 16 INR+, 17 INR−, 18 AGND, 19 INL−, 20 INL+, 21 EP nối GND. | [TI TPA2012D2, RTJ và bản vẽ 4219125/A](https://www.ti.com/lit/ds/symlink/tpa2012d2.pdf) |
| `ne5532` · NE5532P | PDIP-8 P. 1 OUT1, 2 IN1−, 3 IN1+, 4 VCC−, 5 IN2+, 6 IN2−, 7 OUT2, 8 VCC+. | [TI NE5532](https://www.ti.com/lit/ds/symlink/ne5532.pdf) |
| `l293d` · L293DNE | PDIP-16 NE. 1 1,2EN, 2 1A, 3 1Y, 4–5 GND, 6 2Y, 7 2A, 8 VCC2, 9 3,4EN, 10 3A, 11 3Y, 12–13 GND, 14 4Y, 15 4A, 16 VCC1. | [TI L293x, cột L293D](https://www.ti.com/lit/ds/symlink/l293.pdf) |
| `drv8833` · DRV8833PWPR | HTSSOP-16 PowerPAD PWP0016C. 1 AISEN, 2 AOUT2, 3 BOUT2, 4 BISEN, 5 BOUT1, 6 /FAULT, 7 BIN1, 8 BIN2, 9 VCP, 10 VM, 11 GND, 12 VINT, 13 AIN2, 14 AIN1, 15 /SLEEP, 16 AOUT1, 17 EP nối GND. | [TI DRV8833, cột PWP](https://www.ti.com/lit/ds/symlink/drv8833.pdf) |
| `drv8825` · DRV8825PWPR | HTSSOP-28 PowerPAD PWP0028V. 1 CP1, 2 CP2, 3 VCP, 4 VMA, 5 AOUT1, 6 ISENA, 7 AOUT2, 8 BOUT2, 9 ISENB, 10 BOUT1, 11 VMB, 12 AVREF, 13 BVREF, 14 GND, 15 V3P3OUT, 16 /RESET, 17 /SLEEP, 18 /FAULT, 19 DECAY, 20 DIR, 21 /ENBL, 22 STEP, 23 NC, 24 MODE0, 25 MODE1, 26 MODE2, 27 /HOME, 28 GND, 29 EP nối GND. | [TI DRV8825, pinout và bảng indexer](https://www.ti.com/lit/ds/symlink/drv8825.pdf) |
| `uln2003a` · ULN2003AN | PDIP-16 N. 1–7 IN1–IN7, 8 E/GND, 9 COM, 10–16 OUT7–OUT1. | [TI ULN2003A, cột ULN2003A](https://www.ti.com/lit/ds/symlink/uln2003a.pdf) |
| `uln2803a` · ULN2803A | ST PDIP-18. 1–8 IN1–IN8, 9 E/GND, 10 COM, 11–18 OUT8–OUT1. | [ST ULN2801A–ULN2804A, DocID1536 Rev 4](https://www.st.com/resource/en/datasheet/uln2801a.pdf) |
| `drv8871` · DRV8871DDAR | HSOIC-8 PowerPAD DDA0008B. 1 GND, 2 IN2, 3 IN1, 4 ILIM, 5 VM, 6 OUT1, 7 PGND, 8 OUT2, 9 EP nối GND. | [TI DRV8871, DDA và bản vẽ 4214849/B](https://www.ti.com/lit/ds/symlink/drv8871.pdf) |

## 2D, 3D và footprint

- Mỗi mục kho hiện đúng biến thể, dấu chân 1 và hình 2D có số pad. Hình 3D xoay được, có thân và đủ chân hoặc land. Chọn một chân từ 2D, 3D hay footprint đều trỏ về cùng `partId/pinId`. Mô hình 3D dùng mm làm kích thước nguồn, quy về tọa độ của trình xem hiện có khi xuất GLB.
- DIP dùng lỗ xuyên, bước 2,54 mm và hai hàng cách 7,62 mm. Lắp thử DIP qua khe breadboard. Kiểm cả 5 SMD trên bàn tự do qua pad có thể đi dây. Footprint SMD dùng số pad thật, kích thước và lớp đồng/mask/paste theo bản vẽ, gồm EP. Mô hình SMD dựng từ outline, ưu tiên kích thước danh định và lấy trung điểm khi hãng chỉ cho khoảng. Đánh dấu hướng pad 1 theo hình chiếu package.
- Footprint SMD lấy bố cục KiCad làm gốc, chỉnh lại pad, EP, stencil và mask theo tài liệu từng biến thể. MAX98357A dùng đúng biến thể **T1633+4** trong outline 21-0136 và land pattern 90-0031. Dùng RTJ0020D cho TPA2012D2, PWP0016C cho DRV8833, PWP0028V cho DRV8825 và DDA0008B cho DRV8871. Kiểm tra hướng chân khi đổi hình chiếu mặt dưới sang mặt trên. [ADI outline 21-0136](https://mds.analog.com/api/public/content/thin-qfn_21-0136.pdf) · [ADI land pattern 90-0031](https://mds.analog.com/api/public/content/90-0031.pdf)
- Dùng nguồn local KiCad 10.0.7 và [giấy phép thư viện KiCad](https://www.kicad.org/libraries/license/). Manifest sẽ ghi SHA-256 nguồn và asset sinh ra, phiên bản package, kích thước và sai lệch vị trí chân so với footprint. Mô hình hình học phục vụ tham chiếu và lắp mạch ảo.

Bảng khóa SHA-256 của footprint và STEP nguồn. Mỗi stem trỏ tới `footprints/<thư viện>.pretty/<stem>.kicad_mod` và, nếu dùng STEP, `3dmodels/<thư viện>.3dshapes/<stem>.step`.

| ID | Thư viện/stem | SHA-256 footprint nguồn | SHA-256 STEP nguồn hoặc hình học dựng |
| --- | --- | --- | --- |
| `lm386`, `ne5532` | `Package_DIP/DIP-8_W7.62mm` | `44500FC2989169A1EA877BA89E69CD60D0A77414AF60FD2D1997DE5569F2DEE5` | `4A377A56A8D9E9C0B86C095EF9ECC1869AC19E7F5069A3247B294250BF4F235D` |
| `l293d`, `uln2003a` | `Package_DIP/DIP-16_W7.62mm` | `08CEC2C2FAFEFFB19D0C6D17DB37B67017E6518147516B0B75E6A4719B235465` | `17A30B1F0AB3FD5384A1231E3C63C394888D5B952C542A8C189E023ED3467464` |
| `uln2803a` | `Package_DIP/DIP-18_W7.62mm` | `8F8FF730FF85D6DF042DF738363A0247801C7E1F2FA307EE5B37C89C378C5A0F` | `C9E1AD672F0603E5818E9D0329669EB09EC9FA91BAE3FDAD8CDFA245E05C3B5F` |
| `max98357a` | `Package_DFN_QFN/VQFN-16-1EP_3x3mm_P0.5mm_EP1.8x1.8mm` | `8DF21D2751F407DF996C9B5A9F6EBD345AC4D12356FC3B7C4C4DBFD725AA9BD8` | Dựng T1633+4 theo ADI 21-0136, dùng land 90-0031. |
| `tpa2012d2` | `Package_DFN_QFN/QFN-20-1EP_4x4mm_P0.5mm_EP2.6x2.6mm` | `CAEAAEE9900E5B29A5BD4FCE42627F2FC3175A2BFA2CE44D34FA1887823452D1` | Dựng RTJ0020D theo TI 4219125/A. |
| `drv8833` | `Package_SO/HTSSOP-16-1EP_4.4x5mm_P0.65mm_EP3.4x5mm_Mask2.66x2.46mm` | `BC9D5AAA6F363B806857CA7A21969B2BB786BFC64A0B67E58EECA7C065789D0E` | Dựng PWP0016C theo TI. |
| `drv8825` | `Package_SO/Texas_PWP0028V_TSSOP-28-1EP_4.4x9.7mm_P0.65mm_EP3.4x9.7mm_Mask2.94x5.62mm` | `63C69C0C01C4E21F153BE709E016A00BC4B560743B399B1CF721100F23E88DDE` | Dựng PWP0028V theo TI. |
| `drv8871` | `Package_SO/TI_SO-PowerPAD-8` | `9C8AA32351F3E80287FD4FCB02BC559CC23D3AB18494248A11DA0D7FF8CC08A3` | Dựng DDA0008B theo TI 4214849/B. |

## Mạch thử và miền mô phỏng

Mỗi bài mở được từ kho và lấy nguồn, mass, điều khiển và tải từ các net đã nối trên bàn tự do. Đổi dây phải đổi kết quả. Hai mạch analog dùng lời giải quá độ ngspice WASM trong miền công bố, với mô hình hành vi của IC và thời gian mô phỏng 12 ms, bước xuất tối đa 5 µs. Đo gain trên các chu kỳ cuối. Class D đọc mẫu I²S hoặc điện áp vi sai và hiển thị biên độ tín hiệu trung bình tại tải. Driver hiển thị trạng thái cầu H, chiều quay, dòng và vị trí vi bước theo cấu hình.

Motor DC ảo chung có R = 12 Ω, L = 8 mH, Kₑ = Kₜ = 0,020 theo đơn vị SI, J = 2 × 10⁻⁵ kg·m² và b = 2 × 10⁻⁴ N·m·s/rad. Dòng tính từ điện áp vi sai, R/L và sức điện động ngược. Tốc độ tính từ mô-men dòng và ma sát nhớt. Đo chiều tại 0,5 s, so sánh coast với brake trong 100 ms từ cùng tốc độ. Với ca giới hạn dòng, khóa trục để điện áp và điện trở cuộn dây tạo đủ dòng tới ngưỡng.

| Mã | Điện áp, mắc nối và kích thích | Kết quả nghiệm thu |
| --- | --- | --- |
| LM386 | VS 9 V, IN− về GND. Sin 1 kHz, 5 mV đỉnh qua 100 nF vào IN+. Loa ảo 8 Ω qua tụ 220 µF, cực dương hướng VOUT. Nhánh Zobel 10 Ω nối tiếp 47 nF từ VOUT xuống GND. VS bypass 100 nF + 100 µF. BYPASS 10 µF. Gain thử bằng hở chân 1/8 và tụ 10 µF không phân cực giữa hai chân. | Xấp xỉ 0,10 V và 1,0 V đỉnh tại tải, sai số ca đo ±10%. Tăng biên độ nguồn lên 40 mV ở gain 200 để hiện clipping theo giới hạn mô hình ±2,2 V quanh bias VS/2. Ngắt đường tải phải báo hở. |
| MAX98357A | Hai VDD 5 V, bypass 100 nF + 10 µF, I²S logic 3,3 V, stereo signed 16 bit ở 48 kHz, BCLK 1,536 MHz. LRCLK thấp là trái, cao là phải, MSB trễ một BCLK. Mỗi mẫu `L[n] = round(8192 × sin(2πn/48))` và `R[n] = round(−4096 × sin(2πn/48))`. SD_MODE lần lượt 3,3 / 1,05 / 0,45 / 0 V từ nguồn ảo. GAIN_SLOT để hở (9 dB), nối VDD (6 dB) hoặc GND (12 dB). Tải 8 Ω giữa OUTP và OUTN. | Giải mã đủ mẫu có dấu. Chọn trái/phải/mix/sleep theo thứ tự bốn mức. Ở 9 dB, đo xấp xỉ 0,50 / 0,25 / 0,125 V đỉnh và 0 V khi sleep theo hệ số mô hình 2 V trên PCM chuẩn hóa, điều chỉnh theo `10^((gain−9)/20)`. Mất clock phải báo lỗi. Truyền bit sai lệch một nhịp phải cho mẫu khác mẫu chuẩn. |
| TPA2012D2 | AVDD và hai PVDD 5 V, AGND/PGND về chung GND, bypass 100 nF + 10 µF. Tín hiệu vi sai hình sin 1 kHz qua tụ 1 µF mỗi đầu vào. Đo Vpk tại INL+/INL− là 0,10 V và tại INR+/INR− là 0,075 V, đảo pha kênh phải. G1, G0, /SDL và /SDR dùng logic 0/5 V. Mỗi kênh tải 8 Ω mắc giữa hai OUT cùng kênh. | Kiểm đủ 4 gain 2×/4×/8×/16× theo G1:G0 = 00/01/10/11. Ở 4× đo 0,40/0,30 Vpk và 8× đo 0,80/0,60 Vpk, dung sai ±10%. Mỗi shutdown tắt riêng một kênh. Báo lỗi tải mắc từ một OUT xuống GND. |
| NE5532 | VCC± = ±12 V so với GND. Kênh A không đảo, Rf = 9 kΩ, Rg = 1 kΩ, sin 0,10 Vpk 1 kHz vào IN1+. Kênh B đệm unity từ OUT1, phản hồi OUT2 về IN2−. Mỗi ngõ ra có tải 10 kΩ xuống GND. | Hai ngõ ra cùng pha, xấp xỉ 1,0 Vpk ±5%. Đổi Rf thành 4 kΩ, đo 0,50 Vpk ±5%. Thiếu nguồn âm hoặc mất hồi tiếp phải có trạng thái tương ứng, tránh trả một kết quả gain hợp lệ. |
| L293D | VCC1 5 V logic, VCC2 6 V motor, tụ 100 nF ở mỗi rail và 47 µF ở VCC2. Mỗi cặp OUT tải một motor ảo. Kích từng cặp EN cùng mẫu A = 10/01/00/11. Mô hình dùng sụt áp tham chiếu 1,4 V phía cao và 1,2 V phía thấp khi lái. | Hai chiều quay đối nhau, hai trạng thái đầu vào bằng nhau tạo brake khi EN cao, EN thấp tạo coast. Khóa trục cho khoảng 0,283 A theo mô hình. Vượt 0,60 A báo ngoài miền thay vì giả lập cơ chế tự giới hạn dòng. |
| DRV8833 | VM 5 V và logic 3,3 V. VM bypass 100 nF + 47 µF, VINT tới GND 2,2 µF, VCP tới VM 10 nF. AISEN/BISEN mỗi chân có 0,68 Ω xuống GND, /FAULT kéo lên 3,3 V qua 10 kΩ. Mỗi cầu H lái một motor ảo độc lập. Đợi 2 ms sau khi /SLEEP lên cao. | Mỗi cầu có 00 coast, 01 đảo, 10 thuận, 11 brake. Sleep đưa các ngõ ra về Hi-Z. Khóa từng motor để kiểm ngưỡng dòng xấp xỉ 0,294 A theo `0,2 V/Rsense`, trong sai số ±5% của mô hình. Kiểm tác động của từng điện trở sense và dây /SLEEP. |
| DRV8825 | VMA/VMB 12 V, mỗi chân có 100 nF, bulk 47 µF chung. Logic 3,3 V, CP1–CP2 10 nF, VCP–VM 100 nF song song 1 MΩ, V3P3OUT–GND 470 nF. AVREF/BVREF 0,99 V, ISENA/B mỗi nhánh 0,33 Ω. Hai pha độc lập R = 6,8 Ω, L = 4 mH. DECAY thấp, /HOME và /FAULT kéo lên 3,3 V qua 10 kΩ. MODE2:MODE1:MODE0 thử 000, 001, 011. Đợi 3 ms sau khi /SLEEP lên cao. STEP cao 5 µs trong chu kỳ 5 ms, DIR setup/hold ít nhất 5 µs trong bài thử. | Kiểm full step, half step và 1/8 step. Dòng đặt toàn thang 0,60 A bằng `VREF/(5 × Rsense)`, mỗi pha tại home đặt 0,426 A. So sánh dấu và tỷ lệ dòng đặt với bảng TI, lấy dòng ước tính cuối chu kỳ từ tải R/L. DIR đảo hướng bảng. /HOME xuống thấp tại home. /ENBL cao ngắt cầu và bỏ qua STEP. /RESET thấp đưa index về home và ngắt cầu. |
| ULN2003A | Logic 5 V, tải RL 40 Ω/40 mH từ +5 V tới OUT, E về GND, COM lên +5 V. Ca đóng/ngắt tối thiểu IN1 và IN7 độc lập. | Giải mạch low-side, kiểm đúng cặp chân ở cả 7 kênh. Sau 6 ms, dòng kênh bật xấp xỉ 100 mA (±5%) với VCEsat mô hình 1,0 V. Khi ngắt, điện áp OUT tăng tới xấp xỉ 6,2 V theo Vf mô hình 1,2 V, rồi dòng về 0. Rút COM phải báo hở đường hồi dòng và không hiển thị mức kẹp đã xác minh. |
| ULN2803A | Logic 5 V, tải RL 80 Ω/80 mH từ +9 V tới OUT, E về GND, COM lên +9 V. Ca đóng/ngắt tối thiểu IN1 và IN8 độc lập. | Kiểm đúng cặp chân ở cả 8 kênh. Sau 6 ms, dòng bật xấp xỉ 100 mA (±5%). Kẹp xấp xỉ 10,2 V với cùng mô hình VCEsat/Vf rồi dòng về 0. Kiểm nhánh mất COM. |
| DRV8871 | VM 9 V và logic 3,3 V, VM bypass 100 nF + 47 µF, RILIM 100 kΩ xuống GND. Một motor ảo giữa OUT1/OUT2. Thử IN1:IN2 = 00/01/10/11. Giữ 00 ít nhất 2 ms để thấy sleep, sau đó giữ một IN cao và đo lại sau 60 µs. | 00 coast rồi sleep, 01 đảo, 10 thuận, 11 brake. Kiểm wake và trần dòng danh định 0,64 A theo `64/RILIM(kΩ)` với trục khóa, sai số ±5% trong mô hình. ILIM hở hoặc mất VM báo lỗi. |

Bộ mô hình mô tả các kết quả đo ở bảng trên. Các cấu hình vượt miền cần hiện trạng thái chưa hỗ trợ. Tầng Class D dùng biên độ trung bình và tải vi sai. Các IC công suất dùng đặc tuyến giản lược và bảng trạng thái. Phạm vi nghiệm thu chưa bao gồm PWM carrier Class D, méo hài, nhiệt, EMC, mô hình transistor, quá trình lỗi thực, dung sai linh kiện thật, nạp firmware hoặc đo với kit thật.

## Kiểm từng mã R5 trên local

1. Chạy ca Node riêng từng mã cho pinout, số và ID pad, hash, dấu chân 1, ánh xạ điểm kết nối, kiểm schema `validateCircuitDoc`, kết quả điện theo bảng và lỗi mất dây. Kiểm chân NC bỏ trống, từng chân nguồn bắt buộc và tính độc lập giữa các kênh.
2. Dùng KiCad 10.0.7 đọc/xuất SVG 10 footprint. Đọc GLB bằng trình đọc của Mạch Mở, so vị trí và số chân với footprint, gồm pad EP. Kiểm chân DIP qua khe breadboard và pad SMD trên bàn tự do.
3. Chạy Chromium local từ kho qua bài thử cho cả 10 mã ở desktop và kiểm đại diện ở 390 px. Đo tín hiệu trên bàn đã đi dây, đổi tham số, tháo dây để kiểm phản ứng. Đi qua lưu nháp, mở lại và xuất/nhập trên ít nhất một bài analog và một bài driver. Kiểm nguyên ID linh kiện, dây và điểm gấp khúc qua round-trip.
4. Ghi kết quả từng mã, số ca đạt, trạng thái kiểm và định danh snapshot trong biên bản local. Bài ảo cung cấp tín hiệu điều khiển trong trình duyệt.

## Hồi quy R1, R2A, R2B, R2C, R3 và R4

- Chạy các bài Node `tests/catalog-r{1,2a,2b,2c,3,4}.test.mjs`, `tests/catalog-r2b-wired.test.mjs`, `tests/catalog-r4-protocol.test.mjs` và các bài thư viện, ngspice, hình học, định tuyến, lưu/đọc bản nháp chịu ảnh hưởng.
- Chạy lại `e2e/catalog-r{1,2a,2b,2c,3,4}.spec.mjs` trên Chromium từ Vite local, dùng một worker để phép đo ổn định và xem cả kết quả ngspice WASM. Ghi riêng lỗi môi trường nếu ca bị chặn.
- Chạy `npm.cmd run typecheck`, `npm.cmd run build:local` và `git diff --check` trên snapshot nghiệm thu. Dùng dependency và công cụ hiện có. Phạm vi phát hành của lượt này là bản local trên laptop.

Hồ sơ có hiệu lực triển khai khi người dùng duyệt đúng revision **MM-CATALOG-FIDELITY-R5-1** theo SHA-256 của tệp này.
