# P0-12 — ma trận G-B: 16 vai trò và pool tham chiếu

DOCUMENT ONLY / UNASSIGNED. Nguồn silicon là Espressif ESP32 Series Datasheet v5.3: IO_MUX p69, giải nghĩa reset/input-only p61–62, strapping p22–25. PDF ghim `docs/research/downloads/p0-08-2026-11-09/esp32-series-v5.3.pdf`, SHA256 `a7917e6b47528c9dcab06837a49d452e582751335797db879f1cf2d17cd29adf`. Ảnh các trang dùng ở `docs/research/downloads/p0-12/`.

Đây không phải bảng nối vai vào GPIO. Không xác nhận continuity của clone hoặc thực hiện pin assignment trước duyệt cấu hình.

## Ma trận 16 vai trò đã chọn

| # | Vai trò | Lớp chân cần | Default/reset và ràng buộc miền nguồn | GPIO |
|---|---|---|---|---|
|1|JOY_X|Analog input ADC1|Dải áp/trở kháng ADC phải có cận; JOY OFF/đứt dây tạo mẫu invalid, không giả neutral; không dựa pull nội|UNASSIGNED|
|2|JOY_Y|Analog input ADC1|Như JOY_X; offset/calibration/validity được kiểm riêng|UNASSIGNED|
|3|JOY_SW|Digital input|Bias ngoài/debounce xác định; đứt dây/reset không tạo sự kiện mới|UNASSIGNED|
|4|BTN1|Digital input|Bias ngoài; giữ nút qua reset không tự arm, cần thả rồi nhấn|UNASSIGNED|
|5|BTN2|Digital input|Như BTN1; không đồng nhất việc dùng digital với hạn chế ADC2/Wi-Fi|UNASSIGNED|
|6|RUN_REQUEST|Output-capable|Mạch ngoài giữ inactive khi reset/mất bias; retained HIGH không vượt veto, không trực tiếp cấp RUN|UNASSIGNED|
|7|FRESH_ARM_REQUEST|Output-capable|LOW qualification và cạnh mới sau READY; fault/reset ưu tiên; ROM boot pulse không arm|UNASSIGNED|
|8|WDI software feed|Output-capable|Không PWM/DMA tự feed; static level không chứng minh liveness; watchdog/default/timing cần cận|UNASSIGNED|
|9|RELEASE_REQUEST|Output-capable|Inactive bằng mạch ngoài; không vượt OFF/isolation/rail-low/bias/fault veto|UNASSIGNED|
|10|LOCK_POSITION|Digital input; input-only có thể dùng|Quan sát khóa thật; lost power/wire/unknown → invalid; veto phần cứng độc lập|UNASSIGNED|
|11|SAFETY_STATUS|Digital input; input-only có thể dùng|Diagnostic tổng hợp, không thay protection path; unknown không thành SAFE|UNASSIGNED|
|12|SECOND_POSITION_OBSERVATION|Digital input; input-only có thể dùng|G-B giữ vai này; không gộp hai sensor/veto vật lý thành một; cần bound crossing/backfeed|UNASSIGNED|
|13|E1|Dự trữ output-capable ở cận xấu nhất|Hướng, tải, default, bias, connector/miền điện TBD; không mặc định phù hợp analog|UNASSIGNED|
|14|E2|Như E1|Giữ tài nguyên; không gán chức năng hoặc đầu nối khi chưa có hợp đồng|UNASSIGNED|
|15|E3|Như E1|Nếu cần analog/Wi-Fi phải xét ADC1/ADC2 riêng, không suy từ output capability|UNASSIGNED|
|16|E4|Như E1|Giữ đủ E1–E4; không tự cắt kênh để tạo spare|UNASSIGNED|

H3_DEDICATED_STATUS không xuất riêng về MCU trong G-B; detector/thermal protection/cutoff vẫn giữ. Các vai control/veto đã được đếm; không thêm một GPIO “veto” không có yêu cầu chức năng rõ.

