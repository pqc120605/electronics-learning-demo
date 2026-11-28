import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-uno-r4-ra4m1-electrical-firmware-a8-proposal.json', import.meta.url)))
const base = proposal.runtime.transport.route

async function openA8(page, board, inspect = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(32)
    const header = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(proposal.commonHeader)) {
      await header.selectOption(pin.pinId)
      await expect(page.locator('[data-board-pad="' + pin.pinId + '"]')).toHaveAttribute('data-active', 'true')
    }
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText('D1/TX')
    await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
    for (const group of board.auxiliaryLookup) {
      const lookup = page.getByRole('region', { name: new RegExp('^' + group.id + ' ·') })
      await expect(lookup.getByRole('listitem')).toHaveCount(group.padCount)
    }
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A8/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A8$/ })
  await expect(panel).toBeVisible()
  return panel
}

const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const status = panel => panel.getByRole('status')
const dc = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const reading = panel => panel.getByLabel('Kết quả ngspice A8')
async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await dc(panel).click()
  return reading(panel)
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(board.sku + ' runs A8 on ' + (mobile ? '375 px' : 'desktop'), async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => { if (request.url().includes(base)) requests.push(request) })
      const panel = await openA8(page, board, !mobile)
      expect(requests).toHaveLength(0)
      await expect(dc(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial SCI2', { exact: true }).click()
      const uart = panel.getByLabel(/^Serial .* A8$/)
      const gpio = panel.getByLabel(/^Mức chân /)
      const input = 'D2 / ' + board.button.gpio
      const led = 'D4 / ' + board.led.gpio
      await expect(status(panel)).toContainText('Đang chạy firmware', { timeout: 32_000 })
      await expect(uart).toContainText(board.readyLine)
      await expect(gpio).toContainText(input + ' HIGH · ' + led + ' LOW · LED tắt')
      await expect(await readDc(panel, 'released')).toContainText(input + ' 5.0000 V · LED 0.000 V · I LED 0.000 mA')
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText(input + ' LOW · ' + led + ' HIGH · LED sáng')
        await page.keyboard.up('Space')
        await expect(gpio).toContainText(input + ' HIGH · ' + led + ' LOW · LED tắt')
      }
      await expect(uart).toContainText(/(A8_BUTTON=1[\s\S]*?A8_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(input + ' 0.0005 V · LED 2.085 V · I LED 2.915 mA')
      await panel.getByText('Dạng sóng ' + input + ' / ' + led, { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText(input + ' LOW · ' + led + ' HIGH')
      const stopped = page.waitForResponse(response => response.url().endsWith(base + 'stop') && response.ok())
      await stop(panel).click()
      await stopped
      await expect(status(panel)).toContainText('Đã dừng firmware.')
      await expect(reading(panel)).toHaveCount(0)
      const origin = new URL(page.url()).origin
      expect(requests.every(request => request.method() === 'POST' && new URL(request.url()).origin === origin)).toBe(true)
      expect(new Set(requests.map(request => new URL(request.url()).pathname))).toEqual(new Set(['start', 'step', 'stop'].map(operation => base + operation)))
    })
  }
}

test('A8 times out, retries after lost connection and retires the local process when navigating away', async ({ page }) => {
  test.setTimeout(110_000)
  await page.clock.install()
  const board = proposal.boards[0]
  const panel = await openA8(page, board)
  const boot = '**' + base + 'start'
  const step = '**' + base + 'step'
  await page.route(boot, route => route.fulfill({ status: 503, json: { message: 'Renode và ELF A8 chưa được chuẩn bị trên máy này.' } }))
  await start(panel).click()
  await expect(status(panel)).toContainText('Renode và ELF A8 chưa được chuẩn bị')
  await page.unroute(boot)
  await page.route(boot, () => {})
  const blocked = page.waitForRequest(boot)
  await start(panel).click()
  await blocked
  await page.clock.fastForward(30_001)
  await expect(status(panel)).toContainText('chưa khởi động sau 30 giây')
  await expect(dc(panel)).toBeDisabled()
  await page.unroute(boot)
  await page.route(step, route => route.abort('connectionreset'))
  await start(panel).click()
  await expect(start(panel)).toBeVisible({ timeout: 32_000 })
  await expect(dc(panel)).toBeDisabled()
  await page.unroute(step)
  const started = page.waitForResponse(response => response.url().endsWith(base + 'start') && response.ok())
  await start(panel).click()
  const { id } = await (await started).json()
  await expect(status(panel)).toContainText('Đang chạy firmware', { timeout: 32_000 })
  await page.goto('/boards?board=' + board.id)
  const origin = new URL(page.url()).origin
  await expect.poll(async () => {
    const response = await page.request.post(origin + base + 'step', { headers: { origin }, data: { id, pressed: false } })
    return response.status()
  }, { timeout: 10_000 }).toBe(404)
  const next = await openA8(page, proposal.boards[1])
  await start(next).click()
  await expect(status(next)).toContainText('Đang chạy firmware', { timeout: 32_000 })
  await stop(next).click()
})

test('A8 saves by part and pin IDs and clears serial and readings when the circuit changes', async ({ page }) => {
  const key = 'machmo-freestyle-v1'
  const prior = {
    version: 1, boardId: 'stm32-nucleo-f401re', code: 'void setup() {}', language: 'cpp',
    pinMap: { input: 2, ledOut: 13 },
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, prior }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior))
  }, { key, prior })
  const board = proposal.boards[1]
  const panel = await openA8(page, board)
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.boardId, key)).toBe(board.id)
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).doc, key)
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await expect(panel).toBeVisible()
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).doc, key)).toEqual(saved)
  const archived = await page.evaluate(({ key, code }) => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))).find(draft => draft.code === code), { key, code: prior.code })
  expect(archived?.doc).toEqual(prior.doc)
  await start(panel).click()
  await expect(dc(panel)).toBeEnabled({ timeout: 32_000 })
  await expect(await readDc(panel, 'released')).toContainText('D2 / ' + board.button.gpio + ' 5.0000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a8-button$/ })
  await button.press('Enter')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A8')).toContainText('Mạch A8 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(reading(panel)).toHaveCount(0)
  await panel.getByText('Serial SCI2', { exact: true }).click()
  await expect(panel.getByLabel(/^Serial .* A8$/)).toContainText('Chưa có dữ liệu.')
})
