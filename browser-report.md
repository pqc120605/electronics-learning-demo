# Báo cáo kiểm thử trình duyệt (Browser Testing Report)

**Môi trường thử nghiệm:**
- **URL ứng dụng:** http://127.0.0.1:5196 (Vite preview build)
- **Trình duyệt kiểm thử:** Chromium 1248 (Headless / Emulated Device Viewport)
- **Ràng buộc:** Chỉ ghi nhận hiện tượng quan sát trực tiếp trên giao diện; không suy đoán nguyên nhân mã nguồn; không đăng nhập hay nhập dữ liệu cá nhân; xác nhận không có cổng yêu cầu tài khoản (guest-first).

---

## 1. Bảng tổng hợp kết quả theo ca kiểm thử

| Ca | Kích thước | PASS / FAIL | Bước tái hiện | Ảnh chụp |
| :--- | :--- | :--- | :--- | :--- |
| **ca-375** | 375 x 667 px | **FAIL** *(1/7 bước lỗi)* | 1. Tải trang `http://127.0.0.1:5196`<br>2. Bấm nút "Menu", chọn liên kết "Phòng thử" để mở Trình dựng mạch<br>3. Bấm thêm linh kiện "Breadboard" từ thư viện palette<br>4. Thử phím mũi tên, Tab, Enter nối dây, phím R, Delete<br>5. Kiểm tra thông báo lưu nháp trên thanh công cụ và `localStorage`<br>6. Tải lại trang (F5 online)<br>7. Bật Offline trong DevTools Network và tải lại trang | `ca-375.png`<br>`ca-375-01-tai-trang.png`<br>`ca-375-02-trinh-dung-mach.png`<br>`ca-375-03-them-linh-kien.png`<br>`ca-375-04-noi-day-ban-phim.png`<br>`ca-375-05-luu-nhap.png`<br>`ca-375-06-tai-lai-online.png`<br>`ca-375-07-offline-tai-lai.png` |
| **ca-768** | 768 x 1024 px | **FAIL** *(1/7 bước lỗi)* | 1. Tải trang `http://127.0.0.1:5196`<br>2. Bấm liên kết "Phòng thử" trên thanh điều hướng<br>3. Bấm thêm linh kiện "Breadboard" từ thư viện palette<br>4. Thử phím mũi tên, Tab, Enter nối dây, phím R, Delete<br>5. Kiểm tra trạng thái lưu nháp trên thanh công cụ và `localStorage`<br>6. Tải lại trang (F5 online)<br>7. Bật Offline trong DevTools Network và tải lại trang | `ca-768.png`<br>`ca-768-01-tai-trang.png`<br>`ca-768-02-trinh-dung-mach.png`<br>`ca-768-03-them-linh-kien.png`<br>`ca-768-04-noi-day-ban-phim.png`<br>`ca-768-05-luu-nhap.png`<br>`ca-768-06-tai-lai-online.png`<br>`ca-768-07-offline-tai-lai.png` |
| **ca-1440** | 1440 x 900 px | **FAIL** *(1/7 bước lỗi)* | 1. Tải trang `http://127.0.0.1:5196`<br>2. Bấm liên kết "Phòng thử" trên thanh điều hướng<br>3. Bấm thêm linh kiện "Breadboard" từ thư viện palette<br>4. Thử phím mũi tên, Tab, Enter nối dây, phím R, Delete<br>5. Kiểm tra trạng thái lưu nháp trên thanh công cụ và `localStorage`<br>6. Tải lại trang (F5 online)<br>7. Bật Offline trong DevTools Network và tải lại trang | `ca-1440.png`<br>`ca-1440-01-tai-trang.png`<br>`ca-1440-02-trinh-dung-mach.png`<br>`ca-1440-03-them-linh-kien.png`<br>`ca-1440-04-noi-day-ban-phim.png`<br>`ca-1440-05-luu-nhap.png`<br>`ca-1440-06-tai-lai-online.png`<br>`ca-1440-07-offline-tai-lai.png` |

---

## 2. Chi tiết kết quả từng bước theo ca

