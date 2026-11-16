import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Bản build test không có biến Supabase: đăng nhập phải ở trạng thái "chưa kết nối", cộng đồng là bản xem trước.

test('login page shows a clear unconfigured state and never fakes a session', async ({ page }) => {
  await page.goto('/login?next=/community')
  await expect(page.getByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeVisible()
  await expect(page.getByText('Đăng nhập chưa được kết nối')).toBeVisible()
  for (const name of [/Đăng nhập bằng Google/, /Đăng nhập bằng GitHub/]) await expect(page.getByRole('button', { name })).toBeDisabled()
  await expect(page.getByRole('link', { name: 'Tiếp tục với chế độ khách' })).toBeVisible()
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sb-')))).toEqual([])
})

test('header and workspace topbar expose login while keeping guest mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/login\?next=%2F/)
  await page.goto('/app')
  await expect(page.locator('.workspace-topbar').getByText('Khách · lưu trên thiết bị')).toBeVisible()
  await page.locator('.workspace-topbar').getByRole('link', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/app\/login/)
  await page.goto('/auth/callback')
  await expect(page.getByRole('heading', { level: 1, name: 'Đăng nhập chưa được kết nối' })).toBeVisible()
})

test('community lists groups, filters by search, group and tag', async ({ page }) => {
  await page.goto('/community')
  await expect(page.getByRole('heading', { level: 1, name: /Cộng đồng điện tử/ })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('Bài viết chưa đồng bộ')
  for (const label of ['Điện tử cơ bản', 'Vi điều khiển & nhúng', 'IoT', 'Dự án', 'Hỏi đáp lỗi']) await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'IoT', exact: true }).click()
  await expect(page).toHaveURL(/cat=iot/)
  await expect(page.locator('.community-post-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'Tất cả nhóm' }).click()
  await page.getByLabel('Tìm bài').fill('gpio 34')
  await page.getByRole('button', { name: 'Tìm', exact: true }).click()
  await expect(page.locator('.community-post-card')).toHaveCount(1)
  await page.getByRole('link', { name: /GPIO 34/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: /GPIO 34/ })).toBeVisible()
  await expect(page.locator('.community-code pre code').first()).toContainText('pinMode(34, OUTPUT);')
  await page.getByRole('link', { name: '#esp32' }).click()
  await expect(page).toHaveURL(/\/community\?tag=esp32/)
  await expect(page.getByRole('button', { name: /#esp32/ })).toHaveAttribute('aria-pressed', 'true')
})

test('guest can draft a post with code, comment and report; HTML stays text', async ({ page }) => {
  await page.goto('/app/community/new')
  await expect(page.getByRole('heading', { level: 1, name: 'Viết bài mới' })).toBeVisible()
  await expect(page.getByText(/viết nháp dưới tên khách/)).toBeVisible()
  await page.getByRole('button', { name: /Đăng bài/ }).click()
  await expect(page.getByText('Tiêu đề cần ít nhất 8 ký tự.')).toBeVisible()
  await page.getByLabel('Tiêu đề').fill('Thử nghiệm <img src=x onerror=alert(1)>')
  await page.getByLabel('Nhóm chủ đề').selectOption('nhung')
  await page.getByLabel(/^Thẻ/).fill('esp32, Thử nghiệm')
  await page.getByRole('textbox', { name: 'Nội dung' }).fill('Mạch không chạy, đây là code: <script>window.__xss = 1</script>\n')
  await page.getByRole('button', { name: 'Chèn khối code' }).click()
  await page.getByRole('button', { name: 'Xem trước' }).click()
  await expect(page.getByRole('region', { name: 'Xem trước nội dung' }).locator('pre code')).toContainText('// dán code ở đây')
  await page.getByRole('button', { name: 'Quay lại soạn' }).click()
  await page.getByRole('button', { name: /Đăng bài/ }).click()
  await expect(page).toHaveURL(/\/app\/community\/local-/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thử nghiệm <img src=x onerror=alert(1)>')
  await expect(page.locator('.community-article img')).toHaveCount(0)
  await expect(page.locator('.community-article-body')).toContainText('<script>window.__xss = 1</script>')
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  await expect(page.locator('.community-article .community-chip-local')).toBeVisible()

  await page.getByRole('textbox', { name: 'Viết bình luận' }).fill('Đã thử đổi chân `GPIO 23` và chạy được.')
  await page.getByRole('button', { name: 'Gửi bình luận' }).click()
  await expect(page.getByRole('heading', { name: '1 bình luận' })).toBeVisible()
  await expect(page.locator('.community-comment code')).toHaveText('GPIO 23')

  await page.locator('.community-article').getByRole('button', { name: 'Báo cáo' }).click()
  await page.getByLabel('Lạc chủ đề').check()
  await page.getByRole('button', { name: 'Gửi báo cáo' }).click()
  await expect(page.getByText(/Đã ghi nhận báo cáo trên thiết bị này/)).toBeVisible()

  await page.goto('/app/community')
  await expect(page.locator('.community-post-card').first()).toContainText('Thử nghiệm')
})

const routes = ['/login', '/app/login', '/community', '/app/community', '/community/esp32-gpio-34-khong-output', '/community/new']

for (const width of [375, 1440]) for (const route of routes) test(`a11y ${width}px ${route}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(route)
  await expect(page.locator('main h1')).toBeVisible()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`no document scroll at ${viewport.width}x${viewport.height} for login/community`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('main h1')).toBeVisible()
      const size = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, inner: innerHeight, width: document.documentElement.scrollWidth, innerWidth }))
      expect(size.height, route).toBeLessThanOrEqual(size.inner)
      expect(size.width, route).toBeLessThanOrEqual(size.innerWidth)
    }
  })
}
