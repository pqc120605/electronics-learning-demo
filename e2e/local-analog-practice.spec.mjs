import { test, expect } from '@playwright/test'

test('changing workspace analysis clears the previous SPICE result from the return link', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('machmo-workspace-spice-test-return', JSON.stringify({
      schemaVersion: 1, title: 'Bộ chia áp', assumptions: [], ignoredUnwiredParts: [],
      netlist: 'Divider\nV1 IN 0 DC 5\nR1 IN OUT 1k\nR2 OUT 0 1k\n.op\n.end',
      returnTo: '/app/lab?board=esp32-devkit&workspaceSpiceResult=old',
      workspaceFingerprint: 'test-revision', createdAt: Date.now(),
    }))
  })
  await page.goto('/app/tools/spice?workspaceSpice=test-return')
  const back = page.getByRole('link', { name: /Quay lại workspace/ })
  await expect(back).toHaveAttribute('href', '/app/lab?board=esp32-devkit')
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(back).toHaveAttribute('href', /workspaceSpiceResult=test-return/)
  await page.getByLabel('Kiểu phân tích').selectOption('dc')
  await expect(back).toHaveAttribute('href', '/app/lab?board=esp32-devkit')
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toHaveCount(0)
})

test('mobile divider prediction is checked against ngspice and cleared on a different netlist', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/tools/spice')
  await page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' }).selectOption('divider')
  const practice = page.getByRole('region', { name: 'Đo điện áp bộ chia' })
  const guess = practice.getByLabel('Dự đoán V(OUT), đơn vị V')
  const run = practice.getByRole('button', { name: 'Ghi dự đoán và chạy' })
  await expect(run).toBeDisabled()
  await guess.fill('6')
  await expect(run).toBeDisabled()
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toBeVisible()
  await expect(practice.getByRole('status')).toBeEmpty()
  await guess.fill('2,4')
  await run.click()
  await expect(practice.getByRole('status')).toContainText('Ngspice · V(OUT) = 2,5 V', { timeout: 30000 })
  await expect(practice.getByRole('status')).toContainText('Chênh lệch 0,1 V')
  await page.getByRole('button', { name: /^Nút out: 2,5 V$/ }).click()
  await expect(page.locator('.spice-probe-readout')).toContainText('v(out)')

  await page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' }).selectOption('rc')
  await expect(practice).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' }).selectOption('divider')
  await expect(guess).toHaveValue('')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})

test('a queued result from the old SPICE netlist is discarded after selecting a different example', async ({ page }) => {
  await page.addInitScript(() => {
    const RealWorker = window.Worker
    window.Worker = class extends RealWorker {
      constructor(url, options) {
        super(url, options)
        if (!String(url).includes('spice.worker')) return
        const terminate = this.terminate.bind(this)
        this.postMessage = ({ runId }) => {
          window.finishHeldSpiceRun = () => this.onmessage?.({ data: {
            type: 'result', runId, analysis: 'op', dataType: 'real', numPoints: 1, displayedPoints: 1,
            series: [{ name: 'v(out)', type: 'voltage', values: [2.5] }], warnings: [],
          } })
        }
        this.terminate = () => { window.heldSpiceTerminated = true; terminate() }
      }
    }
  })
  await page.goto('/tools/spice')
  const examples = page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' })
  await examples.selectOption('divider')
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Dừng solver' })).toBeVisible()
  await examples.selectOption('rc')
  const canceled = await page.evaluate(() => {
    window.finishHeldSpiceRun()
    return window.heldSpiceTerminated
  })
  expect(canceled).toBe(true)
  await expect(page.getByRole('heading', { name: 'Kết quả sẽ hiện ở đây' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toHaveCount(0)
})
