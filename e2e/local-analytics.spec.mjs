import { test, expect } from '@playwright/test'

test.skip(process.env.MACHMO_ANALYTICS_E2E !== '1', 'Run with the local analytics fixture and its flagged build')

test('learning events reach storage and the private dashboard while public reads are blocked', async ({ page, request }) => {
  const publicOrigin = 'http://127.0.0.1:5288'
  const privateOrigin = 'http://127.0.0.1:8081'
  const summary = '/api/analytics/admin/summary?start=2026-01-01&end=2026-01-01'
  const pending = page.waitForResponse(response => response.url().endsWith('/api/analytics/events'))
  await page.goto(`${publicOrigin}/`)
  const first = await pending
  expect(first.status()).toBe(204)
  expect(first.request().postDataJSON()).toMatchObject({ event_name: 'page_view', path: '/' })

  const lessonEvent = page.waitForResponse(response => response.url().endsWith('/api/analytics/events') && response.request().postDataJSON().event_name === 'lesson_open')
  await page.goto(`${publicOrigin}/learn/esp32-led?board=esp32-devkit`)
  expect((await lessonEvent).status()).toBe(204)
  const preflights = []
  page.on('request', request => {
    if (!request.url().endsWith('/api/analytics/events')) return
    const event = request.postDataJSON()
    if (event.path === '/app/learn/lesson') preflights.push(event.event_name)
  })
  const preflightLesson = page.waitForResponse(response => response.url().endsWith('/api/analytics/events') && response.request().postDataJSON().path === '/app/learn/lesson' && response.request().postDataJSON().event_name === 'lesson_open')
  await page.goto(`${publicOrigin}/app/learn/blink`)
  expect((await preflightLesson).status()).toBe(204)
  await expect(page.getByRole('heading', { name: 'LED nhấp nháy' })).toBeVisible()
  expect(preflights.filter(event => event === 'page_view')).toHaveLength(1)
  expect((await request.get(publicOrigin + summary)).status()).toBe(404)

  await page.goto(`${privateOrigin}/admin`)
  await expect(page.getByRole('heading', { name: 'Người học đang khám phá gì?' })).toBeVisible()
  await expect(page.locator('.event-panel')).toContainText('Xem trang')
  await expect(page.locator('.event-panel')).toContainText('Mở bài học')
  await expect(page.locator('.route-panel')).toContainText('/learn/esp32-led')
})
