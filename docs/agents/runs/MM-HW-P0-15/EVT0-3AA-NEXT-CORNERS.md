# EVT0 3 AA · Cận cần kiểm ở phương án 2,70 V

Bổ sung cho [hồ sơ nguồn 3 AA](EVT0-3AA-QUALIFICATION.md) sau khi sửa phép tính theo Box 08. Các số là phân bổ để sàng lọc. Phép đo `NOT_RUN`.

## Tăng biên điện trở cho khay pin

Thử hạ VIN tối thiểu ở đầu boost từ 2,85 xuống 2,70 V khi sàng lọc LTC1871-1. Giữ 5,304 V và 1,50 A ở đầu ra, tải phụ 50 mA và 3,15 V tại cực pack. Cả hai cột dùng NAF 0,50 mV và giả định dung sai toàn phần của shunt là ±1%.

| Phép kiểm | Shunt 10 mΩ, RLIMIT 2,00 kΩ | Shunt 15 mΩ, RLIMIT 3,00 kΩ |
|---|---:|---:|
| Cửa sổ cắt tĩnh | 3,788–4,115 A | 3,834–4,102 A |
| Hiệu suất cần đạt để tải 1,5 A nằm dưới cắt sớm nhất | 78,83% | 77,86% |
| Dòng pack ở hiệu suất giả định 80% | 3,733 A | 3,733 A |
| Biên từ tải đó tới cắt sớm nhất | 54,8 mA | 101,0 mA |
| R đường vào tối đa ở cắt muộn, với 450 mV sụt áp | 109,35 mΩ | 109,71 mΩ |
| R còn lại cho holder và đồng | 61,25 mΩ | 56,56 mΩ |
| Công suất shunt ở cắt muộn | 0,171 W | 0,255 W |
| Overdrive tại 4,2 A ở corner cắt muộn | 0,84 mV | 1,46 mV |

