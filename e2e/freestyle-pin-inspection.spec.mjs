import { expect, test } from '@playwright/test'

for (const width of [375, 1440]) {
  test(`an inspected CAD pin keeps the same endpoint in 2D, schematic and 3D at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
    await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
    const wires = page.locator('[data-diagram-wire]')
    const originalCount = await wires.count()
    const board = page.locator('[data-diagram-part="board"] .diagram-board-body-control')
    await board.press('Enter')
    await page.getByText('Tra chân và linh kiện theo CAD', { exact: true }).click()
    const cad = page.getByRole('region', { name: 'Mặt board 2D' })
    const pins = cad.getByRole('combobox', { name: 'Chân header' })
    const d13 = await pins.locator('option').filter({ hasText: /^D13/ }).first().getAttribute('value')
    await pins.selectOption(d13)
    await expect(cad.getByRole('heading', { level: 3 })).toContainText('D13')
    await expect(wires).toHaveCount(originalCount)
    await page.getByRole('button', { name: 'Đóng thông tin linh kiện' }).click()
    await page.getByRole('button', { name: 'Schematic', exact: true }).click()
    await expect(page.locator('[data-pin-key="board:ledOut"]')).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Lắp mạch 3D', exact: true }).click()
    await expect(page.locator('.freestyle-assembly-pin[data-pin-key="board:ledOut"]')).toHaveText('D13')
    await page.screenshot({ path: `.tmp/l2-pin-sync-${width}.png` })
    await page.getByRole('button', { name: 'Lắp mạch 2D', exact: true }).click()
    await expect(wires).toHaveCount(originalCount)
  })
}
