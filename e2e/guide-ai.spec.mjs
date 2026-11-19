import { test, expect } from '@playwright/test'

const model = 'qwen3.5:2b'
const answer = 'Điện trở nối tiếp giúp giới hạn dòng qua LED.'
async function openGuide(page, path = '/app') {
  await page.addInitScript(() => {
    if (window === window.top) localStorage.setItem('mm-tour-seen', JSON.stringify({ 'app-home': 1, library: 1, lesson: 1 }))
  })
  await page.goto(path)
  await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
  await page.locator('.help-menu-panel').getByRole('button', { name: /Hỏi Mở/ }).click()
  return page.getByRole('dialog', { name: 'Mở — bạn đồng hành học điện tử' })
}

test('mobile AI is explicit and carries source-bound conversation without private context', async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const requests = []
  let statusChecks = 0
  await page.route('**/api/guide-ai/status', route => {
    statusChecks++
    return route.fulfill({ json: { state: 'ready', model } })
  })
  await page.route('**/api/guide-ai/chat', async route => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({ json: { status: 'answered', model, answer, sourceIds: ['S1'] } })
  })
  const panel = await openGuide(page, '/app/boards?board=arduino-uno-r3')
  await panel.getByRole('button', { name: 'Hỏi đáp', exact: true }).click()
  await panel.getByRole('textbox', { name: 'Câu hỏi của bạn' }).fill('Vì sao LED cần điện trở?')
  await panel.getByRole('button', { name: 'Tìm câu trả lời' }).click()
  await expect(panel.locator('.guide-results article').first()).toBeVisible()
  expect(statusChecks).toBe(0)
  await panel.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
  await expect(panel.getByText('AI trên máy đã sẵn sàng.', { exact: false })).toBeVisible()
  const input = panel.getByRole('textbox', { name: 'Câu hỏi cho Mở AI' })
  const send = panel.getByRole('button', { name: 'Gửi tới AI trên máy' })
  await expect(panel.getByRole('checkbox', { name: 'Dùng ngữ cảnh bài đang mở' })).not.toBeChecked()
  await input.fill('Vì sao LED cần điện trở?')
  expect(requests).toHaveLength(0)
  await send.click()
  const conversation = panel.getByRole('log')
  await expect(conversation).toContainText(answer)
  await expect(conversation.locator('.guide-ai-answer').last()).toBeInViewport({ ratio: 0.95 })
  await expect(conversation.getByRole('link').first()).toHaveAttribute('href', /^(\/|https:\/\/)/)
  expect(requests[0].history).toEqual([])
  expect(requests[0].evidence[0]).toEqual({ id: 'S1', title: expect.any(String), text: expect.any(String) })
  await input.fill('Cho ví dụ')
  await send.click()
  await expect(conversation.locator('article')).toHaveCount(2)
  await expect(conversation.locator('.guide-ai-answer').last()).toBeInViewport({ ratio: 0.95 })
  expect(requests[1].history).toEqual([{ question: 'Vì sao LED cần điện trở?', answer }])
  await input.fill('Arduino Uno R3 GPIO 999 nối như thế nào')
  await send.click()
  await expect(panel.getByText(/chưa xác minh yêu cầu chân cụ thể/)).toBeVisible()
  expect(requests).toHaveLength(2)
  await page.screenshot({ path: info.outputPath('ai-chat-375.png') })
})

test('provider unavailable keeps deterministic local troubleshooting available', async ({ page }) => {
  await page.route('**/api/guide-ai/status', route => route.fulfill({ json: { state: 'model-missing', model } }))
  const panel = await openGuide(page)
  await panel.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
  await expect(panel.getByText(/Model được chọn chưa có trên máy/)).toBeVisible()
  await panel.getByRole('textbox', { name: 'Câu hỏi cho Mở AI' }).fill('Vì sao LED cần điện trở?')
  await expect(panel.getByRole('button', { name: 'Gửi tới AI trên máy' })).toBeDisabled()
  await panel.getByRole('button', { name: 'Tra cứu cục bộ' }).click()
  await expect(panel.locator('.guide-results article').first()).toBeVisible()
})

test('canceling a response ignores late content and keeps the pending question for retry', async ({ page }) => {
  await page.route('**/api/guide-ai/status', route => route.fulfill({ json: { state: 'ready', model } }))
  let release, started
  const waiting = new Promise(resolve => { release = resolve })
  const requestStarted = new Promise(resolve => { started = resolve })
  let attempts = 0
  await page.route('**/api/guide-ai/chat', async route => {
    attempts++
    started()
    await waiting
    await route.fulfill({ json: { status: 'answered', model, answer, sourceIds: ['S1'] } }).catch(() => {})
  })
  const panel = await openGuide(page)
  await panel.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
  const input = panel.getByRole('textbox', { name: 'Câu hỏi cho Mở AI' })
  await input.fill('Vì sao LED cần điện trở?')
  await panel.getByRole('button', { name: 'Gửi tới AI trên máy' }).click()
  await requestStarted
  await panel.getByRole('button', { name: 'Dừng trả lời' }).click()
  release()
  await expect(panel.getByText('Đã dừng lượt trả lời.')).toBeVisible()
  await expect(panel.getByRole('log')).toHaveCount(0)
  await expect(input).toHaveValue('Vì sao LED cần điện trở?')
  expect(attempts).toBe(1)
})
