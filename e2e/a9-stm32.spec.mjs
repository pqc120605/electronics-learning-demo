import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-stm32-f1-l4-electrical-firmware-a9-proposal.json', import.meta.url)))
const base = proposal.runtime.transport.route

async function openA9(page, board, inspect = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(board.boardEvidence.mainPadCount)
    const header = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(board.pins)) {
      await header.selectOption(pin.pinId)
      await expect(page.locator('[data-board-pad="' + pin.pinId + '"]')).toHaveAttribute('data-active', 'true')
    }
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText(board.pins.serialTx.gpio)
    await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
    for (const group of board.boardEvidence.auxiliaryLookup) {
      const lookup = page.getByRole('region', { name: new RegExp('^' + group.id + ' ·') })
      await expect(lookup.getByRole('listitem')).toHaveCount(group.padCount ?? group.signals.length)
    }
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A9/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A9$/ })
  await expect(panel).toBeVisible()
  return panel
}

const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const status = panel => panel.getByRole('status')
const dc = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const reading = panel => panel.getByLabel('Kết quả ngspice A9')
async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await dc(panel).click()
  return reading(panel)
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(board.name + ' runs A9 on ' + (mobile ? '375 px' : 'desktop'), async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => { if (request.url().includes(base)) requests.push(request) })
      const panel = await openA9(page, board, !mobile)
      expect(requests).toHaveLength(0)
      await expect(dc(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial ' + board.firmware.uart.device.toUpperCase(), { exact: true }).click()
      const uart = panel.getByLabel(/^Serial .* A9$/)
      const gpio = panel.getByLabel(/^Mức chân /)
      const input = board.pins.input.gpio
      const led = board.pins.output.gpio
      await expect(status(panel)).toContainText('Đang chạy firmware', { timeout: 32_000 })
      await expect(uart).toContainText(board.firmware.readyLine)
      await expect(gpio).toContainText(input + ' HIGH · ' + led + ' LOW · LED tắt')
      await expect(await readDc(panel, 'released')).toContainText(input + ' 3.3000 V · LED 0.000 V · I LED 0.000 mA')
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText(input + ' LOW · ' + led + ' HIGH · LED sáng')
        await page.keyboard.up('Space')
        await expect(gpio).toContainText(input + ' HIGH · ' + led + ' LOW · LED tắt')
      }
      await expect(uart).toContainText(/(A9_BUTTON=1[\s\S]*?A9_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(input + ' 0.0003 V · LED 2.006 V · I LED 1.294 mA')
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

test('A9 times out, retries after lost connection and retires the local process when navigating away', async ({ page }) => {
  test.setTimeout(110_000)
  await page.clock.install()
  const board = proposal.boards[0]
  const panel = await openA9(page, board)
  const boot = '**' + base + 'start'
  const step = '**' + base + 'step'
  await page.route(boot, route => route.fulfill({ status: 503, json: { message: 'Renode và ELF A9 chưa được chuẩn bị trên máy này.' } }))
  await start(panel).click()
  await expect(status(panel)).toContainText('Renode và ELF A9 chưa được chuẩn bị')
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
  const next = await openA9(page, proposal.boards[1])
  await start(next).click()
  await expect(status(next)).toContainText('Đang chạy firmware', { timeout: 32_000 })
  await stop(next).click()
})

test('A9 saves by part and pin IDs and clears serial and readings when the circuit changes', async ({ page }) => {
  const key = 'machmo-freestyle-v1'
  const prior = {
    version: 1, boardId: 'stm32-blue-pill-f103', code: 'void setup() {}', language: 'cpp',
    pinMap: { input: 2, ledOut: 13 },
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, prior }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior))
  }, { key, prior })
  const board = proposal.boards[1]
  const panel = await openA9(page, board)
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
  await expect(await readDc(panel, 'released')).toContainText('PA10 3.3000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a9-button$/ })
  await button.press('Enter')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A9')).toContainText('Mạch A9 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(reading(panel)).toHaveCount(0)
  await panel.getByText('Serial ' + board.firmware.uart.device.toUpperCase(), { exact: true }).click()
  await expect(panel.getByLabel(/^Serial .* A9$/)).toContainText('Chưa có dữ liệu.')
})
