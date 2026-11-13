# MoBot robot · Rà phương án cách ly VM và dữ liệu T8

MM-HW-MOBOT-ROBOT-KICAD-001, advisory. Căn cứ [điều kiện chốt VM](mobot-robot-vm-pre-kicad-closure.md). Box 02 lượt `01a1b0d2-958c-7863-a517-cd4006bb3f83`, Box 03 lượt `01a1b0d2-a9d5-76a3-8163-a5ab1e78b3ae`.

- Box 02 chưa tìm được cận hãng cho TPS63070RNMR bị đẩy áp tại VOUT với EN thấp và VIN mất hoặc sụt. Đánh giá LM73100RPWR, IN phía converter, OUT phía motor. Dòng rò ngược 4,8 µA là điển hình ở điều kiện thử, không dùng làm cận tối đa. Rà điện tích lọt khi chuyển sang chặn, rail nổi, sụt áp/nhiệt, inrush và thứ tự ngắt. Feedback và tụ ổn định phía converter. Chỉ dùng điện dung hữu hiệu phía motor và shunt tự cấp từ VM để tính hấp thụ khi hai phía bị tách. [TPS63070](https://www.ti.com/lit/ds/symlink/tps63070.pdf) · [LM73100](https://www.ti.com/lit/ds/symlink/lm7310.pdf).
- Box 03 xác nhận hồ sơ chọn hai Pololu #992, motor LP 6 V, hộp số 100,37:1. Bánh mới có đường kính mục tiêu 43 mm, chưa khóa mã, đường kính lăn và tỷ số truyền ngoài. T8 cần nhận dạng đúng cụm, R/L, dòng có dấu trước ngắt, tốc độ, back-EMF và quán tính hoặc cận năng lượng hồi. Dòng kẹt ngoại suy chỉ dùng sàng lọc. [Pololu #992](https://www.pololu.com/product/992/specs).
- Box 08 rà khả năng định mức từ tài liệu và đầu vào phải đo, gồm ngắt khi PCM mở hoặc mất logic. Chưa chốt MPN bảo vệ, ngưỡng VM, BOM hoặc lease. Đo mẫu và bench đều NOT_RUN.

## Kết quả Box 08 trên snapshot gốc

Box 08 xác nhận SHA-256 `4600B92BAF2D58051C95E1FD25CB4C2D31A852CA07206FD64919237B38AB1145`. Pass có điều kiện ở cấp khối, `changes_requested` ở cấp triển khai. Mục ghi thêm này lưu verdict trên snapshot gốc, không thay phạm vi review của hash đó.

- LM73100RPWR đủ căn cứ để giữ làm ứng viên. Chưa có cận điện tích lọt khi đang dẫn rồi chuyển sang chặn, dòng rò làm nâng rail nổi và điện áp đỉnh phía converter. Giá trị điển hình không thay cận xấu nhất. Kiểm riêng OUT có áp trước, IN tụt chậm và IN mất đột ngột.
- T8 cần nhận dạng cụm hai motor/hộp số/bánh và tỷ số truyền ngoài. Cần hai đầu ra: cận xung ban đầu (dòng trước ngắt, độ dài xung và tốc độ tăng VM) và cận năng lượng/công suất hồi của hai motor (dừng và ngoại lực trong phạm vi V1). Nếu một phép đo trực tiếp trên đúng cụm đóng được cả hai cận thì không cần đo riêng mọi đại lượng trung gian.
- Bước tiếp theo có ích là xác nhận cụm truyền động sẽ dùng và lấy các cận trên từ tài liệu, mô hình có giới hạn đầu vào hoặc đo đúng cụm. Chuyển Box 02 định mức shunt, tụ và phần tử chặn sau khi có dữ liệu đó. Bench tích hợp tiếp tục tách riêng.
