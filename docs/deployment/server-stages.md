# Mạch Mở · Nghiệm thu các đợt server

Cập nhật 21/11/2026. Hồ sơ áp dụng cho nhánh staging từ S2 `5ac7af8`. Giữ web công khai ở `https://mach-mo.vercel.app` trong khi kiểm API và dữ liệu riêng. Quy trình quản lý checkout, backup và rollback nằm trong [hướng dẫn Mini PC](mini-pc-api.md).

## Kết quả kiểm trong checkout staging

| Kiểm thử | Kết quả |
|---|---|
| Hồi quy dự án | 817/817 |
| API và monitor loopback | 36/36 ngoài ca PostgreSQL tách riêng |
| PostgreSQL 17 trong container loopback | Áp dụng 001–007, chạy lại không thêm migration. Qua ca thử hạn mức AI, retention, quyền lớp/project, hai định dạng chia sẻ và xóa dữ liệu cùng tài khoản. |
| Chromium | 14/14 · OAuth giả lập, dashboard 375/1440 sáng/tối, chia sẻ mạch tự do, nộp bài, offline |
| Mở Bot | 55/55 câu với provider mock. Chưa đo trên model thật. |
| Build công khai với cờ staging tắt | `npm.cmd run build:public` exit 0 trên checkout Windows |

## Nâng cấp staging đã có

Hai migration S1 đã chạy ở checkout `8ec33b3` trên Mini PC. Backup đầu tiên đã tạo là `machmo_api_staging-20261120T164724Z.dump`. Hoàn tất diễn tập restore vào database rỗng chuyên dụng theo hướng dẫn Mini PC trước khi thêm migration 003–007. Bản nâng cấp dùng lại user service và database staging hiện có.

Sau khi ghi nhận số migration, sự kiện và phiên từ diễn tập restore, dùng lệnh dưới đây trong terminal Mini PC. Đối chiếu SHA được Git in ra với commit đã duyệt.

```bash
cd "$HOME/projects/mach-mo-api-staging" &&
git status --short &&
git fetch origin refs/heads/codex/server-staging &&
git --no-pager log -1 --format='%H %s' FETCH_HEAD
```

```bash
read -r -p 'SHA staging đã đối chiếu: ' expected &&
test -n "$expected" && test "$expected" = "$(git rev-parse FETCH_HEAD)" &&
test -z "$(git status --porcelain)" &&
git switch --detach "$expected" &&
node --test server/api/*.test.mjs &&
bash server/api/staging-ops.sh check "$expected" &&
bash server/api/staging-ops.sh deploy "$expected" &&
curl -fsS http://127.0.0.1:8281/api/health
```

## S1 và S2 · HTTPS và tài khoản thật

- S1 đã kiểm trên `127.0.0.1:8281` với PostgreSQL thật trên Mini PC. Cần kết quả restore bản staging trước khi đổi database. Dùng lại URL HTTPS API đã được nghiệm thu nếu có. Khi mở Funnel hoặc thay Caddy, cần chốt đúng cổng và đường dẫn. Chạy `caddy validate`, backup cấu hình, ghi SHA trước/sau, kiểm health bằng TLS hợp lệ và đối chiếu `Cache-Control: no-store` qua Vercel Preview.
- Backend nhận `Host` và `Origin` đúng origin S2 đã chọn. Áp cấu hình Preview trước, kiểm `/api/health` trả đúng SHA, rồi tạo ứng dụng OAuth riêng cho Preview. Thử hai callback, cookie và phục hồi nháp thật. [Thông số OAuth](oauth-setup.md)

## S3 và S4 · Hỏi AI và quản trị

