import { expect, test } from '@playwright/test'

async function openA2(page) {
  await page.goto('/boards?board=esp32-c3-devkitm-1')
  await page.getByRole('link', { name: /Mở mạch nút nhấn và LED A2/ }).click()
  const panel = page.getByRole('region', { name: 'Firmware và mạch ESP32-C3 A2' })
  await expect(panel).toBeVisible()
  return panel
}

for (const viewport of [null, { width: 375, height: 812 }]) {
  test(`ESP32-C3 firmware reads the wired button and drives the LED on ${viewport ? 'mobile' : 'desktop'}`, async ({ page }) => {
    if (viewport) await page.setViewportSize(viewport)
    const requests = []
    page.on('request', request => { if (request.url().includes('/api/local-tools/a2-c3/')) requests.push(request) })
    const panel = await openA2(page)
    await expect(panel.getByRole('button', { name: 'Đo DC bằng ngspice' })).toBeDisabled()
    expect(requests).toHaveLength(0)
    await panel.getByRole('button', { name: 'Chạy firmware ESP32-C3' }).click()
    await panel.getByText('Serial UART0', { exact: true }).click()
    const serial = panel.getByLabel('Serial ESP32-C3 A2')
    await expect(serial).toContainText('A2_READY')
    await expect(serial).toContainText('A2_BUTTON=0')
    const gpio = panel.getByLabel('Mức chân ESP32-C3')
    await expect(gpio).toContainText('GPIO4 HIGH · GPIO10 LOW · LED tắt')
    expect(requests.some(request => request.url().endsWith('/flash.bin'))).toBe(true)
    const origin = new URL(page.url()).origin
    expect(requests.every(request => new URL(request.url()).origin === origin && request.method() === 'GET')).toBe(true)

    if (!viewport) {
      await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
      await expect(panel.getByLabel('Kết quả ngspice A2')).toContainText(/GPIO4 3\.3000 V.*I LED 0\.000 mA/)
    }
    const button = page.getByRole('button', { name: 'Giữ nút nhấn' })
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await button.focus()
      await page.keyboard.down('Space')
      await expect(gpio).toContainText('GPIO4 LOW · GPIO10 HIGH · LED sáng')
      await page.keyboard.up('Space')
      await expect(gpio).toContainText('GPIO4 HIGH · GPIO10 LOW · LED tắt')
      if (cycle === 0 && !viewport) {
        await panel.getByLabel('Trạng thái đã quan sát').selectOption('pressed')
        await panel.getByRole('button', { name: 'Đo DC bằng ngspice' }).click()
        await expect(panel.getByLabel('Kết quả ngspice A2')).toContainText(/GPIO4 0\.0003 V.*I LED 1\.[1-5]\d\d mA/)
      }
    }
    await expect(serial).toContainText(/(A2_BUTTON=1[\s\S]*A2_BUTTON=0[\s\S]*){3}/)
    await panel.getByText('Dạng sóng GPIO4 / GPIO10', { exact: true }).click()
    await expect(panel.getByRole('list', { name: 'Trace GPIO ESP32-C3' })).toContainText(/\d+ µs · GPIO4 LOW · GPIO10 HIGH/)
    await panel.getByRole('button', { name: 'Dừng firmware ESP32-C3' }).click()
    await expect(panel.getByRole('status')).toContainText('Đã dừng firmware.')
    await panel.getByRole('button', { name: 'Chạy firmware ESP32-C3' }).click()
    await expect(serial).toContainText('A2_READY')
    await expect(serial).not.toContainText('A2_BUTTON=1')
  })
}

test('catalog CN4 selection shares one anchor between Nucleo 2D and 3D', async ({ page }) => {
  await page.goto('/boards?board=stm32-nucleo&view=top')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await page.getByRole('button', { name: 'CN4.4 · SWDIO' }).press('Enter')
  const pad = page.locator('[data-board-pad="aux-cn4-4"]')
  await expect(pad).toHaveAttribute('data-active', 'true')
  await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText('SWDIO')
})

test('Pico 2 H and UNO R4 Minima show revision-specific debug signal details', async ({ page }) => {
  await page.goto('/boards?board=raspberry-pi-pico-2-h&view=pins')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await expect(page.getByText('SWD.1 · SWCLK', { exact: true })).toBeVisible()
  await page.goto('/boards?board=arduino-uno-r4-minima&view=pins')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await page.getByRole('button', { name: 'J2.6 · NC', exact: true }).click()
  await expect(page.locator('[data-board-pad="aux-j2-6"]')).toHaveAttribute('data-active', 'true')
  await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  await expect(page.locator('.board-cad-viewer .board-selected-pin')).toContainText('NC')
})

