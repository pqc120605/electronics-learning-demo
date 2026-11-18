import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'

let server, engine, adapter, activities
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  engine = await server.ssrLoadModule('/src/lib/beginnerCourse.ts')
  activities = (await server.ssrLoadModule('/src/data/beginnerCourse.ts')).BEGINNER_ACTIVITIES
})
after(async () => server?.close())
async function guide() {
  assert.ok(existsSync('src/lib/beginnerGuide.ts'), 'beginner context adapter is not implemented')
  adapter ??= await server.ssrLoadModule('/src/lib/beginnerGuide.ts')
  return adapter
}
function buttonSession() {
  return { ...engine.createBeginnerSession(), activityId: 'button-logic', boardId: 'arduino-uno-r3', prediction: 'off' }
}
function context(snapshot) { return snapshot.beginner }

test('publishes no outcome before explicit observation, even with historical completion', async () => {
  const adapter = await guide()
  let session = buttonSession()
  session = engine.observeBeginnerSession(session).session
  session.privateDraft = 'PRIVATE_DRAFT_SENTINEL'
  const before = JSON.stringify(session)
  const snapshot = adapter.getBeginnerGuideSnapshot(session, null)
  assert.equal(context(snapshot).stage, 'observe')
  assert.equal(context(snapshot).observation, undefined)
  assert.equal(JSON.stringify(session), before)
  const published = JSON.stringify(snapshot)
  for (const forbidden of ['PRIVATE_DRAFT_SENTINEL', 'pinMode']) {
    assert.ok(!published.includes(forbidden), forbidden)
  }
  const forbiddenKeys = new Set(['observations', 'controls', 'signature', 'caseKey', 'code', 'raw', 'schema'])
  function inspect(value) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!forbiddenKeys.has(key), key)
      inspect(child)
    }
  }
  inspect(snapshot)
  const fresh = adapter.getBeginnerGuideSnapshot(engine.createBeginnerSession(), null)
  assert.equal(context(fresh).stage, 'predict')
  assert.equal(context(fresh).observation, undefined)
})

test('matching explicit observations retain bounded outcome and evidence with prediction comparison', async () => {
  const adapter = await guide()
  const session = buttonSession()
  const result = { ...engine.observeBeginnerSession(session).result, message: 'PRIVATE_RESULT_MESSAGE', trace: ['PRIVATE_TRACE_CODE'] }
  const snapshot = adapter.getBeginnerGuideSnapshot(session, result)
  assert.deepEqual(context(snapshot).observation, {
    outcome: 'off', evidenceKind: 'lesson-model', predictionMatches: true,
  })
  assert.equal(context(snapshot).stage, 'explain')
  assert.ok(!JSON.stringify(snapshot).includes('PRIVATE_RESULT_MESSAGE'))
  assert.ok(!JSON.stringify(snapshot).includes('PRIVATE_TRACE_CODE'))
  assert.ok(!JSON.stringify(snapshot).includes('pinMode'))
  const wrong = { ...session, prediction: 'on' }
  assert.equal(context(adapter.getBeginnerGuideSnapshot(wrong, result)).observation.predictionMatches, false)
  const explained = { ...session, explanations: { 'button-logic': activities.find(item => item.id === 'button-logic').correctExplanationId } }
  assert.equal(context(adapter.getBeginnerGuideSnapshot(explained, result)).stage, 'review')
})

test('stale input, board, activity and forged result metadata never become current evidence', async () => {
  const adapter = await guide()
  const session = buttonSession()
  const result = engine.observeBeginnerSession(session).result
  for (const changed of [
    { ...session, controls: { ...session.controls, pressed: true } },
    { ...session, controls: { ...session.controls, inverted: true } },
    { ...session, boardId: 'arduino-nano-classic' },
    { ...session, activityId: 'sensor-threshold' },
  ]) {
    const snapshot = adapter.getBeginnerGuideSnapshot(changed, result)
    assert.equal(context(snapshot).observation, undefined)
    assert.equal(context(snapshot).stage, 'observe')
  }
  for (const changedResult of [
    { ...result, outcome: 'on' }, { ...result, signature: 'forged' },
    { ...result, evidenceKind: 'topology-check' }, { ...result, status: 'ungradable' },
  ]) assert.equal(context(adapter.getBeginnerGuideSnapshot(session, changedResult)).observation, undefined)
  const sensor = { ...session, activityId: 'sensor-threshold' }
  const sensorResult = engine.observeBeginnerSession(sensor).result
  assert.equal(context(adapter.getBeginnerGuideSnapshot({ ...sensor, controls: { ...sensor.controls, threshold: 51 } }, sensorResult)).observation, undefined)
})

