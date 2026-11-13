# MoBot V2 · Bàn giao P0-02 · 07/11/2026

**Trạng thái:** P0-02 vẫn mở. Hai cấu hình `proposed`, hai IF `waiting`, hai task KiCad `scoped`. Box 08 chấp nhận tách carrier theo D15(a) và đã đóng phần ghi yêu cầu tháo bảo trì. `HANDSET-POWER-DESIGN` vẫn `changes_requested`. Bàn giao định lượng mới của Box 02/03 chưa qua Box 08 review. Không có hash được duyệt cho hai cấu hình này hay lease KiCad.

| Snapshot | SHA-256 |
|---|---|
| [Tay cầm r8](../mission-control/hardware-config-mobot-v2-typec-r8-handset.json) | `3916f00dbca9145baf3437e63474ad56144181b46cfcc8a62b8968721f628da3` |
| [Robot r8](../mission-control/hardware-config-mobot-v2-typec-r8-robot.json) | `2fb61b4fa3074f4da83c604e4e9fb1ae08cc557eb50be67efec72bcef36674fc` |
| [Packet OFF đã được Box 08 review](mobot-v2-r8-handset-off-release-review.md) | `8bc6fc2d825d095b21b2aa382cbd830c3fc4875549226ef3b45dfe402cd242ea` |

Kiểm tra tại thư mục sản phẩm: `node ../docs/agents/validate.mjs` exit 0, 21 task, 143 capability, `errors=[]`. `node --test ../docs/agents/validate.test.mjs` exit 0, 24/24 pass. Các phép kiểm này xác nhận queue và quy tắc kiểm tra, không xác nhận phần cứng.

## Quyết định có hiệu lực

- Cả hai carrier dùng mẫu ESP32 DevKit USB-C 30 chân họ CH340 theo ảnh, PCB bốn lớp. Kích thước, revision và điện nội bộ của clone vẫn chưa xác minh. Tay cầm dùng Jauch 250832, giữ H3 danh nghĩa 0,40 A.
- Tay cầm chuyển **RUN → OFF → PROGRAM**. Phích RUN giữ mặc định, chỉ nhả khi I/O thực sự cách ly, Source thực sự ngừng cấp và RUN OUT dưới ngưỡng trong cửa sổ xác nhận. CHARGE dùng cổng riêng. Khi hết pin hoặc mất bias, chỉ tiếp cận lẫy bảo trì sau khi tách pack, tháo hoặc chặn nguồn ngoài, giữ I/O cách ly và xác nhận rail dư.
- D15(a) tách hai cấu hình và cổng IF. Robot vẫn phụ thuộc task KiCad tay cầm. D16(c) giữ hai nhánh lấy hồ sơ B04 và tìm ứng viên 2S, chưa chọn pack. D10 giữ đúng sáu nhóm USB, UVLO/nội trở, VM, nhiệt, ADC và clone. Kết quả đo vẫn TBD / NOT_RUN. Hai ca C-to-C theo dõi riêng.

Nguồn quyết định: [Q1–Q8 và D10](mobot-v2-founder-decision-q1-q8.md) · [D15/D16](mobot-v2-founder-decision-d15-d16.md) · [RUN → OFF → PROGRAM](mobot-v2-founder-decision-q2-off.md).

## Kết quả đã có và giới hạn

- UVLO TLV6710 hai ngưỡng và latch reset ưu tiên được chấp nhận có điều kiện ở cấp yêu cầu. Cắt tĩnh 3,242–3,318 V với cầu chia 72/10 kΩ, điện trở ±0,1%, sai lệch nút ±100 nA. Biên thấp khoảng 42 mV so với mốc 3,20 V. Hồi với 80/10 kΩ rising 3,558–3,642 V, falling 3,468–3,615 V. 83/10 kΩ rising 3,677–3,763 V, falling 3,584–3,735 V. Chưa chọn tỷ số hồi vì cần xác lập sàn RUN mới và tác động trên pack/tải. [Review UVLO](mobot-v2-r8-handset-uvlo-review.md) · [Review gộp](mobot-v2-p0-02-closure-review.md).
- H3 qua sàng lọc dòng 0,358–0,446 A. CV cao 4,232 V của MCP73833 ở điều kiện bảng chồng 2 mV với cận thấp phát hiện quá áp PCM 4,230 V của Jauch. Cần cận CV pack cho phép và sai số thực. [Jauch](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf) · [Microchip](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf).
- Stackup JLC04161H-3313A và đường pack/RUN 0,80/0,65 mm là cơ sở dự trù. Gá rời và GH 12 cực/11 dây là cơ sở thiết kế. Vẫn cần cận dòng/đường hồi, nhiệt, via/pad, dung sai fab, lệch GND và đặc tính đúng cụm. [Review bố trí và bó dây](mobot-v2-p0-02-layout-harness-review.md).
- Ultralife UBBL20-C1 và RS PRO 176-9352 qua sàng lọc dòng liên tục. Ultralife có profile 466 mA → 8,4 V → 50 mA, cần đối chiếu với R5 500 mA danh nghĩa. Cả hai thiếu cận xung và bằng chứng cân bằng 2S. [Shortlist](mobot-v2-robot-pack-d16-shortlist.md).

## Delta mới từ Box 02 và 03

