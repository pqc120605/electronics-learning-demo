import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-esp32-s3-electrical-firmware-a4-proposal.json', import.meta.url)))
const assets = '/api/local-tools/a4-esp/'

async function openA4(page, board, checkPad = false) {
  await page.goto('/boards?board=' + board.id + '&view=top')
  if (checkPad) {
    const pad = page.locator('[data-board-pad="' + board.button.pinId + '"]')
    const face = page.getByRole('img', { name: 'Vị trí pad trên board' })
    await face.focus()
    for (let index = 0; index < board.headerLocations && await pad.getAttribute('data-active') !== 'true'; index++) {
      await face.press('ArrowRight')
    }
    await expect(pad).toHaveAttribute('data-active', 'true')
    await face.press('Enter')
    await expect(page).toHaveURL(url => url.searchParams.get('pin') === board.button.pinId)
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText(board.button.label)
  }
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A4/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A4$/ })
  await expect(panel).toBeVisible()
  return panel
}

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
  return panel.getByLabel('Kết quả ngspice A4')
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(`${board.id} runs A4 firmware and measures its circuit on ${mobile ? 'mobile viewport' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => requests.push(request))
      const panel = await openA4(page, board, !mobile)
      expect(requests.some(request => request.url().includes(assets))).toBe(false)
      await panel.getByRole('button', { name: /^Chạy firmware / }).click()
      await panel.getByText('Serial UART0', { exact: true }).click()
      const serial = panel.getByLabel(/^Serial .* A4$/)
      await expect(serial).toContainText(`A4_READY=esp32s3:${board.flashMiB}`)
      await expect(serial).toContainText('A4_BUTTON=0')
      const gpio = panel.getByLabel(/^Mức chân /)
      const input = `GPIO${board.button.gpio}`
      await expect(gpio).toContainText(`${input} HIGH · GPIO6 LOW · LED tắt`)
      await expect(await readDc(panel, 'released')).toContainText(`${input} 3.3000 V · LED 0.000 V · I LED 0.000 mA`)
      const contact = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await contact.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText(`${input} LOW · GPIO6 HIGH · LED sáng`)
        await page.keyboard.up('Space')
        await expect(gpio).toContainText(`${input} HIGH · GPIO6 LOW · LED tắt`)
      }
      await expect(serial).toContainText(/(A4_BUTTON=1[\s\S]*?A4_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(`${input} 0.0003 V · LED 2.006 V · I LED 1.294 mA`)
      await panel.getByText(`Dạng sóng ${input} / GPIO6`, { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText(`${input} LOW · GPIO6 HIGH`)
      const origin = new URL(page.url()).origin
      const firmwareRequests = requests.filter(request => request.url().includes(assets))
      expect(firmwareRequests.map(request => new URL(request.url()).pathname)).toEqual([
        assets + board.flashMiB + 'm/manifest.json', assets + board.flashMiB + 'm/flash.bin',
      ])
      expect(firmwareRequests.every(request => request.method() === 'GET' && new URL(request.url()).origin === origin)).toBe(true)
      const flashResponse = await firmwareRequests[1].response()
      expect(await flashResponse?.headerValue('content-encoding')).toBe('gzip')
      expect(requests.some(request => /relay|^wss?:/.test(request.url()))).toBe(false)
      await panel.getByRole('button', { name: /^Dừng firmware / }).click()
      await expect(panel.getByRole('status')).toContainText('Đã dừng firmware.')
      await expect(panel.getByLabel('Kết quả ngspice A4')).toHaveCount(0)
    })
  }
}

test('A4 validates image and manifest failures, times out and can retry', async ({ page }) => {
  await page.clock.install()
  const board = proposal.boards.find(item => item.flashMiB === 4)
  const panel = await openA4(page, board)
  const start = panel.getByRole('button', { name: /^Chạy firmware / })
  const base = '**/api/local-tools/a4-esp/4m/'
  const flash = base + 'flash.bin'
  for (const [offset, failure] of [[12, 'đúng chip ESP32-S3'], [3, 'Header flash A4'], [-1, 'SHA-256 firmware A4 không khớp'], [null, 'Dung lượng ảnh flash A4 không khớp']]) {
    await page.route(flash, async route => {
      const response = await route.fetch()
      const body = await response.body()
      if (offset !== null) body[offset < 0 ? body.length - 1 : offset] ^= 1
      const headers = response.headers()
      delete headers['content-encoding']
      delete headers['content-length']
      await route.fulfill({ response, headers, body: offset === null ? body.subarray(0, -1) : body })
    })
    await start.click()
    await expect(panel.getByRole('status')).toContainText(failure)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await page.unroute(flash)
  }
  const manifest = base + 'manifest.json'
  await page.route(manifest, async route => {
    const response = await route.fetch()
    await route.fulfill({ response, json: { ...await response.json(), flashMiB: 16 } })
  })
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Manifest firmware không khớp')
  await page.unroute(manifest)
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

test('A4 switches C3 and flash profiles and keeps the original local draft', async ({ page }) => {
  test.setTimeout(60_000)
  const key = 'machmo-freestyle-v1'
  const previous = {
    version: 1, boardId: 'esp32-s3-devkitc-1', language: 'cpp', code: '// Original S3 draft',
    pinMap: { input: 5, ledOut: 4 }, updatedAt: '2026-11-27T00:00:00.000Z',
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, previous }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(previous))
  }, { key, previous })
  await page.goto('/boards?board=esp32-c3-devkitm-1')
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A2/ }).click()
  const c3 = page.getByRole('region', { name: /^Firmware và mạch .* A2$/ })
  await c3.getByRole('button', { name: /^Chạy firmware / }).click()
  await expect(c3.getByLabel(/^Mức chân /)).toContainText('GPIO4 HIGH')
  const prior = [4, 16].map(size => proposal.boards.find(board => board.flashMiB === size))
  for (const board of prior) {
    const panel = await openA4(page, board)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await expect(panel.getByLabel('Kết quả ngspice A4')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Đo DC bằng ngspice' })).toBeDisabled()
    const request = page.waitForRequest(assets + board.flashMiB + 'm/manifest.json')
    await panel.getByRole('button', { name: /^Chạy firmware / }).click()
    await request
    await expect(panel.getByLabel(/^Mức chân /)).toContainText('GPIO5 HIGH')
  }
  const archived = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))), key)
  const saved = archived.find(draft => draft.code === previous.code)
  expect(saved?.boardId).toBe(previous.boardId)
  expect(saved?.pinMap.ledOut).toBe(previous.pinMap.ledOut)
  expect(saved?.doc).toEqual(previous.doc)
  expect(archived.some(draft => draft.boardId === 'esp32-c3-devkitm-1')).toBe(true)
  expect(archived.some(draft => draft.boardId === prior[0].id)).toBe(true)
})

test('A4 drops old results and blocks firmware when its circuit is edited', async ({ page }) => {
  const panel = await openA4(page, proposal.boards[1])
  await panel.getByRole('button', { name: /^Chạy firmware / }).click()
  await expect(await readDc(panel, 'latest')).toContainText('GPIO5 3.3000 V')
  await page.getByRole('button', { name: 'Giữ nút nhấn' }).press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A4')).toContainText('Mạch A4 cần một nút nhấn')
  await expect(panel.getByRole('button', { name: /^Chạy firmware / })).toBeDisabled()
  await expect(panel.getByLabel('Kết quả ngspice A4')).toHaveCount(0)
  await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
})

test('ESP32-S3 DevKit retains the generic code route and GPIO4 preset', async ({ page }) => {
  await page.goto('/boards?board=esp32-s3-devkitc-1')
  await page.getByRole('link', { name: /^Lắp thử / }).click()
  await expect(page.getByRole('region', { name: /^Firmware và mạch .* A4$/ })).toHaveCount(0)
  await expect(page.getByText(/trình thông dịch Arduino C\+\+ rút gọn/).first()).toBeVisible()
})
