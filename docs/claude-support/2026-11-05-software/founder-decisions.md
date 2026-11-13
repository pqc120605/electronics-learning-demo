# Quyết định founder · phần mềm

## 05/11/2026 · Ngôn ngữ cho board Pico/ESP32: **giữ Arduino C++**

Founder trả lời câu hỏi "Bài Pico/ESP32 dùng MicroPython hay giữ Arduino C++?" bằng: **"Giữ Arduino C++"**.

### Hệ quả cho lộ trình

| Mục | Trước quyết định | Sau quyết định |
|---|---|---|
| G1 (Pico) | rp2040js + MicroPython, không compile | rp2040js chạy **firmware Arduino C++ đã biên dịch** (UF2/HEX). Khi chưa có compile service, chỉ chạy firmware mẫu biên dịch sẵn, giống HEX Uno hiện có |
| G2 (compile) | Không compile; compile server để sau | **Compile service arduino-cli trở thành bắt buộc** để chạy code của học viên trên Pico giả lập và ESP32 thật. Cần backend |
| G2 (nạp ESP32) | esptool-js nạp MicroPython rồi dùng REPL | esptool-js nạp **`.bin` Arduino do compile service tạo**. Không có REPL |
| G4 (Blockly) | Có thể thêm generator Python | Chỉ generator tập con Arduino (không đổi) |
| Học liệu | Có thể thêm bài Python | Giữ Arduino C++ cho mọi bài |

### Việc founder cần quyết tiếp

1. **Hosting compile service:** ai vận hành (VPS tự quản hay dịch vụ container trả phí), ngân sách hằng tháng, giới hạn lượt compile mỗi học viên.
2. **Khi không có backend:** chấp nhận chỉ chạy firmware mẫu biên dịch sẵn và xuất `.ino` như hiện nay.
3. **Arduino core cho RP2040 và ESP32:** license từng core phải kiểm trước khi chạy dịch vụ [chưa kiểm chứng; box02 kiểm].

Brief G1, G2, `tool-evaluation.md`, `README.md` và `codex-handoff.md` đã cập nhật theo quyết định này.

## 06/11/2026 · Hosting compile service: **VPS tự quản**

Founder trả lời câu hỏi "Ai vận hành compile service?" bằng: **"VPS tự quản"**.

### Hệ quả

- Mạch Mở tự chịu việc vá OS, cập nhật Docker và arduino-cli, theo dõi, sao lưu cấu hình, gia hạn chứng chỉ TLS. Cần một người chịu trách nhiệm vận hành (chưa có role agent nào làm được việc trên máy thật).
- Thiết kế bảo mật trong `briefs/G2.md` mục "Vận hành trên VPS tự quản" là điều kiện bắt buộc trước khi mở cho học viên.
- Cấu hình máy ban đầu là **giả định cần đo**, không phải yêu cầu đã kiểm chứng (xem G2).

### Còn chờ founder

1. Ngân sách VPS hằng tháng và nhà cung cấp (có trung tâm dữ liệu tại Việt Nam hay không).
2. Ai là người vận hành (founder hay kỹ thuật viên).
3. ~~Học viên đăng nhập hay ẩn danh~~: đã quyết, xem mục dưới.

## 06/11/2026 · Cập nhật hosting: **pilot trên Raspberry Pi 5 tại chỗ, chuyển VPS khi mở rộng**

Sau khi so các cách miễn phí, founder chọn: chạy compile service trên một máy nhúng riêng đặt tại chỗ cho giai đoạn pilot, giữ nguyên thiết kế để chuyển cùng image Docker lên VPS khi số học viên tăng. Quyết định này thay mục "VPS tự quản" ở trên cho giai đoạn pilot; VPS trở thành bước mở rộng.

### Hệ quả

- Không tốn phí thuê server trong pilot; chi phí là phần cứng một lần và tiền điện.
- Thiết bị đề xuất: Raspberry Pi 5 8 GB, SSD (USB 3 hoặc NVMe), tản nhiệt chủ động, Linux 64-bit. Chưa mua: phải qua bước kiểm toolchain ARM64 trước (box02).
- Ra Internet qua tunnel (Cloudflare Tunnel hoặc Tailscale Funnel), không mở port router [chưa kiểm chứng điều khoản gói miễn phí].
- Máy chỉ dùng cho compile service; không lưu dữ liệu cá nhân của founder; đặt ở mạng khách/VLAN riêng nếu router hỗ trợ.
- Khi máy tắt hoặc quá tải, web báo dịch vụ tạm ngừng và giữ đường xuất `.ino` + firmware mẫu.

### Điều kiện chuyển sang VPS

Chuyển khi xảy ra một trong các điều: hàng chờ thường xuyên quá 2 phút; máy tắt ngoài ý muốn nhiều hơn 1 lần/tuần; số học viên vượt mức pilot founder đặt. [Founder chốt ngưỡng số học viên.]

## 06/11/2026 · Compile cần đăng nhập

Founder trả lời câu hỏi "Học viên có cần đăng nhập để compile không?" bằng: **"Cần đăng nhập"**.

### Hệ quả

- Rate limit và hạn mức compile tính theo tài khoản, không theo IP.
- Phần còn lại của web giữ guest-first: học, mô phỏng, SPICE, AVR8js với HEX mẫu, xuất `.ino` vẫn không cần tài khoản. Chỉ nút "Biên dịch" yêu cầu đăng nhập.
- Repo đã có Supabase Auth phía client (`src/lib/supabase.ts:8-15`, chỉ dùng cho admin: `src/lib/admin.ts:37`, `:52`). Đề xuất dùng lại Supabase Auth cho học viên; compile API xác thực JWT Supabase ở phía server. Chi tiết trong `briefs/G2.md`.
- Tài khoản học viên là dữ liệu cá nhân, có thể của trẻ vị thành niên. Thu tối thiểu (email hoặc tài khoản do giáo viên cấp), không thu tên thật/ngày sinh nếu không cần. Yêu cầu đồng ý của phụ huynh và nghĩa vụ theo luật bảo vệ dữ liệu cá nhân tại Việt Nam: [cần chuyên gia pháp lý xác nhận].

### Còn chờ founder

1. ~~Hình thức tài khoản~~: đã quyết, xem mục dưới.
2. Hạn mức compile mỗi tài khoản mỗi ngày.

## 06/11/2026 · Tài khoản: **học viên tự đăng ký bằng email**

Founder trả lời câu hỏi "Tài khoản học viên tạo theo cách nào?" bằng: **"Tự đăng ký email"**.

### Hệ quả

- Chỉ tài khoản đã **xác nhận email** mới được compile. Đăng ký chưa xác nhận trả `auth-required`.
- Thu tối thiểu: email + mật khẩu (hoặc magic link). Không thu tên thật, ngày sinh, số điện thoại ở MVP.
- Rủi ro lạm dụng: một người tạo nhiều email để vượt hạn mức. Biện pháp: hạn mức theo tài khoản, hạn mức tổng theo IP ở reverse proxy, chặn tên miền email dùng một lần [chưa kiểm chứng danh sách nguồn mở phù hợp].
- Rủi ro pháp lý: học sinh dưới tuổi luật định có thể tự đăng ký mà không có phụ huynh. Cần bước xác nhận độ tuổi hoặc đồng ý của phụ huynh trước khi mở đăng ký công khai [cần chuyên gia pháp lý xác nhận ngưỡng tuổi và cách lấy đồng ý theo luật Việt Nam].
- Cần trang chính sách quyền riêng tư cập nhật cho tài khoản học viên (repo đã có route `R.privacy`, `src/App.tsx:138`).
