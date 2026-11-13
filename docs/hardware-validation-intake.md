# Dữ liệu cần để xác minh model board bằng phần cứng thật

## Trạng thái

Chưa có board vật lý nào được đối chiếu trong lượt này. Ảnh trên web và CAD giúp kiểm tra tham chiếu, nhưng không xác nhận clone/SKU người dùng đang cầm. Không sửa geometry chỉ dựa trên bounding box của scene hoặc hình ảnh phối cảnh.

## Mỗi mẫu board cần cung cấp

1. **Tên in trên board, hãng/bản clone, SKU và revision** (chụp rõ chữ trên PCB). Với ESP32, ghi đầy đủ tên module trên shield và thông tin flash/PSRAM nếu có.
2. **Ảnh mặt trước và mặt sau**, độ phân giải cao, lấy vuông góc với board, đủ sáng, board nằm phẳng. Đặt thước mm cạnh board trong cùng mặt phẳng; không che header, nút, USB, linh kiện hoặc lỗ bắt vít.
3. **Kích thước đo**: dài/rộng/thickness PCB, khoảng cách tâm lỗ, bước chân header, khoảng cách hai hàng header. Thước cặp được ưu tiên cho kích thước cơ khí; ghi độ phân giải dụng cụ.
4. **Chi tiết linh kiện muốn đối chiếu**: designator/marking đọc được, hướng pin-1 hoặc dấu cực, linh kiện gắn sẵn hay footprint dự phòng/DNP, socket/header có hàn hay chưa.
5. **Nếu kiểm tra hoạt động điện**: board revision, sơ đồ nối dây, nguồn và giới hạn dòng, firmware/version, điểm đo và giá trị đồng hồ/máy hiện sóng. Không cấp nguồn chỉ để tạo ảnh; làm phép đo khi người thực hiện có thể thao tác an toàn.

## Biểu mẫu

```text
Board/model ID trên web:
Tên/SKU ngoài đời:
Revision PCB:
Tên module/flash/PSRAM:
Ảnh trước:
Ảnh sau:
Kích thước PCB dài × rộng × dày (mm):
Bước header / khoảng cách hàng (mm):
Tâm lỗ bắt vít (mm):
Dụng cụ và độ chính xác:
Linh kiện cần đối chiếu:
Khác biệt nhìn thấy:
Phép đo điện cần kiểm tra (nếu có):
Người đo / ngày:
```

## Cách Codex sẽ đối chiếu

- So model với đúng SKU/revision, không áp một ảnh/board clone cho toàn họ sản phẩm.
- Tách lỗi outline, anchor header, vị trí/chiều linh kiện và biến thể BOM; không dùng scene bounds gồm linh kiện nhô cao làm kích thước bo.
- Chỉ sửa model khi nguồn và phép đo lặp lại được; lưu ảnh đo, sai số, phiên bản nguồn, hash trước/sau và test chọn pin/hotspot.
- Nếu chưa có bằng chứng đủ, giữ nguyên geometry và ghi “CAD tham chiếu / chưa xác minh vật lý”.
