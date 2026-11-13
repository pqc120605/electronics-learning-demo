# MoBot V2 · Phương án kiến trúc tay cầm B01 v1

**Mã đề xuất `MOBOT-V2-HANDSET-B01-ARCH-v1`. Chờ người dùng duyệt kiến trúc.** Phạm vi là tay cầm. Đây là quyết định kiến trúc đầu vào cho cấu hình thiết kế. Lease KiCad cần một cấu hình kỹ thuật hoàn chỉnh được duyệt đúng hash và đạt preflight. Robot sẽ có hồ sơ riêng.

## Lựa chọn đề nghị duyệt

- B01 là ESP32 30 chân, USB-C, CH340, SKU `02030089` trong BOM r2. Gá riêng DevKit trong vỏ, đặt USB-C ở mép vỏ, dùng bó dây tín hiệu ngắn có khóa phía carrier và điểm giữ dây. Hình học và đầu ghép phía DevKit sẽ theo tài liệu đúng revision hoặc mẫu. [Nguồn SKU](https://tokobeetrona.com/produk/esp32-usb-type-c-ch340-30pin-development-board/).
- Cổng USB-C onboard là đường cấp nguồn duy nhất của B01. VIN và 3V3 nằm ngoài đường cấp nguồn carrier. Dùng cáp tháo rời để chọn giữa `RUN OUT` từ carrier và cáp dữ liệu từ máy tính. DevKit mất nguồn và khởi động lại khi đổi cáp. Cổng sạc pin `CHARGE` tách riêng và có nhãn riêng.
- Giữ quyết định H3: pack 1S, MCP73833-FCI/MF, RPROG 2,49 kΩ ±1%, 0,40 A danh nghĩa. Sạc phụ thuộc điều kiện hợp lệ của nguồn, pack và nhiệt độ. Nhánh RUN giữ TPS61023 và TPS25810 ở mức ứng viên đến khi kiểm xong ngân sách dòng, nhiệt và inrush. [Quyết định H3](mobot-v2-config-2026-11-05-r7.md) · [TPS61023](https://www.ti.com/product/TPS61023) · [TPS25810](https://www.ti.com/product/TPS25810).

| Trạng thái | Yêu cầu |
|---|---|
| RUN, pack hợp lệ, không sạc | Sau lệnh RUN, carrier cấp B01 qua RUN OUT. Chỉ nối I/O khi carrier xác nhận đang cấp B01 và cả hai miền nguồn ổn định. |
| CHARGE khi cáp RUN còn nối | VBUS cổng sạc cưỡng bức tắt RUN OUT, cách ly I/O và B01 tắt. |
| PROGRAM | Rút cáp RUN khỏi B01, cắm cáp dữ liệu từ máy tính. Máy tính cấp B01, I/O cách ly. Điện áp B01 do host cấp không cho phép mở I/O. |
| PROGRAM + CHARGE | Cho phép nạp firmware từ PC trong khi cổng CHARGE sạc pack nếu các điều kiện sạc hợp lệ. RUN OUT tắt và I/O cách ly trong suốt quá trình. Tổ hợp này cần kiểm chứng trên bench, kể cả khi cắm hoặc rút từng cáp và khi một phía mất nguồn. |
| Mất nguồn một phía, brownout, đổi cáp hoặc trạng thái không rõ | I/O mặc định trở kháng cao. RUN OUT mất điều kiện cho phép thì tắt. Khi điều kiện phục hồi, cần lệnh RUN mới. |

## Đầu vào để mở thiết kế

1. Xác minh revision B01, pinout/chiều đầu nối, Rd hai chiều cắm, hành vi USB và yêu cầu nguồn của SKU. Listing không xác nhận các mục này. Không dùng kích thước của EasyWare thay thế.
2. Khóa cách phát hiện RUN thực sự cấp B01 và phần tử cách ly từng đường I/O, kể cả khi một miền mất nguồn. Chốt mức quảng bá dòng, giới hạn host, inrush, sụt áp pin yếu và nhiệt dựa trên dữ liệu phù hợp.
3. Khóa giao diện đầu nối và vùng chừa của carrier. Gá và vỏ chi tiết cần số đo bo, header, anten, đường cáp và điểm giữ dây. Gá rời cho phép tách hình học DevKit khỏi footprint carrier.
4. Có hồ sơ pack 1S đúng revision hoặc chọn pack thay thế để duyệt. Các phép đo vật lý đang UNKNOWN. Kiểm tra sơ đồ, PCB và bench theo phạm vi được phê duyệt ở các bước tiếp theo.

Nguồn nội bộ: Box 02 chốt hợp đồng trạng thái nguồn và I/O, Box 03 chốt cách bố trí và thao tác. Box 08 đã pass có điều kiện bản nháp trước ở SHA-256 `B47B2F8B90617A96CE5444238A6BB6A92CD793DF5CDA16D0B0E64966A44E24DB`.
