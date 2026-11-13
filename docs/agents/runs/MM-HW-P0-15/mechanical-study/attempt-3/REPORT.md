# P0-15 — kết quả containment và functional witness

Ngày 11/11/2026. Tiếp tục cùng P0-15 theo yêu cầu Founder; lead ghi file, Box02/03 trả advisory, không có builder hoặc lease B1. Quyền CAD là nghiên cứu M5 đã duyệt hash `edeae78f366624d1cfadd051787ffad9e11703cc97e409e06dc615a4d99e3b28`. Attempt-2 giữ nguyên 58 tệp snapshot. Không thay r12/cổng/MPN hoặc thông số sản phẩm được duyệt.

## 1. Điện: đã phân biệt được hai kiến trúc

**Ưu tiên A cho nghiên cứu tiếp: hai phần tử ngắt nối tiếp trên từng sense, chia thành hai bank có quyền điều khiển độc lập.** Đây là lựa chọn nghiên cứu của kỹ sư, không phải Founder duyệt cấu hình hoặc MPN.

Lead dựng đồ thị đường dẫn riêng từ tối thiểu các nhánh thụ động đã biết. Mỗi cell là nguồn điện, không bị mô hình thành dây nối tắt. Đường giữa hai tap khác nhau được báo là đường có thể gây xả; không mô phỏng analog hoặc coi switch OFF là không có leakage thực.

| Mô hình | Kết quả cụ thể trong đồ thị đã khai báo |
|---|---|
|Một switch trên mỗi sense, Ref về BAT0|Ba ca switch-H kẹt dẫn có đường qua mạng điện trở tới return. Các nhánh silicon/âm chưa mô hình có thể tạo thêm đường; không kết luận chỉ có ba lỗi thực. |
|Hai switch nối tiếp mỗi sense|12 ca một switch kẹt dẫn không có đường trong đồ thị. Một bank enable HIGH vẫn còn bank kia mở. Hai switch cùng đường H kẹt dẫn có ba ca đối chứng tái tạo đường xả. |
|Chỉ ngắt nguồn/return nhưng giữ sense|Không phải floating island đầy đủ. Các đầu H vẫn nối những tap khác nhau qua Ref chung; có ba đường tap–tap. |
|Floating island đầy đủ|Sáu sense, supply và return đều có switch biên: tám ca một switch kẹt dẫn không tạo đường trong đồ thị. Nhưng một lỗi enable đóng cả bank sense tạo lại các đường giữa tap. Không đánh đồng phương án này với chỉ ngắt return. |
|Hai inhibit nguồn LED/monitor|Trong đồ thị lý tưởng, một inhibit hoặc một driver kẹt dẫn vẫn bị inhibit còn lại chặn. Hai inhibit cùng kẹt dẫn tạo đường qua tải monitor; common override đóng mọi phần tử là đối chứng FAIL. |

Đồ thị **chỉ bao nhánh đã liệt kê**, không chứng minh sơ đồ hoàn chỉnh không có đường khác. Ngay cả cut-set đúng cũng chưa chứng minh hai bank độc lập khi short, mất bias hoặc lỗi nguồn chung. Đường supply, reference, test, clamp, control, output, debug/shield phải được kiểm kê ở thiết kế đầy đủ.

Sơ đồ hãng INA152 tr1 cho thấy mỗi H có hai điện trở40kΩ nối tới Ref qua ngõ vào op-amp. Trong mạng con nominal ba nhánh H=1,2/2,4/3,6V, R mỗi nhánh80k+998Ω, Ref floating=2,4V; dòng ba nhánh khoảng−14,815/0/+14,815µA. Đây là tính mạng con, không dòng toàn island hoặc MAX. Nó đủ bác suy luận “ngắt ground thì không còn đường giữa các tap”. Không dùng giá trị này để thay ngân sách OFF.

## 2. Giá phải trả và nguồn LED

