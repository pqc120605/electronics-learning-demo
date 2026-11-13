import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('mobile selected-wire controls remain fully exposed above the playback console', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/learn/button-led')
  const lab = page.locator('.button-lab')
  const editor = lab.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await editor.getByRole('combobox', { name: 'Chọn dây' }).selectOption('w-input-to-button')
  const wire = editor.getByRole('region', { name: 'Chỉnh dây w-input-to-button' })
  for (const state of ['read', 'branch', 'write', 'stale']) {
    if (state === 'branch' || state === 'write') await lab.getByRole('button', { name: 'Bước sau', exact: true }).click()
    if (state === 'stale') await wire.getByRole('combobox', { name: 'Đổi loại dây' }).selectOption('ground')
    await lab.locator('.button-lab-stage-scroll').evaluate(stage => { stage.scrollTop = 0 })
    for (const control of [
      editor.getByRole('button', { name: 'Chọn', exact: true }),
      editor.getByRole('button', { name: 'Nối dây', exact: true }),
      wire.getByRole('button', { name: 'Đổi điểm bắt đầu' }),
      wire.getByRole('button', { name: 'Đổi điểm kết thúc' }),
      wire.getByRole('combobox', { name: 'Đổi loại dây' }),
      wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }),
      lab.getByRole('button', { name: 'Khôi phục mạch' }),
    ]) await expect(control).toBeInViewport({ ratio: 1 })
    await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', state === 'stale' ? 'stale' : 'ready')
    await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-event', state === 'stale' ? '' : state)
  }
  await wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }).click()
  await expect(wire).toHaveCount(0)
  await lab.getByRole('button', { name: 'Khôi phục mạch' }).click()
  await expect(editor.getByRole('combobox', { name: 'Chọn dây' }).locator('option:not([value=""])')).toHaveCount(5)
  expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([375, 812])
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`3D event marker excludes selected pins outside the current frame at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/app/learn/button-led')
    const lab = page.locator('.button-lab')
    const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
    const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
    const selection = lab.getByTestId('button-lab-selection')
    const marker = lab.locator('.assembly-pin-marker')
    await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
    await views.getByRole('button', { name: '3D', exact: true }).click()
    const fallback = lab.getByText(/chưa mở được WebGL 2/)
    await expect(lab.locator('.assembly-stage-view canvas').or(fallback)).toBeVisible()
    test.skip(await fallback.isVisible(), 'WebGL unavailable; actual 3D marker checks not run')
    await expect(marker).toContainText('GPIO 18')
    await expect(selection).toHaveText('board-1:input')
    await controls.getByRole('button', { name: 'Bước sau' }).click()
    await expect(marker).toContainText('GPIO 18')
    await controls.getByRole('button', { name: 'Bước sau' }).click()
    await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-event', 'write')
    await expect(marker).toHaveCount(0)
    await expect(selection).toHaveText('board-1:input')
    await controls.getByRole('button', { name: 'Về bước đầu' }).click()
    await expect(marker).toContainText('GPIO 18')
    await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
    await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', 'stale')
    await expect(marker).toHaveCount(0)
    await expect(selection).toHaveText('board-1:input')
    await testInfo.attach(`3d-marker-stale-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' })
  })
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`signal playback follows one event across projections at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/app/learn/button-led')
    const lab = page.locator('.button-lab')
    const status = lab.locator('.button-lab-result')
    const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
    const next = controls.getByRole('button', { name: 'Bước sau' })
    const previous = controls.getByRole('button', { name: 'Bước trước' })
    const replay = controls.getByRole('button', { name: 'Về bước đầu' })
    const run = lab.getByRole('button', { name: 'Chạy lại', exact: true })
    const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
    const mobile = lab.getByRole('navigation', { name: 'Chế độ xem trên điện thoại' })
    const schematic = lab.locator('.circuit-schematic-v2')
    const expectStep = async (step, kind) => {
      await expect(status).toHaveAttribute('data-event', kind)
      await expect(status).toContainText(`Bước ${step}/3`)
      await expect(status).toContainText(/Dòng \d+/)
      await expect(status.locator('code')).not.toBeEmpty()
    }
    await expect(controls).toBeVisible()
    await expect(previous).toBeDisabled()
    await expectStep(1, 'read')
    await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
    await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
    await lab.locator('[data-circuit-endpoint="bb1:20g"]').scrollIntoViewIfNeeded()
    await lab.locator('[data-circuit-endpoint="board-1:input"]').scrollIntoViewIfNeeded()
    await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"][data-wire-id="w-input-to-button"]')).toHaveCount(1)
    await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).toHaveAttribute('data-lesson-active', '')
    await expect(lab.locator('[data-circuit-endpoint="board-1:ledOut"]')).not.toHaveAttribute('data-lesson-active', '')
    await next.focus()
    await next.press('Space')
    await expectStep(2, 'branch')
    await views.getByRole('button', { name: 'Sơ đồ', exact: true }).click()
    await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(1)
    await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).toHaveClass(/net-active/)
    await expectStep(2, 'branch')
    await next.press('Enter')
    await expectStep(3, 'write')
    await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
    await expect(next).toBeDisabled()
    await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(2)
    await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).not.toHaveClass(/net-active/)
    await views.getByRole('button', { name: '3D', exact: true }).click()
    await expect(lab.locator('.assembly-stage-view canvas').or(lab.getByText(/chưa mở được WebGL 2/))).toBeVisible()
    await expectStep(3, 'write')
    await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
    await views.getByRole('button', { name: 'Breadboard', exact: true }).click()
    await expect(lab.locator('[data-circuit-endpoint="res-1:b"]')).toHaveAttribute('data-lesson-active', '')
    await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).not.toHaveAttribute('data-lesson-active', '')
    await replay.press('Enter')
    await expectStep(1, 'read')
    await controls.getByRole('button', { name: 'Phát trace' }).press('Enter')
    await expect(controls.getByRole('button', { name: 'Tạm dừng trace' })).toBeVisible()
    await controls.getByRole('button', { name: 'Tạm dừng trace' }).press('Space')
    const paused = await status.getAttribute('data-event')
    await page.waitForTimeout(1400)
    await expect(status).toHaveAttribute('data-event', paused)
    await controls.getByRole('button', { name: 'Phát trace' }).click()
    await expectStep(3, 'write')
    await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeVisible()

    await controls.getByRole('button', { name: 'Phát trace' }).click()
    await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
    await expect(status).toHaveAttribute('data-state', 'stale')
    await expect(status).toHaveAttribute('data-event', '')
    await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
    await expect(next).toBeDisabled()
    await expect(controls.getByRole('button', { name: 'Tạm dừng trace' })).toHaveCount(0)
    await run.click()
    await expectStep(1, 'read')
    await expect(status).toContainText('LOW → if → LED sáng')
    await lab.getByRole('button', { name: 'Khôi phục mạch', exact: true }).click()
    await expect(status).toHaveAttribute('data-state', 'stale')
    await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
    await run.click()
    if (viewport.width === 375) await mobile.getByRole('button', { name: 'Code', exact: true }).click()
    else await lab.getByRole('group', { name: 'Chọn nội dung bài học' }).getByRole('button', { name: 'Code', exact: true }).click()
    const code = lab.getByRole('textbox', { name: 'Code bài nút nhấn' })
    const sample = await code.inputValue()
    await code.fill(`${sample}\n// changed`)
    await expect(status).toHaveAttribute('data-state', 'stale')
    await expect(status).toHaveAttribute('data-event', '')
    await code.fill('unsupported')
    await run.click()
    await expect(status).toHaveAttribute('data-state', 'unsupported')
    await expect(lab.locator('[data-lesson-active]')).toHaveCount(0)
    await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeDisabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await testInfo.attach(`signal-playback-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' })
  })
}

test('reduced motion keeps signal playback manual and stops an active timer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/app/learn/button-led')
  const lab = page.locator('.button-lab')
  const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
  const status = lab.locator('.button-lab-result')
  await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeDisabled()
  await page.waitForTimeout(1400)
  await expect(status).toHaveAttribute('data-event', 'read')
  await controls.getByRole('button', { name: 'Bước sau' }).press('Enter')
  await expect(status).toHaveAttribute('data-event', 'branch')
  await controls.getByRole('button', { name: 'Bước trước' }).press('Space')
  await expect(status).toHaveAttribute('data-event', 'read')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await controls.getByRole('button', { name: 'Phát trace' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(controls.getByRole('button', { name: 'Phát trace' })).toBeDisabled()
  const paused = await status.getAttribute('data-event')
  await page.waitForTimeout(1400)
  await expect(status).toHaveAttribute('data-event', paused)
})

for (const { width, height, keyboard } of [
  { width: 1440, height: 900, keyboard: true },
  { width: 375, height: 812, keyboard: false },
]) {
  test(`button LED wiring preserves endpoint identity and rejects invalid edits at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.goto('/app/learn/button-led')
    const lab = page.locator('.button-lab')
    const editor = lab.getByRole('region', { name: 'Lắp mạch trên breadboard' })
    const select = editor.getByRole('button', { name: 'Chọn', exact: true })
    const connect = editor.getByRole('button', { name: 'Nối dây', exact: true })
    const mode = editor.locator('.breadboard-interaction-status')
    const wire = editor.getByRole('region', { name: 'Chỉnh dây lesson-wire-1' })
    const list = editor.getByRole('combobox', { name: 'Chọn dây' })
    const role = wire.getByRole('combobox', { name: 'Đổi loại dây' })
    const trace = lab.locator('.button-lab-result')
    const endpoint = id => editor.locator(`[data-circuit-endpoint="${id}"]`)
    const activate = (control, key = 'Enter') => keyboard ? control.press(key) : control.click()
    const choose = (id, key) => activate(endpoint(id), key)
    const newWire = () => list.locator('option[value="lesson-wire-1"]')
    const geometry = lab.locator('.button-lab-wire-overlay path[data-wire-id="lesson-wire-1"]')
    const wireCount = count => expect(list.locator('option:not([value=""])')).toHaveCount(count)
    const expectOneScreen = async () => {
      expect(await page.evaluate(() => {
        const root = document.documentElement
        return [root.scrollWidth - root.clientWidth, root.scrollHeight - root.clientHeight, window.scrollY]
      })).toEqual([0, 0, 0])
    }

    await expect(select).toHaveAttribute('aria-pressed', 'true')
    await expect(select).toBeInViewport()
    await expect(connect).toBeInViewport()
    await choose('board-1:vcc', 'Space')
    await expect(mode).toContainText('board-1:vcc')
    await choose('bb1:2a')
    await expect(mode).toContainText('bb1:2a')
    await wireCount(5)

    await activate(connect)
    await expect(mode).toContainText('Chọn điểm bắt đầu')
    await choose('board-1:vcc', 'Space')
    await expect(mode).toContainText('Chọn điểm kết thúc')
    await expect(mode).toContainText('board-1:vcc')
    await choose('board-1:vcc')
    await expect(editor.getByRole('alert')).toContainText(/hai điểm khác nhau.*board-1:vcc/)
    await wireCount(5)
    await activate(editor.getByRole('button', { name: 'Hủy nối dây' }))
    await expect(select).toHaveAttribute('aria-pressed', 'true')
    await wireCount(5)

    await activate(connect)
    await editor.getByRole('combobox', { name: 'Loại dây mới' }).selectOption('power')
    await choose('board-1:vcc', 'Space')
    await choose('bb1:3a')
    await wireCount(6)
    await expect(mode).toContainText('board-1:vcc')
    await expect(mode).toContainText('bb1:3a')
    await expect(newWire()).toContainText(/board-1:vcc.*bb1:3a.*Nguồn dương.*bb1:3a/)
    await expect(role).toHaveValue('power')
    await expect(geometry).toHaveAttribute('data-role', 'power')
    await expect(trace).toHaveAttribute('data-state', 'stale')

    await activate(lab.getByRole('button', { name: 'Chạy lại' }))
    await expect(trace).toHaveAttribute('data-state', 'ready')
    await activate(wire.getByRole('button', { name: 'Đổi điểm bắt đầu' }))
    if (keyboard) {
      await endpoint('bb1:3a').press('ArrowRight')
      await expect(endpoint('bb1:4a')).toBeFocused()
      await page.keyboard.press('Space')
    } else {
      await choose('bb1:4a')
    }
    await expect(newWire()).toContainText(/bb1:4a.*bb1:3a.*Nguồn dương.*bb1:3a/)
    await expect(trace).toHaveAttribute('data-state', 'stale')
    await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"]')).toHaveCount(0)
    await activate(wire.getByRole('button', { name: 'Đổi điểm kết thúc' }))
    await choose('bb1:5a')
    await expect(newWire()).toContainText(/bb1:4a.*bb1:5a.*Nguồn dương.*bb1:4a/)
    await lab.getByRole('group', { name: 'Chọn hình chiếu mạch' }).getByRole('button', { name: 'Sơ đồ' }).click()
    await expect(lab.locator('.circuit-net-line[data-net-key="bb1:4a"]')).toHaveAttribute('data-lesson-net-selected', '')
    await lab.getByRole('group', { name: 'Chọn hình chiếu mạch' }).getByRole('button', { name: 'Breadboard' }).click()

    await activate(lab.getByRole('button', { name: 'Chạy lại' }))
    await expect(trace).toHaveAttribute('data-state', 'ready')
    const beforeReject = await list.locator('option').allTextContents()
    await activate(wire.getByRole('button', { name: 'Đổi điểm kết thúc' }))
    await choose('bb1:10c')
    await expect(editor.getByRole('alert')).toContainText(/bb1:10c.*chân linh kiện/)
    await choose('bb1:10a', 'Space')
    await expect(editor.getByRole('alert')).toContainText(/bb1:10a.*đã được dùng làm đầu dây/)
    expect(await list.locator('option').allTextContents()).toEqual(beforeReject)
    await expect(trace).toHaveAttribute('data-state', 'ready')
    await activate(select)
    await choose('bb1:2a')
    expect(await list.locator('option').allTextContents()).toEqual(beforeReject)

    await list.selectOption('lesson-wire-1')
    await role.selectOption('ground')
    await expect(newWire()).toContainText(/bb1:4a.*bb1:5a.*GND.*bb1:4a/)
    await expect(geometry).toHaveAttribute('data-role', 'ground')
    await expect(trace).toHaveAttribute('data-state', 'stale')
    await lab.locator('.button-lab-stage-scroll').evaluate(stage => { stage.scrollTop = 0 })
    await expect(select).toBeInViewport()
    await expect(connect).toBeInViewport()
    await expect(wire.getByRole('button', { name: 'Đổi điểm bắt đầu' })).toBeInViewport()
    await expect(wire.getByRole('button', { name: 'Đổi điểm kết thúc' })).toBeInViewport()
    await expect(role).toBeInViewport()
    await expect(wire.getByRole('button', { name: 'Xóa dây lesson-wire-1' })).toBeInViewport()
    await expect(lab.getByRole('button', { name: 'Khôi phục mạch' })).toBeInViewport()
    await expectOneScreen()
    const screenshot = testInfo.outputPath(`button-wiring-${width}x${height}.png`)
    await page.screenshot({ path: screenshot })
    await testInfo.attach(`button-wiring-${width}x${height}`, { path: screenshot, contentType: 'image/png' })
    await activate(wire.getByRole('button', { name: 'Xóa dây lesson-wire-1' }), 'Space')
    await expect(list).toHaveValue('')
    await expect(wire).toHaveCount(0)
    await expect(geometry).toHaveCount(0)
    await wireCount(5)
    await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"]')).toHaveCount(0)

    if (keyboard) {
      await connect.click()
      await endpoint('bb1:6a').scrollIntoViewIfNeeded()
      const from = await endpoint('bb1:6a').boundingBox()
      const to = await endpoint('bb1:7a').boundingBox()
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 })
      await page.mouse.up()
      await wireCount(6)
      await expect(list.locator('option[value="lesson-wire-2"]')).toContainText(/bb1:6a.*bb1:7a/)
    } else {
      await connect.click()
      await choose('bb1:6a')
      await choose('bb1:7a')
      await wireCount(6)
    }
    await activate(lab.getByRole('button', { name: 'Khôi phục mạch' }))
    await expect(select).toHaveAttribute('aria-pressed', 'true')
    await expect(list).toHaveValue('')
    await wireCount(5)
    expect(await list.locator('option:not([value=""])').evaluateAll(options => options.map(option => option.value))).toEqual([
      'w-gpio-to-resistor', 'w-led-cathode-to-rail', 'w-rail-to-gnd', 'w-input-to-button', 'w-button-to-gnd-rail',
    ])
    await expectOneScreen()
  })
}

