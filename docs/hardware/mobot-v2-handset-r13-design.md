# MoBot V2 · Hồ sơ đề xuất nguồn tay cầm EVT0 r13

[Biên nhận F1–F5](mobot-v2-founder-decision-q1-q8.md#11112026--f1f5-tay-cầm-evt0) áp dụng cho tay cầm. B01 là ESP32 DevKit USB-C 30 chân họ CH340. Phép đo mẫu `NOT_RUN`.

## Giao diện theo khối

3 AA → PTC gần cực dương → chống ngược cực → công tắc → boost → đóng cắt VBUS có kiểm CC và bảo vệ ngược → cáp USB-C liền dây → B01. Detector giám sát pack trong RUN. VIN và EN của header B01 để hở. 3V3 và GND của B01 cấp các phần tử điều khiển thụ động. Không đưa nguồn carrier hay đầu mở rộng phụ kiện ra GPIO. Khi PROGRAM, rút cáp carrier khỏi B01 rồi cắm cáp máy tính. Phân vai dự kiến là bốn ngõ ADC1 và tám ngõ nút, chưa gán chân.

## Cận điện và điều kiện

| Khối | Ứng viên và giới hạn |
|---|---|
| Boost | TPS61023 Rev. B §6.5 và §7. Tài liệu nêu ±2,5% reference và ngắt tải khi shutdown. Cần chốt sai số toàn vòng, tải liên tục 0,6 A tại VIN 3,0 V, cuộn cảm, nhiệt, đỉnh khởi động và giới hạn khi ngắn mạch. Với 5,1 V ±3%, biên sụt xuống 4,75 V tại 0,5 A là 197 mV. Biên trên 5,253 V cần đối chiếu với yêu cầu nguồn Type-C trước khi khóa setpoint. [TI](https://www.ti.com/lit/ds/symlink/tps61023.pdf) |
| Type-C | TPS25810 Rev. C §6.5 và §8 là ứng viên đóng cắt theo CC. RDS(on) MAX 55 mΩ tại điều kiện 3 A, −40…125 °C. Rò ngược MAX 3 µA chỉ được đặc tả với VOUT = 6,5 V, VIN1 = VEN = 0 V và −40…85 °C. Giới hạn ngắn mạch 1,58–1,82 A ở cấu hình dòng thấp hơn không tự bảo vệ được đường 3 AA. Cần chứng minh cáp liền dây và cả hai chiều cắm, quảng bá dòng phù hợp với khả năng cấp, khởi động dưới tải, xả VBUS, khóa bật khi gặp VBUS ngoài, giới hạn dòng độc lập và hành vi ở trạng thái có nguồn/mất nguồn. LM66100 Rev. A §8.3.2 chỉ là ứng viên một chiều. [TI TPS25810](https://www.ti.com/lit/ds/symlink/tps25810.pdf), [TI LM66100](https://www.ti.com/lit/ds/symlink/lm66100.pdf), [USB-IF bảng 4-11](https://www.usb.org/sites/default/files/USB%20Type-C%20Spec%20R2.0%20-%20August%202019.pdf) |
| UVLO | TPS3808G01, SBVS050N trang 6–7, §7.3.1. Với R trên danh định 6,96 kΩ, R dưới 1,00 kΩ, ±0,1% mỗi nhánh đã gồm sai số được phân bổ, và tổng dòng sai số SENSE giả định ±100 nA (IC ±25 nA), tính ngưỡng tĩnh theo Vtrip = VIT × (1 + Rtrên/Rdưới) ± I × Rtrên. Cận tĩnh 3,153–3,295 V ở đầu đo, nằm trong 3,15–3,30 V nếu đạt các phân bổ. Còn phải chứng minh cách lấy áp tại pack, dung sai thực gồm nhiệt/lão hóa, sụt động, reset mặc định khi nguồn detector dưới cận, thời gian và hành vi tự phục hồi. 180–420 ms khi CT = VDD là cận nhả RESET theo điều kiện datasheet, không chứng minh hết dao động khi pin yếu. [TI TPS3808](https://www.ti.com/lit/ds/symlink/tps3808.pdf) |
| PTC, đảo cực, công tắc, dây | Với hiệu suất minh họa 85%, 5,253 V × 0,6 A / (3,0 V × 0,85) ≈ 1,24 A ở đầu boost, chưa kể tải phụ. Cần cận bảo đảm và profile tải để chốt derating, I²t ngắn mạch, sụt áp, rò, chịu DC và nhiệt. PTC không thay giới hạn dòng tức thời. MPN và dự toán còn TBD. |
| Tải B01 3V3 | Tổng phân bổ ≤20 mA. Cần dung sai biến trở, dòng pull-up khi nhấn đồng thời, cận điện áp rail và bằng chứng dòng 3V3 còn dư trên đúng B01. Ảnh silkscreen chỉ dùng cho dự kiến; kích thước và điện nội bộ clone TBD. |

## Ca lỗi cần review

| Ca | Điều kiện để đóng |
|---|---|
| Rút cáp, OFF hoặc pack vắng | Không cấp năng lượng từ carrier vào đầu cáp. Xác định thời gian xả tụ và cận dòng rò trong điều kiện đã định. |
| Cắm nhầm cổng nguồn ngoài | Kiểm hai chiều dòng với carrier ON/OFF, không pack và lỗi dính switch. Phân biệt dòng từ rail carrier sang cổng ngoài, dòng từ cổng ngoài vào pin và dòng vào nhánh xả. |
| Lắp ngược hoặc ngắn mạch | Chứng minh phần chống ngược cực, PTC và giới hạn dòng cùng chịu được trạng thái xấu nhất theo nhiệt độ, điện áp pin và đường cáp. |
| Cell yếu và tự phục hồi | Tổng áp có thể che cell đảo cực. Hysteresis và trễ có thể giới hạn nhịp bật lại nhưng không tự loại trừ lặp. Cần cận theo hai hóa học pin, tiêu chí khi gặp cell yếu và phân tích sụt áp trước khi chốt. |

## Phạm vi review

C1/C2/C10/C11 kiểm bảng giao diện thụ động, ADC1, ngân sách tải và tài nguyên. C3/C5/C7 kiểm trạng thái Type-C và đường đi của dòng ở hai chiều, không chỉ kiểm sự hiện diện của linh kiện. C4/C6 đối chiếu danh sách khối, cấu hình pin tháo rời và hai chế độ. C8/C9 kiểm cận PTC và UVLO trên toàn đường. C12 phân biệt MIN/MAX với TYP, và chỉ để lại phép đo sau PCB thuộc D10.

Ba khoảng hàng socket tham chiếu 22,86 / 25,40 / 27,94 mm và đường dây nhảy chỉ để đánh giá khả năng lắp. Dự toán phải gồm robot, tay cầm, PCB, khối nguồn Type-C, pin và linh kiện lắp. Dữ liệu giá và kích thước chính xác TBD.
