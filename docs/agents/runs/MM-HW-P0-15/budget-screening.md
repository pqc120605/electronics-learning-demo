# Sạc ngoài và biên ngân sách — chưa chọn BOM

Ngày10/11/2026. Lead khảo sát riêng phần sạc/cost trong khi02/03 nghiên cứu điện–cơ. Không đặt hàng, không liên hệ người bán, không thay cell/model/cấu hình. Nguồn tải công khai và hash: `docs/research/downloads/p0-15/cost-sources.json`.

## Hai hướng sạc được sàng lọc

| Candidate | Nguồn kỹ thuật hãng | Phù hợp/giới hạn |
|---|---|---|
| Panasonic BQ-CC17 | Manual HR33411-1, bản file19/03/2025,tr.1, đã đọc text và ảnh. Cho1–4cellAA/AAA; AA300mA, nguồnAC100–240V; phạm vi0–35°C | Có thể sạc3cell độc lập trong cùng phiên. Manual khuyến nghị pinPanasonic; chưa chứng minh cặp với FDK HR-3UTG theo đúng revision. Chưa chọn model/suffix/vùng phích hoặc bộpin đi kèm |
| LiitoKala Lii-S1 | Trang hãng công khai đã tảiHTML: 1slot, inputMicroUSB5V≥1A, NiMH/AA được liệt kê,500/1000mA lựa chọn; tự nhận NiMH/Liion, có mode khác chọn tay | Một slot có thể xử lý3cell **lần lượt**, không buộc mua4slot chỉ vì có3cell. Chưa chốt trải nghiệm đó, chưa có giáVND đủ nguồn, chưa xác minh thuật toán kết thúc/điều kiện nhiệt/phối hợpFDK. Tuyên bốCC/CV/điện áp trên trang không phải tài liệu profileNiMH đầy đủ. Không nhận làm charger đã phù hợp |

Nguồn trực tiếp: [Panasonic manual](https://www.panasonicbatteryproducts.com/wp-content/uploads/BQ-CC17A-Instructions-3.19.2025.pdf), [LiitoKala product](https://cn.liitokala.com.cn/charger/Cylindricalbatterycharger/344.html). Web reader không mở được trangLiitoKala, nhưng bản tảiHTML đúng sản phẩm đã được lead đọc; đây không phải né đăng nhập hay sử dụng thông tin tìm kiếm làm proof. Không thực thi script trongHTML.

## Giá và counterexample ngân sách

[SLab listing](https://slab.vn/bo-sac-pin-panasonic-eneloop-bq-cc17-aa-p5924044.html) đọc10/11/2026 ghi800.000đ choBQ-CC17+4pinEneloopPro2550mAh và **hết hàng**. Đây là giá một combo cụ thể của người bán, không giácharger rời, không giáFDK và không chứng cứ tồn kho/genuineness. Nếu lấy đúngcombo đó vào bộ1.000.000đ, số tiền còn lại cho toàn bộ robot+taycầm là200.000đ, chưa phí. Không nhận combo này làm phương án đạt ngân sách, cũng không suy mọi chargerNiMH đều800.000đ.

Pololu S7V8F5 reference9,95USD củaP0-14 chưa có giálandedVND. Không cộng USD vớiVND hoặc dùng tỷgiá tự đoán. ChargerLiitoKala, cellFDK, protection mới, connector, PCB4lớp, vỏ và robot hiện có các ôgiáTBD; chưa thể tính total hoặc bảo đảm dưới1triệu. NguồnUSB5V choLiiS1 cũng không được coi sẵn có miễn phí khiFounder chưa có đồ.

## Không tái sử dụng nhầm BOM cũ

- `mobot-v2-bom-review-2026-11-05-r1.md` là bộgiá cũ, boardCP2102/microUSB và pinLiiontaycầm; tổng1,21–1,73triệu gồmước tính. Không phải BOM choAA/CH340hiện tại, không tự cộng hoặc dùngsubtotal cũ.
- `mobot-robot-t8-purchase-shortlist.md` là nguồn cho **mẫuT8** Pololu992/1452/1086, không BOM sản phẩm dưới1triệu. Lựa chọn đượcFounderduyệt cho mẫu không tạo giá mua hiện tại hoặc lời hứa sản phẩm đạt trần. Không thay motor/cấu hìnhrobot trong đợt này.

Việc cần có trước khóaBOM: exactcell/chargerpair, sốlầnPROGRAM vàconnectorrating, giá lẻlandedkhôngtrùng, quantity/scopecácmodule, PCB/lắp ráp/vậtliệu/cáp/phívậnchuyển vàrobotsubtotal. Nếu giữ các candidate dẫn đến vượtngân sách thật, phải trình một delta cụ thể; không tự nângtrần, bỏcharger hoặc đổirobot.
