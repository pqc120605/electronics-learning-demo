# MoBot V2 · P0-02 · Phản biện kỹ thuật tư vấn (07/11/2026)

Phạm vi: chỉ đọc hai tài liệu được đính kèm — `mobot-v2-p0-02-handoff-2026-11-07.md` và `mobot-v2-p0-02-deepseek-prompt.md`. Không đọc hai proposal JSON, packet OFF-release, sơ đồ, file KiCad hay số đo bench. Không có hash nào được xác nhận trong tài liệu này.

Đây là đầu vào tư vấn. Nó không phải phê duyệt kỹ thuật, không đổi queue, không đổi cấu hình, và không biến TBD / NOT_RUN thành PASS. Mọi kết luận dưới đây là **trên giấy** trừ khi ghi rõ là cần mẫu.

Cột **Kết luận** dùng đúng bốn nhãn: **đủ căn cứ trên giấy**, **ứng viên có điều kiện**, **cần đúng mẫu**, **cần quyết định Founder**.

Nguồn đã đối chiếu (mã hiệu + revision + trang):

| Mã | Revision | Vị trí đã đọc |
|---|---|---|
| TI TLV6710 | SNVSAV4B, Rev B 10/2018 | §5 tr.3, §7.5 tr.5 (VIT, VHYS, IIN, VOL, IDD, UVLO, POR) |
| Microchip MCP73833/4 | DS20002005C | DC Characteristics tr.3–4, AC Characteristics tr.5 |
| Jauch 250832 | Rev 1.2, 29.07.2022 | tr.2 (charging, PCM) |
| Ultralife UBBL20 | UBM-05196 Rev J, 07.03.2023 | tr.1 |
| RS PRO 176-9352 | datasheet 1 trang | tr.1 |
| TI BQ25886 | SLUSD88A, Rev A 06/2019 | tr.7–8 (VREG, ICHG, ITERM, ILIM, VRECHG) |
| TI TPS25810 | Rev C, theo review Box 02 | chưa tự đối chiếu trang — đánh dấu ở dòng H-PWR-03 |
| JLCPCB JLC04161H-3313A | theo review bố trí | 4 lớp 1,6 mm, đồng ngoài/trong 35 / 15,2 µm |

---

## 1. HANDSET-POWER-DESIGN · OFF thực và lỗi một điểm

| ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Cần Founder quyết |
|---|---|---|---|---|---|---|
| H-PWR-01 | đủ căn cứ trên giấy | Bàn giao §"Delta mới", ví dụ 1 kΩ / 4,40 V / 0,10 mA / ±0,05 mA | 1 kΩ ±1% ⇒ 990–1010 Ω; I_cấp,min = 4,40/1010 = 4,356 mA; trừ ε = 4,306 mA. I_OFF,max = 0,10 + 0,05 = 0,15 mA. Ngưỡng hợp lệ bất kỳ trong (0,15; 4,31). 1 mA thoả, nhưng trung bình nhân √(0,15×4,31) = 0,80 mA cho hai biên cân hơn. | Dòng nhỏ nhất còn giữ được chốt hoặc cấp quyền cho tải — chưa có số này. | PASS khi I_OFF,max+ε < I_th < I_cấp,min−ε **và** I_th < I_giữ,chốt,min; đo cả quá độ tụ và kiểm rail bật lại khi bỏ tải | Không |
| H-PWR-02 | đủ căn cứ trên giấy | Bàn giao §"Delta mới", công thức bleed | V∞ = 10 µA × 10,1 kΩ = 0,101 V. t = 10,1k × 47µ × ln((5,5−0,101)/(0,8−0,101)) = 0,4747 × 2,044 = **0,971 s**, khớp ví dụ. Nếu bleed hở: V∞ không có cận ⇒ không tồn tại t hữu hạn được bảo đảm. | C_eff,max thật, I_back,max thật, và bleed có nằm sau switch hay không. | PASS khi V∞ < V_safe và t ≤ cửa sổ xác nhận; bleed hở ⇒ chỉ được giữ chốt hoặc đo sau cách ly vật lý | Không |
| H-PWR-03 | ứng viên có điều kiện | TI TPS25810 Rev C **theo review Box 02, chưa tự đối chiếu trang** | Ca PC cấp B01 trong lúc RUN OUT gặp sink khác cần ba chứng minh tách biệt: (a) 5 V từ PC không nuôi ngược RUN OUT qua body diode/đường kéo lên; (b) công suất bleed không vượt nguồn PC; (c) EN thấp hoặc mất bias của TPS25810 không mở đường OUT. | Sơ đồ B01, trạng thái EN thấp, hành vi mất bias, dòng ngược thực đo. | PASS khi dòng ngược dưới ngưỡng và RUN OUT < 0,8 V trong cửa sổ, ở cả ba trạng thái EN | Không |
| H-PWR-04 | cần đúng mẫu | — (thiết kế, không có datasheet) | Hai đường cắt nối tiếp chỉ độc lập khi khác nguồn điều khiển, khác miền bias và khác đường hồi. Ma trận lỗi tối thiểu: kẹt dẫn khóa 1; kẹt dẫn khóa 2; đứt từng đường điều khiển; chập chéo hai đường điều khiển; mất bias chung. | Sơ đồ khối có tách miền; mẫu để đo trở kháng OFF từng khóa. | PASS khi **mỗi** lỗi đơn còn ít nhất một khóa OFF và I_OFF đo được < ngưỡng ở H-PWR-01 | Không |
| H-PWR-05 | cần đúng mẫu | — | Hai kênh sense dùng chung GND hoặc chung bias thì một lỗi GND làm cả hai báo "an toàn" — đây là lỗi chung, không phải lỗi đơn. Cần tách đường hồi và kiểm bằng cách nâng GND sense 0,5 V. | Trở kháng đường hồi, điểm nối GND, trở kháng nguồn sense. | PASS khi lệch GND sense 0,5 V vẫn còn ít nhất một kênh báo không an toàn | Không |
| H-PWR-06 | cần quyết định Founder | Bàn giao §"Cơ khí" (8–20 N, 10.000 chu kỳ) | 8–20 N là đặc tính **đầu nối** theo chuẩn, không phải lực giữ của gá hay chốt. Bleed 0,97 s ở H-PWR-02 không thể nằm trong cửa sổ cơ khí (~ms); bleed chỉ dùng cho bảo trì. Cửa sổ cơ khí phải so với OFF **điện** (detector + logic + eFuse), không so với thời gian xả. | Bản vẽ đầu nối có chiều dài chân; hành trình chốt; thời gian OFF điện xấu nhất. | PASS khi phích rời vùng giữ **muộn hơn** OFF điện xấu nhất sau sai số: t_pin_release,min − ε > t_off,max + ε | Có, nếu phải đổi thứ tự chân hoặc cửa sổ xác nhận |

## 2. UVLO hai ngưỡng (TLV6710)

| ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Cần Founder quyết |
|---|---|---|---|---|---|---|
| H-UVLO-01 | đủ căn cứ trên giấy | TLV6710 SNVSAV4B §7.5 tr.5: VIT−(INA) 397/400/403 mV, IIN ±25 nA max | V_fall,min = 0,397 × (1 + 71,928/10,010) − 0,1 µA × 71,928 kΩ = 3,2497 − 0,0072 = **3,2425 V**. V_fall,max = 0,403 × 8,21441 + 0,0072 = **3,3176 V**. Tái lập đúng 3,242–3,318 V. Biên tới 3,20 V = **42 mV**. Dùng đúng IIN datasheet (±25 nA) thì biên là **48 mV**. | Ngân sách ±100 nA gồm những thành phần nào (rò PCB, IIN, rò tụ). | PASS tĩnh; chỉ PASS đầy đủ khi tổng trễ phát hiện→tải OFF nhỏ hơn 42 mV quy ra thời gian | Không |
| H-UVLO-02 | cần đúng mẫu | TLV6710 §7.5 tr.5; review UVLO tr.1 | V_rise = VIT+ × (1 + R1/R2) + R1 × (VIT+ − V_pullup)/R_H. Với 80/10 kΩ, V_pullup 3,3 V, R_H 4,7 MΩ: 0,4055 × 9 − 80k × 2,8945/4,7M = 3,6495 − 0,0493 = **3,600 V** typ, dải xấp xỉ 3,55–3,67 V. **Không tái lập được 3,558–3,642 V** nếu không biết R_H và rail kéo lên. | Giá trị R_H, rail kéo lên, và rail đó có mặt bất cứ khi nào pack còn điện. | PASS khi V_rise,min > V_fall,max (3,558 > 3,318 ✓) **và** rail kéo lên không mất trước pack | Không |
| H-UVLO-03 | đủ căn cứ trên giấy | TLV6710 §7.5 tr.5: IDD 8/11 µA; IIN ±25 nA | I_chia = 4,2 V/82 kΩ = 51,2 µA; tại 3,3 V = 40,2 µA. Cộng IDD 11 µA ⇒ **51–62 µA**, tức **51–62%** ngân sách OFF 0,10 mA ở H-PWR-01. | Cầu chia có nằm trên rail luôn có điện không; có ngắt được khi OFF không. | Ảnh hưởng trực tiếp I_OFF,max của phép kiểm 1 kΩ; nếu không ngắt, hạ ngưỡng phát hiện xuống tương ứng | Không |
| H-UVLO-04 | đủ căn cứ trên giấy | TLV6710 §7.5 tr.5 chú thích (1)(2): UVLO 1,3/1,5/1,7 V; V(POR) 0,8 V | Khi VDD dưới UVLO: OUTA kéo thấp, OUTB high-Z. Dưới POR 0,8 V cả hai không xác định. Vì vậy tín hiệu khóa RUN phải lấy từ **OUTA** (thấp khi điện áp thấp) và phải có pull-down cứng, không dựa vào trạng thái high-Z. | Xác nhận trong sơ đồ OUTA thật sự là đường khóa RUN. | PASS khi mất bias ⇒ RUN khóa, kể cả khoảng 0,8–1,5 V | Không |

