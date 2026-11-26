# Cấu hình đề xuất MM-CATALOG-FIDELITY-R1

Ngày 25/11/2026. Phạm vi tổng thể gồm 80 hồ sơ tra cứu mới ở kho linh kiện Mạch Mở. Phiên bản này xin duyệt 8 biến thể cụ thể để triển khai và thử trong bản local. Căn cứ danh mục là `src/data/expandedComponentCatalog.ts` SHA-256 `94D0617E0404837B760172C87A278B7BA65B093AF03B2710310FE1A0FE1804FC`, trong worktree có nền `dfade3b1ecaeb92a8eaa4f8a346ddbca3331c2c6` cùng thay đổi kho đang làm.

## Kết quả mong muốn

Mỗi hồ sơ hỗ trợ hiển thị mã đặt hàng và package, có ký hiệu chọn được chân, footprint thấy số pad, mô hình 3D xoay được và bài thử điện phù hợp. Khi chọn cùng linh kiện ở bàn lắp mạch, số chân, pad và điểm chọn trong 3D cùng tham chiếu tới một định danh. Hồ sơ ghi rõ loại mô phỏng, dải điều kiện đã kiểm và bằng chứng tương ứng.

Tận dụng registry linh kiện, manifest mesh, mô hình số, bộ giải ngspice và các luồng học đang có. Khóa biến thể bằng mã định danh và revision. Dây giữ cặp `partId/pinId`. Mạch cũ mở theo phiên bản đã lưu. Đổi biến thể là thao tác có kiểm tra tương thích và hiển thị kết nối cần sửa.

Đích nghiệm thu cho R1 gồm CAT-04 và CAT-05 ở D3, EDA-03 và WRK-06 ở D3 trong phạm vi 8 biến thể. CAT-08, SIM-02, SIM-03, SIM-05 và SIM-06 áp dụng theo các thí nghiệm bên dưới. Các mức này là đích của phạm vi đề xuất. Cần bằng chứng chạy thử riêng để xác nhận trạng thái sản phẩm.

## Biến thể đề xuất cho R1

