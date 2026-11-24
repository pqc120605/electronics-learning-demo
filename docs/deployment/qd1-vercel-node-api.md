# QĐ-1 · Nối Vercel với Node API

## Phạm vi

Áp dụng cho nhánh tích hợp B1–B5 và các luồng tài khoản, cộng đồng và dữ liệu lớp học của M13 (`CLS-02`, `CLS-03`, `CLS-04`, `CLS-08`, `K-CLOUD`). Bằng chứng hiện tại ở mức tích hợp cục bộ với PostgreSQL fixture và OAuth giả lập. Nghiệm thu môi trường thật nằm ở A3–A4. [ADR 0001](../adr/0001-backend-duy-nhat-node-api.md)

## A3 · Xác minh origin HTTPS từ mạng ngoài

- [ ] Ghi SHA dự kiến của Node API. Kiểm cơ sở dữ liệu đích, backup, khôi phục và migration theo [hướng dẫn Mini PC](mini-pc-api.md). Từ Mini PC, `http://127.0.0.1:8281/api/health` phải trả HTTP 200, JSON có `db: "ready"` và đúng SHA. Node và PostgreSQL tiếp tục nghe trên loopback.
- [ ] Chốt một hostname cho `<API_ORIGIN>` và một HTTPS origin cố định cho Vercel Preview. Dùng Tunnel/Funnel đến Caddy trên Mini PC. Lưu cấu hình Caddy hiện tại và chạy `caddy validate` trước khi reload. Dùng origin riêng cho API để tránh đụng tuyến đang phục vụ frontend.
- [ ] Caddy ánh xạ `/health` ở origin API sang `/api/health` của Node. Áp dụng cùng quy tắc thêm tiền tố `/api` cho `/session`, `/auth/*` và các tuyến còn lại của API. Giữ query string, phương thức, mã trạng thái, `Location` và `Set-Cookie`. Giữ nguyên `Origin` của trình duyệt và đặt upstream `Host` đúng origin S2 đã cấu hình. Đối chiếu [hướng dẫn OAuth](oauth-setup.md).
- [ ] Kiểm bằng thiết bị ở mạng ngoài, có DNS và TLS hợp lệ. Kết quả phải là HTTP 200, JSON đúng SHA, `db: "ready"` và `Cache-Control: no-store`. Lưu thời điểm, hostname, SHA và kết quả. Bằng chứng loopback là kiểm riêng của A3.

```bash
curl --fail-with-body --silent --show-error --include 'https://<API_ORIGIN>/health'
```

## A4 · Chuẩn bị rewrite ở Vercel Preview

Chỉ thêm mục dưới đây vào đầu mảng `rewrites` trong bản Preview sau khi A3 đạt. Thay `<API_ORIGIN>` bằng hostname HTTPS đã xác minh. Bản B5 lưu mẫu trong tài liệu.

```json
{
  "source": "/api/:path*",
  "destination": "https://<API_ORIGIN>/:path*"
}
```

