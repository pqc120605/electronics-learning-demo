# Kiểm tra độ chính xác model board 3D — 03/11/2026

## Kết luận nhanh

Hiện có **14 viewer board 3D** và **1 cảnh lắp ráp LED giáo dục**. Kiểm tra mới bao phủ đủ 15 cảnh. Tất cả hotspot trỏ đến node có thật; không có hotspot orphan/không chọn được; mọi anchor đang bật pin picking nằm trong scene bounds. GLB đều nằm trong ngưỡng kích thước/primitive mà test đặt ra.

Kết quả này xác nhận tính nhất quán giữa manifest và GLB, cùng một số phép căn CAD đã được ghi trong hồ sơ nguồn. Nó **không chứng minh board vật lý khớp mọi clone/revision**. Không có board thật để đo; một số board dùng body KiCad chung, mesh chưa định danh, hoặc anchor kế thừa từ SKU khác. Tọa độ tổng thể của cả scene không được dùng làm kích thước PCB vì scene còn có linh kiện nhô cao.

## Phương pháp và kiểm tra cấu trúc

- Chạy `node scripts/audit-board-models.mjs` sau khi bổ sung `espressifBoardModels` vào audit; trước đó ESP32-S3-DevKitC-1 V1.1 bị bỏ sót khỏi lượt kiểm tra.
- `tests/data-integrity.test.mjs` hiện khóa số lượng 14 manifest/15 scene, kiểm tra đủ scene qua asset-lock, hash/cache version, giới hạn 20 MiB, tối đa 1.000 GLB primitives và JSON chunk tối đa 512 KiB.
- Kết quả hiện tại: 15 scene; `missing hotspot nodes=0`, `orphan hotspots=0`, `unpickable hotspot nodes=0`; selectable anchors ngoài scene bounds = 0. Uno/Nano/Mega có anchor records nhưng pin picking bị tắt, nên không tính là đã kiểm chứng chọn chân.
- Audit parser kiểm tra cấu trúc scene và anchor bounds. Nó không đo kích thước outline PCB một cách độc lập, không so mọi vị trí linh kiện với BOM ngoài đời và không kiểm tra độ vừa khít của board thật.

## Danh sách model đã kiểm tra

`nodes/hotspots` là số từ GLB/manifest. `Mesh thiếu` là số feature được manifest ghi nhận nhưng không có body tương ứng; mesh không có tên riêng có thể vẫn được gom nhóm “chưa định danh”. `Pin` là số anchor trong manifest; picking ghi riêng để tránh nhầm anchor tồn tại với việc chân thật sự chọn được.

