# Prompt nghiên cứu ngoài · DeepSeek, Gemini, Antigravity

Mục đích: tìm nguồn (link, tài liệu, kho dữ liệu, mô hình 3D) và khoảng trống tính năng so với đối thủ để bổ sung Mạch Mở. Kết quả KHÔNG đưa thẳng cho Luna. Quy trình: chạy prompt → lưu kết quả thô → dán vào một phiên Claude để lọc license, kiểm link (lấy mẫu), loại trùng → mỗi nguồn được duyệt thành một slice Luna riêng.

Cảnh báo chung cho founder:
- Mô hình chat không có duyệt web hay công cụ có thể bịa URL. Mỗi prompt yêu cầu chúng đánh nhãn [chưa xác minh]; vẫn phải kiểm lại.
- Không bắt chạy tải hàng loạt, không vượt đăng nhập/CAPTCHA/paywall. Tài khoản là của bạn: đừng đưa mật khẩu cho công cụ nào.
- License quyết định có dùng được không: ngầm hiểu "miễn phí xem" ≠ "được nhúng/phân phối lại".

## Khối bối cảnh dùng chung (dán vào đầu mọi prompt)

```
Bối cảnh: Mạch Mở là web học điện tử, lập trình nhúng và IoT (React + TypeScript, chạy LOCAL-FIRST, phải chạy được khi không có mạng và không có tài khoản cloud; sau này mới đưa lên public). Web đã có: xem board 3D và pinout, 11 bài học, trình dựng mạch (sơ đồ + 3D), mô phỏng SPICE (ngspice WASM) và AVR (avr8js), nhập Eeschema XML, xuất .ino, gói lớp học/BOM CSV, xem PCB 2D. Web CHƯA có (theo kiểm tra code): runtime ESP32, điều khiển robot, QR bài học, xuất ảnh/PDF sơ đồ, soạn PCB, tra cứu giá/kho linh kiện, nối serial/Bluetooth/USB, micro/giọng nói.
Nhóm đối thủ tham chiếu (chỉ để so sánh năng lực công khai, KHÔNG sao chép UI, asset hay nội dung của họ): CRUMB Circuit Simulator, Proteus, Wokwi, Tinkercad Circuits, Falstad/CircuitJS, EveryCircuit, CircuitLab, KiCad, EasyEDA, Fritzing, Scheme-It, LCSC/EasyEDA parts, Arduino IDE 2, Arduino Cloud Editor, Arduino Education, OhStem xBot, LEGO SPIKE, QEMU, Renode.
Quy tắc: (1) chỉ dùng nguồn công khai; mở từng link và ghi trạng thái HTTP thật (200/301/403/404); nếu không mở được, ghi [chưa xác minh] và đừng viết như đã kiểm. (2) Mỗi mục ghi LICENSE (mã SPDX nếu có, kèm URL trang license) và nó cho phép: nhúng/phân phối lại offline, chỉ xem, hay không rõ. Không suy đoán license. (3) Không tải file lớn, không tải hàng loạt; chỉ ghi kích thước nếu trang nêu. (4) Không bypass đăng nhập, CAPTCHA, paywall; mục cần đăng nhập thì ghi "cần tài khoản". (5) Không bịa giá, tồn kho, chứng nhận, số liệu. (6) Không sao chép nội dung, ảnh, UI của đối thủ; chỉ tóm tắt năng lực bằng lời của bạn kèm URL trang chính thức. (7) Ngày kiểm tra ghi bằng ngày hôm nay.
```

## Định dạng kết quả bắt buộc (dán cuối mọi prompt)

```
Trả kết quả thành BA khối, mỗi khối là bảng CSV trong khối code (dấu phẩy, bao chuỗi có dấu phẩy bằng ngoặc kép), không thêm lời dẫn trong khối:

Khối 1 · nguon.csv: nhom,ten,url,loai,license_spdx,license_url,cho_phep_offline,dinh_dang,kich_thuoc,dung_cho,rui_ro,http,ngay_kiem,tin_cay
  - nhom ∈ {tai_lieu, kho_linh_kien_symbol_footprint, mo_hinh_spice, mo_hinh_3d_board, mo_hinh_3d_linh_kien, bom_gia_api, du_lieu_bai_hoc, cong_cu_chuyen_doi}
  - loai ∈ {trang_tai_lieu, repo, api, tep_tai_ve, bo_suu_tap}
  - cho_phep_offline ∈ {co, khong, khong_ro}
  - dung_cho: tên linh kiện/board hoặc tính năng (ví dụ "ESP32 DevKit 30 chân", "OLED SSD1306", "xuất sơ đồ")
  - tin_cay ∈ {cao, trung_binh, thap}; ghi "chua_xac_minh" vào cột http nếu không mở được link

Khối 2 · khoang_trong.csv: nang_luc,doi_thu,mach_mo_co,mach_mo_thieu,bang_chung_url,muc_uu_tien,gia_dinh
  - Chỉ liệt kê năng lực công khai mà trang chính thức của đối thủ nêu rõ; mach_mo_co dựa trên khối bối cảnh; muc_uu_tien ∈ {cao, trung_binh, thap}

Khối 3 · ghi_chu.md: tối đa 15 dòng: việc chưa làm được, link không mở được, nguồn nghi ngờ license, câu hỏi cho founder.

Tối đa 60 dòng cho mỗi khối. Chất lượng hơn số lượng; bỏ mục không chắc thay vì đoán.
```

## Prompt 1 · DeepSeek (chat, thường không có duyệt web)

