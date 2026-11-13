# Đặc tả: Lắp mạch và mô phỏng trong Mạch Mở

**Ngày:** 30/10/2026  
**Trạng thái:** Bản thiết kế chờ founder duyệt  
**Phạm vi:** Trải nghiệm lắp thử board/module trên breadboard và khả năng mô phỏng code/mạch.

## 1. Mục tiêu

Cho người học tự chọn board, linh kiện từ catalogue, nối chân và quan sát tác động của code; đồng thời nói rõ đâu là lắp ráp 3D, đâu là mô phỏng chức năng và đâu chưa được mô hình hóa điện.

## 2. Hai khả năng cần phân biệt

1. **Assembly/3D:** kéo linh kiện và dây vào canvas để hình dung cách lắp. Không tự nó chứng minh nối điện hoặc tương thích.
2. **Simulation:** xử lý firmware, tín hiệu/chân và hành vi phần tử. Chỉ khả dụng với board, linh kiện và hành vi được simulator hỗ trợ; không phải mọi tính chất điện đều được mô hình đầy đủ.

UI phải hiển thị trạng thái từng mode và cảnh báo giới hạn mô phỏng. Không gọi một mô hình hình ảnh là “mô phỏng mạch thật”.

## 3. Các phương án

- **Tự xây engine đầy đủ:** quyền kiểm soát cao nhưng vượt phạm vi nhóm hiện tại, nhiều rủi ro sai lệch phần cứng.
- **Dùng simulator bên ngoài như một liên kết rời:** đưa người học sang trang simulator; nhanh nhưng ngắt trải nghiệm và dữ liệu không liền mạch.
- **Khuyến nghị được founder chọn — engine giáo dục nội bộ:** Mạch Mở tự mô hình hóa project, pins, thời gian logic và hành vi các part được hỗ trợ. Engine chạy block IR và tập con code có giới hạn. Không dùng simulator ngoài làm runtime; kiến trúc vẫn để provider interface mở cho lựa chọn tương lai.