Candidate PhotoMOS trong advisory là AQY212EH, chưa duyệt MPN. Bảng Panasonic ở25°C cho phép dùng các cận theo đúng điều kiện: Ron2,5Ω, leakage1µA, turn-off1ms; không có cận toàn nhiệt trong kết luận này.

- A cần12 switch sense; tổng dòng các LED nếu cấp từng nhánh trong khoảng khuyến nghị5–30mA là60–360mA. Đây không phải dòng pin sau converter hay mức đã chọn cho sản phẩm.
- B cần8 switch biên và ít nhất một optical output: tổng LED boundary40–240mA, hoặc45–270mA khi thêm một output LED. Không dùng con số này như BOM đầy đủ.
- Hai switch OFF nối tiếp không chia đôi leakage; allocation sáu đường sense vẫn tối đa6µA ở điều kiện bảng đã nêu, chưa gồm nguồn/driver/đường khác.
- Một bank driver kẹt HIGH có thể giữ dòng LED30–180mA nếu nguồn LED không được cắt. Vì thế containment sense không đồng nghĩa toàn pin đã ngừng xả.

Box02 đối chiếu hai candidate nguồn đã có PDF local, ưu tiên **hai TPS22916CN** để nghiên cứu hai inhibit nối tiếp. VIN1…5,5V và ON≥1V/≤0,35V phù hợp cho kiểm tra tiếp với logic1,8V có tải; chưa chứng minh VOH/VOL của cả driver. Bản CN không QOD. TPS22919 không có cận reverse tương đương trong nguồn đang dùng. Chưa chọn hoặc adopt part nào vào BOM.

Các số turn-off/RCB/QOD quan trọng của hai họ đang là TYP; không ký deadline bảo vệ từ đó. Khi switch đầu OFF, VIN switch sau có thể ra ngoài miền hoạt động. Không cộng2×100nA thành tổng OFF khi VOUT không ở đúng điều kiện đo. Pull-down ngoài và hai đường quyền độc lập vẫn phải được ánh xạ, không lấy hai IC cùng một enable làm hai fault-domain.

Lead tái lập allocation bleed:10kΩ±1%, C≤120µF, injection≤1µA, V0≤5,4V cho floor≤10,1mV và thời gian xuống0,1V khoảng4,9614s **tính từ khi nguồn đã thực sự ngắt**. Cận source-off và inventory C/injection chưa có; không cộng ví dụ này thành deadline tổng. Xem `supply-allocation-results.json` và raw advisory.

## 3. Cơ: từ chỉ nhìn tab sang kiểm mặt chức năng

Đã dựng cylinder witness theo Y và kiểm native CAD với frame, hai cam/gân/cửa. Một panel mất không được mặc nhiên coi là system bypass: còn barrier khác, thứ tự và trạng thái bridge phải được xét riêng.

Điểm thăm dò ban đầu tại Z=±1mm, đường kính0,6mm có lỗi: panel có lỗ8,5×2,5mm cho khối bao USB8,28×2,43mm đi qua, nhưng witness vẫn chạm mép còn lại tại stroke≈0,2mm. Kết quả sáu ca ban đầu giữ riêng trong `functional-witness-edge-results.json`.

Refinement nghiên cứu dịch trục vào Z=±0,7mm. **14 ca native đã chạy:** hai panel nguyên được nhận đúng cửa sổ0,15…0,25mm; mất panel hoặc panel có lỗ nominal/bốn offset đều bị từ chối. WitnessB khi panelB mất chạm panelA ở≈1,7mm, nằm ngoài cửa sổ; không giả là đi hết2mm. Contributor được lưu riêng trong JSON.

Đĩa thăm dò mới nằm trong vùng chung của **khối bao đặc tham chiếu** ở các offset đã xét, với margin nominal0,065mm. Điều này không chứng minh vật liệu thật của USB, mọi kiểu nứt/thủng, dung sai sản xuất hoặc cycle-completion latch. Chưa có linkage thực thi kiểm lực/hành trình hoặc cơ cấu giữ witness. Không gọi14 ca là hardware PASS.

