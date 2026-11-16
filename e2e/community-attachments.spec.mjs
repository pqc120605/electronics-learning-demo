import { test, expect } from '@playwright/test'
// Generate known-decodable raster bytes with the browser encoder under test.
async function validPng(page) {
  return Buffer.from(await page.evaluate(() => {
    const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2
    canvas.getContext('2d').fillRect(0,0,2,2)
    return canvas.toDataURL('image/png').split(',')[1]
  }), 'base64')
}
async function compose(page) {
  await page.goto('/community/new')
  await page.getByLabel('Tiêu đề').fill('Kiểm tra tệp đính kèm cộng đồng')
  await page.getByLabel('Nhóm chủ đề').selectOption('iot')
  await page.getByRole('textbox', { name: 'Nội dung' }).fill('Mô tả đầy đủ để kiểm tra lưu trữ tệp cục bộ.')
}
for (const width of [375, 1440]) test(`attachments preview/remove, persist, download and missing blob ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await compose(page)
  const png=await validPng(page)
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles([
    { name: 'circuit.png', mimeType: 'image/png', buffer: png },
    { name: 'blink.ino', mimeType: 'text/plain', buffer: Buffer.from('void setup() {}') },
  ])
  await expect(page.getByRole('img', { name: 'Xem trước circuit.png' })).toBeVisible()
  await page.getByRole('button', { name: 'Gỡ circuit.png' }).click()
  await expect(page.getByRole('img', { name: 'Xem trước circuit.png' })).toHaveCount(0)
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles({ name: 'circuit.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByRole('img', { name: 'Xem trước circuit.png' })).toBeVisible()
  await page.getByRole('button', { name: /Đăng bài \(lưu/ }).click()
  await expect(page).toHaveURL(/\/community\/local-/)
  await page.reload()
  await expect(page.getByRole('img', { name: 'Xem trước circuit.png' })).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải blink.ino' }).click()
  expect((await downloadEvent).suggestedFilename()).toBe('blink.ino')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('mach-mo-community-attachments-v1'); r.onsuccess = () => resolve(r.result); r.onerror = reject })
    await new Promise((resolve, reject) => { const tx = db.transaction('blobs','readwrite'); tx.objectStore('blobs').clear(); tx.oncomplete = resolve; tx.onabort = reject })
    db.close()
  })
  await page.reload()
  await expect(page.getByText(/Thiếu tệp trên thiết bị này/)).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Tải blink.ino' })).toBeDisabled()
})
test('rejects sixth file and fake raster without publishing or clearing compose input', async ({ page }) => {
  await compose(page)
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles(Array.from({ length: 6 }, (_, i) => ({ name: `${i}.txt`, mimeType: 'text/plain', buffer: Buffer.from('x') })))
  await expect(page.getByRole('alert')).toContainText('Tối đa 5')
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<svg onload=alert(1)>') })
  await expect(page.getByRole('alert')).toContainText('Không giải mã')
  await page.getByRole('button', { name: /Đăng bài \(lưu/ }).click()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Kiểm tra tệp đính kèm cộng đồng')
  await expect(page).toHaveURL(/\/community\/new/)
  await page.getByRole('button', { name: 'Gỡ các tệp không hợp lệ' }).click()
  await page.reload()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Kiểm tra tệp đính kèm cộng đồng')
})
test('IndexedDB failure retains compose files and text and does not save a partial post', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }) })
  await compose(page)
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles({ name: 'code.txt', mimeType: 'text/plain', buffer: Buffer.from('code') })
  await expect(page.getByRole('button', { name: 'Tải code.txt' })).toBeEnabled()
  await page.getByRole('button', { name: /Đăng bài \(lưu/ }).click()
  await expect(page.getByRole('alert')).toContainText('IndexedDB không khả dụng')
  await expect(page.getByRole('button', { name: 'Tải code.txt' })).toBeEnabled()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Kiểm tra tệp đính kèm cộng đồng')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mach-mo-community-preview-v1') ?? '{"posts":[]}').posts)).toEqual([])
})

test('denied localStorage getter cannot turn a compose draft into a volatile successful post', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('community-denial-tested')) return
    sessionStorage.setItem('community-denial-tested', '1')
    const nativeStorage = window.localStorage
    nativeStorage.setItem('mach-mo-community-compose-v1', JSON.stringify({ title: 'Nháp chữ đã lưu trước khi bị chặn', body: 'Nội dung cũ cần khôi phục sau khi được cấp lại quyền lưu.', category: 'iot', tagText: 'recovery' }))
    window.__communityNativeLocalStorage = nativeStorage
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Access denied', 'SecurityError') } })
  })
  await compose(page)
  await page.getByRole('button', { name: /Đăng bài \(lưu/ }).click()
  await expect(page.getByText('Trình duyệt không cho lưu bài nháp trên thiết bị.')).toBeVisible()
  await expect(page.getByText(/Không lưu được nháp chữ; biểu mẫu hiện chỉ ở bộ nhớ/)).toBeVisible()
  await expect(page).toHaveURL(/\/community\/new/)
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Kiểm tra tệp đính kèm cộng đồng')
  await expect(page.getByRole('textbox', { name: 'Nội dung' })).toHaveValue('Mô tả đầy đủ để kiểm tra lưu trữ tệp cục bộ.')
  expect(await page.evaluate(() => window.__communityNativeLocalStorage.getItem('mach-mo-community-preview-v1'))).toBeNull()
  expect(await page.evaluate(() => JSON.parse(window.__communityNativeLocalStorage.getItem('mach-mo-community-compose-v1')).title)).toBe('Nháp chữ đã lưu trước khi bị chặn')
  await page.reload()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Nháp chữ đã lưu trước khi bị chặn')
})

test('denied IndexedDB getter keeps the community page usable and rejects attachment persistence in place', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new DOMException('Access denied', 'SecurityError') } }) })
  await compose(page)
  await page.getByLabel('Ảnh / tệp đính kèm').setInputFiles({ name: 'denied.txt', mimeType: 'text/plain', buffer: Buffer.from('retained file') })
  await expect(page.getByRole('button', { name: 'Tải denied.txt' })).toBeEnabled()
  await page.getByRole('button', { name: /Đăng bài \(lưu/ }).click()
  await expect(page.getByRole('alert')).toContainText('IndexedDB không khả dụng')
  await expect(page).toHaveURL(/\/community\/new/)
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Kiểm tra tệp đính kèm cộng đồng')
  await expect(page.getByRole('button', { name: 'Tải denied.txt' })).toBeEnabled()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mach-mo-community-preview-v1') ?? '{"posts":[]}').posts)).toEqual([])
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mach-mo-community-compose-v1')).title)).toBe('Kiểm tra tệp đính kèm cộng đồng')
  expect(pageErrors).toEqual([])
})
