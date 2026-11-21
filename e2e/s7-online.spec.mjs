import { expect, test } from '@playwright/test'

test.skip(process.env.MACHMO_S7_E2E !== '1', 'Build the self-hosted account UI before running these tests')

const user = { id: 'student-fixture', displayName: 'Học sinh thử', avatarUrl: null, provider: 'github', role: 'user' }
const snapshotId = 'ce5ab2aa-166a-4e53-8332-c3da0a4be7a0'
const code = '0123456789ABCDEF'
const createdAt = '2026-11-21T08:00:00Z'

test('publish a freestyle snapshot by link and fork without overwriting the current bench', async ({ page }) => {
  let account = user
  let saved
  await page.route('**/api/session', route => route.fulfill({ json: { user: account } }))
  await page.route('**/api/projects', route => {
    expect(route.request().headers()['x-machmo-csrf']).toBe('1')
    saved = route.request().postDataJSON()
    expect(saved.bundle.format).toBe('mach-mo-freestyle')
    expect(saved.bundle.workspace.boardId).toBe('arduino-uno-r3')
    return route.fulfill({ status: 201, json: { item: { id: snapshotId } } })
  })
  await page.route('**/api/projects/shares', route => {
    expect(route.request().postDataJSON()).toEqual({ id: snapshotId, listed: false })
    return route.fulfill({ status: 201, json: { code } })
  })
  await page.route('**/api/projects/shares/' + code, route => route.fulfill({
    json: { code, listed: false, createdAt, views: 1, likes: 0, name: saved.name, bundle: saved.bundle },
  }))
  await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Chia sẻ online' }).click()
  await page.getByRole('textbox', { name: 'Tên mạch chia sẻ' }).fill('Mạch LED của lớp')
  await page.getByRole('button', { name: 'Tạo link ngắn' }).click()
  await expect(page.getByRole('textbox', { name: 'Liên kết chỉ đọc' })).toHaveValue(new RegExp('/s/' + code + '$'))
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  account = null
  await page.goto('/s/' + code)
  await expect(page.getByRole('heading', { name: 'Mạch LED của lớp' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mạch chia sẻ · chỉ đọc' })).toBeVisible()
  await page.getByRole('button', { name: 'Mở bản sao để sửa' }).click()
  await expect(page.getByText('Đang sửa bản sao.', { exact: false })).toBeVisible()
  const after = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  for (const [key, value] of Object.entries(before).filter(([key]) => key.includes('freestyle'))) expect(after[key]).toBe(value)
  expect(Object.keys(after).some(key => key.includes('freestyle') && key.includes(':previous:') && !Object.hasOwn(before, key))).toBe(true)
})

test('student can submit a guided snapshot with the required assignment and account', async ({ page }) => {
  let submitted = 0
  await page.route('**/api/session', route => route.fulfill({ json: { user } }))
  await page.route('**/api/classes', route => route.fulfill({ json: [{ id: 'fixture-class', title: 'Lớp LED', role: 'student' }] }))
  await page.route('**/api/classes/fixture-class', route => route.fulfill({
    json: { id: 'fixture-class', title: 'Lớp LED', role: 'student', kit: { boardId: 'esp32-devkit', lessonIds: ['blink'] },
      assignments: [{ id: 'fixture-assignment', lessonId: 'blink', submitted }] },
  }))
  await page.route('**/api/projects', route => route.fulfill({
    json: [{ id: snapshotId, name: 'Bài nộp LED', format: 'mach-mo-project' }, { id: code, name: 'Mạch tự do', format: 'mach-mo-freestyle' }],
  }))
  await page.route('**/api/classes/fixture-class/submissions', route => {
    expect(route.request().headers()['x-machmo-csrf']).toBe('1')
    expect(route.request().postDataJSON()).toEqual({ assignmentId: 'fixture-assignment', projectId: snapshotId })
    submitted++
    return route.fulfill({ status: 204 })
  })
  await page.goto('/app/classroom-kits')
  const room = page.getByRole('region', { name: 'Lớp học online' })
  await room.getByLabel('Lớp của bạn').selectOption('fixture-class')
  await room.getByText(/Chưa nộp$/).click()
  await expect(room.getByRole('option', { name: 'Mạch tự do' })).toHaveCount(0)
  await room.getByLabel('Bản project đã lưu trên tài khoản').selectOption(snapshotId)
  await room.getByRole('button', { name: 'Nộp bài' }).click()
  await expect(room.getByRole('status')).toHaveText('Máy chủ đã nhận bài nộp.')
  await expect(room.getByText(/Đã nộp$/)).toBeVisible()
})
