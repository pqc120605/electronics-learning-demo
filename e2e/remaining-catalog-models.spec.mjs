import { expect, test } from '@playwright/test'

test('DHT11 keeps the selected NC pad when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : getContext.call(this, type, ...args)
    }
  })
  await page.goto('/components?component=dht11')
  const explorer = page.getByRole('region', { name: 'Biến thể DHT11' })
  await explorer.getByRole('button', { name: 'Footprint', exact: true }).click()
  await explorer.locator('[data-pad="3"]').click()
  await explorer.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
  await expect(explorer.getByText('WebGL không mở được.', { exact: false })).toBeVisible()
  await explorer.getByRole('button', { name: 'Mặt trước 2D', exact: true }).click()
  const top = explorer.getByRole('region', { name: 'Mặt trước 2D DHT11' })
  await expect(top.getByRole('button', { name: 'Chọn chân NC trên hình' })).toHaveAttribute('aria-pressed', 'true')
})

const boards = [
  ['esp32-c3-devkitm-1', 'j1-2', '3V3',30,'ESP32-C3-MINI-1'],
  ['esp32-devkitm-1', 'j3-1', 'GND',34,'ESP32-MINI-1'],
  ['esp32-c6-devkitc-1', 'j1-9', 'IO8',32,'ESP32-C6-WROOM-1'],
  ['esp32-s2-devkitc-1', 'j1-11', 'IO18',44,'ESP32-S2-SOLO-2'],
  ['esp32-h2-devkitm-1', 'j1-7', 'NC (XTAL / IO13)',30,'ESP32-H2-MINI-1'],
  ['stm32-nucleo-f411re', 'cn8-5', 'A4 / PC1',108,'STM32F411RET6 · LQFP-64'],
  ['stm32-nucleo-l476rg', 'cn10-18', 'PB11',108,'STM32L476RGT6 · LQFP-64'],
  ['stm32-nucleo-f446re', 'cn9-7', 'D6 / PB10',108,'STM32F446RET6 · LQFP-64'],
  ['arduino-nano-every', 'jp3-1', 'D1 / TX',30,'ATmega4809 · TQFP-48'],
]

for (const [id,pin,label,count,part] of boards) {
  test(id + ' keeps a mapped header pin through 2D and 3D', async ({ page }) => {
    test.setTimeout(90_000)
    if (id === 'esp32-h2-devkitm-1' || id === 'arduino-nano-every') await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/boards?board=' + id + '&view=top')
    const top = page.getByRole('region', { name: 'Mặt board 2D' })
    await expect(top.locator('image')).toHaveAttribute('href', '/board-reference/topview/' + id + '.png')
    await expect(top.locator('[data-board-pad]')).toHaveCount(count)
    const drop = top.getByLabel('Chân header')
    await drop.selectOption(pin)
    await expect(top.getByRole('heading', { name: label, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    const model = page.locator('.board-cad-viewer')
    await model.locator('canvas').scrollIntoViewIfNeeded()
    await model.getByRole('group', { name: 'Chọn linh kiện để xem thông tin' }).getByRole('button', { name: part }).click({ timeout: 8000 })
    await expect(model.getByRole('button', { name: 'Tập trung vào linh kiện đang chọn' })).toBeEnabled({ timeout: 40_000 })
    await model.getByRole('button', { name: 'Xoay phải 90 độ' }).click()
    await expect(page.locator('.board-selected-pin')).toContainText(label)
    await page.getByRole('button', { name: 'Mặt board 2D', exact: true }).click()
    await expect(drop).toHaveValue(pin)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  })
}

for (const [id, name, count] of [
  ['dht11','DHT11',4], ['dht22-bare','AM2302 / DHT22 rời',4],
  ['keypad-4x4','PID 3844',8], ['seven-segment-anode','SA56-11EWA',10],
]) {
  test(name + ' cross-probes a footprint pad in 2D and 3D', async ({ page, request }) => {
    test.setTimeout(70_000)
    if (id === 'keypad-4x4') await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/components?component=' + id)
    const explorer = page.getByRole('region', { name: 'Biến thể ' + name })
    await expect(explorer.getByRole('button', { name: /^Chọn chân .* · pad \d+$/ })).toHaveCount(count)
    await explorer.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(explorer.locator('[data-pad]')).toHaveCount(count)
    await explorer.locator('[data-pad="' + count + '"]').click()
    const file = await explorer.getByRole('link', { name: /Tải footprint KiCad/ }).getAttribute('href')
    const attachment = await request.get(file)
    expect(attachment.ok()).toBeTruthy()
    expect((await attachment.text()).startsWith('(footprint')).toBeTruthy()
    const viewName = id.startsWith('dht') ? 'Mặt trước 2D' : 'Mặt trên 2D'
    await explorer.getByRole('button', { name: viewName, exact: true }).click()
    const top = explorer.getByRole('region', { name: viewName + ' ' + name })
    await expect.poll(() => top.getByRole('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0)
    await expect(top.getByRole('button', { pressed: true })).toHaveCount(1)
    await explorer.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
    await expect(explorer.locator('canvas')).toBeVisible()
    await expect(explorer.locator('.component-model-marker')).toBeVisible({ timeout: 25_000 })
    await explorer.getByRole('button', { name: 'Xoay sang phải' }).click()
    await expect(explorer.locator('.part-r1-selection')).toContainText('pad ' + count)
    await explorer.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(explorer.locator('[data-pad="' + count + '"]')).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  })
}