- Sau khi API hoạt động qua HTTPS, bật frontend Preview với `VITE_MACHMO_SELF_HOSTED_OAUTH=true`. Dùng thêm `VITE_MACHMO_SELF_HOSTED_ANALYTICS=true` cho dashboard và các trường thống kê mở rộng. `vercel.json` đã có route SPA cho `/admin` và header `X-Robots-Tag: noindex, nofollow`. API `/api/admin/*` kiểm lại role từ cookie trên mỗi request. Admin gán theo `ADMIN_ACCOUNTS` đã ghi trong hồ sơ S2.
- Chạy provider `mock` để nghiệm thu khách, phiên và giới hạn. Khi thử OpenAI, cấu hình `GUIDE_AI_PROVIDER=openai`, `OPENAI_MODEL`, `OPENAI_API_KEY`, `GUIDE_AI_DAILY_REQUEST_CAP` trên Mini PC. Giá ước tính chỉ hiện nếu cấu hình `GUIDE_AI_INPUT_USD_PER_MILLION` và `GUIDE_AI_OUTPUT_USD_PER_MILLION` cho đúng model. Giữ giới hạn chi tiêu dự án riêng trước khi gọi thật.
- Mỗi tài khoản được 20 lượt/ngày theo giờ Việt Nam. Lượt trả từ cache cũng tính vào hạn mức. Cache mỗi tài khoản lưu trong RAM tối đa 24 giờ, hiện cận 256 mục. Hai lượt OpenAI đồng thời và mỗi lượt gửi tối đa một request upstream. PostgreSQL lưu số lượt, model, độ trễ, token và đánh giá. Nội dung hội thoại và email không ghi trong nhật ký. Định danh gửi OpenAI là HMAC của ID nội bộ. `store:false` dùng cho Responses API. Chính sách mặc định của OpenAI vẫn có thể giữ nhật ký kiểm soát lạm dụng. [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create) · [Kiểm soát dữ liệu](https://developers.openai.com/api/docs/guides/your-data)
- Cờ thống kê dùng nhóm kích thước viewport, domain giới thiệu và mã bài/board theo allowlist. Sự kiện thô giữ 90 ngày. Dữ liệu theo ngày giữ 13 tháng, tính theo múi giờ Việt Nam khi qua ngày. Phễu là các lượt mở bài, chạy và tự đánh dấu hoàn thành theo thứ tự trong cùng phiên, dùng trong khoảng 7, 30 hoặc 90 ngày.

## S5 · Vận hành Mini PC

- Sau khi release, chạy `mach-mo-api-staging-monitor.service` một lần, kiểm exit 0 và đối chiếu SHA trong journal. Sau đó bật timer `mach-mo-api-staging-monitor.timer` để kiểm mỗi năm phút. Timer backup riêng giữ bảy bản khi đã diễn tập khôi phục. Cảnh báo 80% nằm trong dashboard và journal. Bản offsite mã hóa cần chốt nơi lưu và khóa nhận trước khi sao chép.
- Ghi baseline `free -m`, đĩa, health và `NRestarts` sau 10 phút. Khi được phép diễn tập reboot, xác nhận user services khởi động qua linger, có health đúng SHA, đủ bài dữ liệu thử và backup timer được đặt lại. Kiểm tùy chọn tiếp tục cấp nguồn sau mất điện trong BIOS theo tài liệu đúng model Mini PC. Đối chiếu đường SSH qua Tailscale trước khi thay phương thức đăng nhập.
- Nếu chọn tên miền riêng sau này, chốt tên và DNS trước, giữ web chính trong lúc dựng tunnel cố định. Xuất các bản nháp cần giữ trước khi đổi origin. Đổi callback, CORS, proxy và URL cùng phiên bản. Chỉ bật redirect 308 sau khi kiểm nhập lại nháp và OAuth qua cả hai host.

## S6 · Đánh giá Ollama trên máy đích

- Adapter nhận `GUIDE_AI_PROVIDER=ollama`, `OLLAMA_MODEL`, `OLLAMA_CONTEXT` và `OLLAMA_URL=http://127.0.0.1:11434`. Context nhận 2048, 3072 hoặc 4096. Cấu hình daemon chỉ bind loopback, `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`. Chốt `MemoryMax` theo số RAM đo thực tế cùng PostgreSQL. API có một worker và một lượt chờ, báo 503 khi đầy. Giới hạn 60 giây gồm cả thời gian chờ. [Ollama Chat API](https://docs.ollama.com/api/chat)
- Ứng viên để thử theo thứ tự là `qwen3.5:0.8b`, `qwen3.5:2b`, `qwen3.5:4b`. Registry ghi cỡ tải tương ứng 1,2–1,3 GB, 2,7–3,1 GB và 3,3–4,0 GB. Các số này là dung lượng artifact. RAM runtime và chất lượng tiếng Việt phải đo trên Mini PC. Chốt RAM và model trước khi cài hoặc kéo. [Tag của Qwen 3.5](https://ollama.com/library/qwen3.5/tags)
- `node scripts/eval-guide-ai.mjs mock` chạy miễn phí trên fixture. Chỉ chạy `openai` khi owner cấp project/key thử và cho phép chi phí. Chạy `ollama` khi loopback và tag đã sẵn sàng. Ghi tỷ lệ đạt, p50/p95, RSS tiến trình Ollama, peak RAM hệ thống và việc PostgreSQL vẫn ready. Chỉ chọn local nếu đạt tiêu chí nguồn/trả lời và còn đủ RAM khi chạy song song web; số đo fixture không dùng để đổi provider production.

## S7 · Projects và lớp học

- Bản trên thiết bị giữ độc lập. Lưu lên tài khoản theo thao tác người dùng, lưu trữ snapshot bất biến. Khác byte/nội dung sẽ giữ phiên bản riêng. Tải về tạo bản sao đã chạy qua bộ kiểm định dạng hiện có. Cận server 56 KiB/project, 50 snapshot và 2 MiB/tài khoản. Project lớn hơn tiếp tục dùng xuất/nhập tệp.
- Link `/s/:code` hỗ trợ project theo bài và mạch tự do. Bàn tự do có nút chia sẻ online riêng, lưu mạch và code theo thao tác rõ ràng của người dùng; bản sao mở trong nháp riêng. Có lựa chọn xuất hiện trong gallery, thích và báo cáo chung với cộng đồng. Xóa snapshot hoặc thu hồi link dừng chia sẻ. Xác minh route SPA `/s/:code` khi bật Preview. Đổi các cờ frontend và API cùng lượt.
- Lớp online dùng board và danh sách bài trong gói lớp hiện có. Tài khoản tạo lớp giữ quyền giáo viên cho lớp đó. Học sinh vào bằng mã, xem bài giao và nộp snapshot của mình trùng board/bài. Giáo viên xem số bài đã nộp và các bản nộp gần nhất. Dữ liệu lớp và project đi theo vòng đời tài khoản.

## S8 · Biên dịch và mô phỏng ESP32

- L6e đang để sau theo quyết định trước. Cần nghiệm thu ESP32 DevKit V1 4 MiB với manifest L6e đã duyệt và chốt cấu hình toolchain trước khi tạo firmware mới. Cần duyệt phiên bản, nguồn và dung lượng trước khi cài `arduino-cli`, core hoặc QEMU. Kết quả build L6e đã ghi trong hồ sơ audit ngày 19/11.
- Dịch vụ biên dịch cần sandbox riêng không mạng, tài khoản thường, giới hạn 1 GiB/180 giây, một worker, thư viện allowlist, 5 lượt/giờ/tài khoản và quota artifact. Kiểm quyền tải file của chủ job, TTL 24 giờ, canary BIOS/reboot độc lập. Trước khi tạo `.bin`, đối chiếu manifest board, offset và quyền phân phối từng tệp.
- Spike QEMU kiểm riêng ESP32/ESP32-S3 XTensa và ESP32-C3 RISC-V với build được duyệt. Lưu bảng boot, UART, GPIO, PWM, ADC, I²C, thời gian, RSS và CPU. Tách ngoại vi được mô phỏng, ngoại vi thiếu và kết quả đo board thật. Các ô hiện `NOT_RUN`. [ESP32](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/qemu.html) · [ESP32-S3](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/tools/qemu.html) · [ESP32-C3](https://docs.espressif.com/projects/esp-idf/en/stable/esp32c3/api-guides/tools/qemu.html)
