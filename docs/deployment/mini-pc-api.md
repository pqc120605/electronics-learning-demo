# API Mạch Mở trên Mini PC

S1 staging chuẩn bị API cho session, thu sự kiện học và Mở Bot. Node dùng lại các handler và driver PostgreSQL đã ghim của dịch vụ community. L8 tiếp tục ở nhánh phát hành riêng.

Khi nối frontend Vercel với API theo QĐ-1, dùng [checklist A3–A4](qd1-vercel-node-api.md).

## Luồng staging

```text
curl qua SSH → 127.0.0.1:8281 → API Node
                                ├─ session + analytics → DB machmo_api_staging trên 127.0.0.1
                                └─ Mở Bot mock nếu bật
```

- `GET /api/health` trả `version`, `commit`, `db` và `ai`. Trạng thái 503 khi database thiếu migration, mất kết nối hoặc dùng role sai.
- API đọc session, đăng xuất, ghi analytics và Mở Bot mock. OAuth thuộc S2, provider thật thuộc S3. Dashboard analytics nằm trên origin quản trị riêng.
- Giới hạn body JSON 64 KiB. Thu sự kiện giữ cận 1 KiB. Riêng tệp cộng đồng đi theo từng đoạn nhị phân tối đa 1 MiB trên tuyến có phiên và CSRF. CORS theo danh sách HTTPS khai báo. Bộ đếm theo phút dùng HMAC trong RAM với khóa thay mới mỗi cửa sổ. Tệp và analytics có bộ đếm riêng để lượt tải tệp hoặc gửi sự kiện không chiếm hạn mức phiên đăng nhập. Nhật ký ghi mã route, HTTP status và thời gian.
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

- Ngày 25/11/2026, bản `6e7105a` đạt 33/33 ca API trên Mini PC với PostgreSQL thử ở cổng riêng. Caddy loopback giữ chặn khách ở các tuyến quản trị, lớp học, dự án và kiểm duyệt.
- Đã khôi phục `machmo_api_staging-20261125T015413Z.dump` trong cụm tạm chỉ nhận kết nối qua socket riêng. Kiểm số migration và đọc được bảng phiên, bảng thống kê. Dữ liệu khôi phục chỉ tồn tại trong môi trường thử. Lịch backup và bản sao ngoài máy được xác minh riêng tại đợt phát hành.

### Bản sao mã hóa ngoài máy

- Bản sao trên laptop nằm trong `%LOCALAPPDATA%\MachMo\Backups`, ngoài Git. Trước khi nhận tệp qua SSH, kiểm mục lục bằng `pg_restore --list` trên Mini PC. So khớp SHA-256 với bản dump gốc sau khi giải mã thử.
- Tệp `.dump.dpapi` dùng Windows DPAPI phạm vi `CurrentUser` và chuỗi entropy UTF-8 `MachMo-PostgreSQL-backup-v1`. Việc phục hồi cần đúng hồ sơ tài khoản Windows đã mã hóa tệp. Khi diễn tập, dùng `ProtectedData.Unprotect` trên chính tài khoản đó và cấp dump cho `pg_restore` trên cụm thử riêng. Chỉ tạo tệp rõ khi cần khôi phục có chủ đích trong thư mục được bảo vệ.
- Lịch trên Mini PC vẫn giữ bảy bản gần nhất. Việc chép ngoài máy trong đợt này là một lần. Một lịch tự động cần laptop kết nối được Mini PC và danh tính SSH có cấu hình lâu dài.

### Giới hạn theo IP qua Vercel

- Cấu hình cùng một khóa ngẫu nhiên 32 byte dạng hex thường trong biến server-only `MACHMO_EDGE_PROXY_HMAC` ở Vercel Production và dịch vụ API Mini PC. Giữ tệp môi trường ở quyền 600 và cấp cho dịch vụ bằng `EnvironmentFile`.
- Middleware dùng địa chỉ do Vercel cấp để ký mã định danh theo ngày. API kiểm chữ ký, phương thức, đường dẫn và tuổi tối đa 60 giây. Khi khóa đã cấu hình, yêu cầu thiếu chữ ký hoặc chữ ký sai dùng nhóm theo IP kết nối trực tiếp.
- Sau khi phát hành, kiểm `GET /api/health` qua Vercel trả `X-Machmo-IP-Source: verified-edge`. Cùng endpoint qua Funnel trực tiếp phải trả `peer`. Đổi IP mạng, kiểm hai client được tính riêng và xác nhận không ghi IP thô vào log ứng dụng. [Header IP do Vercel cấp](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for)
- Trước khi sửa Caddyfile/Funnel hoặc mở cổng cần chốt route, sao lưu và chạy `caddy validate`. Vercel hỗ trợ rewrite tới backend ngoài với trần 120 giây. Sau khi duyệt mới nối rule API trước fallback SPA và kiểm qua Preview. [Hướng dẫn rewrite của Vercel](https://vercel.com/docs/routing/rewrites) · [Giới hạn proxy của Vercel](https://vercel.com/docs/limits#proxied-request-timeout)
