# Cấu hình đề xuất R2C cho Mạch Mở

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R2C-1** gồm đúng hai breadboard trong [lộ trình R2](2026-11-26-catalog-fidelity-r2a-proposal.md). Phạm vi là kho linh kiện và bàn tự do trên bản local. Mục tiêu nghiệm thu D3 trong phạm vi hai mẫu cho CAT-04, CAT-05, EDA-03 và WRK-03. Ca mạch dùng các mô hình đã có trong SIM-02/SIM-03 để kiểm đường nối nội bộ.

## Mẫu chốt và nguồn hình học

| ID hiện có trong kho | Mẫu và nguồn | Thân tham chiếu dài × rộng × cao | Điểm nối |
| --- | --- | --- | --- |
| `breadboard-adafruit-239` | Adafruit PID 239 Full Sized Premium. Bản vẽ ZYJ-102 ngày 29/08/2012, trang 2–3, và ảnh mặt trên mẫu Premium. | 165,2 × 54,6 × 8 mm | 63 cột, 630 lỗ ở giữa. 4 rail độc lập × 50 lỗ xuyên suốt, tổng 830 lỗ. [Trang Adafruit](https://www.adafruit.com/product/239) · [Bản vẽ ZYJ-102](https://cdn-shop.adafruit.com/product-files/239/C49+++++++datasheet.pdf) · [Ảnh mặt trên](https://cdn-shop.adafruit.com/970x728/239-04.jpg) |
| `breadboard-adafruit-65` | Adafruit PID 65 Tiny Premium. Bản vẽ ZY-170 ngày 29/08/2012, trang 2–3, và ảnh mặt trên mẫu Premium. | 45,5 × 34,5 × 8 mm | 17 cột, 170 lỗ ở giữa. Không có rail nguồn. [Trang Adafruit](https://www.adafruit.com/product/65) · [Bản vẽ ZY-170](https://cdn-shop.adafruit.com/product-files/65/C212+datasheet.pdf) · [Ảnh mặt trên](https://cdn-shop.adafruit.com/970x728/65-04.jpg) |

Kích thước thân lấy từ các PDF kỹ thuật được Adafruit liên kết. Trang sản phẩm Premium liệt kê kích thước khác và ghi nhận cập nhật kẹp lò xo cùng tấm kim loại trong năm 2022. Hình học khóa ở đây là thân tham chiếu theo bản vẽ, có ký hiệu theo ảnh, chưa đo mẫu Premium thực tế. CAD tham chiếu không tính tấm kim loại rời, gá lắp hoặc độ nhô của ngàm ngoài. Chưa có bằng chứng độ dày, dung sai ngàm và lực kẹp của mẫu thực tế. Mô phỏng coi tấm kim loại rời cách ly khỏi các dải nối.

## Tọa độ, lỗ và dải dẫn điện

- Một hệ tọa độ theo mm cho cả hình nhìn từ trên, footprint và mô hình 3D. Gốc tại tâm hình chữ nhật thân nhìn từ trên, X dọc chiều tăng số cột, Z từ rail trên xuống rail dưới và Y đo cao từ đáy. Mặt đặt chân ở Y=8. Bước ô 2,54 mm. Tâm cột `c` có `X = (c − (N+1)/2) × 2,54`, với `N=63` hoặc `N=17`. Khe `e–f` rộng 7,62 mm tính giữa tâm hai hàng, kiểm lắp DIP 300 mil.
- Mẫu 239 đặt hàng theo nhãn trên ảnh hãng, từ trên xuống theo thứ tự `j,i,h,g,f,e,d,c,b,a`. Vị trí Z tương ứng là `−13,97; −11,43; −8,89; −6,35; −3,81; +3,81; +6,35; +8,89; +11,43; +13,97` mm. Dùng cùng hệ nhãn ảo cho mẫu 65 vì mặt trên bản chụp không in nhãn. Lỗ mở vuông 1,0 × 1,0 mm trong hình học tham chiếu.
- Mẫu 239, thứ tự rail ngoài→trong ở phía trên là `T-` tại Z=−23,5 và `T+` tại Z=−21,0. Ở phía dưới từ trong→ngoài là `B-` tại Z=+21,0 và `B+` tại Z=+23,5. Z của rail là giá trị xấp xỉ dựng từ ảnh. Với chỉ số lỗ rail `h=1…50`, đặt tại tâm cột `3+6×floor((h−1)/5)+((h−1) mod 5)`. Nhóm năm lỗ là quy luật hình học, rail dẫn liên tục qua cả mười nhóm. PDF trang 2 chỉ rõ một dải 50 điểm liên thông, lặp lại bốn lần. Cả dấu `+` và `-` chỉ là nhãn rail, điện thế đến từ dây nối.
- Mỗi cột có hai dải dẫn độc lập gồm `a…e` và `f…j`. Điện chỉ đi sang cột khác, nửa kia, hoặc rail khác khi có dây hay phần tử mạch định nghĩa đường nối. 239 có **130 dải độc lập**, 65 có **34 dải độc lập** khi để trống. Khe giữa rail và cụm lỗ giữa không có đường nối ngầm.

## Tích hợp và lưu dự án

- Dùng đúng hai ID kho hiện có. Khi lắp, lưu ID biến thể `adafruit-239-r2c-1` hoặc `adafruit-65-r2c-1` trong `CircuitDocV2.breadboards[].spec`, giữ `bb1` và mã lỗ `bb1:<cột><hàng>`, `bb1:<rail>:<lỗ>`. Giữ nguyên `partId/pinId` ở đầu linh kiện. Một hồ sơ thông số dùng chung cho số lỗ, tọa độ, kiểm đặt, tạo net, sơ đồ 2D và cảnh 3D. Mỗi bản nháp vẫn có tối đa một breadboard.
- `400-30` giữ hình học, cách đánh số và `railSplit` đang dùng. Với hai mẫu R2C, cấu hình rail cố định theo biến thể và đặt `railSplit=false`. Phát hiện dữ liệu sai thay vì ánh xạ lỗ ảo. Khi chọn mẫu khác cho bản nháp đã có chân hoặc dây gắn vào bảng, giữ bản nháp bằng luồng sao lưu/mở mạch mới hiện có, vì thay biến thể có thể đổi nghĩa endpoint. Dữ liệu tiếp tục lưu cục bộ.
- Kho có sơ đồ lỗ 2D, chọn lỗ bằng chuột/bàn phím, xoay và chọn cùng lỗ trên 3D. Footprint KiCad tải được ghi đường bao và tâm các lỗ trên lớp bản vẽ cơ khí. Footprint dùng để tham chiếu kích thước và vị trí, không khai báo pad đồng hoặc lỗ khoan cho sản xuất PCB. Mạch mẫu dùng mô hình ảnh/3D do dự án dựng từ thông số, tệp hãng chỉ làm bằng chứng nghiên cứu.
- Trên bàn, chọn lỗ và xem dải nối khi chuyển 2D/3D. Bài đo thông mạch ảo dùng hai đầu dò khi bảng không cấp điện và phân biệt cùng net, hở và lỗ không có trên mẫu. Ngspice và AVR8js nhận đường nối theo đồ thị của mạch đang lắp trong phạm vi các model đã hỗ trợ. Model breadboard R2C dùng kết nối lý tưởng, không tính điện trở tiếp xúc, điện dung ký sinh, dòng định mức hoặc hư hỏng.

## Nghiệm thu local

| Ca thử | Điều kiện đạt |
| --- | --- |
| 239 · lỗ và rail | Đếm đúng 830 lỗ và 130 dải. Kiểm cột 1/63, khe e–f và bốn rail. Trong cùng rail, lỗ 1, 25, 26 và 50 cùng net. Hai rail cùng dấu ở hai bên vẫn tách. Thêm và tháo jumper giữa hai rail để kiểm kết quả đổi đúng. |
| 65 · lỗ và khe | Đếm đúng 170 lỗ và 34 dải. Kiểm cột 1/17, mỗi bên của khe, từ chối cột 18 và mọi đầu rail. Đặt IC DIP-8 và DIP-16 qua khe ở hướng 0° và 180°. Cảnh 2D, 3D và footprint khớp tâm chân. |
| 239 · firmware Uno trên bảng | Dùng HEX Blink đã duyệt, đi tín hiệu qua các lỗ cùng dải và linh kiện R1 trên breadboard. Chứng minh LED đổi trạng thái khi có đường đủ đến rail, rồi ngắt khi tháo jumper nối hai rail riêng. |
| 65 · mạch DC qua khe | Nguồn lý tưởng 5 V, điện trở 1 kΩ và diode 1N4148 R1 mắc thuận qua các dải lỗ. Kiểm khe hở khi thiếu jumper, và khi nối đúng đo sụt áp diode 0,60–0,72 V ở 25 °C bằng ngspice. |
| R2C · trải nghiệm local | Kiểm Chrome mỗi mẫu ở desktop và 390 px, các lỗ đầu/cuối, dấu rail đúng, xoay 3D, tải footprint đúng biến thể, lập và tải lại nháp, xuất/nhập, từ chối lỗ sai và giữ nguyên mạch cũ khi đổi biến thể. Đối chiếu toàn bộ tâm lỗ giữa dữ liệu, 2D, 3D và footprint. |
| Hồi quy R1/R2A/R2B | Chạy các suite catalog, bàn tự do, sơ đồ, bố trí, lưu/khôi phục, mô phỏng độc lập và mạch nối AVR8js/ngspice. Chạy Chrome các spec R1/R2A/R2B và `npm.cmd run build:public` ở local. |

## Nguồn khóa

Bốn tệp công khai được đọc ngày 26/11/2026. Bản lưu nghiên cứu nằm trong [thư mục nguồn R2C](downloads/2026-11-26-catalog-r2c/). Hash của PDF và ảnh giữ nguyên theo byte tải.

| Tệp | Nhà phát hành | SHA-256 |
| --- | --- | --- |
| `adafruit-239-c49.pdf` | Cixi Zhongyi Electronics · ZYJ-102 · 29/08/2012 | `77BD40293E7B0555B4612FC38FC4C34D94D914022BF978770C671B7BC2770E10` |
| `adafruit-65-c212.pdf` | Cixi Zhongyi Electronics · ZY-170 · 29/08/2012 | `E188DEBBB081A5296600A078087A1D34CF4C87A63949C3AD7A60B9F495CF0BB6` |
| `adafruit-239-top.jpg` | Adafruit · ảnh mặt trên PID 239 | `E9ACD0D80E35CAA8BFBB7BA9D1D9ABA23ADED461B3559180FB95A447D0496FE0` |
| `adafruit-65-top.jpg` | Adafruit · ảnh mặt trên PID 65 | `F4F3CBDBBA1AABE5A050AE644DEDE9898D6E638B250510D7DFCD7875DBAC5B9B` |

Hồ sơ này chờ duyệt SHA-256 của đúng tệp. Phạm vi duyệt gồm hình học tham chiếu, mô hình nối điện và bộ kiểm local cho hai mẫu.

