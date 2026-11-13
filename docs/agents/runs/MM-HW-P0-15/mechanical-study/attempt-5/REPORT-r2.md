# P0-15 — liên động cassette và cận dòng sense

## Liên động cassette M5

Hai lưỡi đi cùng cassette nằm trên thanh ngang của hai đầu cầu. Cầu đã hạ thì cassette có đường trượt tự do. Khi cassette còn trong vùng có thể dẫn điện, một lưỡi nguyên vẹn giữ đầu cầu tương ứng dưới cao độ mở cửa USB. Khi cầu ở vị trí PROGRAM, thanh ngang cũng chặn cassette trở lại vùng tiếp xúc. Mô hình dùng chuyển động tịnh tiến, thanh và lưỡi cứng, cùng cụm khóa đã kiểm ở attempt-4. [Mô hình](m5_cassette_model.py)

| Ca tham chiếu | Kết quả |
|---|---|
| Hành trình cassette 8 mm | Mỗi lưỡi nhả thanh của nó ở 2,8 mm. Giả thiết ngắt đủ ở 2 mm chỉ dùng làm baseline. |
| Một lưỡi mất, connector còn dẫn tới 3 mm | Tại 2,9 mm, hai đầu cầu có thể lên vị trí park. Ca này bác việc dùng baseline mà thiếu cận tiếp xúc thực. |
| Hành trình cassette 22 mm | Mỗi lưỡi nhả ở 16,8 mm. Phần dư xấp xỉ 1,142 mm so với mốc có điều kiện 15,658 mm của phương pháp bao phần dẫn Samtec. Mốc này chỉ áp dụng nếu cụm cassette đáp ứng đúng toàn bộ giả thiết hình học của phép tính. |
| Lắp lại khi cả hai đầu ở vị trí park | Cả hai lưỡi còn nguyên thì bị chặn ở khoảng 20,8 mm tính từ vị trí lắp kín. Ca xấu hơn khi mất một lưỡi bị chặn ở 16,8 mm. |
| Mất cả hai lưỡi | Hình học mất điều kiện chặn. Điểm gắn chung của hai lưỡi cần được xử lý khi thiết kế thật. |

Kiểm giải tích vùng chồng lấn, quét chuyển động theo từng trục và tám phép giao khối CAD khớp các ngưỡng thử. Cảnh lắp kín chiếm 64 × 92,88 × 58 mm. Cảnh PROGRAM chiếm 64 × 123,1 × 41,8 mm gồm cassette đã kéo ra và đầu cắm. Đây là dữ liệu để bố trí vỏ. Chưa xác lập độ vừa tay cầm, độ rơ dẫn hướng hay độ bền. Cần chốt connector cassette, quy về cùng datum và chứng minh cả 8 hoặc 14 đường thực đều ngắt trước khi nhả lưỡi. Giá trị 0,1 mm dùng để chặn nâng trong hình học danh nghĩa. Tiếp xúc điện khi hạ cầu vẫn cần điều kiện xác nhận riêng trước cấp quyền RUN. [Phép quét và phản ví dụ](cassette-geometry-results.json) · [Ảnh mô hình](cassette-program.png)

## Cận xả sau trip