## 3. HANDSET-PACK-H3 (Jauch 250832 + MCP73833)

| ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Cần Founder quyết |
|---|---|---|---|---|---|---|
| H-PACK-01 | cần quyết định Founder | MCP73833 DS20002005C tr.3: VREG 4,168/4,20/4,232 V ở TA −5…+55 °C, IOUT 10 mA, VDD 5,2 V. Jauch Rev 1.2 tr.2: quá áp 4,28 ± 0,05 V | Chồng lấn = 4,232 − 4,230 = **2 mV**, tái lập đúng. Thêm line regulation 0,30 %/V (cùng datasheet tr.3) ⇒ 4,232 × 1,0024 = **4,242 V**, chồng lấn 12 mV. Ở 0,40 A, load regulation **không được đặc tả** (chỉ 10–100 mA) nên không thể chứng minh CV luôn dưới ngưỡng PCM. | Dòng tải thực tại CV, VDD thực, phân bố ngưỡng PCM theo lô Jauch. | **Không đạt ở cấp chứng minh**: không chứng minh được 4,232 < 4,230. Cần CV thấp hơn hoặc văn bản Jauch xác nhận PCM có trễ/ngưỡng đủ lớn | Có (đổi CV/profile) |
| H-PACK-02 | ứng viên có điều kiện | MCP73833 tr.4: VT2 0,235/0,25/0,265 V; ITHERM 47/50/53 µA. NTC giả định 103AT-2, R25 10 kΩ, B 3435 | R_trip = VT2/ITHERM ∈ [0,235/53µ = 4,434 kΩ; 0,265/47µ = 5,638 kΩ] ⇒ T ∈ **[40,6; 47,6] °C**. Thêm ±1% R25 và ±1% B ⇒ tới **47,9 °C**. Jauch cho sạc 0–45 °C ⇒ vượt tối đa **2,9 °C**. | NTC thật của pack (R25, B) và vị trí đặt so với cell. | Chỉ PASS khi T_cắt,max ≤ 45 °C. Trên giấy hiện **không đạt** ở góc VT2 thấp / ITHERM cao | Có, nếu phải đổi charger hoặc thêm cắt ngoài |
| H-PACK-03 | đủ căn cứ trên giấy | MCP73833 tr.4: VT1 1,20/1,23/1,26 V | R_trip ∈ [1,20/53µ = 22,64 kΩ; 1,26/47µ = 26,81 kΩ] ⇒ T ∈ **[1,5; 5,3] °C**. Sạc bị chặn dưới 1,5–5,3 °C, tức luôn chặn trước mốc 0 °C của Jauch. | — | PASS tĩnh ở nhánh lạnh | Không |
| H-PACK-04 | cần đúng mẫu | Jauch Rev 1.2 tr.2: bảng PCM có dòng "NTC" nhưng **không** cho R25/B | Mọi tính ở H-PACK-02/03 đang giả định 103AT-2. Nếu pack dùng NTC khác, nhiệt độ cắt dịch theo cả hai phía. | Bảng R–T hoặc cặp R25/B đúng revision; NTC có ra đầu nối hay không. | PASS khi có bảng R–T đúng revision và tính lại H-PACK-02/03 | Không |
| H-PACK-05 | đủ căn cứ trên giấy | Jauch tr.2: standard 1250 mA, max 2500 mA. MCP73833 tr.3: IREG ±10% | 0,40 A trên 2,6 Ah = **0,154C**; dải 0,356–0,444 A = 14–17% dòng max. Tổn hao tuyến tính (5,0−4,2) × 0,4 = **0,32 W**; θJA DFN 41 °C/W (tr.5) ⇒ +13 °C. | Nhiệt thực trong vỏ. | PASS tĩnh về dòng và nhiệt | Không |
| H-PACK-06 | đủ căn cứ trên giấy | MCP73833 tr.5: elapsed timer 0 / 3,6–4,4 / 5,4–6,6 / 7,2–8,8 h | t_CC = 2,6 Ah / 0,356 A = **7,3 h** ở góc dòng thấp, chưa tính CV. Timer 8 h có min 7,2 h ⇒ **ngắt sớm trước khi đầy**. | Chọn TE = 0 (tắt timer) hoặc xác nhận profile nạp. | PASS khi timer tắt hoặc cận dưới ≥ 8,8 h | Không |

