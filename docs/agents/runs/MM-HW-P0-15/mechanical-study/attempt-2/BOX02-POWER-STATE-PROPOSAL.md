Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c577-99b2-74b0-a8a8-39466ed47b35
Read-only advisory, not approved topology or MPN. Source claims require pinned verification before adoption.

**Có thể mô tả chuỗi logic mặc định OFF mà không thêm GPIO; chưa có front-end cụ thể đủ bằng chứng để bảo đảm toàn chuỗi.** Kết quả mới là tách được bộ nhớ khóa lỗi khỏi nguồn monitor, đồng thời tìm được candidate ngắt sense không phụ thuộc cell cấp nguồn cho logic. Các điểm còn thiếu được nêu dưới đây, không chuyển sang D10.

Đây là proposal logic để lead tích hợp; chưa duyệt MPN, hash hoặc schematic.

**Chuỗi trạng thái đề xuất**

`POWER_VALID` chỉ có hiệu lực sau khi nguồn nhớ ổn định. Khi mất hiệu lực, cutoff phải bị inhibit trực tiếp và mọi quyền khởi động bị xóa.

| Trạng thái | Monitor/sense | Tải | Chuyển trạng thái |
|---|---:|---:|---|
| **Không có nguồn hợp lệ** | OFF | OFF | Nguồn hợp lệ → WAIT_RELEASE |
| **WAIT_RELEASE** | OFF | OFF | Chỉ quan sát START đã nhả sau POWER_VALID mới → READY |
| **READY** | OFF | OFF | Cạnh nhấn mới → CHECK |
| **CHECK** | ON trong cửa sổ hữu hạn | OFF | Đủ các phép kiểm → RUN; fault hoặc hết hạn → LOCKED |
| **RUN** | ON, liên tục tái xác nhận phép đo | ON | Fault, mất phép đo hợp lệ hoặc mất nguồn → LOCKED/WAIT_RELEASE |
| **LOCKED** | OFF | OFF | Nhả START → READY; cần một lần nhấn mới để CHECK |

Các bất biến cần giữ:

- START giữ xuyên tháo/lắp pin hoặc brownout không được tạo quyền CHECK mới.
- Fault thắng mọi yêu cầu START và mọi kết quả healthy.
- Timer startup hết hạn phải ngắt monitor ngay cả khi sequencer hoặc comparator đang giữ một mức logic.
- RUN cần **kết quả phép đo còn hạn**, không dùng một mức HIGH đã chốt từ startup.
- B01/WDI không tham gia việc cấp nguồn ban đầu cho chuỗi này.

Bộ nhớ luôn có nguồn ở mức µA là hướng tiếp tục hợp lý. Tuy nhiên hai flip-flop đã nêu trước **không phải BOM hoàn chỉnh** cho toàn bảng này; số lượng logic, supervisor và timer vẫn phải tính lại.

