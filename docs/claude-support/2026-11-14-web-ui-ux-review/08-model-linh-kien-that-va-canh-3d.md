# 08 · Model linh kiện thật và làm đẹp cảnh 3D

Ngày: 2026-11-14 → 15. Không commit. Dùng KiCad 10.0.7 (`D:/StartupOS/.tools/kicad-10.0.7`) và 1 HDRI CC0 tải từ Poly Haven. Không thêm dependency npm.

## 1. Model linh kiện

### 1.1 21 module dựng bằng KiCad (`kind: 'kicad-assembly'`)
- `scripts/build-module-models.py` (Python của KiCad) dựng từng module thành một PCB:
  - kích thước và màu soldermask theo module phổ biến (xanh dương, xanh lá, đỏ, tím, đen);
  - chữ in lụa;
  - footprint và package 3D lấy từ thư viện KiCad: SOIC, QFN, LQFP, SSOP, LGA Bosch, relay SRD, terminal block, tụ hóa, trimmer 3296W, cuộn cảm, crystal HC‑49, LED, TO‑220/252/263, hộp pin Keystone 2462…;
  - đường đồng (anten RC522, đầu dò đất có cửa sổ soldermask để lộ đồng).
- Phần thư viện KiCad không có model thì dựng bằng khối hình học (`scripts/make-primitive-part-glb.mjs`):
  - đầu thu phát HC‑SR04, kính OLED/LCD, tản nhiệt và chip L298N;
  - thấu kính Fresnel PIR, vỏ DHT22, thân encoder, 2 pin AA.
- Header thẳng 2,54 mm được vẽ thành dải nhựa + chân vuông mạ vàng thay cho STEP vát cạnh, vì STEP chiếm phần lớn tam giác. Header góc vuông vẫn dùng STEP.
- Pipeline mỗi module:
  1. `kicad-cli pcb export glb`
  2. `scripts/name-kicad-glb-nodes.mjs`
  3. `merge-glb-nodes.mjs`
  4. `optimize-board-glb.mjs` (thêm biến `GLB_BACKUP_DIR` để không ghi vào `assets/`)
  5. `scripts/finalize-module-glb.mjs`
- Quy tắc của bước finalize:
  - **Module cắm breadboard** (ultrasonic, oled, tb6612): pad của header được đặt đúng vào `pinsMm` cũ (sai lệch ≤ 0,15 mm, nếu vượt thì script dừng). Đầu chân xuống tới −6 mm. Nhờ vậy `legsMm` và layout breadboard giữ nguyên.
  - **Module đặt trên bàn**: `pinsMm` được tính lại từ vị trí pad thật. Ví dụ GY‑521 nay đúng thứ tự VCC GND SCL SDA … INT; trước đây các chân bị xếp liên tiếp.
- Danh sách 21 module:
  - Thay 18 mesh tham số: ultrasonic, oled, lcd1602, relay, h-bridge, tb6612, mpu6050, bmp280, ir-sensor, photoresistor-module, pir, boost-converter, buck-converter, rfid, rotary-encoder, soil, dht22, ir-receiver.
  - battery: hộp Keystone + 2 pin AA.
  - Mục mới: logic-level, mosfet-module.
- Mọi GLB ≤ 400 KB (giới hạn của test); lớn nhất là h-bridge 384 KB.
- Ảnh: `img/08/after-modules-sheet.png`.

### 1.2 9 model tham số chi tiết (`scripts/build-detailed-parts.mjs`)
- Danh sách: potentiometer (có núm, giá kim loại), thermistor (giọt epoxy), servo SG90 (tai, cánh tay, dây 3 màu), motor 130 (vỏ kim loại, nắp, cực hàn), limit-switch (cần gạt, bánh xe).
- Mục mới: jumper, power-bank, usb-cable, soil-relay-pump.
- Thư viện KiCad không có model nguồn mở phù hợp cho các mục này, nên vẫn ghi `parametric-mesh` và có ghi chú "minh họa".
- Ảnh: `img/08/after-detailed-parts-sheet.png`.
- Breadboard giữ model cũ, vì đã có lỗ, rãnh giữa và vạch đỏ/xanh.

