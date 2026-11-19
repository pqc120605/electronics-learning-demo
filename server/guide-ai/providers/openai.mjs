import { setTimeout as delay } from 'node:timers/promises'
import { answerSchema } from '../schema.mjs'
import { instructions } from '../prompt.mjs'

const endpoint = 'https://api.openai.com/v1/responses'
const maximumResponseBytes = 48_000

async function readPayload(response) {
  if (!response.body) return null
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maximumResponseBytes) return null
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export async function openAiAnswer(input, config, context = {}) {
  const timeout = AbortSignal.timeout(30_000)
  const signal = context.signal ? AbortSignal.any([context.signal, timeout]) : timeout
  const fetchImpl = context.fetchImpl ?? fetch
  const sleep = context.sleep ?? ((ms) => delay(ms, undefined, { signal }))
  const start = performance.now()
  const body = JSON.stringify({
    model: config.model, instructions, input: JSON.stringify(input), store: false, max_output_tokens: 700,
    text: { format: { type: 'json_schema', name: 'mobot_answer', strict: true, schema: answerSchema } },
  })
  let status
  let usage
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetchImpl(endpoint, {
        method: 'POST', signal, redirect: 'error', body,
        headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
      })
      status = response.status
      if (!response.ok) {
        await response.body?.cancel()
        if (attempt === 0 && (status === 429 || status >= 500)) {
          await sleep(1_000)
          continue
        }
        return null
      }
      const data = await readPayload(response)
      usage = data?.usage
      if (data?.status !== 'completed' || !Array.isArray(data.output)) return null
      const parts = data.output.filter(item => item?.type === 'message')
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
      if (parts.length !== 1 || parts[0]?.type !== 'output_text' || typeof parts[0].text !== 'string') return null
      return JSON.parse(parts[0].text)
    }
    return null
  } catch {
    return null
  } finally {
    context.log?.({
      provider: 'openai', model: config.model, elapsedMs: Math.round(performance.now() - start),
      inputTokens: Number.isInteger(usage?.input_tokens) ? usage.input_tokens : null,
      outputTokens: Number.isInteger(usage?.output_tokens) ? usage.output_tokens : null,
      status: signal.aborted ? 'timeout' : status ?? 'unavailable',
    })
  }
}
