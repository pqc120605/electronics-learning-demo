# Mạch Mở — tổng hợp sản phẩm tham khảo và phân chia Web/App

**Ngày:** 31/10/2026  
**Mục tiêu:** Chốt bức tranh tính năng của các website/app đã được nhắc trong quá trình định hướng Mạch Mở; đề xuất phần nào thuộc web, phần nào thuộc app chuyên sâu, và luồng chuyển đổi giữa hai nơi.  
**Cách đọc:** Đây là tổng hợp từ trang/tài liệu chính thức được liên kết ở cuối tài liệu và từ trạng thái mã nguồn Mạch Mở hiện tại. “Có trong sản phẩm tham khảo” không đồng nghĩa Mạch Mở đã có tính năng đó hoặc nên triển khai y nguyên.

## 1. Tóm tắt quyết định sản phẩm

Mạch Mở nên là một sản phẩm có hai bề mặt dùng chung nội dung và dự án:

- **Web — khám phá, học nhanh, thử nghiệm và chia sẻ.** Không cần cài đặt để mở trang giới thiệu, đọc bài, xem board/linh kiện, mở bài thực hành và chạy các mô phỏng giáo dục nhẹ. Web phải giải thích rõ loại mô phỏng và giới hạn của từng bài.
- **App — xưởng làm việc đầy đủ, ưu tiên desktop.** Dành cho dự án dài hơi: workspace nhiều tài liệu, mô phỏng analog/SPICE hoặc firmware qua runtime được hỗ trợ, công cụ đo/debug, quản lý thư viện/CAD, dự án ngoại tuyến và xuất/trao đổi định dạng. Tính năng chỉ xuất hiện khi backend/runtime tương ứng đã được tích hợp và kiểm chứng.
- **Chung giữa hai nơi:** tài khoản, hồ sơ board/linh kiện có nguồn, curriculum, bài mẫu, định dạng dự án, lịch sử/phiên bản, quyền truy cập và trạng thái mô phỏng. Một project mở được trên cả web lẫn app; không tạo hai bản dữ liệu rời nhau.
- **Không nên đặt mục tiêu “thay toàn bộ KiCad/Proteus/Wokwi”.** Mạch Mở khác biệt ở việc nối liền học khái niệm → lắp mạch nhìn thấy được → hiểu luồng tín hiệu → chọn công cụ đủ mạnh cho bước tiếp theo. Với thiết kế sản xuất và mô phỏng chuyên nghiệp, cần hỗ trợ xuất/mở dự án ở công cụ chuyên dụng thay vì tuyên bố tương đương.

### Định vị đề xuất

> **Mạch Mở là môi trường học và thử mạch cho người mới, từ linh kiện và board có nguồn rõ ràng tới mô phỏng có thể giải thích; khi dự án cần năng lực chuyên nghiệp, người học tiếp tục trong app hoặc mở bằng EDA/IDE phù hợp.**

## 2. Các nhóm sản phẩm và những gì đáng học hỏi

### 2.1 Tinkercad Circuits — nhập môn bằng lắp mạch và code

**Nhóm:** Web giáo dục tương tác.  
**Năng lực được tài liệu hãng mô tả:** mạch Arduino với linh kiện ảo, lắp và chạy thử trong trình duyệt, xem/chỉnh code mẫu, chuyển code thành file Arduino `.ino`; hướng Codeblocks giúp học kéo thả, chạy và quan sát kết quả. Tài liệu giáo dục nhấn mạnh khởi động nhanh, dùng trong lớp và có mạch mẫu.

**Nên học:** bắt đầu từ ví dụ chạy được; cho người mới thay đổi một yếu tố mỗi lần; kết quả xuất hiện ngay cạnh mạch; có đường chuyển từ code thử sang phần cứng thật.  
**Không suy rộng:** tài liệu được trích dẫn ở đây không chứng minh Tinkercad là EDA sản xuất hay công cụ SPICE tổng quát.

### 2.2 Wokwi — mô phỏng board/firmware nhúng trên web

**Nhóm:** Web simulator cho Arduino, ESP32, STM32, Raspberry Pi Pico và các board/linh kiện được hỗ trợ.  
**Năng lực hãng công bố:** viết code và chạy trong browser; dự án chia sẻ bằng link; Wi-Fi ảo với giao thức như MQTT/HTTP/NTP; logic analyzer ảo cho tín hiệu số như UART/I²C/SPI; GDB cho Arduino/Pico; SD card; Chips API cho linh kiện tùy chỉnh; tích hợp VS Code và một số luồng CI.

