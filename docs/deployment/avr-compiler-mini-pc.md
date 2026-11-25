# Biên dịch Arduino cho web trên Mini PC

## Phạm vi

Uno R3, Nano classic và Mega 2560 dùng Arduino CLI 1.6.0 và Arduino AVR Core 1.8.8. Máy chủ trả Intel HEX cho avr8js ngay trong trình duyệt. Khách dùng web mà không cần cài Arduino IDE. Khi chọn **Biên dịch trên máy chủ**, sketch chỉ được gửi lúc bấm Chạy. Mạch chia sẻ chỉ đọc tiếp tục dùng mô phỏng ngay trên trình duyệt. [Arduino CLI 1.6.0](https://github.com/arduino/arduino-cli/releases/tag/v1.6.0) · [Arduino AVR Core 1.8.8](https://github.com/arduino/ArduinoCore-avr/releases/tag/1.8.8)

Luồng yêu cầu đi từ Vercel qua Caddy đến service compiler trên loopback `127.0.0.1:8285`. Service biên dịch tách khỏi Node API và PostgreSQL. Container mới theo mỗi lượt, image ID bất biến, không kết nối mạng, filesystem chỉ đọc với hai vùng tạm có giới hạn. Container chạy UID riêng, giới hạn 384 MiB và 45 giây. Service nhận tối đa 1 lượt đồng thời và 8 lượt/phút cho máy chủ hiện tại. Không lưu sketch hoặc log nguồn trong hồ sơ vận hành. Chỉ trả thông báo compiler đã giới hạn dung lượng cho người yêu cầu. [Tùy chọn runtime Podman](https://docs.podman.io/en/latest/markdown/podman-run.1.html)

## Cài vào Mini PC

Chạy trong tài khoản SSH `volnexus` với checkout đúng commit và Podman rootless trên cgroups v2. Phần dựng image cần Internet để lấy toolchain cố định. Chỉ tiến trình compiler được mở công khai qua hai tuyến API sau khi kiểm loopback.

```bash
rev=$(git rev-parse HEAD)
bash server/compiler/setup.sh "$rev"
bash server/api/deploy-dashboard-edge.sh "$rev" --enable-compiler
```

`setup.sh` xác minh image ID, khởi động user service và gửi sketch cố ý sai cú pháp. Kết quả đạt phải là HTTP 422 với thông báo dòng lỗi từ Arduino CLI thật. Lệnh này không tạo firmware có thể nạp. Sau khi bật proxy, kiểm `/api/tools/arduino/status` từ Vercel cùng một ca chẩn đoán 422. Kiểm browser kết hợp fixture HEX đã có trong repo. Nghiệm thu dịch vụ với sketch người dùng và board thật thực hiện riêng theo cấu hình được duyệt.

Để tắt đường công khai, chạy lại `deploy-dashboard-edge.sh` với commit hiện hành và `--disable-compiler`. Khi không truyền cờ, script giữ tuyến AI và Arduino đang có. Có thể dừng riêng `mach-mo-avr-compiler.service` sau khi gỡ đường proxy.

## Các công cụ khác

| Công cụ | Đường chạy |
| --- | --- |
| SPICE, bộ tính, diễn giải Arduino C++ rút gọn, AVR HEX và hiện dạng sóng | Chạy trong trình duyệt, dùng luôn trên web. |
| Kiểm UF2 và Pico Arduino C++ | Chạy trong trình duyệt. |
| Pico MicroPython | Trên web, bước Viết code & Chạy nhận boot ROM B2 (.elf hoặc .bin) người dùng có quyền sử dụng trong trình giả lập. Tệp được kiểm SHA-256 và giữ trong bộ nhớ tab. Mini PC và Vercel chỉ phục vụ firmware MicroPython UF2 đã ghim. Điều khoản của mufplib nằm riêng trong [mã nguồn Raspberry Pi](https://github.com/raspberrypi/pico-bootrom-rp2040/blob/master/bootrom/mufplib.S). |
| Mở Bot | Tra cứu trong trình duyệt dùng được. Provider thật triển khai riêng theo kiểm tra RAM và chất lượng tại [kế hoạch backend](server-stages.md#s6--đánh-giá-ollama-trên-máy-đích). |
| Nạp qua USB | Trình duyệt mở cổng với board cắm trực tiếp ở máy người dùng. Máy chủ có thể cấp artifact đã duyệt. |