### 1.3 Nguồn và giấy phép
- `public/models/components/NOTICE.txt` có thêm mục `kicad-assembly` và mục model chi tiết. Package KiCad dùng CC BY-SA 4.0 kèm ngoại lệ thư viện, nên các file dẫn xuất vẫn theo CC BY-SA 4.0.
- `public/env/NOTICE.txt`: HDRI "Studio Small 09" của Sergej Majboroda, Poly Haven, CC0.
- Không dùng asset của Wokwi, Learn Arduino Red hay Learn ESP32.
- Thêm kiểu `ComponentMeshKind = 'kicad-assembly'` với nhãn "Module dựng từ package KiCad". Kiểu này **không** được xếp chung với "CAD hãng": layout vẫn coi là `component-parametric`, `mountResolve` vẫn coi là `parametric`.

## 2. Cảnh 3D
- `src/components/board/pbrShading.ts` dùng chung cho `AssemblyScene` (bàn lắp và 3D của bài học) và `BoardScene` (viewer board):
  - vật liệu metal/roughness: `glbParser` nay đọc `metallicFactor`/`roughnessFactor`;
  - một đèn chính dùng GGX;
  - ánh sáng môi trường từ HDRI CC0 (PNG equirect 512×256 có mipmap, 127 KB, tải lười sau khi cảnh đã vẽ);
  - tone mapping ACES và gamma sRGB;
  - màu do code ứng dụng chọn (dây, bàn) được chuyển sang không gian linear.
- Bóng đổ mềm trong bàn lắp: shadow map 2048 px, lọc PCF 5×5.
  - Lỗi gặp khi làm: thuộc tính đỉnh còn bật từ pass trước khiến lệnh vẽ của pass bóng bị bỏ. Đã tắt chúng trong pass bóng.
- Khử răng cưa bằng MSAA, bật sẵn qua `antialias: true`.
- Dây jumper vẫn là ống cong như trước. Mỗi đầu dây có thêm khối Dupont nhựa đen 2,5 × 2,5 × 9 mm.
- Preset góc nhìn: Trên, Trước, Cận (thêm vào cạnh Đặt lại, qua `AssemblyScene.setPreset`).
- Hiệu năng và máy yếu:
  - `sceneQuality()` trả `low` khi `deviceMemory ≤ 2` hoặc CPU ≤ 2 nhân, hoặc khi có `?quality=low`. Khi đó bỏ shadow map và env map, layout không đổi.
  - Model vẫn tải lười như trước.
  - Cảnh không có animation camera. Vạch chạy và motor quay đã tôn trọng `prefers-reduced-motion` từ đợt 05/07.
- File chung đã sửa:
  - `AssemblyStage.tsx`: chỉ thêm 3 nút preset.
  - Không đụng `CircuitBuilderPage.tsx`, trang chủ, `ExplorePage`, `FirstBoardStudio`, `SketchRunnerPage` hay firmware runner.

## 3. Bằng chứng

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run typecheck` | sạch |
| `npm.cmd test` | 619/619 pass |
| `npm.cmd run build:local` | OK |
| e2e toàn bộ (port 5297) | 110 pass, 3 fail. Cả 3 là baseline có từ trước (`journeys.spec.mjs:35` ×2, `:812`); không có lỗi mới. |

**Test đã đổi kỳ vọng (có chú thích):** `component-models.test.mjs` nhận `kicad-assembly` cho các module generic. Test vẫn chặn `source-cad-mesh` và vẫn kiểm ghi chú "không phải CAD của hãng". Ghi chú cảnh báo của NTC và công tắc hành trình được giữ trong model mới, nên các test liên quan pass mà không phải sửa.

**Ảnh trong `img/08/`:**
- `before-*-3d.png` và `after-*-3d.png` cho 11 bài; ảnh ghép `compare-*-3d.png`.
- `after-analog-ldr-3d-close.png`: preset Cận.
- `after-board-viewer-uno.png`.
- `after-modules-sheet.png`, `after-detailed-parts-sheet.png`.

## 4. Chưa làm / hạn chế
1. Vị trí linh kiện trên module là ước lượng theo module phổ biến, không phải CAD hãng. Vài trimmer dùng 3296W lớn hơn loại 3362 thường gặp. LED của FC‑51 dùng model LED 3 mm màu xanh của KiCad.
2. Servo, motor, công tắc hành trình, jumper, pin dự phòng, cáp USB, bơm vẫn là hình tham số (chi tiết hơn trước).
3. Chỉ bàn lắp có bóng đổ; viewer board có PBR và env map nhưng không có bóng.
4. Dev server (`npm run dev`) vẫn hay kẹt "Đang tải trang" vì lỗi tối ưu dependency của Vite có từ trước. Mọi ảnh được chụp trên bản build qua `vite preview`.
5. Dải nút điều khiển 3D hơi chật ở bề rộng hẹp: nút "Đặt lại" xuống 2 dòng.
