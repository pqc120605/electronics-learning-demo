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
  await page.goto('/app/tools/spice?workspaceSpice=test-return&lab=mosfet-gate')
  const back = page.getByRole('link', { name: /Quay lại workspace/ })
  await expect(back).toHaveAttribute('href', '/app/lab?board=esp32-devkit')
  await page.getByRole('button', { name: 'Chạy SPICE', exact: true }).click()
  await expect(back).toHaveAttribute('href', /workspaceSpiceResult=test-return/)
  await page.getByLabel('Kiểu phân tích').selectOption('dc')
  await expect(back).toHaveAttribute('href', '/app/lab?board=esp32-devkit')
  await expect(page.getByRole('heading', { name: 'Mô phỏng hoàn tất' })).toHaveCount(0)
  const examples = page.getByRole('combobox', { name: 'Bắt đầu từ ví dụ' })
  await examples.selectOption('rc')
  await expect(examples).toHaveValue('rc')
  await expect(page.getByRole('region', { name: 'Ngưỡng cổng của MOSFET kênh N' })).toHaveCount(0)
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

const guidedLabs = [
  { id: 'rc-charge', title: 'Tụ điện nạp qua điện trở', readings: [['3,2', 3.10, 3.23], ['3,2', 3.10, 3.23]], mobile: true },
  { id: 'rl-current', title: 'Dòng điện tăng qua cuộn cảm', readings: [['32', 31, 32.2], ['32', 31, 32.2]] },
  { id: 'diode-bias', title: 'Diode dẫn thuận và phân cực ngược', readings: [['0,6', 0.45, 0.75], ['-5', -5.01, -4.99], ['0,3', 0.2, 0.40]] },
  { id: 'bjt-switch', title: 'BJT NPN đóng cắt tải', readings: [['5', 4.99, 5.01], ['0,1', 0, 0.3]] },
  { id: 'mosfet-gate', title: 'Ngưỡng cổng của MOSFET kênh N', readings: [['0,1', 0, 0.4], ['5', 4.99, 5.01]] },
]

for (const lab of guidedLabs) {
  test(`${lab.id} compares each guided condition using a real ngspice worker`, async ({ page }) => {
    if (lab.mobile) await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`/tools/spice?lab=${lab.id}`)
    const practice = page.getByRole('region', { name: lab.title })
    const answer = practice.getByRole('status')
    const input = practice.getByRole('textbox', { name: /Dự đoán/ })
    for (const [index, [guess, min, max]] of lab.readings.entries()) {
      await practice.getByRole('combobox', { name: 'Điều kiện thử' }).selectOption(String(index))
      await expect(input).toHaveValue('')
      await expect(answer).toBeEmpty()
      await input.fill(guess)
      await practice.getByRole('button', { name: 'Ghi dự đoán và chạy' }).click()
      await expect(answer).toContainText('Ngspice', { timeout: 30000 })
      const actual = Number((await answer.locator('strong').innerText()).match(/=\s*(-?[\d,]+)/)?.[1]?.replace(',', '.'))
      expect(actual).toBeGreaterThanOrEqual(min)
      expect(actual).toBeLessThanOrEqual(max)
      await expect(answer).toContainText('Chênh lệch')
    }
    await expect(practice.getByLabel('So sánh số đo trong phiên này').locator('dd')).toHaveCount(lab.readings.length)
    if (lab.mobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })
}

test('guided analog activities can be opened from learning and component catalog', async ({ page }) => {
  await page.goto('/learn/basics')
  await page.getByRole('link', { name: 'Thực hành đo mạch analog với ngspice' }).click()
  await expect(page.getByRole('region', { name: 'Tụ điện nạp qua điện trở' })).toBeVisible()
  await page.goto('/components?component=transistor-bjt')
  await page.getByRole('link', { name: 'BJT NPN đóng cắt tải · SPICE' }).click()
  await expect(page.getByRole('region', { name: 'BJT NPN đóng cắt tải' })).toBeVisible()
})
