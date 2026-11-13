# EVT0 r13 · Kết quả rà soát và đầu việc đóng cổng

Box 08 trả `changes_requested` trên cấu hình SHA-256 `a4fc54f7772f96023fe65c3afda2def59230d467b5418cb8a6adc98c6e7ed631`. Box xác nhận cả ba hash trong [packet](EVT0-R13-REVIEW-PACKET.md). Bốn cổng schematic vẫn `OPEN`. Giữ snapshot r13 đã review để đối chiếu.

| Cổng | Việc đưa vào snapshot kế tiếp |
|---|---|
| D17-OFF-DESIGN · C1–C3 | Kiểm kê nhóm net header (VIN/EN NC, B01 3V3/GND, các phần tử thụ động và pad thử). Định lượng năng lượng dư, cận dòng ở OFF và khi có VBUS ngoài. |
| D17-ACTUATOR-PRODUCT · C4–C5 | Dùng danh mục khối và BOM dự kiến để xác nhận bỏ actuator. Chứng minh một cổng B01, hai chiều cắm cáp liền, trạng thái attach/detach và cắm nhầm nguồn khác. |
| D17-H3-CV-PROTECTION · C6–C9 | Xác nhận pin tháo rời và sạc ngoài. Khép giới hạn nguồn theo mức quảng bá Type-C, bảo vệ đảo cực, PTC, sự cố ngắn mạch, dòng ngược, UVLO tại cực pack và phục hồi. |
| MCU-RESET-VETO-RESOURCES · C10–C11 | Đếm chân ADC1/ngõ nút còn khả dụng theo evidence B01 và policy loại chân. Tính tải thụ động lớn nhất, gồm nút nhấn đồng thời. Chưa gán chân. |
| Chung · C12 | Tách cận MIN/MAX, giả định và TYP theo điều kiện áp dụng. Xóa tham chiếu PCM Jauch trong trường `UVLO.limits` khi lập snapshot kế tiếp. Giữ phép đo D10 đúng mốc. |

## Các trạng thái cần chứng minh ở đường VBUS

| Trạng thái | Điều kiện thiết kế cần chứng minh |
|---|---|
| Pack vắng, OFF hoặc bias sụp | Phần tử công suất mặc định ngắt; VBUS ngoài không kéo ngược pin hoặc cấp ngược mạch điều khiển qua CC, EN, ESD hay nhánh xả. |
| RUN, chưa attach hoặc cổng ngoài đã có VBUS | Khóa đóng công tắc ngay cả khi rail boost cao hơn VBUS ngoài. Phải đo VBUS phía đầu cáp trước khi cấp và phân biệt điện áp đang có với điện áp tụ dư. |
| RUN, Rd hợp lệ, VBUS chưa có nguồn ngoài | Giới hạn dòng/inrush của sink; đối chiếu dòng quảng bá với nguồn, dây, đỉnh tải và cận áp tại đầu cáp. |
| Rút cáp, nguồn ngoài xuất hiện trong khi bật hoặc switch dính | Xét chiều dòng, năng lượng/điện lượng trước khi ngắt, nhánh xả bị nguồn ngoài duy trì, và cơ chế bảo vệ còn tác dụng nếu switch dính. |

