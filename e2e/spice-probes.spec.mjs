import { test, expect } from '@playwright/test'

// Cải tiến #7 (2026-11-14): probe áp/dòng và con trỏ thời gian lấy số từ ngspice WASM.
test('SPICE probe map reads node voltage and branch current solved by ngspice', async ({ page }) => {
  await page.goto('/tools/spice')
  await page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' }).selectOption('divider')
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toBeVisible({ timeout: 30000 })
  const map = page.getByRole('group', { name: /Sơ đồ nút và nhánh/ })
  await expect(map.getByRole('button', { name: /^Nút out: 2,5 V$/ })).toBeVisible()
  const r1 = map.getByRole('button', { name: /^R1 giữa nút in và out: 2,5 mA, chiều từ in sang out$/ })
  await r1.press('Enter')
  await expect(r1).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.spice-probe-readout')).toContainText('i(r1)')
  await expect(page.locator('.spice-probe-readout')).toContainText('2,5 mA')
  await expect(page.getByRole('columnheader', { name: /i\(r2\)/ })).toBeVisible()
})

test('transient probe follows the time cursor and the plot cursor', async ({ page }) => {
  await page.goto('/tools/spice')
  await page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' }).selectOption('rc')
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toBeVisible({ timeout: 30000 })
  const readout = page.locator('.spice-probe-readout')
  await page.getByRole('group', { name: /Sơ đồ nút và nhánh/ }).getByRole('button', { name: /^C1 / }).press('Enter')
  const slider = page.getByRole('slider', { name: /Chọn điểm dữ liệu/ })
  await slider.fill('0')
  const atStart = await readout.textContent()
  await slider.fill('100')
  await expect(readout).not.toHaveText(atStart ?? '')
  await expect(page.locator('.spice-plot-cursor')).toHaveCount(1)
})
