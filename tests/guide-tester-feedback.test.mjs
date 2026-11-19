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

test('GPIO input-only guidance is scoped to the recorded ESP32 board and cites the manufacturer', () => {
  for (const question of [
    'Vì sao GPIO 34 trên ESP32 DevKit V1 không bật được LED?',
    'GPIO34 ESP32 DevKit V1 co dung lam output duoc khong?',
    'GPIO 39 tren ESP32 DevKit V1 la chan gi?',
  ]) {
    const result = answer(question)
    assert.equal(result.kind, 'matches', question)
    const article = result.articles[0]
    assert.equal(article.id, 'esp32-devkit-input-only')
    assert.match(article.paragraphs.join(' '), /Revision:.*chỉ nhận tín hiệu/)
    assert.equal(article.source.href, '/boards?board=esp32-devkit')
    assert.ok(article.sources.some(ref => ref.href.includes('docs.espressif.com/')))
  }
  for (const question of [
    'GPIO34 ESP32 có dùng làm output không?',
    'GPIO 34 trên ESP32 DevKit V1 clone ABC123?',
    'GPIO34 Arduino Uno R3 dùng để làm gì?',
    'GPIO 40 tren ESP32 DevKit V1 la chan gi?',
    'GPIO34 và GPIO2 trên ESP32 DevKit V1 giống nhau không?',
  ]) assert.equal(answer(question).kind, 'unknown', question)
})
