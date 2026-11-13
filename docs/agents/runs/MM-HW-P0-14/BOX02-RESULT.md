Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c43b-84c3-7f32-b2bf-0f6d24dd21a0
Read-only AA electrical proposal under Founder B research direction.

**P0-14 đề xuất một kiến trúc 3 AA NiMH tháo rời/sạc ngoài, dùng module5 V và liên động ngắt toàn bộ bó dây trước PROGRAM.** Hướng này loại bỏ H3 sạc onboard và actuator điện khỏi proposal mới, nhưng chưa đủ bằng chứng chốt cell/module, bảo vệ pin yếu hoặc B1. r12/P0-13 giữ nguyên lịch sử.

Tôi dùng skill research-scout, chỉ đọc nguồn hãng; không tải/ghi file, liên hệ hãng hoặc tạo artifact phần cứng.

**1. Candidate và proposal chọn để phân tích**

| Hạng mục | Candidate | Bằng chứng và giới hạn |
|---|---|---|
| Cell | **3×FDK HR-3UTG**, cùng revision/lô và trạng thái sử dụng | PDF1 trang, ký hiệu ZKH, không thấy revision/date rõ: nominal1,2 V; capacity1900 mAh dưới phép thử190 mA×16 h rồi380 mA tới1,00 V ở20°C; xả khuyến nghị0–50°C. Tài liệu nói các giá trị mô tả performance, không phải guarantees |
| Khay | **MPD BA3AAW** | Hãng xác nhận khay3 AA, wire leads, cao16,38 mm; drawing PDF1 trang. Chưa xác nhận contact resistance/current rating, lực giữ hoặc wire-fuse coordination |
| Module chính | **Pololu S7V8F5 #2123** | Buck-boost, input2,7–11,8 V;5 V; không reverse protection. Khả năng500 mA–1 A và efficiency là characterization/typical, không bảo đảm500 mA tại mọi góc |
| Module đối chứng | **Pololu S13V20F5 #4085** | Input2,8–22 V, typical2 A, không reverse protection; no-load current công bố tới20 mA. Đắt và hao standby hơn, chưa chọn |

