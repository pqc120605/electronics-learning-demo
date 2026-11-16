# Bàn freestyle: bàn trống, board đúng và không gian làm việc rộng

Ngày 16/11/2026 · Task MM-SW-FREESTYLE-UX-002 · Đã hoàn tất phạm vi; QA nguồn và hồi quy cuối PASS.

## Đã thay đổi

- Trang mở đầu và phòng freestyle mới không tự chọn board, breadboard, linh kiện, dây hay code. Nháp cũ được mời mở lại; mở toàn màn hình từ bàn trống vẫn trống.
- Tám board có ảnh nhìn từ trên render từ đúng GLB đang được quản lý trong dự án. Nhãn chân 2D, schematic và đầu dây 3D dùng pinMap đang chọn, giữ nguyên partId/pinId. Pico dùng đúng 3V3(OUT)/VBUS.
- Có view Lắp mạch 2D, Schematic, Lắp mạch 3D và Dạng sóng. 2D có thu phóng; 3D tải lười, xoay/zoom, nhìn từ trên, chọn linh kiện và giải phóng scene khi đổi board/view.
- Dạng sóng lấy mẫu từ runtime đang chạy, tối đa 512 mẫu/8 kênh. Ưu tiên GPIO đang nối và cho chọn kênh; không dựng xung PWM giả. Dừng/hoàn tất/lỗi đều đẩy dữ liệu cuối ra Serial và waveform. Đổi mạch/code/board làm mất hiệu lực kết quả cũ; compile cũ không được khởi động lại mạch mới.
- Vùng mạch rộng hơn, bảng công cụ/kết quả dùng chung một rail có thể đóng; có mở rộng khung và quản lý focus. Mobile chuyển giữa bảng thao tác và vùng mạch, giữ nút ảo/slider cạnh mạch hoặc waveform trong lúc chạy; không nhân đôi control. Nhả nút khi mất focus, pointer cancel hoặc đổi view. Bài học bỏ cột thông tin lồng quá hẹp, giữ vùng mạch trước phần chi tiết; các tab vẫn giữ lựa chọn. Picker không compact giữ DOM cũ để bảo toàn vùng thao tác dây của bài học.
- Bản nháp có giao diện khôi phục và tải file gốc. Trước mỗi lần thay mạch, nháp hiện tại được sao lưu; không thay mạch nếu sao lưu thất bại. Có tải trực tiếp mạch đang mở ngay cả khi localStorage bị chặn/đầy. Mở toàn màn hình khi chỉ lưu trong phiên dùng khung tại chỗ để giữ dữ liệu.

## Dữ liệu và phạm vi

Giữ version 1 của freestyle workspace và CircuitDocV2 schema 2; không thêm dependency. File cũ vẫn đọc, mã tự viết và endpoint identity được giữ. Bản sao trước thay mạch dùng các khóa machmo-freestyle-v1:previous:*; không xóa chúng. Lưu cục bộ phụ thuộc trình duyệt/origin, không phải sao lưu lên máy chủ; xóa dữ liệu trình duyệt sẽ mất nháp.

Không sửa cấu hình hardware, CAD/KiCad, không mua/cấp điện/flash, không gọi Claude hay publish/deploy. Các PNG mới là render từ model tham chiếu hiện có; không phải thiết kế hoặc số đo phần cứng mới.

## Nguồn và giới hạn còn áp dụng

- Nguồn ảnh/model, revision, license statement và SHA-256: board-render-sources.json; bản ghi công được phân phối ở public/board-reference/freestyle/NOTICE.md.
- Điểm nối trên ảnh board 2D là trạm logic, không phải footprint vật lý. Hình CAD không đại diện mọi clone/revision ngoài đời.
- STM32 có model tái dựng giáo dục; các anchor board ước lượng không được dùng làm đầu dây 3D chính xác. Dây không có tọa độ đủ nguồn bị bỏ qua kèm chẩn đoán.
- Waveform là các trạng thái logic đã lấy mẫu, có thể bỏ lỡ xung nhanh; không phải máy hiện sóng đo điện áp hay solver SPICE. Khả năng runtime của từng board giữ nguyên và được ghi rõ.
- Breadboard 400 tie-point/rail chưa kiểm mẫu vẫn là giả định được công khai.

## Kiểm chứng

- Independent source QA: PASS; 35/35 hashes khớp review-snapshot.json. Các phát hiện và xử lý ở review.md và DISPOSITION.md.
- npm.cmd test cuối: exit 0, 647/647; không skip/todo (baseline trước trang góp ý 642, thêm 5 ca góp ý).
- 27 ca Node trong phạm vi: đạt; đã tái hiện đỏ trước các sửa lỗi lõi.
- 20 ca browser freestyle cuối: đạt. Gồm tự nối Uno + biên dịch thật, MicroPython Pico, đủ tám board, 3D, waveform có HIGH/LOW, raw draft opt-in, khôi phục sau nhiều lần thay, quota + tải mạch trong RAM, late compile, URL board+part, dừng trước interval80ms, mobile/desktop.
- Ba ca mobile bổ sung: đạt; gồm nút ảo cạnh mạch, knob cạnh waveform không restart runtime và landscape 812×375 không tràn ngang.
- `npm.cmd run typecheck` và `npm.cmd run build:local`: exit 0 trên nguồn cuối; log riêng và hash tại verification.json.
- Full E2E cuối: exit 0, 170/170, không retry hoặc ca bị bỏ qua. Cấu hình chỉ đổi cổng sang 5311 vì 5196 đang do tiến trình khác sử dụng; dùng nguyên assertion, không retry, một worker và production preview.

Lượt full ban đầu đạt 148/156 và có 8 ca đỏ, được giữ trong e2e-all-before-regression-fixes.txt. Đã sửa nguyên nhân ở DOM/accessible name/URL intent/contrast, giữ kiểm tra nghiệp vụ; chi tiết trong DISPOSITION.md. Không tính các lượt superseded hoặc focused suite là toàn bộ hồi quy đạt.

## Ảnh minh chứng

Ảnh dưới được tạo lại bởi các ca E2E trên snapshot cuối; xem log để biết lượt chạy hoàn tất.

![Bàn 2D desktop](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FREESTYLE-UX-002/screenshots/bench-1440.png)

![Bàn mobile](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FREESTYLE-UX-002/screenshots/bench-375.png)

![Cảnh 3D Uno](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FREESTYLE-UX-002/screenshots/uno-3d.png)

![Dạng sóng runtime](D:/StartupOS/electronics-learning-demo/docs/agents/runs/MM-SW-FREESTYLE-UX-002/screenshots/runtime-waveform.png)

## Bàn giao cuối

Cả bốn lệnh trong verification.json đều exit 0: typecheck, 647 Node tests, build local và 170 browser tests. Bản mã vẫn khớp toàn bộ hash reviewer đã kiểm. Log cuối, bản cấu hình browser đã dùng và hash bằng chứng được giữ trong thư mục này. Kiểm trực quan ảnh desktop/mobile và các view đã thực hiện; không có lỗi hình ảnh chặn phạm vi nghiệm thu. Kiểm screen reader và bàn phím điện thoại vật lý: NOT_RUN. Cổng 5196 giữ nguyên; preview cho người dùng tại http://127.0.0.1:5320. Chưa publish/deploy hoặc đẩy GitHub.
