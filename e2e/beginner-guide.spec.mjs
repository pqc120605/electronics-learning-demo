import { test, expect } from '@playwright/test'

const courseKey = 'machmo-beginner-course-v1'
const guideName = 'Mở — bạn đồng hành học điện tử'
async function seed(page) {
  await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, 'app-home': 1, lesson: 1, lab: 1, freestyle: 1 })))
}
async function openGuide(page, tab = 'Đang làm') {
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await page.locator('.help-menu-panel').getByRole('button', { name: /Hỏi Mở/ }).click()
  const panel = page.getByRole('dialog', { name: guideName })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: tab, exact: true }).click()
  return panel
}
async function ask(panel, question) {
  await panel.getByRole('textbox', { name: 'Câu hỏi của bạn' }).fill(question)
  await panel.getByRole('button', { name: 'Tìm câu trả lời', exact: true }).click()
}
async function courseRaw(page) {
  return page.evaluate(key => localStorage.getItem(key), courseKey)
}
async function keyboardAction(page, panel, name, targetId) {
  await panel.getByRole('button', { name, exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(panel).not.toBeVisible()
  await expect(page.locator(`#${targetId}`)).toBeFocused()
}
function programFixture(boardId) {
  return {
    schema: 1, courseVersion: 1, activityId: 'button-logic', boardId,
    controls: {
      returnConnected: false, ledForward: true, resistorPresent: true, holePair: 'same-strip',
      pressed: false, inverted: false, inputPercent: 49, threshold: 50,
    },
    prediction: null, observations: [], explanations: {}, hintsUsed: {},
  }
}

for (const width of [375, 1440]) {
  test(`course guide focuses without observing and drops stale answers ${width}px`, async ({ page }) => {
    await seed(page)
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/app/learn/basics')
    await expect(page.getByRole('heading', { name: 'Nền tảng điện tử', exact: true })).toBeVisible()
    const original = await courseRaw(page)
    let panel = await openGuide(page)
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).toContainText('Chọn dự đoán')
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).not.toContainText('Nguồn kết quả:')
    await keyboardAction(page, panel, 'Tới dự đoán', 'beginner-prediction')
    expect(await courseRaw(page)).toBe(original)
    await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả')

    await page.getByRole('radio', { name: 'LED tắt', exact: true }).check()
    panel = await openGuide(page)
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).toContainText('Chưa có kết quả cho lựa chọn hiện tại')
    await keyboardAction(page, panel, 'Tới nút quan sát', 'beginner-observe')
    expect(JSON.parse(await courseRaw(page)).observations).toHaveLength(0)
    await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả')
    // This second Enter is the learner's explicit observation action.
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('beginner-result')).toContainText('LED tắt')

    panel = await openGuide(page)
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).toContainText('Nguồn kết quả: kiểm tra kết nối khái niệm')
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).toContainText('Dự đoán khớp quan sát')
    await page.screenshot({ path: `.tmp/agent-checks/MM-SW-LOCAL-GUIDE-001/context-${width}.png`, fullPage: true })
    await panel.getByRole('button', { name: 'Hỏi đáp', exact: true }).click()
    await ask(panel, 'Giải thích kết quả hiện tại')
    await expect(panel.locator('.guide-results')).toContainText('Kết quả vừa quan sát: LED tắt')
    await expect(panel.getByRole('link', { name: 'Khóa nền tảng điện tử', exact: true })).toHaveAttribute('href', '/app/learn/basics')

    // The panel is nonmodal: a keyboard edit outside it must invalidate its answer.
    await page.getByLabel('Nối đường về nguồn', { exact: true }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả')
    await expect(panel.locator('.guide-results article')).toHaveCount(0)
    await expect(panel.getByRole('textbox', { name: 'Câu hỏi của bạn' })).toHaveValue('Giải thích kết quả hiện tại')
    expect(JSON.parse(await courseRaw(page)).observations).toHaveLength(1)
    await panel.getByRole('button', { name: 'Tìm câu trả lời', exact: true }).click()
    await expect(panel.locator('.guide-results')).toContainText('Chưa có quan sát hiện hành')
    await expect(panel.locator('.guide-results')).not.toContainText('Kết quả vừa quan sát: LED tắt')
    await panel.getByRole('button', { name: 'Đang làm', exact: true }).click()
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).not.toContainText('Nguồn kết quả:')
    await panel.focus()
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Trợ giúp', exact: true })).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const boardId of [null, 'unknown-clone-987']) {
  test(`program context requires explicit supported board: ${boardId}`, async ({ page }) => {
    await seed(page)
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: courseKey, value: JSON.stringify(programFixture(boardId)),
    })
    await page.goto('/learn/basics')
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'button-logic')
    const original = await courseRaw(page)
    const panel = await openGuide(page)
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).toContainText('Chọn board được hỗ trợ')
    await expect(panel.getByLabel('Ngữ cảnh đang làm')).not.toContainText('Nguồn kết quả:')
    await keyboardAction(page, panel, 'Tới lựa chọn board', 'beginner-board')
    expect(await courseRaw(page)).toBe(original)
    await expect(page.getByRole('button', { name: 'Quan sát mô hình', exact: true })).toBeDisabled()
    await expect(page.getByLabel('Code thử nghiệm chỉ đọc')).toHaveCount(0)
  })
}

test('board-context answers are cleared on board changes and explicit queries keep their guard', async ({ page }) => {
  await seed(page)
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: courseKey, value: JSON.stringify(programFixture('arduino-uno-r3')),
  })
  await page.goto('/app/learn/basics')
  const panel = await openGuide(page, 'Hỏi đáp')
  await ask(panel, 'board đang chọn ADC')
  await expect(panel.locator('.guide-results h3').first()).toHaveText('Arduino Uno R3')
  await page.locator('#beginner-board').selectOption('arduino-nano-classic')
  await expect(panel.locator('.guide-results article')).toHaveCount(0)
  await expect(panel.getByRole('textbox', { name: 'Câu hỏi của bạn' })).toHaveValue('board đang chọn ADC')
  await panel.getByRole('button', { name: 'Tìm câu trả lời', exact: true }).click()
  await expect(panel.locator('.guide-results h3').first()).toHaveText('Arduino Nano classic')
  await ask(panel, 'Arduino Uno R4 Minima ADC')
  await expect(panel.locator('.guide-results h3').first()).toHaveText('Arduino UNO R4 Minima')
  await ask(panel, 'Giải thích kết quả hiện tại board clone XZQ-987 GPIO 999')
  await expect(panel.locator('.guide-unknown')).toBeVisible()
  await expect(panel.locator('.guide-results article')).toHaveCount(0)
})
