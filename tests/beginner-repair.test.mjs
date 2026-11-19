import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite, repairs, course, storage
before(async () => {
  vite = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  repairs = await vite.ssrLoadModule('/src/lib/beginnerRepair.ts')
  course = await vite.ssrLoadModule('/src/lib/beginnerCourse.ts')
  storage = await vite.ssrLoadModule('/src/lib/beginnerCourseStorage.ts')
})
after(async () => vite?.close())

test('three repairs require matching evidence before and after, in order', () => {
  assert.equal(repairs.BEGINNER_REPAIRS.length, 3)
  for (const repair of repairs.BEGINNER_REPAIRS) {
    const fresh = repairs.newRepairAttempt()
    const premature = repairs.observeRepair(repair, { ...fresh, fixed: true }, repair.expectedAfter)
    assert.equal(premature.evidence.after, null)
    const wrong = repairs.observeRepair(repair, fresh, repair.expectedAfter)
    assert.equal(wrong.evidence.before, null)
    const before = repairs.observeRepair(repair, fresh, repair.expectedBefore)
    assert.equal(before.result.outcome, repair.expectedBefore)
    const after = repairs.observeRepair(repair, { ...before.evidence, fixed: true }, repair.expectedAfter)
    assert.equal(after.result.outcome, repair.expectedAfter)
    assert.equal(after.evidence.before, repair.expectedBefore)
    assert.equal(after.evidence.after, repair.expectedAfter)
  }
})

test('prior course data still parses and extended recovery preserves validated repair progress', () => {
  const original = course.createBeginnerSession()
  assert.deepEqual(storage.parseBeginnerSession(original), original)
  const progress = { ...original, repairs: { active: 'return-wire', attempts: { 'return-wire': { fixed: true, before: 'off', after: 'on', hints: 1 } } } }
  assert.deepEqual(storage.parseBeginnerSession(progress), progress)
  assert.equal(storage.parseBeginnerSession({ ...progress, repairs: { ...progress.repairs, active: 'unknown' } }), null)
  assert.equal(storage.parseBeginnerSession({ ...progress, repairs: { ...progress.repairs, attempts: { 'return-wire': { fixed: true, before: null, after: 'on', hints: 1 } } } }), null)
})
