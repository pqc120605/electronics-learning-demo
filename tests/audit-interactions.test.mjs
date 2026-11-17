import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'

let server, docs, diagram, presentation, targets, gates, guide, routes, freestyle, nets
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[docs, diagram, presentation, targets, gates, guide, routes, freestyle, nets] = await Promise.all([
    '/src/data/lessonCircuitDocs.ts', '/src/lib/breadboardDiagram.ts', '/src/lib/lessonBoardPresentation.ts',
    '/src/data/simulationTargets.ts', '/src/lib/circuitGates.ts', '/src/lib/guideKnowledge.ts',
    '/src/data/productRoutes.ts', '/src/lib/freestyle/freestyleCircuit.ts', '/src/lib/circuitNetsV2.ts',
  ].map(path => server.ssrLoadModule(path)))
})
after(async () => { await server?.close() })

test('the actual ESP32 button lesson presentation renders every declared wire, not just generic geometry', () => {
  const doc = docs.getLessonCircuitDoc('button-led')
  const p = presentation.lessonBoardPresentation(targets.getSimulationTarget('esp32-devkit'), 'button-led')
  const actual = diagram.buildBreadboardDiagram(doc, p)
  assert.deepEqual(actual.diagnostics, [])
  assert.deepEqual(actual.wires.map(w => w.id).sort(), doc.wires.map(w => w.id).sort())
})

test('G6 fails closed if the displayed board has no source-backed endpoints', () => {
  const doc = docs.getLessonCircuitDoc('blink')
  const p = presentation.lessonBoardPresentation(targets.getSimulationTarget('esp32-devkit'), 'blink')
  const report = gates.evaluateCircuitGates(doc, { presentation: { ...p, pinAnchors: {} } })
  const g6 = report.gates.find(g => g.id === 'G6')
  assert.equal(g6.status, 'fail')
  assert.match(g6.diagnostics.join(' '), /tọa độ|endpoint|vị trí/)
})

test('generic SPICE capability questions containing a board family bypass only the variant guard', () => {
  for (const question of ['SPICE có chạy firmware ESP32 không', 'SPICE co chay firmware STM32 khong']) {
    const result = guide.findGuideAnswers(question)
    assert.equal(result.kind, 'matches', question)
    assert.match(result.articles.map(a => a.paragraphs.join(' ')).join(' '), /không chạy firmware MCU|SPICE giải mạch analog/)
  }
  for (const question of ['ESP32 GPIO 34 chịu 5V không', 'SPICE có xác nhận GPIO 34 của ESP32 không', 'board clone XZQ-987 pinout GPIO']) {
    assert.equal(guide.findGuideAnswers(question).kind, 'unknown', question)
  }
})

test('the robot simulation route has its own non-404 document title', () => {
  assert.match(routes.getPageTitle('/app/robot-simulation'), /robot/i)
  assert.doesNotMatch(routes.getPageTitle('/app/robot-simulation'), /Không tìm thấy/)
})

test('new motor sample has an independent ideal load supply, common return and flyback branch', () => {
  const { doc, pinMap } = freestyle.buildSampleCircuit('motor', 'esp32-devkit')
  const motor = doc.parts.find(p => p.type === 'dc-motor')
  const supply = doc.parts.find(p => p.type === 'battery')
  const diode = doc.parts.find(p => p.type === 'diode')
  assert.ok(supply, 'motor load must not be sourced from an arbitrary board VCC anchor')
  assert.ok(diode, 'the schematic must show the flyback branch even when the runtime is ideal logic')
  const index = nets.createNetIndexV2(doc)
  const net = (part, pin) => index.netOf(`${part.id}:${pin}`)?.key
  assert.equal(net(supply, 'positive'), net(motor, 'positive'))
  assert.equal(net(diode, 'cathode'), net(motor, 'positive'))
  assert.equal(net(diode, 'anode'), net(motor, 'negative'))
  assert.equal(net(supply, 'negative'), index.netOf('board:gnd')?.key)
  assert.notEqual(net(motor, 'positive'), index.netOf('board:vcc')?.key)
  for (const high of [true, false]) {
    const pins = { [pinMap.ledOut]: { mode: 'output', level: high } }
    assert.equal(freestyle.evaluateFreestyleCircuit(doc, pinMap, pins, {}).outputs.find(p => p.kind === 'motor').direction, high ? 1 : 0)
  }
})

test('motor protection disclosure follows actual draft topology and never rewrites legacy bytes', () => {
  const current = freestyle.buildSampleCircuit('motor', 'esp32-devkit').doc
  assert.deepEqual(freestyle.getMotorProtection?.(current), { independentSupply: true, commonGround: true, flyback: true })
  const legacy = structuredClone(current)
  const omitted = new Set(legacy.parts.filter(p => p.type === 'battery' || p.type === 'diode').map(p => p.id))
  legacy.parts = legacy.parts.filter(p => !omitted.has(p.id))
  legacy.wires = legacy.wires.filter(w => ![w.from, w.to].some(e => e.kind === 'pin' && omitted.has(e.partId)))
  const raw = JSON.stringify(legacy)
  assert.deepEqual(freestyle.getMotorProtection?.(legacy), { independentSupply: false, commonGround: false, flyback: false })
  assert.equal(JSON.stringify(legacy), raw)
  const reversed = structuredClone(current)
  const diode = reversed.parts.find(p => p.type === 'diode'), motor = reversed.parts.find(p => p.type === 'dc-motor'), supply = reversed.parts.find(p => p.type === 'battery')
  // Use explicit pin endpoints for the reversed-polarity fixture; the sample
  // itself uses free holes of each strip, so changing pin-only wires is a no-op.
  reversed.parts = reversed.parts.map(p => ({ ...p, mount: structuredClone(motor.mount) }))
  reversed.breadboards = []
  const pin = (partId, pinId) => ({ kind: 'pin', partId, pinId })
  reversed.wires = [
    { id: 'supply', from: pin(supply.id, 'positive'), to: pin(motor.id, 'positive') },
    { id: 'return', from: pin(supply.id, 'negative'), to: pin('board', 'gnd') },
    { id: 'wrong-anode', from: pin(diode.id, 'anode'), to: pin(motor.id, 'positive') },
    { id: 'wrong-cathode', from: pin(diode.id, 'cathode'), to: pin(motor.id, 'negative') },
  ]
  assert.equal(freestyle.getMotorProtection?.(reversed)?.flyback, false)
})

test('G6 retains the R8 bend warning for the actual displayed routes', () => {
  const doc = docs.getLessonCircuitDoc('button-led')
  const p = presentation.lessonBoardPresentation(targets.getSimulationTarget('esp32-devkit'), 'button-led')
  const g6 = gates.evaluateCircuitGates(doc, { presentation: p }).gates.find(g => g.id === 'G6')
  assert.equal(g6.status, 'warning')
  assert.match(g6.diagnostics.join(' '), /cảnh báo theo R8/)
})
