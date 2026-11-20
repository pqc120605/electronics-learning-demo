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

## Kiểm và triển khai staging qua SSH

Chạy từ checkout riêng đã ghim commit. `check` xác minh socket PostgreSQL của dịch vụ analytics, phiên bản Node, SHA và cây dependency `pg` sẵn có. Script tái sử dụng dependency đã ghim của analytics hoặc community. Nếu thiếu dependency, kiểm tra sẽ dừng trước khi cài đặt.

```bash
commit=$(git rev-parse HEAD)
node --test server/api/*.test.mjs
bash server/api/staging-ops.sh check "$commit"
```

Sau khi kiểm phiên có quyền quản trị PostgreSQL qua Unix socket ở cổng 55432, chạy bootstrap một lần rồi deploy. Hai role và database staging được tạo riêng. Mật khẩu sinh ngẫu nhiên được lưu vào các tệp quyền 600 trên Mini PC. Chế độ bootstrap từ chối tái tạo role hoặc database đã có.

```bash
bash server/api/staging-ops.sh bootstrap "$commit"
bash server/api/staging-ops.sh deploy "$commit"
curl -fsS http://127.0.0.1:8281/api/health
```

Deploy đóng gói mã từ SHA, sao chép đúng các package đã kiểm phiên bản rồi chạy migration có ledger. Systemd đọc SHA từ release đang chạy. Khi health thất bại, script thử khôi phục symlink và unit trước, hoặc dừng service nếu đây là lượt cài đầu. Migration tiến về trước. Mỗi bản cũ cần còn đọc được các migration đã thêm. Chạy cùng SHA lần thứ hai để kiểm `applied: []`. Sau 10 phút, kiểm lại health, trạng thái unit và RAM.

## Sao lưu và diễn tập khôi phục

`bash server/api/backup-staging.sh backup` tạo dump PostgreSQL custom, kiểm mục lục, rồi giữ bảy bản staging mới nhất. Chỉ bật unit và timer đi kèm sau khi sao lưu và diễn tập khôi phục thực tế đạt. [PostgreSQL pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html)

Operator tạo database trống `machmo_api_restore_check`, owner `machmo_api_stg_owner` và thu quyền `CONNECT` từ `PUBLIC`. Chạy `bash server/api/backup-staging.sh restore-check <tên-bản-sao-lưu>`. Script phục hồi trong một giao dịch vào database kiểm tra, kiểm số migration và bản ghi. Chuẩn bị database kiểm tra trống theo quy trình được duyệt trước khi diễn tập lại. [PostgreSQL pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html)

## Cổng còn mở

- Chờ xác minh migration PostgreSQL thật, service trên Arch và backup/restore. Cần xem số liệu loopback và RAM trước khi bật timer.
- Trước khi sửa Caddyfile/Funnel hoặc mở cổng cần chốt route, sao lưu và chạy `caddy validate`. Vercel hỗ trợ rewrite tới backend ngoài với trần 120 giây. Sau khi duyệt mới nối rule API trước fallback SPA và kiểm qua Preview. [Hướng dẫn rewrite của Vercel](https://vercel.com/docs/routing/rewrites) · [Giới hạn proxy của Vercel](https://vercel.com/docs/limits#proxied-request-timeout)
