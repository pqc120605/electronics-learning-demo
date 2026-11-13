# Epic SIM · Mô phỏng mạch điện v2 · kế hoạch (09/11/2026)

Người đọc: founder (điều phối). Bản nháp của Leader Claude, chưa được Codex xác nhận. Điều tôi đã kiểm bằng đếm file/dòng nằm ở mục 2; điều còn lại là giả thuyết, ghi rõ.

## 1. Triệu chứng founder báo (quan sát trên web)
1. Nhiều mạch không xem được hết linh kiện.
2. Vị trí linh kiện sai nhiều chỗ.
3. Có mạch chỉ hiện bản vẽ CAD, không xem được linh kiện và chân.
4. Mô phỏng linh kiện trên breadboard không tiến bộ: dây cắm lung tung, linh kiện ít chủng loại, breadboard chỉ là một khối 3D.

## 2. Dữ liệu tôi đã đếm (chưa đọc logic)
- Registry linh kiện (`src/data/componentRegistry.ts`) có 28 loại: esp32-devkit, breadboard, led, resistor, electrolytic, button, limit-switch, buzzer, potentiometer, ldr, ir-obstacle, hc-sr04, oled, servo, seven-segment, diode, rgb-led, transistor-bjt, mosfet, dc-motor, ntc, slide-switch, dc-supply, relay, buck, boost, motor-driver, h-bridge-l298n.
- `breadboard` là **một loại linh kiện trong registry** như các loại khác. Suy luận (chưa kiểm): chưa có mô hình lưới lỗ với dải nối bên trong.
- Dữ liệu mạch bài học: `src/data/lessonCircuits.ts` chỉ 7,5 KB cho toàn bộ bài; `src/data/lessons.ts` có 6 id bài.
- Bố cục và vẽ: `src/lib/assemblyLayout.ts` (29 KB), `src/components/builder/AssemblyStage.tsx` (27 KB), `Assembly3DView.tsx` (7 KB), `SchematicView.tsx` (5 KB).
- `src/pages/CircuitBuilderPage.tsx` dài 137 KB. Rủi ro lớn khi sửa chồng lên.
- 52 file `.glb` trong `public/`.

## 3. Giả thuyết nguyên nhân (chưa kiểm, giai đoạn S0/S1 xác nhận)
A. Dữ liệu mạch bài học thiếu hoặc thiếu vị trí/chân, nên mạch chỉ có hình CAD.
B. Vị trí tính bằng công thức, không bám lưới lỗ breadboard.
C. Dây không có luật đi dây (không nối chân với chân theo đường định tuyến).
D. Breadboard không có lưới lỗ và dải nối, nên không thể "cắm" đúng.
E. Catalog 28 loại chưa đủ cho bài học.

## 4. Giai đoạn và phân công
| Bước | AI | Việc | Đầu ra | Claude review |
|---|---|---|---|---|
| S0 | Antigravity | Kiểm kê trên trình duyệt: với từng bài và từng mạch, đếm linh kiện hiển thị so với linh kiện trong dữ liệu, chụp ảnh chỗ sai (vị trí, mạch chỉ có CAD, dây rối) ở 375/768/1440 px | `.tmp/ai-intake/antigravity/<ngày>/sim-audit.md` + ảnh | Claude lọc |
| S1 | Luna (đọc, không sửa) | Kiểm kê mã: luồng dữ liệu từ bài học tới bố cục tới vẽ; mô hình breadboard hiện tại; luật dây; chỗ vị trí được tính; mỗi giả thuyết A–E đúng hay sai kèm file:dòng | `docs/agents/runs/MM-SIM-S1/code-audit.md` | Claude lọc |
| S2 | Claude (chỉ ghi `docs/claude-support/`) | Soạn đặc tả thiết kế v2 từ S0 và S1: mô hình lưới lỗ, bố cục, luật dây, schema dữ liệu mạch, catalog, kiểm tự động. Chọn Claude để tiết kiệm token Sol | `docs/claude-support/2026-11-09-sim-epic/spec-v2.md` | Sol hoặc Luna Plus phản biện |
| S3 | Luna | (đã thay bằng S3a–S3d ở mục 8) | — | — |
| S4 | Luna | (đã thay bằng S4a–S4b ở mục 8) | — | — |
| S5 | Luna | (đã thay bằng S5a–S5d ở mục 8) | — | — |
| S6 | Luna thường + DeepSeek | (đã thay bằng S6a–S6d ở mục 8) | — | — |
| S7 | Antigravity | (xem mục 8) | — | — |

**Cập nhật 10/11/2026:** S0-v2, S0b, S1 đã xong và đã lọc: xem `audit-synthesis.md` (bảng lỗi, phán quyết A–E). S2 đã soạn: `spec-v2.md`. Phán quyết: A sai cho 11 mạch builder (triệu chứng "chỉ CAD" chưa có nguyên nhân); B, C, D đúng một phần; E chưa xác định. Mục 8 là kế hoạch slice mới; Q-SIM-5…7 ở `spec-v2.md` mục 10.

**Cổng chất lượng tự động (thêm ở S4 hoặc S6):** test kiểm mọi mạch bài học thỏa: mọi linh kiện có vị trí và chân, mọi chân có net hoặc được ghi rõ là để hở, không hai linh kiện chồng nhau, mọi dây có hai đầu là chân hợp lệ, mạch nạp được vào `workspaceSpice` (đã có WA-04). Mạch không đạt thì test fail, không hiển thị "chỉ bản vẽ CAD".

## 5. Quyết định founder cần chốt
| Mã | Quyết định | Khuyến nghị |
|---|---|---|
| Q-SIM-1 | Breadboard dạng nào | 2D nhìn từ trên làm mặc định (lỗ, dải nối, dây có đường đi), giữ 3D làm tùy chọn. Dễ học, dễ test hơn 3D |
| Q-SIM-2 | Phạm vi đợt đầu | 6 bài hiện có: mọi mạch phải xem đủ linh kiện và chân |
| Q-SIM-3 | Mục tiêu catalog đợt đầu | Thêm khoảng 20 loại theo nhu cầu bài học, mỗi slice 4–5 loại. Số cụ thể phụ thuộc kết quả S0 |
| Q-SIM-4 | Chấp nhận đổi schema và chuyển bản nháp cũ | Có, kèm Claude review kiểu CP-06 (đọc dữ liệu lưu cũ) |

