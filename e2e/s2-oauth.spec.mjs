import { expect, test } from '@playwright/test'

test.skip(process.env.MACHMO_S2_E2E !== '1', 'Build the self-hosted OAuth staging surface first')

const draft = { title: 'Mạch thử giữ nháp', body: 'Đây là nội dung nháp mạch đang thử trước khi đăng nhập.', category: 'co-ban', tagText: 'led' }
const postId = '89c6dd67-d568-4329-860d-b8fb91b51b45'
for (const provider of ['google', 'github']) for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
  test(provider + ' mock login preserves local draft and unlocks write at ' + viewport.width, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(value => {
      if (!localStorage.getItem('mach-mo-community-compose-v1')) localStorage.setItem('mach-mo-community-compose-v1', JSON.stringify(value))
    }, draft)
    let user = null
    let published = null
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/session') return route.fulfill({ json: { user } })
      if (url.pathname === '/api/session/logout') {
        expect(route.request().headers()['x-machmo-csrf']).toBe('1')
        user = null
        return route.fulfill({ status: 204 })
      }
      if (url.pathname === '/api/auth/login/' + provider) {
        expect(url.searchParams.get('next')).toBe('/community/new')
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><a href="/api/auth/callback/' + provider + '">Chọn tài khoản thử</a>' })
      }
      if (url.pathname === '/api/auth/callback/' + provider) {
        user = { id: postId, displayName: 'Tài khoản thử', avatarUrl: null, provider, role: 'user' }
        return route.fulfill({ status: 303, headers: { Location: '/community/new' } })
      }
      if (url.pathname === '/api/community/posts' && route.request().method() === 'POST') {
        expect(user?.provider).toBe(provider)
        expect(route.request().headers()['x-machmo-csrf']).toBe('1')
        const payload = route.request().postDataJSON()
        expect(payload.title).toBe(draft.title)
        published = { ...payload, author: { name: 'Tài khoản thử', avatarUrl: null }, createdAt: '2026-11-21T00:00:00Z',
          commentCount: 0, origin: 'remote', canEdit: true }
        return route.fulfill({ status: 201, json: published })
      }
      if (url.pathname.endsWith('/comments')) return route.fulfill({ json: [] })
      if (published && url.pathname === '/api/community/posts/' + published.id) return route.fulfill({ json: published })
      return route.fulfill({ status: 404 })
    })
    await page.goto('/community/new')
    await expect(page.getByRole('heading', { name: 'Viết bài mới' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đăng bài online' })).toHaveCount(0)
    await page.getByRole('link', { name: 'Đăng nhập bằng Google hoặc GitHub' }).click()
    const label = provider === 'google' ? /Đăng nhập bằng Google/ : /Đăng nhập bằng GitHub/
    await page.getByRole('button', { name: label }).click()
    await page.getByRole('link', { name: 'Chọn tài khoản thử' }).click()
    await expect(page).toHaveURL(/\/community\/new$/)
    await expect(page.getByLabel('Tiêu đề')).toHaveValue(draft.title)
    await expect(page.getByRole('textbox', { name: 'Nội dung' })).toHaveValue(draft.body)
    await page.getByRole('button', { name: 'Đăng bài online' }).click()
    await expect(page.getByRole('heading', { name: draft.title })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sửa bài viết' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1)
    await page.goto('/login')
    await page.getByRole('region', { name: 'Đăng nhập', exact: true }).getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page.getByRole('button', { name: label })).toBeEnabled()
    expect(user).toBeNull()
  })
}

test('unavailable API is visible and preview can still open local drafts', async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('mach-mo-community-compose-v1', JSON.stringify(value)), draft)
  await page.route('**/api/**', route => route.fulfill({ status: 503 }))
  await page.goto('/login?next=/community/new')
  await expect(page.getByRole('alert')).toContainText('Máy chủ Mạch Mở hiện chưa khả dụng')
  await expect(page.getByRole('button', { name: /Đăng nhập bằng Google/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Kiểm tra lại kết nối' })).toBeVisible()
  await page.goto('/community/new')
  await page.getByRole('button', { name: 'Xem bài trên thiết bị' }).click()
  await expect(page.getByRole('note')).toContainText('Bản xem trước')
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(draft.title)
  await expect(page.getByRole('textbox', { name: 'Nội dung' })).toHaveValue(draft.body)
})
