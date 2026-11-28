import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-stm32f4-electrical-firmware-a7-proposal.json', import.meta.url)))
const base = '/api/local-tools/a7-stm32/'

async function openA7(page, board, inspect = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(108)
    const header = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(proposal.pins)) {
      await header.selectOption(pin.pinId)
      await expect(page.locator('[data-board-pad="' + pin.pinId + '"]')).toHaveAttribute('data-active', 'true')
    }
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText('PA2')
    await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
    await expect(page.getByRole('region', { name: /SWD/ }).last()).toContainText(/CN4[\s\S]*SWCLK[\s\S]*SWDIO/)
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A7/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A7$/ })
  await expect(panel).toBeVisible()
  return panel
}

const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const status = panel => panel.getByRole('status')
const dc = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const reading = panel => panel.getByLabel('Kết quả ngspice A7')
async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await dc(panel).click()
  return reading(panel)
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(board.orderCode + ' runs A7 on ' + (mobile ? '375 px' : 'desktop'), async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => { if (request.url().includes(base)) requests.push(request) })
      const panel = await openA7(page, board, !mobile)
      expect(requests).toHaveLength(0)
      await expect(dc(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial USART2', { exact: true }).click()
      const uart = panel.getByLabel(/^Serial .* A7$/)
      const gpio = panel.getByLabel(/^Mức chân /)
      await expect(status(panel)).toContainText('Đang chạy firmware', { timeout: 22_000 })
      await expect(uart).toContainText(board.readyLine)
      await expect(gpio).toContainText('PA10 HIGH · PB5 LOW · LED tắt')
      await expect(await readDc(panel, 'released')).toContainText('PA10 3.3000 V · LED 0.000 V · I LED 0.000 mA')
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText('PA10 LOW · PB5 HIGH · LED sáng')
        await page.keyboard.up('Space')
        await expect(gpio).toContainText('PA10 HIGH · PB5 LOW · LED tắt')
      }
      await expect(uart).toContainText(/(A7_BUTTON=1[\s\S]*?A7_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText('PA10 0.0003 V · LED 2.006 V · I LED 1.294 mA')
      await panel.getByText('Dạng sóng PA10 / PB5', { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText('PA10 LOW · PB5 HIGH')
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

test('A7 times out, retries after lost connection and retires the local process when navigating away', async ({ page }) => {
  test.setTimeout(85_000)
  await page.clock.install()
  const board = proposal.boards[0]
  const panel = await openA7(page, board)
  const boot = '**' + base + 'start'
  const step = '**' + base + 'step'
  await page.route(boot, route => route.fulfill({ status: 503, json: { message: 'Renode và ELF A7 chưa được chuẩn bị trên máy này.' } }))
  await start(panel).click()
  await expect(status(panel)).toContainText('Renode và ELF A7 chưa được chuẩn bị')
  await page.unroute(boot)
  await page.route(boot, () => {})
  const blocked = page.waitForRequest(boot)
  await start(panel).click()
  await blocked
  await page.clock.fastForward(20_001)
  await expect(status(panel)).toContainText('chưa khởi động sau 20 giây')
  await expect(dc(panel)).toBeDisabled()
  await page.unroute(boot)
  await page.route(step, route => route.abort('connectionreset'))
  // Reproduce starting a replacement while the disconnected run is still closing.
  let delayFirstStop = true
  await page.route('**' + base + 'stop', async route => {
    if (delayFirstStop) {
      delayFirstStop = false
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    await route.continue()
  })
  await start(panel).click()
  await expect(start(panel)).toBeVisible({ timeout: 22_000 })
  await expect(dc(panel)).toBeDisabled()
  await page.unroute(step)
  const started = page.waitForResponse(response => response.url().endsWith(base + 'start') && response.ok())
  await start(panel).click()
  const { id } = await (await started).json()
  await expect(status(panel)).toContainText('Đang chạy firmware', { timeout: 22_000 })
  await page.goto('/boards?board=' + board.id)
  const origin = new URL(page.url()).origin
  await expect.poll(async () => {
    const response = await page.request.post(origin + base + 'step', { headers: { origin }, data: { id, pressed: false } })
    return response.status()
  }, { timeout: 10_000 }).toBe(404)
  const next = await openA7(page, proposal.boards[1])
  await start(next).click()
  await expect(status(next)).toContainText('Đang chạy firmware', { timeout: 22_000 })
  await stop(next).click()
})

test('A7 saves by part and pin IDs and clears serial and readings when the circuit changes', async ({ page }) => {
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
  const board = proposal.boards[2]
  const panel = await openA7(page, board)
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
  await expect(dc(panel)).toBeEnabled({ timeout: 22_000 })
  await expect(await readDc(panel, 'released')).toContainText('PA10 3.3000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a7-button$/ })
  await button.press('Enter')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A7')).toContainText('Mạch A7 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(reading(panel)).toHaveCount(0)
  await panel.getByText('Serial USART2', { exact: true }).click()
  await expect(panel.getByLabel(/^Serial .* A7$/)).toContainText('Chưa có dữ liệu.')
})