### Ca ca-375 (375 x 667 px — Mobile)
- **Bước 1: Tải trang (PASS)**
  - Tải URL `http://127.0.0.1:5196` trả về mã HTTP 200, tiêu đề: `"Mạch Mở — Học Điện tử qua thực hành"`.
  - Không có biểu mẫu đăng nhập, không có trường nhập mật khẩu hay yêu cầu tài khoản; ghi nhận thông điệp: *"Không cần tài khoản hay kinh nghiệm"*.
  - Ảnh minh chứng: `ca-375-01-tai-trang.png`.
- **Bước 2: Mở Trình dựng mạch (PASS)**
  - Bấm nút `Menu` (`.site-nav-mobile-toggle`), mở menu điều hướng và bấm liên kết `"Phòng thử"`.
  - Trình duyệt chuyển tới `http://127.0.0.1:5196/build`. Giao diện hiển thị tiêu đề `"Lắp thử một mạch"`, tiêu đề phụ `"PHÒNG THỬ MẠCH · MÔ PHỎNG GIÁO DỤC"`, thanh Stepper hiển thị các bước thực hành.
  - Ảnh minh chứng: `ca-375-02-trinh-dung-mach.png`.
- **Bước 3: Thêm một linh kiện (PASS)**
  - Bấm nút thêm linh kiện `"Breadboard"` (`+`) trong bảng Thư viện linh kiện (`.builder-palette`).
  - Số linh kiện trên bàn tăng từ 4 lên 5 (thêm Breadboard mới). Hộp thông báo hiển thị: *"Breadboard đã được đặt lên bàn. Bảng cắm thử không hàn..."*.
  - Ảnh minh chứng: `ca-375-03-them-linh-kien.png`.
- **Bước 4: Nối dây bằng bàn phím (Tab, Enter, phím R, Delete, mũi tên) (FAIL)**
  - *Phím mũi tên (Arrow keys):* **ĐẠT**. Khi tiêu điểm đặt vào nút chọn linh kiện (`.placed-part-select`), bấm các phím mũi tên làm linh kiện di chuyển trên canvas (ghi nhận dịch chuyển dx: 15px, dy: 1441px).
  - *Nối dây bằng Tab và Enter:* **KHÔNG ĐẠT**. Bấm nút "Nối dây", sau đó dùng Tab và Enter chọn lần lượt 2 chân linh kiện trên canvas. Hệ thống không tạo thêm dây nối mới (số dây giữ nguyên 3), thông báo hiển thị vai trò chân: *"ESP32 DevKit V1 · GND. Đọc tín hiệu vào và xuất lệnh điều khiển..."*.
  - *Phím R:* Trên canvas Mạch lắp thử logic, bấm phím `r` không ghi nhận phản hồi xoay linh kiện. Trên Sơ đồ nguyên lý ở màn hình 375px, phím `r` chưa xoay được linh kiện (cần bấm nút "Xoay 90°" trên thanh công cụ).
  - *Phím Delete:* Trên canvas Mạch lắp thử logic, bấm phím `Delete` không xóa linh kiện. Trên chế độ Sơ đồ nguyên lý, bấm phím `Delete` xóa thành công linh kiện được chọn (số linh kiện giảm từ 5 xuống 4).
  - Ảnh minh chứng: `ca-375-04-noi-day-ban-phim.png`.
- **Bước 5: Lưu nháp (PASS)**
  - Thanh công cụ hiển thị dòng trạng thái: *"Đã lưu trên thiết bị này"*.
  - Bộ nhớ `localStorage` lưu trữ bản nháp tại khóa `'machmo-builder-session'` chứa 4 linh kiện, 3 dây nối, cấu hình board `'esp32-devkit'`, bài học `'blink'`.
  - Ảnh minh chứng: `ca-375-05-luu-nhap.png`.
- **Bước 6: Tải lại trang online (PASS)**
  - Tải lại trang (F5 online). Trình dựng mạch nạp lại đầy đủ, giữ nguyên tiêu đề `"Lắp thử một mạch"`, hiển thị 4 linh kiện và 3 dây nối đã lưu từ bản nháp.
  - Ảnh minh chứng: `ca-375-06-tai-lai-online.png`.
