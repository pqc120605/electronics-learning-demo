# S2 · Đăng nhập và cộng đồng

Cập nhật 21/11/2026. Phân hệ M13 Classroom/community. Nhánh S2 bổ sung đăng nhập OAuth và cộng đồng văn bản lên nền API staging S1 `8ec33b3`. Hồ sơ ghi cấu hình để nối với Vercel Preview và nghiệm thu tài khoản thật.

## Callback và thông tin triển khai

| Môi trường | Callback Google | Callback GitHub |
|---|---|---|
| Staging | `https://<host-preview-da-xac-minh>/api/auth/callback/google` | `https://<host-preview-da-xac-minh>/api/auth/callback/github` |
| Production | `https://mach-mo.vercel.app/api/auth/callback/google` | `https://mach-mo.vercel.app/api/auth/callback/github` |

- Dùng OAuth client riêng cho từng môi trường. Chốt host staging sau khi luồng HTTPS S1 qua Vercel trả đúng API. Provider phải quay về host mà trình duyệt đang dùng để cookie phiên có hiệu lực cùng origin.
- Google dùng scope `openid email profile` và lấy định danh `sub`. GitHub dùng `read:user user:email` theo kế hoạch và lấy `id` của tài khoản đã xác thực. Ràng buộc duy nhất `(provider, provider_user_id)` giữ danh tính ổn định khi người dùng đổi email hoặc tên. [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) · [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- Cả Google và GitHub công bố hỗ trợ PKCE `S256`. Dùng authorization code, `state` HMAC 10 phút gắn với phiên trình duyệt và provider, callback riêng, kiểm tra `next` theo đường dẫn nội bộ và tiêu thụ giao dịch một lần. Mọi thao tác đổi code và lấy hồ sơ thực hiện ở backend. [Google discovery](https://accounts.google.com/.well-known/openid-configuration) · [GitHub PKCE](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) · [OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)
- Khi đến lượt cấu hình, owner tạo client trên Google và GitHub, rồi đặt `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` và `SESSION_SECRET` trực tiếp vào tệp môi trường quyền `600` trên máy đích. Chỉ gửi kết quả trạng thái cấu hình và callback đã khai báo.

## Điểm tích hợp S2

- Bật giao diện S2 bằng `VITE_MACHMO_SELF_HOSTED_OAUTH=true` trong bản build thử. Backend bật S2 khi `MACHMO_S2_ORIGIN` trùng một HTTPS origin đã cấu hình qua `PUBLIC_ORIGIN` hoặc `STAGING_ORIGINS`. Dùng client OAuth đăng ký callback chính xác bên dưới origin đó. `ADMIN_ACCOUNTS` nhận danh sách dạng `google:<sub>,github:<id>` nếu cần kiểm duyệt.
- Proxy staging phải chuyển `/api/*` đến API riêng, giữ nguyên `Origin`, gửi `Host` chính xác theo origin S2 và chuyển đầy đủ các header `Set-Cookie`. Cho phép cả callback OAuth từ điều hướng trình duyệt. Kiểm `Cache-Control: no-store` ở `/api/session`. Không chọn host mới hoặc thay cấu hình proxy đang chạy cho đến khi phần kết nối S1 được duyệt.

- Migration `003-oauth-community.sql` mở rộng tài khoản và thêm danh tính, giao dịch OAuth một lần, bài viết, bình luận và báo cáo. Giữ hợp đồng `GET /api/session`. Cookie OAuth `__Host-mm_session` dùng `SameSite=Lax` và hết hạn sau 30 ngày. Phiên được xoay khi còn dưới bảy ngày. Bản thử mã mời tiếp tục dùng nhánh xử lý và cookie riêng.
- Tách `selfHostedAuth` và repository HTTP theo `CommunityRepository`. Dùng nguồn cục bộ cho nháp, lưu trước khi chuyển sang provider và khi quay lại khôi phục đúng nháp. Người dùng khách vẫn mở được bài học, lab và bài cộng đồng công khai. Thao tác ghi yêu cầu đăng nhập và quyền tương ứng. Payload công khai chỉ có tên hiển thị và avatar của người viết.
- Ghi chính sách lưu giữ và xoá tài khoản trong `/privacy`. Thử `DELETE /api/account` trên dữ liệu riêng của tài khoản thử. Không lưu access token của provider trong database ứng dụng.
- Adapter tự quản nhận ảnh và tệp đính kèm sau migration `011-community-attachments.sql`. Mỗi bài tối đa 5 tệp, 10 MiB/tệp và 25 MiB/bài. Kho dành cho mỗi tài khoản tối đa 100 MiB, gồm các lượt tải dở. Bài chỉ xuất hiện khi đủ mọi tệp, lượt tải dở quá 24 giờ được dọn định kỳ. Tuyến tải tệp theo quyền xem bài. Xóa bài hoặc tài khoản sẽ xóa tệp đi kèm. Bản cộng đồng trên thiết bị giữ kho tệp riêng.
- Nghiệm thu local ngày 25/11/2026 đạt 34/34 ca API với PostgreSQL 17 và 18 ca Chrome cho luồng online mô phỏng, tệp cục bộ và các bước học/mạch đã sửa. Triển khai API cùng migration 011 trước frontend. Kiểm thử lại một tệp đi qua Vercel và Mini PC trước khi công bố.

## Bằng chứng cần trước khi mở production

- Unit kiểm chữ ký và hạn `state`, giao dịch dùng lại, callback sai provider, `next` ra ngoài origin, phiên hết hạn, quyền sở hữu nội dung và yêu cầu ghi từ origin không hợp lệ.
- E2E dùng provider giả lập cho Google và GitHub ở 375×812 và 1440×900. Kiểm tiếp khách đọc 200, khách ghi 401, sửa của người khác 403, đăng xuất và trở lại nháp. Kiểm JSON công khai để bảo đảm email và token không xuất hiện.
- Trên staging thật, owner tự đăng nhập qua cả hai provider. Đối chiếu callback, `Set-Cookie`, điều hướng sau đăng nhập và giới hạn quyền từ trình duyệt Vercel Preview.

## Kiểm chứng ngày 21/11/2026

- `npm.cmd run typecheck`, `npm.cmd test` (817/817) và `npm.cmd run build:public` với cờ S2 đều exit 0. Bộ API, analytics và phiên đạt 21 ca, một ca phiên cũ cần fixture được bỏ qua ở lượt đó.
- PostgreSQL riêng trong Podman áp dụng `[1,2,3]` và chạy lại trả `[]`. Vai trò ứng dụng kiểm qua luồng tạo tài khoản, phân danh tính, đăng lặp, quyền sở hữu, phân trang, kiểm duyệt và xóa tài khoản thử.
- Chromium đạt 7/7, gồm Google/GitHub giả lập ở hai viewport và ba ca offline. Service worker để các request `/api/` đi đến máy chủ, kể cả điều hướng đăng nhập.
- Cổng HTTPS dự kiến của Funnel chưa hoàn tất TLS khi kiểm từ laptop. URL `/api/health` trên web chính trả 404. Nghiệm thu OAuth thật cần địa chỉ Preview đã nối API, client OAuth riêng và lượt đăng nhập của owner. Migration trên Mini PC thực hiện sau khi kiểm bản sao lưu của database đích.