Ví dụ, `/api/session` trên Preview được Vercel chuyển thành `/session` ở origin API. Caddy thêm lại tiền tố để Node nhận `/api/session`. Giữ rule đứng trước fallback SPA. Kiểm các phản hồi có phiên và dữ liệu người dùng dùng `Cache-Control: no-store`. [Rewrite ngoài origin trên Vercel](https://vercel.com/docs/routing/rewrites)

- [ ] Với cờ Node và cờ Supabase đều tắt, kiểm Preview `/api/health` trả đúng SHA và trạng thái PostgreSQL. Kiểm `/api/session` trả `{"user":null}` cho khách và cổng quản trị từ chối phiên khách.
- [ ] Bật `VITE_MACHMO_SELF_HOSTED_OAUTH=true` trên Preview. Xác nhận callback Google và GitHub thật đi về đúng origin Preview. Kiểm cookie `Secure`, `HttpOnly`, `SameSite=Lax`, đăng xuất và nháp cộng đồng sau chuyển hướng. Kiểm khách đọc được bài công khai, ghi cần tài khoản và nút chuyển về nguồn lưu trên thiết bị.
- [ ] Nếu dùng thống kê và quản trị, bật thêm `VITE_MACHMO_SELF_HOSTED_ANALYTICS=true`. Xác nhận sự kiện được ghi vào PostgreSQL đích và quyền quản trị được kiểm trên API. Kiểm bài học và bàn lắp ở chế độ khách khi dịch vụ API gián đoạn.
- [ ] Trước production, ghi lại bản Vercel hiện hành để quay lại khi lỗi. Chỉ thực hiện theo lượt phát hành sau khi A3, A4 có bằng chứng, origin production và callback đã được chốt. Sau khi chuyển, kiểm lại health, phiên, cộng đồng và dữ liệu ghi từ mạng ngoài. Secret OAuth, cơ sở dữ liệu và AI nằm trên backend.

## Giữ đường quay lại trong một bản phát hành

`VITE_MACHMO_LEGACY_SUPABASE` tắt mặc định. Cờ này chỉ dùng để quay lại đăng nhập và cộng đồng cũ nếu cần. Khi bật, nó chọn adapter cũ thay cho OAuth Node. Quản trị và thống kê trong bản tích hợp chỉ có đường đến Node API. Cờ và giá trị mẫu nằm trong [`.env.example`](../../.env.example).

Founder xác nhận ngày 23/11/2026 rằng Supabase production không có dữ liệu thật cần chuyển. B6 gỡ SDK, adapter và migration Supabase sau khi có bằng chứng một bản phát hành Node API đã chạy ổn. Luồng tệp đính kèm cục bộ vẫn dùng IndexedDB. API cộng đồng Node ở bản này hỗ trợ bài viết và bình luận dạng văn bản.

## Dashboard quản trị và góp ý

- Sao lưu PostgreSQL rồi deploy API có migrations 008–010 bằng quy trình Mini PC. Migrations thêm bảng góp ý, số liệu website và thông tin xác minh quyền dashboard cho phiên hiện có. Tác vụ backend dọn góp ý sau 180 ngày. [Kết nối thêm website](dashboard-nhieu-website.md)
- Trên Mini PC đã chuyển OAuth sang production, cập nhật matcher `@api` trong `~/.config/mach-mo/Caddyfile.oauth-production` giống script `server/api/promote-oauth-origin.sh`. Sao lưu Caddyfile, chạy `caddy validate` rồi khởi động lại `mach-mo-api-production-edge.service`. Các đường dẫn `/admin/summary`, `/admin/ai`, `/admin/community`, `/admin/system`, `/admin/feedback` đều kiểm vai trò ở API. `/feedback` nhận nội dung gửi chủ động. `/analytics/events` nhận sự kiện sử dụng.
- Cấp quyền xem dashboard qua `MACHMO_DASHBOARD_EMAILS` trên Mini PC. Kiểm khách nhận `401` và phiên thiếu email được cấp quyền nhận `403`. [Cấu hình quyền xem](dashboard-nhieu-website.md#quyền-xem-dashboard)
- Bật `VITE_MACHMO_SELF_HOSTED_ANALYTICS=true` và `VITE_MACHMO_SITE_FEEDBACK=true` cho bản Vercel đã có `VITE_MACHMO_SELF_HOSTED_OAUTH=true`. Mở trực tiếp `/admin` bằng tài khoản quản trị. Thử gửi một góp ý từ `/feedback` và xác nhận nó xuất hiện cùng điểm sao. Đối chiếu tổng tài khoản với tài khoản mới trong kỳ và phiên trình duyệt.
- Khi cần quay lại, khôi phục bản frontend và Caddyfile trước đó. Giữ bảng góp ý và migration đã áp dụng để bảo toàn nội dung người dùng đã gửi.
