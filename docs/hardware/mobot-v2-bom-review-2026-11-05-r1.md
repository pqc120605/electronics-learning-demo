# MoBot V2 — BOM đề xuất gửi kỹ sư review

**Revision:** `MOBOT-V2-BOM-REVIEW-r1` · **Ngày:** 05/11/2026 (Asia/Bangkok).

**Trạng thái: lựa chọn đề xuất để kỹ sư kiểm, chưa duyệt build/đặt hàng/sản xuất.** Đây là BOM cấp khối và linh kiện chính, không phải BOM lắp ráp đầy đủ. Không có pin map, schematic, PCB, CAD hay firmware kèm theo. Không thay thế cấu hình canonical `MOBOT-HWCFG-001`; không ghi approval hoặc cập nhật queue. Người dùng yêu cầu chọn linh kiện và xuất BOM cho kỹ sư bên mình kiểm.

## 1. Yêu cầu và quyết định đề xuất

- Người mới học mạch; robot và tay cầm DIY riêng; guest/local-first.
- **2 motor N20**, mỗi motor kéo hai bánh cùng bên qua bộ truyền bánh răng; hai bên điều khiển độc lập. Bốn bánh không phải bốn motor. Không encoder trong bộ nền.
- Chọn nghiên cứu **N20 6 V, 100 rpm không tải**. Người dùng đã chọn họ N20; điện áp/tốc độ này là đề xuất của Codex, chưa được duyệt và chưa chứng minh đủ mô-men.
- ESP32 DevKit V1 cắm socket. Carrier robot tối đa 100×100 mm; ưu tiên nhỏ, chưa có bằng chứng fit. Chọn cùng loại DevKit cho tay cầm để dễ học.
- OLED đồ họa đơn sắc; loa robot phát hiệu ứng/lời chào có sẵn. Điện thoại xử lý nhận giọng nói và hội thoại; không mic/STT/AI trên robot. Chưa bao gồm truyền TTS tùy ý tới loa robot.
- Robot: pack Li-ion **2S, 7,4 V danh định / 8,4 V đầy**, sạc từ USB-C 5 V. Tay cầm: pack **1S, 3,7 V / 4,2 V đầy**, cũng sạc USB-C 5 V. Hai loại pack/charger không thay thế lẫn nhau.
- Robot và tay cầm ngừng hoạt động khi sạc. Mục tiêu hỗ trợ củ sạc điện thoại với cáp A–C và C–C; phải kiểm adapter/cáp thật. Không yêu cầu PD/QC điện áp cao, không mặc định mọi củ sạc tương thích.
- Người dùng tự in PETG bằng Bambu Lab A1: vỏ, gá và bánh răng. Chưa chốt cỡ đầu phun, module răng, tỉ số truyền, tải, kích thước bánh/trục.
- **Trần toàn bộ robot + tay cầm vẫn dưới 1.000.000đ. BOM này CHƯA đạt chứng minh ngân sách; dự toán hiện tại vượt trần, cần kỹ sư tối ưu/báo giá trước khi duyệt.** Không tự coi phần vượt là ngân sách được chấp nhận.

## 2. Cách đọc BOM

`R` = robot; `H` = handheld/tay cầm. Số lượng cho **một bộ robot + một tay cầm**. `TBD` = kỹ sư cần xác định. `DNP` = mặc định không lắp. Các ID là ID dòng review, không phải reference designator PCB. Không cộng đồng thời linh kiện thay thế và linh kiện chính.

Giá có nguồn là niêm yết công khai được tra ngày 05/11/2026, không phải báo giá đã xác nhận, không đảm bảo tồn kho/VAT/giao hàng. Mã MPN là lựa chọn để review; hàng module không rõ revision vẫn phải đối chiếu mẫu/drawing trước khi tạo footprint. CSV kèm theo dùng số tiền VND nguyên; ô trống là chưa có giá, không phải 0đ.

## 3. BOM robot và tay cầm

