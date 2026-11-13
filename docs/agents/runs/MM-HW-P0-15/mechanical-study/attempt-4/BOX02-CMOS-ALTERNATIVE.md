Native chat: 01a1a854-2163-70f2-a167-db281ef2ad08
Turn: 01a1c83a-53f6-72f2-a944-ae324df84be5

**ADG4612 có thể giảm mạnh dòng điều khiển, nhưng chưa đủ điều kiện thay bank PhotoMOS trên rail 5 V hiện tại.** Datasheet bao phủ tap âm và trạng thái mất nguồn. Hai khoảng thiếu quyết định là truyền chính xác tap 5,4 V khi rail còn 4,75 V và leakage trong quá trình rail sụp.

| Điều kiện | Cận từ datasheet ADG4612 Rev. 0 | Hệ quả với P0-15 |
|---|---|---|
| RUN, nguồn đơn 5 V | Miền tín hiệu từ −5,5 V đến \(V_{DD}\). \(R_{\rm ON}\) MAX 17 Ω ở \(V_{DD}=4,5\) V, với tín hiệu 0–4,5 V | Tap âm −1,8 V nằm trong miền tín hiệu. Tap 5,4 V vượt miền truyền bình thường khi rail 4,75 V. Cận 17 Ω cũng chưa bao phủ toàn miền tap. |
| Mất nguồn | Isolation mode khi \(V_{DD}\) floating hoặc ≤1 V. Miền tín hiệu isolation −5,5…+16 V, với tổng chênh áp trên thiết bị ≤16 V | Bao phủ tap âm trong miền nghiên cứu khi đã vào isolation. Datasheet chưa cho cận leakage xuyên vùng sụp nguồn từ dưới 2,7 V đến trên 1 V. |
| Leakage khi mất nguồn | ±3 µA MAX ở −40…85°C, với \(V_{DD},V_{SS}=0\) hoặc floating và hai đầu thử ở 1 V/16 V | Điều kiện thử này chưa tạo cận OFF tổng cho các cặp điện áp tap thực, đặc biệt khi một đầu âm. |
| Điều khiển | HIGH ≥2,0 V, LOW ≤0,8 V | AON 1,8 V cần tầng dịch mức có trạng thái OFF xác định khi mất bias. |

[Analog Devices ADG4612, tr. 7–8, 17](https://www.analog.com/media/en/technical-documentation/data-sheets/ADG4612_4613.pdf)

Về số lượng, sáu sense với hai break cần **bốn ADG4612**, hai package mỗi bank. Phương án 12 sense với hai break cần sáu package. Tại điều kiện bảng \(V_{DD}=5,5\) V, sáu package và 24 input HIGH có tổng cận tính từ \(6×165\,µA+24×18\,µA=\mathbf{1,422\,mA}\), chưa gồm driver. Đây là mức dòng điều khiển đáng kể so với ngân sách LED cũ, nhưng lợi ích đó chỉ dùng được sau khi khép miền tín hiệu và mất nguồn. [Analog Devices, tr. 7–8](https://www.analog.com/media/en/technical-documentation/data-sheets/ADG4612_4613.pdf)

**Một kênh UV với tám đường biên floating cũng chưa đủ.** Tám đường biên giúp chứa một switch kẹt dẫn trong OFF nếu bảy đường còn lại mở. Trong RUN, nếu sense H của cell yếu bị nối nhầm sang tap liền trên, đường dây vẫn có trở thấp và comparator vẫn có thể đổi trạng thái đúng khi self-test. Cả continuity lẫn self-test comparator có thể pass trong khi phép đo dùng sai tap.

Điều kiện kỹ thuật để mở lại hướng CMOS là **miền truyền có cận bao phủ tap dương 5,4 V và tap âm −1,8 V, cùng cận cách ly khi nguồn sụp**. Nếu chọn giảm áp trước switch để đưa tap vào miền hợp lệ, mạng giảm áp phải được tính vào dòng xả sau trip và sai số UV. Với rail, bias và cutoff hiện có, kết quả audit là **no-go cho thay trực tiếp**.
