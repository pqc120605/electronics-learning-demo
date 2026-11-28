import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-esp32-riscv-electrical-firmware-a3-proposal.json', import.meta.url)))
const assets = '/api/local-tools/a3-esp/'

async function openA3(page, board, checkPad = false) {
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
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A3/ }).click()
  const panel = page.getByRole('region', { name: /^Firmware và mạch .* A3$/ })
  await expect(panel).toBeVisible()
  return panel
}

async function readDc(panel, state) {
  await panel.getByLabel('Trạng thái đã quan sát').selectOption(state)
  await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
  return panel.getByLabel('Kết quả ngspice A3')
}

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(`${board.id} runs A3 firmware and measures its circuit on ${mobile ? 'mobile viewport' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      const requests = []
      page.on('request', request => requests.push(request))
      const panel = await openA3(page, board, !mobile)
      expect(requests.some(request => request.url().includes(assets))).toBe(false)
      await panel.getByRole('button', { name: /^Chạy firmware / }).click()
      await panel.getByText('Serial UART0', { exact: true }).click()
      const serial = panel.getByLabel(/^Serial .* A3$/)
      await expect(serial).toContainText(`A3_READY=${board.target}`)
      await expect(serial).toContainText('A3_BUTTON=0')
      const gpio = panel.getByLabel(/^Mức chân /)
      const input = `GPIO${board.button.gpio}`
      await expect(gpio).toContainText(`${input} HIGH · GPIO10 LOW · LED tắt`)
      await expect(await readDc(panel, 'released')).toContainText(`${input} 3.3000 V · LED 0.000 V · I LED 0.000 mA`)
      const contact = page.getByRole('button', { name: 'Giữ nút nhấn' })
      for (let count = 0; count < 3; count++) {
        await contact.focus()
        await page.keyboard.down('Space')
        await expect(gpio).toContainText(`${input} LOW · GPIO10 HIGH · LED sáng`)
        await page.keyboard.up('Space')
        await expect(gpio).toContainText(`${input} HIGH · GPIO10 LOW · LED tắt`)
      }
      await expect(serial).toContainText(/(A3_BUTTON=1[\s\S]*?A3_BUTTON=0[\s\S]*?){3}/)
      await expect(await readDc(panel, 'pressed')).toContainText(`${input} 0.0003 V · LED 2.006 V · I LED 1.294 mA`)
      await panel.getByText(`Dạng sóng ${input} / GPIO10`, { exact: true }).click()
      await expect(panel.getByRole('list', { name: /^Trace GPIO / })).toContainText(`${input} LOW · GPIO10 HIGH`)
      const origin = new URL(page.url()).origin
      const firmwareRequests = requests.filter(request => request.url().includes(assets))
      expect(firmwareRequests.map(request => new URL(request.url()).pathname)).toEqual([
        assets + board.target + '/manifest.json', assets + board.target + '/flash.bin',
      ])
      expect(firmwareRequests.every(request => request.method() === 'GET' && new URL(request.url()).origin === origin)).toBe(true)
      const flashResponse = await firmwareRequests[1].response()
      expect(await flashResponse?.headerValue('content-encoding')).toBe('gzip')
      expect(requests.some(request => /relay|^wss?:/.test(request.url()))).toBe(false)
      await panel.getByRole('button', { name: /^Dừng firmware / }).click()
      await expect(panel.getByRole('status')).toContainText('Đã dừng firmware.')
    })
  }
}

test('A3 refuses wrong chip, changed checksum, missing and stalled assets and can retry', async ({ page }) => {
  await page.clock.install()
  const board = proposal.boards.find(board => board.target === 'esp32h2')
  const panel = await openA3(page, board)
  const start = panel.getByRole('button', { name: /^Chạy firmware / })
  const flash = '**/api/local-tools/a3-esp/esp32h2/flash.bin'
  for (const [offset, error] of [[12, 'đúng chip esp32h2'], [-1, 'SHA-256 firmware A3 không khớp']]) {
    await page.route(flash, async route => {
      const response = await route.fetch()
      const body = await response.body()
      body[offset < 0 ? body.length - 1 : offset] ^= 1
      const headers = response.headers()
      delete headers['content-encoding']
      delete headers['content-length']
      await route.fulfill({ response, headers, body })
    })
    await start.click()
    await expect(panel.getByRole('status')).toContainText(error)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await page.unroute(flash)
  }
  const manifest = '**/api/local-tools/a3-esp/esp32h2/manifest.json'
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

test('A3 switches board without carrying old trace or overwriting the original draft', async ({ page }) => {
  const storageKey = 'machmo-freestyle-v1'
  const previous = {
    version: 1, boardId: 'arduino-uno-r3', language: 'cpp', code: '// Original local draft',
    pinMap: { input: 2, ledOut: 13 }, updatedAt: '2026-11-27T00:00:00.000Z',
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } },
  }
  await page.addInitScript(({ key, raw }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, raw)
  }, { key: storageKey, raw: JSON.stringify(previous) })
  for (const board of proposal.boards.slice(0, 3)) {
    const panel = await openA3(page, board)
    await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
    await expect(panel.getByLabel('Kết quả ngspice A3')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Đo DC bằng ngspice' })).toBeDisabled()
    await panel.getByRole('button', { name: /^Chạy firmware / }).click()
    await expect(panel.getByRole('status')).toContainText('Đang chạy firmware')
    await expect(await readDc(panel, 'latest')).toContainText('3.3000 V')
  }
  const archived = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))), storageKey)
  const saved = archived.find(draft => draft.code === previous.code)
  expect(saved?.boardId).toBe(previous.boardId)
  expect(saved?.doc).toEqual(previous.doc)
  expect(archived.some(draft => draft.boardId === proposal.boards[0].id)).toBe(true)
  expect(archived.some(draft => draft.boardId === proposal.boards[1].id)).toBe(true)
})

test('A3 clears measurements when a wire is removed with its component', async ({ page }) => {
  const board = proposal.boards.find(board => board.target === 'esp32c6')
  const panel = await openA3(page, board)
  await panel.getByRole('button', { name: /^Chạy firmware / }).click()
  await expect(await readDc(panel, 'latest')).toContainText('GPIO2 3.3000 V')
  await page.getByRole('button', { name: 'Giữ nút nhấn' }).press('Delete')
  await expect(panel.getByLabel('Kiểm tra mạch A3')).toContainText('Mạch A3 cần một nút nhấn')
  await expect(panel.getByRole('button', { name: /^Chạy firmware / })).toBeDisabled()
  await expect(panel.getByLabel('Kết quả ngspice A3')).toHaveCount(0)
  await expect(panel.getByLabel(/^Mức chân /)).toHaveCount(0)
})