**Nên học:** dự án có URL chia sẻ; editor và mạch cùng workspace; tách lỗi code khỏi lỗi phần cứng; dải board rộng; khả năng nối mô phỏng vào workflow IDE/CI.  
**Ranh giới sản phẩm:** phạm vi board, peripheral và quyền tích hợp/giấy phép cần đánh giá riêng trước khi dùng làm engine của Mạch Mở. Không lấy việc một board có thể được mô phỏng trong Wokwi làm bằng chứng rằng Mạch Mở đã hỗ trợ board đó.

### 2.3 KiCad — thiết kế EDA và dữ liệu kỹ thuật có thể tái tạo

**Nhóm:** Ứng dụng desktop mã nguồn mở cho schematic, PCB, thư viện và đầu ra sản xuất.  
**Năng lực hãng công bố:** vẽ schematic phân cấp; ERC; xuất netlist; chuyển schematic sang PCB; thiết kế layout/routing; thư viện symbol/footprint/3D; xem PCB 3D và đối chiếu cơ khí; xuất nhiều định dạng sản xuất; tích hợp mô phỏng SPICE.

**Nên học:** dữ liệu nối phải có cấu trúc và có thể kiểm tra; liên kết schematic ↔ PCB ↔ 3D; cảnh báo quy tắc có nguồn; provenance/phiên bản library; xuất dữ liệu chuẩn mở.  
**Không nên giả lập sớm:** editor PCB sản xuất đầy đủ, routing đa lớp, DRC/ERC chuẩn và tương thích toàn bộ file KiCad là một sản phẩm EDA riêng, không chỉ là mở rộng canvas hiện tại.

### 2.4 EasyEDA / JLCEDA và LCSC — EDA trên cloud, thư viện, BOM và sản xuất

**Nhóm:** EDA web/desktop kết hợp thư viện và quy trình đặt linh kiện/sản xuất.  
**Năng lực tài liệu hãng:** schematic và PCB; thư viện/footprint; liên kết BOM và thông tin sản phẩm; preview PCB 2D/3D, quản lý gắn model 3D cho footprint; chia sẻ/lưu dự án. Tài liệu EasyEDA nêu rõ khả năng mô phỏng của một số phiên bản có phạm vi hạn chế, không phải mô phỏng MCU tổng quát. LCSC cung cấp danh mục linh kiện và BOM upload/quote với giá, số lượng và lựa chọn thay thế.

**Nên học:** trang linh kiện kết nối datasheet, footprint, BOM và lựa chọn mua; đối chiếu package; quy trình từ sơ đồ tới sản xuất.  
**Điều cần giữ độc lập:** Mạch Mở nên đưa link/reference tới nguồn hoặc catalog; không biến nội dung học thành quảng cáo hoặc cam kết giá/tồn kho nếu chưa có tích hợp dữ liệu, điều khoản và cập nhật vận hành.

### 2.5 Fritzing — chuyển từ breadboard sang schematic/PCB

**Nhóm:** Ứng dụng desktop cho prototyping và tài liệu hóa dự án vật lý.  
**Năng lực hãng mô tả:** cùng project có ba view breadboard, schematic và PCB; thay đổi được đồng bộ giữa các view; thư viện part, kéo thả/dây, chỉnh thuộc tính, autoroute và xuất tài liệu/đầu ra PCB.

**Nên học:** cùng một mạch được giải thích ở dạng người mới nhận ra và dạng ký hiệu tiêu chuẩn; không bắt người học tự dịch giữa ảnh breadboard và schematic; dùng chung đối tượng kết nối giữa các góc nhìn.  
**Ưu tiên Mạch Mở:** hoàn thiện quan hệ dữ liệu giữa lắp mạch, schematic và logic trước; chỉ gọi một view là PCB sản xuất khi có geometry/net/DRC phù hợp.

### 2.6 Falstad — trực quan hóa hành vi điện

**Nhóm:** Simulator mạch tương tác chạy trên web.  
**Năng lực quan sát được trên trang hãng:** ví dụ mạch; tương tác bật/tắt switch và sửa component; hiển thị màu điện áp và các chấm chuyển động thể hiện dòng điện; mô tả trạng thái phần tử khi hover; có giao diện JavaScript cho trang cùng origin để đọc điện áp node/dòng phần tử và điều khiển nguồn ngoài.

**Nên học:** biểu diễn dòng/điện áp phải xuất phát từ kết quả mô phỏng; có ví dụ thử ngay; giải thích state của linh kiện.  
**Cảnh báo sản phẩm:** Mạch Mở hiện tô dây để giải thích đường tín hiệu logic/luồng bài. Không được gắn nhãn hoặc hoạt ảnh khiến người dùng tưởng đã tính dòng, điện áp hay công suất.

