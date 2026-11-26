import {test,expect} from '@playwright/test'

test.beforeEach(async({page}) => {
  await page.addInitScript(() => {
    if (window.top === window) {
      localStorage.setItem('mm-tour-seen',JSON.stringify({freestyle:1,home:1,lab:1,library:1,lesson:1}))
    }
  })
  await page.route('**/api/local-tools/health',route=>route.fulfill({status:404,body:''}))
})

async function sample(page, board, id) {
  await page.goto('/build/freestyle')
  await page.getByRole('radio',{name:board}).check()
  await page.getByLabel('Mạch mẫu').selectOption(id)
  await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
}

test('Pico sample runs with the displayed browser engine',async({page})=>{
  await sample(page,/Raspberry Pi Pico/,'blink')
  await page.getByRole('tab',{name:/Viết code & Chạy/}).click()
  await expect(page.getByLabel('Mã nguồn Arduino C++')).not.toHaveValue('')
  await expect(page.getByLabel('Ngôn ngữ').locator('option[value="micropython"]')).toHaveAttribute('disabled','')
  await page.locator('.freestyle-work-actions').getByRole('button',{name:'▶ Chạy'}).click()
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('Bat dau nhay LED')
  await expect(page.locator('.freestyle-engine')).toContainText('Trình thông dịch rút gọn')
})

