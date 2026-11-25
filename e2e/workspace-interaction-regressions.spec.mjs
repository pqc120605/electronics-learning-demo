import { test, expect } from '@playwright/test'

test('selecting a component body in the lesson opens that component in the inspector', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/learn/button-led?board=esp32-devkit')
  const lab = page.locator('.button-lab')
  const editor = lab.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  const led = editor.locator('[data-diagram-part="led-1"] .diagram-part-body-control')

  await led.click()

  const tabs = lab.getByRole('group', { name: 'Chọn nội dung bài học' })
  await expect(tabs.getByRole('button', { name: 'Linh kiện' })).toHaveAttribute('aria-pressed', 'true')
  await expect(lab.locator('.button-lab-pane:not([hidden]) h3')).toContainText('LED')
})

test('breadboard diagram exposes one tab stop for holes and supports arrow navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/learn/button-led?board=esp32-devkit')
  const editor = page.locator('.button-lab').getByRole('region', { name: 'Lắp mạch trên breadboard' })
  const svgHoles = editor.locator('svg .diagram-hole-hit-target')

  await expect.poll(() => svgHoles.evaluateAll(items => items.filter(item => item.tabIndex === 0).length)).toBe(1)
  const firstHole = editor.locator('svg [data-circuit-endpoint="bb1:1a"]')
  await firstHole.focus()
  await firstHole.press('ArrowRight')
  await expect(editor.locator('svg [data-circuit-endpoint="bb1:2a"]')).toBeFocused()

  const grid = editor.locator('details.breadboard-grid-details')
  await grid.locator('summary').click()
  await expect.poll(() => grid.locator('button[data-hole-id]').evaluateAll(items => items.filter(item => item.tabIndex === 0).length)).toBe(4)
})

test('read-only lesson preview never renders wire mutation controls until a local draft exists', async ({ page }) => {
  await page.goto('/app/lab?board=esp32-devkit')
  const legacyWorkspace = {
    schemaVersion: 4,
    lesson: 'blink',
    board: 'esp32-devkit',
    placed: [
      { id: 'board-1', type: 'board', x: 50, y: 50 },
      { id: 'bb-1', type: 'breadboard', x: 70, y: 45 },
      { id: 'res-1', type: 'resistor', x: 60, y: 70, value: '220 Ω' },
      { id: 'led-1', type: 'led', x: 80, y: 70 },
    ],
    wires: [
      { id: 'w-gpio-to-resistor', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'res-1', pinId: 'a' } },
      { id: 'w-resistor-to-led', from: { partId: 'res-1', pinId: 'b' }, to: { partId: 'led-1', pinId: 'anode' } },
      { id: 'w-led-to-gnd', from: { partId: 'led-1', pinId: 'cathode' }, to: { partId: 'board-1', pinId: 'gnd' } },
    ],
    code: 'void setup() {}',
    projectName: 'Read-only preview regression',
  }
  await page.evaluate(value => localStorage.setItem('machmo-builder-session', JSON.stringify(value)), legacyWorkspace)
  await page.reload()
  await page.getByRole('button', { name: 'Tiếp tục lắp mạch' }).click()
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const migrationGate = page.getByRole('region', { name: 'Lưu và chỉnh mạch phiên bản 5' })
  const editor = migrationGate.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await expect(editor.getByRole('heading', { name: 'Breadboard và dây nối', exact: true })).toHaveCount(1)
  const wire = editor.locator('[data-diagram-wire]').first()

  await wire.focus()
  await wire.press('Enter')
  await expect(editor.getByRole('region', { name: /^Chỉnh dây/ })).toHaveCount(0)
  await expect(editor.getByRole('button', { name: /^Xóa dây/ })).toHaveCount(0)

  await migrationGate.getByRole('button', { name: 'Chấp nhận preview và tạo v5', exact: true }).click()
  await expect(page.getByText('Đã tạo bản nháp để chỉnh dây. Bản cũ vẫn có thể khôi phục.')).toBeVisible()
  const circuitGatePanel = page.locator('[aria-label="Kiểm tra mạch CircuitDocV2"]')
  await expect(circuitGatePanel).toBeAttached()
  const structureGate = circuitGatePanel.locator('.circuit-gate-list > li[data-status]').first()
  await expect(structureGate).not.toContainText('expect.netCount')
  await expect(structureGate).not.toHaveAttribute('data-status', 'fail')
  await wire.focus()
  await wire.press('Enter')
  await expect(editor.getByRole('region', { name: /^Chỉnh dây/ })).toBeVisible()
})

