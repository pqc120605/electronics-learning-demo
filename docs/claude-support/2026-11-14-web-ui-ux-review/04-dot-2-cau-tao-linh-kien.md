# 04 — Đợt 2: cấu tạo linh kiện và mạch chi tiết

Ngày: 2026-11-14 · Người làm: Claude · Tiếp nối [03-dot-1-da-mcu-va-chay-code.md](03-dot-1-da-mcu-va-chay-code.md).

Founder chọn "Làm cả 2" (SVG tự vẽ + model 3D nguồn mở). Đợt này làm phần SVG; phần 3D cần founder cho phép tải file (mục 4).

## 1. Hiện trạng trước khi làm

- 58 mục trong thư viện linh kiện. Hình 2D cũ (`ComponentIllustration`) là biểu tượng chung theo loại (một hình cho mọi "module"), không cho biết trên board có linh kiện gì.
- Mesh 3D (`public/models/components/*.glb`): 37 file; 13 lấy từ CAD nguồn, còn lại là mesh tham số (khối hình), không thể hiện linh kiện trên mạch.

## 2. Đã làm: sơ đồ cấu tạo mạch (SVG tự vẽ, dựa trên dữ liệu)

`src/data/componentAnatomy.ts` mô tả từng module: kích thước board, màu PCB, **từng linh kiện có trên mạch** (designator/mã IC, tên, vai trò điện, vị trí), **header chân** (nhãn, vai trò, loại nguồn/đất/tín hiệu/analog/bus), lưu ý an toàn và nguồn đối chiếu.

`src/components/ComponentAnatomy.tsx` vẽ bằng SVG của Mạch Mở: IC có chân và chấm pin 1, module kim loại có anten, thạch anh, tụ SMD/điện phân, điện trở SMD, LED, nút, biến trở, đầu siêu âm, cọc vít, relay, tản nhiệt, cổng USB, thấu kính Fresnel, màn OLED, jumper, diode. Bấm (hoặc Tab + Enter) vào linh kiện để xem vai trò; chân header tô màu theo loại. Hẹp hơn 640px thì xếp dọc (container query).

Thay hình 2D cũ trong trang Linh kiện khi có dữ liệu cấu tạo (giữ nút "Xem mô hình 3D" nếu có mesh).

| Module | Linh kiện trên mạch được vẽ |
|---|---|
| HC-SR04 | Đầu phát T, đầu thu R, MCU, IC lái đầu phát, khuếch đại thu, thạch anh; chân VCC/Trig/Echo/GND |
| L298N | IC L298N, tản nhiệt, ổn áp 78M05, jumper 5V-EN, diode chống dòng ngược, tụ lọc, 3 cọc vít, LED nguồn; ENA/IN1–IN4/ENB |
| Relay 1 kênh | Relay K1, transistor lái, diode flyback, opto (một số bản), LED, cọc NO/COM/NC; VCC/GND/IN |
| OLED SSD1306 | Tấm kính 128×64, LDO, tụ bơm, điện trở kéo lên I²C; GND/VCC/SCL/SDA |
| GY-521 MPU-6050 | MPU-6050, LDO, điện trở kéo lên, LED; 8 chân |
| PIR HC-SR501 | Thấu kính Fresnel, BISS0001, biến trở Sx/Tx, jumper H/L; VCC/OUT/GND |
| Tránh vật cản IR | LED IR, photodiode, LM393, biến trở ngưỡng, 2 LED; VCC/GND/OUT |
| ESP32 DevKit V1 | ESP32-WROOM-32, micro-USB, CP2102, AMS1117, nút EN/BOOT, LED GPIO2, LED nguồn, transistor tự nạp |
| Arduino Uno R3 | ATmega328P, ATmega16U2, thạch anh 16 MHz, USB-B, jack DC, NCP1117, LP2985, nút reset, LED L/TX/RX, ICSP |

Mỗi sơ đồ ghi "vẽ lại theo bản phổ biến, không phải ảnh hay CAD của hãng" và nêu khác biệt bản clone (ví dụ CH340 thay CP2102/ATmega16U2). Thông số lấy theo datasheet ghi ở dòng "Nguồn đối chiếu"; chưa đo trên board thật.

Ảnh: `screenshots/review-2026-11-14/after/interact/anatomy-hc-sr04.png`, `anatomy-l298n.png`, `anatomy-esp32.png`.

## 3. Kiểm tra