test('public Pico MicroPython boots with a locally imported ROM and no local tools', async ({ page }) => {
  test.skip(!process.env.MACHMO_TEST_PICO_BOOTROM, 'This test needs an authorized local B2 file.')
  test.setTimeout(100_000)
  await page.route('**/api/local-tools/rp2040-bootrom', () => { throw new Error('An imported ROM must never use the local service.') })
  await sample(page, /Raspberry Pi Pico/, 'blink')
  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
  const importFile = page.getByLabel('Boot ROM RP2040 B2', { exact: true })
  await importFile.setInputFiles({ name: 'invalid.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(16384) })
  await expect(page.getByText('SHA-256 không khớp bản boot ROM RP2040 B2 được hỗ trợ.')).toBeVisible()
  await importFile.setInputFiles(process.env.MACHMO_TEST_PICO_BOOTROM)
  await expect(page.getByText('Đã xác minh boot ROM B2. Bạn có thể chọn MicroPython.')).toBeVisible()
  await page.getByLabel('Ngôn ngữ').selectOption('micropython')
  await page.getByLabel('Mã nguồn MicroPython').fill('from machine import Pin\nimport time\nled = Pin(15, Pin.OUT)\nwhile True:\n    led.toggle()\n    print("GP15", led.value())\n    time.sleep(0.4)\n')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
  await page.getByRole('tab', { name: /Quan sát/ }).click()
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('GP15 1', { timeout: 45000 })
  await expect(page.locator('.freestyle-engine')).toContainText('rp2040js')
  await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()
})

test('input levels are loaded before the first button and ADC reads',async({page})=>{
  await sample(page,/Arduino Uno R3/,'button-led')
  await page.locator('.freestyle-work-actions').getByRole('button',{name:'▶ Chạy'}).click()
  await page.getByRole('tab',{name:/Quan sát/}).click()
  await expect.poll(async()=>parseFloat(await page.locator('.freestyle-engine [aria-live]').innerText())).toBeGreaterThan(0.25)
  await expect(page.getByLabel('Đầu ra Serial')).toHaveText('Chưa có dữ liệu Serial.')
  await page.locator('.freestyle-work-actions').getByRole('button',{name:'■ Dừng'}).click()
  await page.getByLabel('Mạch mẫu').selectOption('pot-dimmer')
  await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
  await page.locator('.freestyle-work-actions').getByRole('button',{name:'▶ Chạy'}).click()
  await expect(page.getByLabel('Đầu ra Serial')).toContainText(/ADC 51[12]/)
  await expect(page.getByLabel('Đầu ra Serial')).not.toContainText(/ADC 0/)
})

test('library search matches function words and model names without diacritics',async({page})=>{
  await page.goto('/components')
  await page.getByRole('searchbox',{name:'Tìm linh kiện'}).fill('do khoang cach')
  await expect(page.locator('.component-catalog-list').getByRole('link',{name:/Cảm biến siêu âm HC-SR04/})).toBeVisible()
  await page.goto('/boards')
  await page.getByRole('searchbox',{name:'Tìm board hoặc vi điều khiển'}).fill('ESP32 S3')
  await expect(page.getByRole('heading',{name:/ESP32-S3-DevKitC-1/}).first()).toBeVisible()
})

test('robot checklist is restored on reload and admin has its own title',async({page})=>{
  await page.goto('/app/robot-simulation')
  await page.getByRole('button',{name:'Hoàn thành: Quan sát hướng'}).click()
  await page.reload()
  await expect(page.getByRole('button',{name:'Đã hoàn thành: Quan sát hướng'})).toHaveAttribute('aria-pressed','true')
  await page.goto('/admin')
  await expect(page).toHaveTitle('Quản trị website — Mạch Mở')
})

test('ESP32 rebuilt presets use the approved GPIO and a blank bench resets the sample selector', async ({page}) => {
  await sample(page, /ESP32 DevKit V1/, 'button-led')
  await page.getByRole('tab', {name:/Viết code & Chạy/}).click()
  await expect(page.getByLabel('Mã nguồn Arduino C++')).toHaveValue(/const int NUT = 19;/)
  await page.getByRole('button', {name:'Bàn trống', exact:true}).click()
  await expect(page.getByLabel('Mạch mẫu')).toHaveValue('blink')
  await expect(page.getByRole('heading',{name:'Bàn của bạn, bắt đầu từ trống'})).toBeVisible()
})

test('beginner explanations follow observation and Arduino Mega code uses the A0 label', async ({page}) => {
  await page.goto('/learn/basics')
  await expect(page.getByText('Đường về nguồn ảnh hưởng thế nào đến LED?')).toHaveCount(0)
  await page.getByRole('radio', {name:'LED tắt', exact:true}).check()
  await page.getByRole('button', {name:'Quan sát mô hình', exact:true}).click()
  await expect(page.getByText('Đường về nguồn ảnh hưởng thế nào đến LED?')).toBeVisible()
  await page.getByRole('navigation',{name:'Năm hoạt động'}).getByRole('button',{name:/Thử sát ngưỡng cảm biến/}).click()
  await page.getByLabel('Board của thử nghiệm').selectOption({label:'Arduino Mega 2560 R3'})
  await page.getByText('Code được tạo cho board đã chọn',{exact:true}).click()
  await expect(page.getByLabel('Code thử nghiệm chỉ đọc')).toContainText('const int potPin = A0;')
})

test('SPICE uses the available Workspace width and exposes one main landmark', async ({page}) => {
  await page.setViewportSize({width: 1024, height: 900})
  await page.goto('/app/tools/spice')
  await expect(page.getByRole('main')).toHaveCount(1)
  const result = page.locator('.spice-output-card')
  await expect(result).toBeVisible()
  expect((await result.boundingBox()).width).toBeGreaterThan(400)
})

test('the LED calculator clears its recommendation outside its low-voltage range', async ({page}) => {
  await page.goto('/tools/electronics-calculators')
  const suggestion = page.getByText('Điện trở E24 đề xuất', {exact: true})
  await expect(suggestion).toBeVisible()
  const supply = page.getByLabel('Điện áp nguồn', {exact: false}).first()
  await supply.fill('48')
  await expect(page.getByText('Phép tính này chỉ dùng cho nguồn DC đến 30 V.')).toBeVisible()
  await expect(suggestion).toHaveCount(0)
  await supply.fill('5')
  await expect(suggestion).toBeVisible()
})
