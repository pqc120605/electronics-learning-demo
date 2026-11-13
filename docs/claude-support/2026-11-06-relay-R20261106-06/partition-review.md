# Phản biện phân hoạch bo con công suất robot · RELAY R-20261106-06

Task `MM-HW-MOBOT-IF-001`, `MM-HW-MOBOT-ROBOT-KICAD-001`. Ngày 06/11/2026. Reviewer phần cứng, chỉ đọc, mức thiết kế. Không sửa file nào của Codex.

## 0. Nhãn chứng cứ và những gì đã/chưa đọc

Nhãn: **[HÃNG-WEB]** trích trang sản phẩm Pololu tôi đã mở và đọc trong phiên này (06/11/2026, trang không ghi revision). **[CODEX]** trích từ file Codex, tôi không tự đối chiếu. **[TÍNH]** do tôi tính. **[SUY LUẬN]** lập luận cơ chế, chưa kiểm. **[KHÔNG CÓ SỐ ĐO]** chưa có số đo. **[CHƯA XÁC MINH]** chưa mở nguồn hãng. Giá trị thiếu: **TBD**.

| Nguồn | Trạng thái |
|---|---|
| Pololu #2130 (trang sản phẩm: Overview, Pinout, Current limiting) | Đã đọc toàn văn trang. **Ảnh sơ đồ (schematic) trên trang chưa đọc được** → topology VMM/FET/tụ trên module chưa xác minh. |
| Pololu #4981 S13V25F6 (trang sản phẩm: Features, Connections) | Đã đọc toàn văn trang. Không có sơ đồ, không có cận VOUT bị đẩy áp. |
| TI DRV8833, Rev. E (SLVSAR1E) | Trang sản phẩm TI xác nhận có Rev. E và mục lục (§7.3.4 nSLEEP Operation, §7.3.5.3 UVLO, §9.1 Bulk Capacitance, §9.2 Power Supply and Logic Sequencing). **Nội dung các mục không tải được trong trình duyệt (PDF không mở, bản HTML chỉ ra mục lục). Chưa đọc số nào của datasheet.** |
| TI TPS63070 (SLVSC58B), TI LM73100 | **Không mở.** Mọi số dùng bên dưới là [CODEX]. |

Hệ quả: các cận điện của DRV8833/TPS63070/LM73100 trong tài liệu này không phải "đã đọc datasheet". Mục §6 liệt kê việc cần đọc.

## 1. Phân hoạch ưu tiên

Nguyên tắc: mặc định motor tắt phải là **tính chất của chính bo con** (kéo xuống đặt trên bo con), không phụ thuộc đầu ghép, MCU hay firmware. Vòng dòng hồi VM (motor → thân diode driver → tụ VM → GND driver) phải nằm trọn trong một PCB, **không có đầu nối trong vòng**.

| Khối | Phương án ưu tiên | Lý do chính |
|---|---|---|
| MCU, OLED, cảm biến, sạc | Module bán sẵn tháo lắp, qua đầu cắm có khóa | Dòng nhỏ, lỗi đầu ghép chỉ làm mất dữ liệu; không được cấp quyền bật motor trực tiếp. |
| Đường công suất VM (TPS63070, LM73100, DRV8833, tụ bulk, mạng hấp thụ, R sense) | **Một bo con duy nhất** (hướng Codex Box 02), driver là IC DRV8833 hàn trên bo con | Giữ vòng hồi ngắn; đặt kéo xuống cho nSLEEP, EN, IN trên bo con; đặt R1 sense và mạng hấp thụ sát chân VM. |
| Ranh giới carrier ↔ bo con | Chỉ VBAT, GND, một tín hiệu MOTOR_EN, 4 đường IN, nFAULT, PRESENT | VM không đi qua đầu nối. |
| #2130 | **Không dùng làm đơn vị tháo lắp trên đường công suất V1.** Dùng được cho mẫu thử/bench, hoặc phương án B (xem §3) nếu đạt điều kiện | Xem §3, §4. |
| #4981 | **Loại làm converter chính V1.** Giữ làm đối chứng bench | EN mặc định bật qua pull-up trên module; không có cận VOUT bị đẩy áp (§4). |

