import { test, expect } from '@playwright/test'

// Khung 1 màn hình (docs/claude-support/2026-11-14-web-ui-ux-review): ở >=1280x720 tài liệu không cuộn dọc;
// ở 375px được cuộn dọc nhưng không cuộn ngang.
const routes = ['/', '/app', '/app/learn', '/app/learn/esp32-led?board=esp32-devkit', '/app/lab?board=esp32-devkit', '/app/boards', '/app/components', '/app/projects', '/app/tools/spice', '/app/tools/calculators', '/privacy']

for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
  test(`no document vertical scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('main h1')).toBeVisible()
      const size = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, inner: innerHeight, width: document.documentElement.scrollWidth, innerWidth }))
      expect(size.height, route).toBeLessThanOrEqual(size.inner)
      expect(size.width, route).toBeLessThanOrEqual(size.innerWidth)
    }
  })
}

test('mobile routes never scroll horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true)
  }
})

test('lesson panel tabs show one section at a time and keep the circuit stage visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/learn/esp32-led?board=esp32-devkit')
  const tabs = page.getByRole('tablist', { name: 'Các phần của bài' })
  const stage = page.getByRole('region', { name: 'Mạch bài học dùng CircuitDocV2' })
  await expect(stage).toBeVisible()
  await expect(page.getByRole('tabpanel', { name: /Chuẩn bị/ })).toBeVisible()
  await tabs.getByRole('tab', { name: /Code/ }).click()
  await expect(page.getByRole('tabpanel', { name: /Code/ })).toBeVisible()
  await expect(page.getByRole('tabpanel', { name: /Chuẩn bị/ })).toBeHidden()
  await expect(stage).toBeVisible()
  await tabs.getByRole('tab', { name: /Code/ }).press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: /Kiểm tra/ })).toHaveAttribute('aria-selected', 'true')
})

test('lesson wires show the trace level only while a HIGH/LOW action is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/learn/esp32-led?board=esp32-devkit')
  const stage = page.getByRole('region', { name: 'Mạch bài học dùng CircuitDocV2' })
  await expect(stage.locator('.diagram-level-pill')).toHaveCount(0)
  await page.getByRole('button', { name: /Đưa GPIO 23 về mức HIGH/ }).click()
  await expect(stage.locator('.diagram-level-pill.is-high').first()).toBeAttached()
  await expect(stage.locator('.breadboard-diagram-part-led.is-lit')).toHaveCount(1)
  await page.getByRole('button', { name: /Đưa GPIO 23 về mức LOW/ }).click()
  await expect(stage.locator('.diagram-level-pill.is-low').first()).toBeAttached()
  await expect(stage.locator('.breadboard-diagram-part-led.is-lit')).toHaveCount(0)
  await expect(stage.locator('.diagram-wire-flow')).toHaveCount(0)
})
