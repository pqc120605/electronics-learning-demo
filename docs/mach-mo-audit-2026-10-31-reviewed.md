# Audit toàn diện Mạch Mở — 31/10/2026
## Ghi chú biên tập Codex — 31/10/2026

Bản này giữ ID D1–D29 của audit Claude gốc, làm rõ nguồn bằng chứng, cập nhật phát hiện tài liệu và bổ sung D30 về asset STM32 còn trong thư mục public. File đính kèm gốc được giữ nguyên.

Codex không chạy lại test/build hay thao tác trình duyệt trong lượt biên tập này. Kết quả chạy ở mục G là do audit gốc báo cáo, chưa được Codex xác minh độc lập. Các nhãn “Quan sát”, “probe”, “suy luận” và “giả thuyết” dưới đây là cách audit gốc mô tả bằng chứng; chúng không có nghĩa Codex đã tái hiện lại. Quan sát ở viewport 375 px là emulation trình duyệt, không phải kiểm thử trên điện thoại cảm ứng thật.

### Trạng thái sản phẩm được làm rõ

- Viewer đang phát hành trên UI: 7 viewer 3D board và 4 viewer PCB 2D. Tổng 9 file GLB trong public vẫn có thể gồm 7 model đang phát hành, 1 model STM32 đã gỡ khỏi UI và 1 cảnh lắp ráp.
- Model STM32 SinaKarvandi đã bị gỡ khỏi viewer/catalog/bài học. Các file GLB, manifest và license vẫn còn trong public; test đảm bảo asset còn tồn tại và ID không được UI tham chiếu. Đây không chứng minh file không thể truy cập trực tiếp hoặc không đi vào bản build.
- Bài LDR có Vout từ mô hình chia áp giáo dục; không tính lux, đặc tuyến LDR thật hay ADC vật lý. Các ghi chú lịch sử có ngày được giữ như lịch sử; các câu hiện trạng cần đồng bộ riêng.
- Lưu project/snapshot trên thiết bị khác với lưu tiến độ học tập. Web có lưu project cục bộ, nhưng chưa lưu việc hoàn thành bài học.
- Không có code app riêng được xác nhận trong repo Mạch Mở. PWA là web có thể cài; desktop companion là hướng được mô tả trong tài liệu. Cần quyết định rõ roadmap và cách gọi, không xem /app là ứng dụng native.

### Phạm vi xác minh của bản chỉnh lý

Codex đối chiếu mã nguồn/tài liệu tĩnh cho số viewer, trạng thái asset STM32, tài liệu LDR và cách diễn giải lưu project. Codex chưa chạy lại các phát hiện D1–D29, test, build hoặc browser; vì vậy các phát hiện đó vẫn là kết quả được audit Claude gốc báo cáo.

## A. Tóm tắt điều hành
Chất lượng tổng thể: nền nội dung và phần công bố giới hạn đã tốt, nhưng luồng lõi chưa sẵn sàng cho người mới. npm.cmd test đạt 28/28 và build đạt, nhưng test gần như không bảo vệ các luồng người dùng. Tôi tái hiện được nhiều lỗi nghiêm trọng mà bộ test không bắt được.

### Điểm mạnh

Nhãn năng lực mô phỏng rõ và nhất quán. Web không tuyên bố quá mức về firmware hay SPICE.
Audit gốc báo cáo probe 231/231 tổ hợp 21 board × 11 bài chạy qua đường kiểm tra hiện tại. Kết quả này không chứng minh topology có ý nghĩa cho mọi tổ hợp: D8 trong chính audit cho thấy validator có thể báo hợp lệ dù đã xóa toàn bộ dây.
Các route chính không tràn ngang ở 375 px; bản mô phỏng di động này có thanh Menu hoạt động.
Các model đang phát hành có nguồn và giấy phép. Riêng model STM32 SinaKarvandi đã bị gỡ khỏi các luồng UI, nhưng asset vẫn nằm trong public/. Test khóa việc tham chiếu model từ UI và đồng thời yêu cầu asset lưu trữ còn tồn tại; điều đó không chứng minh asset không thể truy cập trực tiếp hoặc không được đưa vào bản build.
Audit gốc kết luận công thức của bốn bộ tính đúng; phần báo cáo chưa liệt kê phép đối chiếu và nguồn kỹ thuật cho từng công thức, nên Codex chưa xác minh độc lập kết luận này.
Có project cục bộ, revision và xuất/nhập.
### Rủi ro chính

Bước “Chạy và quan sát” ẩn toàn bộ mạch và thông báo.
Dữ liệu người học có thể mất, trong khi giao diện lại báo là vẫn giữ.
Một file project hỏng làm /build trắng trang vĩnh viễn.
Sketch .ino xuất ra phần cứng có thể sai ngưỡng, trùng chân hoặc dùng chân flash của ESP32.
Lộ trình 3 bước bị đứt và bước 3 không kiểm tra mạch.
Tài liệu chưa chốt lộ trình và ranh giới giữa PWA có thể cài và desktop companion.
### Giới hạn của audit

