import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let m

const wire = (id, a, ap, b, bp) => ({ id, from: { partId: a, pinId: ap }, to: { partId: b, pinId: bp } })

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/data/learningPath.ts', '/src/data/curriculumSchema.ts', '/src/lib/circuitNets.ts', '/src/lib/builderGuidance.ts', '/src/lib/lessonPreflight.ts', '/src/data/productRoutes.ts', '/src/lib/learningProgress.ts', '/src/components/builder/SchematicView.tsx'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('the learning path lists every curriculum lesson exactly once', () => {
  const ids = m.learningStages.flatMap((stage) => stage.lessonIds)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual([...ids].sort(), m.curriculumLessons.map((lesson) => lesson.id).sort())
})

test('a beginner lesson without prerequisites comes first in the path', () => {
  const [first, second] = m.learningPathOrder
  for (const id of [first, second]) {
    const lesson = m.curriculumLessons.find((item) => item.id === id)
    assert.equal(lesson.level, 'nhập môn')
    assert.deepEqual(lesson.prerequisites, ['Không cần kiến thức trước'])
  }
})

test('next lesson follows the path and ends cleanly', () => {
  const order = m.learningPathOrder
  assert.equal(m.getNextLessonId(order[0]), order[1])
  assert.equal(m.getNextLessonId(order.at(-1)), undefined)
})

test('each lesson opens its goal and board page before the lab', () => {
  for (const lesson of m.curriculumLessons) {
    assert.equal(m.getLessonEntryRoute(lesson), lesson.id === 'blink' ? '/learn/esp32-led' : `/learn/${lesson.id}`)
  }
})

test('lesson entry pages keep the app namespace and a readable title', () => {
  assert.equal(m.toAppRoute('/learn/button-led?board=arduino-uno-r3'), '/app/learn/button-led?board=arduino-uno-r3')
  assert.equal(m.toAppRoute('/learn/esp32-led'), '/app/learn/esp32-led')
  assert.equal(m.getPageTitle('/app/learn/button-led'), 'Chuẩn bị bài học — Mạch Mở')
  assert.equal(m.getPageTitle('/learn/esp32-led/thua'), 'Không tìm thấy trang — Mạch Mở')
})

test('preflight pins come from the lesson circuit and the chosen board', () => {
  const esp = m.getLessonPreflight('button-led', 'esp32-devkit')
  const uno = m.getLessonPreflight('button-led', 'arduino-uno-r3')
  const row = (preflight, pin) => preflight.pins.find((item) => item.boardPinId === pin)
  assert.equal(row(esp, 'ledOut').boardLabel, 'GPIO 23')
  assert.equal(row(esp, 'input').boardLabel, 'GPIO 18')
  assert.equal(row(uno, 'ledOut').boardLabel, 'D13')
  assert.equal(row(uno, 'input').boardLabel, 'D2')
  assert.equal(row(uno, 'ledOut').sourceBacked, true)
  assert.equal(row(uno, 'input').sourceBacked, false)
  assert.equal(esp.startRoute, '/build?lesson=button-led&guided=1')
  assert.equal(uno.startRoute, '/build?lesson=button-led&guided=1&board=arduino-uno-r3')
})

test('preflight lists the starter parts with counts and no invented pin rows', () => {
  const display = m.getLessonPreflight('seven-segment-counter', 'esp32-devkit')
  assert.equal(display.parts.find((item) => item.type === 'resistor').count, 7)
  assert.equal(display.parts.find((item) => item.type === 'seven-segment').catalogId, 'seven-segment')
  assert.equal(display.parts.find((item) => item.type === 'resistor').catalogId, 'resistor')
  assert.equal(display.parts.find((item) => item.type === 'resistor').catalogRoute, '/components?component=resistor')
  assert.equal(display.pins.filter((item) => item.boardPinId.startsWith('seg')).length, 7)
  assert.equal(display.pins.find((item) => item.boardPinId === 'seg0').boardLabel, 'GPIO 13')
  const concept = m.getLessonPreflight('buck-boost-concept', 'esp32-devkit')
  assert.deepEqual(concept.pins, [])
  assert.ok(!concept.parts.some((item) => item.type === 'board'))
  const motor = m.getLessonPreflight('dc-motor-driver', 'esp32-devkit')
  assert.ok(motor.pins.every((item) => !item.sourceBacked))
  const sonar = m.getLessonPreflight('ultrasonic-distance', 'esp32-devkit')
  assert.equal(sonar.parts.find((item) => item.type === 'ultrasonic').catalogId, 'hc-sr04')
  assert.equal(sonar.parts.find((item) => item.type === 'ultrasonic').catalogRoute, '/components?component=hc-sr04')
})

