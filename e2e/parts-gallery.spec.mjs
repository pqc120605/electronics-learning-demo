import { expect, test } from '@playwright/test'

test('parts gallery groups all 147 unique entries and restores filters from the detail page', async ({ page }) => {
  await page.goto('/components')
  const cards = page.locator('.parts-card')
  await expect(cards).toHaveCount(147)
  expect(new Set(await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).size).toBe(147)
  await expect(page.locator('.parts-results output')).toHaveText('147 linh kiện')

  await page.getByRole('combobox', { name: 'Nhóm linh kiện' }).selectOption('IC logic')
  await page.getByRole('searchbox', { name: 'Tìm linh kiện' }).fill('74hc86')
  await expect(cards).toHaveCount(1)
  await cards.first().click()
  await expect(page.getByRole('heading', { level: 1, name: /SN74HC86/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Texas Instruments.*SN74HC86N/ })).toHaveAttribute('href', 'https://www.ti.com/lit/ds/symlink/sn74hc86.pdf')
  await expect(page.getByRole('link', { name: /Lắp thử trên bàn tự do/ })).toHaveAttribute('href', '/build/freestyle?part=sn74hc86-r2a')
  await page.getByRole('link', { name: /Quay lại kho linh kiện/ }).click()
  await expect(page.getByRole('searchbox', { name: 'Tìm linh kiện' })).toHaveValue('74hc86')
  await expect(page.getByRole('combobox', { name: 'Nhóm linh kiện' })).toHaveValue('IC logic')
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
  await expect(cards).toHaveCount(147)
  const practice = page.getByRole('checkbox', { name: 'Có bài thực hành' })
  await practice.click()
  await expect(practice).toBeChecked()
  await expect(cards.first()).toBeVisible()
  await expect(page.locator('.parts-results output')).toHaveText(/^[1-9]\d* \/ 147 linh kiện$/)
})

test('mobile gallery displays two columns, loads its thumbnails and keeps direct links', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/components?component=missing-test-part')
  await expect(page.getByText('Không tìm thấy linh kiện trong liên kết.')).toBeVisible()
  const columns = await page.locator('.parts-group ul').first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns)
  expect(columns.trim().split(/\s+/)).toHaveLength(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)

  const broken = await page.locator('.parts-thumbnail img').evaluateAll(async (images) => {
    const failures = []
    await Promise.all(images.map(async (image) => {
      image.loading = 'eager'
      try { await image.decode() } catch { failures.push(image.getAttribute('src')) }
    }))
    return failures
  })
  expect(broken).toEqual([])
  await expect(page.locator('.parts-card .parts-package')).toHaveCount(0)
  await page.goto('/components?component=arduino-uno')
  await expect(page.getByRole('link', { name: 'Xem chân và linh kiện trên board' }))
    .toHaveAttribute('href', '/boards?board=arduino-uno-r3&view=pins')
  await page.goto('/components?component=electrolytic')
  await expect(page.getByRole('link', { name: /Lắp thử trên bàn tự do/ }))
    .toHaveAttribute('href', '/build/freestyle?part=capacitor')
})

test('resistor has a real orthographic view and preserves its selected pin in 3D', async ({ page }) => {
  await page.goto('/components?component=resistor')
  await page.getByRole('button', { name: 'Mặt trên 2D', exact: true }).click()
  const top = page.getByRole('region', { name: /Mặt trên 2D/ })
  await expect(top.getByRole('img')).toHaveAttribute('src', /^\/component-reference\/topview\//)
  await top.getByRole('button', { name: /Chọn chân .* trên hình/ }).first().click()
  const selection = page.getByLabel('Chân trên mô hình tham chiếu')
  const chosen = await selection.inputValue()
  expect(chosen).not.toBe('')
  await page.getByRole('button', { name: 'Xem mô hình 3D', exact: true }).click()
  await expect(page.locator('.component-model-viewer canvas')).toBeVisible()
  await expect(selection).toHaveValue(chosen)
})

test('component orthographic 2D loads without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : getContext.call(this, type, ...args)
    }
  })
  await page.goto('/components?component=hc-sr04')
  await page.getByRole('button', { name: 'Mặt trên 2D', exact: true }).click()
  const img = page.getByRole('img', { name: /Hình chiếu vuông góc/ })
  await expect(img).toBeVisible()
  await expect.poll(() => img.evaluate(element => element.naturalWidth)).toBeGreaterThan(0)
})
