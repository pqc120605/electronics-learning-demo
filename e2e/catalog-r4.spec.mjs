import { readFile } from 'node:fs/promises'
import { expect as browserExpect, test } from '@playwright/test'

const expect = browserExpect.configure({ timeout: 30000 })
test.describe.configure({ timeout: 90000 })
test.use({ launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']} })

const cases = [
  ['ds18b20','DS18B20+',3,'91 01'],
  ['tmp102','TMP102AIDRLR',6,'19 10'],
  ['tmp117','TMP117AIDRVR',7,'0C 80'],
  ['hdc1080','HDC1080DMBR',7,'64 D8'],
  ['opt3001','OPT3001DNPR',7,'10.24 lx'],
  ['bme280','BME280 · 0 273 141 185',8,'25.08 °C'],
  ['ds3231','DS3231SN#',16,'01/02/2026'],
  ['adxl345','ADXL345BCCZ',14,'00 01 80 FF'],
  ['vl53l0x','VL53L0CXV0DH/1',12,'120 mm'],
  ['lis3dh','LIS3DHTR',16,'80 3E C0 E0'],
  ['max6951','MAX6951CEE+',17,'2······A'],
  ['tlc5940','TLC5940NT',28,'50%'],
  ['tlc5928','TLC5928PWPR',25,'8001'],
  ['tlc59116','TLC59116IPWR',28,'50%'],
  ['tlc5916','TLC5916IN',16,'81'],
]

let page
test.beforeAll(async ({ browser, baseURL }, testInfo) => {
  testInfo.setTimeout(150000)
  page=await browser.newPage({baseURL})
  await page.goto('/components?component=ds18b20',{waitUntil:'domcontentloaded'})
  await expect(page.getByRole('region',{name:'Biến thể DS18B20+'})).toBeVisible()
})
test.afterAll(async()=>{await page?.close()})

async function openPart(id) {
  await page.evaluate(component=>{
    history.pushState(null,'','/components?component='+component)
    dispatchEvent(new PopStateEvent('popstate'))
  },id)
}
const workspace = () => page.evaluate(()=>JSON.parse(localStorage.getItem('machmo-freestyle-v1')??'{}'))

for (const [id,mpn,count,value] of cases) {
  test(mpn+' uses the same physical pins in 2D/3D and runs its wired local circuit',async()=>{
    const small=['opt3001','ds3231','tlc5928','tlc59116'].includes(id)
    await page.setViewportSize(small?{width:390,height:844}:{width:1440,height:1000})
    await page.evaluate(()=>localStorage.clear())
    await openPart(id)
    const part=page.getByRole('region',{name:'Biến thể '+mpn})
    await expect(part.locator('.part-r1-symbol button')).toHaveCount(count)
    await part.getByRole('button',{name:/· pad 1$/}).click()
    const selected=part.locator('.part-r1-selection strong')
    const label=await selected.textContent()
    await part.getByRole('button',{name:'Footprint',exact:true}).click()
    await expect(part.locator('.part-r1-pad')).toHaveCount(count)
    await expect(part.getByRole('button',{name:/^Pad 1 ·/})).toHaveAttribute('aria-pressed','true')
    const fp=await page.request.get(await part.getByRole('link',{name:/Tải footprint/}).getAttribute('href'))
    expect(fp.ok()).toBe(true)
    expect(await fp.text()).toMatch(/^\(footprint /)
    await part.getByRole('button',{name:'Mô hình 3D',exact:true}).click()
    await expect(part.getByRole('img',{name:'Mô hình 3D '+mpn})).toBeVisible()
    const marker=part.locator('.component-model-marker')
    await expect(marker).toBeVisible()
    const style=await marker.getAttribute('style')
    await part.getByRole('button',{name:'Xoay sang phải'}).click()
    await expect(marker).not.toHaveAttribute('style',style)
    await expect(selected).toHaveText(label)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width)
    await part.getByRole('button',{name:'Chạy mẫu 1'}).click()
    await expect(part.getByLabel('Kết quả mạch R4')).toContainText(value)
    await part.getByRole('link',{name:'Mở mạch thử đã nối trên bàn tự do'}).click()
    await expect.poll(async()=> (await workspace()).doc?.parts?.some(p=>p.type===id+'-r4')).toBe(true)
    const lab=page.getByRole('region',{name:'Điều khiển mạch R4'})
    await lab.getByRole('button',{name:'Chạy mẫu 1'}).click()
    await expect(lab.getByLabel('Kết quả mạch R4')).toContainText(value)
    await expect(lab.getByLabel('Kết quả mạch R4')).toHaveAttribute('data-r4-ok','true')
  })
}

test('shared I²C circuit reports LED hysteresis after reopening saved wires',async()=>{
  test.setTimeout(180000)
  await page.setViewportSize({width:1440,height:1000})
  await page.evaluate(()=>localStorage.clear())
  await openPart('tlc5916')
  await page.getByRole('link',{name:'Mở mạch thử đã nối trên bàn tự do'}).click()
  await expect.poll(async()=> (await workspace()).doc?.parts?.some(p=>p.type==='tlc5916-r4')).toBe(true)
  const old=(await workspace()).doc
  await openPart('tmp102')
  await page.getByRole('link',{name:'Thử TMP102 và TLC59116 trên cùng bus'}).click()
  await expect.poll(async()=> (await workspace()).doc?.parts?.some(p=>p.id==='driver')).toBe(true)
  const saved=(await workspace()).doc
  const archived=await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('machmo-freestyle-v1:previous:'))
    .map(key=>JSON.parse(localStorage.getItem(key)).doc))
  expect(archived).toContainEqual(old)
  const lab=page.getByRole('region',{name:'Điều khiển mạch R4'})
  for (const [t,expected] of [['31','LED sáng'],['29','LED sáng'],['27','LED tắt']]) {
    await lab.getByRole('spinbutton',{name:'Nhiệt độ ảo (°C)'}).fill(t)
    await lab.getByRole('button',{name:'Đọc nhiệt độ và cập nhật LED'}).click()
    await expect(lab.getByLabel('Kết quả mạch R4')).toContainText(expected)
  }
  await page.goto('/build/freestyle?resume=1',{waitUntil:'domcontentloaded'})
  await expect.poll(async()=> (await workspace()).doc?.wires).toEqual(saved.wires)
  await lab.getByRole('button',{name:'Đọc nhiệt độ và cập nhật LED'}).click()
  await expect(lab.getByLabel('Kết quả mạch R4')).toContainText('LED sáng')
  await page.getByRole('button',{name:'Bản nháp',exact:true}).click()
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Xuất dự án .machmo.json'}).click()
  const raw=await readFile(await (await download).path())
  await page.getByRole('button',{name:'Đóng bản nháp'}).click()
  await page.getByRole('button',{name:'Schematic',exact:true}).click()
  await page.getByRole('button',{name:'Chọn net controller:sda',exact:true}).first().press('Enter')
  await page.locator('.freestyle-bench').press('Delete')
  await expect.poll(async()=> (await workspace()).doc.wires.length).toBe(saved.wires.length-1)
  await lab.getByRole('button',{name:'Đọc nhiệt độ và cập nhật LED'}).click()
  await expect(lab.getByLabel('Kết quả mạch R4')).toContainText('NACK')
  await page.getByLabel('Nhập bản nháp từ file').setInputFiles({name:'r4-circuit.machmo.json',mimeType:'application/json',buffer:raw})
  await expect.poll(async()=> (await workspace()).doc.wires).toEqual(saved.wires)
  await lab.getByRole('button',{name:'Đọc nhiệt độ và cập nhật LED'}).click()
  await expect(lab.getByLabel('Kết quả mạch R4')).toContainText('LED sáng')
})
