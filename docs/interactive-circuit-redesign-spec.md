# SUPERSEDED — board viewer direction

The CSS-built circuit model described here was superseded by the founder-approved KiCad PCB/GLB viewer design at [`docs/superpowers/specs/2026-10-29-esp32-real-pcb-viewer-design.md`](../../docs/superpowers/specs/2026-10-29-esp32-real-pcb-viewer-design.md). Retain this file only for the accepted visual, lesson, and responsive guidance that does not conflict with the newer spec.

# Đặc tả thiết kế: Mạch 3D tương tác và giao diện Mạch Mở

**Trạng thái:** Bị thay thế ở phần mô hình mạch; giữ lại tham khảo cho giao diện và bài học  
**Phạm vi:** Demo web `electronics-learning-demo`  
**Tham chiếu hình ảnh:** Screenshot trang Phan Quốc Chiến do founder cung cấp trong hội thoại.

## 1. Tóm tắt

Chuyển bài học hiện tại từ sơ đồ mạch SVG phẳng sang một mô hình 3D có thể quan sát và tương tác. Người học có thể xoay/thu phóng mạch, chọn linh kiện, đọc phần giải thích tương ứng và đi theo các bước lắp mạch. Đồng thời làm mới toàn bộ giao diện theo phong cách kỹ thuật, trưởng thành và tiết chế: nền xanh đen, lưới kỹ thuật mờ, chữ sáng, điểm nhấn cyan và thông tin phụ màu xanh xám.

Demo đầu tiên dùng mạch ESP32 DevKit, breadboard, điện trở, LED và dây jumper. Đây là mô hình 3D minh họa đúng bố cục kết nối cơ bản, chưa phải bản CAD chính xác theo kích thước nhà sản xuất và chưa mô phỏng dòng điện/điện áp.

## 2. Vấn đề và người dùng

Người mới học điện tử thường nhìn một mạch nhưng chưa biết linh kiện nào đang làm gì, chân nào nối với chân nào, và tín hiệu đi qua mạch ra sao. Sơ đồ 2D hiện tại có thể chỉ rõ kết nối nhưng chưa tạo cảm giác đang khám phá chính mạch thật.

Người dùng mục tiêu của demo là học sinh mới tiếp cận Arduino/ESP32 và phụ huynh/giáo viên muốn xem cách bài học giải thích khái niệm. Họ cần giao diện rõ ràng, dễ thao tác, không đòi hỏi kiến thức trước.

## 3. Mục tiêu

1. Cho người học nhận ra được từng bộ phận trên một mạch nhập môn.
2. Giải thích ngắn gọn linh kiện làm gì, kết nối thế nào và vì sao cần nó.
3. Cho phép khám phá mạch bằng thao tác trực quan thay vì chỉ đọc sơ đồ.
4. Hướng dẫn người học theo trình tự từ nhận diện linh kiện đến hoàn thành mạch.
5. Thay phong cách nhiều màu/thiếu chín chắn bằng một hệ thống thị giác hiện đại, nhất quán với ảnh tham chiếu.
6. Giữ nguyên khả năng truy cập bài học, trang khám phá và khu quản trị hiện có.

## 4. Ngoài phạm vi

- Mô phỏng điện tử chính xác, kiểm tra định luật Kirchhoff hay đo điện áp/dòng điện.
- Mô hình CAD có kích thước sản xuất, số hiệu chân/footprint đã kiểm định với từng nhà cung cấp.
- Trình biên dịch hoặc giả lập firmware trong trình duyệt.
- Tài khoản học viên, lưu tiến độ học hay nội dung khóa học trả phí.
- Thiết kế lại chức năng phân quyền và thống kê admin.

Các giới hạn này cần được ghi rõ trong giao diện hoặc nội dung bài học để không khiến người xem hiểu mô hình minh họa là công cụ mô phỏng phần cứng.

## 5. Luồng người dùng chính

