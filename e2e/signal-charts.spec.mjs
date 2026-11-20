import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

for (const width of [375, 1440]) {
  test(`SPICE RC displays two real voltage traces, A/B and window controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height: width === 375 ? 812 : 900})
    await page.goto('/tools/spice')
    await page.getByRole('combobox', {name:'Bắt đầu từ ví dụ'}).selectOption('rc')
    await page.getByRole('button', { name:'Chạy SPICE', exact:true }).click()
    await expect(page.getByRole('heading', { name:'Mô phỏng hoàn tất' })).toBeVisible({timeout:30000})
    const second = page.getByRole('combobox', { name:'Kênh so sánh cùng đơn vị' })
    await second.selectOption({index:1})
    await expect(page.locator('[data-spice-series]')).toHaveCount(2)
    await expect(page.locator('.spice-chart-deltas output')).toHaveCount(2)
    await expect(page.locator('.spice-chart-deltas')).toContainText('ΔV')
    await expect(page.locator('.spice-chart-deltas')).toContainText('Δt')
    const before = await page.locator('[data-spice-series]').first().getAttribute('d')
    await page.getByRole('combobox',{name:'Thu phóng đồ thị'}).selectOption('4')
    await page.getByRole('slider',{name:'Vị trí cửa sổ'}).press('End')
    await expect(page.locator('[data-spice-series]').first()).not.toHaveAttribute('d', before)
    await page.locator('.spice-results').scrollIntoViewIfNeeded()
    await page.screenshot({path:`.tmp/l6d-spice-${width}.png`})
  })

  test(`sampled logic can pause, pan and download without voltage claims at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height: width === 375 ? 812 : 900})
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    await page.route('**/api/local-tools/**', route => route.fulfill({status:404, body:'unavailable'}))
    await page.goto('/app/lab/freestyle?board=esp32-devkit')
    await page.getByRole('button',{name:'Dựng mạch mẫu'}).click()
    await page.getByRole('button',{name:'Dạng sóng',exact:true}).click()
    await page.getByRole('button',{name:'▶ Chạy'}).click()
    const panel = page.getByRole('region',{name:'Dạng sóng tín hiệu'})
    await panel.getByRole('button',{name:'Tạm dừng đồ thị'}).click()
    await panel.getByRole('combobox',{name:'Thu phóng trace'}).selectOption('2')
    await expect(panel.getByRole('slider',{name:'Vị trí trace'})).toBeVisible()
    const [file] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button',{name:'Tải trace CSV'}).click()])
    const text = await readFile(await file.path(),'utf8')
    expect(text).toContain('t_ms_simulated,pin_23_logic')
    expect(text).toMatch(/,(HIGH|LOW)/)
    await panel.getByRole('button',{name:'Tiếp tục đồ thị'}).click()
    await expect(panel.getByRole('button',{name:'Tạm dừng đồ thị'})).toBeVisible()
  })
}