## 4. B01, cơ khí, bó dây và fab

| ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Cần Founder quyết |
|---|---|---|---|---|---|---|
| H-B01-01 | cần đúng mẫu | — | Không thể suy CC/VBUS, trở CC hay hành vi khi chỉ có CC mà không có VBUS từ ảnh chụp. Cần sơ đồ module CH340 đúng revision. | Sơ đồ, revision module, CoC lô. | PASS khi CC/VBUS khớp sink USB-C và không back-feed sang miền pack | Không |
| H-B01-02 | cần đúng mẫu | — | Liên kết ảnh PCBA với SKU 02030089 hoặc EP000723 chỉ chứng minh được bằng nhãn lô + CoC, không bằng hình dạng bo. | Ảnh tem lô, CoC, bản vẽ có revision. | PASS khi số lô trên ảnh khớp CoC | Không |
| H-MECH-01 | cần đúng mẫu | Bàn giao §"Cơ khí" (8–20 N, 10.000 chu kỳ) | 8–20 N và 10.000 chu kỳ là đặc tính đầu nối, không dùng làm lực giữ gá, góc kéo hay tuổi thọ chốt. Cần đo riêng F_giữ, hành trình, độ rơ, và đồng bộ kênh đo. | Máy đo lực, gá mẫu, chốt thật. | PASS khi t_pin_release,min − ε > t_off,max + ε, đo trên cùng mẫu | Không |
| H-FAB-01 | đủ căn cứ trên giấy | JLC04161H-3313A: 4 lớp, 1,6 mm, đồng ngoài/trong 35 / 15,2 µm (theo review bố trí) | IPC-2221, ΔT 10 °C: 0,80 mm ngoài (1 oz) ⇒ **2,03 A**; 0,65 mm ⇒ **1,75 A**; 1,76 A trên 0,65 mm ⇒ ΔT ≈ 10,1 °C. Lớp trong 15,2 µm: 1 A cần ≈ **1,80 mm** (xấp xỉ theo bề dày) ⇒ không đi pack/RUN ở lớp trong. Via 0,30 mm ≈ 1 A (quy tắc, không phải datasheet) ⇒ ≥ 2 via cho 1,76 A. | Stackup có kiểm soát từ fab; số via thực; chiều dày đồng sau mạ. | PASS khi pack/RUN ở lớp ngoài hoặc đủ rộng theo bảng, và DRC khóa quy tắc này | Không |

## 5. Robot (B04, UBBL20-C1, RS PRO 176-9352, R5/R1)

