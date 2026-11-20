import { expect, test } from '@playwright/test'

test('public guests load the workbench without requesting local tools or Supabase', async ({ page, baseURL }) => {
  const guest = 'https://machmo-guest.test'
  const requested = []
  const scriptBodies = []
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  page.on('response', response => {
    if (response.ok() && /\/assets\/[^/]+\.js$/.test(new URL(response.url()).pathname)) scriptBodies.push(response.text())
  })
  await page.route(`${guest}/**`, async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` })
    await route.fulfill({ response })
  })

  await page.goto(guest)
  await page.locator('.hero-actions').getByRole('link', { name: 'Mở bàn lắp mạch' }).click()
  await expect(page.locator('#ban-lap-mach .freestyle-home')).toBeVisible()
  await page.getByRole('radio', { name: /Arduino Uno R3/ }).check()
  await expect(page.locator('[data-board-art="arduino-uno-r3"]')).toBeVisible()
  expect(requested.some(path => path.includes('/api/local-tools/health'))).toBe(false)
  expect((await Promise.all(scriptBodies)).some(source => source.includes('supabase-js/'))).toBe(false)
  expect(requested.filter(path => /mascot-concept.*\.(?:webp|png)/.test(path))).toEqual([])
})

test('mobile help does not cover the workbench and the launcher compacts on scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/lab?lesson=blink&guided=1&board=arduino-nano-classic')
  const invitation = page.getByRole('complementary', { name: 'Hướng dẫn cho người mới' })
  await expect(invitation).toBeVisible()
  expect(await invitation.evaluate(node => getComputedStyle(node).position)).not.toBe('fixed')
  await invitation.getByRole('button', { name: 'Để sau' }).click()
  await expect(invitation).toHaveCount(0)

  await page.goto('/')
  const launcher = page.getByRole('button', { name: 'Hỏi Mở', exact: true })
  await expect(launcher).toBeVisible()
  await page.getByRole('link', { name: 'Mở bàn lắp mạch', exact: true }).click()
  await expect.poll(async () => Math.round((await launcher.boundingBox()).width)).toBe(48)
  await launcher.click()
  await expect(page.getByRole('dialog', { name: 'Mở — bạn đồng hành học điện tử' })).toBeVisible()
})

test('an out-of-list deep link shows the selected board in the collapsed catalog', async ({ page }) => {
  await page.goto('/boards')
  const list = page.locator('.board-list')
  await expect(list.locator('article')).toHaveCount(8)
  await page.goto('/boards?board=stm32-nucleo')
  await expect(list.getByRole('heading', { name: /NUCLEO-F401RE/ })).toBeVisible()
  await expect(list.locator('article')).toHaveCount(8)
})

for (const width of [375, 1440]) test(`guest audit routes use Vietnamese copy at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  await page.goto('/app/community')
  const note = page.getByRole('note').filter({ hasText: 'Bản xem trước' })
  await expect(note).toContainText('chỉ lưu trên thiết bị này')
  await expect(note).not.toContainText(/localStorage|IndexedDB/)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Khu quản trị chưa mở' })).toBeVisible()
  await page.goto('/khong-ton-tai-xyz')
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible()
  await page.goto('/app/learn/basics')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mach-mo.vercel.app/learn/basics')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Nền tảng điện tử — Mạch Mở')
})
