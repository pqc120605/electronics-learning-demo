import { expect, test } from '@playwright/test'

for (const width of [375, 1440]) {
  test(`shared circuit runs in read-only and creates an independent draft at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
    await page.getByRole('button', { name: 'Dựng mạch mẫu' }).click()
    await page.getByRole('button', { name: 'Chia sẻ mạch', exact: true }).click()
    const link = page.getByRole('textbox', { name: 'Liên kết chỉ đọc' })
    await expect(link).toHaveValue(/#s=1\./)
    const target = await link.inputValue()
    const storage = () => page.evaluate(() => Object.fromEntries(
      Object.keys(localStorage).filter(key => key.startsWith('machmo-freestyle-v1')).map(key => [key, localStorage.getItem(key)])
    ))
    const before = await storage()
    await page.goto(target)
    await expect(page.getByRole('heading', { name: 'Mạch chia sẻ · chỉ đọc' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Mã nguồn Arduino C++' })).toHaveAttribute('readonly', '')
    await expect(page.getByRole('button', { name: 'Dựng mạch mẫu' })).toHaveCount(0)
    const compileRequests = []
    page.on('request', request => { if (request.url().endsWith('/api/local-tools/compile')) compileRequests.push(request) })
    await page.getByRole('button', { name: '▶ Chạy' }).click()
    await expect(page.getByRole('button', { name: '■ Dừng' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Cửa sổ dạng sóng' })).toBeVisible()
    await page.screenshot({ path: `.tmp/l6a-share-${width}.png` })
    expect(compileRequests).toHaveLength(0)
    expect(await storage()).toEqual(before)
    await page.getByRole('button', { name: 'Mở bản sao để sửa' }).click()
    await expect(page.getByText(/Đang sửa bản sao/)).toBeVisible()
    const afterCopy = await storage()
    expect(afterCopy['machmo-freestyle-v1']).toBe(before['machmo-freestyle-v1'])
    expect(Object.keys(afterCopy).filter(key => !Object.hasOwn(before, key))).toHaveLength(1)
    await page.goto('/app/lab/freestyle#s=1.invalid')
    await expect(page.getByRole('alert')).toContainText('Liên kết mạch không hợp lệ')
    expect(await storage()).toEqual(afterCopy)
  })
}
