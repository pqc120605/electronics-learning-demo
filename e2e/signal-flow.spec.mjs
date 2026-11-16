import { expect, test } from '@playwright/test'

// Running a lesson shows level labels, moving dashes, the executing code line and a Serial log,
// all derived from the provider frame / logic trace.
async function openRunStep(page, lesson, board = 'esp32-devkit') {
  await page.goto(`/build?lesson=${lesson}&board=${board}`)
  await page.getByText('Dự đoán & chạy', { exact: true }).first().click()
  await page.getByRole('button', { name: '▶ Chạy mô phỏng' }).click()
  return page.locator('.signal-flow-panel').filter({visible:true})
}

test('ultrasonic run labels 5V / ECHO divider and highlights the LED write', async ({ page }, testInfo) => {
  const panel = await openRunStep(page, 'ultrasonic-distance')
  await expect(panel.locator('.signal-flow-legend')).toContainText('5V')
  await expect(panel.locator('.signal-flow-legend')).toContainText('ECHO ~3,3V')
  await expect(panel.locator('.signal-flow-code li.is-current')).toContainText('digitalWrite(ledPin, LOW)')
  await expect(panel.getByRole('log')).toContainText('pulseIn(ECHO)')
  await panel.scrollIntoViewIfNeeded()
  await testInfo.attach('ultrasonic-panel', { body: await panel.screenshot(), contentType: 'image/png' })

  await page.locator('.builder-view-switch').getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(page.locator('.schematic-flow-labels span').filter({ hasText: '5V' }).first()).toBeVisible()
  expect(await page.locator('.schematic-flow').count()).toBeGreaterThan(0)
  await page.locator('.schematic-canvas').scrollIntoViewIfNeeded()
  await testInfo.attach('ultrasonic-schematic', { body: await page.locator('.schematic-shell').screenshot(), contentType: 'image/png' })
})

test('blink serial log records each level change from the engine', async ({ page }) => {
  const panel = await openRunStep(page, 'blink', 'arduino-uno-r3')
  const log = panel.getByRole('log')
  await expect(log).toContainText('digitalWrite(13, HIGH) · LED sáng')
  await expect(log).toContainText('digitalWrite(13, LOW) · LED tắt', { timeout: 5000 })
  await expect(panel.locator('.signal-flow-code li.is-current')).toContainText('digitalWrite(ledPin,')
})

test('CircuitDocV2 lessons (ESP32 blink) also show the signal-flow panel', async ({ page }) => {
  const panel = (await openRunStep(page, 'blink')).filter({ visible: true })
  await expect(panel.getByRole('log')).toContainText('digitalWrite(23, HIGH) · LED sáng')
  await expect(panel.locator('.signal-flow-code li.is-current')).toBeVisible()
})

test('concept lessons say the flow is illustrative', async ({ page }) => {
  await page.goto('/build?lesson=mosfet-switch&board=esp32-devkit')
  await page.getByText('Dự đoán & chạy', { exact: true }).first().click()
  await expect(page.locator('.signal-flow-panel .signal-flow-badge')).toContainText('minh họa')
})

test('reduced motion stops the schematic dash animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openRunStep(page, 'ultrasonic-distance')
  await page.locator('.builder-view-switch').getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  const dash = page.locator('.schematic-flow').first()
  await expect(dash).toBeAttached()
  expect(await dash.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
})

test('schematic symbols and legacy cards never overlap in any lesson', async ({ page }) => {
  const lessons = ['blink', 'source-led', 'button-led', 'ir-alert', 'ultrasonic-distance', 'seven-segment-counter', 'buck-boost-concept', 'dc-motor-driver', 'mosfet-switch', 'analog-potentiometer', 'analog-ldr']
  for (const lesson of lessons) {
    await page.goto(`/build?lesson=${lesson}&board=arduino-uno-r3`)
    await page.locator('.builder-view-switch').getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
    const cards = page.locator('[data-schematic-part], .schematic-part-v2').filter({visible:true})
    await expect(cards.first()).toBeVisible()
    await page.waitForTimeout(300)
    const rects = await cards.evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { id: node.dataset.schematicPart ?? node.getAttribute('aria-label'), left: r.left, right: r.right, top: r.top, bottom: r.bottom } }))
    const overlaps = rects.flatMap((a, index) => rects.slice(index + 1).filter(b => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1).map(b => `${a.id}×${b.id}`))
    expect(overlaps, lesson).toEqual([])
  }
})

test('3D view spins the motor with the frame direction', async ({ page }, testInfo) => {
  await openRunStep(page, 'dc-motor-driver', 'arduino-uno-r3')
  await page.locator('.builder-view-switch').getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  const spin = page.locator('.assembly-motor-spin').first()
  await expect(spin).toBeVisible({ timeout: 20000 })
  await expect(spin).toHaveAttribute('data-motor-direction', '1')
  await expect(spin).toContainText('minh họa')
  expect(await spin.locator('b').evaluate(element => getComputedStyle(element).animationName)).toBe('assembly-motor-turn')
  await testInfo.attach('motor-3d', { body: await page.locator('.assembly-stage-view').screenshot(), contentType: 'image/png' })
})

test('3D ultrasonic run labels supply and ECHO wires like the 2D panel', async ({ page }) => {
  await openRunStep(page, 'ultrasonic-distance', 'arduino-uno-r3')
  await page.locator('.builder-view-switch').getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  const chips = page.locator('.assembly-chip')
  await expect(chips.first()).toBeVisible({ timeout: 20000 })
  const labels = await chips.allTextContents()
  expect(labels).toEqual(expect.arrayContaining(['GND']))
  expect(labels.some(label => /ECHO|TRIG/.test(label))).toBe(true)
})

test('reduced motion freezes the 3D motor spin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openRunStep(page, 'dc-motor-driver', 'arduino-uno-r3')
  await page.locator('.builder-view-switch').getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  const spin = page.locator('.assembly-motor-spin b').first()
  await expect(spin).toBeVisible({ timeout: 20000 })
  expect(await spin.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
})
