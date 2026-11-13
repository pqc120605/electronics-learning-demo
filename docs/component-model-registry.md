# Registry model linh kiện — 02/11/2026

Tệp này tách bốn mức thể hiện của một linh kiện. Một mức có mặt không chứng minh mức khác.

| Mức | Nơi có | Ý nghĩa |
|---|---|---|
| Ký hiệu sơ đồ | `src/components/builder/SchematicSymbol.tsx` | Ký hiệu riêng cho 7 loại (board, breadboard, nút, tụ, diode, LED, điện trở); loại còn lại dùng ký hiệu chung |
| Hình 2D | `src/components/ComponentIllustration.tsx` | SVG giáo dục, không phải CAD |
| Khối 3D CSS | `src/components/builder/Assembly3DView.tsx` | Chỉ còn là phương án dự phòng khi trình duyệt không mở được WebGL 2 |
| Mesh GLB | `public/models/components/` | Dùng trong cảnh lắp 3D của phòng thử và nút "Xem mô hình 3D" ở trang Linh kiện |

`src/data/componentModels.ts` đọc `src/data/component-models.manifest.json` và trả về các mức này. Sinh lại bằng:

```powershell
node scripts/generate-component-models.mjs
```

Nếu máy không có KiCad 9 ở đường dẫn mặc định, đặt `KICAD9_3DMODEL_DIR`. Khi không thấy thư viện, script giữ GLB đã có trong manifest.

## Bổ sung thư viện — 02/11/2026

