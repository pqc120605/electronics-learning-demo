import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getLessonCircuitDoc
let traceCircuitDocV2

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [fixtures, trace] = await Promise.all([
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/logicTraceV2.ts'),
  ])
  getLessonCircuitDoc = fixtures.getLessonCircuitDoc
  traceCircuitDocV2 = trace.traceCircuitDocV2
})

after(async () => { await server?.close() })

const run = (doc, overrides = {}) => traceCircuitDocV2({
  doc,
  lessonId: doc.lessonId,
  frame: { ledOn: true },
  active: true,
  hasCircuitErrors: false,
  inputs: { pressed: true, detected: false, potPercent: 0, lightPercent: 0 },
  tick: 1,
  ...overrides,
})

test('V2 blink traces only the actual GPIO-resistor-LED-return nets and provides educational labels', () => {
  const doc = getLessonCircuitDoc('blink')
  const result = run(doc)
  assert.equal(result.supported, true)
  assert.deepEqual([...result.wireIds].sort(), doc.wires.map(wire => wire.id).sort())
  assert.equal(result.flows.get('w-gpio-to-resistor')?.label, 'HIGH')
  assert.equal(result.flows.get('w-gpio-to-resistor')?.direction, 'none')
  assert.deepEqual([...result.activePinKeys].sort(), ['bb-1:railMinus', 'board-1:gnd', 'board-1:ledOut', 'led-1:anode', 'led-1:cathode', 'res-1:a', 'res-1:b'])
})

test('V2 blink off frame removes active highlighting and keeps the low teaching label', () => {
  const result = run(getLessonCircuitDoc('blink'), { frame: { ledOn: false } })
  assert.equal(result.wireIds.size, 0)
  assert.equal(result.activePinKeys.size, 0)
  assert.equal(result.flows.get('w-gpio-to-resistor')?.label, 'LOW')
})

test('V2 button lesson follows the declared input and only traces while the virtual input is pressed', () => {
  const doc = getLessonCircuitDoc('button-led')
  const pressed = run(doc, { frame: { ledOn: true }, inputs: { pressed: true, detected: false, potPercent: 0, lightPercent: 0 } })
  const released = run(doc, { frame: { ledOn: false }, inputs: { pressed: false, detected: false, potPercent: 0, lightPercent: 0 } })
  assert.ok(pressed.wireIds.has('w-input-to-button'))
  assert.equal(pressed.flows.get('w-input-to-button')?.label, 'LOW')
  assert.equal(released.wireIds.size, 0)
  assert.equal(released.flows.get('w-input-to-button')?.label, 'HIGH')
})

test('removing a required V2 wire prevents the LED path trace', () => {
  const doc = getLessonCircuitDoc('blink')
  doc.wires = doc.wires.filter(wire => wire.id !== 'w-resistor-to-led')
  const result = run(doc)
  assert.equal(result.wireIds.size, 0)
})

test('structural errors or inactive sessions fail closed', () => {
  const doc = getLessonCircuitDoc('blink')
  assert.equal(run(doc, { hasCircuitErrors: true }).wireIds.size, 0)
  assert.equal(run(doc, { active: false }).wireIds.size, 0)
  assert.equal(run(doc, { frame: null }).wireIds.size, 0)
})

test('V2 lessons without a registered trace contract stay explicitly unsupported', () => {
  const doc = { ...getLessonCircuitDoc('blink'), lessonId: 'analog-ldr' }
  const result = run(doc)
  assert.equal(result.supported, false)
  assert.equal(result.reason, 'Bài học này chưa hỗ trợ quan sát tín hiệu trên mạch.')
  assert.equal(result.wireIds.size, 0)
})
