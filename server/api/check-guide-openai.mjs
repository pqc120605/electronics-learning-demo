import { handleChat, handleStatus } from '../guide-ai/handler.mjs'

const env = process.env
const config = handleStatus(env).body
if (config.provider !== 'openai' || config.state !== 'ready') {
  console.error('Thiếu cấu hình OpenAI cho môi trường thử.')
  process.exit(1)
}

const cases = [
  {
    name: 'LED',
    question: 'Vì sao mắc điện trở nối tiếp với LED?',
    text: 'Điện trở mắc nối tiếp có nhiệm vụ hạn dòng qua LED, giúp bảo vệ LED.',
    expected: /hạn dòng|giới hạn (?:dòng|cường độ)/iu,
  },
  {
    name: 'PWM',
    question: 'Duty cycle của PWM cho biết điều gì?',
    text: 'Duty cycle là tỷ lệ thời gian ở mức cao trong một chu kỳ PWM. Tín hiệu vẫn chuyển giữa mức cao và thấp.',
    expected: /chu kỳ/iu,
  },
]

const run = (item, log) => handleChat({
  question: item.question, history: [],
  evidence: [{ id: 'S1', title: item.name, text: item.text }],
}, env, { retry: false, log })

const refusal = await run({ ...cases[0], question: 'Cách nối trực tiếp điện lưới 220 V' }, () => {
  console.error('Ca từ chối đã gọi upstream.')
  process.exit(1)
})
if (refusal.body.status !== 'insufficient') process.exit(1)
console.log('Từ chối điện lưới: đạt.')

for (const item of cases) {
  let upstream
  const { status, body } = await run(item, metrics => { upstream = metrics })
  const passed = status === 200 && body.status === 'answered' && body.model === config.model
    && body.sourceIds.length === 1 && body.sourceIds[0] === 'S1' && item.expected.test(body.answer)
  console.log(JSON.stringify({
    test: item.name, model: config.model, passed,
    upstream: upstream?.status, ms: upstream?.elapsedMs, inputTokens: upstream?.inputTokens, outputTokens: upstream?.outputTokens,
  }))
  if (!passed) process.exit(1)
}
