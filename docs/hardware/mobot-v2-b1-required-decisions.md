# B1 — hai quyết định đầu vào cho hồ sơ đóng cổng

Ngày 09/11/2026. Đây là đề xuất để Founder chọn, chưa áp dụng vào cấu hình r11, chưa duyệt hash/MPN/cổng.

## 1. Phạm vi lỗi MCU và watchdog

Truy nguyên r11 và hợp đồng MCU: yêu cầu gốc là veto độc lập cho reset/panic/watchdog/hang, retained driven GPIO và mất bias. Challenge một dây cùng ca peripheral tiếp tục phát heartbeat hợp lệ được agent bổ sung từ P007, rồi nằm trong hướng khảo sát P008. Founder mới duyệt khảo sát, chưa chọn yêu cầu sản phẩm bắt buộc challenge.

**Nhánh W đề nghị chọn:** window watchdog phần cứng, chỉ feed bằng software task sau khi kiểm tra tiến trình giám sát; cấm PWM/DMA/peripheral tự feed. Phần cứng phát hiện missing/early pulse, stuck HIGH/LOW; fault latch giữ OFF và bắt buộc LOW-qualified→fresh edge trước RUN lại. Safety không phụ thuộc MCU gửi lệnh OFF.

W **không bảo đảm** phát hiện CPU/task treo nếu một peripheral vẫn tạo chuỗi WDI hợp lệ; cũng không chứng minh phần mềm tùy ý vẫn cố feed đúng là hoạt động đúng. Đây là phạm vi phải ghi rõ và review, không được gọi là challenge-response.

**Nhánh C:** giữ ca peripheral còn phát chuỗi hợp lệ là lỗi bắt buộc phải phát hiện; tiếp tục challenge/state monitor. Một dây và tài nguyên phần cứng hiện chưa chứng minh; không được thêm chân hoặc hạ yêu cầu âm thầm.

TPS3430 ứng viên có upper-window MAX12,65ms theo mode đã ghi ở gói P008, nhưng tổng fault→isolation20ms chưa được chứng minh vì còn các tầng khác. Chọn W chỉ chốt phạm vi khảo sát/thiết kế, không tự đóng cổng hoặc duyệt part.

## 2. Envelope cơ khí captive-cassette

Đề xuất acceptance allocations, **không phải dữ liệu đo hay thông số hãng**:

- Giữ lực kéo100N trong envelope sử dụng; proof tĩnh200N cho mỗi đường giữ độc lập.
- Chỉ nhả sau physical OFF và khi người dùng đã thả lực kéo. Jam giữ khóa; không yêu cầu motor mở khi đang chịu100N.
- Motor chỉ di chuyển permission cam, không thay chốt/vỏ chịu tải giữ.
- Hai chốt có đường truyền lực độc lập; một driver/cam kẹt không được mở cả hai trước OFF.

Ứng viên giải tích để kiểm: pin cắt kép2mm chịu200N cần allowable shear≥31,83MPa; lug bearing2mm×2mm cần allowable≥50MPa. Đây là ứng suất yêu cầu, **chưa có vật liệu/vỏ đủ căn cứ để coi đạt**. Allocation travel3mm−tolerance/wear0,5mm−overtravel1mm=1,5mm; không đổi biên này thành thời gian an toàn bằng cách giả định người dùng rút chậm.

Nếu Founder chọn envelope trên, Codex có thể lập hồ sơ giải tích có kích thước và dung sai để review trước CAD; actual clone fit vẫn theo D10. Cần tiếp tục kiểm vật liệu, anchorage, contact sequence và lực/torque/nguồn. Chọn envelope không duyệt số liệu hãng, MPN, CAD hay gate.

## Không thay đổi

Trần pack4,200V, Q3, D10/D17, không I2C expander, không đổi r7, không bỏ E-channel, không solenoid fallback tự động. Quyền mua/cấp điện/flash/chế tạo vẫn riêng. Chỉ Founder được chọn hoặc thay phạm vi chấp nhận.