test('Pico W has three SWD anchors at the J2 position from its own PCB', async ({ page }) => {
  await page.goto('/boards?board=raspberry-pi-pico-w&view=top')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await page.getByRole('button', { name: 'J2.3 · SWDIO' }).click()
  await expect(page.locator('[data-board-pad^="aux-j2-"]')).toHaveCount(3)
  await expect(page.locator('[data-board-pad="aux-j2-3"]')).toHaveAttribute('data-active', 'true')
})

test('Feather variants expose their own STEMMA QT signals and top-view pads', async ({ page }) => {
  await page.goto('/boards?board=adafruit-feather-esp32-s3-5323&view=top')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await page.getByRole('button', { name: 'CONN1.3 · SDA / GPIO3', exact: true }).click()
  await expect(page.locator('[data-board-pad^="aux-conn1-"]')).toHaveCount(4)
  await expect(page.locator('[data-board-pad="aux-conn1-3"]')).toHaveAttribute('data-active', 'true')

  await page.goto('/boards?board=adafruit-feather-esp32-s3-tft-5483&view=top')
  await page.getByText('SWD, debug và đầu cắm phụ', { exact: true }).click()
  await expect(page.getByText('CONN1.3 · SDA / GPIO42', { exact: true })).toBeVisible()
  await expect(page.locator('[data-board-pad^="aux-conn1-"]')).toHaveCount(0)
})

test('corrupt or missing local firmware cannot start a new run or show a previous result', async ({ page }) => {
  const panel = await openA2(page)
  const start = panel.getByRole('button', { name: 'Chạy firmware ESP32-C3' })
  await page.route('**/api/local-tools/a2-c3/flash.bin', async route => {
    const response = await route.fetch()
    const bytes = await response.body()
    bytes[bytes.length - 1] ^= 0x01
    await route.fulfill({ response, body: bytes })
  })
  await start.click()
  await expect(panel.getByRole('status')).toContainText('SHA-256 firmware A2 không khớp')
  await expect(panel.getByLabel('Mức chân ESP32-C3')).toHaveCount(0)
  await expect(panel.getByRole('button', { name: 'Đo DC bằng ngspice' })).toBeDisabled()
  await page.unroute('**/api/local-tools/a2-c3/flash.bin')
  await page.route('**/api/local-tools/a2-c3/manifest.json', route => route.fulfill({ status: 404, body: '' }))
  await start.click()
  await expect(panel.getByRole('status')).toContainText('chưa được chuẩn bị trên máy này')
  await expect(panel.getByLabel('Kết quả ngspice A2')).toHaveCount(0)
})

test('an ESP32-C3 boot timeout clears the loading state and permits a retry', async ({ page }) => {
  await page.clock.install()
  const panel = await openA2(page)
  const manifestPattern = '**/api/local-tools/a2-c3/manifest.json'
  await page.route(manifestPattern, () => {})
  const request = page.waitForRequest(manifestPattern)
  const start = panel.getByRole('button', { name: 'Chạy firmware ESP32-C3' })
  await start.click()
  await request
  await page.clock.fastForward(10_001)
  await expect(panel.getByRole('status')).toContainText('ESP32-C3 chưa khởi động sau 10 giây.')
  await expect(start).toBeEnabled()
  await expect(panel.getByLabel('Mức chân ESP32-C3')).toHaveCount(0)
  await page.unroute(manifestPattern)
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Đang chạy firmware ESP32-C3.')
})

test('a callback queued by a stopped worker cannot populate the next ESP32-C3 run', async ({ page }) => {
  await page.addInitScript(() => {
    window.a2Workers = []
    window.Worker = class extends window.Worker {
      constructor(url, options) {
        super(url, options)
        if (String(url).includes('a2C3.worker')) window.a2Workers.push(this)
      }
    }
  })
  const panel = await openA2(page)
  const start = panel.getByRole('button', { name: 'Chạy firmware ESP32-C3' })
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Đang chạy firmware ESP32-C3.')
  await panel.getByRole('button', { name: 'Dừng firmware ESP32-C3' }).click()
  await start.click()
  await expect(panel.getByRole('status')).toContainText('Đang chạy firmware ESP32-C3.')
  await panel.getByText('Serial UART0', { exact: true }).click()
  await page.evaluate(() => {
    if (window.a2Workers.length !== 2) throw new Error('Expected two A2 workers')
    const [stopped] = window.a2Workers
    stopped.onmessage(new MessageEvent('message', { data: { type: 'uart', text: 'STALE_WORKER\n' } }))
  })
  const serial = panel.getByLabel('Serial ESP32-C3 A2')
  await expect(serial).toContainText('A2_READY')
  await expect(serial).not.toContainText('STALE_WORKER')
})
