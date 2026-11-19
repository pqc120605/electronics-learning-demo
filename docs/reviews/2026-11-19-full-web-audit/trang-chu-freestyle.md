# Trang chủ với bàn lắp mạch freestyle

Phạm vi EXP-01 và EXP-06 trong luồng khách. Điểm xuất phát đã xác nhận là trang `/` của bản local trên laptop, có menu ngang trên desktop và bàn lắp mạch ngay dưới phần mở đầu.

| Quan sát | Thay đổi trong bản phát hành |
| --- | --- |
| Link tester trước đây dẫn thẳng vào `/app`, nên người dùng gặp bố cục Không gian học với điều hướng bên trái. | Dùng `/` làm địa chỉ chia sẻ bản public. `/app` tiếp tục phục vụ Không gian học. |
| Trang chủ tester trước đây yêu cầu mở mục “Thử bàn lắp ngay trên trang”. Bản local hiển thị bàn trực tiếp. | Hiển thị bàn ngay dưới phần mở đầu. Liên kết “Mở bàn lắp mạch” chuyển tiêu điểm đến bàn trên cùng trang. |
| Người mới có thể nhầm bàn freestyle với phòng lắp theo bài. | Giữ hai lối vào riêng. Bàn tự do bắt đầu trống và cho mở lại bản nháp. Phòng theo bài giữ mạch, code và board đã chọn qua liên kết. |
| Tải tài nguyên 3D và solver ngay từ trang chủ tốn thời gian khi chưa dùng. | Kiểm tải lần đầu để bảo đảm chưa yêu cầu tệp CAD, GLB hoặc WASM. |

Bài kiểm chạy ở 375 × 812 và 1440 × 900. Kịch bản kiểm vị trí menu, dùng Enter để đến bàn, không tràn ngang, không tự ghi nháp, mở lại công việc, giữ lựa chọn Nano trong bài LED và phân biệt các bề mặt `/`, `/app` và `/app/lab`. [Kiểm luồng từ trang đầu](../../../e2e/mobile-learning-entry.spec.mjs) · [Kiểm giữ nháp và các view](../../../e2e/freestyle-views.spec.mjs)

Các dịch vụ Arduino CLI và AI trên laptop có môi trường thực thi riêng. Bản web công khai sử dụng các chế độ chạy hiện có trong trình duyệt. [Vận hành Mini PC](van-hanh-mini-pc.md)
