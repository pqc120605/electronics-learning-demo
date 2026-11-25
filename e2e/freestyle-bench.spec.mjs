import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// 2026-11-14: bàn lắp mạch tự do ở trang chủ. Uno biên dịch thật bằng arduino-cli (dịch vụ cục bộ trong vite preview),
// Pico chạy MicroPython chính thức trên rp2040js. Kết quả là mô phỏng, không phải đo trên board thật.
const shots = 'docs/agents/runs/MM-SW-FREESTYLE-UX-002/screenshots'
const bench = page => page.locator('section.freestyle-bench')
const litLeds = page => page.locator('.freestyle-stage .breadboard-diagram-part-led.is-lit')

async function freshHome(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('machmo-freestyle-v1'))
  await page.reload()
  await page.locator('.hero-actions').getByRole('link', { name: 'Mở bàn lắp mạch' }).click()
  await expect(bench(page).getByRole('heading', { name: 'Tự lắp mạch, tự viết code, bấm Chạy' })).toBeVisible()
}

async function expectBlinking(page) {
  await expect(litLeds(page)).toHaveCount(1, { timeout: 45_000 })
  await expect(litLeds(page)).toHaveCount(0, { timeout: 15_000 })
  await expect(litLeds(page)).toHaveCount(1, { timeout: 15_000 })
}

async function wire(page, from, to) {
  const details=page.locator('.freestyle-stage .breadboard-pin-details');if(await details.getAttribute('open')===null)await details.locator('summary').click()
  const picker = page.locator('.freestyle-stage').getByRole('group', { name: 'Chân linh kiện và board' })
  await picker.getByRole('button', { name: from, exact: true }).click()
  await picker.getByRole('button', { name: to, exact: true }).click()
}

const blinkCpp = `const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED, HIGH);
  Serial.println("LED: BAT");
  delay(400);
  digitalWrite(LED, LOW);
  Serial.println("LED: TAT");
  delay(400);
}
`

