import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let server, pack, engine, activities, Component
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  pack = await server.ssrLoadModule('/src/lib/beginnerTeacherPack.ts')
  engine = await server.ssrLoadModule('/src/lib/beginnerCourse.ts')
  activities = (await server.ssrLoadModule('/src/data/beginnerCourse.ts')).BEGINNER_ACTIVITIES
  Component = (await server.ssrLoadModule('/src/components/learning/BeginnerTeacherPack.tsx')).BeginnerTeacherPack
})
after(async () => server?.close())

test('every supported board has five activities and thirteen exact engine cases and code', () => {
  for (const board of engine.getBeginnerBoardOptions()) {
    const result = pack.createBeginnerTeacherPack(board.boardId)
    assert.equal(result.downloadReady, true)
    assert.equal(result.activities.length, 5)
    assert.equal(result.activities.flatMap(item => item.cases).length, 13)
    result.activities.forEach((item, index) => {
      assert.equal(item.title, activities[index].title)
      assert.equal(item.goal, activities[index].goal)
      const fresh = { ...engine.createBeginnerSession(), boardId: board.boardId, activityId: item.id }
      const options = engine.getBeginnerCaseOptions(fresh)
      assert.equal(item.cases.length, options.length)
      item.cases.forEach((entry, i) => {
        const session = { ...fresh, controls: { ...fresh.controls, ...options[i].controls } }
        const expected = engine.getBeginnerResult(session)
        assert.equal(entry.label, options[i].label)
        assert.deepEqual(entry.controls, session.controls)
        assert.deepEqual(entry.result, expected)
        assert.equal(entry.code, engine.getBeginnerCode(session))
      })
    })
    const sensor = result.activities.find(item => item.id === 'sensor-threshold')
    assert.deepEqual(sensor.cases.map(item => item.controls.inputPercent), [49, 50, 51])
    assert.deepEqual(sensor.cases.map(item => item.result.outcome), ['off', 'off', 'on'])
    assert.equal(result.activities[2].cases[2].result.outcome, 'blocked')
  }
})

test('missing, unknown and malformed board inputs never fabricate code or full-pack readiness', () => {
  for (const boardId of [undefined, null, '', 'future-board', {}, ['arduino-uno-r3'], 1]) {
    const result = pack.createBeginnerTeacherPack(boardId)
    assert.equal(result.downloadReady, false)
    assert.ok(result.reason)
    assert.ok(result.activities.slice(0, 3).every(item => item.cases.every(entry => entry.result.status === 'ready')))
    assert.ok(result.activities.slice(3).every(item => item.cases.every(entry => entry.result.status === 'ungradable' && entry.code === null)))
  }
})

test('standalone output is deterministic, escaped and contains blank worksheets separately from answer key', () => {
  const model = pack.createBeginnerTeacherPack('arduino-uno-r3')
  const html = pack.renderBeginnerTeacherPackHtml(model)
  assert.equal(html, pack.renderBeginnerTeacherPackHtml(pack.createBeginnerTeacherPack('arduino-uno-r3')))
  assert.match(html, /<meta charset="utf-8">/)
  assert.match(html, /id="learner-worksheet"/)
  assert.match(html, /id="teacher-answer-key"/)
  assert.equal((html.match(/class="worksheet-case"/g) || []).length, 13)
  const learnerPart = html.split('id="teacher-answer-key"')[0]
  assert.doesNotMatch(learnerPart, /<pre|LED sáng theo mô hình đường nối/)
  assert.match(html, /break-before:\s*page/)
  assert.doesNotMatch(html, /<script|<iframe|<form|<img|<link|@import|url\(|(?:src|href)=/i)
  const attack = '</style><script>alert("x")</script>&\' '
  model.boardName = attack
  model.activities[0].title = attack
  model.activities[0].cases[0].result.message = attack
  model.activities[0].cases[0].code = attack
  const escaped = pack.renderBeginnerTeacherPackHtml(model)
  assert.doesNotMatch(escaped, /<script|<\/style><script/)
  assert.match(escaped, /&lt;script&gt;/)
  assert.match(escaped, /&quot;x&quot;/)
  assert.match(escaped, /&amp;&#39;/)
})

test('pack ignores raw learner session data and never consults storage', () => {
  const original = globalThis.window
  try {
    globalThis.window = { get localStorage() { throw new Error('pack touched storage') } }
    const session = engine.createBeginnerSession()
    session.controls.threshold = 80
    session.observations = [{ private: 'PRIVATE LEARNER OBSERVATION' }]
    const before = JSON.stringify(session)
    const result = pack.createBeginnerTeacherPack(session)
    assert.equal(result.downloadReady, false)
    const html = pack.renderBeginnerTeacherPackHtml(result)
    assert.doesNotMatch(html, /PRIVATE LEARNER OBSERVATION|potPercent > 80/)
    assert.equal(JSON.stringify(session), before)
  } finally { if (original === undefined) delete globalThis.window; else globalThis.window = original }
})

test('SSR starts with an explicit independent board label, no fallback and disabled download', () => {
  const html = renderToStaticMarkup(createElement(Component))
  assert.match(html, /<label[^>]*for="teacher-pack-board"/)
  assert.match(html, /<select[^>]*id="teacher-pack-board"/)
  assert.match(html, /<option value="" selected=""/)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Tải gói HTML/)
  assert.match(html, /sandbox=""/)
  assert.match(html, /title="Xem trước gói thực hành giáo viên"/)
})
