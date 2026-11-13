# P0-15 — tiến độ chuẩn bị B1

B1 còn ba điều kiện thiết kế mở. Hồ sơ này ghi phần đã làm và bằng chứng cần để đóng từng điều kiện trước khi lập báo cáo chuyển Claude.

| Điều kiện | Kết quả hiện có | Bằng chứng còn thiếu |
|---|---|---|
| CHECK và hai đường ngắt tải | Box 02 đưa ứng viên INA190A1 với shunt 7,50 Ω, rail đo 1,85 V và hai cửa sổ dòng. Lead tái lập cận quyết định và đường hồi trên mô hình. | Cận linh kiện và tải trên đúng rail, đường hồi thật, dòng cấp vòng ngoài guard, thời gian mất trạng thái và điện lượng toàn pack sau trip. |
| Liên động cassette và cửa USB | Ray chữ T đã dựng trong CAD và kiểm tám ca giao khối. Phiên bản nới khe sàn đi hết các ca quét góc nhỏ. | Dung sai dẫn hướng thực, mặt chuẩn connector thật, vỏ và holder, điểm gãy chung, giữ liên động V/probe/witness khi cắm lệch hoặc tháo một phần. |
| Giá toàn bộ | Có giá công khai cho ba header đúng mã, cùng một phép thử chi phí với socket biến thể. | BOM robot, tay cầm, pin và sạc đủ dòng giá; xác nhận phương án đầu cắm nhỏ hơn hoặc nguồn giá phù hợp. |

## CHECK và ngắt tải

Ứng viên dùng shunt Kelvin 7,50 Ω trên cả dây cấp và hồi, đo theo chiều, mỗi miền có vòng trạng thái cách ly. Mô hình tính lại cho biên nhỏ nhất **14,39 mV** ở cửa sổ dưới và **24,87 mV** ở ca quá dòng 7,5 mA. Đầu ra danh định và ngân sách sai số ở điểm 7,5 mA còn **94 mV** tới biên tuyến tính của rail đo 1,85 V theo giả thiết nguồn. Sụt áp qua hai shunt tối đa tính được là **97,89 mV** ở 6,5 mA. Các kết quả giữ điều kiện của bảng hãng và ngân sách của Box 02. Chưa dùng để duyệt mã linh kiện. [Hồ sơ Box 02](BOX02-COMPONENT-CANDIDATE.md) · [Kết quả tính](check-design-results.json)

Nếu cộng 5 µA dành cho đường ngoài guard, cận rail còn hợp lệ tăng lên khoảng **353,52 ms**. Với phân bổ 40 ms từ lúc mất rail tới hủy trạng thái, dwell 400 ms chỉ còn khoảng **6,49 ms** dự phòng. Đây là yêu cầu cho thời gian tối thiểu thực của CHECK, chưa phải thời gian ngắt tải khi RUN. Cần kiểm tụ, clamp, bộ cách ly, timer và hồi phục sau quá tải.

Quy tắc đi dây nghiên cứu là dây hồi cassette chỉ được nối tới đầu shunt riêng của nó. Mọi shield hoặc return phụ có thể nối ở phía nguồn sau shunt đều phải kê trong ngân sách cấp ngược. Kiểm năm ca cho thấy khi dây hồi A hở, nối tới điểm sao sau shunt hoặc hồi qua shunt B không tạo dòng đúng chiều qua shunt A. Đối chứng nối vào trước shunt A vẫn có thể tạo kết quả hợp lệ giả. Kết quả chỉ áp dụng cho đường dẫn có dấu trong mô hình. Còn cần chứng minh bằng bố trí thực, bao gồm lỗi cách ly hoặc kẹp áp. [Bản đồ ca lỗi](check-design-results.json)

Hai relay thường mở vẫn là ứng viên nghiên cứu. Cặp MOSFET ở cả cấp lẫn hồi của coil phải duy trì mặc định OFF khi mất bias và chặn cấp ngược. Cận hãng của driver tại một điều kiện EN không thay cận toàn chuỗi từ cell yếu tới tiếp điểm nhả ổn định. Cần hoàn thiện cả dòng trước trip, coil có đường vòng, CHECK, sense và AON trước khi tính điện lượng tối đa.

