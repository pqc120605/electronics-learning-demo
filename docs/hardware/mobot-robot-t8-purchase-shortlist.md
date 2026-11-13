# MoBot V2 robot · Danh sách mua đợt đầu cho T8

Đề xuất cho **một cụm thử cơ khí** trên sàn phẳng. Người dùng xác nhận chưa có linh kiện. Mục tiêu hai motor dẫn bốn bánh qua truyền ngoài 1:1 mỗi bên. Đây là danh sách mua mẫu, chưa khóa BOM sản phẩm hoặc cấu hình KiCad.

| Hạng mục | Mã và số lượng | Giá hãng tham khảo 06/11/2026 |
|---|---|---:|
| Motor | 2 chiếc Pololu #992, LP 6 V, hộp số 100,37:1, trục D Ø3 mm, không encoder. [Pololu #992](https://www.pololu.com/product/992) | 47,90 USD |
| Bánh | 2 cặp Pololu #1452, tổng 4 bánh, 40 × 7 mm, lỗ D Ø3 mm. Đây là ứng viên thay #1090 cho cụm thử vì #1452 được hãng xếp Active and Preferred, còn #1090 không khuyến nghị cho thiết kế mới. Phải dùng đúng mẫu 40 mm trong hồ sơ T8. [Pololu #1452](https://www.pololu.com/product/1452) | 10,90 USD |
| Gá motor | 1 cặp Pololu #1086, có vít và đai ốc. Dùng làm gá tham chiếu; kiểm khoảng hở với khớp nối theo bố trí. [Pololu #1086](https://www.pololu.com/product/1086) | 2,95 USD |

Tổng giá niêm yết **61,75 USD**, chưa gồm giao hàng, thuế, trục, truyền động và đồ đo. Đây là phương án mẫu có nguồn truy xuất, cần tách khỏi mục tiêu giá bán cả bộ dưới 1 triệu đồng.

**Đợt sau:** chọn trục Ø3 có mặt D ở đầu bánh, gối đỡ, khớp motor–trục, hub và bánh răng sau khi đối chiếu chiều dài ăn khớp, khoảng cách tâm và bố trí chassis. Giữ tỷ số ngoài 1:1. Chỉ chọn EVM, nguồn và bộ kẹp dự phòng sau khi QA rà fixture. [Hồ sơ fixture](mobot-robot-t8-flat-floor-fixture-review.md).

## Quyết định người dùng

Người dùng chốt danh sách mua đợt đầu #992/#1452/#1086 theo snapshot SHA-256 `412C04A6B593FA8CC1ECD7E60376AE6603CFDCC22DAE36EE247DE0077A776692`, và yêu cầu ưu tiên phần mạch. Đây là lựa chọn linh kiện cho mẫu T8. Dùng bánh #1452 Ø40 mm cho các bàn giao mới, thay #1090 trong các đề xuất cũ. Không có bằng chứng mẫu đã được mua/lắp. Phần mạch đang ở bước chọn cấu trúc và định mức trước KiCad.
