import { test, expect } from '@playwright/test'

async function open(page, path) {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, lesson: 1, lab: 1 })))
  await page.goto(path)
}

for (const prefix of ['', '/app']) {
  test(`choose any lesson and keep the chosen board (${prefix || 'legacy'})`, async ({ page }) => {
    const topics = prefix ? '/app/learn' : '/topics'
    await open(page, topics)
    await page.getByLabel('Chọn bài học', { exact: true }).selectOption('analog-potentiometer')
    await expect(page).toHaveURL(new RegExp(`${prefix}/learn/analog-potentiometer$`))
    await expect(page.getByLabel('Board của bạn', { exact: true })).toHaveValue('')
    await page.getByLabel('Board của bạn', { exact: true }).selectOption('arduino-uno-r3')
    await page.getByLabel('Chọn bài học', { exact: true }).selectOption('blink')
    await expect(page).toHaveURL(/learn\/blink\?board=arduino-uno-r3$/)
    await expect(page.getByLabel('Board của bạn', { exact: true })).toHaveValue('arduino-uno-r3')
    await page.getByRole('link', { name: 'Chọn lại board', exact: true }).click()
    await expect(page.getByLabel('Board của bạn', { exact: true })).toHaveValue('')
    await page.getByRole('link', { name: 'Danh sách bài học', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${topics}$`))
  })
}

test('changing lessons keeps unknown board identity and existing draft', async ({ page }) => {
  await open(page, '/app/learn/button-led?board=unknown-clone')
  await page.evaluate(() => localStorage.setItem('machmo-builder-session', '{"code":"my draft","simBoard":"arduino-uno-r3"}'))
  await page.getByLabel('Chọn bài học', { exact: true }).selectOption('blink')
  await expect(page).toHaveURL(/learn\/blink\?board=unknown-clone$/)
  await expect(page.getByRole('alert')).toContainText('không tự đổi sang ESP32')
  await expect(page.locator('[data-board-art]')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe('{"code":"my draft","simBoard":"arduino-uno-r3"}')
})

test('changing lessons keeps unsupported combinations locked', async ({ page }) => {
  await open(page, '/learn/blink?board=raspberry-pi-pico')
  await page.getByLabel('Chọn bài học', { exact: true }).selectOption('analog-potentiometer')
  await expect(page).toHaveURL(/board=raspberry-pi-pico$/)
  await expect(page.getByRole('link', { name: /Bắt đầu thực hành/ })).toHaveCount(0)
  await expect(page.locator('.lesson-preflight')).toContainText('chưa xác minh dải ADC')
})

test('ESP32 lesson offers a direct board change without losing the lesson route', async ({ page }) => {
  await open(page, '/learn/esp32-led?board=esp32-devkit')
  await page.getByRole('link', { name: 'Chọn lại board', exact: true }).click()
  await page.getByLabel('Board của bạn', { exact: true }).selectOption('arduino-nano-classic')
  await expect(page).toHaveURL(/learn\/blink\?board=arduino-nano-classic$/)
  await expect(page.getByLabel('Board của bạn', { exact: true })).toHaveValue('arduino-nano-classic')
})

test('lesson selection stays accessible on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await open(page, '/app/learn')
  const selector = page.getByLabel('Chọn bài học', { exact: true })
  await selector.focus()
  await expect(selector).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Chủ đề kiến thức', exact: true })).not.toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
