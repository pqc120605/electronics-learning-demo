import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const onInputs = { pressed: true, detected: true, potPercent: 80, lightPercent: 40 }
const flow = (lessonId, overrides = {}) => {
  const circuit = m.circuitForLesson(lessonId)
  return m.getLogicFlow({ lessonId, parts: circuit.placed, wires: circuit.wires, frame: { ledOn: true, level: 'HIGH', segments: [1, 0, 0, 0, 0, 0, 0] }, active: true, hasCircuitErrors: false, inputs: onInputs, tick: 1, ...overrides })
}

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/lib/logicTrace.ts', '/src/lib/assemblyLayout.ts', '/src/lib/partInfo.ts', '/src/data/lessonCircuits.ts', '/src/data/componentRegistry.ts', '/src/data/esp32DevkitModel.ts', '/src/data/builderLessons.ts', '/src/data/simulationTargets.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('flow labels GND and power from pin types while the program runs', () => {
  const states = flow('ir-alert')
  assert.equal(states.get('ir-wire-gnd').signal, 'ground')
  assert.equal(states.get('ir-wire-gnd').label, 'GND')
  assert.equal(states.get('ir-wire-vcc').signal, 'power')
  assert.equal(states.get('ir-wire-vcc').direction, 'none')
})

test('a driven LED path runs from the output through the resistor to the return', () => {
  const states = flow('blink')
  assert.equal(states.get('default-1').signal, 'high')
  assert.equal(states.get('default-1').label, 'HIGH')
  assert.equal(states.get('default-1').direction, 'forward')
  assert.equal(states.get('default-2').direction, 'forward')
  assert.equal(states.get('default-3').direction, 'forward')
})

test('flow direction follows the signal when a wire is stored backwards', () => {
  const circuit = m.circuitForLesson('blink')
  const wires = circuit.wires.map((wire) => wire.id === 'default-1' ? { ...wire, from: wire.to, to: wire.from } : wire)
  const states = m.getLogicFlow({ lessonId: 'blink', parts: circuit.placed, wires, frame: { ledOn: true, level: 'HIGH' }, active: true, hasCircuitErrors: false, inputs: onInputs, tick: 1 })
  assert.equal(states.get('default-1').direction, 'reverse')
})

test('a low output is labelled but has no moving flow', () => {
  const states = flow('blink', { frame: { ledOn: false, level: 'LOW' } })
  assert.equal(states.get('default-1').signal, 'low')
  assert.equal(states.get('default-1').direction, 'none')
})

test('the pull-up input reads LOW when pressed and HIGH when released, without a direction', () => {
  assert.equal(flow('button-led').get('button-wire-in').label, 'LOW')
  const released = flow('button-led', { inputs: { ...onInputs, pressed: false } }).get('button-wire-in')
  assert.equal(released.label, 'HIGH')
  assert.equal(released.direction, 'none')
})

test('sensor outputs flow toward the board; analog shows the normalized value only', () => {
  const detected = flow('ir-alert')
  assert.equal(detected.get('ir-wire-out').direction, 'reverse')
  assert.equal(detected.get('ir-wire-out').signal, 'low')
  assert.equal(detected.get('ir-wire-out').label, 'LOW')
  const clear = flow('ir-alert', { inputs: { ...onInputs, detected: false }, frame: { ledOn: false, level: 'LOW' } })
  assert.equal(clear.get('ir-wire-out').signal, 'high')
  assert.equal(clear.get('ir-wire-out').label, 'HIGH')
  const pot = flow('analog-potentiometer').get('pot-signal')
  assert.equal(pot.signal, 'analog')
  assert.equal(pot.label, '80%')
  assert.equal(pot.direction, 'reverse')
})

test('ultrasonic marks TRIG and ECHO pulses with opposite directions', () => {
  const states = flow('ultrasonic-distance')
  assert.deepEqual([states.get('sonar-wire-trig').signal, states.get('sonar-wire-trig').direction], ['pulse', 'forward'])
  assert.deepEqual([states.get('sonar-wire-echo').signal, states.get('sonar-wire-echo').direction], ['pulse', 'reverse'])
})

test('seven-segment wires show each driven and undriven segment', () => {
  const states = flow('seven-segment-counter')
  assert.equal(states.get('seg-board-0').signal, 'high')
  assert.equal(states.get('seg-display-0').direction, 'forward')
  assert.equal(states.get('seg-board-1').signal, 'low')
  assert.equal(states.get('seg-common-1').signal, 'ground')
})

test('concept lessons never claim a direction or a level', () => {
  for (const lesson of ['buck-boost-concept', 'dc-motor-driver', 'mosfet-switch']) {
    for (const [, state] of flow(lesson)) {
      assert.equal(state.direction, 'none', lesson)
      assert.ok(!['high', 'low', 'pulse', 'analog'].includes(state.signal), lesson)
    }
  }
})

test('no flow is shown before a run, with circuit errors, or without a frame', () => {
  assert.equal(flow('blink', { active: false }).size, 0)
  assert.equal(flow('blink', { hasCircuitErrors: true }).size, 0)
  assert.equal(flow('blink', { frame: null }).size, 0)
})

