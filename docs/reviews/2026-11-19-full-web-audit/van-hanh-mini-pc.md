# Mini PC Mạch Mở · từ bản đang chạy đến lần phát hành kế tiếp

**19/11/2026.** Dành cho người giữ máy, backend và tester. Mục tiêu trước mắt là đưa bản học khách đã nghiệm thu lên cùng địa chỉ mà người học đang sử dụng, giữ dữ liệu trình duyệt và analytics, và có thể quay lại bản đang hoạt động. [Mở bản web công khai](https://machmo.tail3b04e8.ts.net/) · [Biên bản triển khai trên máy](../../agents/runs/MM-ARCH-ANALYTICS-20261117/report.md)

## 1. Hiện đã chạy những gì

| Tầng | Bằng chứng | Hệ quả cho lần tới |
|---|---|---|
| Máy chủ | Arch Linux, i5-7500, RAM 4 GB, SSD 256 GB theo hồ sơ cấu hình. Ngày 17/11 đã triển khai web, Node.js và PostgreSQL, kiểm backup/restore tại máy. [Cấu hình](../../deployment/arch-mini-pc.md) | Build ở máy dev. Phải giữ tài nguyên cho web/DB. Cần kiểm ổ còn trống và áp lực bộ nhớ trên máy trước khi quyết định thêm worker hay AI. |
| HTTPS | Tailscale Funnel đưa khách qua HTTPS tới Caddy loopback 8080. Lần kiểm 19/11 mở được homepage qua DNS công cộng, entry khác bản local. Lần kiểm ngày 17/11 đã xác nhận HTTPS và ghi một sự kiện từ browser. [Bằng chứng Funnel](../../agents/runs/MM-ARCH-DEPLOY-20261117/funnel.md) | Kiểm bằng điện thoại trên 4G/5G và Wi-Fi trước khi gửi cho lớp. Giữ nguyên hostname để browser mở được localStorage/IndexedDB cũ. |
| Analytics | Caddy public chuyển đường ghi sự kiện tới Node 8787. Dashboard và đường đọc đi qua Caddy riêng 8081 tới Node 8788. PostgreSQL ở 55432 trên loopback. Nhật ký ngày 17/11 cho thấy cả bốn user service chạy; khóa SSH triển khai tạm khi đó đã thu hồi. | Không tái khởi tạo database. Người giữ máy cung cấp cửa sổ bảo trì để kiểm service và backup. Số lượt xem theo phiên tab không đủ để tính người quay lại sau 7 ngày. |
| Chức năng ứng dụng | React/Vite + static assets chạy ở browser; WASM SPICE có cơ chế build public riêng. Máy dev còn có middleware cho runtime cục bộ. Mở Bot có kho tài liệu, phương thức kiểm /api/guide-ai/status và API chat ở source. Community có adapter trực tuyến và gói SQL riêng. | Mỗi tính năng có capability riêng. Chỉ hiển thị “chạy thật”, “đã đăng” hoặc model đang phục vụ sau tín hiệu xác minh thích hợp. URL public phục vụ HTML không chứng minh mọi backend của bản local đã đi kèm. |

### Sơ đồ phục vụ đề xuất

**Điểm kiểm độc lập ngày 19/11.** Bundle public có SHA-256 `92889e53e974ead761b5f28c7b178e8ae4bf2a13632f2d7fb4328858e70d70d6`. Homepage, URL SPICE, JS và WASM trả 200, WASM có MIME `application/wasm`. Endpoint tình trạng Mở Bot AI trả 404. Lượt dùng cấu hình DNS mặc định không nhận được phản hồi HTTP trong 9 giây; dùng DNS công cộng và xác minh TLS theo hostname thì truy cập được. Chưa kiểm SSH, reboot, nhật ký DB hay tải đồng thời trong đợt này. [Biên bản HTTP](evidence/public-http.json)

~~~text
Người học → HTTPS cùng hostname → Tailscale Funnel → Caddy 127.0.0.1:8080
  ├─ HTML / JS / CSS / GLB / WASM / thông báo license → release hiện hành
  └─ /api/analytics/events → Node 127.0.0.1:8787 → PostgreSQL :55432

Chủ máy → SSH tunnel → Caddy 127.0.0.1:8081 → Node :8788 → báo cáo riêng

Bước online đề xuất sau phê duyệt
  Trình duyệt → Supabase Auth / Postgres có RLS / Storage có quyền theo bài
  Bài học, mạch, code, dự đoán → vẫn chạy hoặc lưu nháp tại trình duyệt
  Bot → kho nội dung ở máy người dùng → tùy chọn gateway AI có quota/fallback
~~~

Hai PostgreSQL trong phương án managed có nhiệm vụ tách biệt: cluster trên Mini PC đếm sự kiện ẩn danh; kho ứng dụng quản lý thành viên, bài viết và quyền sở hữu. Giữ mã dự án, nội dung chat, tài khoản và file đính kèm ra khỏi payload analytics. Nếu đổi nơi xử lý dữ liệu, cập nhật thông báo riêng tư và kiểm tra quyền trước khi bật.

## 2. Việc làm ngay trên máy dev

**Tạo release candidate trong checkout staging bám đúng snapshot được duyệt.** Ghi commit nếu có và ghi thêm manifest SHA-256 cho các file build. Giữ server local đang dùng để test độc lập với thư mục build của candidate. Các lệnh sau dành cho PowerShell trong checkout staging. Chạy từng lệnh và dừng khi exit code khác 0.

~~~powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run audit:spice-engine
npm.cmd run check:public-release
$env:VITE_MACHMO_LOCAL_ANALYTICS = 'true'
npm.cmd run build:public
npm.cmd run test:e2e
~~~

Bộ chạy e2e chuẩn của repo tự build trước khi khởi động Playwright. Để smoke đúng các byte định chuyển, sau e2e hãy build public lần cuối trong staging với cùng biến cấu hình, tính checksum trên **artifact cuối** và chạy smoke trên đúng artifact đó bằng preview tĩnh hoặc Caddy có quy tắc public. Đối chiếu handler /api trên staging với production. Kiểm cấu hình base URL và whitelist origin bằng URL thật. [Scripts của dự án](../../../package.json) · [Luồng test browser](../../../scripts/run-browser-tests.mjs) · [Cấu hình analytics client](../../../src/lib/analytics.ts)

- Chụp trạng thái đầu của người mới và dự án được khôi phục từ release cũ. Xem lại hình, cache và origin. Lưu cùng candidate một phiếu gồm build ID, ngày, hash bundle, WASM, toolchain, những provider thực sự hoạt động, danh sách capability tắt và kết quả kiểm.
- Lượt audit ngày 19/11 đã chạy `audit:spice-engine` và `check:public-release`, cả hai exit 0. WASM ngspice 45.2 có SHA-256 `3096ce2c499c3062472b9d7953f5141d75a019296e22b0142f4979e5894008ec`, phép thử DC đọc 2,5 V. Lần audit không build hay công bố release mới. Hai gate phải chạy lại trên candidate định phát hành.
- Đóng gói dist đầy đủ, gồm `/licenses/ngspice-selfbuild`, notices, nguồn và vật liệu relink. Manifest tệp và hash của archive đi cùng release; credentials và tệp môi trường ở ngoài artifact công khai.
- Bước còn thiếu là đường **nâng cấp sau lần cài đầu**. Script hiện có dừng khi Caddy đã có analytics route. Xây chế độ update dùng cùng layout, kiểm tra cấu hình đang hoạt động, lock một tiến trình, stage release mới, đổi symlink atomically, smoke và trả về target trước nếu lỗi. Kiểm hai lần liên tiếp với cùng release. [Điểm dừng trong installer](../../../server/analytics/enable-web-arch.sh#L50)

## 3. Preflight trên máy thật

Đây là việc cho ca trực có quyền SSH hoặc trước máy. Chốt thời gian và người có quyền quay lại bản trước. Các lệnh sau chỉ đọc trạng thái; không yêu cầu gửi thông tin xác thực trong chat.

~~~bash
systemctl --user is-active mach-mo-web.service mach-mo-tailscaled.service machmo-analytics.service machmo-analytics-pg.service
readlink -f ~/.local/share/mach-mo/current
df -h ~/.local/share/mach-mo
free -h
ss -lnt
curl -fsSI http://127.0.0.1:8080/
curl -fsSI http://127.0.0.1:8080/vendor/eecircuit-engine/spice.wasm
~~~

Ghi lại target cũ, hash Caddyfile, file backend đang chạy, PostgreSQL major version, RAM trống, dung lượng để giữ candidate + release gần nhất + backup. Đối chiếu layout user service thực tế với [biên bản deployment](../../agents/runs/MM-ARCH-ANALYTICS-20261117/report.md). Mẫu /srv/mach-mo trong tài liệu tổng quan là một cách cài khác; host đã triển khai dùng ~/.local/share/mach-mo.

## 4. Chuyển bản trong cửa sổ bảo trì

| Thứ tự | Người làm | Hành động và điều kiện đi tiếp |
|---|---|---|
| 1 · Backup | Vận hành | Chụp manifest release hiện dùng, Caddyfile và backup DB qua Unix socket với pg_dump -Fc. Chép bản backup mã hóa sang vị trí được duyệt ngoài Mini PC. Kiểm đọc và restore vào DB thử, so số bản ghi mẫu và quyền. Ở lần phát hành chỉ web, giữ nguyên DB và tài khoản. |
| 2 · Stage | Vận hành | Stage candidate vào thư mục releases mang version/hash dưới user hiện hành. So SHA sau khi chuyển. Kiểm toàn bộ path tĩnh, file license và MIME WASM. Dùng cổng loopback riêng để smoke bản mới trước khi đổi current. |
| 3 · Switch | Vận hành | Giữ bản cũ, trỏ current tới bản mới bằng cơ chế nguyên tử đã diễn tập; chỉ reload Caddy khi cấu hình có thay đổi và đã qua caddy validate. Nếu thay API, kiểm schema tương thích cả release cũ và mới. |
| 4 · Smoke | Tester | Kiểm URL HTTPS công khai trên hai mạng, vào sâu /app/tools/spice, chạy fixture RC và tải CSV, hoàn thành bài đầu, mở bản nháp cũ, đổi board và xem waveform từ provider khả dụng. So JS hash với candidate và xác nhận asset/license cũ của tab còn mở truy cập được. |
| 5 · Analytics và báo cáo | Tester + vận hành | Phát sinh một bộ sự kiện demo được nhận diện trong cửa sổ test đã đồng ý; đường public nhận ghi theo hợp đồng, private summary truy cập qua SSH tunnel, public không trả summary. Dừng collector trong staging để kiểm người học vẫn dùng được web. |
| 6 · Chốt | Founder + vận hành | Ghi giờ chuyển, build/hash, bằng chứng smoke, người trực, ngưỡng quay lại, số lỗi mới. Giữ ít nhất một release và chuỗi asset cần thiết cho tab/SW cũ qua cửa sổ chuyển tiếp. |

**Go/no-go.** Dừng nếu thiếu license/nguồn bắt buộc, mạch nháp bị mất, deep link sai, provider báo khả dụng giả, public đọc được báo cáo riêng, hoặc không còn đường rollback đã diễn tập. Với một tính năng tùy chọn bị lỗi, tắt capability đó và xác minh luồng khách vẫn chạy trước khi quyết định phát hành.

**Quay lại.** Dùng thông tin target và cấu hình lưu ở bước 1; chuyển current atomically về release trước, khôi phục Caddyfile nếu từng thay, kiểm tra config rồi smoke lại web/analytics/nháp. Migration backend cần chiến lược thêm trước–chuyển sau để bản cũ vẫn đọc được. Khi nghi ngờ lỗi dữ liệu, dừng ghi chức năng liên quan, sao lưu hiện trạng và phục hồi thử vào DB riêng trước khi đổi nguồn dữ liệu. Tiêu chí xong là người dùng mở lại được mạch và báo cáo cũ còn đúng.

## 5. Điều kiện để bật thêm backend

| Khả năng | Trước khi bật | Khi dịch vụ ngừng |
|---|---|---|
| Đăng nhập và ảnh/tệp cộng đồng | Tạo staging, kiểm migration 001-community và chính sách storage/RLS với hai tài khoản. Duyệt quyền kiểm duyệt, hạn mức lưu trữ, cách xóa bài/tệp và mục đích dữ liệu. [Gói online](../../software/community-online/README.md) | Cho giữ nháp ở thiết bị, retry có định danh; chỉ báo đăng thành công sau xác nhận của server. |
| Đồng bộ và lớp học | Dùng project ID, revision, conflict UI, share có thể thu hồi, bộ kiểm A/B/giáo viên/khách. Có thể xuất file cho lớp học ngoại tuyến. | Mất mạng vẫn cho lưu local. Khi kết nối lại, hiển thị rõ xung đột và giữ cả hai bản. |
| AI Mở Bot | Endpoint status trả JSON hợp lệ, model được phép, giới hạn thời gian/đồng thời, có bộ câu kiểm board/revision. Duyệt nơi xử lý câu hỏi và chi phí. Không lựa chọn triển khai LLM thường trực trên máy RAM 4 GB trước khi đo cạnh Caddy/DB. | Quay về tìm kiếm/tài liệu nguồn cục bộ; báo nguồn trả lời để người học phân biệt. |
| Biên dịch từ xa | Provider riêng có giới hạn thao tác/thời gian/tài nguyên, kiểm target, và không can thiệp host. Cần benchmark bằng lớp thử. Nạp firmware lên thiết bị là yêu cầu độc lập. | Dùng ví dụ firmware có sẵn hoặc trình mô phỏng phù hợp; giữ code và nói rõ khả năng của board hiện tại. |

## 6. Vận hành sau phát hành

- **Trong giờ đầu:** kiểm tỷ lệ HTTP 5xx, JS chunk tải lỗi, thời gian mở bài, phản hồi người dùng, bộ nhớ và swap. Ưu tiên khôi phục khi người dùng không mở được nháp hoặc toàn bộ lớp không chạy được thí nghiệm. Phân biệt lỗi DNS của một mạng với lỗi Caddy, Funnel hoặc app.
- **Hàng ngày:** kiểm backup thành công, dung lượng còn lại, tuổi backup và lỗi dịch vụ. **Hàng tháng:** diễn tập restore ngoài SSD, kiểm quyền, thử giữ nháp qua cập nhật SW. Thử reboot có lịch với người giữ máy trước buổi học đầu tiên; ghi thời gian ứng dụng trở lại.
- **Chỉ số đề xuất:** thời gian phục hồi mục tiêu ≤2 giờ, mất dữ liệu server tối đa 24 giờ ở pilot. Dữ liệu khách nằm trên trình duyệt có cơ chế khác; hiển thị nút xuất file và giới hạn khi xóa dữ liệu trình duyệt. Ghi hạn lưu raw analytics 30 ngày, chính sách backup riêng và người được truy cập.
- **Founder cần chốt trước phần online:** có dùng Supabase managed và ngân sách tháng, nơi lưu backup ngoài SSD, người kiểm duyệt cộng đồng và thời gian bảo trì máy. Đội frontend vẫn triển khai được A/B, còn backend có thể chuẩn bị staging trong lúc chờ.
