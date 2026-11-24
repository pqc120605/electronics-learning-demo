# Kết nối website vào dashboard quản trị

Mở `/admin` bằng tài khoản trong `ADMIN_ACCOUNTS`. Mạch Mở đã là một mục cố định. Các web khác xuất hiện khi đăng ký trên Mini PC. Xem [quyết định kiến trúc](../adr/0002-dashboard-nhieu-website.md).

## Đăng ký website

Thêm một mục vào biến backend `MACHMO_DASHBOARD_SITES` trong cấu hình dịch vụ Mini PC. Dùng mã ổn định gồm chữ thường, chữ số và dấu gạch nối. `mach-mo` dành riêng cho Mạch Mở. Giá trị của biến là mảng JSON một dòng.

```json
[
  {
    "id": "web-moi",
    "name": "Tên web",
    "origin": "https://web-moi.example",
    "keyDigest": "<64 ký tự hex SHA-256 của khóa gửi>"
  }
]
```

Mỗi web tạo khóa riêng từ 32 byte ngẫu nhiên mã hóa base64url. Giá trị khóa có 43 ký tự. Chỉ lưu khóa gốc ở backend của web gửi. Cấu hình dashboard nhận SHA-256 dạng hex. Khi thay khóa, cập nhật cả hai phía. Sau khi đổi danh sách, khởi động lại API. Website xuất hiện với trạng thái chưa có dữ liệu.

## Gửi từ backend của website

Dùng API HTTPS ở cùng đích public với dashboard, nhận JSON và header `Authorization: Bearer <khóa-gửi>`. Máy chủ trả `204` khi ghi thành công hoặc nhận lại yêu cầu đã ghi. Không có CORS cho các tuyến gửi.

| Tuyến | Nội dung |
| --- | --- |
| `PUT /api/site-metrics/<id>/daily` | `day` theo `YYYY-MM-DD` giờ Việt Nam, `revision` nguyên dương tăng dần theo ngày, `status` là `healthy`, `degraded`, `down` hoặc `unknown`. `accounts` là tổng tài khoản tại lúc tổng hợp. `newAccounts`, `sessions`, `pageViews` là số đếm trong ngày. Các số đếm nguyên không âm, có thể bỏ trống hoặc gửi `null` cho chỉ số chưa thu thập. |
| `POST /api/site-metrics/<id>/feedback` | `id` UUID v4 ổn định qua các lần thử lại, `kind` là `bug`, `idea` hoặc `content`, `title`, `details`, `page`, `steps`, `expected`, `actual` là văn bản, `rating` từ 1–5 hoặc `null`. `page` là đường dẫn nội bộ. Có thể gửi chuỗi rỗng cho `page` và ba trường mô tả lỗi. |

Ví dụ bản tổng hợp cho một web có số liệu lượt xem và phiên.

```json
{"day":"2026-11-24","revision":1,"status":"healthy","accounts":null,"newAccounts":null,"sessions":15,"pageViews":42}
```

Gửi bản tổng hợp ít nhất mỗi ngày. Giữ nguyên revision khi gửi lại cùng bản. Tăng revision khi cập nhật số liệu, kể cả khi cập nhật trạng thái. Dashboard hiện thời điểm nhận bản gần nhất của ngày mới nhất. Trạng thái được báo lên bởi bên gửi. Nếu web dừng gửi hẳn, mục của web chuyển thành dữ liệu chưa cập nhật sau 26 giờ.

## Kiểm sau khi triển khai

1. Từ checkout đã ghim SHA trên Mini PC, chạy `bash server/api/deploy-dashboard-edge.sh "$(git rev-parse HEAD)"`. Script kiểm PostgreSQL, sao lưu, áp migration 008–009, cập nhật các tuyến Caddy và thử quyền của khách. Bật dashboard theo [hướng dẫn Vercel](qd1-vercel-node-api.md#dashboard-quản-trị-và-góp-ý).
2. Đăng ký một website thử và gửi một bản tổng hợp. Chọn web đó tại `/admin` và đối chiếu ngày, trạng thái, số đếm. Gửi lại bản cũ và xác nhận số mới vẫn được giữ.
3. Xác nhận phiên khách và tài khoản thường không đọc được báo cáo. Kiểm một khóa của web A gửi sang mã web B trả `403`. Khóa chỉ có quyền gửi.
