# P0-15 — kiểm vòng cấp CHECK và cắt nguồn coil

Founder bỏ mốc dừng 50%. Lượt này tiếp tục trên hai snapshot attempt-6 và attempt-7, đã đối chiếu đủ 16 và 6 tệp. Box 08 trả hai finding về cách ghi phân bổ và giữ mở bằng chứng triển khai. Bản này ghi phép tính bổ sung, các phản ví dụ và điều kiện còn thiếu cho thiết kế. [Review gốc](BOX08-REVIEW-6-7.md)

## Hai sửa đổi từ Box 08

- **IR của cassette.** 7,2 nA ở phép thử giả định 1 GΩ nằm dưới ngân sách toàn node 7,5955 nA. Sau khi dành 2,5 nA cho bo và dây, phần connector chỉ còn 5,0955 nA, nên ca đó vượt phân bổ. Bảng mới thể hiện hai cột riêng. Cặp 20 tiếp điểm đang xét dùng socket `-S` mạ 30 µin. Trang biến thể `-L` mạ 10 µin chỉ giúp đối chiếu danh sách mã, không dùng số liệu của biến thể đó cho `-S`. [Bảng sửa](review-allocation-results.json) · [Bản vẽ SFM](https://suddendocs.samtec.com/prints/sfm-1xx-xx-xxx-d-xxx-x-xx-mkt.pdf)
- **Điện áp vòng CHECK.** 7,2 V là phân bổ riêng cho điện áp nguồn tối đa của vòng được đo. Cận công suất cấp ngược dùng một phân bổ khác, dù cùng có giá trị 7,2 V trong ca đang xét. Nếu vòng đo có cận nguồn 14,4 V, dòng hợp lệ tối thiểu giảm từ 135,73 xuống 67,86 µA và chồng lên vùng lỗi tới 77,57 µA. Biên 58,17 µA chỉ áp dụng khi giữ được hai phân bổ và đường đo đã xác định. [Phép tính](review-allocation-results.json)

## Thời gian ổn định của bộ chia sense

Với trở Thevenin tối đa 604,604 kΩ của mô hình trở cao, hai node có đáp ứng bậc một độc lập, sai số ban đầu mỗi node không quá 5,5 V và sai lệch vi sai còn lại mục tiêu 2 mV, cận thời gian ổn định là **0,521 ms ở 100 pF**, **1,719 ms ở 330 pF** và **5,208 ms ở 1 nF** mỗi node. Các giá trị điện dung là phân bổ thử, gồm phần điện dung nào thực sự tạo cực tại node. Cần đưa trở nguồn, tụ ghép và quá trình ổn định reference vào mô hình khi có bố trí mạch.

Ca có overdrive hữu hạn dùng điện áp cell thấp hơn cận trip DC thấp nhất 20 mV. Khi đã ổn định tới phân bổ 2 mV, còn ít nhất 7,99 mV sai lệch so sánh trong ca đó. Từ đây có thể đối chiếu cận propagation của linh kiện theo điều kiện phép thử, thay vì lấy propagation tại một overdrive rồi áp cho mọi cách cell sụt áp. Thời gian tổng còn gồm mạch nhận lỗi, latch và phần tử ngắt. [Mô hình RC](sense-settling-results.json)

## Cắt nguồn coil từ cả hai phía

Ca Pack+ chập vào nhánh coil sau cả hai gate làm coil có thể còn được cấp điện nếu dây hồi nối thường trực. Phương án chức năng mới đặt quyền A ở phía cấp và quyền B ở phía hồi của từng nhánh. Khi cả hai kênh phát lệnh OFF, một chập nối riêng đầu cấp hoặc riêng đầu hồi không khép được vòng nguồn trong mô hình. Khi một kênh vẫn báo khỏe giả, gate khỏe còn lại cắt được vòng. Mỗi coil vẫn có nhánh riêng.

Tám ca đường dẫn bao gồm hai đối chứng thất bại. Nếu cả hai dây bị nối vòng, hoặc nếu bộ ổn áp hay clamp tạo dây hồi thường trực rồi đầu cấp chập Pack+, coil vẫn có thể được cấp điện. Vì vậy regulator và clamp phải ở phía cục bộ của từng cặp đã cắt, và cần kiểm đường body diode, nguồn enable, shield, GND và dòng xả tụ. Mô hình không tính thời gian coil nhả hoặc các đường dòng nhỏ. [Kết quả](coil-cutset-results.json)

Để tính điện lượng lấy từ pack sau lỗi, cộng cận tích phân riêng cho tải chính, mỗi coil, CHECK, sense và AON. Với nhánh có cận dòng và thời gian, dùng tích `Imax × Tmax` cho mỗi pha còn được cấp. Năng lượng lưu trong coil hay tụ có thể kéo dài thời điểm tiếp điểm mở và do đó ảnh hưởng cận của **tải chính**, kể cả sau khi dòng cấp coil đã hết. Nhánh có đường cấp vòng chưa chặn cần cận thời gian và dòng riêng. Hiện chưa đủ dữ liệu để ra một số điện lượng toàn mạch. Cận rail 0,341 s và cận relay 4 ms từ các hồ sơ trước áp dụng cho những phép kiểm khác nhau.

## Trạng thái thiết kế

Hồ sơ cho thấy một hướng xử lý lỗi nguồn coil và cách chốt thời gian ổn định đầu vào. Mạch cắt hai phía, đo dòng vòng CHECK, cấp ngược và nguồn luôn bật vẫn cần thiết kế linh kiện và kiểm độc lập. Cơ cấu cassette giữ điều kiện nguồn của đúng connector cùng datum. Phép đo phần cứng `NOT_RUN`. P0-15 đang tiếp tục; B1 còn chờ thiết kế tích hợp và cấu hình được duyệt đúng hash.