| ID catalog | Nhà sản xuất, mã đặt hàng | Package và cách đặt | Mô phỏng cần nghiệm thu | Nguồn |
|---|---|---|---|---|
| sn74hc08 | Texas Instruments SN74HC08N | PDIP-14 N, qua khe breadboard hoặc footprint DIP14 | Mô hình số của cả bốn cổng AND. Kiểm bốn tổ hợp và kiểm thiếu nguồn hoặc đầu vào chưa xác định. | [Mã đặt hàng](https://www.ti.com/product/SN74HC08/part-details/SN74HC08N), [SCLS081J](https://www.ti.com/lit/ds/symlink/sn74hc08.pdf) |
| sn74hc14 | Texas Instruments SN74HC14N | PDIP-14 N, qua khe breadboard hoặc footprint DIP14 | Cả sáu cổng đảo Schmitt. Đưa mẫu điện áp lên rồi xuống tại VCC 4,5 V và 25 °C. Kiểm trạng thái được giữ giữa hai ngưỡng, ghi rõ đường cong dùng ngưỡng điển hình hay giới hạn datasheet. | [Mã đặt hàng](https://www.ti.com/product/SN74HC14/part-details/SN74HC14N), [SCLS085L](https://www.ti.com/lit/ds/symlink/sn74hc14.pdf) |
| sn74hc74 | Texas Instruments SN74HC74N | PDIP-14 N, qua khe breadboard hoặc footprint DIP14 | Hai flip-flop D cạnh lên, ngõ ra thuận và đảo, preset/clear bất đồng bộ. Kiểm trường hợp kích đồng thời và điều kiện ngoài bảng chức năng. | [Mã đặt hàng](https://www.ti.com/product/SN74HC74/part-details/SN74HC74N), [SCLS094F](https://www.ti.com/lit/ds/symlink/sn74hc74.pdf) |
| sn74hc595 | Texas Instruments SN74HC595N | PDIP-16 N, qua khe breadboard hoặc footprint DIP16 | Dịch 8 bit và chốt với hai clock, reset thanh ghi dịch, đầu ra nối tiếp và ngõ ra ba trạng thái. Kiểm đưa 0x96 vào, xác nhận thứ tự bit, cập nhật khi chốt và giữ dữ liệu khi tắt ngõ ra. | [Mã đặt hàng](https://www.ti.com/product/SN74HC595/part-details/SN74HC595N), [SCLS041J](https://www.ti.com/lit/ds/symlink/sn74hc595.pdf) |
| 1n4148 | Vishay 1N4148-TAP | DO-35, uốn lắp ngang bước 7,62 mm, footprint DO35 | ngspice DC ở 25 °C. Kiểm đường thuận tại 1, 5, 10 mA và dòng rò với phân cực ngược 20 V. Đối chiếu đường điển hình và giới hạn công bố tại điều kiện tương ứng. | [81857 Rev. 1.6](https://www.vishay.com/docs/81857/1n4148.pdf) |
| 2n3904 | onsemi 2N3904BU | TO-92-3 LF chân thẳng, footprint TO92 | ngspice DC ở 25 °C. Kiểm ngắt, vùng khuếch đại và bão hòa theo các điểm dòng base, dòng collector và điện áp trong bảng của hãng. | [2N3904/D Rev. 3, bảng Ordering Information](https://www.onsemi.com/download/data-sheet/pdf/2n3904-d.pdf) |
| tmp36 | Analog Devices TMP36GT9Z | TO-92 T-3-1 chân thẳng, footprint TO92 | Nguồn áp hành vi theo nhiệt độ, VCC 3,3 V và tải trở kháng cao. Kiểm tại 0, 25 và 75 °C theo hàm điển hình, hiển thị sai số công bố tách khỏi giá trị model. | [TMP35/TMP36/TMP37 Rev. H](https://www.analog.com/media/en/technical-documentation/data-sheets/tmp35_36_37.pdf) |
| mcp3008 | Microchip MCP3008-I/P | PDIP-16 300 mil, qua khe breadboard hoặc footprint DIP16 | SPI mode 0 tại 1 MHz, VDD và VREF 5 V. Kiểm hết tám kênh single-ended, đầu dải, nửa thang, cuối dải, reset khi nhả chọn chip và thứ tự bit. Bộ lượng tử 10 bit lý tưởng là phạm vi R1. | [DS20001295E, package và ordering](https://ww1.microchip.com/downloads/aemDocuments/documents/MSLD/ProductDocuments/DataSheets/MCP3004-MCP3008-Data-Sheet-DS20001295.pdf) |

Các model số sử dụng bảng chức năng và sự kiện có thời điểm. Các ngõ ra ba trạng thái và ngõ vào chưa xác định có trạng thái riêng. Phép kiểm Schmitt lấy mẫu điện áp đầu vào theo kịch bản. Phép thử ADC nhận điện áp và giao dịch SPI từ nguồn thử. Phạm vi chính xác của R1 là các phép kiểm nêu trên. Trễ lan truyền, nhiễu, nhiệt, phục hồi ngược, dung sai theo từng mẫu và ghép thời gian thực với firmware là các mức cần fixture riêng.

Model analog được chọn theo đúng linh kiện và điều kiện thử. Nếu nhà sản xuất có model đủ quyền sử dụng, ghi nguồn, phiên bản và kiểm lại với ngspice. Phương án đã dự kiến trong R1 là model hành vi do Mạch Mở xây từ dữ liệu hãng, ghi các điểm fit, vùng sai số và dùng ít nhất một điểm kiểm độc lập ngoài các điểm đã fit. Nếu dữ liệu chưa đủ để định lượng sai số, hồ sơ hiện trạng thái đang kiểm và chỉ cấp quyền sử dụng các lớp đã được kiểm chứng.

## Nguồn footprint và 3D cố định

KiCad 10.0.7 tại thư mục thư viện local `D:/StartupOS/.tools/kicad-10.0.7/share/kicad`. Đã kiểm đủ tám tệp nguồn. Các cặp sau là nguồn thiết kế lắp và hình dạng package tham chiếu. Khớp kích thước thân, mặt đặt, dấu định hướng và lead form với bản vẽ hãng trước khi bật liên kết tương tác. Dùng notice của thư viện cho bản dẫn xuất. [Giấy phép thư viện KiCad](https://www.kicad.org/libraries/license/)

| Mã cặp | Tên nguồn footprint và STEP tương ứng | SHA-256 footprint | SHA-256 STEP |
|---|---|---|---|
| DIP14 | `Package_DIP:DIP-14_W7.62mm` | `6e9fc056d23e88e219b9e20d58ff74e1d351ca9a77a7b3e6b633f5475d6040f1` | `3dae072a95c64bee0d1e58be8e75383639f5017ab982de1749d05808a4eed058` |
| DIP16 | `Package_DIP:DIP-16_W7.62mm` | `08cec2c2fafeffb19d0c6d17db37b67017e6518147516b0b75e6a4719b235465` | `17a30b1f0ab3fd5384a1231e3c63c394888d5b952c542a8c189e023ed3467464` |
| DO35 | `Diode_THT:D_DO-35_SOD27_P7.62mm_Horizontal` | `815fad98c36b0836240b8b93ae4ff4b6a6006c6f64b987f73e4faf078eedd8cd` | `9704292191fcb13b3dfc88c1e572df18313ac20023bb230486c878d8dddfdb54` |
| TO92 | `Package_TO_SOT_THT:TO-92_Inline` | `fc2e306a210a4f40c12f2af3cc09bf923761c9faadfeed9e6d331799a6bde77d` | `f0b61c32ecbf0067157adc5a3d4966ceadf5d6dafe93c51af35f76c41c71a54a` |

Hai mẫu TO-92 dùng chân thẳng. Trên breadboard, chức năng tự căn chỉ mở khi các chân thực sự khớp các lỗ tách điện, hoặc khi có biến thể đã duyệt với cách uốn/chuyển chân tương ứng. Kiểm DIP qua khe và thử chiều xoay 0°, 90°, 180°, 270°. Quy trình từ chối cách đặt có lead hoặc pad nằm sai hàng. Điều chỉnh đường kính lỗ, lead form hay mã đặt hàng cần hồ sơ sửa đổi.

## Điều kiện bắt đầu và nghiệm thu

- Bắt đầu dựng sau khi founder duyệt SHA-256 của chính hồ sơ này. Khóa revision datasheet sử dụng, kiểm tính tương thích hình học của 8 biến thể với cặp KiCad và ghi điều khoản tái sử dụng. Nếu dữ liệu mới buộc đổi package, footprint, mã đặt hàng hoặc miền điện đã chọn, tạo cấu hình mới để duyệt.
- Ký hiệu 2D lấy chức năng từ đúng datasheet, kể cả nguồn và chân không kết nối. Kiểm ánh xạ một cách độc lập với mesh, phát hiện trùng và thiếu chân/pad. Khi chọn chân ở 2D, footprint và 3D đều cho cùng net, cả sau khi xoay.
- Đối chiếu kích thước với giới hạn trong bản vẽ hãng theo đúng mặt chiếu và chuẩn đơn vị. Với phiên bản mesh đã căn, kiểm sai lệch hình chiếu tâm anchor so với tâm pad ≤ 0,05 mm. Ghi riêng độ phân giải mesh và độ dung sai cơ khí thực tế.
- Mỗi phép thử điện có đầu vào, tải, điều kiện môi trường, đầu ra, đơn vị, cửa sổ sai số và nguồn. Chạy trường hợp chuẩn và ca lỗi phù hợp. Ví dụ thiếu nguồn, input trôi, xung clock sai điều kiện, chọn SPI sai và đảo cực diode.
- Trên web local, kiểm hành trình kho → đúng biến thể → thêm vào bàn → nối dây → đổi giữa 2D/3D → chạy bài thử → lưu, tải lại và đối chiếu kết quả. Có kiểm riêng với draft đã có và trên màn hình laptop, điện thoại.
- Hiển thị riêng mức hình học, mức kết nối và miền hành vi. Kết quả mô phỏng được mô tả theo cấu hình thử. Việc kiểm với linh kiện thật và phát hành ra ngoài là các bước có hồ sơ riêng.
- Phạm vi cho phép của R1 sau khi duyệt là tích hợp local và kiểm thử trình duyệt. Giữ bộ giải ngspice và các cổng phát hành hiện có. Dùng tải và nguồn ảo thấp áp.

## Phạm vi 72 mục tiếp theo

Các đợt sau chọn mã đặt hàng, package, nguồn hình học và miền điện theo từng mục. Các breadboard cần đối chiếu topology nhóm lỗ và rail trên đúng SKU. IC chuyển mạch, driver và nguồn dùng thử nghiệm điện theo điểm làm việc và giới hạn tải, có mốc kiểm riêng cho ripple, quá độ và nhiệt khi đủ dữ liệu. Cảm biến cần đối chiếu điều kiện kích thích và giao tiếp. Bảng dưới gắn phạm vi với danh mục hiện tại.

| Đợt | Nhóm | Số mục | ID |
|---|---|---:|---|
| R2 dự kiến | Logic, giao tiếp, bộ nhớ, ADC và breadboard | 28 | `sn74hc02`, `sn74hc04`, `sn74hc32`, `sn74hc86`, `sn74hc125`, `sn74hc126`, `sn74hc138`, `sn74hc139`, `sn74hc151`, `sn74hc153`, `sn74hc157`, `sn74hc165`, `sn74hc164`, `sn74hc245`, `cd4051b`, `cd74hc4067`, `pcf8574`, `mcp23017`, `24lc256`, `mcp4921`, `ads1115`, `tca9548a`, `lm358`, `lm393`, `sn65hvd230`, `max3232`, `breadboard-adafruit-239`, `breadboard-adafruit-65` |
| R3 dự kiến | Diode, transistor và nguồn | 19 | `lm7805`, `lm317`, `tl431`, `lm2596`, `lm2577`, `tps61023`, `lm1117`, `tps5430`, `tps62160`, `bq24074`, `ref5025`, `lm4040`, `1n4007`, `1n5819`, `1n4733a`, `2n3906`, `tip120`, `irlz44n`, `2n7000` |
| R4 dự kiến | Cảm biến và hiển thị | 15 | `ds18b20`, `tmp102`, `tmp117`, `hdc1080`, `opt3001`, `bme280`, `ds3231`, `adxl345`, `vl53l0x`, `lis3dh`, `max6951`, `tlc5940`, `tlc5928`, `tlc59116`, `tlc5916` |
| R5 dự kiến | Cơ điện và âm thanh | 10 | `lm386`, `max98357a`, `tpa2012d2`, `ne5532`, `l293d`, `drv8833`, `drv8825`, `uln2003a`, `uln2803a`, `drv8871` |

