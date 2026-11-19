import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const base = process.argv[2] ?? 'http://127.0.0.1:5320'
const folder = 'docs/agents/runs/MM-SW-MO-BOT-LOCAL-AI-001'
const browser = await chromium.launch()
const screens = []
try {
  for (const width of [1440, 375]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 812 }, serviceWorkers: 'block' })
    const errors = []
    const externalRequests = []
    const requests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      if (new URL(request.url()).origin !== base && /^https?:/.test(request.url())) externalRequests.push(new URL(request.url()).origin)
      if (request.url() === `${base}/api/guide-ai/chat`) requests.push(request.postDataJSON())
    })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ 'app-home': 1 })))
    await page.goto(`${base}/app`)
    await page.getByRole('button', { name: 'Trợ giúp', exact: true }).click()
    await page.locator('.help-menu-panel').getByRole('button', { name: /Hỏi Mở/ }).click()
    const panel = page.getByRole('dialog', { name: 'Mở — bạn đồng hành học điện tử' })
    await panel.getByRole('button', { name: 'Hỏi AI', exact: true }).click()
    await panel.getByText('AI trên máy đã sẵn sàng.', { exact: false }).waitFor()
    const input = panel.getByRole('textbox', { name: 'Câu hỏi cho Mở AI' })
    const submit = panel.getByRole('button', { name: 'Gửi tới AI trên máy' })
    const answers = []
    await input.fill('Arduino Uno R3 GPIO 999 nối như thế nào?')
    await submit.click()
    await panel.getByText(/chưa xác minh yêu cầu chân cụ thể/).waitFor()
    assert.equal(requests.length, 0)
    const questions = width === 1440 ? ['Vì sao LED cần điện trở?', 'Cho ví dụ'] : ['INPUT_PULLUP là gì?']
    for (const question of questions) {
      await input.fill(question)
      const started = performance.now()
      const result = page.waitForResponse(response => response.url() === `${base}/api/guide-ai/chat`, { timeout: 60_000 })
      await submit.click()
      const response = await result
      const output = await response.json()
      assert.equal(response.status(), 200)
      assert.equal(output.status, 'answered')
      assert.equal(output.model, 'qwen3.5:2b')
      await panel.getByText(output.answer, { exact: false }).waitFor()
      await expect(panel.locator('.guide-ai-answer').last()).toBeInViewport({ ratio: 0.95 })
      answers.push({ question, ms: Math.round(performance.now() - started), ...output })
    }
    if (width === 1440) assert.equal(requests[1].history[0].question, questions[0])
    const sources = await panel.getByRole('log').getByRole('link').allTextContents()
    assert.ok(sources.length >= 1)
    assert.equal(requests.length, questions.length)
    assert.deepEqual(errors, [])
    assert.deepEqual(externalRequests, [])
    const screenshot = `real-browser-${width}.png`
    await page.screenshot({ path: `${folder}/${screenshot}` })
    screens.push({ width, chromium: browser.version(), answers, sources, screenshot, externalRequests, errors })
    await page.close()
  }
  await writeFile(`${folder}/real-browser.json`, JSON.stringify({ base, screens }, null, 2) + '\n')
  console.log(JSON.stringify({ base, screens: screens.map(({ width, screenshot, answers }) => ({ width, screenshot, answerMs: answers.map(item => item.ms) })) }))
} finally {
  await browser.close()
}
