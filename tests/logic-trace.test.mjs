import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let trace
let logicFlow
let circuitForLesson
let validateCircuit
let getBoardCapability
let builderLessons

const onInputs = { pressed: true, detected: true, potPercent: 80, lightPercent: 80 }
const state = (lessonId, circuit, overrides = {}) => ({ lessonId, parts: circuit.placed, wires: circuit.wires, frame: { ledOn: true, segments: [1, 1, 1, 1, 1, 1, 0] }, active: true, hasCircuitErrors: false, inputs: onInputs, tick: 1, ...overrides })
const rename = (circuit) => {
  const id = (value) => `x-${value}-new`
  const end = (endpoint) => ({ partId: id(endpoint.partId), pinId: endpoint.pinId })
  return { placed: circuit.placed.map((part) => ({ ...part, id: id(part.id) })), wires: circuit.wires.map((wire) => ({ ...wire, from: end(wire.from), to: end(wire.to) })) }
}
const flip = (circuit) => ({ ...circuit, wires: circuit.wires.map((wire) => ({ ...wire, from: wire.to, to: wire.from })) })
const sorted = (set) => [...set].sort()

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const logicTrace = await server.ssrLoadModule('/src/lib/logicTrace.ts')
  trace = logicTrace.getLogicTraceWireIds
  logicFlow = logicTrace.getLogicFlow
  circuitForLesson = (await server.ssrLoadModule('/src/pages/CircuitBuilderPage.tsx')).circuitForLesson
  validateCircuit = (await server.ssrLoadModule('/src/lib/circuitValidation.ts')).validateCircuit
  getBoardCapability = (await server.ssrLoadModule('/src/data/boardCapabilityRegistry.ts')).getBoardCapability
  builderLessons = (await server.ssrLoadModule('/src/data/builderLessons.ts')).builderLessons
})

after(async () => { await server?.close() })

test('every lesson traces at least one wire in its active state', () => {
  for (const { id } of builderLessons) assert.ok(trace(state(id, circuitForLesson(id))).size > 0, id)
})

test('trace does not depend on preset part ids', () => {
  for (const { id } of builderLessons) for (const tick of [1, 2, 3]) {
    const circuit = circuitForLesson(id)
    assert.deepEqual(sorted(trace(state(id, rename(circuit), { tick }))), sorted(trace(state(id, circuit, { tick }))), `${id} stage ${tick}`)
  }
})

test('trace does not depend on wire direction or rotation', () => {
  for (const { id } of builderLessons) {
    const circuit = circuitForLesson(id)
    const rotated = { ...circuit, placed: circuit.placed.map((part) => ({ ...part, rotation: 90 })) }
    assert.deepEqual(sorted(trace(state(id, flip(circuit)))), sorted(trace(state(id, circuit))), id)
    assert.deepEqual(sorted(trace(state(id, rotated))), sorted(trace(state(id, circuit))), id)
  }
})

test('renamed presets stay valid on each reference board, so trace can run', () => {
  for (const boardId of ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3']) {
    const capability = getBoardCapability(boardId)
    for (const { id } of builderLessons) {
      const circuit = rename(circuitForLesson(id))
      const errors = validateCircuit({ parts: circuit.placed, wires: circuit.wires }, id, capability).filter((item) => item.severity === 'error')
      assert.deepEqual(errors.map((item) => item.code), [], `${id} on ${boardId}`)
    }
  }
})

test('a replaced resistor with a new id and swapped legs is still traced', () => {
  const circuit = circuitForLesson('blink')
  const swap = { b: 'a', a: 'b' }
  const replaced = {
    placed: circuit.placed.map((part) => part.id === 'res-1' ? { ...part, id: 'resistor-99' } : part),
    wires: circuit.wires.map((wire) => {
      const end = (endpoint) => endpoint.partId === 'res-1' ? { partId: 'resistor-99', pinId: swap[endpoint.pinId] } : endpoint
      return { ...wire, from: end(wire.from), to: end(wire.to) }
    }),
  }
  assert.equal(trace(state('blink', replaced)).size, circuit.wires.length)
})