test('preflight reports a locked board instead of offering a start', () => {
  const locked = m.getLessonPreflight('seven-segment-counter', 'stm32-nucleo')
  assert.equal(locked.support.supported, false)
  assert.ok(locked.support.reason)
  assert.deepEqual(locked.pins, [])
})

test('preflight offers the 3D board link only when a viewer exists', () => {
  assert.equal(m.getLessonPreflight('button-led', 'arduino-uno-r3').hasBoardViewer, true)
  assert.equal(m.getLessonPreflight('button-led', 'stm32-nucleo').hasBoardViewer, false)
})

test('path highlight starts at the first lesson and resumes from progress', () => {
  const order = m.learningPathOrder
  assert.deepEqual(m.getPathHighlight(undefined), { currentId: undefined, nextId: order[0] })
  assert.deepEqual(m.getPathHighlight(order[2]), { currentId: order[2], nextId: order[3] })
  assert.deepEqual(m.getPathHighlight('not-a-lesson'), { currentId: undefined, nextId: order[0] })
})

test('path highlight skips self-reported completed lessons when recommending the next step', () => {
  const order = m.learningPathOrder
  assert.deepEqual(m.getPathHighlight(order[2], [order[2]]), { currentId: undefined, nextId: order[3] })
  assert.deepEqual(m.getPathHighlight(order[2], [order[2], order[3], order[4]]), { currentId: undefined, nextId: order[5] })
  assert.deepEqual(m.getPathHighlight(order.at(-1), order), { currentId: undefined, nextId: undefined })
})

test('resume suggestion keeps the detailed first lesson and advances after self-reported completion', () => {
  const order = m.learningPathOrder
  assert.equal(m.getResumeLessonId(undefined, []), undefined)
  assert.equal(m.getResumeLessonId(order[2], []), order[2])
  assert.equal(m.getResumeLessonId(order[2], [order[2]]), order[3])
  assert.equal(m.getResumeLessonId(order[2], [order[2], order[3]]), order[4])
  assert.equal(m.getResumeLessonId(order.at(-1), order), undefined, 'when all lessons are self-reported complete, do not recommend resuming a finished lesson')
})

test('learning progress migrates an old last-opened lesson to started without claiming completion', () => {
  const storage = memoryStorage({ 'machmo-learning-progress-v1': JSON.stringify({ lastLessonId: 'blink', checklists: { blink: ['Đã nhận diện board'] } }) })
  const progress = m.readLearningProgress(storage)
  assert.deepEqual(progress.startedLessonIds, ['blink'])
  assert.deepEqual(progress.selfReportedCompletedLessonIds, [])
  assert.deepEqual(progress.checklists.blink, ['Đã nhận diện board'])
})

test('opening a lesson records it as started and leaves self-reported completion untouched', () => {
  const storage = memoryStorage()
  assert.equal(m.recordLessonOpened('button-led', storage), true)
  const progress = m.readLearningProgress(storage)
  assert.equal(progress.lastLessonId, 'button-led')
  assert.deepEqual(progress.startedLessonIds, ['button-led'])
  assert.deepEqual(progress.selfReportedCompletedLessonIds, [])
})

test('learners can self-report completion and undo it without deleting started progress', () => {
  const storage = memoryStorage()
  assert.equal(m.setLessonSelfReportedCompletion('analog-ldr', true, storage), true)
  assert.equal(m.isLessonSelfReportedComplete('analog-ldr', storage), true)
  assert.equal(m.setLessonSelfReportedCompletion('analog-ldr', false, storage), true)
  const progress = m.readLearningProgress(storage)
  assert.deepEqual(progress.startedLessonIds, ['analog-ldr'])
  assert.deepEqual(progress.selfReportedCompletedLessonIds, [])
})

test('learning progress ignores unknown lesson ids and malformed status entries', () => {
  const storage = memoryStorage({ 'machmo-learning-progress-v1': JSON.stringify({ lastLessonId: 'unknown', startedLessonIds: ['blink', 'unknown', 'blink'], selfReportedCompletedLessonIds: ['button-led', 17] }) })
  const progress = m.readLearningProgress(storage)
  assert.equal(progress.lastLessonId, undefined)
  assert.deepEqual(progress.startedLessonIds, ['blink', 'button-led'])
  assert.deepEqual(progress.selfReportedCompletedLessonIds, ['button-led'])
  assert.equal(m.setLessonSelfReportedCompletion('unknown', true, storage), false)
})

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) }
}

