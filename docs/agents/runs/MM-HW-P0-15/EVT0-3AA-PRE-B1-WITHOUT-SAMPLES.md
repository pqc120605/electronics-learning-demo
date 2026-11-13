# EVT0 3 AA · Hồ sơ trước B1 khi chưa có mẫu

Founder cho biết hiện chưa có phần cứng để đo. Dùng [D10](../../../hardware/mobot-v2-founder-decision-q1-q8.md#d10--chấp-nhận-rủi-ro-có-giới-hạn) và [r14](../../../mission-control/hardware-config-mobot-v2-typec-r14-handset.json) để xác định việc có thể làm bằng hồ sơ. Mọi kết quả bench tiếp tục là `NOT_RUN`.

| Hạng mục | Việc trước B1 bằng hồ sơ | Xác minh mẫu khi có phần cứng và quyền tương ứng |
|---|---|---|
| C7, cắm nhầm nguồn | Chứng minh cận dòng và điện tích cả hai chiều từ đặc tính MAX, phân tích đường cấp vòng, ca nguồn đến lúc bật, mất bias và từng tầng ngắt bị kẹt. Với phần tử chỉ có trễ TYP, cần thêm bằng chứng có cận hoặc đổi ứng viên. | Kiểm trace dòng/áp theo các cận đã review. |
| C8, cấp tải | Có đúng model pin, tiếp điểm và boost cùng cận điện áp, dòng, nhiệt và hiệu suất đủ để suy ra một miền tải được hỗ trợ. Khóa điều kiện cho phép quảng bá dòng USB. | Đo attach/boot/radio, sụt áp và nhiệt trên tổ hợp thật. |
| C9, cell yếu | Chốt ngưỡng từng cell, cận detect → ngắt, mức mặc định khi mất bias và bằng chứng trạng thái khóa qua brownout. | Đo độ sụt động và xác nhận chỉ thử lại một lần theo thiết kế. |
| B01 và tích hợp | Đối chiếu sơ đồ theo revision, kiến trúc nguồn USB-C và ngân sách tải 3V3. Hồ sơ Ampnics là ứng viên tham chiếu, chưa truy được tới PCBA đang bán. | Đối chiếu kích thước và điện nội bộ clone, đo ADC, trace USB và nhiệt theo D10. |

## Nhánh giảm tải để so sánh

Với cùng phân bổ 5,304 V đầu ra boost, 2,70 V đầu vào, hiệu suất giả định 75% và tải phụ 50 mA, `I_pack = 5.304 × I_VBUS / (2.70 × 0.75) + 0.05`. Tải USB-C 1,50 A tương ứng **3,979 A** ở pack. Tải 0,50 A tương ứng **1,360 A**. Đây là độ nhạy theo tải, chưa phải định mức của bất kỳ bộ pin nào. Ở 1,50 A, con số 3,979 A đã vượt cận cắt sớm 3,820 A của ứng viên shunt đang xét, nên 75% ở 2,70 V không đáp ứng phép tính. Với cận cắt sớm đó, mức hiệu suất hòa biên là khoảng **78,17%** trước dự phòng. [Hồ sơ tính shunt và nguồn](EVT0-3AA-C7-C9-FOLLOWUP.md)

Chỉ xét 0,50 A làm nhánh thiết kế nếu tài liệu của đúng biến thể B01 chứng minh hành vi phù hợp với chế độ Default USB Power ở RUN, kể cả khi không có USB host, và có ngân sách dòng attach/boot/radio tương ứng. USB-IF có tiêu chí khác nhau cho thiết bị USB và sink không có vai trò thiết bị. Sơ đồ CH340C và hai điện trở Rd riêng lẻ chưa xác lập điều kiện này. [USB-IF, TD.4.10.1](https://www.usb.org/sites/default/files/USB%20Type%20C%20Functional%20Test%20Specification%202021%2005%2020.pdf), [USB Type-C Release 2.5](https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25)

Chưa có căn cứ chuyển cổng thiết kế sang D10 hoặc chọn mức dòng khác. Hướng hiện hành tiếp tục là 3 AA, ưu tiên rà tài liệu có cận bảo đảm cho mức 1,5 A. Nếu thiếu cận ở đúng cell/khay hoặc đúng B01, đưa phương án linh kiện/kiến trúc thay thế ra review với các điều kiện chưa chứng minh. Chỉ trình duyệt hash khi có đủ bằng chứng theo mốc và review độc lập.
