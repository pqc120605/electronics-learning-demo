import { expect, test } from '@playwright/test'

for (const [id, name, initial] of [
  ['dht11', 'DHT11', 'DHT11 230 dC 550 dRH OK'],
  ['dht22-bare', 'AM2302', 'DHT22 -54 dC 555 dRH OK'],
  ['keypad-4x4', 'PID 3844', 'KEY IDLE'],
  ['seven-segment-anode', 'SA56-11EWA', 'DIGIT '],
]) {
  test(name + ' runs the local Uno HEX with its connected circuit', async ({ page }) => {
    await page.goto('/components?component=' + id)
    await page.getByRole('link', { name: 'Mở mạch thử firmware Uno R3' }).click()
    await expect(page.getByText('Đã mở mạch thử A1.', { exact: false })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Viết code & Chạy' })).toHaveAttribute('aria-selected', 'true')
    const load = page.getByRole('button', { name: 'Mở firmware Uno đã biên dịch' })
    await load.click()
    await expect(page.getByRole('link', { name: 'Tải mã nguồn Arduino' })).toHaveAttribute('href', '/firmware/uno-peripherals-a1/' + id + '.ino')
    const run = page.getByRole('button', { name: 'Chạy HEX cùng mạch' })
    await expect(run).toBeEnabled()
    await run.click()
    await page.getByRole('tab', { name: /Chạy và quan sát|Quan sát/ }).click()
    const serial = page.getByLabel('Đầu ra Serial')
    await expect(serial).toContainText(initial)
    if (id.startsWith('dht')) {
      const temperature = page.getByRole('slider', { name: 'Nhiệt độ môi trường' })
      await expect(temperature).toHaveValue(id === 'dht11' ? '23' : '-5.4')
      await expect(page.getByText(/Timeline DATA · \d+ mức logic/)).toBeVisible()
    } else if (id === 'keypad-4x4') {
      const keys = page.getByLabel('Phím bàn phím 4×4')
      await keys.selectOption({ label: '5' })
      await expect(serial).toContainText('KEY 5')
      await keys.selectOption({ label: 'Thả tất cả' })
      await expect(serial).toContainText(/KEY 5[\s\S]*KEY IDLE/)
    } else {
      await expect(page.getByText(/^LED 7 đoạn · /)).toBeVisible()
    }
    await page.locator('#freestyle-observe-panel').getByRole('button', { name: '■ Dừng' }).click()
    const stopped = await serial.textContent()
    await expect(page.locator('#freestyle-observe-panel').getByRole('button', { name: '▶ Chạy' })).toBeVisible()
    await page.getByRole('tab', { name: 'Viết code & Chạy' }).click()
    await load.click()
    await run.click()
    await page.getByRole('tab', { name: /Chạy và quan sát|Quan sát/ }).click()
    await expect(serial).toContainText(initial)
    expect(stopped).toContain(initial)
  })
}

test('F401RE C04 shares all 108 header pin anchors across 2D and 3D', async ({ page }) => {
  await page.goto('/boards?board=stm32-nucleo&view=top')
  const top = page.getByRole('region', { name: 'Mặt board 2D' })
  await expect(top.locator('[data-board-pad]')).toHaveCount(108)
  const drop = top.getByLabel('Chân header')
  await drop.selectOption('cn10-18')
  await expect(top.getByRole('heading', { name: 'NC', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'PCB 3D', exact: true }).click()
  const viewer = page.locator('.board-cad-viewer')
  await viewer.locator('canvas').scrollIntoViewIfNeeded()
  await viewer.getByRole('button', { name: /STM32F401RET6 · LQFP-64/ }).click()
  await expect(viewer.getByRole('button', { name: 'Tập trung vào linh kiện đang chọn' })).toBeEnabled()
  await expect(viewer.locator('.board-selected-pin')).toContainText('NC')
  await expect(viewer.getByText('Không kết nối ở phiên bản này')).toBeVisible()
  await page.getByRole('button', { name: 'Mặt board 2D', exact: true }).click()
  await expect(drop).toHaveValue('cn10-18')
})

test('SA56 lesson solves both DC current states in ngspice WASM', async ({ page }) => {
  await page.goto('/tools/spice?lab=a1-sa56-segment-dc')
  const lab = page.getByRole('region', { name: 'SA56-11EWA · dòng qua một đoạn' })
  await lab.getByRole('textbox', { name: /Dự đoán I\(VOUT\)/ }).fill('3')
  await lab.getByRole('button', { name: 'Ghi dự đoán và chạy' }).click()
  await expect(lab.getByText(/Ngspice · I\(VOUT\) = [234][,.]\d+ mA/)).toBeVisible()
  await lab.getByLabel('Điều kiện thử').selectOption('1')
  await lab.getByRole('textbox', { name: /Dự đoán I\(VOUT\)/ }).fill('0')
  await lab.getByRole('button', { name: 'Ghi dự đoán và chạy' }).click()
  await expect(lab.getByText(/Ngspice · I\(VOUT\) = 0 mA/)).toBeVisible()
})
