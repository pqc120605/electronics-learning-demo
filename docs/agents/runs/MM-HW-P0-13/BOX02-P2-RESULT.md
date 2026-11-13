Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c411-4ea2-7920-bc42-eb23b6c27e26
Read-only advisory revision2 received by HQ; verbatim final text follows.

**P0-13-E-P2, cycle1: P1/P2 đã được sửa ở mức topology và logic. Chưa đủ đóng gate:** miền nguồn, reset assertion, fault-current và H3 vẫn còn các cận quyết định cần xác nhận. Không sửa file hoặc liên hệ hãng.

**1. P1 — crossing tách A/B, không dùng chung chip nhận permission**

Đề xuất sàng lọc **4×ISO7041F**, mỗi chip có ba kênh thuận và một kênh ngược:

| Chip | Control D→S | Diagnostic S→D |
|---|---|---|
| A1 | RUN_REQUEST, FRESH_ARM_REQUEST, RELEASE_REQUEST | LOCK_POSITION |
| A2 | WDI; hai input dư giữ mức xác định | SAFETY_A |
| B1 | Cùng ba request, qua nhánh receiver B riêng | SECOND_POSITION_OBSERVATION |
| B2 | WDI qua receiver B riêng | SAFETY_B |

`SAFETY_A/B` được tổng hợp **chỉ phía D** thành SAFETY_STATUS. Không thêm GPIO: vẫn bốn control, ba input và G-B16; mọi chân **UNASSIGNED**.

```text
MCU request
 ├─ buffer input A → ISO A1/A2 → buffer/gate A → state A → permission A
 └─ buffer input B → ISO B1/B2 → buffer/gate B → state B → permission B

Sensor/proof A → state A → diagnostic A ─┐
Sensor/proof B → state B → diagnostic B ─┴→ D-side observation only
```