Không có code app riêng của Mạch Mở. D:\StartupOS\app là startup-os-web, không phải sản phẩm này.
Chưa kiểm tra Supabase thật, thiết bị thật, phần cứng hay người dùng thật.
## B. Bản đồ tính năng
### Web
| Tính năng | Người dùng | Trạng thái | Bằng chứng | Giới hạn |
| --- | --- | --- | --- | --- |
| Landing, footer quyền riêng tư | Người mới, phụ huynh | Đã triển khai | Route /, đã mở UI | Trang 404 ghi “đang được xây dựng” |
| Dashboard /app, lộ trình 3 bước | Người mới | Một phần | AppHomePage.tsx:7-11, đã mở UI | Không có tiếp tục học, không lưu hoàn thành |
| Bài ESP32 LED và 3D | Người mới | Đã triển khai | /learn/esp32-led, GLB tải được | Checklist và code mất khi tải lại |
| /build 4 bước, 11 bài | Người học | Một phần | Đã thao tác UI | Xem D1, D3, D4, D8 |
| Parser subset (8 bài) | Người học | Một phần | educationalProgram.ts | Nhận cả mã ngoài phạm vi (D14) |
| Kịch bản khái niệm (3 bài) | Người học | Đã triển khai | Probe topology; luồng UI chưa chạy riêng | Không tính điện thật |
| Schematic và 3D bàn lắp | Người học | Chưa xác minh | Có code, chưa thao tác |  |
| PCB 2D | Người học | Đã triển khai | Pcb2DViewer.tsx:14-19, 4 board | Docs ghi 5 |
| Viewer 3D board | Người học | Đã triển khai | Test: 7 model phát hành | Docs ghi 8 |
| /boards (21 profile), so sánh | Người tự học | Đã triển khai | Đã mở trên mobile | Trang dài 11.538 px |
| /components (48 mục theo status) | Người tự học | Đã triển khai | Đã mở trên mobile | Link sang /build chung chung |
| Project: lưu, mở, nhân bản, revision | Người học | Một phần | savedProjects.ts, đã thao tác | Xem D2, D10, D13 |
| Xuất/nhập .machmo.json | Người học | Một phần | Có | Hai bộ kiểm tra khác nhau |
| Xuất .ino | Người chuyển sang phần cứng | Một phần | Có | Xem D6, D7 |
| Kiểm tra HEX, AVR8js | Người có nền | Đã triển khai | Test đạt; UI chỉ mở trang | Chỉ ATmega328P |
| Bộ tính điện tử | Người học | Đã triển khai | Đã thao tác | Không có trong menu Công cụ |
| Admin, analytics | Founder | Chưa xác minh | Code, migration, màn “chưa cấu hình” | Chưa có Supabase |
| Web manifest | Người dùng | Đã triển khai | Có link manifest | Không service worker, không offline |
| Góp ý sau bài | Người học | Chỉ có trong tài liệu | Backlog MM-03 | Chưa có nơi nhận |
### App
Chưa thấy code app riêng. Mục “PWA” dưới đây chỉ là web cài được.

| Khả năng | Người dùng | Trạng thái | Bằng chứng | Giới hạn |
| --- | --- | --- | --- | --- |
| App PWA | Người học | Một phần | Manifest; spec 31/10 | Chưa offline, chưa có hướng dẫn cài |
| App desktop companion | Người làm dự án sâu | Chỉ có trong tài liệu | product-landscape…:233 | Chưa chốt là hướng dài hạn hay bị PWA thay thế |
| Tài khoản học viên, đồng bộ | Người học | Chỉ có trong tài liệu | Spec §1, §4.2 | Chỉ có admin |
| Lưu tiến độ học tập | Người học | Chưa có | /app tự nói chưa lưu | Khác với lưu project cục bộ |
| Nút “Mở trong App”, deep link | Người học | Chỉ có trong tài liệu | product-landscape…§5 | File .machmo.json là cầu nối duy nhất |
| USB/serial, toolchain, debug | Người nâng cao | Chỉ có trong tài liệu | Landscape §4 |  |
| SPICE, firmware đa MCU | Người nâng cao | Chỉ có trong tài liệu | Landscape giai đoạn D |  |
| Giáo viên, lớp học | Giáo viên | Chỉ có trong tài liệu | Spec §2.2 | Không có luồng nào |
Ranh giới web/app hiện tại: mọi thứ đều ở web. Nhãn “Mở ứng dụng” dẫn tới /app, trong khi đó chỉ là một trang web. Project chỉ đi qua file thủ công. Không có trùng lặp tính năng vì app chưa tồn tại, nhưng thông điệp đã tạo cảm giác có app.

