import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { createGuideAiMiddleware, DEFAULT_GUIDE_MODEL, validateGuideAiReply } from '../scripts/guide-ai-service.mjs'

const input = { question: 'Vì sao LED cần điện trở?', evidence: [{ id: 'S1', title: 'LED', text: 'Điện trở nối tiếp giới hạn dòng.' }], history: [] }
const reply = { status: 'answered', answer: 'Điện trở nối tiếp giúp giới hạn dòng qua LED.', sourceIds: ['S1'] }

test('rejects invented sources and links; accepts grounded text and explicit uncertainty', () => {
  assert.deepEqual(validateGuideAiReply(reply, input.evidence), reply)
  assert.equal(validateGuideAiReply({ ...reply, sourceIds: ['S2'] }, input.evidence), null)
  assert.equal(validateGuideAiReply({ ...reply, answer: 'Xem https://outside.example/path' }, input.evidence), null)
  assert.deepEqual(validateGuideAiReply({ status: 'insufficient', answer: '', sourceIds: [] }, input.evidence),
    { status: 'insufficient', answer: '', sourceIds: [] })
})

test('same-origin middleware bounds the request and only calls the pinned local provider', async t => {
  const pending = []
  const providerFetch = async (url, options) => {
    pending.push({ url, options })
    return Response.json({ model: DEFAULT_GUIDE_MODEL, done: true, message: { content: JSON.stringify(reply) } })
  }
  const middleware = createGuideAiMiddleware({ fetchImpl: providerFetch })
  const server = createServer((req, res) => middleware(req, res, () => res.end('not found')))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`
  const send = (body, headers = {}) => fetch(`${origin}/api/guide-ai/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin, ...headers }, body: JSON.stringify(body),
  })
  assert.equal((await send(input, { origin: 'http://localhost:9999' })).status, 403)
  assert.equal((await send({ ...input, code: 'not allowed' })).status, 400)
  assert.equal((await send({ ...input, question: 'x'.repeat(401) })).status, 400)
  assert.equal(pending.length, 0)
  const res = await send(input)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await res.json(), { ...reply, model: DEFAULT_GUIDE_MODEL })
  assert.equal(pending[0].url, 'http://127.0.0.1:11434/api/chat')
  const request = JSON.parse(pending[0].options.body)
  assert.equal(request.stream, false)
  assert.equal(request.think, false)
  assert.equal(request.options.num_ctx, 3072)
  assert.equal(request.messages.length, 2)
})