test('circuit status names each state of the build loop', () => {
  const base = { wireCount: 3, errorCount: 0, running: false, hasRun: false }
  assert.equal(m.getCircuitStatus({ ...base, wireCount: 0 }).id, 'unwired')
  assert.equal(m.getCircuitStatus({ ...base, errorCount: 1 }).id, 'error')
  assert.equal(m.getCircuitStatus(base).id, 'ready')
  assert.equal(m.getCircuitStatus({ ...base, running: true }).id, 'running')
  assert.equal(m.getCircuitStatus({ ...base, hasRun: true }).id, 'stopped')
  assert.equal(m.getCircuitStatus({ ...base, running: true, errorCount: 1 }).id, 'error')
})

test('part connections group each pin with its whole net, including through a breadboard node', () => {
  const wires = [wire('1', 'board-1', 'ledOut', 'bread-1', 'rowA'), wire('2', 'bread-1', 'rowA', 'res-1', 'a'), wire('3', 'res-1', 'b', 'led-1', 'anode')]
  const connections = m.getPartConnections('res-1', ['a', 'b'], wires)
  assert.deepEqual(connections[0].pinId, 'a')
  assert.deepEqual(connections[0].peers.map((peer) => `${peer.partId}:${peer.pinId}`).sort(), ['board-1:ledOut', 'bread-1:rowA'])
  assert.deepEqual([...connections[0].wireIds].sort(), ['1', '2'])
  assert.deepEqual(connections[1].peers, [{ partId: 'led-1', pinId: 'anode' }])
})

test('wire net groups are deterministic and preserve every connected endpoint and wire', () => {
  const groups = m.getWireNetGroups([
    wire('wire-b', 'bread-1', 'rail-', 'led-1', 'cathode'),
    wire('wire-a', 'board-1', 'gnd', 'bread-1', 'rail-'),
    wire('wire-c', 'board-1', 'ledOut', 'led-1', 'anode'),
  ])
  assert.deepEqual(groups.map((group) => group.wireIds), [['wire-a', 'wire-b'], ['wire-c']])
  assert.deepEqual(groups[0].endpoints, ['board-1:gnd', 'bread-1:rail-', 'led-1:cathode'])
  assert.deepEqual(groups[1].endpoints, ['board-1:ledOut', 'led-1:anode'])
  assert.deepEqual(m.getWireNetGroups([]), [])
})

test('schematic exposes an accessible wire-only net explorer with an explicit electrical-simulation boundary', () => {
  const markup = renderToStaticMarkup(createElement(m.SchematicView, {
    parts: [], wires: [wire('wire-a', 'source', 'positive', 'resistor', 'a'), wire('wire-b', 'resistor', 'b', 'led', 'anode')], definitions: [],
    selectedPartId: '', selectedWireId: '', pending: null, highlightedNetKey: null,
    nameFor: (part) => part.id, colorWire: () => '#fff', active: () => false, activePart: () => false,
    onSelect: () => {}, onSelectWire: () => {}, onSelectNet: () => {}, onPinClick: () => {}, onDrop: () => {}, onRotate: () => {}, onRemove: () => {}, onRemoveWire: () => {},
  }))
  assert.match(markup, /aria-label="Các net logic của sơ đồ"/)
  assert.match(markup, /Net 1/)
  assert.match(markup, /source\.positive/)
  assert.match(markup, /không đồng nghĩa dòng điện, điện áp hoặc netlist PCB/)
})

test('an unconnected pin reports no peers', () => {
  const connections = m.getPartConnections('led-1', ['anode', 'cathode'], [wire('3', 'res-1', 'b', 'led-1', 'anode')])
  assert.deepEqual(connections[1].peers, [])
  assert.deepEqual(connections[1].wireIds, [])
})

test('dashboard CTA covers a new learner, an open lesson, partial completion and a finished path', () => {
  const order = m.learningPathOrder
  assert.deepEqual(m.getLearningResume(undefined, []), { state: 'new', label: 'Bắt đầu bài LED', lessonId: 'blink', route: '/learn/esp32-led' })
  assert.deepEqual(m.getLearningResume('button-led', []), { state: 'in-progress', label: 'Tiếp tục học', lessonId: 'button-led', route: '/learn/button-led' })
  assert.deepEqual(m.getLearningResume('button-led', ['button-led']), { state: 'next', label: 'Học bài tiếp theo', lessonId: order[3], route: `/learn/${order[3]}` })
  assert.deepEqual(m.getLearningResume(order.at(-1), order), { state: 'all-complete', label: 'Xem lại lộ trình', route: '/topics' })
})