## C. Luồng người dùng
Ghi chú: “Quan sát” là đã thấy trên UI hoặc qua đo DOM; “Suy luận” là đọc từ code.

| Luồng | Đi từ → đến | Lưu ở đâu | Điểm đứt | Mobile/người mới | Bằng chứng |
| --- | --- | --- | --- | --- | --- |
| Khám phá → bài đầu | / → /learn/esp32-led | Không | Rõ ràng, chỉ có một CTA chính | Tốt | Quan sát |
| Hoàn thành bài LED | Bài LED → “Khám phá thêm” | Chỉ trong RAM | Link kết thúc về /, không sang bước 2; checklist mất khi tải lại | Trang dài 9.428 px | Quan sát |
| Lộ trình bước 2–3 | /app → /build?…&guided=1 | sessionStorage theo tab | Đóng tab là mất; không có nút sang bài sau; bước 3 không kiểm tra mạch | Xem bên dưới | Quan sát + suy luận |
| Chọn bài từ /projects | Thẻ bài → /build | localStorage | Mọi thẻ đều trỏ /build, không mở đúng bài | Phải chọn lại | Suy luận từ dữ liệu curriculumSchema.ts |
| Lắp → code → chạy | 4 bước trong /build | localStorage, tự lưu | Bước Chạy ẩn mạch và thông báo; tải lại quay về bước 1 | Mạch bị cắt và chồng lên nhau | Quan sát |
| Lưu → mở → sửa → lưu | /build ↔ /projects | localStorage | Mở lại mất tên project, lưu tạo project mới | Tên bị ép còn “Nút ı” | Quan sát |
| Chuyển máy | Xuất file → nhập | File | Project không dây không nhập lại được | Chưa thử | Quan sát |
| Sang phần cứng | Xuất .ino → Arduino IDE | File | Sketch có thể sai với phần cứng |  | Quan sát nội dung file |
| Công cụ | Menu → tool | Không | Bộ tính không có trong menu Công cụ | Không tràn | Quan sát |
| Quản trị | /admin | Supabase | Có trạng thái chưa cấu hình rõ ràng |  | Quan sát một phần |
| Giáo viên, mentor | Không có | Không | Luồng không tồn tại |  | Suy luận |
### Cần kiểm chứng trực tiếp

Thao tác cảm ứng thật.
Người mới có hiểu bốn bước không.
Mô phỏng tiếp tục ra sao khi xóa dây lúc đang chạy.
Thời gian tải GLB 15,9 MB trên mạng di động.
## D. Phát hiện theo audit gốc
### High
D1. Bước “Chạy và quan sát” không cho quan sát mạch

Vị trí: src/styles/app.css:773, thông báo ở src/pages/CircuitBuilderPage.tsx:410
Bằng chứng: .builder-main{display:none}. Ở bước này, canvas và .builder-message đo được 0×0. Khi nhập code lỗi, thông báo không hiển thị.
Suy luận: lỗi sai chân hoặc sai thứ tự khối chỉ nằm trong thông báo, nên bấm Chạy sẽ không thấy gì.
Tác động: tính năng tô sáng dây và LED trên mạch không xuất hiện đúng lúc người học cần xem.
Sửa tối thiểu: giữ canvas ở chế độ chỉ xem trong bước Chạy và đưa thông báo vào inspector.
D2. File project hỏng làm /build trắng trang vĩnh viễn

Vị trí: src/pages/ProjectsPage.tsx:64-72, src/lib/projectBundle.ts:18-29, src/pages/CircuitBuilderPage.tsx:85
Tái hiện: ở /projects, nhập bundle có placed:[null,{id:'x'}], lưu rồi bấm Mở. Kết quả là TypeError: Cannot read properties of null (reading 'id'), #root rỗng.
Tác động: dữ liệu lỗi nằm trong localStorage nên tải lại vẫn trắng. Người dùng thường không tự khôi phục được. App không có ErrorBoundary.
Sửa tối thiểu: dùng chung một bộ kiểm tra sâu cho mọi đường nhập, đồng thời thêm ErrorBoundary có nút khôi phục.
D3. “Đặt lại bài” xóa bản nháp nhưng báo vẫn giữ

Vị trí: src/pages/CircuitBuilderPage.tsx:292, :352-361
Tái hiện: thêm // MY PRIVATE DRAFT, bấm Đặt lại bài. Bản nháp trong machmo-lesson-drafts biến mất, nhưng thông báo ghi “bản nháp cũ vẫn được lưu”.
Tác động: mất code của người học, và thông báo sai khiến họ không đề phòng. Theo code, “Khôi phục code mẫu” cũng dùng cùng hàm updateCurrentCode (:292).
Sửa tối thiểu: lưu bản nháp cũ thành slot riêng có thể hoàn tác, hoặc đổi thông báo và hỏi xác nhận.
D4. Bấm thẻ bài ghi đè mạch tự lắp mà không hỏi

