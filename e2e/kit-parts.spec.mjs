import { expect, test } from '@playwright/test'

for (const width of [375, 1440]) {
  test(`kit illustrations, source labels and interactive examples at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
    const parts = page.getByRole('tab', { name: /Thêm linh kiện/i })
    const inspect = async (title, id) => {
      await parts.click()
      await page.getByRole('button', { name: `Thêm ${title}`, exact: true }).click()
      await expect(page.locator(`[data-diagram-part="${id}"]`)).toBeVisible()
      const reopen = page.getByRole('button', { name: `Xem linh kiện ${title}`, exact: true })
      if (await reopen.isVisible()) await reopen.click()
      await expect(page.getByRole('link', { name: /Tài liệu chân/ })).toBeVisible()
    }
    await inspect('Cảm biến DHT11', 'dht111')
    await page.getByRole('slider', { name: /Nhiệt độ/ }).press('End')
    await expect(page.getByText('Nhiệt độ · 50 °C')).toBeVisible()
    await inspect('Bàn phím ma trận 4 × 4', 'keypad4x41')
    await page.getByLabel('Phím đóng').selectOption('5')
    await expect(page.getByText(/Phím 5: đóng R2–C2/)).toBeVisible()
    await page.screenshot({ path: `.tmp/l6c-kit-${width}.png` })
    await page.getByRole('button', { name: 'Schematic', exact: true }).click()
    await expect(page.getByRole('button', { name: /Chọn Adafruit PID 3844/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Chọn chân keypad4x41:r2/ })).toBeVisible()
  })
}
