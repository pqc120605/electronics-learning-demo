import { test, expect } from '@playwright/test'

async function dismissInvitation(page) {
  const later = page.getByRole('button', { name: 'Để sau', exact: true })
  if (await later.isVisible()) await later.click()
}
async function blink(page) {
  await page.goto('/build/freestyle')
  await page.getByRole('radio', { name: /^ESP32 DevKit V1/ }).check()
  await dismissInvitation(page)
  await page.locator('.freestyle-sample select').selectOption('blink')
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
}

test('slow incremental drag creates exactly one wire between the intended holes', async ({ page }) => {
  await blink(page)
  await expect(page.locator('.diagram-wire')).toHaveCount(4)
  const from = page.locator('[data-circuit-endpoint="bb1:3a"]')
  const to = page.locator('[data-circuit-endpoint="bb1:4a"]')
  await from.scrollIntoViewIfNeeded()
  const a = await from.boundingBox(), b = await to.boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 40 })
  await page.mouse.up()
  await expect(page.locator('.diagram-wire')).toHaveCount(5)
  await expect(page.locator('.diagram-wire').last()).toHaveAttribute('data-diagram-wire', 'w5')
})

test('reference board selection preserves the five-tab lesson and its execution target', async ({ page }) => {
  await page.goto('/app/learn/esp32-led?board=esp32-devkit')
  await page.getByRole('tab', { name: 'Board và pinout', exact: true }).click()
  await dismissInvitation(page)
  await page.locator('#board-model-select').selectOption('arduino-uno-r3')
  await expect(page).toHaveURL(/\/app\/learn\/esp32-led\?/)
  await expect(page.getByRole('tab', { name: 'Board và pinout', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#board-model-select')).toHaveValue('arduino-uno-r3')
  expect(new URL(page.url()).searchParams.get('board')).toBe('esp32-devkit')
  await expect(page.locator('.board-reference-warning').filter({ hasText: 'Bạn đang xem mô hình CAD' })).toContainText('tham khảo')
})

test('invalid kit station count stays visible with an error and does not overwrite the saved valid plan', async ({ page }) => {
  await page.goto('/app/classroom-kits')
  const field = page.getByRole('spinbutton', { name: /Số trạm thực hành/ })
  await field.fill('8')
  await field.fill('0')
  await field.blur()
  await expect(field).toHaveValue('0')
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert')).toContainText('1 đến 100')
  const download = page.waitForEvent('download', { timeout: 1500 }).catch(() => null)
  await page.getByRole('button', { name: 'Tải gói JSON', exact: true }).click()
  expect(await download).toBeNull()
  await field.fill('12')
  await field.blur()
  await expect(field).toHaveAttribute('aria-invalid', 'false')
  await expect(page.locator('.classroom-kit-count')).toContainText('12 trạm')
})

test('mobile working zoom keeps endpoints usable inside a pannable canvas without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await blink(page)
  const hidePanel = page.getByRole('button', { name: 'Ẩn bảng thao tác', exact: true })
  if (await hidePanel.isVisible()) await hidePanel.click()
  await expect(page.getByRole('button', { name: 'Mở bảng thao tác', exact: true })).toBeVisible()
  const svg = page.locator('.breadboard-diagram-svg')
  const hole = page.locator('[data-circuit-endpoint="bb1:3a"]')
  await hole.scrollIntoViewIfNeeded()
  expect((await hole.boundingBox()).width).toBeGreaterThanOrEqual(24)
  for (const selector of ['.diagram-board-pin-hit-target', '.diagram-part-pin']) {
    const pin = page.locator(selector).first()
    await pin.scrollIntoViewIfNeeded()
    expect((await pin.boundingBox()).width).toBeGreaterThanOrEqual(24)
    expect(await pin.evaluate(x => {
      const r = x.getBoundingClientRect()
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('[data-circuit-endpoint]')?.getAttribute('data-circuit-endpoint')
    })).toBe(await pin.getAttribute('data-circuit-endpoint'))
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.getByRole('button', { name: 'Vừa khung 2D', exact: true }).click()
  expect((await svg.boundingBox()).width).toBeLessThan(375)
  await page.getByRole('button', { name: 'Phóng to mạch 2D', exact: true }).click()
  expect((await svg.boundingBox()).width).toBeGreaterThan(1000)
})

test('displayed button lesson has six routed wires and no hidden routing failure', async ({ page }) => {
  await page.goto('/build?lesson=button-led&board=esp32-devkit')
  await expect(page.locator('.diagram-wire')).toHaveCount(6)
  await expect(page.locator('.breadboard-diagram-diagnostic')).toHaveCount(0)
  await expect(page.getByText('Dây có đường đi hợp lệ', { exact: true }).locator('..')).toContainText(/Đạt trong mô hình|Cần lưu ý/)
})

test('a preserved legacy motor draft is labelled honestly without silently rebuilding it', async ({ page }) => {
  await blink(page)
  await page.locator('.freestyle-sample select').selectOption('motor')
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  const legacy = await page.evaluate(() => {
    const key = 'machmo-freestyle-v1'
    const workspace = JSON.parse(localStorage.getItem(key))
    const motor = workspace.doc.parts.find(p => p.type === 'dc-motor')
    workspace.doc.parts = workspace.doc.parts.filter(p => !['battery', 'diode'].includes(p.type))
    workspace.doc.wires = workspace.doc.wires.slice(0, 5)
    workspace.doc.wires.push({ id: 'w6', from: { kind: 'pin', partId: 'board', pinId: 'vcc' }, to: { kind: 'pin', partId: motor.id, pinId: 'positive' }, role: 'power' })
    workspace.doc.expect.partCount = workspace.doc.parts.length
    workspace.doc.expect.wireCount = workspace.doc.wires.length
    localStorage.setItem(key, JSON.stringify(workspace))
    return workspace
  })
  await page.goto('/build/freestyle?resume=1')
  await expect(page.locator('.freestyle-stage .freestyle-note[role="note"]')).toContainText('Bản nháp motor này chưa có đủ')
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1')))
  expect(after.doc).toEqual(legacy.doc)
  expect(after.code).toEqual(legacy.code)
})
