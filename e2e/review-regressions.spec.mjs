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
  await expect(page.locator('.component-catalog-list').getByRole('button',{name:/Cảm biến siêu âm HC-SR04/})).toBeVisible()
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
