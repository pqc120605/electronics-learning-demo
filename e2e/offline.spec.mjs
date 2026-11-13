import { test, expect } from '@playwright/test'

async function expectLabWorkspace(page) {
  await expect(page.getByRole('heading', { name: 'Chọn bài và board' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Không mở được phòng thử' })).toHaveCount(0)
}

test('app opens offline and a new worker deploy removes its previous cache', async ({ page, context, browser }, testInfo) => {
  await page.goto('/app/lab')
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
    expect(firstCount).toBe(5)

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
    expect(secondCount).toBe(5)
  } finally {
    await deploymentContext.close()
  }
})
