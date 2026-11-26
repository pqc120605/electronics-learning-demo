import { expect, test } from '@playwright/test'

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

test('catalog selects the same R1 terminal in 2D, footprint and rotating WebGL', async ({ page }) => {
  await page.goto('/components?component=sn74hc08')
  const view = page.getByRole('region', { name: 'Biến thể SN74HC08N' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Chọn chân 1A · pad 1', exact: true }).click()
  await view.getByRole('button', { name: 'Footprint', exact: true }).click()
  await expect(view.getByRole('button', { name: 'Pad 1 · 1A', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await view.getByRole('button', { name: 'Pad 3 · 1Y', exact: true }).click()
  await view.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
  await expect(view.getByRole('img', { name: 'Mô hình 3D SN74HC08N' })).toBeVisible()
  await expect(view.locator('.component-model-marker')).toBeVisible()
  const before = await view.locator('.component-model-marker').getAttribute('style')
  await view.getByRole('button', { name: 'Xoay sang phải' }).click()
  await expect(view.locator('.component-model-marker')).not.toHaveAttribute('style', before)
  await expect(view.getByText('Chân 1Y · pad 3')).toBeVisible()
  await view.getByRole('combobox', { name: 'A', exact: true }).selectOption('1')
  await view.getByRole('combobox', { name: 'B', exact: true }).selectOption('1')
  await expect(view.locator('output')).toContainText('1Y = 1')
  await view.getByRole('checkbox', { name: 'Cấp nguồn bài thử' }).uncheck()
  await expect(view.locator('output')).toContainText('1Y = X')
})

test('mobile uses R1 ADC and preserves the exact variant after local draft reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/components?component=mcp3008')
  const part = page.getByRole('region', { name: 'Biến thể MCP3008-I/P' })
  await part.getByRole('combobox', { name: 'Kênh ADC' }).selectOption('6')
  await part.getByRole('spinbutton', { name: 'Điện áp kênh (V)' }).fill('2.5')
  await part.getByRole('button', { name: 'Giao dịch SPI' }).click()
  await expect(part.locator('output')).toHaveText('CH6 → 512 / 1023')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('link', { name: /Lắp thử trên bàn tự do/ }).click()
  await expect(page.getByRole('button', { name: /^MCP3008-I\/P ·/ })).toBeVisible()
  const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}').doc)
  await expect.poll(async () => (await draft())?.parts.some(part => part.type === 'mcp3008-r1')).toBe(true)
  const placed = (await draft()).parts.find(part => part.type === 'mcp3008-r1')
  await page.getByText('Danh sách chân để nối bằng bàn phím', { exact: true }).click()
  await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':dgnd"]').click()
  await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':agnd"]').click()
  await expect.poll(async () => (await draft())?.wires.length).toBe(1)
  const savedWire = (await draft()).wires[0]
  expect([savedWire.from.pinId, savedWire.to.pinId].sort()).toEqual(['agnd', 'dgnd'])
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  await expect(page.locator('[data-pin-key="' + placed.id + ':agnd"]')).toBeVisible()
  await expect(page.locator('[data-pin-key="' + placed.id + ':dgnd"]')).toBeVisible()
  expect((await draft()).wires[0]).toEqual(savedWire)
})

const analog = [
  ['r1-1n4148-forward', [0.6, 0.68, 0.72], [[0.53, 0.66], [0.62, 0.75], [0.65, 1]]],
  ['r1-1n4148-leak', [10], [[0, 25]]],
  ['r1-2n3904-active', [10], [[5, 15]]],
  ['r1-2n3904-saturation', [0.15, 0.23], [[0, 0.2], [0, 0.3]]],
  ['r1-2n3904-cutoff', [25], [[0, 50]]],
  ['r1-tmp36', [0.5, 0.75, 1.25], [[0.499, 0.501], [0.749, 0.751], [1.249, 1.251]]],
]
for (const [id, predictions, bounds] of analog) {
  test(id + ' runs the browser ngspice worker in the documented range', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/tools/spice?lab=' + id)
    const lab = page.locator('.spice-guided-practice')
    const measurements = []
    for (const [index, guess] of predictions.entries()) {
      await lab.getByRole('combobox', { name: 'Điều kiện thử' }).selectOption(String(index))
      await lab.getByRole('textbox', { name: /Dự đoán/ }).fill(String(guess))
      await lab.getByRole('button', { name: 'Ghi dự đoán và chạy' }).click()
      const result = lab.getByText(/^Ngspice · /)
      await expect(result).toBeVisible({ timeout: 15000 })
      const reading = Number((await result.textContent()).match(/= (-?[\d,.]+)/)?.[1].replace(',', '.'))
      measurements.push(reading)
      expect(reading).toBeGreaterThanOrEqual(bounds[index][0])
      expect(reading).toBeLessThanOrEqual(bounds[index][1])
    }
    console.log(id, measurements)
  })
}