1. Từ trang khám phá, người học mở bài “Điều khiển LED với ESP32”.
2. Màn hình bài học hiển thị khu vực mạch 3D nổi bật và bảng giải thích bên cạnh.
3. Người học xoay/thu phóng để xem bố cục, hoặc chọn một linh kiện bằng chuột/touch.
4. Inspector cập nhật tên, hình minh họa/ký hiệu, vai trò, chân liên quan, cách nhận biết và một giải thích dễ hiểu.
5. Người học chuyển bước; linh kiện và đường dây liên quan được nhấn sáng để chỉ rõ phần cần quan sát.
6. Khi hoàn tất, người học thấy tóm tắt luồng hoạt động: GPIO xuất mức cao → dòng qua điện trở và LED → về GND.

## 6. Mô hình 3D và tương tác

### 6.1 Thành phần mô hình

- ESP32 DevKit dạng board minh họa, có USB, module, hàng chân và nhãn một số chân liên quan.
- Breadboard có rãnh giữa, lỗ cắm và hai rail nguồn.
- LED đỏ phân biệt chân anode/cathode.
- Điện trở hạn dòng.
- Dây jumper cho GPIO 23 và GND.

### 6.2 Tương tác bắt buộc

- Chọn ESP32, breadboard, LED, điện trở, dây tín hiệu và GND bằng click/tap.
- Nêu rõ linh kiện đang chọn bằng outline/glow cyan nhẹ và trạng thái tương ứng trong inspector.
- Xoay phương vị, thay đổi góc nhìn, zoom và đưa mô hình về góc nhìn ban đầu bằng các nút điều khiển.
- Bước học có thể chọn từ danh sách; khi đổi bước, phần mạch liên quan được làm nổi bật.
- Chuyển động phải có kiểm soát và tôn trọng `prefers-reduced-motion`.
- Có nhãn/giải thích bằng DOM và danh sách nút để hỗ trợ keyboard, screen reader và trình duyệt hạn chế CSS 3D.

### 6.3 Mức chính xác

Mô hình là hình minh họa 3D tương tác dựng bằng CSS 3D và HTML, không tuyên bố là mô hình CAD hay trình giả lập. Chỉ mô tả những kết nối đã được kiểm tra logic cho bài LED cơ bản. Hướng dẫn phải nhắc ngắt nguồn USB trước khi thay dây.

## 7. Cấu trúc bài học

- **Thanh tiêu đề:** tên bài, độ khó nhập môn, thời lượng ước tính, đường quay lại.
- **Khu vực mạch:** mô hình chiếm trọng tâm; thanh công cụ đổi góc nhìn và chú giải trạng thái.
- **Inspector:** tên linh kiện, vai trò, các chân liên quan, cách hoạt động, một câu “hãy nhớ”.
- **Danh sách linh kiện:** có thể chọn linh kiện từ danh sách thay vì bắt buộc click chính xác trên mô hình.
- **Thanh tiến trình bài học:** 1) Nhận diện linh kiện; 2) Nối GPIO; 3) Nối LED và điện trở; 4) Hoàn tất đường về GND; 5) Hiểu luồng hoạt động.
- **Điều hướng bước:** trước/sau, trạng thái bước, phần giải thích và lựa chọn “xem lại mạch đầy đủ”.

Nội dung hiện có về GPIO, GND, điện trở, LED và breadboard được giữ lại, nhưng biên tập lại theo inspector/bước để tránh lặp văn bản dài.

## 8. Hướng nghệ thuật

Ảnh tham chiếu được dùng làm chỉ dẫn phong cách, không sao chép nguyên bố cục portfolio cá nhân.

- Nền chính xanh đen/navy gần `#071116`; bề mặt panel xanh than như `#0D1A20`.
- Chữ chính trắng xanh nhạt; chữ phụ xanh xám có độ tương phản đủ đọc.
- Cyan/turquoise gần `#2DD4C5` cho CTA, focus, đường tín hiệu và trạng thái chọn.
- Màu vàng cam dùng rất tiết chế cho cảnh báo an toàn hoặc điểm nhấn phụ.
- Lưới kỹ thuật mờ; đường viền mảnh; bóng nhẹ; card vuông vức, bo góc vừa phải.
- Heading lớn, chắc; nhãn trạng thái/số chân có thể dùng monospace.
- Tránh gradient rực, sticker, icon trang trí kiểu đồ chơi, nhiều màu cạnh tranh và bo tròn quá mức.
- CTA chính rõ ràng; tránh dùng cyan cho mọi thành phần cùng lúc.