| Board / revision tham chiếu | GLB SHA-256 (12 ký tự đầu) | Nodes / hotspots | Mesh thiếu | Pin anchors / picking | Cơ sở và kết luận về độ chính xác |
|---|---:|---:|---:|---|---|
| ESP32 DevKit V1 30-pin — reference clone design | `b3d0a6b0be09` | 26 / 11 | 4 | 30 / bật | PCB theo thiết kế Brij Modi; không đại diện mọi board bán tên DevKit V1. Body CP2102 dùng package KiCad cùng cỡ. LED, điện trở, breadboard và dây ở assembly là minh họa. Cần đúng clone/revision hoặc đo board người dùng. |
| Arduino Uno R3 — Rev3 source CAD import | `b499c0764e77` | 39 / 120 | 87 | 25 / tắt | Vị trí theo CAD Rev3; nhiều pad không có body vì header không được dựng giả. Body một số package là generic. Cần ảnh/đo đúng Uno revision và BOM/population để xác thực linh kiện. |
| Arduino Nano classic — V3.3 source CAD import | `9c424d96e1d0` | 24 / 37 | 19 | 27 / tắt | Nguồn CAD dùng ATmega328P-32MUR VQFN-32; không đại diện Nano clone dùng package khác. Cần xác định đúng biến thể Nano thực tế. |
| Arduino Mega 2560 — Rev3 source CAD import | `7b1211ca9718` | 45 / 72 | 33 | 75 / tắt | Vị trí theo CAD Rev3, body package có phần generic và header chưa lắp chỉ có pad. Cần board/revision và BOM/population thực tế. |
| Raspberry Pi Pico — R3 official STEP | `aa1b6f4bb7b9` | 16 / 16 | 0 | 40 / bật | Board từ STEP hãng; 40 pad J0 và net lấy trực tiếp Allegro R3, nhãn chức năng đối chiếu pinout chính hãng. Không có phép đo mẫu vật lý. |
| Raspberry Pi Pico W — official STEP | `28757a63380a` | 24 / 24 | 0 | 40 / bật | Board từ STEP; pad/net lấy trực tiếp Allegro Pico W. Không dùng net/pin map này cho biến thể không dây khác nếu chưa đối chiếu. Không có phép đo mẫu. |
| Raspberry Pi Pico 2 — official STEP | `38ba3e6ddefb` | 53 / 53 | 0 | 40 / bật | Hình học board từ STEP riêng; bố trí anchor kế thừa layout Pico R3 và căn vào STEP, không phải pad extraction Allegro riêng Pico 2. Cần kiểm tra phiên bản board cụ thể. |
| Raspberry Pi Pico 2 H — SC1632, with headers | `b3ce57f26b52` | 55 / 55 | 0 | 40 / bật | STEP riêng có header hàn sẵn; anchor layout kế thừa Pico R3. Không đại diện Pico 2 không header hoặc Pico 2 W. Không có đo vật lý. |
| Adafruit QT Py ESP32-C3 — Rev B #5405 | `75030f7cdca3` | 37 / 37 | 0 | 14 / bật | STEP/Eagle của PID #5405; nguồn giữ 113 STEP meshes, 35 designator được map và 75 mesh không khớp được gom chưa định danh. Cần xác thực retail Rev B và footprint U.FL/USB-C trên mẫu. |
| Adafruit Feather ESP32-S3 — PID #5323, 8 MB/no-PSRAM | `b655f774699e` | 35 / 49 | 14 | 28 / bật | STEP/Eagle đúng PID; 33/47 designator map được, còn mesh nguồn không khớp được giữ chưa định danh. Không dùng cho Feather S3 khác cấu hình. Cần mẫu #5323 và kiểm tra linh kiện lắp thật. |
| Adafruit Feather ESP32-S3 TFT — PID #5483, 4 MB + 2 MB PSRAM | `f4136a50fb56` | 39 / 56 | 17 | 28 / bật | STEP/Eagle đúng PID; 37/54 designator map được; U6 chưa có STEP match, 114 mesh nguồn còn lại chưa định danh. Cần mẫu #5483 để xác nhận màn hình/đầu nối và BOM lắp ráp. |
| Seeed XIAO ESP32-C3 — KiCad PCB/schematic v1.3 | `1c9ddcc5d43a` | 53 / 68 | 21 | 14 / bật | Viewer dựng từ PCB v1.3; 47 body package KiCad generic và 21 feature không có mesh. Pad/net là tra cứu tĩnh theo source PCB. Archive KiCad không có LICENSE riêng dù schematic ghi CC BY-SA; quyền phân phối archive vẫn cần xác nhận. Cần board v1.3 ngoài đời và làm rõ quyền archive. |
| Seeed XIAO ESP32-S3 — bản thường, STEP v2 | `866adb2f4068` | 4 / 4 | 0 | 14 / bật | STEP chính hãng được chuyển sang GLB. Anchor từ Seeed OPL PCB căn vào outline STEP; residual đã đo ≤0,095 mm dọc và ≤0,005 mm ngang. OPL không ghi revision; chỉ ba nhóm STEP có tên nguồn, phần khác chưa định danh. Đây không phải Sense/Plus. Cần xác định revision OPL/board mẫu. |
| Espressif ESP32-S3-DevKitC-1 — PCB V1.1 educational reconstruction | `abf7b557d135` | 56 / 48 | 0 | 44 / bật | PADS ASCII/BOM nhập qua KiCad; 48 nhóm package, 44 anchor J1/J3. 47 package body là model KiCad dùng chung; BOM không cố định module memory. Import có 1.331 phát hiện DRC và 3 item chưa nối. PADS outline 62,865 mm so với PDF hãng 62,74 mm (lệch 0,125 mm); giữ nguyên nguồn, không scale âm thầm. Chưa đo board thật. |
| Cảnh lắp LED ESP32 — assembly giáo dục, không phải board SKU | `129265213475` | 33 / 15 | 0 | 30 / bật | Là cảnh minh họa breadboard, LED, điện trở, dây và board; không phải assembly CAD để fitment hoặc chế tạo. Vị trí theo topology/lưới giáo dục. Không áp dụng kiểm định board vật lý. |

