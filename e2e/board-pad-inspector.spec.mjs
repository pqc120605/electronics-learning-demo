import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const boards = [
  ['arduino-uno-r3', 44, 120], ['arduino-nano-classic', 36, 37],
  ['arduino-mega-2560-r3', 98, 72], ['esp32-devkit', 30, 26], ['raspberry-pi-pico', 40, 51],
]

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
