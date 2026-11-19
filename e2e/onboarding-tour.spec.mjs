// 2026-11-15: tour lần đầu, menu Trợ giúp, điều hướng năm khu vực, luồng thư viện → bàn lắp mạch.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
const tourProof = 'docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions'
mkdirSync(tourProof, { recursive: true })

test('an unsupported board handoff stays empty and explains the unsupported board without inventing a fallback', async ({ page }) => {
  await page.goto('/build/freestyle?board=not-a-supported-board')
  await expect(page.getByRole('status').filter({ hasText: /chưa có trên bàn tự do; không đổi mạch hiện tại/ })).toContainText('not-a-supported-board')
  await expect(page).toHaveURL(/\/build\/freestyle$/)
  await expect(page.locator('.freestyle-bench')).toBeVisible()
  await expect(page.locator('[data-board-art]')).toHaveCount(0)
  await expect(page.getByRole('radio',{checked:true})).toHaveCount(0)
})

for (const width of [375, 1440]) test(`app tours highlight real regions and keep mobile navigation reachable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  await page.goto('/app')
  const invite = page.getByRole('complementary', { name: 'Hướng dẫn cho người mới' })
  await expect(invite).toHaveCount(0)
  if (width === 375) {
    await expect(page.locator('.workspace-mobile-nav')).toBeVisible()
    const back = await page.getByRole('link', { name: 'Về website', exact: true }).boundingBox()
    expect(back.x).toBeGreaterThanOrEqual(0)
    expect(back.x + back.width).toBeLessThanOrEqual(width)
  }
  for (const route of ['/app', '/app/lab?board=esp32-devkit', '/app/boards', '/app/tools/sketch']) {
    await page.goto(route)
    if (await invite.count()) await invite.getByRole('button', { name: 'Để sau' }).click()
    await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
    await page.getByRole('button', { name: /Hướng dẫn trang này/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.locator('.mm-tour-spot')).toBeVisible()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id)).toEqual([])
    await page.screenshot({ path: `${tourProof}/tour-${route.slice(1).replace(/[^A-Za-z0-9_-]/g, '-')}-${width}.png` })
    while (await dialog.getByRole('button', { name: 'Tiếp', exact: true }).count()) {
      await dialog.getByRole('button', { name: 'Tiếp', exact: true }).click()
      await expect(page.locator('.mm-tour-spot')).toBeVisible()
    }
    await page.keyboard.press('Escape')
  }
})

const seen = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('mm-tour-seen') ?? '{}'))

test('home tour opens on request; keyboard stays inside, Esc skips and the choice is remembered', async ({ page }) => {
  await page.goto('/')
  const invite = page.getByRole('complementary', { name: 'Hướng dẫn cho người mới' })
  await expect(invite).toHaveCount(0)
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await page.getByRole('button', { name: /Hướng dẫn trang này/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog).toContainText('Bước 1/')
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Năm khu vực chính')
  await expect(page.locator('.mm-tour-spot')).toBeVisible()
  expect(await page.locator('#root').getAttribute('inert')).toBe('')

  await page.keyboard.press('ArrowRight')
  await expect(dialog).toContainText('Bước 2/')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText('Bước 1/')
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await page.locator('#root').getAttribute('inert')).toBeNull()
  expect(Object.keys(await seen(page))).toContain('home')
  await page.reload()
  await expect(page.locator('main h1')).toBeVisible()
  await expect(invite).toHaveCount(0)
})

test('Help menu reopens this page tour and opens another page tour', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, lab: 1, lesson: 1, freestyle: 1 })))
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Hướng dẫn cho người mới' })).toHaveCount(0)
  const help = page.getByRole('button', { name: 'Trợ giúp' })
  await help.click()
  await expect(help).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: /Hướng dẫn trang này/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Bỏ qua' }).click()
  await expect(dialog).toHaveCount(0)

  await help.click()
  await page.getByRole('button', { name: /Phòng lắp mạch theo bài/ }).click()
  await expect(page).toHaveURL(/\/build$/)
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Phòng lắp mạch theo bài')
  for (let step = 0; step < 10 && await dialog.count(); step++) {
    await dialog.getByRole('button', { name: /^(Tiếp|Xong)$/ }).click()
  }
  await expect(dialog).toHaveCount(0)
})

for (const width of [375, 1440]) test(`lesson and freestyle tours have no serious axe violations while open at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  for (const path of ['/learn/esp32-led?board=esp32-devkit', '/build/freestyle']) {
    await page.goto(path)
    await page.getByRole('button', { name: 'Xem hướng dẫn' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(450)
    const box = await dialog.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('reduced motion turns tour and page animations off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/build/freestyle')
  await page.getByRole('button', { name: 'Xem hướng dẫn' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const durations = await page.evaluate(() => ['.mm-tour-card', '.freestyle-run-button', '#main-content > *'].map(selector => {
    const style = getComputedStyle(document.querySelector(selector))
    return Math.max(...style.animationDuration.split(',').map(value => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000)))
  }))
  for (const ms of durations) expect(ms).toBeLessThanOrEqual(0.01)
})

test('top navigation shows five areas and the library opens items on the freestyle bench', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, lab: 1, lesson: 1, freestyle: 1 })))
  await page.goto('/components?component=led')
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' })
  await expect(nav.locator('summary')).toHaveText(['Học', 'Lắp mạch', 'Thư viện', 'Dự án'])
  await expect(nav.getByRole('link', { name: 'Cộng đồng', exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Lắp thử trên bàn tự do/ }).click()
  await expect(page).toHaveURL(/\/build\/freestyle$/)
  await expect(page.getByRole('tab', { name: /Thêm linh kiện/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel(/^Linh kiện đang chọn led\d+$/)).toBeVisible()

  await page.goto('/boards')
  await page.locator('.board-freestyle-link').first().click()
  await expect(page).toHaveURL(/\/build\/freestyle$/)
  await expect(page.getByRole('tab', { name: /Chọn board/ })).toHaveAttribute('aria-selected', 'true')
})
