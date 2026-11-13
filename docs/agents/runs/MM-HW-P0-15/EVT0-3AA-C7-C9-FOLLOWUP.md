# MoBot EVT0 · Cận nguồn 3 AA trước B1

Hồ sơ bổ sung cho [bảng sàng lọc 2,70 V](EVT0-3AA-NEXT-CORNERS.md) và [review r14](EVT0-R14-REVIEW-PACKET.md). Giữ 3 AA tháo rời, B01 nhận nguồn qua USB-C. Các kết quả dưới đây là tính toán trên giấy. C7–C9 còn OPEN và phép đo `NOT_RUN`.

## C7 · Cắm nhầm vào nguồn USB-C

**TPS259470LRPWR** là ứng viên tầng ngắt bổ sung phía 5 V, bên cạnh tầng điều khiển attach USB-C. TPS25947 Rev. C §6.5 cho ngưỡng phát hiện nhanh khi OUT cao hơn IN **22,3–36,45 mV**. Điều kiện biên độ của phép thử thời gian là trên **47,39 mV** nếu dùng ngưỡng cao nhất. Ca chênh 90 mV vượt điều kiện biên độ đó. Số 1 µs trong §6.6 là điển hình, chưa có cận thời gian MAX cho ca EVT0. Cơ chế ORing tuyến tính xử lý chênh nhỏ theo mô tả §7.3.4. Dòng rò khi mất nguồn và dòng tại trạng thái reverse blocking vẫn cần cận theo đúng điều kiện của EVT0. [TI TPS25947 Rev. C, tr. 9–11 và 35–37](https://www.ti.com/lit/ds/symlink/tps25947.pdf), [TI TPS259470LRPWR](https://www.ti.com/product/TPS25947/part-details/TPS259470LRPWR)

Với 45 mΩ của TPS25947 theo điều kiện bảng và 55 mΩ của TPS25810, hai tầng dùng khoảng 150 mV ở 1,5 A. Từ rail thấp 5,096 V đến 4,75 V tại đầu cáp, còn khoảng **196 mV, tương đương 130,7 mΩ** cho các phần tử nối tiếp còn lại, dây và đường hồi, trước khi trừ ripple và quá độ. Phải đối chiếu điều kiện của từng IC và tính riêng trường hợp hồi phục sau RCB. [TI TPS25947, §6.5](https://www.ti.com/lit/ds/symlink/tps25947.pdf), [TI TPS25810, §6.5](https://www.ti.com/lit/ds/symlink/tps25810.pdf)

| Ca phải chứng minh | Điều kiện còn thiếu |
|---|---|
| Nguồn ngoài cao hơn 90 mV hoặc tăng chậm | Dòng đỉnh, thời gian và tích phân dòng về cực pin. Kiểm cả vùng dưới ngưỡng fast comparator, tụ ở các trạng thái nạp và đường CC/sense/ESD/xả. |
| Rail boost cao hơn nguồn ngoài | ORing có thể cho dẫn thuận. Phải giữ VBUS ngắt nếu chưa có attach hợp lệ hoặc cáp đã có áp, kể cả khi rail boost cao hơn. Kiểm ca nguồn ngoài xuất hiện giữa lúc kiểm VBUS và lúc đóng tầng công suất. |
| Mất bias, pack vắng, một tầng dính | Chứng minh tầng còn lại có điều kiện ngắt độc lập trong từng ca, không phụ thuộc vào chung một tín hiệu cho phép có thể mắc HIGH. Chốt cận rò nóng, Ipeak và điện tích hai chiều cho từng trạng thái. |

## C8 · Shunt ít trôi hơn và đường cấp tải

Sàng lọc Vishay **WSLS2512, 15 mΩ, mã D/G** (chuỗi đặt hàng suy ra `WSLS2512R0150DGEA`, tình trạng bán chưa xác minh). Datasheet 30123 cho ±0,5% ban đầu, ±75 ppm/°C tính cả chân và giới hạn đổi trở ±0,25% sau thử load life 2.000 giờ ở 70 °C theo chu kỳ hãng. Tính minh họa với phần tử lệch tối đa 45 °C so với 25 °C và cộng thêm 0,30% dự phòng cho đường sense/lắp ráp. Tổng là **±1,3875%**, trong khi mô hình với 15 mΩ/3,00 kΩ cho phép tối đa **±1,729%** nếu cần overdrive tối thiểu 1 mV tại 4,2 A và tải giả định 3,733 A. ±0,30% là phân bổ chưa kiểm. Các thử nghiệm hàn, ẩm, va đập và tuổi thọ sử dụng còn cần giới hạn riêng. [Vishay 30123, Rev. 10-Sep-2024, tr. 1–2](https://www.vishay.com/docs/30123/wsls2512.pdf), [TI INA300 Rev. C](https://www.ti.com/lit/ds/symlink/ina300.pdf)

Với phân bổ đó, cửa sổ tĩnh là **3,820–4,118 A**, còn khoảng **86 mA** trên tải giả định. Overdrive tại 4,2 A là **1,215 mV** ở corner cắt muộn. Ngân sách khay và đồng là **56,07 mΩ** sau shunt, PTC, switch và PFET theo phân bổ trước. Mức dòng liên tục 4,2 A của VARTA có điều kiện xả đến 0,8 V/cell. Nó chưa xác lập giới hạn xung trong thời gian ngắt hoặc độ sụt của cell, khay và tiếp điểm khi đã dùng lâu. [VARTA 56706, tr. 1](https://docs.rs-online.com/20d6/A700000015406392.pdf)

Cần load-line của đúng model/lô pin và khay ở các điểm sử dụng, hiệu suất tối thiểu của boost ở đầu vào 2,70 V và thời gian cắt quá dòng toàn đường. Nhánh alkaline vẫn TBD. Mốc 500 mA cũng cần chứng minh chế độ Default của đúng B01 và giới hạn dòng khi attach/boot. Không dùng mức này làm đường tắt để đổi cấu hình. [USB-IF, USB Type-C Functional Test Specification, TD.4.10.1](https://www.usb.org/sites/default/files/USB%20Type%20C%20Functional%20Test%20Specification%202021%2005%2020.pdf)

## C9 · Giám sát từng cell và mất bias

Đề xuất xét liên tục ba chênh áp giữa các tap liền kề và giữ veto phần cứng trên nguồn VBUS. Xét comparator TLV9034 với reference REF3312 và mạng vi sai có suy hao. Tính ngưỡng từ offset, common-mode, hệ số mạng, bias, rò và giới hạn tại điện áp nuôi thực. Datasheet TLV9034 Rev. H §5.11 cho offset tối đa ±2 mV toàn dải ở các mức nguồn thử, còn đáp ứng tại overdrive nhỏ cần chứng minh riêng. Cần định nghĩa mức veto mặc định và cách giữ veto khi comparator hoặc reference mất nguồn. [TI TLV9034 Rev. H, §5.11–5.12](https://www.ti.com/lit/ds/symlink/tlv9034.pdf), [TI REF3312](https://www.ti.com/tw/lit/gpn/ref3312)

Mô hình lý tưởng kiểm 9 ca ép một tap sense về mức tap khác và 3 ca hở được kéo về 0 V. Tất cả cho ít nhất một chênh áp dưới ngưỡng 0,95 V ở bộ mẫu. Mô hình giả định tap GND còn đúng, sense pull-down thực sự thắng dòng rò và nhánh lấy mẫu đã có điện trở cách ly. Chạm dây trước điện trở là ca khác, có thể nối tắt cell. Cần kiểm riêng tap GND hở, điểm hở chung, chạm qua điện trở hữu hạn, trễ RC và đường hồi từ nguồn logic.

Tại cận ngắt thấp 0,90 V, nếu dự trù 20 mV cho bước sụt và sụt tiếp 50 mV/ms, toàn đường detect đến ngắt dòng chỉ có **1,60 ms** để giữ trên 0,80 V. Hai giá trị sụt là phân bổ minh họa. Thử lại chỉ khi bộ nhớ lỗi chứng minh còn lượt, hoàn tất thử tải nội rồi mới cấp quyền. Nếu brownout làm mất thông tin, khởi tạo về khóa và đòi lần bật chủ ý mới. Cần kiểm nguồn logic không tự xem reset do tải là thao tác bật mới.

## Bằng chứng trước lần review tiếp theo

- C7 cần cận dòng/điện tích cho cả hai chiều, kể cả mất bias và một tầng dính.
- C8 cần đủ cận của tổ hợp cell/khay/boost, shunt sau lắp và nhiệt, rồi mới xác định mức dòng quảng bá.
- C9 cần định lượng điện áp thực khi tap lỗi, trễ từ comparator tới ngắt và cách giữ khóa qua brownout.

Tái lập số liệu và mô hình tap bằng `node docs/agents/runs/MM-HW-P0-15/evt0-3aa-power-corners.mjs`. Hồ sơ chưa đề nghị đổi trạng thái cổng hay thay bytes cấu hình r14. 
