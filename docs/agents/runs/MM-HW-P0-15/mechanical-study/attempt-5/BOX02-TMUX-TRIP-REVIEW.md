Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c844-9a11-7242-8667-a3b7aabcfdb7

**Giữ TMUX2821 cho phương án RUN hai kênh, với điều kiện cận ngắt sense được chứng minh riêng khi rail sụp.** Guard 998 Ω cho cận dòng tức thời, kể cả khi switch chập, nhưng không thể đồng thời bảo đảm dòng OFF ở mức µA và giữ ngân sách sai số UV hiện tại. Vì vậy, guard chỉ giới hạn dòng trong khoảng chờ ngắt. Bảo vệ sau trip còn cần một đường ngắt thực sự và cận thời gian cho đường đó.

Theo [report attempt-4](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-HW-P0-15/mechanical-study/attempt-4/REPORT.md), phương án giữ hai bộ đo UV độc lập, tổng cộng 12 dây sense và hai đường main. Mỗi sense có guard sát tap, sau đó đi qua hai bank TMUX. Hai break của cùng một dây phải nằm trên **hai package thuộc hai miền điều khiển riêng**. Mỗi kênh UV có quyền ngắt tải riêng. Hai miền không dùng chung một tín hiệu có thể cưỡng bức cả hai ON.

| Điều kiện | Cận có thể dùng |
|---|---|
| RUN | TI cho miền tín hiệu khuyến nghị **±5,5 V** với \(V_{DD}=1,8–5,5\) V. Điều này bao phủ miền tap nghiên cứu −1,8…5,4 V. |
| OFF khi \(V_{DD}=0\) | TI mô tả high impedance trong miền ±5,5 V. MAX leakage **±0,1 µA tới 85 °C** và **±2 µA tới 125 °C** của bảng áp cho cặp **+5 V/0 V**. Cận định lượng ở tap âm, 5,4 V và các cặp điện áp thực còn thiếu. |
| Ra lệnh OFF khi nguồn còn hợp lệ | **220 µs MAX** với \(V_{DD}=2,5–5,5\) V, \(V_S=3,3\) V và tải thử 50 Ω/35 pF. Cận này chưa bao phủ mạng sense thực hoặc khoảng rail sụp. |
| Một đường S–D chập | Break còn lại vẫn nằm trên đường dẫn, với điều kiện miền kia giữ được OFF trong quá trình sụp nguồn. |
| Một đầu sense chập vào GND hoặc rail của IC đầu tiên | Dòng có thể về rail **trước break thứ hai**. Đây là trường hợp guard phải giới hạn dòng cho tới khi một đường ngắt ở phía nguồn mở hoặc cassette được tháo. |

[Nguồn TI TMUX2821 SCDS488, tr. 5–7 và 20](D:/StartupOS/electronics-learning-demo/docs/research/downloads/p0-15/attempt-4/ti-tmux2821.pdf)

Với hai guard **499 Ω ±0,1%** còn nguyên, \(R_{\min}=997,002\,Ω\). Mỗi dây có:

\[
|I_{\rm sense}|\le \frac{|\Delta V|_{\max}}{997,002\,Ω}
\]

- Tap 5,4 V chập về 0 V cho **5,416 mA**.
- Nếu dùng cận bảo thủ giữa hai node bất kỳ trong miền −1,8…5,4 V, \(\Delta V_{\max}=7,2\) V cho **7,222 mA**. Phép tính cần miền điện áp này còn đúng khi rail sụp, kể cả tụ và backfeed.

Tính từ lúc phát sinh điều kiện trip, điện lượng qua một dây đến hết thời gian quan sát \(T\) có cận:

\[
Q_{\rm sense,max}\le
I_{\rm guard,max}\,t_{\rm gap,max}
+
I_{\rm off,max}(T-t_{\rm gap,max})
\]

Áp dụng khi \(T\ge t_{\rm gap,max}\) và có cận leakage phù hợp sau khi gap mở. Đối với mỗi cell, cộng các nhánh sense có thể đi qua cell đó, tải main trong thời gian chờ cutoff và dòng AON trong thời gian pin còn lắp. Cận năng lượng rút từ cell là \(E_{\rm cell,max}\le |V_{\rm cell}|_{\max}Q_{\rm cell,max}\). Năng lượng sẵn có trong các tụ là khoản riêng, \(\tfrac12\sum C_{\max}V_{\max}^2\).

**Ca bác bỏ là một đầu sense tap 5,4 V chập về GND trước break còn lại.** Nếu chưa có đường ngắt phía nguồn, guard cho phép dòng khoảng **5,416 mA** tiếp tục khi pin còn lắp. Mỗi giây tương ứng **1,505 µAh** qua dây và khoảng **29,25 mJ** lấy từ nguồn 5,4 V. Thiếu cận thời gian tồn tại của đường này thì chỉ tính được điện lượng theo thời gian, chưa có cận tổng sau trip.

Cửa sổ corner trước phần leakage còn **21,27 mV** tới biên UV gần nhất. Dùng mô hình 1/2 và allocation của report là **4 µA tổng sai lệch mỗi arm**, sai số quy về cell xấp xỉ \(2I_{\rm arm}R\). Kể cả dành hết margin còn lại cho khoản đó, \(R\) chỉ tới khoảng **2,66 kΩ**. Trong khi đó, một allocation minh họa **10 µA/dây** ở chênh áp 5,4 V đòi **ít nhất 540 kΩ** nếu chỉ dựa vào guard. Hai miền cách nhau hơn 200 lần theo các giả thiết này. Tăng guard đến mức đó sẽ phá ngân sách UV hiện tại.

**Hướng tiếp theo có điều kiện** là giữ guard 998 Ω, bố trí hai miền điều khiển/cắt nguồn độc lập và ra lệnh mở sense trước khi rail điều khiển mất hiệu lực. Phải xác lập cận cho ba ca riêng gồm **OFF có lệnh khi rail còn tốt, rail sụp khi lệnh còn HIGH, và đầu sense chập vào rail trước break thứ hai**. Đầu vào cần xác minh là điện áp hai đầu guard theo thời gian, thời điểm dòng thực giảm sau trip, cùng leakage ổn định ở tap âm và tap 5,4 V. Chỉ khi có các cận đó mới thay được \(t_{\rm gap,max}\) và \(I_{\rm off,max}\) bằng số. Guard hiện tại đủ để tính dòng trong khoảng chuyển tiếp, còn cận điện lượng và năng lượng toàn RUN vẫn chưa khép.
