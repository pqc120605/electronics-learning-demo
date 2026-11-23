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