| ID | Khối / lựa chọn chính | Mã MPN hoặc SKU đề xuất | SL R | SL H | Nguồn / giá có nguồn | Việc kỹ sư cần kiểm |
|---|---|---|---:|---:|---|---|
| B01 | DevKit V1 30 chân, CP2102, micro-USB | Supplier SKU **PVN14070**, chọn phân loại micro-USB | 1 | 1 | S01; 148.000đ/board; trang báo hết hàng | Board vendor/revision/header spacing/USB power path chưa rõ; không gọi đây là board Espressif chính hãng. Cần nguồn hàng thay thế cùng kích thước được duyệt |
| B02 | Motor giảm tốc N20, 6 V, 100 rpm, không encoder | GA12-N20 6V 100rpm theo đúng trang S02; chưa có manufacturer winding code | 2 | 0 | S02; 65.000đ/cái | Stall/start/run current, torque, shaft, gearbox ratio và lot; dữ liệu motor N20 khác không thay thế được |
| B03 | Driver hai motor trên PCB | **DRV8833PWPR**, TI, PWP HTSSOP-16 exposed pad | 1 | 0 | S03; chưa có giá | Dòng từng kênh, current regulation, nhiệt, stall/đảo chiều và năng lượng trả về; không dùng peak làm continuous |
| B04 | Pack robot đóng sẵn 2S 2 Ah | MTM **7V2AH-4A-2S1P** | 1 | 0 | S04; 119.000đ/pack, nguồn indexed | Nhà bán công bố bảo vệ/cân bằng, 2 A liên tục/4 A tức thời, 66×19×38 mm. Cần datasheet pack, charge limit, cutoff, peak duration, connector, cell identity; chưa có physical validation |
| B05 | Charger USB 5 V → 2S 8,4 V | **BQ25886RGET**, TI | 1 | 0 | S05/S06; giá tham khảo 2,6131 USD/IC | Chọn 8,4 V; mục tiêu charge ban đầu 0,5 A, tự giảm theo nguồn/nhiệt. IC có chức năng đo nhiệt nhưng cần NTC thật; không tự cân bằng cell |
| B06 | USB-C nhận diện vai trò/mức dòng nguồn | **TUSB320LAIRWBR**, TI | 1 | 0 | S07; chưa có giá | CC detection không thay charger. Kết hợp source policy với BQ25886; no-backfeed và dead-battery behavior phải review |
| B07 | Nguồn motor 6 V buck-boost | **TPS63070RNMR**, TI | 1 | 0 | S08; chưa có giá | Candidate phụ thuộc B02. Switch current không phải output current; có thể phải đổi nếu tải vượt. Kiểm Vin thấp, transient, regen và nhiệt |
| B08 | Nguồn logic/audio robot 5 V buck | **TPS54302DDCR**, TI | 1 | 0 | S09; chưa có giá | Dòng tải đồng thời, headroom/dropout, nhiễu motor/audio, nhiệt. Không cấp motor qua DevKit |
| B09 | Mặt OLED đơn sắc 0,96 inch, 128×64, I2C | Module **SSD1306**, 4 chân, trắng; exact supplier/revision TBD | 1 | 0 | S10 là sourcing lead; chưa có giá chốt | Chọn module dùng được ở 3,3 V, pull-up I2C không kéo lên 5 V; exact controller/địa chỉ/kích thước chưa xác minh |
| B10 | Audio I2S amp trên PCB | **MAX98357AETE+T**, Analog Devices | 1 | 0 | S11; chưa có giá | IC trên PCB, không cộng thêm một module amp. Hạ gain/giới hạn output phù hợp loa; kiểm load/noise/peak power |
| B11 | Loa nhỏ | **8 Ω, 1 W**, đường kính mục tiêu 28–36 mm; supplier SKU TBD | 1 | 0 | Chưa có giá | Exact đường kính/độ sâu và công suất thực; amp có thể vượt 1 W, cần giới hạn |
| B12 | Siêu âm ngoài board | Module **HC-SR04**; exact supplier/revision TBD | 1 | 0 | Chưa có giá | Cần kiểm 5 V supply/echo level, thời gian đo; không nối tín hiệu 5 V trực tiếp vào ESP32 |
| B13 | IR phản xạ ngoài board | Module **TCRT5000**, 1 kênh; exact supplier/revision TBD | 2 | 0 | Chưa có giá | Kiểm cực tính/output/pull-up/3,3 V compatibility; mục tiêu đặt dưới xe, gá/clearance TBD |
| B14 | GPIO expander dự phòng | **MCP23017-E/SO**, Microchip | 0 | 0 | S12; DNP | Chỉ lắp nếu IO budget chứng minh cần; khi đó SL robot đổi thành 1. Không PWM/echo qua expander; chú ý GPA7/GPB7 theo revision datasheet |
| B15 | Pin tay cầm 1S đóng dây, có bảo vệ | Supplier SKU **LK37478**, 18650 3,7 V 2 Ah | 0 | 1 | S13; 35.128đ/pack theo listing | Title ghi 3C nhưng bảng ghi 1C: không dùng 3C làm rating. Xác nhận datasheet/đầu PH2.0/cực tính/dòng và kích thước 18,5×66 mm |
| B16 | Charger tay cầm 1S 4,2 V, có giám sát nhiệt | **MCP73833-FCI/UN**, Microchip, MSOP-10 | 0 | 1 | S14/S15; chưa có giá | Candidate ordering code cần đối chiếu hãng: suffix/charge voltage/timer/termination. Mục tiêu 0,25 A, đánh giá nhiệt và policy nguồn USB; không có power-path dùng khi chạy |
| B17 | Nguồn tay cầm 1S → 5 V | **TPS61023DRLR**, TI | 0 | 1 | S16; chưa có giá | Đủ tải Wi-Fi burst của DevKit ở pin thấp, UVLO/enable và nhiệt; 3,7 A là switch-current specification |
| B18 | Joystick DIY | Module joystick PS2 hai trục, có nút nhấn; SKU TBD | 0 | 1 | Chưa có giá | Vận hành analog ở 3,3 V; kiểm travel, độ cao và ADC; không dùng output 5 V vào ESP32 |
| B19 | Nút chức năng ngoài joystick | Tact switch 6×6 mm; exact MPN TBD | 0 | 2 | Chưa có giá | Footprint/chiều cao/độ bền, debounce; nút joystick là nút thứ ba |
| B20 | USB-C receptacle sạc | **GCT USB4105-GF-A**, suffix stake-length/drawing cần xác nhận | 1 | 1 | S17; chưa có giá | Exact drawing/package revision trước footprint; chỉ connector không chứng minh C–C. Remote cần sink-CC/source policy riêng; B06 chỉ tính cho robot |
| B21 | Socket DevKit | Socket cái 2,54 mm, 1×15 | 2 | 2 | Chưa có giá | Tổng 4 strip; spacing hai hàng theo exact B01, không suy từ pitch 2,54 mm |
| B22 | Công tắc nguồn | Loại slide/rocker, MPN và rating TBD | 1 | 1 | Chưa có giá | Không lấy rating tín hiệu làm rating motor; cần cơ chế disable tải khi sạc |
| B23 | Đo nhiệt pack | NTC gắn pack + dây; MPN/R25/Beta TBD | 1 | 1 | Chưa có giá | Chọn phù hợp từng charger; không dùng điện trở giả để coi đã đo nhiệt. Hai pack chưa được xác nhận có sẵn NTC |
| B24 | Nguồn phụ/bảo vệ/chuyển mức | Bộ linh kiện cho USB CC remote, ESD, reverse-current, overcurrent, motor default-OFF, brownout, level translation | TBD | TBD | Chưa có giá | **Required, chưa định nghĩa MPN/SL.** BMS không thay charger; nguồn DevKit USB lập trình và USB sạc phải chống cấp ngược/chập nguồn |
| B25 | Passives nguồn/logic | Cuộn cảm, sense/feedback resistors, MLCC/bulk caps, LEDs, pulls, test points | TBD | TBD | Chưa có giá | **Required**, kỹ sư chọn theo exact IC/datasheet và tải; phải tách từng giá trị/rating/package ở BOM sản xuất, không dùng lot này để mua/lắp |
| B26 | Connector và dây | Motor×2, pack×2, loa×1, OLED×1, sonar×1, IR×2, LCD×1, expansion×1; harness/contact pairs TBD | TBD | TBD | Chưa có giá | Không phải pin assignment. Chọn keyed housing và dòng dây/connector theo tải; cổng motor/pin không lẫn cổng sensor |
| B27 | PCB carrier | PCB robot + PCB tay cầm | 1 | 1 | Chưa báo giá | Fabrication/lắp ráp, QFN thermal pad/stencil và hao hụt phải tính. Trần board 100×100 mm; chưa có layout, layer count/stackup TBD |
| B28 | Cơ khí tự in PETG | Bộ vỏ/gá/bánh răng cho robot + vỏ tay cầm | 1 bộ | 1 bộ | Chưa có khối lượng/giá | In bằng A1 của người dùng; vẫn tính PETG và in thử/hỏng; chưa có CAD hoặc truyền động được kiểm |
| B29 | Bánh/lốp | 4 bánh, mục tiêu đường kính 43 mm; hub/shaft interface TBD | 4 | 0 | Chưa có giá | Không khóa bánh D-shaft motor cho cả bốn bánh nếu bánh bị động dùng trục khác. Xem lại torque/speed/ground clearance |
| B30 | Trục/ổ đỡ/ốc/collar/spacer | MPN, đường kính, chiều dài và SL TBD | TBD | TBD | Chưa có giá | **Required**, chốt sau concept cơ khí/tải; không gánh toàn bộ lực ngang lên output shaft N20 nếu chưa kiểm |
| B31 | Cáp, vận chuyển, phụ tùng và vật liệu lắp | Cáp USB phù hợp; spares/freight allowance | 1 bộ chung | 0 | Chưa có giá | Người dùng có máy in; không mua máy in. Củ sạc điện thoại có sẵn là giả định, phải bổ sung nếu không có |

