# MoBot EVT0 · Kiểm khả năng cấp USB-C 1,5 A từ 3 AA

Founder chọn tiếp tục phương án 3 AA cho B1. Phạm vi vẫn là 3 AA tháo rời, alkaline hoặc NiMH theo F1–F5, nguồn vào B01 qua USB-C và header thụ động. Hồ sơ này đánh giá nhánh USB-C 1,5 A để xử lý finding Default 500 mA. [Hồ sơ Box 08 r14](EVT0-R14-REVIEW-PACKET.md)

## Phân bổ nguồn

Ứng viên tính toán đặt boost **5,20 V ±2% DC**, tức 5,096–5,304 V. Đây là phân bổ toàn rail, phải tính feedback, line/load và chế độ hoạt động. Ở đầu cáp, với mục tiêu 4,75 V và tải 1,5 A, còn 346 mV hay 231 mΩ cho toàn đường VBUS và GND. Ripple và quá độ còn phải trừ khỏi phần này. Ứng viên TPS25810 ở quảng bá 1,5 A có giới hạn short 1,58–1,82 A và RDS(on) MAX 55 mΩ theo điều kiện bảng hãng. Phần cấp dòng bình thường và trạng thái tải lỗi có ngân sách riêng. Cận 1,82 A không mô tả đỉnh trước khi giới hạn hoặc dòng ngược. [TI TPS25810 Rev. C §6.5](https://www.ti.com/lit/ds/symlink/tps25810.pdf)

Dùng VIN boost thấp nhất 2,85 V cho sàng lọc, pack 3,15 V tại cực pin và 50 mA phân bổ phụ ở đầu vào. Công thức là `I_pack = 5.304 × I_VBUS / (2.85 × η) + 0.05`. Cận trở từ cực pin tới boost là `(3.15 − 2.85) / I_pack`. Tính riêng nhánh lỗi 1,82 A ở điện áp đầy đủ để có phân bổ cho mức bắt đầu hạn dòng, không suy năng lượng short từ điểm này.

| Tải VBUS | Hiệu suất giả định | Dòng pack tính được | Trở đường vào tối đa |
|---|---:|---:|---:|
| 1,50 A | 85% | 3,334 A | 90,0 mΩ |
| 1,50 A | 75% | 3,772 A | 79,5 mΩ |
| 1,82 A | 85% | 4,035 A | 74,4 mΩ |
| 1,82 A | 75% | 4,566 A | 65,7 mΩ |

Hiệu suất 75–85% là độ nhạy, chưa có cận nhà sản xuất tại 2,85 V. Ngưỡng 3,15 V dùng để phân bổ sụt áp mạch, khác với điều kiện để pack tiếp tục RUN khi UVLO thật có thể cắt ở 3,26569 V tại đầu đo. [Cận UVLO r14](../../../hardware/mobot-v2-handset-r14-closure.md)

Ở tải 1,5 A, công suất tại rail boost 5,304 V là 7,956 W. Tổn hao tương ứng khoảng 1,40–2,65 W với hiệu suất 85–75%, trước tổn hao trên holder, công tắc, PTC và VBUS. Cần chứng minh nhiệt trong vỏ tay cầm với đường đồng và môi trường dự kiến. 

## Các linh kiện đủ để sàng lọc

| Khối | Kết quả |
|---|---|
| Boost | TPS611781, SLVSD80E Rev. E, VIN 2,7–20 V, VOUT 4,5–20 V, có điều khiển PFET ngoài để tách tải. Bảng nêu giới hạn đỉnh 5,7–8,7 A tại R_LIMIT = 80,6 kΩ và điều kiện thử §7.5. Không suy khả năng 1,5 A đầu ra ở 2,85 V từ cận đỉnh. Cần chọn cuộn cảm, xác minh bias, hiệu suất, khởi động, nhiệt và khoảng cách tới giới hạn. TPS61088 giữ làm đối chứng, TI dùng tầng ngắt ngoài cho short và true shutdown trong PMP9779. [TI TPS61178x Rev. E](https://www.ti.com/lit/ds/symlink/tps61178.pdf), [TI PMP9779](https://www.ti.com/tool/PMP9779) |
| Công tắc | E-Switch Series 100 tiếp điểm bạc có định mức 5 A tại 28 VDC với tải thuần trở, trở tiếp điểm MAX 10 mΩ theo tài liệu hãng. Chưa có cận cho inrush của boost trong cấu hình này. [E-Switch Series 100](https://www.e-switch.com/wp-content/uploads/2024/05/100-1.pdf) |
| PTC | 16R500G giữ 3,6 A ở 60 °C, thấp hơn 3,772 A trong kịch bản tải định mức. 16R700G giữ 5,0 A ở 60 °C và có R1max 20 mΩ tại 20 °C theo định nghĩa hãng. Chỉ còn 35,7 mΩ cho holder, chống ngược cực, dây và PCB ở dòng 4,566 A nếu dùng hai mức 20 + 10 mΩ. Cần R nóng và lão hóa. PTC 16R700G có Itrip danh định 11,9 A ở 20 °C, do đó phải tính cắt lỗi điện tử riêng và năng lượng trước khi ngắt. [Littelfuse 16R, bảng điện và derating](https://www.littelfuse.com/assetdocs/resettable-ptcs-16r-datasheet?assetguid=4a2258b4-a74c-45a9-b080-2b6415091415) |
| Holder | Ba Keystone 2460 tiếp tục là ứng viên bố trí hai tap. Catalog có hình học và vật liệu nhưng chưa có cận điện trở nóng, lão hóa hoặc định mức ở gần 4 A cho cụm này. Phân bổ còn lại 35,7 mΩ cho nhiều phần tử nghĩa là mỗi trong sáu tiếp điểm phải dưới 5,95 mΩ ngay cả khi bỏ qua mọi phần tử khác. Chưa dùng con số này làm định mức holder. [Keystone catalog, tr. 32](https://beta.keyelco.com/userAssets/file/M70p23-33.pdf) |
| Source USB-C | TPS25810 có mức quảng bá 1,5 A và ngắt theo CC. Ưu tiên làm ứng viên công suất do đã có cận hạn dòng và RDS(on). Giữ phép kiểm độc lập VBUS phía đầu cáp trước khi đóng và xác minh đường OFF thứ hai. Điều khiển PFET của boost không thay được bảo vệ phía đầu cáp. [TI TPS25810 Rev. C §6.5–6.6](https://www.ti.com/lit/ds/symlink/tps25810.pdf) |

## Hai hóa học và điều kiện cho phép quảng bá

Với pack đang tải 3,772 A và cần giữ cao hơn 3,26569 V, ở OCV minh họa 4,80 V thì ngân sách nội trở động toàn pack là 407 mΩ. Ở OCV 3,60 V thì còn 88,6 mΩ. Nội trở ở đây là độ sụt trên khoảng thời gian tải, không thể lấy trực tiếp trị số AC hoặc danh định của một cell.

- **Alkaline.** E91 công bố nội trở danh định khi mới 150–300 mΩ/cell. Mô hình minh họa với 3 × 150 mΩ và OCV 4,8 V cho 3,10 V tại 3,772 A, thấp hơn ngưỡng cần giữ. Ngay cả phép sàng lọc tại góc thấp của nội trở danh định cũng chưa hỗ trợ tuyên bố rằng E91 sẽ cấp 1,5 A VBUS ở điều kiện xấu. Đây là phản ví dụ của mô hình, chưa phải phép đo E91. Chưa tìm thấy cận xả bảo đảm cho alkaline phù hợp các điều kiện này. [Energizer E91](https://data.energizer.com/pdfs/E91_Max_NA.pdf)
- **NiMH.** NH15-2000 có đường xả điển hình 4 A ở 21 °C, ưu tiên làm mẫu đối chiếu trên giấy. Nội trở nêu 30 mΩ khi sạc đầy và 40 mΩ khi xả nửa là số tham chiếu theo điều kiện hãng. FDK HR-3UTG có đường xả điển hình 2 A ở một số nhiệt độ và trở kháng khoảng 25 mΩ tại 1 kHz, chưa đủ để thay số đo sụt áp DC ở gần 4 A. Chưa có bảo đảm ở nhiệt độ, trạng thái sạc và lão hóa của EVT0. Nhánh này còn cần cặp cell/sạc ngoài đúng model và profile cắt cell yếu. [Energizer NH15-2000](https://data.energizer.com/pdfs/nh15-2000gl1220.pdf), [FDK HR-3UTG](https://www.fdk.com/product_e/nimh_e/tech_info/HR-3UTG_LongLife.pdf)

Phương án để tiếp tục nghiên cứu với cả hai hóa học là **chỉ công bố 1,5 A khi nguồn đủ điều kiện dưới tải**. Kiểm pack và từng cell trước khi đưa Rp ra cáp, dùng tải nội tương đương tải quảng bá và một khoảng dự phòng đã định mức. Lặp giám sát khi RUN, cắt có kiểm soát trước khi mất khả năng cấp mức đã quảng bá. Một lần thử đủ tải chỉ chứng minh tại thời điểm đó. Cần cận thời gian đủ giữ được mức nguồn, nhiệt tải thử, lỗi tap hở/chạm, cận UVLO gần ngưỡng, giữ trạng thái retry qua brownout, và phương pháp công bố cho pin đã xuống dưới điều kiện. Hướng này chưa chứng minh alkaline có thời lượng sử dụng chấp nhận được. [USB-IF Type-C Release 2.5, §4.4.2 và §4.6.2.1](https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25)

## Trước khi có thể đóng cổng

1. **Nguồn 3 AA.** Có cận tải liên tục và bước tải cho đúng cell, holder, tiếp điểm, PCB, bảo vệ và boost, gồm khoảng nhiệt độ và lão hóa. Không tính TYP thành MAX. Chốt cách quảng bá và ngắt khi pack không đủ điều kiện.
2. **Cắm nhầm nguồn.** Tính dòng đỉnh, dòng duy trì và điện tích hai chiều cho ca nguồn ngoài đến sát thời điểm bật, nguồn sụp và lỗi một tầng dính. Chặn ngược theo chênh áp chỉ giải quyết một số trạng thái. Cần cáp và cận các đường CC/sense/xả đúng đầu cắm.
3. **B01 và giá.** Cần đúng biến thể B01 hoặc tài liệu được liên kết với PCBA đó. Listing UNIT Electronics bán tùy chọn CH340C nhưng sơ đồ nó liên kết là ESP32 Core Board V2 dùng Micro-USB, không chứng minh CC/VBUS của bo mẫu. Tải clone, kích thước, định mức thực và tổng giá vẫn TBD. [Listing UNIT Electronics](https://uelectronics.net/producto/esp32-devkit-v1-30-pines-usb-c-microusb/), [Sơ đồ được liên kết](https://dl.espressif.com/dl/schematics/ESP32-Core-Board-V2_sch.pdf)

Giữ đề xuất r14 đã review. Đây là tính toán và sàng lọc, chưa là cấu hình sẵn sàng duyệt hash. Phép đo `NOT_RUN`.

Kiểm queue ngày 11/11/2026. `node ../docs/agents/validate.mjs` exit 0, 61 task, 143 capability, `errors=[]`. Preflight `MM-HW-MOBOT-REMOTE-KICAD-001` exit 1, `dispatch_eligible: false`. B1 `waiting`, chưa có lease. SHA-256 r14 khớp registry và trạng thái vẫn `proposed`.
