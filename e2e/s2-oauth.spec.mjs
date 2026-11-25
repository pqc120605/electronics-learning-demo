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

test('online attachments keep the draft after an interrupted upload and reassemble the same file', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const size = 1024 * 1024 + 3
  const original = Buffer.alloc(size, 65)
  const attachmentId = '71bebfb1-1ef3-4bf0-bdea-b47ee6194b00'
  const photoId = '24ebaeb3-19a9-45d2-ac1b-ea34be721c00'
  const user = { id: postId, displayName: 'Tester', avatarUrl: null, provider: 'google', role: 'user' }
  const chunks = new Map()
  let attempt = 0
  let draftId
  let published
  let downloadRequests = 0
  let photoRequests = 0
  let photo
  await page.route('**/api/**', async route => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    if (pathname === '/api/session') return route.fulfill({ json: { user } })
    if (pathname.startsWith('/api/community/uploads/')) {
      expect(request.method()).toBe('PUT')
      expect(request.headers()['x-machmo-csrf']).toBe('1')
      const [, , , , id, slot, part] = pathname.split('/')
      expect(['0', '1']).toContain(slot)
      if (part === undefined) {
        expect(request.postDataJSON()).toEqual(slot === '0' ? { name: 'log.txt', size } : { name: 'circuit.png', size: photo.length })
        if (draftId) expect(id).toBe(draftId)
        draftId = id
        if (slot === '0') attempt++
        return route.fulfill({ status: 204 })
      }
      if (part === '1' && attempt === 1) return route.fulfill({ status: 503 })
      chunks.set(slot + ':' + part, request.postDataBuffer())
      return route.fulfill({ status: 204 })
    }
    const detail = '/api/community/posts/' + draftId
    const path = detail + '/attachments/' + attachmentId
    const photoPath = detail + '/attachments/' + photoId
    if (pathname === '/api/community/posts' && request.method() === 'POST') {
      const input = request.postDataJSON()
      expect(input).toMatchObject({ id: draftId, attachmentCount: 2 })
      expect(Buffer.concat([chunks.get('0:0'), chunks.get('0:1')])).toEqual(original)
      expect(chunks.get('1:0')).toEqual(photo)
      published = { ...input, author: { name: 'Tester', avatarUrl: null }, createdAt: '2026-11-25T00:00:00Z',
        commentCount: 0, origin: 'remote', canEdit: true, attachments: [
          { id: attachmentId, name: 'log.txt', kind: 'file', size, path },
          { id: photoId, name: 'circuit.png', kind: 'image', size: photo.length, path: photoPath },
        ] }
      return route.fulfill({ status: 201, json: published })
    }
    if (pathname === detail && published) return route.fulfill({ json: published })
    if (pathname.startsWith(path + '/')) {
      downloadRequests++
      return route.fulfill({ contentType: 'application/octet-stream', body: chunks.get('0:' + pathname.at(-1)) })
    }
    if (pathname === photoPath + '/0') {
      photoRequests++
      return route.fulfill({ contentType: 'application/octet-stream', body: chunks.get('1:0') })
    }
    if (pathname.endsWith('/comments')) return route.fulfill({ json: [] })
    return route.fulfill({ status: 404 })
  })
  await page.goto('/community/new')
  await page.getByLabel('Tiêu đề').fill(draft.title)
  await page.getByLabel('Nhóm chủ đề').selectOption('iot')
  await page.getByRole('textbox', { name: 'Nội dung' }).fill(draft.body)
  photo = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    canvas.getContext('2d').fillRect(0, 0, 2, 2)
    return canvas.toDataURL('image/png').split(',')[1]
  }), 'base64')
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles([
    { name: 'log.txt', mimeType: 'text/plain', buffer: original },
    { name: 'circuit.png', mimeType: 'image/png', buffer: photo },
  ])
  const publish = page.getByRole('button', { name: 'Đăng bài online' })
  await publish.click()
  await expect(page.getByRole('alert')).toContainText('Máy chủ Mạch Mở hiện chưa khả dụng')
  expect(published).toBeUndefined()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(draft.title)
  await expect(page.getByRole('button', { name: 'Gỡ log.txt' })).toBeVisible()
  await publish.click()
  await expect(page.getByRole('heading', { name: draft.title })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Xem trước circuit.png' })).toBeVisible()
  expect(photoRequests).toBe(1)
  expect(downloadRequests).toBe(0)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải log.txt' }).click()
  const downloaded = await downloadEvent
  expect(downloaded.suggestedFilename()).toBe('log.txt')
  const stream = await downloaded.createReadStream()
  const pieces = []
  for await (const bytes of stream) pieces.push(bytes)
  expect(Buffer.concat(pieces)).toEqual(original)
  expect(downloadRequests).toBe(2)
})
