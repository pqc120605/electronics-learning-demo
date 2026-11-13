# MoBot V2 r6 · Tay cầm (1S) · H1–H4

05/11/2026 · Claude hỗ trợ phần cứng, chỉ ghi gói bàn giao. Cấu hình gốc: `MOBOT-V2-CONFIG-r6`, SHA-256 `54657f15…7d104`. Datasheet truy cập ngày 05/11/2026.

Ký hiệu nguồn repo dùng trong file:
- `r6` = `docs/hardware/mobot-v2-config-2026-11-05-r6.md`
- `b15` = `docs/hardware/mobot-v2-r6-handset-b15-evidence.md`
- `pack` = `docs/hardware/mobot-v2-r6-handset-pack-decision.md`
- `ifp` = `docs/hardware/mobot-v2-r6-interface-review-packet.md`
- `bom` = `docs/hardware/mobot-v2-bom-review-2026-11-05-r1.csv`

Datasheet:
- [MCP73833/4 DS20002005C](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf)
- [TPS61023 SLVSF14B](https://www.ti.com/lit/ds/symlink/tps61023.pdf)
- [ESP32 Series Datasheet v5.3](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [ESP32-WROOM-32 Datasheet v3.8](https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf)
- [LM66100 SLVSEZ8A](https://www.ti.com/lit/ds/symlink/lm66100.pdf)
- [TLV6700 SNVSAV2B](https://www.ti.com/lit/ds/symlink/tlv6700.pdf)

Nhãn áp dụng cho điều kiện **gỡ điểm vướng trước khi vẽ KiCad**. Mọi mục vẫn cần bench trên mẫu sau khi có PCB.

---

## H1 · Hồ sơ pack B15 · **CẦN DỮ LIỆU NCC**

### Hiện trạng

| Dữ liệu | Giá trị đang có | Nguồn | Mức tin cậy |
|---|---|---|---|
| SKU | LK37478, OEM, 1S 18650 nối dây có bảo vệ | `b15:9`, `bom` dòng B15 | Nhà bán |
| Hóa học | Li-ion, 3,7 V danh định, 4,2 V đầy | `b15:9` | Nhà bán. Loại cathode (NMC/LCO/…) chưa biết |
| Dung lượng | 2.000 mAh | `b15:9` | Nhà bán |
| Xả / sạc liên tục | 1C (2 A) / 0,5C (1 A). Tiêu đề danh mục ghi 3C | `b15:10` | Mâu thuẫn trong cùng nhà bán; dùng 1C |
| Mã cell, protector, revision | Chưa có | `b15:11` | — |
| Nội trở DC pack, dòng xung, thời lượng | Chưa có | `b15:12` | — |
| Ngưỡng OV/UV/OC, trễ, phục hồi | Chưa có | `b15:13` | — |
| NTC | Chưa xác nhận có | `b15:14` | — |
| Connector, cực tính | PH2.0 hai chân theo danh mục; cực tính chưa xác minh | `b15:10`, `pack:7` | Nhà bán |

### Quyết định về điều kiện dừng

Hóa học cell xác định được ở mức họ: **Li-ion, CV 4,2 V** (`b15:9`). Mức này đủ để tính H2–H3 dưới dạng **giới hạn và công thức**, không đủ để chốt số. Mọi số phụ thuộc cell cụ thể (nội trở, ngưỡng protector, dải nhiệt sạc) ghi [THIẾU]. H2 và H3 không dùng giá trị pack nào ngoài 4,2 V, 2 Ah, 1C và 0,5C của nhà bán.

### Dữ liệu cần lấy từ nhà cung cấp LK37478

Founder hoặc box03 gửi yêu cầu (Claude không liên hệ nhà cung cấp):

1. Mã hãng và datasheet cell (hãng, model, revision), kèm ảnh nhãn cell thật.
2. Mã IC protector và MOSFET; ngưỡng OV, UV, OC/short, trễ, cách phục hồi (tự phục hồi hay cần sạc).
3. Nội trở AC 1 kHz và DC (pulse) của cả pack gồm protector, dây, đầu nối, ở 25 °C và 40 °C, SOC 20 % và 100 %.
4. Dòng xả xung cho phép kèm thời lượng.
5. Dải nhiệt sạc và xả; dòng kết thúc sạc khuyến nghị.
6. Pack có NTC không; nếu có: R25, Beta, số dây.
7. Bản vẽ connector và cực tính.

Nếu không có mục 1–3, `pack:17` đã nêu hướng thay pack có hồ sơ. Đổi pack là revision mới, cần user duyệt.

### Phương án

| | A. Giữ LK37478, lấy hồ sơ | B. Đổi pack có hồ sơ (ví dụ VARTA 56457 201 020) | C. Giữ LK37478, không có hồ sơ |
|---|---|---|---|
| Thay đổi r6 | Không | Có: B15, đầu nối 3 dây, gá (`pack:7`) | Không |
| Dữ liệu an toàn | Phụ thuộc NCC | Ngưỡng PCM, NTC 10 kΩ B3380 (`pack:8-9`) | Không có |
| Rủi ro | Có thể không lấy được | 1 Ah, MOQ 600, Texim báo hết hàng (`pack:11`) | Không chứng minh được không trip |
| Mua ở VN | Có, linhkienx (`pack:11`) | [chưa kiểm chứng] | Có |

### Đề xuất

Phương án A. Mạch carrier không dựa vào protector: UVLO riêng (H2), NTC riêng gắn pack (H3), charger có timer. Nếu NCC không trả mục 1–3, founder quyết định chuyển sang B.

### Rủi ro còn lại

- Pack 18650 OEM giá rẻ có thể dùng cell tái chế hoặc ghi sai dung lượng. Không có hồ sơ thì không loại trừ được.
- Chưa biết ngưỡng UV của protector, nên chưa biết carrier (3,20 V) hay protector cắt trước.

---

## H2 · Tải xung tay cầm · **CẦN ĐO THẬT**

### Hiện trạng

- r6: nhánh 5 V tổng **0,50 A**, dừng tải dưới **3,20 V dưới tải** (`r6:12`).
- Dòng phía pack ở góc thiết kế: `5 V × 0,50 A / (3,20 V × 0,80) = 0,977 A` (`r6:12`, `b15:18`). Hiệu suất 80 % là giả định của r6.
- Tải trên 5 V: DevKit BrijModi (ESP32-WROOM-32 qua AMS1117), joystick, nút (`bom` B01, B18, B19). r6 không có rung hay LED công suất.

### Tính toán

**1. Dòng phát Wi‑Fi.** ESP32 Series Datasheet v5.3, Bảng 5-4: TX 802.11b 1 Mbps, +19,5 dBm = **240 mA typ**, đo ở 3,3 V, 25 °C, duty 50 %. Datasheet không ghi giá trị max. ESP32-WROOM-32 v3.8 yêu cầu nguồn ngoài cấp **tối thiểu 0,5 A** ("Current delivered by external power supply").

AMS1117 là LDO, dòng vào 5 V xấp xỉ dòng ra 3,3 V. Xung TX trên rail 5 V vì vậy khoảng 240 mA typ cộng tải nền. Ngân sách r6 0,50 A tại 5 V vừa bằng mức yêu cầu của module; không còn biên cho tải khác.

**2. Boost TPS61023.** SLVSF14B §6.5: giới hạn dòng valley `ILIM_SW` **min 2,7 A** (VIN 3,6 V, VOUT 5 V). Ước tính dòng ra tối đa, bỏ qua nửa gợn sóng (bảo thủ):

`IOUT,max ≈ (VIN × η / VOUT) × ILIM,min`

| VIN | η (giả định r6) | IOUT,max ước tính |
|---|---|---|
| 3,20 V | 0,80 | 3,20 × 0,80 / 5 × 2,7 = **1,38 A** |
| 3,00 V (sụt do xung) | 0,80 | **1,30 A** |

IC boost có biên ≥ 2,6 lần so với 0,50 A. Giới hạn nằm ở pack.

**3. Sụt áp pack khi xung.** `V_tải = V_hở − I_pack × R_đường` (`b15:19`). Với I_pack = 0,977 A, điện trở đường tối đa để không chạm 3,20 V:

`R_đường,max = (V_hở − 3,20 V) / 0,977 A`

| V_hở (ví dụ) | R_đường,max |
|---|---|
| 3,40 V | 0,205 Ω |
| 3,50 V | 0,307 Ω |
| 3,70 V | 0,512 Ω |

V_hở trong bảng là **giá trị ví dụ**, không phải đường OCV của B15. [THIẾU: đường OCV theo SOC và R_DC pack ở 40 °C, lấy từ NCC theo H1 mục 3].

**4. UVLO carrier.** UVLO rising của TPS61023 max 1,8 V (§6.5), thấp hơn nhiều so với 3,20 V, nên carrier cần UVLO riêng (`b15:20`). Đề xuất TLV6700: ngưỡng 400 mV, sai số tối đa 1 % trên dải nhiệt, nguồn 1,8–18 V, ngõ ra open-drain.

`V_trip = 0,400 V × (R_top + R_bot) / R_bot`. Với R_top = 680 kΩ, R_bot = 97,6 kΩ (E96, ±1 %): V_trip = 0,400 × 777,6 / 97,6 = **3,187 V** danh nghĩa. Sai số ngưỡng ±1 % cộng ±1 % mỗi điện trở cho khoảng ước tính **3,12–3,25 V**. Hysteresis nội 5,5 mV typ là quá nhỏ, cần hồi tiếp ngoài. [TBD: H2, box02 tính điện trở hồi tiếp; đề xuất bật lại ở 3,40 V, cần box08 duyệt vì r6 chưa ghi ngưỡng hồi].

### Phương án

| | A. Giữ r6, đo xung trên mẫu | B. Thêm tụ bulk 5 V lớn | C. Giảm công suất TX bằng firmware |
|---|---|---|---|
| Thay r6 | Không | Không (linh kiện thụ động) | Không |
| Hiệu quả | Có số thật | Đỡ sụt trong vài ms; dòng trung bình không đổi | Giảm dưới 240 mA typ [THIẾU: dòng theo từng mức dBm] |
| Chi phí | Thời gian bench | 1 tụ | Không |

### Đề xuất

A, kèm tụ 5 V theo EVM TPS61023 [TBD: H2, box02 chọn giá trị theo SLVUBP5 §3]. Đo theo `bench-test-plan.md` mục BT-H2.

### Rủi ro còn lại

- ESP32 không công bố dòng TX max; mẫu khác nhau có thể lệch.
- Nếu R_DC pack lớn hơn bảng trên, tay cầm sẽ reset khi bật Wi‑Fi lúc pin yếu.

---

## H3 · Chu kỳ sạc 1S · **CẦN FOUNDER QUYẾT**

### Hiện trạng

- Charger r6: **MCP73833-FCI/UN**, mục tiêu **0,25 A** (`b15:35`, `ifp:62`, `bom` B16).
- Option FCI: VREG 4,20 V; precharge 10 %; ngưỡng precharge 71,5 %; termination 7,5 %; recharge 96,5 %; timer **6 giờ** (DS20002005C, bảng option sản phẩm; `b15:35`).
- r6 yêu cầu NTC đo pack và tải tắt khi sạc (`r6:22`, `r6:26`).

### Tính toán (DS20002005C)

**1. Điện trở PROG.** `IREG (mA) = 1000 / RPROG (kΩ)` (Equation 5-1). Sai số IREG ±10 % (tại 10 kΩ: 90–110 mA; tại 1 kΩ: 900–1100 mA).

| Mục tiêu | RPROG (E96) | IREG danh nghĩa | Khoảng ±10 % |
|---|---|---|---|
| 0,25 A (r6) | 4,02 kΩ | 248,8 mA | 224–274 mA |
| 0,40 A (phương án B) | 2,49 kΩ | 401,6 mA | 361–442 mA |

**2. Timer.**
- 0,25 A: nạp 2 Ah ở CC cần `2 / 0,25 = 8 h`, dài hơn 6 h. Timer min 5,4 h (tELAPSED 5,4–6,6 h) × IREG min 0,224 A = **1,21 Ah**. Nếu pack cạn hơn 1,21 Ah, timer có thể dừng trước khi đầy. Lượng cần nạp lại sau cutoff 3,20 V: [THIẾU: đường xả B15, H1].
- 0,40 A: 5,4 h × 0,361 A = **1,95 Ah**, gần đủ 2 Ah ở CC, chưa tính pha CV.

**3. Nhiệt charger tuyến tính.** Công suất lớn nhất khi vừa chuyển từ precharge sang CC:

`P = (VBUS,max − VPTH,min) × IREG,max`

- VBUS,max = 5,25 V (USB 5 V +5 %) [cần box02 xác nhận theo nguồn dùng thật].
- VPTH,min = 69 % × VREG,min = 0,69 × 4,168 V = **2,876 V** (VPTH/VREG min 69 % cho option 71,5 %; VREG min 4,168 V).

| IREG,max | P | MSOP-10 (θJA 113 °C/W), TJ ở 40 °C | DFN-10 3×3 (θJA 41 °C/W), TJ ở 40 °C |
|---|---|---|---|
| 0,274 A | 0,65 W | 40 + 73,8 = **113,8 °C** | 40 + 26,8 = **66,8 °C** |
| 0,442 A | 1,05 W | 40 + 118,6 = 158,6 °C (vượt TSD 150 °C) | 40 + 43,0 = **83,0 °C** |

θJA theo bo JEDEC 4 lớp (DS20002005C, Thermal Package Resistances); PCB 2 lớp sẽ nóng hơn. Datasheet §6.1.1.2 cũng nêu MSOP-10 ở 5 V ±10 % sẽ vào điều tiết nhiệt. **Đề xuất MCP73833-FCI/MF (DFN-10)**, cùng option FCI, có mã đánh dấu AAAC trong datasheet.

**4. Dòng lấy từ USB.** ISS max 3 mA khi sạc. 0,274 + 0,003 = 0,277 A; với 0,40 A: 0,442 + 0,003 = 0,445 A. Cả hai **dưới 500 mA** của nguồn USB mặc định. Tay cầm sạc được từ mọi nguồn 5 V hợp lệ, chỉ cần hai điện trở Rd 5,1 kΩ trên CC1/CC2; không cần TUSB320 trên tay cầm. Inrush do tụ đầu vào: [TBD: H3, box02 chọn tụ VDD theo DS20002005C §6.1.1.3].

**5. NTC.** ITHERM 50 µA (47–53 µA). VT1 1,23 V (1,20–1,26 V), VT2 0,25 V (0,235–0,265 V). Điện trở NTC tại ngưỡng danh nghĩa: lạnh `1,23 V / 50 µA = 24,6 kΩ`, nóng `0,25 V / 50 µA = 5,0 kΩ`. Nhiệt độ tương ứng phụ thuộc NTC cụ thể: [THIẾU: bảng R–T của NTC chọn cho B23]. NTC hở → THERM > VT1 → ngừng sạc. NTC ngắn → THERM < VT2 → ngừng sạc.

### Phương án

| | A. Giữ r6: FCI 0,25 A | B. FCI/MF 0,40 A | C. Option không timer (AMI) |
|---|---|---|---|
| Thời gian sạc 2 Ah ở CC | 8 h; timer có thể cắt ở 1,21 Ah | khoảng 5 h; timer cho 1,95 Ah | Không giới hạn |
| TJ (DFN, 40 °C) | 66,8 °C | 83,0 °C | Như A hoặc B |
| Dòng từ USB | 0,277 A | 0,445 A | — |
| So với 0,5C của nhà bán (1 A) | 0,27C | 0,44C | — |
| An toàn | Tốt | Tốt | Mất timer an toàn, **không khuyến nghị** cho sản phẩm học sinh |
| Cần duyệt revision | Không (chỉ đổi package nếu chọn /MF) | Có (đổi dòng sạc r6) | Có |

### Đề xuất

**B**: MCP73833-FCI/MF, RPROG 2,49 kΩ ±1 %. Timer 6 h đủ cho gần hết dung lượng, nhiệt nằm trong giới hạn ở DFN, dòng vẫn dưới 500 mA USB. Founder cần duyệt vì đổi mục tiêu 0,25 A của r6. Box08 xác nhận việc đổi package UN → MF có cần revision hay không.

Thay thế: MCP73833-FCI/UN (MSOP) chỉ dùng với 0,25 A và vùng đồng tản nhiệt lớn; vẫn vào điều tiết nhiệt.

Mua ở Việt Nam: MCP73833 [chưa kiểm chứng].

### Rủi ro còn lại

- Chưa có dải nhiệt sạc đúng của B15; ngưỡng NTC có thể lệch dải cho phép của cell.
- r6 cấm vừa dùng vừa sạc (`r6:22`). Phần cứng H4 phải đảm bảo điều này; nếu tải chia dòng, termination sẽ sai.

---

## H4 · Cách ly nguồn và I/O · **GỠ TRÊN GIẤY**

### Hiện trạng

- Bảng 4 trạng thái USB (`r6:18-23`, `ifp:11-16`): có USB nào thì tải carrier và đường carrier → DevKit đều OFF.
- Phát hiện VBUS Micro-USB phải độc lập firmware và đọc trước D1 của BrijModi (`r6:25`, `b15:31`).
- BrijModi đưa USB VBUS qua D1 tới AMS1117 (`docs/hardware/mobot-v2-r5-kicad-preflight.md:8`).

### Kiến trúc đề xuất

1. **Interposer Micro-USB trên carrier.** Carrier có ổ Micro-USB B để người dùng cắm máy tính. D+/D−/GND/VBUS đi qua carrier tới một dây Micro-USB ngắn cắm vào DevKit. Carrier đọc `VBUS_PROG` ngay tại ổ, trước D1 của DevKit. Vỏ che cổng Micro-USB gốc của DevKit để người dùng không bỏ qua điểm đo (`ifp:9`). [TBD: H4, box03 chọn ổ Micro-USB và cáp ngắn].
2. **Một miền I/O.** Joystick (2 trục analog), nút và pull-up lấy nguồn từ chân **3V3 của DevKit**. Khi DevKit có nguồn (từ carrier hay từ USB nạp), ngoại vi cũng có nguồn. Không có I/O nối sang miền đã tắt, nên không có đường cấp ngược qua I/O, kể cả đường analog (`b15:31`).
3. **Đường cấp DevKit.** Boost 5 V → **LM66100** (ideal diode, 5,5 V, 1,5 A, RON 79 mΩ typ) → chân 5V/VIN của DevKit. LM66100 chặn dòng ngược từ DevKit (USB qua D1) về carrier. Chân CE so với VIN: CE cao hơn VIN thì MOSFET tắt. Nối CE với `VBUS_PROG` qua chia áp: có USB nạp thì LM66100 tắt, độc lập firmware. CE abs max 6 V. [TBD: H4, box02 tính chia áp CE để CE > VIN ở mọi trạng thái có USB].
4. **Enable tải bằng wired-AND open-drain.** Net `LOAD_EN` nối EN của TPS61023 (EN > 1,2 V bật, < 0,4 V tắt), kéo lên bằng điện trở từ `VPACK`. Ba phần tử kéo xuống, mỗi phần tử đủ để tắt:
   - Q_PROG (N-MOSFET): gate từ `VBUS_PROG` qua chia áp.
   - Q_CHG (N-MOSFET): gate từ `VBUS_C` qua chia áp.
   - TLV6700 OUTB: kéo thấp khi `VPACK` dưới ngưỡng UVLO (H2).

   Q_PROG và Q_CHG lấy áp gate từ chính USB, nên vẫn tắt tải khi pack cạn, vắng hoặc protector mở. Khi chưa có bias, EN của TPS61023 thấp hoặc không có VIN, boost OFF. TPS61023 ngắt hẳn vào và ra khi tắt ("true disconnection", SLVSF14B Features), nên không có đường pack → 5 V qua diode thân.
5. **Charger.** VDD của MCP73833 chỉ lấy từ `VBUS_C`. STAT1/STAT2/PG chỉ nối LED, không nối GPIO DevKit, để không kéo rail MCU qua pull-up (`b15:28`).

### Kiểm theo 4 trạng thái

| Micro / C | VBUS_PROG | VBUS_C | LOAD_EN | Boost | LM66100 | DevKit lấy nguồn từ | Charger |
|---|---|---|---|---|---|---|---|
| 0 / 0 | 0 | 0 | Cao nếu pack trên ngưỡng | ON | ON | Carrier | OFF (VDD = 0) |
| 1 / 0 | 5 V | 0 | Thấp (Q_PROG) | OFF | OFF (CE) | USB qua D1 | OFF |
| 0 / 1 | 0 | 5 V | Thấp (Q_CHG) | OFF | OFF (không có VIN) | Không | ON |
| 1 / 1 | 5 V | 5 V | Thấp | OFF | OFF | USB qua D1 | ON |

Hai VBUS không nối nhau ở trạng thái nào.

### Phương án

| | A. Interposer + một miền I/O (đề xuất) | B. Buffer Ioff trên mọi I/O | C. Dò USB tại chân 5V DevKit |
|---|---|---|---|
| Chặn cấp ngược I/O | Không còn đường cần chặn | SN74LVC1G125 cho tín hiệu số; analog không giải được (`ifp:9`) | — |
| Phát hiện USB khi pack cạn | Có | Có | Không: sau D1, carrier đang cấp cùng net (`r6:25`) |
| Linh kiện thêm | Ổ Micro-USB, cáp ngắn, 2 MOSFET | Nhiều buffer | — |

### Đề xuất

A. Đủ để vẽ schematic. Bench xác nhận dòng ngược và xung enable (BT-H4).

| Vai trò | Mã | Package | Lý do | Thay thế | Mua ở VN |
|---|---|---|---|---|---|
| Ideal diode cấp DevKit | LM66100DCKR | SC-70-6 | 1,5 A, 5,5 V, CE tắt độc lập firmware | Schottky 2 A; sụt áp lớn hơn, phải kiểm lại dropout AMS1117 [TBD: H4] | [chưa kiểm chứng] |
| Comparator UVLO | TLV6700DDCR | SOT-23-6 | Sai số 1 %, nguồn 1,8–18 V, open-drain; dùng chung cho robot | TPS3700 [chưa kiểm datasheet] | [chưa kiểm chứng] |
| MOSFET kéo LOAD_EN | [TBD: H4, box02 chọn mã hãng loại 2N7002 có VGS(th) max phù hợp chia áp từ 5 V] | SOT-23 | Phổ biến | BSS138 | [chưa kiểm chứng mã cụ thể] |

### Rủi ro còn lại

- Người dùng có thể tháo vỏ và cắm thẳng vào DevKit. Carrier sẽ không biết có USB. LM66100 vẫn chặn dòng ngược về carrier; DevKit nhận hai nguồn OR qua D1 và LM66100, không có xung đột. Còn lại: carrier không tắt tải trong trường hợp này.
- Dòng rò qua chia áp CE và gate khi pack cạn: [TBD: H4, box02 tính; giới hạn đề xuất < 10 µA].

---

## An toàn Li-ion cho học sinh (tay cầm)

**Rủi ro:** cháy hoặc phồng khi sạc quá áp, quá nhiệt, ngắn mạch; cell giả hoặc tái chế; trẻ cắm ngược đầu nối, làm rơi, đâm thủng, để gần nguồn nhiệt; dùng cục sạc không rõ nguồn.

**Biện pháp trong mạch (đề xuất):**
- Chỉ dùng pack có mạch bảo vệ (B15 có theo nhà bán, `b15:9`); không dùng cell trần người dùng tự thay.
- Đầu nối pack có khóa, chỉ cắm được một chiều; in cực tính trên silkscreen.
- Charger có timer, NTC, VREG 4,168–4,232 V; ngừng sạc khi NTC hở hoặc ngắn.
- UVLO carrier độc lập với protector.
- Cầu chì hoặc PTC nối tiếp pack: [TBD: H1, box02 chọn; dòng giữ lớn hơn 0,977 A có hệ số an toàn, dòng cắt dưới ngưỡng OC protector (chưa biết)].
- LED trạng thái sạc; tài liệu hướng dẫn ghi "sạc khi có người lớn".

**Chuẩn có thể áp dụng [cần chuyên gia xác nhận]:** IEC 62133-2 (pin Li-ion), IEC 62115 (đồ chơi điện), IEC 62368-1 (thiết bị ICT), UN 38.3 (vận chuyển pin), QCVN 3:2019/BKHCN (an toàn đồ chơi trẻ em tại Việt Nam). Gói này không khẳng định thiết kế đạt chuẩn nào.
