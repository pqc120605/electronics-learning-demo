# MoBot V2 r7 · Packet chuẩn bị tái review box 08

Phiên bản cần đối chiếu là [r7](mobot-v2-config-2026-11-05-r7.md), SHA-256 `9ef75eb96829669e730717eb8565290485f75ad8ca673a87b66c729cd4661d5d`, đang chờ user duyệt. [r6 đã duyệt](mobot-v2-config-2026-11-05-r6.md) là baseline. [Decision record](mobot-v2-r7-founder-decision.md) lưu ba quyết định hướng đi. Gói hỗ trợ là [đầu vào advisory](claude-support/2026-11-05-mobot-r6/README.md). Box 01 và 02 đã trả kết quả, được tóm tắt dưới đây. Box 08 giữ verdict độc lập. Các phép kiểm bench vẫn chưa chạy.

## Ưu tiên H4 và R6

- **UVLO bị đảo cực tính trong phương án hiện tại.** H4 và bảng net cả hai carrier mô tả INB/OUTB kéo EN xuống khi pin thấp. Bảng chân và logic của TLV6700 cho thấy OUTB sink khi INB vượt ngưỡng, và high-Z khi xuống dưới ngưỡng falling. Yêu cầu QA kiểm lại polarity, fail-off khi mất bias và hysteresis qua ramp, brownout, reset. Giữ nhãn gói GỠ TRÊN GIẤY, verdict HQ vẫn OPEN. [TI TLV6700](https://www.ti.com/lit/ds/symlink/tlv6700.pdf)
- **LM66100 và raw VBUS.** CE so với VIN, không có ngưỡng logic cố định để suy ra chia áp thụ động bảo đảm OFF. Chế độ chặn ngược được TI mô tả với CE nối VOUT hoặc topology ORing cụ thể. Chứng minh hai chiều qua từng trạng thái và quá độ, gồm pack vắng/BMS mở, VBUS nhỏ nhất, V5_BST/V5_R cao nhất, bypass interposer, I/O joystick và rail đã tắt. Giữ bốn trạng thái USB của r6. [TI LM66100](https://www.ti.com/lit/ds/symlink/lm66100.pdf) · [TI TPS61023](https://www.ti.com/lit/ds/symlink/tps61023.pdf)
- **R6 còn các đường chưa chứng minh.** Review EN của TPS54302 tại mức pull-up thực, MOTOR_EN/nSLEEP lúc thiếu rail, điều khiển DIR/OE, nguồn pull-up hai miền, điện áp ngõ vào ngoại vi và analog ISEN. VCC isolation của transceiver và I²C buffer là dữ liệu từng IC. Kiểm cấp ngược trong các khoảng rail ramp, chưa về 0 V, và đường bypass qua I/O. [TI TPS54302](https://www.ti.com/lit/ds/symlink/tps54302.pdf) · [SN74LVC8T245](https://www.ti.com/lit/ds/symlink/sn74lvc8t245.pdf) · [SN74LVC2T45](https://www.ti.com/lit/ds/symlink/sn74lvc2t45.pdf) · [TCA9517A](https://www.ti.com/lit/ds/symlink/tca9517a.pdf)

## Đối chiếu số liệu và các điểm HQ chưa đồng ý

| ID | Đã đối chiếu và giới hạn còn mở |
|---|---|
| H1 / R3 | Giữ CẦN DỮ LIỆU NCC. Ngân sách tay cầm 0,977 A và robot 1,762 A đúng theo phép chia công suất của r6. Đây là mô hình ở hiệu suất giả định 80%, không suy ra dòng xung, nhiệt IC hoặc khả năng của B15/B04. Mức 2 A của nhà bán trừ 1,762 A là 0,238 A. Biên tới mục tiêu thiết kế 1,85 A chỉ 0,088 A. |
| H2 | TI ghi 2,7 A valley min tại 3,6 V → 5 V. Không dùng con số đó để đảm bảo dòng ra 1,30 A tại 3,0 V. Mức 240 mA Wi-Fi là typical, còn 0,5 A là yêu cầu nguồn, không phải dòng đo. Chia áp 680 kΩ/97,6 kΩ cho ngưỡng rising danh nghĩa 3,187 V trước hysteresis, cần kiểm góc rơi và polarity. [TPS61023](https://www.ti.com/lit/ds/symlink/tps61023.pdf) · [ESP32](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf) · [ESP32-WROOM-32](https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf) |
| H3 | 2,49 kΩ cho 0,402 A danh nghĩa. Dải 0,361–0,442 A là ngoại suy ±10% từ các điểm đo datasheet và bỏ qua ±1% điện trở. Cùng giả định khi tính cả điện trở cho khoảng 0,358–0,446 A. Timer 5,4–6,6 h và θJA DFN 41 °C/W trên bo chuẩn hỗ trợ tính sàng lọc, không bảo đảm đầy pin hoặc TJ thực. Dòng USB phải tính cả LED, inrush, dung sai và trạng thái nhận nguồn. Ca pack vắng phải kiểm VBAT ở LDO test mode, cùng NTC và nhiệt đúng pack. [Microchip DS20002005C](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf) |
| R1 / R2 | 160/200/240 mV và 0,62 Ω ±1% cho 0,256/0,323/0,391 A tĩnh theo điều kiện datasheet. 3,75 µs không phải cận max được bảo đảm trong bảng. Mốc L 0,39 mH dùng VM 6,15 V và blanking danh nghĩa, không chứng minh đỉnh 0,45 A khi đảo chiều, thay nhiệt độ hoặc ngắn mạch. Kiểm riêng ISEN abs max và bảo vệ kẹt, vì 0,36 A stall của #992 là ngoại suy và không bảo đảm phân biệt được với tải chạy khi có chopping. [DRV8833](https://www.ti.com/lit/ds/symlink/drv8833.pdf) · [Pololu #992](https://www.pololu.com/product/992/specs) |
| R4 | 2,03 mJ cho hai cuộn 10 mH ở 0,45 A chỉ là mô hình năng lượng cuộn dây. Mốc 7,5 V phụ thuộc điện áp đầu, điện dung hiệu dụng và ESR. Không dùng làm cận cho cơ năng hoặc xung lặp. TI xác nhận PS/SYNC thấp chọn forced PWM, mức cao cho phép power save với chuyển chế độ theo tải. Không suy ra cách ly dòng ngược trong mọi trạng thái. SMAJ8.0A có clamp 13,6 V tại dòng xung bảng hãng, cao hơn giới hạn vận hành 10,8 V của driver. Chưa thể dùng một mình để đóng R4. [TPS63070](https://www.ti.com/lit/gpn/tps63070) · [Littelfuse SMAJ](https://www.littelfuse.com/assetdocs/tvs-diodes-smaj-datasheet?assetguid=13c2a823-03b8-4d1f-9ddc-9b44670aed9d) |
| R5 | OUT1 thấp cho 1,5 A/3 A khi nhận diện hợp lệ. CE của BQ25886 active-low và có pull-down nội, nên phải chứng minh mặc định tắt qua khởi động, nguồn mất và OUT1 high-Z. RILIM 1,24 kΩ cho khoảng 0,895 A danh nghĩa. 839–980 mA là dải bảng tại điểm 0,9 A của IC, chưa gồm sai số điện trở, bias ngoài IC và inrush. **Giá trị ICHGSET 7,68 kΩ đang [TBD] trong input spec không phù hợp mục tiêu 0,50 A.** Datasheet ghi ICHG = RICHGSET / 3810 Ω/A ở điểm tham chiếu, tương ứng khoảng 2 A ở 7,68 kΩ theo ngoại suy danh nghĩa. Giữ [TBD] để EF xác nhận miền áp dụng, dung sai và linh kiện, đồng thời kiểm CE/OTG, SYS và BC1.2. [TUSB320LAI](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf) · [BQ25886](https://www.ti.com/lit/ds/symlink/bq25886.pdf) |

Bảng H3 của gói ghi 0,27C/0,44C cho 0,274/0,442 A. Nếu dùng dung lượng danh nghĩa 2 Ah của listing B15, các mức này tương ứng khoảng 0,137C/0,221C. 27%/44% là tỷ lệ so với dòng tối đa 1 A do nhà bán ghi. Giới hạn sạc thật vẫn chờ đúng datasheet pack.

Bề rộng theo công thức và giả định trong gói tái tính được, ví dụ 1,2 A lớp ngoài/lớp trong khoảng 0,386/1,005 mm, 2,5 A khoảng 1,063/2,765 mm. Đây là tính sàng lọc. QA cần đối chiếu stackup, đồng, độ tăng nhiệt, pad/via và dòng xung trước khi dùng làm tiêu chí.

## Ngưỡng bench đề nghị box 08 duyệt

Giữ nguyên mọi [TBD] trong [bench-test-plan.md](claude-support/2026-11-05-mobot-r6/bench-test-plan.md). Các số sau là ngưỡng đề xuất trong gói.

| Ca | Nội dung cần quyết |
|---|---|
| BT-H3 | Nhiệt pack 45 °C [TBD H1], thời lượng điều tiết nhiệt 20% [TBD H3], cách phân biệt timeout và termination. Rà ca NTC hở/ngắn, pack vắng và giới hạn VBUS gồm inrush. |
| BT-H4 / BT-R6 | Xung EN >0,4 V dài >1 µs [TBD H4], rò ≤10 µA mỗi đường [TBD H4/R6], ngưỡng rail tắt 0,3 V và cách đo tổng rò. |
| BT-R1a / BT-R1b | Đo L/R và cận đỉnh ≤0,45 A với các góc đủ để đánh giá R1. Mốc 0,39 mH là sàng lọc, không thay kiểm đỉnh. |
| BT-R2 | Độ dốc [TBD], chênh dòng 20% [TBD], thời gian ngắt [TBD] và nhiệt vỏ motor 60 °C [TBD]. |
| BT-R3 | Ngưỡng dưới tải 6,50 V với ví dụ OCV 6,8 V [TBD], nhiệt vỏ IC 85 °C và pack 45 °C [TBD], cửa sổ dòng 1,85 A. |
| BT-R4 | Đỉnh VM 9,0 V [TBD], điều kiện pack đầy/BMS mở, đảo chiều, xung lặp và tiêu chí dừng. |
| BT-R5 | Bias ≤10 mA ở nguồn Default [TBD], dòng VBUS tổng, NTC và trạng thái OFF qua thay đổi nguồn. |

## Kết quả box 01 và 02

- **01 Architecture** (turn `01a1ac7c-c6f3-7741-a9d7-01faba3477bb`) tách điều kiện có VBUS để tắt tải khỏi điều kiện nguồn đủ để sạc. Registry giữ hai task carrier nguyên khối nên robot phụ thuộc tay cầm `done`, đồng thời review schematic tay cầm là mốc bắt buộc. Cấu hình r7 chung khiến blocker cấp cấu hình của robot cũng có thể chặn tay cầm. Nếu cần mở riêng tay cầm trước khi đóng các blocker chung, cần hồ sơ đúng phạm vi và approval riêng.
- **02 Electronics & Firmware** (turn `01a1ac7c-e88f-7231-950b-6a186f78219a`) kết luận H4/R6 còn OPEN. TPS61023 cần biên EN LOW theo điều kiện bảng, tới 0,35 V. Không kéo EN TPS54302 trực tiếp lên pack 8,4 V vì vượt mức 5,5 V vận hành khuyến nghị và 7 V tuyệt đối. LM66100 cần xét biên OFF 80 mV và diode thân. Joystick và pull-up nối 3V3_DEV vẫn sống ở 10/11, nên cần làm rõ yêu cầu tải OFF và ngân sách LDO. Trên robot, xét riêng khi V5_R còn nhưng VM đã tắt. [TPS61023](https://www.ti.com/lit/ds/symlink/tps61023.pdf) · [TPS54302](https://www.ti.com/lit/ds/symlink/tps54302.pdf) · [LM66100](https://www.ti.com/lit/ds/symlink/lm66100.pdf)
- Box02 tính ngân sách sạc robot tại 4,75 V, hiệu suất giả định 80%, 0,98 A vào và 8,4 V ra cho khoảng 0,443 A trước tải phụ. Dòng sạc thực, biên nhiệt và timer vẫn cần chứng minh. Không dùng kết quả này để đổi setpoint r7. [BQ25886](https://www.ti.com/lit/ds/symlink/bq25886.pdf)
- Khi tới bước mở lease, HQ cần xử lý định dạng config cho preflight. CLI hiện chỉ nhận proposal JSON ở đường dẫn quy định cho cấu hình ở trạng thái `approved`. Record r7 hiện trỏ đến bytes Markdown đã trình và giữ `proposed`. Không tự chuyển trạng thái hoặc thay hash để vượt gate.

## Điều kiện bàn giao

Box 08 được đề nghị trả verdict riêng H4/R6, H3/R1/R5 và từng ngưỡng còn mở. Chỉ rõ điều kiện nào chặn schematic, bằng chứng nào có thể thu sau khi có mẫu, và BT-R1a cần chạy trước lease robot hay có bằng chứng thay thế tương đương. H1/R3 vẫn cần hồ sơ NCC, H2/R2/R4 vẫn cần đo. Người thực hiện bench phải được chỉ định riêng. Packet này chưa được gửi hoặc ghi verdict thay box 08.
