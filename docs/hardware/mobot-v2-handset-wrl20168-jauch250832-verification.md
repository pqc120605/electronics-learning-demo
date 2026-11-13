# MoBot V2 tay cầm · Kết luận xác minh WRL-20168 và Jauch 250832

MM-HW-MOBOT-IF-001. Box 08, kết luận `changes_requested` trước KiCad. Đối chiếu SHA-256 của [packet delta](mobot-v2-handset-wrl20168-jauch250832-review.md) khớp `3772B6C759A19E3461549BA4A41E90F327B88D807C240E259BD1F1D1BD4DAE57`.

| Hạng mục | Kết luận | Bằng chứng tối thiểu còn cần |
|---|---|---|
| B01 USB-only và hình học | Khóa WRL-20168 cấp qua USB-C, bỏ trống cổng pin onboard, dùng hình học hãng. | Khóa revision và cận tải/sụt áp, giao diện ADC, rail sense và GND_FUNC. [SparkFun](https://docs.sparkfun.com/SparkFun_Thing_Plus_ESP32_WROOM_C/hardware_overview/). |
| Dòng H3 | Đạt sàng lọc dòng: cận thiết kế 0,358–0,446 A dưới mức tối đa 2,50 A của pack. | Dòng phù hợp chỉ đóng một phần của profile. [Jauch Rev. 1.2](https://www.jauch.com/downloadfile/6656e149c4d6d000bf9f0721ac1f1df59/250832.pdf). |
| CV, kết thúc, timer, THERM | Chưa đóng. Hãng công bố 4,2 V và 0–45 °C, chưa tìm được cận CV, giới hạn kết thúc và timer, hay đường R–T/dung sai NTC phù hợp đúng pack. | Cần giới hạn hãng và tính qua dung sai, lượng nạp từ UVLO, CC/CV và giảm dòng do nhiệt. Đo hành vi mạch không thay giới hạn của pack. |
| Đầu pin | XH 3 cực là giao diện ứng viên. Chưa xác minh thứ tự BAT+, BAT−, NTC. | Bản vẽ đúng revision có số khoang và hướng nhìn, hoặc xác minh trên đúng pack kèm ảnh mặt ghép. |
| Cáp RUN, gá, I/O | Chưa xác minh trên cụm thật. | Ghi đồng bộ CC/VBUS và thời điểm I/O cách ly. Thử từng tiếp điểm khi giữ kênh kia đóng và xác nhận nhả đủ sớm, cùng ca hở GND khi USB còn nối. |

Preflight `node ../docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` trả `dispatch_eligible: false`. Task chưa có ủy quyền đang hoạt động và chưa ở chế độ builder. Bench chưa chạy. Phê duyệt cặp linh kiện đã ghi, cấu hình triển khai còn chờ đóng các mục trên và duyệt đúng hash.