- **Bước 7: Chuyển sang chế độ Offline và tải lại (PASS)**
  - Kích hoạt chế độ Offline (`Network: Offline`). Tải lại trang (F5).
  - Trang web tải lại thành công (HTTP 200 phục vụ từ Service Worker Cache). Giao diện Trình dựng mạch, 4 linh kiện và 3 dây nối hiển thị bình thường mà không cần kết nối mạng.
  - Ảnh minh chứng: `ca-375-07-offline-tai-lai.png`.

---

### Ca ca-768 (768 x 1024 px — Tablet)
- **Bước 1: Tải trang (PASS)**
  - Tải URL `http://127.0.0.1:5196` thành công (HTTP 200), tiêu đề: `"Mạch Mở — Học Điện tử qua thực hành"`. Không yêu cầu đăng nhập/tài khoản.
  - Ảnh minh chứng: `ca-768-01-tai-trang.png`.
- **Bước 2: Mở Trình dựng mạch (PASS)**
  - Bấm liên kết `"Phòng thử"` trên thanh điều hướng chính, chuyển đến `http://127.0.0.1:5196/build`. Tiêu đề hiển thị `"Lắp thử một mạch"`.
  - Ảnh minh chứng: `ca-768-02-trinh-dung-mach.png`.
- **Bước 3: Thêm một linh kiện (PASS)**
  - Bấm nút thêm Breadboard từ Thư viện linh kiện. Số lượng linh kiện tăng từ 4 lên 5.
  - Ảnh minh chứng: `ca-768-03-them-linh-kien.png`.
- **Bước 4: Nối dây bằng bàn phím (Tab, Enter, phím R, Delete, mũi tên) (FAIL)**
  - *Phím mũi tên:* **ĐẠT**. Di chuyển linh kiện thành công trên canvas (dx: 15px, dy: 1160px).
  - *Nối dây bằng Tab và Enter:* **KHÔNG ĐẠT**. Tiêu điểm Tab tới chân và bấm Enter chỉ hiển thị mô tả chân GND, không tạo thêm dây nối mới (dây giữ nguyên 3).
  - *Phím R:* Không xoay linh kiện trực tiếp trên canvas Lắp mạch.
  - *Phím Delete:* Không phản hồi trên canvas Lắp mạch; xóa thành công linh kiện ở chế độ Sơ đồ nguyên lý (5 -> 4).
  - Ảnh minh chứng: `ca-768-04-noi-day-ban-phim.png`.
- **Bước 5: Lưu nháp (PASS)**
  - Thanh công cụ hiển thị *"Đã lưu trên thiết bị này"*. Dữ liệu nháp được ghi vào `localStorage` (`'machmo-builder-session'`).
  - Ảnh minh chứng: `ca-768-05-luu-nhap.png`.
- **Bước 6: Tải lại trang online (PASS)**
  - Tải lại trang online thành công. Khôi phục đầy đủ 4 linh kiện và 3 dây nối từ bản nháp.
  - Ảnh minh chứng: `ca-768-06-tai-lai-online.png`.
- **Bước 7: Chuyển sang chế độ Offline và tải lại (PASS)**
  - Bật Offline và tải lại trang. Service Worker cache phản hồi tài nguyên (HTTP 200), giao diện Trình dựng mạch và linh kiện hiển thị đầy đủ offline.
  - Ảnh minh chứng: `ca-768-07-offline-tai-lai.png`.

---

### Ca ca-1440 (1440 x 900 px — Desktop)
- **Bước 1: Tải trang (PASS)**
  - Tải URL `http://127.0.0.1:5196` thành công (HTTP 200), tiêu đề: `"Mạch Mở — Học Điện tử qua thực hành"`. Không yêu cầu đăng nhập/tài khoản.
  - Ảnh minh chứng: `ca-1440-01-tai-trang.png`.
- **Bước 2: Mở Trình dựng mạch (PASS)**
  - Bấm liên kết `"Phòng thử"` trên thanh điều hướng chính, chuyển đến `http://127.0.0.1:5196/build`. Tiêu đề hiển thị `"Lắp thử một mạch"`.
  - Ảnh minh chứng: `ca-1440-02-trinh-dung-mach.png`.
