# MoBot V2 · P0-02 · Bố trí, bó dây và khóa RUN

Hồ sơ Box 08 review gộp. Box 02 turn `01a1b222-4a2e-7cb1-9ab7-8daa4514350f`, Box 03 turn `01a1b222-5b7b-73a0-8135-e10170e77309`. Áp dụng nhánh tay cầm Type-C r8. Hai proposal và phạm vi D10 giữ nguyên.

## Bố trí và cận điện

- Stackup tham chiếu JLC04161H-3313A, 4 lớp, 1,6 mm danh nghĩa, đồng ngoài/trong 35/15,2 µm. Tín hiệu thường 0,15/0,15 mm. Via lỗ/pad 0,30/0,60 mm. Từ mép lỗ đến đồng khác net lớp trong tối thiểu 0,20 mm cho via và 0,30 mm cho PTH. Mép phay dự trù 0,30 mm. Rà mask theo màu, PTH theo dung sai lỗ hoàn thiện, và quy tắc riêng cho USB-C/DFN/QFN và pad nhiệt. [Stackup](https://jlcpcb.com/impedance) · [Năng lực fab](https://jlcpcb.com/capabilities/pcb-capabilities).
- Cỡ đường đồng ngoài để dự trù: pack **0,80 mm**, RUN 5 V **0,65 mm**. Với 25 mm đường đồng quy đổi và điện trở suất sàng lọc 0,0214 Ω·mm²/m, pack 0,977 A sụt khoảng 18,7 mV, RUN 0,60 A sụt khoảng 14,1 mV. HQ dùng 0,65 mm vì 0,60 mm vượt phân bổ 15 mV ở dòng sàng lọc. Cần kiểm riêng đường hồi, via/pad, nhiệt, chiều dài thực, RMS và dòng đỉnh vòng boost.
- Bó GH AWG 28 dùng cận sàng lọc 0,25 Ω/m ở 50 °C và 50 mΩ mỗi cặp tiếp xúc GH. Với chiều dài một chiều 100/150/200/300 mm, cận một dây kèm GH lần lượt là 75/87,5/100/125 mΩ. Còn đầu ghép phía B01, mối nối, cận lệch GND và dòng hồi. Dòng cấp RUN đi qua cáp USB riêng. [JST GH](https://www.jst-mfg.com/product/pdf/eng/eGH.pdf) · [Dây tham chiếu](https://www.tebaoflexcablegroup.com/product/ul-1061-ul-1028-ul-1032-pvc-switchgear-hook-up-wire/).

## Khóa nguồn và cách ly

Kiểm pull-down tại từng enable bằng tổng dòng nâng nút, điện trở cực đại và lệch GND so với VIL. Kiểm cả cận HIGH và ca mất đường hồi. PC cấp B01 không tự mở I/O hoặc JOY_VCC. Qua CHARGE, brownout hoặc lỗi sense, I/O phải cách ly trước khi rail đầu tiên rời vùng hợp lệ. Timing toàn tuyến và cận cấp ngược vẫn mở.

Box 02 đề xuất phương án RUN → OFF → PROGRAM. Cơ cấu giữ phích RUN, chỉ nhả sau khi xác nhận I/O đã ngắt, Source tắt và rail xả đạt. Phương án này chuyển bằng chứng sang thứ tự khóa điện và nhả phích. Vẫn cần kiểm trên đúng cụm, kể cả khả năng thao tác đi vòng và mất bias. Đây là ứng viên thay đổi Q2-A, chờ Founder quyết định nếu đem áp dụng. [Kiến trúc Q2-A](mobot-v2-handset-b01-architecture-v1.md).

## Phiếu để Founder chuyển nhà bán

Vui lòng cung cấp hồ sơ đúng mã và revision hoặc lô dự kiến giao. Mục chưa có tài liệu xin ghi rõ.

- **B01 ESP32 DevKit V1 USB-C 30 chân họ CH340:** ảnh rõ hai mặt hàng sẽ giao, mã PCB/revision, marking USB-UART và regulator, nhãn hai hàng chân. Nếu có, xin kích thước và sơ đồ CC1, CC2, VBUS, VIN, 3V3.
- **Jauch 250832:** bản vẽ mặt ghép XHP-3 có khoang 1, bảng BAT+/BAT−/NTC, mã và bảng R–T cùng dung sai NTC. Xin cận CV, termination, timer/recharge và dữ liệu xả/hồi áp.
- **MTM B04 7V2AH-4A-2S1P:** mã cell/PCM, cân bằng 2S, dòng liên tục và dòng xung theo thời lượng/nhiệt độ, ngưỡng cắt/phục hồi, profile sạc, NTC, đầu ghép và cực tính.

Phiếu nội bộ cụm RUN cần ghi mã B01, cáp, hai công tắc, đầu chụp, gá và bó GH. Ghi mốc CC/VBUS mất hợp lệ và I/O thực sự cách ly, tốc độ/góc rút, sai số đo và kênh bị giữ đóng. Bằng chứng timing RUN vẫn là điều kiện thiết kế ngoài D10.
