# MoBot V2 r6 · B15 và đầu vào nguồn tay cầm

05/11/2026 · Bàn giao EF/HQ · [r6 đã duyệt](mobot-v2-config-2026-11-05-r6.md) · [Hợp đồng giao diện r6](mobot-v2-r6-interface-review-packet.md). Đối chiếu công khai và tư vấn HK chỉ đọc. B15 giữ nguyên ở mức ứng viên, chưa đủ bằng chứng để đóng gate.

## B15 · Kết quả xác minh đúng SKU

| Dữ liệu | Mức bằng chứng |
|---|---|
| `LK37478`, OEM, pack Li-ion 1S 18650 nối dây có bảo vệ, 2.000 mAh, 3,7 V danh định, 4,2 V đầy, 18,5 × 66 mm | Trang nhà bán xác nhận theo SKU. [Trang sản phẩm](https://linhkienx.com/pin-sac-18650-2000mah-3-7v-noi-day-co-bao-ve) |
| Xả liên tục tối đa 1C, sạc liên tục tối đa 0,5C | Bảng nhà bán ghi các mức này, tương ứng 2 A và 1 A nếu dung lượng đúng 2 Ah. Tiêu đề danh mục có chữ 3C và đầu PH2.0 hai chân, không dùng 3C để tính. Cực tính chưa xác minh. [Danh mục](https://linhkienx.com/san-pham/pin-sac-18650) |
| Hãng, mã, revision cell và mạch bảo vệ | Chưa tìm thấy tài liệu hãng truy được từ đúng SKU. Không suy từ pack 18650 khác. |
| Nội trở DC toàn pack, dòng xung và thời lượng | Chưa có. Cần điều kiện đo theo nhiệt độ, SOC và trạng thái lão hóa, gồm cell, mạch bảo vệ, dây và đầu nối. |
| Ngưỡng, thời gian và cách phục hồi khi quá dòng/thấp áp/quá áp | Chưa có. Cần biết khả năng sạc phục hồi khi protector mở và các điều kiện cho phép của nhà sản xuất. |
| Dải nhiệt, precharge, CV và dòng kết thúc cho đúng pack | 4,2 V và 0,5C chỉ có ở cấp nhà bán. Thiếu hồ sơ pack về giới hạn theo nhiệt độ, precharge, termination và NTC. Chưa xác nhận có NTC tích hợp. |

## Tải và UVLO tay cầm

- r6 giữ **5 V/0,50 A** và cutoff **3,20 V dưới tải tại đầu pack**. Công suất ra 2,50 W. Với hiệu suất giả định 80%, dòng phía pack là **0,9766 A trước tải phụ và tổn hao ngoài converter**. Nếu có sụt áp trên dây/đầu nối, dùng Vin thấp hơn tại converter để tính. Cần tách dòng ổn định khỏi xung Wi‑Fi, inrush và thời gian xung.
- Điều kiện để EF đóng: có profile tổng dòng theo thời gian, nội trở pack và dây tại góc xấu nhất, hiệu suất có căn cứ ở góc 3,20 V, cùng biên sụt áp. Tính `V_tải = V_hở − I_xung × R_đường` làm kiểm sơ bộ, rồi đối chiếu đường cong/sụt áp động. Giá trị 1C nhà bán không đủ chứng minh không trip hoặc reset.
- UVLO carrier là yêu cầu phần cứng độc lập với protector. Chốt dung sai điểm cắt, ngưỡng hồi cao hơn, debounce/thời gian giữ và yêu cầu bật lại mới. Khi nguồn dao động quanh ngưỡng, tải giữ OFF tới khi áp và power-good ổn định. UVLO nội của TPS61023 thấp hơn nhiều so với 3,20 V và không thay yêu cầu này. 3,7 A là mức dòng switch điển hình của IC, không phải dòng 5 V bảo đảm. [TI TPS61023 Rev. B, electrical characteristics](https://www.ti.com/lit/ds/symlink/tps61023.pdf)

## Ma trận nguồn và I/O cho EF

| Micro‑USB / USB‑C | DevKit | Tải 5 V carrier | Sạc | Ranh giới I/O |
|---|---|---|---|---|
| 00 | Pack qua nguồn carrier khi đủ áp và đã cho phép bật | Cho phép sau power-good | OFF | Chỉ nối các miền khi đã có nguồn hợp lệ. |
| 10 | Micro‑USB nạp | OFF, chặn cấp ngược từ DevKit | OFF | USB data giữ đường nạp; joystick hai trục, nút/pull-up và các đường trạng thái phía carrier phải không cấp nguồn ngược. |
| 01 | OFF | OFF | USB‑C, sau nhận diện/kiểm pack và NTC | CC/NTC và trạng thái sạc ở miền charger; không kéo rail MCU qua đường báo hoặc pull-up. |
| 11 | Micro‑USB nạp | OFF | USB‑C sạc độc lập | Cùng cách ly như 10 và 01. Không ghép hai VBUS. |

Đối chiếu interposer Micro‑USB bắt buộc giữ data và cảm nhận raw VBUS trước D1. Các detector và khóa OFF phải có trạng thái an toàn dù pack cạn, vắng hoặc protector mở. EF điền từng hướng tín hiệu và điều kiện high-Z/Ioff. Hai trục joystick là đường analog, cần chứng minh đường cách ly không sai dải ADC. Nút thụ động phải được xét theo miền pull-up thực tế. Thử cả hai thứ tự cắm/rút, reset, brownout và pin cạn/vắng. [Nguồn BrijModi](../../assets/boards/esp32-devkit-v1-30pin/README.md)

## Sạc 1S · Điểm mới cần review

- Xác minh được **MCP73833-FCI/UN** có CV danh nghĩa **4,20 V**. Bảng option của Microchip ghi precharge 10% dòng đặt, ngưỡng precharge 71,5% CV, termination 7,5%, recharge 96,5% và timer danh nghĩa **6 giờ**. Tại mục tiêu r6 **0,25 A**, các giá trị danh nghĩa suy ra là khoảng 25 mA precharge, 3,003 V chuyển sang CC, 18,75 mA termination và 4,053 V recharge. Dùng min/max datasheet và hồ sơ pack để review, không dùng các số danh nghĩa làm giới hạn an toàn. [Microchip DS20002005C, bảng option](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf)
- **Timer có thể kết thúc trước khi đầy.** 2 Ah / 0,25 A là 8 giờ nếu cần nạp lại toàn bộ 2 Ah ở dòng không đổi, chưa tính CV hoặc giảm dòng do nhiệt. Sáu giờ ở 0,25 A chỉ tương đương tối đa 1,5 Ah ở dòng không đổi trong ví dụ này. Chưa biết dung lượng cần nạp lại sau cutoff 3,20 V, nên chưa kết luận một chu kỳ đủ. Kỹ sư cần đối chiếu cửa sổ timer và đường sạc đúng pack, kể cả nhiệt và dung sai. Không tự reset timer để ép sạc đầy.
- USB‑C sạc từ 5 V khi nhận diện nguồn đủ dòng. Trước hoặc khi mất nhận diện, charger OFF, chỉ miền nhận diện có dòng giới hạn. EF chứng minh tổng `Icharge,max + Ibias,max + Istatus,max` và inrush dưới mức nguồn cho phép đối với C–C và A–C. Kiểm nhiệt tuyến tính tại ngưỡng precharge→CC theo `P ≈ (VBUS,max − VPTH,min) × Icharge,max`. Đo NTC trên pack và ngừng sạc khi NTC lỗi/nhiệt ngoài dải. Khi protector mở, chỉ phục hồi theo giới hạn có tài liệu của pack. Tải carrier OFF trong suốt chu kỳ.

**Phần người dùng cần quyết định nếu phát sinh thay đổi:** giữ LK37478 để lấy hồ sơ đúng cell/protector, hoặc xem xét pack có hồ sơ đầy đủ nếu thiếu dữ liệu. Nếu EF xác nhận timer sáu giờ không đáp ứng mục tiêu, mọi thay đổi suffix charger, dòng sạc hoặc pack cần trình revision mới. Hiện giữ r6 và chưa đề nghị mua hay thay linh kiện. Các phép đo bench sẽ xác nhận giới hạn sau khi có mẫu và quyền thử riêng.