Vị trí: src/pages/CircuitBuilderPage.tsx:343-351
Tái hiện: thêm linh kiện rồi bấm lại đúng thẻ bài đang chọn. Linh kiện mất, confirm được gọi 0 lần.
Sửa tối thiểu: hỏi xác nhận khi mạch khác preset, kèm tùy chọn lưu trước.
D5. Thông báo khôi phục workspace sai sự thật

Vị trí: src/pages/CircuitBuilderPage.tsx:181, :220
Tái hiện: đặt machmo-builder-session thành JSON hỏng rồi tải lại. Thông báo nói dữ liệu cũ vẫn được giữ, nhưng dữ liệu đã bị ghi đè ngay.
Sửa tối thiểu: sao lưu sang khóa …-backup trước lần lưu đầu tiên, rồi mới hiện thông báo.
D6. Sketch analog xuất ra sai ngưỡng trên phần cứng

Vị trí: src/data/builderLessons.ts:21, :27; src/pages/CircuitBuilderPage.tsx:189
Bằng chứng: sketch có int potPercent = analogRead(potPin); if (potPercent > 50). Mô phỏng hiểu thang 0–100.
Tác động: trên Uno, analogRead trả 0–1023 nên LED bật ở khoảng 5% thay vì 50%. Giá trị này là kiến thức chung; trang tài liệu Arduino tôi mở trả về rỗng nên chưa đối chiếu lại. Header sketch cũng không cảnh báo riêng.
Sửa tối thiểu: xuất sketch có quy đổi theo độ phân giải ADC của board, hoặc chặn xuất với thông báo rõ.
D7. Sketch hợp lệ theo app nhưng sai chân trên board thật

Vị trí: src/data/builderLessons.ts:57, :97, :102; src/lib/arduinoSketchExport.ts:16-31
Bằng chứng từ probe:
Bài 7 đoạn trên ESP32 dùng {2, 3, 4, 5, 6, 7, 8}. GPIO 6–8 thường nối flash tích hợp (tài liệu Espressif).
ESP32-S3 và S2 dùng cùng GPIO 4 cho ADC và LED.
Pico, Pico W, Pico 2: ECHO là 15, trùng LED GP15.
Tác động: xuất sketch vẫn thành công, người học chỉ gặp lỗi khi đã nạp lên board.
Sửa tối thiểu: khai báo chân riêng theo profile, và thêm kiểm tra trùng chân cùng chân cấm.
D8. Bài biến trở báo mạch đúng dù không có dây nào

Vị trí: src/lib/circuitValidation.ts:50, :83
Tái hiện: xóa cả 6 dây rồi Chạy. UI vẫn báo “Topology yêu cầu của bài học đã được nối” và mô phỏng vẫn chạy.
Tác động: đây là bước 3 của lộ trình. Test “all presets” cũng đạt một cách vô nghĩa vì bài này không có luật riêng.
Sửa tối thiểu: thêm nhánh kiểm tra cho analog-potentiometer, kèm test mạch thiếu dây.
### Medium
| # | Phát hiện | Vị trí | Bằng chứng | Sửa tối thiểu |
| --- | --- | --- | --- | --- |
| D9 | Thay linh kiện rồi nối đúng vẫn bị báo sai, không chạy được | circuitValidation.ts:51, CircuitBuilderPage.tsx:187, :339 | Quan sát: validator cần đúng res-1, linh kiện mới có ID khác | Kiểm tra theo loại linh kiện và đồ thị dây |
| D10 | Mở project mất tên, Lưu tạo project khác | CircuitBuilderPage.tsx:183, savedProjects.ts:72-77 | Quan sát: “Den phong ngu” sinh thêm “LED nhấp nháy” | Lưu activeProjectId khi mở |
| D11 | “Chạy từng bước” bài LED luôn HIGH | CircuitBuilderPage.tsx:380, educationalProgram.ts:91 | Quan sát: 4 bước đều HIGH. Bước nhảy đúng một chu kỳ | Bước theo từng pha on/off |
| D12 | ?lesson= không có guided=1 bị bỏ qua; ?board= bị bỏ qua | CircuitBuilderPage.tsx:119, curriculumSchema.ts:30-40, LessonPage.tsx:160 | ?board=arduino-uno-r3 vẫn mở ESP32 (quan sát); ?lesson= đọc từ code | Đọc tham số và đổi route theo bài |
| D13 | Project không dây bị hỏng khi tải lại và khi nhập | CircuitBuilderPage.tsx:93, :265 | Quan sát: bài biến trở 0 dây → 3 dây LED sau tải lại; nhập báo lỗi | Phân biệt “mảng rỗng” với “không có dữ liệu” |
| D14 | Parser nhận mã ngoài phạm vi | educationalProgram.ts:15, :37 | Probe: if trong blink, mã trong /* */, lệnh sau else đều được nhận | Từ chối block comment; kiểm tra cấu trúc thân loop |
| D15 | Khối cho thêm nhưng parser từ chối; khôi phục ví dụ về chân sai | BlockCodeWorkspace.tsx:28-33, :46, educationalProgram.ts:56 | Quan sát: thêm khối chờ thứ ba thì bị lỗi; trên Uno ra GPIO 23 | Giới hạn khối hoặc mở rộng parser; truyền chân theo board |
| D16 | Alias board không nhất quán | simulationTargets.ts:26, :34, :41-42; builderLessons.ts:100, :104 | F401RE dùng 13, F411/L476/F446 dùng 5 cho cùng PA5; Uno R4 hiện “PA0” | Bảng chân theo core, kèm nguồn |
| D17 | Code hiển thị bị thay chuỗi | LessonPage.tsx:53 | Quan sát: delay 1500 và thanh 700 cho ra delay(1700); nút sao chép dùng chuỗi này | Bỏ replaceAll, dùng một nguồn dữ liệu |
| D18 | Lộ trình không có bước tiếp | LessonPage.tsx:233 | Link kết thúc về / | Thêm “Bài tiếp theo” |
| D19 | Canvas trên mobile dùng khó | CircuitBuilderPage.tsx:408, :388 | Đo: board lệch −62 px, 5 cặp chồng nhau; 50 mục tương tác dưới 32 px. Linh kiện là div chỉ có onClick, kéo bằng HTML5 | Chế độ di chuyển bằng chạm và bàn phím |
| D20 | Tài liệu hiện trạng lệch code | README :61, :78, :89-90, :98, :104; status :8, :23, :31, :34-36, :109, :111; landscape :123, :126, :233; board-model-sourcing :19 | Số viewer UI 8/5 thay vì 7/4; README :98 còn 10 thẻ; mô tả LDR; STM32 đã gỡ khỏi UI nhưng asset còn trong public; README cần nói rõ tiến độ học tập; ranh giới PWA/desktop chưa chốt | Cập nhật nội dung hiện trạng; giữ log có ngày; chốt ranh giới web/app |
| D21 | Không đo được luồng học | LessonPage.tsx:111-120, analytics.ts | code_copy không được gửi; /build không có sự kiện riêng | Thêm vài sự kiện chạy và hoàn thành trong allowlist |

