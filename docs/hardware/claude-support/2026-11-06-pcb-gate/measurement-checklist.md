# Measurement checklist · mẫu ESP32 DevKit V1 Type-C (06/11b)

Chưa có `[SỐ_ĐO_MẪU]`, nên đây là checklist thay cho `mechanical-profile.md`. Người đo: founder hoặc người được chỉ định (agent không thao tác thiết bị). Ghi mọi số kèm đơn vị, dụng cụ, số lần đo và ngày. Mã gate như `gate-matrix.md`.

| # | Phép đo | Dụng cụ | Dung sai yêu cầu | Gate đang chặn |
|---|---|---|---|---|
| 1 | Dài và rộng PCB (không tính chân, không tính phần USB-C nhô) | Thước kẹp | ±0,05 mm, đo 3 lần lấy trung bình | Kích thước board đo từ mẫu; footprint DevKit; outline carrier |
| 2 | Khoảng cách tâm hai hàng chân | Thước kẹp (đo mép trong và ngoài lỗ hàn rồi quy tâm) | ±0,05 mm | Footprint socket 1×15 hai hàng |
| 3 | Pitch chân và khoảng pin 1 → pin 15 mỗi hàng | Thước kẹp, hoặc thước thép đo 14 pitch | ±0,05 mm (pitch danh nghĩa 2,54 mm `[chưa kiểm chứng trên mẫu]`) | Footprint socket |
| 4 | Pin 1 ở đầu USB-C hay đầu anten; chiều đọc nhãn | Ảnh có đánh dấu | Định tính, ghi rõ chiều nhìn mặt linh kiện | Pin map, footprint |
| 5 | Tâm và đường kính 4 lỗ bắt vít so với một góc PCB | Thước kẹp, đo đường kính bằng chân đo trong | ±0,05 mm | Gá carrier, lỗ cố định, vỏ |
| 6 | Độ dày PCB | Thước kẹp | ±0,02 mm | Cơ khí, chiều cao tổng |
| 7 | USB-C: nhô ra khỏi cạnh PCB, độ cao tâm cổng so với mặt PCB, rộng vỏ | Thước kẹp | ±0,1 mm | Vỏ, đường cáp, kiến trúc RUN OUT (AV1) |
| 8 | Chiều cao linh kiện cao nhất mặt trên (mô-đun, tụ tantalum, nút) | Thước kẹp đo từ mặt PCB | ±0,1 mm | Khoảng hở carrier, vỏ |
| 9 | Chiều dài chân header phía dưới và độ nhô | Thước kẹp | ±0,1 mm | Độ cắm socket, chiều cao carrier |
| 10 | Vùng cấm anten: đầu mô-đun nhô ra khỏi cạnh PCB hay không, vùng không có đồng | Thước kẹp và ảnh | ±0,1 mm | Keep-out carrier. Tham chiếu mô-đun: keep-out ở `esp32-wroom-32_datasheet_en.pdf` tr.8, tr.37; mô-đun 18,00 × 25,50 mm (tr.36) |
| 11 | Marking trên `U2` và regulator | Macro điện thoại hoặc kính lúp | Đọc được chữ khắc | Suffix CH340; topology USB-C/VIN/3V3 |
| 12 | VID:PID khi cắm PC | Device Manager, người thực hiện | Chính xác | Suffix CH340 |
| 13 | Thông mạch (khi mẫu không cấp điện): USB-C VBUS tới VIN, 3V3, 5V pad; CC1/CC2 tới điện trở xuống GND | Đồng hồ vạn năng ở thang thông mạch/Ω | Ghi giá trị Ω | Topology USB-C/CC/VBUS/VIN/3V3; kiến trúc tay cầm (Q2); EF net map |
| 14 | Dòng USB khi cắm, khi boot, khi nạp | Đồng hồ đo dòng USB hoặc nguồn lab có đo dòng; cần phép riêng của founder | Ghi trung bình và đỉnh | Dòng USB; giới hạn nguồn cổng |

## Quy ước chung

- Gắn thước chuẩn trong ảnh: thước mm áp sát cạnh PCB, chụp vuông góc, không zoom số.
- Số 1–10 chặn gate "Kích thước board đo từ mẫu" và các gate footprint, cơ khí. Số 11–13 chặn "Suffix CH340" và "Topology". Số 14 chặn "Dòng USB".
- Chưa có số nào: mọi kích thước trong tài liệu (51,5 × 28 mm của EasyWare, tỉ lệ từ ảnh) chỉ là tham khảo, `[chưa kiểm chứng]`.
