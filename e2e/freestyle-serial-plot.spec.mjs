import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const width of [375, 1440]) {
  test(`Serial monitor and opt-in plot preserve runtime data at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    // Exercise the existing offline-capable interpreter, without compiling or connecting a device.
    await page.route('**/api/local-tools/**', route => route.fulfill({ status: 404, body: 'unavailable' }))
    await page.goto('/build/freestyle')
    await page.getByRole('radio', { name: /Arduino Uno R3/ }).check()
    await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
    await page.getByLabel('Mã nguồn Arduino C++').fill(`void setup() {
  Serial.begin(9600);
  Serial.println("boot 123");
}
void loop() {
  Serial.println("sensor:12");
  Serial.println(42);
  Serial.print("temp:");
  Serial.println(7);
  Serial.println("LED: BAT");
  delay(300);
}`)
    await page.getByRole('tab', { name: /Quan sát/ }).click()
    const monitor = page.getByLabel('Đầu ra Serial', { exact: true })
    const plot = page.getByRole('region', { name: 'Serial Plotter', exact: true })
    await expect(plot.getByRole('button', { name: 'Mở đồ thị Serial' })).toHaveAttribute('aria-expanded', 'false')
    await expect(plot.getByRole('img')).toHaveCount(0)
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
    await expect(monitor).toContainText('temp:7')
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()
    const raw = await monitor.textContent()
    const waveformPopout = page.getByRole('region', { name: 'Cửa sổ dạng sóng' })
    await expect(waveformPopout).toBeVisible()
    await plot.getByRole('button', { name: 'Mở đồ thị Serial' }).click()
    await expect(plot.getByRole('img')).toBeVisible()
    await expect(waveformPopout).toHaveCount(0)
    await expect(plot).toContainText('Trình thông dịch rút gọn')
    await expect(plot).toContainText('không phải thời gian')
    await expect(plot.getByLabel('Chuỗi dữ liệu')).toHaveText('sensorGiá trịtemp')
    await plot.getByText(/Xem bảng giá trị/).click()
    await expect(plot.getByRole('table')).toContainText('12')
    await expect(plot.getByRole('table')).toContainText('42')
    const downloadEvent = page.waitForEvent('download')
    await plot.getByRole('button', { name: 'Tải CSV Serial' }).click()
    const download = await downloadEvent
    const chunks = []
    for await (const chunk of await download.createReadStream()) chunks.push(chunk)
    const csv = Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '')
    expect(csv).toMatch(/^sample,series,value\r\n1,"sensor",12\r\n2,"Giá trị",42\r\n3,"temp",7\r\n/)
    expect(csv).not.toMatch(/boot|LED|timestamp|time_ms/)
    await plot.getByRole('button', { name: 'Ẩn đồ thị Serial' }).click()
    await expect(monitor).toHaveText(raw)
    await plot.getByRole('button', { name: 'Mở đồ thị Serial' }).focus()
    await page.keyboard.press('Enter')
    await expect(plot.getByRole('img')).toBeVisible()
    const bounds = await plot.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    const axe = await new AxeBuilder({ page }).include('.freestyle-serial-card').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(axe.violations).toEqual([])
    await plot.screenshot({ path: testInfo.outputPath(`serial-plot-${width}.png`) })
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
    await expect(monitor).toContainText('temp:7')
    await expect(waveformPopout).toHaveCount(0)
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()
    await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '▶ Chạy' }).click()
    await expect(waveformPopout).toBeVisible()
    await page.getByRole('tab', { name: /Quan sát/ }).click()
    await expect(waveformPopout).toHaveCount(0)
    await expect(plot.getByRole('img')).toBeVisible()
    await page.locator('.freestyle-work-actions').getByRole('button', { name: '■ Dừng' }).click()
    await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
    await page.getByLabel('Mã nguồn Arduino C++').fill('void setup() {}\nvoid loop() {}')
    await page.getByRole('tab', { name: /Quan sát/ }).click()
    await expect(plot).toContainText('Chưa có mẫu số')
    await expect(plot.getByRole('button', { name: 'Tải CSV Serial' })).toBeDisabled()
  })
}
