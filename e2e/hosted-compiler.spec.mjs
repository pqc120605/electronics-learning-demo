import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('hosted compiler sends sketches only after opt-in and runs the returned HEX in browser', async ({ page }) => {
  const hex = await readFile('public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex', 'utf8')
  let requests = 0
  await page.addInitScript(() => { if (window.top === window) localStorage.setItem('mm-tour-seen', '{"freestyle":1}') })
  await page.route('**/api/local-tools/health', route => route.fulfill({ status: 404 }))
  await page.route('**/api/tools/arduino/status', route => route.fulfill({ json: { ok: true, boards: ['arduino-uno-r3'] } }))
  await page.route('**/api/tools/arduino/compile', route => {
    requests++
    const request = route.request()
    expect(request.method()).toBe('POST')
    expect(request.headers()['x-machmo-csrf']).toBe('1')
    expect(request.postDataJSON()).toMatchObject({ board: 'arduino-uno-r3', source: expect.stringMatching(/void setup/) })
    return route.fulfill({ json: { ok: true, hex } })
  })
  await page.goto('/build/freestyle')
  await page.getByRole('radio', { name: /Arduino Uno R3/ }).check()
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
  const option = page.getByRole('checkbox', { name: 'Biên dịch trên máy chủ' })
  await expect(option).not.toBeChecked()
  const work = page.locator('.freestyle-work-actions')
  await work.getByRole('button', { name: '▶ Chạy' }).click()
  await work.getByRole('button', { name: '■ Dừng' }).click()
  expect(requests).toBe(0)
  await option.click()
  await expect(option).toBeEnabled()
  await expect(option).toBeChecked()
  expect(requests).toBe(0)
  await work.getByRole('button', { name: '▶ Chạy' }).click()
  await page.getByRole('tab', { name: /Quan sát/ }).click()
  await expect.poll(() => requests).toBe(1)
  await expect(page.locator('.freestyle-engine')).toContainText('Biên dịch trên máy chủ · avr8js')
  await expect(page.locator('.freestyle-pins')).toContainText('D13')
  await work.getByRole('button', { name: '■ Dừng' }).click()
})