test('layout uses CAD for a board with a model and a labelled box for one without', () => {
  const { placed, wires } = m.circuitForLesson('blink')
  const options = (boardId) => ({ boardId, target: m.getSimulationTarget(boardId), lessonId: 'blink' })
  const board = m.getAssemblyPlan(placed, wires, options('arduino-uno-r3')).placements.find((item) => item.type === 'board')
  assert.equal(board.kind, 'board-cad')
  assert.match(board.assetUrl, /arduino-uno-r3\.glb/)
  const without = m.getAssemblyPlan(placed, wires, options('stm32-nucleo')).placements.find((item) => item.type === 'board')
  assert.equal(without.kind, 'fallback-box')
  assert.equal(without.assetUrl, undefined)
})

test('layout separates library meshes, parametric meshes and fallback boxes', () => {
  const parts = [{ id: 'a', type: 'led', x: 10, y: 10 }, { id: 'b', type: 'ultrasonic', x: 50, y: 50 }, { id: 'c', type: 'unlisted-legacy-part', x: 90, y: 90 }]
  const layout = m.getAssemblyPlan(parts, [], { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' }).placements
  assert.deepEqual(layout.map((item) => item.kind), ['component-cad', 'component-parametric', 'fallback-box'])
})

test('ESP32 wire ends use the real header pads for the chosen GPIO', () => {
  const target = m.getSimulationTarget('esp32-devkit')
  const anchors = m.getBoardPinAnchors('esp32-devkit', target, 'button-led', m.esp32DevkitModel.pins)
  const gpio23 = m.esp32DevkitModel.pins.find((pin) => pin.gpio === 23)
  assert.deepEqual(anchors.ledOut, gpio23.anchor)
  assert.equal(anchors.gnd.length, 3)
  assert.equal(Object.keys(m.getBoardPinAnchors('arduino-uno-r3', m.getSimulationTarget('arduino-uno-r3'), 'blink', [])).length, 0)
})

test('part info shows only tabs that have real content', () => {
  const part = { id: 'led-1', type: 'led', x: 1, y: 1 }
  const info = m.getPartInfo({ part, definition: m.getComponentDefinition('led'), code: 'digitalWrite(ledPin, HIGH);\nint x = 1;', lessonMode: 'code-subset', boardEvidence: undefined })
  assert.deepEqual(info.tabs, ['overview', 'pins', 'example', 'limits', 'source'])
  assert.deepEqual(info.exampleLines, ['digitalWrite(ledPin, HIGH);'])
  const concept = m.getPartInfo({ part, definition: m.getComponentDefinition('led'), code: 'digitalWrite(ledPin, HIGH);', lessonMode: 'fixed-scenario', boardEvidence: undefined })
  assert.ok(!concept.tabs.includes('example'))
})

test('part info distinguishes generic parametric models from unlisted fallbacks and source CAD', () => {
  const part = { id: 'n', type: 'thermistor', x: 1, y: 1 }
  const ntc = m.getPartInfo({ part, definition: m.getComponentDefinition('thermistor'), code: '', lessonMode: 'code-subset', boardEvidence: undefined })
  assert.equal(ntc.modelKind, 'component-parametric')
  assert.match(ntc.modelLabel, /tham số/)
  assert.equal(ntc.source.license, undefined)
  const unknown = m.getPartInfo({ part: { ...part, type: 'unlisted-part' }, definition: m.getComponentDefinition('thermistor'), code: '', lessonMode: 'code-subset', boardEvidence: undefined })
  assert.equal(unknown.modelKind, 'fallback-box')
  assert.match(unknown.modelLabel, /thay thế/)
  assert.equal(unknown.source.license, undefined)
  const sonar = m.getPartInfo({ part: { ...part, type: 'ultrasonic' }, definition: m.getComponentDefinition('ultrasonic'), code: '', lessonMode: 'code-subset', boardEvidence: undefined })
  assert.equal(sonar.modelKind, 'component-parametric')
  assert.match(sonar.modelLabel, /tham số/)
})

test('board info carries its CAD evidence; a board feature marks inferred roles', () => {
  const part = { id: 'board-1', type: 'board', x: 1, y: 1 }
  const evidence = { status: 'source-verified-cad', revision: 'Rev3', sourceUrl: 'https://example.test', licenseName: 'CC BY-SA 4.0', attribution: 'a', confidenceNote: 'c', unresolvedIssues: ['u'], published: true }
  const info = m.getPartInfo({ part, definition: m.getComponentDefinition('board'), code: '', lessonMode: 'code-subset', boardEvidence: evidence })
  assert.equal(info.modelKind, 'board-cad')
  assert.equal(info.source.revision, 'Rev3')
  const feature = m.esp32DevkitModel.features.find((item) => item.id === 'wroom-module')
  const featureInfo = m.getFeatureInfo({ ...feature, roleEvidence: 'unverified' }, evidence)
  assert.equal(featureInfo.title, feature.name)
  assert.match(featureInfo.evidenceLabel, /chưa xác minh/)
})

test('callouts keep the selected part and stay within the canvas corners', () => {
  const anchors = [{ id: 'a', x: 100, y: 100 }, { id: 'b', x: 700, y: 100 }, { id: 'c', x: 100, y: 400 }, { id: 'd', x: 700, y: 400 }, { id: 'e', x: 400, y: 250 }]
  const callouts = m.assignCallouts(anchors, 'e', 800, 500)
  assert.equal(callouts.length, 4)
  assert.ok(callouts.some((item) => item.id === 'e'))
  assert.equal(new Set(callouts.map((item) => item.corner)).size, 4)
  assert.deepEqual(m.assignCallouts(anchors, 'e', 500, 500), [])
})