**LCD ký tự:** chỉ dự trù cổng trong B26, module LCD 1602/I2C không thuộc bộ nền; DNP. Không microSD, mic robot hoặc dịch vụ AI trả phí trong BOM nền. Không bao gồm điện thoại, dụng cụ hàn và máy in 3D đã có. Không thay thế điện tử bằng module đồng thời với IC tích hợp nếu chưa phát hành revision mới để tránh mua trùng.

## 4. Ngân sách để kỹ sư tối ưu

**Đây là dự toán rủi ro, không phải báo giá trọn bộ.** Tất cả khoảng ở bảng dưới là ước tính của Codex, không phải giá nhà cung cấp, trừ nhóm đầu có link. Chưa chốt chi phí VAT/freight; không dùng để đặt hàng. Không áp tỷ giá tự đoán cho giá USD của BQ25886.

| Nhóm không trùng chi phí | Dự toán VND |
|---|---:|
| 2 DevKit ×148.000 + 2 motor ×65.000 + pack robot 119.000 + pack remote 35.128 (niêm yết S01/S02/S04/S13) | 580.128 |
| IC sạc/USB-C controller/driver và các IC chuyển nguồn B03/B05–08/B16–17 | 200.000–350.000 |
| OLED + amp + loa B09–11 | 70.000–130.000 |
| Siêu âm + 2 IR B12–13 | 40.000–65.000 |
| Joystick/nút/công tắc B18–19/B22 | 20.000–35.000 |
| USB-C connector/socket/NTC/bảo vệ/passives/connector dây B20–21/B23–26 | 80.000–150.000 |
| Hai PCB + lắp ráp B27 | 100.000–200.000 |
| PETG/bánh/trục/ổ đỡ/ốc B28–30 | 50.000–100.000 |
| Cáp/vận chuyển/spares B31 | 70.000–120.000 |
| **Tổng dự toán hiện tại** | **1.210.128–1.730.128** |

