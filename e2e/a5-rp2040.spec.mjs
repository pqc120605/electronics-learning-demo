import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-rp2040-electrical-firmware-a5-proposal.json', import.meta.url)))
const assets = '/api/local-tools/a5-pico/'

async function openA5(page, board, checkPad = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (checkPad) {
    const pad = page.locator('[data-board-pad="' + proposal.pins.button.pinId + '"]')
    const face = page.getByRole('img', { name: 'Vị trí pad trên board' })
    await face.focus()
    for (let index = 0; index < board.headerLocations && await pad.getAttribute('data-active') !== 'true'; index++) {
      await face.press('ArrowRight')
    }
    await expect(pad).toHaveAttribute('data-active', 'true')
    await face.press('Enter')
    await expect(page).toHaveURL(url => url.searchParams.get('pin') === proposal.pins.button.pinId)
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText(proposal.pins.button.label)
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A5/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A5$/ })
  await expect(panel).toBeVisible()
  return panel
}

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
  return panel.getByLabel('Kết quả ngspice A5')
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(`${board.id} runs A5 firmware and measures its circuit on ${mobile ? 'mobile viewport' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => requests.push(request))
      const panel = await openA5(page, board, !mobile)
      expect(requests.some(request => request.url().includes(assets))).toBe(false)
      await panel.getByRole('button', { name: /^Chạy firmware / }).click()
      await panel.getByText('Serial UART0', { exact: true }).click()
      const serial = panel.getByLabel(/^Serial .* A5$/)
      await expect(serial).toContainText(`A5_READY=${board.sdkBoard}`)
      await expect(serial).toContainText('A5_BUTTON=0')
      const gpio = panel.getByLabel(/^Mức chân /)
      const input = 'GP14'
      await expect(gpio).toContainText(`${input} HIGH · GP15 LOW · LED tắt`)
      await expect(await readDc(panel, 'released')).toContainText(`${input} 3.3000 V · LED 0.000 V · I LED 0.000 mA`)
      const contact = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await contact.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText(`${input} LOW · GP15 HIGH · LED sáng`)
        await page.keyboard.up('Space')
        await expect(gpio).toContainText(`${input} HIGH · GP15 LOW · LED tắt`)
      }
      await expect(serial).toContainText(/(A5_BUTTON=1[\s\S]*?A5_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(`${input} 0.0003 V · LED 2.006 V · I LED 1.294 mA`)
      await panel.getByText(`Dạng sóng ${input} / GP15`, { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText(`${input} LOW · GP15 HIGH`)
      const origin = new URL(page.url()).origin
      const firmwareRequests = requests.filter(request => request.url().includes(assets))
      expect(firmwareRequests.map(request => new URL(request.url()).pathname)).toEqual([
        assets + board.sdkBoard + '/manifest.json', assets + board.sdkBoard + '/flash.bin', assets + board.sdkBoard + '/bootrom.bin',
      ])
      expect(firmwareRequests.every(request => request.method() === 'GET' && new URL(request.url()).origin === origin)).toBe(true)
      const flashResponse = await firmwareRequests[1].response()
      expect(await flashResponse?.headerValue('content-encoding')).toBe('gzip')
      expect(requests.some(request => /relay|^wss?:/.test(request.url()))).toBe(false)
      await panel.getByRole('button', { name: /^Dừng firmware / }).click()
      await expect(panel.getByRole('status')).toContainText('Đã dừng firmware.')
      await expect(panel.getByLabel('Kết quả ngspice A5')).toHaveCount(0)
    })
  }
}

test('A5 handles missing, corrupt, wrong-board and stalled local assets, then retries', async ({ page }) => {
  await page.clock.install()
  const board = proposal.boards[1]
  const panel = await openA5(page, board)
  const start = panel.getByRole('button', { name: /^Chạy firmware / })
  const base = '**/api/local-tools/a5-pico/pico_w/'
  const flash = base + 'flash.bin'
  const bootrom = base + 'bootrom.bin'
  const manifest = base + 'manifest.json'

  for (const [url, offset, phrase] of [
    [flash, 0x104, 'vector khởi động Thumb'],
    [flash, -2, 'SHA-256 firmware A5 không khớp'],
    [flash, null, 'Dung lượng ảnh flash A5'],
    [bootrom, 0, 'Boot ROM RP2040 B2 không khớp'],
  ]) {
    await page.route(url, async route => {
      const res = await route.fetch()
      const bytes = await res.body()
      if (offset !== null) bytes[offset < 0 ? bytes.length + offset : offset] ^= 1
      const headers = res.headers()
      delete headers['content-encoding']
      delete headers['content-length']
      await route.fulfill({ status: res.status(), headers, body: offset === null ? bytes.subarray(0, -1) : bytes })
    })
    await start.click()
    await expect(panel.getByRole('status')).toContainText(phrase)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await page.unroute(url)
  }
  await page.route(manifest, async route => {
    const res = await route.fetch()
    const body = await res.json()
    await route.fulfill({ status: 200, json: { ...body, boardId: proposal.boards[0].id } })
  })
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Manifest firmware không khớp')
  await page.unroute(manifest)
  await page.route(bootrom, route => route.fulfill({ status: 404, body: '' }))
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Chưa tải được boot ROM')
  await page.unroute(bootrom)
  await page.route(manifest, route => route.fulfill({ status: 404, body: '' }))
  await start.click()
  await expect(panel.getByRole('status')).toContainText('chưa được chuẩn bị')
  await page.unroute(manifest)
  await page.route(manifest, () => {})
  const pending = page.waitForRequest(manifest)
  await start.click()
  await pending
  await page.clock.fastForward(10_001)
  await expect(panel.getByRole('status')).toContainText('chưa khởi động sau 10 giây')
  await page.unroute(manifest)
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Đang chạy firmware')
})

test('Switching A5 boards clears measurements and archives the existing MicroPython draft', async ({ page }) => {
  const key = 'machmo-freestyle-v1'
  const prior = {
    version: 1, boardId: 'raspberry-pi-pico', language: 'micropython', code: 'print("Pico R3 draft")',
    pinMap: { input: 14, ledOut: 15 }, updatedAt: '2026-11-27T00:00:00.000Z',
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, prior }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(prior))
  }, { key, prior })
  for (const board of proposal.boards) {
    const panel = await openA5(page, board)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await expect(panel.getByLabel('Kết quả ngspice A5')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Đo DC bằng ngspice' })).toBeDisabled()
    const request = page.waitForRequest(assets + board.sdkBoard + '/manifest.json')
    await panel.getByRole('button', { name: /^Chạy firmware / }).click()
    await request
    await expect(await readDc(panel, 'latest')).toContainText('GP14 3.3000 V')
  }
  const archived = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))), key)
  const saved = archived.find(draft => draft.code === prior.code)
  expect(saved?.boardId).toBe(prior.boardId)
  expect(saved?.language).toBe(prior.language)
  expect(saved?.doc).toEqual(prior.doc)
  expect(archived.some(draft => draft.doc.parts.some(part => part.id === 'a5-button'))).toBe(true)
})

test('A5 stops when the circuit is edited and removes old DC readings', async ({ page }) => {
  const panel = await openA5(page, proposal.boards[1])
  await panel.getByRole('button', { name: /^Chạy firmware / }).click()
  await expect(await readDc(panel, 'latest')).toContainText('GP14 3.3000 V')
  await page.getByRole('button', { name: 'Giữ nút nhấn' }).press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A5')).toContainText('Mạch A5 cần một nút nhấn')
  await expect(panel.getByRole('button', { name: /^Chạy firmware / })).toBeDisabled()
  await expect(panel.getByLabel('Kết quả ngspice A5')).toHaveCount(0)
  await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
})

test('Existing Pico UF2 picker accepts RP2040 and rejects a mismatched family', async ({ page }) => {
  await page.goto('/tools/firmware-hex')
  const panel = page.locator('.rp2040-panel')
  const file = panel.getByLabel('Chọn tệp .uf2')
  const run = panel.getByRole('button', { name: 'Chạy trên RP2040' })
  const payload = readFileSync(new URL('../public/firmware/micropython/RPI_PICO-20260824-v1.29.0.uf2', import.meta.url))
  await file.setInputFiles({ name: 'pico.uf2', mimeType: 'application/octet-stream', buffer: payload })
  await expect(panel.getByText('pico.uf2', { exact: true })).toBeVisible()
  await expect(run).toBeEnabled()
  const incorrect = Buffer.from(payload)
  incorrect.writeUInt32LE(0x12345678, 28)
  await file.setInputFiles({ name: 'wrong-family.uf2', mimeType: 'application/octet-stream', buffer: incorrect })
  await expect(panel.getByRole('alert')).toContainText('UF2 không dành cho họ RP2040')
  await expect(run).toBeDisabled()
})