| ID | Kết luận | Nguồn đúng mã/revision và trang | Phép tính, cận và giả định | Còn cần hồ sơ/mẫu/đo gì | Điều kiện PASS/FAIL | Cần Founder quyết |
|---|---|---|---|---|---|---|
| R-B04-01 | ứng viên có điều kiện | BQ25886 SLUSD88A tr.7–8: ICHG ±15% tại 500 mA, 0–85 °C; ICHG = RICHGSET/3810. Ultralife UBM-05196 Rev J tr.1: khuyến nghị 466 mA, max 1,63 A | 500 mA ⇒ **425–575 mA**. 575 mA = 1,23× khuyến nghị và 0,35× max. Nếu muốn đúng khuyến nghị: RICHGSET = 466 mA × 3810 = 1,775 kΩ → E96 **1,78 kΩ** cho 467 mA. | Văn bản xác nhận 466 mA là khuyến nghị tuổi thọ hay giới hạn. | PASS khi dòng max ≤ 1,63 A **và** có xác nhận bằng văn bản cho 575 mA | Không, trừ khi đổi R5 |
| R-B04-02 | đủ căn cứ trên giấy | BQ25886 tr.7: VREG 8,358–8,442 V khi RSET > 150 kΩ. Ultralife tr.1: OV 4,35 ± 0,025 V/cell. RS PRO tr.1: OV 4,325 ± 0,025 V/cell | Biên tới ngưỡng PCM: 8,700 − 8,442 = **258 mV** (Ultralife); 8,650 − 8,442 = **208 mV** (RS PRO). Không chồng lấn. | — | PASS tĩnh | Không |
| R-B04-03 | ứng viên có điều kiện | BQ25886 tr.8: ITERM 10–800 mA; tại 50 mA: 42–60 mA (25 °C), 18–75 mA (0–85 °C) | Ultralife yêu cầu giữ CV đến 50 mA; charger thực tế ngắt 42–75 mA. Trên 2,75 Ah, chênh lệch này chỉ ảnh hưởng phần trăm dung lượng cuối. | Chấp nhận của nhà bán. | PASS nếu nhà bán chấp nhận ngắt tới 75 mA; nếu không, siết ITERM và kiểm lại | Không |
| R-B04-04 | cần quyết định Founder | Ultralife tr.1: đầu VHR-2N (2 chân). RS PRO tr.1: 2 dây đỏ/đen. BQ25886 cần TS | Cả hai pack chỉ đưa 2 cực, **không có NTC ra ngoài**. TS phải dùng NTC trên bo ⇒ không đo nhiệt cell; profile JEITA mặc định không bảo vệ cell. | Xác nhận PCM có NTC nội và ngưỡng, hoặc chấp nhận NTC bo với hệ số ghép nhiệt đã đo. | PASS khi có đường đo nhiệt cell có cận và đúng vị trí | Có |
| R-B04-05 | cần đúng mẫu | Ultralife tr.1: PTC 2,6 A hold tại +20 °C | 1,76/2,6 = **68%** hold tại 20 °C. Cần derating tại 40 °C; nếu 80–90% thì còn 2,1–2,3 A. Đây là giả định, không phải số datasheet. | Đường cong hold/trip theo nhiệt độ. | PASS khi I_budget < hold(40 °C) theo đường cong thật | Không |
| R-R5-01 | cần đúng mẫu | BQ25886 tr.8 (CE, /CE) | CE mặc định tắt qua ramp, mất bias và Default chỉ chứng minh được trên mẫu; datasheet không cho một bảng trạng thái đủ cho cả ba ca. | Mẫu + sơ đồ miền bias. | PASS khi CE high-Z ở mọi trạng thái chưa được cấp quyền | Không |
| R-R1-01 | cần đúng mẫu | — | Hấp thụ VM phụ thuộc L motor, dòng phanh và thời gian lặp; chưa có số nào trong bàn giao. | L, I, profile phanh, nhiệt. | PASS khi V_M ≤ 9,0 V với xung lặp và khi mất VIN/bias | Không |

---

## 6. Phản biện số liệu trong bàn giao

Chỉ nêu chỗ tái lập được hoặc không tái lập được, kèm phép tính.

1. **3,242–3,318 V: tái lập đúng.** 0,397 × (1+71,928/10,010) − 0,1 µA × 71,928 k = 3,2425; 0,403 × (1+72,072/9,990) + 0,0072 = 3,3176. Không có sai số.
2. **42 mV: đúng, nhưng nên ghi rõ nguồn của ±100 nA.** IIN của TLV6710 là ±25 nA max (§7.5 tr.5), tức 1,8 mV trên 72 kΩ, không phải 7,2 mV. Nếu ±100 nA là ngân sách có chủ đích (rò PCB + rò tụ), giữ nguyên; nếu không, biên thực là 48 mV và nên ghi con số đó.
3. **2 mV chồng lấn CV–PCM: tái lập đúng** từ hai datasheet. Nhưng 2 mV là ở điều kiện bảng của MCP73833 (10 mA, VDD 5,2 V). Ở 0,40 A, load regulation không được đặc tả, và line regulation 0,30 %/V đẩy CV lên 4,242 V. Vì vậy "2 mV" là cận lạc quan nhất, không phải cận xấu nhất.
4. **0,97 s: tái lập đúng** (0,4747 × 2,044). Công thức và ví dụ khớp nhau.
5. **3,558–3,642 V: không tái lập được.** Công thức cần R_H và điện áp rail kéo lên; với R_H 4,7 MΩ và rail 3,3 V tôi tính được 3,600 V typ và khoảng 3,55–3,67 V. Cần con số R_H để khớp. Điểm quan trọng hơn: ngưỡng nhận RUN mới **phụ thuộc rail kéo lên**, nên nếu rail đó mất khi pack còn điện thì ngưỡng đổi.
6. **0,358–0,446 A: khớp** với IREG ±10% và điện trở ±1% (0,356–0,444 A). Chênh 2 mA là do làm tròn.
7. **0,80/0,65 mm: hợp lý cho tay cầm, sát ngưỡng cho robot.** 0,65 mm chỉ đạt ΔT ≈ 10 °C tại đúng 1,76 A; 0,80 mm đạt 2,03 A. Nếu cùng net đi lớp trong 15,2 µm thì cần ~1,80 mm cho 1 A.
8. **8–20 N: đừng dùng làm cận gá.** Đó là đặc tính đầu nối theo chuẩn; nó không nói gì về lực giữ của gá, góc kéo hay tuổi thọ chốt.