### 2.7 EveryCircuit — mô phỏng analog có animation và điều chỉnh trực tiếp

**Nhóm:** Web và app di động cho thiết kế, mô phỏng, chia sẻ và khám phá mạch.  
**Năng lực hãng công bố:** mô phỏng tương tác thời gian thực; animation dòng điện/điện áp/điện tích hiển thị trên schematic; thay đổi tham số bằng núm khi mô phỏng đang chạy; probe/oscilloscope và phần tử từ điện trở, tụ, diode, transistor tới nguồn và linh kiện số cơ bản.

**Nên học:** input vật lý được ánh xạ rõ vào kết quả; người dùng thấy thay đổi tham số làm biến đổi kết quả; animation nằm trực tiếp trên sơ đồ; trải nghiệm mobile-first cho bài ngắn.  
**Giới hạn cần truyền đạt:** mô hình cụ thể và engine riêng của sản phẩm; không đồng nghĩa mọi board MCU/firmware đều được mô phỏng.

### 2.8 CircuitLab — schematic và phân tích mạch trên browser

**Nhóm:** Web schematic editor và simulator analog/digital.  
**Năng lực hãng công bố:** dựng schematic, chạy mô phỏng analog/digital, tạo biểu đồ/plot và PDF schematic/wiring; có tài liệu học tương tác và trợ lý tạo mạch bằng ngôn ngữ tự nhiên ở trạng thái beta tại thời điểm truy cập.

**Nên học:** plot/đo lường phải là một phần trực tiếp của circuit; hướng dẫn giải thích kết quả; có thể đi từ sơ đồ sang phân tích.  
**Không nên hứa:** AI-generated circuit hoặc kết quả mô phỏng luôn chính xác. Nếu đưa trợ lý vào Mạch Mở, nó cần nguồn, kiểm tra luật và cảnh báo độ tin cậy.

### 2.9 Proteus — co-simulation firmware, mạch và PCB chuyên nghiệp

**Nhóm:** EDA desktop thương mại, nhắm tới giáo dục/kỹ sư.  
**Năng lực hãng công bố:** schematic, mô phỏng SPICE/mixed-mode, mô phỏng MCU/firmware trên một số kiến trúc, debug breakpoint/single-step/watch, peripheral, IoT Builder; PCB layout, thư viện, DRC, routing, 3D và xuất sản xuất. Phạm vi phụ thuộc gói/option và model từng thiết bị.

**Nên học:** mô phỏng firmware, ngoại vi và mạch analog/digital trong cùng dự án; debug code song song với state phần cứng; nói rõ board/device nào được hỗ trợ.  
**Định hướng Mạch Mở:** xây lớp hướng dẫn và trải nghiệm thống nhất; app có thể tích hợp một provider có phạm vi được xác nhận hoặc xuất project tới công cụ tương thích. Chưa nên tự tuyên bố mô phỏng firmware phổ quát.

### 2.10 DigiKey Scheme-It — sơ đồ, catalog và BOM trực tuyến

**Nhóm:** Web schematic/diagramming và chọn linh kiện.  
**Năng lực hãng mô tả:** các mức block/icon/system/schematic; symbol library; catalog DigiKey; BOM manager/quoting; chia sẻ công khai/riêng tư; export PDF/PNG và export KiCad được hãng ghi là beta ở trang sản phẩm.

**Nên học:** tìm linh kiện trong ngữ cảnh sơ đồ; BOM được sinh từ nội dung thiết kế; hỗ trợ link/share/export; có ví dụ mẫu và circuit fundamentals.  
**Không thay thế:** đây chủ yếu là công cụ sơ đồ và BOM; không nên gộp nó với MCU simulator hoặc PCB layout.

### 2.11 Arduino IDE / Cloud Editor — nạp code lên phần cứng thật

**Nhóm:** App desktop và editor trên cloud.  
**Năng lực hãng mô tả:** code, cài board package/library, compile/verify, chọn board và cổng, upload qua USB; Cloud Editor thêm lưu cloud/compile/upload/Serial Monitor và cần agent cục bộ để browser truy cập USB.

**Nên học:** sau khi thử ảo, hướng dẫn rõ chọn đúng board/port/cáp/package, compile, upload và xem Serial Monitor; phân biệt “mô phỏng” với “nạp lên board thật”.  
**Tích hợp:** Mạch Mở có thể export `.ino`/project và hướng dẫn mở bằng IDE; thao tác USB/flash nên là app/agent có quyền rõ ràng, không tự chạy từ trang web.

