# P0-15 — cấp nguồn cho hai bộ đo trong cassette

Mỗi bộ đo có một cặp cấp nguồn và hồi riêng. Xét hai vòng báo hợp lệ cách ly, mỗi vòng dùng hai đường. Cách bố trí này cần tối thiểu **10 đường chức năng** gồm hai đường nguồn chính, bốn đường cấp và hồi cho hai bộ đo, cùng bốn đường báo hợp lệ. Mục tiêu là giữ các node sense trở cao trong cassette và tránh dùng dây báo hợp lệ làm đường hồi khi đứt return. Cần chọn linh kiện cách ly, kiểm dòng rò, xác nhận mặc định mất tín hiệu là mất quyền, rồi cộng mọi đường phụ trước khi kết luận về đầu cắm 20 tiếp điểm.

## So hai phương án điện trở xả

Dùng cận cộng các nhánh sense **77,5611 µA** từ hồ sơ trước. Phép tính giả sử mọi vòng cấp ngược đều đi qua các guard đã tính, chênh áp trên guard và điện áp nguồn có thể cấp qua từng vòng đều không quá **7,2 V**. Hai điều kiện này cần được chứng minh riêng. Tổng công suất cấp ngược có điều kiện tối đa **0,559 mW**. Mức hợp lệ 2,7 V và năng lượng lưu 0,333 mJ là các phân bổ để so phương án. [Hồ sơ guard](../attempt-5/REPORT-r2.md)

| Điện trở xả mỗi miền | Cận điện áp xác lập nếu chỉ còn công suất cấp ngược | Cận thời gian liên tục ở mức hợp lệ | Cận dưới dòng qua vòng cấp hợp lệ ở xác lập |
|---|---:|---:|---:|
| 10 kΩ ±1% | 2,375 V | 2,038 s | 22,68 µA |
| 4,7 kΩ ±1% | 1,629 V | 0,341 s | 135,73 µA |

Tại 2,7 V, điện trở xả tiêu thụ ít nhất `V²/Rmax`. Sau khi trừ công suất cấp ngược lớn nhất, phần còn lại phải lấy từ vòng cấp được giám sát hoặc từ năng lượng lưu. Vì vậy ở trạng thái xác lập có thể suy cận dưới dòng vòng cấp bằng cách chia phần còn lại cho điện áp nguồn tối đa. Nếu vòng đo đúng đường cấp và hồi dự kiến, phương án 4,7 kΩ cho khoảng phân biệt có điều kiện **77,57–135,73 µA** trước khi trừ sai số đo. Phương án 10 kΩ chưa tách được hai ca theo phép tính này. Hai điện trở 4,7 kΩ dùng tối đa khoảng **2,15 mA tại 5 V**, chưa tính comparator và phần báo hợp lệ. [Số liệu đầy đủ](check-supply-results.json)

Cận thời gian lấy toàn bộ năng lượng lưu có thể tới rail chia cho phần công suất tiêu hao lớn hơn cấp ngược khi rail còn hợp lệ. Nếu còn tụ cấp ngược chưa tính thì cận mất hiệu lực. Thời gian này không bao gồm phát hiện lỗi và ngắt tải chính. Cần mất quyền ngay khi phép kiểm vòng cấp báo không hợp lệ, cùng cơ chế buộc cấp quyền mới nếu rail hồi áp.

## Điều kiện để nhận thiết kế

Ưu tiên khảo sát 4,7 kΩ và phép kiểm dòng trên vòng cấp riêng. Cần chứng minh các ngưỡng dòng vẫn tách được sau sai số, nhiễu, chuyển tiếp và mất ground. Một return ngoài đường guard có thể giữ điện trở xả 4,7 kΩ ở 2,7 V với khoảng 0,569 mA, đủ bác việc chỉ dựa vào điện áp rail. Cần truy đường qua shield, nguồn phụ, các tín hiệu và mạch bảo vệ ở cả hai chiều. Mỗi bộ đo và mỗi bộ ngắt phải tiếp tục có quyền tự về OFF khi miền kia lỗi.

Bản này là phép tính chức năng. Review độc lập cho attempt-6 và phần bổ sung này vẫn chờ. Cửa sổ 5 giờ còn 49% khi bắt đầu lượt, nên không gửi thêm bàn giao. Phép đo phần cứng `NOT_RUN`.
