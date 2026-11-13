Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c406-d819-75d0-86df-bb7a5af671a5
Read-only advisory received by HQ; verbatim final text follows.

**P0-13: đề xuất một topology hai kênh veto độc lập, giữ BQ25170 làm charger. OFF/W có thêm hướng interface và qualifier cụ thể; H3 vẫn chưa có tập cận đủ để đóng gate.** Tôi không đề nghị đổi charger hoặc nới trần4,200 V chỉ để làm hồ sơ đạt.

Đã đọc r12, P0-11 analysis/interface, bốn dossier P0-12 và các calculation snapshot. Hash r12 kiểm lại: `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`. Không sửa tệp, tạo artifact phần cứng hoặc dispatch agent.

**1. Topology chức năng duy nhất đề nghị tiếp tục**

```text
PACK
 ├─ bảo vệ nhánh tải → RUN boost → Source → barrier A → barrier B → RUN_OUT
 ├─ nhánh actuator riêng → permission A/B → hai driver/cơ cấu riêng
 └─ hai nhánh bias safety A/B, mỗi nhánh có giám sát và default riêng

CHARGE → input protection → BQ25170, strap phần cứng
          OUT + tụ cục bộ → Rlimit1 → Rlimit2
                         → cutoff H3-A → cutoff H3-B → PACK
          không SYS, không I²C, không nối tắt sang nhánh tải

B01 ↔ interface crossing có nguồn riêng hai phía ↔ safety A/B
JOY signals → hai tầng TMUX
JOY_VCC → hai tầng power isolation riêng; không dùng leakage signal thay tải nguồn

Mỗi kênh safety:
  bias-valid + reset + watchdog + position + OFF proof
      → fault-dominant state logic
      → RUN veto và permission nhả của nhánh tương ứng
```

Hai kênh không được dùng chung phần tử có thể tạo **cả hai permission sai**: receiver cấp quyền cuối, latch, driver, đường sense/reference hoặc đường hồi GND bị đứt. B01 gửi yêu cầu; phần cứng quyết định cho phép.

Ngược lại, một tín hiệu chung **chỉ có khả năng thu hồi quyền** có thể được dùng nếu lỗi của nó không tạo permission. Phải chứng minh bằng polarity và fault table, không chỉ đặt tên “veto”.

Giữ **G-B16**: năm baseline, bốn control riêng, ba input quan sát và E1–E4. Không ghép RUN/FRESH_ARM, không thêm GPIO H3, không gán chân.

**2. Crossing số: candidate ISO674xF thay đường dẫn điện trực tiếp**

Đề nghị sàng lọc **ISO6740F cho bốn control D→S**, và một ISO6740F hướng ngược cho ba diagnostic S→D. Các receiver an toàn A/B không dùng một output duy nhất làm bằng chứng độc lập; việc nhân kênh nội bộ không tăng GPIO.

Lợi ích cụ thể: barrier truyền thông không tạo đường dẫn DC trực tiếp từ GPIO/pull-up B01 sang rail safety. Tuy nhiên, **không có nghĩa toàn hệ thống đã galvanically isolated**: GND, nguồn, joystick và các bypass còn tồn tại.

Dữ liệu hãng:

| Thông số | Cận/điều kiện |
|---|---|
| Default khi mất input power/signal | Họ **F** default LOW |
| Propagation | MAX18 ns tại hai nguồn3,3 V±10%, điều kiện bảng |
| Disable output | MAX34,4 ns tại điều kiện3,3 V |
| Input-power-loss default | MAX0,3 µs, **đo từ khi input VCC xuống dưới1,2 V** |
| Startup valid-output |300 µs ở bảng; không dùng nó thay proof toàn tuyến brownout |
| Nguồn hợp lệ |1,71–1,89 V hoặc2,25–5,5 V; không suy hoạt động hợp lệ trong khoảng giữa |