### 2.12 QEMU và Renode — nền runtime/emulation cho firmware

**Nhóm:** Công cụ kỹ thuật/framework, không phải website học điện tử hoàn chỉnh.  
**Năng lực tài liệu chính thức:** QEMU cung cấp CPU/system emulation cho các kiến trúc/machine được hỗ trợ; Renode cho phép mô tả platform, peripheral, chạy firmware, kiểm soát execution/debug/test và tích hợp workflow automation. Độ chính xác/khả năng chạy phụ thuộc board description, peripheral model và target cụ thể.

**Nên học:** runtime có thể tự host phía server/app, automation và test; chọn hỗ trợ theo board/peripheral đã port thay vì suy từ họ CPU.  
**Rủi ro/đầu tư:** backend, sandbox, compiler toolchain, mô hình ngoại vi, giới hạn CPU/bộ nhớ, an toàn khi chạy binary người dùng và chi phí vận hành. Đây là lớp hạ tầng tương lai, không phải một nút “bật simulator mọi board”.

## 3. Năng lực Mạch Mở hiện tại — để tránh lẫn hiện trạng với mục tiêu

Theo `README.md`, `docs/MACH-MO-MVP-STATUS.md` và các hồ sơ board hiện có:

- **Trang giới thiệu và học:** landing page khái niệm; dashboard/lộ trình, curriculum 11 bài, thư viện board/linh kiện, topics/projects; nội dung cho người mới và thông tin nguồn/tài liệu.
- **Board reference:** 21 board profile; 7 viewer 3D đang phát hành (ESP32 DevKit V1 30-pin clone, Uno R3, Nano classic, Mega 2560 R3, Pico, Pico W, Pico 2); manifest 2D lớp đồng CAD cho 4 board. Thiết kế community STM32F103 được lưu trữ, không phát hành trên UI. Không phải mọi profile có model, không phải mọi mesh đã xác minh BOM/board clone; chỉ Uno có mapping tín hiệu D13/SCK được ghi xác minh.
- **Thư viện component:** 48 mục; SVG giáo dục; link tài liệu cho một phần mục. Hình SVG/mesh rời chưa mặc định là ảnh nhà sản xuất hoặc model CAD chuẩn.
- **Lắp mạch/schematic:** preset bài, breadboard canvas, wire, pin IDs, sơ đồ học kiểu schematic, 2D/3D minh họa và validator heuristic. Chưa phải ERC/DRC tổng quát hay file EDA chuẩn.
- **Bài chạy:** 8 bài có parser code subset; 3 bài chạy kịch bản khái niệm cố định. Analog pot/LDR là input ảo 0–100 theo giả định; LDR tính Vout bộ chia áp giáo dục, không tính lux/đặc tuyến vật lý hay số đếm ADC. Chưa có firmware simulator tổng quát hoặc SPICE.
- **Công cụ firmware:** trang `/tools/firmware-hex` kiểm tra cú pháp Intel HEX trong trình duyệt. Có spike AVR8js trong Web Worker cho ATmega328P, giới hạn một giây mô phỏng và quan sát D13/PB5; đã kiểm chứng HEX Uno build từ sketch bằng Arduino IDE, không tự nhận dạng target và không mô phỏng điện đầy đủ.
- **Lưu trữ/app shape:** `/app` hiện là dashboard học web, website có manifest cài như PWA nhưng chưa có offline/service worker hay ứng dụng desktop/native. Workspace hiện lưu cục bộ; chưa có đồng bộ tài khoản học viên/cloud project/phiên bản.
- **Export/hardware:** chưa có luồng compile/upload tổng quát; có thể hướng dẫn/export code ở các bước tiếp theo nhưng cần xác định từng định dạng và board.

Các số trên là trạng thái được tài liệu repository ghi tại thời điểm tổng hợp; cần đồng bộ lại sau các thay đổi mới hơn.

## 4. Phân chia tính năng đề xuất

