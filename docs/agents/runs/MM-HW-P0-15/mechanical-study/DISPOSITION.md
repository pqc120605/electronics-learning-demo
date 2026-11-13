# Disposition review M5 — hai finding P2

Review nguồn: `BOX08-STUDY-REVIEW-1.md`, turn `01a1c552-2e22-7900-9b57-554a7da7c057`.

| Finding | Lead kiểm lại | Xử lý |
|---|---|---|
| F1: tangency ghi “reported separately” nhưng không có thống kê | Đúng: collision.py loại overlap≤EPS, kết quả chỉ ghi positive-volume. Không có bảng tangency riêng | ACCEPT. Thu hẹp claim trong REPORT: deviation protocol còn công khai,54mẫu không vào positive-contact không được coi là đã cách ly; không gọi coverage biên hoàn tất. Giữ protocol/mã/kết quả cũ để không tạo dữ liệu lịch sử giả. Không chạy lại CAD vì không đổi hình hoặc giả nhận thêm coverage |
| F2: thiếu final-checks.json trong study | Đúng: report dẫn tới artifact chưa tạo tại thời điểm review, không được lấy file run cha có CAD:NOT_RUN | ACCEPT. Tạo verify_evidence.py và final-checks.json ở đúng thư mục study; kiểm nguồn/provenance/các snapshot lịch sử/consent, chạy validator mới. Bổ sung vào packet v2 |

Bản report đầu giữ nguyên bytes ở REPORT.review1.md, SHA256 `dba273b68262631bf3e4bf406b4036f69fa3ece1559b44eddabbf670db547b2e`. Source CAD, protocol, kết quả số và XBF không đổi sau review đầu. Bản report hiện tại sửa mức claim và đường dẫn chứng cứ, không đóng lỗi thiết kế.

Không adopt M5, không PASS cổng, không B1. Quyền CAD r1 vẫn chỉ là phạm vi nghiên cứu đã duyệt, không phê duyệt sản phẩm.
