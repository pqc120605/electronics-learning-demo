# EVT0 r14 · Hồ sơ rà tiếp trước B1

## Snapshot

| Tệp từ thư mục sản phẩm | SHA-256 |
|---|---|
| `docs/mission-control/hardware-config-mobot-v2-typec-r14-handset.json` | `2093df3a02a78caf26500a02ab118da21c401383f8e752fb1a67c00fe1d5f4bf` |
| `docs/hardware/mobot-v2-handset-r14-closure.md` | `438004a5734ea4a3ec9e86c20eb0c2d8d0b7d0aecb0d9fe27a411cbf9db97071` |

[Disposition r13](EVT0-R13-DISPOSITION.md) là đầu vào. r14 giữ F1–F5, sửa mục UVLO còn PCM Jauch, bổ sung bảng giao diện B01, bảng trạng thái VBUS, phân bổ dòng/sụt áp và hai hướng xử lý cell yếu. Registry đăng ký r14 `proposed` đúng hash. r13 giữ nguyên bytes đã review.

## Đối chiếu USB-IF Release 2.5

Đọc trực tiếp PDF `USB Type-C Spec R2.5 - March 2026.pdf` từ ZIP USB-IF ngày 08/04/2026, SHA-256 PDF `6636cd61387a2f78b0fa96c8ea86ccc0f39ec59f98821cdb57b206d31445a328`. [USB-IF Release 2.5](https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25)

| Điều khoản | Kết quả áp vào r14 |
|---|---|
| §3.4.3, trang 84 | Cáp liền giữ cách bố trí dây theo bảng cáp chuẩn, thay một đầu bằng kết nối vào sản phẩm. CC phải kết thúc theo chức năng của sản phẩm. Dây CC truy xuất được là điều kiện cần. Cần đối chiếu cấu tạo cáp định dùng với bảng 3-11, gồm vai trò D+/D−, shield và GND, trước khi chốt cáp. |
| §4.4.2, bảng 4-2, trang 152 | VBUS chưa cấp trước attach và trở về không cấp khi detach. Source-only khi không cấp VBUS có yêu cầu trở kháng rò tối thiểu 72,4 kΩ và điện dung tối đa 3.000 µF ở mặt chuẩn bảng. Nhánh xả khoảng 1 kΩ chỉ được kích có điều kiện rồi tắt. Tổng trở trong trạng thái unattached phải tính cả sense và mọi đường rò. |
| §4.6.2.1, trang 226 | 500 mA của Default cho USB 2.0 là mức khi đã cấu hình high-power. Trường hợp thiết bị chỉ nhận nguồn PSD có điều kiện riêng, trong đó không có chức năng truyền thông USB. B01 có bridge CH340 và chưa có bằng chứng thuộc trường hợp PSD. Cáp RUN chỉ cấp điện và quảng bá Default chưa đủ để suy B01 được lấy 500 mA liên tục. Cần giải quyết phân loại và chế độ trước khi khóa. |
| Bảng 4-32, trang 247 | Từ Attached.SRC đến mức VBUS tối thiểu tối đa 275 ms. Từ detach đến vSafe0V tối đa 650 ms. Bảng còn có mốc chuẩn bị cho phép bật lại tBulkDischarge tối đa 275 ms khi VBUS ≤21 V. Mô hình RC 204,82 ms chưa gồm phát hiện detach, thời gian mở switch, giữ bias và xác minh trước khi bật lại. |

Điều kiện gỡ C5/C8 gồm một mốc nguồn đúng chuẩn cho chức năng của B01. Nếu đường Default không có chứng cứ, so sánh định mức thực của nguồn 3 AA với mức quảng bá khác và giữ B1 chờ nếu chưa có phương án đạt. Giới hạn dòng phần cứng và mức dòng quảng bá phải được kiểm riêng.

## Ứng viên bổ sung sau khi đóng băng snapshot

