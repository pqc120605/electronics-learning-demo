import { expect, test } from '@playwright/test'

for (const [id, name, count] of [
  ['logic-74hc00', 'SN74HC00N', 14],
  ['logic-74hc4511', 'CD74HC4511E', 16],
  ['timer-ne555', 'NE555P', 8],
  ['display-max7219', 'MAX7219CNG+', 24],
]) {
  test(`${name} cross-probes a numbered footprint pad in 2D and 3D`, async ({ page, request }) => {
    await page.goto('/components?component=' + id)
    const explorer = page.getByRole('region', { name: 'Biến thể ' + name })
    await expect(explorer.getByRole('button', { name: /^Chọn chân .* · pad \d+$/ })).toHaveCount(count)
    await explorer.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(explorer.locator('[data-pad]')).toHaveCount(count)
    await explorer.locator(`[data-pad="${count}"]`).click()
    await expect(explorer.locator('.part-r1-selection')).toContainText('pad ' + count)
    const file = await explorer.getByRole('link', { name: /Tải footprint KiCad/ }).getAttribute('href')
    const download = await request.get(file)
    expect(download.ok()).toBeTruthy()
    expect((await download.text()).startsWith('(footprint')).toBeTruthy()
    await explorer.getByRole('button', { name: 'Mặt trên 2D', exact: true }).click()
    const top = explorer.getByRole('region', { name: 'Mặt trên 2D ' + name })
    await expect.poll(() => top.getByRole('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0)
    await expect(top.getByRole('button', { pressed: true })).toHaveCount(1)
    await explorer.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
    await expect(explorer.locator('canvas')).toBeVisible()
    await expect(explorer.locator('.component-model-marker')).toBeVisible({ timeout: 25_000 })
    await expect(explorer.getByRole('button', { name: 'Xoay sang phải' })).toBeEnabled()
    await explorer.getByRole('button', { name: 'Xoay sang phải' }).click()
    await expect(explorer.locator('.part-r1-selection')).toContainText('pad ' + count)
    await explorer.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(explorer.locator(`[data-pad="${count}"]`)).toHaveAttribute('aria-pressed', 'true')
  })
}

for (const [id, pin, label, count] of [
  ['arduino-uno-r4-minima', 'jdigital-18', 'D15/SCL', 32],
  ['arduino-uno-r4-wifi', 'jdigital-18', 'D19/SCL', 32],
  ['arduino-nano-esp32', 'jp2-2', 'D0/RX0', 30],
]) {
  test(`${id} loads the matching 2D and 3D and retains the header pin`, async ({ page }) => {
    test.setTimeout(90_000)
    if (id === 'arduino-nano-esp32') await page.setViewportSize({ width: 375, height: 812 })
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
    const component = id === 'arduino-nano-esp32' ? /Module NORA-W106/ : /Vi điều khiển Renesas RA4M1/
    await model.getByRole('group', { name: 'Chọn linh kiện để xem thông tin' }).getByRole('button', { name: component }).click()
    await expect(model.getByRole('button', { name: 'Tập trung vào linh kiện đang chọn' })).toBeEnabled({ timeout: 40_000 })
    await model.getByRole('button', { name: 'Xoay phải 90 độ' }).click()
    await expect(page.locator('.board-selected-pin-details')).toContainText(label)
    await expect(page.locator('.board-selected-pin')).toContainText(label)
    await page.getByRole('button', { name: 'Mặt board 2D', exact: true }).click()
    await expect(drop).toHaveValue(pin)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  })
}