```
Bạn là trợ lý nghiên cứu cho dự án Mạch Mở.
[DÁN KHỐI BỐI CẢNH DÙNG CHUNG]

Việc: lập danh sách nguồn thuộc nhóm tài liệu và kho linh kiện/symbol/footprint/mô hình SPICE, và khoảng trống tính năng so với nhóm đối thủ ở trên.
Quan trọng: nếu bạn KHÔNG có công cụ duyệt web ở lượt này, hãy nói rõ ở dòng đầu "KHÔNG CÓ DUYỆT WEB", chỉ đưa tên tổ chức/kho kèm URL gốc (trang chủ hoặc repo chính) mà bạn chắc chắn tồn tại, đánh [chua_xac_minh] ở cột http và tin_cay=thap, và KHÔNG tự đặt đường dẫn sâu. Không bịa URL, không bịa license.
Gợi ý chủ đề để tìm (chưa kiểm chứng, hãy tự xác minh): kho KiCad chính thức (symbol, footprint, 3D), thư viện của Espressif, Raspberry Pi, SparkFun, Adafruit, Arduino, Wokwi (phần tử mô phỏng nguồn mở), Fritzing parts, thư viện mô hình SPICE do nhà sản xuất cung cấp công khai, tài liệu giáo dục điện tử/IoT có license mở.
[DÁN ĐỊNH DẠNG KẾT QUẢ BẮT BUỘC]
```

## Prompt 2 · Gemini (dùng chế độ Deep Research nếu có)

```
Bạn là nhà nghiên cứu sản phẩm cho dự án Mạch Mở. Dùng chế độ nghiên cứu sâu có trích dẫn nếu có.
[DÁN KHỐI BỐI CẢNH DÙNG CHUNG]

Việc 1: tìm nguồn mô hình 3D (STEP/GLB/WRL/STL) của board và linh kiện phổ biến, với license cho phép dùng lại: ESP32 DevKit (30 chân và DevKitC), Arduino Uno/Nano, Raspberry Pi Pico, STM32 Nucleo/Blue Pill, micro:bit, HC-SR04, OLED SSD1306, DRV8833, MAX98357A, TCRT5000, servo SG90, motor Pololu, loa nhỏ, pin Li-ion 18650/2S. Với mỗi mục ghi nhà phát hành chính thức nếu có (ví dụ mô hình do hãng cung cấp) khác với mô hình cộng đồng.
Việc 2: khoảng trống tính năng: với mỗi đối thủ trong danh sách, tóm tắt (bằng lời của bạn, kèm URL trang chính thức) năng lực nổi bật liên quan học điện tử mà Mạch Mở chưa có.
Việc 3: kho dữ liệu linh kiện có API hoặc dump mở (symbol/footprint/SPICE/BOM) và điều kiện sử dụng; ghi rõ cái nào chỉ dùng trực tuyến (không hợp local-first).
Mỗi kết luận phải có trích dẫn URL đã mở. Điều bạn không mở được ghi [chua_xac_minh].
[DÁN ĐỊNH DẠNG KẾT QUẢ BẮT BUỘC]
```

## Prompt 3 · Antigravity (agent trong IDE, có duyệt web và ghi file)

```
Bạn là agent nghiên cứu CHỈ ĐỌC kho mã và CHỈ ĐƯỢC GHI vào thư mục D:\StartupOS\.tmp\research-intake\antigravity\<YYYY-MM-DD>\ (tạo nếu chưa có). Không sửa bất kỳ file nào khác, không cài package, không commit, không mở file .env, không chạy lệnh ghi ngoài thư mục trên.
Hãy đọc (chỉ đọc) trước: D:\StartupOS\docs\research\2026-11-05-mach-mo-reference-coverage.md, D:\StartupOS\docs\product\2026-11-05-mach-mo-feature-depth-register.md, D:\StartupOS\electronics-learning-demo\docs\claude-support\2026-11-06-final-plan\baseline.md (bảng P01–P25 và bằng chứng).
[DÁN KHỐI BỐI CẢNH DÙNG CHUNG]

Việc: (1) với mỗi nhóm P01–P25, tìm trên trang chính thức năng lực công khai mà Mạch Mở thiếu so với mức "L3 (=D3)": tạo/sửa, chạy, hiểu lỗi, lưu/mở lại, có bằng chứng; (2) tìm nguồn dữ liệu và mô hình 3D theo định dạng bên dưới; (3) với mỗi link, dùng công cụ của bạn để lấy mã HTTP thật (HEAD hoặc GET một trang, không tải file lớn); (4) với mỗi repo, đọc file LICENSE và ghi SPDX; nếu repo có nhiều license (mã, dữ liệu, mô hình) ghi từng phần. Dừng và ghi vào ghi_chu.md nếu gặp CAPTCHA, đăng nhập hoặc paywall; không vượt qua.
Ghi ba file: nguon.csv, khoang_trong.csv, ghi_chu.md đúng định dạng dưới đây; không ghi file nào khác.
[DÁN ĐỊNH DẠNG KẾT QUẢ BẮT BUỘC, nhưng thay "trả kết quả thành ba khối" bằng "ghi ba file"]
```

## Sau khi có kết quả

1. Lưu kết quả thô của từng công cụ vào một thư mục tạm (ví dụ `.tmp/research-intake/<công-cụ>/`); đừng đặt vào `src/` hay `docs/product/`.
2. Mở một phiên Claude (hoặc chat con) và đưa ba file; yêu cầu: loại trùng, kiểm lấy mẫu 10 link ưu tiên cao, đánh dấu mọi mục `cho_phep_offline != co`, lập danh sách đề xuất tích hợp theo ưu tiên.
3. Mỗi nguồn được duyệt thành một slice Luna riêng, kèm file license; Claude review bắt buộc cho slice đưa dữ liệu/mô hình bên ngoài vào repo hoặc `public/`.
