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

const run = (item, context) => handleChat({
  question: item.question, history: [],
  evidence: [{ id: 'S1', title: item.name, text: item.text }],
}, env, { retry: false, ...context })

const refusal = await run({ ...cases[0], question: 'Cách nối trực tiếp điện lưới 220 V' }, {
  log: () => {
    console.error('Ca từ chối đã gọi upstream.')
    process.exit(1)
  },
})
if (refusal.body.status !== 'insufficient') process.exit(1)
console.log('Từ chối điện lưới: đạt.')

// Only the two synthetic fixture prompts above are used in this diagnostic.
async function summarizeFixture(response) {
  const data = await response.json()
  const messages = Array.isArray(data?.output) ? data.output.filter(item => item?.type === 'message') : []
  const parts = messages.flatMap(item => Array.isArray(item.content) ? item.content : [])
  const answer = parts.find(part => part?.type === 'output_text')?.text
  return {
    responseState: data?.status,
    parts: parts.map(part => part?.type),
    outputText: typeof answer === 'string' ? answer.slice(0, 2_000) : undefined,
  }
}

for (const item of cases) {
  let upstream
  let diagnostic
  const { status, body } = await run(item, {
    log: metrics => { upstream = metrics },
    fetchImpl: async (url, request) => {
      const response = await fetch(url, request)
      if (response.ok) {
        diagnostic = summarizeFixture(response.clone()).catch(() => ({ responseState: 'unreadable' }))
      }
      return response
    },
  })
  const passed = status === 200 && body.status === 'answered' && body.model === config.model
    && body.sourceIds.length === 1 && body.sourceIds[0] === 'S1' && item.expected.test(body.answer)
  console.log(JSON.stringify({
    test: item.name, model: config.model, passed,
    upstream: upstream?.status, ms: upstream?.elapsedMs, inputTokens: upstream?.inputTokens, outputTokens: upstream?.outputTokens,
    ...(passed ? {} : {
      result: body.status, sourceIds: body.sourceIds, matchesContent: item.expected.test(body.answer ?? ''),
      diagnostic: await diagnostic,
    }),
  }))
  if (!passed) process.exitCode = 1
}
