import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-esp32-lx6-electrical-firmware-a11-proposal.json', import.meta.url)))
const prefix = '/api/local-tools/a11-esp/'
const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const measure = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const dc = panel => panel.getByLabel('Kết quả ngspice A11')
const gpio = panel => panel.getByLabel(/^Mức chân /)

async function openFixture(page, board, inspect = false) {
  await page.goto(`/boards?board=${board.id}&view=top`)
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(board.padCount)
    const picker = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(board.pins)) {
      await picker.selectOption(pin.pinId)
      await expect(page.locator(`[data-board-pad="${pin.pinId}"]`)).toHaveAttribute('data-active', 'true')
    }
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    const viewer = page.locator('.board-cad-viewer')
    const stage = viewer.locator('.board-viewer-stage')
    await stage.scrollIntoViewIfNeeded()
    const marker = stage.locator('.board-pin-target-marker')
    await expect(marker).toBeVisible()
    const point = await marker.evaluate(el => ({ x: Number.parseFloat(el.style.left), y: Number.parseFloat(el.style.top) }))
    const [connector, pad] = board.pins.button.pad.split('.')
    await viewer.getByRole('group', { name: `Chọn nhóm chân ${connector}`, exact: true })
      .getByRole('button', { name: new RegExp(`^${board.pins.button.label}\\b.* chân ${pad}$`) }).click({ timeout: 12_000 })
    await expect(viewer.locator('.board-selected-pin')).toContainText(board.pins.button.label)
    await stage.locator('canvas').click({ position: point })
    await expect(viewer.locator('.board-selected-pin')).toContainText(board.pins.uartTx.label)
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A11/ }).click({ timeout: 12_000 })
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A11$/ })
  await expect(panel).toBeVisible()
  return panel
}

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await measure(panel).click()
  return dc(panel)
}

for (const board of config.boards) {
  for (const mobile of [false, true]) {
    test(`${board.id} runs A11 on ${mobile ? '375 px' : 'desktop'}`, async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => { if (request.url().includes(prefix)) requests.push(new URL(request.url())) })
      const panel = await openFixture(page, board, true)
      expect(requests).toHaveLength(0)
      await expect(measure(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial UART0', { exact: true }).click()
      const serial = panel.getByLabel(/^Serial .* A11$/)
      await expect(serial).toContainText(config.runtime.firmware.readyLine, { timeout: 23_000 })
      await expect(gpio(panel)).toContainText('GPIO25 HIGH · GPIO26 LOW · LED tắt')
      await expect(await readDc(panel, 'released')).toContainText('GPIO25 3.3000 V · LED 0.000 V · I LED 0.000 mA')
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let cycle = 0; cycle < 3; cycle++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio(panel)).toContainText('GPIO25 LOW · GPIO26 HIGH · LED sáng')
        await page.keyboard.up('Space')
        await expect(gpio(panel)).toContainText('GPIO25 HIGH · GPIO26 LOW · LED tắt')
      }
      await expect(serial).toContainText(/(A11_LED=1\s+A11_LED=0\s+){3}/)
      await panel.getByLabel('Trạng thái đã quan sát').selectOption('pressed')
      await expect(dc(panel)).toHaveCount(0)
      await expect(await readDc(panel, 'pressed')).toContainText('GPIO25 0.0003 V · LED 2.006 V · I LED 1.294 mA')
      await stop(panel).click()
      await expect(dc(panel)).toHaveCount(0)
      await expect(serial).toContainText('Chưa có dữ liệu.')
      const origin = new URL(page.url()).origin
      expect(requests.every(url => url.origin === origin)).toBe(true)
      expect(new Set(requests.map(url => url.pathname))).toEqual(new Set(['image/manifest.json', 'image/flash.bin', 'engine/esp_emu.js', 'engine/esp_emu_bg.wasm', 'engine/cosim.js'].map(file => prefix + file)))
      await start(panel).click()
      await expect(serial).toContainText(config.runtime.firmware.readyLine, { timeout: 23_000 })
      await stop(panel).click()
    })
  }
}

test('A11 rejects missing, mismatched and stalled local assets and allows retry', async ({ page }) => {
  test.setTimeout(90_000)
  await page.clock.install()
  const panel = await openFixture(page, config.boards[0])
  const manifest = '**' + prefix + 'image/manifest.json'
  const wasm = '**' + prefix + 'engine/esp_emu_bg.wasm'
  await page.route(manifest, route => route.fulfill({ status: 404 }))
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('chưa được chuẩn bị')
  await page.unroute(manifest)
  await page.route(manifest, async route => {
    const response = await route.fetch()
    const json = await response.json()
    json.fixtures['esp32-devkit'].revision = 'other variant'
    await route.fulfill({ json })
  })
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('Manifest firmware không khớp')
  await page.unroute(manifest)
  await page.route(wasm, route => route.fulfill({ body: 'wrong WASM' }))
  await start(panel).click()
  await expect(panel.getByRole('status')).toContainText('SHA-256 hoặc kích thước')
  await page.unroute(wasm)
  await page.route(manifest, () => {})
  const request = page.waitForRequest(manifest)
  await start(panel).click()
  await request
  await page.clock.fastForward(20_001)
  await expect(panel.getByRole('status')).toContainText('chưa khởi động sau 20 giây')
  await expect(measure(panel)).toBeDisabled()
  await page.unroute(manifest)
  await start(panel).click()
  await expect(gpio(panel)).toContainText('GPIO25 HIGH', { timeout: 23_000 })
  const worker = page.workers().find(item => item.url().includes('a11Esp'))
  expect(worker).toBeDefined()
  const closed = worker.waitForEvent('close')
  const next = await openFixture(page, config.boards[1])
  await closed
  await expect(measure(next)).toBeDisabled()
  await start(next).click()
  await expect(gpio(next)).toContainText('GPIO25 HIGH', { timeout: 23_000 })
  await stop(next).click()
})

test('A11 preserves the DevKit V1 draft and clears DC after editing the circuit', async ({ page }) => {
  test.setTimeout(75_000)
  const key = 'machmo-freestyle-v1'
  const prior = { version: 1, boardId: 'esp32-devkit', code: 'void setup() {}', language: 'cpp', pinMap: { input: 34, ledOut: 23 },
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } } }
  await page.addInitScript(({ key, prior }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior)) }, { key, prior })
  const panel = await openFixture(page, config.boards[1])
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).boardId, key)).toBe('esp32-devkitm-1')
  const archive = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))).find(item => item.code === 'void setup() {}'), key)
  expect(archive.doc).toEqual(prior.doc)
  expect(archive.pinMap).toMatchObject(prior.pinMap)
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await expect(panel).toBeVisible()
  await start(panel).click()
  await expect(gpio(panel)).toContainText('GPIO25 HIGH', { timeout: 23_000 })
  await expect(await readDc(panel, 'released')).toContainText('3.3000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a11-button$/ })
  await button.press('Enter')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A11')).toContainText('Mạch A11 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(dc(panel)).toHaveCount(0)
})
