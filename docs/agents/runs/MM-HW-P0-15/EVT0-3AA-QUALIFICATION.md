# EVT0 3 AA · Ứng viên nguồn và tiêu chí xác minh B1

Giữ 3 AA tháo rời và nguồn B01 qua USB-C. Hồ sơ này bổ sung bằng chứng cho C7–C9 của r14. Định mức dưới đây dùng để sàng lọc trước review. Phép đo phần cứng `NOT_RUN`. [Ngân sách 1,5 A](EVT0-3AA-1P5A-ASSESSMENT.md), [kết quả Box 08 trên r14](EVT0-R14-REVIEW-PACKET.md)

## Cell, holder và boost

| Hạng mục | Căn cứ và giới hạn |
|---|---|
| **VARTA 56706 NiMH** | Datasheet kỹ thuật của VARTA, 23/08/2021, trang 1 ghi **4,2 A tải liên tục đến 0,8 V**, nội trở DC 45 mΩ khi sạc đầy, khuyến nghị xả 0–40 °C. Mức 4,2 A là giới hạn dòng cell. Nó không chứng minh giữ 1,09 V/cell dưới tải EVT0, vì điểm cuối của định mức là 0,8 V. Thử lô đúng mã và đối chiếu sheet hiện hành trước khóa BOM. [Datasheet kỹ thuật của VARTA do RS lưu](https://docs.rs-online.com/20d6/A700000015406392.pdf), [VARTA 56706](https://www.varta-ag.com/en/consumer/product-categories/accus/recharge-accu-power-aa-2100-mah) |
| **Energizer HR6-2400 NiMH** | Form EBC-889960EU, trang 1 có đường xả 4,8 A tại 21 °C. Đường này là TYP và tài liệu không bảo đảm sụt áp ở dải sản phẩm. Giữ làm đối chứng khi xây ma trận cell. Alkaline tiếp tục chờ ứng viên đủ cận cho mức tải 1,5 A. [Energizer HR6-2400](https://data.energizer.com/pdfs/hr6-2400_eu.pdf) |
| **Bulgin BX0035** | Catalog hãng ghi holder AA đơn 60,3 × 17,5 × 23,4 mm. RS mô tả chân PCB 5 A, chưa có cận R tiếp xúc và derating từ catalog đã đọc. Ba khay cạnh nhau chiếm 60,3 × 52,5 mm trước khoảng lắp. Giá RS Việt Nam tham chiếu 166.756 đ/khay và hết hàng khi truy cập, khoảng 500.269 đ cho ba khay. Dùng làm ứng viên kiểm định mức, chưa chốt BOM. Keystone 2460 vẫn là ứng viên chi phí thấp hơn với cận R và dòng chưa đủ. [Bulgin catalog](https://www.bulgin.com/products/media/bulgin/data/Battery_holders.pdf), [RS Việt Nam](https://www.rs-online.vn/p/pcb-mount-holder-for-single-aa-cell/) |
| **LTC1871-1** | Analog Devices có thiết kế tham chiếu boost **5 V/2 A ở VIN 2,5–3,3 V**, gần điểm làm việc EVT0 hơn sơ đồ 12 V của nhiều boost. Phương án dùng diode chỉnh lưu, tạo một lớp vật lý hạn chế cấp ngược từ rail boost vào cell. Phải tính rò nóng, tụ và các đường vòng. Khi ngừng switching, diode vẫn có thể dẫn từ pack sang phía ra. Giữ tầng OFF phía USB và ngắt lỗi đầu vào độc lập. Cần đối chiếu linh kiện còn bán, điều kiện VGS thấp, nhiệt, tính ổn định và rail 5,20 V đã phân bổ. Đây là ứng viên so với TPS611781, chưa chọn IC. [ADI LTC1871-1, ứng dụng trang 31](https://www.analog.com/media/en/technical-documentation/data-sheets/18711fb.pdf) |

Với 3 × 45 mΩ của VARTA và dòng 3,772 A trong mô hình sàng lọc, OCV cần khoảng **3,775 V** để đầu pack còn 3,26569 V. 45 mΩ không có dung sai theo nhiệt/lão hóa trong sheet. Kết quả chỉ định vị miền cần đo trên đường xả, chưa dự báo thời lượng RUN.

## Cắt dòng phía pack

Sàng lọc INA300, shunt Kelvin 10 mΩ ±1%, điện trở ngưỡng 2,00 kΩ ±0,1%, nguồn ILIMIT 19,85–20,15 µA và phân bổ sai số còn lại ±0,90 mV. Theo Box 08, bản đầu thiếu NAF 0,50 mV ở chế độ 10 µs. Công thức đã sửa là `Vtrip = ILIMIT × RLIMIT − 0,50 mV ± 0,90 mV`. Cần xác minh phân bổ sai số còn lại bao phủ offset, drift, PSRR, CMRR và sai số mạng. Cần cận giữ latch qua sụt bias, trễ ngắt thực tế và nhiệt/xung của shunt. [TI INA300 Rev. C, §6.5–6.6, §7.3.2 và §7.3.7](https://www.ti.com/lit/ds/symlink/ina300.pdf)

| Cận tính trên giấy | Giá trị |
|---|---:|
| Dòng pack cần cho 1,5 A VBUS ở cận thiết kế | 3,772 A |
| Cửa sổ cắt tĩnh | 3,788–4,115 A |
| Khoảng từ tải định mức đến cắt sớm nhất | 16,0 mA |
| Khoảng từ cắt muộn nhất tới giới hạn liên tục của 56706 | 84,8 mA |
| Hiệu suất tối thiểu để đạt 1,5 A trước khi cắt sớm | 74,68% |
| Ngân sách đường vào ở 4,115 A, sụt tối đa 300 mV | 72,90 mΩ |
| Còn lại cho holder và đường đồng sau shunt 10,1 mΩ, PTC 20 mΩ, switch 10 mΩ và PFET 8 mΩ | 24,80 mΩ |
| Overdrive tại 4,2 A ở corner cắt muộn | 0,84 mV, dưới điều kiện 1 mV của thông số trễ ALERT |

DMP2003UPS có RDS(on) MAX 4,0 mΩ ở VGS −2,5 V theo điều kiện bảng hãng. 8 mΩ trong bảng trên là phân bổ cho đúng điều kiện nóng và đường điều khiển, chưa được xác nhận. Chưa tìm thấy cận cho cả sáu tiếp điểm và đường đồng trong 24,80 mΩ. Chia đều trước khi tính đường đồng, mỗi tiếp điểm có khoảng 4,13 mΩ. [Diodes DMP2003UPS](https://www.diodes.com/datasheet/download/DMP2003UPS.pdf)

Khi ngưỡng pack tác động trước ngưỡng short cao nhất phía USB, thứ tự ngắt phải có cận riêng. Cửa sổ tĩnh trên không chứng minh dòng đỉnh hay năng lượng xung nằm trong định mức cell. Cần giới hạn khởi động mềm và proof dòng tối đa qua độ trễ detector, driver và switch. Thực hiện lại các phép tính bằng `node docs/agents/runs/MM-HW-P0-15/evt0-3aa-qualification.mjs`.

## Điều kiện lỗi và dữ liệu cần thu

| Ca | Chứng cứ cần để đóng |
|---|---|
| C7, hai nguồn gần bằng áp | Sàng lọc INA303A3 với shunt đo dòng có dấu và ngắt độc lập, thay việc chỉ dựa vào ngưỡng đảo áp của TPS2553-1. Với 10 mΩ, dòng ngược 0,45 A cho 4,5 mV trên shunt và 0,45 V tại gain 100. Phải có ngưỡng, sai số và thời gian tối đa tại overdrive thực, và cận riêng khi bias sụp. Nếu giả định ngắt trong 20 µs ở dòng không đổi, riêng nguồn duy trì truyền 9 µC. 20 µs là phân bổ thử, không phải cận datasheet toàn đường. Tính thêm điện tích từ tụ và dòng dưới ngưỡng hoặc nguồn ngoài duy trì. [TI INA303 Rev. C, §6.5 và §7](https://www.ti.com/lit/ds/symlink/ina303.pdf) |
| C7, một tầng dính hoặc mất nguồn | Xác định với từng tầng còn lại cận OFF ở trạng thái có nguồn ngoài và pack vắng. Phân tích độc lập CC, sense, ESD, diode và nhánh xả. Nếu lấy cận diode chỉnh lưu, phải có MAX rò ở nhiệt và cực tính, cùng bằng chứng không có đường song song về pin. |
| C8, 1,5 A VBUS | Xác định load-line cho đúng cell và holder tại đầu, giữa và cuối phần dung lượng sử dụng, ở các nhiệt độ áp dụng. Kiểm pin từng cell, VPACK, VIN boost, VBUS, dòng và nhiệt. Không công bố 1,5 A khi không đủ điều kiện. Mốc phân bổ ở đầu cáp ≥4,75 V, VIN ≥2,85 V, dòng hoạt động dưới cận cắt thấp và không vượt giới hạn nhiệt linh kiện. |
| C9, cell yếu và thử lại | Khi một cell sụt dưới ngưỡng đã định, ngắt trước giới hạn của cell ở độ dốc và bước tải đã review. Lỗi tap hở/chạm không được tạo trạng thái cho phép giả. Thử một lần có tải theo hồ sơ r14, rồi giữ OFF khi thử thất bại. Tính trường hợp reset mất bộ đếm. |

Ví dụ điện tích nạp một tụ 100 µF từ nguồn 5,50 V là 55,3 µC nếu tụ ban đầu ở 4,947 V theo r14, hoặc 40,4 µC nếu ban đầu ở 5,096 V theo phân bổ mới. Cần cận cho điện áp ban đầu, điện dung và đường dẫn thực. Đây là điện tích của tụ trong ví dụ, chưa phải điện tích về pin.

## Nguồn lưu cục bộ

Tải ngày 11/11/2026 và kiểm định dạng PDF trước khi lưu. Link ADI được đọc qua web, lần tải cục bộ quá thời gian.

| Tệp | Nguồn, phiên bản | SHA-256 |
|---|---|---|
| [varta-56706-technical.pdf](../../../research/downloads/evt0-3aa-2026-11-11/varta-56706-technical.pdf) | VARTA Consumer Batteries, *56706 Sealed rechargeable Ni-MH cylindrical cell*, 23/08/2021. [PDF](https://docs.rs-online.com/20d6/A700000015406392.pdf) | `db21c866d4f3804a772531b396ba3aa140306ebbed0f3ae0f4b7fc8bf07b0572` |
| [energizer-hr6-2400.pdf](../../../research/downloads/evt0-3aa-2026-11-11/energizer-hr6-2400.pdf) | Energizer, *Rechargeable AA-2400 (HR6)*, Form EBC-889960EU. [PDF](https://data.energizer.com/pdfs/hr6-2400_eu.pdf) | `a3f05ef5907d4264a763a8683039fbfcfb3af4b8a80a874b273c5ebcad431caa` |

Hồ sơ sàng lọc xác lập được một cửa sổ bảo vệ dòng tĩnh cho ứng viên NiMH. B1 còn thiếu cận trở/hiệu suất toàn đường, cận dòng/điện tích khi cắm nhầm và cơ chế bảo vệ cell yếu. Chưa có cơ sở cho PASS, khóa BOM hoặc duyệt cấu hình.

Box 08 trả `changes_requested` cho bản SHA-256 `57b752ebdc2ed7a5cc5ac68ca1936430b9af5db68fd5f1c342eb7163fac38bd2`. Bản hiện tại đã sửa NAF và ghi hai điều kiện nạp tụ. C7, C8 và C9 vẫn OPEN. Kết quả review gắn với bản trước khi sửa.
