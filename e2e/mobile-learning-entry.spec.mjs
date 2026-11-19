import { test, expect } from '@playwright/test'

const bench = page => page.locator('.freestyle-bench')
const heavyResource = /\/(?:models|cad)\/|\.(?:glb|gltf|step|stp|wasm)$/i

for (const [route, next, actions] of [
  ['/', '/build/freestyle', '.hero-actions'],
  ['/app', '/app/lab/freestyle', '.app-home-actions'],
]) test(`first screen at ${route} offers both routes before loading the lab or models`, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const resources = []
  page.on('request', request => resources.push(new URL(request.url()).pathname))
  await page.goto(route)
  const hero = page.locator(actions)
  await expect(hero.getByRole('link', { name: 'Thử mạch đầu tiên' })).toBeInViewport({ ratio: 1 })
  const openBench = hero.getByRole('link', { name: 'Mở bàn lắp mạch' })
  await expect(openBench).toBeInViewport({ ratio: 1 })
  await expect(bench(page)).toHaveCount(0)
  await expect(page.locator('.home-studio')).toHaveCount(0)
  await expect(page.getByRole('complementary', { name: 'Hướng dẫn cho người mới' })).toHaveCount(0)
  const startupResources = resources.slice()
  await openBench.click()
  await expect(page).toHaveURL(new RegExp(next + '$'))
  await expect(bench(page)).toBeVisible()
  expect(startupResources.filter(path => heavyResource.test(path) || path.includes('FreestyleBench'))).toEqual([])
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
