# MoBot V2 tay cầm · Bản chốt trước KiCad

MM-HW-MOBOT-IF-001. Tổng hợp vòng cuối của Box 02 và 03 theo [finding Box 08](mobot-v2-handset-b01-harness-closure-review.md), snapshot `42870CFEDFB0C644BB8FA7E68A7CF1BDAE709E9D5C6AB4E0B081CA7960768026`. Kiến trúc tay cầm đã được người dùng duyệt. Cấu hình triển khai còn thiếu dữ liệu.

## Phần đã chốt ở cấp yêu cầu

- Bó 11 dây trên JST GH 12 cực cắm ngang, một khoang trống. Bộ đầu nối SM12B-GHS-TB, GHR-12V-S, 11 terminal SSHL-002T-P0.2. AWG 28 là lựa chọn ban đầu. Chiều dài và cận điện trở còn phụ thuộc sụt áp và lệch mass.
- Gá B01 riêng, đầu chụp RUN tác động hai tiếp điểm hồi riêng, đầu cáp phía carrier giữ bằng chặn tháo từ trong vỏ. USB đi qua cáp riêng.
- Giám sát riêng GND_FUNC. Mất xác nhận phải cách ly I/O, tắt nguồn joystick và RUN OUT, xóa quyền RUN. Kích AC và đọc đồng bộ vẫn là ứng viên cần chứng minh biên. JOY_VCC lấy tại carrier, mặc định tắt. Rail sense trở kháng cao, báo lỗi khi hở hoặc mất bias.
- Giữ H3 0,40 A danh nghĩa. VARTA 56457 201 020 chưa đủ căn cứ dùng với H3 hiện tại. Không thay B15 trong BOM.

## Phiếu đầu vào còn thiếu

| Đầu vào | Dữ liệu cần để đóng |
|---|---|
| B01 Beetrona 02030089 | Mã revision, pinout, rail và brownout, CC hai chiều, cận dòng attach/boot/Wi-Fi/flash, dải ADC và cận dòng tiêm. Ghi đúng SKU và nhận dạng mẫu. |
| Cáp RUN, đầu chụp, gá | Đo độ nhô cổng, độ rơ, điểm đóng/nhả và hành trình dư từng tiếp điểm. Dùng đồng hồ so hoặc đầu đo hành trình, đo tốc độ rút thực và ghi đồng bộ CC/VBUS/I/O. Tách phép đo mất tiếp xúc khỏi tác động veto. Thử từng tiếp điểm với kênh kia giữ đóng, cắm hờ, rút lệch, nhầm cáp và gá xê dịch. Biên nhả nhỏ nhất sau sai số phải lớn hơn tốc độ rút kiểm tra nhân tổng trễ cách ly lớn nhất. |
| GND, joystick và rail sense | Kiểm GND_FUNC hở khi USB vẫn cắm, đo đáp ứng tốt/hở, nhiễu, dòng hồi, lệch GND và trễ cách ly. Đo mức nâng rail và rò khi mất nguồn từng phía. Đóng mức JOY_VCC, độ ổn định và hai thời gian chờ từ cận của joystick/ADC thật. |
| Pin 1S | Hồ sơ LK37478 đúng cell/PCM/lô, profile sạc và nhiệt độ, NTC, cực tính, xung tải, sụt áp pin yếu, cutoff/release. Nếu thiếu, chọn pack 1S có hồ sơ hãng chứng minh phù hợp H3 và trình duyệt đúng mã, giao diện, ảnh hưởng cơ khí. |

Bench chưa thực hiện. Khi có đầu vào, HQ khóa linh kiện và cận thiết kế, gửi Box 08 review, trình cấu hình triển khai theo SHA-256 và chạy preflight trước khi cấp lease KiCad.

## Kết quả kiểm tra mở KiCad

- Tra lại đúng SKU [B01 Beetrona](https://tokobeetrona.com/produk/esp32-usb-type-c-ch340-30pin-development-board/) và [B15 LK37478](https://linhkienx.com/pin-sac-18650-2000mah-3-7v-noi-day-co-bao-ve). Chưa tìm được tài liệu hãng gắn đúng revision để thay các đầu vào còn thiếu. Dữ liệu niêm yết của nhà bán chỉ dùng để nhận dạng ứng viên.
- `node ../docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` trả exit 1, `dispatch_eligible: false`. Queue chưa có ủy quyền task đang hoạt động và chưa đặt chế độ builder. Giữ cổng thiết kế đóng cho đến khi dữ liệu kỹ thuật và phê duyệt cấu hình đầy đủ.
- Bước cần xác định là có mẫu B01 đúng SKU để dùng phiếu đo ở trên hay phải lập phương án thay bo có hồ sơ hãng. Đường pin song song là cung cấp hồ sơ đúng lô B15 hoặc trình pack 1S thay thế phù hợp H3.
