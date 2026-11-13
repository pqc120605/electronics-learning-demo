# P0-13 — lựa chọn hướng tiếp theo sau các kiểm tra kỹ thuật

Ngày10/11/2026. Hiện tại vẫn là Jauch/BQ25170-family/direct-return; không tự đổi cấu hình. B1 NOT_READY.

## Những việc đã làm thay vì chỉ hoàn tất biên bản

Box02 phát triển topology hai kênh và sửa crossing/qualifier; lead sửa quan hệ timer/token/phase và giới hạn pulse nhả. Box08 nhận sửa logic ở đúng snapshot. Lead chạy17 kịch bản và458752 transition logic; đây không là proof điện thực.

Box03 đã tính hình học/đường lực M-A, sửa góc3g của selector và khảo sát ngoại lệ≤1ms mà Founder cho phép. Weak guard không chứng minh1ms; phương án dùng năng lượng người dùng nạp lò xo có budget đóng tự do nhưng vẫn thiếu chu trình mở và hình học bắt follower. Box08 xác nhận thiếu sót; chưa phù hợp xin CAD/FE nhằm đóng toàn gate.

Box09 rà đúng hai comparator mới rồi dừng; các MAX công khai không đáp ứng đồng thời cửa sổ và điều kiện timing đang dùng. Chưa có charger/protector thay thế đủ căn cứ để xin duyệt. Không tự nâng trần4.200V, giảm bảo vệ hoặc biến TYP thành MAX.

## A — Giữ hướng hiện hành

Giữ Jauch, sạc Li-ion onboard, direct-return/M-A và yêu cầu khóa/veto hiện tại. Cần một topology capture thật sự khác có chu trình năng lượng/đường tiếp cận chặn được chứng minh và bộ cận H3/default/fault áp dụng. Các yêu cầu dữ liệu được ghi trong DATA-REQUEST-DRAFT.md; chưa gửi hãng. Không tiếp tục cùng cơ cấu đã no-go hoặc đổi tên IC để khẳng định đủ bằng chứng. Không có thời hạn hoặc cam kết B1 ready cho A ở snapshot này.

## B — Cho phép nghiên cứu hướng3AA NiMH/sạc ngoài, liên động thủ công

Đây là delta Box01 đề xuất, Box08 chấp nhận **chỉ để trình chọn hướng nghiên cứu**. Giữ tay cầm chạy không dây, ESP32 CH34030chân, G-B16/E1–E4 và robot Starter riêng. Thay nguồn tay cầm Jauch bằng3AA NiMH tháo rời; bỏ sạc Li-ion onboard và actuator nhả cassette có điện.

PROGRAM dự kiến yêu cầu tắt/tháo pin, ngắt toàn bộ giao diện carrier–B01 và nguồn RUN nội bộ trước khi cắm PC. Phải nghiên cứu liên động bắt buộc thứ tự và ngăn lắp lại nguồn trong PROGRAM. **Thao tác đầu nối bên trong là thay đổi trải nghiệm thật**, chưa là luồng beginner đã đạt; thao tác bằng tay không tự là interlock đã chứng minh. Không thêm dây khi chạy điều khiển không dây.

Hướng B cần Founder thay hướng Q2/Q3 và nghĩa vụ sạc/actuator tương ứng, cho phép nghiên cứu thao tác không cần bias sau khi nguồn/giao diện đã tách vật lý và năng lượng dư được xử lý có cận. Chưa chọn cell/khay/MPN/cơ cấu/giá, chưa duyệt tiêu chí gate cuối, hash hoặc build. Ngân sách toàn robot+tay cầm dưới1triệu và tính dễ dùng vẫn phải chứng minh; hiện chưa có BOM giá hợp nhất.

Sau khi chọn B: lập dossier nguồn–giắc–liên động, review nguồn/cell/UVLO/đảo cực/quá dòng, residual energy/backfeed và reset/W/fresh-arm; review fit/UX/BOM. Chỉ sau phê duyệt phạm vi mới mới supersede gate H3 thành N/A có lý do và thay gate actuator bằng nghĩa vụ liên động được review. Không gọi gate cũ PASS. AA lịch sử không tự trở thành cấu hình đã duyệt.

## Quyền của lựa chọn này

Chọn B chỉ cho phép nghiên cứu delta trên; không duyệt cấu hình/hash/MPN/CAD/FE/KiCad/lease/mua hàng/thiết bị và không làm B1 ready ngay. Chọn A giữ toàn bộ yêu cầu đang có. Không cần chọn lại G-B16, E1–E4, robot Starter, chương trình điều khiển không dây hoặc W đã chốt.

Chi tiết và phản biện: BOX01-SIMPLIFICATION-OPTION.md, BOX08-SIMPLIFICATION-REVIEW.md. Source pins và toàn bộ phép tính/review được liệt kê ở snapshot.json của run này.
