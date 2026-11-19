import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, prepareGuideAi
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ prepareGuideAi } = await server.ssrLoadModule('/src/lib/guideAi.ts'))
})
after(async () => server?.close())

test('retrieval grounds the AI question and short follow-up in the same source', () => {
  const question = 'Vì sao LED cần điện trở?'
  const first = prepareGuideAi(question, [])
  assert.equal(first.kind, 'ready')
  assert.deepEqual(prepareGuideAi('Cho ví dụ', [question, 'Nói rõ hơn']), first)
  assert.ok(first.evidence.length <= 2)
  assert.equal(first.evidence[0].id, 'S1')
  assert.ok(first.evidence[0].sources.length > 0)
})

test('unknown exact GPIO and high voltage keep the local boundary', () => {
  assert.equal(prepareGuideAi('Arduino Uno R3 có thể cấp nguồn vào GPIO 999 không?', []).kind, 'unknown')
  assert.equal(prepareGuideAi('Cách nối LED vào điện lưới 220 V?', []).kind, 'unknown')
  assert.equal(prepareGuideAi('Ảnh này cho biết GPIO 999 của XZQ987 chứ?', ['Cho ví dụ']).kind, 'unknown')
  assert.equal(prepareGuideAi('Arduino Uno R3 và Arduino Uno R4 Minima dùng chung chân nào?', []).kind, 'unknown')
})

test('opt-in context uses the known exact board without packaging user code or diagnostics', () => {
  const question = 'Board đang chọn có ADC thế nào?'
  assert.equal(prepareGuideAi(question, []).kind, 'unknown')
  const result = prepareGuideAi(question, [], {
    owner: 'workspace',
    board: { id: 'arduino-uno-r3', name: 'CUSTOM_BOARD_TEXT_SHOULD_NOT_SEND' },
    status: 'PRIVATE_CODE_OR_FILENAME',
    issues: ['PRIVATE_SERIAL_LOG'],
  })
  assert.equal(result.kind, 'ready')
  assert.match(result.evidence[0].title, /Arduino Uno R3/)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|CUSTOM_BOARD_TEXT/)
})
