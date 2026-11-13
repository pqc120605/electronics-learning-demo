# MoBot V2 · Cấu hình nguồn r6 để duyệt KiCad

05/11/2026 · `MOBOT-V2-CONFIG-r6`. Kế thừa [r5](mobot-v2-config-2026-11-05-r5.md), SHA‑256 `491DD8D033038DC695C914B52259E00E8582E5D9AF9B060DAA86249891BB27E2`, và [kết quả đối chiếu bo](mobot-v2-r5-kicad-preflight.md). Bo mục tiêu là đúng thiết kế BrijModi CP2102, 30 chân, Micro‑USB đang hiển thị trên Mạch Mở. Robot dùng hai Pololu #992. Cổng sạc riêng của robot và tay cầm dùng USB‑C 5 V. Các giới hạn dưới đây là yêu cầu thiết kế nguyên mẫu, chưa là kết quả đo.

## Ngân sách dòng và giới hạn

| Khối | Quyết định r6 | Cơ sở và tiêu chí review |
|---|---|---|
| Robot, nhánh motor 6 V | Giới hạn dòng cuộn dây danh nghĩa **0,40 A/kênh**. Trần thiết kế tính cả sai số **0,45 A/kênh**, cấp ngân sách **0,90 A tổng** tại nhánh 6 V | Pololu #992 ngoại suy 0,36 A kẹt tại 6 V mỗi motor. Kiểm giới hạn theo dung sai và điều kiện đồng thời. B03 DRV8833PWPR và B07 TPS63070RNMR là các linh kiện r2 cần xác nhận theo tải, nhiệt và năng lượng trả về. Phải ngắt khi lỗi/kẹt kéo dài. [Pololu](https://www.pololu.com/product/992/specs) · [DRV8833](https://www.ti.com/product/DRV8833) · [TPS63070](https://www.ti.com/product/TPS63070) |
| Robot, nhánh logic/loa 5 V | **0,70 A tổng**, gồm 0,50 A DevKit, 0,15 A audio, 0,05 A OLED/cảm biến/phụ trợ. Âm thanh mục tiêu tối đa 0,5 W tại loa | Cấp phát tải cho thiết kế, không phải dòng đỉnh đã xác minh. Kiểm burst Wi‑Fi, độ sụt áp và giới hạn công suất loa. Giảm tải hoặc tắt ampli nếu vượt phần cấp phát. [MAX98357A](https://www.analog.com/en/products/max98357a.html) |
| Robot, pack 2S | Dừng tải khi pack dưới **6,50 V dưới tải**. Mục tiêu không quá **1,85 A** khi chạy ở góc thiết kế. Dùng hiệu suất sàn **80%** cho từng converter và **0,05 A** tải trực tiếp/phụ trợ | `(6×0,90 + 5×0,70)/(6,50×0,80) + 0,05 ≈ 1,76 A`. Pack B04 công bố 2 A liên tục; 4 A là mức tức thời nhà bán công bố. Cần xác minh ngưỡng cắt, giới hạn dòng thực và đáp ứng tải xung. [Pack B04](https://banpinsac.com/san-pham/pin-sac-7-4v-8-4v-2000mah-4a-mtm) |
| Tay cầm, nhánh 5 V từ pack 1S | **0,50 A tổng**, dừng tải dưới **3,20 V dưới tải** | `5×0,50/(3,20×0,80) ≈ 0,98 A` phía pack trước tải phụ. Kiểm converter, thời gian bật Wi‑Fi, hiệu suất và dòng cho phép của đúng pack. [TPS61023](https://www.ti.com/product/TPS61023) · [Pack B15](https://linhkienx.com/pin-sac-18650-2000mah-3-7v-noi-day-co-bao-ve) |

Các phép tính trên là ngân sách công suất tại điểm thiết kế. Dòng cuộn dây và dòng nhánh nguồn có thể khác trong PWM, giảm tốc và chuyển mạch. Ngưỡng dưới tải, hiệu suất sàn, xung dòng và khả năng tản nhiệt cần được review trong thiết kế và xác minh bằng mẫu. Giữ giá r5 ở trạng thái cần cập nhật giá giao tới tay, dùng r2 làm mốc đã chấp nhận.

## Cấp nguồn khi cắm USB

| Micro‑USB nạp | USB‑C sạc | Hành vi bắt buộc của robot và tay cầm |
|---|---|---|
| Rút | Rút | Pack cấp carrier và DevKit ở chế độ chạy. Motor mặc định tắt khi khởi động/reset và chỉ chạy khi điều kiện cho phép hợp lệ. |
| Cắm | Rút | Chế độ nạp. Micro‑USB cấp riêng DevKit từ máy tính. Ngắt đường cấp DevKit từ carrier, tắt motor và các nhánh tải carrier. |
| Rút | Cắm | Chế độ sạc. USB‑C 5 V chỉ cấp khối sạc tương ứng 2S/1S. Tắt DevKit và tải carrier. |
| Cắm | Cắm | Hai chức năng độc lập. USB‑C chỉ sạc pack, Micro‑USB chỉ cấp DevKit để nạp/debug. Carrier và motor vẫn tắt. |

- Phát hiện có nguồn ở từng cổng độc lập với firmware DevKit, kể cả lúc reset. Micro‑USB của DevKit cần đường phát hiện hiện diện VBUS từ giao diện nạp có thể kiểm chứng. Chốt phương án giao diện nạp khi review thiết kế, không suy ra VBUS thô từ rail 5 V của bo. [Nguồn bo BrijModi](../../assets/boards/esp32-devkit-v1-30pin/README.md)
- Ngắt đường cấp DevKit từ carrier khi có một trong hai USB. Xử lý cả cấp ngược qua I/O tới ngoại vi tắt nguồn. Phần sạc giữ đúng hóa học/điện áp pack, giới hạn theo nguồn USB, đo nhiệt pin và báo trạng thái. Kiểm hành vi cắm/rút theo cả hai thứ tự và khi pin cạn. [BQ25886](https://www.ti.com/product/BQ25886)

## Bàn giao KiCad

Phạm vi xin duyệt là schematic và layout **hai carrier nguyên mẫu**, kèm BOM theo refdes, kiểm ERC/DRC và ghi sai lệch còn tồn tại. Dùng bản vẽ BrijModi đã khóa để làm chuẩn footprint. Xác nhận lắp vừa và nhiệt/dòng thật thuộc bước thử mẫu. Giao diện phát hiện VBUS, khả năng giữ giới hạn dòng/nhiệt và tương thích pack cần được review trước khi cấp lease. Đối chiếu [quy trình dự án](../mission-control/parallel-build-policy.md) để đăng ký cấu hình, hash, đầu vào và phạm vi ghi. Tài liệu r6 chưa có pin map, schematic hoặc PCB.
