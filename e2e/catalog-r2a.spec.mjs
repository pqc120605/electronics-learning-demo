import { expect, test } from '@playwright/test'

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

const examples = [
  ['02', 14, [['1A','1']], '1y', '0'],
  ['04', 14, [['1A','1']], '1y', '0'],
  ['32', 14, [['2B','1']], '2y', '1'],
  ['86', 14, [['3A','1'], ['3B','1']], '3y', '0'],
  ['125', 14, [['1A','1'], ['1/OE','1']], '1y', 'Z'],
  ['126', 14, [['1A','1'], ['1OE','1']], '1y', '1'],
  ['138', 16, [['B','1'], ['G1','1']], 'y2', '0'],
  ['139', 16, [['2A','1'], ['2B','1']], '2y3', '0'],
  ['151', 16, [['D6','1'], ['B','1'], ['C','1']], 'y', '1'],
  ['153', 16, [['2C3','1'], ['A','1'], ['B','1']], '2y', '1'],
  ['157', 16, [['4B','1'], ['A/B','1']], '4y', '1'],
  ['164', 14, [['A','1'], ['B','1'], ['/CLR','1']], 'qa', '1', true],
  ['165', 16, [['G','1'], ['SH/LD','1']], 'qh', '1', true],
  ['245', 20, [['A1','1'], ['B1','0'], ['/OE','0']], 'b1', 'X'],
]

for (const [model, pads, stimulus, readout, expected, pulse] of examples) {
  const mpn = 'SN74HC' + model + 'N'
  test(mpn + ' maps pad 1 between 2D, KiCad and WebGL and runs its logic model', async ({ page }) => {
    if (model === '245') await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/components?component=sn74hc' + model)
    const panel = page.getByRole('region', { name: 'Biến thể ' + mpn })
    await expect(panel.getByRole('link', { name: /^Pinout SCLS/ })).toBeVisible()
    await expect(panel.locator('.part-r1-symbol button')).toHaveCount(pads)
    await panel.getByRole('button', { name: /· pad 1$/ }).click()
    const selection = panel.locator('.part-r1-selection strong')
    const pinOne = await selection.textContent()
    expect(pinOne).toMatch(/pad 1$/)

    await panel.getByRole('button', { name: 'Footprint', exact: true }).click()
    await expect(panel.locator('.part-r1-pad')).toHaveCount(pads)
    await expect(panel.getByRole('button', { name: /^Pad 1 ·/ })).toHaveAttribute('aria-pressed', 'true')
    const footprint = panel.getByRole('link', { name: 'Tải footprint KiCad ↧' })
    await expect(footprint).toHaveAttribute('href', new RegExp('DIP-' + pads + '_W7\\.62mm\\.kicad_mod$'))
    if (model === '245') {
      const [download] = await Promise.all([page.waitForEvent('download'), footprint.click()])
      expect(download.suggestedFilename()).toBe('DIP-20_W7.62mm.kicad_mod')
    }

    await panel.getByRole('button', { name: 'Mô hình 3D', exact: true }).click()
    await expect(panel.getByRole('img', { name: 'Mô hình 3D ' + mpn })).toBeVisible()
    const marker = panel.locator('.component-model-marker')
    await expect(marker).toBeVisible()
    const style = await marker.getAttribute('style')
    await panel.getByRole('button', { name: 'Xoay sang phải' }).click()
    await expect(marker).not.toHaveAttribute('style', style)
    await expect(selection).toHaveText(pinOne)

    const lab = panel.getByRole('group', { name: 'Thử logic ' + mpn })
    for (const [input, value] of stimulus) await lab.getByRole('combobox', { name: input, exact: true }).selectOption(value)
    if (pulse) await lab.getByRole('button', { name: 'Phát một xung CLK' }).click()
    const result = lab.locator('[data-logic-pin="' + readout + '"]')
    await expect(result).toHaveAttribute('data-logic-value', expected)
    if (model === '245') {
      await lab.getByRole('combobox', { name: 'B1', exact: true }).selectOption('Z')
      await expect(result).toHaveAttribute('data-logic-value', '1')
      await lab.getByRole('combobox', { name: '/OE', exact: true }).selectOption('1')
      await expect(result).toHaveAttribute('data-logic-value', 'Z')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    }
  })
}

test('exact SN74HC245N search, breadboard placement and draft reload retain its wired pins', async ({ page }) => {
  await page.goto('/components?q=SN74HC245N')
  const cards = page.locator('.parts-card')
  await expect(cards).toHaveCount(1)
  await cards.first().click()
  await page.getByRole('link', { name: /Lắp thử trên bàn tự do/ }).click()
  await expect(page.getByRole('button', { name: /^SN74HC245N ·/ })).toBeVisible()
  const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}').doc)
  await expect.poll(async () => (await draft())?.parts.some(part => part.type === 'sn74hc245-r2a')).toBe(true)
  const placed = (await draft()).parts.find(part => part.type === 'sn74hc245-r2a')
  expect(placed.mount.kind).toBe('breadboard')
  await page.getByText('Danh sách chân để nối bằng bàn phím', { exact: true }).click()
  await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':a1"]').click()
  await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':b1"]').click()
  await expect.poll(async () => (await draft())?.wires.length).toBe(1)
  const wire = (await draft()).wires[0]
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  await expect(page.locator('[data-pin-key="' + placed.id + ':a1"]')).toBeVisible()
  await expect(page.locator('[data-pin-key="' + placed.id + ':b1"]')).toBeVisible()
  expect((await draft()).wires[0]).toEqual(wire)
})
