import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
const proof = 'docs/claude-support/2026-11-14-web-ui-ux-review/img/12/interactions'
mkdirSync(proof, { recursive: true })

const noInvites = { home: 1, lab: 1, lesson: 1, freestyle: 1, 'app-home': 1, library: 1, tools: 1 }
test.beforeEach(async ({ page }) => {
  await page.addInitScript(seen => localStorage.setItem('mm-tour-seen', JSON.stringify(seen)), noInvites)
})

test('theme defaults to light, persists dark and follows an explicit system preference without altering a draft', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.evaluate(() => localStorage.setItem('ui-theme-test-draft', 'untouched'))
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await page.getByRole('radio', { name: 'Tối', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload({ waitUntil: 'domcontentloaded' })
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(20, 26, 38)')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => localStorage.getItem('ui-theme-test-draft'))).toBe('untouched')
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await page.getByRole('radio', { name: 'Theo hệ thống', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system')
  await page.emulateMedia({ colorScheme: 'light' })
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme)).toBe('light')
  await page.emulateMedia({ colorScheme: 'dark' })
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme)).toBe('dark')
})

for (const width of [375, 1440]) test(`dark UI has no serious accessibility issues at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  await page.addInitScript(() => localStorage.setItem('mm-theme', 'dark'))
  for (const route of ['/', '/boards', '/community']) {
    await page.goto(route)
    await expect(page.locator('main h1').first()).toBeVisible()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
  }
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await expect(page.getByRole('radiogroup', { name: 'Giao diện' })).toBeVisible()
  const menu = await page.locator('.help-menu-panel').boundingBox()
  expect(menu.x).toBeGreaterThanOrEqual(0)
  expect(menu.x + menu.width).toBeLessThanOrEqual(width)
  expect(menu.y + menu.height).toBeLessThanOrEqual(width === 375 ? 812 : 900)
  await page.screenshot({ path: `${proof}/theme-menu-${width}.png` })
})

for (const route of ['/learn/esp32-led?board=esp32-devkit', '/learn/button-led?board=esp32-devkit', '/tools/firmware-hex', '/app/robot-simulation']) test(`dark detail controls remain readable on ${route}`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-theme', 'dark'))
  await page.goto(route)
  await expect(page.locator('main h1').first()).toBeVisible()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
  await page.screenshot({ path: `${proof}/dark-${route.slice(1).replace(/[^A-Za-z0-9_-]/g, '-')}.png` })
})

test('kit print sheet stays on white paper when screen theme is dark', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-theme', 'dark'))
  await page.goto('/app/classroom-kits')
  await expect(page.locator('.classroom-kit-page')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  expect(await page.locator('.classroom-kit-page').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)')
  expect(await page.locator('.classroom-kit-card').first().evaluate(el => getComputedStyle(el).color)).toBe('rgb(16, 24, 32)')
  await page.screenshot({ path: `${proof}/kit-print-from-dark.png` })
})