| Khu vực | Web | App chuyên sâu | Cả hai dùng chung |
|---|---|---|---|
| Khám phá và onboarding | Landing, khái niệm, bài thử không đăng nhập, chọn board/bài, quick-start | Tour workspace chuyên sâu, cấu hình toolchain | Tài khoản/tùy chọn người dùng khi đã có backend |
| Nội dung học | Bài, mục tiêu, sơ đồ, an toàn, câu hỏi/mini-lab | Khóa/lab nâng cao, bài offline, lớp học/tổ chức | Curriculum ID, phiên bản bài, board profile, mức mô phỏng |
| Board/component library | Tìm/lọc, datasheet/source, ảnh và viewer 3D nhẹ, trạng thái độ tin cậy | Library manager, package/CAD đầy đủ, local/custom libraries | IDs, provenance, licensing metadata, revisions, datasheet links |
| Lắp mạch | Preset, mạch nhỏ, breadboard/schematic tương tác cơ bản; giới hạn rõ | Project lớn, nhiều sheet, thao tác nâng cao, CAD import/export nếu hợp pháp | Component/pin/net schema; cùng project format và history |
| Mô phỏng | Parser subset/behavior đã kiểm chứng; bài analog nhỏ có giả định hiển thị | SPICE/mixed-signal, firmware provider, debug/probe, nếu đã triển khai và sandbox | Simulation metadata, provider ID, kết quả và assumptions |
| PCB/3D | Xem board reference, lớp copper, provenance, viewer read-only | EDA authoring, DRC/ERC đầy đủ, routing, fab outputs; hoặc tích hợp KiCad/EasyEDA | Board asset IDs, footprints, net references, model/license source |
| Code/firmware | Editor/tutorial; code subset; download project/code | IDE/runtime, compile, serial/debug, upload/device access (cấp quyền trực tiếp) | Code files, board target, build config, status/diagnostics |
| Dự án/chia sẻ | Link view/demo, fork bài mẫu, export/import project gọn | Git/versioning, nhiều file, collaboration sâu, offline/local file system | Project ID, schema, revision, permissions, asset references |
| BOM/mua linh kiện | Link tới DigiKey/LCSC/datasheet; BOM học tập nhẹ | BOM xuất chuẩn, alternatives/sourcing, kho nội bộ/tích hợp API | MPN, footprint, source URL, quantity/metadata; không lưu giá cứng nếu không cập nhật |
| Cộng đồng | Thư viện public đã review, share link, gallery | Review/versioning, team/classroom, custom parts/plugins | Attribution/license, author, moderation state |

### Quy tắc đặt tính năng

1. **Web nếu giúp người học bắt đầu trong vài giây** và chạy ổn trên laptop phổ thông mà không cần quyền thiết bị/hệ thống.
2. **App nếu cần file lớn/nhiều file, offline, USB/serial, toolchain, GPU/tài nguyên đáng kể, sandbox riêng hoặc workflow EDA dài.**
3. **Cả hai nếu dữ liệu và hành vi có cùng định nghĩa.** Web có thể cung cấp view/quick edit, app mở đúng project để tiếp tục; không được tạo hai cách hiểu khác nhau về pinout/netlist/mức mô phỏng.
4. **Giữ nội dung tham khảo trên web, nhưng không nâng nhãn năng lực.** Một model CAD, ảnh board hoặc đường net không tương đương simulation.
5. **Không chặn web bằng yêu cầu cài app.** Các bài nhập môn vẫn chạy trên web; CTA sang app xuất hiện đúng lúc người học cần năng lực app.

## 5. Luồng chuyển từ Web sang App

### Luồng người mới

`Trang giới thiệu → bài học → chọn board/linh kiện → lắp preset → chạy hành vi hỗ trợ → lưu/đặt tên project → Mở trong App khi cần mở rộng`

- Nút **“Mở trong App”** đặt ở project/workspace và trên hành động cần app, không đặt lặp lại ở mọi trang.
- Nếu chưa cài app: trang web giải thích lợi ích, hiển thị lựa chọn **Tải App** (nếu app đã phát hành) hoặc **Tiếp tục trên Web**. Trong giai đoạn chưa có app phát hành, nút nên là “Xem lộ trình App”/“Mở bằng KiCad/Arduino IDE” tùy tác vụ, không giả vờ đã mở native app.
- Nếu app đã cài: dùng deep link có scheme/version như `machmo://project/{projectId}?revision={revision}`; browser fallback sang trang project.

### Trao đổi dữ liệu

- Dùng file manifest versioned, ví dụ `.machmo` project bundle ZIP gồm `project.json`, `circuit.json`, `schematic.json`, code files, metadata board/component references và ảnh/tệp người dùng.
- Dữ liệu project dùng ID ổn định cho part/pin/net và tọa độ theo workspace; datasheet/model CAD là asset reference, kèm nguồn/giấy phép/hash khi có.
- Khi project mở ở bản app có schema mới: migrate không phá hủy, tạo bản sao/backup và ghi version. Unknown fields được bảo toàn nếu có thể.
- Nếu web/app dùng cloud: server cấp quyền project-scoped, URL token ngắn hạn; không đưa secret/API key của provider simulator vào query string hoặc bundle chia sẻ.
- Hiển thị trạng thái tương thích trước khi mở: **đầy đủ**, **mở chỉ xem**, hoặc **cần chuyển đổi**; giải thích tính năng không được mang theo.

