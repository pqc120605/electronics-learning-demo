# Rà soát công cụ mã nguồn mở hỗ trợ Mạch Mở

**Ngày rà soát:** 31-10-2026  
**Phạm vi:** kho GitHub công khai, tài liệu README/LICENSE và khả năng hỗ trợ luồng Web/App. Đây là đánh giá sơ bộ, không thay thế rà soát pháp lý, bảo mật, hiệu năng hoặc kiểm thử tích hợp.

## Khuyến nghị

Không thêm hàng loạt package vào ứng dụng hiện tại. Xây adapter/provider boundary và project handoff trước; sau đó chạy spike cho một engine ở mỗi lớp. Các kho mã chỉ cung cấp CPU core, peripheral models, board files hoặc data không đồng nghĩa với toàn bộ simulator đã sẵn sàng nhúng.

| Dự án | Phần có thể hỗ trợ | Giấy phép / mức phù hợp | Đề xuất |
|---|---|---|---|
| [wokwi/avr8js](https://github.com/wokwi/avr8js) | CPU AVR ATmega328P; nền cho firmware Arduino Uno chạy trong JS/browser | MIT. README nói rõ cần firmware đã biên dịch và ứng dụng phải tự cung cấp mô hình ngoại vi. | **Spike đã tích hợp riêng:** fixture bare-metal và HEX Uno thực do Arduino IDE biên dịch đều điều khiển D13 qua worker; chưa đưa vào flow builder. |
| [wokwi/rp2040js](https://github.com/wokwi/rp2040js) | CPU RP2040/Pico, firmware native/UF2, MicroPython/CircuitPython examples | MIT. Tích hợp cần quản lý boot ROM, firmware, peripheral và tương tác worker/UI; phạm vi peripheral có giới hạn. | **Spike ưu tiên 2:** thử chạy firmware blink/serial ở worker và đo tải bộ nhớ/đáp ứng UI. |
| [mikroverk/esp32sim](https://github.com/mikroverk/esp32sim) | Firmware thật cho ESP32 families, bản WASM, board/peripheral models | MIT theo kho hiện tại; README phân biệt mức trưởng thành theo chip: S3 trưởng thành hơn, classic ESP32 sớm, C3/C6 còn nháp. ROM, firmware demo và dependency có thể có giấy phép riêng. Dự án còn mới và không chính thức từ Espressif. | **Thử nghiệm sandbox sau:** chỉ tiếp tục nếu worker isolation, license inventory, tương thích firmware và mức tiêu thụ tài nguyên đạt cổng chất lượng. |
| [wokwi/wokwi-elements](https://github.com/wokwi/wokwi-elements) | Hình ảnh Web Components cho board/linh kiện | MIT. README nói đây là phần hiển thị; không chứa hành vi mô phỏng của từng linh kiện. | Dùng để tham khảo interaction/visuals; **chưa thay** minh họa 2D/3D hiện tại vì chưa giải quyết xác thực CAD và chưa cần tăng thư viện. |
| [cramt/thevenin](https://github.com/cramt/thevenin) | SPICE-style DC/AC/transient, Rust và `wasm32`, parser netlist | BSD-3-Clause theo crate metadata; có kế hoạch kiểm thử và phạm vi device được công bố. Quy mô cộng đồng GitHub còn nhỏ tại thời điểm rà soát, nên không xem tuyên bố README như chứng nhận độ chính xác. | **Spike ưu tiên cho analog:** so sánh một số mạch R/C/diode với kết quả tham chiếu ngspice trước khi dùng dạy học. |
| [ngspice/ngspice](https://github.com/ngspice/ngspice) | Engine SPICE trưởng thành; phân tích analog/mixed-signal | Phần lớn code theo modified BSD, nhưng có ngoại lệ/third-party licenses. Build WASM, bindings và phân phối binary cần kiểm kê dependency. | App/sidecar native là hướng tích hợp phù hợp hơn nhúng ngay vào frontend; giữ ngoài web bundle đến khi có spike. |
| [pfalstad/circuitjs1](https://github.com/pfalstad/circuitjs1) | Simulator tương tác browser, ví dụ analog/digital, luồng dòng minh họa | GPL-2.0-or-later theo thông tin upstream. Copy/bundle/fork có thể tạo nghĩa vụ phân phối tương ứng. | Dùng external link hoặc giao thức tệp sau khi kiểm chứng; không copy source vào web hiện tại trong lát cắt này. |
| [renode/renode](https://github.com/renode/renode) | Firmware execution và hệ embedded/network nhiều node, nhiều kiến trúc CPU | MIT. Cần kiểm tra platform/peripheral cụ thể cho từng board; hỗ trợ kiến trúc CPU không có nghĩa có sẵn đúng board profile. | Companion app/service có sandbox là nơi phù hợp; chưa biến thành browser dependency. |
| [KiCad/kicad-source-mirror](https://github.com/KiCad/kicad-source-mirror) | Tham khảo API, định dạng PCB/schematic, CLI và quy trình EDA | Phần lớn source GPL-3-or-later, cùng các thành phần third-party có license khác. | Tích hợp KiCad bằng file/project và CLI đã cài trên máy/app; không nhúng source KiCad vào web bundle. |
| [arduino/arduino-cli](https://github.com/arduino/arduino-cli) | Cài board core, liệt kê board, compile và upload sketch từ app companion | GPL-3.0 theo kho upstream; binary/dependency và cơ chế gọi cần được rà trước khi phát hành app. | **Bổ trợ ngay:** web xuất `.ino` có target/provenance sau kiểm tra parser/pin alias. **Bước sau:** app gọi CLI cài trên máy, compile trước; upload phải do người dùng chủ động chọn cổng và xác nhận. |

## Cổng tích hợp đề xuất

1. **Hợp đồng provider:** `prepare(project) → run/step → trace/diagnostics → export`; mọi provider công bố board, file firmware, peripheral, độ chính xác, giới hạn và phiên bản.
2. **Worker/sandbox:** firmware binary và simulation engine chạy ngoài UI thread; có timeout, giới hạn RAM/thời gian, hủy chạy và không cấp quyền mạng/file mặc định.
3. **Golden circuits:** đối chiếu blink/UART/ADC cho MCU; mạch divider/RC/diode cho SPICE. Mỗi kết quả lưu engine/version và giả định.
4. **Rà license/provenance:** ghi license của package, assets, firmware, boot ROM, board definitions và các transitive dependencies. Không suy license toàn bộ platform từ một repo con.
5. **Handoff:** project bundle mang cùng ID/schema; app có thể gọi toolchain đã cài hoặc mở KiCad. Web chỉ đưa ra hành động thực sự khả dụng.

## Thứ tự làm tiếp

1. Hoàn thiện vòng đời project cục bộ và schema/migration.
2. **Đã có provider boundary runtime đầu tiên:** `machmo-educational-interpreter` là provider duy nhất đang khả dụng; builder chạy qua resolver, nêu rõ version và giới hạn, từ chối target/bài không đăng ký. Đây vẫn là interpreter giáo dục, không phải adapter firmware/SPICE.
2a. **Đã gia cố handoff Arduino:** xuất `.ino` chỉ khi parser chấp nhận code-subset và pin khớp profile; header ghi board/MCU/mức logic/nguồn. Web chưa gọi compiler hoặc upload; sketch mẫu riêng đã được compile qua Arduino IDE.
3. Spike `avr8js` cho ATmega328P và `rp2040js` cho Pico; ưu tiên firmware đã biên dịch trước để không phụ thuộc compiler service. **AVR8js core/GPIO chạy fixture bare-metal và HEX Uno do Arduino IDE biên dịch; tiếp tục rà parity peripheral và worker runtime.**
4. Spike `thevenin` cho analog browser, đối chiếu với ngspice; song song thiết kế app bridge cho ngspice/KiCad/Renode. **Đã bổ sung phép tính bộ chia áp LDR giáo dục trong app (R giả định 100 kΩ → 1 kΩ, R cố định 10 kΩ, VCC 3,3 V), hiện Vout và analog tương đối. Đây chưa phải tích hợp `thevenin` và chưa được đối chiếu ngspice; không tính lux/đặc tuyến cảm biến thật.**
5. Xem xét ESP32 WASM engine khi sandbox, ROM/data license và độ ổn định đã rõ.
6. Mở rộng thư viện board/linh kiện sau khi adapter, flow và quality gates chạy được.

### Kiểm chứng lát cắt provider

- `npm test`: kiểm tra provider ID/version/execution mode, target và bài học được hỗ trợ, từ chối ID lạ, và frame đầu ra LED deterministic.
- `npm run build`: xác minh typing và đóng gói production.
- Ở lát cắt provider ban đầu chưa thêm engine bên thứ ba. Bản cập nhật bên dưới đã thêm AVR8js MIT vào worker riêng, chưa đăng ký engine này như provider khả dụng cho toàn bộ builder.

### Cập nhật spike AVR và firmware artifact · 31-10-2026

- Người dùng cung cấp ZIP upstream; đã xác nhận `avr8js@0.21.1`, MIT, source không có Git commit metadata. Do npm registry không phản hồi, source được biên dịch từ workspace TypeScript sang ESM/CJS và đóng thành dependency local; provenance/hash và MIT notice nằm trong `vendor/README.md` và tarball.
- Đã thêm trang **Công cụ → Kiểm tra firmware HEX** (`/tools/firmware-hex`). Tệp được đọc cục bộ trên trình duyệt, giới hạn 2 MB; kiểm tra cấu trúc, checksum, EOF, địa chỉ mở rộng, chồng lấn khác giá trị, giới hạn bản ghi/dữ liệu và hiển thị các vùng địa chỉ.
- Có file firmware mẫu tải được `public/firmware/atmega328p-d13-blink.hex`, được tạo từ assembly bare-metal trong `firmware/atmega328p-d13-blink.asm` bằng `npm run build:avr-demo`; trang có thể nạp trực tiếp mẫu này. Bổ sung sketch Arduino Uno D13 và HEX biên dịch được trong Arduino IDE 2.3.10 + Arduino AVR Boards 1.8.8 (`arduino:avr:uno`).
- Đã tích hợp spike AVR8js cho ATmega328P trong Web Worker có thể terminate, giới hạn flash 32 KB và 16 triệu chu kỳ. Model quan sát D13/PB5, khởi tạo Timer0/1/2, ADC và UART của thư viện; chưa có serial monitor/đầu vào cảm biến. Đây chưa phải mô hình mạch điện hay full Arduino API.
- Test chạy fixture Intel HEX bare-metal và HEX Arduino IDE; xác nhận checksum/địa chỉ, D13 đổi LOW → HIGH → LOW và giới hạn flash. Arduino `setup/loop` cùng delay blink đã chạy được; chưa xác minh serial, đầy đủ timer/ADC parity hoặc độ chính xác thời gian thực.
- Công cụ xác nhận cú pháp Intel HEX; nội dung không tự xác định MCU. Người dùng cần chọn/biên dịch đúng ATmega328P. Không nạp lên board vật lý.
- UI khóa chạy AVR8js cho tới khi người dùng xác nhận HEX được biên dịch cho ATmega328P; xác nhận không phải kết quả nhận diện MCU tự động.
- Gate tiếp theo: rà parity Timer0/UART/ADC và performance worker; sau đó mới cân nhắc mở năng lực cho board khác. Arduino IDE biên dịch được mẫu; Arduino CLI độc lập trong shell hiện lỗi Windows `Illegal System DLL Relocation` khi chạy `avr-g++.exe`. HEX assembly và HEX Arduino được ghi nhãn riêng.
- Kiểm chứng hiện tại: `npm test` 23/23 và `npm run build` thành công. Bản production chứa HEX assembly, HEX Uno build từ Arduino IDE và sketch `.ino` tải được.
- Cập nhật analog LDR: `npm test` 24/24 và `npm run build` thành công; kiểm tra hai hướng mắc, giới hạn tham số và điểm tối/giữa/sáng. Vẫn cần spike với `thevenin`/ngspice để đánh giá engine SPICE trước khi công bố mô phỏng điện rộng hơn.

## Nguồn chính

- [AVR8js README](https://github.com/wokwi/avr8js) · [RP2040js README](https://github.com/wokwi/rp2040js)
- [ESP32sim README/LICENSE](https://github.com/mikroverk/esp32sim) · [Wokwi Elements README/LICENSE](https://github.com/wokwi/wokwi-elements)
- [Thevenin README](https://github.com/cramt/thevenin) · [Thevenin crate metadata](https://docs.rs/crate/thevenin/0.5.0/source/Cargo.toml.orig)
- [ngspice developers/license notes](https://ngspice.sourceforge.io/devel.html) · [CircuitJS1 source](https://github.com/pfalstad/circuitjs1)
- [Renode README/LICENSE](https://github.com/renode/renode) · [KiCad license breakdown](https://github.com/KiCad/kicad-source-mirror/blob/master/LICENSE.README)
