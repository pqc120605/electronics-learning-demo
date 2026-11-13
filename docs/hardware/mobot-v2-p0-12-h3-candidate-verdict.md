# P0-12 — kết quả tìm comparator cho H3

Đã kiểm hai ứng viên có khả năng giải quyết thiếu hysteresis MAX của TLV3201. **Chưa ứng viên nào đủ bằng chứng để thay vào thiết kế hoàn chỉnh.** Không chọn/duyệt MPN, không đổi r12 hoặc cổng H3. Các khoảng bên dưới là tính toán có điều kiện, không phải detector đã đạt.

## TLV9031: không có hysteresis nội, nhưng chưa đóng được timing/bias

Nguồn hãng TI SNOSDA3H, tháng11/2025, PDF `docs/research/downloads/p0-12/tlv9021-family.pdf` và hash/ảnh trong sources.json. Họ tài liệu bao TLV902x open-drain và TLV903x push-pull; ví dụ orderable TLV9031DBVR chỉ là ứng viên nghiên cứu, chưa BOM.

- §6.4.5 p23 xác nhận không có internal hysteresis. Có nguy cơ chatter gần zero differential; không mặc nhiên coi nó là một latch hoặc có lọc nhiễu.
- p9: offset MAX ±2mV toàn−40..125°C tại common-mode bằng V−, **không phải midsupply**. CMRR MIN60dB tạiVS5V, PSRR MIN75dB push-pull trênVS1,8..5V; dải4,75..5,25V của worksheet cũ không được bao trọn.
- Input bias5pA ở p9 làTYP, không cóMAX; allocation105nA tổng sense không được biến thành cận thiết bị.
- p10: delay/startup chỉTYP và điều kiện VID100mV; không cóMAX. Không dùng100/115ns hoặc20µs như MAX, cũng không lấy timing đó cho overdrive20mV.

Tính lại CMRR phải dùng độ lệch common-mode khoảng2,5V so với ground, cho sai số input≈2,502mV, thay vì≈0,127mV của comparator test tại midsupply. Source/ratio/reference và công thức trong calculate.py.

| Worksheet | Trip partial MIN/MAX | Biên nhỏ hơn trước các khoản chưa có |
|---|---:|---:|
|Reference allowance651,2ppm|4,084936–4,107467V|2,533266mV|
|Thêm provisional200ppm solder shift|4,084116–4,108287V|1,713111mV|

Các giá trị có điều kiện về CMRR/PSRR đồng thời, supply và leakage. Solder shift đã xác nhậnTYP trong ADR45, không cóMAX. Aging/thermal history/ripple/ground/startup/fault topology vẫn thiếu. Không được lấy việc bỏ hysteresis nội để gọi full error budget đã đóng. Latch trip bên ngoài có thể là hướng nghiên cứu để chặn retry/chatter, nhưng không tự tạo timing/bias guarantee hoặc bỏ yêu cầu fault coverage.

## LTC6702H: có MAX hysteresis nhưng không vừa cửa sổ hiện tại

Nguồn Analog Devices LTC6702 RevA p3/Note5,7: https://www.analog.com/media/en/technical-documentation/data-sheets/6702fa.pdf. Đọc được nguồn hãng qua web; tải cục bộ timeout một lần, nên chưa ghim PDF. Không cần Founder tải thêm tài liệu này cho một ứng viên đã bị loại khỏi worksheet hiện tại.

H-grade có offset toàn nhiệt±6mV, hysteresis1,6–8,2mV; offset là trung điểm hai trip. Với **rising trip riêng**, sai số comparator−5,2…+10,1mV input. Cộng reference/divider hiện tại cho4,084535–4,115897V: rộng31,362294mV, vượt cửa sổ27,6mV trước cả CMRR/PSRR/leakage. Không cần ép cả rising/falling cùng vào cửa sổ để đi đến kết luận này. Kết quả loại chỉ áp dụng ratio/window đang xét.

Delay MAX500ns có điều kiện step200mV/overdrive50mV trong Note7; không dùng cho overdrive20mV của energy worksheet. Một MAX nhanh dưới điều kiện khác không chữa được sai số tĩnh hoặc tự đóng chuỗi cutoff.

## Các đòn bẩy có số, chưa chọn

Giữ trần pack4,200V, Ipeak2,387511478A, Kmax1,638671573, overdrive20mV và parasitic20mV. Tất cả C/ESR/current là allocation chưa có full topology proof.

| Trip MAX | Cmin | ESRmax | Thời gian cắt cho phép có điều kiện | Đánh đổi |
|---:|---:|---:|---:|---|
|4,110V|10mF|10mΩ|55,922µs|baseline mới; còn thiếu fullchainMAX|
|4,110V|20mF|10mΩ|111,844µs|tụ lớn hơn, inrush/leakage/fault/Cmin sau một open phải tính lại|
|4,120V|10mF|10mΩ|14,037µs|nới cửa sổ tĩnh nhưng mất phần lớn timing margin|
|4,125V|10mF|1mΩ|83,095µs|đòi ESR thấp hơn10lần; chưa chứng minh phần tử/tuổi thọ/đường nối|

Đây là sensitivity để thiết kế, không phải bốn phương án đã khả thi cho Founder duyệt. TăngC chỉ tăng thời gian nếu hiệu dụng và nối đúng node; không tạo hysteresis/agingMAX hoặc sửa lỗi bypass. Cửa sổ tĩnh và timing cần giải đồng thời với startup, cell-terminal sensing, reverse path, latch/driver/cutoff và lỗi đơn.

Kết luận F1: đã có verdict dựa datasheet cho hai hướng, chấm dứt việc mặc định TLV3201/TLV9031 là giải pháp hoàn chỉnh. H3 giữOPEN; bước tiếp theo phải là topology/candidate có tập cận đầy đủ hoặc đánh đổi đã được chứng minh, không tiếp tục đổi tên IC để làm xanh hồ sơ.
