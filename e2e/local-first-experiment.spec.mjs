import { test, expect } from '@playwright/test'

for (const [width, start] of [[375, '/'], [1440, '/app']]) {
  test(`a guest can finish the first experiment and resume the next one at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, freestyle: 1, lab: 1 })))
    await page.goto(start)
    await page.getByRole('link', { name: 'Thử mạch đầu tiên', exact: true }).click()
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'closed-loop')
    await expect(page.getByLabel('Board của thử nghiệm')).toHaveCount(0)

    const connect = page.getByRole('checkbox', { name: 'Nối đường về nguồn' })
    const observe = page.getByRole('button', { name: 'Quan sát mô hình', exact: true })
    for (const closed of [false, true]) {
      await connect.setChecked(closed)
      await page.getByRole('radio', { name: closed ? 'LED sáng' : 'LED tắt', exact: true }).check()
      await observe.click()
      await expect(page.getByTestId('beginner-result')).toContainText(closed ? 'LED sáng' : 'LED tắt')
    }
    await page.getByRole('radio', { name: 'Đường đi qua LED về cực âm bị hở nên mạch chưa khép kín.', exact: true }).check()
    await expect(page.getByRole('heading', { name: 'Đã đạt tiêu chí hoạt động' })).toBeVisible()
    await page.getByRole('button', { name: 'Làm tiếp: Đọc dải nối breadboard' }).click()
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'breadboard')
    await page.goto(start)
    await page.getByRole('link', { name: 'Tiếp tục thử nghiệm', exact: true }).click()
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'breadboard')
    await expect(page.locator('.beginner-header')).toContainText('1/5 hoạt động đạt tiêu chí')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
