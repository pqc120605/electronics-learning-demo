# Nghiệm thu local R3 · Nguồn và bán dẫn

Ngày 26/11/2026. Triển khai theo [MM-CATALOG-FIDELITY-R3-1](2026-11-26-catalog-fidelity-r3-proposal.md) đã duyệt, SHA-256 `60DB39DBFD91EBDB56032615A8B9AFB0974626B4E8F57F0B06577345F94EED81`.

## 2D, 3D và footprint

- Đủ 19 mã trong kho và bàn tự do. Dữ liệu chân theo đúng mã đặt hàng và được dùng chung cho sơ đồ, vùng chọn pad và điểm đánh dấu trên GLB. Linh kiện tạo mới dùng ID `-r3`. Bản nháp giữ `partId/pinId` và còn lưu trong trình duyệt.
- Đã đối chiếu hash nguồn, xuất 11 GLB, 11 ảnh xem nhanh và 11 footprint. KiCad 10.0.7 đọc được cả 11 footprint. Kiểm tiếp điểm kim loại SMD tại mặt lắp và kiểm tâm chân xuyên lỗ. Sai lệch lớn nhất của chân xuyên lỗ là **0,05 mm**, ở TO-220-5 NDH.
- SOT223 có hai vùng đồng cùng số 2. PowerPAD DDA có bốn vùng đồng cùng số 9. STEP KiCad DDA thiếu mặt kim loại lộ nên GLB bổ sung mặt **2,41 × 3,10 mm** theo footprint đã khóa. Giữ nguyên STEP nguồn và footprint tải xuống. WSON dùng STEP generic có cùng thân và exposed pad như hồ sơ.
- TO-220-3 và DO-41 đi qua kiểm đặt breadboard để các chân không chung một dải dẫn. TO-92 bước 1,27 mm, NDH và các package SMD được nối dây ngoài breadboard. Hình học là tham chiếu package dùng cho bài học. Dung sai lắp ráp thực tế cần phép đo trên mẫu.

## Mô phỏng

| Nhóm | Mã kiểm | Phép thử local |
| --- | --- | --- |
| Ổn áp và tham chiếu | L7805CV, LM317T/NOPB, TL431AILP, LM1117MPX-3.3/NOPB, REF5025IDR, LM4040A25IDBZR | Điểm làm việc DC có tải. Thử thiếu dự trữ điện áp, thay tỉ lệ đặt áp, thiếu ADJ hoặc dòng phân cực. |
| Chuyển đổi nguồn | LM2596T-5.0/NOPB, LM2577T-ADJ/LF03, TPS61023DRLR, TPS5430DDAR, TPS62160DSGR | Điện áp ra, hồi tiếp, an toàn miền tải của mô hình và cân bằng công suất theo hệ số hiệu suất đã công bố trong bài. Kiểm ngắt, ngõ PG, thiếu hồi tiếp, thiếu EP và đường SW/PH. |
| Sạc | BQ24074RGTR | Chia dòng USB500 giữa tải hệ thống và pin ảo. Chạy CC, CV, kết thúc, /CE, /CHG và /PGOOD. Kiểm mất một trong hai pad BAT. |
| Diode | 1N4007-E3/54, 1N5819-E3/54, 1N4733A-TAP | Điện áp thuận, dòng rò ngược và điện áp Zener ở dòng thử 49 mA. |
| Transistor | 2N3906G, TIP120G, IRLZ44NPBF, 2N7000-G | Đo dẫn, ngắt, sụt áp và đường diode thân ở hai MOSFET. |

Tất cả 50 điểm làm việc của 19 mã chạy bằng ngspice ở 25 °C từ cùng đồ thị mạch dùng trên bàn tự do. Ca ghép L7805 → 1N5819 → tải 100 Ω qua Adafruit 65 kiểm điện áp có tải khi có jumper và mất điện áp tải khi tháo jumper. Mô hình nguồn xung tính điểm DC trung bình, không mô phỏng ripple, dạng sóng nút chuyển mạch hay nhiệt. Mô hình sạc dùng pin ảo, không tính hóa học hoặc tuổi thọ cell.

## Kiểm thử Node và build

- 23 ca R3 và 217 ca hồi quy liên quan đạt. Tổng **240/240** gồm R1/R2A/R2B/R2C, kho, bàn tự do, ngspice, nháp và các ca firmware có sẵn. Sau khi đưa nút phân tích DC ra bàn R3, chạy lại đủ 23 ca R3 và build local thành công.
- `npm.cmd run build:public` đạt trên local, bao gồm kiểm phân phối ngspice và TypeScript của build. Build còn cảnh báo Vite từ `rp2040js` và dynamic import của `builderLessons.ts`.
- Lượt chạy `npm.cmd test` rộng hơn thực hiện trước lượt hồi quy cuối ghi nhận cả lỗi môi trường ngoài R3. Toolchain trong sandbox thiếu Arduino AVR core và một số ca HTTP local bị `EACCES` ở loopback. Hai ca bất biến catalog/mesh phát hiện thiếu phân loại phần tử ảo đã được sửa và chạy lại đạt trong bộ 240 ca.

## Kiểm thử trình duyệt

- **20/20 ca R3 đạt trên bản build cuối.** Mỗi mã kiểm đúng mã đặt hàng, chọn cùng chân qua 2D và footprint, tải footprint, xoay 3D, chạy ngspice trong dải đã chốt và lắp vào bàn. Bốn mã được kiểm ở 390 px. Ca BQ24074 riêng kiểm lưu bản cũ khi mở mẫu, mở lại nháp với dây nguyên vẹn, và chạy solver từ mạch đang lắp. Nút phân tích DC đặt ngay trên bàn R3 để mạch analog dùng được khi chưa chọn board.
- **42/42 ca hồi quy Chromium R1/R2A/R2B/R2C đạt qua hai lượt.** Lượt đầu đạt 31 ca. Lượt chạy lại tuần tự đạt cả 11 ca còn lại. Các ca chạm ngưỡng chờ lúc khởi động R3 được chạy lại trong một phiên trình duyệt để tái sử dụng ứng dụng đã tải.

## Bản local

- [Kho linh kiện bắt đầu ở L7805CV](http://127.0.0.1:5226/components?component=lm7805)
- [BQ24074 trong kho](http://127.0.0.1:5226/components?component=bq24074)
- [Bài đo BQ24074](http://127.0.0.1:5226/tools/spice?lab=r3-bq24074)
