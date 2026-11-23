import test from 'node:test'
import assert from 'node:assert/strict'
import { createGuideService } from './guide-service.mjs'

const input = { question: 'Điện trở hạn dòng thế nào?', history: [], evidence: [{ id: 'S1', title: 'LED', text: 'Điện trở hạn dòng.' }] }
const actor = { id: 'fixture-user' }
const other = { id: 'other-fixture-user' }
const env = { GUIDE_AI_PROVIDER: 'mock' }
const secret = 'a'.repeat(64)

function fixture(options = {}) {
  const requests = []
  const feedback = []
  const counts = new Map()
  let global = 0
  const store = {
    async reserve(id, daily, user) {
      const value = counts.get(id) ?? 0
      if (global >= daily || value >= user) return false
      counts.set(id, value + 1)
      global++
      return true
    },
    async record(row) { requests.push(row) },
    async vote(id, helpful) { feedback.push({ id, helpful }); return true },
  }
  const service = createGuideService({ env, store, secret, dailyLimit: 25, ...options })
  return { service, requests, feedback }
}

test('guest stays in lookup and never consumes AI capacity', async () => {
  const { service, requests } = fixture()
  assert.equal(service.status(null).state, 'signed-out')
  assert.equal((await service.ask(null, input)).status, 401)
  assert.deepEqual(requests, [])
})

test('daily share, private cache and authenticated feedback keep raw prompts out of storage', async () => {
  const { service, requests, feedback } = fixture({ dailyLimit: 3 })
  const first = await service.ask(actor, input)
  const second = await service.ask(actor, input)
  const third = await service.ask(other, input)
  assert.equal(first.body.status, 'answered')
  assert.deepEqual(requests.map(row => row.cacheHit), [false, true, false])
  assert.equal((await service.ask(other, input)).status, 429)
  assert.equal(await service.vote(other, { ...first.body.feedback, helpful: true }), 403)
  assert.equal(await service.vote(actor, { ...second.body.feedback, helpful: true }), 204)
  assert.equal(feedback.length, 1)
  assert.equal(JSON.stringify(requests).includes(input.question), false)
  assert.equal(JSON.stringify(requests).includes(actor.id), false)
  assert.equal(JSON.stringify(requests).includes(third.body.feedback.token), false)
})

test('per-account quota rejects the 21st request and cache expires after 24 hours', async () => {
  let now = 0
  const { service, requests } = fixture({ now: () => now })
  await service.ask(actor, input)
  now = 86_400_001
  await service.ask(actor, input)
  for (let i = 2; i < 20; i++) assert.equal((await service.ask(actor, input)).status, 200)
  assert.equal((await service.ask(actor, input)).status, 429)
  assert.deepEqual(requests.slice(0, 2).map(row => row.cacheHit), [false, false])
})

test('paid upstream concurrency never exceeds two and refuses extra work before quota reservation', async () => {
  let release
  const blocked = new Promise(resolve => { release = resolve })
  let started = 0
  const { service } = fixture({ dailyLimit: 2, call: async () => {
    started++
    await blocked
    return { status: 200, body: { status: 'insufficient', model: 'mock', answer: '', sourceIds: [], followUps: [] } }
  } })
  const pending = [service.ask(actor, input), service.ask(other, input)]
  assert.equal((await service.ask(actor, input)).status, 503)
  release()
  assert.deepEqual((await Promise.all(pending)).map(result => result.status), [200, 200])
  assert.equal(started, 2)
})
