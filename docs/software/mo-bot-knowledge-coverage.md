# Mở Bot — độ phủ kiến thức và giới hạn

MM-SW-GUIDE-KB-002 · 16/11/2026 · source snapshot trong bảng SHA-256 cuối tài liệu.

Kho có **147 mục catalog** và **18 FAQ giải thích được giữ nguyên**. Đây là truy hồi kiến thức cục bộ từ app, không phải AI sinh câu trả lời và không phải kiến thức mọi linh kiện trên Internet. Không đọc bài đăng, code, dữ liệu riêng hoặc gửi câu hỏi ra máy chủ. Chỉ snapshot tên bài/board/mục chọn/diagnostics do trang chia sẻ được dùng khi câu hỏi tham chiếu rõ board/linh kiện hiện tại.

| Nguồn hiện hành | Số mục | Cách lấy |
|---|---:|---|
| boards | 28 | boards.ts, revision/MCU/logic/source links; simulationTargets tìm chính xác ID, không dùng fallback |
| public components | 59 | components.ts + componentReferences.ts; nối model bằng catalogId như componentCatalog |
| workspace types | 28 | componentRegistry.ts; chân là ID/label mô hình, không phải package pinout |
| curriculum | 11 | curriculumSchema.ts + builderLessons.ts + getLessonEntryRoute |
| product features | 15 | productFeatureRegistry.ts; chú giải giới hạn riêng runtime/community |
| calculators/handoff | 5 | 4 hàm electronicsCalculators + LDR analogDivider/calculatorSpice |
| feedback | 1 | FeedbackPage/feedbackDraft; copy/download chưa phải gửi |

Tên, nội dung role/use/caution, board facts, source kind/note và bài học đọc từ registry khi build, không chép lại cả catalog. Phần bổ sung có curation: alias ngắn cho board đã xác minh, giải thích công thức/giới hạn tool, delivery semantics feedback/community. Không gọi calculator để đoán kết quả số khi thiếu inputs; không tự chọn trị số resistor/MPN/công suất từ tên model.

## Tìm kiếm và nguồn

Tìm theo cụm token có ranh giới, bỏ dấu tiếng Việt, tên/model/ID chính xác và intent; tên variant dài thắng tên cơ sở ở cùng vị trí. Hai board khác nhau trong cùng câu hỏi yêu cầu làm rõ, không trộn facts. Họ STM32/ESP32/Arduino chưa đủ định danh; clone/model ngoài kho hoặc yêu cầu GPIO cụ thể chưa có contract an toàn trả unknown. Không auto-profile board không có simulationTarget. Board có target chỉ giải thích LED mapping đã ghi của bài hỗ trợ và ADC full-scale nếu trường đó thực sự tồn tại; không suy từ board gần giống.

FAQ cũ và interface GUIDE_ARTICLES/findGuideAnswers/getContextAdvice được giữ; findGuideAnswers thêm snapshot tùy chọn. Các câu FAQ keyword chính xác vẫn dùng giải thích curated. Nguồn bổ sung qua sources? tùy chọn; source cũ là route thực hành. UI dùng RouterLink đúng app alias cho route, anchor noreferrer/noopener cho HTTPS và tài liệu tĩnh (NOTICE/PDF), bỏ protocol không an toàn. Các source URL là provenance đã có trong repo, **chưa crawl/verify khả dụng HTTP mới**. Không claim link hãng đã tải lại hoặc datasheet mới đã đọc.

Phân biệt rõ hình học/CAD tham chiếu, kịch bản giáo dục/trace subset, firmware execution đúng target/artifact, circuit solver model và quan sát vật lý. Xem được model hay có tên board không tự tạo hỗ trợ chạy/mô phỏng. Community online chỉ có sau Supabase setup và live checks; backend hiện vẫn NOT_RUN. Freestyle tour bắt đầu trống; generic LED entry là /learn/blink có chọn board, lesson deep links giữ đúng ID.

## Lỗ bằng chứng và ánh xạ

- **46 public component records chưa ở mức exact** trong componentReferences: có thể có datasheet chip hoặc hướng dẫn chung nhưng chưa xác nhận đúng module/MPN/package thật. Không phải thiếu mọi nguồn: hiện 0 catalog entries thiếu hoàn toàn source link bổ sung. Nguồn chip không xác nhận breakout.
- **31 public records không có catalogId mapping trực tiếp** vào loại workspace. Đây là inventory gap, không bị gắn nhãn có mô phỏng. Board profile route có thể vẫn tồn tại riêng.
- **7 boards không có target giáo dục**; model/geometry vẫn chỉ tham chiếu.