Nguồn: [FDK HR-3UTG, p1](https://www.fdk.com/product_e/nimh_e/tech_info/HR-3UTG.pdf), [MPD BA3AAW](https://www.batteryholders.com/part.php?original=AA&override=AA&pn=BA3AAW), [drawing khay](https://www.batteryholders.com/uploads/parts/BA3AAW/datasheets/BA3AAW-datasheet.pdf), [S7V8F5](https://www.pololu.com/product/2123), [S13V20F5](https://www.pololu.com/product/4085).

FDK công bố thay vật liệu HR-3UTG từ tháng4/2026; cần ghim revision/lô cell thực, không mặc nhiên gộp mọi HR-3UTG lịch sử. [Thông báo hãng27/03/2026](https://www.fdk.com/whatsnew-e/release20260327-e.html).

BK-3MCCE giữ **historical candidate**; nguồn Panasonic trả403. Không yêu cầu Founder tải lại.

**Proposal duy nhất:**

```text
3 cell NiMH trong cassette
  → fuse sát đầu cấp
  → bảo vệ đảo cực
  → master disconnect vật lý
  → cell/pack-low inhibit
  → S7V8F5
  → RUN veto phần cứng
  → phích RUN USB-C của B01

B01 ↔ một giắc gang-disconnect:
  toàn bộ signal + diagnostic + power + ground liên quan

Không cổng CHARGE.
Không charger trên carrier.
Cell tháo khỏi khay để sạc bằng charger ngoài phù hợp từng cell.
```

Fuse/reverse-protector chưa có candidate được nguồn xác nhận đủ trong lượt này; không đưa một mã chưa kiểm vào BOM. Không mở thêm custom converter chỉ để thay thiếu dữ liệu module.

**2. Miền điện áp và budget**

**Không dùng3,6 V nominal làm input range.** Chưa có guaranteed cell OCV MAX, DC resistance MAX theo nhiệt/SOC/tuổi thọ hoặc pulse-current envelope từ PDF cell hiện có.

Allocation để review:

| Đại lượng | Proposal/giới hạn |
|---|---|
| Input module khi RUN | **3,0–5,4 V**, yêu cầu tiếp nhận thiết kế, không phải range đã chứng minh của3 cell |
| Output tới B01 | **4,75–5,25 V**, gồm dây/giắc/quá độ; B01 compatibility theo D10 |
| Tổng output RUN | **≤500 mA**, gồm B01, joystick/nút, bleed và tải lấy cùng rail |
| Công suất output tại500 mA |2,375–2,625 W |
| Efficiency dùng tính |η≥0,80 là allocation, không phải guarantee module |
| Dòng input tại3,3 V/2,625 W |0,9943 A, chưa cộng tải trước converter |
| Dòng input tại3,0 V/2,625 W |1,09375 A, chưa cộng tải trước converter |
| Peak/inrush |TBD; không dùng500 mA output làm peak input |
| Runtime |Chưa xác nhận;1900 mAh thử ở380 mA không chứng minh dung lượng tại khoảng1 A và UVLO cao hơn |

Pololu công bố S7V8F5 no-load enabled current<0,2 mA; SHDN LOW còn dòng qua pull-up100 kΩ. Vì vậy **electronic shutdown không phải OFF zero-current**. Master disconnect vật lý mới cắt nhánh tải; cell vẫn tự xả. Tài liệu module HTML không có revision được ghim; schematic hãng là bản©2014. [Pololu usage/specs](https://www.pololu.com/product/2123/specs), [schematic1 trang](https://www.pololu.com/file/0J791/s7v8x-schematic.pdf).

Khả năng500 mA ở input thấp và nhiệt độ hộp phải được xác nhận trước cam kết tải. Không biến đồ thị thermal-limit vài giây thành dòng liên tục bảo đảm.

**3. UVLO: tổng pack không bảo vệ cell yếu nhất**

Đề xuất tách hai chức năng:

- **Pack-low inhibit:** allocation cắt3,30 V, cho phép khởi động lại từ3,60 V; fault/low không tự RUN lại.
- **Weakest-cell inhibit:** proposal cắt từng cell trước khi xuống dưới1,00 V; screening threshold1,10 V với dải mục tiêu1,05–1,15 V. Cho phép khởi động lại chỉ khi mọi cell đạt ngưỡng phục hồi đã review và có fresh-arm.

Các threshold là **yêu cầu thiết kế**, chưa có circuit/error/timing bound. Không lấy1,00 V endpoint thử capacity làm khẳng định mọi chế độ xả đều an toàn tới đó.

Phản ví dụ:

\[
V_{pack}=3,30V,\quad V_1=V_2=1,45V
\Rightarrow V_3=0,40V
\]

Pack vẫn đạt3,30 V trong khi cell3 đã quá thấp. Khi tiếp tục xả, hai cell khỏe có thể ép cell yếu đảo cực. **Hysteresis tổng không sửa được lỗi này.**

Hệ quả hữu hạn:

- Nếu yêu cầu bao **một cell yếu/trộn cell**, cần đo/giám sát từng cell với sense-open và tap-short coverage, hoặc một cassette/protection module có chức năng tương đương.
- Chưa tìm được module3-cell NiMH đáp ứng có dữ liệu hãng trong phạm vi bounded này.
- Không tự bổ sung một BMS Li-ion3S hoặc comparator custom chỉ để gọi đã đủ.
- Một cell lắp ngược trong chuỗi cũng không được giải bằng reverse-polarity bảo vệ cả pack.

Đây là residual thiết kế thật trước khi chốt nguồn, không đẩy sang “thử vài bộ pin rồi công bố hỗ trợ”.

**4. Misuse, đảo cực và short**

| Ca | Proposal xử lý / còn thiếu |
|---|---|
| Ba cell NiMH đúng bộ |Dùng/tháo/sạc cùng bộ; đánh dấu bộ3 viên |
| Trộn tuổi/SOC/model |Không công bố hỗ trợ; weakest-cell protection vẫn cần cho một cell suy yếu |
| Alkaline/R6P |Không thuộc support. Điện áp không đủ phân biệt hóa học; không được claim mạch tự nhận biết |
| Cả cassette đảo cực |Đầu ghép keyed và reverse protection; module hiện không có bảo vệ này |
| Một cell đảo cực |Khay phải cản lắp sai; điện cần phát hiện cell bất thường. Fuse có thể không đứt ở dòng tải bình thường |
| Short sau fuse |Fuse phải phối hợp với dây/contact và dòng ngắn mạch cell; rating/I²t/clearing time chưa xác định |
| Short trước fuse hoặc giữa cell |Fuse đầu pack không bảo vệ mọi đoạn; cần che contact, khoảng cách và định tuyến khay |
| USB cấp vào pin |Không được có đường điện trong PROGRAM; không dựa converter “có lẽ không reverse” |
| Sạc trong khay |Không có connector sạc; hướng dẫn tháo cell, charger ngoài phải hỗ trợ từng cell độc lập |

Charger ngoài loại chỉ nhận2 hoặc4 cell không mặc nhiên phù hợp bộ3 viên. Chưa chọn charger hoặc đưa giá charger vào/ra budget khi chưa chốt phạm vi bán bộ.

**5. PROGRAM: ranh giới vật lý phải ngắt cả đường hồi**

Trình tự đề xuất:

1. Thu hồi RUN; tắt master.
2. Tháo cassette khỏi **mọi contact nguồn và tap**.
3. Rút phích RUN khỏi cổng USB-C B01.
4. Gang-disconnect toàn bộ carrier–B01.
5. Chỉ sau vị trí tách xác định mới mở lối cắm PC; PC/cover chặn nối lại cassette và bó dây.

Danh sách phải đưa vào drawing/continuity matrix của03:

| Đường | Yêu cầu ở PROGRAM |
|---|---|
| RUN5 V và power return |Phích RUN tách cả VBUS/GND; không còn nhánh VIN/3V3 |
| JOY_X/Y, JOY_SW, BTN1/2, JOY_VCC |Tách toàn bộ |
| RUN_REQUEST, FRESH_ARM, WDI, RELEASE |Tách toàn bộ |
| LOCK_POSITION, SAFETY_STATUS, SECOND_POSITION |Tách toàn bộ; pull-up không vòng qua giắc |
| E1–E4 |Giữ resource; nếu kết nối thực thì phải qua cùng ranh giới |
| Battery taps/sense |Không kéo tới B01; tháo cùng cassette |
| Ground phụ, shield/drain, USB shell |Không có cầu nối carrier–B01 ngoài ranh giới đã phân tích |
| Vít, spacer, vỏ dẫn điện, test/program header |Không tạo bypass; test lead phải nằm trong fault/usage envelope |
| D+/D−, CC của phích RUN |Chỉ thuộc cáp đã rút; không có nhánh hub/cáp Y/song song |

Không coi công tắc hai cực của pin là đã ngắt signal/ground. Không dùng shutdown converter hoặc một bit position làm chứng cứ các contact thực sự tách.

**6. Năng lượng dư sau unplug**

Đề xuất phân vùng tụ: module/input ở carrier; tụ B01 ở phía B01; không gộp chúng thành một C tùy ý.

Với allocation **Ceff≤100 µF, V≤5,25 V**:

\[
E_{max}=\tfrac12CV^2=1,378125mJ
\]

Nếu thực tế1 mF thì13,78125 mJ; không được vẫn dùng witness100 µF.

Hai bleed10 kΩ±1%, một hở, Rremaining≤10,1 kΩ:

- Không injection: tới0,8 V mất≤1,9002 s.
- Với injection allocation10 µA: plateau0,101 V, tới0,8 V khoảng2,0169 s.

Đây là phép tính có điều kiện. Chưa có Cmax toàn cụm hoặc leakage/bypass đã khép. **Tách vật lý không đồng nghĩa0 V**, và0,8 V chưa tự là acceptance năng lượng an toàn của kiến trúc mới.

Sau gang-disconnect, PC có thể cấp B01; năng lượng đó được giữ ở miền B01, không được có đường nạp ngược cell. Thời gian xả carrier chỉ hữu hạn khi mọi injection thật đã được liệt kê.

**7. W/fresh-arm và mất lệnh**

Giữ W software-only, không PWM/DMA tự feed. Áp dụng quan hệ phase/token đã được Box08 review, không redesign FSM.

- Cold start, brownout, watchdog hoặc pin-low xóa quyền; phục hồi nguồn không RUN.
- Giữ HIGH qua thay pin/reset không fresh-arm.
- Rút giắc WDI gây timeout carrier; nhưng trạng thái PROGRAM được chứng minh bằng **physical gap**, không chờ watchdog để thay thao tác ngắt.
- Robot phải hết hạn lệnh khi mất tay cầm/radio; không dùng watchdog tay cầm thay robot link-timeout.
- Các role G-B16/E1–E4 giữ nguyên; ý nghĩa position/status cần cập nhật sang liên động thủ công.

**8. Chi phí và đầu vào cần03**

Giá niêm yết hãng kiểm ngày**10/11/2026**: S7V8F5 **US$9,95/chiếc**; S13V20F5 **US$17,95/chiếc**. Đây chưa gồm landed cost và không chứng minh tổng robot+tay cầm<1 triệu đồng. Giá MPD trên trang là MOQ lớn, không dùng làm giá lẻ. Cell/khay/charger/fuse/giắc/PCB/vỏ hiện **chưa có giá hợp nhất**; không đưa ra cost range giả. [Pololu #2123](https://www.pololu.com/product/2123), [#4085](https://www.pololu.com/product/4085).

03 cần trả:

- Geometry buộc tách pin, taps, RUN plug và gang connector trước khi PC tiếp cận.
- Cản lắp lại pin/giao diện khi PROGRAM; xét cắm hờ, dây vòng và một chi tiết hỏng.
- Khay3 cell, che contact, chống lắp ngược và giữ fuse sát nguồn; không lấy lò xo khay làm đường giữ100/200 N.
- Trình tự thay pin thường ngày khác thao tác PROGRAM.
- Bao dây/contact/ground/shield và lượng tụ ở mỗi phía; định danh mọi đường tách.
- Fit và BOM hợp nhất, kể cả charger ngoài nếu thuộc bộ bán.

**Disposition cho08:** đủ để review **kiến trúc/hướng nghiên cứu** với một module và cell cụ thể. Chưa đủ nhận thiết kế cuối: weakest-cell protection, fuse/reverse/contact ratings, output/load envelope, residual-energy acceptance và interlock geometry vẫn mở. H3/actuator cũ chỉ được HQ supersede có lý do sau duyệt phạm vi mới; không ghi PASS.
