# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.mjs >> 3D event marker excludes selected pins outside the current frame at 1440px
- Location: e2e\journeys.spec.mjs:33:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.button-lab').locator('.assembly-pin-marker')
Expected: 0
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" locator('.button-lab').locator('.assembly-pin-marker') with timeout 15000ms
  - waiting for locator('.button-lab').locator('.assembly-pin-marker')
    33 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Đi đến nội dung chính" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e5]:
    - link "Mạch Mở WORKSPACE" [ref=e6] [cursor=pointer]:
      - /url: /app
      - generic [aria-hidden] [ref=e7]: M
      - generic [ref=e8]:
        - strong [ref=e9]: Mạch Mở
        - generic [ref=e10]: WORKSPACE
    - generic [ref=e11]:
      - generic [ref=e12]: KHÔNG GIAN HỌC
      - strong [ref=e13]: Không gian học
    - generic [ref=e14]:
      - generic [ref=e15]: Khách · lưu trên thiết bị
      - link "Về website" [ref=e17] [cursor=pointer]:
        - /url: /?surface=web
        - text: Về website
        - generic [aria-hidden] [ref=e18]: ↗
  - complementary "Điều hướng không gian học" [ref=e19]:
    - generic [ref=e20]:
      - text: MẠCH MỞ · PWA
      - paragraph [ref=e21]: Học, tra cứu và thử mạch trong một workspace.
    - region "KHÔNG GIAN HỌC" [ref=e22]:
      - heading "KHÔNG GIAN HỌC" [level=2] [ref=e23]
      - link "Tổng quan" [ref=e24] [cursor=pointer]:
        - /url: /app
        - generic [aria-hidden] [ref=e25]: ⌂
      - link "Chủ đề học" [ref=e27] [cursor=pointer]:
        - /url: /app/learn
        - generic [aria-hidden] [ref=e28]: ◎
      - link "Bài LED nhập môn" [ref=e30] [cursor=pointer]:
        - /url: /app/learn/esp32-led
        - generic [aria-hidden] [ref=e31]: ◉
    - region "TRA CỨU & THỰC HÀNH" [ref=e33]:
      - heading "TRA CỨU & THỰC HÀNH" [level=2] [ref=e34]
      - link "Thư viện board" [ref=e35] [cursor=pointer]:
        - /url: /app/boards
        - generic [aria-hidden] [ref=e36]: ▦
      - link "Linh kiện" [ref=e38] [cursor=pointer]:
        - /url: /app/components
        - generic [aria-hidden] [ref=e39]: Ω
      - link "Phòng lắp mạch" [ref=e41] [cursor=pointer]:
        - /url: /app/lab
        - generic [aria-hidden] [ref=e42]: ⌁
      - link "Dự án" [ref=e44] [cursor=pointer]:
        - /url: /app/projects
        - generic [aria-hidden] [ref=e45]: ⌘
      - link "Lớp học & kit" [ref=e47] [cursor=pointer]:
        - /url: /app/classroom-kits
        - generic [aria-hidden] [ref=e48]: ▤
    - region "CÔNG CỤ" [ref=e50]:
      - heading "CÔNG CỤ" [level=2] [ref=e51]
      - link "Bộ tính điện tử" [ref=e52] [cursor=pointer]:
        - /url: /app/tools/calculators
        - generic [aria-hidden] [ref=e53]: ∑
      - link "Mô phỏng SPICE" [ref=e55] [cursor=pointer]:
        - /url: /app/tools/spice
        - generic [aria-hidden] [ref=e56]: ∿
      - link "Kiểm tra HEX" [ref=e58] [cursor=pointer]:
        - /url: /app/tools/firmware
        - generic [aria-hidden] [ref=e59]: ⌗
    - generic [ref=e61]:
      - strong [ref=e62]: Tiến độ khách
      - paragraph [ref=e63]: Bài vừa mở và checklist được lưu cục bộ trong trình duyệt này.
  - main [ref=e64]:
    - generic [ref=e65]:
      - complementary "Bài học và tiến độ" [ref=e66]:
        - link "Lộ trình" [ref=e67] [cursor=pointer]:
          - /url: /app/learn
        - heading "Nút nhấn điều khiển LED" [level=1] [ref=e68]
        - generic [ref=e69]:
          - generic [ref=e70]: Bài 3/11
          - progressbar "Vị trí bài trong lộ trình" [ref=e71]
        - paragraph [ref=e72]: Đọc tín hiệu đầu vào · 20 phút
        - navigation "Bài trước và bài sau" [ref=e73]:
          - link "Bài trước Nguồn thấp áp, điện trở và LED" [ref=e74] [cursor=pointer]:
            - /url: /app/learn/source-led
            - generic [ref=e75]: Bài trước
            - generic [ref=e76]: Nguồn thấp áp, điện trở và LED
          - link "Bài sau Biến trở bật/tắt LED theo ngưỡng" [ref=e77] [cursor=pointer]:
            - /url: /app/learn/analog-potentiometer
            - generic [ref=e78]: Bài sau
            - generic [ref=e79]: Biến trở bật/tắt LED theo ngưỡng
      - region "Chế độ xem mạch" [ref=e80]:
        - generic [ref=e81]:
          - group "Chọn hình chiếu mạch" [ref=e82]:
            - button "Breadboard" [ref=e83] [cursor=pointer]
            - button "Sơ đồ" [ref=e84] [cursor=pointer]
            - button "3D" [pressed] [ref=e85] [cursor=pointer]
          - button "Khôi phục mạch" [ref=e86] [cursor=pointer]
        - generic "Vùng mạch cuộn được" [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]:
              - img "Cảnh lắp mạch 3D. Dùng danh sách linh kiện bên dưới để chọn bằng bàn phím." [ref=e90]
              - generic:
                - button "Chọn ESP32 DevKit V1" [pressed] [ref=e91] [cursor=pointer]
                - button "Chọn Breadboard" [ref=e93] [cursor=pointer]
                - button "Chọn Điện trở 220 Ω" [ref=e95] [cursor=pointer]
                - button "Chọn LED" [ref=e97] [cursor=pointer]
                - button "Chọn Nút nhấn" [ref=e99] [cursor=pointer]
                - button "Chọn Module ESP32-WROOM-32 trên board" [ref=e101] [cursor=pointer]
                - button "Chọn Cổng USB Micro-B trên board" [ref=e103] [cursor=pointer]
                - generic [aria-hidden]: LOW
                - generic [aria-hidden]: board-1 · GPIO 18
                - button "Chọn ESP32 DevKit V1" [pressed] [ref=e105] [cursor=pointer]:
                  - strong [ref=e106]: ESP32 DevKit V1
                  - generic [ref=e107]: MCU
                - button "Chọn Điện trở 220 Ω" [ref=e108] [cursor=pointer]:
                  - strong [ref=e109]: Điện trở 220 Ω
                  - generic [ref=e110]: Linh kiện cơ bản
                - button "Chọn LED" [ref=e111] [cursor=pointer]:
                  - strong [ref=e112]: LED
                  - generic [ref=e113]: Đầu ra
                - button "Chọn Nút nhấn" [ref=e114] [cursor=pointer]:
                  - strong [ref=e115]: Nút nhấn
                  - generic [ref=e116]: Đầu vào
              - group "Điều khiển góc nhìn" [ref=e117]:
                - button "Xoay sang trái" [ref=e118] [cursor=pointer]: ←
                - button "Xoay sang phải" [ref=e119] [cursor=pointer]: →
                - button "Nhìn thấp hơn" [ref=e120] [cursor=pointer]: ↓
                - button "Nhìn cao hơn" [ref=e121] [cursor=pointer]: ↑
                - button "Thu nhỏ" [ref=e122] [cursor=pointer]: −
                - button "Phóng to" [ref=e123] [cursor=pointer]: +
                - button "Đặt lại" [ref=e124] [cursor=pointer]
            - generic [ref=e125]:
              - strong [ref=e126]: Luồng logic minh họa
              - paragraph [ref=e127]: Trace chỉ mô tả mức logic theo code bài học. Chạy firmware, đo dòng hoặc điện áp và nảy tiếp điểm nằm ngoài phạm vi.
            - paragraph [ref=e128]: Model board từ CAD tham chiếu · Minh họa tham số · Mesh CAD · thư viện KiCad. Board và linh kiện giữ đúng tỉ lệ. Chân mesh CAD theo footprint KiCad; chân mesh tham số là vị trí minh họa. Đầu dây ở board nằm trên pad theo CAD; tên chân theo profile bài học. Mạch Mở tự xếp linh kiện lên breadboard và chỉ để các chân cùng net vào chung một dải; đây là một cách lắp gợi ý, chưa kiểm tra trên mạch thật. Lựa chọn dùng chung với view lắp mạch và sơ đồ; view PCB chưa liên kết với lựa chọn này. 9 điểm chọn nằm quá gần nhau nên được ẩn trên cảnh; vẫn chọn được trong danh sách.
            - generic [ref=e129]:
              - region "Danh sách linh kiện trong cảnh" [ref=e130]:
                - heading "Linh kiện trong mạch" [level=3] [ref=e131]
                - generic [ref=e132]:
                  - text: Tìm linh kiện
                  - searchbox "Tìm linh kiện" [ref=e133]
                - list [ref=e134]:
                  - listitem [ref=e135]:
                    - button "ESP32 DevKit V1" [pressed] [ref=e136] [cursor=pointer]
                  - listitem [ref=e137]:
                    - button "Breadboard" [ref=e138] [cursor=pointer]
                  - listitem [ref=e139]:
                    - button "Điện trở 220 Ω" [ref=e140] [cursor=pointer]
                  - listitem [ref=e141]:
                    - button "LED" [ref=e142] [cursor=pointer]
                  - listitem [ref=e143]:
                    - button "Nút nhấn" [ref=e144] [cursor=pointer]
                - heading "Trên ESP32 DevKit V1" [level=4] [ref=e145]
                - list [ref=e146]:
                  - listitem [ref=e147]:
                    - button "Module ESP32-WROOM-32" [ref=e148] [cursor=pointer]
                  - listitem [ref=e149]:
                    - button "Cổng USB Micro-B" [ref=e150] [cursor=pointer]
                  - listitem [ref=e151]:
                    - button "Bộ ổn áp 3,3 V" [ref=e152] [cursor=pointer]
                  - listitem [ref=e153]:
                    - button "Giao tiếp USB–UART" [ref=e154] [cursor=pointer]
                  - listitem [ref=e155]:
                    - button "Nút BOOT" [ref=e156] [cursor=pointer]
                  - listitem [ref=e157]:
                    - button "Nút EN / RESET" [ref=e158] [cursor=pointer]
                  - listitem [ref=e159]:
                    - button "Hai hàng chân kết nối" [ref=e160] [cursor=pointer]
                  - listitem [ref=e161]:
                    - button "LED trạng thái trên board" [ref=e162] [cursor=pointer]
                  - listitem [ref=e163]:
                    - button "Điện trở và tụ điện SMD" [ref=e164] [cursor=pointer]
                  - listitem [ref=e165]:
                    - button "Diode Schottky đầu vào · D1" [ref=e166] [cursor=pointer]
                  - listitem [ref=e167]:
                    - button "Transistor điều khiển · Q1 / Q2" [ref=e168] [cursor=pointer]
              - region "Thông tin ESP32 DevKit V1" [ref=e169]:
                - generic [ref=e170]:
                  - heading "ESP32 DevKit V1" [level=3] [ref=e171]
                  - paragraph [ref=e172]:
                    - generic [ref=e173]: Model board từ CAD tham chiếu
                - tablist "Mục thông tin" [ref=e174]:
                  - tab "Tổng quan" [selected] [ref=e175] [cursor=pointer]
                  - tab "Chân và nối" [ref=e176] [cursor=pointer]
                  - tab "Ví dụ code" [ref=e177] [cursor=pointer]
                  - tab "Lưu ý" [ref=e178] [cursor=pointer]
                  - tab "Nguồn model" [ref=e179] [cursor=pointer]
                - tabpanel "Tổng quan" [ref=e180]:
                  - paragraph [ref=e181]: Đọc tín hiệu vào và xuất lệnh điều khiển. Các số chân trong bài có thể là alias học tập, không phải pin map vật lý của mọi board.
                  - list [ref=e182]:
                    - listitem [ref=e183]: "Nhóm: MCU"
                    - listitem [ref=e184]: 13 chân trong mô hình bài học
        - generic [ref=e185]:
          - generic [ref=e186]: Đường theo trace
          - generic [ref=e188]: 5 linh kiện · 5 dây
      - complementary "Chi tiết bài và mạch" [ref=e189]:
        - group "Chọn nội dung bài học" [ref=e190]:
          - button "Tổng quan" [ref=e191] [cursor=pointer]
          - button "Linh kiện" [pressed] [ref=e192] [cursor=pointer]
          - button "Code" [ref=e193] [cursor=pointer]
          - button "Trace" [ref=e194] [cursor=pointer]
        - generic "Nội dung cuộn được" [ref=e195]:
          - generic [ref=e196]:
            - heading "Linh kiện và chân" [level=2] [ref=e197]
            - group "Chọn linh kiện" [ref=e198]:
              - button "ESP32 DevKit V1 board-1" [pressed] [ref=e199] [cursor=pointer]:
                - text: ESP32 DevKit V1
                - generic [ref=e200]: board-1
              - button "Breadboard bb-1" [ref=e201] [cursor=pointer]:
                - text: Breadboard
                - generic [ref=e202]: bb-1
              - button "Điện trở 220 Ω res-1" [ref=e203] [cursor=pointer]:
                - text: Điện trở 220 Ω
                - generic [ref=e204]: res-1
              - button "LED led-1" [ref=e205] [cursor=pointer]:
                - text: LED
                - generic [ref=e206]: led-1
              - button "Nút nhấn button-1" [ref=e207] [cursor=pointer]:
                - text: Nút nhấn
                - generic [ref=e208]: button-1
            - generic [ref=e209]:
              - heading "ESP32 DevKit V1" [level=3] [ref=e210]
              - paragraph [ref=e211]: Đọc tín hiệu vào và xuất lệnh điều khiển. Các số chân trong bài có thể là alias học tập, không phải pin map vật lý của mọi board.
              - list [ref=e212]:
                - listitem [ref=e213]:
                  - button [ref=e214] [cursor=pointer]:
                    - text: GPIO 23
                    - code [ref=e215]: board-1:ledOut
                - listitem [ref=e216]:
                  - button [ref=e217] [cursor=pointer]:
                    - text: GND
                    - code [ref=e218]: board-1:gnd
                - listitem [ref=e219]:
                  - button [ref=e220] [cursor=pointer]:
                    - text: 3V3
                    - code [ref=e221]: board-1:vcc
                - listitem [ref=e222]:
                  - button [pressed] [ref=e223] [cursor=pointer]:
                    - text: GPIO 18
                    - code [ref=e224]: board-1:input
                - listitem [ref=e225]:
                  - button [ref=e226] [cursor=pointer]:
                    - text: TRIG
                    - code [ref=e227]: board-1:trig
                - listitem [ref=e228]:
                  - button [ref=e229] [cursor=pointer]:
                    - text: ECHO
                    - code [ref=e230]: board-1:echo
                - listitem [ref=e231]:
                  - button [ref=e232] [cursor=pointer]:
                    - text: "2"
                    - code [ref=e233]: board-1:seg0
                - listitem [ref=e234]:
                  - button [ref=e235] [cursor=pointer]:
                    - text: "3"
                    - code [ref=e236]: board-1:seg1
                - listitem [ref=e237]:
                  - button [ref=e238] [cursor=pointer]:
                    - text: "4"
                    - code [ref=e239]: board-1:seg2
                - listitem [ref=e240]:
                  - button [ref=e241] [cursor=pointer]:
                    - text: "5"
                    - code [ref=e242]: board-1:seg3
                - listitem [ref=e243]:
                  - button [ref=e244] [cursor=pointer]:
                    - text: "6"
                    - code [ref=e245]: board-1:seg4
                - listitem [ref=e246]:
                  - button [ref=e247] [cursor=pointer]:
                    - text: "7"
                    - code [ref=e248]: board-1:seg5
                - listitem [ref=e249]:
                  - button [ref=e250] [cursor=pointer]:
                    - text: "8"
                    - code [ref=e251]: board-1:seg6
            - generic [ref=e252]:
              - strong [ref=e253]: Đang chọn
              - code [ref=e254]: board-1:input
              - generic [ref=e255]: Net · bb1:20a
              - paragraph [ref=e256]: board-1:input · button-1:contactA
            - group [ref=e257]:
              - generic "Dây nối và net" [ref=e258] [cursor=pointer]
              - list [ref=e259]:
                - listitem [ref=e260]:
                  - button "w-gpio-to-resistor board-1:ledOut ↔ bb1:10a Tín hiệu · Net bb1:10a" [ref=e261] [cursor=pointer]:
                    - code [ref=e262]: w-gpio-to-resistor
                    - generic [ref=e263]: board-1:ledOut ↔ bb1:10a
                    - generic [ref=e264]:
                      - text: Tín hiệu · Net
                      - code [ref=e265]: bb1:10a
                - listitem [ref=e266]:
                  - button "w-led-cathode-to-rail bb1:15a ↔ bb1:T-:1 GND · Net bb-1:railMinus" [ref=e267] [cursor=pointer]:
                    - code [ref=e268]: w-led-cathode-to-rail
                    - generic [ref=e269]: bb1:15a ↔ bb1:T-:1
                    - generic [ref=e270]:
                      - text: GND · Net
                      - code [ref=e271]: bb-1:railMinus
                - listitem [ref=e272]:
                  - button "w-rail-to-gnd bb1:T-:2 ↔ board-1:gnd GND · Net bb-1:railMinus" [ref=e273] [cursor=pointer]:
                    - code [ref=e274]: w-rail-to-gnd
                    - generic [ref=e275]: bb1:T-:2 ↔ board-1:gnd
                    - generic [ref=e276]:
                      - text: GND · Net
                      - code [ref=e277]: bb-1:railMinus
                - listitem [ref=e278]:
                  - button "w-input-to-button board-1:input ↔ bb1:20g Tín hiệu · Net bb1:20a" [ref=e279] [cursor=pointer]:
                    - code [ref=e280]: w-input-to-button
                    - generic [ref=e281]: board-1:input ↔ bb1:20g
                    - generic [ref=e282]:
                      - text: Tín hiệu · Net
                      - code [ref=e283]: bb1:20a
                - listitem [ref=e284]:
                  - button "w-button-to-gnd-rail bb1:22g ↔ bb1:T-:3 GND · Net bb-1:railMinus" [ref=e285] [cursor=pointer]:
                    - code [ref=e286]: w-button-to-gnd-rail
                    - generic [ref=e287]: bb1:22g ↔ bb1:T-:3
                    - generic [ref=e288]:
                      - text: GND · Net
                      - code [ref=e289]: bb-1:railMinus
      - generic [ref=e290]:
        - group "Nút ảo" [ref=e291]:
          - generic [ref=e293] [cursor=pointer]:
            - radio "Thả nút" [checked] [ref=e294]
            - generic [ref=e295]: Thả nút
          - generic [ref=e296] [cursor=pointer]:
            - radio "Nhấn nút" [ref=e297]
            - generic [ref=e298]: Nhấn nút
        - status [ref=e299]:
          - generic [ref=e300]: Bộ diễn giải code giới hạn
          - strong [ref=e301]: HIGH → else → LED tắt
          - generic [ref=e302]: "Bước 3/3 · Ghi GPIO 23: LOW · Dòng 13"
          - code [ref=e303]: digitalWrite(ledPin, LOW);
          - generic [ref=e304]: Mức logic theo code bài học; không phải kết quả đo điện hay chạy firmware.
        - button "Chạy lại" [ref=e305] [cursor=pointer]
        - group "Điều khiển từng bước trace" [ref=e306]:
          - button "Bước trước" [ref=e307] [cursor=pointer]
          - button "Phát trace" [ref=e308] [cursor=pointer]
          - button "Bước sau" [disabled] [ref=e309]
          - button "Về bước đầu" [ref=e310] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { readFile } from 'node:fs/promises'
  3   | 
  4   | test('mobile selected-wire controls remain fully exposed above the playback console', async ({ page }) => {
  5   |   await page.setViewportSize({ width: 375, height: 812 })
  6   |   await page.goto('/app/learn/button-led')
  7   |   const lab = page.locator('.button-lab')
  8   |   const editor = lab.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  9   |   await editor.getByRole('combobox', { name: 'Chọn dây' }).selectOption('w-input-to-button')
  10  |   const wire = editor.getByRole('region', { name: 'Chỉnh dây w-input-to-button' })
  11  |   for (const state of ['ready', 'stale']) {
  12  |     if (state === 'stale') await wire.getByRole('combobox', { name: 'Đổi loại dây' }).selectOption('ground')
  13  |     await lab.locator('.button-lab-stage-scroll').evaluate(stage => { stage.scrollTop = 0 })
  14  |     for (const control of [
  15  |       editor.getByRole('button', { name: 'Chọn', exact: true }),
  16  |       editor.getByRole('button', { name: 'Nối dây', exact: true }),
  17  |       wire.getByRole('button', { name: 'Đổi điểm bắt đầu' }),
  18  |       wire.getByRole('button', { name: 'Đổi điểm kết thúc' }),
  19  |       wire.getByRole('combobox', { name: 'Đổi loại dây' }),
  20  |       wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }),
  21  |       lab.getByRole('button', { name: 'Khôi phục mạch' }),
  22  |     ]) await expect(control).toBeInViewport({ ratio: 1 })
  23  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', state)
  24  |   }
  25  |   await wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }).click()
  26  |   await expect(wire).toHaveCount(0)
  27  |   await lab.getByRole('button', { name: 'Khôi phục mạch' }).click()
  28  |   await expect(editor.getByRole('combobox', { name: 'Chọn dây' }).locator('option:not([value=""])')).toHaveCount(5)
  29  |   expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([375, 812])
  30  | })
  31  | 
  32  | for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  33  |   test(`3D event marker excludes selected pins outside the current frame at ${viewport.width}px`, async ({ page }, testInfo) => {
  34  |     await page.setViewportSize(viewport)
  35  |     await page.goto('/app/learn/button-led')
  36  |     const lab = page.locator('.button-lab')
  37  |     const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
  38  |     const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
  39  |     const selection = lab.getByTestId('button-lab-selection')
  40  |     const marker = lab.locator('.assembly-pin-marker')
  41  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
  42  |     await views.getByRole('button', { name: '3D', exact: true }).click()
  43  |     const fallback = lab.getByText(/chưa mở được WebGL 2/)
  44  |     await expect(lab.locator('.assembly-stage-view canvas').or(fallback)).toBeVisible()
  45  |     test.skip(await fallback.isVisible(), 'WebGL unavailable; actual 3D marker checks not run')
  46  |     await expect(marker).toContainText('GPIO 18')
  47  |     await expect(selection).toHaveText('board-1:input')
  48  |     await controls.getByRole('button', { name: 'Bước sau' }).click()
  49  |     await expect(marker).toContainText('GPIO 18')
  50  |     await controls.getByRole('button', { name: 'Bước sau' }).click()
  51  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-event', 'write')
> 52  |     await expect(marker).toHaveCount(0)
      |                          ^ Error: expect(locator).toHaveCount(expected) failed
  53  |     await expect(selection).toHaveText('board-1:input')
  54  |     await controls.getByRole('button', { name: 'Về bước đầu' }).click()
  55  |     await expect(marker).toContainText('GPIO 18')
  56  |     await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
  57  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', 'stale')
  58  |     await expect(marker).toHaveCount(0)
  59  |     await expect(selection).toHaveText('board-1:input')
  60  |     await testInfo.attach(`3d-marker-stale-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' })
  61  |   })
  62  | }
  63  | 
  64  | for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  65  |   test(`signal playback follows one event across projections at ${viewport.width}px`, async ({ page }, testInfo) => {
  66  |     await page.setViewportSize(viewport)
  67  |     await page.goto('/app/learn/button-led')
  68  |     const lab = page.locator('.button-lab')
  69  |     const status = lab.locator('.button-lab-result')
  70  |     const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
  71  |     const next = controls.getByRole('button', { name: 'Bước sau' })
  72  |     const previous = controls.getByRole('button', { name: 'Bước trước' })
  73  |     const replay = controls.getByRole('button', { name: 'Về bước đầu' })
  74  |     const run = lab.getByRole('button', { name: 'Chạy lại', exact: true })
  75  |     const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
  76  |     const mobile = lab.getByRole('navigation', { name: 'Chế độ xem trên điện thoại' })
  77  |     const schematic = lab.locator('.circuit-schematic-v2')
  78  |     const expectStep = async (step, kind) => {
  79  |       await expect(status).toHaveAttribute('data-event', kind)
  80  |       await expect(status).toContainText(`Bước ${step}/3`)
  81  |       await expect(status).toContainText(/Dòng \d+/)
  82  |       await expect(status.locator('code')).not.toBeEmpty()
  83  |     }
  84  |     await expect(controls).toBeVisible()
  85  |     await expect(previous).toBeDisabled()
  86  |     await expectStep(1, 'read')
  87  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
  88  |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  89  |     await lab.locator('[data-circuit-endpoint="bb1:20g"]').scrollIntoViewIfNeeded()
  90  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').scrollIntoViewIfNeeded()
  91  |     await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"][data-wire-id="w-input-to-button"]')).toHaveCount(1)
  92  |     await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).toHaveAttribute('data-lesson-active', '')
  93  |     await expect(lab.locator('[data-circuit-endpoint="board-1:ledOut"]')).not.toHaveAttribute('data-lesson-active', '')
  94  |     await next.focus()
  95  |     await next.press('Space')
  96  |     await expectStep(2, 'branch')
  97  |     await views.getByRole('button', { name: 'Sơ đồ', exact: true }).click()
  98  |     await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(1)
  99  |     await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).toHaveClass(/net-active/)
  100 |     await expectStep(2, 'branch')
  101 |     await next.press('Enter')
  102 |     await expectStep(3, 'write')
  103 |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  104 |     await expect(next).toBeDisabled()
  105 |     await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(2)
  106 |     await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).not.toHaveClass(/net-active/)
  107 |     await views.getByRole('button', { name: '3D', exact: true }).click()
  108 |     await expect(lab.locator('.assembly-stage-view canvas').or(lab.getByText(/chưa mở được WebGL 2/))).toBeVisible()
  109 |     await expectStep(3, 'write')
  110 |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  111 |     await views.getByRole('button', { name: 'Breadboard', exact: true }).click()
  112 |     await expect(lab.locator('[data-circuit-endpoint="res-1:b"]')).toHaveAttribute('data-lesson-active', '')
  113 |     await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).not.toHaveAttribute('data-lesson-active', '')
  114 |     await replay.press('Enter')
  115 |     await expectStep(1, 'read')
  116 |     await controls.getByRole('button', { name: 'Phát trace' }).press('Enter')
  117 |     await expect(controls.getByRole('button', { name: 'Tạm dừng trace' })).toBeVisible()
  118 |     await controls.getByRole('button', { name: 'Tạm dừng trace' }).press('Space')
  119 |     const paused = await status.getAttribute('data-event')
  120 |     await page.waitForTimeout(1400)
  121 |     await expect(status).toHaveAttribute('data-event', paused)
  122 |     await controls.getByRole('button', { name: 'Phát trace' }).click()
  123 |     await expectStep(3, 'write')
  124 |     await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeVisible()
  125 | 
  126 |     await controls.getByRole('button', { name: 'Phát trace' }).click()
  127 |     await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
  128 |     await expect(status).toHaveAttribute('data-state', 'stale')
  129 |     await expect(status).toHaveAttribute('data-event', '')
  130 |     await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
  131 |     await expect(next).toBeDisabled()
  132 |     await expect(controls.getByRole('button', { name: 'Tạm dừng trace' })).toHaveCount(0)
  133 |     await run.click()
  134 |     await expectStep(1, 'read')
  135 |     await expect(status).toContainText('LOW → if → LED sáng')
  136 |     await lab.getByRole('button', { name: 'Khôi phục mạch', exact: true }).click()
  137 |     await expect(status).toHaveAttribute('data-state', 'stale')
  138 |     await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
  139 |     await run.click()
  140 |     if (viewport.width === 375) await mobile.getByRole('button', { name: 'Code', exact: true }).click()
  141 |     else await lab.getByRole('group', { name: 'Chọn nội dung bài học' }).getByRole('button', { name: 'Code', exact: true }).click()
  142 |     const code = lab.getByRole('textbox', { name: 'Code bài nút nhấn' })
  143 |     const sample = await code.inputValue()
  144 |     await code.fill(`${sample}\n// changed`)
  145 |     await expect(status).toHaveAttribute('data-state', 'stale')
  146 |     await expect(status).toHaveAttribute('data-event', '')
  147 |     await code.fill('unsupported')
  148 |     await run.click()
  149 |     await expect(status).toHaveAttribute('data-state', 'unsupported')
  150 |     await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
  151 |     await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeDisabled()
  152 |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
```