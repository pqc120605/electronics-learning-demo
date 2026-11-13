# EVT0 3 AA · Sàng lọc bộ ngắt theo dòng hai chiều

Phạm vi C7, giữ nguồn RUN qua USB-C và 3 AA tháo rời. [Phản hồi review miền RUN](EVT0-3AA-RUN-DISPOSITION.md)

## Ứng viên LTC4368-2

LTC4368-2 điều khiển cặp MOSFET rời và đo dòng qua shunt. Cận công bố là 40–60 mV chiều thuận và 1–5 mV độ lớn chiều ngược, trong điều kiện bảng. Dòng ngược ở dưới ngưỡng chưa kích bảo vệ. Tại điện áp nguồn 2,5 đến dưới 6 V, chênh IN cao hơn OUT để cho phép dẫn lại là 20–125 mV theo bảng. Cận ngắt gate 18 µs MAX có điều kiện: bước SENSE−OUT từ 0 xuống −10 mV và tải gate 2,2 nF. Điểm cuối của thông số là gate, chưa phải dòng thực tại đầu cáp về 0. [ADI LTC4368 Rev. C, tr. 3–4 và phần Reverse Overcurrent Fault](https://www.analog.com/media/en/technical-documentation/data-sheets/ltc4368.pdf)

| Tính với shunt 25 mΩ và phân bổ ±1% toàn phần | Giá trị |
|---|---:|
| Cắt tĩnh chiều thuận | 1,584–2,424 A |
| Cắt tĩnh chiều ngược | 39,6–202 mA |
| Bước dòng ngược để tạo ít nhất 10 mV ở shunt | 404 mA |
| Phần trở còn lại cho hai FET, dây, đường hồi và đồng, trước ripple/quá độ | 150,4 mΩ |

Với hai rail chênh 90 mV và tổng trở vòng giả định 0,20 Ω, dòng là 450 mA và bước trên shunt ít nhất 11,14 mV. Ví dụ dòng không đổi 450 mA trong 18 µs cho 8,10 µC đi qua tầng. Đây là tích phân minh họa trước mốc gate, chưa gồm tải gate thực, tụ, đường vòng hay chiều về cực pin. Nếu vòng là 0,30 Ω thì dòng 300 mA và mức sense thấp nhất 7,43 mV, dưới điều kiện thời gian của hãng. Với chênh 10 mV và vòng 0,20 Ω, dòng 50 mA có thể duy trì dưới cận cắt muộn 202 mA. Vì vậy ứng viên này chỉ bổ sung tầng bảo vệ sự kiện quá dòng ngược. Cần cơ chế riêng xử lý chênh nhỏ và ca nguồn carrier cao hơn nguồn ngoài.

## Quyết định sàng lọc

- Giữ TPS25810 làm ứng viên hạn dòng thuận/attach. Với dung sai shunt ±1%, để LTC4368-2 vừa tránh cắt tĩnh ở 1,50 A vừa chắc chắn cắt ở 1,82 A trong điều kiện bảng sẽ cần `Rnom < 26,40 mΩ` và `Rnom ≥ 33,30 mΩ` cùng lúc. Hai điều kiện không giao nhau. Ca ngắn mạch có điều kiện bảng khác và cần xét riêng.
- Giữ LTC4368-2 như ứng viên tầng thứ hai, cùng hai nhiệm vụ riêng là kiểm VBUS tại đầu cáp trước attach và ngăn dẫn khi nguồn ngoài đã cấp áp. Tính số điện tích vào **cực pin** từ bảng đường dòng và điện dung, kể cả ở dưới ngưỡng cắt. Không lấy cận trễ tại gate hoặc dòng shunt làm số của cực pin.
- Nếu tầng bảo vệ điện tiếp tục thiếu cận cho nguồn ngoài chênh nhỏ, phương án dự phòng để phân tích là đầu cáp RUN nằm trong khoang có liên động OFF khi mở khoang PROGRAM. Phương án này giữ tay cầm chạy không dây và dùng 3 AA. Hình học phải chứng minh đầu cáp RUN không với tới cổng nguồn ngoài khi còn điện, kể cả một tiếp điểm kẹt. Đây là giả thuyết để phân tích, chưa đổi cấu hình hay tạo CAD.

Tái lập số bằng `node docs/agents/runs/MM-HW-P0-15/evt0-3aa-reverse-screen.mjs`. `CONDITIONAL_SCREENING`, bench `NOT_RUN`. C7 OPEN.