## Sai lệch và tối ưu được xử lý

### ESP32-S3-DevKitC-1 V1.1

Hồ sơ nguồn ghi outline từ PADS nhập là 25,400 × 62,865 mm; bản vẽ kích thước Espressif ghi chiều dài 62,74 mm. Sai số 0,125 mm đã được công khai trước đó và vẫn còn. Chưa có căn cứ để xác định sai số nằm ở nguồn PADS, import hay dimension PDF; vì vậy giữ geometry theo nguồn CAD thay vì bóp tỷ lệ và làm lệch linh kiện/anchor so với CAD đã nhập. Đây vẫn là bản dựng giáo dục, không phải source manufacturing đã DRC-pass.

### Seeed XIAO ESP32-S3

Anchor J1/J2 từ OPL PCB được căn vào hệ tọa độ STEP v2; sai số outline ghi trong nguồn là tối đa 0,095 mm theo trục dài và 0,005 mm theo trục ngang. Đây là phép so CAD-to-CAD, không chứng minh OPL file ứng với revision bán lẻ nào.

### Draw-call regression trên hai model lớn

Khi đưa ESP32-S3-DevKitC-1 vào asset audit đầy đủ, test hiện có tìm thấy 13.632 primitives; XIAO ESP32-C3 có 7.279. Đã chạy `scripts/optimize-board-glb.mjs`:

- ESP32-S3-DevKitC-1: 13.632 → 138 primitives; 12.880.288 → 8.226.076 bytes.
- XIAO ESP32-C3: 7.279 → 118 primitives; 7.406.796 → 4.920.452 bytes.

Script kiểm tra và từ chối ghi nếu node names/transforms, materials hoặc triangle set theo node thay đổi. Hash GLB, model inventory, source-GLB hash trong anchor data và asset lock được cập nhật. Đây là tối ưu cách đóng gói geometry, không chỉnh vị trí/hình dáng CAD.

## Việc cần có để nâng mức xác minh

1. Với model cần khớp board thực: board chính xác theo SKU/revision/biến thể module và ảnh rõ hai mặt có thước chuẩn hoặc phép đo trực tiếp (outline, tâm lỗ, pitch header, vị trí/chiều cao linh kiện).
2. So sánh từng mẫu với BOM/assembly của đúng revision; phân biệt footprint trống/DNP, generic package body, biến thể memory/antenna và linh kiện thay thế trên clone.
3. Với XIAO C3, tìm giấy phép/điều khoản chính thức áp dụng riêng cho archive KiCad hoặc xin xác nhận từ nhà phát hành; license schematic không tự xác nhận mọi file trong ZIP.
4. Không quảng bá model CAD tham chiếu hay assembly minh họa là đã kiểm chứng vật lý, đã DRC hoặc dùng được để chế tạo.

## Rà soát bổ sung 03/11/2026

Chạy lại `node scripts/audit-board-models.mjs` sau khi đưa ESP32-S3 DevKitC-1 vào lượt scan và thêm cột tên node ứng viên outline. Kết quả là **15 scene**: không thiếu/orphan hotspot, không hotspot node không chọn được, và không anchor đang bật chọn chân nào vượt scene bounds. Heuristic chỉ tìm được tên node gợi ý outline ở **7/15 scene** (Pico, Pico 2/2 H, ba board Adafruit và XIAO ESP32-S3); tên node không được coi là bằng chứng shape là PCB outline. Tám scene còn lại không có tên outline nhận diện được. Toàn cảnh GLB vẫn gồm linh kiện/header nên không lấy `sizeModelUnits` làm kích thước bo.