Exact-source gaps: component:stm32-blue-pill, component:resistor, component:potentiometer, component:led, component:button, component:ldr, component:ntc, component:dht22, component:hc-sr04, component:pir, component:slide-switch, component:limit-switch, component:buzzer, component:servo, component:dc-motor, component:motor-driver, component:mosfet, component:relay, component:oled, component:lcd1602, component:neopixel, component:rgb-led, component:ir-obstacle, component:photoresistor-module, component:soil, component:mpu6050, component:bmp280, component:ir-receiver, component:diode, component:capacitor, component:electrolytic, component:transistor-bjt, component:breadboard, component:jumper, component:usb-cable, component:logic-level, component:dc-supply, component:power-bank, component:buck, component:boost, component:h-bridge-l298n, component:soil-relay-pump, component:rotary-encoder, component:rfid, component:mosfet-module, component:seven-segment.

Workspace mapping gaps: seeed-xiao-esp32c3, seeed-xiao-esp32-s3, adafruit-qtpy-esp32-c3-5405, adafruit-feather-esp32-s3-tft-5483, adafruit-feather-esp32-s3-5323, arduino-uno, arduino-nano, arduino-mega, stm32-f401, stm32-blue-pill, rp2040-pico, rp2350-pico-2-h, esp32-s3, dht22, pir, lcd1602, neopixel, photoresistor-module, soil, mpu6050, bmp280, ir-receiver, capacitor, jumper, usb-cable, logic-level, power-bank, soil-relay-pump, rotary-encoder, rfid, mosfet-module.

Target gaps: seeed-xiao-esp32c3, seeed-xiao-esp32-s3, adafruit-qtpy-esp32-c3-5405, adafruit-feather-esp32-s3-tft-5483, adafruit-feather-esp32-s3-5323, esp32-devkitm-1, raspberry-pi-pico-2-h.

## Inventory IDs theo registry

**board**: seeed-xiao-esp32c3, seeed-xiao-esp32-s3, adafruit-qtpy-esp32-c3-5405, adafruit-feather-esp32-s3-tft-5483, adafruit-feather-esp32-s3-5323, esp32-devkit, arduino-uno-r3, arduino-nano-classic, arduino-mega-2560-r3, stm32-nucleo, esp32-c3-devkitm-1, esp32-devkitm-1, esp32-s3-devkitc-1, stm32-blue-pill-f103, raspberry-pi-pico, raspberry-pi-pico-w, raspberry-pi-pico-2, raspberry-pi-pico-2-h, esp32-c6-devkitc-1, stm32-nucleo-f411re, arduino-uno-r4-minima, arduino-uno-r4-wifi, arduino-nano-esp32, arduino-nano-every, esp32-s2-devkitc-1, esp32-h2-devkitm-1, stm32-nucleo-l476rg, stm32-nucleo-f446re.

**component**: seeed-xiao-esp32c3, seeed-xiao-esp32-s3, esp32-devkit, adafruit-qtpy-esp32-c3-5405, adafruit-feather-esp32-s3-tft-5483, adafruit-feather-esp32-s3-5323, arduino-uno, arduino-nano, arduino-mega, stm32-f401, stm32-blue-pill, rp2040-pico, rp2350-pico-2-h, esp32-s3, resistor, potentiometer, led, button, ldr, ntc, dht22, hc-sr04, pir, slide-switch, limit-switch, buzzer, servo, dc-motor, motor-driver, mosfet, relay, oled, lcd1602, neopixel, rgb-led, ir-obstacle, photoresistor-module, soil, mpu6050, bmp280, ir-receiver, diode, capacitor, electrolytic, transistor-bjt, breadboard, jumper, usb-cable, logic-level, dc-supply, power-bank, buck, boost, h-bridge-l298n, soil-relay-pump, rotary-encoder, rfid, mosfet-module, seven-segment.

**workspace**: board, breadboard, led, resistor, capacitor, button, limit-switch, buzzer, potentiometer, ldr, ir-sensor, ultrasonic, oled, servo, seven-segment, diode, rgb-led, transistor, mosfet, dc-motor, thermistor, slide-switch, battery, relay, buck-converter, boost-converter, tb6612, h-bridge.