test('button LED workspace keeps the desktop scene, navigation, and typed result in one viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/learn/button-led')
  const lab = page.locator('.button-lab')
  const status = lab.locator('.button-lab-result')
  const view = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
  const tabs = lab.getByRole('group', { name: 'Chọn nội dung bài học' })
  await expect(lab.getByRole('heading', { level: 1 })).toContainText(/nút nhấn/i)
  await expect(status).toContainText('HIGH → else → LED tắt')
  await expect(status).toContainText('Bộ diễn giải code giới hạn')
  await expect(lab.getByRole('link', { name: /Bài trước/ })).toBeInViewport()
  await expect(lab.getByRole('link', { name: /Bài sau/ })).toBeInViewport()
  await expect(view).toBeInViewport()
  await expect(lab.getByRole('radio', { name: 'Nhấn nút' })).toBeInViewport()
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.clientHeight)

  const press = lab.getByRole('radio', { name: 'Nhấn nút' })
  const release = lab.getByRole('radio', { name: 'Thả nút' })
  await press.check()
  await lab.getByRole('button', { name: 'Chạy lại', exact: true }).click()
  await expect(status).toContainText('LOW → if → LED sáng')
  await release.focus()
  await release.press('Space')
  await lab.getByRole('button', { name: 'Chạy lại', exact: true }).click()
  await expect(status).toContainText('HIGH → else → LED tắt')
  await release.press('ArrowRight')
  await expect(press).toBeChecked()
  await lab.getByRole('button', { name: 'Chạy lại', exact: true }).click()
  await expect(status).toContainText('LOW → if → LED sáng')

  await tabs.getByRole('button', { name: 'Linh kiện' }).click()
  const wire = lab.locator('.button-lab-inspector').getByRole('button', { name: /w-input-to-button/ })
  await wire.click()
  await expect(lab.getByTestId('button-lab-selection')).toHaveText('w-input-to-button')
  await expect(wire).toHaveAttribute('data-active', 'true')
  await view.getByRole('button', { name: 'Sơ đồ' }).click()
  await expect(lab.locator('.circuit-net-line.net-selected')).toHaveCount(1)
  await expect(lab.locator('.circuit-net-line.net-active')).not.toHaveCount(0)
  const seriesNet = lab.locator('.circuit-net-line[data-net-key="bb1:14a"]')
  await seriesNet.locator('path[role="button"]').first().press('Enter')
  await expect(seriesNet).toHaveAttribute('data-lesson-net-selected', '')
  await expect(lab.getByTestId('button-lab-selection')).toHaveText('bb1:14a')
  await lab.locator('.schematic-part-v2[aria-label$="button-1"]').press('Space')
  await expect(lab.locator('.schematic-part-v2[aria-label$="button-1"]')).toHaveClass(/part-selected/)
  await wire.click()
  await view.getByRole('button', { name: '3D', exact: true }).click()
  await expect(lab.locator('.assembly-stage-view canvas').or(lab.getByText(/chưa mở được WebGL 2/))).toBeVisible()
  await expect(lab.getByTestId('button-lab-selection')).toHaveText('w-input-to-button')
  await expect(status).toContainText('LOW → if → LED sáng')

  await view.getByRole('button', { name: 'Breadboard' }).click()
  await expect(lab.locator('.button-lab-wire-overlay path[data-selected="true"]')).toHaveCount(1)
  await lab.getByRole('button', { name: 'Xóa dây w-input-to-button' }).click()
  await expect(status).toHaveAttribute('data-state', 'invalid')
  await expect(lab.getByTestId('button-lab-selection')).toHaveCount(0)
  await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"]')).toHaveCount(0)
  await lab.getByRole('button', { name: 'Khôi phục mạch' }).click()
  await expect(status).toHaveAttribute('data-state', 'stale')
  await lab.getByRole('button', { name: 'Chạy lại' }).click()
  await expect(status).toContainText('LOW → if → LED sáng')
  await testInfo.attach('button-lesson-desktop-1440x900', { body: await page.screenshot(), contentType: 'image/png' })
})