Lượt scan không phát hiện source-backed defect mới đủ cơ sở để thay geometry. Giữ nguyên các model và discrepancies đã ghi ở trên; không sửa tọa độ/pad theo suy luận. Để thực hiện yêu cầu xác minh phần cứng thật, cần đúng board/SKU/revision và ảnh/đo theo [`hardware-validation-intake.md`](hardware-validation-intake.md). Đặc biệt cần mẫu cho ESP32-S3 DevKitC-1 V1.1, XIAO ESP32-S3, Pico-family, cùng Arduino Uno/Nano/Mega nếu muốn xác nhận chúng với sản phẩm người dùng đang có.

## Bổ sung ảnh cộng đồng để nhận diện board — 03/11/2026

Đã thêm ảnh mặt dưới/mặt sau cho Uno R3, Nano classic và Mega 2560 R3, cùng ảnh cộng đồng Pico 2 vào hồ sơ board. Mỗi ảnh có tác giả, trang nguồn, license, chú thích biến thể và attribution hiển thị cạnh ảnh; danh sách đầy đủ ở [`reference-image-attribution.md`](reference-image-attribution.md).

Các ảnh bổ sung là tư liệu nhận diện độc lập, không phải ảnh chụp cùng mẫu board đang dùng để dựng CAD. Ảnh Nano cụ thể có USB-serial FTDI; ảnh Mega ghi rõ là board tương thích do nhà sản xuất khác làm. Chúng không dùng để sửa tọa độ, gán BOM/pinout, kết luận revision hay đánh giá độ chính xác hình học. Cần board đúng SKU/revision và phép đo hai mặt để xác minh các model hiện có.

### Bổ sung ảnh Pico W và mặt dưới Pico 2

