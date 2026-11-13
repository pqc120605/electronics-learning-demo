# MoBot V2 · Packet QA tay cầm PS3-style AA V1

MM-HW-MOBOT-IF-001. Hợp nhất phạm vi Box 01, điện Box 02 và bố trí Box 03. [Đầu vào pre-KiCad](mobot-v2-handset-ps3-aa-pre-kicad-v1.md), SHA-256 `C498A447CB1401E7D16BFB502C488AA9681D746D60851B81DFF09E2EEA5D3630`.

## Phạm vi đề xuất review

- Tay cầm không dây, hai cần vật lý. V1 đọc LY tiến/lùi và RX đổi hướng, nút Giữ để chạy và Dừng. Ngân sách 2 ADC1 + 2 ngõ số. Hai trục còn lại và L3/R3 ngoài V1.
- WRL-20168 USB-only. 3 AA NiMH trong cassette MPD BA3AAW là cơ sở. TPS63070 và TPS25810 là ứng viên nguồn RUN. Chỉ mở 4 AA nếu 3 AA NiMH hụt tiêu chí hoặc có quyết định đưa R6P thành bắt buộc. LR6 và Con Thỏ R6P đánh giá riêng. Không có đường sạc khay.
- Cửa PROGRAM chỉ mở sau khi cassette tách điện. Rút cáp RUN nội bộ rồi cắm PC cùng cổng B01. Cửa mở hoặc phích PC còn cắm phải chặn cassette trước tiếp điểm. I/O và JOY_VCC mặc định tắt khi carrier mất nguồn. Kiểm cấp ngược VBUS/I/O/sense và GND_FUNC hở khi USB vẫn nối.
- RKJXV1220001 là ứng viên cơ khí/điện. Trang hãng ghi **Standard** ở đầu trang sản phẩm. Mục **Discontinued** phía dưới là chú giải chung các trạng thái, không xác lập tình trạng mã này. Vẫn cần xác minh nguồn cung thực tế. [Alps Alpine](https://tech.alpsalpine.com/e/products/detail/RKJXV1220001/) · [MPD BA3AAW](https://www.batteryholders.com/uploads/parts/BA3AAW/datasheets/BA3AAW-datasheet.pdf).

## Delta hợp đồng robot và nghiệm thu

- Chưa tìm thấy hợp đồng robot có version. Box 02 đề xuất frame gồm version, phiên, thứ tự, LY/RX, giữ để chạy và dừng. Chỉ gói đúng peer, phiên, version, thứ tự và độ tươi mới duy trì quyền. Cần chốt cách mã hóa, nhịp gửi và cách loại gói đến muộn dù đúng thứ tự.
- Dừng ưu tiên, nhả nút giữ thu hồi quyền. Sau timeout, Dừng hoặc reset, trở về trung tính và thao tác cho phép mới. PROGRAM không cấp quyền chạy. Đề xuất tối đa 250 ms tới trạng thái đầu ra motor dừng sau lệnh hợp lệ mới cuối cùng. Brake/coast/disable và quãng đường dừng cần review riêng phía robot.
- Mục tiêu đề xuất tối thiểu 2 giờ với 3 AA NiMH. Trước KiCad lấy cận tải, sụt áp, ADC, biên liên động và cấp ngược nếu chúng quyết định linh kiện hoặc hình học. Thử timeout đầu ra robot và quãng đường dừng trên bench tích hợp. Các phép đo chưa chạy.

Box 08 trả verdict theo gate, rà 250 ms/2 giờ, tách yêu cầu đầu vào khỏi bench và xác định đủ hay thiếu để lập cấu hình triển khai. HQ trình hash cấu hình và chạy preflight trước lease.
