import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, course, store
before(async () => {
  server = await createServer({ configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true} })
  course = await server.ssrLoadModule('/src/lib/beginnerCourse.ts')
  store = await server.ssrLoadModule('/src/lib/beginnerCourseStorage.ts')
})
after(async () => server?.close())

function memory(seed = {}) {
  const data = new Map(Object.entries(seed))
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  }
}

test('round trip restores the exact activity, board, controls and checked predictions without touching older progress or drafts', () => {
  const old = { 'machmo-learning-progress-v1':'{"selfReportedCompletedLessonIds":["blink"]}', 'machmo-freestyle-v1':'opaque draft bytes' }
  const storage = memory(old)
  let session = { ...course.createBeginnerSession(), activityId:'button-logic', boardId:'arduino-uno-r3', prediction:'on' }
  session.controls.pressed = true
  session = course.observeBeginnerSession(session).session
  const saved = store.saveBeginnerSession(session, null, storage)
  assert.equal(saved.kind, 'saved')
  const restored = store.readBeginnerSession(storage)
  assert.equal(restored.kind, 'ready')
  assert.deepEqual(restored.session, session)
  assert.equal(restored.raw, saved.raw)
  for (const [key, value] of Object.entries(old)) assert.equal(storage.getItem(key), value)
  assert.deepEqual(JSON.parse(store.formatBeginnerBackup(session)), session)
})

test('malformed JSON and future sessions remain byte-preserved and reject writes', () => {
  for (const raw of ['{broken', '', '{"schema":2,"future":"do not replace"}', '{"schema":1,"courseVersion":2}']) {
    const storage = memory({ [store.BEGINNER_COURSE_KEY]:raw })
    const read = store.readBeginnerSession(storage)
    assert.ok(['invalid','unsupported'].includes(read.kind))
    assert.equal(read.raw, raw)
    const saved = store.saveBeginnerSession(course.createBeginnerSession(), raw, storage)
    assert.equal(saved.kind, 'protected')
    assert.equal(storage.getItem(store.BEGINNER_COURSE_KEY), raw)
  }
})

test('cross-tab raw conflict keeps both versions available without overwriting the newer data', () => {
  const storage = memory()
  const original = course.createBeginnerSession()
  const first = store.saveBeginnerSession(original, null, storage)
  const second = { ...original, activityId:'breadboard' }
  const newer = store.saveBeginnerSession(second, first.raw, storage)
  const stale = store.saveBeginnerSession({ ...original, activityId:'led-polarity' }, first.raw, storage)
  assert.equal(stale.kind, 'conflict')
  assert.equal(stale.raw, newer.raw)
  assert.equal(storage.getItem(store.BEGINNER_COURSE_KEY), newer.raw)
})

test('unavailable getter and quota failure return memory-only states without claiming durability', () => {
  const denied = { getItem(){throw Error('denied')},setItem(){throw Error('denied')} }
  assert.equal(store.readBeginnerSession(denied).kind, 'unavailable')
  assert.equal(store.saveBeginnerSession(course.createBeginnerSession(), null, denied).kind, 'unavailable')
  const quota = { getItem(){return null},setItem(){throw Error('quota')} }
  assert.equal(store.saveBeginnerSession(course.createBeginnerSession(), null, quota).kind, 'unavailable')
})

test('parser rejects forged observations and invalid bounds; reopening never turns a wrong prediction into a correct one', () => {
  const original = course.createBeginnerSession()
  for (const controls of [{threshold:0},{threshold:100},{inputPercent:-1},{inputPercent:101},{pressed:'yes'},{holePair:'unknown'}]) {
    assert.equal(store.parseBeginnerSession({...original,controls:{...original.controls,...controls}}), null)
  }
  let recorded = course.observeBeginnerSession({ ...original, prediction:'on' }).session
  assert.ok(store.parseBeginnerSession(recorded))
  assert.equal(course.getBeginnerAssessment(recorded, 'closed-loop').observed, 0)
  const forged = structuredClone(recorded)
  forged.observations[0].outcome = 'on'
  assert.equal(store.parseBeginnerSession(forged), null)
  recorded.observations = Array.from({length:81},()=>recorded.observations[0])
  assert.equal(store.parseBeginnerSession(recorded), null)
})