- Raspberry Pi Pico W có thêm ảnh sản phẩm từ SparkFun Electronics (CC BY 2.0; ảnh Commons dẫn nguồn sản phẩm SparkFun #20173). Đây là ảnh nhận diện; không khẳng định Pico 2 W hoặc mọi revision.
- Raspberry Pi Pico 2 có thêm ảnh mặt dưới của Profpcde (CC0 1.0), trong đó nhãn GPIO có thể đọc được. Ảnh giúp người học tra cứu mặt dưới nhưng không được dùng làm phép đo CAD, BOM hay xác nhận model cơ khí.
- Attribution, trang nguồn, giấy phép và ghi chú biến thể được lưu trong [bảng attribution](reference-image-attribution.md) và ngay cạnh ảnh trong hồ sơ board. Hai ảnh tải nguyên bản, không chỉnh sửa.
- Kiểm tra license/source đã mở lại trang Commons và xác nhận tác giả, nguồn, kích thước, giấy phép; asset JPEG trong repo có cùng dung lượng khai báo ở Commons. Đây vẫn chỉ là kiểm chứng nguồn ảnh, không phải kiểm tra board vật lý.

### Bổ sung ảnh UNO R4 WiFi và R4 Minima

- UNO R4 WiFi có ảnh cộng đồng của Lomrjyo, CC BY-SA 4.0; bản thumbnail được giới hạn 1280 px. Nội dung ảnh thể hiện đúng tên board và ma trận LED.
- UNO R4 Minima có render sản phẩm do Arduino phát hành trên Commons theo CC BY-SA 3.0. Giao diện ghi rõ đây là render, không phải ảnh chụp board vật lý.
- Hai ảnh được gắn vào đúng hai profile R4 riêng. NUCLEO-F401RE có thêm ảnh cộng đồng CC0 được ghi rõ là MB1136 rev C/F401RET6; hồ sơ model trong dự án tham chiếu C04 nên ảnh không xác nhận đúng revision. ESP32 DevKit 30-pin chưa gắn ảnh: các ảnh mở tìm thấy không khớp chắc chắn thiết kế clone 30-pin này.
- Trang Commons, tác giả, license và thay đổi được lưu ở [reference-image-attribution.md](reference-image-attribution.md); test catalog kiểm tra file cục bộ, signature, nguồn, license, disclaimer và hiển thị profile.

### Bổ sung ảnh Blue Pill STM32F103C8T6

- Thêm ảnh cộng đồng Avandalen từ Commons theo CC BY-SA 4.0; trang nguồn ghi đây là board Blue Pill dựa trên STM32F103C8T6.
- Blue Pill là tên chung của nhiều board clone, nên giao diện dùng ảnh để nhận diện hình thức chung. Ảnh không xác nhận vendor, revision, pinout, BOM, model CAD hoặc độ chính xác cơ khí.
- Ảnh được gắn vào hồ sơ tra cứu hiện có; không khôi phục model custom đã gỡ và không dùng ảnh để thay cho model 3D chuẩn.

### Bổ sung ảnh board ESP32 DevKit tham khảo

- Thêm ảnh của Edwiyanto từ Wikimedia Commons theo CC BY-SA 4.0. Ảnh nguồn là một ESP32 development board đặt trên breadboard; nhìn thấy module shield và hàng chân hẹp kiểu 30-pin.
- Metadata nguồn không xác định DOIT, nhà sản xuất, USB-serial hay revision. Giao diện chỉ ghi đây là ảnh nhận diện board ESP32 chung; không dùng ảnh để khẳng định mẫu đang dựng, gán pinout/BOM, đo tỷ lệ hay thay đổi model clone 30 chân.
- File là thumbnail 960 × 1280 px; ghi công/giấy phép và thay đổi được lưu tại [reference-image-attribution.md](reference-image-attribution.md). Ảnh trong repo đã được kiểm tra trực quan và nhận diện đúng là board ESP32 đặt trên breadboard.

## Đối chiếu kích thước thân PCB STEP ↔ GLB — 03/11/2026

- Đã thêm `scripts/audit-step-board-body-geometry.mjs`, đăng ký lệnh `npm run audit:board-model-geometry` và ghim SHA-256 của từng STEP trong `scripts/step-board-body-registry.json`.
- Phép đo chỉ lấy mesh thân PCB được định danh chính xác trong STEP và node PCB riêng trong GLB; chuyển đơn vị mm ↔ m, áp đúng hoán vị trục đã biết, bỏ qua tịnh tiến. Ngưỡng sai số là 0,005 mm. Script từ chối hash nguồn đổi, mesh/node thiếu hoặc trùng tên, bounds lỗi và mapping trục không hợp lệ.
- Kết quả: **8/8** cặp thân bo trùng trong sai số: Raspberry Pi Pico R3, Pico W, Pico 2, Pico 2 H, Adafruit QT Py ESP32-C3 #5405, Feather ESP32-S3 #5323, Feather ESP32-S3 TFT #5483 và Seeed XIAO ESP32-S3. Sai số hiển thị tối đa là 0,001 mm (làm tròn từ float GLB); ngưỡng 0,005 mm.
- Đây là kiểm tra độc lập tính nhất quán kích thước source STEP với mesh PCB đóng gói trong GLB, không xác nhận STEP ứng với revision bán lẻ, không kiểm tra vị trí/BOM từng linh kiện, pad/pinout, chiều cao lắp ráp hay board ngoài đời.
- Sáu viewer còn lại (ESP32 DevKit clone, Arduino Uno/Nano/Mega, Seeed XIAO ESP32-C3, Espressif ESP32-S3-DevKitC-1) chưa có cặp thân bo STEP → node PCB tách riêng có thể đo bằng cùng phương pháp; cảnh assembly LED cũng không phải board SKU. Audit toàn cảnh GLB hoặc heuristic tên node không được tính thay cho phép đo outline.
- Kiểm tra này để lại nguyên trạng toàn bộ mesh board. Cần STEP/CAD outline riêng có nguồn và/hoặc mẫu đúng SKU/revision cùng phép đo để mở rộng độ phủ; ảnh nhận diện không đủ để kết luận sai lệch cơ khí.

## Nguồn chính

- [Espressif ESP32-S3-DevKitC-1 V1.1 guide](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html)
- [Raspberry Pi Pico-series documentation](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html)
- [Seeed XIAO ESP32-C3 guide](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/)
- [Seeed XIAO ESP32-S3 guide](https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/)
- [Adafruit QT Py ESP32-C3 #5405 guide](https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board)
- Nguồn chuyển đổi, checksum và giới hạn theo từng board ở [board-model-sourcing.md](board-model-sourcing.md), `assets/boards/**/SOURCE.md`, inventory JSON và NOTICE cạnh asset.
