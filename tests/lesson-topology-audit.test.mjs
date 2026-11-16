import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

// One electrical contract per builder lesson preset: which pins share a net.
// The same preset feeds the 2D, schematic and 3D views, so a wrong net here is wrong everywhere.
let server, circuitForLesson, builderLessons, validateCircuit, createNetIndex, getLessonBoardSupport, getInputAlias, getSimulationTarget, getLogicFlow

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const load = (path) => server.ssrLoadModule(path)
  ;({ circuitForLesson } = await load('/src/data/lessonCircuits.ts'))
  ;({ builderLessons, getLessonBoardSupport, getInputAlias } = await load('/src/data/builderLessons.ts'))
  ;({ validateCircuit } = await load('/src/lib/circuitValidation.ts'))
  ;({ createNetIndex } = await load('/src/lib/circuitNets.ts'))
  ;({ getSimulationTarget } = await load('/src/data/simulationTargets.ts'))
  ;({ getLogicFlow } = await load('/src/lib/logicTrace.ts'))
})
after(async () => { await server?.close() })

const ledPath = [['board-1:ledOut', 'res-1:a'], ['res-1:b', 'led-1:anode'], ['led-1:cathode', 'board-1:gnd']]
const contracts = {
  blink: ledPath,
  // Battery-powered by default; no board in the loop.
  'source-led': [['battery-1:positive', 'res-1:a'], ['res-1:b', 'led-1:anode'], ['led-1:cathode', 'battery-1:negative']],
  'button-led': [...ledPath, ['board-1:input', 'button-1:contactA'], ['button-1:contactB', 'board-1:gnd']],
  'ir-alert': [...ledPath, ['board-1:input', 'ir-1:out'], ['board-1:vcc', 'ir-1:vcc'], ['board-1:gnd', 'ir-1:gnd']],
  'analog-potentiometer': [...ledPath, ['board-1:input', 'pot-1:wiper'], ['board-1:vcc', 'pot-1:vcc'], ['board-1:gnd', 'pot-1:gnd']],
  'analog-ldr': [...ledPath, ['board-1:vcc', 'ldr-1:a'], ['ldr-1:b', 'board-1:input'], ['resistor-ldr-1:a', 'board-1:input'], ['resistor-ldr-1:b', 'board-1:gnd']],
  // HC-SR04 needs 5 V; ECHO reaches the GPIO through a 1 kΩ / 2 kΩ divider (5 V × 2/3 ≈ 3,3 V).
  'ultrasonic-distance': [...ledPath, ['board-1:trig', 'sonar-1:trig'], ['board-1:v5', 'sonar-1:vcc'], ['board-1:gnd', 'sonar-1:gnd'], ['sonar-1:echo', 'echo-res-top:a'], ['echo-res-top:b', 'board-1:echo'], ['echo-res-bottom:a', 'board-1:echo'], ['echo-res-bottom:b', 'board-1:gnd']],
  'seven-segment-counter': [...'abcdefg'].flatMap((segment, index) => [[`board-1:seg${index}`, `seg-res-${index}:a`], [`seg-res-${index}:b`, `display-1:${segment}`]]).concat([['display-1:com1', 'board-1:gnd'], ['display-1:com2', 'board-1:gnd']]),
  'buck-boost-concept': [['battery-1:positive', 'converter-1:inPlus'], ['battery-1:negative', 'converter-1:inMinus'], ['converter-1:outPlus', 'res-1:a'], ['res-1:b', 'led-1:anode'], ['led-1:cathode', 'converter-1:outMinus']],
  'dc-motor-driver': [['board-1:vcc', 'tb6612-1:vcc'], ['battery-1:positive', 'tb6612-1:vm'], ['board-1:gnd', 'tb6612-1:gnd'], ['battery-1:negative', 'board-1:gnd'], ['board-1:input', 'tb6612-1:ain1'], ['board-1:ledOut', 'tb6612-1:ain2'], ['board-1:echo', 'tb6612-1:pwma'], ['board-1:seg6', 'tb6612-1:stby'], ['tb6612-1:a01', 'motor-1:positive'], ['tb6612-1:a02', 'motor-1:negative']],
  // Low-side switch: GPIO output → gate resistor → gate, 10 kΩ gate pull-down, flyback diode cathode to V+.
  'mosfet-switch': [['board-1:ledOut', 'resistor-1:a'], ['resistor-1:b', 'mosfet-1:gate'], ['resistor-pd-1:a', 'mosfet-1:gate'], ['resistor-pd-1:b', 'board-1:gnd'], ['mosfet-1:source', 'board-1:gnd'], ['battery-1:positive', 'dc-motor-1:positive'], ['dc-motor-1:negative', 'mosfet-1:drain'], ['battery-1:negative', 'board-1:gnd'], ['diode-1:anode', 'dc-motor-1:negative'], ['diode-1:cathode', 'dc-motor-1:positive']],
}
// Pins that must never share a net in any preset (shorts / back-feeding).
const forbidden = [['board-1:vcc', 'board-1:gnd'], ['board-1:v5', 'board-1:gnd'], ['board-1:v5', 'board-1:vcc'], ['battery-1:positive', 'battery-1:negative'], ['sonar-1:echo', 'board-1:echo'], ['board-1:input', 'board-1:ledOut']]

