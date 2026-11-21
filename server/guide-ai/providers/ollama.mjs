import { answerSchema } from '../schema.mjs'
import { instructions } from '../prompt.mjs'

const models = new Set(['qwen3.5:0.8b', 'qwen3.5:2b', 'qwen3.5:4b'])
const maxBytes = 48_000

export function ollamaConfig(env) {
  const base = URL.parse(env.OLLAMA_URL ?? 'http://127.0.0.1:11434')
  const model = env.OLLAMA_MODEL
  if (!models.has(model) || base?.protocol !== 'http:' || base.hostname !== '127.0.0.1' ||
    base.username || base.password || base.pathname !== '/' || base.search || base.hash) return null
  const numCtx = Number(env.OLLAMA_CONTEXT ?? 2048)
  if (![2048, 3072, 4096].includes(numCtx)) return null
  return { model, base: base.origin, numCtx }
}

async function boundedJson(response) {
  if (!response.ok || !response.body) {
    await response.body?.cancel()
    throw new Error('Local provider returned an error')
  }
  const reader = response.body.getReader()
  let bytes = 0
  const chunks = []
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBytes) throw new Error('Local provider response too large')
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export async function ollamaStatus(config, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(config.base + '/api/tags', { redirect: 'error', signal: AbortSignal.timeout(2000) })
    const result = await boundedJson(response)
    return Array.isArray(result.models) && result.models.some(item => item?.name === config.model) ? 'ready' : 'model-missing'
  } catch {
    return 'unavailable'
  }
}

export async function ollamaAnswer(input, config, context = {}) {
  const timeout = AbortSignal.timeout(60_000)
  const signal = context.signal ? AbortSignal.any([timeout, context.signal]) : timeout
  const fetchImpl = context.fetchImpl ?? fetch
  const started = performance.now()
  let status = 'unavailable'
  let result
  try {
    const response = await fetchImpl(config.base + '/api/chat', {
      method: 'POST', redirect: 'error', signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model, stream: false, think: false, format: answerSchema, keep_alive: '1m',
        options: { temperature: 0, num_ctx: config.numCtx, num_predict: 400 },
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: JSON.stringify(input) }],
      }),
    })
    status = response.status
    result = await boundedJson(response)
    if (!result.done || result.model !== config.model || typeof result.message?.content !== 'string') {
      status = 'invalid-response'
      return null
    }
    return JSON.parse(result.message.content)
  } catch {
    if (status === 200) status = 'invalid-response'
    return null
  } finally {
    context.log?.({ provider: 'ollama', model: config.model, status: signal.aborted ? 'timeout' : status,
      elapsedMs: Math.round(performance.now() - started), inputTokens: result?.prompt_eval_count, outputTokens: result?.eval_count })
  }
}
