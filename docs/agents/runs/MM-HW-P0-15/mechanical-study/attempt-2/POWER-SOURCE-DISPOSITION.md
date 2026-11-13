# P0-15 — đối chiếu nguồn và hợp đồng logic nguồn

11/11/2026. Bổ sung sau packet CAD; không sửa các bytes đã được Box08 review. Hai advisory Box02 là proposal, không phải topology/MPN được nhận. Không có thay đổi GPIO, chemistry, r12, D10 hoặc cổng.

## Đối chiếu bản PDF đã ghim

Hash/URL/bytes trong `sources/manifest.json`. Lead đã đọc trực tiếp sáu trang PDF trích xuất và xem ảnh bảng Panasonic; không chỉ dựa vào kết quả tìm kiếm hoặc lời advisor.

| Claim | Disposition và phạm vi |
|---|---|
|TLV809E reset được bảo đảm từ0,7V|ACCEPT có điều kiện. TI SLVSES2J, PDFtr1: output push-pull active-low, ensured reset trong0,7…6V. Dưới0,7V và backfeed chưa được bảo đảm; threshold/delay/suffix chưa chọn. Không suy reset IC thành cutoff toàn mạch. |
|INA152 offset±1,5mV/gain±0,1%/IQ650µA|ACCEPT chỉ điều kiện bảng SBOS184, printedtr2 (PDFtr2): VS±10V,25°C trừ khi có chú thích. Không sử dụng650µA làm MAX tại5V/toàn nhiệt. Bảng5V printedtr3 có điều kiện Ref=VS/2 và load vềVS/2; topology Ref=0 phải được phân tích riêng. |
|AQY212EH off leakage1µA, turn-off1ms|ACCEPT theo bảng25°C, ASCTB126E202204 printedtr2 (PDFtr3), dòngLED/điện áp/tải ghi trong bảng. Sáu nhánh có tổngallocation6µA tại điều kiện đó, không phải cận tổng OFF/toàn nhiệt. Switch hỏng đóng chưa được containment. |
|LED khuyến nghị5–10mA|CORRECT: bảng printedtr3 (PDFtr4) ghi5–30mA tại25°C.5–10mA chỉ có thể là allocation thiết kế thử, không phải dải hãng bảo đảm được chọn. Sáu LED song song có dải30–180mA theo dải khuyến nghị; không gọi180mA là mức phải tiêu thụ hoặc30mA là toànmạch. Chưa adopt cách cấp LED/song song hay nối tiếp. |
|60V output|Phân biệt bảng type/rating60V với recommended48V của AQY212EH ở printedtr3. Không sử dụng rating làm điện áp làm việc thiết kế. |
|Hai flip-flop là đủ logic nguồn|REJECT suy luận đó. Hai IC chỉ là candidate phần nhớ; observe-release, independent timeout, freshness, POR/inhibit/cutoff và front-end chưa ánh xạ đủ. |

Nguồn: [TI INA152](https://www.ti.com/lit/ds/symlink/ina152.pdf), [TI TLV803E/TLV809E](https://www.ti.com/lit/ds/symlink/tlv803e.pdf), [Panasonic AQY21](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_ge1a_aqy21_e_dip4.pdf). Trích xuất local `.pageN.txt` không thay PDF. Một lần in text Unicode ra console bị lỗi encoding sau khi tạo đủ tệp; việc đọc lại bằng UTF-8 và ảnh bảng xác nhận dữ liệu, không báo lệnh in lỗi đó là PASS.

## Hợp đồng trạng thái đề xuất, chưa phải phần cứng

### Đính chính sau review Box08 ngày11/11

- Mã PDF supervisor thực tế là **SLVSES2J**, RevJ, May2021, đúng ở cuối trang đầu đã tải. Tên tệp `ti-tlv803e-SLVSEH0J.pdf` giữ như alias lịch sử để không thay đường dẫn đã review; nội dung PDF và hash không đổi. Metadata mới trong manifest ghi rõ mã đúng, advisory gốc không bị sửa.
- **13 slot là số pha tối thiểu đã đếm, chưa phải một lịch đủ để cho cận frame MAX.** Công thức dùng13×Tslot chỉ đúng nếu chứng minh lịch13slot bao đủ mọi thao tác kích thích, ngắt, baseline lại, settling và chuyển pha. Hiện chưa chứng minh được điều đó. Cận tổng quát phải là `Tframe,max = Tisolation,on,max + sum(Tphase[k],max) + Toverhead,max`, trên một lịch hữu hạn được định nghĩa đầy đủ. Số pha và overhead hiện TBD; không ký deadline từ số slot tối thiểu. Dù có lịch đủ, settling analog MAX và cutoff MAX vẫn cần chứng cứ riêng.

Hai finding được ACCEPT, đối chiếu nguồn/lịch trước khi sửa. Xem `DISPOSITION-SUPPLEMENT-REVIEW.md`. Không thay mô hình điện, hash cấu hình hoặc cổng.

POWER_VALID mất hiệu lực phải inhibit tải trực tiếp và xóa quyền START. Sau POR/brownout phải vào WAIT_RELEASE; START giữ xuyên mất nguồn không tạo CHECK. Phải thấy nhả thực sự sau nguồn hợp lệ rồi cạnh nhấn mới mới được CHECK. Trong CHECK, monitor/sense được bật hữu hạn nhưng tải OFF. Fault thắng healthy; timeout độc lập phải thu hồi monitor. RUN cần dữ liệu healthy còn hạn; stale hoặc fault phải OFF/LOCKED.

`power_contract_check.py` kiểm mô hình yêu cầu thuần hữu hạn, không firmware/pin assignment. Nó không chứng minh flip-flop/timer/comparator hay transient thực hiện được mô hình. Thời gian detect/isolate, freshness interval, energy, dòng/clamp/reverse/sense bypass vẫn TBD.

## Còn tự thiết kế được và đầu vào thật sự thiếu

Box02 đang phản biện front-end INA152 + kiểm sense chủ động bằng phương trình và phản ví dụ. Lead không yêu cầu Founder đo mẫu để thay cho các tính toán còn làm được. Open-wire có thể báo khỏe giả; chỉ reset/latch tốt không chữa được lỗi đó. Một switch sense hỏng đóng, cell đảo và tap trước điện trở phải được tính ở mức topology.

Những lựa chọn sản phẩm chỉ trình Founder khi có proposal có cận: tổng dòng lưu kho, fit/BOM/chi phí của sense isolation hoặc đổi thao tác cassette. Chưa đặt zero-quiescent thành yêu cầu mới, không chọn actuator/pin/MPN/hash hay chuyển các lỗi thiết kế sang verification_items.