## 9. Bố cục đáp ứng

- Desktop: model 3D khoảng 60–65% bề ngang vùng bài học, inspector 35–40%; danh sách bước phía dưới hoặc cạnh inspector tùy chiều cao.
- Tablet: model trên, inspector và bước bên dưới; bảo toàn điều khiển touch.
- Mobile: canvas có chiều cao hữu dụng và thao tác chọn linh kiện dễ chạm; inspector dạng panel phía dưới; không đặt điều khiển lên các điểm tương tác chính.

## 10. Trang khám phá và phần dùng chung

Đồng bộ trang khám phá với theme mới: header tối giản, hero có thông điệp về học từ mạch thật, khu vực bài học/board dễ quét, CTA cyan. Giữ các đường dẫn và trạng thái “sắp có” hiện hữu. Khu vực admin/login cũng đổi token màu để không bị lệch phong cách, nhưng không thay đổi chức năng.

## 11. Tiêu chí nghiệm thu thiết kế

- Người mới nhìn ra đâu là board, breadboard, LED, điện trở và dây nối.
- Chọn được từng loại linh kiện bằng click/tap hoặc từ danh sách; nội dung inspector thay đổi tương ứng.
- Có thao tác đổi góc nhìn và nút khôi phục mô hình về góc ban đầu.
- Chọn bước học làm nổi bật các phần tử liên quan và cập nhật nội dung hướng dẫn.
- Khi hiệu ứng CSS 3D không khả dụng, bài học vẫn có danh sách linh kiện/nội dung và mô hình DOM có thể chọn.
- Toàn bộ demo dùng màu, typography, button, panel và trạng thái nhất quán; responsive ở desktop và mobile.
- Luồng home → bài học → quay lại vẫn hoạt động; các route admin không bị ảnh hưởng.
- Giao diện phân biệt rõ “minh họa 3D” với “mô phỏng điện tử”.

## 12. Rủi ro và cách xử lý

| Rủi ro | Xử lý trong demo |
|---|---|
| Hiệu ứng CSS 3D không được trình duyệt hỗ trợ đầy đủ | Giữ mô hình và danh sách linh kiện trong DOM; nội dung giải thích vẫn dùng được |
| Người mới không biết click đâu | Chú giải tương tác, danh sách linh kiện, trạng thái hover/focus rõ |
| 3D gây khó hiểu kết nối | Bổ sung màu dây nhất quán, nhãn GPIO/GND và hướng dẫn theo bước |
| Mô hình bị hiểu nhầm là mạch thật hoặc CAD chuẩn | Gắn nhãn minh họa, nêu giới hạn ngay trong bài |
| Theme tối làm chữ khó đọc | Kiểm soát tương phản, cỡ chữ, focus-visible và reduced motion |

## 13. Nguyên tắc kỹ thuật cho bước triển khai

- Dùng CSS 3D/HTML cho demo đầu để tránh phụ thuộc thêm thư viện hay tệp model. Có thể thay renderer ở giai đoạn CAD/3D sau này mà không đổi dữ liệu bài học.
- Tách dữ liệu linh kiện (tên, vai trò, chân, nội dung, điểm neo) khỏi renderer để sau này thêm kit/board.
- Dùng cùng một selection state cho mesh 3D, danh sách linh kiện và inspector.
- Không để bài học phụ thuộc riêng vào thao tác chuột; mọi hành động quan trọng có điều khiển DOM tương đương.
- Giữ các route/analytics/auth admin hiện tại nguyên trạng về hành vi.

## 14. Các giả định cần xác nhận

1. Mạch mở đầu là ESP32 DevKit + breadboard + LED + điện trở + jumper, dùng GPIO 23.
2. Bản đầu là minh họa 3D tương tác bằng CSS, không phải CAD chính xác hoặc mô phỏng điện.
3. Demo tiếp tục giữ route, nội dung và khu admin đang có; công việc tập trung vào trải nghiệm học và hình ảnh.
4. Theme tối navy/cyan áp dụng toàn bộ demo, dựa trên screenshot tham chiếu.