- Builder hiện có 27 loại linh kiện vật lý, đủ mesh GLB; `board` dùng viewer board riêng, không dùng mesh rời. Tổng manifest có 37 GLB sau khi bổ sung 10 model tra cứu tham số.
- Hai mesh mới được dựng bằng hình học tham số trong `scripts/generate-component-models.mjs`; không lấy từ model hãng/community, không phải model theo mã part. Ghi chú riêng hiện cạnh chế độ xem 3D để nêu giới hạn về kích thước, chân và thông số chưa xác minh.
- Thêm mesh tham số riêng theo ID tra cứu cho DHT22, PIR, module LDR AO/DO, đầu dò đất điện dung, MPU6050, BMP280, mắt thu IR, LCD1602 I²C, encoder xoay và RC522. Hình học thể hiện dạng khối chung, không xác nhận model hãng, pinout hoặc kích thước thực. Trang Linh kiện ưu tiên ID mesh trùng catalog trước khi dùng alias builder để tránh gán sai model.
- Các mục tra cứu như module chuyển mức logic, dây USB/jumper và một số board nguồn vẫn chưa có mesh riêng; không dùng model gần giống để giả danh chúng.
- [Wokwi Elements](https://github.com/wokwi/wokwi-elements) là nguồn MIT hữu ích để tham khảo cách làm web component trình bày tương tác; upstream nói rõ nó chỉ cung cấp presentation, không chứa logic mô phỏng. Đây không phải nguồn mesh 3D; không thêm dependency hay chép asset Wokwi trong lát cắt này.

## Quyền sử dụng

- **Mesh CAD (KiCad):** chuyển từ STEP trong thư viện KiCad Packages3D đi kèm KiCad 9.0 trên máy. [Điều khoản thư viện](https://www.kicad.org/libraries/license/): CC BY-SA 4.0 có ngoại lệ cho thiết kế điện tử; ngoại lệ đó không áp dụng khi phân phối lại model. Vì vậy các GLB này giữ CC BY-SA 4.0, ghi công trong `public/models/components/NOTICE.txt`. Phát hành công khai vẫn cần chủ dự án chấp nhận share-alike cho riêng các file này.
- **Tham số:** do script của dự án sinh, không dùng tài sản bên thứ ba. Dự án chưa chọn license nên chưa có điều khoản phân phối cho nhóm này.

## Dữ liệu chân

`src/data/component-models.manifest.json` còn ghi chân của từng model:

- **Mesh KiCad:** `pinsMm` và `legsMm` đọc từ pad của footprint `.kicad_mod` cùng tên. Đây là vị trí pad của footprint, gốc model là chân 1, mặt tựa ở y = 0.
- **Mesh tham số:** vị trí chân do script đặt, chỉ để minh họa. Ghi chú riêng theo model nêu rõ module nào không xác nhận pinout/geometry thực. Thứ tự chân các module driver/cảm biến không đại diện cho mọi breakout.
- **Gán pad với tên chân:** cathode là pad 1 của LED và diode theo footprint KiCad. Transistor theo thứ tự C-B-E thường gặp, MOSFET theo G-D-S, LED 7 đoạn theo sơ đồ chân thông dụng của loại 0,56 inch một số. Linh kiện thật phải đối chiếu datasheet.
- **Breadboard:** mô hình 400 lỗ, bước 2,54 mm, hai nửa cách nhau 7,62 mm, 30 cột. `gridMm` là nguồn duy nhất cho lưới này.

## Trang linh kiện và liên kết bài học — 02/11/2026

- Trang catalog dùng hình SVG nội bộ của `ComponentIllustration` làm ảnh minh họa nhất quán. Đây là tranh giải thích do dự án dựng, không phải ảnh chụp hay CAD chính hãng; mesh 3D chỉ hiển thị khi registry có model phù hợp.
- Trang chuẩn bị bài tạo link đến catalog từ `catalogId` của `componentRegistry`, nên các tên builder như `ultrasonic` mở đúng hồ sơ catalog `hc-sr04`. Trang `/components?component=<id>` khôi phục và giữ lựa chọn trên URL, có ích cho chia sẻ đường dẫn và nút quay lại.
- Tài liệu nguồn được gắn theo component ID trong `src/data/componentReferences.ts`. Tài liệu của IC không được dùng để khẳng định mọi board breakout có cùng pinout/điện áp; hồ sơ không có nguồn cụ thể tiếp tục yêu cầu đối chiếu đúng mã module.

Board Adafruit QT Py ESP32-C3 Rev B #5405 có viewer board riêng, không phải mesh linh kiện rời: GLB/STEP, Eagle CAD, README, pinout và notices nằm ở `public/models/adafruit-qtpy-esp32-c3-5405.glb`, `public/cad/adafruit-qt-py-esp32-c3-rev-b/` và `public/models/adafruit-qtpy-esp32-c3-5405.NOTICE.txt`. Model có 35 mesh designator-mapped và một nhóm 75 mesh chưa định danh; không đưa suy luận của nhóm chưa định danh vào catalog linh kiện.

Board Adafruit Feather ESP32-S3 #5323 cũng có hồ sơ board riêng: `public/models/adafruit-feather-esp32-s3-5323.glb`, CAD nguồn và các license/README ở `public/cad/adafruit-feather-esp32-s3-5323/`, notice cạnh GLB. Đúng biến thể #5323 có 8 MB flash, không PSRAM; không áp dụng model này cho #5477/#5885. Có 33/47 designator ghép mesh, 14 footprint còn lại chỉ có thông tin CAD, và 129 mesh gộp thành nhóm chưa định danh. Có thể chọn 28 pad JP1/JP3 để tra cứu net CAD và GPIO/function theo đúng PID; đây không phải netlist, tô copper hay kiểm chứng board vật lý. Guide hãng cho biết U4/BME280 là footprint dự phòng, cảm biến không được lắp sẵn.

Board Adafruit Feather ESP32-S3 TFT #5483 có thêm viewer board riêng tại `public/models/adafruit-feather-esp32-s3-tft-5483.glb`; STEP, Eagle CAD, schematic, README và điều khoản được lưu tại `public/cad/adafruit-feather-esp32-s3-tft-5483/`, kèm notice cạnh GLB. Đây là biến thể 4 MB flash + 2 MB PSRAM với TFT màu 1,14 inch, không phải Feather #5323. Có 37/54 designator khớp được mesh; 17 footprint không có mesh vẫn tra cứu được; 114 mesh chưa ánh xạ giữ là chưa định danh. MCU U6 có footprint nhưng không có khối STEP đã ghép, nên không bịa hình MCU. Có thể chọn 28 pad JP1/JP3 để xem net CAD và pinout riêng của bản TFT; chức năng này không tạo netlist/tô copper và chưa kiểm tra board vật lý.

## Mức xác minh

- Mesh KiCad là **vỏ tiêu chuẩn**, không phải model của hãng hay mã sản phẩm cụ thể. Ví dụ LED 7 đoạn dùng vỏ HDSP-7801, bài học chỉ giả định cathode chung; điện trở dùng vỏ DIN 0207 cho mọi trị số.
- Mesh tham số dựng theo **kích thước thường gặp**. Chưa đối chiếu với bản vẽ của hãng hay module thật. HC-SR04 45 × 20 × 15 mm được nêu trong [tài liệu thứ cấp](https://www.ultralibrarian.com/2024/10/01/hc-sr04-datasheet-analysis-ulc?amp=1); SG90 22,2 × 11,8 × 31 mm cũng chỉ thấy ở nguồn thứ cấp. Không phân biệt cực tính hay thứ tự chân qua các mesh này.
- Biến trở dùng model tham số vì thư viện KiCad trên máy chỉ có STEP cho trimmer Bourns và Vishay, không có biến trở núm xoay. OLED dùng model tham số vì `Adafruit_SSD1306.step` là module khác với OLED I²C 4 chân trong bài.
- `thermistor` và `limit-switch` nay có mesh tham số; không xác nhận thông số/cơ khí của linh kiện cụ thể. `board` dùng các viewer board riêng.
- 10 mesh bổ sung cho catalog cũng là hình học tham số do dự án tự sinh. Không có asset cộng đồng/hãng nào được chép vào các model này.

## Danh sách mesh

| ID | Loại | Vỏ/mô tả | Nguồn | Kích thước mm (X × Y × Z) | Đặt trên | KB | SHA-256 (12 ký tự) |
|---|---|---|---|---|---|---:|---|
| `battery` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 77.5 × 16.7 × 32 | bàn | 23 | `5992493ebed0` |
| `bmp280` | Tham số | Breakout cảm biến áp suất chung | `scripts/generate-component-models.mjs` | 24 × 9 × 16 | bàn | 8 | `68d5dfa2c6f7` |
| `boost-converter` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 36 × 6.4 × 17 | bàn | 32 | `94311d245f1f` |
| `breadboard` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 83 × 8.51 × 55 | bàn | 261 | `f9f5d6e523ae` |
| `buck-converter` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 43 × 12.3 × 21 | bàn | 63 | `9afadb3e5385` |
| `button` | Mesh CAD (KiCad) | Nút nhấn 6 mm | `Button_Switch_THT.3dshapes/SW_PUSH_6mm.step` | 7.17 × 7.8 × 6 | breadboard | 116 | `51ef8e120f36` |
| `buzzer` | Mesh CAD (KiCad) | Buzzer Ø12 mm, chân 7,6 mm | `Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step` | 11.99 × 12.53 × 11.99 | breadboard | 217 | `24071cc6ca40` |
| `capacitor` | Mesh CAD (KiCad) | Tụ hóa Ø8 mm, chân 5 mm | `Capacitor_THT.3dshapes/CP_Radial_D8.0mm_P5.00mm.step` | 8 × 10 × 8 | breadboard | 371 | `bca5c0d4eeec` |
| `dc-motor` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 36 × 15.2 × 20 | bàn | 19 | `e6240ccf0a36` |
| `dht22` | Tham số | Sensor case 3-pin minh họa | `scripts/generate-component-models.mjs` | 15 × 19 × 18 | bàn | 8 | `a3241a1400b7` |
| `diode` | Mesh CAD (KiCad) | Diode DO-41 | `Diode_THT.3dshapes/D_DO-41_SOD81_P10.16mm_Horizontal.step` | 10.96 × 5.71 × 2.72 | breadboard | 129 | `70e17788275b` |
| `h-bridge` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 48 × 25.5 × 43.25 | bàn | 65 | `1c1d38ac442e` |
| `ir-receiver` | Tham số | Bộ thu IR 3 chân | `scripts/generate-component-models.mjs` | 5.68 × 12 × 10.22 | bàn | 6 | `0b3c3677dfaa` |
| `ir-sensor` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 48.5 × 7.1 × 14 | bàn | 24 | `824665d70980` |
| `ldr` | Mesh CAD (KiCad) | LDR 4,9 × 4,2 mm | `OptoDevice.3dshapes/R_LDR_4.9x4.2mm_P2.54mm_Vertical.step` | 4.9 × 7 × 4.2 | breadboard | 65 | `d3ea65400fe4` |
| `lcd1602` | Tham số | Màn hình ký tự + backpack chung | `scripts/generate-component-models.mjs` | 80 × 10.45 × 41.32 | bàn | 32 | `07eece6c21e6` |
| `led` | Mesh CAD (KiCad) | LED tròn 5 mm | `LED_THT.3dshapes/LED_D5.0mm.step` | 5.39 × 14.1 × 5.8 | breadboard | 41 | `76a9d35388a3` |
| `mosfet` | Mesh CAD (KiCad) | Vỏ TO-220-3 | `Package_TO_SOT_THT.3dshapes/TO-220-3_Vertical.step` | 10.25 × 28.52 × 4.46 | breadboard | 23 | `71e6e0bcfe7e` |
| `oled` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 27.3 × 16.6 × 27.8 | breadboard | 9 | `c1494ed6e848` |
| `mpu6050` | Tham số | Breakout IMU chung | `scripts/generate-component-models.mjs` | 20 × 9.2 × 16 | bàn | 8 | `d025b0a7bdf2` |
| `photoresistor-module` | Tham số | Breakout LDR AO/DO chung | `scripts/generate-component-models.mjs` | 22 × 11 × 18 | bàn | 25 | `1f1d146a7008` |
| `pir` | Tham số | PIR dome + breakout chung | `scripts/generate-component-models.mjs` | 32 × 14 × 24 | bàn | 27 | `3fd615ed83a6` |
| `potentiometer` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 13 × 22.6 × 13 | breadboard | 23 | `c5d221e8f539` |
| `relay` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 58.5 × 17.1 × 26 | bàn | 30 | `b83c3cb8ad17` |
| `rfid` | Tham số | Breakout RFID anten vòng chung | `scripts/generate-component-models.mjs` | 40 × 9.4 × 60 | bàn | 13 | `3e04f6dca550` |
| `resistor` | Mesh CAD (KiCad) | Điện trở trục DIN 0207 | `Resistor_THT.3dshapes/R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal.step` | 10.76 × 5.5 × 2.5 | breadboard | 132 | `6f9f889377ce` |
| `rotary-encoder` | Tham số | Encoder xoay breakout chung | `scripts/generate-component-models.mjs` | 24 × 32 × 18 | bàn | 23 | `bdc93e9ee387` |
| `rgb-led` | Mesh CAD (KiCad) | LED RGB 5 mm 4 chân | `LED_THT.3dshapes/LED_D5.0mm-4_RGB_Wide_Pins.step` | 6.88 × 13.6 × 5.8 | breadboard | 41 | `bc7ba81887b6` |
| `servo` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 37.1 × 31 × 11.8 | bàn | 23 | `2959eb43bd67` |
| `soil` | Tham số | Đầu dò điện dung dạng bảng chung | `scripts/generate-component-models.mjs` | 16 × 7 × 66 | bàn | 8 | `ac5eb5dc2a1b` |
| `seven-segment` | Mesh CAD (KiCad) | LED 7 đoạn 0,56 inch, gói LTS-6760 | `Display_7Segment.3dshapes/7SegmentLED_LTS6760_LTS6780.step` | 19.05 × 11.96 × 12.6 | breadboard | 158 | `365621bd6803` |
| `slide-switch` | Mesh CAD (KiCad) | Công tắc gạt SPDT OS102011MS2Q | `Button_Switch_THT.3dshapes/SW_Slide_SPDT_Straight_CK_OS102011MS2Q.step` | 8.6 × 11.5 × 4.3 | breadboard | 47 | `fabb365ddf14` |
| `tb6612` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 20.3 × 11.4 × 20.3 | breadboard | 16 | `754d89ada912` |
| `transistor` | Mesh CAD (KiCad) | Vỏ TO-92, chân 2,54 mm | `Package_TO_SOT_THT.3dshapes/TO-92_Inline_Wide.step` | 5.58 × 10 × 3.74 | breadboard | 14 | `d062237c7ae3` |
| `ultrasonic` | Tham số | Module, kích thước thường gặp | `scripts/generate-component-models.mjs` | 45 × 28.5 × 14.2 | breadboard | 29 | `8ed901726194` |