## 4. Tìm giới hạn của hai đầu dò xa miệng

Lead dựng một dây đuôi synthetic tiết diện0,1mm với18 đoạn vuông góc liên tục, đi qua các relief và vòng trên mép cửa/probe. Shell được đặt sẵn tại d6,4mm, không có controlled collar.

- SAT kiểm19 khối với93 obstacle, không positive interference hoặc touching.
- Native CAD kiểm133 cặp với frame, hai carriage, hai probe dock và hai witness, không có thể tích giao.
- Vậy một **cấu hình tĩnh giả định** có shell ở vùng potential-contact vẫn có thể để cửa home và probe collar rỗng. Chỉ nhìn các trạng thái đó chưa chứng minh generic USB đã rút.

**Không kết luận đây là đường cắm bình thường hoặc single-fault system bypass.** Chưa có lịch sử cho bare plug đi qua hai cửa khỏe; dây có các góc gấp áp đặt, chưa chứng minh cáp thương mại/tiếp điểm thực. Bridge/V/endpoint chưa được hiện thực hóa trong fixture. Đây là phản ví dụ đối với phép suy từ trạng thái tĩnh, không phải chứng cứ người dùng làm được chuỗi đó.

## 5. Phần nào đã tiến triển, phần nào chưa đóng

| Hạng mục | Disposition |
|---|---|
|Một switch sense kẹt dẫn|Có proposal hai-break và phép kiểm cut-set tái lập; chưa containment toàn mạch hoặc leakage toàn nhiệt. |
|Floating monitor|Đã tách đúng island đủ8biên với cách ngắt ground không đủ; biết phản ví dụ enable bank. |
|Panel mất, tab còn|Fixture functional-face có thể từ chối panel mất; không suy mất một panel thành system bypass. |
|Panel thủng đánh lừa điểm kiểm gần mép|Có counterexample native và refinement bắt được bộ lỗ/offset đã thử. |
|Probe collar rỗng ⇒ generic USB rỗng|Không được dùng như invariant đã chứng minh; có static counterexample synthetic. |
|B1|Chưa ready: chưa có hai fault-domain thực, nguồn ngắt với MAX phù hợp, front-end clipping/reverse/freshness đầy đủ, sequencer/endpoint/bridge/contact-gap và fit/BOM. |

Không chuyển thiếu sót thiết kế sang D10 hoặc yêu cầu Founder cung cấp phép đo để thay phần tính được. Mọi cấu hình/MPN/hash/product adoption vẫn chờ quy trình riêng. Phép đo, strength/FE, flash, mua hàng và chế tạo đều NOT_RUN.

## 6. Lệnh và bằng chứng

- `python -B -X utf8 .../sense_cutsets.py`: exit0, kết quả path và fault-domain trong JSON, không phải circuit solver.
- `python -B -X utf8 .../thin_tail.py`: exit0, cấu hình tĩnh synthetic và các đoạn liên tục đã kiểm.
- `cad.cmd run .../functional_witness.py`: exit0,14 ca refinement; fixture cũ giữ làm đối chứng.
- `cad.cmd run .../thin_tail_kernel.py`: exit0,133 cặp native, không tái xây toàn bộ interlock.
- `python -B -X utf8 .../supply_allocation.py`: exit0, arithmetic có điều kiện.
- Snapshot, hash nguồn và kết quả queue validator được ghi riêng trước khi báo checkpoint. Không chạy npm/browser vì không thay ứng dụng.

Review độc lập cho lượt3 được lưu riêng; review attempt-2 không phủ artifacts mới. R12 giữ SHA-256 `8b3456545639db7b559eb06ad798b10f0d406ae1326403216302504fe104427b`, bốn cổng và14verification_items không đổi.
