import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, course, activities, nets, validator
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  course = await server.ssrLoadModule('/src/lib/beginnerCourse.ts')
  activities = (await server.ssrLoadModule('/src/data/beginnerCourse.ts')).BEGINNER_ACTIVITIES
  nets = (await server.ssrLoadModule('/src/lib/circuitNetsV2.ts')).createNetIndexV2
  validator = (await server.ssrLoadModule('/src/lib/circuitDocV2.ts')).validateCircuitDoc
})
after(async () => server?.close())

test('foundation circuit uses the existing topology and changes the actual return path', () => {
  const session = course.createBeginnerSession()
  assert.equal(session.boardId, null)
  for (const returnConnected of [false, true]) {
    const controls = { ...session.controls, returnConnected }
    const doc = course.getBeginnerFoundationDoc(controls)
    assert.deepEqual(validator(doc).filter(issue => issue.severity === 'error'), [])
    const index = nets(doc)
    assert.equal(index.netOf('power-1:negative') === index.netOf('led-1:cathode'), returnConnected)
    const result = course.getBeginnerResult({ ...session, controls })
    assert.equal(result.outcome, returnConnected ? 'on' : 'off')
    assert.equal(result.evidenceKind, 'topology-check')
  }
})

test('breadboard distinguishes the five-hole strip from the opposite half', () => {
  const session = { ...course.createBeginnerSession(), activityId: 'breadboard' }
  assert.equal(course.getBeginnerResult(session).outcome, 'connected')
  assert.equal(course.getBeginnerResult({ ...session, controls: { ...session.controls, holePair: 'across-trench' } }).outcome, 'separate')
})

test('LED polarity reverses actual footprint pins; missing series resistor blocks observation', () => {
  const session = course.createBeginnerSession()
  const current = { ...session, activityId: 'led-polarity', controls: { ...session.controls, returnConnected: true } }
  assert.equal(course.getBeginnerResult(current).outcome, 'on')
  assert.equal(course.getBeginnerResult({ ...current, controls: { ...current.controls, ledForward: false } }).outcome, 'off')
  const blocked = course.getBeginnerResult({ ...current, controls: { ...current.controls, resistorPresent: false } })
  assert.equal(blocked.outcome, 'blocked')
  assert.match(blocked.message, /điện trở/)
})

test('button and sensor require explicit supported board and derive results from generated parsed code', () => {
  const session = course.createBeginnerSession()
  assert.equal(course.getBeginnerResult({ ...session, activityId: 'button-logic' }).status, 'ungradable')
  for (const board of course.getBeginnerBoardOptions()) {
    const current = { ...session, activityId: 'button-logic', boardId: board.boardId }
    assert.equal(course.getBeginnerResult(current).outcome, 'off')
    assert.equal(course.getBeginnerResult({ ...current, controls: { ...current.controls, pressed: true } }).outcome, 'on')
    assert.equal(course.getBeginnerResult({ ...current, controls: { ...current.controls, pressed: true, inverted: true } }).outcome, 'off')
    for (const [inputPercent, outcome] of [[49, 'off'], [50, 'off'], [51, 'on']]) {
      const result = course.getBeginnerResult({ ...current, activityId: 'sensor-threshold', controls: { ...current.controls, inputPercent } })
      assert.equal(result.status, 'ready', board.boardId)
      assert.equal(result.outcome, outcome, board.boardId + ' ' + inputPercent)
      assert.match(result.code, /potPercent > 50/)
    }
  }
  assert.equal(course.getBeginnerResult({ ...session, activityId: 'sensor-threshold', boardId: 'unknown-board' }).status, 'ungradable')
})

test('completion needs all matching predictions, observations and explanation; board and program edits invalidate grouping', () => {
  for (const activity of activities) {
    let session = { ...course.createBeginnerSession(), activityId: activity.id, boardId: 'arduino-uno-r3' }
    const options = course.getBeginnerCaseOptions(session)
    for (const option of options) {
      session = { ...session, controls: { ...session.controls, ...option.controls } }
      const expected = course.getBeginnerResult(session)
      session.prediction = expected.outcome
      session = course.observeBeginnerSession(session).session
    }
    assert.notEqual(course.getBeginnerAssessment(session, activity.id).status, 'met')
    session.explanations[activity.id] = activity.correctExplanationId
    assert.equal(course.getBeginnerAssessment(session, activity.id).status, 'met', activity.id)
    if (activity.id === 'button-logic' || activity.id === 'sensor-threshold') {
      assert.notEqual(course.getBeginnerAssessment({ ...session, boardId: 'esp32-devkit' }, activity.id).status, 'met')
    }
    if (activity.id === 'sensor-threshold') {
      assert.notEqual(course.getBeginnerAssessment({ ...session, controls: { ...session.controls, threshold: 60 } }, activity.id).status, 'met')
    }
  }
})

test('wrong predictions and unsupported sessions never generate a met criterion or mutate input', () => {
  const session = { ...course.createBeginnerSession(), prediction: 'on' }
  const before = JSON.stringify(session)
  const result = course.observeBeginnerSession(session)
  assert.equal(JSON.stringify(session), before)
  assert.equal(result.session.observations.length, 1)
  assert.equal(course.getBeginnerAssessment(result.session, 'closed-loop').observed, 0)
  const noPrediction = course.createBeginnerSession()
  assert.equal(course.observeBeginnerSession(noPrediction).session.observations.length, 0)
})

test('invalid experiment bounds produce no observation and cannot satisfy a criterion', () => {
  const initial = { ...course.createBeginnerSession(), activityId: 'sensor-threshold', boardId: 'arduino-uno-r3', prediction: 'on' }
  for (const patch of [{threshold: 0}, {threshold: 100}, {threshold: NaN}, {inputPercent: 101}, {inputPercent: -1}]) {
    const session = { ...initial, controls: { ...initial.controls, ...patch } }
    const result = course.observeBeginnerSession(session)
    assert.equal(result.result.status, 'ungradable')
    assert.equal(result.session.observations.length, 0)
    assert.notEqual(course.getBeginnerAssessment(session, 'sensor-threshold').status, 'met')
  }
})


test('choosing a different board for the sensor preserves completed button evidence through navigation', async () => {
  const button = activities.find(item => item.id === 'button-logic')
  let session = { ...course.createBeginnerSession(), activityId: button.id, boardId: 'arduino-mega-2560-r3' }
  for (const { controls } of course.getBeginnerCaseOptions(session)) {
    session = { ...session, controls: { ...session.controls, ...controls } }
    session = course.observeBeginnerSession({ ...session, prediction: course.getBeginnerResult(session).outcome }).session
  }
  session.explanations[button.id] = button.correctExplanationId
  assert.equal(course.getBeginnerAssessment(session, button.id).status, 'met')
  session = course.selectBeginnerActivity(session, 'sensor-threshold')
  session = course.selectBeginnerBoard(session, 'esp32-devkit')
  assert.equal(course.getBeginnerAssessment(session, button.id).status, 'met')
  const storage = await server.ssrLoadModule('/src/lib/beginnerCourseStorage.ts')
  const parsed = storage.parseBeginnerSession(JSON.parse(JSON.stringify(session)))
  assert.ok(parsed)
  assert.equal(course.selectBeginnerActivity(parsed, button.id).boardId, 'arduino-mega-2560-r3')
  assert.equal(course.selectBeginnerActivity(parsed, 'sensor-threshold').boardId, 'esp32-devkit')
})
