import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-avr-classic-electrical-firmware-a10-proposal.json', import.meta.url)))
const route = '/api/local-tools/a10-avr/'
const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const dc = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const result = panel => panel.getByLabel('Kết quả ngspice A10')
const gpio = panel => panel.getByLabel(/^Mức chân /)

async function openA10(page, board, inspect = false) {
  await page.goto(`/boards?board=${board.id}&view=top`)
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(board.padCount)
    const header = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(board.pins)) {
      await header.selectOption(pin.id)
      await expect(page.locator(`[data-board-pad="${pin.id}"]`)).toHaveAttribute('data-active', 'true')
    }
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    const viewer = page.locator('.board-cad-viewer')
    const selected = viewer.locator('.board-selected-pin')
    await expect(selected).toContainText('D1')
    const stage = viewer.locator('.board-viewer-stage')
    await stage.scrollIntoViewIfNeeded()
    const marker = stage.locator('.board-pin-target-marker')
    await expect(marker).toBeVisible()
    const uartPoint = await marker.evaluate(element => ({ x: Number.parseFloat(element.style.left), y: Number.parseFloat(element.style.top) }))
    const [connector, pad] = board.pins.input.pad.split('.')
    await viewer.getByRole('group', { name: `Chọn nhóm chân ${connector}`, exact: true })
      .getByRole('button', { name: new RegExp(`^${board.pins.input.label}\\b.* chân ${pad}$`) }).click({ timeout: 12_000 })
    await expect(selected).toContainText(board.pins.input.label)
    await stage.locator('canvas').click({ position: uartPoint })
    await expect(selected).toContainText(/\bD1\b/)
    await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
    for (const id of Object.keys(board.auxiliary)) await expect(page.getByRole('region', { name: new RegExp(`^${id} ·`) })).toBeVisible()
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A10/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A10$/ })
  await expect(panel).toBeVisible()
  return panel
}

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await dc(panel).click()
  return result(panel)
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(`${board.sku} runs A10 on ${mobile ? '375 px' : 'desktop'}`, async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => { if (request.url().includes(route)) requests.push(request) })
      const panel = await openA10(page, board, true)
      expect(requests).toHaveLength(0)
      await expect(dc(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial USART0', { exact: true }).click()
      const serial = panel.getByLabel(/^Serial .* A10$/)
      await expect(serial).toContainText(`A10_READY ${board.uartTargetMarker}`)
      const input = board.pins.input.label
      const led = board.pins.output.label
      await expect(gpio(panel)).toContainText(`${input} HIGH · ${led} LOW · LED tắt`)
      await expect(await readDc(panel, 'released')).toContainText(`${input} 5.0000 V · LED 0.000 V · I LED 0.000 mA`)
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let index = 0; index < 3; index++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio(panel)).toContainText(`${input} LOW · ${led} HIGH · LED sáng`)
        await page.keyboard.up('Space')
        await expect(gpio(panel)).toContainText(`${input} HIGH · ${led} LOW · LED tắt`)
      }
      await expect(serial).toContainText(/(A10_LED 1\s+A10_LED 0\s+){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(`${input} 0.0005 V · LED 2.085 V · I LED 2.915 mA`)
      await stop(panel).click()
      await expect(panel.getByRole('status')).toContainText('Đã dừng firmware.')
      await expect(result(panel)).toHaveCount(0)
      await expect(serial).toContainText('Chưa có dữ liệu.')
      const origin = new URL(page.url()).origin
      expect(requests.map(request => [request.method(), request.url()])).toEqual(['manifest.json', 'firmware.hex'].map(file => ['GET', origin + route + board.id + '/' + file]))
      await start(panel).click()
      await expect(serial).toContainText(`A10_READY ${board.uartTargetMarker}`)
      await expect(gpio(panel)).toContainText(`${input} HIGH · ${led} LOW · LED tắt`)
      await stop(panel).click()
    })
  }
}

test('A10 can retry missing or mismatched HEX and stops the worker on navigation', async ({ page }) => {
  test.setTimeout(75_000)
  const board = proposal.boards[0]
  const asset = '**' + route + board.id + '/'
  const panel = await openA10(page, board)
  await page.route(asset + 'manifest.json', handler => handler.fulfill({ status: 404 }))
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('chưa được chuẩn bị')
  await page.unroute(asset + 'manifest.json')
  await page.route(asset + 'firmware.hex', handler => handler.fulfill({ contentType: 'text/plain', body: ':00000001FF' }))
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('SHA-256')
  await expect(dc(panel)).toBeDisabled()
  await page.unroute(asset + 'firmware.hex')
  await page.route(asset + 'manifest.json', async handler => {
    const response = await handler.fetch()
    await handler.fulfill({ response, json: { ...await response.json(), fixtureSha256: '0'.repeat(64) } })
  })
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('SHA-256 của mạch mẫu A10')
  await page.unroute(asset + 'manifest.json')
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('Đang chạy firmware')
  const worker = page.workers().find(worker => worker.url().includes('avrLive'))
  expect(worker).toBeDefined()
  const stopped = worker.waitForEvent('close')
  await page.goto('/boards?board=' + board.id)
  await stopped
  const next = await openA10(page, proposal.boards[1])
  await start(next).click()
  await expect(next.getByRole('status')).toContainText('Đang chạy firmware')
  await stop(next).click()
})

test('A10 preserves the previous draft and clears results when the circuit changes', async ({ page }) => {
  test.setTimeout(75_000)
  const key = 'machmo-freestyle-v1'
  const prior = { version: 1, boardId: 'arduino-mega-2560', code: 'void setup() {}', language: 'cpp',
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } } }
  await page.addInitScript(({ key, prior }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior)) }, { key, prior })
  const panel = await openA10(page, proposal.boards[0])
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).boardId, key)).toBe('arduino-nano')
  const draft = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
  expect(draft.doc.wires[0].from).toMatchObject({ partId: 'board', pinId: 'vcc' })
  const archive = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))).find(item => item.code === 'void setup() {}'), key)
  expect(archive.doc).toEqual(prior.doc)
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await expect(panel).toBeVisible()
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).doc, key)).toEqual(draft.doc)
  await start(panel).click()
  await expect(gpio(panel)).toContainText('D2 HIGH')
  await expect(await readDc(panel, 'released')).toContainText('5.0000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a10-button$/ })
  await button.press('Enter')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A10')).toContainText('Mạch A10 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(result(panel)).toHaveCount(0)
  await panel.getByText('Serial USART0', { exact: true }).click()
  await expect(panel.getByLabel(/^Serial .* A10$/)).toContainText('Chưa có dữ liệu.')
})