**Kịch bản thấp vượt trần 210.128đ.** Mức 935.000đ trong trao đổi trước là phân bổ mục tiêu cũ. Tổng trên dùng giá niêm yết để tham chiếu, gồm cả DevKit S01 đang hết hàng, và khoảng ước tính cho các nhóm còn lại.

| Hướng giảm giá cần kiểm | Mức giảm so với kịch bản thấp | Điều kiện |
|---|---:|---|
| Tìm hai DevKit tương đương ở mức mục tiêu 90.000đ/board | 116.000đ | Đây là giá mục tiêu. Cần tìm hàng và đối chiếu revision, header, đường nguồn USB trước khi thay |
| Để cảm biến siêu âm và IR mua rời, vẫn giữ cổng và dự trù chuyển mức trên PCB | 40.000đ | Cần người dùng chọn. Để có bài tránh vật cản vẫn phải gắn cảm biến tương thích |
| Tối ưu thêm khối nguồn/sạc và chi phí lắp ráp | Tối thiểu 54.129đ sau hai khoản trên | Phải có báo giá và kiểm lại sạc USB-C 5 V, bảo vệ pin, dòng motor, nhiệt và chi phí trọn bộ |

Với cả hai khoản đầu và thêm 55.000đ tiết kiệm, kịch bản thấp còn **999.128đ**. Biên 872đ quá mỏng để chốt giá. Nếu giữ cảm biến trong hộp, sau khi tìm được hai DevKit ở mức mục tiêu, vẫn cần giảm ít nhất **94.129đ** ở các nhóm khác. Các con số giảm là mục tiêu cho vòng review, chưa phải giá mua. Giữ 2 N20, mặt OLED, tay cầm riêng và sạc USB-C trong cả hai hướng.

