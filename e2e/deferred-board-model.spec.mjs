import { expect, test } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

test('library loads a board mesh only after opening PCB 3D', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const requested = []
  page.on('request', request => {
    if (/\/models\/(?:optimized\/)?arduino-uno-r3(?:\.meshopt)?\.glb$/.test(new URL(request.url()).pathname)) requested.push(request.url())
  })
  await page.goto('/app/boards?board=arduino-uno-r3', { waitUntil: 'networkidle' })
  const stage = page.locator('.board-viewer-stage')
  await expect(page.getByRole('button', { name: 'Tổng quan', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(stage).toHaveCount(0)
  expect(requested).toEqual([])
  await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  await stage.scrollIntoViewIfNeeded()
  await expect.poll(() => requested.length).toBe(1)
  expect(requested[0]).toContain('/models/optimized/arduino-uno-r3.meshopt.glb')
})
