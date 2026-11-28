# Firmware mẫu ESP32-S3 A4

Cấu hình và nguồn pinout của năm board được khóa trong [đề xuất A4](../../docs/research/2026-11-27-esp32-s3-electrical-firmware-a4-proposal.json). Mạch dùng GPIO5 với nút nhấn và điện trở kéo lên 10 kΩ. GPIO6 điều khiển LED qua điện trở 1 kΩ. UART0 ở 115200 baud ghi dung lượng flash khi khởi động và trạng thái nút sau chống dội.

Từ thư mục repo trên Windows, kích hoạt ESP-IDF v5.5.6 và Xtensa GCC đã ghi trong đề xuất. Biên dịch ba thư mục riêng bằng PowerShell.

```powershell
$src = (Resolve-Path firmware/esp32-s3-a4).Path
foreach ($size in '4m','8m','16m') {
  $build = (New-Item -Force -ItemType Directory ".tmp/a4-build/$size").FullName
  idf.py -C "$src" -B "$build" -D IDF_TARGET=esp32s3 -D "SDKCONFIG=$build/sdkconfig" -D "SDKCONFIG_DEFAULTS=$src/sdkconfig.defaults;$src/sdkconfig.$size.defaults" build
  if ($LASTEXITCODE -ne 0) { break }
}
```

Dùng compiler đã giải nén trong `.tmp/a4-vendor`. Đặt archive ESP-IDF và ESP-EMU đã xác minh trong `.tmp/a2-vendor`. Script đặt raw image, bản gzip và manifest vào `.tmp/a4-local-assets`. Vite chỉ phục vụ chúng qua loopback. ESP-EMU WASM được dùng lại từ `.tmp/a2-local-assets`.

```powershell
node scripts/stage-a4-esp-assets.mjs .tmp/a4-build .tmp/a2-vendor .tmp/a4-vendor
node --test tests/a4-esp32-s3.test.mjs
npm.cmd run dev -- --host 127.0.0.1
```

Vào **Thư viện → Board**, chọn đúng phiên bản, rồi mở **Mở mạch nút nhấn và LED A4**. Chọn **Chạy firmware**, thử nút nhấn và đo DC tại mức GPIO đã quan sát. Phạm vi kiểm chứng gồm mạch ngoài, GPIO5/GPIO6, UART0 và ngspice DC. PSRAM, TFT, USB, radio và kết quả trên board vật lý nằm ngoài phép thử.
