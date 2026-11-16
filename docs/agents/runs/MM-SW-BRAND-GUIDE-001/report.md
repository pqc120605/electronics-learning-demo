# Logo và Mở — trợ lý hướng dẫn cục bộ V1

Ngày: 15/11/2026. Đã hoàn tất phạm vi V1 được duyệt. QA độc lập PASS; source và hai ảnh gốc được ghim SHA-256. Trạng thái chuẩn ở queue.

## Đã triển khai trong phạm vi founder duyệt

- Dùng nguyên PNG logo và mascot ở `assets/brand/concepts/2026-11-15/`; hai hash nguồn khớp snapshot trước, không chỉnh ảnh gốc. Logo public dùng wordmark, workspace/footer dùng phần biểu tượng cùng chữ có thể đọc bằng trình đọc màn hình.
- Dựng model GLB web thực gồm 53 phần, khoảng 1,01 MB, từ concept mascot. Đầu, mắt, tay chào, thân và đạo cụ tách riêng; có pose chào/chỉ dẫn/suy nghĩ/động viên/cần chú ý, xoay bằng chuột hoặc nút. Đây là mô hình minh họa, không phải CAD/thiết kế mạch.
- Mở bằng **Trợ giúp → Hỏi Mở**. Nút nổi có trên bề mặt phù hợp, được ẩn ở workspace tập trung và khi tour mở để tránh che điều khiển. Panel không modal trên desktop, cho phép tiếp tục tương tác với mạch; có nút thu gọn và Escape.
- Ba phần **Hướng dẫn / Hỏi đáp / Đang làm**. Hướng dẫn nối lại tour đang có. Hỏi đáp tìm trong 18 mục kiến thức được biên tập cục bộ, hỗ trợ tiếng Việt không dấu và liên kết đọc/thực hành. Đây là tìm kiếm nội dung, chưa phải AI sinh câu trả lời.
- Ngữ cảnh chỉ chứa metadata cho phép: tên bài, board, linh kiện/chân trong mô hình và thông báo/bước tiếp theo do trang cung cấp. Không gửi code, tệp, Serial hoặc danh tính. Không phân tích điện tùy ý, không tự sửa hay chạy mạch.
- Câu ngoài kho được báo chưa có nội dung và gợi ý bổ sung dữ kiện. Điện trở không bị tự điền 220 Ω khi ngữ cảnh chưa có trị số. Trace bài học, firmware, SPICE và quan sát thực được phân biệt trong giải thích.
- Tắt chuyển động, theo `prefers-reduced-motion`, ẩn nút và mở lại từ Trợ giúp. Khi WebGL/model không dùng được, hiển thị ảnh mascot gốc và vẫn dùng hướng dẫn/FAQ.

## Dữ liệu và tài nguyên

Câu hỏi chỉ nằm trong state của panel, bị bỏ khi đóng hoặc đổi route; không ghi vào storage hay gửi lên mạng. Hai preference riêng `mm-guide-hidden` và `mm-guide-still` lưu ở trình duyệt nếu có thể; lỗi storage không chặn dùng trong phiên. Dữ liệu workspace/progress/tour không bị các preference này ghi đè.

GLB và renderer được tải khi mở panel. Đóng panel sẽ hủy fetch/timer/RAF/observer và giải phóng buffer/shader/program; giảm chuyển động hoặc tab bị ẩn không chạy hoạt ảnh. Hạ tầng không thêm package hoặc dịch vụ mới. Model có nguồn và hash ở `public/brand/mo-mascot-v1.source.json`.

## Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Unit kiến thức/model | 5/5, exit 0; RED → GREEN đã ghi log |
| Typecheck | exit 0 trên snapshot cuối |
| Build local | exit 0 trên snapshot cuối |
| Browser tập trung | 6/6, exit 0; 375/1440, theme tối, axe, draft nguyên byte, context, tour, fallback, reduced motion, ẩn/mở lại |
| Unit toàn bộ | 630/630, exit 0, không skip; kiểm lại 9/9 ca theo phạm vi sau sửa cuối |
| Browser hồi quy toàn bộ | **144/144, exit 0**; 134 ca cũ và 10 ca mascot/tour mới |
| QA độc lập | PASS sau sửa hai P2 và xác nhận các delta cuối |
| Ca hồi quy QA cuối | 3/3, exit 0: tên nút, link ADC, board tham chiếu |
| Tour mobile/desktop và opacity | 3/3, exit 0; chữ giữ opacity 1 ngay trong entrance |
| Queue validator | exit 0, errors=[], warnings=[] |
| Diff/source hash | diff --check exit 0; 27/27 hash khớp; ảnh gốc nguyên vẹn |

Rà ảnh phát hiện mắt và chữ M bị lớp vỏ 3D che: thêm kiểm tra mặt trước, sửa bán kính bo góc không vượt nửa bề dày, sinh lại model và kiểm GREEN. Browser tìm thấy tab đang chọn thiếu tương phản: sửa token màu chữ, không nới assertion axe. Một selector trong ca tour mới đã được sửa sang accessible role/name của tour đang có; không sửa assertion của các test cũ.

QA chỉ ra link ADC sai mã bài và ngữ cảnh board fallback bị gọi là board đang chọn: đã sửa link, giữ warning và phân biệt nhãn tham chiếu. Hồi quy phát hiện tên truy cập của nút nổi chưa khớp chữ hiện: chuyển sang tên tự nhiên từ nội dung nút. Tour có chữ fade opacity trong những frame đầu: giữ nguyên các assertion cũ, đổi ba animation sang dịch chuyển và kiểm tra trực tiếp độ rõ của chữ qua bốn frame.

Có một lượt toàn bộ dừng ở ca Pico chờ LED tắt. Chạy riêng cùng source/test đã đạt 1/1; ca Pico trong lượt toàn bộ tiếp theo cũng đạt. Không sửa runtime hoặc assertion của ca này và chưa xác định nguyên nhân không ổn định. Log thất bại và kiểm tra lại được giữ riêng; lượt cuối hoàn tất 144/144, exit 0, không retry/skip.

Unit toàn bộ chạy trước các sửa nhỏ cuối về link/nhãn ngữ cảnh, accessible name và animation tour. Chín ca unit theo phạm vi đã chạy lại; build và toàn bộ 144 e2e được chạy trên snapshot cuối. Không dùng kết quả của các lượt browser dừng giữa chừng làm PASS.

Báo cáo QA: [review.md](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/review.md). [File và hash](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/changed-files.md) · [Lệnh, kết quả và log ghim](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/verification.json).

## Ảnh từ trình duyệt

Chụp bổ sung trên preview localhost cuối: ảnh nguồn đã tải/giải mã đầy đủ; xoay mascot bằng bàn phím làm thay đổi pixel canvas; không có lỗi JavaScript trong phiên chụp. Ghi tại `capture.json`.

![Logo từ đúng artwork được duyệt](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/logo-web.png)

![Model mascot 3D đang chạy trên web](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/mascot-3d.png)

![Câu trả lời LED trên mobile](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/known-answer-375.png)

![Mở trên mobile](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/guide-375.png)

![Mở và mạch trên desktop](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/guide-1440.png)

![Mở trong giao diện tối](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-BRAND-GUIDE-001/images/guide-dark.png)

## Giới hạn

- Chưa kết nối AI; nội dung ngoài kho chưa được trả lời tự do. Kiến thức cục bộ không xác nhận mạch thật an toàn.
- Chưa chạy thử trên thiết bị mobile thật, NVDA, Firefox/Safari hoặc đo Lighthouse. Chromium headless được dùng cho các ca browser đã ghi.
- Nội dung/ảnh/model cần được tải hoặc có trong cache để dùng khi offline; không cam kết cold-start offline của mọi tài nguyên.
- Chưa commit, push hay deploy; hardware ngoài phạm vi task.
