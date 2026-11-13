# MoBot V2 · Các việc cần xử lý trước schematic tay cầm

Ngày 06/11/2026. Tổng hợp từ Electronics & Firmware (box 02) và review độc lập QA (box 08). Kết luận chung **changes_requested**. Phạm vi bàn giao là sửa và làm rõ **đầu vào thiết kế tay cầm** để tái review.

## Snapshot đã review

Ba tệp nằm trong `docs/hardware/claude-support/2026-11-06-pcb-status/final/`. HQ tính lại SHA-256 và đối chiếu đúng snapshot.

| Tệp | SHA-256 |
|---|---|
| kicad-input-spec-r7.md | `75f0c86978d1f3039b6131542b6f2ece0e8b01eff0ed1e18d1ae41bd182615c7` |
| final-values.md | `87036c18e77b268a858ff6c2aa5fdbe375acd5c882bc7643039b9fe624b11dfc` |
| final-bom.md | `5848c32851d1ec7192ac84ec1e249aff955e39d72d4719dbe81c1f093ec42fff` |

Spec đã bỏ tụ SEL, thêm eFuse U9 nối tiếp VBUS và dùng biến thể latch-off. Giữ các sửa đổi này làm điểm xuất phát, nhưng kiểm trên đường mạch và trạng thái lỗi thực tế.

## 1. Trình tự cấp VBUS và lỗi đơn · Chặn schematic

