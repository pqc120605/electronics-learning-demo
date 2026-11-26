import { readFile } from 'node:fs/promises'
import { expect as browserExpect, test } from '@playwright/test'

const expect = browserExpect.configure({ timeout: 30_000 })
test.describe.configure({ timeout: 90_000 })
test.use({ launchOptions: { args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] } })

const cases = [
  ['lm386','LM386N-1/NOPB',8,'Đo quá độ ngspice', /0\.09\d|0\.10\d/],
  ['max98357a','MAX98357AETE+T',17,'Kênh trái', '0.500 V'],
  ['tpa2012d2','TPA2012D2RTJR',21,'4×', '0.400 V'],
  ['ne5532','NE5532P',8,'Đo quá độ ngspice', /0\.99\d|1\.00\d/],
  ['l293d','L293DNE',16,'Khóa trục', '0.283 A'],
  ['drv8833','DRV8833PWPR',17,'Khóa trục', '0.294 A'],
  ['drv8825','DRV8825PWPR',29,'Home', '0.426 A'],
  ['uln2003a','ULN2003AN',16,'Kênh 1', '6.2 V'],
  ['uln2803a','ULN2803A',18,'Kênh 1', '10.2 V'],
  ['drv8871','DRV8871DDAR',9,'Khóa trục', '0.640 A'],
]

let page
test.beforeAll(async ({ browser, baseURL }, info) => {
  info.setTimeout(90_000)
  page = await browser.newPage({ baseURL })
})
test.afterAll(async () => { await page?.close() })
const workspace = () => page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}'))
const panel = () => page.getByRole('region', { name: 'Điều khiển mạch R5' })
const output = () => panel().getByLabel('Kết quả mạch R5')

async function open(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
}

for (const [id, mpn, count, mode, value] of cases) {
  test(mpn + ' matches 2D, footprint and GLB and runs a wired circuit', async () => {
    const width = ['lm386', 'max98357a', 'drv8825'].includes(id) ? 390 : 1440
    await page.setViewportSize({ width, height: 900 })
    await open('/components?component=' + id)
    await page.evaluate(() => localStorage.clear())
    const part = page.getByRole('region', { name: 'Biến thể ' + mpn })
    await expect(part.locator('.part-r1-symbol button')).toHaveCount(count)
    await part.getByRole('button', { name: /· pad 1$/ }).click()
    const selected = part.locator('.part-r1-selection strong')
    const selectedPin = await selected.textContent()
    await part.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(part.locator('.part-r1-pad')).toHaveCount(count)
    await expect(part.getByRole('button', { name: /^Pad 1 ·/ })).toHaveAttribute('aria-pressed', 'true')
    const footprint = await page.request.get(await part.getByRole('link', { name: /Tải footprint/ }).getAttribute('href'))
    expect(footprint.ok()).toBe(true)
    expect(await footprint.text()).toMatch(/^\(footprint /)
    await part.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
    await expect(part.getByRole('img', { name: 'Mô hình 3D ' + mpn })).toBeVisible()
    const marker = part.locator('.component-model-marker')
    await expect(marker).toBeVisible()
    const style = await marker.getAttribute('style')
    await part.getByRole('button', { name: 'Xoay sang phải' }).click()
    await expect(marker).not.toHaveAttribute('style', style)
    await expect(selected).toHaveText(selectedPin)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await part.getByRole('link', { name: 'Mở mạch thử đã nối trên bàn tự do' }).click()
    await expect.poll(async () => (await workspace()).doc?.parts.some(part => part.type === id + '-r5')).toBe(true)
    await panel().getByRole('button', { name: mode, exact: true }).click()
    await expect(output()).toHaveAttribute('data-r5-ok', 'true')
    await expect(output()).toContainText(value)
    await expect(panel().getByRole('img', { name: /^Đồ thị/ })).toBeVisible()
    if (id === 'l293d') {
      for (const state of ['Phanh 00', 'Phanh 11']) {
        await panel().getByRole('button', { name: state, exact: true }).click()
        await expect(output()).toContainText(state)
      }
    }
  })
}

for (const [fixture, peak] of [
  ['lm386-r5:gain', /0\.9[0-9]{2}|1\.0[0-9]{2}/],
  ['lm386-r5:clip', /VOUT trước tụ \(V\) 2\.(?:18[0-9]|19[0-9]|200) V đỉnh/],
  ['ne5532-r5:gain', /0\.(?:49|50)[0-9]/],
]) {
  test(fixture + ' solves approved analog variant in ngspice WASM', async () => {
    await open('/build/freestyle?fixture=' + encodeURIComponent(fixture))
    await panel().getByRole('button', { name: 'Đo quá độ ngspice' }).click()
    await expect(output()).toHaveAttribute('data-r5-ok', 'true')
    await expect(output()).toContainText(peak)
    await expect(output()).toContainText('ngspice WASM')
  })
}

for (const [fixture, mode, match] of [
  ['lm386-r5', 'Đo quá độ ngspice', 'ngspice WASM'],
  ['drv8871-r5', 'Khóa trục', '0.640 A'],
]) {
  test(fixture + ' retains net endpoints after export, a broken wire and import', async () => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open('/build/freestyle?fixture=' + fixture)
    await expect.poll(async () => (await workspace()).doc?.parts.some(part => part.type === fixture)).toBe(true)
    const saved = (await workspace()).doc
    await open('/build/freestyle?resume=1')
    await expect.poll(async () => (await workspace()).doc?.wires).toEqual(saved.wires)
    await page.getByRole('button', { name: 'Bản nháp', exact: true }).click()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất dự án .machmo.json' }).click()
    const raw = await readFile(await (await download).path())
    await page.getByRole('button', { name: 'Đóng bản nháp' }).click()
    await page.getByRole('button', { name: 'Schematic', exact: true }).click()
    const pin = fixture.startsWith('lm386') ? 'inplus' : 'ilim'
    // Pick the corresponding rendered net, then delete the selected wire.
    const selected = page.getByRole('button', { name: 'Chọn net ic:' + pin, exact: true }).first()
    await selected.press('Enter')
    await page.locator('.freestyle-bench').press('Delete')
    await expect.poll(async () => (await workspace()).doc.wires.length).toBe(saved.wires.length - 1)
    await panel().getByRole('button', { name: mode, exact: true }).click()
    await expect(output()).toHaveAttribute('data-r5-ok', 'false')
    await page.getByLabel('Nhập bản nháp từ file').setInputFiles({ name: 'r5-circuit.machmo.json', mimeType: 'application/json', buffer: raw })
    await expect.poll(async () => (await workspace()).doc?.wires).toEqual(saved.wires)
    await panel().getByRole('button', { name: mode, exact: true }).click()
    await expect(output()).toHaveAttribute('data-r5-ok', 'true')
    await expect(output()).toContainText(match)
  })
}