Shunt 15 mΩ tăng biên dòng và đưa overdrive qua điều kiện 1 mV của TI tại điểm kiểm 4,2 A. Cần cận trễ cả đường để đánh giá xung. Vishay WSK2512 có tùy chọn dung sai ban đầu ±0,1% và TCR ±35 ppm/°C tại 15 mΩ. Giới hạn thử load life là ±(1% + 0,5 mΩ), rộng hơn phân bổ toàn phần ±1%. Nếu áp riêng giới hạn load life đó theo chiều tăng R, ngưỡng cắt sớm giảm còn khoảng 3,71 A, dưới tải 3,733 A. Vì vậy WSK2512 vẫn là ứng viên có điều kiện. Cần cận độ trôi theo tuổi thọ áp dụng được hoặc một đường bảo vệ khác. Cũng cần chứng minh hiệu suất MIN tại 2,70 V, khởi động, tải bước và sai số VOUT của tổ hợp thực. [Vishay WSK2512, 30108, tr. 1–3](https://www.vishay.com/docs/30108/wsk2512.pdf), [ADI LTC1871-1, tr. 31](https://www.analog.com/media/en/technical-documentation/data-sheets/18711fb.pdf)

Tiếp điểm lò xo UWE UEBK-10717 có thông tin hãng 15 A và trở tiếp điểm ≤5 mΩ ở điều kiện sản phẩm. Sáu tiếp điểm chiếm 30 mΩ nếu cận đó áp dụng được cho cấu hình AA. Tài liệu nêu hành trình làm việc 1,70 mm và lực 2,56 N. Cần xác minh tiếp xúc với cực AA, chiều dài pin qua dung sai, lực khi lắp, R sau lão hóa và giá. Giữ làm đối chứng để so với khay Keystone và Bulgin. [UWE UEBK-10717](https://www.uweelectronic.de/en/products/battery-probe-uebk-10717.html)

## Ngưỡng cell yếu và thử lại

Với VARTA 56706, có thể sàng lọc ngưỡng từng cell **0,95 V ±0,05 V** dưới tải trong miền đã định. Ở cận cắt thấp 0,90 V còn 100 mV tới điểm cuối 0,80 V của định mức dòng liên tục. Nếu dùng 100 mV làm phân bổ động, tổng bước sụt, sai số bổ sung và độ sụt từ lúc phát hiện tới lúc ngừng dòng phải nhỏ hơn phân bổ đó. Phải đo tại đúng đầu cell hoặc quy đổi sụt tiếp điểm với sai số đã tính. 0,80 V là điều kiện datasheet, chưa phải ngưỡng áp dụng cho mọi model hoặc ca lỗi xung. Ngưỡng cho alkaline vẫn TBD. [VARTA 56706, trang 1](https://docs.rs-online.com/20d6/A700000015406392.pdf)

Trình tự để review là **OFF → thử tải nội → cho phép quảng bá → RUN → lỗi → thử lại có tải tối đa một lần**. Khi lần thử lại thất bại hoặc phát hiện đảo cực/tap lỗi, giữ OFF. Mất bias mặc định hủy quyền cấp VBUS. Bộ đếm lượt thử cần tồn tại qua sụt áp do tải, hoặc mặc định khóa nếu không phân biệt được brownout với lần bật công tắc mới. Phải kiểm tap hở, chạm sau điện trở giới hạn, lỗi dây tham chiếu và cách nhận biết lần bật chủ ý. 

Điểm còn mở là hiệu suất MIN ở VIN mới, holder có cận R và giá phù hợp, ca xung trước khi cắt, giới hạn rò diode ở nhiệt độ, hai nguồn gần bằng áp và ngưỡng từng cell. Bảng này bổ sung tiêu chí thiết kế, chưa thay đổi r14 hoặc đóng cổng B1.

## Ứng viên xử lý dòng ngược gần bằng áp

LM74800 có ngưỡng phát hiện nhanh khi cathode cao hơn anode **1,3–6,5 mV**, hẹp hơn vùng mù 95–190 mV của TPS2553-1. Cận tắt DGATE 0,875 µs của TI đo ở bước từ +30 xuống −100 mV và tải cổng 10 nF, tới VDGATE−A dưới 1 V. Với ca hai nguồn lệch 90 mV, cận ngưỡng cho thấy có thể phát hiện, còn thời gian tắt MAX của ca này và dòng đỉnh qua FET thực vẫn TBD. Ứng viên được khảo sát phía rail boost. Cần kiểm nguồn mất bias, độc lập hai tầng, cận dòng thuận khi cắm nhầm, tụ và đường xả. [TI LM7480, bảng Electrical Characteristics](https://www.ti.com/lit/ds/symlink/lm7480.pdf?ts=1779522905823)

## Ứng viên B01 có sơ đồ truy xuất

Ampnics ESP32-WROOM-32 Dev Board **v0.2.0**, sơ đồ 06/04/2026 trang 1, ghi hai header 15 chân, USB-C và CH340C. Quan sát dây nối trên PDF cho thấy CC1/CC2 kéo GND bằng hai điện trở 5,1 kΩ, D+/D− vào bridge, VBUS đi qua B5819W tới rail 5 V, rồi qua AMS1117-3.3. Điều này gỡ được việc phải đoán cấu trúc USB trên chính thiết kế tham chiếu. CH340C là chức năng truyền thông USB, nên không lấy sơ đồ này làm chứng cứ B01 đủ điều kiện PSD.

Đây là thiết kế tham chiếu có nhận dạng và schematic, chưa chứng minh bo mẫu hoặc PCBA bán tại Việt Nam là cùng bản. Giữ đánh giá dropout, tụ và giới hạn nhiệt regulator theo đúng MPN, rail tại attach/boot/radio và cơ khí thực. [Kho thiết kế v0.2.0](https://github.com/ampnics/ESP32Wroom32-Dev/tree/571a49290cc4847a53ea1cd125c7879f3f5f03a7)

Đã tải [PDF Ampnics](../../../research/downloads/evt0-3aa-2026-11-11/ampnics-esp32wroom32-dev-v020.pdf) ngày 11/11/2026, kiểm định dạng và đọc sơ đồ. SHA-256 `cf00f350c6cef82ff0e81b4847bf590965b025c79c0577b52ee8b934d30dbd7a`. [PDF tại commit ghim](https://raw.githubusercontent.com/ampnics/ESP32Wroom32-Dev/571a49290cc4847a53ea1cd125c7879f3f5f03a7/schematic/esp32wroom32-dev.pdf)