**lesson**: blink, button-led, analog-potentiometer, analog-ldr, ir-alert, ultrasonic-distance, seven-segment-counter, source-led, buck-boost-concept, dc-motor-driver, mosfet-switch.

**feature**: intro, dashboard, learning, lesson, boards, components, lab, freestyle, projects, classroom, calculators, firmware, sketch, spice, community, feedback.

**calculator**: led, adc-divider, i2c-pullup, rc, ldr-divider.

## Kiểm chứng và handoff

Focused Node: node --test tests/guide-catalog.test.mjs tests/guide-knowledge.test.mjs — 15/15, exit0. Typecheck: npm.cmd run typecheck — exit0. node --check e2e/guide-depth.spec.mjs — exit0. Browser spec e2e/guide-depth.spec.mjs được viết cho375/1440, câu hỏi chuyên môn ADC/TB6612, link hãng/app alias, context board, unknown/conflicting entities và không có network answer requests. **Browser/build/full-suite không chạy bởi builder**; lead sở hữu port/build. QA độc lập chưa ký trên snapshot này. Node test cases kiểm coverage mọi registry, toàn bộ28 tên board tự resolve đúng model, accent/không dấu, unknown/out-of-scope, ngữ cảnh không ghi đè explicit board, source type/provenance, public/app aliases, FAQ và diagnostics cũ.

Rủi ro còn lại: retrieval hữu hạn, không hiểu toàn bộ mọi câu tiếng Việt; chưa có corpus đánh giá relevance ngoài test cases. Định mức/MPN không có nguồn exact vẫn unknown. Các nguồn catalog có thể thay đổi hoặc URL hết hạn; không truy cập mạng để tự cập nhật. Context facts chỉ chính xác bằng snapshot trang cung cấp; không đọc schematic/code để suy luận mạch. Không có generative AI, hardware approval, mua hàng, device operation hoặc tự sửa mạch.

## SHA-256 snapshot (không gồm chính tài liệu này)

| File | SHA-256 |
|---|---|
| src/lib/guideKnowledge.ts | 2fd45c619224ca9feb4a0f0e439125c1f48b46d46bf11b87133f3c0eda96433d |
| src/lib/guideCatalog.ts | 583a8bad6e6433bbde7cc52a66510206843c07d3fbaf17409dd6d78752ac21d4 |
| src/lib/guideSearch.ts | a852a1591b10d5033bdec45579b54647636c4635c8cbc4dbc0fe1dc382e4a13c |
| src/components/guide/GuidePanel.tsx | 05ac1851d410e47ed75117d73a8bb7053b151ef2b35114f1d2e81e06a831e19c |
| src/components/guide/Guide.css | 2ac7f95f05b9af0ac75729d9ab021bd3ff381b1994ecae2764b9e49391efc001 |
| tests/guide-knowledge.test.mjs | fa85ead031cdb83fcf0b2db1d9ac53218aad920d3ee745f4e5573136835ad67c |
| tests/guide-catalog.test.mjs | beb8dee5a327361178fa1b6d68147d79a3a0f18785efe5db689a23caf74d4948 |
| e2e/guide-depth.spec.mjs | ad4188463cd8a3c309961bf25d56e6ebab0dca59e37bd87b78f0c97b79b70a80 |


## Bổ sung sau browser regression — 16/11/2026

Production browser đã phát hiện public component answer cho TB6612 chưa mang theo STBY dù source model có chân và safety note. Đã thêm pins + safetyNotes trực tiếp từ componentRegistry qua catalogId mapping cho public component answer, ghi rõ đây là nhãn chức năng mô hình, không tự xác nhận package/breakout pinout. Node regression kiểm winning answer có STBY, yêu cầu trạng thái hoạt động và VM/VCC/dòng tải đúng datasheet; red trước sửa, green sau sửa. Không hardcode STBY riêng trong answer và không giảm assertion STBY/source link. Câu nguồn gốc viết “Không đại diện mọi board TB6612”; browser assertion cùng nội dung chuyển regex /i để không phụ thuộc chữ hoa đầu câu. Fresh focused Node15/15 exit0, typecheck exit0, browser spec syntax exit0. Builder không chạy browser/build/server; cần lead rebuild/rerun affected browser checks trên source mới, kết quả dist cũ không áp dụng cho patch này.