**Điện.** Rà lỗi chung tại dây sense, điểm lấy mẫu, GND, bias, logic cấp quyền và tầng actuator. Một lỗi không được làm cả hai kênh báo thấp sai hoặc cấp điện trực tiếp cho chốt. Cần kiểm cả đường hồi USB che lỗi GND chức năng. Thử từng switch kẹt dẫn với upstream khả dụng, ghi dòng có dấu và áp trước/sau.

Ví dụ tải kiểm 1 kΩ ±1% với điện áp khi còn cấp tối thiểu giả định 4,40 V cho 4,36 mA tối thiểu. Với giả định dòng OFF tối đa 0,10 mA và sai số ±0,05 mA, hai dải sau sai số là ≤0,15 mA và ≥4,31 mA. Ngưỡng 1 mA chỉ minh họa. Phép kiểm yêu cầu `I_OFF,max + ε < I_threshold < I_còn_cấp,min − ε`, xét hết quá độ tụ và kiểm rail bật lại khi bỏ tải.

Với bleed, đặt `V∞ = I_back,max × R_bleed,max`. Phải có `V∞ < V_safe`, rồi tính `t = R_bleed,max × C_eff,max × ln((V0,max − V∞)/(V_safe − V∞))`. Ví dụ 10 kΩ ±1%, 5,5 V, 10 µA, 0,8 V và 47 µF cho khoảng 0,97 s trước cửa sổ xác nhận. Các đầu vào đều là ví dụ. Nếu bleed hở và không còn đường xả có cận, không có thời gian chờ hữu hạn được bảo đảm. Khi đó giữ chốt, hoặc trong bảo trì đo rail sau khi đã cách ly vật lý nguồn.

**Cơ khí.** Cận lực rút USB-C 8–20 N trong phép thử chuẩn và độ bền đầu nối 10.000 chu kỳ chỉ là tham chiếu cho đầu nối. Không dùng làm lực giữ, góc kéo hoặc tuổi thọ của gá/chốt. Cần đo riêng hành trình thân phích và chuyển động chốt, căn thời gian kênh đo, cộng độ rơ/mòn và sai số. PASS khi mốc sớm nhất giữa phích rời vùng giữ và USB mất hợp lệ muộn hơn OFF thực xấu nhất sau sai số. Thử chốt kẹt mở khi đang RUN, mất bias giữa hành trình và bỏ lần lượt từng bước bảo trì.

Lượt bàn giao: Box 02 `01a1b233-2918-7212-b492-c84fe1fc56fb`, Box 03 `01a1b233-3fc5-7033-9906-eda60480c841`. Các tính toán trên là bằng chứng giấy, phép kiểm cụm vẫn NOT_RUN. [TI TPS25810](https://www.ti.com/lit/ds/symlink/tps25810.pdf) · [USB-IF Type-C](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019_0.pdf).

## Việc còn thiếu trước khi hoàn thành P0-02

| Nhánh | Blocker | Đầu ra cần có |
|---|---|---|
| Tay cầm | HANDSET-POWER-DESIGN | Chứng minh fail-off, lỗi đơn/lỗi chung, ngưỡng OFF và cửa sổ xác nhận. Cần đúng B01, cáp, đầu chụp, chốt, gá và bó dây để lấy trace timing, lực/độ rơ, đường đi vòng và trình tự bảo trì. Kiểm CHARGE, brownout, lỗi sense và ca PC cấp B01 trong khi RUN OUT gặp sink khác. |
| Cả hai | CARRIER-INTERFACES, B01-SUPPLY, STACKUP-DRC | Cận giao diện riêng mỗi carrier, tài liệu PCBA/lô và dấu nhận dạng hàng giao, stackup/DRC theo fab và package. Khóa điện trở đường đi/hồi, via và nhiệt. |
| Tay cầm | HANDSET-PACK-H3 | Hồ sơ đúng revision về CV, termination/timer/recharge, NTC R–T qua dung sai, ánh xạ XHP-3. Trình Founder nếu phải đổi charger/profile. |
| Robot | ROBOT-R1, R2, R4 | Cận motor qua blanking và BT-R1a hoặc bằng chứng tương đương, phát hiện kẹt và giới hạn năng lượng, hấp thụ hồi VM/cận converter khi mất VIN hoặc bias. |
| Robot | ROBOT-R3-B04 | Hồ sơ đúng pack B04 hoặc ứng viên đủ cận xung, PCM/cân bằng, sạc/NTC và đầu ghép. Founder chốt Q7. |
| Robot | ROBOT-R5, R6 | Chứng minh CE mặc định tắt qua ramp/mất bias/Default, veto motor độc lập và tách nguồn/cách ly từng miền của bo Type-C. |
| Cả hai | Dossier D10 | Khóa điều kiện, cận PASS/FAIL, người đo và thời điểm. Giữ số đo TBD / NOT_RUN. Box 08 review từng mục trước layout. |

Thứ tự tiếp nhận: phân loại phản hồi DeepSeek theo nguồn và bằng chứng. HQ giao Box 02/03 đối chiếu, Box 08 review đúng bytes, rồi mới trình Founder duyệt riêng từng hash khi đủ điều kiện. Giữ cổng chứng nhận đồ dùng trẻ em. [Phiếu xin hồ sơ nhà bán](mobot-v2-p0-02-supplier-evidence-request.md) · [Câu lệnh DeepSeek](mobot-v2-p0-02-deepseek-prompt.md).
