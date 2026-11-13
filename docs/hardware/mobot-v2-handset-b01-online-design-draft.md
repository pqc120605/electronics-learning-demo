# MoBot V2 tay cầm · B01 online design draft v1

Phạm vi: đề xuất cấu hình tay cầm cho MM-HW-MOBOT-IF-001. Robot xử lý sau. B01 là ESP32 30 chân, USB-C, CH340, SKU 02030089 theo [Toko Beetrona](https://tokobeetrona.com/produk/esp32-usb-type-c-ch340-30pin-development-board/). BOM r2 SHA-256 `C88FA4C1EC4F634DF96D2FED57D1D7054C06EE72E96B6198B07B892F6D97442A`. Hậu tố CH340, revision và hình học của đúng SKU chưa xác minh. Kích thước EasyWare thuộc SKU khác.

## Phương án đề xuất

- RUN: pack 1S qua nhánh boost 5 V và cổng USB-C Source của carrier, dùng cáp tháo rời cấp vào USB-C của B01. Ứng viên boost [TPS61023](https://www.ti.com/product/TPS61023), Source [TPS25810](https://www.ti.com/product/TPS25810). Giữ veto khi cắm cổng sạc tay cầm. Mức quảng bá dòng chờ kiểm ngân sách ở pin yếu và inrush.
- PROGRAM: rút cáp RUN khỏi B01 rồi cắm cáp dữ liệu từ máy tính vào cùng cổng. Chuyển chế độ làm B01 mất nguồn trong lúc đổi cáp. Để VIN và 3V3 của B01 ngoài đường cấp nguồn carrier. Đánh giá cách ly I/O hoặc khả năng chịu mất nguồn ở cả hai phía để tránh cấp ngược qua tín hiệu.
- Gá DevKit riêng, không đặt hai socket theo hình học suy đoán trên carrier. Bó dây ngắn, có khóa phía carrier và điểm giữ dây. Giữ cổng B01 dễ tiếp cận để đổi cáp. Kích thước gá, kiểu đầu ghép phía DevKit và độ chắc cơ khí chờ dữ liệu đúng SKU.

## Các điểm Box 08 cần rà

1. Việc đổi cáp có đáp ứng yêu cầu thao tác và loại trừ đồng thời hai nguồn vào B01 trong mọi trạng thái, kể cả sạc và mất nguồn một phía.
2. Các điều kiện để nguồn USB-C hoạt động với SKU này, gồm Rd hai chiều cắm, giới hạn dòng trước cấu hình khi nối máy tính, dòng khởi động và đường cấp ngược qua I/O. Phân loại phần có thể đóng bằng tài liệu và phần cần đo.
3. Các điều kiện có thể tách khỏi footprint carrier, và điều kiện vẫn phải chốt trước khi chọn đầu nối, bó dây, gá hoặc vỏ.
4. Tác động tới phạm vi thay đổi cấu hình và các blocker khác của tay cầm, gồm hồ sơ pack và bench chưa xác minh. Ghi rõ mức sẵn sàng để lập cấu hình duyệt hash và các điều kiện còn chặn KiCad.