| Lệnh | Kết quả | Log |
|---|---|---|
| `npm.cmd run typecheck` | exit 0 | `D:/StartupOS/d2-typecheck.log` |
| `npm.cmd test` | 559 tests, 559 pass, 0 fail (thêm 2 test toàn vẹn dữ liệu cấu tạo) | `D:/StartupOS/d2-test.log` |
| `npm.cmd run build:local` | exit 0 (chạy lại sau các sửa a11y cuối) | `D:/StartupOS/d2b-build.log` |
| `npm.cmd run test:e2e` | Không chạy được: port 5196 vẫn bị `vite preview` PID 33356 giữ | — |
| Playwright cùng bộ spec, port 5208 | **75 passed, 3 failed** — đúng 3 lỗi có từ baseline | `D:/StartupOS/d2-e2e-alt.log` |
| axe (serious/critical) | 0 lỗi trên 9 trang linh kiện có sơ đồ + `/tools/sketch`, 375/1440 | — |

Axe lượt đầu bắt 2 lỗi đã sửa: màu chữ chân analog `#a8620a` (4,3:1) → `#8a4f06`; chữ trang trí trong hình (mã điện trở "103", "SRD-05VDC") làm tên truy cập không khớp chữ hiển thị → bỏ chữ trang trí.

Lượt e2e chạy trước 2 sửa a11y này (chỉ đổi màu và bỏ chữ trong SVG); unit test cấu tạo và build đã chạy lại sau sửa.

## 4. Model 3D nguồn mở (founder cho phép 2026-11-14)

Trước: 8 mục chưa có mesh 3D: `capacitor`, `jumper`, `logic-level`, `mosfet-module`, `neopixel`, `power-bank`, `soil-relay-pump`, `usb-cable`.

**Không cần tải mạng**: cả 2 file STEP và footprint đã có trong bản KiCad 10.0.7 cục bộ của dự án (`D:/StartupOS/.tools/kicad-10.0.7/share/kicad/`). Chuyển đổi bằng `occt-import-js` + `scripts/glb-writer.mjs` có sẵn, qua một script tạm trong scratchpad (không sửa `scripts/**`, chỉ sinh 2 file mới, không tái tạo GLB cũ).

| Catalog | Mesh mới | Nguồn STEP | GLB | Kích thước | Tam giác |
|---|---|---|---|---|---|
| `capacitor` (Tụ điện gốm) | `capacitor-ceramic` | `Capacitor_THT.3dshapes/C_Disc_D5.0mm_W2.5mm_P5.00mm.step` (35.469 B) | 102.720 B | 5,5 × 7,1 × 2,5 mm | 2.710 |
| `neopixel` (LED RGB WS2812B) | `neopixel` | `LED_SMD.3dshapes/LED_WS2812B_PLCC4_5.0x5.0mm_P3.2mm.step` (123.535 B) | 106.300 B | 5,4 × 1,6 × 5 mm | 1.242 |

- Chân lấy từ footprint KiCad: tụ gốm `a`/`b` cách 5 mm; WS2812B pad 1 VDD, 2 DOUT, 3 VSS, 4 DIN.
- `getComponentMeshForCatalog('capacitor')` trả `capacitor-ceramic`; tụ hóa (`electrolytic`) vẫn dùng mesh `capacitor` cũ.
- `public/models/components/NOTICE.txt` thêm ghi công KiCad Libraries contributors, CC BY-SA 4.0, các thay đổi.
- Ảnh trình xem 3D: `screenshots/review-2026-11-14/after/interact/mesh3d-neopixel.png`, `mesh3d-capacitor-ceramic.png`.

Module (`logic-level`, `mosfet-module`, `power-bank`, `soil-relay-pump`) và cáp/dây không có model chuẩn; nên làm sơ đồ cấu tạo SVG như mục 2.

Kiểm tra sau khi thêm model: typecheck đạt; unit **559/559** (`D:/StartupOS/m3b-test.log`); build đạt; e2e cổng 5208 **75 passed / 3 failed** (3 lỗi baseline, `D:/StartupOS/m3-e2e-alt.log`). Lượt đầu có 1 unit test hỏng: `tests/component-catalog.test.mjs` khóa `capacitor`/`neopixel` là "chưa có model"; đã đổi sang kiểm model riêng đúng linh kiện (nguồn `C_Disc_`/`WS2812B`) và vẫn cấm mượn mesh tụ hóa.

## 5. Chưa làm

- Sơ đồ cấu tạo cho module còn lại (BMP280, DHT22, LCD1602 + PCF8574, RFID RC522, buck/boost, TB6612, rotary encoder, soil…) — cùng khuôn dữ liệu.
- Dùng sơ đồ cấu tạo trong phòng lắp mạch (hiện ở trang Linh kiện).
- 6 mục còn lại chưa có mesh 3D (module, cáp, dây).
