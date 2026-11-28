import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const staged = existsSync('.tmp/a12-fw-r2/runtime/manifest.json')
const boards = [
  { id: 'esp32-s2-devkitc-1', target: 'esp32s2', released: '3.3000 V', held: '1.294 mA' },
  { id: 'arduino-nano-every', target: 'atmega4809', released: '5.0000 V', held: '2.915 mA' },
]

async function openFixture(page, board) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A12/ }).click()
  return page.getByRole('region', { name: /^Mạch nút nhấn và LED .* A12$/ })
}

for (const board of boards) {
  for (const mobile of [false, true]) {
    test(board.id + ' runs coupled A12 on ' + (mobile ? '375 px' : 'desktop'), async ({ page }) => {
      test.skip(!staged, 'Cần runner A12 đã build trong Podman local')
      test.setTimeout(90_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const panel = await openFixture(page, board)
      const start = panel.getByRole('button', { name: 'Chạy firmware A12' })
      const stop = panel.getByRole('button', { name: 'Dừng firmware A12' })
      const serial = panel.getByLabel('UART firmware A12')
      const gpio = panel.getByLabel('GPIO firmware A12')
      const dc = panel.getByLabel('Kết quả ngspice A12')
      await start.click()
      await expect(serial).toContainText('A12_READY=' + board.target, { timeout: 30_000 })
      await expect(panel.getByLabel('Nguồn trạng thái')).toContainText('GPIO từ firmware')
      await expect(gpio).toContainText('LED tắt')
      await expect(dc).toContainText(board.released)
      const button = panel.getByRole('button', { name: 'Giữ nút nhấn A12' })
      await button.scrollIntoViewIfNeeded()
      if (!mobile) {
        const settled = page.waitForResponse(response => response.url().endsWith('/api/local-tools/a12/step')
          && response.request().postDataJSON().pressed === false)
        await button.evaluate(element => {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
          element.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
        })
        const shortTap = await settled
        expect(shortTap.ok()).toBe(true)
        const sample = await shortTap.json()
        expect(sample.edges).toBe(0)
        expect(sample.serial).not.toContain('A12_LED=')
        await expect(dc).toContainText(board.released)
      }
      if (mobile) {
        await button.focus()
        await page.keyboard.down('Space')
      } else {
        const rect = await button.boundingBox()
        await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
        await page.mouse.down()
      }
      await expect(serial).toContainText('A12_LED=1')
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(gpio).toContainText('LED sáng')
      await expect(dc).toContainText(board.held)
      if (mobile) await page.keyboard.up('Space')
      else await page.mouse.up()
      await expect(serial).toContainText('A12_LED=0')
      await expect(button).toHaveAttribute('aria-pressed', 'false')
      await expect(dc).toContainText(board.released)

      await stop.click()
      await expect(serial).toHaveCount(0)
      await expect(dc).toHaveCount(0)
      await start.click()
      await expect(serial).toContainText('A12_READY=' + board.target, { timeout: 30_000 })
      await expect(serial).not.toContainText('A12_LED=')
      await page.getByRole('button', { name: 'Schematic', exact: true }).click()
      const component = page.getByRole('button', { name: /^Chọn .* a12-button$/ })
      await component.press('Enter')
      await component.press('Delete')
      await expect(panel.getByLabel('Kiểm tra mạch A12')).toContainText('cần một nút nhấn')
      await expect(serial).toHaveCount(0)
      await expect(dc).toHaveCount(0)
      await expect(start).toBeDisabled()
    })
  }
}

test('A12 isolates two tabs on the same board and releases each session', async ({ request, baseURL }) => {
  test.skip(!staged, 'Cần runner A12 đã build trong Podman local')
  test.setTimeout(75_000)
  const post = (operation, data) => request.post('/api/local-tools/a12/' + operation, {
    data, headers: { Origin: new URL(baseURL).origin },
  })
  const tabs = [randomUUID(), randomUUID()]
  const sessions = []
  const boardId = 'arduino-nano-every'
  try {
    for (const tab of tabs) {
      const boot = await post('start', { boardId, tab })
      expect(boot.status()).toBe(200)
      sessions.push((await boot.json()).id)
    }
    expect(sessions[0]).not.toBe(sessions[1])
    const duplicate = await post('start', { tab: tabs[0], boardId: 'esp32-s2-devkitc-1' })
    expect(duplicate.status()).toBe(409)
    const [pressed, released] = await Promise.all(sessions.map(async (id, i) => {
      const reply = await post('step', { id, pressed: i === 0 })
      expect(reply.status()).toBe(200)
      return reply.json()
    }))
    expect(pressed.sample.outputHigh).toBe(true)
    expect(released.sample.outputHigh).toBe(false)
    expect(pressed.serial).toContain('A12_LED=1')
    expect(released.serial).not.toContain('A12_LED=')
  } finally {
    await Promise.all(sessions.map(id => post('stop', { id })))
  }
  const stale = await post('step', { id: sessions[0], pressed: false })
  expect(stale.status()).toBe(404)
})

test('A12 restores manual DC when the local runner is unavailable', async ({ page }) => {
  await page.route('**/api/local-tools/a12/start', route => route.fulfill({
    status: 503, contentType: 'application/json', json: { message: 'SHA-256 tệp firmware hoặc runner A12 không khớp.' },
  }))
  const panel = await openFixture(page, boards[0])
  await panel.getByRole('button', { name: 'Chạy firmware A12' }).click()
  await expect(panel.getByRole('alert')).toContainText('SHA-256')
  await expect(panel.getByLabel('Nguồn trạng thái')).toContainText('Đặt bằng tay')
  await panel.getByLabel('Trạng thái đo DC').selectOption('pressed')
  await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
  await expect(panel.getByLabel('Kết quả ngspice A12')).toContainText('1.294 mA')
})
