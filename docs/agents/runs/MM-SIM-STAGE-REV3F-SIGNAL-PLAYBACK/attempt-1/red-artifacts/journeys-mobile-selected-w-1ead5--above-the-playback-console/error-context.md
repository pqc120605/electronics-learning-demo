# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.mjs >> mobile selected-wire controls remain fully exposed above the playback console
- Location: e2e\journeys.spec.mjs:4:1

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  locator('.button-lab').getByRole('region', { name: 'Lắp mạch trên breadboard' }).getByRole('region', { name: 'Chỉnh dây w-input-to-button' }).getByRole('button', { name: 'Đổi điểm bắt đầu' })
Expected: in viewport
Received: viewport ratio 0.4730113744735718
Timeout:  15000ms

Call log:
  - Expect "toBeInViewport" locator('.button-lab').getByRole('region', { name: 'Lắp mạch trên breadboard' }).getByRole('region', { name: 'Chỉnh dây w-input-to-button' }).getByRole('button', { name: 'Đổi điểm bắt đầu' }) with timeout 15000ms
  - waiting for locator('.button-lab').getByRole('region', { name: 'Lắp mạch trên breadboard' }).getByRole('region', { name: 'Chỉnh dây w-input-to-button' }).getByRole('button', { name: 'Đổi điểm bắt đầu' })
    33 × locator resolved to <button type="button" aria-pressed="false">Đổi điểm bắt đầu</button>
       - unexpected value "viewport ratio 0.4730113744735718"

