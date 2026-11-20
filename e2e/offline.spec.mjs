import { test, expect } from '@playwright/test'

async function expectLabWorkspace(page) {
  await expect(page.getByRole('heading', { name: 'Chọn bài và board' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Không mở được phòng thử' })).toHaveCount(0)
}

test('app opens offline and a new worker deploy removes its previous cache', async ({ page, context, browser }, testInfo) => {
  await page.goto('/app/lab?board=esp32-devkit')
  await expect(page.locator('body')).toContainText(/Mạch|Học|Thực hành/)
  await expectLabWorkspace(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js?v=')
  await expectLabWorkspace(page)
  await context.setOffline(true)
  await page.reload()
  await expectLabWorkspace(page)
  expect(await page.evaluate(() => location.pathname)).toBe('/app/lab')

  const deploymentContext = await browser.newContext()
  try {
    const deploymentPage = await deploymentContext.newPage()
    const baseURL = testInfo.project.use.baseURL
    await deploymentPage.goto(new URL('/offline.html', baseURL).href)
    await deploymentPage.evaluate(() => navigator.serviceWorker.register('/sw.js?v=e2e-deploy-one', { scope: '/' }))
    await expect.poll(() => deploymentPage.evaluate(() => caches.keys().then(names => names.filter(name => name.startsWith('mach-mo-shell-'))))).toEqual(['mach-mo-shell-e2e-deploy-one'])
    await expect.poll(() => deploymentPage.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/')
      return { active: registration?.active?.scriptURL, controller: navigator.serviceWorker.controller?.scriptURL }
    })).toEqual({
      active: expect.stringContaining('v=e2e-deploy-one'),
      controller: expect.stringContaining('v=e2e-deploy-one'),
    })
    const firstCount = await deploymentPage.evaluate(async () => (await caches.open('mach-mo-shell-e2e-deploy-one')).keys().then(keys => keys.length))
    // 3 URL shell (/, /offline.html, manifest) + mọi asset JS/CSS mà index.html tham chiếu; số chunk phụ thuộc bundler.
    const entryAssets = await deploymentPage.evaluate(async () => new Set([...(await (await fetch('/')).text()).matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map(match => match[1])).size)
    expect(entryAssets).toBeGreaterThanOrEqual(2)
    expect(firstCount).toBe(3 + entryAssets)

    await deploymentPage.evaluate(() => navigator.serviceWorker.register('/sw.js?v=e2e-deploy-two', { scope: '/' }))
    await expect.poll(() => deploymentPage.evaluate(() => caches.keys().then(names => names.filter(name => name.startsWith('mach-mo-shell-'))))).toEqual(['mach-mo-shell-e2e-deploy-two'])
    await expect.poll(() => deploymentPage.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/')
      return { active: registration?.active?.scriptURL, controller: navigator.serviceWorker.controller?.scriptURL }
    })).toEqual({
      active: expect.stringContaining('v=e2e-deploy-two'),
      controller: expect.stringContaining('v=e2e-deploy-two'),
    })
    const secondCount = await deploymentPage.evaluate(async () => (await caches.open('mach-mo-shell-e2e-deploy-two')).keys().then(keys => keys.length))
    expect(secondCount).toBe(3 + entryAssets)
  } finally {
    await deploymentContext.close()
  }
})

test('already opened model and solver bytes remain available offline', async ({ page, context }) => {
  await page.goto('/offline.html')
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js?v=e2e-viewer-assets', { scope: '/' }))
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('e2e-viewer-assets')
  const assets = ['/models/arduino-uno-r3.glb?v=53330cd2b0d2', '/models/optimized/arduino-uno-r3.meshopt.glb?v=3ea6670274cc', '/vendor/eecircuit-engine/spice.wasm']
  const signatures = paths => Promise.all(paths.map(async path => {
    const response = await fetch(path)
    return [...new Uint8Array(await response.arrayBuffer(), 0, 4)]
  }))
  const expected = [[103, 108, 84, 70], [103, 108, 84, 70], [0, 97, 115, 109]]
  expect(await page.evaluate(signatures, assets)).toEqual(expected)
  await context.setOffline(true)
  expect(await page.evaluate(signatures, assets)).toEqual(expected)
})

test('a new app version opens in a separate tab and keeps the current circuit', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
  await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  await expect(page.locator('[data-diagram-part="led1"]')).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js?v=')
  const notice = page.getByRole('complementary', { name: 'Cập nhật ứng dụng' })
  await expect(notice).toHaveCount(0)
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js?v=e2e-update-notice', { scope: '/' }))
  await expect(notice.getByRole('status')).toContainText('Có bản mới')
  const priorLocation = page.url()
  const newPage = context.waitForEvent('page')
  await notice.getByRole('link', { name: 'Mở bản mới' }).click()
  const updated = await newPage
  await updated.waitForURL(priorLocation)
  await expect(page.locator('[data-diagram-part="led1"]')).toBeVisible()
  await updated.close()
})
