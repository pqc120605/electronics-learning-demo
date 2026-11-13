# MởBot Starter — cấu hình phần cứng đề xuất v1

**Chờ bạn duyệt và chốt các đầu vào còn thiếu. Chưa bắt đầu pin map/schematic/PCB/CAD/firmware phần cứng.** Tài liệu cấu hình máy đọc: [hardware-config-v1.json](hardware-config-v1.json). Quyền build chỉ được ghi vào queue sau xác nhận đúng revision/hash và hết blocking inputs.

## Đích sản phẩm đã đối chiếu

User chốt: người mới học mạch, ESP32 DevKit V1, PCB tối đa100×100mm (nhỏ hơn càng tốt),4động cơ DC chổi than/giảm tốc, LCD/siêu âm/IR/loa và mở rộng.

[Artifact MởBot Starter](https://claude.ai/artifact/NKzoyN5pcRE3WyC5xBxWPz), đọc sau ngoại lệ user cho phép, định hướng cùng một lõi đổi giữa rover và robot mini; có gương mặt, âm thanh/nút, tay điều khiển tự lắp, web drive và thử thách vật cản, nối bài học Mạch Mở. Giọng nói nhấn-để-nói còn cần xác thực; hình chỉ là concept, không quyết định motor/pin/nguồn/linh kiện. User mới đã chốt4DC và ESP32, nên hai yêu cầu này cụ thể hơn các lựa chọn còn mở trong artifact. Không dùng hình concept làm thiết kế điện hay hình học đã kiểm.

## Phương án cơ sở A để bạn xem xét

**Một main carrier ESP32 + nhánh4motor + display/audio/sensors, một tay cầm DIY riêng; khung/vỏ rover và mini-robot dùng lại lõi.** Ưu tiên prototype module thay thế được trước khi tích hợp toàn bộ IC. Target bố trí main90×90mm, hard maximum100×100mm; target90×90 chưa được CAD/layout chứng minh. Tay cầm cũng giữ trần100×100mm.

| Khối | Cấu hình đề xuất | Trạng thái cần chốt |
|---|---|---|
| MCU chính | ESP32 DevKit V1 cắm socket để thay/reuse khi học | Exact hãng/revision/30–38pin/kích thước/header spacing chưa xác nhận |
|4motor |4kênh điều khiển độc lập,4PWM native và8direction chậm qua GPIO expander cho giao diện TB6612-style; independent enable mặc định OFF | Driver/module cuối phụ thuộc motor voltage/stall current và nhiệt; không khóa TB6612 khi chưa biết tải |
| Mở rộng IO | MCP23017 candidate cho direction/buttons/display reset/mute; không dùng làm PWM hay đo echo xung | Theo RevD, GPA7/GPB7 output-only; pin budget toàn hệ chưa được nghiệm thu |
| Gương mặt | Màn hình đồ họa SPI làm trải nghiệm robot face; reset/backlight/control phân bổ theo resource budget | Kích thước/module/điện áp chưa chọn; LCD ký tự không thay đầy đủ gương mặt đồ họa |
| LCD học tập | Cổng I2C riêng cho LCD bài học, không bắt buộc gắn đồng thời face LCD | Cần chốt simultaneous use, address/pull-up/level compatibility |
| Vật cản/IR |1nhánh siêu âm và2inputIR cơ sở; dành expansion contract cho dò line | Exact module/count/levels chưa chọn; không mặc định module5V an toàn cho GPIO |
| Âm thanh/nút | Speaker+amp cho hiệu ứng/lời chào; nút thao tác và PTT; dự trù mic/audio interface khi chốt voice scope | Speaker Ω/W, amp/mic, mute và processing location chưa chốt |
| Tay cầm | PCB DIY riêng, ESP32-family candidate để dễ học; controls và pairing rõ | ESP-NOW/local-web là ứng viên, coexistence/link-loss chưa kiểm |
| Nguồn | Motor domain tách nhánh logic/audio; motor không lấy qua regulator của DevKit; bảo vệ và enable an toàn khi reset | Battery/DC source, charging/runtime/load budget và trị số bảo vệ chưa chọn |
| Mở rộng | I2C/module interface, service/UART và cơ khí tháo lắp có revision | Không hứa gắn mọi module đồng thời trước resource/power review |

**Alternative B:**2×DRV8833 có thể được đánh giá nếu đúng motor/supply/thermal envelope; giao diện hai control signals mỗi motor khác phương án4PWM+8staticDIR. Không coi nó là linh kiện thay trực tiếp trong A. Nếu tải vượt envelope của cả hai, phải đổi driver/module thay vì dùng con số peak như continuous current.

## Review kỹ thuật thực sự đã nhận

Native electronics_firmware_engineer đã review **cấu hình**, không viết file hoặc làm điện/PCB. Kết luận: hợp lý có điều kiện để trình duyệt phương án; fit, điện, nguồn, pinout và hoạt động vật lý chưa được xác minh.

- ESP32 có PWM/SPI/I2C/I2S; pin DevKit thực tế mới là ràng buộc. GPIO34–39 input-only; boot/flash/programming constraints phải dành chỗ. Datasheet IC không xác nhận pinout hay mạch nguồn DevKit không rõ revision. [Espressif](https://documentation.espressif.com/esp32_datasheet_en.html)
- Với MCP23017, dùng tài liệu revisionD; GPA7/GPB7 chỉ output. Chỉ dành expander cho control chậm, không đo echo hoặc tạo motor PWM. [Microchip](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP23017-Data-Sheet-DS20001952.pdf)
- DRV8833 có supply2.7–10.8V; dòng phụ thuộc package/thermal/current-sense, không chuyển thông số IC thành rating module. [TI](https://www.ti.com/lit/ds/symlink/drv8833.pdf)
- TB6612FNG recommended VM2.5–13.5V/VCC2.7–5.5V;15V là absolute maximum. Peak3.2A trong datasheet là single pulse10ms, không là stall current liên tục. Mapping riêngPWM/DIR phù hợp A; chưa là chọn driver. [Toshiba](https://toshiba-semicon-storage.com/info/TB6612FNG_datasheet_en_20141001.pdf?did=10660&prodName=TB6612FNG)

Đề xuất firmware sau approval phải có stop-on-link-timeout/reset/bus failure, đổi direction khi PWM đã disable, independent motor enable và trạng thái nguồn rõ. Đây là yêu cầu thiết kế cần kiểm, không phải tính năng đã chạy. Link tay cầm có thể nghiên cứu [ESP-NOW](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html); chưa chốt SDK/version/channel/coexistence.

## Giọng nói phải được chọn riêng

**V1 nền:** âm thanh/lời chào tiếng Việt phát sẵn và gương mặt, không nhận dạng hay hội thoại. **V1 nâng cao:** push-to-talk với pipeline local/điện thoại/service được chọn tường minh, có nút mute và công bố phụ thuộc mạng/quyền riêng tư. Mic+amp không chứng minh ESP32 DevKit V1 tự chạy được Vietnamese STT/AI. Không âm thầm thay lời hứa voice trong artifact bằng chỉ buzzer; scope cuối cần bạn chốt trước build.

## Thông tin cần có để duyệt cấu hình build

1. Exact DevKit variant và kích thước/header thực tế.
2. Model motor hoặc điện áp định mức + stall current; xác nhận cần độc lập cả4kênh.
3. Nguồn/battery/charging/runtime mong muốn, load cùng lúc.
4. Face display size/module, I2CLCD có cần đồng thời không; module siêu âm/IR cụ thể.
5. Loa Ω/W, phạm vi voice, controls của tay cầm và ngân sách.

Nếu chưa sở hữu linh kiện, các mục này trở thành lựa chọn nghiên cứu/so sánh để bạn chọn, không yêu cầu bạn tự đoán thông số. Chỉ sau bản cấu hình đủ chi tiết được bạn duyệt, lead mới cấp hardware write lease và giao schematic→PCB/CAD→firmware→bench theo gate riêng. Software/mock/interface design có thể tiếp tục độc lập, nhưng không được báo physical support đã có.