## 6. Ràng buộc và rủi ro
- Tối đa 2 writer: làn mô phỏng dùng Luna (Plus hoặc thường, thay phiên); Sol đang ở làn phần cứng (A11).
- Mỗi slice ≤5 file, hàm thuần, có test độc lập; không thêm dependency khi chưa duyệt (D18). Nếu dùng thư viện vẽ (ví dụ `wokwi-elements`), đi theo spike P1-L09.
- `CircuitBuilderPage.tsx` 137 KB: không refactor lớn trong một slice; mỗi slice chỉ chạm vùng tối thiểu. Có thể cần slice tách module riêng.
- Dữ liệu linh kiện bên ngoài (hình, CAD): chỉ lấy từ nguồn trạng thái ĐƯỢC DÙNG trong `docs/data-sources/registry.md` (P1-L10).
- Ước lượng token: S3–S5 là phần tốn nhất, nên dồn vào Luna Plus; S6 chia nhỏ cho Luna thường; S0 và S7 cho Antigravity.
- Giả thuyết ở mục 3 chưa kiểm. Nếu S0/S1 cho thấy nguyên nhân khác (ví dụ lỗi dữ liệu nhỏ), kế hoạch rút gọn lại.

## 7. Prompt

### S0 (bản cơ bản; dùng S0-v2 bên dưới thay cho bản này) · Antigravity (kiểm kê trên trình duyệt)
```
Vai trò: tester trình duyệt. KHÔNG sửa file nào trong repo; ghi kết quả vào .tmp/ai-intake/antigravity/<ngày>/ (không ghi thư mục gốc dự án hay screenshots/).
Việc: mở bản build tại http://127.0.0.1:5196 (founder đã chạy vite preview). Với MỖI bài học và MỖI mạch có thể mở trong Phòng thử và trang bài học, ở 3 kích thước 375, 768, 1440 px, ghi: (1) số linh kiện hiển thị trên bản vẽ lắp so với số linh kiện nêu trong phần mô tả hoặc danh sách linh kiện của bài; (2) linh kiện nào thiếu; (3) chỗ nào hiển thị chỉ bản vẽ CAD mà không thấy linh kiện và chân; (4) chỗ nào vị trí linh kiện sai (chồng nhau, nằm ngoài breadboard, chân không chạm lỗ); (5) dây nào đi lung tung (cắt ngang linh kiện, không nối vào chân); (6) breadboard có lỗ thật hay chỉ khối; chụp ảnh từng chỗ lỗi, đặt tên theo bài và ca.
Đầu ra: sim-audit.md với bảng: bài, mạch, kích thước, số linh kiện hiển thị, số linh kiện kỳ vọng, lỗi, tên ảnh. Cuối file liệt kê ca nào KHÔNG thử được và vì sao.
Quy tắc: chỉ ghi điều nhìn thấy; không suy đoán nguyên nhân mã; không đăng nhập; nếu cần tài khoản thì dừng và báo. Đo kích thước bằng quan sát, không bịa số px.
```

### S0-v2 · Antigravity (kiểm kê kỹ toàn bộ phần mạch, mô phỏng và tính điện tử)

Danh sách dưới lấy từ mã nguồn (`builderLessons.ts`, `curriculumSchema.ts`, `lessons.ts`, `SpiceWorkbenchPage.tsx`, `componentRegistry.ts`, `App.tsx`). Đường dẫn trang ngoài những cái đã nêu phải tìm từ menu, không đoán.

