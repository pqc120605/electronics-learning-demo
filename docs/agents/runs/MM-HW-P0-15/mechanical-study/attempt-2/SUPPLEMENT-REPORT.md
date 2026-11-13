# P0-15 — checkpoint tiếp tục ngày11/11/2026

Không sửa hồ sơ CAD đã được review trong `review-packet.json`. Lead giữ một writer; Box02/03 trả advisory, Box08 đã review riêng CAD. P0-15 **chưa done**, B1 **chưa ready**. Không yêu cầu Founder duyệt lại hướng3AA hoặc quyền CAD hiện có.

## Kết quả đã chốt trong phạm vi nghiên cứu

1. Box08 nhận15/15tệp packet CAD, không finding mới cho bounded reference continuation. Bản cam–gân chữL đi được6đường nominal,96corner bị frame chặn; không suy cắm lệch được. Lỗi chung hai cửa mở vẫn có bypass. Review có hash/report riêng tại `BOX08-REFERENCE-REVIEW.md`.
2. Ba PDF hãng được tải, ghimSHA256, trích xuất và đối chiếu lại. `POWER-SOURCE-DISPOSITION.md` sửa dải LED5–30mA và giữ điều kiện bảng cho INA152/supervisor/PhotoMOS. Không dùng sốTYP làmMAX.
3. Hợp đồng yêu cầu START/reset được kiểm192cặp state/input và5trace định hướng: giữSTART qua tháo/lắp pin/brownout; fault thắnghealthy; timeout thắnghealthy; stale measurement cắtRUN. Đây là state model của yêu cầu, chưa có ánh xạ mạch đủ timing.
4. Phép kiểm sense chủ động có phân biệt trong miền tuyến tính **có điều kiện**, nhưng kiến trúc hiện tại có phản ví dụ saucutoff. Lead tính lại độc lập bằng `check_power_bounds.py`, không nhận mù advisory.

## Các số điện được tái lập

Các điện trở/rail/C/source impedance dưới đây là allocation nghiên cứu, chưa MPN, không pin assignment/schematic. Công thức đang dùngRef=0; đổiRef giữa rail phải tính lại.

| Đại lượng | Kết quả lead / giới hạn |
|---|---|
|Kích thích qua100kΩ±0,1%,ΔV≤5,4V|54,0541µA; dùng cận lên54,1µA. |
|Một trong2guard499Ω±0,1% bịshort|10,8325mA tại5,4V; chưa bảo vệ đoạn trước điện trở hoặc mọi clamp. |
|Open-H, độ thay đổi trướcclip|1,8525289V MIN trong mô hình; nếu ghi cận3chữ số phải làm tròn xuống**1,852V**, không gọi1,853V làMIN. |
|Open-L, độ thay đổi trướcclip|1,1506435V MIN; cận làm tròn xuống**1,150V**, không gọi1,151V làMIN. |
|Healthy, nếu mỗi trởnguồn≤2kΩ|Δpair≤0,2060844V, có thể dùng cận lên0,207V; DCIR này chưa được hãngcell bảo đảm. |
|RC nếuCnode≤1nF|τ≤49,00357µs;0,1%settling≤338,50467µs. Chưa gồmamp/comparator/logic. |
|Một sense-H PhotoMOSkẹtON, tap3,6V|3,6/(80k+998)=44,44554µA nominal, tương đương1,066693mAh/ngày. Đây là phản ví dụ có đường dòng thụ động, không phảiMAX toànnhiệt. |

INA152 settling/overload recovery trong nguồn không cho đủMAX để ký slot/tổngdeadline. Output clipping vàcell đảo chưa có miền được chứng minh. Không nhận topology sáu switch đơn; chọn leakage thấp hơn không chữa một switch kẹt dẫn. Delta kỹ sư cần tính tiếp: hai phần tử ngắt nối tiếp mỗi sense với kiểm độc lập, hoặc monitor island ngắt được cả supply/return/reference/control/output. Chưa chọn một trong hai thành cấu hình sản phẩm, cũng chưa buộc Founder chọn khi chưa đủbudget/fit.

## Cơ: kiến trúc tiếp theo và phản ví dụ

Box03 đề xuất2thanhV độc lập, **mỗi thanh kiểm cả4body**: hai shutter tại0 và hai probe dock chắncorridor. Thanh đãcắm bắt giữ4home; cầu chỉ được hạ saucả2thanhcaptive. ChiềuPROGRAM phải mởđủcả2gap trước khi cho rútthanh; không lấy vị tríhandle thayactualendpoint.

Các bất đẳng thức có biếnchưađo vẫn giữ nguyên:

- Với từnggap: h_release,min > L_conductive,max + Δ_max + g_required.
- V_rút_sớm nhất phải sau cả2gap được thiết lập muộn nhất.
- Contact_make_sớm nhất phải sau cả2V_captive_muộn nhất ở tọa độ reconnect.
- Miềnđượcnhậnlàhome phải nằm hoàn toàn trong miềnthực sựchắn/dock, kểcảdungsaivàbiếndạng.

**Đính chính advisory:** probe park củaCAD attempt-2 làZ=±7,5mm, không phải±6mm như `BOX03-ENDPOINT-PROPOSAL.md` ghi. Probe home đểreconnect làZ=0; khôngthaybytesCAD. Allocationforce0,20N nêu trongadvisory chưađượckiểmchứng tronglượtnày, khôngthành quyếtđịnhFounder mới.

Phản ví dụ mới: panelcửa gãy/mất nhưngproof-tab vẫnhome thì cả2V có thể cùngxácnhận sai. Hai thanhđộc lập không tựloại lỗi chung “mấtchứcnăng nhưnggiữchỉbáo”. Springgãy/cửakẹt cóthể ngănreconnect, nhưng mảnhgãy/framebreak/trailingcontact vẫn cần môhìnhriêng. Kiếntrúc8body chuyểnđộng là hypothesisđểkhảosát, khôngcơcấuchịulựcđược duyệt.

## Trình tự làm tiếp trong cùng P0-15

1. Điện: phân tích containmenthai-break so với floating-island, tínhtoàn bộreturn/control/sense/clamp; Refgiữarail và phươngpháp cóMAXsettling phùhợp. Đầu ra cần miềncurrent/error/time vàcounterexample, khôngmột vòngdanh sáchTBDmới.
2. Cơ: reference profile proof-tab/V/endpoint, thêmfault mấtpanelgiữtab vàkẹtendpoint. QuyềnCAD hiệncó cho phép khảo sátkinematic/profile; khôngcho phépstrength/FE/material/productadoption.
3. Ghépconnector/conductorinventory/fit/BOM/costsaukhi topologykhôngcònphảnvídụcơbản. Dữliệuthật thiếu giữTBD, khôngbịa giá hoặc cycle.
4. Box08 review snapshotcụthể trước mọikếtluậnđóngcổng; Founder duyệtcấuhình/hashriêng trướcB1.

Hiện chưa cần Founder đo mẫu hoặc quyết MPN để làm các phân tích1–2. Không tuyên bố r12/4cổng/14verificationitems đã đổi. Physical/FE/firmware/production vẫnNOT_RUN.

Các kiểm đã chạy trong lượt11/11: `power_contract_check.py` exit0; `check_power_bounds.py` exit0; `verify_evidence.py` exit0 vàqueuevalidator61task/errors=[]/warnings=[]. Reviewphần bổsung đượcghi riêng khiBox08trả; khôngsuy reviewCAD phủphầnđiệnvừathêm.