### Chi tiết D20 để tránh sửa nhầm tài liệu lịch sử

- **Viewer:** trạng thái UI hiện là 7 viewer 3D board và 4 viewer PCB 2D. README các dòng 78, 89–90, status các dòng 8, 35–36, 111, landscape dòng 123 và board-model-sourcing dòng 19 cần phân biệt viewer đang phát hành với model STM32 lưu trữ. README dòng 90 có thể vẫn đúng về 9 file GLB tổng: 7 model board đang phát hành, 1 model STM32 không phát hành và 1 cảnh lắp ráp. Status dòng 14 và dòng 21 ghi 4 viewer PCB 2D là đúng.
- **Bộ bài:** README dòng 98 còn ghi 10 thẻ; phần hiện trạng nên là 11. Giữ số 10 trong các ghi chú lịch sử có ngày.
- **LDR:** sửa các câu hiện trạng nói không tính điện áp/Vout ở status dòng 23 và 109, README dòng 104, landscape dòng 126; code hiện tính Vout của mô hình giáo dục. Status dòng 82 nằm trong ghi chú có ngày nên giữ như lịch sử. Các dòng 31 và 34 trong mục status ngày 30/10 cần được viết lại nếu còn dùng như hiện trạng. Giới hạn vẫn là không tính lux, đặc tuyến LDR thật hay số đếm ADC vật lý.
- **Tiến độ:** README dòng 61 nên nói rõ chưa lưu tiến độ học tập; lưu project/snapshot cục bộ đã có là năng lực khác.
- **Web/app:** /app là route trong web và PWA hiện là web có thể cài. Desktop companion nằm trong định hướng tài liệu; cần thống nhất roadmap, không gọi route /app là native app.
- **STM32:** thiết kế custom đã gỡ khỏi UI, không cần đổi tên nhãn cho người học. Asset còn trong public/ được tách thành D30.
- **Bộ tính:** README nên liệt kê route /tools/electronics-calculators; D25 vẫn nêu riêng việc menu Công cụ chưa có lối vào.
#### D30. Medium — model STM32 đã gỡ khỏi UI nhưng asset vẫn nằm trong public/

Vị trí: public/models/stm32-bluepill-sinakarvandi.glb; public/boards/stm32-bluepill-sinakarvandi/manifest.json và LICENSE.txt; tests/board-model-assets.test.mjs:8-9, 14-16, 41-51.

Bằng chứng: test yêu cầu GLB, manifest và source CAD được giữ; đồng thời khẳng định ID không xuất hiện trong viewer/catalog/bài học và communityBoardModels rỗng. Các asset vẫn nằm trong public/. Vite phục vụ public assets tại root trong dev và sao chép chúng vào dist khi build. Audit này chưa xác minh URL production.