Box 02 chỉ ra lỗi chập đầu sense xuống GND hoặc rail ngay tại IC đầu tiên có thể đi vòng qua break thứ hai. Với hai guard 499 Ω ±0,1% còn nguyên, mỗi đường có thể tiếp tục dẫn đến 5,416 mA ở chênh áp 5,4 V. Thiếu cận thời gian ngắt thì dòng này chỉ cho phép tính điện lượng theo thời gian, chưa cho phép kết luận về xả pin sau trip. Giới hạn 220 µs của TMUX2821 chỉ áp dụng phép thử của TI khi nguồn còn hợp lệ. [Hồ sơ Box 02](BOX02-TMUX-TRIP-REVIEW.md) · [TI SCDS488](https://www.ti.com/lit/ds/symlink/tmux2821.pdf)

Phương án nghiên cứu bổ sung dùng hai điện trở **604 kΩ ±0,1%** nối tiếp đặt sát mỗi tap trước phần dây có thể chập. Đây là toàn bộ arm tap của bộ chia 1/2. Arm tham chiếu có cùng tổng trở. Phép tính giữ 12 đường sense độc lập cho hai kênh UV. Cắt tải chính vẫn cần hai đường ngắt độc lập. Mức 100 µA dùng để so sánh với ngân sách nghiên cứu trước, chưa là tiêu chí sản phẩm.

- Với chênh áp tối đa 7,2 V trên mỗi arm, tổng cận dòng của 12 đường là **71,60 µA** khi các guard nguyên vẹn và **77,57 µA** nếu đúng một điện trở chập. Như vậy còn 22,43 µA cho AON, rò của ngắt tải và các nhánh khác nếu dùng ngân sách 100 µA. Chập đi vòng qua cả cặp guard, đường dây trước guard và điện áp ngoài miền 7,2 V cần xử lý riêng. 77,57 µA tương đương tối đa 1,862 mAh/ngày qua các nhánh sense cộng lại trong mô hình. Thời gian lưu pin phù hợp cần được xác định riêng.
- Với các phân bổ sai số đã ghi, 256 corner cho ngưỡng **1,06239–1,13768 V/cell** khi các điện trở còn nguyên. Điều kiện gồm tổng lỗi comparator 10 mV ngoài input bias, bias tối đa 1,2 nA và rò bo tối đa 2,5 nA mỗi node. Phân bổ rò tương đương khoảng 2,88 GΩ tại 7,2 V. Cần bằng chứng cho những giá trị này ở miền điện áp, nhiệt độ và trạng thái nguồn thực. Điện trở Thevenin có thể đến 604,6 kΩ, nên thời gian ổn định phụ thuộc mạnh vào điện dung đầu vào và đường mạch. Cận comparator ghi ở điều kiện bảng của hãng, chưa đủ làm cận toàn hệ. [Kết quả phép tính](passive-sense-results.json) · [TI SNOSDC8E, tr. 8–9](https://www.ti.com/lit/ds/symlink/tlv1814.pdf)
- Một guard chập ở tap cao có thể làm kênh đó báo khỏe với cell 0,8 V. Ca mô hình dùng tap H=4,0 V và L=3,2 V cho đầu ra sai lệch +0,183 V. Cần giữ hai bộ đo và hai đường cắt tải độc lập, xét điểm lỗi chung ở tap, nguồn, reference, latch và bố trí dây. Khi một kênh mất nguồn hoặc mất tín hiệu, quyền RUN phải về OFF và yêu cầu thao tác cấp quyền mới.

Một guard hở cũng có thể làm kênh báo khỏe. Với arm H hở, cell 0,8 V và tap L=0 V, bias kéo P về 2 V còn N=1,55 V. Sai lệch +0,45 V giữ quyền khỏe giả. Kiểm lại bảo vệ phải bao cả hở và chập. Một cách hiện thực cần kiểm là lấy Kelvin riêng từ mỗi đầu cell cho từng kênh, bias/reference và mạch cấp quyền riêng, rồi cho từng kênh trực tiếp điều khiển một bộ ngắt tải mắc nối tiếp. Một bộ ngắt khỏe phải đủ cắt tải dù bộ còn lại giữ ON. Cần kiểm riêng lỗi chung trước điểm tách tap, cấp nguồn chung, cấp ngược qua sense và quyền ngắt cùng bị giữ HIGH. Hiện chưa có cận linh kiện hoặc bố trí chứng minh các đường này độc lập.

Phép tính độ nhạy do lead bổ sung cho thấy mức rò bo lớn nhất tại 604 kΩ xấp xỉ 7,60 nA mỗi node theo các phân bổ đang dùng. Nếu rò 10 nA, cận điện trở theo UV chỉ khoảng 474 kΩ, thấp hơn 604 kΩ cần cho ngân sách dòng sense trong ca chênh áp 7,2 V và một guard chập. Đây là phép sàng lọc cho phương án nghiên cứu. [Bảng độ nhạy](sense-feasibility-results.json)

Phép tính bổ sung đưa ra một cách giới hạn nhánh chập mà không phụ thuộc thời gian ra lệnh OFF của TMUX. Phần cần chốt tiếp là cận rò và thời gian đáp ứng của mạng trở cao, ngắt tải chính và ngân sách AON. Phương án vẫn là ứng viên thiết kế. Phép đo vật lý `NOT_RUN`.

## Điều kiện còn lại trước B1

P0-15 cần hoàn thiện vỏ và dẫn hướng, ràng buộc vị trí connector cassette với các lưỡi khóa, xử lý điểm gãy chung và chu trình V/probe/witness. Về điện cần kiểm mạch ngắt tải độc lập và các cận nêu trên. Sau review thiết kế tích hợp mới có cơ sở trình cấu hình AA đúng hash để duyệt và chạy preflight B1.
