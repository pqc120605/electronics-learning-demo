# Tay cầm MoBot EVT0 · Rà soát đầu vào B1

Ngày 11/11/2026 · Rà soát trên giấy của Codex HQ. Box 08 chưa review một cấu hình r13. Phép đo trên mẫu `NOT_RUN`.

Đầu vào là [chỉ dẫn EVT0](claude-support/2026-11-11-evt0-reset/codex-b1-instructions.md), SHA-256 `4ab633b7ea0c150dd4b86031d087101e766d7f0581154fb6ce382dbf3a469d6e`. Phần 1 của tài liệu dành cho quyết định Founder. Các đề xuất trong phần 2–5 là đầu vào để kiểm kỹ thuật.

## Phương án đề xuất để Founder xác nhận

- Giữ tay cầm không dây, 3 AA tháo rời, ESP32 USB-C 30 chân họ CH340 và robot là hồ sơ riêng. B01 chỉ nhận nguồn qua cổng USB-C. VIN và EN để hở. 3V3 chỉ cấp joystick thụ động và điện trở kéo. Khi nạp chương trình, rút cáp nguồn pin để dùng cáp máy tính.
- Sửa phần 2.3 của chỉ dẫn. Nguồn trên carrier chỉ bật VBUS sau khi CC phát hiện Rd hợp lệ, ngắt khi rút và phải xử lý được VBUS có sẵn từ bên ngoài. Dùng đường công suất có cận chống cấp ngược cả khi carrier bật và tắt. IC nguồn Type-C như TPS25810 là tham chiếu chức năng phát hiện và đóng cắt, còn độ phù hợp với cáp liền dây, dòng quảng bá, chế độ mất nguồn và bảo vệ VBUS phải được chứng minh trước khi chốt linh kiện. [TI TPS25810 Rev. C](https://www.ti.com/lit/ds/symlink/tps25810.pdf)
- Giữ giới hạn tải 3V3 ≤ 20 mA. Với phạm vi toàn thụ động, không triển khai cổng I²C cho phụ kiện ngoài trong EVT0. Hồ sơ có thể giữ pad thử không lắp và chỉ kiểm theo quy tắc N4.
- Giữ C1–C12 làm khung review. Bổ sung bằng chứng attach/detach và cắm nhầm nguồn trong C3/C5/C7, ngân sách dòng và bảo vệ trong C8, ngưỡng toàn dải và phục hồi dưới tải trong C9. C12 phải nêu giới hạn của số TYP. Cận bắt buộc chưa có bằng chứng tiếp tục là đầu vào cần đóng. Chỉ chuyển phép đo sang D10 nếu thuộc phạm vi Founder đã duyệt.

## Phản biện kỹ thuật

| Điểm kiểm | Kết quả rà soát và bằng chứng còn cần |
|---|---|
| C1, C2, C10, C11 · Giao diện B01 | Giới hạn đường nguồn vào B01 qua USB-C loại bỏ việc carrier dựa vào diode VBUS–VIN. Cần bảng net, tải lớn nhất từ dung sai biến trở và pull-up, và đối chiếu chân dự kiến với định danh bo. Các đặc tính clone chưa đo ghi `TBD`. |
| C3, C5, C7 · USB-C | Rp 56 kΩ không thực hiện phát hiện attach hoặc ngắt VBUS khi detach. Bảng 4-11 của USB-IF mô tả nguồn giữ VBUS tắt khi chưa thấy sink. Quy tắc 56 kΩ nối vào VBUS ở §3.5.2 là cho cáp USB-A sang USB-C. Một cổng trên B01 ngăn cắm đồng thời hai cáp vào B01, còn đầu cáp carrier vẫn có thể cắm vào một cổng cấp điện khác. [USB-IF Type-C Release 2.0, §3.5.2 và bảng 4-11](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf) |
| C3, C7 · Hai chiều dòng | TI mô tả LM66100 với CE nối VOUT sẽ tắt khi VOUT cao hơn VIN đến ngưỡng và mở lại khi VOUT thấp hơn VIN đủ mức. Nếu rail boost cao hơn nguồn bên ngoài đang giữ 5 V, diode lý tưởng vẫn có thể dẫn theo chiều thuận. Cần kiểm cắm nhầm khi switch ON/OFF, pack vắng, lỗi đơn của công tắc công suất và đường vòng. Khi OFF, đánh giá riêng năng lượng tụ còn lại, đường do carrier cấp và VBUS do bên ngoài áp vào. [TI LM66100 Rev. A, §8.3.2](https://www.ti.com/lit/ds/symlink/lm66100.pdf) |
| C4, C6 · Các khối dự kiến loại bỏ | Xác minh bằng BOM và bảng net sau khi Founder chốt thay đổi. Việc bỏ sạc trong máy và actuator không tự chứng minh các ca cấp ngược hoặc mất nguồn. |
| C8, C12 · Dòng và sụt áp | 5,1 V ±3% cho 4,947–5,253 V. Tại 0,5 A, để còn 4,75 V ở đầu cáp, tổng sụt sau boost tối đa 197 mV, tương đương 0,394 Ω nếu quy về điện trở. Từ 5,253 V, 0,6 A, VIN 3,0 V và hiệu suất minh họa 85%, dòng vào khoảng 1,24 A. Nếu detector đo tại pack và cắt ở 3,15 V, với dòng minh họa này đường vào có khoảng 0,12 Ω để giữ VIN ≥ 3,0 V. Đây là ngân sách có điều kiện, chưa là cận cho PTC hay công tắc. Cần cận dòng và nhiệt của toàn đường, dung sai feedback, tải khởi động, ngắn mạch và giới hạn dòng USB quảng bá. TPS61023 có ngắt tải khi shutdown và sai số reference ±2,5% toàn dải nhiệt. [TI TPS61023 Rev. B, trang 1](https://www.ti.com/lit/ds/symlink/tps61023.pdf) |
| C9 · Detector và phục hồi | S-1009 đặt 3,2 V có ±0,5% ở 25 °C và hệ số nhiệt MAX ±350 ppm/°C. Cộng biên bảo thủ từ 25 °C xuống −40 °C cho khoảng 3,111–3,289 V. Cận này không chứng minh cửa sổ 3,15–3,30 V toàn dải. Tìm detector chính xác hơn hoặc supervisor với cầu chia có cận trước khi chốt. Với UVLO theo tổng áp, 1,60 + 1,60 − 0,02 = 3,18 V là phản ví dụ số học cho khả năng nhận ra một cell bị đảo áp ở ngưỡng 3,15 V. Cần đánh giá cell yếu và chu kỳ bật lại khi pack hồi áp lúc không tải rồi sụt dưới ngưỡng lúc có tải. [ABLIC S-1009 Rev. 5.1_03, bảng 8–9](https://www.ablic.com/en/doc/datasheet/voltage_detector/S1009_E.pdf) |
| Cơ khí và giá | Ba khoảng hàng 22,86 / 25,40 / 27,94 mm là giả định tham chiếu. Kích thước, khả năng giữ bo, đường thoát cáp và vùng anten còn `TBD`. Dây nhảy là phương án mẫu thử. Chưa có dự toán cả bộ dưới 1 triệu đồng cho phương án có khối Type-C sửa đổi. |

## Kết quả kiểm tra HQ

| Lệnh từ thư mục dự án | Kết quả |
|---|---|
| `node ../docs/agents/validate.mjs` | Exit 0, 61 task, 143 capability, `errors=[]`, `warnings=[]`. |
| `node ../docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` | Exit 1, `dispatch_eligible: false`, `dispatch needs active task authorization`, `dispatch builder mode missing`. |

Queue ghi B1 `waiting`, trỏ `MOBOT-V2-CONFIG-r11-HANDSET`. Các phụ thuộc gồm interface, preflight-003, P0-08 và bốn task cổng. Validator hiện tin baseline r8, r10, r11. Lượt này chỉ ghi báo cáo. Chưa có r13 để ghim review hoặc duyệt hash.

## Bước cần Founder quyết định

Xác nhận F1–F5 với phần nguồn USB-C và tiêu chí review đã sửa ở trên. F1 chỉ thay các quyết định được liệt kê cho **tay cầm**. F2 giữ 3 AA, UVLO theo pack và tự phục hồi làm hướng phân tích, với hai ca lỗi nêu trên. F3 giữ phạm vi D10 đã duyệt. F4 cho phép lập hồ sơ r13 và đối chiếu quy trình. F5 giữ trần giá cả bộ và cổng chứng nhận trước khi bán. Khi có quyết định này, HQ hoàn tất hồ sơ điện và gửi Box 08 review đúng snapshot. Duyệt SHA-256 và cấp lease schematic là hai bước sau review.