## Ray cassette

Mô hình có hai ray dài 52 mm, bốn guốc và chặn ở hai đầu. Ray trái định vị ngang, ray phải nới ngang. Lưỡi được nâng đáy từ 12,1 lên 12,7 mm để tránh cấn lúc cầu hạ. Thử nới khe sàn từ 0,05 lên 0,15 mm ở mỗi bên ray. Bản đầu đi hết 189/243 tư thế trong nhóm góc nhỏ. Bản nới khe đi hết **243/243** tư thế quét dọc trục trong nhóm ±0,05° và lệch ±0,02 mm. Nhóm góc rộng hơn chỉ có **9/243** tư thế đi hết. Các góc được giữ cố định trong từng phép quét. Kết quả chưa mô phỏng đường trượt đồng thời xoay, lực tay, độ mềm vật liệu hoặc khả năng lắp holder vào vỏ. [Hình CAD](guided-cassette.png) · [Kết quả quét](guide-sweep-results.json)

Mỗi tư thế đi hết được kiểm với từng lưỡi còn lại. Trong các ca này, lưỡi chặn nâng cầu và chặn lắp lại trước vùng tiếp xúc khi cầu còn park. Tám phép kiểm giao khối ở CAD khớp các mốc danh nghĩa 0,7 mm nâng và 16,8 mm rút. Với phân bổ ±0,60 mm theo trục rút, ngưỡng nhả sớm nhất 16,2 mm còn khoảng 0,542 mm trước mốc ngắt đã tính có điều kiện 15,658 mm. Holder tham chiếu và ray ở cùng vùng cao chỉ còn khe hẹp, nên cần chốt vị trí theo Z, độ dày vách và kích thước holder trước khi nhận bao lắp. [Đầu vào Box 03](BOX03-GUIDE-PROPOSAL.md) · [Kiểm kernel](guide-native-results.json)

## Chi phí và hướng giảm số tiếp điểm

Giá đơn chiếc công khai của hai header cầu 50 tiếp điểm và một header cassette 20 tiếp điểm cộng **20,817 USD**. Giá socket 50 tiếp điểm đúng mã còn thiếu. Nếu dùng giá biến thể mạ tương đương có K-pad để sàng lọc, subtotal hai cặp cầu cộng header cassette lên **37,721 USD**. Ở tỷ giá thử 26.000 đồng/USD, còn **19.254 đồng** dưới trần 1 triệu cho toàn bộ phần chưa tính, gồm cả socket cassette. Đây là ca giá tham khảo, chưa là báo giá cho mã đã chọn và chưa tính vận chuyển, thuế hay số lượng. [Header 50](https://www.samtec.com/products/tfm-125-02-s-d-a) · [Header 20](https://www.samtec.com/products/tfm-110-02-s-d-a) · [Socket biến thể](https://www.samtec.com/products/sfm-125-t2-s-d-a-k)

Để giữ trần hiện tại, bước thiết kế có giá trị là chốt kết nối RUN chỉ cấp nguồn qua USB-C và kiểm các đường thật. Nếu giới hạn đường qua cầu ở 16 tín hiệu, JOY_VCC, tối đa bốn return header và bốn đường USB gồm VBUS/GND/CC1/CC2, cận chức năng là 25. Khi đó có thể khảo sát cặp 26 hoặc 30 tiếp điểm, mỗi đường vẫn đi qua hai điểm tách. Cần xác định đúng B01 và hành vi attach, dòng, shield, data, debug trước khi dùng cận này. Bất kỳ đường đi vòng ngoài cầu nào đều phá giả thiết. Chưa có giá hoặc cận cơ khí của một cặp nhỏ đã chọn. [Bảng giá và cận](budget-screen.json)

## Điều kiện để lập báo cáo Claude

Hoàn thiện topology và hồ sơ nguồn, dẫn hướng và BOM như bảng trên. Review nội bộ đúng snapshot phải phân xử các điểm này và xác định cấu hình AA áp dụng. Founder duyệt đúng revision/hash trước bước xây dựng, sau đó preflight kiểm phạm vi B1. Chưa có report sẵn sàng B1. Phép đo phần cứng `NOT_RUN`.