- A1/A2 dùng `S_A`; B1/B2 dùng `S_B`. Hai rail có regulator, supervisor, decoupling, đường cấp và đường hồi riêng tới điểm nguồn đã định nghĩa.
- Không chung OE, latch, receiver-output, MR driver hoặc pull-up permission giữa A/B.
- Phía D của các isolator lấy nguồn B01 qua các nhánh hạn dòng/tách lỗi riêng; MCU GPIO là điểm request chung đã khai báo.
- Buffer candidate **SN74LVC2G125**: OE kéo lên rail cục bộ, output có pull-down tại receiver. Ioff hỗ trợ partial-power-down, nhưng không thay proof khi rail đang ramp. [SCES204Q, p1,p7](https://www.ti.com/lit/ds/symlink/sn74lvc2g125.pdf).

**Điểm quan trọng của ISO7041F:** EN1/EN2 là **refresh enable**, không phải output-enable. Proposal nối chúng LOW tại từng miền để luôn bật refresh; mode/bias gating nằm ở buffer ngoài.

Datasheet **SLLSF54D, Mar2020**, p5,p13–17,p23: default LOW; propagation MAX175 ns; input-power-loss default MAX750 µs; startup MAX5 ms. Output khi receiver mất nguồn không được coi là LOW bảo đảm; input mạnh có thể nuôi rail nổi qua protection diode. [TI ISO7041](https://www.ti.com/lit/ds/symlink/iso7041.pdf).

**Fault paths**

| Fault đơn | Đường chặn |
|---|---|
| A1/A2 lỗi nhiều output hoặc S_A hỏng | Chỉ mất kênh A; B vẫn có proof/state/driver riêng |
| Diagnostic receiver/tổng hợp phía D stuck-safe | Không nối vào MR, fault-clear hoặc permission A/B |
| Diagnostic lỗi làm B01 treo hoặc phát request sai | Hardware proof/qualification vẫn bắt buộc; thuộc giới hạn MCU/W đã chấp nhận, không tuyên bố phát hiện mọi chuỗi hợp lệ giả |
| D-side rail hoặc input buffer A lỗi | Phải được nhánh tách lỗi giữ khỏi S_B và receiver B; hiện còn cần chọn phần tử hạn dòng và chứng minh clamp |
| Nguồn pack chung mất | Hai nhánh phải fail-off; không gọi mất nguồn chung là hai fault độc lập |

Tách chip đã xử lý phản ví dụ P1 ban đầu. **Lỗi lan qua nguồn/GND hoặc shared MCU GPIO vẫn phải được kiểm bằng mạch cụ thể**, không được đóng bằng tên rail A/B.

**2. P2 — qualifier reset liên tục, không phải delay từ POR**

Mỗi kênh có ba qualifier TPS3808 riêng, CT nối VDD:

- `Q_ARM`: LOW của FRESH_ARM trong trạng thái khóa hợp lệ.
- `Q_OFF`: physical-OFF proof liên tục.
- `Q_REL`: RELEASE LOW sau OFF_READY, follower neutral.

Định nghĩa:

- `H`: bias hợp lệ, reset không active, watchdog không fault, crossing đã ready.
- `K`: khóa/position hợp lệ cho pha arm.
- `O`: Source/isolation proof, RUN_OUT-low và JOY-low đều hợp lệ.
- `N`: follower neutral, chưa release commit.
- `A`, `R`: mức request FRESH_ARM và RELEASE.

Các predicate giữ MR được nhả:

\[
P_{ARM}=H\land K\land WAIT\_ARM\land\neg A
\]

\[
P_{OFF}=H\land OFF\_VERIFY\land O
\]

\[
P_{REL}=H\land OFF\_READY\land O\land N\land\neg R
\]

**Với từng qualifier \(x\):**

\[
MR_{x,N}=P_x
\]

Bất kỳ term nào FALSE phải **giữ MR LOW liên tục**, đồng thời đi theo đường riêng xóa token/grant liên quan. Không chỉ phát một xung reset lúc POR.

| H / điều kiện pha, proof | Request LOW nếu predicate yêu cầu | MR | Kết quả |
|---|---:|---:|---|
| Bất kỳ term FALSE | X | LOW liên tục | RESET asserted; không tích lũy qualification |
| Tất cả TRUE | Không | LOW | Không qualify LOW |
| Tất cả TRUE | Có, chưa đủ delay | HIGH | Chờ; chưa tạo token |
| Tất cả TRUE liên tục đủ delay | Có | HIGH | Cho phép nhận cạnh mới |
| Mất proof sau qualify | X | LOW và direct-clear | Xóa token/grant; phải qualify lại |

Cận release TPS3808 là180–420 ms; **assertion MAX và khả năng xóa sau pulse invalid ngắn vẫn chưa có bằng chứng đủ**. [TPS3808 SBVS050N, p6–7](https://www.ti.com/lit/ds/symlink/tps3808.pdf).

**Không tạo lỗi “request HIGH làm permission rơi ngay”:**

- Cạnh mới hợp lệ tiêu thụ qualification và set token.
- Request HIGH reset timer LOW, nhưng grant đang được giữ bởi state/token.
- Grant tiếp tục phụ thuộc trực tiếp `H` và proof của pha.
- Fault/reset/proof mất xóa token bằng đường bất đồng bộ; cạnh đồng thời không được lưu để dùng sau phục hồi.
- Stored fault inhibition không được đặt trong predicate gây deadlock tự phục hồi; nó chỉ được xóa bằng trình tự fresh-arm sau khi fault hiện tại đã hết.

Đây là rationale reset dominance. Chưa chứng minh race/recovery/removal, propagation hoặc mọi pulse ngắn bằng datasheet; không dùng TYP làm MAX.

**3. Số IC và ngân sách: phần đếm được tách khỏi phần chưa chọn**

| Khối | Số IC proposal |
|---|---:|
| ISO7041F |4|
| SN74LVC2G125: buffer đầu vào/đầu ra control và diagnostic |10|
| TPS3808: ba qualifier + một bias supervisor mỗi kênh |8|
| TPS3430, mỗi kênh một watchdog |2|
| SN74LVC1G74: bốn latch mỗi kênh |8|
| TMUX1511, hai tầng cho năm signal |4|
| **Subtotal đã định danh** |**36**|

Chưa tính logic tổ hợp, regulator/hạn dòng A/B, JOY power barriers, Source, H3 và driver actuator. **Không có số IC toàn bộ đáng tin cậy khi các khối đó chưa chọn.** Không biến một reserve gate-count thành implementation count.

ISO6740 hai chiều nhận A/B cộng diagnostic có thể dùng khoảng15,2 mA tại các tổ hợp DC bất lợi, trước các khối còn lại; không đủ căn cứ giữ nó trong aux20 mA.

ISO7041F giảm đáng kể dòng: bốn IC, cộng **cả hai phía nguồn** tại3,3 V cho các hàng bảng:

| Điều kiện bảng | Tổng MAX bốn IC |
|---|---:|
| DC bất lợi, refresh ON |121,6 µA |
|100 kbps, no-load |318,8 µA |
|1 Mbps, no-load |2,3356 mA |

Đây là cận tại điều kiện bảng, **không phải bảo đảm mọi pattern/frequency, tải hoặc partial bias**.

Subtotal core tại hàng100 kbps, cộng8 supervisor×6 µA,2 watchdog×19 µA,8 latch×10 µA,4 TMUX×70 µA và10 buffer×10 µA:

\[
I_{core,worksheet}=864,8\ \mu A
\]

Nó chưa gồm output load, pull, divider, switching logic, regulator loss hoặc các khối chưa chọn.

| Mode | Cách tính đúng |
|---|---|
| RUN | Phía D nằm trong RUN500 mA; phía S_A/S_B nằm trong aux. Subtotal trên cố ý cộng cả hai phía để screening bảo thủ |
| OFF_VERIFY/actuator permission | Các safety/qualifier vẫn hoạt động; không được cho IQ bằng0; actuator tính nhánh riêng |
| PROGRAM | PC có thể cấp D; safety rail có thể còn hoạt động. Không tự giảm dòng vì request bị gate |
| CHARGE | H3 có ngân sách riêng; control output bị chặn. OFF bias còn dùng thì vẫn tính |
| Một miền mất nguồn | Chưa dùng hàng normal-operation làm bound partial-power-down |
| MCU phát xung quá nhanh/fault | Cần cận dòng hoặc hạn dòng nguồn nhánh; bảng1 Mbps không bao mọi fault GPIO |

**Kết luận budget:** ULP crossing có hướng phù hợp hơn, nhưng **aux20 mA toàn tuyến chưa được chứng minh**. Các nhánh nguồn và phần logic chưa chọn ngăn việc báo một “MAX per-mode” hoàn chỉnh.

ISO7041F cũng thêm timing cần tính: mất input power có thể mất750 µs để default. Nếu cộng bảo thủ trước timeout12,65 ms thì còn **6,60 ms**, thay vì7,35 ms, cho các khâu khác; đây vẫn chưa bao toàn brownout.

**4. H3 — một yêu cầu dữ liệu hữu hạn, không đổi comparator tiếp**

Giữ nhánh:

`BQ25170 OUT/tụ → R1/R2 → cutoff A → cutoff B → pack`

Đề nghị HQ chuẩn bị **một vòng** yêu cầu hãng, chưa gửi:

| Thiết bị | Điều kiện và dữ liệu cần trả lời |
|---|---|
| BQ25170, SLUSDJ8A | Strap47 kΩ/CV4,05 V; ISET750 Ω±1%; nguồn4,75–5,25 V; TJ−40…125°C: CV startup/line/load/reconnect peak envelope; termination và recharge với hai R1,1 Ω/cutoff ngoài OUT |
| Detector H3 dự kiến | Với normal MAX4,0824 V, trip allocation≤4,110 V: full rising-trip error và assertion MAX ở overdrive dùng được trước4,200 V, bao slow ramp/chatter/startup |
| TPS3760, SBVS420A | Xác nhận có guaranteed option/condition đáp ứng cửa sổ trên hay không; không xin dùng MAX17 µs tại20% overdrive cho overdrive nhỏ |
| Driver/MOS/capacitor chưa chọn | Chọn candidate trước khi hỏi: cutoff MAX tại rail/nhiệt/gate load thực; Cmin/ESR sau một capacitor-open; pulse resistor Rmin/rating |

Nếu TI không có detector đáp ứng, kết quả là **không đạt candidate window**, không tự thay bằng characterization. Chưa có product delta thấp-CV đủ chứng cứ để trình Founder; không nới ceiling hoặc hồi BQ25185.

**Disposition:** P1 đã sửa topology phân kênh; P2 đã sửa predicate/reset/token. Cả hai cần Box08 review lại, chưa tự đánh dấu finding closed. Missing còn quyết định gate là nguồn/default khi partial bias, assertion/race/isolation MAX, budget toàn tuyến và H3 peak sau fault.