```
Vai trò: tester trình duyệt và kiểm tra tính đúng điện tử của ứng dụng học điện tử. KHÔNG sửa file nào trong repo. Mọi kết quả ghi vào .tmp/ai-intake/antigravity/<ngày>/sim-audit-v2/ (không ghi thư mục gốc dự án, không ghi screenshots/ của dự án).

Môi trường: mở http://127.0.0.1:5196 (bản build, founder đã chạy). Đây là việc dài. Làm theo thứ tự khu vực A đến H, GHI KẾT QUẢ SAU MỖI BÀI (đừng để cuối). Nếu phải dừng giữa chừng, ghi vào index.md "đã xong tới: ...; chưa làm: ...".

KHU VỰC VÀ DANH SÁCH PHẢI THỬ (từng mục một, không bỏ):
A. Phòng thử mạch (/build, mở từ menu "Phòng thử"): 11 bài trong bộ chọn bài: analog-potentiometer, analog-ldr, blink, button-led, ir-alert, ultrasonic-distance, seven-segment-counter, source-led, buck-boost-concept, dc-motor-driver, mosfet-switch. Thêm nếu mở được từ giao diện: analog-ldr-reference, analog-thermistor, power-source-safety. Với MỖI bài: đi qua từng bước của thanh bước (stepper), mở mọi chế độ xem có trong giao diện (ít nhất "Lắp mạch · 3D" và "Sơ đồ nguyên lý", và mọi chế độ khác nếu có), chạy mô phỏng nếu có nút chạy, thử đổi giá trị đầu vào (kéo biến trở, đổi ánh sáng LDR, nhấn nút, đổi nhiệt) nếu giao diện cho phép.
B. Trang bài học (/learn/:lessonId): esp32-led, esp32, breadboard, led, resistor, jumper. Thử thêm /learn/<id> cho các id bài ở khu A nếu trang tồn tại.
C. Mô phỏng robot (/app/robot-simulation).
D. SPICE workbench (tìm từ menu): ba mẫu có sẵn divider, rc, led; chạy từng mẫu, thử đổi giá trị, thử phép phân tích nếu có (tran, dc).
E. Máy tính điện tử (trang calculators).
F. Trang Linh kiện: mở chi tiết TỪNG loại trong 28 loại: esp32-devkit, breadboard, led, resistor, electrolytic, button, limit-switch, buzzer, potentiometer, ldr, ir-obstacle, hc-sr04, oled, servo, seven-segment, diode, rgb-led, transistor-bjt, mosfet, dc-motor, ntc, slide-switch, dc-supply, relay, buck, boost, motor-driver, h-bridge-l298n. Ghi: có hình hay mô hình 3D không, có danh sách chân và nhãn chân không, có thông số điện không, có thể thêm vào Phòng thử không.
G. Danh mục board (ESP32 và các board khác): mở từng board, xem chân, xem mô hình 3D nếu có.
H. Các trang liên quan mạch khác nếu tìm thấy trong menu: Bộ lớp học (ClassroomKit), Dự án đã lưu, kiểm tra trước bài (lesson preflight), công cụ firmware hex. Chỉ kiểm phần liên quan mạch.

KIỂM TRA CHO MỖI BÀI/MẠCH (ghi từng mục PASS, FAIL hoặc KHÔNG KIỂM ĐƯỢC):
1. Linh kiện: danh sách linh kiện bài nói tới so với số linh kiện hiển thị; linh kiện nào thiếu.
2. Chân: linh kiện nào hiển thị nhãn chân; nhãn có hợp lý với linh kiện (ví dụ LED có anode/cathode, transistor có B/C/E).
3. Vị trí: linh kiện chồng nhau, nằm ngoài khung, chân không chạm lỗ breadboard, đứng sai chỗ so với mô tả bài.
4. Dây: số dây, mỗi dây nối chân nào với chân nào, dây đi xuyên qua linh kiện, dây cắm vào chỗ không phải chân.
5. Breadboard: có lưới lỗ và dải nối hay chỉ là khối; thử cắm một linh kiện, chân vào lỗ nào, hàng nào nối với hàng nào.
6. Nhất quán giữa các chế độ xem: cùng bài mà mỗi chế độ có cùng số linh kiện và cùng số dây không; chế độ nào chỉ hiện bản vẽ CAD mà không thấy linh kiện và chân.
7. TÍNH ĐIỆN TỬ (quan trọng nhất), kiểm từng ý:
   a. LED có điện trở hạn dòng không; ứng dụng cảnh báo khi thiếu không.
   b. Cực tính LED, diode, tụ điện phân, nguồn: có hiển thị và có phản hồi khi cắm ngược không.
   c. Khi chạy mô phỏng, ghi NGUYÊN VĂN mọi giá trị hiển thị (điện áp, dòng, mức logic, đơn vị). Tự tính lại bằng công thức từ các giá trị linh kiện ĐANG HIỂN THỊ trên màn hình: I = V/R; bộ chia áp Vout = Vin x R2/(R1+R2); LED I = (Vs - Vf)/R với Vf lấy từ giá trị app hiển thị, không tự bịa Vf; RC tau = R x C. Ghi công thức, số liệu vào và số tính được, và chênh lệch. Không bịa giá trị nào app không hiển thị.
   d. Đổi giá trị linh kiện (điện trở, biến trở, LDR, nhiệt) có làm đổi kết quả đúng chiều không (ví dụ tăng R làm giảm dòng).
   e. Mạch hở, ngắn mạch, thiếu GND, thiếu nguồn: app báo gì; có báo sai hoặc không báo không.
   f. Mức nguồn: 3V3 và 5V có phân biệt không; GND có chung không; nối 5V vào chân 3V3 có cảnh báo không.
   g. Đơn vị và định dạng số (mA, V, kΩ) đúng và nhất quán.
   h. Đây là mô phỏng thật (tính từ mạch) hay chỉ hoạt ảnh minh họa cố định: thử thay đổi mạch (xóa một dây, đổi một giá trị) và xem kết quả có đổi không; ghi rõ.
   i. Linh kiện nào trong bài chưa có hành vi điện nào (chỉ là hình).
8. Tương tác: kéo thả, xoay, xóa, hoàn tác nếu có, lưu nháp và tải lại giữ đủ mạch không.
9. Lỗi console của trình duyệt khi thao tác (ghi nguyên văn dòng lỗi đầu tiên).
10. Bố cục: ở 1440 px kiểm đầy đủ mọi mục trên; ở 375 và 768 px chỉ kiểm: số linh kiện và dây có đủ, không tràn ngang, nút bấm được.

PHÂN LOẠI MỖI LỖI: Blocker (không dùng được bài), Major (dạy sai kiến thức điện hoặc mô phỏng sai), Minor (giao diện, bố cục).

ĐẦU RA (đặt trong .tmp/ai-intake/antigravity/<ngày>/sim-audit-v2/):
- index.md: bảng tổng một dòng cho mỗi (khu vực, bài hoặc linh kiện): trạng thái từng mục kiểm 1-10 (PASS/FAIL/KHÔNG KIỂM ĐƯỢC), mức độ lỗi cao nhất, tên file chi tiết.
- area-A.md đến area-H.md: chi tiết, bước tái hiện, tên ảnh.
- electronic-correctness.md: bảng mọi phép tính lại ở mục 7c (bài, giá trị app hiển thị, công thức, số tính được, chênh lệch).
- not-tested.md: mọi thứ không thử được và vì sao.
- Ảnh: tên theo quy ước <khu>-<bài>-<kích thước>-<số thứ tự>.png.

QUY TẮC: chỉ ghi điều quan sát được; KHÔNG suy đoán nguyên nhân trong mã; không đăng nhập, không nhập dữ liệu cá nhân; không đoán đường dẫn trang (tìm từ menu); nếu một phép kiểm cần thông tin app không cho, ghi KHÔNG KIỂM ĐƯỢC; không kết luận "mô phỏng đúng" khi chưa tính lại được.
```

### S0b · Antigravity (độ chính xác của từng board khi xem độc lập)