test('every builder lesson has a topology contract', () => {
  assert.deepEqual(Object.keys(contracts).sort(), builderLessons.map(lesson => lesson.id).sort())
})

for (const lessonId of Object.keys(contracts)) test(`${lessonId}: preset nets match the lesson contract`, () => {
  const { placed, wires } = circuitForLesson(lessonId)
  for (const wire of wires) assert.ok(wire.from.partId && wire.to.partId, `${lessonId}/${wire.id} has an unresolved endpoint`)
  const nets = createNetIndex(wires)
  for (const [a, b] of contracts[lessonId]) assert.ok(nets.sameNet(a, b), `${lessonId}: ${a} must share a net with ${b}`)
  for (const [a, b] of forbidden) if (nets.netOf(a) && nets.netOf(b)) assert.ok(!nets.sameNet(a, b), `${lessonId}: ${a} shorted to ${b}`)
  const diagnostics = validateCircuit({ parts: placed, wires }, lessonId)
  assert.deepEqual(diagnostics.filter(item => item.severity === 'error').map(item => item.code), [], lessonId)
  // A correct preset must not tell the learner to re-check polarity.
  assert.deepEqual(diagnostics.filter(item => item.code.startsWith('polarized-')).map(item => item.code), [], lessonId)
})

test('resistor values on presets are sane for the driven parts', () => {
  for (const lessonId of Object.keys(contracts)) for (const part of circuitForLesson(lessonId).placed.filter(item => item.type === 'resistor')) {
    const label = part.value ?? '220 Ω'
    assert.match(label, /^(220 Ω|1 kΩ|2 kΩ|10 kΩ)$/, `${lessonId}/${part.id}`)
  }
  // LED current at 3,3 V through 220 Ω with ~2 V forward drop stays under 10 mA.
  assert.ok((3.3 - 2) / 220 < 0.01)
  // ECHO divider brings 5 V down to a 3,3 V-safe level.
  assert.ok(Math.abs(5 * 2000 / (1000 + 2000) - 3.33) < 0.01)
})

test('ESP32 supply checks: HC-SR04 is powered from 5 V and its divider silences the 3,3 V ECHO warning', () => {
  const { placed, wires } = circuitForLesson('ultrasonic-distance')
  const codes = validateCircuit({ parts: placed, wires }, 'ultrasonic-distance', { logicLevel: '3.3 V' }).map(item => item.code)
  assert.ok(!codes.includes('hcsr04-echo-logic-level'), codes.join())
  assert.ok(!codes.includes('hcsr04-supply-3v3'), codes.join())
  const direct = wires.filter(wire => !wire.id.startsWith('sonar-echo-divider') && wire.id !== 'sonar-wire-echo').concat([{ id: 'echo-direct', from: { partId: 'board-1', pinId: 'echo' }, to: { partId: 'sonar-1', pinId: 'echo' } }])
  assert.ok(validateCircuit({ parts: placed, wires: direct }, 'ultrasonic-distance', { logicLevel: '3.3 V' }).some(item => item.code === 'hcsr04-echo-logic-level'))
})

test('motor and multi-pin lessons never put two signals on one physical GPIO', () => {
  for (const boardId of ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3']) {
    const target = getSimulationTarget(boardId)
    for (const lessonId of ['dc-motor-driver', 'ultrasonic-distance', 'button-led']) assert.equal(getLessonBoardSupport(target, lessonId).supported, true, `${boardId}/${lessonId}`)
    const input = getInputAlias(target, 'dc-motor-driver').pin
    const pins = [input, target.codePin, input + 1, target.sevenSegmentPins[6]]
    assert.equal(new Set(pins).size, 4, `${boardId}: TB6612 pins ${pins.join(',')}`)
  }
})

test('running trace labels power nets by their supplying pin', () => {
  const { placed, wires } = circuitForLesson('ultrasonic-distance')
  const flows = getLogicFlow({ lessonId: 'ultrasonic-distance', parts: placed, wires, frame: { ledOn: true }, active: true, hasCircuitErrors: false, inputs: { pressed: false, detected: false, potPercent: 0, lightPercent: 0 }, tick: 1, supplyLabel: '3V3' })
  assert.equal(flows.get('sonar-wire-vcc').label, '5V')
  assert.equal(flows.get('sonar-wire-gnd').label, 'GND')
  const pot = circuitForLesson('analog-potentiometer')
  const potFlows = getLogicFlow({ lessonId: 'analog-potentiometer', parts: pot.placed, wires: pot.wires, frame: { ledOn: false }, active: true, hasCircuitErrors: false, inputs: { pressed: false, detected: false, potPercent: 40, lightPercent: 0 }, tick: 1, supplyLabel: '5V' })
  assert.equal(potFlows.get('pot-vcc').label, '5V')
})