test('CircuitDocV2 lesson trace is available and highlights the same circuit across views', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Dự đoán & chạy', exact: true }).click()

  const run = page.getByRole('button', { name: '▶ Chạy mô phỏng', exact: true })
  await expect(run).toBeEnabled()
  await run.click()
  await expect(page.locator('.builder-guidance-label')).toContainText('Mạch: Đang chạy')

  const breadboard = page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true })
  await breadboard.click()
  const editor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await expect(editor.locator('.diagram-wire.is-active')).toHaveCount(4)

  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(page.locator('.circuit-net-line.net-active').first()).toBeVisible()

  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  await expect(page.locator('.assembly-stage-flow')).toContainText('Luồng logic minh họa')
  await expect(page.locator('.assembly-stage-flow li')).not.toHaveCount(0)

  await page.getByRole('button', { name: 'Tạm dừng mô phỏng', exact: true }).click()
})

test('selecting a schematic component highlights the same part on the breadboard', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  const resistorSymbol = page.locator('.schematic-part-v2').filter({ has: page.locator('[data-part-id="res-1"]') })
  await resistorSymbol.focus()
  await resistorSymbol.press('Enter')
  await expect(resistorSymbol).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const selectedResistor = page.locator('[data-diagram-part="res-1"].is-selected')
  await expect(selectedResistor).toHaveCount(1)
  await expect(selectedResistor.locator('.diagram-part-body-control')).toHaveAttribute('aria-pressed', 'true')

  const ledPart = page.locator('[data-diagram-part="led-1"] .diagram-part-body-control')
  await ledPart.focus()
  await ledPart.press('Enter')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  const selectedLedSymbol = page.locator('.schematic-part-v2').filter({ has: page.locator('[data-part-id="led-1"]') })
  await expect(selectedLedSymbol).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  const ledInScene = page.locator('.assembly-parts li button').filter({ hasText: 'LED' })
  await expect(ledInScene).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.assembly-parts li button').filter({ hasText: '220 Ω' }).click()
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(resistorSymbol).toHaveAttribute('aria-pressed', 'true')
})

test('selecting a schematic net cross-highlights all of its breadboard wires', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()

  const netList = page.locator('.circuit-schematic-net-list')
  await netList.locator('summary').click()
  const groundNet = netList.locator('li').filter({ hasText: '2 dây' })
  await expect(groundNet).toHaveCount(1)
  const netKey = await groundNet.getAttribute('data-net-key')
  expect(netKey).not.toBeNull()
  await groundNet.getByRole('button').click()
  await expect(page.locator(`.circuit-net-line.net-cross-probed[data-net-key="${netKey}"]`)).toHaveCount(1)

  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const highlighted = page.locator('[data-diagram-wire].is-net-highlighted')
  await expect(highlighted).toHaveCount(2)
  await expect(page.locator('[data-diagram-wire="w-led-cathode-to-rail"].is-net-highlighted')).toHaveCount(1)
  await expect(page.locator('[data-diagram-wire="w-rail-to-gnd"].is-net-highlighted')).toHaveCount(1)

  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  await expect(page.locator('.assembly-net-cross-probe')).toContainText(netKey ?? '')

  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const wireList = page.locator('.breadboard-wire-list')
  await wireList.locator('summary').click()
  await wireList.getByRole('button', { name: /^w-resistor-to-led:/ }).click()
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(page.locator('.circuit-net-line.net-cross-probed')).toHaveCount(1)
  await expect(page.locator(`.circuit-net-line.net-cross-probed[data-net-key="${netKey}"]`)).toHaveCount(0)
})

test('selecting a schematic pin cross-probes the corresponding breadboard pin', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()

  const resistorPin = page.locator('.schematic-terminal[data-pin-key="res-1:a"]')
  await resistorPin.focus()
  await resistorPin.press('Enter')
  await expect(resistorPin).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  await expect(page.locator('.diagram-part-pin[data-circuit-endpoint="res-1:a"].is-selected')).toHaveCount(1)

  const ledAnode = page.locator('.diagram-part-pin[data-circuit-endpoint="led-1:anode"]')
  await ledAnode.focus()
  await ledAnode.press('Enter')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(page.locator('.schematic-terminal[data-pin-key="led-1:anode"]')).toHaveAttribute('aria-pressed', 'true')
})