Tự xây được nếu giới hạn lời hứa kỹ thuật. Không đồng nhất engine giáo dục này với emulator instruction-set, firmware runtime hay SPICE. Các engine mature cũng phân chia mức mô phỏng; tài liệu Wokwi mô tả hỗ trợ analog hạn chế, còn QEMU AVR cho thấy instruction-level/system emulation là một lớp công việc riêng. [Wokwi Analog API](https://docs.wokwi.com/chips-api/analog), [QEMU AVR](https://www.qemu.org/docs/master/system/target-avr.html).

## 4. Phạm vi assembly MVP

- Workspace có breadboard, board được chọn, component palette, canvas nối dây và bảng thông tin phần tử.
- Kéo thả LED, resistor, potentiometer, button, buzzer và một tập cảm biến/hiển thị ưu tiên từ catalogue.
- Linh kiện có pin/terminal được đặt tên; chọn điểm đầu và điểm cuối để tạo dây; hỗ trợ xóa dây, undo/redo, reset và lưu bản nháp cục bộ.
- Chọn linh kiện hiện pinout, điện áp/mức logic có nguồn, vai trò, cách đấu mẫu và cảnh báo.
- Có mẫu dự án hướng dẫn (LED, nút nhấn, đọc biến trở/LDR, cảm biến nhiệt độ + OLED, siêu âm, servo) chỉ khi linh kiện/board tương ứng đã được khai báo.
- Assembly là một hình thức; engine nội bộ chỉ chạy khi board, pins, parts và chương trình có mapping hỗ trợ.

## 5. Phạm vi engine simulator nội bộ

- Tạo interface `SimulationEngine` tách khỏi scene 3D và component catalogue.
- Một project có board ID/revision, component IDs/variants, pin mapping, wires, chương trình IR, thời gian mô phỏng và engine version.
- Engine chạy block IR và tập con chương trình xác định; không chạy arbitrary firmware, không dùng `eval` và không biên dịch C++ tự do trong MVP.
- Với bản mở rộng hiện tại, đăng ký mapping theo board cho toàn bộ 21 board trong catalog để cùng chạy đúng bài LED logic giới hạn. Mỗi profile chỉ xác nhận alias chân cho bài đó; không có nghĩa MCU/peripheral/firmware của board đã được giả lập. Board không có nguồn pin mapping rõ phải để unsupported.
- Giữ fidelity riêng theo tầng: `logic-demo` cho interpreter học tập; `firmware-emulation` chỉ bật khi có provider chạy binary/firmware cho đúng target; `electrical-simulation` chỉ bật khi có engine netlist/solver. Một board có thể hỗ trợ tầng này nhưng không hỗ trợ tầng khác.
- Lệnh ban đầu: `pinMode`, `digitalWrite`, `digitalRead`, `analogRead` qua nguồn cảm biến ảo, PWM khái niệm và `delay` có giới hạn. C++ mode chỉ chạy nếu parser chuyển được sang IR hỗ trợ.
- Bắt đầu với event số và hành vi đơn giản: LED on/off, button, potentiometer/LDR làm nguồn input, buzzer, servo góc khái niệm và cảm biến ảo có điều khiển. Analog là abstraction giáo dục, không phải kết quả đo điện áp/dòng.
- Có virtual clock/event queue, pause/resume/step/reset, GPIO state, component state, logs và trace `code/block → pin/net → component`.
- Validate board pin, part variant và topology; báo lỗi chặn cho cấu hình unsupported, chân không hợp lệ hoặc mapping thiếu. Rule điện chỉ dùng khi dữ liệu board/part có nguồn.
- Chạy trong browser, không gửi project/code ra ngoài. Giới hạn số sự kiện/thời gian để giữ UI phản hồi.
- Giữ seam cho provider khác trong tương lai. ADR `2026-10-30-web-simulation-provider-adr.md` ghi nhận Wokwi/Renode/QEMU/Arduino CLI và các điều kiện license/privacy/backend; chưa tự gửi code sang provider ngoài.
- Không hỗ trợ SPICE, analog solver tổng quát, waveform chính xác, mọi firmware C/C++, Wi‑Fi/cloud thật hoặc giả lập instruction-set đầy đủ.

Mỗi part có cờ hỗ trợ mô phỏng và giới hạn hành vi tách khỏi model 3D.

## 6. Mô hình dữ liệu và hợp đồng provider

- `CircuitProject`: board ID/revision, parts với variant/instance ID, wires nối giữa pin endpoints, lesson/code metadata, timestamps.
- `PartDefinition`: pin endpoints, physical view/model, electric properties có nguồn, behavior model ID nếu có, limitation notes.
- `SimulationEngine`: `supports(project)`, `start(project)`, `step()`, `pause()`, `reset()`; trả diagnostics, virtual time, pin/part states và logs.
- `ProgramIr`: typed ops cho cấu hình/đọc/ghi GPIO, analog input abstraction, PWM abstraction và bounded delay; có execution/event budget.
- `PartBehavior`: hàm xác định nhận state/input/time, trả pin/net/component state; deterministic cho cùng input.
- Không dùng `scene node` làm danh tính điện của pin. Pin endpoint cần ID ổn định thuộc part instance.
- Unsupported part, chân không xác định hoặc xung đột logic phải chặn simulation hoặc đưa warning cụ thể; không bỏ qua ngầm.

## 7. Luồng người dùng

1. Chọn board và mở workspace.
2. Tìm linh kiện trong palette; đọc mức áp/pinout trước khi đặt.
3. Nối các pin; nhận cảnh báo khi thiếu GND, nối sai loại chân hoặc vượt giới hạn đã biết (chỉ trong phạm vi rules được khai báo).
4. Chọn chế độ Blocks hoặc Code nếu lesson hỗ trợ; code không tự đổi target khi đổi board.
5. Chọn “Chạy mô phỏng”; engine phân tích project/IR, hiện diagnostics, rồi chạy nếu không có lỗi chặn.
6. Xem trạng thái chân, phản hồi component, virtual time, trace và log; pause/step/reset.

## 8. An toàn và trung thực kỹ thuật

- Không đưa điện lưới/mức điện áp nguy hiểm vào các bài lắp ráp trẻ em.
- Cảnh báo 3,3 V/5 V, cực tính LED/diode, điện trở hạn dòng, nguồn motor/relay và dòng GPIO theo board/module nguồn.
- Rule cảnh báo phải có citation/nguồn; không tạo “electrical rule engine” tổng quát từ dữ liệu không đủ.
- Phân biệt `visual assembly`, `conceptual animation`, `software/firmware simulation` và `electrical/SPICE simulation`.
- Runtime chỉ nhận typed IR, không thực thi arbitrary JavaScript hoặc C++.
- Hạn chế số sự kiện, thời gian ảo và thời gian xử lý để người dùng luôn dừng/reset được.

## 9. Ngoài phạm vi

- Schematic capture, PCB routing hoặc thay thế KiCad/EasyEDA.
- SPICE tổng quát, phân tích EMI/nhiệt hoặc chứng nhận an toàn.
- Hỗ trợ mọi linh kiện/firmware tùy ý ngay từ bản đầu.
- Giả lập instruction-set/peripheral đầy đủ cho mọi MCU.
- SPICE tổng quát, phân tích EMI/nhiệt hoặc chứng nhận an toàn.

## 10. Tiêu chí chấp nhận

- Người học đặt/nối/xóa component và wire trong assembly, và biết rõ trạng thái lưu.
- Mỗi component hiển thị các pin nối có định danh ổn định và thông tin điện đã xác minh.
- Có ít nhất các mẫu LED, button, potentiometer/LDR và một sensor-display khi board/provider hỗ trợ.
- Unsupported board/part/code hiển thị lý do; không báo chạy thành công nếu engine không thể chạy.
- Mô hình 3D và mạch logic là dữ liệu riêng, có thể liên kết nhưng không thay thế nhau.
- Cùng project và input ban đầu tạo cùng kết quả; người học có thể pause, step và reset.
- Không diễn đạt logic abstraction thành kết quả điện áp/dòng hoặc xác nhận firmware đúng trên board thật.

## 11. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Engine sai behavior điện tử | Mô hình nhỏ, deterministic, sourced; công bố là mô phỏng giáo dục chứ không xác nhận thiết kế phần cứng. |
| Model 3D đẹp nhưng nối điện sai | Pin endpoints và netlist là dữ liệu riêng, có validation. |
| Phần analog không đầy đủ | Dùng input/control abstraction; không hứa tính toán SPICE. |
| Phạm vi component quá lớn | Ưu tiên bài mẫu cơ bản, mở rộng theo dữ liệu và kiểm chứng. |
| Board clone khác revision | Dùng variant-specific compatibility, không dùng MCU family làm bằng chứng đủ. |