Mọi crossing cần rail MIN/MAX, VOH/VIH/VOL/VIL, leakage, pull/bias, partial-power-down, tải và backfeed. Default của silicon không chứng minh toàn hành vi ROM boot, download, panic hoặc retained output; phần cứng bên ngoài phải thắng các trường hợp đó.

## Pool tham chiếu: không liên kết với các hàng vai trò ở trên

`oe`: output enable; `ie`: input enable; `wpd`: weak pull-down. Không có ký hiệu pull trong bảng không được hiểu là LOW.

| GPIO tham chiếu | Lớp | At Reset | After Reset theo IO_MUX | Chức năng/boot cần lưu ý | Miền/analog |
|---|---|---|---|---|---|
|4|I/O|oe0,ie1,wpd|oe0,ie1,wpd|Function0 GPIO4; **không thuộc danh sách strap**|RTC; ADC2_CH0/TOUCH0|
|13|I/O sau cấu hình|oe0,ie0|oe0,ie1,wpd|Function0 MTCK, cần giải quyết ownership JTAG|RTC; ADC2_CH4/TOUCH4|
|18|I/O|oe0,ie0|oe0,ie1|GPIO18; mux VSPI/SDIO; không strap/JTAG|CPU; không ADC|
|19|I/O|oe0,ie0|oe0,ie1|GPIO19; mux VSPI/UART/EMAC|CPU; không ADC|
|21|I/O|oe0,ie0|oe0,ie1|GPIO21; mux VSPI/EMAC|CPU; không ADC|
|22|I/O|oe0,ie0|oe0,ie1|GPIO22; mux VSPI/UART/EMAC|CPU; không ADC|
|23|I/O|oe0,ie0|oe0,ie1|GPIO23; mux VSPI/SDIO|CPU; không ADC|
|26|I/O|oe0,ie0|oe0,ie0|GPIO26; không strap/JTAG|RTC; ADC2_CH9/DAC2|
|27|I/O|oe0,ie0|oe0,ie0|GPIO27; không strap/JTAG|RTC; ADC2_CH7/TOUCH7|
|36|Input-only|oe0,ie0|oe0,ie0|SENSOR_VP; không output/pull-up/down nội|RTC; ADC1_CH0|
|39|Input-only|oe0,ie0|oe0,ie0|SENSOR_VN; không output/pull-up/down nội|RTC; ADC1_CH3|

Miền RTC ở bảng là VDD3P3_RTC; CPU là VDD3P3_CPU. GPIO16/17 thuộc nguồn SDIO và phụ thuộc module/memory, vẫn loại khỏi pool bảo đảm. Không tự mở lại GPIO14 hoặc pin bị policy loại. Danh sách strap hãng gồm GPIO0/2/5/12/15; pull-down của GPIO4 không biến nó thành strap.

## Fit và quy tắc khi phát sinh tín hiệu

Năm baseline đã nằm ngoài pool 11 chưa dùng. G-B:5baseline+4control+2status+1second-position+4E=16. Nếu cả bốn E là output, cần tám output và ba input từ pool mới; chín output-capable và hai input-only đủ về loại chân khi một input dùng output-capable. Chưa gán input nào vào chân nào; **không còn spare sau phân bổ**.

“Dùng chân rảnh” là dùng pool trước phân bổ, không phải yêu cầu còn một GPIO trống sau thiết kế. Tín hiệu MCU mới ⇒ dừng để review tài nguyên/kiến trúc. Không tự bỏ E-channel, ghép RUN/FRESH_ARM, thêm expander hoặc đổi module. Tín hiệu phần cứng nội bộ không xuất về MCU không tự tiêu thụ GPIO, nhưng vẫn cần budget điện/nguồn và fault coverage.

F2 được xử lý ở mức bảng ràng buộc. Cổng MCU còn OPEN vì chưa có mạch interface/reset/veto có cận, clone continuity và nguồn/default/timing toàn tuyến. r12 giữ nguyên cận lịch sử15–17; G-B16 được ghi trong direction/proposal riêng, chưa tự sửa r13.