test('button LED mobile views preserve input, selection, and code and invalidate old results', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/learn/button-led')
  const lab = page.locator('.button-lab')
  const mobile = lab.getByRole('navigation', { name: 'Chế độ xem trên điện thoại' })
  const status = lab.locator('.button-lab-result')
  const pressed = lab.getByRole('radio', { name: 'Nhấn nút' })
  await expect(mobile.getByRole('button')).toHaveCount(4)
  await expect(status).toContainText('HIGH → else → LED tắt')
  await pressed.check()
  await lab.getByRole('button', { name: 'Chạy lại', exact: true }).click()
  await expect(status).toContainText('LOW → if → LED sáng')
  await mobile.getByRole('button', { name: 'Chi tiết' }).click()
  await lab.getByRole('button', { name: 'Linh kiện', exact: true }).click()
  await lab.locator('.button-lab-inspector').getByRole('button', { name: /button-1:contactA/ }).click()
  await expect(lab.getByTestId('button-lab-selection')).toHaveText('button-1:contactA')
  await mobile.getByRole('button', { name: 'Sơ đồ' }).click()
  await expect(lab.locator('.circuit-schematic-v2')).toBeVisible()
  await expect(lab.locator('.circuit-net-line[data-lesson-net-selected]')).toHaveCount(1)
  await mobile.getByRole('button', { name: 'Code' }).click()
  const code = lab.getByRole('textbox', { name: 'Code bài nút nhấn' })
  const sample = await code.inputValue()
  const inverted = sample.replace('== LOW', '== HIGH')
  await code.fill(inverted)
  await expect(status).toHaveAttribute('data-state', 'stale')
  await mobile.getByRole('button', { name: 'Mạch', exact: true }).click()
  await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"]')).toHaveCount(0)
  await mobile.getByRole('button', { name: 'Code' }).click()
  await expect(code).toHaveValue(inverted)
  await expect(pressed).toBeChecked()
  await lab.getByRole('button', { name: 'Chạy lại' }).click()
  await expect(status).toContainText('LOW → else → LED tắt')
  await code.fill(sample.replace('== LOW', '!= LOW'))
  await expect(status).toHaveAttribute('data-state', 'unsupported')
  await lab.getByRole('button', { name: 'Khôi phục code mẫu' }).click()
  await mobile.getByRole('button', { name: 'Chi tiết' }).click()
  await expect(lab.getByTestId('button-lab-selection')).toHaveText('button-1:contactA')
  await lab.getByRole('button', { name: 'Tổng quan' }).click()
  await lab.getByRole('combobox', { name: 'Board của bạn' }).selectOption('arduino-uno-r3')
  await expect(status).toHaveAttribute('data-state', 'unsupported')
  await expect(status).toContainText(/profile board/)
  await expect(pressed).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await testInfo.attach('button-lesson-mobile-375x812', { body: await page.screenshot(), contentType: 'image/png' })
  await lab.getByRole('link', { name: /Bài sau/ }).click()
  await expect(lab).toHaveCount(0)
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`teaching schematic preserves keyboard net selection and code highlights at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/app/learn/button-led')
    const lab = page.locator('.button-lab')
    const mobile = lab.getByRole('navigation', { name: 'Chế độ xem trên điện thoại' })
    const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
    const showSchematic = async () => {
      await (viewport.width === 375 ? mobile : views).getByRole('button', { name: 'Sơ đồ', exact: true }).click()
    }
    await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
    await lab.getByRole('button', { name: 'Chạy lại', exact: true }).click()
    await showSchematic()
    const schematic = lab.locator('.circuit-schematic-v2')
    await expect(schematic.locator('.net-active:not(.circuit-net-line)')).toHaveCount(0)
    await expect(schematic.locator('.circuit-net-bridges.bridge-active')).not.toHaveCount(0)
    await expect(schematic.locator('[data-symbol-state="open"]')).toHaveCount(1)
    await expect(schematic.locator('.schematic-role-marker[data-role="ground"]')).toHaveCount(1)
    await expect(schematic.locator('.schematic-crossing')).not.toHaveCount(0)
    const inputNet = schematic.locator('.circuit-net-line').filter({ has: page.getByRole('button', { name: 'Chọn net bb1:20a', exact: true }) })
    await expect(inputNet).toHaveClass(/net-active/)
    await inputNet.locator('path[role="button"]').first().press('Space')
    await expect(inputNet).toHaveAttribute('data-lesson-net-selected', '')
    await expect(lab.getByTestId('button-lab-selection')).toHaveText('bb1:20a')
    await testInfo.attach(`teaching-schematic-${viewport.width}x${viewport.height}`, { body: await page.screenshot(), contentType: 'image/png' })
    await (viewport.width === 375 ? mobile : views).getByRole('button', { name: viewport.width === 375 ? 'Mạch' : 'Breadboard', exact: true }).click()
    // Overlay geometry requires both endpoints inside their independent picker viewports.
    await lab.locator('[data-circuit-endpoint="bb1:20g"]').scrollIntoViewIfNeeded()
    await lab.locator('[data-circuit-endpoint="board-1:input"]').scrollIntoViewIfNeeded()
    await expect(lab.locator('.button-lab-wire-overlay path[data-selected="true"][data-wire-id="w-input-to-button"]')).toHaveCount(1)
    await expect(lab.locator('[data-circuit-endpoint="button-1:contactA"]')).toHaveAttribute('data-lesson-selected', '')
    if (viewport.width === 375) await mobile.getByRole('button', { name: 'Code', exact: true }).click()
    else await lab.getByRole('group', { name: 'Chọn nội dung bài học' }).getByRole('button', { name: 'Code', exact: true }).click()
    await expect(lab.getByRole('textbox', { name: 'Code bài nút nhấn' })).toHaveValue(/digitalRead/)
    await expect(lab.locator('.button-lab-result')).toContainText('LOW → if → LED sáng')
    await expect(lab.getByTestId('button-lab-selection')).toHaveText('bb1:20a')
    await showSchematic()
    await expect(lab.locator('.circuit-net-line[data-net-key="bb1:20a"]')).toHaveAttribute('data-lesson-net-selected', '')
    await expect(lab.locator('.circuit-net-line[data-net-key="bb1:20a"]')).toHaveClass(/net-active/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await schematic.locator('summary').click()
    await expect(schematic.locator('li[data-net-key="bb1:20a"] [data-hole-id="bb1:20g"]')).toBeVisible()
  })
}

test('an unknown board keeps the button lesson in a labeled reference view without 3D or trace', async ({ page }) => {
  await page.goto('/app/learn/button-led?board=unregistered-board')
  const lab = page.locator('.button-lab')
  await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', 'unsupported')
  await expect(lab.locator('.button-lab-board-notice')).toContainText(/Mạch mẫu theo ESP32/)
  await expect(lab.getByRole('button', { name: '3D', exact: true })).toBeDisabled()
  await expect(lab.locator('.button-lab-inspector').getByRole('link', { name: 'Mở phòng lắp mạch' })).toHaveCount(0)
  await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"]')).toHaveCount(0)
})

test('PCB copper viewer keeps controls readable in the warm interface and renders the selected CAD layer', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  await page.setViewportSize(viewport)
  await page.goto('/app/boards?board=esp32-devkit&view=2d')
  const panel = page.locator('.pcb2d-panel')
  await expect(panel).toBeVisible()
  await expect(panel.locator('.pcb2d-svg')).toBeVisible()
  const initial = await page.evaluate(async () => {
    const panel = document.querySelector('.pcb2d-panel')
    const manifest = await fetch('/boards/esp32-devkit-v1-30pin/manifest.json').then(response => response.json())
    const ratio = (foreground, background) => {
      const luminance = color => {
        const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]
      }
      const a = luminance(foreground), b = luminance(background)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }
    const select = panel.querySelector('.pcb2d-select-label select')
    const inspectorTitle = panel.querySelector('.pcb2d-inspector h4')
    const getContrast = element => ratio(getComputedStyle(element).color, getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(element.parentElement).backgroundColor : getComputedStyle(element).backgroundColor)
    return {
      selectContrast: getContrast(select),
      inspectorTitleContrast: getContrast(inspectorTitle),
      inspectorTextContrast: getContrast(panel.querySelector('.pcb2d-inspector p')),
      canvasSlackBelowDrawing: (() => {
        const wrap = panel.querySelector('.pcb2d-canvas-wrap').getBoundingClientRect()
        const caption = panel.querySelector('.pcb2d-canvas-caption').getBoundingClientRect()
        return wrap.bottom - caption.bottom
      })(),
      boardOutline: panel.querySelector('.pcb-board-surface')?.getAttribute('d') ?? '',
      frontFeatures: panel.querySelectorAll('.pcb-feature').length,
      frontExpected: manifest.copperFeatures.filter(feature => feature.layerId === 'F.Cu' || feature.layerId === 'both').length,
      frontZones: panel.querySelectorAll('.pcb-zone').length,
      frontExpectedZones: manifest.copperFeatures.filter(feature => feature.kind === 'zone' && (feature.layerId === 'F.Cu' || feature.layerId === 'both')).length,
    }
  })
  expect(initial.selectContrast).toBeGreaterThanOrEqual(4.5)
  expect(initial.inspectorTitleContrast).toBeGreaterThanOrEqual(4.5)
  expect(initial.inspectorTextContrast).toBeGreaterThanOrEqual(4.5)
  expect(initial.canvasSlackBelowDrawing).toBeLessThanOrEqual(4)
  expect(initial.boardOutline.match(/\bM\b/g) ?? []).toHaveLength(1)
  expect(initial.boardOutline.trim()).toMatch(/Z$/)
  expect(initial.frontFeatures).toBe(initial.frontExpected)
  expect(initial.frontZones).toBe(initial.frontExpectedZones)

  await panel.getByRole('button', { name: 'Mặt dưới · B.Cu' }).click()
  const back = await page.evaluate(async () => {
    const panel = document.querySelector('.pcb2d-panel')
    const manifest = await fetch('/boards/esp32-devkit-v1-30pin/manifest.json').then(response => response.json())
    return {
      features: panel.querySelectorAll('.pcb-feature').length,
      expected: manifest.copperFeatures.filter(feature => feature.layerId === 'B.Cu' || feature.layerId === 'both').length,
      zones: panel.querySelectorAll('.pcb-zone').length,
    }
  })
  expect(back.features).toBe(back.expected)
  expect(back.zones).toBe(0)

  const zoneToggle = panel.getByRole('checkbox', { name: 'Vùng đồng' })
  await zoneToggle.check()
  await panel.getByRole('button', { name: 'Mặt trên · F.Cu' }).click()
  await zoneToggle.uncheck()
  const withoutZones = await panel.locator('.pcb-feature').count()
  expect(withoutZones).toBe(initial.frontExpected - initial.frontExpectedZones)
  }
})

test('beginner follows curriculum to a ready guided lesson', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('link', { name: 'Bắt đầu bài LED', exact: true }).click()
  await page.getByRole('link', { name: /Thực hành|Bắt đầu thực hành/ }).first().click()
  await expect(page).toHaveURL(/\/app\/lab.*lesson=blink/)
  await expect(page.getByRole('heading', { name: 'Sẵn sàng chạy', exact: true })).toBeVisible()
})

test('learner discovers and completes the conceptual robot lesson across narrow and desktop viewports', async ({ page }) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/app')
    await page.getByRole('link', { name: /Bài học robot mô phỏng/ }).click()
    await expect(page.getByRole('heading', { name: 'Khám phá chuyển động của robot', exact: true })).toBeVisible()
    await expect(page.getByText(/Mô phỏng khái niệm/)).toBeVisible()
    for (const [name, expected] of [['Tiến', 'Đi thẳng'], ['Lùi', 'Lùi lại'], ['Rẽ trái', 'Rẽ trái'], ['Rẽ phải', 'Rẽ phải'], ['Dừng', 'Đứng yên']]) {
      await page.getByRole('button', { name, exact: true }).click()
      await expect(page.getByRole('status', { name: 'Trạng thái robot ảo' })).toContainText(expected)
    }
    await page.getByRole('button', { name: 'Thử tình huống chướng ngại vật', exact: true }).click()
    await expect(page.getByRole('status', { name: 'Trạng thái robot ảo' })).toContainText(/chướng ngại vật/i)
    for (const step of ['Quan sát hướng', 'Thử một lệnh', 'Gặp chướng ngại vật']) {
      await page.getByRole('button', { name: `Hoàn thành: ${step}`, exact: true }).click()
      await expect(page.getByRole('button', { name: `Đã hoàn thành: ${step}`, exact: true })).toHaveAttribute('aria-pressed', 'true')
    }
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
  }
})

test('real pointer drag creates exactly one wire and undo restores the circuit', async ({ page }, testInfo) => {
  await page.goto('/build?lesson=blink&guided=1&board=arduino-uno-r3')
  await page.getByRole('button', { name: 'Tự nối dây từ đầu', exact: true }).waitFor()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Tự nối dây từ đầu', exact: true }).click()
  const wires = page.locator('.builder-wires g')
  await expect(wires).toHaveCount(0)
  const start = page.locator('[data-wire-endpoint="board-1:ledOut"]')
  const end = page.locator('[data-wire-endpoint="res-1:a"]')
  await start.scrollIntoViewIfNeeded()
  const a = await start.boundingBox(), b = await end.boundingBox()
  expect(a).toBeTruthy(); expect(b).toBeTruthy()
  await page.evaluate(() => {
    window.wireGestureEvents=[]
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','dragstart','dragend'])document.addEventListener(type,e=>{
      if(window.wireGestureEvents.length<100)window.wireGestureEvents.push({type,target:e.target?.getAttribute?.('data-wire-endpoint')||e.target?.className})
    },true)
  })
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2)
  await page.mouse.down()
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20})
  await page.mouse.up()
  await testInfo.attach('wire-pointer-events',{body:JSON.stringify(await page.evaluate(()=>window.wireGestureEvents),null,2),contentType:'application/json'})
  await expect(wires).toHaveCount(1)
  await page.getByRole('button', { name: /Hoàn tác/ }).click()
  await expect(wires).toHaveCount(0)
})

async function prepareKeyboardWiring(page, viewName) {
  await page.goto('/build?lesson=blink&guided=1&board=arduino-uno-r3')
  const startWiring = page.getByRole('button', { name: 'Tự nối dây từ đầu', exact: true })
  await startWiring.waitFor()
  page.once('dialog', dialog => dialog.accept())
  await startWiring.click()
  await page.getByRole('button', { name: viewName, exact: true }).click()
}

async function tabConnectPins(page, first, second, wireLocator) {
  await expect(wireLocator).toHaveCount(0)
  const part = first.locator('xpath=ancestor::*[self::article or contains(concat(" ", normalize-space(@class), " "), " assembly3d-part ")]').first()
  await part.focus()
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  let reachedSecond = false
  for (let step = 0; step < 40; step++) {
    await page.keyboard.press('Tab')
    if (await second.evaluate(element => element === document.activeElement)) {
      reachedSecond = true
      break
    }
  }
  expect(reachedSecond, 'Tab should move focus from the first pin to the second pin').toBe(true)
  await page.keyboard.press('Enter')
  await expect(wireLocator).toHaveCount(1)
}

test('schematic pins can be connected with Tab and Enter', async ({ page }) => {
  await prepareKeyboardWiring(page, 'Sơ đồ nguyên lý')
  const first = page.getByRole('button', { name: /chân GPIO LED/ })
  const second = page.getByRole('button', { name: /chân Đầu 1/ })
  await tabConnectPins(page, first, second, page.locator('.schematic-wire'))
})

test('3D view pins can be connected with Tab and Enter', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null
      return getContext.call(this, type, ...args)
    }
  })
  await prepareKeyboardWiring(page, 'Lắp mạch · 3D')
  await expect(page.getByText('Trình duyệt này chưa mở được WebGL 2', { exact: false })).toBeVisible()
  const first = page.getByRole('button', { name: /chân GPIO LED/ })
  const second = page.getByRole('button', { name: /chân Đầu 1/ })
  await tabConnectPins(page, first, second, page.locator('.assembly3d-wires path'))
})

test('draft warning is announced once and clears after storage recovers', async ({ page }) => {
  await page.addInitScript(() => {
    window.failDraftWrites = true
    window.draftWriteAttempts = []
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (window.failDraftWrites && key.includes('lesson-drafts')) {
        window.draftWriteAttempts.push(key)
        throw new Error('quota')
      }
      return setItem.call(this, key, value)
    }
  })
  await page.goto('/build?lesson=blink&guided=1&board=arduino-uno-r3')
  await expect.poll(() => page.evaluate(() => window.draftWriteAttempts)).toContain('machmo-guided-lesson-drafts-blink')
  const warning = page.getByRole('status', { name: /Không lưu được bản nháp/ })
  await expect(warning).toHaveCount(1)
  await expect(warning).toHaveText('Không lưu được bản nháp trên trình duyệt này')
  await page.evaluate(() => { window.failDraftWrites = false })
  await page.getByRole('navigation', { name: 'Các bước thực hành' }).getByRole('button', { name: 'Viết code', exact: true }).click()
  await page.getByRole('group', { name: 'Chọn cách viết code' }).getByRole('button', { name: 'Tự viết C++', exact: true }).click()
  await page.getByRole('textbox', { name: 'Code Arduino C++', exact: true }).fill('// ghi lại thành công')
  await expect(warning).toHaveCount(1)
  await expect(warning).toHaveText('')
  await expect(warning).toHaveAccessibleName(/Không lưu được bản nháp/)
})

test('accepting a v4 migration preview keeps source bytes while v5 jumpers and cross-view selection persist', async ({ page }) => {
  await page.goto('/app/lab')
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
    projectName: 'Bản nháp v4 cần giữ nguyên',
    futureExtension: { preserve: true },
  }
  const legacyRaw = JSON.stringify(legacyWorkspace)
  await page.evaluate(raw => localStorage.setItem('machmo-builder-session', raw), legacyRaw)
  await page.getByRole('button', { name: 'Bắt đầu lắp mạch →', exact: true }).click()
  const legacyBefore = await page.evaluate(() => localStorage.getItem('machmo-builder-session'))
  expect(legacyBefore).toBe(legacyRaw)
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const migrationGate = page.getByRole('region', { name: 'Lưu và chỉnh mạch phiên bản 5' })
  await expect(migrationGate).toContainText('Có bản schema 4')
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session-v5'))).toBeNull()
  await migrationGate.getByRole('button', { name: 'Chấp nhận preview và tạo v5', exact: true }).click()
  await expect(page.getByText('Đã tạo bản v5 sau khi kiểm tra preview. Bản schema 4 được giữ nguyên byte.')).toBeVisible()
  const acceptedV5 = await page.evaluate(() => JSON.parse(localStorage.getItem('machmo-builder-session-v5') ?? 'null'))
  expect(acceptedV5.schemaVersion).toBe(5)
  expect(acceptedV5.circuit.wires.map(wire => wire.id)).toEqual(['w-gpio-to-resistor', 'w-resistor-to-led', 'w-led-to-gnd'])
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe(legacyRaw)
  const editor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await expect(editor).toBeVisible()
  await expect(page.getByRole('button', { name: '⌁ Nối dây' })).toBeDisabled()

  await editor.getByRole('button', { name: /Chọn chân board-1 3V3/ }).click()
  await editor.locator('[data-hole-id="bb1:20a"]').click()
  const selectedWire = editor.getByRole('region', { name: /Chỉnh dây wire-v2-/ })
  await expect(selectedWire).toContainText(/board-1 · 3V3 ↔ Lỗ bb1:20a/)
  await editor.getByRole('combobox', { name: 'Đổi loại dây' }).selectOption('power')
  await editor.getByRole('button', { name: /Chỉnh cuối dây wire-v2-/ }).click()
  await editor.locator('[data-hole-id="bb1:22a"]').click()
  await expect(selectedWire).toContainText(/board-1 · 3V3 ↔ Lỗ bb1:22a/)
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe(legacyBefore)
  const exportAttempt = page.waitForEvent('download', { timeout: 1000 }).then(() => true, () => false)
  await page.getByRole('button', { name: 'Xuất tệp', exact: true }).click()
  await expect(page.getByText(/Project schema 4 chưa thể biểu diễn CircuitDocV2 đầy đủ/)).toBeVisible()
  expect(await exportAttempt).toBe(false)
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe(legacyBefore)
  await page.reload()
  await page.getByRole('button', { name: 'Bắt đầu lắp mạch →', exact: true }).click()
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const reloadedEditor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await reloadedEditor.getByText(/dây · danh sách endpoint/).click()
  const editedWire = reloadedEditor.locator('.breadboard-wire-list button').filter({ hasText: 'board-1 · 3V3' }).filter({ hasText: 'bb1:22a' })
  await expect(editedWire).toBeVisible()
  const editedWireId = (await editedWire.innerText()).split(':')[0]
  await editedWire.click()
  await expect(editedWire).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Sơ đồ nguyên lý', exact: true }).click()
  await expect(page.locator('.circuit-net-line.net-selected')).toHaveCount(1)
  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  const assemblyWires = page.locator('.circuit-v2-assembly-wires')
  await assemblyWires.locator('summary').click()
  const assemblyWire = assemblyWires.getByRole('button', { name: new RegExp(editedWireId) })
  await expect(assemblyWire).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  await reloadedEditor.getByText(/dây · danh sách endpoint/).click()
  const breadboardWire = page.locator('.breadboard-wire-list button').filter({ hasText: editedWireId })
  await expect(breadboardWire).toHaveAttribute('aria-pressed', 'true')
  const reloadedWire = reloadedEditor.getByRole('button', { name: /board-1 · 3V3.*bb1:22a/ })
  await expect(reloadedWire).toBeVisible()
  await reloadedWire.click()
  await reloadedEditor.getByRole('button', { name: /Xóa dây wire-v2-/ }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Bắt đầu lắp mạch →', exact: true }).click()
  await page.getByRole('button', { name: 'Lắp dây · breadboard', exact: true }).click()
  const finalEditor = page.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  await finalEditor.getByText(/dây · danh sách endpoint/).click()
  expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe(legacyRaw)
  const finalV5 = await page.evaluate(() => JSON.parse(localStorage.getItem('machmo-builder-session-v5') ?? 'null'))
  expect(finalV5.schemaVersion).toBe(5)
  expect(finalV5.circuit.wires.map(wire => wire.id)).toEqual(['w-gpio-to-resistor', 'w-resistor-to-led', 'w-led-to-gnd'])
  await expect(page.getByRole('button', { name: /board-1 · 3V3.*bb1:22a/ })).toHaveCount(0)
  await expect(finalEditor.locator('.breadboard-wire-list').getByRole('button', { name: /w-gpio-to-resistor/ })).toBeVisible()
})

test('3D lesson preview ignores stale legacy parts and keeps its inventory on the CircuitDocV2 source', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1')
  const legacyWorkspace = {
    schemaVersion: 4,
    lesson: 'blink',
    board: 'esp32-devkit',
    placed: [
      { id: 'board-1', type: 'board', x: 50, y: 50 },
      { id: 'bread-1', type: 'breadboard', x: 70, y: 45 },
      { id: 'res-1', type: 'resistor', x: 60, y: 70, value: '220 Ω' },
      { id: 'led-1', type: 'led', x: 80, y: 70 },
      { id: 'legacy-buzzer', type: 'buzzer', x: 30, y: 30 },
    ],
    wires: [],
    code: 'void setup() {}',
    projectName: 'Bản nháp cũ có linh kiện khác bài mẫu',
  }
  await page.evaluate(value => localStorage.setItem('machmo-builder-session', JSON.stringify(value)), legacyWorkspace)
  await page.reload()
  await expect(page.getByText('Đang xem trước topology mạch v5')).toBeVisible()
  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()

  const inventory = page.getByRole('region', { name: 'Danh sách linh kiện trong cảnh' })
  await expect(inventory).toContainText('ESP32 DevKit V1')
  await expect(inventory).toContainText('Điện trở 220 Ω')
  await expect(inventory).toContainText('LED')
  await expect(inventory).not.toContainText('Buzzer')
  await expect(page.locator('.circuit-v2-assembly-wires')).toContainText('3 dây trong mạch v5')
})

test('lesson code steps highlight the corresponding canonical circuit net and board feature selection is shared', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/app/learn/esp32-led')
    const lessonCircuit = page.getByRole('region', { name: 'Mạch bài học dùng CircuitDocV2' })
    await expect(lessonCircuit).toBeVisible()
    await page.getByRole('button', { name: /Đưa GPIO 23 về mức HIGH/ }).click()
    await expect(lessonCircuit.getByRole('status').filter({ hasText: 'GPIO 23 = HIGH' })).toBeVisible()
    await lessonCircuit.getByRole('tab', { name: 'Schematic' }).click()
    await expect(lessonCircuit.locator('.net-active')).toHaveCount(3)
    const lessonCheck = lessonCircuit.getByRole('status').filter({ hasText: /Đường mạch mẫu đang nối theo các net kỳ vọng/ })
    await expect(lessonCheck).toBeVisible()

    await lessonCircuit.getByRole('tab', { name: 'Breadboard và dây' }).click()
    const lessonEditor = lessonCircuit.getByRole('region', { name: 'Lắp mạch trên breadboard' })
    await lessonEditor.getByText(/dây · danh sách endpoint/).click()
    await lessonEditor.locator('.breadboard-wire-list').getByRole('button', { name: /w-gpio-to-resistor/ }).click()
    await lessonEditor.getByRole('button', { name: 'Xóa dây w-gpio-to-resistor' }).click()
    await expect(lessonCircuit.getByRole('status').filter({ hasText: 'Đường mạch chưa đủ kết nối theo các net kỳ vọng' })).toBeVisible()
    await lessonEditor.getByRole('button', { name: 'Chọn chân board-1 GPIO LED' }).click()
    await lessonEditor.locator('[data-hole-id="bb1:10a"]').click()
    await expect(lessonCheck).toBeVisible()

    const circuitParts = lessonCircuit.getByRole('group', { name: 'Chọn linh kiện trong sơ đồ' })
    const ledPart = circuitParts.getByRole('button', { name: /LED.*led-1/ })
    await ledPart.click()
    await expect(ledPart).toHaveAttribute('aria-pressed', 'true')
    const infoTabs = lessonCircuit.getByRole('tablist', { name: 'Thông tin linh kiện' })
    await infoTabs.getByRole('tab', { name: 'Chân' }).click()
    await expect(lessonCircuit.getByText('led-1:anode', { exact: false })).toBeVisible()
    await expect(ledPart).toHaveAttribute('aria-pressed', 'true')
    await infoTabs.getByRole('tab', { name: 'Thông số' }).click()
    await expect(lessonCircuit.getByText(/Registry chưa ghim datasheet/)).toBeVisible()
    await expect(ledPart).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Tự viết code C++' }).click()
    const codeEditor = page.getByRole('textbox', { name: 'Code Arduino C++', exact: true })
    await codeEditor.fill('void setup() {\n  pinMode(23, OUTPUT);\n  analogWrite(23, 128);\n}\nvoid loop() {}')
    await codeEditor.evaluate(element => { element.focus(); element.setSelectionRange(9, 15) })
    const cursor = await codeEditor.evaluate(element => [element.selectionStart, element.selectionEnd])
    await infoTabs.getByRole('tab', { name: 'Tổng quan' }).click()
    await infoTabs.getByRole('tab', { name: 'Thông số' }).click()
    expect(await codeEditor.evaluate(element => [element.selectionStart, element.selectionEnd])).toEqual(cursor)
    await expect(page.getByRole('status').filter({ hasText: 'Chưa thể phát luồng này' })).toBeVisible()
    await lessonCircuit.getByRole('tab', { name: 'Schematic' }).click()
    await expect(lessonCircuit.locator('.net-active')).toHaveCount(0)
    await lessonCircuit.getByRole('tab', { name: 'Trong bài' }).click()
    await lessonCircuit.getByLabel('Chọn khối chức năng board').selectOption('regulator')
    await expect(page.getByRole('group', { name: 'Chọn linh kiện để xem thông tin' }).getByRole('button', { name: /Bộ ổn áp 3,3 V/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(lessonCircuit.getByText(/U2 · AMS1117-3\.3/)).toBeVisible()
    await expect(lessonCircuit.getByText(/USB \+5 V → D1 → U2 IN/)).toBeVisible()
    await expect(lessonCircuit.getByText('Chi tiết có thể chưa được xác minh trên mọi board clone.')).toBeVisible()
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width)
    await page.screenshot({ path: testInfo.outputPath(`lesson-circuit-${viewport.width}.png`), fullPage: true })
  }
})

test('pin focus does not select its part and part shortcuts do not bubble from pins', async ({ page }) => {
  await prepareKeyboardWiring(page, 'Sơ đồ nguyên lý')
  const selected = page.locator('.schematic-part-selected')
  await expect(selected).toHaveCount(1)
  const selectedPartLabel = await selected.locator('strong').innerText()
  const otherPart = page.locator('.schematic-part:not(.schematic-part-selected)').first()
  await expect(otherPart).toBeVisible()
  const otherPartLabel = await otherPart.locator('strong').innerText()
  const stableOtherPart = page.locator('.schematic-part').filter({ hasText: otherPartLabel }).first()
  const initialPosition = await stableOtherPart.getAttribute('style')
  const initialRotation = await stableOtherPart.locator('.schematic-symbol').getAttribute('style')
  const pin = otherPart.getByRole('button', { name: /chân/ }).first()
  await expect(pin).toBeVisible()
  await pin.focus()
  await expect(pin).toBeFocused()
  await page.keyboard.press('r')
  const rotationAfterKey = await stableOtherPart.locator('.schematic-symbol').getAttribute('style')
  await pin.focus()
  await page.keyboard.press('ArrowRight')
  const positionAfterKey = await stableOtherPart.getAttribute('style')
  await pin.focus()
  await page.keyboard.press('Delete')
  const partCountAfterDelete = await page.locator('.schematic-part').filter({ hasText: otherPartLabel }).count()
  const selectedPartAfterKeys = await page.locator('.schematic-part-selected strong').innerText()

  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') return null
      return getContext.call(this, type, ...args)
    }
  })
  await page.goto('/build?lesson=blink&guided=1&board=arduino-uno-r3')
  await page.getByRole('button', { name: 'Lắp mạch · 3D', exact: true }).click()
  await expect(page.getByText('Trình duyệt này chưa mở được WebGL 2', { exact: false })).toBeVisible()
  const selectedAnnouncement = page.locator('.builder-main > p.sr-only')
  const partA = page.locator('.assembly3d-part').first()
  const partB = page.locator('.assembly3d-part').nth(1)
  const partALabel = await partA.locator('strong').innerText()
  await partA.locator('strong').click()
  const selectedBeforePinFocus = await selectedAnnouncement.innerText()
  expect(selectedBeforePinFocus).toBe(`${partALabel} được chọn.`)
  await partA.getByRole('button', { name: /chân/ }).last().focus()
  await partB.evaluate(element => element.setAttribute('tabindex', '-1'))
  const secondPartPin = partB.getByRole('button', { name: /chân/ }).first()
  await page.keyboard.press('Tab')
  await expect(secondPartPin).toBeFocused()
  const selectionAfterPinFocus = await selectedAnnouncement.innerText()
  expect(selectionAfterPinFocus).toBe(selectedBeforePinFocus)

  expect({
    rotationUnchanged: rotationAfterKey === initialRotation,
    positionUnchanged: positionAfterKey === initialPosition,
    partSurvivesDelete: partCountAfterDelete === 1,
    schematicSelectionUnchanged: selectedPartAfterKeys === selectedPartLabel,
    threeDSelectionUnchanged: selectionAfterPinFocus === selectedBeforePinFocus,
  }).toEqual({
    rotationUnchanged: true,
    positionUnchanged: true,
    partSurvivesDelete: true,
    schematicSelectionUnchanged: true,
    threeDSelectionUnchanged: true,
  })
})

test('XIAO S3 reference viewer has no duplicate React key or asset-load error', async ({ page }) => {
  const errors=[]
  page.on('pageerror', error=>errors.push(error.message))
  page.on('console', msg=>{if(msg.type()==='error')errors.push(msg.text())})
  await page.goto('/boards?board=seeed-xiao-esp32-s3')
  await expect(page.getByRole('heading', { name: 'Khám phá Seeed Studio XIAO ESP32-S3', exact:true })).toBeVisible()
  await expect(page.locator('.board-cad-viewer canvas')).toBeVisible()
  const urls=await page.locator('.board-cad-viewer-heading a').evaluateAll(nodes=>nodes.map(node=>node.href))
  expect(new Set(urls).size).toBe(urls.length)
  expect(errors).toEqual([])
})

test('compatible sample firmware requires target confirmation and emits captured D13 transitions', async ({ page }) => {
  await page.goto('/tools/firmware-hex')
  await page.getByRole('button',{name:'Nạp firmware LED nhấp nháy mẫu',exact:true}).click()
  const run=page.getByRole('button',{name:'Chạy thử',exact:true})
  await expect(run).toBeDisabled()
  await page.getByRole('checkbox',{name:/Tôi xác nhận HEX/}).check()
  await run.click()
  await expect(page.getByRole('button',{name:'Tải trace D13 · CSV',exact:true})).toBeVisible()
  const downloading=page.waitForEvent('download')
  await page.getByRole('button',{name:'Tải trace D13 · CSV',exact:true}).click()
  const download=await downloading
  const csv=await readFile(await download.path(),'utf8')
  expect(csv).toContain('avr8js,arduino-uno-r3-atmega328p,D13/PB5')
  expect(csv.trim().split('\n').length).toBeGreaterThanOrEqual(5)
})

test('SPICE solves its RC example and exports solver data', async ({ page }) => {
  await page.goto('/tools/spice')
  await page.getByRole('combobox',{name:'Bắt đầu từ ví dụ'}).selectOption('rc')
  await page.getByRole('button',{name:'Chạy SPICE',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Mô phỏng hoàn tất'})).toBeVisible({timeout:30000})
  const downloading=page.waitForEvent('download')
  await page.getByRole('button',{name:'Tải CSV',exact:true}).click()
  expect((await downloading).suggestedFilename()).toMatch(/\.csv$/)
})

test('saved project can be opened and exported/imported without losing circuit or drafts', async ({ page }) => {
  await page.goto('/app/lab?lesson=blink&guided=1')
  await page.getByRole('textbox',{name:'Tên project cần lưu'}).fill('E2E mạch LED')
  await page.getByRole('button',{name:'Lưu project',exact:true}).click()
  await page.goto('/app/projects')
  const card=page.locator('.saved-project-card').filter({hasText:'E2E mạch LED'})
  await expect(card).toHaveCount(1)
  const downloading=page.waitForEvent('download')
  await card.getByRole('button',{name:'Xuất tệp',exact:true}).click()
  const original=JSON.parse(await readFile(await (await downloading).path(),'utf8'))
  page.once('dialog',dialog=>dialog.accept())
  await card.getByRole('button',{name:'Mở',exact:true}).click()
  await expect(page).toHaveURL(/\/app\/lab/)
  page.on('dialog',dialog=>dialog.accept())
  const importing=page.waitForEvent('load')
  await page.getByLabel('Chọn tệp project Mạch Mở để nhập',{exact:true}).setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(original))})
  await importing
  await expect(page.getByRole('textbox',{name:'Tên project cần lưu'})).toHaveValue('E2E mạch LED')
  const exporting=page.waitForEvent('download')
  await page.getByRole('button',{name:'Xuất tệp',exact:true}).click()
  const restored=JSON.parse(await readFile(await (await exporting).path(),'utf8'))
  const { exportedAt: originalTime, ...originalDocument } = original
  const { exportedAt: restoredTime, ...restoredDocument } = restored
  expect(typeof originalTime).toBe('string')
  expect(typeof restoredTime).toBe('string')
  expect(restoredDocument).toEqual(originalDocument)
})

test('file import preserves portable identity and conflicting drafts without serializing branch defaults', async ({ page }) => {
  const exportBundle = async () => {
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất tệp', exact: true }).click()
    return JSON.parse(await readFile(await (await downloading).path(), 'utf8'))
  }
  await page.goto('/app/lab?lesson=blink&guided=1')
  const input = await exportBundle()
  input.workspace.projectId = 'mm-baseline-portable-id'
  input.workspace.code = '// workspace code\n'
  input.workspace.codeMode = 'cpp'
  input.lessonDrafts = { blink: { 'esp32-devkit': '// supplied conflicting draft\n', 'arduino-uno-r3': '// nháp Uno\n' }, 'button-led': { 'esp32-devkit': '', 'arduino-uno-r3': '// nút nhấn\n' } }
  input.branchDrafts = {}
  page.on('dialog', dialog => dialog.accept())
  const importing = page.waitForEvent('load')
  await page.getByLabel('Chọn tệp project Mạch Mở để nhập', { exact: true }).setInputFiles({ name: 'identity-draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(input)) })
  await importing
  await expect(page.getByText('Code hiện tại và bản nháp đã lưu khác nhau; cả hai được giữ nguyên.', { exact: true })).toBeVisible()
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await page.reload()
    const output = await exportBundle()
    expect(output.workspace.projectId).toBe('mm-baseline-portable-id')
    expect(output.workspace.code).toBe('// workspace code\n')
    expect(output.lessonDrafts).toEqual(input.lessonDrafts)
    expect(output.branchDrafts).toEqual({})
  }
})

test('library identity round trip updates only the opened entry and keeps the portable document', async ({ page }) => {
  const savedKey = 'machmo-saved-projects'
  const workspaceKey = 'machmo-builder-session'
  const readLibrary = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '[]'), savedKey)
  const readWorkspace = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}'), workspaceKey)
  const exportFrom = async button => {
    const downloading = page.waitForEvent('download')
    await button.click()
    return JSON.parse(await readFile(await (await downloading).path(), 'utf8'))
  }
  const builderExport = () => exportFrom(page.getByRole('button', { name: 'Xuất tệp', exact: true }))
  const file = bundle => ({ name: 'identity.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bundle)) })
  await page.goto('/build')
  const source = await builderExport()
  source.workspace.projectId = 'portable-P'
  source.workspace.projectName = 'Tên tài liệu'
  source.workspace.codeMode = 'cpp'
  source.workspace.code = '// code hiện tại'
  source.lessonDrafts = { blink: { 'esp32-devkit': '', 'arduino-uno-r3': '// Uno' } }
  source.branchDrafts = { 'button-led': '', 'ir-alert': '// IR' }

  await page.goto('/projects')
  const importPicker = page.getByLabel('Nhập project từ tệp')
  for (const name of ['Mục thứ nhất', 'Mục thứ hai']) {
    await importPicker.setInputFiles(file(source))
    await page.getByLabel('Tên project', { exact: true }).fill(name)
    await page.getByRole('button', { name: 'Lưu vào thư viện', exact: true }).click()
    await expect(page.getByText(`Đã nhập “${name}” vào thư viện trong trình duyệt này.`)).toBeVisible()
  }
  await importPicker.setInputFiles(file(source))
  await page.getByLabel('Tên project', { exact: true }).fill('Mục hủy')
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await expect(importPicker).toBeFocused()
  const before = await readLibrary()
  expect(before).toHaveLength(2)
  const first = before.find(item => item.name === 'Mục thứ nhất')
  const second = before.find(item => item.name === 'Mục thứ hai')
  expect(first.id).not.toBe(second.id)
  const card = page.locator('.saved-project-card').filter({ hasText: second.name })
  page.once('dialog', dialog => dialog.accept())
  await card.getByRole('button', { name: 'Mở', exact: true }).click()
  const update = page.getByRole('button', { name: 'Cập nhật bản đã lưu', exact: true })
  await expect(update).toBeVisible()
  await page.reload()
  await expect(update).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Tên project cần lưu' })).toHaveValue(second.name)
  const opened = await builderExport()
  const { exportedAt: _originalTime, ...originalDocument } = source
  const { exportedAt: _openedTime, ...openedDocument } = opened
  expect(openedDocument).toEqual(originalDocument)
  expect((await readWorkspace()).libraryEntryId).toBe(second.id)

  await page.getByRole('button', { name: 'Bắt đầu lắp mạch →', exact: true }).click()
  await page.getByRole('region', { name: 'Việc cần làm tiếp theo' }).getByRole('button', { name: 'Tiếp tục viết code', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Code Arduino C++', exact: true })
  await editor.fill('// bản sửa chỉ thuộc mục hai')
  await update.click()
  const after = await readLibrary()
  expect(after.find(item => item.id === first.id)).toEqual(first)
  const updated = after.find(item => item.id === second.id)
  expect(updated.bundle.workspace).toMatchObject({ projectId: 'portable-P', projectName: 'Tên tài liệu', code: '// bản sửa chỉ thuộc mục hai' })
  expect(updated.revisions.map(item => item.bundle)).toEqual([second.bundle])
  expect(updated.bundle.workspace).not.toHaveProperty('libraryEntryId')
  expect(updated.bundle.branchDrafts).toEqual(source.branchDrafts)

  await editor.fill('// nháp giữ lại khi ghi lỗi')
  await page.evaluate(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (entry, value) {
      if (entry === key) throw new DOMException('full', 'QuotaExceededError')
      return original.call(this, entry, value)
    }
  }, savedKey)
  await update.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Không lưu được' })).toBeVisible()
  await expect(page.getByText(/Đã lưu “Mục thứ hai”/)).toHaveCount(0)
  expect(await readLibrary()).toEqual(after)
  expect((await builderExport()).workspace.code).toBe('// nháp giữ lại khi ghi lỗi')

  await page.goto('/projects')
  const savedExport = await exportFrom(card.getByRole('button', { name: 'Xuất tệp', exact: true }))
  expect(savedExport).toEqual(updated.bundle)
  page.once('dialog', dialog => dialog.accept())
  await card.getByRole('button', { name: 'Mở', exact: true }).click()
  await expect(update).toBeVisible()
  const reopened = await builderExport()
  expect(reopened.workspace.code).toBe(updated.bundle.workspace.code)
  expect(reopened.workspace.projectId).toBe('portable-P')

  page.once('dialog', dialog => dialog.accept())
  const imported = page.waitForEvent('load')
  await page.getByLabel('Chọn tệp project Mạch Mở để nhập', { exact: true }).setInputFiles(file(savedExport))
  await imported
  await expect(page.getByRole('button', { name: 'Lưu vào thư viện', exact: true })).toBeVisible()
  expect((await builderExport()).workspace.projectId).toBe('portable-P')
  expect(await readLibrary()).toEqual(after)
  await page.getByRole('textbox', { name: 'Tên project cần lưu' }).fill('Mục nhập từ Builder')
  await page.getByRole('button', { name: 'Lưu vào thư viện', exact: true }).click()
  await expect(update).toBeVisible()
  const third = (await readLibrary()).find(item => item.name === 'Mục nhập từ Builder')
  expect(third.id).not.toBe(second.id)
  expect(third.bundle.workspace.projectId).toBe('portable-P')

  await page.evaluate(({ key, id }) => {
    const items = JSON.parse(localStorage.getItem(key))
    localStorage.setItem(key, JSON.stringify(items.filter(item => item.id !== id)))
  }, { key: savedKey, id: third.id })
  await update.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Không tìm thấy bản đã lưu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu thành mục mới', exact: true })).toBeVisible()
  expect((await builderExport()).workspace.projectId).toBe('portable-P')
  expect((await readLibrary()).find(item => item.id === second.id)).toEqual(updated)
})

for (const acceptImport of [true, false]) {
  test(`slow Builder import preserves the latest linked draft when ${acceptImport ? 'confirmed' : 'cancelled'}`, async ({ page }) => {
    await page.goto('/build')
    const label = page.getByRole('textbox', { name: 'Tên project cần lưu' })
    await label.fill('Mục đang sửa')
    await page.getByRole('button', { name: 'Lưu vào thư viện', exact: true }).click()
    const update = page.getByRole('button', { name: 'Cập nhật bản đã lưu', exact: true })
    await expect(update).toBeVisible()
    await page.getByRole('button', { name: 'Tiếp tục lắp mạch', exact: true }).click()
    await page.getByRole('region', { name: 'Việc cần làm tiếp theo' }).getByRole('button', { name: 'Tiếp tục viết code', exact: true }).click()
    await page.getByRole('button', { name: 'Tự viết C++', exact: true }).click()
    const editor = page.getByRole('textbox', { name: 'Code Arduino C++', exact: true })
    await editor.fill('// draft A')
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất tệp', exact: true }).click()
    const input = JSON.parse(await readFile(await (await downloading).path(), 'utf8'))
    input.workspace.projectId = 'incoming-portable'
    input.workspace.code = '// imported'
    const before = await page.evaluate(() => ({
      link: JSON.parse(localStorage.getItem('machmo-builder-session')).libraryEntryId,
      recovery: localStorage.getItem('machmo-draft-recovery'),
      library: localStorage.getItem('machmo-saved-projects'),
    }))
    expect(before.link).toEqual(expect.any(String))
    await page.evaluate(() => {
      const read = File.prototype.text
      File.prototype.text = async function () {
        await new Promise(resolve => { window.releaseHeldProject = resolve })
        return read.call(this)
      }
    })
    await page.getByLabel('Chọn tệp project Mạch Mở để nhập', { exact: true }).setInputFiles({
      name: 'held-project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(input)),
    })
    await page.waitForFunction(() => typeof window.releaseHeldProject === 'function')
    await editor.fill('// draft B')
    const dialog = page.waitForEvent('dialog')
    const loaded = acceptImport ? page.waitForEvent('load') : undefined
    const release = page.evaluate(() => window.releaseHeldProject())
    const confirmation = await dialog
    expect(confirmation.message()).toContain('Nhập project sẽ thay workspace chính')
    if (acceptImport) await confirmation.accept()
    else await confirmation.dismiss()
    await release
    if (loaded) await loaded
    const after = await page.evaluate(() => ({
      workspace: JSON.parse(localStorage.getItem('machmo-builder-session')),
      recovery: localStorage.getItem('machmo-draft-recovery'),
      library: localStorage.getItem('machmo-saved-projects'),
    }))
    expect(after.library).toBe(before.library)
    if (acceptImport) {
      expect(after.workspace.projectId).toBe('incoming-portable')
      expect(after.workspace).not.toHaveProperty('libraryEntryId')
      const recovery = JSON.parse(after.recovery)
      expect(recovery.workspace.code).toBe('// draft B')
      expect(recovery.lessonDrafts.blink['esp32-devkit']).toBe('// draft B')
      expect(recovery.workspace).not.toHaveProperty('libraryEntryId')
    } else {
      expect(after.recovery).toBe(before.recovery)
      expect(after.workspace.libraryEntryId).toBe(before.link)
      await expect(editor).toHaveValue('// draft B')
    }
  })
}

test('supplied and learner-edited branch drafts survive reload including empty drafts', async ({ page }) => {
  const exportBundle = async () => {
    const downloading = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất tệp', exact: true }).click()
    return JSON.parse(await readFile(await (await downloading).path(), 'utf8'))
  }
  await page.goto('/app/lab?lesson=blink&guided=1')
  const input = await exportBundle()
  input.workspace.lesson = 'button-led'
  input.workspace.code = '// current button code\n'
  input.lessonDrafts = { 'button-led': { 'esp32-devkit': '// current button code\n' } }
  input.branchSession.mode = 'cpp'
  input.branchDrafts = { 'button-led': '// supplied branch draft\n', 'ir-alert': '' }
  page.on('dialog', dialog => dialog.accept())
  const importing = page.waitForEvent('load')
  await page.getByLabel('Chọn tệp project Mạch Mở để nhập', { exact: true }).setInputFiles({ name: 'branches.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(input)) })
  await importing
  expect((await exportBundle()).branchDrafts).toEqual(input.branchDrafts)
  await page.getByRole('navigation', { name: 'Các bước thực hành' }).getByRole('button', { name: 'Viết code', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Bản nháp C++ bài cảm biến', exact: true })
  await expect(editor).toHaveValue('// supplied branch draft\n')
  await editor.fill('// edited by learner\n')
  await page.reload()
  expect((await exportBundle()).branchDrafts).toEqual({ 'button-led': '// edited by learner\n', 'ir-alert': '' })
  await page.getByRole('navigation', { name: 'Các bước thực hành' }).getByRole('button', { name: 'Viết code', exact: true }).click()
  await page.getByRole('region', { name: 'Trình soạn chương trình', exact: true }).getByRole('button', { name: 'Khôi phục code mẫu', exact: true }).click()
  const restored = (await exportBundle()).branchDrafts
  expect(restored['button-led']).not.toBe('// edited by learner\n')
  expect(restored['ir-alert']).toBe('')
  await page.reload()
  expect((await exportBundle()).branchDrafts).toEqual(restored)
})

test('classroom kit includes station accessories in the downloaded CSV', async ({ page }) => {
  await page.goto('/app/classroom-kits')
  await expect(page.getByRole('rowheader',{name:/Dây jumper cắm thử/})).toBeVisible()
  await expect(page.getByRole('rowheader',{name:/Cáp USB dữ liệu/})).toBeVisible()
  const downloading=page.waitForEvent('download')
  await page.getByRole('button',{name:'Tải danh sách CSV',exact:true}).click()
  const csv=await readFile(await (await downloading).path(),'utf8')
  expect(csv).toContain('jumper'); expect(csv).toContain('USB')
})

test('legacy v1 kit in localStorage reloads byte-identically and shows the documented 10 kΩ LDR resistor', async ({ page }) => {
  const bundle = {
    schemaVersion: 1,
    title: 'Gói lớp cũ',
    boardId: 'esp32-devkit',
    lessonIds: ['analog-ldr'],
    stationCount: 3,
    quantityOverrides: {},
    configurationLicense: 'private',
  }
  const canonical = JSON.stringify(bundle, null, 2)
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: 'mach-mo-classroom-kit-plan-v1', value: canonical })
  await page.goto('/app/classroom-kits')
  await expect(page.getByRole('rowheader', { name: /Điện trở 10 kΩ/ })).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Điện trở 220 Ω/ })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1'))).toBe(canonical)
  await page.reload()
  await expect(page.getByRole('rowheader', { name: /Điện trở 10 kΩ/ })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1'))).toBe(canonical)
})

test('legacy family-level resistor override shows a preview and waits for an explicit variant mapping', async ({ page }) => {
  await page.goto('/app/classroom-kits')
  const currentTitle = await page.getByLabel('Tên kế hoạch').inputValue()
  const legacy = {
    schemaVersion: 1,
    title: 'Gói override cũ',
    boardId: 'esp32-devkit',
    lessonIds: ['analog-ldr', 'seven-segment-counter'],
    stationCount: 2,
    quantityOverrides: { resistor: 5 },
    configurationLicense: 'private',
  }
  await page.getByRole('button', { name: 'Nhập gói', exact: true }).click()
  await page.getByLabel('Chọn tệp gói kit JSON hoặc CSV để nhập', { exact: true }).setInputFiles({
    name: 'legacy-kit.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  const preview = page.getByRole('group', { name: 'Cần xác nhận override điện trở trong tệp cũ' })
  await expect(preview).toBeVisible()
  expect(await page.getByLabel('Tên kế hoạch').inputValue()).toBe(currentTitle)
  await preview.getByLabel('Chỉ gán override cho biến thể này').selectOption('resistor:ohm:10000')
  await preview.getByRole('button', { name: 'Gán riêng cho biến thể đã chọn' }).click()
  await expect(page.getByLabel('Tên kế hoạch')).toHaveValue('Gói override cũ')
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1')))
  expect(stored.schemaVersion).toBe(2)
  expect(stored.quantityOverrides).not.toHaveProperty('resistor')
  expect(stored.variantOverrides['resistor:ohm:10000']).toEqual({ value: 10000, unit: 'ohm', package: 'unknown', quantity: 5 })
})

test('ambiguous legacy localStorage override is previewed and is not applied before a choice', async ({ page }) => {
  const legacy = {
    schemaVersion: 1,
    title: 'Kế hoạch đã lưu cũ',
    boardId: 'esp32-devkit',
    lessonIds: ['analog-ldr', 'seven-segment-counter'],
    stationCount: 2,
    quantityOverrides: { resistor: 5 },
    configurationLicense: 'private',
  }
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: 'mach-mo-classroom-kit-plan-v1', value: JSON.stringify(legacy, null, 2),
  })
  await page.goto('/app/classroom-kits')
  const preview = page.getByRole('group', { name: 'Cần xác nhận override điện trở trong tệp cũ' })
  await expect(preview).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Điện trở 10 kΩ/ })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mach-mo-classroom-kit-plan-v1')).quantityOverrides.resistor)).toBe(5)
  await preview.getByRole('button', { name: 'Nhập, giữ mặc định từng biến thể' }).click()
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1')))
  expect(stored.quantityOverrides).not.toHaveProperty('resistor')
  expect(stored.schemaVersion).toBe(1)
})

for (const [label, raw] of [
  ['future schema', JSON.stringify({ schemaVersion: 3, title: 'Gói tương lai', localData: 'keep-me' })],
  ['malformed JSON', '{"schemaVersion":1,"title":'],
  ['empty saved value', ''],
]) {
  test(`unreadable saved kit (${label}) is preserved until an explicit replacement`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: 'mach-mo-classroom-kit-plan-v1', value: raw,
    })
    await page.goto('/app/classroom-kits')
    const recovery = page.getByRole('alert', { name: 'Gói lớp học đã lưu chưa thể mở' })
    await expect(recovery).toBeVisible()
    await expect(recovery).toContainText(/chưa được hỗ trợ|không đọc được/i)
    expect(await page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1'))).toBe(raw)

    const download = page.waitForEvent('download')
    await recovery.getByRole('button', { name: 'Tải bản sao nguyên trạng' }).click()
    expect(await readFile(await (await download).path(), 'utf8')).toBe(raw)
    await page.reload()
    await expect(page.getByRole('alert', { name: 'Gói lớp học đã lưu chưa thể mở' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1'))).toBe(raw)

    await page.getByRole('alert', { name: 'Gói lớp học đã lưu chưa thể mở' }).getByRole('button', { name: 'Thay gói đã lưu bằng kế hoạch mới' }).click()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('mach-mo-classroom-kit-plan-v1')).schemaVersion)).toBe(1)
    expect(await page.evaluate(() => localStorage.getItem('mach-mo-classroom-kit-plan-v1'))).not.toBe(raw)
  })
}

