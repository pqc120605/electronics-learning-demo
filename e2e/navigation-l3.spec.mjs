import { expect, test } from '@playwright/test'

test('desktop menu groups tools where they are used and keeps project entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?surface=web')
  const primary = page.getByRole('navigation', { name: 'Điều hướng chính' })
  await expect(primary.locator('summary')).toHaveText(['Học', 'Lắp mạch', 'Thư viện', 'Dự án'])
  await expect(primary.getByRole('link', { name: 'Cộng đồng', exact: true })).toBeVisible()
  await primary.getByText('Lắp mạch', { exact: true }).click()
  await expect(primary.getByRole('link', { name: /Mô phỏng SPICE/ })).toHaveAttribute('href', '/tools/spice')
  await primary.getByText('Thư viện', { exact: true }).click()
  await expect(primary.getByRole('link', { name: /Bộ tính điện tử/ })).toHaveAttribute('href', '/tools/electronics-calculators')
})

test('workspace shows five quick destinations and keeps project tools accessible at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app')
  const primary = page.getByRole('navigation', { name: 'Điều hướng nhanh' })
  await expect(primary.getByRole('link')).toHaveCount(5)
  for (const [index, name] of ['Học', 'Lắp mạch', 'Thư viện', 'Dự án', 'Cộng đồng'].entries()) {
    await expect(primary.getByRole('link').nth(index)).toHaveAccessibleName(name)
  }
  await expect(primary.getByRole('link', { name: 'Dự án' })).toHaveAttribute('href', '/app/projects')
  const landing = page.getByRole('navigation', { name: 'Lối vào không gian học' })
  await expect(landing.getByRole('link')).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