Bổ sung sau S0-v2: mục G của S0-v2 chỉ yêu cầu "xem chân, xem 3D", chưa yêu cầu đối chiếu với tài liệu hãng. Danh sách board lấy từ `src/data/boards.ts` (ít nhất 20 board; lấy danh sách đầy đủ từ trang danh mục, không bỏ board nào): Seeed XIAO ESP32-C3, Seeed XIAO ESP32-S3, Adafruit QT Py ESP32-C3 (#5405), Adafruit Feather ESP32-S3 TFT (#5483), Adafruit Feather ESP32-S3 (#5323), ESP32 DevKit V1, Arduino Uno R3, Arduino Nano, Arduino Mega 2560 R3, STM32 NUCLEO-F401RE, ESP32-C3-DevKitM-1, ESP32-DevKitM-1, ESP32-S3-DevKitC-1, STM32F103C8T6 Blue Pill, Raspberry Pi Pico, Pico W, Pico 2, Pico 2 H, ESP32-C6-DevKitC-1, STM32 NUCLEO-F411RE.

```
Vai trò: kiểm tra độ chính xác của từng board khi xem ĐỘC LẬP (trang danh mục board, xem một board một mình, xem mô hình 3D, xem bảng chân). KHÔNG sửa file nào trong repo. Mọi kết quả ghi vào .tmp/ai-intake/antigravity/<ngày>/board-audit/ (không ghi thư mục gốc dự án).

Môi trường: http://127.0.0.1:5196, mở trang danh mục board từ menu. Làm từng board một và GHI KẾT QUẢ SAU MỖI BOARD. Nếu dừng giữa chừng, ghi "đã xong tới: ...".

VỚI MỖI BOARD, thực hiện hai phần:

PHẦN 1 · Ghi lại những gì ứng dụng hiển thị (nguyên văn):
a. Tên board, mã hàng hoặc mã sản phẩm, số chân hiển thị, nhà sản xuất.
b. Bảng chân: với từng chân ghi nhãn, số GPIO nếu có, chức năng hiển thị (GPIO, ADC, PWM, I2C, SPI, UART, nguồn 3V3/5V/GND, EN/RESET), thứ tự chân theo hàng. Nếu bảng dài, chụp ảnh và ghi đủ.
c. Mô hình 3D: tải được không, tải chậm bao lâu (ghi cảm nhận, không bịa số), hướng ban đầu, có đủ đầu nối USB, nút bấm, LED, anten, header chân không; chân trên mô hình có đúng vị trí so với nhãn không (bấm hoặc rê vào một chân và xem nó sáng đúng chân nhãn đó không).
d. Kích thước hoặc tỉ lệ app nêu (nếu có); nhãn nguồn, giấy phép, huy hiệu bằng chứng (evidence) hoặc mức tin cậy hiển thị.
e. Các thao tác độc lập: xoay, phóng to, lọc chức năng, tô sáng chân theo chức năng, tải mô hình về (nếu có nút), liên kết nguồn.

PHẦN 2 · Đối chiếu với tài liệu CHÍNH THỨC của hãng:
f. Tìm trang pinout hoặc datasheet chính thức (trang của Espressif, Arduino, Raspberry Pi, STMicroelectronics, Seeed, Adafruit). Ghi URL đã mở và ngày truy cập. Không dùng blog, diễn đàn, hay trang bán hàng bên thứ ba làm nguồn chính; nếu chỉ có nguồn không chính thức thì ghi rõ "chỉ có nguồn không chính thức".
g. So từng chân app hiển thị với tài liệu: ghi KHỚP, SAI hoặc KHÔNG KIỂM ĐƯỢC. Ghi chi tiết mọi chân SAI: app ghi gì, tài liệu ghi gì, trang tài liệu.
h. Kiểm riêng các điểm dễ sai: nhãn in trên board so với số GPIO (ví dụ D13 so với GPIO13); chân chỉ vào (ESP32: GPIO34 đến 39); chân nối flash (ESP32: GPIO6 đến 11); chân strapping và chân khởi động; ADC2 không dùng được khi Wi-Fi bật (ESP32); chân nào chịu được 5 V và chân nào chỉ 3,3 V; phân biệt chân VIN, 5V, 3V3; chân I2C, SPI, UART mặc định; số chân thật so với số chân app nêu.
i. Kích thước: nếu tài liệu chính thức có kích thước (dài, rộng, bước chân 2,54 mm), so với tỉ lệ mô hình 3D bằng ảnh chụp thẳng (ghi là ƯỚC LƯỢNG và nêu cách đo). Nếu không có kích thước chính thức, ghi "không có kích thước chính thức để so".
j. Linh kiện chính và đầu nối trên board thật so với mô hình 3D: thiếu hay thừa thứ gì.

BOARD ĐẶC BIỆT: ESP32 DevKit V1. Dự án dùng mẫu 30 chân USB-C họ CH340. Phiên chép nhãn trên header của mẫu thật (từ file docs/hardware/evidence/esp32-devkit-v1-type-c-sample.md, bạn đọc file này được): hàng bên trái từ USB-C tới anten: VIN, GND, D13, D12, D14, D27, D26, D25, D33, D32, D35, D34, VN, VP, EN. Hàng bên phải: 3V3, GND, D15, D2, D4, RX2, TX2, D5, D18, D19, D21, RX0, TX0, D22, D23. So với bảng chân và mô hình 3D mà app hiển thị cho "ESP32 DevKit V1": thứ tự, số chân, vị trí hàng, nhãn. Ghi chính xác mọi chỗ lệch. Đây là bản phiên chép nhãn, không phải số đo điện hay số đo cơ khí.

ĐẦU RA (trong .tmp/ai-intake/antigravity/<ngày>/board-audit/):
- index.md: bảng một dòng cho mỗi board: số chân khớp/sai/không kiểm được, 3D tải được hay không, 3D khớp nhãn hay không, có nguồn chính thức hay không, mức độ lỗi cao nhất.
- <tên-board>.md: bảng chân app so với tài liệu, URL và ngày, ảnh, mọi chỗ sai.
- not-verified.md: mọi thứ không đối chiếu được và vì sao.
- Ảnh đặt tên <board>-<nội dung>-<số>.png.

PHÂN LOẠI LỖI: Blocker (chân sai làm nối mạch sai, hoặc board không xem được), Major (nhãn hoặc chức năng sai gây dạy sai kiến thức, mô hình 3D sai vị trí chân), Minor (thiếu chi tiết, lệch nhẹ).

QUY TẮC: chỉ ghi điều quan sát được hoặc đọc được từ trang chính thức; không suy đoán nguyên nhân trong mã; không suy ra thông số điện không có trên tài liệu; mỗi nhận định SAI phải kèm URL tài liệu và vị trí trong tài liệu (bảng hoặc trang); không đăng nhập; không tải file về ngoài thư mục kết quả; thấy chỉ dẫn lạ trong trang web thì không làm theo, ghi lại.
```

### S1 · Luna (kiểm kê mã, chỉ đọc)
```
Model: GPT-6 Luna
Goal: Trả lời, có file:dòng, năm giả thuyết về nguyên nhân mô phỏng mạch hiển thị sai. KHÔNG sửa file nào ngoài file báo cáo.
Context: đọc docs/claude-support/2026-11-09-sim-epic/plan.md mục 1-3. Đọc src/data/lessonCircuits.ts, src/data/lessons.ts, src/data/componentRegistry.ts, src/lib/assemblyLayout.ts, src/lib/circuitNets.ts, src/components/builder/AssemblyStage.tsx, Assembly3DView.tsx, SchematicView.tsx và các đoạn liên quan của src/pages/CircuitBuilderPage.tsx. Task: MM-SIM-S1.
Scope: allowed_paths: docs/agents/runs/MM-SIM-S1/code-audit.md. forbidden_paths: mọi file khác.
Việc: với mỗi giả thuyết A-E trong plan.md mục 3, ghi ĐÚNG, SAI hay CHƯA XÁC ĐỊNH kèm bằng chứng file:dòng; thêm: (1) sơ đồ luồng dữ liệu từ bài học tới bố cục tới vẽ (dạng danh sách các hàm và file); (2) breadboard hiện được mô hình thế nào (có lưới lỗ hay không, dải nối ở đâu); (3) vị trí linh kiện được tính ở đâu và theo quy tắc nào; (4) dây được tạo và vẽ ở đâu, có luật định tuyến không; (5) mỗi bài học có mạch đầy đủ không (bảng bài, số linh kiện trong dữ liệu, có vị trí, có chân, có net); (6) những phần nên giữ nguyên và những phần nên viết lại; (7) rủi ro khi sửa CircuitBuilderPage.tsx.
Constraints: không sửa mã, không chạy lệnh làm đổi dữ liệu; có thể chạy typecheck và test nếu cần xác minh, ghi lệnh và exit code. Điều không chắc ghi CHƯA XÁC ĐỊNH, không đoán.
Done when: file báo cáo tồn tại, mỗi giả thuyết có phán quyết và bằng chứng; báo cáo ghi các file đã đọc và các file chưa đọc.
Claude review: Claude lọc báo cáo (kiểm lấy mẫu 5 file:dòng).
```

## 8. Slice cụ thể S2r–S7 (cập nhật 10/11/2026, theo `spec-v2.md`)

Quy ước: Luna = GPT-6 Luna (Plus hoặc thường, thay phiên); mọi slice ≤5 file (tính cả test và fixture); "xong" là điều kiện nhị phân; lệnh trên Windows dùng `npm.cmd`. Test mới theo mẫu `tests/assembly-plan.test.mjs` (`vite createServer` + `ssrLoadModule`) vì mã là TypeScript. Tối đa 2 writer cùng lúc; làn mô phỏng chỉ dùng Luna; Sol ở làn phần cứng. AI ngoài (Antigravity, DeepSeek) chỉ ghi `.tmp/ai-intake/`.

| Slice | Ai | File (tối đa) | Xong khi (nhị phân) | Claude review |
|---|---|---|---|---|
| S0c (XONG, đã lọc 10/11) | Antigravity | chỉ `.tmp/ai-intake/antigravity/<ngày>/sim-audit-v3/` | Mỗi bài builder (11), 3 chủ đề tham khảo, 14 board "chỉ hồ sơ": một ảnh riêng cho từng chế độ xem, **băm md5 các ảnh khác nhau**, kèm kích thước 1440 và ghi số part/dây đếm từ DOM; mọi chỗ "chỉ CAD" có ảnh | Claude lọc (md5, mở 5 ảnh) |
| S2r (XONG, đã lọc 10/11; sửa spec ở `spec-v2.md` mục 12) | Luna Plus hoặc Sol (chỉ đọc) | `docs/agents/runs/MM-SIM-S2R/review.md` | Phản biện `spec-v2.md`: mỗi điều khoản MUST có phán xử khả thi/không + file:dòng; nêu giả định sai | Claude lọc |
| S3a | Luna | `src/lib/breadboardGrid.ts`, `tests/breadboard-grid.test.mjs` | 400 lỗ định danh vòng tròn parse→format; `holeNet` đúng luật dải/ray; tọa độ mm khớp `holePoint` ≥3 lỗ; `npm.cmd run typecheck` và `npm.cmd test` exit 0 | KHÔNG |
| S3b | Luna | `src/lib/circuitDocV2.ts`, `src/lib/mountResolve.ts`, `tests/circuit-doc-v2.test.mjs` | Kiểu `CircuitDocV2` + validator G1-G4; `canMount` từ chối đúng 4 ca xấu (chân trùng lỗ, đoản dải, chồng footprint, type lạ); doc `blink` hợp lệ; typecheck và test exit 0 | **CÓ** (schema mới) |
| S3b-fix | Luna | `src/lib/circuitDocV2.ts`, `src/lib/breadboardGrid.ts`, `tests/circuit-doc-v2.test.mjs` | Theo `docs/claude-support/2026-11-10-s3ab-review/review-result.md`: F1 (đầu dây và chân cùng lỗ bị G4), F2 (`row:''`, `'ab'` → null), F4 (`canMount` trả `code`), F5 (test xoay 90°); typecheck và test exit 0 | KHÔNG (Claude xem lại diff) |
| S3c | Luna | `src/lib/circuitNetsV2.ts`, `tests/circuit-nets-v2.test.mjs` | Net của `blink` v2 đúng bảng trong `spec-v2.md` mục 6; doc chỉ có dây pin-pin cho cùng kết quả với `createNetIndex` hiện có; không sửa `circuitNets.ts`; typecheck và test exit 0 | KHÔNG |
| S3d | Luna thường | `src/lib/migrateV1toV2.ts`, `tests/migrate-v1-v2.test.mjs`, `tests/fixtures/workspace-v4-*.json` (≤3) | Nguồn thật là workspace `schemaVersion: 4` (khóa local `machmo-builder-session`, `machmo-lesson-drafts`, `machmo-branch-session`; khóa session `machmo-guided-*`, xem `spec-v2.md` R7); `migrate` giữ id/type/dây và mọi trường khác của ≥3 fixture (đủ 4 họ khóa), ghi khóa `machmo-circuit-v2-*`, không ghi đè khóa cũ, cảnh báo dây hở; test exit 0 | **CÓ** (CP-06, dữ liệu lưu cũ) |
| S3e | Luna | `src/lib/compileSpiceConnections.ts`, `tests/compile-spice-connections.test.mjs` | Từ `blink` v2 và `analog-potentiometer` v2 sinh `connections` pin-pin; `workspaceSpice` nạp được, kết quả net giống bản v1; **không sửa `workspaceSpice.ts`**; test exit 0 (G9) | KHÔNG |
| S4a | Luna | `src/lib/layout2D.ts`, `tests/layout-2d.test.mjs` | `layout2D(doc)` tất định; không hai footprint chồng với đệm 0,5 mm ở mọi doc mẫu; làn bench đúng luật; test exit 0 | KHÔNG |
| S4b | Luna Plus | `src/lib/wireRouter.ts`, `tests/wire-router.test.mjs` | Router A* tất định; ≤3 rẽ cho doc `blink`; không dây qua footprint; không dây song song chồng; 16 dây (7-đoạn) < 200 ms (đo, ghi số); test exit 0 | KHÔNG (Claude xem 1 hình mẫu) |
| S4c | Luna | `tests/circuit-gates.test.mjs`, `src/lib/circuitGates.ts` | G1-G10 chạy trên mọi doc có trong danh sách; thêm doc xấu thì test fail đúng cổng | KHÔNG |
| S5a | Luna | `src/components/builder/BuilderViewSwitch.tsx`, `src/pages/CircuitBuilderPage.tsx` (chỉ vùng ~994-1003), 1 test | Tách nút chọn view; hành vi không đổi; typecheck và test exit 0; diff trang ≤40 dòng | KHÔNG |
| S5b | Luna Plus | `src/components/builder/BreadboardTopView.tsx`, `src/components/builder/breadboard-top-view.css`, `tests/breadboard-top-view.test.mjs` | Render SVG: 400 lỗ, part đúng chân, dây theo polyline; có `data-testid` `circuit-part`/`circuit-wire`/`circuit-pin` và `data-view`; test đếm phần tử khớp `expect`; không dùng tọa độ % cũ | KHÔNG |
| S5e | Luna | `src/pages/CircuitBuilderPage.tsx` (chỉ vùng chọn view) và 1 test, tối đa 3 file | Theo Q-SIM-8(a): nút "PCB 2D · đường đồng" đổi nhãn "PCB board (tham chiếu)" và ra khỏi hàng chọn view mạch (hoặc theo quyết định founder); typecheck và test exit 0; diff ≤40 dòng | KHÔNG |
| S5c | Luna | `src/components/builder/SchematicView.tsx`, `Assembly3DView.tsx`, `AssemblyStage.tsx`, 1 test | Cả hai view đọc `routeWires`/`layout2D`, bỏ H-V-H; G10 parity đạt | KHÔNG |
| S5d | Luna | e2e theo cấu trúc hiện có (Luna xác định trong `scripts/run-browser-tests.mjs`), ≤2 file | G11 (đếm part/dây trong DOM) và G12 (băm ảnh khác nhau giữa các view) chạy ở 375/768/1440 px, `npm.cmd run test:e2e` exit 0 | Claude lọc báo cáo |
| S6a | Luna thường | `src/data/lessonCircuits/{blink,source-led,button-led}.ts` + index (≤4) | 3 doc v2 qua G1-G10; chân thật và lỗ hợp lệ | **CÓ** (lần đầu dữ liệu v2) |
| S6b | Luna thường | `…/{analog-potentiometer,analog-ldr,ir-alert}.ts` (≤4) | 3 doc qua G1-G10; `analog-*` nạp được vào `workspaceSpice` (G9) | KHÔNG |
| S6c-n | Luna thường (DeepSeek chuẩn bị) | dữ liệu footprint/chân cho 4–5 loại mỗi slice (≤5 file); DeepSeek chỉ soạn bảng trong `.tmp/ai-intake/`, nguồn phải thuộc `docs/data-sources/registry.md` trạng thái ĐƯỢC DÙNG, `D17-LIC` | Mỗi loại có `footprint`, `legsMm`/`pinsMm`, nhãn chân; G2 đạt | Claude lọc nguồn |
| S6d | Luna thường | 2 bài đợt hai (`ultrasonic-distance`, `seven-segment-counter`), rồi 3 bài bench; ≤4 file mỗi slice | qua G1-G10; 7-đoạn ≤3 góc rẽ/dây hoặc ghi cảnh báo | KHÔNG |
| S7 | Antigravity | chỉ `.tmp/ai-intake/` | Chạy lại kịch bản S0c cho mọi bài ở 3 kích thước, so với baseline S0c; G12 đạt | Claude lọc |

Thứ tự và song song: S0c và S2r chạy ngay, song song (chỉ đọc/ghi `.tmp` hoặc `docs/agents/runs`). Chờ **S2r + founder chốt Q-SIM-1…7** rồi mở S3a. S3a → S3b → S3c tuần tự (cùng kiểu dữ liệu); S3d song song S3c khi S3b xong. S4a/S4b sau S3b. S5 sau S4. S6a sau S4c.
Đo token: S3–S5 dồn Luna Plus; S3d, S6 chia nhỏ cho Luna thường; Antigravity cho S0c và S7.

## 9. Prompt dán sẵn

### S0c · Antigravity (chụp lại đúng từng chế độ xem)
```
Vai trò: tester trình duyệt. KHÔNG sửa file nào trong repo. Ghi kết quả vào .tmp/ai-intake/antigravity/<ngày>/sim-audit-v3/ (không ghi thư mục gốc, không ghi screenshots/).
Bối cảnh: kiểm kê lần trước (sim-audit-v2) có ảnh "lắp mạch", "sơ đồ", "3D", "PCB" trùng byte cho cả 11 bài, nên không chứng minh được gì về vị trí và dây. Lần này mỗi chế độ xem phải có ảnh riêng.
Môi trường: http://127.0.0.1:5196. Với MỖI bài /build: blink, button-led, ir-alert, ultrasonic-distance, seven-segment-counter, source-led, buck-boost-concept, dc-motor-driver, mosfet-switch, analog-potentiometer, analog-ldr: (1) chọn bài, vào bước "Lắp mạch"; (2) lần lượt bấm từng chế độ xem ("Mạch lắp thử · logic", "Sơ đồ nguyên lý", "Lắp mạch · 3D", "PCB 2D · đường đồng"); SAU MỖI lần bấm chờ vùng xem đổi nội dung rồi cuộn vùng đó vào giữa khung và chụp RIÊNG vùng chế độ xem (element screenshot, không chụp cả trang); (3) ghi từ DOM: số part, số dây, số chân có nhãn của chế độ đó.
Sau khi chụp xong, tự chạy md5sum cho các ảnh cùng bài; nếu hai ảnh của hai chế độ trùng byte thì chụp lại, và ghi vào index.md "chế độ X không khác chế độ Y" nếu thật sự giống.
Thêm: mở 3 chủ đề tham khảo (analog-ldr-reference, analog-thermistor, power-source-safety) và 14 board "HỒ SƠ TRA CỨU · CHƯA CÓ VIEWER" ở /boards; ghi "xem được linh kiện và chân không" kèm ảnh.
Ở 1440 px ghi lại mọi chỗ: part chồng nhau, part nằm ngoài khung, dây cắt qua part, chân không chạm lỗ. Mỗi lỗi một ảnh crop sát chỗ lỗi.
Đầu ra: index.md (bảng bài × chế độ xem × số part × số dây × lỗi × tên ảnh), md5.txt (kết quả md5sum), not-tested.md.
Quy tắc: chỉ ghi điều quan sát được; không suy đoán nguyên nhân mã; không đăng nhập; việc kiểm "PASS vị trí" chỉ được ghi PASS khi có ảnh crop dẫn chứng.
```

### S2r · Luna Plus hoặc Sol (phản biện spec, chỉ đọc)
```
Model: GPT-6 Luna Plus (hoặc Sol nếu Luna Plus bận)
Goal: Phản biện `docs/claude-support/2026-11-09-sim-epic/spec-v2.md` về khả thi kỹ thuật; không sửa mã, không sửa spec.
Context: đọc `spec-v2.md`, `audit-synthesis.md` (cùng thư mục), `docs/agents/runs/MM-SIM-S1/code-audit.md`, `src/lib/assemblyLayout.ts`, `src/data/component-models.manifest.json` (mục `breadboard`), `src/lib/circuitNets.ts`, `src/lib/workspaceStorage.ts`, `src/lib/workspaceSpice.ts`. Task: MM-SIM-S2R.
Scope: allowed_paths: `docs/agents/runs/MM-SIM-S2R/review.md`. forbidden_paths: mọi file khác.
Constraints: mỗi điều khoản MUST trong `spec-v2.md` mục 1-5, 8 có phán xử KHẢ THI / KHÔNG KHẢ THI / CHƯA XÁC ĐỊNH kèm file:dòng; ưu tiên kiểm (a) số lỗ ray và `gridMm` có đủ cho `bb1:T+:1..25`, (b) `legsMm`/`pinsMm` của 27 part còn lại có tồn tại không, (c) `workspaceStorage.ts` lưu nháp thế nào và khóa nào, (d) `workspaceSpice` đọc net từ đâu, (e) router A* trên lưới nửa bước có hợp lý với 16 dây. Điều không chắc ghi CHƯA XÁC ĐỊNH.
Approval boundaries: không chạy lệnh làm đổi dữ liệu; được chạy `npm.cmd run typecheck` và `npm.cmd test` nếu cần, ghi lệnh và exit code.
Done when: file review.md tồn tại; mọi MUST được phán xử; liệt kê giả định sai của spec và đề xuất sửa (không tự sửa).
Report: file đã đọc, file chưa đọc, lệnh và exit code.
Claude review: Claude lọc (lấy mẫu 5 file:dòng).
```

### S3a · Luna (lưới breadboard thuần)
```
Model: GPT-6 Luna (Plus nếu có)
Goal: Viết mô hình lưới breadboard bằng hàm thuần, có test, không đụng giao diện. Đây là lõi của epic SIM v2.
Context: đọc `docs/claude-support/2026-11-09-sim-epic/spec-v2.md` mục 1-3 và `audit-synthesis.md` mục 3 (E-01). Mesh `breadboard` trong `src/data/component-models.manifest.json` có `gridMm`: pitch 2.54, columns 30, 10 hàng (5+5, rãnh giữa 7.62 mm), 4 ray. Xem `src/lib/assemblyLayout.ts` dòng 93-96 (`holePoint`, `stripOf`) và 203-223 (đọc `gridMm`, cột 0-29, hàng 0-9) để giữ hình học khớp. Test theo mẫu `tests/assembly-plan.test.mjs`. Task: MM-SIM-S3A.
Scope: allowed_paths: `src/lib/breadboardGrid.ts` (mới), `tests/breadboard-grid.test.mjs` (mới), `docs/agents/runs/MM-SIM-S3A/`. forbidden_paths: `src/lib/assemblyLayout.ts` và mọi file khác trong `src/`, `package.json`, `docs/claude-support/**`, `docs/hardware/claude-support/**`, `.codex/**`.
Việc: xuất các hàm thuần (không DOM, không Three.js): `parseHole(id)`, `formatHole(...)`, `holeToMm(hole, gridMm)`, `holeNet(hole, opts?: {railSplit?: boolean})`, `stripHoles(hole)`, `railHoles(railId)`, `snapNearest(pointMm, gridMm)`. Định danh lỗ: `bb1:<cột 1..30><hàng a..j>` và ray `bb1:T+:1..25`, `bb1:T-:…`, `bb1:B+:…`, `bb1:B-:…` (ánh xạ hàng 0-4 → a-e, 5-9 → f-j). Luật: 5 lỗ cùng cột và cùng nửa là một nút; hai nửa không nối nhau; mọi lỗ cùng ray là một nút (mặc định không đứt giữa); Ray: `gridMm` KHÔNG có số lỗ ray (chỉ 4 giá trị Z, S2r đã xác nhận). Định nghĩa `BreadboardElectricalSpec = { columns, rows, railHoles: 25, railGroup: 5, source: 'assumption-400-tie' }` tách khỏi manifest, `railX(i)` theo nhóm 5 lỗ; ghi comment "giả định bo 400 lỗ, chưa đối chiếu hình" và xuất cờ `railVerified: false`. Hàm trả lỗi bằng giá trị (null hoặc Result), không ném lỗi với đầu vào xấu.
Constraints: không thêm dependency; TypeScript strict; không sửa `assemblyLayout.ts` (đừng refactor, chỉ đối chiếu); không import React; mọi hàm tất định.
Approval boundaries: dừng và hỏi founder trước khi xoá file, thêm dependency, đổi `gridMm` hay manifest.
Done when (đủ 6 điều, nhị phân): (1) 400 định danh lỗ parse→format vòng tròn không lệch; (2) `holeNet` đúng: 10a…10e cùng nút, 10e khác 10f, 10a khác 11a, `T+` khác `T-`; (3) tọa độ mm của ≥3 lỗ khớp `holePoint` của `assemblyLayout.ts` (sai số ≤1e-9); (4) đầu vào xấu (`bb1:31a`, `bb1:5k`, chuỗi rỗng) trả null, không ném; (5) `npm.cmd run typecheck` exit 0; (6) `npm.cmd test` exit 0 gồm test mới.
Report: file đã đổi, lệnh + exit code, mọi giả định chưa kiểm (đặc biệt số lỗ ray), ghi vào `docs/agents/runs/MM-SIM-S3A/`.
Claude review: KHÔNG
```

### S3b · Luna (kiểu CircuitDocV2, kiểm tra, gắn linh kiện)
```
Model: GPT-6 Luna (Plus nếu có)
Goal: Định nghĩa kiểu `CircuitDocV2`, validator cổng G1-G4, và hàm gắn linh kiện vào lỗ (`canMount`), tất cả thuần và có test. Chưa nối vào giao diện.
Context: đọc `spec-v2.md` mục 2, 6, 8 (cổng G1-G4) và `docs/agents/runs/MM-SIM-S3A/` (S3a xong, dùng `src/lib/breadboardGrid.ts`). Registry linh kiện: `src/data/componentRegistry.ts` (28 loại, `pins`). Manifest mesh có `legsMm`, `pinsMm`, `sizeMm` (`src/data/component-models.manifest.json`, `src/data/componentModels.ts:7`). Task: MM-SIM-S3B.
Scope: allowed_paths: `src/lib/circuitDocV2.ts` (mới), `src/lib/mountResolve.ts` (mới), `tests/circuit-doc-v2.test.mjs` (mới), `docs/agents/runs/MM-SIM-S3B/`. forbidden_paths: mọi file khác, đặc biệt `src/data/lessonCircuits.ts`, `src/lib/circuitNets.ts`, `src/lib/assemblyLayout.ts`, `package.json`, `docs/claude-support/**`.
Việc: (1) kiểu theo `spec-v2.md` mục 6 (parts có `mount` breadboard|bench, wires với `Endpoint` pin|hole, `openPins`, `expect`); (2) `validateCircuitDoc(doc, registry)` trả danh sách lỗi có mã cổng G1-G4 và thông báo tiếng Việt; (3) `footprintHoles(part)`, `canMount(part, mount, doc)` trả `{ok:true}` hoặc `{ok:false, reason}`, `occupancy(doc)`. Cổng G2 tách đôi (`spec-v2.md` mục 12, R3-R4): G2a chặn nếu part thiếu `legsMm` (part mount breadboard) hoặc `pinsMm` (part bench); G2b chỉ cảnh báo khi `geometrySource` là `parametric` hoặc `unknown`. Part mount breadboard hay bench lấy từ `mount` trong manifest (S2r: `ultrasonic` và `tb6612` cắm breadboard được; 9 loại có `legsMm` rỗng là bench). Không đoán chân thiếu: trả lỗi rõ và LIỆT KÊ các loại thiếu trong báo cáo.
Constraints: hàm thuần; không dependency mới; không zod (D18); không sửa dữ liệu bài học hiện có; không dùng tọa độ % cũ.
Approval boundaries: dừng và hỏi founder trước khi đổi schema đã chốt trong spec, xoá file, thêm dependency.
Done when (nhị phân): (1) doc `blink` theo ví dụ ở `spec-v2.md` mục 6 hợp lệ; (2) 4 doc xấu bị từ chối đúng mã cổng: type lạ (G2), hai chân cùng một lỗ (G4), hai chân cùng dải của cùng linh kiện không khai `intentionalShort` (G4), hai footprint chồng (G5, nếu cài ở slice này, còn không ghi hoãn S4a); (3) endpoint `pin` trỏ chân không tồn tại bị G3 bắt; (4) báo cáo liệt kê mọi loại part thiếu `legsMm`; (5) `npm.cmd run typecheck` exit 0; (6) `npm.cmd test` exit 0.
Report: file đã đổi, lệnh + exit code, danh sách loại part thiếu dữ liệu chân, ghi vào `docs/agents/runs/MM-SIM-S3B/`.
Claude review: CÓ (đọc kiểu `CircuitDocV2` và validator trước khi S3c/S3d/S6 dựa vào).
```

### S3c · Luna (net theo lỗ và dải)
```
Model: GPT-6 Luna
Goal: Tạo `createNetIndexV2(doc)`: net gồm dây, dải, ray và chân linh kiện cắm vào lỗ, tương thích khóa endpoint với `createNetIndex` hiện có.
Context: đọc `spec-v2.md` mục 3 và 6, `src/lib/circuitNets.ts` (dòng 13-45), `src/lib/breadboardGrid.ts` (S3a), `src/lib/circuitDocV2.ts` và `src/lib/mountResolve.ts` (S3b). Task: MM-SIM-S3C.
Scope: allowed_paths: `src/lib/circuitNetsV2.ts` (mới), `tests/circuit-nets-v2.test.mjs` (mới), `docs/agents/runs/MM-SIM-S3C/`. forbidden_paths: `src/lib/circuitNets.ts` (không sửa), mọi file khác.
Việc: union-find trên (a) endpoint dây; (b) lỗ cùng dải hoặc ray (`holeNet`); (c) chân part ↔ lỗ nó cắm (qua `footprintHoles`); (d) chân nội bộ cùng net (hai chân GND của board). Xuất `netOf(key)`, `netsList()`, và khóa tương thích `partId:pinId`.
Constraints: tất định; không dependency mới; không sửa `circuitNets.ts`.
Approval boundaries: dừng và hỏi trước khi đổi chữ ký hàm trong `circuitNets.ts` hay xoá file.
Done when (nhị phân): (1) net của doc `blink` v2 đúng bảng sau: GPIO23 ∪ R1.chân1 ∪ lỗ 10a-10e; R1.chân2 ∪ LED.anode ∪ lỗ dải 14; LED.cathode ∪ ray `T-` ∪ board GND; đúng 3 net có từ 2 chân trở lên; chân của R1 và LED không chân nào ở ngoài ba net đó (chân board không dùng được phép để hở); (2) doc chỉ có dây pin-pin cho cùng phân hoạch net với `createNetIndex` hiện có (so sánh trên 2 doc mẫu); (3) hai chân khác dải không bị gộp; (4) `npm.cmd run typecheck` exit 0; (5) `npm.cmd test` exit 0.
Report: file đã đổi, lệnh + exit code, ghi vào `docs/agents/runs/MM-SIM-S3C/`.
Claude review: KHÔNG
```
