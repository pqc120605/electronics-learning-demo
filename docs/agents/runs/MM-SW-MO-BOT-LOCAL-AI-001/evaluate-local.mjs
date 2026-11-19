// Run from the repository root with a loaded, loopback Ollama instance.
import { createServer as httpServer } from 'node:http'
import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { createServer as viteServer } from 'vite'
import { createGuideAiMiddleware } from '../../../../scripts/guide-ai-service.mjs'

const vite = await viteServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const { prepareGuideAi } = await vite.ssrLoadModule('/src/lib/guideAi.ts')
const cases = [
  { id: 'led', question: 'Vì sao LED cần điện trở?', expected: [/dòng/i, /nối tiếp|hạn dòng|giới hạn/i] },
  { id: 'breadboard', question: 'Breadboard nối các lỗ như thế nào?', expected: [/rãnh|khe/i, /dải|nhóm/i] },
  { id: 'pullup', question: 'INPUT_PULLUP là gì?', expected: [/HIGH/i, /LOW/i, /GND|mass/i] },
  { id: 'uno', question: 'Arduino Uno R3 ADC đọc tối đa bao nhiêu trong mô hình bài học?', expected: [/1023/, /mô hình|mô phỏng|bài học/i] },
  { id: 'followup', question: 'Cho ví dụ', context: 'Vì sao LED cần điện trở?', expected: [/LED/i, /điện trở/i] },
  { id: 'unknown-pin', question: 'Arduino Uno R3 GPIO 999 nối như thế nào?', unknown: true },
]
const models = process.argv.slice(2)
if (!models.length) models.push('qwen3.5:4b')
const rows = []
try {
  for (const model of models) {
    const middleware = createGuideAiMiddleware({ model })
    const server = httpServer((req, res) => middleware(req, res, () => res.writeHead(404).end()))
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    const state = await fetch(`${origin}/api/guide-ai/status`).then(response => response.json())
    try {
      if (state.state !== 'ready') { console.log(model, state.state); continue }
      const history = []
      for (const sample of cases) {
        const prepared = prepareGuideAi(sample.question, sample.context ? [sample.context] : [])
        const started = performance.now()
        let output = prepared
        if (prepared.kind === 'ready') {
          const { evidence } = prepared
          const response = await fetch(`${origin}/api/guide-ai/chat`, {
            method: 'POST', headers: { origin, 'content-type': 'application/json' },
            body: JSON.stringify({
              question: sample.question, evidence: evidence.map(({ id, title, text }) => ({ id, title, text })),
              history: sample.context ? history.slice(0, 1) : [],
            }),
          })
          output = await response.json()
        }
        if (sample.id === 'led' && output.status === 'answered') history.push({ question: sample.question, answer: output.answer.slice(0, 450) })
        const checks = sample.unknown ? output.kind === 'unknown' : output.status === 'answered' && sample.expected.every(marker => marker.test(output.answer))
        const row = { model, case: sample.id, ms: Math.round(performance.now() - started), checks, output }
        rows.push(row)
        console.log(JSON.stringify(row))
      }
    } finally { await new Promise(resolve => server.close(resolve)) }
  }
} finally {
  await vite.close()
  const name = models.map(model => model.replace(/[^a-z0-9]+/gi, '-')).join('_')
  writeFileSync(new URL(`benchmark-${name}.json`, import.meta.url), JSON.stringify(rows, null, 2) + '\n')
}
