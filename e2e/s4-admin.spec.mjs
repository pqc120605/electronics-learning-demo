import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.skip(process.env.MACHMO_S4_E2E !== '1', 'Build the staging admin with both flags first')

const reports = {
  summary: { eventCount: 3, sessionCount: 1, daily: [{ day: '2026-11-21', events: 3, sessions: 1 }],
    byEvent: [], byPath: [{ path: '/build', events: 3 }], byLesson: [{ label: 'blink', count: 3 }],
    byBoard: [], byDevice: [{ label: 'mobile', count: 3 }], bySource: [], funnel: { opened: 1, ran: 1, completed: 1 } },
  ai: { used: 9, limit: 10, nearLimit: true, models: [{ model: 'mock', provider: 'mock', requests: 5, insufficient: 1, errors: 0,
    cacheHits: 2, p50Ms: 10, p95Ms: 30, inputTokens: 0, outputTokens: 0, estimatedUsd: null, helpful: 1, unhelpful: 0 }] },
  community: { posts: 1, comments: 2, pendingReports: 0, totalAccounts: 12, newAccounts: [{ provider: 'github', count: 2 }] },
  feedback: { total: 0, rated: 0, average: null, items: [] },
  system: { api: 'ready', database: 'ready', ai: 'mock', ramFreeBytes: 2 ** 30, ramTotalBytes: 2 ** 32, diskFreeBytes: 2 ** 35, latestBackup: null, commit: '0123456789abcdef' },
}

test('feedback submission is explicit and the admin inbox survives a report outage', async ({ page }) => {
  test.skip(process.env.MACHMO_FEEDBACK_E2E !== '1', 'Build with online feedback enabled first')
  let userSession = null
  const attempts = []
  await page.route('**/api/session', route => route.fulfill({ json: { user: userSession } }))
  await page.route('**/api/analytics/events', route => route.fulfill({ status: 204 }))
  await page.route('**/api/feedback', route => {
    expect(route.request().headers()['x-machmo-csrf']).toBe('1')
    attempts.push(route.request().postDataJSON())
    return route.fulfill({ status: attempts.length === 1 ? 503 : 204 })
  })
  await page.goto('/feedback')
  await page.getByLabel('Tiêu đề *', { exact: true }).fill('Lỗi mô phỏng LED')
  await page.getByLabel('Mô tả của bạn *', { exact: true }).fill('LED tắt sau khi bắt đầu chạy mô phỏng.')
  await page.getByRole('button', { name: 'Xem lại nội dung', exact: true }).click()
  expect(attempts).toHaveLength(0)
  await page.getByLabel('Đánh giá trải nghiệm (không bắt buộc)').selectOption('4')
  const send = page.getByRole('button', { name: 'Gửi góp ý', exact: true })
  await send.click()
  await expect(page.getByRole('alert')).toContainText('Bản nháp vẫn còn')
  await send.click()
  await expect(page.getByText('Đã gửi góp ý cho quản trị viên Mạch Mở.')).toBeVisible()
  await expect(send).toBeDisabled()
  expect(attempts).toHaveLength(2)
  expect(attempts[1]).toEqual(attempts[0])
  expect(attempts[1].rating).toBe(4)

  userSession = { ...user, role: 'admin' }
  let aiUnavailable = true
  await page.route('**/api/admin/**', route => {
    const section = new URL(route.request().url()).pathname.split('/').at(-1)
    if (section === 'ai' && aiUnavailable) return route.fulfill({ status: 503 })
    if (section === 'feedback') return route.fulfill({ json: {
      total: 1, rated: 1, average: 4, items: [{ ...attempts[1], createdAt: '2026-11-24T01:00:00.000Z' }],
    } })
    return route.fulfill({ json: reports[section] })
  })
  await page.goto('/admin')
  await expect(page.getByRole('alert')).toContainText('Không tải được Mở Bot')
  await expect(page.getByText('Trung bình 4/5 sao', { exact: false })).toBeVisible()
  await page.getByText('Lỗi mô phỏng LED', { exact: true }).click()
  await expect(page.getByText('LED tắt sau khi bắt đầu chạy mô phỏng.')).toBeVisible()
  await page.getByLabel('Loại góp ý').selectOption('idea')
  await expect(page.getByText('Chưa có góp ý loại này trong danh sách gần nhất.')).toBeVisible()
  aiUnavailable = false
  await page.getByRole('button', { name: 'Làm mới' }).click()
  await expect(page.getByRole('heading', { name: 'Mở Bot AI' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
const user = { id: 'fixture', displayName: 'Tester', avatarUrl: null, provider: 'github' }

test('staging admin skips reports for guests and regular users', async ({ page }) => {
  let account = null
  await page.route('**/api/session', route => route.fulfill({ json: { user: account } }))
  let loads = 0
  await page.route('**/api/admin/**', route => { loads++; return route.fulfill({ status: 403 }) })
  await page.goto('/admin')
  await expect(page.getByRole('link', { name: 'Đăng nhập để kiểm tra quyền quản trị' })).toBeVisible()
  account = { ...user, role: 'user' }
  await page.reload()
  await expect(page.getByRole('alert')).toHaveText('Tài khoản này chưa có quyền quản trị.')
  expect(loads).toBe(0)
})

for (const width of [375, 1440]) for (const colorScheme of ['light', 'dark']) {
  test('admin filters and chart at ' + width + ' ' + colorScheme, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ colorScheme })
    await page.route('**/api/session', route => route.fulfill({ json: { user: { ...user, role: 'admin' } } }))
    await page.route('**/api/admin/**', route => route.fulfill({ json: reports[new URL(route.request().url()).pathname.split('/').at(-1)] }))
    await page.route('**/api/analytics/events', route => route.fulfill({ status: 204 }))
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Phễu học theo phiên' })).toBeVisible()
    await expect(page.getByText('Đã dùng ít nhất 80% hạn mức hôm nay.')).toBeVisible()
    const summary = page.waitForResponse(response => response.url().endsWith('/api/admin/summary?days=30'))
    await page.getByRole('button', { name: '30 ngày' }).press('Enter')
    await summary
    await expect(page.getByRole('button', { name: '30 ngày' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByText('Xem bảng số liệu theo ngày').press('Enter')
    await expect(page.getByRole('rowheader', { name: '2026-11-21' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1)
    const audit = await new AxeBuilder({ page }).include('.s4-admin').analyze()
    expect(audit.violations.filter(item => ['critical', 'serious'].includes(item.impact))).toEqual([])
    await testInfo.attach('admin-dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  })
}
