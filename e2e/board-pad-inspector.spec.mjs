import { expect, test } from '@playwright/test'

test('catalog loads the board-specific CAD evidence and pin groups after opening a direct link', async ({ page }) => {
  await page.goto('/app/boards?board=esp32-s3-devkitc-1&feature=cad-j1')
  const inspector = page.locator('.board-cad-details')
  await expect(inspector).toContainText('PADS')
  await expect(inspector).toContainText('V1.1')
  await expect(inspector).not.toContainText(/KiCad v1\.3|D0–D10|Seeed|manual ST/)

  await page.goto('/app/boards?board=arduino-mega-2560-r3&view=3d')
  await expect(inspector).toContainText('bấm vào đúng vị trí trên mô hình 3D')
  await expect(inspector.getByRole('group', { name: 'Chọn nhóm chân POWER0' })).toBeAttached()
})
import { mkdir, readFile } from 'node:fs/promises'

test('STM32 reference geometry zooms in 2D and provides a separate named pinout', async ({ page }) => {
  await page.goto('/boards?board=stm32-nucleo&view=top')
  const inspector = page.getByRole('region', { name: 'Mặt board 2D' })
  const picture = inspector.getByRole('img', { name: 'Hình chiếu mặt board' })
  await expect(picture).toBeVisible()
  await expect(inspector.locator('[data-board-pad]')).toHaveCount(0)
  const zoomOut = inspector.getByRole('button', { name: 'Thu nhỏ mặt board' })
  await expect(zoomOut).toBeDisabled()
  await inspector.getByRole('button', { name: 'Phóng to mặt board' }).click()
  await expect(zoomOut).toBeEnabled()
  await page.getByRole('button', { name: 'Tra tên và chức năng chân' }).click()
  await expect(page.getByRole('heading', { name: 'Tra cứu pinout theo tên' })).toBeVisible()
})

const boards = [
  ['arduino-uno-r3', 44, 120], ['arduino-nano-classic', 36, 37],
  ['arduino-mega-2560-r3', 98, 72], ['esp32-devkit', 30, 26], ['raspberry-pi-pico', 40, 51],
]

for (const width of [375, 1440]) {
  test.describe(`Mặt board ở ${width}px`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 }, hasTouch: width === 375 })

    for (const [id, pinCount] of boards) {
      test(`${id} selects every projected CAD pad by pointer and keyboard`, async ({ page }) => {
        test.setTimeout(120_000)
        await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ library: 1 })))
        await page.goto(`/app/boards?board=${id}&view=top`)
        const later = page.getByRole('button', { name: 'Để sau', exact: true })
        if (await later.isVisible()) await later.click()
        const inspector = page.getByRole('region', { name: 'Mặt board 2D' })
        const canvas = inspector.getByRole('img', { name: 'Vị trí pad trên board' })
        const contacts = inspector.getByRole('combobox', { name: 'Chân header' })
        const pads = canvas.locator('[data-board-pad] circle')
        await expect(pads).toHaveCount(pinCount)
        const pins = await contacts.locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean))
        expect(pins).toHaveLength(pinCount)
        for (const pin of pins) {
          const pad = canvas.locator(`[data-board-pad="${pin}"] circle`)
          await pad.scrollIntoViewIfNeeded()
          const box = await pad.boundingBox()
          expect(box).not.toBeNull()
          const position = [box.x + box.width / 2, box.y + box.height / 2]
          if (width === 375) await page.touchscreen.tap(...position)
          else await page.mouse.click(...position)
          await expect(contacts).toHaveValue(pin)
        }
        await canvas.press('Escape')
        for (const pin of pins) {
          await canvas.press('ArrowRight')
          await canvas.press('Enter')
          await expect(contacts).toHaveValue(pin)
        }

        const data = JSON.parse(await readFile(`src/data/board-components/${id}.json`, 'utf8'))
        const frontChip = data.components.find(part => part.ref === 'U1' && part.side === 'front' && part.pads.length)
          ?? data.components.find(part => part.side === 'front' && part.pads.length)
        expect(frontChip).toBeDefined()
        await inspector.getByRole('combobox', { name: 'Linh kiện trên board' }).selectOption(frontChip.ref)
        const table = inspector.getByRole('table', { name: 'Pad và net CAD' })
        await expect(table.getByRole('row')).toHaveCount(frontChip.pads.length + 1)
        const firstType = frontChip.pads[0].electricalType
        await inspector.getByRole('combobox', { name: 'Loại điện trên bảng pad' }).selectOption(firstType)
        await expect(table.getByRole('row')).toHaveCount(frontChip.pads.filter(pad => pad.electricalType === firstType).length + 1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      })
    }
  })
}

for (const width of [375, 1440]) {
  test(`Uno top view selects a CAD pad and keeps selection when switching views at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.goto('/app/boards?board=arduino-uno-r3&view=top')
    const top = page.getByRole('region', { name: 'Mặt board 2D' })
    const canvas = top.getByRole('img', { name: 'Vị trí pad trên board' })
    await expect(canvas).toBeVisible()
    const later = page.getByRole('button', { name: 'Để sau', exact: true })
    if (await later.isVisible()) await later.click()
    await canvas.focus()
    await canvas.press('ArrowRight')
    await canvas.press('Enter')
    await expect(page).toHaveURL(/[?&]pin=pin-1/)
    await expect(top.getByRole('heading', { name: 'D0/RX' })).toBeVisible()
    await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'D0/RX' })).toBeVisible()
    await page.getByRole('button', { name: 'Mặt board 2D', exact: true }).click()
    await expect(canvas).toBeVisible()
    await expect(top.getByRole('heading', { name: 'D0/RX' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await mkdir('.tmp/l2-evidence', { recursive: true })
    await top.screenshot({ path: `.tmp/l2-evidence/uno-top-${width}.png` })
  })

  test(`five reference boards expose their projected header pads and both CAD layers at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    for (const [id, pinCount, partCount] of boards) {
      await page.goto(`/app/boards?board=${id}&view=top`)
      const inspector = page.getByRole('region', { name: 'Mặt board 2D' })
      const contacts = inspector.getByRole('combobox', { name: 'Chân header' })
      await expect(contacts.locator('option')).toHaveCount(pinCount + 1)
      const parts = inspector.getByRole('combobox', { name: 'Linh kiện trên board' })
      await expect(parts).toBeVisible()
      const frontCount = await parts.locator('option').count() - 1
      const back = inspector.getByRole('button', { name: 'Mặt sau' })
      await back.click()
      await expect(back).toHaveAttribute('aria-pressed', 'true')
      const backCount = await parts.locator('option').count() - 1
      expect(frontCount + Math.max(0, backCount)).toBe(partCount)
      await back.click()
      await expect(back).toHaveAttribute('aria-pressed', 'false')
      await parts.selectOption({ index: 1 })
      await expect(inspector.getByRole('heading', { level: 3 })).toBeVisible()
      await contacts.selectOption({ index: pinCount })
      await expect(page).toHaveURL(/[?&]pin=[\w-]+/)
      await expect(inspector.getByRole('heading', { level: 3 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  })
}