test('selecting a schematic pin shows the same endpoint in the 3D scene', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()

  const resistorPin = page.locator('.schematic-terminal[data-pin-key="res-1:a"]')
  await resistorPin.focus()
  await resistorPin.press('Enter')
  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()

  const selectedPin = page.locator('.assembly-selected-pin-marker')
  await expect(selectedPin).toHaveAttribute('data-pin-key', 'res-1:a')
  await expect(selectedPin).toContainText('Chân đang xem')
  await expect(selectedPin).toContainText('model 3D')

  await page.getByRole('button', { name: 'LED', exact: true }).click()
  await expect(selectedPin).toHaveCount(0)
})

test('CircuitDocV2 breadboard connects a board pin to a real hole and can remove that wire', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Tạo bản nháp để chỉnh sửa', exact: true }).click()

  const editor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(4)
  await editor.getByRole('button', { name: 'Chọn chân board-1 3V3', exact: true }).click()
  await editor.locator('.diagram-hole-hit-target[data-circuit-endpoint="bb1:25j"]').click()

  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(5)
  const newWire = editor.locator('[data-diagram-wire="wire-v2-5"]')
  // The newly connected hole can be visible while the jumper runs above the pane.
  await newWire.scrollIntoViewIfNeeded()
  const wirePoint = await newWire.evaluate(element => {
    const path = element.querySelector('path.diagram-wire-color')
    if (!(path instanceof SVGPathElement)) return null
    const matrix = path.getScreenCTM()
    if (!matrix) return null
    const length = path.getTotalLength()
    for (let step = 1; step < 100; step += 1) {
      const point = new DOMPoint(path.getPointAtLength(length * step / 100).x, path.getPointAtLength(length * step / 100).y).matrixTransform(matrix)
      if (document.elementFromPoint(point.x, point.y)?.closest('[data-diagram-wire]') === element) return { x: point.x, y: point.y }
    }
    return null
  })
  expect(wirePoint).not.toBeNull()
  await page.mouse.click(wirePoint.x, wirePoint.y)
  await expect(editor.getByRole('region', { name: 'Chỉnh dây wire-v2-5' })).toBeVisible()
  await editor.getByRole('button', { name: 'Xóa dây wire-v2-5', exact: true }).click()
  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(4)
})

test('PCB copper view fits the CAD board outline instead of leaving a tall empty canvas', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/app/boards?board=esp32-devkit&view=2d')
  const svg = page.locator('.pcb2d-svg')
  await expect(svg).toBeVisible()
  await expect(svg.locator('.pcb-board-surface')).toHaveCount(1)

  const coverage = await svg.evaluate(element => {
    const outline = element.querySelector('.pcb-board-surface')
    if (!(outline instanceof SVGGraphicsElement)) return null
    const board = outline.getBBox()
    const view = element.viewBox.baseVal
    const rect = element.getBoundingClientRect()
    return {
      boardWidth: board.width / view.width,
      boardHeight: board.height / view.height,
      viewportAspect: rect.width / rect.height,
      viewBoxAspect: view.width / view.height,
    }
  })
  expect(coverage).not.toBeNull()
  expect(coverage?.boardWidth).toBeGreaterThan(0.8)
  expect(coverage?.boardHeight).toBeGreaterThan(0.8)
  expect(coverage?.viewportAspect).toBeCloseTo(coverage?.viewBoxAspect ?? 0, 1)
  await testInfo.attach('pcb2d-board-fit', { body: await svg.screenshot(), contentType: 'image/png' })
})

test('PCB copper viewer stays within a 375px screen and switches layers without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/boards?board=esp32-devkit&view=2d')
  const panel = page.getByRole('region', { name: 'Khám phá lớp đồng PCB 2D' })
  const svg = panel.locator('.pcb2d-svg')
  await expect(svg).toBeVisible()
  await panel.getByRole('button', { name: 'Mặt dưới · B.Cu' }).click()
  await expect(svg).toHaveAttribute('aria-label', /mặt dưới/)

  const widths = await panel.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }))
  const documentWidths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1)
  expect(documentWidths.scroll).toBeLessThanOrEqual(documentWidths.client + 1)
})

