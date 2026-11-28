import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const proposal = JSON.parse(readFileSync(new URL('../docs/research/2026-11-28-s2-nano-every-electrical-firmware-a12-proposal.json', import.meta.url)))

for (const board of proposal.boards) {
  for (const mobile of [false, true]) {
    test(board.id + ' inspects A12 pads and measures DC on ' + (mobile ? '375 px' : 'desktop'), async ({ page }) => {
      test.setTimeout(75_000)
      if (mobile) await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/boards?board=' + board.id + '&view=top')
      await expect(page.locator('[data-board-pad]')).toHaveCount(board.padCount)
      await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
      if (board.id === 'esp32-s2-devkitc-1') {
        await expect(page.getByRole('heading', { name: 'Micro-USB native', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Micro-USB qua cầu USB–UART', exact: true })).toBeVisible()
      } else await expect(page.getByText(/Serial1 dùng USART1 trên D1 và D0/)).toBeVisible()
      await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
      const picker = page.getByRole('combobox', { name: 'Chân header', exact: true })
      for (const pin of Object.values(board.pins)) {
        await picker.selectOption(pin.pinId)
        await expect(page.locator('[data-board-pad="' + pin.pinId + '"]')).toHaveAttribute('data-active', 'true')
      }
      await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
      const viewer = page.locator('.board-cad-viewer')
      const stage = viewer.locator('.board-viewer-stage')
      await stage.scrollIntoViewIfNeeded()
      const marker = stage.locator('.board-pin-target-marker')
      await expect(marker).toBeVisible()
      const point = await marker.evaluate(el => ({ x: Number.parseFloat(el.style.left), y: Number.parseFloat(el.style.top) }))
      const [connector, pad] = board.pins.button.pad.split('.')
      const group = viewer.getByRole('group', { name: 'Chọn nhóm chân ' + connector, exact: true })
      await group.getByRole('button', { name: new RegExp('^' + board.pins.button.label + '\\b.* chân ' + pad + '$') }).click()
      await expect(viewer.locator('.board-selected-pin')).toContainText(board.pins.button.label)
      await stage.locator('canvas').click({ position: point })
      await expect(viewer.locator('.board-selected-pin')).toContainText(board.pins.uartRx.label)
      await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A12/ }).click()
      const panel = page.getByRole('region', { name: /^Mạch nút nhấn và LED .* A12$/ })
      await expect(panel).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Quan sát', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Giữ nút nhấn', exact: true })).toHaveCount(0)
      const result = panel.getByLabel('Kết quả ngspice A12')
      const measure = panel.getByRole('button', { name: 'Đo DC bằng ngspice' })
      const state = panel.getByLabel('Trạng thái đo DC')
      await expect(panel.getByLabel('Nguồn trạng thái')).toContainText('Đặt bằng tay')
      await measure.click()
      await expect(result).toContainText(board.voltageV.toFixed(4) + ' V · LED 0.000 V · I LED 0.000 mA')
      await state.selectOption('pressed')
      await expect(result).toHaveCount(0)
      await measure.click()
      await expect(result).toContainText(board.voltageV === 5
        ? '0.0005 V · LED 2.085 V · I LED 2.915 mA'
        : '0.0003 V · LED 2.006 V · I LED 1.294 mA')
      await page.getByRole('button', { name: 'Schematic', exact: true }).click()
      const button = page.getByRole('button', { name: /^Chọn .* a12-button$/ })
      await button.press('Enter')
      await button.press('Delete')
      await expect(panel.getByLabel('Kiểm tra mạch A12')).toContainText('cần một nút nhấn')
      await expect(measure).toBeDisabled()
      await expect(result).toHaveCount(0)
    })
  }
}

test('A12 archives a saved preset before opening a fixture and restores its own draft', async ({ page }) => {
  const key = 'machmo-freestyle-v1'
  const original = { version: 1, boardId: 'esp32-devkit', code: 'void setup() {}', language: 'cpp',
    pinMap: { input: 34, ledOut: 23 },
    doc: { schema: 2, lessonId: 'freestyle', breadboards: [], wires: [],
      parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
      expect: { partCount: 1, wireCount: 0, netCount: 0 } } }
  await page.addInitScript(({ key, original }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(original))
  }, { key, original })
  const board = proposal.boards[1]
  await page.goto('/boards?board=' + board.id + '&view=top')
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A12/ }).click()
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).boardId, key)).toBe(board.id)
  const archives = await page.evaluate(key => Object.keys(localStorage).filter(item => item.startsWith(key + ':previous:'))
    .map(item => JSON.parse(localStorage.getItem(item))), key)
  expect(archives).toEqual([original])
  await page.reload()
  await page.getByRole('button', { name: 'Mở bản nháp đã lưu', exact: true }).click()
  const panel = page.getByRole('region', { name: /^Mạch nút nhấn và LED .* A12$/ })
  await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
  await expect(panel.getByLabel('Kết quả ngspice A12')).toContainText('5.0000 V')
})
