# API Mạch Mở trên Mini PC

S1 staging chuẩn bị API cho session, thu sự kiện học và Mở Bot. Node dùng lại các handler và driver PostgreSQL đã ghim của dịch vụ community. L8 tiếp tục ở nhánh phát hành riêng.

## Luồng staging

```text
curl qua SSH → 127.0.0.1:8281 → API Node
                                ├─ session + analytics → DB machmo_api_staging trên 127.0.0.1
                                └─ Mở Bot mock nếu bật
```

- `GET /api/health` trả `version`, `commit`, `db` và `ai`. Trạng thái 503 khi database thiếu migration, mất kết nối hoặc dùng role sai.
- API đọc session, đăng xuất, ghi analytics và Mở Bot mock. OAuth thuộc S2, provider thật thuộc S3. Dashboard analytics nằm trên origin quản trị riêng.
- Giới hạn body 64 KiB. Thu sự kiện giữ cận 1 KiB. CORS theo danh sách HTTPS khai báo. Bộ đếm theo phút dùng HMAC trong RAM với khóa thay mới mỗi cửa sổ. Nhật ký ghi mã route, HTTP status và thời gian.
- Để danh sách proxy tin cậy trống khi thử loopback. Trước khi nối proxy cần kiểm Caddy ghi đè `X-Forwarded-For` bằng đúng một IP từ đường truyền đã tin cậy. Kiểm `Origin`, `Host`, `Set-Cookie`, giới hạn body và tình trạng chặn dashboard.
- Staging dùng user service của `volnexus`. Cần kiểm namespace để `ProtectSystem=strict` có hiệu lực cùng `PrivateUsers=true`. Production cần user riêng và quy trình chuyển đổi. [Tài liệu systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#ProtectSystem=)

## Chuẩn bị và kiểm cục bộ

1. Tạo checkout staging riêng và chạy `node --test server/api/*.test.mjs`. Các ca dùng HTTP loopback và fixture DB.
2. Xác minh cổng 8281 rảnh. Kiểm cluster bằng `pg_isready -h 127.0.0.1 -p 55432`. Staging chỉ nhận database `machmo_api_staging` và hai role `machmo_api_stg_owner`, `machmo_api_stg_app` trên loopback. Kiểm database chưa tồn tại trước khi tạo. Operator PostgreSQL cần quyền tạo database và role.
3. Đặt hai role có `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE`. Đặt mật khẩu tương tác qua lệnh psql `\password`. Sau khi tạo database với owner staging, thu quyền database từ `PUBLIC` và cấp `CONNECT` cho app.
4. Dùng `pg` từ lockfile `server/community`. Nếu chưa có bộ dependency đã ghim, cần duyệt cài trước khi chạy.
5. Đặt file `~/.config/mach-mo/api-staging.env` quyền 600 trên Mini PC. Cấu hình `DATABASE_URL` của role app, `PUBLIC_ORIGIN` là origin HTTPS chính xác, `MACHMO_API_COMMIT` là SHA và `MACHMO_API_PORT=8281`. `STAGING_ORIGINS` nhận danh sách cách nhau bằng dấu phẩy. `GUIDE_AI_PROVIDER=mock` bật demo cục bộ. Đặt `DATABASE_OWNER_URL` trong file riêng cho migration, cũng quyền 600. Mật khẩu trong URI cần URL-encode.
6. Chạy `node --env-file=<file-migration-riêng> server/api/migrate.mjs` hai lần. Lần đầu trên database mới ghi hai phiên bản. Lần thứ hai trả `applied: []`. Migration dùng một giao dịch có advisory lock và hash SHA-256.
7. Chuẩn bị release theo SHA và symlink `~/.local/share/mach-mo/api-staging/current`. Kiểm unit bằng `systemd-analyze --user verify server/api/mach-mo-api-staging.service` sau khi đã có đường dẫn đích. Khởi động riêng API staging và chạy `curl -fsS http://127.0.0.1:8281/api/health`. Đối chiếu SHA, DB ready, AI đúng chế độ và RAM sau 10 phút. Quay lại bằng cách trỏ symlink vào release đã kiểm rồi restart riêng API staging.

## Cổng còn mở

- Migration PostgreSQL thật, user service trên Arch và backup/restore chưa chạy. Chỉ dump database staging, giữ bảy bản và phục hồi thử vào database riêng. Đối chiếu schema ledger trước khi lên lịch.
- Trước khi sửa Caddyfile/Funnel hoặc mở cổng cần chốt route, sao lưu và chạy `caddy validate`. Vercel hỗ trợ rewrite tới backend ngoài với trần 120 giây. Sau khi duyệt mới nối rule API trước fallback SPA và kiểm qua Preview. [Hướng dẫn rewrite của Vercel](https://vercel.com/docs/routing/rewrites) · [Giới hạn proxy của Vercel](https://vercel.com/docs/limits#proxied-request-timeout)