### Hành động có thể đưa ra từ web

- **Board 3D/CAD:** “Mở dữ liệu CAD trong KiCad” chỉ khi đã xuất/đóng gói định dạng hợp lệ và quyền phân phối được xác nhận.
- **Code:** “Tải code” / “Mở hướng dẫn Arduino IDE”; compile/upload thực tế diễn ra trong IDE/app được tin cậy.
- **Firmware simulation:** “Mở trong App Simulator” chỉ khi app có provider đó và board/peripheral target nằm trong danh sách hỗ trợ.
- **Mạch học:** “Tiếp tục trong App” chuyển toàn bộ circuit/code/input state, không chỉ ảnh hoặc link bài.
- **BOM:** “Xuất BOM” hoặc link đến nhà phân phối với thông tin MPN; giá/tồn kho lấy live từ nguồn nếu được tích hợp, nếu không thì không hiển thị như dữ liệu hiện hành.

## 6. Lộ trình xây dựng theo lát cắt

Thứ tự ưu tiên sau khi thống nhất với founder: **khung project và flow trước, công cụ bổ trợ kế tiếp, dữ liệu thư viện mở rộng sau cùng**. Thư viện hiện có chỉ làm seed data để phát triển và kiểm chứng chức năng; không tăng hàng loạt board/linh kiện trước khi các flow chính chạy liền mạch.

### Giai đoạn A — Khung sản phẩm và hợp đồng dữ liệu

- **Đã triển khai lát cắt đầu tiên:** registry nhãn năng lực dùng chung và gói project JSON có `format`/`version`; workspace có thể xuất/nhập mạch, dây, board, bài học, code và các bản nháp. Bộ nhập giới hạn kích thước và từ chối sai phiên bản, board, linh kiện, tọa độ hoặc dây không khôi phục đủ.
- **Đã nối tiếp lifecycle local:** builder có thể lưu nhiều snapshot project có tên vào danh sách ở trang Dự án; người dùng mở lại, xuất hoặc xóa snapshot. Mở/xóa workspace yêu cầu xác nhận khi có thể ghi đè dữ liệu.
- **Đã nối tiếp lifecycle:** lưu theo tên sẽ tạo revision history tối đa 10 snapshot; trang Dự án hỗ trợ mở, nhân bản, đổi tên, xuất và xóa.
- **Giới hạn hiện tại:** gói JSON và danh sách project chỉ lưu cục bộ, chưa đồng bộ cloud/cộng tác, chưa mở trực tiếp bằng app native. Cần giữ tương thích ngược khi schema phát triển.
- Chuẩn hóa project schema có version, ID ổn định cho board/part/pin/net, code, đầu vào mô phỏng và nguồn asset. Có migration/backup để mở project cũ mà không mất dữ liệu.
- Dùng một capability registry chung cho lesson, board, component và simulator provider. Mỗi mức phải có label, mô tả/giả định và trạng thái; UI không suy diễn từ “có model” sang “mô phỏng được”.
- Chốt lifecycle project: tạo từ bài mẫu, sửa, autosave, duplicate, rename, export/import, mở lại và báo tương thích.
- Bảo toàn tính năng hiện có; thư viện board/component hiện tại làm fixtures để xác nhận schema chứ chưa mở rộng số lượng.

### Giai đoạn B — Hoàn thiện flow làm việc trên Web

- Làm một workspace flow thống nhất: chọn mục tiêu → chọn board/bài → lắp hoặc sửa topology → code/cấu hình đầu vào → chạy → xem trace/diagnostics → lưu/chia sẻ/xuất.
- **Trạng thái:** lưu cục bộ, mở lại, nhân bản, đổi tên, revision và xuất/nhập project đã có nền tảng. Hướng dẫn lỗi, trace chuẩn hóa và chuyển tiếp sang app vẫn cần hoàn thiện.
- Hướng dẫn lỗi theo bước và trạng thái; nếu input/mạch/code chưa hợp lệ thì nêu việc cần sửa, không chỉ báo “không chạy”.
- Chuẩn hóa simulator interface để các bài parser hiện có và scenario cố định sử dụng cùng thao tác run/step/reset/trace, nhưng hiển thị đúng mức năng lực.
- Responsive, bàn phím, phục hồi autosave, import/export và trải nghiệm người mới là cổng chất lượng. Chỉ thêm bài mới nếu flow đó thể hiện được hành vi kiểm chứng được.