**Ranh giới tại VBAT, không tại VM.** Nếu converter nằm trên carrier thì VM 6 V và dòng hồi phải qua đầu nối: vòng dòng hồi dài, đầu nối lỏng làm rail nổi hoặc đẩy xung vào driver. Đặt ranh giới ở VBAT (trước converter) giữ vòng này trong bo con. Đầu nối VBAT vẫn là điểm yếu: xem F1, F2 trong §2.

**Tín hiệu vào chân tắt được, nhưng chỉ khi kéo xuống nằm phía bo con.** Một kéo xuống phía carrier mất khi đầu ghép lỏng; kéo xuống phía bo con thắng cả MCU Hi-Z lẫn đầu ghép hở. Điện trở kéo xuống phải thắng cả pull-up nội MCU lúc reset/boot (chân strapping): R_pd chọn từ VIL tối thiểu của chân đích và pull-up nội tối đa của MCU. Cả hai **TBD** (cần datasheet).

## 2. Bảng lỗi đầu nối / mất bias / cấp ngược

"Chặn" là yêu cầu thiết kế để motor tắt hoặc phần hư hại bị giới hạn, chưa là kết quả đo.

| # | Tình huống | Hậu quả nếu không bảo vệ | Yêu cầu chặn | Kiểm |
|---|---|---|---|---|
| F1 | Lỏng hoặc mất một chân VBAT, GND vẫn còn | Converter sụt áp, dao động tải xung; VM thấp bất thường | Đầu nối ≥2 chân VBAT song song, khóa cơ; UVLO đã chốt (6,40–6,60 V) tắt rail, chặn ngược LM73100 không cho rail nổi | Rút chậm từng chân, ghi VM, nSLEEP |
| F2 | Mất GND công suất, tín hiệu GND còn | Dòng hồi chạy qua chân tín hiệu, qua MCU/USB; điện áp tín hiệu lệch so với GND driver | ≥2 chân GND công suất cắm **trước** và rút **sau** chân tín hiệu; chân GND tín hiệu cạnh GND công suất; điện trở nối tiếp trên tín hiệu **TBD** | Rút GND công suất khi IN đang cao: đo VIN-pin so GND driver |
| F3 | MOTOR_EN hở/đứt | Phụ thuộc kéo xuống | nSLEEP, EN converter, IN đều kéo xuống trên bo con → tắt | Hở từng đường, đo đầu ra Hi-Z |
| F4 | Mất bias logic carrier (3V3 mất, MCU reset, GPIO Hi-Z) | GPIO nổi hoặc pull-up nội đẩy cao | Kéo xuống bo con thắng pull-up nội (R_pd **TBD**); quyền RUN giữ ở carrier nhưng mặc định không phụ thuộc phần mềm | Giả lập reset/brown-out, đo trạng thái chân |
| F5 | Cắm nửa chừng (một số chân chạm) | Một IN cao, IN kia hở → motor chạy một chiều; nSLEEP chạm sớm | Chân PRESENT ngắn nhất, nối GND qua bo con; MOTOR_EN chỉ cho phép khi PRESENT = thấp. Thứ tự chân: GND → VBAT → tín hiệu → PRESENT | Cắm chậm từng nấc, ghi motor |
| F6 | Cắm xoay 180° | Cấp VBAT vào chân tín hiệu | Vỏ đầu nối khóa phân cực (không đối xứng) | Cơ khí; thử cắm ngược |
| F7 | Cấp ngược cực pin | LM73100 hoặc converter phá hủy | Bảo vệ đảo cực **trước** converter (ngoài LM73100 phía motor); chọn phần tử theo hồ sơ T8; chưa chọn MPN | TBD |
| F8 | VM bị đẩy áp khi converter tắt/VIN mất | Rail nổi; U8 chịu VOUT > cận | LM73100 chặn ngược + mạng hấp thụ độc lập (đã phân xử Codex); cận U8 chưa có (R-04 #12) | Ca "OUT có áp trước, IN mất đột ngột" (R-04) |
| F9 | Tháo bo con khi đang chạy | Xung L đập vào đầu nối; chân carrier còn mang VBAT, có thể chập | Cấm thao tác (tài liệu); chân VBAT phía carrier thụt, che; hoặc mạng hấp thụ trong bo con xả hết trước khi nhả chân | Thử tháo nóng trên mô hình |
| F10 | #2130 nSLEEP hở | Module kéo nSLEEP lên (mặc định bật) [HÃNG-WEB] | Không dựa nSLEEP làm bảo vệ trên #2130; dựa vào IN thấp (xem §4) | Thử hở nSLEEP, IN hở |
| F11 | #4981 EN hở | Pull-up 475 kΩ lên VIN → converter bật [HÃNG-WEB] | Kéo xuống phải gắn **trên module hoặc cùng bo**, không qua đầu ghép (xem §4) | Thử hở EN |

## 3. Tiêu chí chấp nhận hoặc loại từng module

Không có số đo; mọi tiêu chí là điều kiện để mở KiCad hoặc để module được giữ.

### Pololu #2130 (DRV8833)

**Loại làm đơn vị tháo lắp V1** nếu có bất kỳ điều kiện sau:
1. Cần thay đổi nSLEEP mặc định (pull-up trên module [HÃNG-WEB]) bằng cách tháo linh kiện trên module. Đó là module sửa, mất ý nghĩa bán sẵn.
2. Không đọc được sơ đồ ra: giá trị pull-up nSLEEP, hướng MOSFET chống đảo cực, điện dung VM trên module, điểm cắt ISEN.
3. Đo/tính cho thấy dòng đi ngược VMM → VIN qua MOSFET chống đảo cực khi VMM cao hơn VIN (xem Câu hỏi Q1).

**Giữ làm phương án B** (bo con có đặt #2130) chỉ nếu đồng thời:
- Nguồn cấp từ LM73100 vào **VMM** (trang hãng nói VMM có thể cấp nguồn bo [HÃNG-WEB]) và VIN để hở, hoặc có số liệu rằng đường VMM → VIN không phải đường hồi bất lợi.
- IN1–IN4 kéo xuống trên bo con; tắt motor dựa vào **IN thấp** (trang hãng: IN kéo thấp nội bộ → vô hiệu đầu ra mặc định [HÃNG-WEB]; bảng chân/trạng thái DRV8833 [CHƯA XÁC MINH]).
- R1 0,62 Ω hai kênh: cắt cầu ISEN và hàn 1206 cho **cả hai** kênh [HÃNG-WEB: "cut the break points… solder current sense resistors"]. Công suất [TÍNH]: ở ngưỡng 0,387 A trên 0,62 Ω ≈ 93 mW (ngưỡng 160/200/240 mV lấy từ [CODEX], không tự xác minh); 1206 đủ nếu công suất định mức ≥ 0,25 W (**TBD**, theo linh kiện chọn).
- Mạng hấp thụ và bulk C trên bo con sát chân VMM/GND của module, vòng đo được (TBD nH, TBD mm).

**Chấp nhận** khi mọi mục trên đều có số/sơ đồ ra.

### Pololu #4981 (S13V25F6)

**Loại làm converter chính V1** vì:
- EN hở = bật (pull-up 475 kΩ lên VIN) [HÃNG-WEB]. Mất đầu ghép EN làm rail VM sống mà không ai ra lệnh. Với LM73100 phía sau, motor vẫn tắt nhờ IN thấp, nhưng điều kiện "tắt đồng thời converter" mất tính chất.
- Bảo vệ đảo cực "up to 20 V" áp dụng ở VIN [HÃNG-WEB]; trang không nêu VOUT chịu được bị đẩy áp. Điều này **không** chứng minh gì về VOUT (R-04 #12 vẫn mở).
- Điện dung VOUT trên module (có tụ điện phân, trang hãng nói) không công bố: tổng điện dung VM không kiểm soát được, tính hấp thụ khó.

**Chỉ giữ làm đối chứng bench/fallback**, và chỉ chấp nhận làm V1 nếu đồng thời:
- Có LM73100 (hoặc phần tử chặn tương đương) giữa VOUT và rail motor, nên VOUT chỉ chịu rò ngược (rò **tối đa** từ datasheet, không dùng 4,8 µA điển hình, [CODEX]).
- Có điện trở kéo EN xuống hàn trên module hoặc trên bo con, **trước** đầu ghép (xem §4).
- Có điện dung VOUT đo được và đủ nhỏ so với bulk C của bo con để không trộn ngân sách.
- Hãng cung cấp cận VOUT khi EN thấp, hoặc ca R-04 #12 có số đo.

### Module khác (MCU, OLED, cảm biến)

Chấp nhận khi: đầu cắm có khóa phân cực; không có đường nào từ chúng tới nSLEEP/EN/IN trừ qua MOTOR_EN của carrier; Echo HC-SR04 ≤ mức logic chân MCU (tài liệu hiện có đã nêu kiểm).

## 4. Rà đặc biệt

**nSLEEP.** #2130 kéo nSLEEP **lên** trên module [HÃNG-WEB] → mất bias hoặc hở không tắt được. Tắt motor khi hở chỉ có được nhờ IN kéo thấp nội bộ [HÃNG-WEB, chưa đối chiếu datasheet]; điều này đúng với hở hoàn toàn, **không** đúng với cắm nửa chừng (F5). Trên bo con có DRV8833 hàn: nSLEEP kéo xuống bo con; cận VIL/VIH, kéo xuống nội của DRV8833 và trạng thái đầu ra khi sleep **[CHƯA XÁC MINH]** (§7.3.4).

**EN mặc định (#4981).** Pull-up 475 kΩ EN→VIN; ngưỡng lên 1,0–1,2 V, ngưỡng xuống điển hình thấp hơn 100 mV [HÃNG-WEB]. Điện trở kéo xuống cần: V_EN = VIN·R_pd/(475 kΩ + R_pd) phải thấp hơn ngưỡng lên tối thiểu 1,0 V với biên → R_pd < 475 kΩ·(V_biên)/(VIN − V_biên). Ví dụ [TÍNH] với V_biên = 0,5 V, VIN = 8,4 V (**giả định 2S đầy, chưa xác minh**): R_pd < 30 kΩ. Chạy từ GPIO 3,3 V qua pull-up 475 kΩ lên VIN 8,4 V: dòng vài µA đổ vào chân, dùng cực máng hở/NPN (EN chịu điện áp tối đa **[CHƯA XÁC MINH]**).

**R1 0,62 Ω, hai kênh.** Đã chốt, không mở lại. Với #2130, ghi nhận: sense nối GND mặc định (không giới hạn dòng) [HÃNG-WEB]; cần cắt cầu hai kênh. Dòng chặn thấp hơn dòng kẹt nên module 1,2 A không dùng hết khả năng.

**Chênh GND.** #2130 một mạng GND cho nguồn motor và tham chiếu điều khiển [HÃNG-WEB]. Hậu quả thiết kế: dòng sense và dòng hồi chung đường GND với tham chiếu IN; chân GND tín hiệu phải nối vào cùng chân GND công suất tại module (sao). Dòng R1 ~ 0,4 A × điện trở tiếp xúc: 0,4 A × 20 mΩ = 8 mV [VÍ DỤ, giả định điện trở]; tiếp xúc lỏng làm giá trị này lớn hơn nhiều.

**Vị trí tụ/shunt.** Bulk C và mạng hấp thụ phải gắn tại chân VM/GND của DRV8833 (hoặc VMM/GND của #2130) trên cùng PCB. Điện dung trên module #2130 [CHƯA XÁC MINH: cần sơ đồ]; tổng 297 µF theo [CODEX] giả định cùng một VM, không gồm tụ module; giới hạn 470 µF cho tổng tụ VOUT TPS63070 [CODEX §7.3] phải tính lại nếu có thêm tụ module.

**Cận xung đầu.** Giữ cấu trúc A/B/C và bảng #1–#12 của [review R-04](../2026-11-06-relay-R20261106-04/review-result.md). Cập nhật: ca C (thả/dốc) ngoài phạm vi theo founder; ca tay quay bánh vẫn mở. Không thêm cận mới ở đây.

**Bảo vệ dự phòng.** Ba lớp độc lập, mỗi lớp không phụ thuộc lớp trước: (1) kéo xuống IN/nSLEEP/EN trên bo con; (2) LM73100 chặn ngược + mạng hấp thụ độc lập (D2 hiện là lớp thứ hai, chưa độc lập, theo [CODEX] F4); (3) UVLO đã chốt cho VBAT. Thêm: cầu chì/PTC VBAT trên bo con (giá trị **TBD**, từ dòng vào và dòng kẹt). Quyền RUN ở carrier là lớp *phần mềm*, không phải lớp an toàn.

## 5. Câu hỏi mở (không phải lỗi)

- **Q1.** MOSFET chống đảo cực của #2130 có dẫn ngược VMM → VIN khi VMM cao hơn VIN không? [SUY LUẬN]: với P-MOSFET cực cổng nối GND thì kênh dẫn hai chiều, nên có thể có. [KHÔNG CÓ SỐ ĐO], [CHƯA XÁC MINH: cần sơ đồ].
- **Q2.** LM73100 có EN/UVLO riêng không, mặc định khi hở? [CHƯA XÁC MINH].
- **Q3.** TPS63070 EN hở: bật hay tắt, pull nội? [CHƯA XÁC MINH].
- **Q4.** DRV8833: nSLEEP và IN có pull nội xuống không, trạng thái IN1=IN2=0? Pololu nói IN kéo thấp nội bộ [HÃNG-WEB]; datasheet [CHƯA XÁC MINH].
- **Q5.** Dòng vào bo con khi bật (inrush) và lúc ngắt: TBD (T8).

## 6. Dữ liệu bắt buộc trước KiCad

| # | Dữ liệu | Nguồn | Chặn KiCad? |
|---|---|---|---|
| 1 | Sơ đồ #2130 (pull-up nSLEEP, hướng MOSFET chống đảo, tụ VM, điểm cắt ISEN) hoặc quyết định bỏ #2130 | Trang Pololu #2130, mục Resources/Schematic | Có (nếu dùng #2130) |
| 2 | DRV8833 Rev. E: VIL/VIH nSLEEP, IN; kéo nội; trạng thái đầu ra sleep/IN thấp; thời gian thức; UVLO; abs max VM và chân logic; ISEN min/max | TI SLVSAR1E §6.x, §7.3.4, §7.3.5.3, §9.1–9.2 | Có |
| 3 | TPS63070: EN hở, ngưỡng EN, chịu VOUT bị đẩy áp (hiện chưa có), điện dung tối đa | TI SLVSC58B | Có |
| 4 | LM73100: rò ngược **tối đa**, thời gian đáp ứng **tối đa**, abs max IN/OUT, EN/UVLO | TI LM73100 | Có |
| 5 | Đầu nối VBAT và tín hiệu: MPN, dòng định mức theo nhiệt, điện trở tiếp xúc, thứ tự chân, giữ chắc, phân cực | Datasheet nhà sản xuất đầu nối | Có |
| 6 | Điện áp pack tối đa (đang giả định 2S đầy 8,4 V, chưa xác minh), dòng pack | Hồ sơ pack | Có |
| 7 | R_pd: VIL min chân đích, pull-up nội MCU (chân strapping khi boot) | Datasheet MCU + #2 | Có |
| 8 | Dữ liệu T8 / cận xung / năng lượng hồi | Chat `relay06-t8-data` và [R-04](../2026-11-06-relay-R20261106-04/review-result.md) | Có |
| 9 | Cận vòng dòng hồi (TBD nH, TBD mm) | Dẫn xuất từ #2, #8, mạng hấp thụ | Có (trước định tuyến) |
| 10 | Điện dung VOUT #4981 (nếu giữ làm fallback) | Đo hoặc hãng | Chỉ khi dùng #4981 |

Không đủ #1–#9 thì không mở KiCad cho bo con công suất. Bench (T1–T8) vẫn tách riêng, NOT_RUN.
