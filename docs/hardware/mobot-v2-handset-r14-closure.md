# MoBot tay cầm EVT0 r14 · Hồ sơ xử lý review

Phạm vi [F1–F5](mobot-v2-founder-decision-q1-q8.md#11112026--f1f5-tay-cầm-evt0). Các đề xuất dưới đây là cận để chọn linh kiện và phản biện. Mọi phép đo trên mẫu `NOT_RUN`. [Kết quả review r13](../agents/runs/MM-HW-P0-15/EVT0-R13-DISPOSITION.md)

## C1, C2, C4, C6, C10, C11 · Giao diện và tải

| Nhóm giao diện B01 | Phân bổ cho đề xuất |
|---|---|
| USB-C của bo | Cổng nhận điện duy nhất. RUN dùng cáp nguồn liền của carrier. PROGRAM tháo cáp đó và cắm cáp PC. |
| VIN và EN | NC tại carrier. |
| 3V3 và GND | Chỉ 3V3 do B01 cấp cho joystick và pull-up. GND là tham chiếu của tải thụ động. |
| 4 trục và 8 nút | Trục dùng nhóm ADC1 input-only. Nút dùng pool GPIO hai chiều sau khi loại chân cấm. Giữ bốn trục, tám nút, chưa gán chân. |
| Nhãn còn lại, pad thử | Không dùng làm cổng phụ kiện hoặc đường cấp từ carrier. Pad thử tương lai phải thuộc nhóm net tương ứng. |
| Nguồn rời | Holder 3 AA tháo rời, bảo vệ đầu vào, boost, logic CC, đóng cắt và xả VBUS. Danh mục khối không có bộ sạc, pack cố định hoặc actuator. |

Ảnh mẫu cho bốn nhãn ADC1 input-only và 13 nhãn ứng viên GPIO hai chiều sau khi loại strap, UART0, GPIO16/17. Ngay cả khi để GPIO4 dự phòng còn 12 ứng viên cho tám nút. Tải thụ động có phân bổ 4 × 3,6 V/9 kΩ + 8 × 3,6 V/9,9 kΩ = 4,51 mA, giả định bốn trục ≥9 kΩ, tám pull-up rời ≥9,9 kΩ, không cộng pull-up nội. Đây là phân bổ, cần nguồn cho joystick, độ ổn định ADC và cận tải thật của 3V3 B01. Kích thước và tính liên tục của board clone vẫn TBD. [Ảnh mẫu](evidence/esp32-devkit-v1-type-c-sample.md), [Espressif ESP32 v5.32, bảng 2-1](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)

## C3, C5, C7 · Điều kiện đóng VBUS

Hai phần tử công suất nối tiếp mặc định ngắt. Ưu tiên đánh giá một tầng ngắt hai chiều khi mất bias, một tầng hạn dòng có latch-off. Mỗi tầng phải tự chặn trong miền lỗi cần bao phủ, kể cả khi tầng kia dính dẫn. Tách kiểm CC và VBUS phía đầu cáp khỏi đường điều khiển công suất. Tầng ngắt hai chiều, comparator phía đầu cáp và nhánh xả chưa khóa linh kiện.

| Trạng thái | Hành vi được phân bổ | Cận chưa đủ |
|---|---|---|
| OFF, pack vắng, mất bias | Hai công tắc mặc định ngắt, CC không trình diện Rd và xả chủ động không duy trì từ nguồn bên ngoài. | Rò từng đường qua CC, VBUS sense, EN, diode/clamp và công tắc khi mất bias hoặc một công tắc dính. |
| RUN, chưa có Rd hợp lệ | VBUS vẫn ngắt. CC Source chỉ hoạt động khi bias hợp lệ. | Thời gian, trạng thái dây cáp và vạch phân loại Rd/Ra/accessory. |
| Rd hợp lệ nhưng đã có VBUS ngoài | Veto phần cứng trước khi đóng. Ngưỡng sàng lọc tại đầu cáp 0,60 ±0,10 V, chưa chọn comparator hoặc dung sai. | Cận ngưỡng, thời gian đáp ứng, xả tụ dư và nguồn ngoài tồn tại liên tục. |
| Rd hợp lệ, VBUS đủ thấp | Chỉ cho phép đóng khi đủ điều kiện pack và limiter. Veto điện áp ngoài phải còn tác dụng đến thời điểm bắt đầu dẫn. | Dòng/điện lượng hai chiều nếu nguồn ngoài xuất hiện sát thời điểm đóng hoặc gần bằng rail boost. Dò dòng ngược đơn lẻ có vùng mù khi hai nguồn gần bằng áp. |
| Detach, short, nguồn lỗi | Ngắt nguồn, chỉ xả khi chứng minh có thể giới hạn dòng từ nguồn bên ngoài. Latch-off khi lỗi theo phân bổ. | Giữ bias lúc xả, cận đỉnh dòng và năng lượng quá độ, thời gian/điện áp theo bản Type-C áp dụng. |

Sàng lọc linh kiện:

- TPS25810 có attach và switch tích hợp. Cận 3 µA chỉ đo dòng ra IN1 khi VOUT = 6,5 V, VIN1 = VEN = 0 V, −40…85 °C. Chế độ dòng thấp vẫn có ngưỡng short 1,58–1,82 A. Giữ làm phương án tham chiếu, chưa đủ để thay lớp chặn độc lập. [TI TPS25810 Rev. C, §6.5](https://www.ti.com/lit/ds/symlink/tps25810.pdf)
- TUSB320LAI có chế độ DFP nhưng bảng trạng thái ghi Rd khi mất bias hoặc shutdown. Đường CC cần phần tử mặc định hở nếu tiếp tục với IC này. TMUX1511 chỉ có bảo vệ mất nguồn tới 3,6 V trên đường tín hiệu, nên thiếu cận nếu kịch bản lỗi đưa mức VBUS 5 V sang CC. STUSB1700 có kiểm vSafe0V trong state machine và điều khiển switch ngoài. Datasheet còn ghi preliminary, cần xác minh nguồn hàng và cận mất bias/xả trước khi dùng. [TI TUSB320LAI Rev. D, §7.3](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf), [TI TMUX1511 Rev. B, §7.3.4](https://www.ti.com/lit/ds/symlink/tmux1511.pdf), [ST STUSB1700 Rev. 2, §5.1.18](https://www.st.com/resource/en/datasheet/stusb1700.pdf)
- TPS2553-1 tại 43,2 kΩ có cận hạn dòng tĩnh 544,3–673,1 mA theo bảng hãng. Ngưỡng phát hiện đảo áp 95–190 mV và trễ tắt 3–7 ms ở VIN = 5 V. Dòng short đáp ứng 2 µs TYP. Không dùng cận hạn dòng thuận để suy cận dòng ngược, và không nhận thời gian TYP làm cận trước khi ngắt. [TI TPS255x Rev. F, §7.5 và bảng 2](https://www.ti.com/lit/ds/symlink/tps2553-1.pdf)

Phân bổ xả 1,05 kΩ MAX, 100 µF MAX và bơm lại 20 µA cho 204,82 ms từ 5,5 xuống 0,8 V theo mô hình RC. Phải kiểm tụ thấy được ở đầu cáp khi unattached riêng. Dòng do nguồn ngoài cấp vào nhánh xả cần giới hạn riêng theo điện trở MIN, thời gian bật tối đa và trạng thái mất bias. [USB-IF Type-C Release 2.5](https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25)

## C8 · Ngân sách dòng và sụt áp

Giữ nhánh USB Default 0,5 A làm mốc tính công suất. Cần đối chiếu đúng loại nguồn, trạng thái USB và hành vi B01 trước khi coi mức này là đủ. B01 chưa có trace attach, boot, radio. Chưa chốt quảng bá 1,5 A hoặc 3 A.

| Hiệu suất giả định | I vào boost ở 5,253 V / 0,6731 A và VIN 3,00 V | R tối đa từ cực pack tới boost với 150 mV sụt |
|---|---:|---:|
| 75% | 1,571 A | 95,5 mΩ |
| 80% | 1,473 A | 101,8 mΩ |
| 85% | 1,387 A | 108,2 mΩ |

Ở tải VBUS 0,5 A và hiệu suất 85%, dòng vào boost khoảng 1,030 A. Ba dòng của bảng là độ nhạy theo hiệu suất và ngưỡng limiter, chưa gồm dòng phụ, đỉnh ngắn mạch hoặc bảo đảm ở 3,00 V. Cần cận cho đường holder/PTC/chống ngược cực/công tắc/dây, gồm nhiệt và lão hóa. Ở phía cáp, 4,947 V sau boost trừ mục tiêu 4,75 V cho 197 mV tại 0,5 A, tương đương 394 mΩ nếu quy về trở. Tính riêng ripple, quá độ và các cận tại đúng mặt chuẩn. [TI TPS61023 Rev. B, §6.5 và §7.3](https://www.ti.com/lit/ds/symlink/tps61023.pdf)

E91 công bố nội trở danh định 150–300 mΩ khi mới. NH15-2000 cho 30 mΩ khi sạc đầy và 40 mΩ ở nửa xả, dung sai nêu ±20% với điều kiện thử của hãng. Các số không cùng phương pháp và không làm cận DC toàn vòng. Nhánh alkaline có thể ngắt sớm hơn dưới tải. Cả hai cần giới hạn sụt áp tại dòng làm việc, điều kiện nhiệt và cutoff/restart. [Energizer E91](https://data.energizer.com/pdfs/E91_Max_NA.pdf), [Energizer NH15-2000](https://data.energizer.com/pdfs/nh15-2000gl1220.pdf)

## C9 · UVLO tĩnh, cell yếu và phục hồi

Ứng viên TPS3760 ngưỡng 0,8 V có VIT MIN/MAX 0,792/0,808 V. Phân bổ cầu chia 30,3 kΩ / 10,0 kΩ, ±0,1% mỗi nhánh gồm các sai số được phân bổ và ±150 nA tổng sai số SENSE. Công thức là VIT × (1 + Rtrên/Rdưới) ± Ierr × Rtrên. Tính tại corner cho **3,18242–3,26569 V**. Còn 32,42 mV phía dưới và 34,31 mV phía trên so với cửa sổ 3,15–3,30 V. Đo Kelvin cả hai cực pack trước sụt đường công suất. Ở độ dốc minh họa 50 mV/ms, 32,42 mV tương đương 648 µs trước khi tính sai số khác. Cận 17 µs của IC chỉ áp dụng ở overdrive 20% với CTS hở, không dùng cho đường sụt chậm gần ngưỡng. Cần giới hạn bước sụt, thời gian ngắt tại mức overdrive thực và mặc định OFF khi bias xuống ngoài điều kiện hãng. [TI TPS3760 Rev. A, §7.5–7.6](https://www.ti.com/lit/ds/symlink/tps3760.pdf)

Giữ UVLO tổng pack. Ưu tiên khảo sát bổ sung giám sát từng cell với holder có hai điểm tap, vì 1,60 + 1,60 − 0,02 = 3,18 V vẫn có thể vượt ngưỡng thấp 3,15 V dù một cell đã đảo áp. Kênh giám sát cần đo chênh giữa hai đầu từng cell và kiểm tap hở, chạm, lắp ngược và sai lệch common-mode. Khi thiết kế bias phát hiện hở tap, tap hở phải cưỡng bức ít nhất một kênh dưới ngưỡng. Điện trở giới hạn dòng đặt ở phía đầu tap của holder để lỗi dây sau điểm đó không trực tiếp nối tắt cell. Chưa có holder/threshold/cận đáp ứng hoặc bằng chứng lỗi đơn, và chưa chọn linh kiện.

Phân bổ một lần tự phục hồi có tải rồi giữ OFF nếu lần thử thất bại, với trạng thái đếm tồn tại qua brownout. So sánh với nhánh chứng minh envelope pack trong điều kiện tải/hóa học xác định. Cần tách tiêu chí cell yếu khỏi tiêu chí chống bật lặp. Ca 3,45 V không tải trừ 1,24 A × 0,30 Ω còn 3,078 V, nên tăng trễ đơn thuần vẫn có thể lặp.

## C12 · Phép đo và điều kiện gửi review đóng cổng

- Mục UVLO kế thừa được sửa bỏ PCM Jauch. Bench phải kiểm attach/boot/flash, UVLO, nhiệt, ADC và clone theo D10, có người đo, thời điểm và tiêu chí đạt. Test cắm nhầm trên cụm chỉ chạy sau khi đã khép phân tích đường dòng và có quyền thử.
- Dùng các cận có điều kiện trong hồ sơ, không suy toàn đường từ cận IC. Còn thiếu bằng chứng về I/Q hai chiều và xả khi mất bias, khả năng dòng/đường áp của 3 AA, giới hạn cell yếu/retry và định mức nhiệt/ngắn mạch. Dự toán dưới 1 triệu cho cả bộ vẫn TBD.
- Bốn cổng schematic tiếp tục OPEN. Gửi snapshot này để phản biện phương án, chưa xin kết luận PASS hoặc duyệt hash.
