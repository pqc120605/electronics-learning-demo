# MoBot V2 — hợp đồng MCU ESP32 — r1

- Task: MM-ESP32-001 (P0-03); tham chiếu MM-RUN-001, không đóng toàn bộ K-RUN.
- Ngày: 08/11/2026 (Asia/Bangkok).
- Trạng thái: PROPOSED — DOCUMENT ONLY. Bản r0 đã được nhận trong REVIEW_RESULT R-20261108-C01; r1 xử lý các finding trước đóng task. Không có firmware, pin assignment mới, schematic, toolchain, flash hoặc bench được tạo/thực thi trong task này.
- Phạm vi: yêu cầu hành vi MCU, đối chiếu GPIO/net map tham chiếu với nhãn ảnh, nguồn và độ tin cậy, chính sách chân cấm và các kênh điều khiển web.

## 1. Thẩm quyền và giới hạn target

Quyết định hardware có hiệu lực là [biên bản Q1–Q8/D3/D4/D10/D17-HW](mobot-v2-founder-decision-q1-q8.md). P0-02 chỉ đóng hồ sơ proposed; hash cấu hình chưa được duyệt và các gate schematic vẫn OPEN. Bảng GPIO ở đây chỉ chép/đối chiếu tài liệu r7 lịch sử, không xác nhận nối điện của clone hoặc duyệt lại pin map. Gán chân mới phải chờ cấu hình đúng revision/hash được Founder duyệt và gate áp dụng được đóng.

| Định danh | Giá trị hợp đồng | Mức chứng cứ |
|---|---|---|
| Module tài liệu tham chiếu | ESP32-WROOM-32, Espressif datasheet v3.8, ESP32-D0WDQ6, classic ESP32 | Nguồn hãng mô tả đúng module tham chiếu; không xác nhận module đang lắp |
| Module thực trên B01 | [chưa kiểm chứng]: suffix/marking, revision silicon, flash và PSRAM | UNKNOWN; chưa có ảnh/đối chiếu đủ định danh |
| Board hiện hành | Mẫu ảnh 30 chân USB-C họ CH340, chữ ESP32 DEVKIT V1 TYPEC theo Q1/Q8 | Yêu cầu Founder và quan sát ảnh; suffix bridge, regulator, điện nội bộ và kích thước ước lượng, không xác minh |
| Hình học/net map thực | [chưa kiểm chứng] | Nhãn ảnh không chứng minh continuity, pin-1, kích thước hoặc pin của package |
| Toolchain/SDK triển khai | [chưa kiểm chứng]/chưa chọn trong task này | D13 là quyết định riêng; việc đọc ESP-IDF v6.1 không chọn/cài SDK |

ESP32-WROOM-32 v3.8 hiện được hãng đánh dấu NRND; ghi nhận trạng thái tài liệu, không tự thay target bằng WROOM-32E/WROVER/S3/C3. Nếu module thực khác tham chiếu thì đánh giá lại GPIO16/17, bộ nhớ, boot và điện; không báo là tương thích chỉ vì cùng họ ESP32.

Độ tin cậy trong mọi bảng chân gồm ba phần độc lập: **silicon capability** từ datasheet; **visible label** từ ảnh; **net assignment** từ r7 lịch sử. Hai phần đầu không nâng phần thứ ba thành nối điện đã xác minh. Các mục không có nguồn riêng được ghi [chưa kiểm chứng].

## 2. Hợp đồng điện, reset, boot và đối chiếu GPIO

**Định danh và phạm vi**

- Module tham chiếu: **ESP32-WROOM-32**, datasheet v3.8. Module/suffix/flash/PSRAM thực trên clone: **UNKNOWN**; ảnh chưa đủ xác nhận.
- Board hiện hành: mẫu USB-C 30 chân họ CH340 theo Q1/Q8. Không chuyển topology CP2102/Micro-USB hoặc hình học DevKit r7 thành dữ liệu mẫu thật.
- Bảng chân dưới đây là **đối chiếu tham chiếu cũ**, không phải assignment được phê duyệt.
- H1 được xử lý ở phần hợp đồng hành vi; tài liệu này không chứng minh đã có firmware hoặc phần cứng đạt yêu cầu.

Nguồn dùng trong các bảng:

