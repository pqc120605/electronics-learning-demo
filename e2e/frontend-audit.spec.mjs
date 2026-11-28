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

test('board library opens as a full gallery and uses the electrical overview first', async ({ page }) => {
  await page.goto('/boards')
  const list = page.locator('.board-list')
  await expect(list.locator('article')).toHaveCount(28)
  await expect(list.locator('img')).toHaveCount(28)
  const broken = await list.locator('img').evaluateAll(async (images) => {
    const results = await Promise.all(images.map(async (image) => {
      image.loading = 'eager'
      try { await image.decode(); return null } catch { return image.src }
    }))
    return results.filter(Boolean)
  })
  expect(broken).toEqual([])
  await expect(page.locator('.board-cad-viewer')).toHaveCount(0)
  await list.getByRole('link', { name: 'STM32 NUCLEO-F401RE', exact: true }).click()
  const detail = page.locator('.board-cad-viewer')
  await expect(detail.getByRole('heading', { name: /NUCLEO-F401RE/ }).first()).toBeVisible()
  await expect(detail.getByRole('button', { name: 'Tổng quan', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(detail.locator('canvas')).toHaveCount(0)
  await detail.getByRole('button', { name: 'Chân và linh kiện', exact: true }).click()
  await expect(detail.getByRole('heading', { name: 'Tra cứu pinout theo tên' })).toBeVisible()
  await detail.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  await expect(detail.locator('canvas')).toBeVisible()
})

test('a board without CAD opens its exact manufacturer pinout on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/boards?board=esp32-c3-devkitm-1&view=pins')
  const detail = page.locator('.board-cad-viewer')
  await expect(detail.getByRole('img', { name: /Pinout Espressif.*ESP32-C3-DevKitM-1/ }))
    .toHaveAttribute('src', '/board-reference/catalog/esp32-c3-devkitm-1-diagram.webp')
  await expect(detail.getByRole('link', { name: /Hướng dẫn của hãng/ })).toHaveAttribute('href', /espressif.*esp32-c3-devkitm-1/)
  await expect(detail.getByRole('button', { name: 'PCB 3D', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)

  await page.goto('/boards?board=arduino-uno-r3&view=pins&pin=pin-1')
  await expect(detail.locator('.board-selected-pin-details')).toContainText('Net / tên pad trong CAD')
  await expect(detail.getByRole('heading', { name: 'Tra cứu pinout theo tên' })).toBeVisible()
  await expect(detail.locator('canvas')).toHaveCount(0)
})

test('Pico 2 with headers keeps a selected pin between its model-derived 2D and 3D views', async ({ page }) => {
  await page.goto('/boards?board=raspberry-pi-pico-2-h&view=top')
  const top = page.getByRole('region', { name: 'Mặt board 2D' })
  await expect(top.locator('image')).toHaveAttribute('href', '/board-reference/topview/raspberry-pi-pico-2-h.png')
  const pins = top.getByLabel('Chân header')
  await expect(pins.locator('option')).toHaveCount(41)
  await pins.selectOption({ index: 1 })
  const selected = await pins.inputValue()
  await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  await expect(page.locator('.board-cad-viewer canvas')).toBeVisible()
  await expect(page.locator('.board-selected-pin-details')).toBeVisible()
  await page.getByRole('button', { name: 'Mặt board 2D', exact: true }).click()
  await expect(pins).toHaveValue(selected)
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