test('completion without a last-opened lesson never falls back to the beginner CTA', () => {
  const order = m.learningPathOrder
  assert.equal(m.getLearningResume(undefined, order).state, 'all-complete')
  assert.deepEqual(m.getLearningResume(undefined, [order[0]]).lessonId, order[1])
  assert.equal(m.getLearningResume(order.at(-1), [order.at(-1)]).lessonId, order[0], 'finishing the last lesson first returns to the earliest open one')
  assert.equal(m.getLearningResume(undefined, ['not-a-real-lesson']).state, 'new', 'invalid completion ids are ignored')
})

test('path markers only say start here to a learner with no progress', () => {
  const order = m.learningPathOrder
  assert.equal(m.getPathMarker(order[0], undefined, []), 'Bắt đầu từ đây')
  assert.equal(m.getPathMarker(order[2], order[2], []), 'Bài vừa mở')
  assert.equal(m.getPathMarker(order[3], order[2], []), 'Bài tiếp theo')
  assert.equal(m.getPathMarker(order[3], order[2], [order[2]]), 'Bài tiếp theo')
  assert.equal(m.getPathMarker(order[1], undefined, [order[0]]), 'Bài tiếp theo')
  assert.equal(m.getPathMarker(order[4], order[2], []), undefined)
})

test('inspecting a reference board through the LED page does not count as opening the lesson', () => {
  assert.equal(m.shouldRecordLessonVisit(null), true)
  assert.equal(m.shouldRecordLessonVisit('esp32-devkit'), true)
  assert.equal(m.shouldRecordLessonVisit('adafruit-feather-esp32-s3-tft-5483'), false)
  assert.equal(m.shouldRecordLessonVisit('arduino-uno-r3'), false)
  assert.equal(m.shouldRecordLessonVisit('unknown'), false)
})

test('preflight says so when a linked board has no lesson data instead of silently showing ESP32', () => {
  assert.equal(m.getPreflightBoardNotice(null), undefined)
  assert.equal(m.getPreflightBoardNotice('arduino-uno-r3'), undefined)
  const reference = m.getPreflightBoardNotice('adafruit-feather-esp32-s3-tft-5483')
  assert.equal(reference.kind, 'reference')
  assert.match(reference.message, /#5483/)
  assert.match(reference.message, /ESP32 DevKit V1/)
  assert.equal(reference.boardRoute, '/boards?board=adafruit-feather-esp32-s3-tft-5483')
  const unknown = m.getPreflightBoardNotice('khong-co')
  assert.equal(unknown.kind, 'unknown')
  assert.equal(unknown.boardRoute, undefined)
})

test('preflight board links follow the chosen board', () => {
  const uno = m.getLessonPreflight('button-led', 'arduino-uno-r3')
  assert.equal(uno.boardRoute, '/boards?board=arduino-uno-r3')
  assert.equal(uno.parts.find((item) => item.type === 'board').catalogRoute, '/boards?board=arduino-uno-r3')
})

test('preflight does not power HC-SR04 from the 3.3 V logic label', () => {
  const sonar = m.getLessonPreflight('ultrasonic-distance', 'esp32-devkit')
  const vcc = sonar.pins.find((item) => item.partLabel.includes('HC-SR04') && item.partPinLabel === 'VCC')
  assert.doesNotMatch(vcc.boardLabel, /3\.3 V/)
  assert.match(vcc.boardLabel, /5 V/)
  assert.match(m.getLessonPreflight('ir-alert', 'esp32-devkit').pins.find((item) => item.boardPinId === 'vcc').boardLabel, /3\.3 V/)
})

test('preflight names the 10 kΩ divider resistor of the LDR lesson separately', () => {
  const ldr = m.getLessonPreflight('analog-ldr', 'esp32-devkit')
  assert.deepEqual(ldr.parts.filter((item) => item.type === 'resistor').map((item) => [item.label, item.count]), [['Điện trở 220 Ω', 1], ['Điện trở 10 kΩ', 1]])
  assert.ok(ldr.pins.some((item) => item.partLabel === 'Điện trở 10 kΩ'))
})

test('legacy board ids stay silent in preflight because they still resolve to a real target', () => {
  assert.equal(m.getPreflightBoardNotice('uno'), undefined)
  assert.equal(m.getPreflightBoardNotice('esp32'), undefined)
})