```

```yaml
- button "Đổi điểm bắt đầu"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { readFile } from 'node:fs/promises'
  3   | 
  4   | test('mobile selected-wire controls remain fully exposed above the playback console', async ({ page }) => {
  5   |   await page.setViewportSize({ width: 375, height: 812 })
  6   |   await page.goto('/app/learn/button-led')
  7   |   const lab = page.locator('.button-lab')
  8   |   const editor = lab.getByRole('region', { name: 'Lắp mạch trên breadboard' })
  9   |   await editor.getByRole('combobox', { name: 'Chọn dây' }).selectOption('w-input-to-button')
  10  |   const wire = editor.getByRole('region', { name: 'Chỉnh dây w-input-to-button' })
  11  |   for (const state of ['ready', 'stale']) {
  12  |     if (state === 'stale') await wire.getByRole('combobox', { name: 'Đổi loại dây' }).selectOption('ground')
  13  |     await lab.locator('.button-lab-stage-scroll').evaluate(stage => { stage.scrollTop = 0 })
  14  |     for (const control of [
  15  |       editor.getByRole('button', { name: 'Chọn', exact: true }),
  16  |       editor.getByRole('button', { name: 'Nối dây', exact: true }),
  17  |       wire.getByRole('button', { name: 'Đổi điểm bắt đầu' }),
  18  |       wire.getByRole('button', { name: 'Đổi điểm kết thúc' }),
  19  |       wire.getByRole('combobox', { name: 'Đổi loại dây' }),
  20  |       wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }),
  21  |       lab.getByRole('button', { name: 'Khôi phục mạch' }),
> 22  |     ]) await expect(control).toBeInViewport({ ratio: 1 })
      |                              ^ Error: expect(locator).toBeInViewport() failed
  23  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', state)
  24  |   }
  25  |   await wire.getByRole('button', { name: 'Xóa dây w-input-to-button' }).click()
  26  |   await expect(wire).toHaveCount(0)
  27  |   await lab.getByRole('button', { name: 'Khôi phục mạch' }).click()
  28  |   await expect(editor.getByRole('combobox', { name: 'Chọn dây' }).locator('option:not([value=""])')).toHaveCount(5)
  29  |   expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([375, 812])
  30  | })
  31  | 
  32  | for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  33  |   test(`3D event marker excludes selected pins outside the current frame at ${viewport.width}px`, async ({ page }, testInfo) => {
  34  |     await page.setViewportSize(viewport)
  35  |     await page.goto('/app/learn/button-led')
  36  |     const lab = page.locator('.button-lab')
  37  |     const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
  38  |     const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
  39  |     const selection = lab.getByTestId('button-lab-selection')
  40  |     const marker = lab.locator('.assembly-pin-marker')
  41  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
  42  |     await views.getByRole('button', { name: '3D', exact: true }).click()
  43  |     const fallback = lab.getByText(/chưa mở được WebGL 2/)
  44  |     await expect(lab.locator('.assembly-stage-view canvas').or(fallback)).toBeVisible()
  45  |     test.skip(await fallback.isVisible(), 'WebGL unavailable; actual 3D marker checks not run')
  46  |     await expect(marker).toContainText('GPIO 18')
  47  |     await expect(selection).toHaveText('board-1:input')
  48  |     await controls.getByRole('button', { name: 'Bước sau' }).click()
  49  |     await expect(marker).toContainText('GPIO 18')
  50  |     await controls.getByRole('button', { name: 'Bước sau' }).click()
  51  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-event', 'write')
  52  |     await expect(marker).toHaveCount(0)
  53  |     await expect(selection).toHaveText('board-1:input')
  54  |     await controls.getByRole('button', { name: 'Về bước đầu' }).click()
  55  |     await expect(marker).toContainText('GPIO 18')
  56  |     await lab.getByRole('radio', { name: 'Nhấn nút' }).check()
  57  |     await expect(lab.locator('.button-lab-result')).toHaveAttribute('data-state', 'stale')
  58  |     await expect(marker).toHaveCount(0)
  59  |     await expect(selection).toHaveText('board-1:input')
  60  |     await testInfo.attach(`3d-marker-stale-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' })
  61  |   })
  62  | }
  63  | 
  64  | for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  65  |   test(`signal playback follows one event across projections at ${viewport.width}px`, async ({ page }, testInfo) => {
  66  |     await page.setViewportSize(viewport)
  67  |     await page.goto('/app/learn/button-led')
  68  |     const lab = page.locator('.button-lab')
  69  |     const status = lab.locator('.button-lab-result')
  70  |     const controls = lab.getByRole('group', { name: 'Điều khiển từng bước trace' })
  71  |     const next = controls.getByRole('button', { name: 'Bước sau' })
  72  |     const previous = controls.getByRole('button', { name: 'Bước trước' })
  73  |     const replay = controls.getByRole('button', { name: 'Về bước đầu' })
  74  |     const run = lab.getByRole('button', { name: 'Chạy lại', exact: true })
  75  |     const views = lab.getByRole('group', { name: 'Chọn hình chiếu mạch' })
  76  |     const mobile = lab.getByRole('navigation', { name: 'Chế độ xem trên điện thoại' })
  77  |     const schematic = lab.locator('.circuit-schematic-v2')
  78  |     const expectStep = async (step, kind) => {
  79  |       await expect(status).toHaveAttribute('data-event', kind)
  80  |       await expect(status).toContainText(`Bước ${step}/3`)
  81  |       await expect(status).toContainText(/Dòng \d+/)
  82  |       await expect(status.locator('code')).not.toBeEmpty()
  83  |     }
  84  |     await expect(controls).toBeVisible()
  85  |     await expect(previous).toBeDisabled()
  86  |     await expectStep(1, 'read')
  87  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
  88  |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  89  |     await lab.locator('[data-circuit-endpoint="bb1:20g"]').scrollIntoViewIfNeeded()
  90  |     await lab.locator('[data-circuit-endpoint="board-1:input"]').scrollIntoViewIfNeeded()
  91  |     await expect(lab.locator('.button-lab-wire-overlay path[data-active="true"][data-wire-id="w-input-to-button"]')).toHaveCount(1)
  92  |     await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).toHaveAttribute('data-lesson-active', '')
  93  |     await expect(lab.locator('[data-circuit-endpoint="board-1:ledOut"]')).not.toHaveAttribute('data-lesson-active', '')
  94  |     await next.focus()
  95  |     await next.press('Space')
  96  |     await expectStep(2, 'branch')
  97  |     await views.getByRole('button', { name: 'Sơ đồ', exact: true }).click()
  98  |     await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(1)
  99  |     await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).toHaveClass(/net-active/)
  100 |     await expectStep(2, 'branch')
  101 |     await next.press('Enter')
  102 |     await expectStep(3, 'write')
  103 |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  104 |     await expect(next).toBeDisabled()
  105 |     await expect(schematic.locator('.circuit-net-line.net-active')).toHaveCount(2)
  106 |     await expect(schematic.locator('.circuit-net-line[data-net-key="bb1:20a"]')).not.toHaveClass(/net-active/)
  107 |     await views.getByRole('button', { name: '3D', exact: true }).click()
  108 |     await expect(lab.locator('.assembly-stage-view canvas').or(lab.getByText(/chưa mở được WebGL 2/))).toBeVisible()
  109 |     await expectStep(3, 'write')
  110 |     await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
  111 |     await views.getByRole('button', { name: 'Breadboard', exact: true }).click()
  112 |     await expect(lab.locator('[data-circuit-endpoint="res-1:b"]')).toHaveAttribute('data-lesson-active', '')
  113 |     await expect(lab.locator('[data-circuit-endpoint="board-1:input"]')).not.toHaveAttribute('data-lesson-active', '')
  114 |     await replay.press('Enter')
  115 |     await expectStep(1, 'read')
  116 |     await controls.getByRole('button', { name: 'Phát trace' }).press('Enter')
  117 |     await expect(controls.getByRole('button', { name: 'Tạm dừng trace' })).toBeVisible()
  118 |     await controls.getByRole('button', { name: 'Tạm dừng trace' }).press('Space')
  119 |     const paused = await status.getAttribute('data-event')
  120 |     await page.waitForTimeout(1400)
  121 |     await expect(status).toHaveAttribute('data-event', paused)
  122 |     await controls.getByRole('button', { name: 'Phát trace' }).click()
```