- **Bước 3: Thêm một linh kiện (PASS)**
  - Bấm nút thêm Breadboard từ Thư viện linh kiện. Số lượng linh kiện tăng từ 4 lên 5.
  - Ảnh minh chứng: `ca-1440-03-them-linh-kien.png`.
- **Bước 4: Nối dây bằng bàn phím (Tab, Enter, phím R, Delete, mũi tên) (FAIL)**
  - *Phím mũi tên:* **ĐẠT**. Di chuyển linh kiện thành công trên canvas (dx: 15px, dy: -534px).
  - *Nối dây bằng Tab và Enter:* **KHÔNG ĐẠT**. Khi dùng Tab/Enter để chọn 2 chân, hệ thống không tạo thêm dây nối mới (dây giữ nguyên 3).
  - *Phím R:* Không xoay linh kiện trực tiếp trên canvas Lắp mạch.
  - *Phím Delete:* Không phản hồi trên canvas Lắp mạch; xóa thành công linh kiện ở chế độ Sơ đồ nguyên lý (5 -> 4).
  - Ảnh minh chứng: `ca-1440-04-noi-day-ban-phim.png`.
- **Bước 5: Lưu nháp (PASS)**
  - Thanh công cụ hiển thị *"Đã lưu trên thiết bị này"*. Khóa `'machmo-builder-session'` trong `localStorage` ghi nhận trạng thái mạch.
  - Ảnh minh chứng: `ca-1440-05-luu-nhap.png`.
- **Bước 6: Tải lại trang online (PASS)**
  - Tải lại trang online thành công. Giao diện và các linh kiện, dây nối được giữ nguyên từ bản nháp.
  - Ảnh minh chứng: `ca-1440-06-tai-lai-online.png`.
- **Bước 7: Chuyển sang chế độ Offline và tải lại (PASS)**
  - Bật Offline và tải lại trang. Service Worker cache phản hồi tài nguyên (HTTP 200), Trình dựng mạch hiển thị và hoạt động offline bình thường.
  - Ảnh minh chứng: `ca-1440-07-offline-tai-lai.png`.

---

## 3. Danh sách các ca và thao tác KHÔNG thử được và lý do

1. **Thao tác tạo dây nối hoàn chỉnh chỉ bằng bàn phím (Tab + Enter) trên canvas Lắp mạch (Assembly view):**
   - *Hiện tượng:* Ở cả 3 kích thước (375px, 768px, 1440px), khi dùng phím `Tab` để di chuyển tiêu điểm đến chân linh kiện (`.part-pin`) và bấm `Enter`, hệ thống chỉ xuất dòng thông báo giới thiệu chân (ví dụ: *"ESP32 DevKit V1 · GND. Đọc tín hiệu vào và xuất lệnh điều khiển..."*) thay vì kích hoạt trạng thái chọn chân thứ nhất để nối sang chân thứ hai. Dây nối không được tạo thêm qua chuỗi phím này trên canvas chính.
2. **Thao tác xoay (phím R) và xóa (phím Delete) trực tiếp trên canvas Lắp mạch (Assembly view):**
   - *Hiện tượng:* Khi tiêu điểm đang ở linh kiện trên canvas Lắp mạch (`.placed-part`), bấm phím `r` hoặc phím `Delete` không tạo ra bất kỳ thay đổi nào về góc xoay hay số lượng linh kiện trên màn hình. Thao tác này chỉ thực hiện được khi người dùng chuyển sang chế độ "Sơ đồ nguyên lý" (Schematic view) hoặc bấm các nút chuột "Xoay 90°" và "Xóa" trên bảng điều khiển (`BuilderPinPanel`).
3. **Các thao tác cần tài khoản hoặc đăng nhập:**
   - *Lý do:* Ứng dụng hoạt động theo cơ chế khách (guest-first / local-first), không có trang hoặc biểu mẫu đăng nhập tài khoản. Theo đúng ràng buộc *"nếu trang cần tài khoản thì dừng và báo"*, kiểm tra ghi nhận trang không có bước nào bị chặn bởi tài khoản.
