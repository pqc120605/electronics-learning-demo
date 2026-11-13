# EVT0 3 AA · Miền RUN đề xuất để review trước B1

Giữ 3 AA tháo rời, tay cầm không dây và B01 nhận nguồn qua USB-C. Hồ sơ này mở rộng [phân tích C7–C9](EVT0-3AA-C7-C9-FOLLOWUP.md) bằng cách nâng điện áp tối thiểu khi RUN. Các mốc dưới đây là đề xuất trên giấy. Cấu hình r14 chưa thay đổi.

## C8 · Nâng sàn điện áp dưới tải

Tính 1,5 A tại rail boost cao nhất 5,304 V, hiệu suất giả định 75% và tải phụ 50 mA. Cửa sổ cắt tĩnh 3,820–4,118 A của lượt trước được dùng làm phân bổ. Sàn đo ngay tại cực pack phải tính dưới tải, kể cả các sai số và độ trễ. Điện áp hồi khi không tải không đủ để cấp quyền RUN.

| Phân bổ | Trước | Đề xuất sàng lọc |
|---|---:|---:|
| Cực pack dưới tải | 3,15 V | 3,60 V |
| Đầu vào boost | 2,70 V | 3,10 V |
| Dòng pack ở hiệu suất giả định 75% | 3,979 A | 3,472 A |
| Biên tới cắt sớm | −159 mA | +348 mA |
| Hiệu suất hòa biên, trước dự phòng | 78,17% | 68,08% |
| Trở tối đa cho khay và đồng ở dòng cắt muộn | 56,07 mΩ | 68,22 mΩ |

Hướng này có thể ngắt sớm hơn khi pin xuống điện áp hoặc trở tăng. Chưa có cơ sở công bố thời lượng RUN cho NiMH hoặc mức tải cho alkaline. Dữ liệu VARTA đến 0,8 V/cell không xác lập thời gian giữ pack ở 3,60 V dưới tải 3,472 A. Báo cáo TI PMP9779 có ca short phía ra 5 V ở đầu vào **3,6 V**, nên chỉ dùng làm tham chiếu bảo vệ ngắn mạch của TPS61088. Vẫn cần cận hiệu suất, nhiệt, khởi động và bước tải của tổ hợp 3,10 V → 5,20 V. [VARTA 56706](https://docs.rs-online.com/20d6/A700000015406392.pdf), [TI PMP9779, TIDUBU0, tr. 7](https://www.ti.com/lit/pdf/TIDUBU0), [TI TPS61088 Rev. D](https://www.ti.com/lit/ds/symlink/tps61088.pdf)

## C7 · Loại phương án diode nối tiếp khỏi danh sách ưu tiên

Với rail thấp 5,096 V, đầu cáp cần 4,75 V và tầng attach đã dùng 55 mΩ, diode nối tiếp chỉ còn tối đa **263,5 mV** ở 1,5 A, trước dây, đường hồi và ripple. Datasheet Nexperia PMEG3030EP có mức MAX 360 mV ở **3 A và 25 °C**. Không thể dùng mức này để chứng minh diode nằm trong 263,5 mV ở cả dải nhiệt thực. Cận rò tại điều kiện có nguồn ngoài cũng phải thỏa yêu cầu trên toàn đường về pin. Tạm ưu tiên tầng chặn chủ động từ hồ sơ C7–C9 và cơ chế khóa cấp nguồn khi đầu cáp đã có áp. Vẫn thiếu cận dòng và điện tích trong ca một tầng kẹt hoặc mất bias. [Nexperia PMEG3030EP Rev. 3](https://assets.nexperia.com/documents/data-sheet/PMEG3030EP.pdf)

## C9 · Tính đủ điện áp để đạt điều kiện thử trễ

MAX977 có cận trễ **50 ns MAX** ở chế độ tốc độ cao, nguồn 5 V, tải 10 pF và overdrive 5 mV. Đây là ứng viên comparator có cận thay cho chỉ dùng số TYP. Với mạng suy hao 1/2, phải dự trù thêm **10 mV ở cell** trước khi áp được điều kiện overdrive. Từ cận ngắt thấp 0,90 V, trừ mức cuối 0,80 V, bước sụt giả định 20 mV và 10 mV dành cho overdrive, còn 70 mV. Ở độ dốc giả định 50 mV/ms, phần thời gian còn lại là **1,40 ms**. Phải chứng minh nguồn 5 V và tải ngõ ra nằm đúng điều kiện datasheet, đồng thời kiểm trễ của mạng sense, logic veto, driver và phần tử ngắt. Khi nguồn comparator sụt, đường cho phép cấp VBUS phải mặc định mất quyền. MAX977 là ứng viên, chưa chứng minh được việc giữ khóa qua brownout. [ADI MAX975/MAX977, tr. 3](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX975-MAX977.pdf)

## Tiêu chí review

- C8. Kiểm trade-off thời lượng khi nâng sàn RUN. Chỉ đưa mốc 3,60/3,10 V vào revision mới nếu có cận pin, đường cấp và hiệu suất đủ để giữ tải công bố.
- C7. Chốt hai đường ngắt có phản ứng xác định khi cắm nhầm. Một số ngưỡng đủ phát hiện trên giấy, còn cần cận năng lượng và thời gian của cả đường.
- C9. Chứng minh cận theo từng cell với dây sense lỗi và tín hiệu veto mặc định khi mất nguồn. Duy trì khóa nếu mất trạng thái thử lại.

Tái lập bảng bằng `node docs/agents/runs/MM-HW-P0-15/evt0-3aa-run-envelope.mjs`. Không có mẫu phần cứng, mọi phép đo `NOT_RUN`. Hồ sơ chỉ cập nhật phân tích, chưa có kết quả review độc lập cho các bytes này.