Chặn ngược chủ động như TPS25947 có thể xử lý OUT cao hơn IN trong miền datasheet. Khi IN cao hơn VBUS ngoài, vẫn cần phát hiện VBUS phía cáp và khóa điều khiển. TUSB320LAI có trạng thái DFP, nhưng chân VBUS_DET của nó không thay logic phát hiện điện áp ngoài cho cấu hình Source-only. Đây là một nhánh so sánh với TPS25810, đang được Box 02 rà, chưa chốt MPN. [TI TPS25947 Rev. C, §7.3.7](https://www.ti.com/lit/ds/symlink/tps25947.pdf), [TI TUSB320LAI Rev. D, §7.2.5](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf)

Tại hiệu suất minh họa 85%, tải 0,5 / 0,6 / 1,5 A ở VBUS 5,253 V và đầu vào boost 3,0 V tương ứng khoảng 1,03 / 1,24 / 3,09 A ở đầu vào boost. Chưa tính tải phụ hay sai số. UVLO tại đầu đo còn biên 3,11 mV phía thấp và 5,27 mV phía cao. Cần phân bổ sai số Kelvin/ground và nguồn bias trong phạm vi đó hoặc chọn thiết kế có biên tĩnh rộng hơn. Ngưỡng tổng áp không phát hiện được mọi ca đảo áp một cell và trễ phục hồi không bảo đảm hết vòng lặp khi pack sụt áp.

## Kiểm sơ bộ tài nguyên B01

- Ảnh mẫu ghi bốn nhãn phù hợp bốn ngõ ADC1 input-only theo bảng 2-1 của Espressif. Sau khi bỏ các chân strap, UART0 và GPIO16/17 có điều kiện, còn 13 nhãn ngõ I/O hai chiều dự kiến. Nhu cầu tám ngõ nút nằm trong pool, kể cả khi để GPIO4 dự phòng. Kết quả chỉ là đếm nhãn và đối chiếu tài liệu SoC, chưa gán chân hoặc đo continuity clone. [Ảnh và bảng nhãn B01](../../../hardware/evidence/esp32-devkit-v1-type-c-sample.md), [Espressif ESP32 v5.32, bảng 2-1](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- Một phân bổ tải thụ động để review là bốn biến trở tổng trở ≥9 kΩ mỗi trục và tám pull-up rời ≥9,9 kΩ mỗi nút. Tại 3,6 V giả định, tất cả nút nhấn và không bật thêm pull-up nội, riêng dòng qua các phần tử trên ≤4,51 mA. Còn phải chọn module thụ động có cận trở phù hợp, tính rò/chuyển tiếp, kiểm cửa sổ đo ADC, ngưỡng nút và khả năng cấp dòng thực tế của rail clone. Phân bổ này không chứng minh B01 bảo đảm cấp 20 mA.

## Kết quả sàng lọc từ Box 02

- Tách phát hiện CC, quyền đóng VBUS và giới hạn dòng. So sánh hai tầng ngắt nối tiếp với kiểm VBUS phía đầu cáp trước khi bật, giới hạn dòng riêng và xả có điều kiện. Datasheet TUSB320LAI §7.3 cho thấy IC có thể đặt Rd khi mất nguồn hoặc shutdown, kể cả cấu hình DFP. Vì vậy phương án này cần xử lý cả đường CC khi mất bias. [TI TUSB320LAI Rev. D](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf)
- Chỉ sàng lọc ngân sách USB Default ở 0,5 A. Với cận hạn dòng 0,6731 A đang khảo sát và giả định 85%, HQ tính lại dòng vào boost khoảng 1,387 A, tương ứng khoảng 108 mΩ ngân sách đường vào nếu còn 150 mV sụt áp. Phương án xả có điều kiện với R tối đa 1,05 kΩ, C tối đa 100 µF và dòng bơm lại 20 µA cho khoảng 205 ms từ 5,5 xuống 0,8 V theo mô hình RC. Chưa có cận duy trì xả khi mất bias, cận đỉnh dòng, hay điện lượng trong cửa sổ hai nguồn cùng xuất hiện. Timing và mức quảng bá cần kiểm theo USB-IF Release 2.5. [USB-IF Release 2.5](https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25)
- Box 02 đề xuất khảo sát một lần tự phục hồi có tải rồi khóa nếu thất bại. Bộ đếm phải tồn tại qua lần sụt áp đó. Việc này xử lý bật lặp, còn ca một cell đảo áp cần bằng chứng riêng. Hai lựa chọn đang mở là giám sát từng cell hoặc chứng minh envelope của pack với cả hai hóa học và điều kiện sử dụng đã chốt. Chưa chọn.

B1 vẫn `waiting` theo queue. Trước khi thay cấu hình tham chiếu của B1 cần khép bằng chứng và review, tích hợp baseline validator cho revision sẽ dispatch, đối chiếu phụ thuộc, rồi mới trình Founder duyệt hash và lease. Validator queue exit 0, test 61/61, preflight B1 exit 1 và `dispatch_eligible: false`.
