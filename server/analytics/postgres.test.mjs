import assert from 'node:assert/strict'
import { test } from 'node:test'
import pg from 'pg'
import { createPostgresStore } from './store.mjs'

const connectionString = process.env.MACHMO_TEST_DATABASE_URL
test('PostgreSQL stores events, enforces concurrent limits, aggregates and protects destructive operations', { skip: !connectionString }, async t => {
  const pool = new pg.Pool({ connectionString, max: 4 })
  t.after(() => pool.end())
  const store = createPostgresStore(pool)
  const session_id = '5a73d4c0-91d0-4f5b-a211-b2c8a3401d2d'
  const event = { session_id, event_name: 'page_view', path: '/app', component_id: null }
  const results = await Promise.all(Array.from({ length: 65 }, () => store.record(event)))
  assert.equal(results.filter(Boolean).length, 60)

  const recent = await store.summarize(new Date(Date.now() - 3_600_000).toISOString(), new Date(Date.now() + 3_600_000).toISOString())
  assert.equal(recent.sessionCount, 1)
  assert.equal(recent.eventCount, 60)
  assert.deepEqual(recent.byEvent, [{ eventName: 'page_view', events: 60 }])
  assert.deepEqual(recent.byPath, [{ path: '/app', events: 60 }])
  assert.ok(recent.daily.every(entry => /^\d{4}-\d{2}-\d{2}$/.test(entry.day)))

  await assert.rejects(pool.query('DELETE FROM machmo_analytics.events'), { code: '42501' })
  await assert.rejects(pool.query('UPDATE machmo_analytics.events SET path = $1', ['/']), { code: '42501' })
  const oldStart = new Date(Date.now() - 32 * 86_400_000).toISOString()
  const oldEnd = new Date(Date.now() - 30 * 86_400_000).toISOString()
  assert.equal((await store.summarize(oldStart, oldEnd)).eventCount, 1)
  await store.expire()
  assert.equal((await store.summarize(oldStart, oldEnd)).eventCount, 0)
  assert.equal((await store.summarize(new Date(Date.now() - 3_600_000).toISOString(), new Date(Date.now() + 3_600_000).toISOString())).eventCount, 60)
})
