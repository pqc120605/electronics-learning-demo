import { expect, test } from '@playwright/test'
import { createServer } from 'vite'

let server
let makeWorkspace
test.beforeAll(async () => {
  server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } })
  const { addFreestyleWire, blankFreestyleWorkspace, workspaceWithFreestyleBoard } =
    await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  const pin = (partId, pinId) => ({ kind: 'pin', partId, pinId })
  makeWorkspace = (parts, wires, board) => {
    const workspace = board ? workspaceWithFreestyleBoard(blankFreestyleWorkspace(), board) : blankFreestyleWorkspace()
    const doc = { ...workspace.doc, parts: [...workspace.doc.parts, ...parts.map(([id, type], order) => (
      { id, type, mount: { kind: 'bench', lane: 'right', order } }
    ))] }
    return { ...workspace, doc: wires.reduce((current, [from, fromPin, to, toPin]) =>
      addFreestyleWire(current, pin(from, fromPin), pin(to, toPin)), doc) }
  }
})
test.afterAll(async () => { await server?.close() })

async function openDraft(page, workspace) {
  await page.addInitScript(draft => {
    if (!localStorage.getItem('machmo-freestyle-v1')) localStorage.setItem('machmo-freestyle-v1', JSON.stringify(draft))
  }, workspace)
  await page.goto('/build/freestyle?resume=1')
  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
}

for (const [id, bias] of [['sn74hc08-r1','vcc'], ['sn74hc32-r2a','gnd']]) {
  test('Uno Blink HEX drives the wired LED through ' + id, async ({ page }) => {
    const workspace = makeWorkspace([['ic', id], ['led1', 'led'], ['r', 'resistor']], [
      ['board', 'ledOut', 'ic', '1a'], ['board', bias, 'ic', '1b'],
      ['board', 'vcc', 'ic', 'vcc'], ['board', 'gnd', 'ic', 'gnd'],
      ['ic', '1y', 'r', 'a'], ['r', 'b', 'led1', 'anode'], ['led1', 'cathode', 'board', 'gnd'],
    ], 'arduino-uno-r3')
    await openDraft(page, workspace)
    await page.getByText('Firmware HEX và mạch số Uno', { exact: true }).click()
    await page.getByRole('button', { name: 'Mở HEX Blink Arduino Uno có sẵn', exact: true }).click()
    const run = page.getByRole('button', { name: 'Chạy HEX cùng mạch' })
    await expect(run).toBeEnabled()
    await run.click()
    const result = page.locator('[data-coupled-events]')
    await expect(result).toHaveText(/AVR8js cùng mạch số.*0 LED sáng/, { timeout: 15000 })
    await expect(result).toHaveText(/AVR8js cùng mạch số.*1 LED sáng/, { timeout: 15000 })
    await page.getByRole('tab', { name: /Quan sát/ }).click()
    await expect(page.locator('.freestyle-engine strong')).toHaveText('AVR8js · HEX và mạch số')
    await expect(page.locator('.freestyle-outputs [data-part="led1"]')).toHaveText('led1: sáng', { timeout: 15000 })
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng', exact: true }).click()
    await expect(page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy', exact: true })).toBeVisible()
  })
}

test('R1 analog draft opens in browser ngspice and returns with the same wires', async ({ page }) => {
  const workspace = makeWorkspace([['src', 'battery'], ['r', 'resistor'], ['d', '1n4148-r1']], [
    ['src', 'positive', 'r', 'a'], ['r', 'b', 'd', 'a'], ['d', 'k', 'src', 'negative'],
  ])
  await openDraft(page, workspace)
  await page.getByText('Phân tích DC mạch đang lắp', { exact: true }).click()
  await page.getByRole('button', { name: 'Mở mạch này trong ngspice' }).click()
  await expect(page).toHaveURL(/\/tools\/spice\?workspaceSpice=/)
  await expect(page.getByText('Mạch tương đương từ workspace · Mạch tự do R1 · DC')).toBeVisible()
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(page.getByText('Mô phỏng hoàn tất.', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('columnheader', { name: 'v(n2) · voltage' })).toBeVisible()
  await page.getByRole('link', { name: /Quay lại workspace/ }).click()
  await expect(page).toHaveURL(/\/build\/freestyle\?resume=1/)
  await expect(page.getByRole('button', { name: /^1N4148-TAP ·/ })).toBeVisible()
  const wires = await page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1')).doc.wires)
  expect(wires).toEqual(workspace.doc.wires)
})