## 5. Các điểm cần kỹ sư trả lời trên đúng revision này

1. **Motor trước nguồn:** B02 có đủ torque cho bốn bánh và bộ truyền PETG không? Cung cấp motor winding/SKU và stall/start/run current ở điện áp dự kiến. Chọn ratio/RPM khác nếu cần và ghi thay đổi.
2. **Power/current budget:** hai motor khởi động đồng thời, tải kẹt, giảm tốc trả năng lượng, logic/Wi-Fi/audio cùng lúc; kiểm B03/B04/B07/B08, connector, fuse/current limit, thermal và low-battery cutoff. Chưa có rating output converter được chứng minh.
3. **Sạc cả hai thiết bị:** USB-C A–C/C–C source policy, input current, NTC thật, 8,4 V robot vs 4,2 V remote, balancing/BMS, trạng thái đang sạc/kết thúc/lỗi và disable tải khi sạc. B16 đúng suffix phải kiểm bằng thông tin hãng/authorized distributor; chưa duyệt mua.
4. **DevKit/IO:** đúng mẫu board, nguồn cổng USB lập trình vs sạc, backfeed, số GPIO native/PWM/I2S/I2C/ADC, boot/flash constraints và simultaneous peripheral modes. MCP23017 chỉ đổi từ DNP khi có nhu cầu; không có pin map trong tài liệu này.
5. **Module/fit/assembly:** xác nhận module OLED/sonar/IR levels, sound output phù hợp loa, exact package/footprint drawing, connector/keying, antenna clearance và khả năng carrier ≤100×100 mm. Giữ đủ interface cơ khí/lỗ/cổng nhưng chưa tạo CAD/PCB.
6. **Giá:** trả BOM đã chỉnh với exact SKU/MPN/revision, giá tới tay, MOQ/stock/lắp ráp/freight/PETG/spares cho cả bộ; chỉ khi tổng <1.000.000đ mới báo đạt trần.

Kết quả mong nhận: accept / change / unresolved theo từng B-ID; nguồn bằng chứng, phần thay thế, giá, và các blocker còn lại. HK đã tư vấn read-only trong chat; chưa có độc lập EF sign-off hoặc physical validation cho BOM này. Kỹ sư bên người dùng chưa được liên hệ; người dùng tự chuyển tài liệu.

