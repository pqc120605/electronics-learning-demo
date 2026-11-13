# MoBot V2 · Phiếu xin hồ sơ linh kiện

Vui lòng cung cấp hồ sơ **đúng SKU và revision hoặc lô dự kiến giao**. Xin ghi rõ mục nào chưa có dữ liệu và mục nào đã xác nhận linh kiện không có tính năng đó.

## Phân loại đầu vào theo D10 và review Box08 ngày 08/11

Phiếu này là bản nháp để Founder/người được phép chuyển nhà bán; HQ chưa gửi ra ngoài.

| Nhóm | Cần cho quyết định thiết kế hiện tại | Có thể cung cấp bổ sung, không dùng làm gate đo trước PCB |
|---|---|---|
| B01 | Ảnh hai mặt hàng dự kiến giao, SKU/lô hoặc truy xuất tương đương, mã PCB và marking USB-UART/regulator; xác định quan hệ với mẫu ảnh chuẩn | Số đo hình học, sơ đồ/đo điện nội bộ clone, kết quả attach/boot. Các phép đo thuộc D10 vẫn sau PCB theo quyền tương ứng; không đòi đo lại chỉ để duyệt proposal. |
| Jauch | Đúng revision, giới hạn/profile sạc, NTC R–T/dung sai nếu có, bản vẽ mặt ghép và cực tính | Chứng cứ đo trên một mẫu hỗ trợ nhận dạng; không thay giới hạn bảo đảm của hãng. |
| Pack robot | Cell/PCM, cân bằng, nhiệt, profile sạc và giới hạn xả áp dụng để chọn Q7 | Cần hồ sơ xung nếu tải vượt định mức liên tục; không đòi hồ sơ xung riêng khi thiết kế đã chứng minh mọi tải nằm trong định mức liên tục với đủ điều kiện nhiệt/thời gian. |

Chấp nhận hồ sơ truy xuất tương đương thay vì bắt buộc CoC. Trả lời “không có” là dữ kiện để chọn phương án thiết kế khác, không phải bằng chứng linh kiện tương thích. Các bản vẽ/số đo bên dưới chỉ yêu cầu trong phạm vi nhà bán thực sự có; không chuyển số liệu chưa biết thành giá trị xác nhận.

**B01 · ESP32 DevKit V1 30 chân USB‑C, họ CH340**
Xin ảnh rõ hai mặt của bo sẽ giao, nhãn SKU/lô, mã PCB/revision, chữ trên IC USB‑UART và regulator, cùng nhãn đủ hai hàng chân. Với bản vẽ hoặc số đo, xin đặt mặt linh kiện hướng lên, USB‑C ở dưới, lấy giao điểm hai đường mép thẳng phía dưới và bên trái làm gốc XY, mặt linh kiện PCB làm mốc Z. Xin ghi dài/rộng/dày PCB, bước chân, khoảng cách tâm hai hàng và độ lệch dọc, vị trí chân đầu từng hàng, tâm và đường kính lỗ gá, vị trí tâm cổng USB‑C, độ cao và độ nhô cổng, chiều cao linh kiện tối đa hai mặt và vùng chừa anten. Ghi đơn vị và dung sai. Nếu có sơ đồ đúng revision, xin phần CC1/CC2, VBUS, VIN, 3V3 và USB‑UART.

**Jauch `250832` Rev. 1.2**
Xin bản vẽ đầu dây `XHP‑3` **nhìn từ mặt ghép**, thấy rõ gờ giữ và dấu khoang 1. Ghi thứ tự khoang 1–3, màu dây và chức năng `BAT+`, `BAT−`, `NTC`, cùng chân tham chiếu của NTC. Xin xác nhận có NTC đưa ra đầu nối hay không. Nếu có, gửi mã, vị trí lắp, bảng R–T và dung sai. Xin cận điện áp CV được phép, dòng kết thúc, thời gian sạc tối đa, điều kiện sạc lại và cận xả/phục hồi của PCM.

**MTM B04 `7V2AH-4A-2S1P`**
Xin mã cell và PCM/BMS đúng lô, xác nhận rõ **có hay không cân bằng từng cell và có hay không NTC**. Nếu có, xin ngưỡng và dòng cân bằng, mã NTC, bảng R–T và dung sai. Xin định mức xả liên tục, xung 4 A trong bao lâu và ở nhiệt độ nào, thời gian nghỉ giữa xung, ngưỡng bảo vệ và điều kiện phục hồi, profile sạc 8,4 V, kích thước pack và bản vẽ đầu ghép có đánh số khoang/cực tính.