- **Box 02, C7.** STUSB1600A có cửa sổ vSafe0V 0,5–0,7 V theo điều kiện hãng. Mặc định xuất xưởng DRP, 1,5 A và bật xả. Chỉ xem xét Source-only nếu chứng minh đúng cấu hình trước khi nối CC ra cáp và từ chối debug accessory. Hai tầng thường hở PhotoMOS AQZ202G độc lập có cận rò 10 µA MAX tại 25 °C và cận tắt 3 ms theo điều kiện thử hãng. Thiếu cận rò/tắt ở nhiệt độ và tải EVT0. [STUSB1600 Rev. 4](https://www.st.com/resource/en/datasheet/stusb1600.pdf), [Panasonic AQZ202G](https://mediap.industry.panasonic.eu/assets/download-files/import/semi_eng_pwr1a_aqz20.pdf)
- **Box 02, C7/C8.** Ca hai nguồn 5,19/5,10 V và vòng 0,20 Ω cho 450 mA ngược theo mô hình nguồn cứng. Chênh 90 mV chưa tới ngưỡng 95–190 mV của TPS2553-1, nên cận trễ 7 ms của IC không áp dụng. Thêm điện trở để giới hạn bước 5,5 V ở 12 A cần ít nhất 458 mΩ, vượt toàn bộ ngân sách 394 mΩ. Vẫn cần cận dòng đỉnh, điện lượng và cơ chế ngắt độc lập cho vùng hai nguồn gần bằng áp. Với thêm 20 mA cấp LED cho hai PhotoMOS và giả định hiệu suất 75%, dòng vào boost tăng lên khoảng 1,618 A. Còn 92,7 mΩ từ cực pack tới boost trong ngân sách 150 mV. [TI TPS2553-1 Rev. F](https://www.ti.com/lit/ds/symlink/tps2553-1.pdf)
- **Box 02, C9.** Xét comparator vi sai có suy hao cho từng cell. TLV9034 là ứng viên sàng lọc với offset quy về cell khoảng ±4 mV tại điều kiện nêu, chưa gồm reference, sai số điện trở hoặc common-mode. Sau khi phân bổ 15 mV cho bước sụt và sai số khác, biên động thấp còn khoảng 17,4 mV, tương đương 348 µs ở độ dốc minh họa 50 mV/ms. Cận IC tại overdrive 20% không bao phủ tình huống gần ngưỡng. [TI TLV9034](https://www.ti.com/lit/ds/symlink/tlv9034.pdf), [TI TPS3760](https://www.ti.com/lit/ds/symlink/tps3760.pdf)
- **Box 03, cơ khí/BOM.** Ba khay đơn Keystone 2460 có thể bố trí nối tiếp và lấy hai tap, diện tích tham chiếu 57 × 50,7 mm trước khe lắp. Chưa có cận sụt áp/nhiệt ở dòng EVT0. Molex 1054440011 có A5/B5 truy xuất được, là đầu cắm rời cần thiết kế cáp/vỏ/chống kéo. Chưa có cụm cáp hoàn chỉnh được xác nhận. [Keystone, tr. 32](https://beta.keyelco.com/userAssets/file/M70p23-33.pdf), [Molex bản vẽ C2](https://www.molex.com/content/dam/molex/molex-dot-com/products/automated/en-us/salesdrawingpdf/105/105444/1054440001_sd.pdf)
- **Box 03, tải 3V3.** Hai joystick C&K THB001P có danh định 10 kΩ ±20%. Dùng 8 kΩ/trục cho tổng 5,01 mA ở 3,6 V cùng tám pull-up ≥9,9 kΩ. Nếu áp thêm 20% trôi điện trở theo tiêu chí vòng đời của tài liệu, dùng 6,4 kΩ/trục và tổng 5,72 mA. Các cận thay cho giả định 9 kΩ trong hồ sơ r14 nếu ứng viên được chọn. [Littelfuse/C&K THB](https://www.littelfuse.com/assetdocs/littelfuse-ck-rotary-thb-series-datasheet?assetguid=e3458825-585e-4962-9461-54efaec08a2f)
- **Box 03, giá.** 15,22 USD giá lẻ tham chiếu cho ba khay, hai joystick và đầu cắm. Tại tỷ giá kịch bản 26.000 đ/USD, khoảng 395.720 đ, còn dưới 604.280 đ cho các hạng mục khác của cả bộ. Chưa có giá tới tay, giá robot, pin/sạc, PCB, nguồn và vỏ. [Khay](https://www.digikey.com/en/products/detail/keystone-electronics/2460/280629), [joystick](https://www.digikey.com/en/products/detail/c-k/THB001P/11687191), [đầu cắm](https://www.digikey.com/en/products/detail/molex/1054440011/6173183)

## Kiểm tra HQ

| Lệnh | Kết quả |
|---|---|
| `node ../docs/agents/validate.mjs` | Exit 0, 61 task, 143 capability, `errors=[]`, `warnings=[]`. |
| `node --test ../docs/agents/validate.test.mjs` | Exit 0, 61/61. |
| `node ../docs/agents/validate.mjs --dispatch-task MM-HW-MOBOT-REMOTE-KICAD-001` | Exit 1, `dispatch_eligible: false`. B1 `waiting`, chưa có authorization builder hoặc lease. |

Bốn cổng schematic vẫn OPEN. Mọi phép đo `NOT_RUN`. Hồ sơ này phục vụ phản biện và chọn phương án để hoàn tất, chưa là hồ sơ đóng cổng.

## Phạm vi cần chốt nếu đổi đường tới B1

Với 3 AA trên carrier, cần chọn cách cấp điện phù hợp với B01 ở RUN, chứng minh dòng tương ứng ở đầu cáp, hoàn tất I/Q khi cắm nhầm và ca cell yếu. Nếu chọn mức quảng bá 1,5 A, phép tính 5,253 V / 3,0 V ở hiệu suất giả định 85% cho khoảng 3,09 A đầu vào boost trước các tải phụ. TPS2553-1 ở điểm sàng lọc 43,2 kΩ và ngân sách holder/PTC hiện tại không thể dùng cho mức đó. Phải định mức lại cả đường.

Nếu Founder muốn tách B1 khỏi khối nguồn 3 AA, có thể lập một đề xuất **carrier thụ động, cấp điện B01 bằng nguồn USB-C thương mại bên ngoài** cho EVT0. Hướng này thay phạm vi F2 của B1. Khảo sát 3 AA tiếp tục riêng, không ghim kết quả của một hướng sang hướng kia. Cấu hình B1 mới vẫn cần đúng model nguồn/cáp, tài liệu chế độ 5 V, điều kiện không tự tắt ở tải B01, dự toán cả bộ, review đúng bytes, hash và lease riêng.

P15ZM là một mốc khảo sát cho phương án ngoài, vì hãng công bố đầu ra cáp tích hợp 5 V/3 A và kích thước 105,2 × 26,9 × 65,2 mm. Giá niêm yết tham chiếu 450.000 đ để lại dưới 550.000 đ cho phần còn lại của cả bộ. Chưa có kết quả tương thích B01, chứng cứ rằng 3 A là mức quảng bá không PD trong cấu hình dự kiến, hay dự toán đủ. [Thông số Xiaomi](https://www.mi.com/vn/product/xiaomi-power-bank-10000mah-integrated-cable/specs/), [Giá tham chiếu Mi Home](https://mihome.vn/pin-sac-du-phong-xiaomi-10000mah-22-5w-pocket-p15zm.html)

## Kết quả Box 08 trên r14

Box 08 xác minh hai hash và trả `changes_requested` trong turn `01a1c98b-7d39-77e3-aafa-c994027e17e8`. Box 08 đối chiếu các datasheet hãng và trang phát hành USB-IF, dùng trích dẫn Release 2.5 do HQ đọc từ PDF chính thức. Bốn cổng tiếp tục OPEN.

- **C3/C5.** Thiếu cụm cáp truy xuất đầy đủ, cấu hình Source-only có hiệu lực trước khi đưa CC ra cáp và cận xả VBUS cả khi mất bias. Cùng mô hình RC mất 204,82 ms tới 0,8 V và 255,88 ms tới 0,5 V. Khi cần đạt 0,5 V trong tBulkDischarge 275 ms, chỉ còn khoảng 19 ms cho các pha khác. Xác định lại ngưỡng và mốc đúng theo cấu hình cuối.
- **C7/C8.** Box 08 tái lập ca 450 mA dưới ngưỡng đảo áp của TPS2553-1 và cận 458 mΩ vượt ngân sách thuận. Cần giới hạn dòng đỉnh và điện lượng theo cả hai chiều trong ca lỗi đã nêu. Nhánh 500 mA cần bằng chứng chế độ USB của đúng B01. Nhánh 1,5 A đòi khoảng 3,09–3,50 A tại đầu boost với hiệu suất sàng lọc 85–75%, trước tải phụ.
- **C9.** Box 08 tái lập cận UVLO tĩnh r14. Đính chính phản ví dụ trong snapshot để dùng ở revision sau. Tổng 3,18 V thấp hơn cận dưới 3,18242 V. Ca giả định 1,62 + 1,62 − 0,02 = 3,22 V cho thấy pack-only có thể chưa ngắt ở corner thấp nếu hai cell còn lại đạt điện áp đó. Cần dữ liệu dưới tải đúng cell và bằng chứng giám sát từng cell, tap hở/chạm, trễ và duy trì trạng thái thử lại.
- **C1/C2/C10/C11.** Bảng giao diện đủ để tiếp tục phân bổ. Đính chính tải trong addendum Box 03. Với công thức đã ghi, tải là **4,71 mA** ở 8 kΩ/trục và **5,16 mA** ở 6,4 kΩ/trục, trước dự phòng. Khả năng cấp của 3V3 đúng PCBA và hành vi ADC vẫn chưa xác minh.

HQ rà lại nguồn công khai cho B01 30 chân Type-C CH340. Các bản pinout/listing chỉ nhận diện họ bo, không nối được schematic CC, VBUS, D+/D−, bridge và regulator với đúng PCBA mẫu. Hồ sơ không thể chốt chế độ RUN 500 mA từ các nguồn đó. Giữ nguyên bytes r14 đã review. Nếu duy trì 3 AA cho B1, đầu vào còn thiếu là bằng chứng đúng phiên bản B01 hoặc phương án USB khác có cận dòng. Nếu chọn B1 carrier thụ động với nguồn thương mại bên ngoài, cần xác nhận thay phạm vi B1 trước khi lập cấu hình mới.