### Giai đoạn C — Công cụ bổ trợ và đường chuyển Web → App/IDE

- Xây project export/import version 1 và project handoff có báo đầy đủ/chỉ xem/cần chuyển đổi.
- Trên web, các hành động “Mở trong App”, “Mở bằng KiCad”, “Mở bằng Arduino IDE/VS Code” chỉ hiện khi tác vụ và định dạng thực sự hỗ trợ; nếu app chưa phát hành thì cho tải tệp/hướng dẫn thay vì giả lập deep link.
- **Đã có handoff code-subset:** bài học có thể tải sketch `.ino`; parser và alias chân phải khớp board profile trước khi xuất. Header ghi board/MCU/mức logic/link tài liệu khi có. Web chưa biên dịch hay upload; sketch Uno mẫu riêng đã được compile trong Arduino IDE để kiểm tra AVR8js. Xem [hướng dẫn chuyển sketch](arduino-toolchain-handoff.md).
- **Công cụ firmware đã bổ sung:** trang kiểm tra Intel HEX đọc tệp cục bộ, xác thực cấu trúc và trình bày vùng địa chỉ; có thể chạy thử HEX assembly hoặc HEX Uno build bằng Arduino IDE cho ATmega328P trong AVR8js worker và xem D13. Đây là spike hẹp, chưa phải compiler hay simulator tổng quát.
- Tạo companion app desktop sau khi project schema/flow ổn định: local files, offline workspace, toolchain bridge và USB/serial permissions. App phải mở cùng project ID/revision thay vì fork dữ liệu.
- Đánh giá Wokwi/provider có license hoặc Renode/QEMU self-host qua spike riêng: target coverage, peripheral, chi phí, sandbox, privacy, latency và giới hạn tài nguyên.
- Đánh giá GitHub dự án mã nguồn mở theo ngày/giấy phép/board coverage ở [bản rà soát công cụ 2026-10-31](open-source-tooling-review-2026-10-31.md). Đã có spike AVR8js cho ATmega328P; tiếp theo cần kiểm chứng firmware Arduino đầy đủ, rồi mới chuyển sang RP2040js/Thevenin. ESP32 WASM và Renode cần cổng sandbox/tài nguyên.

### Giai đoạn D — Simulation/EDA tools theo provider

- Tách provider API khỏi UI; mọi kết quả lưu model assumptions, engine/version, target và phần tử chưa hỗ trợ.
- Thêm đo đạc analog, waveform/SPICE hoặc firmware execution theo nhóm nhỏ có models và test vector. Hoạt ảnh dòng/điện áp chỉ dựa trên kết quả engine.
- Tăng cường schematic/connectivity/DRC/ERC, import/export KiCad/EasyEDA khi project model tương thích; không gọi canvas lắp mạch hiện tại là EDA production.
- Việc tự xây PCB editor đầy đủ là quyết định sản phẩm riêng, sau khi kiểm tra chi phí duy trì và nhu cầu người dùng.

### Giai đoạn E — Mở rộng thư viện và nội dung (làm sau)

- Mở rộng board/component/3D/2D assets sau khi schema, project flow, viewer interaction, sourcing pipeline và review gate ổn định.
- Mỗi item mới cần mã cụ thể, revision, source, license, pin/package mapping, confidence, asset roles và tiêu chí review; ưu tiên nhập hàng loạt qua pipeline có kiểm tra thay vì thêm thủ công rời rạc.
- Community submissions cần attribution, scan/provenance, moderation và trạng thái pending/approved/rejected.
- Chỉ thêm board/part vào bài mô phỏng nếu có behavior provider/lesson rõ ràng; nếu không thì ghi nhận là asset tham khảo.

## 7. Quyết định cần thống nhất trước khi triển khai lớn

Các điểm này có thể để mặc định cho bản kế hoạch hiện tại; cần chốt trước khi bước sang app/backend chuyên sâu:

