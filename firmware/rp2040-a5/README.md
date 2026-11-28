# Mạch nút nhấn và LED A5 trên RP2040

Phạm vi và nguồn được ghi trong [cấu hình A5](../../docs/research/2026-11-27-rp2040-electrical-firmware-a5-proposal.json). Dùng firmware C biên dịch cho hai target Pico SDK `pico` và `pico_w`. Nút ở J0:19 (GP14) kéo lên 3,3 V bằng 10 kΩ. LED ngoài nối J0:20 (GP15) qua 1 kΩ. UART0 ở 115200 baud ghi target khi khởi động và trạng thái ổn định sau chống dội.

## Biên dịch lại trên Windows

Chuẩn bị Pico SDK 2.2.0 đúng commit trong cấu hình tại `.tmp/a5-vendor/pico-sdk`. Đặt ZIP Arm GNU Toolchain 14.2.Rel1 đã xác minh và nội dung giải nén tại `.tmp/a5-vendor`. CMake 3.30.2, Ninja 1.12.1 và Python phải có trong PATH. Lệnh chuẩn bị dùng boot ROM RP2040 B2 đã xác minh tại `.tmp/firmware-cache/rp2040-bootrom-b2.bin`.

```powershell
$env:PICO_SDK_PATH = (Resolve-Path .tmp/a5-vendor/pico-sdk).Path
$env:PICO_TOOLCHAIN_PATH = (Resolve-Path .tmp/a5-vendor).Path
foreach ($board in 'pico','pico_w') {
    cmake -S firmware/rp2040-a5 -B ".tmp/a5-build/$board" -G Ninja -D CMAKE_BUILD_TYPE=Release -D "PICO_BOARD=$board" -D PICO_PLATFORM=rp2040 -D PICO_NO_PICOTOOL=1
    if ($LASTEXITCODE -ne 0) { throw "CMake failed for $board" }
    cmake --build ".tmp/a5-build/$board"
    if ($LASTEXITCODE -ne 0) { throw "Build failed for $board" }
}
node scripts/stage-a5-pico-assets.mjs .tmp/a5-build .tmp/a5-vendor
node --test tests/a5-rp2040.test.mjs
```

Lệnh chuẩn bị lưu ảnh flash, boot ROM và manifest kiểm tra vào `.tmp/a5-local-assets`. Chạy `npm.cmd run dev -- --host 127.0.0.1`, vào **Thư viện → Board**, chọn Pico R3 hoặc Pico W rồi mở **Mở mạch nút nhấn và LED A5**. Đo ngspice ở trạng thái GPIO đã quan sát. Kết quả áp dụng cho mạch ngoài, GPIO, bộ định thời và UART0 mô phỏng. Wi‑Fi/BLE, LED onboard, USB, SWD và kiểm trên phần cứng nằm ngoài phép thử A5.