- **Hiện trạng:** R55/R56/C29 lấy từ `VBUS_PROG`. Q5 theo `LOAD_EN`, tức lệnh ngắt, chưa chứng minh U6 đã ngắt hai chiều, I/O đã hở hay rail cũ đã xả. PG để NC. U6 dính dẫn vẫn có thể cho U9 bật; U9 dính đóng bỏ qua Q5. Q5 mất drive/hở có thể để EN_PASS tự lên. Điện trở cuối dây chỉ giúp phát hiện đứt sense khi detector còn bias.
- **Số liệu để đối chiếu:** mô hình box 02 với bước VBUS 4,4–5,5 V, R ±1%, C ±10%, rò EN ±0,1 µA và C29 xả hết cho 3,20–8,08 ms tới ngưỡng EN. Cắm lại nhanh hoặc C29 còn điện có thể rút ngắn trễ. Giá trị 64,44 µs của U6 là typical ở điều kiện thử của TI. Khoảng hở ≥2,8 ms trong bảng D-PASS chưa được bảo đảm.
- **Cần trả:** một kiến trúc ngắt độc lập, giám sát sense và veto sau pass trước D1. Điều kiện bật nguồn mới dựa trên xác nhận cách ly thực tế và rail dư. Trình bảng `00/10/01/11` và chuyển tiếp, gồm cắm/rút cả hai thứ tự, gần đồng thời, nảy tiếp điểm, đứt sense, U6/U9 dính dẫn, mất bias/POR, tụ còn điện. Chỉ rõ lớp nào còn hoạt động khi từng linh kiện hoặc dây lỗi, cận timing và điều kiện ngắt nếu không xác nhận được.
- **Nguồn:** spec § tay cầm, hàng J4–U9; values mục D-PASS. [TI TPS25947 Rev. C](https://www.ti.com/lit/ds/symlink/tps25947.pdf)

## 2. Latch Q6/Q7, SW4 và lỗi eFuse · Chặn schematic

- Giữ SW4 qua lúc veto xuất hiện rồi nhả có thể khiến Q6/Q7 giữ bật lại mà không có lần nhấn mới. TPS259474L latch-off với lỗi được hãng quy định, nhưng fault U6 chưa xóa quyền chạy cấp hệ thống.
- Cần khóa OFF khi fault, USB, UVLO, reset hoặc mất bias. Chỉ nhận lần nhấn mới sau khi thấy nút nhả trong trạng thái hợp lệ. Trình bảng trạng thái cho giữ nút xuyên qua cắm/rút, lỗi và phục hồi. Các mốc 106–319 µs dựa vào điện dung giả định, cần thay bằng cận có nguồn hoặc giữ TBD.
- **Nguồn:** spec hàng Q6/Q7/SW4. [DMG2305UX](https://www.diodes.com/datasheet/download/DMG2305UX.pdf) · [DMN2075U](https://www.diodes.com/datasheet/download/DMN2075U.pdf) · [TPS25947](https://www.ti.com/lit/ds/symlink/tps25947.pdf)

## 3. I/O và USB data · Chặn schematic

- Hai TMUX1511 đủ **sáu đường**, gồm JOY_X, JOY_Y, JOY_SW, BTN1, BTN2 và JOY_VCC. **Hai** SEL dư, cần sửa dòng checklist đang ghi ba. JOY_VCC là đường cấp nguồn và phải được tính riêng.
- Bỏ tụ SEL giải quyết trễ RC cũ. Ước tính 2,88 µs dựa trên 130 pF ký sinh, chưa tính đủ quá trình kéo LOAD_EN xuống và VDD ramp. Cần chứng minh SEL ≤0,45 V theo điều kiện datasheet, các kênh hở trước khi rail ngoại vi rời dải, và tổng rò/điện áp rail tắt trong quá độ. Giữ ADC settling TBD khi thiếu R/C và cấu hình ADC.
- D+/D− vẫn nối J4–J5 khi U9 OFF. Cần bản đồ đường USB theo đúng revision interposer và DevKit, giữ đường VBUS qua U9 và jumper bypass hở. Chứng minh cận backfeed qua CP2102/ESD khi mất nguồn hoặc ramp, hoặc đề xuất cách ly data có trình tự. Xét cả đường data dính ON.
- **Nguồn:** spec hàng R26/U7/U8 và J4/J5. [TI TMUX1511 Rev. B](https://www.ti.com/lit/ds/symlink/tmux1511.pdf) · [Silicon Labs CP2102/9](https://www.silabs.com/documents/public/data-sheets/CP2102-9.pdf)

## 4. Ngân sách dòng, B15, UVLO và H3 · Còn mở

- R13/R54 **5,11 kΩ** cho **0,652 A danh nghĩa**. Khoảng 0,545–0,758 A là dải sàng lọc, không phải cận dòng toàn cổng USB. Tại 5,00 V, pin 3,20 V và η giả định 80%, khoảng đó quy về 1,06–1,48 A đầu pack trước tải phụ và sụt áp. U9 có thể cho hơn 500 mA. Chốt ngân sách host Micro-USB theo chế độ được phép, kể cả trước enumeration, inrush và hành vi timer quá dòng. Xét nguồn USB-C sạc riêng.
- B15 LK37478 còn thiếu hồ sơ đúng cell/PCM, nội trở hoặc sụt áp theo độ dài xung ở pin yếu, đặc tuyến NTC và profile sạc. Cận falling tĩnh mới khoảng 3,262 V, còn khoảng 62 mV tới 3,20 V để bao phủ sụt áp và trễ ngắt. Giữ TBD khi chưa có dữ liệu đúng pack.
- Giữ setpoint H3 0,40 A danh nghĩa làm mục tiêu đã chọn. Cần chứng minh tải OFF khi NTC hở/ngắn, pack vắng hoặc PCM mở. VBAT nối VPACK nên phải xét chế độ test LDO khi THERM gần VDD. Phân biệt timeout trong pha CV với kết thúc do dòng giảm. Chốt ngân sách dòng USB-C gồm bias, đèn, inrush và nhiệt.
- **Nguồn:** spec hàng charger và U6/U9. [TPS25947](https://www.ti.com/lit/ds/symlink/tps25947.pdf) · [Microchip DS20002005C](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf)

## Gói kết quả đề nghị gửi lại HQ

1. Một bản delta đề xuất trên snapshot nêu trên, ghi từng net/linh kiện thay đổi, nguyên nhân và sơ đồ khối. Kèm bảng quyền cấp nguồn theo trạng thái và lỗi đơn, có cận đã chứng minh, giả định và chỗ còn TBD.
2. Bản đồ thông mạch và revision interposer, cùng hồ sơ B15 nếu có. Nếu thiếu, chỉ rõ dữ liệu nào cần để đóng từng finding. Tách kiểm chứng trước schematic khỏi phép đo xác nhận sau khi có mẫu. Bench hiện UNKNOWN.
3. Danh sách thay đổi vật chất để HQ lập revision/hash tay cầm. Controlled VBUS, eFuse nối tiếp, latch và thay đổi cách ly I/O vượt ba thay đổi H3/R1/R5 trong bytes r7. Biên bản duyệt nhập từ gói ghi 07/11 và đang chờ HQ đối chiếu trực tiếp; chưa dùng để mở lease.
4. Chỉ bàn giao phân tích và đề xuất. HQ giữ queue, phê duyệt và quyền ghi KiCad. Box 08 tái review đúng snapshot đã sửa.

Nguồn nội bộ: box 02 turn `01a1ae69-d82e-7723-9eb2-2c4ec129d022`, box 08 turn `01a1ae69-ece3-75a2-88e8-468c7c7dbc33`.