**POR/brownout candidate:** họ **TLV809E**, đầu ra push-pull active-low. Datasheet **SLVSEH0J**, tr. 1, bảo đảm trạng thái reset xuống tới nguồn 0,7 V. Điều đó vẫn không chứng minh trạng thái cutoff dưới 0,7 V; tầng công suất cần bias thụ động về OFF và kiểm backfeed. Chưa chọn threshold/delay/orderable suffix. [TI TLV803E/TLV809E PDF](https://www.ti.com/lit/ds/symlink/tlv803e.pdf)

**Front-end 1 — ba INA152, phép kiểm open-wire chủ động, ngắt sáu dây sense**

Candidate đo là **INA152EA**, MSOP-8, TI **SBOS184, Jan-2001**, tr. 2–3. Mạng điện trở tích hợp cho gain vi sai 1; offset MAX ±1,5 mV, gain error MAX ±0,1%, dòng tĩnh MAX 650 µA **theo điều kiện bảng**. Không coi ba IC = 1,95 mA là cận toàn miền nguồn/nhiệt của thiết kế. [TI INA152 PDF](https://www.ti.com/lit/ds/symlink/ina152.pdf)

**Phản ví dụ bắt buộc xử lý:** với mạng vi sai chuẩn, dây đầu vào âm hở có thể làm output xấp xỉ \(H/2\). Tap trên ở 3,6 V có thể cho output khoảng 1,8 V, che lỗi. Do đó INA152 trực tiếp **chưa đạt**.

Proposal bổ sung là sequencer phần cứng thực hiện:

1. Kiểm đáp ứng của từng sense bằng kích thích có giới hạn dòng.
2. Ngắt kích thích, chờ settling có cận.
3. Đo cell và so ngưỡng.
4. Chỉ phát token healthy sau khi đủ trình tự; token hết hạn nếu không có chu kỳ mới.

Kích thích, ngưỡng chẩn đoán, settling MAX, timer và comparator **chưa được ánh xạ đủ linh kiện**. Vì vậy chưa tuyên bố active-health đã được chứng minh. Không lặp phép đo bốn tap tĩnh hoặc S-1009 local fail-ON.

**Candidate ngắt sense:** sáu **AQY212EH**, Panasonic PhotoMOS normally-open, đặt ở sáu nhánh sense độc lập. Catalog **ASCTB126E, 2022.4**, tr. 1: output hai chiều 60 V; tại điều kiện bảng 25°C, off leakage MAX 1 µA, turn-off MAX 1 ms. LED khuyến nghị 5–10 mA, nên sáu kênh cần **30–60 mA trong CHECK/RUN**, phải cộng vào budget. Đây là switch sense, không phải switch dòng tải. [Panasonic catalog PDF](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf)

Cấu trúc này tránh lấy điện áp cell thấp để source tín hiệu healthy. Khi LED mất nguồn, sense có thể ngắt độc lập với nguồn detector. Nhưng:

- Sáu đường có tổng allocation leakage tối đa **6 µA tại điều kiện bảng**, chưa phải cận toàn nhiệt hoặc dòng toàn hệ thống.
- Một PhotoMOS hỏng đóng còn tạo đường sense. Chưa có containment cho lỗi đó.
- Điện trở giới hạn dòng phải ở sát nguồn tap; phần trước điện trở cần bảo vệ vật lý.
- R điện trở, switch và clamp làm thay đổi phép đo; cần tính lại sai số và dòng chẩn đoán trước schematic.

**Front-end 2 — LTC1043 chuyển điện tích vi sai**

**LTC1043**, datasheet **1043fa**, có hai khối switched-capacitor và clock nội/ngoại. Nhưng giới hạn input là −0,3 V…\(V_++0,3\) V. Với rail monitor 4,75 V và tap nghiên cứu 5,4 V, input vượt 5,05 V. Ngoài ra capacitor có thể giữ mẫu healthy khi dây hở hoặc clock dừng; phải có kiểm chẩn đoán và freshness riêng. **Không nhận candidate này trên rail 5 V hiện tại**, không đề xuất thêm rail trong lượt này. [Analog Devices LTC1043 PDF, tr. 1–2](https://www.analog.com/media/en/technical-documentation/data-sheets/1043fa.pdf)

**Các phản ví dụ còn mở**

| Ca | Disposition |
|---|---|
| Giữ START khi tháo/lắp pin, rail sụp/hồi | Bảng trạng thái xử lý được về logic; POR, inhibit và mạch observe-release chưa chứng minh bằng linh kiện/timing. |
| Một cell yếu, tổng pack vẫn cao | Đo riêng từng cell xử lý đúng mục tiêu; MAX thời gian đến cutoff vẫn TBD. |
| Cell đảo | PhotoMOS output hai chiều không đủ bảo vệ front-end khi sense đang ON; clamp và fault current còn phải thiết kế. |
| Sense hở | Cần phép kiểm chủ động; INA152 tĩnh có phản ví dụ false-healthy. |
| Fuse mở | Bộ nhớ phía nguồn vẫn tiêu thụ; mọi sense/test/reference bypass phải được kiểm kê và giới hạn. |
| Monitor mất bias | Token phải hết hạn, cutoff OFF; không coi output analog về 0 là bảo đảm. |

**Codex còn tự xử lý được:** mapping logic, timer/freshness, kích thích open-wire, ngân sách sai số/ngưỡng, clamp/reverse, cutoff và bảng đường dòng. Đây chưa phải thông tin cần Founder cung cấp.

**Founder chỉ cần quyết định khi có proposal số liệu cụ thể:** chấp nhận mức tiêu thụ khi giữ pin sau trip và chi phí/kích thước của phần ngắt sense, hay chọn thao tác ngắt cassette để lưu kho. Chưa có tổng dòng/BOM/fit đủ để trình lựa chọn đó; không đặt zero-quiescent hoặc thời hạn lưu kho thành hardgate.