test('removing a wire from the LED path stops the LED trace', () => {
  const circuit = circuitForLesson('blink')
  for (const wire of circuit.wires) {
    const broken = { ...circuit, wires: circuit.wires.filter((item) => item.id !== wire.id) }
    assert.equal(trace(state('blink', broken)).size, 0, wire.id)
  }
})

test('a reversed LED is not traced as a working path', () => {
  const circuit = circuitForLesson('blink')
  const swap = { anode: 'cathode', cathode: 'anode' }
  const end = (endpoint) => endpoint.partId === 'led-1' ? { partId: 'led-1', pinId: swap[endpoint.pinId] } : endpoint
  const reversed = { ...circuit, wires: circuit.wires.map((wire) => ({ ...wire, from: end(wire.from), to: end(wire.to) })) }
  assert.equal(trace(state('blink', reversed)).size, 0)
})

test('a button joined through a breadboard node is traced as one net', () => {
  const circuit = circuitForLesson('button-led')
  const direct = circuit.wires.find((wire) => wire.id === 'button-wire-in')
  const bridged = { ...circuit, wires: [...circuit.wires.filter((wire) => wire !== direct), { id: 'via-a', from: direct.from, to: { partId: 'bread-1', pinId: 'rowA' } }, { id: 'via-b', from: { partId: 'bread-1', pinId: 'rowA' }, to: direct.to }] }
  const result = trace(state('button-led', bridged, { frame: { ledOn: false } }))
  assert.ok(result.has('via-a') && result.has('via-b'))
})

test('input wires light only while the input is active', () => {
  const circuit = circuitForLesson('button-led')
  const released = trace(state('button-led', circuit, { inputs: { ...onInputs, pressed: false }, frame: { ledOn: false } }))
  assert.equal(released.size, 0)
})

test('infrared trace reports LOW on detection and HIGH when clear for the selected active-low module', () => {
  const circuit = circuitForLesson('ir-alert')
  const input = (detected) => logicFlow(state('ir-alert', circuit, { inputs: { ...onInputs, detected }, frame: { ledOn: detected } }))
  const detected = input(true)
  const clear = input(false)
  assert.equal(detected.get('ir-wire-out')?.signal, 'low')
  assert.equal(detected.get('ir-wire-out')?.label, 'LOW')
  assert.equal(clear.get('ir-wire-out')?.signal, 'high')
  assert.equal(clear.get('ir-wire-out')?.label, 'HIGH')
})

test('a button wired away from the input pin is not traced', () => {
  const circuit = circuitForLesson('button-led')
  const moved = { ...circuit, wires: circuit.wires.map((wire) => wire.id === 'button-wire-in' ? { ...wire, from: { partId: 'board-1', pinId: 'vcc' } } : wire) }
  const result = trace(state('button-led', moved, { frame: { ledOn: false } }))
  assert.equal(result.size, 0)
})

test('seven-segment trace follows only the segments the frame drives', () => {
  const circuit = circuitForLesson('seven-segment-counter')
  const result = trace(state('seven-segment-counter', circuit, { frame: { ledOn: false, segments: [1, 0, 0, 0, 0, 0, 0] } }))
  assert.ok(result.has('seg-board-0') && result.has('seg-display-0'))
  assert.ok(!result.has('seg-board-1') && !result.has('seg-display-1'))
  assert.ok(result.has('seg-common-1') && result.has('seg-common-2'))
})

test('nothing is traced before a run, after an error, or without a frame', () => {
  const circuit = circuitForLesson('blink')
  assert.equal(trace(state('blink', circuit, { active: false })).size, 0)
  assert.equal(trace(state('blink', circuit, { hasCircuitErrors: true })).size, 0)
  assert.equal(trace(state('blink', circuit, { frame: null })).size, 0)
})

test('the builder page no longer matches preset ids to trace wires', () => {
  const source = readFileSync('src/pages/CircuitBuilderPage.tsx', 'utf8')
  assert.ok(!source.includes('wireMatches('))
  assert.ok(!source.includes('isLedTraceWire'))
})
