# Board 2D, bài học theo board, cộng đồng và Mở Bot

16/11/2026 · lead: Codex · báo cáo tích hợp. Kết quả kiểm chứng cuối nằm ở các report.md/verification.json của bốn task; không lấy tiến độ trong nhật ký này làm trạng thái nghiệm thu.

## Thay đổi

1. **MM-SW-BOARD-2D-003:** tám hình board nhìn thẳng từ trên được render từ CAD cục bộ, bỏ khung board giả. Điểm nối dùng cùng phép chiếu X/Z với hình. Thiếu tọa độ có nguồn thì không vẽ đoán. Alias không dùng không còn che chân đang nối khi bấm vào pad. Hình là tham chiếu CAD, không phải ảnh chụp bo thật của người dùng.
2. **MM-SW-LESSON-TARGET-001:** người mới chọn board trước khi vào bài; không tự chọn ESP32. Board đã chọn được mang theo tới mạch, code và liên kết thực hành. Alias được chuẩn hóa khi mở URL và khôi phục v4/v5, giữ code và circuit. Bản nháp hiện hữu không bị một URL ghi đè. Tổ hợp ADC/bài học chưa xác minh vẫn bị chặn rõ ràng.
3. **MM-SW-COMMUNITY-ATTACH-001:** ảnh/tệp có xem trước, gỡ, tải, tối đa 5 tệp, 10 MiB/tệp và 25 MiB/bài. Metadata cũ được giữ; blob cục bộ lưu IndexedDB và chỉ báo thành công sau commit. Lỗi lưu không xóa nội dung đang soạn. Adapter Supabase, SQL Auth/RLS/private Storage và hướng dẫn thiết lập đã chuẩn bị; chưa áp dụng lên máy chủ.
4. **MM-SW-GUIDE-KB-002:** 147 mục catalog + 18 FAQ, tổng hợp từ board, linh kiện, registry workspace, bài học và công cụ hiện hành. Câu trả lời giữ revision/nguồn/giới hạn và các lưu ý sẵn có, gồm STBY của TB6612. Board không rõ hoặc câu hỏi ngoài dữ liệu yêu cầu làm rõ. Đây là truy hồi cục bộ, chưa có AI sinh câu trả lời, không gửi câu hỏi ra mạng.

## Ảnh minh chứng

- [Board Uno desktop](../MM-SW-BOARD-2D-003/screenshots/uno-top-1440.png), [mobile](../MM-SW-BOARD-2D-003/screenshots/uno-top-375.png).
- [Chọn board desktop](../MM-SW-LESSON-TARGET-001/chooser-final-1440.png), [mobile](../MM-SW-LESSON-TARGET-001/chooser-final-375.png).
- [Đính kèm desktop](../MM-SW-COMMUNITY-ATTACH-001/attachments-1440.png), [mobile](../MM-SW-COMMUNITY-ATTACH-001/attachments-375.png).
- [Mở Bot desktop](knowledge-1440.png), [mobile](knowledge-375.png).

## Cần founder hỗ trợ

Tạo dự án Supabase và làm theo [gói thiết lập](../../../../docs/software/community-online/README.md). Không gửi mật khẩu, service-role key hoặc OAuth secret vào chat. Chưa có dự án nên kiểm tra Auth thật, Storage thật, signed URL hết hạn, upload đồng thời và quyền giữa hai tài khoản vẫn **NOT_RUN**. Chưa thể công bố tính năng chia sẻ online đã hoạt động.

## Giới hạn còn lại

- Không phải mọi board trong thư viện có ảnh CAD/chân hoặc runtime mô phỏng. Tám ảnh và các tọa độ có nguồn không đồng nghĩa kiểm chứng phần cứng.
- Số lỗ/cách nối ray breadboard vẫn là giả định mô hình 400 tie-point chưa đối chiếu mẫu thật.
- Kho kiến thức hữu hạn; 46 mục linh kiện chưa có nguồn exact-product, 7 board chưa có simulation target. Không suy ra thông số, package hay pinout từ nguồn chip chung.
- LocalStorage/IndexedDB có thể bị trình duyệt xóa hoặc từ chối. Nháp chữ cộng đồng có lưu riêng; tệp đang chọn trước khi đăng chỉ ở bộ nhớ và phải chọn lại sau reload. Chưa có sao lưu/sync tự động.
- Không thêm dependency, không gọi Claude, không deploy, không flash/cấp điện hay sửa hồ sơ hardware. Build nội bộ không phải giấy phép phân phối ngspice.

## Nhật ký kiểm chứng

Lượt quét đầu phát hiện lỗi thiếu STBY, hit target alias GPIO18, link thực hành mất board, cùng một số fixture còn dựa vào board mặc định/editor cũ. Các sửa đổi và kiểm tra lại được lưu riêng; không dùng kết quả quét cũ làm bằng chứng cho source đã thay đổi. Toàn bộ Node sau sửa đạt 680/680; 52 ca Node liên quan link/board được chạy lại sau sửa liên kết cuối. Kết quả cuối và giới hạn kiểm chứng ghi bên dưới.


Kết quả cuối: typecheck0; Node680/680 và52ca liên quan0; build:local0; production-preview e2e191/194 exit1 ở lượt toàn bộ; sau sửa fixture/selector,10/10 ở hai file liên quan exit0 trên cùng bundle (cổng5311/config kế thừa). Không tuyên bố một lượt194/194. Bốn snapshot khớp hash và QA độc lập PASS. Backend thật vẫn NOT_RUN. Chi tiết từng task ở report.md/verification.json.

Queue được kiểm bằng `node ../docs/agents/validate.mjs`: exit0,75task,errors=[],warnings=[] (`.tmp/depth-queue-validation.txt`). Bốn task triển khai cục bộ/gói chuẩn bị được đóng theo phạm vi; `MM-SW-COMMUNITY-LIVE-001` WAITING cho founder tạo/kết nối Supabase và kiểm tra cloud thật. Preview đã khởi động nền cổng5320, HTTP200 tại `/build/freestyle`; PID/log nằm trong `.tmp/preview-5320-final.*`.