Nguồn: [ISO674x SLLSFJ6G, p1, p21, §9.4](https://www.ti.com/lit/ds/symlink/iso6741.pdf).

**Giới hạn:** default LOW sau1,2 V không bảo đảm phản ứng ngay khi rail bắt đầu rơi. Supervisor tại phía nhận phải thu hồi quyền trước miền không xác định. EN phải có default tại chính phía nhận; output high-impedance cần pull-down ngoài.

Dòng ISO không được giấu trong leakageµA hoặc aux20 mA. Ví dụ bảng3,3 V có ISO6740 phía input tới8 mA ở tổ hợp DC bất lợi. Cần đếm đầy đủ từng IC/phía và trạng thái; nguồn B01 nằm trong tổng RUN500 mA, nguồn safety nằm trong aux. **Chưa chứng minh aux20 mA đủ cho topology nhân đôi.**

**3. W/reset/fresh-arm và qualifier**

Giữ TPS3430 preset nhanh: lower1,48–2,22 ms, upper9,35–12,65 ms; feed software4–6 ms. Sau timeout còn **7,35 ms**, chưa phải thời gian phần cứng đã đạt. [TPS3430 SBVS366A, p6](https://www.ti.com/lit/ds/symlink/tps3430.pdf).

Đề nghị dùng TPS3808 với **CT nối VDD**, release180–420 ms, để sàng lọc qualifier. Nó đáp ứng MIN100 ms và có MAX công khai, thay mục tiêu100–250 ms chưa có linh kiện. Đây là thay allocation qualifier, không đổi timeout4 s. Assertion vẫn thiếu MAX ứng dụng. [TPS3808 SBVS050N, p6–7](https://www.ti.com/lit/ds/symlink/tps3808.pdf).

| Sự kiện | Hành vi bắt buộc |
|---|---|
| POR/reset/fault/bias invalid | Xóa RUN, ARM_SEEN, LOW_SEEN và release permission |
| Request giữ HIGH khi phục hồi | Bỏ qua; không ghi nhớ cạnh |
| READY rồi thấy LOW liên tục đủ qualifier | Chỉ tạo điều kiện nhận cạnh mới |
| FRESH_ARM cạnh mới, RUN_REQUEST hợp lệ, hai khóa đúng | Mới có thể tạo RUN permission |
| WDO trở lại HIGH | Không phục hồi RUN hoặc permission cũ |
| RELEASE trước OFF_READY | Bỏ qua; phải thả rồi nhấn lại sau READY |
| Nút cơ đang giữ trước permission | M-A chặn route; actuator không phải thắng100 N |
| Sau release commit/absent | RUN tiếp tục veto đến tái khóa và fresh-arm |

Không dùng PRE/CLR đồng thời LOW. Race giữa fault và cạnh arm phải được xử lý bằng reset dominance và recovery/removal constraints của mạch thực.

**Phân bổ sau watchdog**, giữ tổng7,35 ms:

- Assertion hợp lệ:0,10 ms.
- Latch/logic:0,05 ms.
- Crossing/veto distribution:0,20 ms.
- Cách ly nguồn đạt tiêu chí dòng:5,00 ms.
- Dự phòng:2,00 ms.

ISO đã cung cấp cận cho một phần crossing; không làm các khâu còn lại tự có MAX.

**4. OFF: qualifier mới tạo được ngân sách thời gian hữu hạn**

Giữ KCL và các allocation đã ghi trong P0-11:

| Rail, một bleed hở | Plateau | Thời gian tới0,643404 V |
|---|---:|---:|
| RUN_OUT:100 µF,10,1 kΩ,30 µA |0,303 V |2,703167 s |
| JOY_VCC_P:10 µF,22,22 kΩ,20 µA |0,4444 V |0,614074 s |

Nếu source isolation thực sự≤20 ms và qualification≤420 ms:

\[
T_{RUN}=2,703167+0,020+0,420=3,143167s
\]

Còn **0,856833 s** trong4 s cho phần chưa phân bổ. Đây là worksheet có điều kiện, chưa phải bound toàn hệ thống. Cmax, injection, sense và source isolation phải được chứng minh; không tăng30 µA để bù một interface không đạt.

Permission mỗi nhánh phải kiểm cả RUN_OUT và JOY rail. Một comparator stuck-safe chỉ được làm sai tối đa một permission. Các rail B01 do PC cấp không bắt buộc xuống0,8 V; đường nối từ chúng sang carrier phải được cách ly.

**Không coi EN/SEL hoặc status “switch OFF” là chứng cứ actual isolation.** Topology vẫn cần proof bằng cận phần tử khỏe sau một fault, kết hợp rail-low và kiểm bypass. Sense LOW đơn thuần không chứng minh một signal switch đã mở.

**5. H3: monitor tích hợp đã được sàng lọc bằng số**

Không tiếp tục hai comparator đã bị loại. Khảo sát mới tập trung **TPS3760, option OV-only adjustable0,8 V**, có reference/threshold tích hợp.

Nguồn hãng **SBVS420A, Sep2023**:

- Rising threshold0,792–0,808 V, −40…125°C.
- VDD2,7–65 V; output dưới POR không xác định.
- Detect MAX17 µs **tại20% overdrive**, SENSE/VDD slew1 V/µs, pull-up10 kΩ và CL10 pF.
- Startup2 ms trong bảng không cung cấp MAX.
- Có OV-only, latch và output polarity options. [TPS3760 p7–9, §8.3](https://www.ti.com/lit/ds/symlink/tps3760.pdf).

**Kết quả:** ±1% threshold riêng đã tạo độ rộng khoảng82,8 mV tại nominal4,14 V. Nó không vừa cửa sổ r12 **4,0824…4,110 V**, rộng27,6 mV.

Ví dụ divider nominal41,75k/10k, allocation tổng sai số mỗi R±0,02% và dòng sense±100 nA cho partial interval:

\[
V_{trip}=4,093102…4,186925V
\]

Dòng sense ở đây phải được xác nhận là cận phù hợp ứng dụng trước khi dùng. Interval chưa gồm toàn bộ aging/PCB/ground. Ngay cả partial interval cũng vượt trip allocation4,110 V; MAX17 µs tại20% overdrive tương ứng pack xấp xỉ5 V, **không dùng được trước ceiling4,200 V**.

Vì vậy TPS3760 **chỉ là candidate của nhánh nghiên cứu monitor**, chưa được thay vào topology H3 cuối. Cần một detector đạt toàn cửa sổ hiện tại hoặc một thay đổi đồng thời CV/energy budget đã được chứng minh.

Đối chứng CV thấp hơn: **LTC4079IDD**, datasheet RevA, cho cấu hình analog, nhưng toàn nhiệt VFB là1,156–1,184 V, không phải headline±0,5%; RFBG160 Ω chỉ TYP. Nó còn giảm dòng tối đa xuống khoảng250 mA. Chưa có full CV interval và recovery/profile đủ để đề nghị đổi khỏi BQ25170. [LTC4079 p2–4,p14](https://www.analog.com/media/en/technical-documentation/data-sheets/ltc4079.pdf).

**6. H3 energy proof không được phụ thuộc vào tụ cell-side chưa định danh**

Giữ BQ25170 strap4,05 V và hai complete cutoff độc lập. Mỗi tầng gồm detector, driver và cặp MOS đối đầu; tổng bốn MOS.

Các nghĩa vụ mới phải ghi rõ:

- Rlimit đặt sau mọi tụ phía charger có thể đổ năng lượng vào pack.
- Sense tại đầu cực pack; sense lỗi/open/short chỉ vô hiệu tối đa một tầng.
- Không có bypass qua nhánh boost, actuator flyback, status hoặc test connector.
- Reference/monitor chưa ready: gate có trạng thái thụ động OFF; không lấy output “chưa assert fault” làm READY.
- Một tụ cell-side bị hở phải được tính lại. Không dùng10 mF như thuộc tính cell hoặc như capacitance luôn tồn tại.
- Rseries thay đổi termination/recharge; charger OUT trước R không đo trực tiếp pack sau R.
- BQ25170 internal OVP không thay hai protection paths.

Với trip4,110 V và worksheet P0-12, thời gian còn lại **55,922 µs**, chưa phải MAX cutoff. Muốn dùng con số này phải khép cả current peak, overdrive/ramp, driver, MOS, Cmin/ESR và parasitic.

**7. Mode current và actuator: phản ví dụ ngân sách cần xử lý**

| Mode | Khoảng/giới hạn hiện có |
|---|---|
| RUN |Output≤500 mA, gồm bleed; pack allocation≤1,045391 A với η≥0,8 và aux≤20 mA |
| CHARGE |BQ25170 R750 Ω±1%:0,35644–0,44444 A theo KISET; input còn thêm IQ/protection |
| OFF/PROGRAM |Không giả dòng bằng0; ISO, safety, H3 bias và backfeed tính theo rail thực |
| Actuator |Chưa có Rmin lạnh, lực net MIN hoặc hiệu suất nguồn được bảo đảm |

Sensitivity minh bạch: **giả định**, không phải dữ liệu Takaha, Rcoil7,5 Ω±10%, rail4,75–5,25 V, hai coil:

- Tổng dòng:1,1515–1,5556 A.
- Năng lượng tại góc MAX, pulse đúng3 s:24,5 J.
- Pack3,2 V, η0,8 và aux20 mA: **3,2101 A**, vượt mức xả liên tục3 A công bố của pack.

Đây chưa chứng minh sản phẩm fail, nhưng bác bỏ việc dùng20 J nominal để kết luận nguồn đủ. Không cộng tải RUN vì actuator chỉ được cấp quyền sau OFF; cũng không trừ nó nếu topology còn cho chạy đồng thời.

**8. FMEA tối thiểu và đường khép hữu hạn**

| Fault | Disposition bắt buộc |
|---|---|
| Một isolation/control output stuck permissive | Kênh kia vẫn chặn; fault chung một IC không được tạo cả hai permission |
| Retained HIGH / ROM pulse | LOW qualification và fresh edge sau READY |
| Brownout/partial bias | Local default thu hồi quyền trước miền undefined; không back-power qua crossing |
| Charger strap sai hợp lệ / pass short | Hai H3 paths vẫn bảo vệ ceiling |
| Một MOS hoặc tụ bảo vệ lỗi | Tầng còn lại và energy model sau lỗi vẫn đủ |
| Driver actuator stuck ON | Nhánh độc lập chặn release trước OFF; giới hạn năng lượng lỗi riêng |
| GND/sense track chung hở | Không được báo cả hai OFF-safe; cần tách topology hoặc chứng minh fail-safe |

**Bốn việc cần hoàn thành trước schematic, không đẩy sang đo tùy ý:**

1. Chọn detector H3 có full static window và MAX tại overdrive/ramp sử dụng được; nếu không có, trình **delta CV/current/profile cụ thể**, không xin nới ceiling.
2. Chọn driver/MOS/R/C và lập energy proof sau một lỗi; xác nhận application charger có R/cutoff ngoài.
3. Khép bias/default/interface và source isolation MAX; hoàn thiện KCL từng rail cho mọi powered/mixed-bias state.
4. Chốt actuator Rmin/rail/driver/thermal envelope và aux partition; kiểm khả năng nguồn trước khi gọi mode budget đạt.

Một vòng yêu cầu dữ liệu có giới hạn cho đúng candidate/điều kiện ở trên là bước tiếp hợp lý nếu tài liệu công khai thiếu. Nếu hãng chỉ cung cấp typical/characterization, phải giữ missing hoặc đổi topology; bench một mẫu không tạo guaranteed MAX toàn lô/toàn đời.

**Không cần Founder chọn lại G-B16, M-A hoặc cách ly I/O. Hiện cũng chưa có delta charger đủ chứng cứ để xin duyệt.** Topology và các counterexample đã cụ thể hơn, nhưng H3/OFF/W vẫn thiếu bằng chứng phần cứng quyết định; không tự PASS hoặc chuyển B1 sang ready.
