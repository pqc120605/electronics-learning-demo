# MM-HW-MOBOT-IF-001 · MoBot V2 r6 · Packet tái review

05/11/2026. Advisory cho hai carrier. Đối chiếu [r6 đã duyệt](mobot-v2-config-2026-11-05-r6.md) với [năm finding](mobot-v2-r6-readiness-review.md) và tài liệu hãng. Các phần dưới là phương án xử lý để box08 đánh giá. Không ghi nhận finding đã đóng khi thiếu bằng chứng.

## Hợp đồng giao diện chung

### 4 · Raw VBUS và cách ly

**Phương án.** Hai carrier dùng đường nạp Micro‑USB qua interposer bắt buộc. Giữ data tới DevKit và cảm nhận raw VBUS trước D1. Che cổng trực tiếp trong cụm lắp để người dùng không bỏ qua sense. Miền phát hiện và khóa tải hoạt động từ nguồn USB tương ứng khi pin cạn/vắng hoặc BMS mở. Khóa phần cứng ưu tiên OFF khi mất bias, reset hoặc power-good không hợp lệ. Ngắt đường carrier→DevKit hai chiều khi cần. Xem cả dòng qua các tín hiệu digital, analog và pull-up khi một miền mất nguồn. Ứng viên buffer cho tín hiệu một chiều phải có đặc tính `Ioff` và trạng thái high-Z phù hợp. Với I²C, đánh giá buffer có high-Z khi tắt nguồn và pull-up riêng từng miền. Không mặc định các buffer đó phù hợp đường joystick analog. [Sơ đồ nguồn BrijModi](../../assets/boards/esp32-devkit-v1-30pin/README.md) · [SN74LVC1G125 Rev. U](https://www.ti.com/product/SN74LVC1G125) · [TCA9517A Rev. E](https://www.ti.com/product/TCA9517A)

| Micro‑USB | USB‑C | Nguồn và hành vi |
|---|---|---|
| 0 | 0 | Pack đủ áp và rail ổn định mới được cấp tải. Motor vẫn OFF qua reset và tới lệnh cho phép mới. |
| 1 | 0 | Micro‑USB cấp DevKit để nạp. Carrier/motor OFF, đường nguồn từ carrier và I/O sang ngoại vi đã cô lập. |
| 0 | 1 | Miền USB‑C nhận diện nguồn và sạc. DevKit/carrier/motor OFF, kể cả khi charger có điện áp SYS. |
| 1 | 1 | Micro‑USB chỉ cấp DevKit, USB‑C chỉ sạc. Carrier/motor vẫn OFF. |

**Tiêu chí tái review.** Từ `00`, cắm từng cổng trước rồi cổng còn lại. Từ `11`, rút từng cổng trước rồi cổng còn lại. Trong thời gian chuyển tiếp, giữ tải OFF cho tới khi cả hai USB đã vắng và nguồn pack hợp lệ, không tự tiếp tục lệnh motor cũ. Lặp ma trận cho pack bình thường, pin cạn, pin vắng/BMS mở và reset DevKit. Review mức logic an toàn khi chưa có bias và mọi đường nguồn/pull-up. **Chưa đủ:** part và revision interposer, bảng từng I/O theo hướng điện và rail, giới hạn dòng rò. **Bench:** nạp thành công, đo dòng ngược/điện áp trên miền tắt, bắt xung enable trong mọi thứ tự và lúc reset.

### 5 · Chính sách USB‑C và sạc

**Phương án chung.** Cổng chỉ nhận 5 V. C–C dùng sink có Rd trong trạng thái dead battery, sau khi VBUS xuất hiện dùng bias phía USB để nhận mức dòng CC. A–C chỉ cấp mức cao nếu xác định hợp lệ theo BC1.2/nguồn adapter được kiểm. Mặc định trước nhận diện là tắt charger, chỉ cấp miền nhận diện với ngân sách dòng nhỏ phù hợp. Nếu không xác định được nguồn có cấp đủ mức thấp, giữ sạc OFF và báo trạng thái. Không dựa vào CP2102 hay firmware DevKit để nhận diện. [TI TUSB320LAI Rev. D §7.3.3/§8.3.1](https://www.ti.com/lit/ds/symlink/tusb320lai.pdf) · [TI BQ25886 Rev. A §8.3.3.2/§8.3.9](https://www.ti.com/lit/ds/symlink/bq25886.pdf)

**Tiêu chí tái review.** Bảng từ nguồn mặc định đến nguồn đã nhận diện phải nêu dòng đầu vào tối đa kể cả bias, dung sai và inrush, giới hạn charger và trạng thái mất nhận diện. NTC đo pack thực, dải sạc lấy từ tài liệu đúng pack, hở/ngắn NTC ngừng sạc. Tách đang sạc/đã kết thúc/lỗi. **Bench:** C–C hai chiều cắm, A–C, nguồn yếu, pin cạn/vắng/BMS mở, NTC hở/ngắn và cả hai thứ tự USB.

## Phụ lục robot 2S

### 1 · Motor, giới hạn và kẹt

**Phương án giữ r6.** Giữ DRV8833PWPR, thêm kênh đo dòng cuộn dây hai chiều và giới hạn phần cứng độc lập mỗi motor có quyền ngắt cầu H. Ngưỡng nội của DRV8833 làm lớp dự phòng. Một điện trở sense với mục tiêu 0,40 A danh nghĩa cho ngưỡng **0,32–0,48 A** ngay trước dung sai và blanking. Vì vậy phương án dùng riêng sense nội không đạt r6. Cần ngân sách sai số tổng và biên overshoot `ΔI ≤ (dI/dt)max × t_ngắt,max`, bao gồm blanking, nhiệt và quá độ PWM. [TI DRV8833 Rev. E §6.5/§8.2.2.2](https://www.ti.com/lit/ds/symlink/drv8833.pdf)

**Kẹt là finding riêng.** Dòng kẹt 0,36 A của #992 là ngoại suy điển hình ở 6 V và có thể không chạm ngưỡng 0,40 A. Cần tín hiệu nhận biết không quay hoặc bảo vệ theo thời gian/năng lượng với giới hạn có căn cứ, chốt lỗi và yêu cầu lệnh mới sau khi xử lý. Không dùng ngưỡng dòng cao làm bằng chứng đã nhận biết kẹt. [Pololu #992](https://www.pololu.com/product/992/specs)

**Phương án r7 nếu ưu tiên ít linh kiện:** đổi mục tiêu ngưỡng điều tiết danh nghĩa từ **0,40 A xuống khoảng 0,35 A/kênh**, giữ trần **0,45 A/kênh**, giữ driver và ngân sách rail r6. Ví dụ sàng lọc với sense danh nghĩa 0,576 Ω ±1% cho khoảng **0,275–0,421 A** tại ngưỡng trip tĩnh, còn khoảng **29 mA** trước trần 0,45 A cho đỉnh vượt. Đây là phép tính khả thi, chưa khóa linh kiện sense hoặc chứng minh overshoot. Dòng cắt thấp nhất có thể giảm mô-men khởi động; cần kiểm tải thực trước khi chọn. Thay đổi mục tiêu này cần revision/hash và người dùng duyệt. Giảm ngưỡng cũng chưa tự giải quyết nhận biết kẹt.

**Tiêu chí tái review.** Chốt đúng part và trễ/sai số của chuỗi đo, dốc dòng có căn cứ, ngưỡng tĩnh và đỉnh, tiêu chí ngắt kẹt. **Chưa đủ:** thông số điện động motor cho worst case, phần tử giới hạn chính xác và giới hạn kẹt. **Bench:** đo dòng đỉnh tại góc áp/nhiệt, hai motor khởi động, kẹt ở các mức PWM và phục hồi lỗi.

### 2 · Pack, converter, UVLO và tải xung

**Phương án.** Giữ cutoff 6,50 V dưới tải và trần pack 1,85 A r6. Đề xuất chỉ cho bật lại sau khi áp hồi trên ngưỡng phục hồi có hysteresis và có yêu cầu bật mới. Dùng giám sát phần cứng ngoài bảo vệ BMS. Nguồn logic lên ổn định trước, motor lên sau và chỉ cho phép chạy khi power-good hợp lệ. Cần điều phối inrush, Wi‑Fi, audio, hai motor và tải phụ để giữ biên. Ước tính r6 là 1,762 A, còn khoảng 88 mA tới trần. B04 công bố 2 A liên tục nhưng chưa công bố đủ nội trở, xung và cắt/phục hồi theo đúng cell/BMS. [Pack MTM B04](https://banpinsac.com/san-pham/pin-sac-7-4v-8-4v-2000mah-4a-mtm) · [TPS63070 Rev. B](https://www.ti.com/lit/ds/symlink/tps63070.pdf) · [TPS54302 Rev. C](https://www.ti.com/lit/ds/symlink/tps54302.pdf)

**Tiêu chí tái review.** Có dải Vin, bảng hiệu suất và tải đồng thời/inrush tại góc thấp, dung sai UVLO và ngưỡng hồi, nguồn đúng revision cho pack/BMS. **Chưa đủ:** nội trở, thời lượng/biên độ xung, giới hạn sạc, cutoff và release. **Bench:** đo xung pack/rail, BMS trip, reset và hysteresis ở tải đã định.

### 3 · Năng lượng trả về và nhiệt

**Phương án.** Giảm lệnh về 0 và coast trước khi đảo chiều, mặc định tắt khi lỗi. TPS63070 có thể truyền dòng từ output về input trong PWM. Phải có đường chặn trả năng lượng về pack và đường hấp thụ/kẹp tại VM độc lập, xét pack đầy, BMS mở và converter disable. Không lấy dung lượng pin làm sink năng lượng phanh. Tính phần tụ bằng `½ C_eff × (V_limit² − V_start²)` và phần dư qua kẹp, dùng ngưỡng thấp nhất của mọi linh kiện. VM tối đa tuyệt đối của thiết kế phải nằm trong giới hạn vận hành 10,8 V của DRV8833 và dưới ngưỡng thấp hơn nếu linh kiện khác yêu cầu. Ở 8,9 W ra và hiệu suất 80%, tổng hao phí ước tính hai converter là 2,225 W, chưa tính driver. [TPS63070 Rev. B §8.3/§8.4.8](https://www.ti.com/lit/ds/symlink/tps63070.pdf) · [DRV8833 Rev. E](https://www.ti.com/lit/ds/symlink/drv8833.pdf)

**Tiêu chí tái review.** Có biên năng lượng từ điện cảm và tốc độ/quán tính cực đại, tụ hiệu dụng có derating, đường kẹp chịu xung lặp và phân bổ nhiệt từng IC trong vỏ. **Chưa đủ:** khối lượng/quán tính/tốc độ cơ cấu, giới hạn đảo chiều và cấu hình kẹp. **Bench:** đo đỉnh VM và rail phía pack khi coast, lỗi, ngắt tải và đảo chiều, nhiệt trong vỏ dưới tải lặp.

### 5R · Charger robot 8,4 V

Giữ BQ25886 + TUSB320LAI. Chỉ đặt mục tiêu **0,50 A** ở nguồn đã xác nhận đủ dòng và pack cho phép. Nguồn 5 V/500 mA chỉ cho 2,5 W đầu vào, không thể cấp 4,2 W cho pack. Ứng viên tầng thấp **0,15 A vào pin** dùng khoảng 0,332 A từ 4,75 V ở hiệu suất giả định 80%, trước bias/inrush và sai số. Tầng thấp chỉ bật sau khi chứng minh toàn bộ dòng nằm trong khả năng nguồn. `ILIM` BQ25886 không hỗ trợ đặt dưới 500 mA, vì vậy cần giới hạn đầu vào độc lập nếu muốn chứng minh trần toàn cổng dưới 500 mA, hoặc giữ sạc tắt ở nguồn mặc định. Ở tầng cao, 0,50 A với sai số +15% cho khoảng 1,27 A từ 4,75 V/80% trước tải phụ, cần kiểm số thực và dùng nguồn đủ mức. Chặn SYS cấp tải carrier ở mọi trạng thái và vô hiệu OTG. [BQ25886 Rev. A §6.5/§8.3.9](https://www.ti.com/lit/ds/symlink/bq25886.pdf)

## Phụ lục tay cầm 1S

### 2H · Pack và nhánh 5 V

Giữ cutoff 3,20 V dưới tải, đề xuất hysteresis và yêu cầu bật lại mới. 5 V/0,50 A cần khoảng 0,977 A phía pin ở 80% trước tải phụ. Cần tài liệu đúng B15 về dòng/cutoff/release và giới hạn xung. Listing LK37478 có nhãn 3C và bảng 1C khác nhau, nên cần xác minh đúng mẫu. TPS61023 công bố dòng switch, cần kiểm dòng ra ở điểm 3,20→5 V, khởi động và nhiệt. **Bench:** đo Wi‑Fi burst, sụt áp và trip với pin thấp. [LK37478](https://linhkienx.com/pin-sac-18650-2000mah-3-7v-noi-day-co-bao-ve) · [TPS61023 Rev. B](https://www.ti.com/lit/ds/symlink/tps61023.pdf)

### 5H · Charger 1S 4,2 V

Giữ ứng viên MCP73833-FCI/UN 4,2 V, mục tiêu 0,25 A khi nguồn/pack cho phép. Phần USB‑C cần sink dead-battery và nhận diện/giới hạn riêng như hợp đồng chung. Tải tắt khi sạc để việc kết thúc sạc không bị sai do tải chia dòng. Dùng NTC đo pack; kiểm giới hạn nhiệt tuyến tính theo `(VBUS − VBAT) × Icharge` tại điện áp pin thấp và ngưỡng precharge. **Chưa đủ:** xác nhận mã đặt hàng, dải NTC và nhiệt theo pack, dung sai dòng và khả năng nhận diện phía tay cầm. **Bench:** sạc nguồn yếu, pin cạn/vắng, NTC lỗi và nhiệt trong vỏ. [Microchip DS20002005C](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP73833-4-Stand-Alone-Linear-Li-Ion-Li-Polymer-Charge-Management-Controller-DS20002005.pdf)

**Đề nghị cho box08:** tái review hợp đồng USB và hai phụ lục. Giữ gate chờ bằng chứng ở những điểm đã nêu. Phương án r7 ở finding 1 chỉ là lựa chọn thay đổi để thảo luận, chưa có phê duyệt. Hai carrier chưa có lease KiCad.
