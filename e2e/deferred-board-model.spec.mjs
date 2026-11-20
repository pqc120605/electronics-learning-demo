import { expect, test } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

test('library defers 3D model bytes until the stage approaches the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const requested = []
  page.on('request', request => {
    if (/\/models\/(?:optimized\/)?arduino-uno-r3(?:\.meshopt)?\.glb$/.test(new URL(request.url()).pathname)) requested.push(request.url())
  })
  await page.goto('/app/boards?board=arduino-uno-r3', { waitUntil: 'networkidle' })
  const stage = page.locator('.board-viewer-stage')
  await expect(stage).toBeAttached()
  expect((await stage.boundingBox()).y).toBeGreaterThan(812)
  expect(requested).toEqual([])
  await stage.scrollIntoViewIfNeeded()
  await expect.poll(() => requested.length).toBe(1)
  expect(requested[0]).toContain('/models/optimized/arduino-uno-r3.meshopt.glb')
})
