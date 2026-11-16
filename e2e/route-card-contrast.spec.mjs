import { test, expect } from '@playwright/test'

// A manual screenshot review found these flat cards unreadable even though axe returned zero.
// Verify computed foreground/background directly, including the former alpha background.
for (const theme of ['light', 'dark']) for (const route of ['/privacy', '/khong-co-trang-nay']) {
  test(`${theme} ${route} card text has direct WCAG contrast`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('mm-theme', value), theme)
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto(route)
      await expect(page.locator('.route-placeholder h1')).toBeVisible()
      const ratios = await page.locator('.route-placeholder').evaluate(card => {
        const rgb = s => s.match(/[\d.]+/g).map(Number)
        const luminance = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0)
        const root = rgb(getComputedStyle(document.documentElement).backgroundColor)
        const raw = rgb(getComputedStyle(card).backgroundColor)
        const alpha = raw[3] ?? 1
        const bg = raw.slice(0, 3).map((v, i) => v * alpha + root[i] * (1 - alpha))
        return [...card.querySelectorAll('h1, p, a')].map(el => {
          const fg = luminance(rgb(getComputedStyle(el).color)), back = luminance(bg)
          return (Math.max(fg, back) + .05) / (Math.min(fg, back) + .05)
        })
      })
      expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5)
    }
  })
}
