# Mạch Mở / MởBot Starter: mô tả concept và môi trường dự án (cho team business)

Bản này chỉ mô tả sản phẩm và dữ kiện có trong repo. Nghiên cứu thị trường, đối thủ và định giá là việc của team business. Đường dẫn tính từ `D:\StartupOS\electronics-learning-demo\`, trừ khi ghi `D:\StartupOS\...`. Các file `baseline.md`, `README.md` (kế hoạch), `founder-decisions.md`, `hw-v2-to-starter-gap.md`, `mobot-starter-target.md`, `slices.md`, `luna-p1-review.md`, `d10-founder-confirmation.md` nằm trong `docs/claude-support/2026-11-06-final-plan/`. Thông tin không có nguồn ghi **[chưa kiểm chứng]**. "Mạch Mở" và "MởBot" là tên làm việc, chưa đăng ký nhãn hiệu (`mobot-starter-target.md`).

## 1. Tóm tắt

**Dữ kiện từ repo.** Mạch Mở là website học điện tử, lập trình nhúng và IoT (thiết bị nối mạng), miễn phí, chạy ngay trên máy người học. MởBot Starter là kit robot STEM bánh xe dạng lắp ghép: cùng một lõi, người học lắp thành xe rover hoặc robot mini, tự lắp tay điều khiển, và mỗi hoạt động gắn với một bài học trên Mạch Mở (`mobot-starter-target.md`).

**Giả định cần xác nhận.** Người mua là phụ huynh, trường học hoặc trung tâm STEM tại Việt Nam. Điểm khác biệt đề xuất: bài học miễn phí, không cần tài khoản, kit và web đi cùng nhau.

## 2. Vấn đề và khách hàng

**Dữ kiện từ repo.** Repo chưa có nghiên cứu khách hàng, khảo sát hay số liệu người dùng. Founder chỉ chốt: thị trường đầu tiên là Việt Nam, chưa ghi độ tuổi lên hộp (`founder-decisions.md`, D2). Web đã có nền xuất danh sách vật tư kit cho lớp (`src/lib/classroomKit.ts`, theo `baseline.md`), nhưng chưa có tài khoản học viên hay công cụ giáo viên (`README.md`, "Giới hạn demo").

**Giả định cần xác nhận (không phải kết luận của repo).**

- Vấn đề giả định: người mới khó đi từ học lý thuyết sang tự lắp một robot chạy được, và kit nước ngoài khó tiếp cận hoặc thiếu nội dung tiếng Việt **[chưa kiểm chứng]**.
- Nhóm khách có thể có, chưa chọn nhóm nào: phụ huynh mua cho con; trường học và trung tâm STEM; người tự học lớn tuổi hoặc sinh viên **[chưa kiểm chứng]**.
- Chọn nhóm đầu tiên và độ tuổi là quyết định của founder.

## 3. Sản phẩm gồm ba lớp

**Dữ kiện từ repo.** Trạng thái theo bằng chứng trong repo, không theo ý định trong kế hoạch. "Đã có" nghĩa là có mã chạy hoặc tài liệu đã review. Chưa có hạng mục nào được đo trên thiết bị thật (`baseline.md`).

| Hạng mục | Mô tả đời thường | Trạng thái | Bằng chứng |
|---|---|---|---|
| (a) Web: 11 bài học, 4 chặng, mô hình 3D mạch và board | Học theo lộ trình, xem mạch 3D, thử đổi nhịp đèn LED | Đã có | `src/data/learningPath.ts:8-12` (qua `baseline.md`) |
| Web: tự đánh dấu tiến độ, lưu nháp trên máy | Lưu ngay trong trình duyệt | Đã có (mức nền) | `src/lib/learningProgress.ts:4,101` (qua `baseline.md`) |
| Web: mô phỏng mạch bằng SPICE (phần mềm tính điện học) | Chạy thử mạch đơn giản | Đã có; bản công khai đang bị chặn vì chưa rõ giấy phép bộ giải | `baseline.md` (`check:public-release` exit 1) |
| Web: điều khiển robot, QR bài học | Quét QR mở bài, lái robot từ trình duyệt | Chưa có | `baseline.md` (không có `navigator.serial`, QR, `RobotConfiguration`) |
| (b) Kit Starter: lõi, khung rover/mini, màn hình mặt, loa, nút, cảm biến vật cản | Bộ lắp ghép lõi dùng chung | Đang làm (mới có tài liệu thiết kế; chưa có bo mạch in, chưa có firmware) | `baseline.md` (Firmware ESP32 = L0, KiCad = L0); `docs/hardware/mobot-v2-bom-review-2026-11-05-r2-handoff.md` |
| Tay điều khiển tự lắp (module riêng) | Người học tự lắp, đổi chức năng nút | Đang làm (thiết kế mức tài liệu) | `hw-v2-to-starter-gap.md`; `founder-decisions.md` D1 |
| Hộp 3 khay, hướng dẫn lắp | Hộp xếp theo hành trình | Chưa có | `hw-v2-to-starter-gap.md` |
| (c) Bộ mở rộng E1 Xe dò đường, E2 Bộ điều khiển sáng tạo, E3 Tay gắp mini, E4 Trạm cảm biến môi trường | Mỗi bộ một lời hứa, một dự án, cần có Starter | Chưa có (mới có tên và nguyên tắc) | `mobot-starter-target.md` |
| Gói dự án số | Dự án đóng gói để tải, chia sẻ | Đang làm (có nền xuất/nhập dự án) | `baseline.md` (`projectBundle.ts`, `savedProjects.ts`) |

**Giả định cần xác nhận.** Chưa chốt tay cầm nằm trong mọi hộp hay bán rời (`founder-decisions.md` D7, khuyến nghị "tùy chọn"). Nội dung cho Starter luôn miễn phí là quyết định đã chốt (`mobot-starter-target.md`).

## 4. Hành trình người dùng 7 bước

**Dữ kiện từ repo** (`mobot-starter-target.md`; bước 7 ghi là đề xuất).

1. Mở hộp, quét QR để vào bài học.
2. Lắp xe rover từ lõi và khung.
3. Nhấn nút chào hỏi: ở V1 robot chỉ phát lời chào và hướng dẫn thu sẵn qua loa, không nghe người nói.
4. Tự lắp tay cầm và lái thử.
5. Làm thử thách vật cản: quan sát, chỉnh ngưỡng, thử lại.
6. Đổi sang cấu hình robot mini.
7. Dự án đầu tiên "Robot canh bàn học": có vật lại gần thì robot đổi mặt ngạc nhiên và nói câu cảnh báo do người học chọn.

**Giả định cần xác nhận.** Tài liệu chưa định nghĩa "robot mini" (`hw-v2-to-starter-gap.md`). Thời lượng hành trình và độ khó theo tuổi **[chưa kiểm chứng]**.

## 5. Môi trường và ràng buộc

**Dữ kiện từ repo.**

- **Local-first (chạy và lưu tại máy người dùng).** Web chạy trong trình duyệt, không cần tài khoản đám mây, bài học và bản nháp lưu trên thiết bị (`README.md`). Thống kê truy cập (Supabase, dịch vụ cơ sở dữ liệu) chỉ bật khi được cấu hình và chỉ ghi mã phiên ngẫu nhiên.
- **Offline.** Có bộ nhớ đệm để mở lại một số trang khi mất mạng; lần đầu cần có mạng, và chưa có kiểm thử offline thật (`README.md`; `luna-p1-review.md`, P1-04). Chưa kết luận offline đã tin cậy.
- **Vì sao board ESP32 30 chân.** ESP32 là bo vi điều khiển có sẵn Wi-Fi và Bluetooth, làm "bộ não" robot và tay cầm. Loại được chọn có 30 chân, cổng USB-C, niêm yết 140.000 đ/bo tại nhà bán trong nước (BOM r2, dòng B01), và web đã có mô hình 3D của loại này (`README.md`). Đây là board bán rời kiểu clone, không có sơ đồ chính hãng, kích thước và điện bên trong mới là ước lượng từ ảnh và web (`baseline.md`; `d10-founder-confirmation.md`).- **Nguồn và pin.** Robot dùng pin 2S (hai cell Li-ion nối tiếp, khoảng 8,4 V) cho hai động cơ N20, sạc qua USB-C (BOM r2, B05, B07). Nguồn tay cầm còn nhiều hướng chưa chốt (`hw-v2-to-starter-gap.md`). Mọi số đo thật (dòng, nhiệt, ngưỡng ngắt khi pin yếu) chưa đo (`baseline.md`).
- **An toàn trẻ em và chứng nhận.** Chưa có kế hoạch; tài liệu chỉ có một dòng "cần chuyên gia xác nhận" (`baseline.md`). Founder chưa ghi độ tuổi lên hộp cho tới khi chuyên gia xác nhận (`founder-decisions.md` D2) và không bỏ qua cổng chứng nhận (`d10-founder-confirmation.md`).
- **Phần cứng đã có và chưa có.** Đã có: tài liệu thiết kế, danh mục linh kiện dự toán, mô hình 3D board. Chưa có: bo mạch in, firmware ESP32, thiết kế khung, bản mẫu chạy thật (`baseline.md`).

**Giả định cần xác nhận.** Nguồn cung ESP32 và pin tại Việt Nam, quy định nhập khẩu pin Li-ion, quy định an toàn đồ chơi áp dụng cho kit này: **[chưa kiểm chứng]**, cần chuyên gia pháp lý.

## 6. Chi phí và chuỗi cung ứng đã biết

**Dữ kiện từ repo.** Số dưới đây là dự toán phần cứng V2 (một robot và một tay cầm), chưa phải giá vốn hộp Starter, chưa gồm hộp, tài liệu, kiểm thử, chứng nhận, vận chuyển, nhân công.

| Số liệu | Giá trị | Nguồn |
|---|---|---|
| Trần ngân sách mục tiêu | 1.000.000 đ | `founder-decisions.md` D11; `README.md` (kế hoạch) |
| Dự toán linh kiện | 1.194.128 – 1.714.128 đ | `docs/hardware/mobot-v2-bom-review-2026-11-05-r2-handoff.md`, "Ngân sách" |
| Kịch bản thấp vượt trần | 194.128 đ | cùng file |
| Phần có giá niêm yết (2 board, 2 động cơ, 2 pin, 1 cảm biến siêu âm), chưa phải giá giao tận nơi | 589.128 đ | cùng file |
| Board ESP32 30 chân USB-C | 140.000 đ/bo (niêm yết) | cùng file, B01 |
| Cảm biến HC-SR04 | 25.000 đ (niêm yết) | cùng file, B12 |

Mọi giá khác (màn hình, loa, mạch sạc, khung in, hộp, bộ mở rộng, giá bán lẻ) và khả năng cung ứng số lượng lớn **[chưa kiểm chứng]**. Chưa có báo giá trọn bộ (cùng file).

**Giả định cần xác nhận.** Dự toán vượt trần buộc founder chọn: giữ trần và cắt phạm vi, nâng trần, hoặc hai phiên bản (`founder-decisions.md` D11, khuyến nghị hai phiên bản). Giá bán lẻ do team business đề xuất.

## 7. Mức sẵn sàng

**Dữ kiện từ repo.** Kế hoạch có chín giai đoạn P0–P8 (`README.md` kế hoạch). Không ghi ngày.

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| P0 | Gỡ chốt chặn, chốt quyết định founder | Đang làm: D1–D4, D6, D10 chốt bằng lời; văn bản D10 chờ founder gửi (`founder-decisions.md`; `d10-founder-confirmation.md`) |
| P1 | Lõi web cục bộ, khung firmware | Đang làm: năm sửa lỗi web đã review, kiểm thử 371/371 đạt, e2e 30/30 đạt; sơ đồ tay cầm và firmware chưa có (`luna-p1-review.md`; `baseline.md`) |
| P2 | Mạch Starter, thiết kế KiCad | Chưa bắt đầu (chỉ outline) |
| P3 | Cơ khí hai cấu hình, tay cầm tự lắp | Chưa bắt đầu (outline) |
| P4 | Giọng nói tối thiểu, bài học theo hành trình | Chưa bắt đầu (outline) |
| P5 | Thử mẫu EVT/DVT, đo kiểm, an toàn | Chưa bắt đầu; chưa có tiêu chí vào/ra (`baseline.md`) |
| P6 | Web công khai, gói dự án số | Chưa bắt đầu; bản công khai đang bị chặn (`baseline.md`) |
| P7 | Thử sản xuất, đóng gói, chứng nhận | Chưa bắt đầu |
| P8 | Bộ mở rộng E1, chuẩn tương thích | Chưa bắt đầu |

Nguồn P2–P8: `README.md` kế hoạch ghi P0 và P1 viết đầy đủ, P2–P8 mới là outline. **Giả định cần xác nhận:** chưa có tiến độ thời gian, không suy ra ngày ra mắt.

## 8. Rủi ro lớn nhất

**Dữ kiện từ repo** (`README.md` kế hoạch, "5 rủi ro lớn"; `mobot-starter-target.md`, "Rủi ro đã nêu").

1. **Giá vốn vượt trần:** linh kiện dự toán 1,19–1,71 triệu đ so với trần 1 triệu đ, giá bán hợp lý có thể không đủ biên lợi nhuận.
2. **Pin và nguồn cho trẻ em chưa có hồ sơ an toàn:** nếu không đạt, sản phẩm có thể không bán hợp pháp cho học sinh.
3. **Chưa có kế hoạch chứng nhận và độ tuổi chưa chốt:** thời gian và chi phí kiểm định chưa biết, có thể kéo dài ngày ra mắt.
4. **Phạm vi lớn so với những gì đã có:** hai cấu hình, tay cầm, điều khiển web cùng lúc, trong khi chưa có firmware và bo mạch thật.
5. **Board 30 chân bán rời không sơ đồ, không số đo:** lô khác nhau có thể không tương thích, tăng chi phí hỗ trợ và đổi hàng.
6. **Kỳ vọng sai về giọng nói và khung giống thương hiệu khác:** rủi ro khiếu nại và hình ảnh thương hiệu. Quyết định D3 giảm rủi ro này: V1 chỉ phát lời chào thu sẵn, hộp không quảng cáo là trí tuệ nhân tạo hay trò chuyện tự nhiên.

## 9. Việc dành cho team business

**Giả định cần xác nhận.** Đây là câu hỏi, không phải kết luận; mỗi câu kèm dữ kiện từ repo.

1. **Quy mô thị trường Việt Nam** (phụ huynh, trường, trung tâm STEM, theo thành phố)? Repo: chỉ có quyết định "Việt Nam trước", không có số liệu.
2. **Đối thủ trực tiếp tại Việt Nam** (kit robot STEM: giá, kênh, độ tuổi)? Repo: không có. Nhóm sản phẩm dùng làm tham khảo thiết kế ở `D:\StartupOS\docs\mach-mo-product-master-2026-11-05.md` mục 3 và `D:\StartupOS\docs\research\2026-11-05-mach-mo-reference-coverage.md`; đây không phải danh sách đối thủ thị trường.
3. **Đối thủ gián tiếp** (lớp robot, khóa học online, đồ chơi lắp ráp)? Repo: không có.
4. **Định giá Starter và từng bộ mở rộng?** Repo: trần mục tiêu 1.000.000 đ, dự toán linh kiện 1,19–1,71 triệu đ, chưa gồm hộp, chứng nhận, kênh bán.
5. **Kênh bán** (trực tiếp, trường, trung tâm, thương mại điện tử)? Repo: web chưa có thanh toán hay cửa hàng (`README.md`).
6. **Độ tuổi mục tiêu?** Repo: hộp chưa ghi độ tuổi; độ tuổi quyết định phạm vi chứng nhận.
7. **Nhu cầu chứng nhận tại Việt Nam** (đồ chơi, thiết bị điện dùng pin cho trẻ em): yêu cầu, chi phí, thời gian? Repo: chưa có thông tin pháp lý.
8. **Doanh thu bộ mở rộng E1–E4** (bán lẻ, gói theo lớp, đăng ký)? Repo: mỗi bộ cần Starter, có một dự án; chuẩn lắp ghép phải công bố trước khi bán bộ đầu tiên; E1 ưu tiên cao (`mobot-starter-target.md`).
9. **Doanh thu gói dự án số** (miễn phí, trả một lần, theo lớp)? Repo: nội dung Starter luôn miễn phí; gói số ưu tiên cao, có nền xuất dự án (`baseline.md`).
10. **Tay cầm có nằm trong mọi hộp?** Repo: tay cầm là module riêng (D1); D7 chưa quyết.
11. **Hỗ trợ sau bán và bảo hành pin, linh kiện?** Repo: rủi ro được nêu, chưa có kế hoạch (`mobot-starter-target.md`).

## 10. Phụ lục

### 10.1 Bảng thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| ESP32 | Bo vi điều khiển (máy tính rất nhỏ) có Wi-Fi và Bluetooth, "bộ não" của robot |
| Board 30 chân | Bo ESP32 gắn sẵn trên mạch thử, có 30 chân nối ra ngoài |
| PCB | Bảng mạch in, tấm mạch gắn linh kiện |
| KiCad | Phần mềm miễn phí để vẽ sơ đồ và thiết kế PCB |
| SPICE | Phần mềm tính hành vi mạch điện (dòng, áp) |
| Local-first | Chạy và lưu dữ liệu tại máy người dùng, không bắt buộc mạng hay tài khoản |
| BOM | Bảng linh kiện và giá của sản phẩm |
| Firmware | Chương trình nạp trong bo mạch để điều khiển robot |
| EVT / DVT / PVT | Ba đợt thử mẫu trước khi sản xuất (kỹ thuật, thiết kế, sản xuất); dự án chưa có tiêu chí vào/ra |
| Pin 2S | Hai cell Li-ion nối tiếp, khoảng 8,4 V khi đầy |
| N20 | Loại động cơ nhỏ cho bánh xe robot |

### 10.2 Mâu thuẫn tài liệu (đã dùng `baseline.md` làm chuẩn)

1. `README.md` mô tả bộ nhớ đệm dùng offline; `luna-p1-review.md` ghi chưa có kiểm thử offline thật. Brief ghi "chưa kết luận".
2. `docs/MACH-MO-MVP-STATUS.md` ghi kiểm thử 335–349 đạt; `baseline.md` ghi 367/367; `luna-p1-review.md` ghi 371/371.
3. `D:\StartupOS\docs\mach-mo-product-master-2026-11-05.md` mục 7 ghi baseline 352/354, cũ hơn `baseline.md`; `docs/MACH-MO-MVP-STATUS.md` có dòng "BOM thiếu jumper và cáp USB" mà đầu chính file đó đã đính chính.
4. `mobot-starter-target.md` coi giọng nói là lõi V1 cần xác thực; D3 chốt chỉ lời chào thu sẵn, không mic. Brief theo D3.
5. `mobot-starter-target.md` có mic và hai cấu hình; phần cứng V2 không mic, một khung hai động cơ (`hw-v2-to-starter-gap.md`).
6. `README.md` nói không cần tài khoản nhưng có trang quản trị Supabase tùy chọn; brief ghi cả hai.
7. Biên bản `docs/hardware/mobot-v2-founder-decision-q1-q8.md` được nhắc trong `d10-founder-confirmation.md`; brief chưa xác nhận file tồn tại.

### 10.3 File nguồn đã dùng

`mobot-starter-target.md`, `README.md` (kế hoạch), `baseline.md`, `hw-v2-to-starter-gap.md`, `founder-decisions.md`, `slices.md`, `d10-founder-confirmation.md`, `luna-p1-review.md`, `research-intake-review.md`; `D:\StartupOS\docs\mach-mo-product-master-2026-11-05.md`; `D:\StartupOS\docs\research\2026-11-05-mach-mo-reference-coverage.md` (chỉ đọc đề mục); `docs/hardware/mobot-v2-bom-review-2026-11-05-r2-handoff.md`; `README.md` và `docs/MACH-MO-MVP-STATUS.md` của dự án (đọc 80 dòng đầu).
