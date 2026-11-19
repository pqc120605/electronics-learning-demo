import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, answer
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  answer = (await server.ssrLoadModule('/src/lib/guideKnowledge.ts')).findGuideAnswers
})
after(async () => { await server?.close() })

test('Vietnamese problem statements select actionable answers before generic catalog matches', () => {
  for (const [question, expected] of [
    ['Tại sao LED của mình không sáng khi chạy?', 'debug-led'],
    ['Sửa đường đi của dây bằng cách nào?', 'wires'],
    ['Mình muốn đổi trị số tụ điện trong mạch', 'edit-value'],
    ['Phóng to bản vẽ bằng con lăn ở đâu?', 'wheel-zoom'],
    ['Làm sao xem dạng sóng ngay khi chạy board?', 'live-waveform'],
    ['PWM khác với điện áp một chiều thế nào?', 'pwm-meaning'],
  ]) {
    const result = answer(question)
    assert.equal(result.kind, 'matches', question)
    assert.equal(result.articles[0].id, expected, question)
    assert.ok(result.articles[0].source.href)
  }
})

test('action and symptom recognition preserves unknown board and pin boundaries', () => {
  assert.equal(answer('LED không sáng với board ABC123').kind, 'unknown')
  assert.equal(answer('GPIO99 Arduino Uno R3 dùng để làm gì?').kind, 'unknown')
  const matched = answer('Tôi không thấy LED sáng', {
    owner: 'freestyle', board: { id: 'arduino-uno-r3', name: 'Arduino Uno R3' },
    issues: ['PRIVATE_PAYLOAD'], status: 'Đang dùng trình thông dịch rút gọn',
  })
  assert.equal(matched.kind, 'matches')
  assert.equal(matched.articles[0].id, 'debug-led')
  assert.doesNotMatch(JSON.stringify(matched), /PRIVATE_PAYLOAD/)
})
