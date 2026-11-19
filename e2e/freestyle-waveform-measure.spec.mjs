import { test, expect } from '@playwright/test'

const artifactRoot = '.tmp/agent-checks/MM-SW-SAMPLED-CURSORS-001'
const waveform = page => page.locator('.freestyle-waveform')
const cursor = (page, name) => waveform(page).getByRole('slider', { name: new RegExp(`^Con trỏ ${name}`) })
const actions = page => page.locator('.freestyle-work-actions')

async function prepare(page, width) {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
  // Use the real local subset interpreter; never compile or contact a local tool service.
  await page.route('**/api/local-tools/**', route => route.fulfill({ status: 404, body: 'not available' }))
  await page.goto('/build/freestyle')
  await page.evaluate(() => {
    localStorage.removeItem('machmo-freestyle-v1')
    localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1, home: 1, lab: 1 }))
  })
  await page.reload()
  await page.getByRole('radio', { name: /Arduino Uno R3/ }).check()
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  await actions(page).getByRole('button', { name: '▶ Chạy', exact: true }).click()
  await page.getByRole('button', { name: 'Dạng sóng', exact: true }).click()
  await expect(page.locator('[data-wave-pin="13"] path.freestyle-wave-path')).toHaveAttribute('d', /V18.*V54|V54.*V18/, { timeout: 20000 })
  await expect.poll(async () => Number(await cursor(page, 'B').getAttribute('max'))).toBeGreaterThan(2)
}

for (const width of [375, 1440]) test(`sampled cursors use keyboard and preserve capture and draft at ${width}px`, async ({ page }) => {
  await prepare(page, width)
  await expect(waveform(page).locator('header')).toContainText('Trình thông dịch rút gọn')
  await expect(waveform(page)).toContainText('512 mẫu gần nhất')
  await waveform(page).getByLabel('Kênh đo', { exact: true }).selectOption('13')
  await cursor(page, 'A').focus()
  await cursor(page, 'A').press('ArrowRight')
  const selectedA = await cursor(page, 'A').getAttribute('aria-valuetext')
  await actions(page).getByRole('button', { name: '■ Dừng', exact: true }).click()
  await expect(cursor(page, 'A')).toHaveAttribute('aria-valuetext', selectedA)
  const raw = await page.evaluate(() => localStorage.getItem('machmo-freestyle-v1'))
  await cursor(page, 'B').focus()
  await cursor(page, 'B').press('Home')
  await cursor(page, 'A').press('Home')
  await expect(waveform(page).locator('.freestyle-measure-result')).toHaveText('Δt: 0 ms')
  await cursor(page, 'B').press('End')
  const forward = await waveform(page).locator('.freestyle-measure-result').textContent()
  await cursor(page, 'A').press('End')
  await cursor(page, 'B').press('Home')
  await expect(waveform(page).locator('.freestyle-measure-result')).toHaveText(forward)
  await expect(waveform(page).locator('[data-cursor="A"]')).toContainText(/ms mô phỏng · (HIGH|LOW)/)
  await waveform(page).getByRole('button', { name: 'Đặt lại A/B' }).click()
  await expect(cursor(page, 'A')).toHaveValue('0')
  await expect(cursor(page, 'B')).toHaveValue(await cursor(page, 'B').getAttribute('max'))
  expect(await page.evaluate(() => localStorage.getItem('machmo-freestyle-v1'))).toBe(raw)
  const axisLayout = await waveform(page).evaluate(element => {
    const axis = element.querySelector('.freestyle-wave-axis').getBoundingClientRect()
    const plot = element.querySelector('.freestyle-wave-channel svg').getBoundingClientRect()
    const [start, end] = [...element.querySelectorAll('.freestyle-wave-axis > span')].map(label => label.getBoundingClientRect())
    return {
      startAligned: Math.abs(axis.left - plot.left) <= 1,
      endAligned: Math.abs(axis.right - plot.right) <= 1,
      labelsBounded: start.left >= axis.left - 1 && end.right <= axis.right + 1 && start.right <= end.left,
    }
  })
  expect(axisLayout).toEqual({ startAligned: true, endAligned: true, labelsBounded: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await waveform(page).screenshot({ path: `${artifactRoot}/waveform-${width}.png` })

  // New run clears manual timestamps even when React batches away an empty render.
  await cursor(page, 'A').press('End')
  await actions(page).getByRole('button', { name: '▶ Chạy', exact: true }).click()
  await expect(cursor(page, 'A')).toHaveValue('0')
  await expect.poll(async () => Number(await cursor(page, 'B').getAttribute('max'))).toBeGreaterThan(2)
  await page.getByRole('tab', { name: /Viết code & Chạy/ }).click()
  await page.getByLabel('Mã nguồn Arduino C++').fill('void setup(){}\nvoid loop(){}')
  await expect(waveform(page).getByRole('slider')).toHaveCount(0)
  await expect(waveform(page)).not.toContainText('Δt:')
})

test('board and topology changes remove old sampled measurements, dock controls are usable', async ({ page }) => {
  await prepare(page, 1440)
  await page.getByRole('tab', { name: /Chọn board/ }).click()
  await page.getByRole('radio', { name: /Arduino Nano classic/ }).check()
  await expect(waveform(page).getByRole('slider')).toHaveCount(0)
  await expect(waveform(page)).not.toContainText('Δt:')
  await actions(page).getByRole('button', { name: '▶ Chạy', exact: true }).click()
  await expect(cursor(page, 'A')).toBeVisible()
  await page.getByRole('button', { name: 'Lắp mạch 2D', exact: true }).click()
  const dock = page.locator('.freestyle-trace-dock')
  await dock.locator('summary').click()
  await expect(dock.getByRole('slider', { name: /^Con trỏ A/ })).toBeVisible()
  await page.getByRole('button', { name: 'Dạng sóng', exact: true }).click()
  await page.getByRole('tab', { name: /Chọn board/ }).click()
  await page.getByRole('button', { name: 'Dựng mạch mẫu', exact: true }).click()
  await expect(waveform(page).getByRole('slider')).toHaveCount(0)
  await expect(waveform(page)).not.toContainText('Δt:')
})
