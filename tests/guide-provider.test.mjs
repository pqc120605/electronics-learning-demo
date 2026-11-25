import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleChat, handleStatus } from '../server/guide-ai/handler.mjs'
import { evaluateGuideMock } from '../scripts/eval-guide-ai.mjs'

const evidence = [{ id: 'S1', title: 'LED', text: 'Điện trở nối tiếp giúp hạn dòng qua LED.' }]
const input = { question: 'Điện trở của LED để làm gì?', evidence, history: [] }
const env = { GUIDE_AI_PROVIDER: 'openai', OPENAI_API_KEY: 'unit-test-placeholder', OPENAI_MODEL: 'gpt-test' }
const answered = { status: 'answered', answer: 'Điện trở hạn dòng qua LED. [S1]', sourceIds: ['S1'], followUps: [] }
const result = value => new Response(JSON.stringify({
  status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }],
}), { status: 200 })

test('OpenAI provider uses strict structured responses and returns only verified source IDs', async () => {
  const response = await handleChat(input, env, {
    fetchImpl: async (url, request) => {
      assert.equal(url, 'https://api.openai.com/v1/responses')
      assert.equal(request.headers.Authorization, 'Bearer unit-test-placeholder')
      const body = JSON.parse(request.body)
      assert.equal(body.store, false)
      assert.equal(body.text.format.strict, true)
      assert.equal(body.text.format.type, 'json_schema')
      assert.equal(Object.hasOwn(body, 'reasoning'), false)
      return result(answered)
    },
  })
  assert.deepEqual(response, { status: 200, body: { ...answered, model: 'gpt-test' } })
})

test('GPT-6 Luna can use the configured low-latency reasoning effort', async () => {
  const config = { ...env, OPENAI_MODEL: 'gpt-6-luna', OPENAI_REASONING_EFFORT: 'none' }
  const response = await handleChat(input, config, {
    fetchImpl: async (_url, request) => {
      assert.deepEqual(JSON.parse(request.body).reasoning, { effort: 'none' })
      return result(answered)
    },
  })
  assert.equal(response.body.status, 'answered')
  assert.equal(response.body.model, 'gpt-6-luna')
})

test('server refuses high-risk requests, unknown sources and malformed output', async () => {
  const calls = []
  const context = { fetchImpl: async () => { calls.push(1); return result({ ...answered, sourceIds: ['S99'] }) } }
  const blocked = await handleChat({ ...input, question: 'Cách đấu thẳng điện lưới 220 V' }, env, context)
  assert.equal(blocked.body.status, 'insufficient')
  assert.equal(calls.length, 0)
  const unknown = await handleChat(input, env, context)
  assert.equal(unknown.body.status, 'insufficient')
  const malformed = await handleChat(input, env, { fetchImpl: async () => new Response('{') })
  assert.equal(malformed.body.status, 'insufficient')
})

test('missing key leaves live status unavailable and still permits deterministic mock evaluation', async () => {
  const config = { GUIDE_AI_PROVIDER: 'openai', OPENAI_MODEL: 'gpt-test' }
  assert.deepEqual(handleStatus(config), { status: 200, body: { state: 'unavailable', provider: 'mock', model: 'mock' } })
  const response = await handleChat(input, config, { fetchImpl: () => { throw Error('unexpected network call') } })
  assert.equal(response.body.status, 'answered')
  assert.equal(response.body.model, 'mock')
})

test('transient errors retry once, while other API errors degrade to insufficient', async () => {
  let attempts = 0
  const response = await handleChat(input, env, {
    sleep: async () => {},
    fetchImpl: async () => ++attempts === 1 ? new Response('', { status: 429 }) : result(answered),
  })
  assert.equal(attempts, 2)
  assert.equal(response.body.status, 'answered')
  attempts = 0
  const failed = await handleChat(input, env, {
    fetchImpl: async () => { attempts += 1; return new Response('', { status: 403 }) },
  })
  assert.equal(attempts, 1)
  assert.equal(failed.body.status, 'insufficient')
})

test('canceled requests return insufficient and log only operational metadata', async () => {
  const entries = []
  const response = await handleChat(input, env, {
    signal: AbortSignal.abort(),
    log: entry => entries.push(entry),
    fetchImpl: async (_url, { signal }) => {
      signal.throwIfAborted()
      return result(answered)
    },
  })
  assert.equal(response.body.status, 'insufficient')
  assert.equal(entries[0].status, 'timeout')
  assert.deepEqual(Object.keys(entries[0]).sort(), ['elapsedMs', 'inputTokens', 'model', 'outputTokens', 'provider', 'status'])
})

test('Vietnamese mock evaluation preserves evidence, context opt-in and refusals', async () => {
  const results = await evaluateGuideMock()
  assert.ok(results.length >= 50)
  assert.deepEqual(results.filter(row => !row.passed).map(row => row.query), [])
})