Tác động: model không hiện trong UI nhưng người biết URL vẫn có thể truy cập asset; bản build tiếp tục mang theo chúng. Đây là quyết định lưu trữ/phân phối cần chốt, không phải vấn đề đổi nhãn. Không đủ bằng chứng để kết luận có vi phạm license.

Hướng xử lý: nếu tiếp tục phân phối asset, giữ attribution/license và xác nhận nguồn tương ứng có thể truy cập cùng bản phát hành. Nếu chỉ lưu trữ nội bộ, chuyển asset khỏi public/ và cập nhật test để kiểm tra vị trí archive thay vì yêu cầu asset trong public/.

### Low
D22. Microcopy
Hướng dẫn nhanh nói nút và IR chỉ có C++ (CircuitBuilderPage.tsx:435), nhưng chúng có khối.
UI ghi “Blockly” (:398) dù không dùng thư viện đó.
Mã thô source-backed, 3d-verified lộ ra UI (BuilderToolbar.tsx:32).
D23. Stepper: hiện dấu ✓ trước khi làm (CircuitBuilderPage.tsx:402).
D24. Trang 404: ghi “đang được xây dựng” và dùng tiêu đề trang chủ (App.tsx:26-34).
D25. Điều hướng: menu Công cụ thiếu bộ tính (SiteNavigation.tsx:37-42).
D26. Bộ tính I²C: nhận 1000 pF ở chế độ Standard mà không cảnh báo, trong khi giới hạn chuẩn thường là 400 pF; cần đối chiếu UM10204. UI ghi “tần số góc” cho giá trị Hz; nên ghi “tần số cắt”.
D27. Giới hạn nhập khác nhau: /projects 5 MB, /build 10 MB.
D28. Tài sản chưa dùng trong luồng UI; cần quyết định vị trí lưu trữ:
src/data/stm32-bluepill-sinakarvandi-manifest.json không được import (140 KB).
public/boards/arduino-uno-r3/ không thấy src/ tham chiếu. Vì nằm trong public/, file có thể vẫn được phục vụ trực tiếp/đưa vào build; xác nhận có cần giữ ở đó không trước khi xóa.
D29. Footer analytics: câu ghi chú thiếu link chính sách, dù nội dung là đúng.
Bảo mật và quyền riêng tư: không thấy XSS trong các phần đã đọc; dữ liệu nhập được React escape. RLS đọc có giới hạn admin. Chèn sự kiện ẩn danh dùng with check (true) và không có giới hạn tốc độ (0001_analytics_and_admin.sql:51-55), nên có thể bị spam. Đây là rủi ro theo thiết kế, chưa thử thực tế.

Asset và license: boardModelSources.ts ghi nguồn và giấy phép đầy đủ cho model đã phát hành. Repo chưa có file LICENSE gốc; với CC BY-SA và GPL, cần người có thẩm quyền xác nhận trước khi phát hành công khai.

## E. Cơ hội cải thiện và câu hỏi mở
Cơ hội cải thiện

Thẻ “Tiếp tục” ở /app, dùng workspace và project gần nhất.
Lưu bước /build và tên project khi tải lại.
Ở /projects, tách project cá nhân khỏi danh mục bài. Hiện tiêu đề “Dự án” gộp cả hai.
Dùng một parser duy nhất. Hiện /learn và /build chấp nhận chương trình khác nhau (D15).
Ý kiến thiết kế

Bài LED đang ở hai nơi với hai trải nghiệm: /learn và /build. Nên coi /learn là lý thuyết và dẫn thẳng sang bài thực hành tương ứng.
Trang /boards quá dài trên mobile; nên thu gọn chi tiết theo board.
Giả thuyết cần kiểm chứng

Người mới hiểu và dùng được 4 bước. Cần 2–3 buổi thử có quan sát.
GLB Mega 15,9 MB chấp nhận được trên mạng di động.
Người học thực sự xuất sketch sang phần cứng.
Giáo viên là nhóm cần ưu tiên. Hiện chưa có dữ liệu.
Cần quyết định

App v1 là PWA hay desktop?
Sketch xuất ra có phải đạt chuẩn chạy được trên board không? Nếu có, cần test trên board thật cho từng profile được bật.
Nơi nhận góp ý người dùng là đâu?
Cần kiểm tra phần cứng: bài LED ESP32, bài biến trở sau sửa D6, sơ đồ chân NUCLEO và Uno R4.

Hạn chế về kiến trúc: CircuitBuilderPage.tsx nặng 84 KB, gom state, migrate dữ liệu, preset và luật sáng dây. Không cần rewrite. Nên tách workspaceStorage, lessonRules và preset theo đúng các lát sửa dưới đây.

