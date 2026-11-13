import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const error = (code, message, suggestedFix) => ({ severity: 'error', code, message, suggestedFix, affectedPartIds: [] })
const note = (code, message) => ({ severity: 'info', code, message, affectedPartIds: [] })
const base = { step: 'assemble', lessonTitle: 'LED nhấp nháy', diagnostics: [], running: false, hasRun: false, wireMode: false, pendingPin: false, awaitingPrediction: false }

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/lib/builderGuidance.ts', '/src/lib/circuitValidation.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('a locked lesson offers a concrete way out on any step', () => {
  const guidance = m.getBuilderGuidance({ ...base, step: 'run', lockReason: 'Bài analog đang khóa.', fallbackBoardName: 'ESP32 DevKit V1' })
  assert.equal(guidance.tone, 'blocked')
  assert.equal(guidance.detail, 'Bài analog đang khóa.')
  assert.equal(guidance.action, 'switch-board')
  assert.match(guidance.actionLabel, /ESP32 DevKit V1/)
})

test('the assemble step leads with the first circuit error, its fix, and the open pin', () => {
  const guidance = m.getBuilderGuidance({ ...base, diagnostics: [note('open-part-res-1', 'Điện trở còn 1 chân chưa nối (Đầu 1).'), error('led-no-series-resistor-led-1', 'Chưa có đường nối.', 'Thêm điện trở.')] })
  assert.equal(guidance.tone, 'blocked')
  assert.equal(guidance.detail, 'Chưa có đường nối.')
  assert.equal(guidance.fix, 'Thêm điện trở.')
  assert.equal(guidance.hint, 'Điện trở còn 1 chân chưa nối (Đầu 1).')
  assert.equal(guidance.action, 'toggle-wire')
})

test('wire mode explains which pin to pick next', () => {
  assert.match(m.getBuilderGuidance({ ...base, wireMode: true }).title, /chân thứ nhất/)
  assert.match(m.getBuilderGuidance({ ...base, wireMode: true, pendingPin: true }).title, /chân thứ hai/)
})

test('wire mode stops asking for pins once the circuit is valid', () => {
  const finished = m.getBuilderGuidance({ ...base, wireMode: true, diagnostics: [note('topology-checked', 'Đã nối đủ.')] })
  assert.equal(finished.tone, 'ready')
  assert.equal(finished.action, 'next-step')
})

test('a valid circuit moves the learner on to code', () => {
  const guidance = m.getBuilderGuidance(base)
  assert.equal(guidance.tone, 'ready')
  assert.equal(guidance.action, 'next-step')
  assert.match(guidance.actionLabel, /viết code/)
})

test('a code problem offers restoring the sample', () => {
  const guidance = m.getBuilderGuidance({ ...base, step: 'code', codeIssue: 'Dòng 3: thiếu pinMode.' })
  assert.equal(guidance.tone, 'blocked')
  assert.equal(guidance.detail, 'Dòng 3: thiếu pinMode.')
  assert.equal(guidance.action, 'restore-code')
})

test('the run step sends the learner back to whatever blocks the run', () => {
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', diagnostics: [error('x', 'Hở mạch.')] }).action, 'back-assemble')
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', codeIssue: 'Sai cú pháp.' }).action, 'back-code')
})

test('the run step asks for a prediction before the first run', () => {
  const guidance = m.getBuilderGuidance({ ...base, step: 'run', awaitingPrediction: true })
  assert.match(guidance.title, /dự đoán/i)
  assert.equal(guidance.action, 'focus-prediction')
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run' }).action, 'run')
})

test('the run step reflects running and finished states', () => {
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', running: true }).tone, 'running')
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', running: true }).actionLabel, 'Tạm dừng')
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', hasRun: true }).tone, 'ready')
})

test('a finished run offers the next lesson as a second action', () => {
  const guidance = m.getBuilderGuidance({ ...base, step: 'run', hasRun: true, nextLessonTitle: 'Nút nhấn điều khiển LED' })
  assert.equal(guidance.secondaryAction, 'next-lesson')
  assert.match(guidance.secondaryLabel, /Nút nhấn điều khiển LED/)
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', running: true, nextLessonTitle: 'X' }).secondaryAction, undefined)
  assert.equal(m.getBuilderGuidance({ ...base, step: 'run', hasRun: true }).secondaryAction, undefined)
})

test('diagnostics are grouped so errors never sit behind notes', () => {
  const groups = m.groupDiagnostics([note('a', 'n'), error('b', 'e'), { ...note('c', 'w'), severity: 'warning' }])
  assert.deepEqual(groups.actionable.map((item) => item.code), ['b', 'c'])
  assert.deepEqual(groups.notes.map((item) => item.code), ['a'])
})

test('a broken LED path reports one error, not two wordings of the same problem', () => {
  const parts = [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'led-1', type: 'led', x: 1, y: 1 }, { id: 'res-1', type: 'resistor', x: 1, y: 1 }]
  const wire = (id, a, ap, b, bp) => ({ id, from: { partId: a, pinId: ap }, to: { partId: b, pinId: bp } })
  const errors = m.validateCircuit({ parts, wires: [wire('1', 'board-1', 'ledOut', 'res-1', 'a'), wire('2', 'res-1', 'b', 'led-1', 'anode')] }, 'blink').filter((item) => item.severity === 'error')
  assert.equal(errors.length, 1, errors.map((item) => item.code).join())
  const noWires = m.validateCircuit({ parts, wires: [] }, 'blink').filter((item) => item.severity === 'error')
  assert.deepEqual(noWires.map((item) => item.code), ['led-series-path'])
})