## 6. Nguồn tham chiếu

- S01 — [DevKit PVN14070, 148.000đ, 30P CP2102, trang báo hết hàng](https://chotroihn.vn/mach-module-esp32-devkit-v1-30p-cp2102). Không xác nhận hãng/revision thực tế.
- S02 — [N20 6V 100rpm, 65.000đ](https://dientutuyetnga.com/products/ga12-n20-dong-co-giam-toc-6v-100rpm). Không công bố stall current trên phần trang đọc được.
- S03 — [TI DRV8833, datasheet Rev E](https://www.ti.com/product/DRV8833). Package-specific ratings, không phải rating bất kỳ module.
- S04 — [Pack MTM 7V2AH-4A-2S1P, 119.000đ](https://banpinsac.com/san-pham/pin-sac-7-4v-8-4v-2000mah-4a-mtm). Dữ liệu từ kết quả công khai đã indexed; mở trang trực tiếp bị 403 ở lượt cuối. Supplier claims chưa xác minh bằng datasheet/mẫu.
- S05 — [TI BQ25886](https://www.ti.com/product/BQ25886), [datasheet Rev A](https://www.ti.com/lit/ds/symlink/bq25886.pdf).
- S06 — [LCSC BQ25886RGET, giá tham khảo 1 chiếc 2,6131 USD](https://lcsc.com/product-detail/battery-management_texas-instruments-bq25886rget_C2864444.html). Giá public indexed, chưa là quote/landed cost.
- S07 — [TI TUSB320LAI, datasheet Rev D](https://www.ti.com/product/TUSB320LAI).
- S08 — [TI TPS63070](https://www.ti.com/product/TPS63070). Candidate do HK đối chiếu nguồn hãng; lượt mở lại của lead timeout, không dùng để tuyên bố đã kiểm output tại tải thực.
- S09 — [TI TPS54302, datasheet Rev C](https://www.ti.com/product/TPS54302).
- S10 — [OLED SSD1306/SSD1315 sourcing lead](https://mail.dientumtu.com/san-pham/man-hinh-hien-thi-128x64-oled-0-96-inch-giao-tiep-i2c-ssd1306-ssd1315). Listing gộp hai controller; chưa đủ exact SKU để đóng footprint/module.
- S11 — [Analog Devices MAX98357A, datasheet Rev 16](https://www.analog.com/en/products/max98357a.html).
- S12 — [Microchip MCP23017, DS20001952](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf).
- S13 — [LK37478 product](https://linhkienx.com/pin-sac-18650-2000mah-3-7v-noi-day-co-bao-ve), [catalog price/rating 35.128đ](https://linhkienx.com/san-pham/pin-sac-18650). Title/rating conflict cần xác minh.
- S14 — [Microchip MCP73833/4, DS20002005C](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf).
- S15 — [Authorized distributor listing MCP73833-FCI/UN 4,2 V MSOP-10](https://www.mouser.com/en/ProductDetail/Microchip-Technology/MCP73833-FCI-UN?qs=jZi1jxfVU96PZdBhDFXCmg%3D%3D). Cần xác nhận option code bằng hồ sơ hãng trước mua.
- S16 — [TI TPS61023, datasheet Rev B](https://www.ti.com/product/TPS61023).
- S17 — [GCT USB4105 family](https://gct.co/connector/usb4105). Cần exact suffix/drawing/revision.

Module sạc USB-C VNBD 2S giá rẻ là phương án cost-down, **không phải linh kiện lắp thêm vào B05**: [listing 30.000đ](https://thegioimodule.com/mach-sac-pin-18650-2s-2a-cong-usb-type-c-3-6v-sang-8-4v). Nhà bán công bố 2 A input / 1,1 A charge; chưa có exact IC/revision, NTC, USB-C source-current policy và C–C evidence. Không xem là thay thế tương đương đã duyệt.