## 7. Đầu vào tối thiểu có thể chuyển nhà bán

1. **Jauch 250832:** bảng R–T (hoặc R25 và B) của NTC trong pack; NTC có ra đầu nối không; phân bố ngưỡng quá áp PCM (4,28 ± 0,05 V) và trễ tác động; CV 4,20 V có nằm trong dải cho phép không; dải nhiệt sạc và dung sai.
2. **Ultralife UBBL20-C1:** 466 mA là khuyến nghị tuổi thọ hay giới hạn; đường cong PTC hold/trip theo nhiệt; dòng xung theo thời lượng; xác nhận chỉ 2 cực ra; hành vi PCM khi quá dòng và cách phục hồi.
3. **RS PRO 176-9352:** dòng xung theo thời lượng; ngắt quá dòng và phục hồi; có cân bằng cell hay không; nhiệt độ và tiết diện dây 24 AWG; đầu ghép có định hướng.
4. **Module CH340 (B01):** sơ đồ đúng revision, trở CC, xử lý VBUS/ESD, hành vi khi chỉ có CC, kích thước và dung sai cơ khí.
5. **Fab:** stackup có kiểm soát JLC04161H-3313A kèm chiều dày đồng và Tg; quy tắc DRC cho USB-C/DFN/QFN và pad nhiệt.
6. **Đầu nối:** bản vẽ USB-C có chiều dài chân; bản vẽ GH 12 cực có dòng định mức mỗi tiếp điểm và thứ tự tiếp xúc.

## 8. Câu hỏi còn cần Box 02/03/08 kiểm

1. Dòng nhỏ nhất còn giữ được chốt hoặc cấp quyền cho tải là bao nhiêu? Không có số này thì ngưỡng 1 mA ở H-PWR-01 chỉ là minh hoạ.
2. Giá trị R_H và rail kéo lên của hồi UVLO là gì, và rail đó có mặt khi pack còn điện?
3. Cầu chia UVLO nằm trên rail luôn có điện hay ngắt được khi OFF? 51–62 µA chiếm 51–62% ngân sách 0,10 mA.
4. Bleed RUN OUT có còn nối khi EN thấp hoặc mất bias? Nếu không, không có thời gian xả hữu hạn.
5. Hai kênh sense có dùng chung GND/bias không? Nếu có, phép kiểm nâng GND 0,5 V phải nằm trong D10.
6. Pack Jauch có NTC đưa ra ngoài không, và curve là gì? Nếu không, H-PACK-02/03 không có cơ sở.
7. D10 có giữ nhiệt độ và NTC ngoài phạm vi sáu nhóm đo không? Nếu có, các mục H-PACK-02/03 và R-B04-04 thuộc hồ sơ thiết kế, không phải D10.

## 9. Giới hạn của tài liệu này

- Không có sơ đồ, netlist, file KiCad, hay số đo bench. Mọi con số là tính tĩnh từ datasheet và giả định ghi rõ.
- Không xác nhận hash, không đọc proposal JSON, không đọc packet OFF-release.
- Không kết luận chứng nhận an toàn nào; không thay đổi quyết định đã chốt.
- TBD / NOT_RUN giữ nguyên. Không dòng nào ở trên là PASS bench.
- Nếu muốn dùng kết quả này, Box 08 phải review đúng byte của tài liệu và đối chiếu lại từng datasheet trước khi trình Founder.