1. **App là gì trong v1?** Đề xuất app desktop companion (Windows trước), không phải chỉ đổi tên dashboard web. Giữ web/PWA cho người học mới và truy cập nhanh.
2. **Firmware simulator:** tích hợp dịch vụ ngoài, self-host Renode/QEMU, hay chỉ xuất sang IDE ở giai đoạn đầu? Khuyến nghị giai đoạn đầu xuất code/mở IDE; đánh giá provider bằng spike tách biệt.
3. **Độ sâu EDA:** Mạch Mở làm PCB editor hay tích hợp/export KiCad/EasyEDA? Khuyến nghị tập trung học/lắp/schematic, chuẩn hóa project exchange trước; chưa cạnh tranh PCB editor chuyên nghiệp.
4. **Tài khoản/cloud/community:** cần policy về public/private projects, lưu source code, deletion, moderation và telemetry trước khi phát hành đồng bộ/chia sẻ.
5. **Nguồn component:** chọn nguồn ưu tiên (hãng, KiCad, LCSC/DigiKey, cộng đồng), quy tắc license và người duyệt mapping footprint/3D/BOM.

## 8. Kết luận đề xuất

Giữ web làm cửa vào và môi trường học/thử nhẹ có phản hồi nhanh. App trở thành nơi tiếp tục dự án sâu: file/local/offline, toolchain, phần cứng USB, debug, simulator provider và tích hợp EDA. Trước khi mở rộng số lượng model hoặc công cụ, ưu tiên thống nhất project schema, capability labels, provenance và cổng chất lượng. Điểm chuyển web → app phải mang theo chính project và giải thích chính xác phần nào được hỗ trợ ở môi trường đích.

## 9. Nguồn chính thức

### Sản phẩm học và mô phỏng

- Tinkercad Codeblocks: https://www.tinkercad.com/codeblocks
- Autodesk/Tinkercad Circuits getting-started guide: https://images.tinkercad.com/jl5ii4oqrdmc/4sMFqe3rDlbUymJt0I4yh/85a4487f7fe274e74c19870ae4679fc1/tinkercad-guides_circuits-Printable.pdf
- Wokwi Docs: https://docs.wokwi.com/
- Falstad Circuit Simulator: https://falstad.com/circuit/
- Falstad JavaScript interface: https://www.falstad.com/circuit/jsinterface.html
- EveryCircuit: https://everycircuit.com/
- EveryCircuit help/manual: https://everycircuit.com/help
- CircuitLab: https://www.circuitlab.com/

### EDA, breadboard, 3D và sourcing

- KiCad overview: https://www.kicad.org/
- KiCad schematic capture/ ERC: https://www.kicad.org/discover/schematic-capture/
- KiCad 3D viewer: https://www.kicad.org/discover/3dviewer/
- KiCad documentation: https://docs.kicad.org/master/en/pcbnew/pcbnew.html
- EasyEDA simulation FAQ: https://docs.easyeda.com/en/FAQ/Simulation/
- EasyEDA 3D Model Manager: https://docs.easyeda.com/en/PCB/3D-Model-Manager/
- EasyEDA Pro 3D preview: https://prodocs.easyeda.com/en/pcb/view-preview-3d/
- Fritzing Getting Started: https://fritzing.org/learning/get-started
- Fritzing project views: https://fritzing.org/learning/get-started/project-view
- Fritzing PCB workflow: https://fritzing.org/learning/tutorials/designing-pcb/
- DigiKey Scheme-It: https://www.digikey.com/en/resources/design-tools/schemeit
- LCSC BOM: https://www.lcsc.com/bom
- LCSC Components: https://www.lcsc.com/Products

### Firmware, MCU emulation và IDE

- Proteus Design Suite: https://www.labcenter.com/
- Proteus microprocessors/VSM: https://www.labcenter.com/microprocessors/
- QEMU emulation overview: https://www.qemu.org/docs/master/about/emulation.html
- Renode documentation: https://renode.readthedocs.io/
- Arduino software: https://www.arduino.cc/en/software
- Arduino Cloud Editor: https://docs.arduino.cc/arduino-cloud/guides/editor/
- Arduino compile/upload process: https://support.arduino.cc/hc/en-us/articles/4733418441116-Upload-a-sketch-in-Arduino-IDE

## Phụ lục — cách hiểu mức độ tính năng trong tài liệu này

- **Được tài liệu hãng mô tả:** tính năng được nói trên trang/help chính thức đã liên kết; không phải kiểm định độc lập chất lượng hay quyền dùng lại.
- **Đề xuất cho Mạch Mở:** quyết định/khuyến nghị sản phẩm dựa trên mục tiêu hybrid web + app và giới hạn repository.
- **Đang có ở Mạch Mở:** trạng thái được ghi trong README/status và các capability hiện tại; không suy từ ảnh UI hay số profile ra mức mô phỏng.
- **Cần xác minh:** phạm vi board, giấy phép, chính sách thương mại, giá/stock, version hoặc khả năng tích hợp cần xác nhận lại trước quyết định triển khai.
