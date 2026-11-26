import { expect as browserExpect, test } from '@playwright/test'

const expect = browserExpect.configure({ timeout: 45_000 })
test.describe.configure({ timeout: 120_000 })
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

let page
test.beforeAll(async ({ browser, baseURL }, testInfo) => {
  testInfo.setTimeout(180_000)
  page = await browser.newPage({ baseURL })
  await page.goto('/components?component=lm7805', { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await expect(page.getByRole('region', { name: 'Biến thể L7805CV' })).toBeVisible({ timeout: 120_000 })
})
test.afterAll(async () => { await page?.close() })

function openPart(id) {
  return page.evaluate(component => {
    history.pushState(null, '', '/components?component=' + component)
    dispatchEvent(new PopStateEvent('popstate'))
  }, id)
}

const cases = [
  ['lm7805','L7805CV',3,3,4.75,5.25],
  ['lm317','LM317T/NOPB',3,3,4.90,5.18],
  ['tl431','TL431AILP',3,3,4.85,5.15],
  ['lm2596','LM2596T-5.0/NOPB',5,5,4.75,5.25],
  ['lm2577','LM2577T-ADJ/LF03',5,5,11.4,12.6],
  ['tps61023','TPS61023DRLR',6,6,4.75,5.25],
  ['lm1117','LM1117MPX-3.3/NOPB',3,4,3.2,3.4],
  ['tps5430','TPS5430DDAR',9,12,4.75,5.25],
  ['tps62160','TPS62160DSGR',9,9,3.14,3.46],
  ['bq24074','BQ24074RGTR',17,17,360,410],
  ['ref5025','REF5025IDR',8,8,2.495,2.505],
  ['lm4040','LM4040A25IDBZR',3,3,2.49,2.51],
  ['1n4007','1N4007-E3/54',2,2,0.5,0.85],
  ['1n5819','1N5819-E3/54',2,2,0.18,0.45],
  ['1n4733a','1N4733A-TAP',2,2,4.845,5.355],
  ['2n3906','2N3906G',3,3,4.75,5.0],
  ['tip120','TIP120G',3,3,0.6,1.5],
  ['irlz44n','IRLZ44NPBF',3,3,0,0.01],
  ['2n7000','2N7000-G',3,3,0,0.25],
]

for (const [id, mpn, pins, pads, low, high] of cases) {
  test(mpn + ' has matching 2D, footprint, 3D, bench placement and ngspice', async () => {
    const mobile = ['lm1117','tps5430','bq24074','1n5819'].includes(id)
    await page.setViewportSize(mobile ? { width:390, height:844 } : { width:1440, height:1000 })
    await page.evaluate(() => localStorage.clear())
    await openPart(id)
    const part = page.getByRole('region', { name:'Biến thể ' + mpn })
    await expect(part.getByRole('link', { name:/^Pinout / })).toBeVisible()
    await expect(part.locator('.part-r1-symbol button')).toHaveCount(pins)
    await part.getByRole('button', { name:/· pad 1$/ }).click()
    const chosen = part.locator('.part-r1-selection strong')
    const samePin = await chosen.textContent()
    await part.getByRole('button',{ name:'Footprint', exact:true }).click()
    await expect(part.locator('.part-r1-pad')).toHaveCount(pads)
    await expect(part.getByRole('button', { name:/^Pad 1 ·/ })).toHaveAttribute('aria-pressed','true')
    const link = part.getByRole('link', { name:'Tải footprint KiCad ↧' })
    const response = await page.request.get(await link.getAttribute('href'))
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toMatch(/^\(footprint /)
    if (id === 'lm1117') {
      const aliases = part.getByRole('button', { name:/^Pad 2 ·/ })
      await expect(aliases).toHaveCount(2)
      await aliases.last().click()
      for (const alias of await aliases.all()) await expect(alias).toHaveAttribute('aria-pressed','true')
      await part.getByRole('button', { name:/^Pad 1 ·/ }).click()
    }

    await part.getByRole('button',{ name:'Mô hình 3D', exact:true }).click()
    await expect(part.getByRole('img', { name:'Mô hình 3D ' + mpn })).toBeVisible()
    const marker = part.locator('.component-model-marker')
    await expect(marker).toBeVisible()
    const initial = await marker.getAttribute('style')
    await part.getByRole('button',{ name:'Xoay sang phải' }).click()
    await expect(marker).not.toHaveAttribute('style',initial)
    await expect(chosen).toHaveText(samePin)
    const viewport = page.viewportSize()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

    await part.getByRole('link', { name:/ngspice/ }).click()
    const lab = page.locator('.spice-guided-practice')
    await lab.getByRole('textbox', { name:/Dự đoán/ }).fill('0')
    await lab.getByRole('button', { name:'Ghi dự đoán và chạy' }).click()
    const result = lab.getByText(/^Ngspice · /)
    await expect(result).toBeVisible()
    const value = Number((await result.textContent()).match(/= (-?[\d,.]+)/)?.[1].replace(',','.'))
    expect(value).toBeGreaterThanOrEqual(low)
    expect(value).toBeLessThanOrEqual(high)

    await openPart(id)
    await page.getByRole('link',{ name:/Lắp thử trên bàn tự do/ }).click()
    await expect.poll(() => page.evaluate(model => {
      const saved = JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}')
      return saved.doc?.parts.some(part => part.type === model)
    }, id + '-r3')).toBe(true)
  })
}

test('the wired charger archives the old draft, reopens with its endpoints, and runs ngspice', async () => {
  await page.setViewportSize({ width:1440, height:1000 })
  await page.evaluate(() => localStorage.clear())
  const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}').doc)
  await openPart('tip120')
  await page.getByRole('link',{ name:/Lắp thử trên bàn tự do/ }).click()
  await expect.poll(async () => (await snapshot())?.parts.some(part => part.type === 'tip120-r3')).toBe(true)
  const prior = await snapshot()
  await openPart('bq24074')
  await page.getByRole('link', { name:'Mở mạch thử đã nối trên bàn tự do' }).click()
  await expect.poll(async () => (await snapshot())?.parts?.some(part => part.type === 'bq24074-r3')).toBe(true)
  const doc = await snapshot()
  expect(doc.wires.length).toBeGreaterThan(20)
  const archived = await page.evaluate(() => Object.keys(localStorage)
    .filter(key => key.startsWith('machmo-freestyle-v1:previous:'))
    .map(key => JSON.parse(localStorage.getItem(key)).doc))
  expect(archived).toContainEqual(prior)
  await page.reload()
  await page.getByRole('button',{name:'Mở bản nháp đã lưu',exact:true}).click()
  expect((await snapshot()).wires).toEqual(doc.wires)
  await page.getByText('Phân tích DC mạch đang lắp',{exact:true}).click()
  await page.getByRole('button',{name:'Mở mạch này trong ngspice',exact:true}).click()
  await expect(page).toHaveURL(/workspaceSpice=/)
  await expect(page.getByText(/Mạch tự do R3 · DC/).first()).toBeVisible()
  await page.getByRole('button',{name:'Chạy SPICE',exact:true}).click()
  await expect(page.getByText('Mô phỏng hoàn tất.', {exact:true})).toBeVisible()
})
