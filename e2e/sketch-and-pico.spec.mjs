import { test, expect } from '@playwright/test'

// 2026-11-14: sketch chạy bằng trình thông dịch trên web; Pico chạy mã máy thật bằng rp2040js.
test('ESP32 button sketch runs in the browser and reacts to a held input', async ({ page }) => {
  await page.goto('/tools/sketch')
  await page.getByRole('combobox', { name: 'Ví dụ' }).selectOption('esp32-button')
  await page.getByRole('button', { name: '▶ Chạy' }).click()
  const button = page.getByRole('button', { name: /Giữ để nhấn · GPIO 4/ })
  await expect(button).toBeVisible()
  await button.hover()
  await page.mouse.down()
  await expect(page.locator('.sketch-pins li').filter({ hasText: 'GPIO 2' })).toContainText('HIGH')
  await expect(page.getByLabel('Đầu ra Serial')).toContainText('Nhan')
  await page.mouse.up()
  await expect(page.locator('.sketch-pins li').filter({ hasText: 'GPIO 2' })).toContainText('LOW')
})

test('sketch errors point at the line and switching board changes pin rules', async ({ page }) => {
  await page.goto('/tools/sketch')
  await page.getByRole('combobox', { name: 'Board / MCU' }).selectOption('esp32-s3-devkitc-1')
  await page.getByRole('button', { name: '▶ Chạy' }).click()
  await expect(page.getByRole('alert')).toContainText('Dòng 3: ESP32-S3-DevKitC-1 không có LED_BUILTIN')
  await page.getByLabel('Mã nguồn Arduino C++').fill('void setup() {\n  int x = ;\n}\nvoid loop() {}')
  await page.getByRole('button', { name: '▶ Chạy' }).click()
  await expect(page.getByRole('alert')).toContainText('Dòng 2:')
})

test('Pico demo firmware executes on rp2040js and toggles GP25', async ({ page }) => {
  await page.goto('/tools/firmware-hex')
  await page.getByRole('button', { name: 'Nạp firmware Pico mẫu · nháy GP25' }).click()
  await page.getByRole('button', { name: 'Chạy trên RP2040' }).click()
  const panel = page.locator('.rp2040-panel')
  await expect(panel.getByText(/1000\.00 ms mô phỏng/)).toBeVisible({ timeout: 30000 })
  await expect(panel.getByText('Logic analyzer · 1 kênh GPIO')).toBeVisible()
  await expect(panel.getByText(/Logic Analyzer · GP25/)).toBeVisible()
})
