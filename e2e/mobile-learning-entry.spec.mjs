import { test, expect } from '@playwright/test'

const bench = page => page.locator('.freestyle-bench')
const heavyResource = /\/(?:models|cad)\/|\.(?:glb|gltf|step|stp|wasm)$/i

for (const width of [375, 1440]) {
  test(`homepage opens its freestyle bench in place at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    const resources = []
    page.on('request', request => resources.push(new URL(request.url()).pathname))
    await page.goto('/')
    const hero = page.locator('.hero-actions')
    await expect(hero.getByRole('link', { name: 'Thử mạch đầu tiên' })).toBeInViewport({ ratio: 1 })
    const openBench = hero.getByRole('link', { name: 'Mở bàn lắp mạch' })
    await expect(openBench).toBeInViewport({ ratio: 1 })
    const workspace = page.locator('#ban-lap-mach')
    await expect(workspace).toBeVisible()
    if (width === 1440) {
      const positions = await page.getByRole('navigation', { name: 'Điều hướng chính' }).evaluate(nav =>
        Array.from(nav.children).map(item => {
          const { x, y } = item.getBoundingClientRect()
          return { x: Math.round(x), y: Math.round(y) }
        }))
      expect(new Set(positions.map(item => item.x)).size).toBeGreaterThanOrEqual(4)
      expect(Math.max(...positions.map(item => item.y)) - Math.min(...positions.map(item => item.y))).toBeLessThan(20)
    }
    expect(resources.filter(path => heavyResource.test(path))).toEqual([])
    if (width === 375) expect(resources.filter(path => /\/FreestyleBench-.*\.js$/.test(path))).toEqual([])
    await openBench.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/#ban-lap-mach$/)
    await expect(workspace).toBeFocused()
    await expect(workspace.locator('.freestyle-home')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.evaluate(() => localStorage.getItem('machmo-freestyle-v1'))).toBeNull()
  })
}

test('the learning workspace opens the full bench without loading its board studio upfront', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app')
  const hero = page.locator('.app-home-actions')
  await expect(hero.getByRole('link', { name: 'Thử mạch đầu tiên' })).toBeInViewport({ ratio: 1 })
  const openBench = hero.getByRole('link', { name: 'Mở bàn lắp mạch' })
  await expect(openBench).toBeInViewport({ ratio: 1 })
  await expect(bench(page)).toHaveCount(0)
  await expect(page.locator('.home-studio')).toHaveCount(0)
  await openBench.click()
  await expect(page).toHaveURL(/\/app\/lab\/freestyle$/)
  await expect(bench(page)).toBeVisible()
  await page.goBack()
  await expect(openBench).toBeInViewport({ ratio: 1 })
  await expect(bench(page)).toHaveCount(0)
})

test('opening the optional studio loads its viewer and closing keeps the page usable', async ({ page }) => {
  await page.goto('/app')
  await expect(page.locator('.home-studio')).toHaveCount(0)
  const preview = page.locator('.app-home-board-studio > summary')
  await preview.click()
  await expect(page.getByRole('heading', { name: 'Xem board cạnh pinout, ví dụ và thông số' })).toBeVisible()
  await preview.click()
  await expect(page.getByRole('heading', { name: 'Xem board cạnh pinout, ví dụ và thông số' })).toBeHidden()
})

test('resume points to the saved project before any workspace replacement', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ lab: 1 })))
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('textbox', { name: 'Tên project cần lưu' }).fill('Mạch LED để tiếp tục')
  await page.getByRole('button', { name: 'Lưu project', exact: true }).click()
  await page.goto('/app')
  const resume = page.getByRole('link', { name: 'Tiếp tục dự án Mạch LED để tiếp tục' })
  await expect(resume.locator('..')).toContainText('ESP32')
  await resume.click()
  await expect(page).toHaveURL(/\/app\/projects\?saved=/)
  const card = page.locator('.saved-project-card').filter({ hasText: 'Mạch LED để tiếp tục' })
  await expect(card).toBeFocused()
  await expect(card.getByRole('button', { name: 'Mở', exact: true })).toBeVisible()
})