## F. Lộ trình cho Codex
| # | Lát cắt | Vấn đề và người bị ảnh hưởng | Sửa nhỏ nhất, khu vực | Nghiệm thu | Kiểm tra | Rủi ro |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mở lại bước Chạy | D1, mọi người học | app.css:773; thông báo vào inspector | Thấy mạch và lỗi ở bước Chạy | Browser, 3 kích thước | Bố cục hẹp |
| 2 | Chống trắng trang và kiểm tra nhập | D2, D13, D27 | projectBundle, ErrorBoundary | File hỏng bị từ chối; project 0 dây nhập được | Test parse + browser | Project cũ không hợp lệ |
| 3 | Bảo vệ dữ liệu | D3, D4, D5 | Backup, hỏi xác nhận, sửa thông báo | Hoàn tác được; không ghi đè im lặng | Test localStorage | Hỏi quá nhiều |
| 4 | Sửa topology | D8, D9 | circuitValidation: bài biến trở, ID linh kiện | Thiếu dây thì báo lỗi; linh kiện mới nối đúng vẫn chạy | Test đơn vị cả 11 bài | Lệch ledPathValid |
| 5 | An toàn sketch | D6, D7, D16 | Bảng chân và ADC theo profile; thu hẹp board được xuất | Không trùng chân, không chân cấm | Test ma trận 21×11 | Phải kiểm nguồn từng board |
| 6 | Sửa mô phỏng | D11, D14, D15 | step(), parser | Bước đổi HIGH/LOW; mã lạ bị từ chối | Test probe parser | Từ chối nhầm mã mẫu |
| 7 | Nối luồng | D10, D12, D18 | activeProjectId, ?lesson, ?board, nút bài tiếp | Đi hết 3 bước không quay về / | Browser | Va chạm với guided session |
| 8 | Mobile và bàn phím | D19, D22 | Di chuyển bằng chạm và phím | Lắp xong bài LED ở 375 px | Thiết bị thật | Thay đổi canvas lớn |
| 9 | Đồng bộ tài liệu và bộ tính | D20, D24–D26, D28 | README, status, landscape | Số liệu khớp 7/4/11/21 | Đối chiếu | Thấp |
| 10 | Đo lường và test E2E | D21, thiếu test luồng | Sự kiện chạy/hoàn thành; thêm test trình duyệt | 5 luồng lõi có test | CI | Cần chốt công cụ, thêm dependency |
### 3 việc nên làm tiếp theo

Giao lát 1 (bước Chạy) cho Codex.
Làm lát 2 và 3 để chặn mất dữ liệu và trắng trang.
Tạm tắt “Xuất sketch” ở các bài và board bị D6, D7 cho tới khi xong lát 5.
## G. Kiểm chứng và skills
### Đã chạy theo audit gốc

| Lệnh, thao tác | Kết quả |
| --- | --- |
| npm.cmd test | 28 đạt, 0 lỗi |
| npm.cmd run build | Đạt: 148 module, entry JS 280,43 kB, ghi lại thư mục dist/ đã ignore |
| Probe Vite SSR | 231/231 tổ hợp đạt, cùng các kết quả D6–D8, D11, D14, D16 |
| npm.cmd run preview cổng 5199 | Đã mở bằng built-in browser, đã dừng và xác nhận không còn phản hồi |
| Browser desktop | /build, /projects, /admin, 404 |
| Browser mô phỏng 375×812 | /build guided, /learn, /boards, /components, bộ tính, HEX, /topics, /app |
Script probe nằm ở C:\Users\ACER\AppData\Local\Temp\claude\D--StartupOS-electronics-learning-demo\35484768-4c42-49e0-ac1d-6eb8a0cf596e\scratchpad\audit-matrix.mjs. Tôi đã xóa dữ liệu thử trong trình duyệt. Không sửa file nguồn, không commit, không cài package. .env thật không được mở.

### Chưa kiểm tra

Supabase thật, đăng nhập admin, chính sách RLS khi chạy thực tế.
Chế độ Schematic, 3D bàn lắp và PCB trong /build; chạy AVR8js trong UI.
Viewer 3D ngoài ESP32 trên trang học.
Thiết bị cảm ứng thật, Safari, Firefox, trình đọc màn hình, độ tương phản, cài PWA, quota localStorage.
Board thật và người dùng thật.
Phần tài liệu đã đọc: đầy đủ CLAUDE.md, README, status, landscape, brief. Với spec web/app và backlog tôi đọc phần đầu, với blueprint chỉ đọc đề mục. Các plan còn lại chưa đọc.

Trích dẫn: tài liệu Espressif đã mở được. Trang Arduino analogRead trả về rỗng, nên dải 0–1023 và giới hạn I²C 400 pF là kiến thức chung, chưa đối chiếu nguồn trong lượt này.

### Skills