const rawDiagnosticStorage = page => page.evaluate(() => Object.fromEntries(
  ['localStorage', 'sessionStorage'].map(name => [name, Object.fromEntries(Object.entries(window[name]).filter(([key]) => /machmo-builder|machmo.*draft/.test(key)).sort(([a], [b]) => a.localeCompare(b)))])
))

for (const width of [375, 1440]) test(`diagnostic pin and LED inspection preserve storage and keyboard return at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  await page.getByRole('button', { name: 'Tạo bản nháp để chỉnh sửa', exact: true }).click()
  const editor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await editor.locator('.breadboard-wire-list summary').click()
  await editor.locator('.breadboard-wire-list').getByRole('button', { name: /^w-resistor-to-led:/ }).click()
  await editor.getByRole('button', { name: 'Xóa dây w-resistor-to-led', exact: true }).click()
  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(3)
  const panel = page.getByRole('region', { name: 'Kiểm tra mạch CircuitDocV2', exact: true })
  const pinFinding = panel.locator('.circuit-gate-diagnostics li').filter({ hasText: 'led-1:anode' })
  const pinAction = pinFinding.getByRole('button', { name: 'Xem chân', exact: true })
  await expect(pinAction).toHaveCount(1)
  // A pending click-to-connect must be discarded even when inspection retains this view.
  await editor.getByRole('button', { name: 'Chọn chân board-1 3V3', exact: true }).click()
  const before = await rawDiagnosticStorage(page)
  await pinAction.focus()
  await pinAction.press('Enter')
  const selected = editor.locator('.diagram-part-pin[data-circuit-endpoint="led-1:anode"].is-selected')
  await expect(selected).toHaveCount(1)
  await expect(selected).toBeFocused()
  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(3)
  await page.getByRole('button', { name: 'Quay lại chẩn đoán', exact: true }).click()
  await expect(pinAction).toBeFocused()
  await expect.poll(() => rawDiagnosticStorage(page)).toEqual(before)
  const ledFinding = panel.locator('[data-status] > details').filter({ has: page.locator('.circuit-gate-id', { hasText: 'G8' }) })
  await ledFinding.getByRole('button', { name: 'Xem linh kiện', exact: true }).click()
  await expect(editor.locator('[data-diagram-part="led-1"].is-selected')).toHaveCount(1)
  await expect(editor.locator('.diagram-part-pin.is-selected')).toHaveCount(0)
  await expect.poll(() => rawDiagnosticStorage(page)).toEqual(before)
  await page.getByRole('button', { name: 'PCB 2D · đường đồng', exact: true }).click()
  await pinAction.click()
  await expect(page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.circuit-diagnostic-inspection')).toContainText('PCB tham chiếu')
  await expect(page.locator('.schematic-terminal[data-pin-key="led-1:anode"]')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => rawDiagnosticStorage(page)).toEqual(before)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  // First click after inspection starts a fresh gesture, rather than completing the old one.
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  await editor.locator('.diagram-hole-hit-target[data-circuit-endpoint="bb1:25j"]').click()
  await expect(editor.locator('[data-diagram-wire]')).toHaveCount(3)
  await expect.poll(() => rawDiagnosticStorage(page)).toEqual(before)
})

test('read-only diagnostic wire inspection selects its current net without creating a draft', async ({ page }) => {
  // An explicit connected-open declaration produces a target while retaining schema validity.
  await page.goto('/app/lab?lesson=blink&guided=1&board=esp32-devkit')
  const panel = page.getByRole('region', { name: 'Kiểm tra mạch CircuitDocV2', exact: true })
  await panel.locator('.builder-check-details > summary').click()
  const action = panel.getByRole('button', { name: 'Xem dây', exact: true }).first()
  // Default board presentation has actionable G6 routing warnings; inspection stays read-only.
  await expect(action).toBeVisible()
  const before = await rawDiagnosticStorage(page)
  await action.focus()
  await action.press('Enter')
  await expect(page.locator('.circuit-diagnostic-inspection')).toBeVisible()
  await expect(page.locator('[data-diagram-wire].is-selected')).toHaveCount(1)
  await expect(page.locator('[data-diagram-wire].is-net-highlighted').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tạo bản nháp để chỉnh sửa', exact: true })).toBeVisible()
  await expect.poll(() => rawDiagnosticStorage(page)).toEqual(before)
})
