
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-rp2350-electrical-firmware-a6-proposal.json', import.meta.url)))
const base = '/api/local-tools/a6-pico/'

async function openA6(page, board, inspect = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (inspect) {
    await expect(page.locator('[data-board-pad]')).toHaveCount(40)
    const header = page.getByRole('combobox', { name: 'Chân header', exact: true })
    for (const pin of Object.values(proposal.pins)) {
      await header.selectOption(pin.pinId)
      await expect(page.locator('[data-board-pad="' + pin.pinId + '"]')).toHaveAttribute('data-active', 'true')
    }
    await expect(page).toHaveURL(url => url.searchParams.get('pin') === proposal.pins.serialTx.pinId)
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText('GP0')
    await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
    const swd = page.getByRole('region', { name: /SWD/ }).last()
    await expect(swd).toContainText('SWCLK')
    await expect(swd).toContainText('GND')
    await expect(swd).toContainText('SWDIO')
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A6/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A6$/ })
  await expect(panel).toBeVisible()
  return panel
}
const start = panel => panel.getByRole('button', { name: /^Chạy firmware / })
const stop = panel => panel.getByRole('button', { name: /^Dừng firmware / })
const status = panel => panel.getByRole('status')
const dc = panel => panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
const reading = panel => panel.getByLabel('Kết quả ngspice A6')

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await dc(panel).click()
  return reading(panel)
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(board.id + ' simulates A6 on ' + (mobile ? '375px' : 'desktop'), async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => requests.push(request))
      const panel = await openA6(page, board, !mobile)
      expect(requests.some(request => request.url().includes(base))).toBe(false)
      await expect(dc(panel)).toBeDisabled()
      await start(panel).click()
      await panel.getByText('Serial UART0', { exact: true }).click()
      const uart = panel.getByLabel(/^Serial .* A6$/)
      const gpio = panel.getByLabel(/^Mức chân /)
      await expect(uart).toContainText(proposal.firmware.behavior.readyLine)
      await expect(uart).toContainText('A6_BUTTON=0')
      await expect(gpio).toContainText('GP14 HIGH · GP15 LOW · LED tắt')
      await expect(await readDc(panel, 'released')).toContainText('GP14 3.3000 V · LED 0.000 V · I LED 0.000 mA')
      const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await button.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText('GP14 LOW · GP15 HIGH · LED sáng')
        await page.keyboard.up('Space')
        await expect(gpio).toContainText('GP14 HIGH · GP15 LOW · LED tắt')
      }
      await expect(uart).toContainText(/(A6_BUTTON=1[\s\S]*?A6_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText('GP14 0.0003 V · LED 2.006 V · I LED 1.294 mA')
      await panel.getByText('Dạng sóng GP14 / GP15', { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText('GP14 LOW · GP15 HIGH')
      const origin = new URL(page.url()).origin
      const assets = requests.filter(request => request.url().includes(base))
      expect(assets.map(request => new URL(request.url()).pathname).sort()).toEqual([
        base + board.id + '/manifest.json', base + board.id + '/firmware.elf',
        base + 'engine/picoemu.wasm.js', base + 'engine/picoemu.wasm.wasm',
      ].sort())
      expect(assets.every(request => request.method() === 'GET' && new URL(request.url()).origin === origin)).toBe(true)
      await stop(panel).click()
      await expect(status(panel)).toContainText('Đã dừng firmware.')
      await expect(reading(panel)).toHaveCount(0)
    })
  }
}

test('A6 rejects a changed revision, target, board, ELF digest and missing WASM, then times out and retries', async ({ page }) => {
  await page.clock.install()
  const board = proposal.boards[1]
  const panel = await openA6(page, board)
  const manifest = '**' + base + board.id + '/manifest.json'
  const elf = '**' + base + board.id + '/firmware.elf'
  const wasm = '**' + base + 'engine/picoemu.wasm.wasm'
  for (const patch of [{ boardId: proposal.boards[0].id }, { revision: 'wrong' }, { target: 'rp2040' }]) {
    await page.route(manifest, async route => {
      const response = await route.fetch()
      await route.fulfill({ response, json: { ...await response.json(), ...patch } })
    })
    await start(panel).click()
    await expect(status(panel)).toContainText('Manifest firmware không khớp')
    await expect(dc(panel)).toBeDisabled()
    await page.unroute(manifest)
  }
  await page.route(elf, async route => {
    const response = await route.fetch()
    const body = await response.body()
    body[body.length - 1] ^= 1
    await route.fulfill({ response, body })
  })
  await start(panel).click()
  await expect(status(panel)).toContainText('SHA-256 hoặc dung lượng ELF')
  await page.unroute(elf)
  await page.route(wasm, route => route.fulfill({ status: 404, body: '' }))
  await start(panel).click()
  await expect(status(panel)).toContainText('Chưa tải được pico-emu WASM')
  await page.unroute(wasm)
  await page.route(manifest, () => {})
  const blocked = page.waitForRequest(manifest)
  await start(panel).click()
  await blocked
  await page.clock.fastForward(10_001)
  await expect(status(panel)).toContainText('chưa khởi động sau 10 giây')
  await page.unroute(manifest)
  await start(panel).click()
  await expect(status(panel)).toContainText('Đang chạy firmware')
  await page.clock.fastForward(60_001)
  await expect(status(panel)).toContainText('Đã dừng sau 60 giây')
  await expect(dc(panel)).toBeDisabled()
  await start(panel).click()
  await expect(status(panel)).toContainText('Đang chạy firmware')
})

test('A6 preserves the RP2040 draft, reopens its own circuit and invalidates readings after editing', async ({ page }) => {
  const key = 'machmo-freestyle-v1'
  const prior = {
    version: 1, boardId: 'raspberry-pi-pico', code: 'print("Pico R3 draft")', language: 'micropython',
    pinMap: { input: 14, ledOut: 15 },
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, prior }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior))
  }, { key, prior })
  const board = proposal.boards[0]
  const panel = await openA6(page, board)
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.boardId, key)).toBe(board.id)
  const savedCircuit = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).doc, key)
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  await expect(panel).toBeVisible()
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).doc, key)
  expect(restored).toEqual(savedCircuit)
  const backup = await page.evaluate(({ key, code }) => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))).find(draft => draft.code === code), { key, code: prior.code })
  expect(backup?.doc).toEqual(prior.doc)
  await start(panel).click()
  await expect(await readDc(panel, 'latest')).toContainText('GP14 3.3000 V')
  await page.getByRole('button', { name: 'Schematic', exact: true }).click()
  const button = page.getByRole('button', { name: /^Chọn .* a6-button$/ })
  await button.press('Enter')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A6')).toContainText('Mạch A6 cần một nút nhấn')
  await expect(start(panel)).toBeDisabled()
  await expect(reading(panel)).toHaveCount(0)
})