Thực sự dùng: anthropic-skills:built-in-browser.
Có sẵn nhưng không gọi: code-review. Skill này nhắm vào diff, còn repo cha thấy cả thư mục là chưa tracked, nên tôi review thủ công theo checklist của bạn.
Không khả dụng trong phiên: testing-strategy, webapp-testing, system-design, tech-debt, product-brainstorming. Tôi đánh giá các chiều này thủ công.
UX Audit cộng đồng: không đọc và không chạy. Tôi dùng checklist UX trong yêu cầu của bạn.
Không gọi Codex, không spawn agent, không cài skill.
## Chỉnh sửa trong bản này

- Giữ ID D1–D29; D20 nêu rõ số lượng viewer, tài liệu LDR, tiến độ học và ranh giới web/app.
- Ở thời điểm biên tập lần đầu, phân biệt 7 viewer 3D và 4 viewer PCB 2D với 9 GLB trong `public/`; mục H bên dưới ghi việc chuyển asset STM32 khỏi `public/` và số lượng hiện tại.
- Bổ sung D30 về model STM32 đã gỡ khỏi UI nhưng asset vẫn được Vite phục vụ/build; đây là quyết định phân phối/license, không kết luận vi phạm.
- Ở thời điểm biên tập lần đầu chưa chỉnh code/tài liệu sản phẩm và chưa chạy test/build; phần H ghi các thay đổi và kiểm chứng thực hiện sau đó.
## H. Theo dõi sau khi triển khai bản sửa · 31/10/2026

Phần này bổ sung kết quả sửa lỗi sau audit; các phần A–G phía trên giữ nguyên nguồn gốc và những gì audit Claude ban đầu đã ghi nhận. Đây là trạng thái của checkout hiện tại, không phải xác nhận đã triển khai lên production.

### Đã sửa trong code/tài liệu

- **D1–D5:** bước chạy giữ canvas và thông báo; bundle/workspace được kiểm tra sâu hơn và có error boundary; dữ liệu workspace lỗi được giữ ở khóa sao lưu trước khi mở mẫu dự phòng; reset/đổi mạch sao lưu bản nháp và bản nháp đó có thể khôi phục từ UI.
- **D6–D9:** sketch analog chuyển ADC 0–1023 về phần trăm trước khi so ngưỡng; sketch xuất `.ino` chỉ bật với bài LED cơ bản trên Uno R3/Nano classic/Mega 2560; kiểm tra topology biến trở và tìm điện trở theo vai trò thay vì ID cứng.
- **D10–D18:** project mở lại giữ ID/tên; bước LED chuyển HIGH/LOW theo pha; `?lesson`/`?board` được áp dụng; danh sách dây rỗng được bảo toàn; parser từ chối nested condition, lệnh ngoài thân mẫu và phần lệnh thừa sau nhánh ở các mẫu liên quan; editor khối giới hạn bốn khối và chuẩn hóa pin theo board; alias NUCLEO dùng D13/PA5 nhất quán; code bài LED không thay chuỗi số con; bài học dẫn tới thực hành.
- **D19–D30:** canvas mobile có vùng cuộn và target lớn hơn; linh kiện di chuyển được bằng cảm ứng kéo hoặc phím mũi tên; tài liệu số lượng/giới hạn hiện tại được đồng bộ; sự kiện `code_copy` và `builder_run` không gửi code; hướng dẫn, stepper, trang 404, menu công cụ, cảnh báo I²C, giới hạn import 5 MiB, asset STM32 lưu trữ, trang quyền riêng tư và link footer được cập nhật.
- SQL migration `0002_analytics_rate_limit.sql` cho phép `builder_run` và áp ngưỡng theo session; migration chưa được chạy trên Supabase.

### Kiểm tra vừa chạy

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd test` | 33 đạt, 0 lỗi |
| `npm.cmd run build` | Đạt; Vite chuyển đổi 150 module |

### Giới hạn còn mở

- Chưa chạy luồng trên trình duyệt/điện thoại cảm ứng sau bản sửa; thao tác kéo cảm ứng, bàn phím và bố cục mobile mới được kiểm tra tĩnh bằng code/build.
- Chưa chạy migration trên Supabase hay kiểm tra trigger bằng PostgreSQL. Rate limit theo mã session có thể bị né bằng cách tạo session mới; đây là chặn tốc độ cơ bản, không phải chống lạm dụng mạnh.
- Chưa xác nhận sketch trên board vật lý, pinout theo từng revision, hoặc quyền phát hành asset với bên có thẩm quyền. Asset GPL-3.0 và attribution được giữ trong archive; điều này không phải ý kiến pháp lý.
- Lượt `claude_review_plan` và `claude_review_code` không trả nội dung review trước khi chạm giới hạn lượt của công cụ; không có nhận xét của Claude được dùng để xác minh bản sửa.
- Các ý tưởng roadmap trong phần E (tiếp tục học, phân tách thư viện project, định hướng PWA/desktop, thử nghiệm người học) chưa được coi là lỗi code và vẫn cần quyết định/kiểm chứng riêng.
