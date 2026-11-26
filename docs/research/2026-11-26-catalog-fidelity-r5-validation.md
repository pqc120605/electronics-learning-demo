# Nghiệm thu local R5 · Audio và driver tải

Ngày 26/11/2026. Revision **MM-CATALOG-FIDELITY-R5-1**, theo SHA-256 `73833C9605921928A9A37FDEDC3721ECA4A333B9779F7CCFD561137AB0613DCE`. Phạm vi CAT-04, CAT-05, EDA-03, SIM-02 và SIM-03. [Hồ sơ cấu hình đã duyệt](2026-11-26-catalog-fidelity-r5-proposal.md)

## Kho linh kiện, 2D, 3D và footprint

- Đã nối đủ 10 mã từ kho linh kiện tới sơ đồ 2D, footprint KiCad tải được, mô hình GLB xoay được và bài thử trên bàn tự do. Chọn chân giữ cùng định danh khi đổi cách xem. Kiểm desktop 1440 px và các ca đại diện ở 390 px.
- KiCad 10.0.7 đọc và xuất SVG cho **10/10 footprint**, gồm đồng, mask, paste, fab và silkscreen. Năm IC DIP qua khe breadboard. Năm IC SMD có pad chọn được trên bàn tự do.
- Đã đối chiếu hình học theo outline hãng và các nguồn KiCad ghim hash trong hồ sơ. Contact SMD nằm trên vùng đồng tương ứng, sai lệch tâm tiết diện so với tâm land tối đa 0,125 mm trong phép kiểm. Năm model DIP có tâm chân trùng tâm lỗ trong mặt cắt đo. GLB lớn nhất khoảng 90 KiB. [Manifest và SHA-256 từng asset](../../src/data/catalog-r5-packages.json)

## Kiểm từng mã R5

| Mã | Kết quả kiểm trên mạch đã nối |
| --- | --- |
| LM386N-1/NOPB | Ngspice WASM đo loa gần 0,10 V và 1,0 V đỉnh ở gain 20× và 200×. Biên độ bão hòa kiểm tại VOUT trước tụ ghép, xấp xỉ 2,2 V quanh mức bias. |
| MAX98357AETE+T | I²S stereo 16 bit có dấu, đổi kênh, trộn và tắt. Biên độ 0,500 V, 0,250 V và 0,125 V ở gain 9 dB. Kiểm thêm gain 6/12 dB, sai một nhịp DIN và mất clock. |
| TPA2012D2RTJR | Đủ gain 2×/4×/8×/16×. Ở 4× đo 0,400/0,300 V đỉnh và ở 8× đo 0,800/0,600 V. Đã kiểm tắt từng kênh, báo dây sai ở tải BTL. |
| NE5532P | Hai kênh ngspice WASM đo gần 1,0 V đỉnh ở gain 10× và 0,50 V ở gain 5×. Đã kiểm mất rail âm và mất hồi tiếp. Mô hình dùng cực trội để giải hồi tiếp quá độ ổn định. |
| L293DNE | Hai cầu H độc lập, thuận/ngược, phanh 00/11 và thả trôi khi EN thấp. Dòng khóa trục khoảng 0,283 A theo mô hình sụt áp, từ chối tải vượt miền 0,60 A. |
| DRV8833PWPR | Quay thuận/ngược, phanh, thả trôi, ngủ và thức. Dòng khóa trục khoảng 0,294 A với 0,68 Ω. Đổi điện trở của một cầu chỉ thay số đo cầu tương ứng. |
| DRV8825PWPR | Đủ full step, half step và 1/8 step. Home có dòng đặt khoảng 0,426 A mỗi pha. Kiểm đảo DIR, /HOME, /ENBL và /RESET. |
| ULN2003AN | Kiểm ánh xạ cả 7 kênh và tải RL của kênh đầu/cuối. Dòng khoảng 100 mA sau 6 ms, OUT kẹp khoảng 6,2 V khi ngắt. Rút COM báo hở đường hồi dòng. |
| ULN2803A | Kiểm ánh xạ 8 kênh và tải RL kênh đầu/cuối. Dòng khoảng 100 mA sau 6 ms, OUT kẹp khoảng 10,2 V khi ngắt. Rút COM báo hở đường hồi dòng. |
| DRV8871DDAR | Quay thuận/ngược, phanh, thả trôi, ngủ và thức. Dòng khóa trục khoảng 0,640 A ở RILIM 100 kΩ và 0,500 A ở 128 kΩ. Rút dây ILIM làm phép đo báo lỗi. |

**25/25 ca Node R5 đạt** và **15/15 ca Chromium trên build cuối đạt**. Các ca đo dùng net hiện có trên bàn. Mỗi mã có ca phát hiện mất dây. LM386 và DRV8871 qua lưu, mở lại, xuất tệp, tháo dây rồi nhập tệp để khôi phục. Test Node kiểm thêm `partId/pinId`, điểm gấp dây, schema và báo lỗi khi nối thêm thiết bị ngoài phạm vi mô hình R5. [Node R5](../../tests/catalog-r5.test.mjs) · [Chromium R5](../../e2e/catalog-r5.spec.mjs)

## Hồi quy R1, R2A, R2B, R2C, R3 và R4

Bộ Node gồm R5, tất cả nhóm trước và các kiểm tra liên quan tới catalog, model, SPICE, bản nháp, lắp đặt và định tuyến đạt **247/247** trên nguồn cuối. Bộ Chromium chạy tuần tự từng nhóm với một worker. Hai thay đổi cuối chỉ nằm trong phép đo R5 và đã được kiểm lại bằng trọn bộ R5 trên build mới.

| Nhóm | Chromium |
| --- | ---: |
| R1 | 8/8 |
| R2A | 15/15 |
| R2B | 13/13 |
| R2C | 6/6 |
| R3 | 20/20 |
| R4 | 16/16 |
| **Tổng** | **78/78** |

## Build và phạm vi

`npm.cmd run typecheck`, `npm.cmd run build:local` và `git diff --check` đạt. Build ghi cảnh báo từ `rp2040js` và import động `builderLessons.ts`. Gate phát hành ngspice giữ nguyên.

Hình học là tham chiếu theo package. Class D dùng mô hình biên độ trung bình tại tải. Bài motor và driver dùng mô hình hành vi, tải R/RL và bảng trạng thái trong miền đã duyệt. Phạm vi nghiệm thu là bản local và các cấu hình đã đo trong phần mềm.

[Mở kho R5 trên laptop](http://127.0.0.1:5245/components?component=lm386) · [Mở bài DRV8825](http://127.0.0.1:5245/build/freestyle?fixture=drv8825-r5)
