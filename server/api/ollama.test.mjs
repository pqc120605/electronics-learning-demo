import test from 'node:test'
import assert from 'node:assert/strict'
import { checkGuideStatus, handleChat } from '../guide-ai/handler.mjs'
import { createGuideService } from './guide-service.mjs'

const env = { GUIDE_AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'qwen3.5:0.8b', OLLAMA_CONTEXT: '2048' }
const input = { question: 'Điện trở dùng để làm gì?', history: [], evidence: [{ id: 'S1', title: 'LED', text: 'Hạn dòng.' }] }
const answer = { status: 'answered', answer: 'Điện trở hạn dòng [S1].', sourceIds: ['S1'], followUps: [] }

test('Ollama adapter checks exact installed tag and keeps questions on loopback using structured output', async () => {
  assert.equal((await checkGuideStatus(env, async () => Response.json({ models: [] }))).state, 'model-missing')
  assert.equal((await checkGuideStatus({ ...env, OLLAMA_URL: 'http://192.0.2.1:11434' }, async () => {
    throw new Error('unexpected network')
  })).state, 'invalid-model')
  assert.equal((await checkGuideStatus(env, async url => {
    assert.equal(url, 'http://127.0.0.1:11434/api/tags')
    return Response.json({ models: [{ name: env.OLLAMA_MODEL }] })
  })).state, 'ready')
  const telemetry = []
  const result = await handleChat(input, env, { log: row => telemetry.push(row), fetchImpl: async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/chat')
    assert.equal(options.redirect, 'error')
    const message = JSON.parse(options.body)
    assert.equal(message.stream, false)
    assert.equal(message.think, false)
    assert.equal(message.options.num_ctx, 2048)
    assert.ok(message.format.properties.followUps)
    return Response.json({ done: true, model: env.OLLAMA_MODEL, message: { content: JSON.stringify(answer) }, prompt_eval_count: 15, eval_count: 9 })
  } })
  assert.deepEqual(result.body, { ...answer, model: env.OLLAMA_MODEL })
  assert.equal(telemetry[0].inputTokens, 15)
  assert.equal(telemetry[0].outputTokens, 9)
  assert.equal(JSON.stringify(telemetry).includes(input.question), false)
})

test('Ollama runs a single worker, admits one waiter, and returns 503 when full', async () => {
  let release
  let started = 0
  const gate = new Promise(resolve => { release = resolve })
  const service = createGuideService({ env, dailyLimit: 5, secret: 'fixture-only'.repeat(4),
    store: { async reserve() { return true }, async record() {} },
    async call() { started++; await gate; return { status: 200, body: { ...answer, model: env.OLLAMA_MODEL } } } })
  const first = service.ask({ id: 'one' }, input)
  const second = service.ask({ id: 'two' }, input)
  const busy = await service.ask({ id: 'three' }, input)
  assert.equal(started, 1)
  assert.equal(busy.status, 503)
  release()
  assert.deepEqual((await Promise.all([first, second])).map(result => result.status), [200, 200])
  assert.equal(started, 2)
})
