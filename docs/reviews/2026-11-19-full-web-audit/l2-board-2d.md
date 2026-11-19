# L2 · Chọn chân và tra linh kiện trên mặt board

Trong Thư viện board, chọn board rồi mở **Mặt board 2D**. Có ảnh chiếu từ trên và lớp CAD bật/tắt cho Uno, Nano, Mega, ESP32 DevKit clone và Pico. Lựa chọn chân dùng chung với PCB 3D qua tham số `pin`, kể cả sau khi đổi chế độ xem hoặc tải lại. Bàn tự do dùng lại tọa độ chân Arduino đã kiểm theo CAD.

| Thao tác | Cách dùng |
|---|---|
| Chọn pad | Bấm điểm chân trên board hoặc chọn theo tên và số pad ở danh sách. Khi các pad quá gần, bảng gợi ý để chọn chính xác. |
| Duyệt bằng bàn phím | Tab vào hình board, dùng phím mũi tên, Enter để chọn, Escape để bỏ chọn. |
| Chọn linh kiện | Bấm vùng footprint trên ảnh hoặc chọn Reference trong danh sách. Bảng hiện footprint, mặt PCB và các net có nguồn. |
| Tra mặt sau | Bật Mặt sau để xem lớp tọa độ lật gương. Trình xem dùng hình học CAD cho lớp này. |

Các mục còn lại của L2 gồm tích hợp inspector vào lab theo bài và bàn tự do, đồng bộ với sơ đồ nguyên lý và Mở Bot, bảng loại điện có nguồn cho chân chip và kiểm toàn bộ thao tác chuột/chạm/3D trên từng pad. [Dữ liệu và phạm vi đo LK](lk-board-data.md).

Chromium chạy 10/10 bài kiểm đích ở 375×812 và 1440×900, gồm danh sách và hai lớp của năm board, luồng đổi sang 3D trên Uno và các thao tác nối dây trên mặt board ở bàn tự do.

[Ảnh Uno ở 375×812](evidence/l2/uno-top-375.png) · [Ảnh Uno ở 1440×900](evidence/l2/uno-top-1440.png)