test('unsupported contexts fail closed and never choose a board or activity', async () => {
  const adapter = await guide()
  for (const boardId of [null, 'unknown-clone-987']) {
    const session = { ...buttonSession(), boardId }
    const snapshot = adapter.getBeginnerGuideSnapshot(session, engine.getBeginnerResult(buttonSession()))
    assert.equal(snapshot.board, undefined)
    assert.equal(context(snapshot).stage, 'choose-board')
    assert.equal(context(snapshot).observation, undefined)
    assert.deepEqual(snapshot.actions.map(action => action.id), ['beginner-board'])
  }
  const unknown = adapter.getBeginnerGuideSnapshot({ ...buttonSession(), activityId: 'unknown-activity' }, null)
  assert.equal(unknown.beginner, undefined)
  assert.equal(unknown.lesson, undefined)
  assert.equal(unknown.board, undefined)
  assert.deepEqual(unknown.actions, [])
})

test('hints are only already-opened content and actions stay in the fixed focus allowlist', async () => {
  const adapter = await guide()
  const allowed = new Set(['beginner-board', 'beginner-controls', 'beginner-prediction', 'beginner-observe', 'beginner-explanation', 'beginner-hints'])
  for (const activity of activities) {
    const session = { ...buttonSession(), activityId: activity.id, hintsUsed: { [activity.id]: 1 } }
    const original = JSON.stringify(session)
    const snapshot = adapter.getBeginnerGuideSnapshot(session, null)
    assert.equal(context(snapshot).hintsUsed, 1)
    assert.deepEqual(context(snapshot).openedHints, [activity.hints[0]])
    assert.equal(JSON.stringify(session), original)
    assert.ok(snapshot.actions.length <= 3)
    assert.equal(new Set(snapshot.actions.map(action => action.id)).size, snapshot.actions.length)
    for (const action of snapshot.actions) {
      assert.ok(allowed.has(action.id), action.id)
      assert.deepEqual(Object.keys(action).sort(), ['id', 'label'])
    }
    const article = adapter.getBeginnerGuideArticle(snapshot)
    assert.equal(article.source.href, '/learn/basics')
    assert.ok(article.paragraphs.includes(activity.hints[0]))
    assert.ok(!article.paragraphs.includes(activity.hints[1]))
  }
})

test('exact beginner intents use local advice while explicit board and clone queries keep their guards', async () => {
  const adapter = await guide()
  const knowledge = await server.ssrLoadModule('/src/lib/guideKnowledge.ts')
  const snapshot = adapter.getBeginnerGuideSnapshot(buttonSession(), null)
  for (const intent of ['Tôi nên làm gì tiếp?', 'toi nen lam gi tiep', 'Giải thích kết quả hiện tại']) {
    const answer = knowledge.findGuideAnswers(intent, snapshot)
    assert.equal(answer.kind, 'matches')
    assert.equal(answer.articles[0].id, 'beginner-current:button-logic')
    assert.equal(answer.articles[0].source.href, '/learn/basics')
  }
  const explicit = knowledge.findGuideAnswers('Arduino Uno R4 Minima ADC', snapshot)
  assert.equal(explicit.kind, 'matches')
  assert.equal(explicit.articles[0].id, 'board:arduino-uno-r4-minima')
  const explicitWithIntent = knowledge.findGuideAnswers('Tôi nên làm gì tiếp với Arduino Uno R4 Minima ADC?', snapshot)
  assert.equal(explicitWithIntent.kind, 'matches')
  assert.equal(explicitWithIntent.articles[0].id, 'board:arduino-uno-r4-minima')
  assert.equal(knowledge.findGuideAnswers('Giải thích kết quả hiện tại board clone XZQ-987 GPIO 999', snapshot).kind, 'unknown')
  assert.equal(knowledge.findGuideAnswers('board clone XZQ-987 GPIO 999', snapshot).kind, 'unknown')
  assert.equal(knowledge.guideRoute('/learn/basics').title, 'Khóa nền tảng điện tử')
  assert.equal(knowledge.guideRoute('/app/learn/basics').href, '/learn/basics')
})

test('an explicitly unavailable current result directs to controls instead of repeatedly asking to observe', async () => {
  const adapter = await guide()
  const session = buttonSession()
  const result = { ...engine.getBeginnerResult(session), status: 'ungradable', outcome: null, message: 'PRIVATE_UNAVAILABLE_REASON_CODE' }
  const snapshot = adapter.getBeginnerGuideSnapshot(session, result)
  assert.equal(context(snapshot).observation, undefined)
  assert.equal(context(snapshot).unavailable, true)
  assert.equal(context(snapshot).stage, 'review')
  assert.equal(snapshot.actions[0].id, 'beginner-controls')
  assert.doesNotMatch(snapshot.next, /Bấm Quan sát/)
  assert.ok(!JSON.stringify(snapshot).includes('PRIVATE_UNAVAILABLE_REASON_CODE'))
})