test('Uno: build an LED circuit by hand, write Blink, compile with arduino-cli and watch the LED blink', async ({ page }) => {
  test.setTimeout(150_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await freshHome(page)
  await bench(page).getByRole('button', { name: 'Bàn trống' }).click()
  await page.getByRole('radio', {name:/Arduino Uno R3/}).check()
  await page.getByRole('tab',{name:/Thêm linh kiện/}).click()
  await page.getByRole('button',{name:'Thêm breadboard',exact:true}).click()
  await expect(page.getByRole('tab', { name: /Thêm linh kiện/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Thêm Điện trở 220 Ω' }).click()
  await page.getByRole('button', { name: 'Thêm LED', exact: true }).click()
  await wire(page, 'Chọn chân board D13', 'Chọn chân resistor1 Đầu 1')
  await wire(page, 'Chọn chân resistor1 Đầu 2', 'Chọn chân led1 Anode (+)')
  await wire(page, 'Chọn chân led1 Cathode (−)', 'Chọn chân board GND')
  await expect(page.locator('.freestyle-stage').getByText('3 dây · danh sách endpoint')).toBeVisible()

  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
  await page.getByLabel('Mã nguồn Arduino C++').fill(blinkCpp)
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect(page.locator('.freestyle-engine strong')).toHaveText('arduino-cli + avr8js')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  await expectBlinking(page)
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('LED: BAT')
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('LED: TAT')
  await bench(page).screenshot({ path: `${shots}/uno-arduino-cli-blink.png` })
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()

  // Lỗi biên dịch thật trỏ về dòng code.
  await page.getByRole('tab',{name:/Viết code & Chạy/}).click()
  await page.getByLabel('Mã nguồn Arduino C++').fill('void setup() {\n  int x = ;\n}\nvoid loop() {}\n')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect(page.locator('#freestyle-error')).toContainText('Dòng 2: Lỗi biên dịch', { timeout: 60_000 })
})

test('Pico: MicroPython runs for real on rp2040js and blinks the LED wired to GP15', async ({ page }) => {
  test.setTimeout(150_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await freshHome(page)
  await page.getByRole('tab', { name: /Chọn board/ }).click()
  await page.getByRole('radio', { name: /Raspberry Pi Pico/ }).check()
  await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
  const language = page.getByLabel('Ngôn ngữ')
  const health = await page.request.get('/api/local-tools/health')
  const tools = health.ok() ? await health.json().catch(() => null) : null
  test.skip(!tools?.rp2040Bootrom, 'The real MicroPython run requires the locally provided RP2040 boot ROM.')
  await language.selectOption('micropython')
  await page.getByLabel('Mã nguồn MicroPython').fill('from machine import Pin\nimport time\nled = Pin(15, Pin.OUT)\nwhile True:\n    led.toggle()\n    print("GP15", led.value())\n    time.sleep(0.4)\n')
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect(page.locator('.freestyle-engine strong')).toHaveText('MicroPython thật · rp2040js')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  await expectBlinking(page)
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('GP15 1')
  await bench(page).screenshot({ path: `${shots}/pico-micropython-blink.png` })
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()
})

test('without the local service the bench falls back to the interpreter and says so', async ({ page }) => {
  await page.route('**/api/local-tools/**', route => route.fulfill({ status: 404, contentType: 'text/html', body: 'not found' }))
  await page.setViewportSize({ width: 1440, height: 900 })
  await freshHome(page)
  await page.getByRole('radio',{name:/Arduino Uno R3/}).check()
  await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect(page.locator('.freestyle-engine strong')).toHaveText('Trình thông dịch rút gọn')
  await expect(page.locator('.freestyle-engine-note')).toContainText('Chạy bằng trình thông dịch rút gọn')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  await expectBlinking(page)
  // Mẫu nút nhấn: giữ nút trên bàn thì firmware đọc LOW và bật LED.
  await page.getByLabel('Mạch mẫu').selectOption('button-led')
  await bench(page).getByRole('button', { name: 'Dựng mạch mẫu' }).click()
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  const press = page.getByRole('button', { name: /Giữ nút nhấn/ })
  await press.hover()
  await page.mouse.down()
  await expect(litLeds(page)).toHaveCount(1)
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('Nhan')
  await page.mouse.up()
  await expect(litLeds(page)).toHaveCount(0)
})

test('full-screen room keeps the circuit, gathers the tools and fits one screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await freshHome(page)
  await page.getByRole('radio',{name:/Arduino Uno R3/}).check()
  await page.getByLabel('Mạch mẫu').selectOption('motor')
  await bench(page).getByRole('button', { name: 'Dựng mạch mẫu' }).click()
  await bench(page).getByRole('link', { name: /Mở toàn màn hình/ }).click()
  await expect(page).toHaveURL(/\/build\/freestyle\?resume=1$/)
  await expect(page.locator('main h1')).toHaveText('Tự lắp mạch, tự viết code, bấm Chạy')
  await expect(page.locator('.freestyle-stage').getByText(/dây · danh sách endpoint/)).toBeVisible()
  await page.getByRole('tab',{name:/Viết code & Chạy/}).click()
  await expect(page.getByLabel('Mã nguồn Arduino C++')).toHaveValue(/MOTOR/)
  const size = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, inner: innerHeight }))
  expect(size.height).toBeLessThanOrEqual(size.inner)
  await page.screenshot({ path: `${shots}/full-screen-room.png` })

  await page.getByRole('button', { name: 'Công cụ', exact:true }).click()
  const dialog = page.getByRole('dialog', { name: 'Công cụ' })
  await expect(dialog.getByLabel('Mã nguồn Arduino C++')).toBeVisible()
  for (const [tab, marker] of [['Firmware HEX / UF2', /HEX/], ['SPICE', /SPICE/], ['Máy tính điện tử', /Ohm|điện trở/i]]) {
    await dialog.getByRole('tab', { name: tab }).click()
    await expect(dialog.getByRole('tabpanel')).toContainText(marker)
  }
  await page.screenshot({ path: `${shots}/tools-drawer.png` })
  await dialog.getByRole('button', { name: 'Đóng' }).click()
  await expect(dialog).toBeHidden()
})

for (const width of [375, 1440]) {
  for (const route of ['/', '/build/freestyle']) {
    test(`a11y + layout ${width}px ${route}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto(route)
      await expect(page.locator('main h1')).toBeVisible()
      if (route === '/') await page.locator('.hero-actions').getByRole('link', { name: 'Mở bàn lắp mạch' }).click()
      await expect(bench(page)).toBeVisible()
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      await testInfo.attach('axe-results', { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' })
      expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (width === 375 && route === '/') await bench(page).screenshot({ path: `${shots}/home-375.png` })
    })
  }
}