| Mã | Nguồn, vị trí |
|---|---|
| **R7** | [KiCad input r7](D:/StartupOS/electronics-learning-demo/docs/hardware/claude-support/2026-11-06-pcb-status/final/kicad-input-spec-r7.md:231), §3.2, dòng 235–244; nguồn lịch sử |
| **Ảnh** | [Ảnh mặt trước](D:/StartupOS/electronics-learning-demo/docs/hardware/evidence/esp32-devkit-v1-type-c-front.png), đã xem; chỉ xác nhận nhãn nhìn thấy |
| **S1** | [ESP32-WROOM-32 v3.8](https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf), §2.2 bảng 2 tr.9–10; §3 tr.11–15; §4.2 tr.16–20 |
| **S2** | [ESP32 Series v5.3](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf), §2.5.3 tr.19; §3 tr.22–25; §5.3 tr.52; Appendix IO_MUX |
| **S3** | [ESP-IDF GPIO Summary](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html#gpio-summary), bảng GPIO và Notes |
| **S4** | [ESP-IDF ADC oneshot](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/adc/adc_oneshot.html#hardware-limitations), Hardware Limitations và Read Raw Result |
| **S5** | [ESP-IDF I2S](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/i2s.html), Standard Mode, GPIO configuration |
| **S6** | [DRV8833 Rev E](https://www.ti.com/lit/ds/symlink/drv8833.pdf), §6.5 tr.6; §7.3.3/7.4 tr.11 |
| **S7** | [SN74LVC8T245 Rev D](https://www.ti.com/lit/ds/symlink/sn74lvc8t245.pdf), tr.1; §7.4 bảng 7-1 tr.15 |
| **S8** | [ESP-IDF reset](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/misc_system_api.html#_CPPv411esp_restartv), `esp_restart()` và Reset Reason |
| **S9** | [MAX98357A/B Rev 16](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf), “SD_MODE and Shutdown Operation”, tr.17 |

Các trang ESP-IDF hiện trả tài liệu v6.1; đây là nguồn kiểm khả năng/API, **không phải lựa chọn toolchain cho dự án**.

**Contract điện và ma trận reset**

`MCU_MOT_EN` là một yêu cầu cho phép từ MCU, không có quyền vượt veto phần cứng. Hợp đồng logic:

`MOTOR_ENABLE = MCU_REQUEST ∧ HARDWARE_RUN_PERMISSION ∧ POWER_VALID`

CHARGE, mất nguồn hợp lệ hoặc mất quyền RUN phải thu hồi motor bằng phần cứng, kể cả MCU đang treo. Tên trên là điều kiện logic, không gán net/chân mới.

| Trạng thái | Motor | Cách ly / ngoại vi | Điều kiện nghiệm thu và căn cứ |
|---|---|---|---|
| Không nguồn / một miền mất nguồn | Mặc định disable | Không truyền hoặc cấp ngược ngoài cận | Pull-down ngoài tại MCU request và driver enable; không dựa vào pull nội MCU. S6 §6.5; S7 tính năng partial power-down |
| Power-on, EN thấp, ROM boot | `MCU_MOT_EN` LOW; nSLEEP LOW | `OE_N` HIGH; ampli và tải ngoại vi chưa được cấp quyền | Mức điện thực, không chỉ giá trị biến firmware. S1 §3; R7 dòng 238–239 |
| UART download / auto-reset do host | Như boot | Cách ly giữ nguyên suốt download | UART0/BOOT không được tạo quyền motor; S1 §3.1, S8 |
| Ứng dụng đang khởi tạo | Vẫn disable | Chốt giá trị đầu ra an toàn trước khi mở đường truyền | Không phát PWM/TRIG/audio ngoài ý muốn. Yêu cầu sản phẩm, dùng S7 bảng 7-1 |
| Brownout / rail không hợp lệ | Hardware veto thu hồi quyền | Cách ly trước miền đầu tiên mất điều kiện hợp lệ | Brownout nội MCU không thay supervisor/veto toàn hệ thống. S2 §2.5.3 |
| Software reset, panic, watchdog | Thu hồi quyền; khởi động lại ở trạng thái khóa | Không giữ quyền từ phiên cũ | S8: `esp_restart()` không reset nhiều ngoại vi. Pull-down chỉ thắng khi chân không còn bị lái |
| CHARGE / PROGRAM | Motor không được phép | Không mở ngoại vi công suất; PC có thể cấp riêng MCU | Quyết định nguồn hiện hành; không suy topology r7 sang Type-C |
| Armed hợp lệ | Chỉ được enable sau các bước kiểm tra | Mở từng miền theo trình tự; ampli cần quyền riêng | Không tự chạy lại sau reset, timeout hoặc phục hồi nguồn |

Các cận bắt buộc:

- Với DRV8833 tham chiếu: **nSLEEP ≤0,5 V** để bảo đảm LOW; khi cho phép HIGH phải đạt **≥2,5 V** theo điều kiện bảng, không dùng ngưỡng 2,0 V của chân khác. LOW làm cầu H disabled/Hi-Z; không đồng nghĩa bánh xe đã dừng. S6.
- `OE_N` phải đạt HIGH theo miền **VCCA** của translator. Pull-up ngoài thuộc miền VCCA; không kéo lên VCCB. S7.
- Điện trở 100 kΩ trong r7 là tham chiếu cần tính lại với leakage, dung sai và drive. Không ký PASS chỉ vì đã có điện trở kéo.
- Phải chứng minh riêng software reset/panic/watchdog. R7 AND3 cộng pull-down **chưa tự chứng minh** thu hồi quyền nếu GPIO hoặc ngoại vi tiếp tục lái HIGH. Cơ chế đáp ứng yêu cầu này được giải quyết khi thiết kế được phép; không chọn thêm chân trong contract.

Có một xung đột cần ghi vào hồ sơ triển khai: r7 nối `SD_MODE` ampli lên V5_R qua 10 kΩ, nên ampli có thể hoạt động khi V5_R xuất hiện. Điều này chưa đáp ứng yêu cầu “ampli OFF tới khi được arm”. Contract yêu cầu shutdown hoặc khóa nguồn ampli độc lập; không gán GPIO thay thế. S9 xác nhận SD_MODE LOW đưa tầng ra về Hi-Z.

**Trình tự boot/arm**

1. Phần cứng giữ motor disable, `OE_N` HIGH, ampli shutdown và các quyền cấp tải OFF.
2. Nguồn logic hợp lệ rồi mới thả EN. Với module tham chiếu, thời gian ổn định trước EN HIGH và xung reset LOW tối thiểu đều **50 µs**; giữ điều kiện strap ít nhất **1 ms** sau EN HIGH. Đây là cận tham chiếu S1 §3, không chứng minh mạch EN clone đáp ứng.
3. Ứng dụng vào trạng thái khóa; khởi tạo đầu ra motor/PWM/TRIG về mức an toàn trước khi kết nối ngoại vi.
4. Kiểm reset reason, lưu trạng thái phiên, nguồn và lỗi. Lỗi lưu hoặc cấu hình không hỗ trợ ⇒ giữ khóa.
5. Thực hiện re-arm theo [reset-review-candidate-r2](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-ctrl-v1-reset-review-candidate-r2.md): mẫu trung tính thật, Dừng nhả, Giữ để chạy nhả, rồi cạnh nhấn mới khi vẫn trung tính. Không tạo mẫu nhả giả lúc boot.
6. Khi đã có quyền: giữ cách ly, bật miền ngoại vi được phép, đợi nguồn hợp lệ; đặt dữ liệu đầu ra an toàn, sau đó mới mở `OE_N`.
7. Cấp quyền motor cuối cùng. Ampli chỉ được mở sau khi luồng audio hợp lệ và có lệnh phát; arm motor không tự yêu cầu phát âm thanh.
8. Lỗi/reset/timeout ⇒ thu hồi quyền và cần re-arm mới. Trạng thái dừng điều khiển `brake/coast/disable` vẫn phải được khóa trong contract motor; không tự chọn thay bằng hành vi reset.

**Đối chiếu robot §3.2 → nhãn ảnh → khả năng SoC**

Mỗi dòng có hai mức bằng chứng: **nhãn ảnh đã thấy**, còn **nối điện/net map UNKNOWN**. Mọi assignment r7 bên dưới đều `OLD_REFERENCE / NOT_APPROVED`.

| Tín hiệu r7 | GPIO cũ → nhãn nhìn thấy | Khả năng/điều kiện | Nguồn | At reset (S2 v5.3 tr.69) |
|---|---|---|---|---|
| AIN1 | 16 → `RX2` | Digital output/PWM qua GPIO matrix; chỉ dùng nếu module thực không chiếm cho bộ nhớ | R7:235; Ảnh; S1 §2.2 tr.10, §4.2.8 | oe=0, ie=0; bảng không ghi wpu/wpd |
| AIN2 | 17 → `TX2` | Như GPIO16; nhãn UART không bắt buộc dùng UART | R7:235; Ảnh; S1 tr.10; S3 Notes | oe=0, ie=0; bảng không ghi wpu/wpd |
| BIN1 | 18 → `D18` | Digital output/PWM | R7:235; Ảnh; S1 tr.10, §4.2.8 | oe=0, ie=0; bảng không ghi wpu/wpd |
| BIN2 | 19 → `D19` | Digital output/PWM | R7:235; Ảnh; S1 tr.10, §4.2.8 | oe=0, ie=0; bảng không ghi wpu/wpd |
| I2S_BCLK | 26 → `D26` | Digital I2S clock output | R7:236; Ảnh; S1 tr.9, §4.2.5 tr.18 | oe=0, ie=0; bảng không ghi wpu/wpd |
| I2S_LRCLK | 25 → `D25` | Digital I2S WS output; ADC2_CH8 là chức năng khác | R7:236; Ảnh; S1 tr.9; S4/S5 | oe=0, ie=0; bảng không ghi wpu/wpd |
| I2S_DIN | 27 → `D27` | Dữ liệu **MCU TX → DIN ampli**; phía ESP-IDF là `dout`, không phải `din` | R7:236; Ảnh; S1 §4.2.5; S5 | oe=0, ie=0; bảng không ghi wpu/wpd |
| US_TRIG | 23 → `D23` | Digital output; mức/độ rộng xung theo sensor thực | R7:237; Ảnh; S1 tr.10 | oe=0, ie=0; bảng không ghi wpu/wpd |
| OE_N | 4 → `D4` | Digital output; không phải strap ESP32 cổ điển | R7:238; Ảnh; S3 GPIO Summary; S7 | oe=0, ie=1, wpd |
| MCU_MOT_EN | 13 → `D13` | Digital output, có chức năng JTAG MTCK; cần kiểm reset/debug | R7:239; Ảnh; S1 tr.9; S3 | oe=0, ie=0; bảng không ghi wpu/wpd |
| US_ECHO | 34 → `D34` | Input-only, không pull nội; phải hạ mức/cách ly nếu sensor ra 5 V | R7:240; Ảnh; S2 IO_MUX; S3 | oe=0, ie=0; bảng không ghi wpu/wpd |
| IR1 | 35 → `D35` | Input-only, không pull nội | R7:241; Ảnh; S2 IO_MUX; S3 | oe=0, ie=0; bảng không ghi wpu/wpd |
| IR2 | 32 → `D32` | Digital input được; pull ngoài theo giao diện | R7:241; Ảnh; S1 tr.9 | oe=0, ie=0; bảng không ghi wpu/wpd |
| DRV_nFAULT | 33 → `D33` | Digital input; cấu hình pull-up/mức theo đường translator và nFAULT | R7:242; Ảnh; S1 tr.9; S6 §6.5 | oe=0, ie=0; bảng không ghi wpu/wpd |
| I2C SDA | 21 → `D21` | I2C qua GPIO matrix; không phải assignment cố định của silicon | R7:243; Ảnh; S1 §4.2.4 tr.17–18 | oe=0, ie=0; bảng không ghi wpu/wpd |
| I2C SCL | 22 → `D22` | Như SDA; cần pull-up đúng miền | R7:243; Ảnh; S1 §4.2.4 | oe=0, ie=0; bảng không ghi wpu/wpd |
| ISA_ADC | 36 → `VP` | ADC1_CH0, input-only, không pull nội | R7:244; Ảnh; S1 tr.9; S3/S4 | oe=0, ie=0; bảng không ghi wpu/wpd |
| ISB_ADC | 39 → `VN` | ADC1_CH3, input-only, không pull nội | R7:244; Ảnh; S1 tr.9; S3/S4 | oe=0, ie=0; bảng không ghi wpu/wpd |

GPIO25 thuộc ADC2_CH8, nhưng hạn chế tranh chấp ADC2/Wi-Fi áp dụng khi sử dụng **ADC2**. Nó không cấm GPIO25 làm I2S digital hoặc nút digital khi Wi-Fi bật. Đọc ADC timeout phải coi kết quả không hợp lệ, không dùng lại như mẫu mới. S4/S5.

Một DRV8833 có **hai cầu H**, r7 dùng bốn tín hiệu AIN/BIN cho hai kênh. Chưa có bằng chứng hỗ trợ bốn motor độc lập; bốn bánh hoặc wishlist bốn motor không nâng số kênh phần cứng. Ghép hai motor mỗi cầu cũng chưa được xác nhận về dòng/kẹt/nhiệt. S6, R7 §3.1.

**F2 — cách đọc trạng thái reset.** Cột mới chép đúng **At Reset**, không trộn **After Reset**, từ [ESP32 Series Datasheet v5.3, Appendix A.4 IO_MUX tr.69 và Notes on ESP32 Pin Lists tr.62](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf). Trong reset, output bị vô hiệu: oe=0 không có nghĩa chân được lái LOW. ie chỉ bộ đệm đầu vào; wpd/wpu là kéo yếu nội. Khi bảng không ghi pull, không giả định một mức điện được bảo đảm trên cả cụm.

GPIO13/MTCK trong bản hiện hành: At Reset oe=0,ie=0; After Reset oe=0,ie=1,wpd. Không dùng wpu của bản datasheet cũ/forum để tính kéo xuống100kΩ. GPIO4 có ie=1,wpd ở cả hai cột; GPIO16/17/18/19/23 At Reset oe=0,ie=0 và After Reset oe=0,ie=1. GPIO25/26/27 At Reset và After Reset đều oe=0,ie=0. ROM/JTAG/ứng dụng có thể cấu hình tiếp; phạm vi reset khác nhau, nên bảng này không thay ca software reset/panic/watchdog hoặc kiểm pull/leakage trên clone. Trạng thái mức điện thực vẫn [chưa kiểm chứng].

GPIO4 là `OE_N` tham chiếu, nên pull-down nội phải được tính cùng pull-up ngoài r7 trước khi khẳng định OE_N đạt HIGH: khi chân được nhả, hai điện trở kéo đối nghịch tạo chia áp, còn leakage và đường cấp khác phải cộng riêng. Không coi pull-up100kΩ tự thắng pull-down nội; cần cận điện trở và VIH theo đúng miền VCCA. Chứng minh default isolation thuộc gate MCU-RESET-VETO-RESOURCES trước lease schematic, chưa có kết quả đạt trong P0-03.

**Chân loại trừ và E1–E4**

| Nhóm | Chính sách contract | Nguồn |
|---|---|---|
| GPIO0/2/5/12/15 | Loại khỏi assignment ứng dụng mới trong proposal; không làm lệch strap khi reset | S1 §3; S2 §3 |
| GPIO34–39 | Chỉ input, không internal pull-up/down | S2 Appendix IO_MUX; S3 Notes |
| GPIO6–11 | Dành cho flash của module tham chiếu | S1 §2.2 tr.10 |
| GPIO1/3 | Dành UART0/boot/log/download; không nối điều khiển tải | S1 §2.2; S3 |
| GPIO14 | Loại theo **chính sách r7**, không gọi là strapping pin | R7:246; S3 xác nhận JTAG/ADC2, không strap |
| GPIO16/17 | Conditional tới khi biết module/bộ nhớ thực | S3 Notes; S1 module tham chiếu |
| E1 | `UNASSIGNED`; xét hướng, mức điện, reset và giao thức trước khi chọn chân | Yêu cầu P0-03 |
| E2 | `UNASSIGNED`; như E1 | Yêu cầu P0-03 |
| E3 | `UNASSIGNED`; nếu cần analog ưu tiên xét ADC1 khi có Wi-Fi | Yêu cầu P0-03; S4 |
| E4 | `UNASSIGNED`; không cam kết PWM/ADC/I2C trước khi phân bổ tài nguyên | Yêu cầu P0-03 |

Theo nhãn header ảnh và chính sách loại chân trên, r7 đã dùng hết **18 GPIO còn lại**. Vì vậy E1–E4 là bốn mục mở rộng logic chưa phân bổ, **không phải bốn GPIO trống đã dự trữ**. Cần quyết định tái phân bổ/chia sẻ bus hoặc thay kiến trúc khi thực sự thiết kế mở rộng; lượt này không chọn phương án.

**Nghiệm thu — tất cả `NOT_RUN`**

| ID | Ca kiểm / điều kiện PASS | Phương pháp, thời điểm |
|---|---|---|
| MCU-01 | Mất nguồn, power-on, EN reset, ROM/download: motor disabled, OE_N HIGH, ampli OFF | Review thiết kế rồi đo mức/trace khi được phép |
| MCU-02 | Brownout từng miền và CHARGE veto vẫn tắt motor dù MCU request bị giữ HIGH | Kiểm logic/lỗi nguồn; bench theo quyền riêng |
| MCU-03 | Software restart, panic, từng watchdog không giữ quyền phiên cũ hoặc tiếp tục drive ngoài cận | Review firmware sau này và trace trên đúng target |
| MCU-04 | GPIO init không tạo PWM/TRIG/audio hoặc nhả cách ly sớm | Review thứ tự khởi tạo, logic trace |
| MCU-05 | Module/ảnh/net map khớp; không dùng nhầm flash, PSRAM, strap hoặc chân input-only làm output | Hồ sơ target và đối chiếu điện theo gate/D10 áp dụng |
| MCU-06 | ADC1 hợp lệ với radio; lỗi ADC2 trả invalid; không dùng dữ liệu cũ để re-arm | Kiểm firmware/bench ADC khi được phép |
| MCU-07 | Nút giữ suốt reset, trục lệch, frame cũ hoặc boot ID mới đều không tự arm | Vector contract r2; parser/state test sau này |
| MCU-08 | Mốc 20/80/200/250 ms của contract r2 đạt trên đúng endpoint; ≤250 ms đo tới trạng thái điện motor đã định | Test protocol và trace; không suy quãng đường dừng |
| MCU-09 | Audio thật chỉ phát sau quyền hợp lệ; không có mic/nhận diện giọng nói V1 | Review cấu hình và thử tích hợp |
| MCU-10 | E1–E4 vẫn unassigned; không quảng bá bốn motor độc lập | Review tài liệu/schema |

Web Serial P1 và Wi-Fi + WebSocket V1 đã có hướng quyết định D4, không cần chọn lại. BLE chỉ là phương án so sánh nếu HQ đưa vào contract, chưa là kênh được chọn.

Snapshot đã đọc: r7 `08c5ced6…97d811`, reset candidate r2 `c7e391c5…ff9126`, ảnh `d8a012c5…9aeca9`. Không chạy validator, firmware test hoặc bench vì lượt này chỉ bàn giao nội dung đọc-only cho HQ ghi và review.

## 3. Đối chiếu tham chiếu tay cầm

Các dòng dưới là OLD_REFERENCE / NOT_APPROVED như bảng robot. Nguồn chung: [r7 §2.2, dòng113–122](claude-support/2026-11-06-pcb-status/final/kicad-input-spec-r7.md:113), [nhãn ảnh đã phiên chép](evidence/esp32-devkit-v1-type-c-sample.md:19), S1 bảng2 tr.9 và S4. Không đưa topology Micro-USB/VIN hoặc chân socket của r7 sang mẫu Type-C mới.

| Tín hiệu r7 | GPIO/nhãn ảnh tham chiếu | Khả năng và giới hạn | Nguồn/độ tin cậy |
|---|---|---|---|
| JOY_X | GPIO34 / D34 | ADC1_CH6, input-only, không pull nội | r7 §2.2; ảnh; S1 bảng2 tr.9; S3; capability có nguồn, net thực [chưa kiểm chứng] |
| JOY_Y | GPIO35 / D35 | ADC1_CH7, input-only, không pull nội | r7 §2.2; ảnh; S1 bảng2 tr.9; S3; net thực [chưa kiểm chứng] |
| JOY_SW | GPIO32 / D32 | Digital input; mức/pull/debounce theo giao diện thực | r7 §2.2; ảnh; S1 bảng2 tr.9; net thực [chưa kiểm chứng] |
| BTN1 | GPIO33 / D33 | Digital input, không strap classic ESP32 | r7 §2.2; ảnh; S1 bảng2 tr.9 và §3; net thực [chưa kiểm chứng] |
| BTN2 | GPIO25 / D25 | Digital input; ADC2_CH8 chỉ liên quan khi dùng ADC2 | r7 §2.2; ảnh; S1 bảng2 tr.9; S4; net thực [chưa kiểm chứng] |

Các yêu cầu E1–E4 là giữ chỗ logic, chưa có pin/net/đầu nối được duyệt và không hứa bốn GPIO rảnh. Lập net map được chấp nhận là gate triển khai, không tự sửa cấu hình robot hoặc các chân nguồn trong task tài liệu này.

## 4. Kênh web và quyền điều khiển

**Góp nội dung P0‑03 ở trạng thái `PROPOSED`: D4 giữ Web Serial cho kiểm chứng P1 và Wi‑Fi + WebSocket cho V1 sau validation. BLE là phương án so sánh.** D3 giới hạn âm thanh V1 ở playback lời chào/hướng dẫn đã lưu. D17-HW cho phép hoàn tất P0‑02 ở cấp hồ sơ PROPOSED, các gate schematic vẫn OPEN. D17-LIC (license) trong tài liệu ngoài dùng namespace riêng. [Biên bản Founder canonical](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-founder-decision-q1-q8.md)

| Kênh | Ưu điểm và hạn chế | Điều kiện trình duyệt, thiết bị và quyền | Mất kết nối và nối lại |
|---|---|---|---|
| **Web Serial — P1** | Kết nối cục bộ qua USB, thuận tiện kiểm handshake, telemetry và lỗi có thể tái lập. Cần cáp dữ liệu, driver USB‑UART đúng mẫu và xử lý dữ liệu bị chia thành nhiều chunk. DTR/RTS có thể tác động reset/boot tùy mạch B01. | Khởi điểm kiểm là Chrome desktop trên Windows, ghi chính xác phiên bản OS/browser/driver khi thử. Kiểm `navigator.serial`, secure context và Permissions Policy nếu nhúng. Người dùng chủ động chọn port. Quyền mở port và VID/PID chưa xác thực identity firmware. P1 PROGRAM phải tuân thủ khóa chuyển động của phần cứng. [Chrome Web Serial](https://developer.chrome.com/docs/capabilities/serial) | Rút cáp, lỗi đọc/ghi, reset B01 hoặc thu hồi quyền đều hủy session điều khiển. Mở lại port phải handshake mới và ở trạng thái khóa. Không phát lại lệnh còn trong buffer. |
| **Wi‑Fi + WebSocket — V1 sau validation** | Điều khiển không dây từ web và telemetry hai chiều trên mạng cục bộ. Cần chốt AP/STA, discovery, nguồn trang web và endpoint, cùng giới hạn kết nối/buffer. | ESP‑IDF có WebSocket server cho **ESP32 classic**. Phiên bản SDK dùng triển khai phải pin riêng. Browser cần tới được endpoint và vượt chính sách secure context, mixed content, local-network permission/TLS áp dụng cho đúng bản trình duyệt. Handshake phải kiểm origin, identity thiết bị và xác thực session trước khi cấp quyền điều khiển. Kiểm origin không thay xác thực. [ESP‑IDF HTTP/WebSocket](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/protocols/esp_http_server.html) · [Chromium Local Network Access](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access) | Wi‑Fi mất, socket đóng, tab treo hoặc app ngừng gửi lệnh mới đều dẫn tới hết hạn ở robot. TCP còn mở không chứng minh người dùng còn điều khiển. Reconnect tạo session và quyền mới, vẫn khóa chờ thao tác tái cho phép. |
| **BLE GATT — so sánh** | Có thể giao tiếp gần thiết bị mà không cần mạng Wi‑Fi. Phải thiết kế service/characteristic, giới hạn gói, phân mảnh và xác thực ứng dụng. Classic ESP32 có BLE, nhưng hỗ trợ radio không đồng nghĩa mọi browser dùng được. | Web Bluetooth yêu cầu secure context, thao tác người dùng và quyền chọn thiết bị. Kiểm `navigator.bluetooth`, OS/Bluetooth adapter và GATT trên từng browser thực tế. Chrome công bố hỗ trợ một tập API trên một số nền tảng; Safari/iOS và các nền tảng khác giữ `UNKNOWN` đến khi kiểm. BLE GATT khác Bluetooth Classic SPP. [Chrome Web Bluetooth](https://developer.chrome.com/docs/capabilities/bluetooth) · [ESP‑IDF BLE cho ESP32](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/ble/overview.html) | GATT disconnect, lỗi characteristic hoặc hết hạn lệnh đều thu hồi quyền. Kết nối lại và đăng ký notification mới không tự tái cho phép chuyển động. |

**Ranh giới handset và web.** `MOBOT-CTRL/1` r2 là proposal ESP‑NOW giữa tay cầm và robot, với `POLL` 16 byte, `CMD` 32 byte và các quy tắc epoch/boot ID đã review. Web Serial, WebSocket và BLE dùng adapter riêng, đưa yêu cầu vào cùng bộ cấp quyền trên robot. Web chưa có wire format được review. Khi muốn dùng lại `MOBOT-CTRL/1`, phải có mapping tường minh thay vì tự gói web thành `CMD` có quyền. Đồng thời chạy Wi‑Fi và ESP‑NOW cần kiểm kênh radio; BLE còn chia sẻ tài nguyên RF với Wi‑Fi. D4 chưa xác nhận khả năng chạy đồng thời các kênh. [MOBOT‑CTRL/1 r2](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-ctrl-v1-reset-review-candidate-r2.md) · [ESP‑NOW channel](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html) · [ESP32 coexistence](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/coexist.html)

**Hợp đồng trạng thái đề xuất**

- Robot là nơi quyết định quyền cuối cùng. Tại một thời điểm chỉ có **một authority chuyển động**, gồm `HANDSET` hoặc một session web đã xác thực. Kết nối telemetry có thể tồn tại mà không có quyền chuyển động. Đổi authority phải đi qua STOP, thu hồi session cũ và tái cho phép chủ động.
- Chuỗi trạng thái là `BOOT_LOCKED → CONNECTED_UNAUTHENTICATED → AUTHENTICATED_LOCKED → ARMED`. Reset, brownout, veto phần cứng, lỗi session hoặc timeout đưa về khóa. Kết nối và xác thực thành công chỉ mở khả năng yêu cầu ARM.
- Veto phần cứng và lỗi nguồn ưu tiên cao nhất. STOP hợp lệ thu hồi quyền trước mọi lệnh chuyển động. STOP từ một session đã xác thực có thể chỉ làm dừng, không được chiếm authority. Lệnh cũ/sai phiên bị loại và không gia hạn timeout.
- Đề xuất web dùng hạn **200 ms tới thu hồi quyền, ≤250 ms tới đầu ra dừng**, để chung tiêu chí với handset. Đây là đề xuất cần validation, không suy từ độ trễ mạng trung bình. Thiết bị đo tuổi lệnh bằng đồng hồ đơn điệu của chính nó. Heartbeat transport đơn thuần không gia hạn chuyển động. Sau timeout/reconnect phải thấy điều khiển trung tính, nhả thật rồi thao tác cho phép mới.
- ACK cần phân biệt `received`, `accepted/rejected` và trạng thái thực thi. Phản hồi gửi thành công của browser hoặc radio chưa chứng minh đầu ra actuator đã đổi. `brake/coast/disable` vẫn chờ review robot.

**Local-first và nhật ký giao dịch.** Không yêu cầu account hoặc cloud. Guest web giữ draft khi thiết bị ngắt kết nối. Session/key chỉ lưu theo phạm vi đã thiết kế, không đưa bí mật vào log. Contract cần nhận diện `deviceId`, board/module revision đã biết hoặc `unknown`, firmware version/hash, protocol/capability version, boot/session ID và authority. Mỗi giao dịch ghi `commandId/seq`, thời gian thiết bị, thời điểm browser nhận, kết quả và reason code. Nhật ký có giới hạn dung lượng, báo rõ khi mất phần đầu. Chỉ ghi “đã lưu” sau khi thao tác storage thành công; export là bản sao người dùng chủ động giữ.

**Bộ ca bàn giao cho QA/TST**

1. Đúng/sai device, firmware protocol hoặc quyền browser; từ chối permission và thu hồi permission.
2. Hai tab web và handset cùng xin quyền, đổi authority khi đang chạy, STOP khi có hàng đợi lệnh.
3. Gói trùng, đảo thứ tự, hết hạn, sai session; serial bị chia chunk; WebSocket buffer cũ sau reconnect.
4. Rút USB, DTR/RTS gây reset, mất Wi‑Fi/GATT, tab nền/treo, reset và lỗi lưu. Tất cả trở lại khóa và không tự ARM.
5. Wi‑Fi/ESP‑NOW cùng kênh, tải playback và reconnect, đo hạn điều khiển trên thiết bị thực.
6. PROGRAM và veto phần cứng vẫn chặn chuyển động dù web gửi ARM.

Nguồn chính thức xác nhận khả năng API và SDK. **Browser/device thực tế và toàn bộ ca trên đều `NOT_RUN` trong lượt này.** Nội dung góp cho [hợp đồng MCU dự kiến](D:/StartupOS/electronics-learning-demo/docs/hardware/mobot-v2-esp32-mcu-contract.md) là proposal kiến trúc. `MM-RUN-001` còn phạm vi payload K‑RUN rộng hơn phần webcontrol này.

## 5. Trạng thái nghiệm thu và bàn giao

| Phạm vi | Kết luận của P0-03 | Gate / việc sau này |
|---|---|---|
| Hợp đồng hành vi reset/boot/control | Yêu cầu đã mô tả, không có firmware chứng minh | Review firmware/state simulation sau khi có scoped implementation; trace điện chỉ sau quyền riêng |
| Module/net map clone | [chưa kiểm chứng], NO-GO cho gán chân triển khai từ bảng tham chiếu này | Định danh exact module/revision, net map và cấu hình/hash/gate theo quyền Founder |
| Reset phần mềm / watchdog khi output giữ HIGH | Không giả định pull-down thắng output đang drive | Phải có thiết kế thu hồi quyền/enable đáp ứng ca lỗi, review và kiểm riêng từng reset |
| Ampli r7 luôn được enable qua pull-up | Xung đột với hợp đồng audio OFF tới khi được phép | Giải quyết shutdown/power-gating trong thiết kế được phép; không gán GPIO mới tại đây |
| Hai cầu H / bốn motor độc lập | Chưa hỗ trợ/không có bằng chứng đủ | Thay cấu hình/driver/phân bổ chân phải có review và Founder duyệt riêng |
| Thời gian 20/80/200/250 ms | Tiêu chí tham chiếu proposal MOBOT-CTRL/1; NOT_RUN | Chốt endpoint/định nghĩa dừng điện, test protocol rồi bench; không suy quãng đường dừng |
| Web Serial/Wi-Fi/BLE | So sánh và yêu cầu kiểm chứng; browser/device NOT_RUN | D4 giữ nguyên; không chọn thêm BLE, cloud hay toolchain |
| MM-RUN-001 | Chỉ có đầu vào contract web-control từ tài liệu này | Payload/observation/capability K-RUN rộng hơn vẫn chưa hoàn tất |

Mọi hàng MCU-01…MCU-10 và sáu nhóm ca web phía trên đều là **kế hoạch nghiệm thu, NOT_RUN**. Review tài liệu không thay mô phỏng state machine, thực thi firmware hay phép đo. Không tuyên bố đã có motor safety, Web Serial/WS/BLE hoặc reset handling được triển khai từ việc file này tồn tại.

Nguồn đầu vào H1: [review hardware06/11, H1](../claude-support/2026-11-06-review-hardware/findings.md:17) là finding lịch sử. P0-03 bổ sung contract còn thiếu, không tự đóng toàn bộ phần firmware của H1. Nguồn WP1.4: [execution plan](claude-support/2026-11-06-pcb-first-plan/codex-pcb-execution-plan.md:64). Nguồn protocol r2 và các nguồn hãng được đặt gần từng bảng/claim; các file advisory không phải review độc lập hoặc bằng chứng bench.

Định danh canonical của disposition P0-02 là **D17-HW**, alias lịch sử `D17` trong biên bản hardware. Quyết định license có mã `D17` trong tài liệu do bên khác sở hữu; dùng nhãn phân biệt **D17-LIC (license)** khi trích trong contract, không tự sửa bản bên kia. Các gate ID `D17-*` của hardware giữ nguyên và không phải quyết định license.

## 6. Cổng tài nguyên bắt buộc trước lease schematic — disposition F1

Hai yêu cầu an toàn chưa có phân bổ tài nguyên được duyệt. Bảng chân robot tham chiếu đã dùng 18/18 GPIO theo chính sách hiện tại; không coi E1–E4 là tín hiệu rảnh hoặc dùng cột reset làm phép bổ sung chân.

| Gate | Áp dụng / mốc | Điều kiện đóng và chứng cứ | Owner / trạng thái |
|---|---|---|---|
| MCU-RESET-VETO-RESOURCES | Tay cầm và robot: trước lease schematic tương ứng | Phương án thu hồi quyền độc lập khi GPIO/ngoại vi còn drive qua software reset, panic/watchdog; định danh nguồn, logic/chốt, đường lỗi chung và tài nguyên có cận. Review xác nhận không tạo enable sai, không dựa pull-down thắng output HIGH. FAIL nếu chưa phân bổ, chưa có cận hoặc còn quyền chạy sau lỗi. | Box02 + Box01, Box08 review; OPEN; NOT_RUN |
| MCU-AUDIO-SHUTDOWN-RESOURCES | Robot và mọi carrier có ampli: trước lease schematic tương ứng | Phương án shutdown/power-gating giữ ampli OFF tới quyền audio hợp lệ, xử lý kéo lên SD_MODE của r7 và phân bổ tín hiệu/tài nguyên. FAIL nếu auto-enable khi rail lên, thiếu tài nguyên hoặc chỉ dựa trạng thái MCU chưa xác minh. | Box02 + Box01, Box08 review; OPEN; NOT_RUN |

Hướng cần đánh giá, chưa chọn trong contract: (a) chia sẻ enable đã có qua chốt/logic phần cứng với MCU_MOT_EN/OE_N; (b) mở rộng I/O trên bus I2C có sẵn, kèm mặc định OFF/mất nguồn/lỗi bus; (c) xem xét giải phóng chân đang bị loại theo chính sách r7 sau review strap/boot/JTAG/UART. I/O expander hoặc chân mới không tự giải quyết reset-veto độc lập; không được dựa I2C/firmware đang treo để tắt tải. Mọi lựa chọn mới phải review và duyệt cấu hình/hash trước pin assignment hoặc triển khai.

F1 là cổng thiết kế tương lai, không chặn nhận tài liệu P0-03 PROPOSED theo REVIEW_RESULT. Hai gate OPEN phải được đưa vào hồ sơ dispatch trước khi cấp bất kỳ lease schematic áp dụng; không coi việc đóng task tài liệu là đã đóng gate.

## 7. Đường lái nSLEEP và biên mức logic — trả lời Q1

Trong **r7 tham chiếu**, nSLEEP không được lái trực tiếp từ ESP32 hoặc từ rail 5 V: `MCU_MOT_EN → U9.C`, U9=`SN74LVC1G11DBVR`, VCC=`V3V3_DEV`; `U9.Y → MOTOR_EN → DRV8833.nSLEEP + TPS63070.EN + R48`. Nguồn: [r7 dòng195–205](claude-support/2026-11-06-pcb-status/final/kicad-input-spec-r7.md:195). Đây là đối chiếu r7, không xác nhận topology robot Type-C mới đã được duyệt.

| Tầng | Cận cần kiểm | Nguồn và điều kiện |
|---|---|---|
| MCU → U9 | `NMH1=VOH_MCU,min−VIH_U9−ΔV1` | ESP32 Series v5.3 §5.3 bảng5-3 tr.52: VOH≥0,8×VDD trong điều kiện bảng3,3V/25°C; không tự dùng cho mọi góc nhiệt/áp/drive. U9 Rev I §5.3 tr.4: VIH=2,0V tại VCC3,0–3,6V; 1,7V tại2,3–2,7V, không gộp thành2,7–3,6V. |
| U9 → nSLEEP | `NMH2=VOH_U9,min−2,5V−ΔV2` | SN74LVC1G11 Rev I §5.5 tr.5: VOH≥VCC−0,1V tại IOH=−100µA; tại VCC3V với−16/−24mA chỉ bảo đảm2,4/2,3V, không đủ nSLEEP HIGH2,5V. DRV8833 Rev E §6.5 tr.6. |

ΔV gồm sụt đường, lệch GND và nhiễu; cần biên dương có ngân sách, không chỉ so hai mức danh nghĩa. [TI SN74LVC1G11 Rev I](https://www.ti.com/lit/ds/symlink/sn74lvc1g11.pdf), [Espressif v5.3](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf) và S6 là nguồn cận, không phải kết quả đo.

Tổng tải U9 phải gồm R48, nSLEEP, EN converter và mọi đường rò/tải động. Ví dụ có điều kiện tại3,3V, giả sử R48=100kΩ±1%: `3,3/99k +13µA =46,33µA`, còn53,67µA cho EN và tải khác nếu dùng dòng bảng100µA. Cận13µA của nSLEEP chỉ được đặc tả ở VIN3,3V và điều kiện bảng TA25°C; không cộng điện trở pull-down nội lần nữa và không extrapolate số đó thành cận mọi nhiệt/áp. Tải EN theo [TPS63070 Rev B, bảng điện tr.6](https://www.ti.com/lit/ds/symlink/tps63070.pdf) và tụ đầu vào cũng phải được tính.

Ở điểm3,3V, nếu đáp ứng đúng các điều kiện trên, biên trướcΔV là0,64V cho MCU→U9 và0,70V cho U9→nSLEEP. Rail tối thiểu thực của clone vẫn **[chưa kiểm chứng]**; ngay cả ví dụ3,0V cũng chỉ cho0,40V/0,40V nếu riêng cận0,8VDD của MCU được xác lập ở góc đó và tổng tải U9 đáp ứng100µA. Không nhận các ví dụ này là PASS phần cứng.

Trước lease schematic, hồ sơ đóng gate MCU-RESET-VETO-RESOURCES phải xác lập rail min/max qua tải/brownout, VOH/VIH đúng góc áp/nhiệt/drive và tổng tải, hai ngân sáchΔV, mức default và trạng thái khi mất nguồn. Không dùng cận dòng source40mA điển hình của ESP32 làm định mức bảo đảm; không chọn thêm chân hoặc sửa đường lái trong contract này.

