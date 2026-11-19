# L5 · Tải mô hình theo màn hình và dùng lại ngoại tuyến

| Kiểm chứng | Trước thay đổi | Sau thay đổi |
|---|---|---|
| Vào Thư viện Uno R3 ở 375×812, hình 3D nằm dưới màn hình | Tải GLB 6,37 MiB khi mở trang | 0 yêu cầu GLB trước khi cuộn tới khung, 1 yêu cầu khi khung vào màn hình |
| Mở lại byte Uno GLB và SPICE WASM sau khi Chromium tắt mạng | Chưa có hai loại tài nguyên trong allowlist cache | Đọc lại cả hai và xác nhận chữ ký định dạng GLB/WASM |
| Mở lại phòng lắp mạch offline và chuyển phiên bản worker | Có kiểm khung ứng dụng | Ca kiểm cũ vẫn qua cùng ca cache mới |

12/12 ca Chromium trong nhóm tải chậm, offline, mặt board và lối vào mobile. Cache chỉ nhận response 200 đầy đủ trên nguồn của app, bỏ qua request theo byte range và API. Trình đọc GLB chỉ nạp khi khung lần đầu vào màn hình.

Chưa đo p75 theo Fast 4G, chưa đạt ngân sách ≤2 MiB ở một số GLB và chưa có nút cập nhật worker bảo toàn nháp. Kết quả này là mốc local cho một thay đổi có thể đo riêng.
